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

describe('Financeiro', () => {
  let tenantA, tenantB, tokenAdminA, tokenFinancialA, tokenEmployeeA, tokenAdminB;

  beforeEach(async () => {
    tenantA = await createTenant({ name: 'Tenant A' });
    tenantB = await createTenant({ name: 'Tenant B' });

    const adminA = await createUser(tenantA.id, { role: 'ADMIN', email: 'adminA@teste.com' });
    const financialA = await createUser(tenantA.id, { role: 'FINANCIAL', email: 'finA@teste.com' });
    const employeeA = await createUser(tenantA.id, { role: 'EMPLOYEE', email: 'empA@teste.com' });
    const adminB = await createUser(tenantB.id, { role: 'ADMIN', email: 'adminB@teste.com' });

    tokenAdminA = await loginAndGetToken(app, adminA.email, adminA.plainPassword);
    tokenFinancialA = await loginAndGetToken(app, financialA.email, financialA.plainPassword);
    tokenEmployeeA = await loginAndGetToken(app, employeeA.email, employeeA.plainPassword);
    tokenAdminB = await loginAndGetToken(app, adminB.email, adminB.plainPassword);
  });

  describe('Autorização', () => {
    it('EMPLOYEE não acessa nenhuma rota financeira', async () => {
      const res = await request(app).get('/api/financial/receivable').set('Authorization', `Bearer ${tokenEmployeeA}`);
      expect(res.status).toBe(403);
    });

    it('ADMIN e FINANCIAL acessam normalmente', async () => {
      const asAdmin = await request(app).get('/api/financial/receivable').set('Authorization', `Bearer ${tokenAdminA}`);
      const asFinancial = await request(app).get('/api/financial/receivable').set('Authorization', `Bearer ${tokenFinancialA}`);
      expect(asAdmin.status).toBe(200);
      expect(asFinancial.status).toBe(200);
    });
  });

  describe('Contas a receber', () => {
    it('cria e lista contas a receber do próprio tenant', async () => {
      const res = await request(app)
        .post('/api/financial/receivable')
        .set('Authorization', `Bearer ${tokenFinancialA}`)
        .send({ description: 'Serviço #1', amount: 250, dueDate: new Date('2026-08-01').toISOString() });
      expect(res.status).toBe(201);

      const list = await request(app).get('/api/financial/receivable').set('Authorization', `Bearer ${tokenFinancialA}`);
      expect(list.body.find(r => r.id === res.body.id)).toBeDefined();
    });

    it('não lista contas a receber de outro tenant', async () => {
      await prisma.accountReceivable.create({
        data: { tenantId: tenantA.id, description: 'Sigiloso', amount: 100, dueDate: new Date() },
      });

      const list = await request(app).get('/api/financial/receivable').set('Authorization', `Bearer ${tokenAdminB}`);
      expect(list.body.find(r => r.description === 'Sigiloso')).toBeUndefined();
    });

    it('marca como paga uma conta do próprio tenant', async () => {
      const item = await prisma.accountReceivable.create({
        data: { tenantId: tenantA.id, description: 'A pagar', amount: 100, dueDate: new Date() },
      });

      const res = await request(app)
        .patch(`/api/financial/receivable/${item.id}/pay`)
        .set('Authorization', `Bearer ${tokenFinancialA}`)
        .send({ paidAmount: 100 });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('PAID');
      expect(res.body.paidAmount).toBe(100);
    });

    it('não deixa marcar como paga uma conta de outro tenant', async () => {
      const item = await prisma.accountReceivable.create({
        data: { tenantId: tenantA.id, description: 'Protegido', amount: 100, dueDate: new Date() },
      });

      const res = await request(app)
        .patch(`/api/financial/receivable/${item.id}/pay`)
        .set('Authorization', `Bearer ${tokenAdminB}`)
        .send({ paidAmount: 100 });

      expect(res.status).toBe(404);

      const stillPending = await prisma.accountReceivable.findUnique({ where: { id: item.id } });
      expect(stillPending.status).toBe('PENDING');
    });
  });

  describe('Contas a pagar', () => {
    it('cria e lista contas a pagar do próprio tenant', async () => {
      const res = await request(app)
        .post('/api/financial/payable')
        .set('Authorization', `Bearer ${tokenFinancialA}`)
        .send({ description: 'Fornecedor X', amount: 500, dueDate: new Date('2026-08-01').toISOString() });
      expect(res.status).toBe(201);

      const list = await request(app).get('/api/financial/payable').set('Authorization', `Bearer ${tokenFinancialA}`);
      expect(list.body.find(p => p.id === res.body.id)).toBeDefined();
    });

    it('marca como paga uma conta a pagar do próprio tenant', async () => {
      const item = await prisma.accountPayable.create({
        data: { tenantId: tenantA.id, description: 'Fornecedor Y', amount: 300, dueDate: new Date() },
      });

      const res = await request(app)
        .patch(`/api/financial/payable/${item.id}/pay`)
        .set('Authorization', `Bearer ${tokenFinancialA}`)
        .send({ paidAmount: 300 });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('PAID');
    });

    it('não deixa marcar como paga uma conta a pagar de outro tenant', async () => {
      const item = await prisma.accountPayable.create({
        data: { tenantId: tenantA.id, description: 'Protegido', amount: 300, dueDate: new Date() },
      });

      const res = await request(app)
        .patch(`/api/financial/payable/${item.id}/pay`)
        .set('Authorization', `Bearer ${tokenAdminB}`)
        .send({ paidAmount: 300 });

      expect(res.status).toBe(404);
    });
  });

  describe('Resumo e fluxo de caixa', () => {
    it('summary só soma pendências do próprio tenant', async () => {
      await prisma.accountReceivable.create({ data: { tenantId: tenantA.id, description: 'R1', amount: 100, dueDate: new Date(), status: 'PENDING' } });
      await prisma.accountReceivable.create({ data: { tenantId: tenantB.id, description: 'R2 de outro tenant', amount: 9999, dueDate: new Date(), status: 'PENDING' } });

      const res = await request(app).get('/api/financial/summary').set('Authorization', `Bearer ${tokenAdminA}`);
      expect(res.status).toBe(200);
      expect(res.body.receivablePending).toBe(100);
    });

    it('cashflow retorna um item por mês no período pedido', async () => {
      const res = await request(app).get('/api/financial/cashflow?months=3').set('Authorization', `Bearer ${tokenAdminA}`);
      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(3);
    });
  });
});
