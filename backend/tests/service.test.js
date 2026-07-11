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

describe('Ordens de serviço', () => {
  let tenantA, tenantB, tokenAdminA, tokenAdminB, clientA;

  beforeEach(async () => {
    tenantA = await createTenant({ name: 'Tenant A' });
    tenantB = await createTenant({ name: 'Tenant B' });

    const adminA = await createUser(tenantA.id, { role: 'ADMIN', email: 'adminA@teste.com' });
    const adminB = await createUser(tenantB.id, { role: 'ADMIN', email: 'adminB@teste.com' });
    tokenAdminA = await loginAndGetToken(app, adminA.email, adminA.plainPassword);
    tokenAdminB = await loginAndGetToken(app, adminB.email, adminB.plainPassword);

    clientA = await prisma.client.create({ data: { tenantId: tenantA.id, name: 'Cliente A' } });
  });

  describe('POST /api/services', () => {
    it('cria uma OS vinculada ao tenant e ao usuário que criou', async () => {
      const res = await request(app)
        .post('/api/services')
        .set('Authorization', `Bearer ${tokenAdminA}`)
        .send({ clientId: clientA.id, type: 'Troca de Pneus', laborCost: 50, total: 50 });

      expect(res.status).toBe(201);
      const created = await prisma.service.findUnique({ where: { id: res.body.id } });
      expect(created.tenantId).toBe(tenantA.id);
      expect(created.status).toBe('OPEN');
    });

    it('numeração de OS é sequencial por tenant, não global', async () => {
      const clientB = await prisma.client.create({ data: { tenantId: tenantB.id, name: 'Cliente B' } });

      const osA1 = await request(app).post('/api/services').set('Authorization', `Bearer ${tokenAdminA}`)
        .send({ clientId: clientA.id, type: 'Troca de Pneus', total: 50 });
      const osB1 = await request(app).post('/api/services').set('Authorization', `Bearer ${tokenAdminB}`)
        .send({ clientId: clientB.id, type: 'Alinhamento', total: 80 });
      const osA2 = await request(app).post('/api/services').set('Authorization', `Bearer ${tokenAdminA}`)
        .send({ clientId: clientA.id, type: 'Balanceamento', total: 40 });

      expect(osA1.body.number).toBe(1);
      expect(osB1.body.number).toBe(1);
      expect(osA2.body.number).toBe(2);
    });

    it('cria a OS com itens vinculados', async () => {
      const res = await request(app)
        .post('/api/services')
        .set('Authorization', `Bearer ${tokenAdminA}`)
        .send({
          clientId: clientA.id, type: 'Troca de Pneus', total: 150,
          items: [{ description: 'Pneu 175/70 R13', quantity: 4, unitPrice: 30, total: 120 }],
        });

      expect(res.status).toBe(201);
      expect(res.body.items).toHaveLength(1);
      expect(res.body.items[0].description).toBe('Pneu 175/70 R13');
    });
  });

  describe('Isolamento de tenant', () => {
    it('OS não aparece na listagem nem é acessível pelo outro tenant', async () => {
      const createdBy = await prisma.user.findFirst({ where: { tenantId: tenantA.id } });
      const service = await prisma.service.create({
        data: { tenantId: tenantA.id, number: 1, clientId: clientA.id, createdById: createdBy.id, type: 'Troca de Pneus', total: 100 },
      });

      const listAsB = await request(app).get('/api/services').set('Authorization', `Bearer ${tokenAdminB}`);
      expect(listAsB.body.data.find(s => s.id === service.id)).toBeUndefined();

      const getAsB = await request(app).get(`/api/services/${service.id}`).set('Authorization', `Bearer ${tokenAdminB}`);
      expect(getAsB.status).toBe(404);

      const getAsA = await request(app).get(`/api/services/${service.id}`).set('Authorization', `Bearer ${tokenAdminA}`);
      expect(getAsA.status).toBe(200);
    });

    it('filtro por status/clientId não vaza OS de outro tenant', async () => {
      const createdBy = await prisma.user.findFirst({ where: { tenantId: tenantA.id } });
      await prisma.service.create({
        data: { tenantId: tenantA.id, number: 1, clientId: clientA.id, createdById: createdBy.id, type: 'Troca de Pneus', total: 100, status: 'OPEN' },
      });

      const res = await request(app).get('/api/services?status=OPEN').set('Authorization', `Bearer ${tokenAdminB}`);
      expect(res.body.data).toHaveLength(0);
    });
  });

  describe('PUT /api/services/:id', () => {
    it('atualiza normalmente uma OS do próprio tenant', async () => {
      const createdBy = await prisma.user.findFirst({ where: { tenantId: tenantA.id } });
      const service = await prisma.service.create({
        data: { tenantId: tenantA.id, number: 1, clientId: clientA.id, createdById: createdBy.id, type: 'Troca de Pneus', total: 100 },
      });

      const res = await request(app)
        .put(`/api/services/${service.id}`)
        .set('Authorization', `Bearer ${tokenAdminA}`)
        .send({ description: 'Cliente pediu revisão completa' });

      expect(res.status).toBe(200);
      expect(res.body.description).toBe('Cliente pediu revisão completa');
    });
  });

  describe('PATCH /api/services/:id/status', () => {
    it('marca completedAt automaticamente ao concluir a OS', async () => {
      const createdBy = await prisma.user.findFirst({ where: { tenantId: tenantA.id } });
      const service = await prisma.service.create({
        data: { tenantId: tenantA.id, number: 1, clientId: clientA.id, createdById: createdBy.id, type: 'Troca de Pneus', total: 100 },
      });

      const res = await request(app)
        .patch(`/api/services/${service.id}/status`)
        .set('Authorization', `Bearer ${tokenAdminA}`)
        .send({ status: 'COMPLETED' });

      expect(res.status).toBe(200);
      const updated = await prisma.service.findUnique({ where: { id: service.id } });
      expect(updated.status).toBe('COMPLETED');
      expect(updated.completedAt).not.toBeNull();
    });
  });

  describe('DELETE /api/services/:id', () => {
    it('cancela a OS do próprio tenant (não apaga o registro)', async () => {
      const createdBy = await prisma.user.findFirst({ where: { tenantId: tenantA.id } });
      const service = await prisma.service.create({
        data: { tenantId: tenantA.id, number: 1, clientId: clientA.id, createdById: createdBy.id, type: 'Troca de Pneus', total: 100 },
      });

      const res = await request(app).delete(`/api/services/${service.id}`).set('Authorization', `Bearer ${tokenAdminA}`);
      expect(res.status).toBe(200);

      const updated = await prisma.service.findUnique({ where: { id: service.id } });
      expect(updated.status).toBe('CANCELLED');
    });

    it('exige ADMIN — outros papéis recebem 403', async () => {
      const employeeA = await createUser(tenantA.id, { role: 'EMPLOYEE', email: 'empA@teste.com' });
      const tokenEmployeeA = await loginAndGetToken(app, employeeA.email, employeeA.plainPassword);
      const createdBy = await prisma.user.findFirst({ where: { tenantId: tenantA.id, role: 'ADMIN' } });
      const service = await prisma.service.create({
        data: { tenantId: tenantA.id, number: 1, clientId: clientA.id, createdById: createdBy.id, type: 'Troca de Pneus', total: 100 },
      });

      const res = await request(app).delete(`/api/services/${service.id}`).set('Authorization', `Bearer ${tokenEmployeeA}`);
      expect(res.status).toBe(403);
    });
  });
});
