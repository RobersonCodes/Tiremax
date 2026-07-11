const express = require('express');
const request = require('supertest');
const app = require('../src/app');
const prisma = require('../src/config/database');
const { runWithTenant } = require('../src/config/tenantContext');
const { authenticate } = require('../src/middlewares/auth');
const tenantMiddleware = require('../src/middlewares/tenant');
const { cleanDatabase } = require('./helpers/cleanDb');
const { createTenant, createUser, loginAndGetToken } = require('./helpers/factories');
const { createProduct } = require('./helpers/productFactory');

// App mínima com o middleware de tenant DE VERDADE (não um mock) na frente de
// uma rota que reproduz de propósito o bug de "esqueceu o tenantId no where"
// — prova que é o middleware real (não só uma chamada manual em teste) que
// propaga o contexto até o Prisma.
function buildAppWithForgottenScopeRoute() {
  const testApp = express();
  testApp.use(express.json());
  testApp.get('/test/product/:id', authenticate, tenantMiddleware, async (req, res, next) => {
    try {
      const product = await prisma.product.findUnique({ where: { id: req.params.id } });
      res.json(product);
    } catch (err) { next(err); }
  });
  return testApp;
}

beforeEach(async () => {
  await cleanDatabase();
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe('Prisma Client Extension — isolamento estrutural de tenant', () => {
  it('via middleware real do Express: rota que "esqueceu" o tenantId no where continua isolada', async () => {
    const tenantA = await createTenant({ name: 'Tenant A' });
    const tenantB = await createTenant({ name: 'Tenant B' });
    const userA = await createUser(tenantA.id, { role: 'ADMIN', email: 'a@teste.com' });
    const userB = await createUser(tenantB.id, { role: 'ADMIN', email: 'b@teste.com' });
    const tokenA = await loginAndGetToken(app, userA.email, userA.plainPassword);
    const tokenB = await loginAndGetToken(app, userB.email, userB.plainPassword);
    const productA = await createProduct(tenantA.id, { name: 'Produto A' });

    const testApp = buildAppWithForgottenScopeRoute();

    const asB = await request(testApp).get(`/test/product/${productA.id}`).set('Authorization', `Bearer ${tokenB}`);
    expect(asB.body).toBeNull();

    const asA = await request(testApp).get(`/test/product/${productA.id}`).set('Authorization', `Bearer ${tokenA}`);
    expect(asA.body.name).toBe('Produto A');
  });

  it('uma query sem tenantId no where (como se um dev tivesse esquecido) ainda é barrada pelo contexto', async () => {
    const tenantA = await createTenant({ name: 'Tenant A' });
    const tenantB = await createTenant({ name: 'Tenant B' });
    const productA = await createProduct(tenantA.id, { name: 'Produto A' });

    // Simula exatamente o bug de client.controller.js#findOne antes de existir
    // qualquer proteção: um findUnique com só o id, sem tenantId no where.
    // Rodando "como" uma requisição do tenant B, o extension deveria barrar.
    // (callback precisa ser async e dar o await por dentro — é assim que o
    // Express de fato invoca os controllers dentro do runWithTenant do
    // middleware; um callback que só retorna a Promise sem await interno
    // escapa do contexto do AsyncLocalStorage.)
    const resultAsB = await runWithTenant(tenantB.id, async () => {
      return await prisma.product.findUnique({ where: { id: productA.id } });
    });
    expect(resultAsB).toBeNull();

    const resultAsA = await runWithTenant(tenantA.id, async () => {
      return await prisma.product.findUnique({ where: { id: productA.id } });
    });
    expect(resultAsA).not.toBeNull();
    expect(resultAsA.name).toBe('Produto A');
  });

  it('um updateMany sem tenantId no where não consegue mais alterar registro de outro tenant', async () => {
    const tenantA = await createTenant({ name: 'Tenant A' });
    const tenantB = await createTenant({ name: 'Tenant B' });
    const productA = await createProduct(tenantA.id, { name: 'Produto A' });

    const result = await runWithTenant(tenantB.id, async () => {
      return await prisma.product.updateMany({ where: { id: productA.id }, data: { name: 'Hackeado' } });
    });
    expect(result.count).toBe(0);

    const stillIntact = await prisma.product.findUnique({ where: { id: productA.id } });
    expect(stillIntact.name).toBe('Produto A');
  });

  it('fora de qualquer contexto de tenant (fixtures de teste, scripts), queries continuam sem restrição', async () => {
    const tenantA = await createTenant({ name: 'Tenant A' });
    const productA = await createProduct(tenantA.id, { name: 'Produto A' });

    // Sem runWithTenant — é assim que os testes/factories já usam prisma direto.
    const result = await prisma.product.findUnique({ where: { id: productA.id } });
    expect(result).not.toBeNull();
  });

  it('mass-assignment: tenantId no corpo da requisição nunca move o registro pra outro tenant', async () => {
    const tenantA = await createTenant({ name: 'Tenant A' });
    const tenantB = await createTenant({ name: 'Tenant B' });
    const adminA = await createUser(tenantA.id, { role: 'ADMIN', email: 'adminA@teste.com' });
    const tokenAdminA = await loginAndGetToken(app, adminA.email, adminA.plainPassword);
    const client = await prisma.client.create({ data: { tenantId: tenantA.id, name: 'Cliente A' } });

    const res = await request(app)
      .put(`/api/clients/${client.id}`)
      .set('Authorization', `Bearer ${tokenAdminA}`)
      .send({ name: 'Cliente Renomeado', tenantId: tenantB.id });

    expect(res.status).toBe(200);

    const stored = await prisma.client.findUnique({ where: { id: client.id } });
    expect(stored.tenantId).toBe(tenantA.id);
    expect(stored.name).toBe('Cliente Renomeado');
  });

  it('create com tenantId forjado no corpo ainda cai no tenant de quem autenticou', async () => {
    const tenantA = await createTenant({ name: 'Tenant A' });
    const tenantB = await createTenant({ name: 'Tenant B' });
    const adminA = await createUser(tenantA.id, { role: 'ADMIN', email: 'adminA2@teste.com' });
    const tokenAdminA = await loginAndGetToken(app, adminA.email, adminA.plainPassword);

    const res = await request(app)
      .post('/api/clients')
      .set('Authorization', `Bearer ${tokenAdminA}`)
      .send({ name: 'Cliente Forjado', tenantId: tenantB.id });

    expect(res.status).toBe(201);
    const created = await prisma.client.findUnique({ where: { id: res.body.id } });
    expect(created.tenantId).toBe(tenantA.id);
  });

  it('rotas sem tenantMiddleware (login, register, SUPER_ADMIN) continuam funcionando sem contexto', async () => {
    const registerRes = await request(app).post('/api/register').send({
      name: 'Nova Borracharia', adminEmail: 'novo@teste.com', adminPassword: 'senha123456',
    });
    expect(registerRes.status).toBe(201);

    const loginRes = await request(app).post('/api/auth/login').send({ email: 'novo@teste.com', password: 'senha123456' });
    expect(loginRes.status).toBe(200);
  });
});
