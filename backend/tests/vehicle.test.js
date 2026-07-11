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

describe('Veículos', () => {
  let tenantA, tenantB, tokenA, tokenB, clientA;

  beforeEach(async () => {
    tenantA = await createTenant({ name: 'Tenant A' });
    tenantB = await createTenant({ name: 'Tenant B' });

    const userA = await createUser(tenantA.id, { role: 'ADMIN', email: 'a@teste.com' });
    const userB = await createUser(tenantB.id, { role: 'ADMIN', email: 'b@teste.com' });
    tokenA = await loginAndGetToken(app, userA.email, userA.plainPassword);
    tokenB = await loginAndGetToken(app, userB.email, userB.plainPassword);

    clientA = await prisma.client.create({ data: { tenantId: tenantA.id, name: 'Cliente A' } });
  });

  describe('POST /api/vehicles', () => {
    it('cria um veículo vinculado ao tenant de quem criou', async () => {
      const res = await request(app)
        .post('/api/vehicles')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ clientId: clientA.id, plate: 'ABC1234', brand: 'Fiat', model: 'Uno', year: 2020 });

      expect(res.status).toBe(201);
      const created = await prisma.vehicle.findUnique({ where: { id: res.body.id } });
      expect(created.tenantId).toBe(tenantA.id);
    });

    it('não deixa cadastrar placa duplicada dentro do mesmo tenant', async () => {
      await prisma.vehicle.create({
        data: { tenantId: tenantA.id, clientId: clientA.id, plate: 'DUPLICADA', brand: 'Fiat', model: 'Uno', year: 2020 },
      });

      const res = await request(app)
        .post('/api/vehicles')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ clientId: clientA.id, plate: 'DUPLICADA', brand: 'VW', model: 'Gol', year: 2021 });

      expect(res.status).toBe(409); // P2002 tratado pelo errorHandler
    });

    it('a mesma placa pode existir em tenants diferentes (constraint é por tenant)', async () => {
      const clientB = await prisma.client.create({ data: { tenantId: tenantB.id, name: 'Cliente B' } });
      await prisma.vehicle.create({
        data: { tenantId: tenantA.id, clientId: clientA.id, plate: 'MESMA123', brand: 'Fiat', model: 'Uno', year: 2020 },
      });

      const res = await request(app)
        .post('/api/vehicles')
        .set('Authorization', `Bearer ${tokenB}`)
        .send({ clientId: clientB.id, plate: 'MESMA123', brand: 'VW', model: 'Gol', year: 2021 });

      expect(res.status).toBe(201);
    });
  });

  describe('Isolamento de tenant', () => {
    it('veículo não aparece na listagem nem é acessível pelo outro tenant', async () => {
      const vehicle = await prisma.vehicle.create({
        data: { tenantId: tenantA.id, clientId: clientA.id, plate: 'SIGILO1', brand: 'Fiat', model: 'Uno', year: 2020 },
      });

      const listAsB = await request(app).get('/api/vehicles').set('Authorization', `Bearer ${tokenB}`);
      expect(listAsB.body.find(v => v.id === vehicle.id)).toBeUndefined();

      const getAsB = await request(app).get(`/api/vehicles/${vehicle.id}`).set('Authorization', `Bearer ${tokenB}`);
      expect(getAsB.status).toBe(404);

      const getAsA = await request(app).get(`/api/vehicles/${vehicle.id}`).set('Authorization', `Bearer ${tokenA}`);
      expect(getAsA.status).toBe(200);
    });

    it('PUT em veículo de outro tenant retorna 404 e não vaza a placa (regressão de vazamento)', async () => {
      const vehicle = await prisma.vehicle.create({
        data: { tenantId: tenantA.id, clientId: clientA.id, plate: 'CONFID1', brand: 'Fiat', model: 'Uno', year: 2020 },
      });

      const res = await request(app)
        .put(`/api/vehicles/${vehicle.id}`)
        .set('Authorization', `Bearer ${tokenB}`)
        .send({ model: 'Modificado pelo invasor' });

      expect(res.status).toBe(404);
      expect(JSON.stringify(res.body)).not.toContain('CONFID1');

      const stillIntact = await prisma.vehicle.findUnique({ where: { id: vehicle.id } });
      expect(stillIntact.model).toBe('Uno');
    });

    it('DELETE em veículo de outro tenant retorna 404 e não remove nada', async () => {
      const vehicle = await prisma.vehicle.create({
        data: { tenantId: tenantA.id, clientId: clientA.id, plate: 'INTACTO1', brand: 'Fiat', model: 'Uno', year: 2020 },
      });

      const res = await request(app).delete(`/api/vehicles/${vehicle.id}`).set('Authorization', `Bearer ${tokenB}`);
      expect(res.status).toBe(404);

      const stillThere = await prisma.vehicle.findUnique({ where: { id: vehicle.id } });
      expect(stillThere).not.toBeNull();
    });
  });

  describe('PUT/DELETE no próprio tenant', () => {
    it('atualiza o veículo normalmente', async () => {
      const vehicle = await prisma.vehicle.create({
        data: { tenantId: tenantA.id, clientId: clientA.id, plate: 'MEUCARRO', brand: 'Fiat', model: 'Uno', year: 2020 },
      });

      const res = await request(app)
        .put(`/api/vehicles/${vehicle.id}`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ model: 'Palio' });

      expect(res.status).toBe(200);
      expect(res.body.model).toBe('Palio');
    });

    it('remove o veículo normalmente', async () => {
      const vehicle = await prisma.vehicle.create({
        data: { tenantId: tenantA.id, clientId: clientA.id, plate: 'REMOVER1', brand: 'Fiat', model: 'Uno', year: 2020 },
      });

      const res = await request(app).delete(`/api/vehicles/${vehicle.id}`).set('Authorization', `Bearer ${tokenA}`);
      expect(res.status).toBe(200);

      const gone = await prisma.vehicle.findUnique({ where: { id: vehicle.id } });
      expect(gone).toBeNull();
    });
  });

  describe('GET /api/vehicles?clientId=', () => {
    it('filtra por cliente dentro do próprio tenant', async () => {
      const otherClientA = await prisma.client.create({ data: { tenantId: tenantA.id, name: 'Outro Cliente A' } });
      await prisma.vehicle.create({ data: { tenantId: tenantA.id, clientId: clientA.id, plate: 'DOCLI1', brand: 'Fiat', model: 'Uno', year: 2020 } });
      await prisma.vehicle.create({ data: { tenantId: tenantA.id, clientId: otherClientA.id, plate: 'DEOUTRO', brand: 'VW', model: 'Gol', year: 2021 } });

      const res = await request(app).get(`/api/vehicles?clientId=${clientA.id}`).set('Authorization', `Bearer ${tokenA}`);
      expect(res.body.every(v => v.clientId === clientA.id)).toBe(true);
      expect(res.body.find(v => v.plate === 'DEOUTRO')).toBeUndefined();
    });
  });
});
