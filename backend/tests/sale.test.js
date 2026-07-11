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

describe('Vendas (PDV)', () => {
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

  describe('POST /api/sales', () => {
    it('cria a venda, debita o estoque e registra a movimentação', async () => {
      const product = await createProduct(tenantA.id, { stock: 10 });

      const res = await request(app)
        .post('/api/sales')
        .set('Authorization', `Bearer ${tokenAdminA}`)
        .send({ items: [{ productId: product.id, quantity: 3, unitPrice: 180 }], paymentMethod: 'CASH' });

      expect(res.status).toBe(201);
      expect(res.body.total).toBe(540);
      expect(res.body.number).toBe(1);

      const updatedProduct = await prisma.product.findUnique({ where: { id: product.id } });
      expect(updatedProduct.stock).toBe(7);

      const movement = await prisma.stockMovement.findFirst({ where: { productId: product.id } });
      expect(movement.type).toBe('OUT');
      expect(movement.quantity).toBe(3);
    });

    it('aplica o desconto corretamente no total', async () => {
      const product = await createProduct(tenantA.id);

      const res = await request(app)
        .post('/api/sales')
        .set('Authorization', `Bearer ${tokenAdminA}`)
        .send({ items: [{ productId: product.id, quantity: 2, unitPrice: 180 }], discount: 50, paymentMethod: 'CASH' });

      expect(res.body.subtotal).toBe(360);
      expect(res.body.total).toBe(310);
    });

    it('numeração de venda é sequencial por tenant, não global', async () => {
      const productA = await createProduct(tenantA.id);
      const productB = await createProduct(tenantB.id);

      const saleA1 = await request(app).post('/api/sales').set('Authorization', `Bearer ${tokenAdminA}`)
        .send({ items: [{ productId: productA.id, quantity: 1, unitPrice: 180 }], paymentMethod: 'CASH' });
      const saleB1 = await request(app).post('/api/sales').set('Authorization', `Bearer ${tokenAdminB}`)
        .send({ items: [{ productId: productB.id, quantity: 1, unitPrice: 180 }], paymentMethod: 'CASH' });
      const saleA2 = await request(app).post('/api/sales').set('Authorization', `Bearer ${tokenAdminA}`)
        .send({ items: [{ productId: productA.id, quantity: 1, unitPrice: 180 }], paymentMethod: 'CASH' });

      expect(saleA1.body.number).toBe(1);
      expect(saleB1.body.number).toBe(1); // outro tenant, numeração recomeça
      expect(saleA2.body.number).toBe(2);
    });

    it('funcionário (EMPLOYEE) também pode registrar venda no PDV', async () => {
      const product = await createProduct(tenantA.id);
      const res = await request(app).post('/api/sales').set('Authorization', `Bearer ${tokenEmployeeA}`)
        .send({ items: [{ productId: product.id, quantity: 1, unitPrice: 180 }], paymentMethod: 'CASH' });
      expect(res.status).toBe(201);
    });
  });

  describe('Isolamento de tenant', () => {
    it('venda de um tenant não é visível nem acessível pelo outro', async () => {
      const product = await createProduct(tenantA.id);
      const createRes = await request(app).post('/api/sales').set('Authorization', `Bearer ${tokenAdminA}`)
        .send({ items: [{ productId: product.id, quantity: 1, unitPrice: 180 }], paymentMethod: 'CASH' });
      const saleId = createRes.body.id;

      const getAsB = await request(app).get(`/api/sales/${saleId}`).set('Authorization', `Bearer ${tokenAdminB}`);
      expect(getAsB.status).toBe(404);

      const listAsB = await request(app).get('/api/sales').set('Authorization', `Bearer ${tokenAdminB}`);
      expect(listAsB.body.data.find(s => s.id === saleId)).toBeUndefined();
    });

    it('cancelar venda de outro tenant retorna 404 e não altera o status', async () => {
      const product = await createProduct(tenantA.id);
      const createRes = await request(app).post('/api/sales').set('Authorization', `Bearer ${tokenAdminA}`)
        .send({ items: [{ productId: product.id, quantity: 1, unitPrice: 180 }], paymentMethod: 'CASH' });
      const saleId = createRes.body.id;

      const res = await request(app).patch(`/api/sales/${saleId}/cancel`).set('Authorization', `Bearer ${tokenAdminB}`);
      expect(res.status).toBe(404);

      const sale = await prisma.sale.findUnique({ where: { id: saleId } });
      expect(sale.status).toBe('COMPLETED');
    });
  });

  describe('PATCH /api/sales/:id/cancel', () => {
    it('exige ADMIN/FINANCIAL — EMPLOYEE recebe 403', async () => {
      const product = await createProduct(tenantA.id);
      const createRes = await request(app).post('/api/sales').set('Authorization', `Bearer ${tokenAdminA}`)
        .send({ items: [{ productId: product.id, quantity: 1, unitPrice: 180 }], paymentMethod: 'CASH' });
      const saleId = createRes.body.id;

      const res = await request(app).patch(`/api/sales/${saleId}/cancel`).set('Authorization', `Bearer ${tokenEmployeeA}`);
      expect(res.status).toBe(403);
    });

    it('ADMIN cancela normalmente a venda do próprio tenant', async () => {
      const product = await createProduct(tenantA.id);
      const createRes = await request(app).post('/api/sales').set('Authorization', `Bearer ${tokenAdminA}`)
        .send({ items: [{ productId: product.id, quantity: 1, unitPrice: 180 }], paymentMethod: 'CASH' });
      const saleId = createRes.body.id;

      const res = await request(app).patch(`/api/sales/${saleId}/cancel`).set('Authorization', `Bearer ${tokenAdminA}`);
      expect(res.status).toBe(200);

      const sale = await prisma.sale.findUnique({ where: { id: saleId } });
      expect(sale.status).toBe('CANCELLED');
    });
  });
});
