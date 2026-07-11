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

describe('Dashboard', () => {
  let tenantA, tenantB, tokenA, tokenB, userA;

  beforeEach(async () => {
    tenantA = await createTenant({ name: 'Tenant A' });
    tenantB = await createTenant({ name: 'Tenant B' });

    userA = await createUser(tenantA.id, { role: 'ADMIN', email: 'a@teste.com' });
    const userB = await createUser(tenantB.id, { role: 'ADMIN', email: 'b@teste.com' });
    tokenA = await loginAndGetToken(app, userA.email, userA.plainPassword);
    tokenB = await loginAndGetToken(app, userB.email, userB.plainPassword);
  });

  it('métricas contam apenas dados do próprio tenant', async () => {
    const userB = await prisma.user.findFirst({ where: { tenantId: tenantB.id } });

    await prisma.sale.create({
      data: { tenantId: tenantA.id, number: 1, userId: userA.id, status: 'COMPLETED', subtotal: 100, total: 100, paymentMethod: 'CASH' },
    });
    await prisma.sale.create({
      data: { tenantId: tenantB.id, number: 1, userId: userB.id, status: 'COMPLETED', subtotal: 9999, total: 9999, paymentMethod: 'CASH' },
    });
    await prisma.client.create({ data: { tenantId: tenantA.id, name: 'Cliente A' } });
    await prisma.client.create({ data: { tenantId: tenantB.id, name: 'Cliente B' } });

    const res = await request(app).get('/api/dashboard/metrics').set('Authorization', `Bearer ${tokenA}`);
    expect(res.status).toBe(200);
    expect(res.body.salesMonth.total).toBe(100);
    expect(res.body.totalClients).toBe(1);
  });

  it('gráfico de faturamento não inclui vendas de outro tenant', async () => {
    await prisma.sale.create({
      data: { tenantId: tenantA.id, number: 1, userId: userA.id, status: 'COMPLETED', subtotal: 50, total: 50, paymentMethod: 'CASH' },
    });
    const userB = await prisma.user.findFirst({ where: { tenantId: tenantB.id } });
    await prisma.sale.create({
      data: { tenantId: tenantB.id, number: 1, userId: userB.id, status: 'COMPLETED', subtotal: 5000, total: 5000, paymentMethod: 'CASH' },
    });

    const res = await request(app).get('/api/dashboard/revenue-chart?period=7').set('Authorization', `Bearer ${tokenA}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(7);
    const total = res.body.reduce((s, d) => s + d.total, 0);
    expect(total).toBe(50);
  });

  it('vendas/clientes recentes e low-stock são isolados por tenant', async () => {
    await createProduct(tenantA.id, { name: 'Baixo A', stock: 1, minStock: 5 });
    await createProduct(tenantB.id, { name: 'Baixo B', stock: 1, minStock: 5 });
    await prisma.client.create({ data: { tenantId: tenantA.id, name: 'Recente A' } });
    await prisma.client.create({ data: { tenantId: tenantB.id, name: 'Recente B' } });

    const recentClients = await request(app).get('/api/dashboard/recent-clients').set('Authorization', `Bearer ${tokenA}`);
    expect(recentClients.body.every(c => c.name !== 'Recente B')).toBe(true);

    const lowStock = await request(app).get('/api/dashboard/low-stock').set('Authorization', `Bearer ${tokenA}`);
    expect(lowStock.body.some(p => p.name === 'Baixo A')).toBe(true);
    expect(lowStock.body.every(p => p.name !== 'Baixo B')).toBe(true);
  });
});
