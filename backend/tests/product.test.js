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

describe('Produtos', () => {
  let tenantA, tenantB, tokenAdminA, tokenEmployeeA, tokenFinancialA, tokenAdminB;

  beforeEach(async () => {
    tenantA = await createTenant({ name: 'Tenant A' });
    tenantB = await createTenant({ name: 'Tenant B' });

    const adminA = await createUser(tenantA.id, { role: 'ADMIN', email: 'adminA@teste.com' });
    const employeeA = await createUser(tenantA.id, { role: 'EMPLOYEE', email: 'empA@teste.com' });
    const financialA = await createUser(tenantA.id, { role: 'FINANCIAL', email: 'finA@teste.com' });
    const adminB = await createUser(tenantB.id, { role: 'ADMIN', email: 'adminB@teste.com' });

    tokenAdminA = await loginAndGetToken(app, adminA.email, adminA.plainPassword);
    tokenEmployeeA = await loginAndGetToken(app, employeeA.email, employeeA.plainPassword);
    tokenFinancialA = await loginAndGetToken(app, financialA.email, financialA.plainPassword);
    tokenAdminB = await loginAndGetToken(app, adminB.email, adminB.plainPassword);
  });

  describe('POST /api/products', () => {
    it('ADMIN e EMPLOYEE conseguem criar produto', async () => {
      const asAdmin = await request(app).post('/api/products').set('Authorization', `Bearer ${tokenAdminA}`)
        .send({ code: 'P1', name: 'Pneu A', costPrice: 50, salePrice: 100 });
      expect(asAdmin.status).toBe(201);

      const asEmployee = await request(app).post('/api/products').set('Authorization', `Bearer ${tokenEmployeeA}`)
        .send({ code: 'P2', name: 'Pneu B', costPrice: 50, salePrice: 100 });
      expect(asEmployee.status).toBe(201);
    });

    it('FINANCIAL não pode criar produto', async () => {
      const res = await request(app).post('/api/products').set('Authorization', `Bearer ${tokenFinancialA}`)
        .send({ code: 'P3', name: 'Pneu C', costPrice: 50, salePrice: 100 });
      expect(res.status).toBe(403);
    });

    it('produto criado é isolado no tenant de quem criou', async () => {
      const res = await request(app).post('/api/products').set('Authorization', `Bearer ${tokenAdminA}`)
        .send({ code: 'P4', name: 'Pneu D', costPrice: 50, salePrice: 100 });
      const created = await prisma.product.findUnique({ where: { id: res.body.id } });
      expect(created.tenantId).toBe(tenantA.id);
    });
  });

  describe('Isolamento de tenant', () => {
    it('produto não aparece na listagem nem é acessível pelo outro tenant', async () => {
      const product = await createProduct(tenantA.id, { code: 'SECRETO', name: 'Pneu Sigiloso' });

      const listAsB = await request(app).get('/api/products').set('Authorization', `Bearer ${tokenAdminB}`);
      expect(listAsB.body.data.find(p => p.id === product.id)).toBeUndefined();

      const getAsB = await request(app).get(`/api/products/${product.id}`).set('Authorization', `Bearer ${tokenAdminB}`);
      expect(getAsB.status).toBe(404);

      const getAsA = await request(app).get(`/api/products/${product.id}`).set('Authorization', `Bearer ${tokenAdminA}`);
      expect(getAsA.status).toBe(200);
    });

    it('busca (search) não retorna produtos de outro tenant', async () => {
      await createProduct(tenantA.id, { code: 'UNICO123', name: 'Pneu Único' });

      const res = await request(app).get('/api/products/search?q=UNICO123').set('Authorization', `Bearer ${tokenAdminB}`);
      expect(res.body).toEqual([]);
    });

    it('PUT em produto de outro tenant retorna 404 e NÃO vaza os dados do produto (regressão de vazamento)', async () => {
      const product = await createProduct(tenantA.id, { code: 'CONFID', name: 'Pneu Caro', costPrice: 999, salePrice: 1500 });

      const res = await request(app)
        .put(`/api/products/${product.id}`)
        .set('Authorization', `Bearer ${tokenAdminB}`)
        .send({ name: 'Modificado pelo invasor' });

      expect(res.status).toBe(404);
      expect(JSON.stringify(res.body)).not.toContain('999');
      expect(JSON.stringify(res.body)).not.toContain('Pneu Caro');

      const stillIntact = await prisma.product.findUnique({ where: { id: product.id } });
      expect(stillIntact.name).toBe('Pneu Caro');
    });

    it('PUT no próprio tenant atualiza normalmente', async () => {
      const product = await createProduct(tenantA.id, { code: 'MEU', name: 'Pneu Meu' });

      const res = await request(app)
        .put(`/api/products/${product.id}`)
        .set('Authorization', `Bearer ${tokenAdminA}`)
        .send({ name: 'Pneu Atualizado' });

      expect(res.status).toBe(200);
      expect(res.body.name).toBe('Pneu Atualizado');
    });

    it('DELETE em produto de outro tenant retorna 404 e não desativa nada', async () => {
      const product = await createProduct(tenantA.id, { code: 'INTACTO', name: 'Pneu Intacto' });

      const res = await request(app).delete(`/api/products/${product.id}`).set('Authorization', `Bearer ${tokenAdminB}`);
      expect(res.status).toBe(404);

      const stillActive = await prisma.product.findUnique({ where: { id: product.id } });
      expect(stillActive.active).toBe(true);
    });
  });

  describe('DELETE /api/products/:id', () => {
    it('exige ADMIN — EMPLOYEE recebe 403', async () => {
      const product = await createProduct(tenantA.id, { code: 'PROTEGIDO', name: 'Pneu Protegido' });

      const res = await request(app).delete(`/api/products/${product.id}`).set('Authorization', `Bearer ${tokenEmployeeA}`);
      expect(res.status).toBe(403);
    });

    it('ADMIN desativa o produto (soft delete)', async () => {
      const product = await createProduct(tenantA.id, { code: 'DESATIVAR', name: 'Pneu a Desativar' });

      const res = await request(app).delete(`/api/products/${product.id}`).set('Authorization', `Bearer ${tokenAdminA}`);
      expect(res.status).toBe(200);

      const updated = await prisma.product.findUnique({ where: { id: product.id } });
      expect(updated.active).toBe(false);
    });
  });

  describe('GET /api/products/low-stock', () => {
    it('só retorna produtos com estoque no ou abaixo do mínimo, do próprio tenant', async () => {
      await createProduct(tenantA.id, { code: 'BAIXO', name: 'Estoque Baixo', stock: 1, minStock: 5 });
      await createProduct(tenantA.id, { code: 'OK', name: 'Estoque OK', stock: 50, minStock: 5 });
      await createProduct(tenantB.id, { code: 'OUTRO-BAIXO', name: 'Baixo de Outro Tenant', stock: 1, minStock: 5 });

      const res = await request(app).get('/api/products/low-stock').set('Authorization', `Bearer ${tokenAdminA}`);
      const names = res.body.map(p => p.name);
      expect(names).toContain('Estoque Baixo');
      expect(names).not.toContain('Estoque OK');
      expect(names).not.toContain('Baixo de Outro Tenant');
    });
  });
});
