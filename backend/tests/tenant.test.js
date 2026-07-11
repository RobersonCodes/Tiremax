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

describe('POST /api/register (cadastro público de tenant)', () => {
  it('cria o tenant e o usuário admin, e permite login com as credenciais retornadas', async () => {
    const res = await request(app).post('/api/register').send({
      name: 'Borracharia Nova',
      adminName: 'Dono',
      adminEmail: 'dono@nova.com',
      adminPassword: 'senha123456',
    });

    expect(res.status).toBe(201);
    expect(res.body.tenant.name).toBe('Borracharia Nova');
    expect(res.body.tenant.plan).toBe('TRIAL');
    expect(res.body.tenant.trialEndsAt).not.toBeNull();

    const login = await request(app).post('/api/auth/login').send({ email: 'dono@nova.com', password: 'senha123456' });
    expect(login.status).toBe(200);
    expect(login.body.user.role).toBe('ADMIN');
  });

  it('gera slugs diferentes para tenants com o mesmo nome', async () => {
    const res1 = await request(app).post('/api/register').send({
      name: 'Borracharia Duplicada', adminEmail: 'dono1@teste.com', adminPassword: 'senha123456',
    });
    const res2 = await request(app).post('/api/register').send({
      name: 'Borracharia Duplicada', adminEmail: 'dono2@teste.com', adminPassword: 'senha123456',
    });

    expect(res1.status).toBe(201);
    expect(res2.status).toBe(201);
    expect(res1.body.tenant.slug).not.toBe(res2.body.tenant.slug);
  });

  it('rejeita cadastro sem os campos obrigatórios', async () => {
    const res = await request(app).post('/api/register').send({ name: 'Sem Admin' });
    expect(res.status).toBe(400);
  });
});

describe('Administração de tenants (SUPER_ADMIN)', () => {
  let tenantA, tokenSuperAdmin, tokenAdminA;

  beforeEach(async () => {
    tenantA = await createTenant({ name: 'Tenant A' });
    const platformTenant = await createTenant({ name: 'Plataforma' });

    const superAdmin = await createUser(platformTenant.id, { role: 'SUPER_ADMIN', email: 'super@teste.com' });
    const adminA = await createUser(tenantA.id, { role: 'ADMIN', email: 'adminA@teste.com' });

    tokenSuperAdmin = await loginAndGetToken(app, superAdmin.email, superAdmin.plainPassword);
    tokenAdminA = await loginAndGetToken(app, adminA.email, adminA.plainPassword);
  });

  it('ADMIN comum não pode listar tenants', async () => {
    const res = await request(app).get('/api/tenants').set('Authorization', `Bearer ${tokenAdminA}`);
    expect(res.status).toBe(403);
  });

  it('SUPER_ADMIN lista todos os tenants, de todos os tenants', async () => {
    const res = await request(app).get('/api/tenants').set('Authorization', `Bearer ${tokenSuperAdmin}`);
    expect(res.status).toBe(200);
    expect(res.body.find(t => t.id === tenantA.id)).toBeDefined();
  });

  it('SUPER_ADMIN suspende um tenant, e usuários dele deixam de conseguir logar', async () => {
    const suspend = await request(app)
      .put(`/api/tenants/${tenantA.id}/status`)
      .set('Authorization', `Bearer ${tokenSuperAdmin}`)
      .send({ status: 'SUSPENDED' });
    expect(suspend.status).toBe(200);

    const login = await request(app).post('/api/auth/login').send({ email: 'adminA@teste.com', password: 'senha123' });
    expect(login.status).toBe(403);
  });

  it('SUPER_ADMIN troca o plano de um tenant', async () => {
    const res = await request(app)
      .put(`/api/tenants/${tenantA.id}/plan`)
      .set('Authorization', `Bearer ${tokenSuperAdmin}`)
      .send({ plan: 'PRO' });

    expect(res.status).toBe(200);
    expect(res.body.plan).toBe('PRO');
    expect(res.body.trialEndsAt).toBeNull();
  });
});
