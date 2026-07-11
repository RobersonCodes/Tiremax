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

describe('Vazamento cross-tenant em PUT (regressão — findUnique sem tenantId após updateMany)', () => {
  // client.controller.js já tinha a checagem de .count; product/vehicle/service/user
  // faziam updateMany (não escrevia nada em ID de outro tenant) e depois um
  // findUnique SEM tenantId — se o updateMany não casasse nenhuma linha, a resposta
  // ainda devolvia os dados completos do registro do outro tenant.
  let tenantA, tenantB, tokenAdminA, tokenAdminB;

  beforeEach(async () => {
    tenantA = await createTenant({ name: 'Tenant A' });
    tenantB = await createTenant({ name: 'Tenant B' });
    const adminA = await createUser(tenantA.id, { role: 'ADMIN', email: 'adminA@teste.com' });
    const adminB = await createUser(tenantB.id, { role: 'ADMIN', email: 'adminB@teste.com' });
    tokenAdminA = await loginAndGetToken(app, adminA.email, adminA.plainPassword);
    tokenAdminB = await loginAndGetToken(app, adminB.email, adminB.plainPassword);
  });

  it('PUT /api/vehicles/:id de outro tenant retorna 404 e não vaza a placa/cliente', async () => {
    const client = await prisma.client.create({ data: { tenantId: tenantA.id, name: 'Cliente A' } });
    const vehicle = await prisma.vehicle.create({
      data: { tenantId: tenantA.id, clientId: client.id, plate: 'SIGILO1', brand: 'Fiat', model: 'Uno', year: 2020 },
    });

    const res = await request(app)
      .put(`/api/vehicles/${vehicle.id}`)
      .set('Authorization', `Bearer ${tokenAdminB}`)
      .send({ model: 'Modificado' });

    expect(res.status).toBe(404);
    expect(JSON.stringify(res.body)).not.toContain('SIGILO1');
  });

  it('PUT /api/services/:id de outro tenant retorna 404 e não vaza o cliente vinculado', async () => {
    const client = await prisma.client.create({ data: { tenantId: tenantA.id, name: 'Cliente Sigiloso Service' } });
    const createdBy = await prisma.user.findFirst({ where: { tenantId: tenantA.id } });
    const service = await prisma.service.create({
      data: {
        tenantId: tenantA.id, number: 1, clientId: client.id, createdById: createdBy.id,
        type: 'Troca de Pneus', total: 100,
      },
    });

    const res = await request(app)
      .put(`/api/services/${service.id}`)
      .set('Authorization', `Bearer ${tokenAdminB}`)
      .send({ description: 'Modificado' });

    expect(res.status).toBe(404);
    expect(JSON.stringify(res.body)).not.toContain('Cliente Sigiloso Service');
  });

  it('PUT /api/users/:id de outro tenant retorna 404 e não vaza nome/email', async () => {
    const otherUser = await createUser(tenantA.id, { email: 'sigiloso@teste.com', name: 'Nome Sigiloso' });

    const res = await request(app)
      .put(`/api/users/${otherUser.id}`)
      .set('Authorization', `Bearer ${tokenAdminB}`)
      .send({ name: 'Modificado pelo invasor' });

    expect(res.status).toBe(404);
    expect(JSON.stringify(res.body)).not.toContain('sigiloso@teste.com');
    expect(JSON.stringify(res.body)).not.toContain('Nome Sigiloso');
  });
});

describe('Regressão — remove/updateStatus não respondem "sucesso" em recurso de outro tenant', () => {
  let tenantA, tokenAdminA, tokenAdminB;

  beforeEach(async () => {
    tenantA = await createTenant({ name: 'Tenant A' });
    const tenantB = await createTenant({ name: 'Tenant B' });
    const adminA = await createUser(tenantA.id, { role: 'ADMIN', email: 'adminA@teste.com' });
    const adminB = await createUser(tenantB.id, { role: 'ADMIN', email: 'adminB@teste.com' });
    tokenAdminA = await loginAndGetToken(app, adminA.email, adminA.plainPassword);
    tokenAdminB = await loginAndGetToken(app, adminB.email, adminB.plainPassword);
  });

  it('PATCH /api/services/:id/status em OS de outro tenant retorna 404 e não muda o status', async () => {
    const client = await prisma.client.create({ data: { tenantId: tenantA.id, name: 'Cliente A' } });
    const createdBy = await prisma.user.findFirst({ where: { tenantId: tenantA.id } });
    const service = await prisma.service.create({
      data: { tenantId: tenantA.id, number: 1, clientId: client.id, createdById: createdBy.id, type: 'Troca de Pneus', total: 100, status: 'OPEN' },
    });

    const res = await request(app)
      .patch(`/api/services/${service.id}/status`)
      .set('Authorization', `Bearer ${tokenAdminB}`)
      .send({ status: 'COMPLETED' });
    expect(res.status).toBe(404);

    const stillOpen = await prisma.service.findUnique({ where: { id: service.id } });
    expect(stillOpen.status).toBe('OPEN');
  });

  it('DELETE /api/services/:id de outro tenant retorna 404 e não cancela a OS', async () => {
    const client = await prisma.client.create({ data: { tenantId: tenantA.id, name: 'Cliente A' } });
    const createdBy = await prisma.user.findFirst({ where: { tenantId: tenantA.id } });
    const service = await prisma.service.create({
      data: { tenantId: tenantA.id, number: 1, clientId: client.id, createdById: createdBy.id, type: 'Troca de Pneus', total: 100, status: 'OPEN' },
    });

    const res = await request(app).delete(`/api/services/${service.id}`).set('Authorization', `Bearer ${tokenAdminB}`);
    expect(res.status).toBe(404);

    const stillOpen = await prisma.service.findUnique({ where: { id: service.id } });
    expect(stillOpen.status).toBe('OPEN');
  });

  it('DELETE /api/users/:id de outro tenant retorna 404 e não desativa o usuário', async () => {
    const otherUser = await createUser(tenantA.id, { email: 'protegido@teste.com' });

    const res = await request(app).delete(`/api/users/${otherUser.id}`).set('Authorization', `Bearer ${tokenAdminB}`);
    expect(res.status).toBe(404);

    const stillActive = await prisma.user.findUnique({ where: { id: otherUser.id } });
    expect(stillActive.active).toBe(true);
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
