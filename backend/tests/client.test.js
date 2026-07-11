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

describe('Clientes', () => {
  let tenantA, tenantB, tokenA, tokenB;

  beforeEach(async () => {
    tenantA = await createTenant({ name: 'Tenant A' });
    tenantB = await createTenant({ name: 'Tenant B' });

    const userA = await createUser(tenantA.id, { role: 'ADMIN', email: 'a@teste.com' });
    const userB = await createUser(tenantB.id, { role: 'ADMIN', email: 'b@teste.com' });
    tokenA = await loginAndGetToken(app, userA.email, userA.plainPassword);
    tokenB = await loginAndGetToken(app, userB.email, userB.plainPassword);
  });

  describe('POST /api/clients', () => {
    it('cria um cliente vinculado ao tenant de quem criou', async () => {
      const res = await request(app)
        .post('/api/clients')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ name: 'João da Silva', document: '11122233344' });

      expect(res.status).toBe(201);
      const created = await prisma.client.findUnique({ where: { id: res.body.id } });
      expect(created.tenantId).toBe(tenantA.id);
    });

    it('não deixa cadastrar documento duplicado dentro do mesmo tenant', async () => {
      await prisma.client.create({ data: { tenantId: tenantA.id, name: 'Cliente 1', document: 'DUPLICADO' } });

      const res = await request(app)
        .post('/api/clients')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ name: 'Cliente 2', document: 'DUPLICADO' });

      expect(res.status).toBe(409);
    });

    it('o mesmo documento pode existir em tenants diferentes', async () => {
      await prisma.client.create({ data: { tenantId: tenantA.id, name: 'Cliente A', document: 'MESMODOC' } });

      const res = await request(app)
        .post('/api/clients')
        .set('Authorization', `Bearer ${tokenB}`)
        .send({ name: 'Cliente B', document: 'MESMODOC' });

      expect(res.status).toBe(201);
    });
  });

  describe('Isolamento de tenant', () => {
    it('cliente não aparece na listagem nem é acessível pelo outro tenant', async () => {
      const client = await prisma.client.create({ data: { tenantId: tenantA.id, name: 'Cliente Sigiloso' } });

      const listAsB = await request(app).get('/api/clients').set('Authorization', `Bearer ${tokenB}`);
      expect(listAsB.body.data.find(c => c.id === client.id)).toBeUndefined();

      const getAsB = await request(app).get(`/api/clients/${client.id}`).set('Authorization', `Bearer ${tokenB}`);
      expect(getAsB.status).toBe(404);

      const getAsA = await request(app).get(`/api/clients/${client.id}`).set('Authorization', `Bearer ${tokenA}`);
      expect(getAsA.status).toBe(200);
    });

    it('busca (search) não retorna clientes de outro tenant', async () => {
      await prisma.client.create({ data: { tenantId: tenantA.id, name: 'Fulano Único', active: true } });

      const res = await request(app).get('/api/clients/search?q=Fulano Único').set('Authorization', `Bearer ${tokenB}`);
      expect(res.body).toEqual([]);
    });

    it('histórico (sales/services) não vaza dados quando o cliente é de outro tenant', async () => {
      const client = await prisma.client.create({ data: { tenantId: tenantA.id, name: 'Cliente A' } });
      const createdBy = await prisma.user.findFirst({ where: { tenantId: tenantA.id } });
      await prisma.service.create({
        data: { tenantId: tenantA.id, number: 1, clientId: client.id, createdById: createdBy.id, type: 'Troca de Pneus', total: 100 },
      });

      const res = await request(app).get(`/api/clients/${client.id}/history`).set('Authorization', `Bearer ${tokenB}`);
      expect(res.status).toBe(200);
      expect(res.body.services).toHaveLength(0);
      expect(res.body.sales).toHaveLength(0);
    });
  });

  describe('PUT /api/clients/:id', () => {
    it('atualiza normalmente um cliente do próprio tenant', async () => {
      const client = await prisma.client.create({ data: { tenantId: tenantA.id, name: 'Nome Antigo' } });

      const res = await request(app)
        .put(`/api/clients/${client.id}`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ name: 'Nome Novo' });

      expect(res.status).toBe(200);
      expect(res.body.name).toBe('Nome Novo');
    });

    it('retorna 404 e não vaza dados ao tentar editar cliente de outro tenant', async () => {
      const client = await prisma.client.create({ data: { tenantId: tenantA.id, name: 'Cliente Confidencial', phone: '11999999999' } });

      const res = await request(app)
        .put(`/api/clients/${client.id}`)
        .set('Authorization', `Bearer ${tokenB}`)
        .send({ name: 'Modificado pelo invasor' });

      expect(res.status).toBe(404);
      expect(JSON.stringify(res.body)).not.toContain('Cliente Confidencial');

      const stillIntact = await prisma.client.findUnique({ where: { id: client.id } });
      expect(stillIntact.name).toBe('Cliente Confidencial');
    });
  });

  describe('DELETE /api/clients/:id', () => {
    it('desativa (soft delete) o cliente do próprio tenant', async () => {
      const client = await prisma.client.create({ data: { tenantId: tenantA.id, name: 'Para Desativar' } });

      const res = await request(app).delete(`/api/clients/${client.id}`).set('Authorization', `Bearer ${tokenA}`);
      expect(res.status).toBe(200);

      const updated = await prisma.client.findUnique({ where: { id: client.id } });
      expect(updated.active).toBe(false);
    });

    it('retorna 404 e não desativa cliente de outro tenant', async () => {
      const client = await prisma.client.create({ data: { tenantId: tenantA.id, name: 'Protegido' } });

      const res = await request(app).delete(`/api/clients/${client.id}`).set('Authorization', `Bearer ${tokenB}`);
      expect(res.status).toBe(404);

      const stillActive = await prisma.client.findUnique({ where: { id: client.id } });
      expect(stillActive.active).toBe(true);
    });
  });
});
