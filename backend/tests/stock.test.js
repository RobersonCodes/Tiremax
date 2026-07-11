const request = require('supertest');
const app = require('../src/app');
const prisma = require('../src/config/database');
const { cleanDatabase } = require('./helpers/cleanDb');
const { createTenant, createUser, loginAndGetToken } = require('./helpers/factories');
const { createProduct } = require('./helpers/productFactory');

beforeEach(async () => {
  await cleanDatabase();
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe('Estoque', () => {
  let tenantA, tenantB, tokenAdminA, tokenFinancialA, tokenAdminB;

  beforeEach(async () => {
    tenantA = await createTenant({ name: 'Tenant A' });
    tenantB = await createTenant({ name: 'Tenant B' });

    const adminA = await createUser(tenantA.id, { role: 'ADMIN', email: 'adminA@teste.com' });
    const financialA = await createUser(tenantA.id, { role: 'FINANCIAL', email: 'finA@teste.com' });
    const adminB = await createUser(tenantB.id, { role: 'ADMIN', email: 'adminB@teste.com' });

    tokenAdminA = await loginAndGetToken(app, adminA.email, adminA.plainPassword);
    tokenFinancialA = await loginAndGetToken(app, financialA.email, financialA.plainPassword);
    tokenAdminB = await loginAndGetToken(app, adminB.email, adminB.plainPassword);
  });

  describe('POST /api/stock/movements', () => {
    it('FINANCIAL não pode registrar movimentação de estoque', async () => {
      const product = await createProduct(tenantA.id, { stock: 10 });
      const res = await request(app)
        .post('/api/stock/movements')
        .set('Authorization', `Bearer ${tokenFinancialA}`)
        .send({ productId: product.id, type: 'IN', quantity: 5, reason: 'Compra' });
      expect(res.status).toBe(403);
    });

    it('entrada (IN) incrementa o estoque', async () => {
      const product = await createProduct(tenantA.id, { stock: 10 });

      const res = await request(app)
        .post('/api/stock/movements')
        .set('Authorization', `Bearer ${tokenAdminA}`)
        .send({ productId: product.id, type: 'IN', quantity: 5, reason: 'Compra' });

      expect(res.status).toBe(201);
      const updated = await prisma.product.findUnique({ where: { id: product.id } });
      expect(updated.stock).toBe(15);
    });

    it('saída (OUT) decrementa o estoque', async () => {
      const product = await createProduct(tenantA.id, { stock: 10 });

      const res = await request(app)
        .post('/api/stock/movements')
        .set('Authorization', `Bearer ${tokenAdminA}`)
        .send({ productId: product.id, type: 'OUT', quantity: 3, reason: 'Ajuste' });

      expect(res.status).toBe(201);
      const updated = await prisma.product.findUnique({ where: { id: product.id } });
      expect(updated.stock).toBe(7);
    });

    it('não deixa registrar movimentação em produto de outro tenant', async () => {
      const product = await createProduct(tenantA.id, { stock: 10 });

      const res = await request(app)
        .post('/api/stock/movements')
        .set('Authorization', `Bearer ${tokenAdminB}`)
        .send({ productId: product.id, type: 'IN', quantity: 5, reason: 'Compra' });

      expect(res.status).toBe(404);

      const unchanged = await prisma.product.findUnique({ where: { id: product.id } });
      expect(unchanged.stock).toBe(10);
    });
  });

  describe('GET /api/stock/movements', () => {
    it('não lista movimentações de outro tenant', async () => {
      const productA = await createProduct(tenantA.id);
      const productB = await createProduct(tenantB.id);
      await prisma.stockMovement.create({ data: { tenantId: tenantA.id, productId: productA.id, type: 'IN', quantity: 1, reason: 'Teste A' } });
      await prisma.stockMovement.create({ data: { tenantId: tenantB.id, productId: productB.id, type: 'IN', quantity: 1, reason: 'Teste B' } });

      const res = await request(app).get('/api/stock/movements').set('Authorization', `Bearer ${tokenAdminA}`);
      expect(res.body.data.every(m => m.reason === 'Teste A')).toBe(true);
    });
  });

  describe('GET /api/stock/report', () => {
    it('calcula valor total do estoque e contagem de itens baixos, só do próprio tenant', async () => {
      await createProduct(tenantA.id, { costPrice: 10, stock: 5, minStock: 5 });
      await createProduct(tenantA.id, { costPrice: 20, stock: 100, minStock: 5 });
      await createProduct(tenantB.id, { costPrice: 999, stock: 1, minStock: 5 });

      const res = await request(app).get('/api/stock/report').set('Authorization', `Bearer ${tokenAdminA}`);
      expect(res.status).toBe(200);
      expect(res.body.totalProducts).toBe(2);
      expect(res.body.totalValue).toBe(5 * 10 + 100 * 20);
      expect(res.body.lowStockCount).toBe(1);
    });
  });
});
