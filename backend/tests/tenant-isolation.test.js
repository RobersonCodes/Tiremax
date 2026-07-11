const request = require('supertest');
const app = require('../src/app');
const prisma = require('../src/config/database');
const { cleanDatabase } = require('./helpers/cleanDb');
const { createTenant, createUser, loginAndGetToken } = require('./helpers/factories');

beforeEach(async () => {
  await cleanDatabase();
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe('Isolamento de tenant', () => {
  let tenantA, tenantB, tokenA, tokenB;

  beforeEach(async () => {
    tenantA = await createTenant({ name: 'Borracharia A' });
    tenantB = await createTenant({ name: 'Borracharia B' });
    const userA = await createUser(tenantA.id, { email: 'a@teste.com' });
    const userB = await createUser(tenantB.id, { email: 'b@teste.com' });
    tokenA = await loginAndGetToken(app, userA.email, userA.plainPassword);
    tokenB = await loginAndGetToken(app, userB.email, userB.plainPassword);
  });

  it('cliente criado pelo tenant A não é visível nem acessível pelo tenant B', async () => {
    const createRes = await request(app)
      .post('/api/clients')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ name: 'Cliente Sigiloso' });
    expect(createRes.status).toBe(201);
    const clientId = createRes.body.id;

    const getAsB = await request(app).get(`/api/clients/${clientId}`).set('Authorization', `Bearer ${tokenB}`);
    expect(getAsB.status).toBe(404);

    const listAsB = await request(app).get('/api/clients').set('Authorization', `Bearer ${tokenB}`);
    expect(listAsB.body.data.find(c => c.id === clientId)).toBeUndefined();

    const getAsA = await request(app).get(`/api/clients/${clientId}`).set('Authorization', `Bearer ${tokenA}`);
    expect(getAsA.status).toBe(200);
  });

  it('tenant B não consegue editar nem desativar cliente do tenant A', async () => {
    const createRes = await request(app)
      .post('/api/clients')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ name: 'Cliente A' });
    const clientId = createRes.body.id;

    const updateAsB = await request(app)
      .put(`/api/clients/${clientId}`)
      .set('Authorization', `Bearer ${tokenB}`)
      .send({ name: 'Hackeado' });
    expect(updateAsB.status).toBe(404);

    const removeAsB = await request(app)
      .delete(`/api/clients/${clientId}`)
      .set('Authorization', `Bearer ${tokenB}`);
    expect(removeAsB.status).toBe(404);

    const stillIntact = await prisma.client.findUnique({ where: { id: clientId } });
    expect(stillIntact.name).toBe('Cliente A');
    expect(stillIntact.active).toBe(true);
  });

  it('nota fiscal do tenant A não é acessível pelo tenant B', async () => {
    const client = await prisma.client.create({ data: { tenantId: tenantA.id, name: 'Cliente A' } });
    const invoice = await prisma.invoice.create({
      data: { tenantId: tenantA.id, clientId: client.id, type: 'NFCE', amount: 150, status: 'DRAFT' },
    });

    const getAsB = await request(app).get(`/api/invoices/${invoice.id}`).set('Authorization', `Bearer ${tokenB}`);
    expect(getAsB.status).toBe(404);

    const getAsA = await request(app).get(`/api/invoices/${invoice.id}`).set('Authorization', `Bearer ${tokenA}`);
    expect(getAsA.status).toBe(200);
  });

  it('a lista de notas fiscais do tenant B nunca inclui notas do tenant A', async () => {
    const client = await prisma.client.create({ data: { tenantId: tenantA.id, name: 'Cliente A' } });
    const invoice = await prisma.invoice.create({
      data: { tenantId: tenantA.id, clientId: client.id, type: 'NFCE', amount: 200, status: 'DRAFT' },
    });

    const listAsB = await request(app).get('/api/invoices').set('Authorization', `Bearer ${tokenB}`);
    const ids = (listAsB.body.data || listAsB.body).map(i => i.id);
    expect(ids).not.toContain(invoice.id);
  });
});

describe('Autorização nas rotas de nota fiscal (regressão do authorize() removido)', () => {
  it.each([
    ['post', '/api/invoices/from-sale/inexistente'],
    ['post', '/api/invoices/from-service/inexistente'],
    ['post', '/api/invoices/issue/inexistente'],
    ['post', '/api/invoices/cancel/inexistente'],
  ])('%s %s bloqueia usuário EMPLOYEE com 403', async (method, url) => {
    const tenant = await createTenant();
    const employee = await createUser(tenant.id, { role: 'EMPLOYEE', email: 'funcionario@teste.com' });
    const token = await loginAndGetToken(app, employee.email, employee.plainPassword);

    const res = await request(app)[method](url).set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(403);
  });

  it('usuário ADMIN passa pela checagem de permissão (não recebe 403)', async () => {
    const tenant = await createTenant();
    const admin = await createUser(tenant.id, { role: 'ADMIN', email: 'admin@teste.com' });
    const token = await loginAndGetToken(app, admin.email, admin.plainPassword);

    const res = await request(app).post('/api/invoices/issue/inexistente').set('Authorization', `Bearer ${token}`);
    expect(res.status).not.toBe(403);
  });

  it('sem token nenhuma rota de invoice responde (401, antes mesmo do authorize)', async () => {
    const res = await request(app).post('/api/invoices/issue/inexistente');
    expect(res.status).toBe(401);
  });
});
