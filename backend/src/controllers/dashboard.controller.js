const prisma = require('../config/database');

const getMetrics = async (req, res, next) => {
  try {
    const tid = req.tenantId;
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    const [salesToday, salesMonth, servicesOpen, servicesMonth, totalClients, newClientsMonth] =
      await Promise.all([
        prisma.sale.aggregate({ where: { tenantId: tid, createdAt: { gte: today, lt: tomorrow }, status: 'COMPLETED' }, _sum: { total: true }, _count: true }),
        prisma.sale.aggregate({ where: { tenantId: tid, createdAt: { gte: firstDayOfMonth }, status: 'COMPLETED' }, _sum: { total: true }, _count: true }),
        prisma.service.count({ where: { tenantId: tid, status: { in: ['OPEN', 'IN_PROGRESS', 'WAITING_PARTS'] } } }),
        prisma.service.count({ where: { tenantId: tid, createdAt: { gte: firstDayOfMonth }, status: 'COMPLETED' } }),
        prisma.client.count({ where: { tenantId: tid, active: true } }),
        prisma.client.count({ where: { tenantId: tid, createdAt: { gte: firstDayOfMonth }, active: true } }),
      ]);

    const avgTicket = salesMonth._count > 0 ? (salesMonth._sum.total || 0) / salesMonth._count : 0;

    const [lowStockProducts, recentServices] = await Promise.all([
      prisma.product.findMany({ where: { tenantId: tid, active: true }, orderBy: { stock: 'asc' }, take: 5, select: { id: true, name: true, stock: true, minStock: true, unit: true } }).then(ps => ps.filter(p => p.stock <= p.minStock)),
      prisma.service.findMany({ where: { tenantId: tid }, orderBy: { createdAt: 'desc' }, take: 5, include: { client: { select: { name: true } }, vehicle: { select: { plate: true, model: true } } } }),
    ]);

    res.json({
      salesToday: { total: salesToday._sum.total || 0, count: salesToday._count },
      salesMonth: { total: salesMonth._sum.total || 0, count: salesMonth._count },
      servicesOpen, servicesMonth, totalClients, newClientsMonth, avgTicket,
      lowStockProducts, recentServices,
    });
  } catch (err) { next(err); }
};

const getRevenueChart = async (req, res, next) => {
  try {
    const { period = '7' } = req.query;
    const days = parseInt(period);
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const sales = await prisma.sale.findMany({
      where: { tenantId: req.tenantId, status: 'COMPLETED', createdAt: { gte: startDate } },
      select: { createdAt: true, total: true },
      orderBy: { createdAt: 'asc' },
    });
    const grouped = {};
    sales.forEach(s => {
      const day = s.createdAt.toISOString().split('T')[0];
      grouped[day] = (grouped[day] || 0) + s.total;
    });
    const result = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      const key = d.toISOString().split('T')[0];
      result.push({ date: key, total: grouped[key] || 0 });
    }
    res.json(result);
  } catch (err) { next(err); }
};

const getRecentSales = async (req, res, next) => {
  try {
    const sales = await prisma.sale.findMany({
      where: { tenantId: req.tenantId },
      orderBy: { createdAt: 'desc' }, take: 5,
      include: { client: { select: { name: true } }, user: { select: { name: true } } },
    });
    res.json(sales);
  } catch (err) { next(err); }
};

const getRecentClients = async (req, res, next) => {
  try {
    const clients = await prisma.client.findMany({
      where: { tenantId: req.tenantId, active: true },
      orderBy: { createdAt: 'desc' }, take: 5,
      select: { id: true, name: true, phone: true, createdAt: true },
    });
    res.json(clients);
  } catch (err) { next(err); }
};

const getLowStock = async (req, res, next) => {
  try {
    const products = await prisma.product.findMany({
      where: { tenantId: req.tenantId, active: true },
      orderBy: { stock: 'asc' }, take: 10,
      select: { id: true, name: true, code: true, stock: true, minStock: true, unit: true },
    });
    res.json(products.filter(p => p.stock <= p.minStock));
  } catch (err) { next(err); }
};

module.exports = { getMetrics, getRevenueChart, getRecentSales, getRecentClients, getLowStock };
