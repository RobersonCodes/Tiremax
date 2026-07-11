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

describe('Configurações do tenant', () => {
  let tenantA, tenantB, tokenAdminA, tokenEmployeeA, tokenAdminB;

  beforeEach(async () => {
    tenantA = await createTenant({ name: 'Tenant A' });
    tenantB = await createTenant({ name: 'Tenant B' });

    const adminA = await createUser(tenantA.id, { role: 'ADMIN', email: 'adminA@teste.com' });
    const employeeA = await createUser(tenantA.id, { role: 'EMPLOYEE', email: 'empA@teste.com' });
    const adminB = await createUser(tenantB.id, { role: 'ADMIN', email: 'adminB@teste.com' });

    tokenAdminA = await loginAndGetToken(app, adminA.email, adminA.plainPassword);
    tokenEmployeeA = await loginAndGetToken(app, employeeA.email, employeeA.plainPassword);
    tokenAdminB = await loginAndGetToken(app, adminB.email, adminB.plainPassword);
  });

  it('GET retorna as configurações do próprio tenant, nunca do outro', async () => {
    const res = await request(app).get('/api/settings').set('Authorization', `Bearer ${tokenAdminA}`);
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(tenantA.id);
    expect(res.body.id).not.toBe(tenantB.id);
  });

  it('PUT exige ADMIN — EMPLOYEE recebe 403', async () => {
    const res = await request(app)
      .put('/api/settings')
      .set('Authorization', `Bearer ${tokenEmployeeA}`)
      .send({ name: 'Novo Nome' });
    expect(res.status).toBe(403);
  });

  it('PUT atualiza apenas o próprio tenant', async () => {
    const res = await request(app)
      .put('/api/settings')
      .set('Authorization', `Bearer ${tokenAdminA}`)
      .send({ name: 'Borracharia Renovada' });

    expect(res.status).toBe(200);
    expect(res.body.name).toBe('Borracharia Renovada');

    const otherTenant = await prisma.tenant.findUnique({ where: { id: tenantB.id } });
    expect(otherTenant.name).toBe('Tenant B');
  });

  it('POST /logo exige arquivo', async () => {
    const res = await request(app)
      .post('/api/settings/logo')
      .set('Authorization', `Bearer ${tokenAdminA}`);
    expect(res.status).toBe(400);
  });

  it('POST /logo exige ADMIN', async () => {
    const res = await request(app)
      .post('/api/settings/logo')
      .set('Authorization', `Bearer ${tokenEmployeeA}`);
    expect(res.status).toBe(403);
  });
});
