const prisma = require('../config/database');

const getMetrics = async (req, res, next) => {
  try {
    const tid = req.tenantId;
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    const [salesToday, salesMonth, servicesOpen, servicesMonth, totalClients, newClientsMonth,
           lowStockProducts, recentServices, salesChart] = await Promise.all([
      prisma.sale.aggregate({ where: { tenantId: tid, createdAt: { gte: today, lt: tomorrow }, status: 'COMPLETED' }, _sum: { total: true }, _count: true }),
      prisma.sale.aggregate({ where: { tenantId: tid, createdAt: { gte: firstDayOfMonth }, status: 'COMPLETED' }, _sum: { total: true }, _count: true }),
      prisma.service.count({ where: { tenantId: tid, status: { in: ['OPEN', 'IN_PROGRESS', 'WAITING_PARTS'] } } }),
      prisma.service.count({ where: { tenantId: tid, createdAt: { gte: firstDayOfMonth }, status: 'COMPLETED' } }),
      prisma.client.count({ where: { tenantId: tid, active: true } }),
      prisma.client.count({ where: { tenantId: tid, createdAt: { gte: firstDayOfMonth }, active: true } }),
      prisma.product.findMany({ where: { tenantId: tid, active: true }, orderBy: { stock: 'asc' }, take: 5, select: { id: true, name: true, stock: true, minStock: true, unit: true } }).then(ps => ps.filter(p => p.stock <= p.minStock)),
      prisma.service.findMany({ where: { tenantId: tid }, orderBy: { createdAt: 'desc' }, take: 5, include: { client: { select: { name: true } }, vehicle: { select: { plate: true, model: true } } } }),
      prisma.sale.groupBy({ by: ['createdAt'], where: { tenantId: tid, status: 'COMPLETED', createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } }, _sum: { total: true } }),
    ]);

    const avgTicket = salesMonth._count > 0 ? (salesMonth._sum.total || 0) / salesMonth._count : 0;

    res.json({
      salesToday: { total: salesToday._sum.total || 0, count: salesToday._count },
      salesMonth: { total: salesMonth._sum.total || 0, count: salesMonth._count },
      servicesOpen,
      servicesMonth,
      totalClients,
      newClientsMonth,
      avgTicket,
      lowStockProducts,
      recentServices,
      salesChart,
    });
  } catch (err) { next(err); }
};

module.exports = { getMetrics };
