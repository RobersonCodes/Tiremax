const fs = require('fs');
const path = require('path');
const request = require('supertest');
const app = require('../src/app');
const prisma = require('../src/config/database');
const { cleanDatabase } = require('./helpers/cleanDb');
const { createTenant, createUser, loginAndGetToken } = require('./helpers/factories');

const UPLOADS_DIR = path.join(__dirname, '..', 'uploads');
const uploadedFiles = [];

beforeEach(async () => {
  await cleanDatabase();
});

afterEach(() => {
  // Multer grava de verdade em disco — limpa o que os testes de upload criaram.
  while (uploadedFiles.length) {
    const file = uploadedFiles.pop();
    fs.rmSync(path.join(UPLOADS_DIR, file), { force: true });
  }
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

  it('GET não exige ADMIN — EMPLOYEE também consegue ler', async () => {
    const res = await request(app).get('/api/settings').set('Authorization', `Bearer ${tokenEmployeeA}`);
    expect(res.status).toBe(200);
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

  it('PUT atualiza os campos fiscais, convertendo aliquotaIss pra número', async () => {
    const res = await request(app)
      .put('/api/settings')
      .set('Authorization', `Bearer ${tokenAdminA}`)
      .send({
        cnpj: '11222333000181',
        regimeTributario: 'SIMPLES_NACIONAL',
        inscricaoMunicipal: '12345',
        itemListaServico: '14.01',
        cnaeCode: '4520-0/01',
        aliquotaIss: '5.5',
        fiscalEnvironment: 'producao',
        fiscalEnabled: true,
      });

    expect(res.status).toBe(200);
    expect(res.body.aliquotaIss).toBe(5.5);
    expect(res.body.regimeTributario).toBe('SIMPLES_NACIONAL');
    expect(res.body.fiscalEnabled).toBe(true);
  });

  it('PUT com aliquotaIss vazio não quebra (fica undefined, não NaN)', async () => {
    const res = await request(app)
      .put('/api/settings')
      .set('Authorization', `Bearer ${tokenAdminA}`)
      .send({ aliquotaIss: '' });

    expect(res.status).toBe(200);
    expect(res.body.aliquotaIss).not.toBeNaN();
  });

  it('PUT ignora tentativa de alterar plan/status por essa rota (fora do whitelist)', async () => {
    const res = await request(app)
      .put('/api/settings')
      .set('Authorization', `Bearer ${tokenAdminA}`)
      .send({ name: 'Tentativa', plan: 'PRO', status: 'SUSPENDED' });

    expect(res.status).toBe(200);
    expect(res.body.name).toBe('Tentativa');

    const stored = await prisma.tenant.findUnique({ where: { id: tenantA.id } });
    expect(stored.plan).toBe(tenantA.plan);
    expect(stored.status).toBe('ACTIVE');
  });

  it('POST /logo com arquivo salva e retorna a URL, persistindo no tenant', async () => {
    const res = await request(app)
      .post('/api/settings/logo')
      .set('Authorization', `Bearer ${tokenAdminA}`)
      .attach('logo', Buffer.from('fake-image-bytes'), 'logo.png');

    expect(res.status).toBe(200);
    expect(res.body.logo).toMatch(/^\/uploads\/logo-.+\.png$/);
    uploadedFiles.push(path.basename(res.body.logo));

    const updated = await prisma.tenant.findUnique({ where: { id: tenantA.id } });
    expect(updated.logo).toBe(res.body.logo);
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
