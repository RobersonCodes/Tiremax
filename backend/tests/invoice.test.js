jest.mock('../src/services/focusNfe.service');

const request = require('supertest');
const app = require('../src/app');
const prisma = require('../src/config/database');
const focusNfe = require('../src/services/focusNfe.service');
const { cleanDatabase } = require('./helpers/cleanDb');
const { createTenant, createUser, loginAndGetToken } = require('./helpers/factories');
const { createProduct } = require('./helpers/productFactory');

beforeEach(async () => {
  await cleanDatabase();
  jest.clearAllMocks();
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe('Notas fiscais', () => {
  let tenantA, tokenAdminA, userA, clientA;

  beforeEach(async () => {
    tenantA = await createTenant({ name: 'Tenant A', cnpj: '11222333000181', fiscalEnabled: true });
    userA = await createUser(tenantA.id, { role: 'ADMIN', email: 'adminA@teste.com' });
    tokenAdminA = await loginAndGetToken(app, userA.email, userA.plainPassword);
    clientA = await prisma.client.create({ data: { tenantId: tenantA.id, name: 'Cliente A' } });
  });

  describe('POST /api/invoices/from-sale/:saleId', () => {
    it('cria um rascunho de invoice do tipo NFCE pra venda', async () => {
      const product = await createProduct(tenantA.id);
      const sale = await prisma.sale.create({
        data: { tenantId: tenantA.id, number: 1, clientId: clientA.id, userId: userA.id, status: 'COMPLETED', subtotal: 180, total: 180, paymentMethod: 'CASH' },
      });

      const res = await request(app).post(`/api/invoices/from-sale/${sale.id}`).set('Authorization', `Bearer ${tokenAdminA}`);
      expect(res.status).toBe(201);
      expect(res.body.type).toBe('NFCE');
      expect(res.body.status).toBe('DRAFT');
    });

    it('é idempotente — chamar de novo retorna a mesma invoice, não cria outra', async () => {
      const sale = await prisma.sale.create({
        data: { tenantId: tenantA.id, number: 1, clientId: clientA.id, userId: userA.id, status: 'COMPLETED', subtotal: 180, total: 180, paymentMethod: 'CASH' },
      });

      const first = await request(app).post(`/api/invoices/from-sale/${sale.id}`).set('Authorization', `Bearer ${tokenAdminA}`);
      const second = await request(app).post(`/api/invoices/from-sale/${sale.id}`).set('Authorization', `Bearer ${tokenAdminA}`);

      expect(second.status).toBe(200);
      expect(second.body.id).toBe(first.body.id);

      const count = await prisma.invoice.count({ where: { saleId: sale.id } });
      expect(count).toBe(1);
    });

    it('retorna 404 para venda de outro tenant', async () => {
      const tenantB = await createTenant({ name: 'Tenant B' });
      const userB = await createUser(tenantB.id, { role: 'ADMIN', email: 'adminB@teste.com' });
      const clientB = await prisma.client.create({ data: { tenantId: tenantB.id, name: 'Cliente B' } });
      const saleB = await prisma.sale.create({
        data: { tenantId: tenantB.id, number: 1, clientId: clientB.id, userId: userB.id, status: 'COMPLETED', subtotal: 100, total: 100, paymentMethod: 'CASH' },
      });

      const res = await request(app).post(`/api/invoices/from-sale/${saleB.id}`).set('Authorization', `Bearer ${tokenAdminA}`);
      expect(res.status).toBe(404);
    });
  });

  describe('POST /api/invoices/from-service/:serviceId', () => {
    it('cria um rascunho de invoice do tipo NFSE pra OS', async () => {
      const service = await prisma.service.create({
        data: { tenantId: tenantA.id, number: 1, clientId: clientA.id, createdById: userA.id, type: 'Troca de Pneus', total: 150 },
      });

      const res = await request(app).post(`/api/invoices/from-service/${service.id}`).set('Authorization', `Bearer ${tokenAdminA}`);
      expect(res.status).toBe(201);
      expect(res.body.type).toBe('NFSE');
    });
  });

  describe('POST /api/invoices/issue/:id', () => {
    it('recusa emitir sem CNPJ configurado no tenant', async () => {
      const tenantSemFiscal = await createTenant({ name: 'Sem Fiscal', fiscalEnabled: false });
      const userSemFiscal = await createUser(tenantSemFiscal.id, { role: 'ADMIN', email: 'semfiscal@teste.com' });
      const tokenSemFiscal = await loginAndGetToken(app, userSemFiscal.email, userSemFiscal.plainPassword);
      const clientSemFiscal = await prisma.client.create({ data: { tenantId: tenantSemFiscal.id, name: 'Cliente' } });
      const sale = await prisma.sale.create({
        data: { tenantId: tenantSemFiscal.id, number: 1, clientId: clientSemFiscal.id, userId: userSemFiscal.id, status: 'COMPLETED', subtotal: 100, total: 100, paymentMethod: 'CASH' },
      });
      const invoice = await prisma.invoice.create({
        data: { tenantId: tenantSemFiscal.id, saleId: sale.id, clientId: clientSemFiscal.id, type: 'NFCE', amount: 100, status: 'DRAFT' },
      });

      const res = await request(app).post(`/api/invoices/issue/${invoice.id}`).set('Authorization', `Bearer ${tokenSemFiscal}`);
      expect(res.status).toBe(400);
      expect(focusNfe.issueNFCe).not.toHaveBeenCalled();
    });

    it('emite com sucesso e marca a invoice como PROCESSING', async () => {
      const sale = await prisma.sale.create({
        data: { tenantId: tenantA.id, number: 1, clientId: clientA.id, userId: userA.id, status: 'COMPLETED', subtotal: 100, total: 100, paymentMethod: 'CASH' },
      });
      const invoice = await prisma.invoice.create({
        data: { tenantId: tenantA.id, saleId: sale.id, clientId: clientA.id, type: 'NFCE', amount: 100, status: 'DRAFT' },
      });
      focusNfe.issueNFCe.mockResolvedValue({ status: 'processando_autorizacao' });

      const res = await request(app).post(`/api/invoices/issue/${invoice.id}`).set('Authorization', `Bearer ${tokenAdminA}`);
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('PROCESSING');
    });

    it('marca a invoice como ERROR quando a Focus NFe falha', async () => {
      const sale = await prisma.sale.create({
        data: { tenantId: tenantA.id, number: 1, clientId: clientA.id, userId: userA.id, status: 'COMPLETED', subtotal: 100, total: 100, paymentMethod: 'CASH' },
      });
      const invoice = await prisma.invoice.create({
        data: { tenantId: tenantA.id, saleId: sale.id, clientId: clientA.id, type: 'NFCE', amount: 100, status: 'DRAFT' },
      });
      focusNfe.issueNFCe.mockRejectedValue(Object.assign(new Error('CNPJ inválido'), { response: { data: { mensagem: 'CNPJ inválido' } } }));

      const res = await request(app).post(`/api/invoices/issue/${invoice.id}`).set('Authorization', `Bearer ${tokenAdminA}`);
      expect(res.status).toBe(422);

      const updated = await prisma.invoice.findUnique({ where: { id: invoice.id } });
      expect(updated.status).toBe('ERROR');
      expect(updated.errorMessage).toBe('CNPJ inválido');
    });
  });

  describe('GET /api/invoices/:id/status', () => {
    it('atualiza pra ISSUED quando a Focus NFe retorna autorizado', async () => {
      const sale = await prisma.sale.create({
        data: { tenantId: tenantA.id, number: 1, clientId: clientA.id, userId: userA.id, status: 'COMPLETED', subtotal: 100, total: 100, paymentMethod: 'CASH' },
      });
      const invoice = await prisma.invoice.create({
        data: { tenantId: tenantA.id, saleId: sale.id, clientId: clientA.id, type: 'NFCE', amount: 100, status: 'PROCESSING' },
      });
      focusNfe.checkStatus.mockResolvedValue({ status: 'autorizado', numero: '123', caminho_danfe: 'http://x/danfe.pdf' });

      const res = await request(app).get(`/api/invoices/${invoice.id}/status`).set('Authorization', `Bearer ${tokenAdminA}`);
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('ISSUED');
      expect(res.body.number).toBe('123');
    });

    it('atualiza pra ERROR quando a Focus NFe rejeita', async () => {
      const sale = await prisma.sale.create({
        data: { tenantId: tenantA.id, number: 1, clientId: clientA.id, userId: userA.id, status: 'COMPLETED', subtotal: 100, total: 100, paymentMethod: 'CASH' },
      });
      const invoice = await prisma.invoice.create({
        data: { tenantId: tenantA.id, saleId: sale.id, clientId: clientA.id, type: 'NFCE', amount: 100, status: 'PROCESSING' },
      });
      focusNfe.checkStatus.mockResolvedValue({ status: 'erro_autorizacao', mensagem_sefaz: 'Rejeitado pela SEFAZ' });

      const res = await request(app).get(`/api/invoices/${invoice.id}/status`).set('Authorization', `Bearer ${tokenAdminA}`);
      expect(res.body.status).toBe('ERROR');
      expect(res.body.errorMessage).toBe('Rejeitado pela SEFAZ');
    });
  });

  describe('POST /api/invoices/cancel/:id', () => {
    it('só cancela invoice já emitida (ISSUED)', async () => {
      const sale = await prisma.sale.create({
        data: { tenantId: tenantA.id, number: 1, clientId: clientA.id, userId: userA.id, status: 'COMPLETED', subtotal: 100, total: 100, paymentMethod: 'CASH' },
      });
      const invoice = await prisma.invoice.create({
        data: { tenantId: tenantA.id, saleId: sale.id, clientId: clientA.id, type: 'NFCE', amount: 100, status: 'DRAFT' },
      });

      const res = await request(app).post(`/api/invoices/cancel/${invoice.id}`).set('Authorization', `Bearer ${tokenAdminA}`);
      expect(res.status).toBe(400);
      expect(focusNfe.cancel).not.toHaveBeenCalled();
    });

    it('cancela normalmente uma invoice ISSUED', async () => {
      const sale = await prisma.sale.create({
        data: { tenantId: tenantA.id, number: 1, clientId: clientA.id, userId: userA.id, status: 'COMPLETED', subtotal: 100, total: 100, paymentMethod: 'CASH' },
      });
      const invoice = await prisma.invoice.create({
        data: { tenantId: tenantA.id, saleId: sale.id, clientId: clientA.id, type: 'NFCE', amount: 100, status: 'ISSUED' },
      });
      focusNfe.cancel.mockResolvedValue({ status: 'cancelado' });

      const res = await request(app)
        .post(`/api/invoices/cancel/${invoice.id}`)
        .set('Authorization', `Bearer ${tokenAdminA}`)
        .send({ justificativa: 'Cliente desistiu' });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('CANCELLED');
    });
  });
});
