const prisma = require('../config/database');

const getMetrics = async (req, res, next) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    const [salesToday, salesMonth, servicesOpen, servicesMonth, totalClients, newClientsMonth] =
      await Promise.all([
        prisma.sale.aggregate({
          where: { createdAt: { gte: today, lt: tomorrow }, status: 'COMPLETED' },
          _sum: { total: true }, _count: true,
        }),
        prisma.sale.aggregate({
          where: { createdAt: { gte: firstDayOfMonth }, status: 'COMPLETED' },
          _sum: { total: true }, _count: true,
        }),
        prisma.service.count({
          where: { status: { in: ['OPEN', 'IN_PROGRESS', 'WAITING_PARTS'] } },
        }),
        prisma.service.count({
          where: { createdAt: { gte: firstDayOfMonth }, status: 'COMPLETED' },
        }),
        prisma.client.count({ where: { active: true } }),
        prisma.client.count({ where: { createdAt: { gte: firstDayOfMonth }, active: true } }),
      ]);

    // SQLite-compatible low stock query
    const allProducts = await prisma.product.findMany({
      where: { active: true },
      select: { stock: true, minStock: true },
    });
    const lowStockCount = allProducts.filter(p => p.stock <= p.minStock).length;

    res.json({
      salesToday: { revenue: Number(salesToday._sum.total || 0), count: salesToday._count },
      salesMonth: { revenue: Number(salesMonth._sum.total || 0), count: salesMonth._count },
      servicesOpen,
      servicesMonth,
      totalClients,
      newClientsMonth,
      lowStockCount,
    });
  } catch (err) { next(err) }
};

const getRevenueChart = async (req, res, next) => {
  try {
    const { period = '7d' } = req.query;
    const days = period === '30d' ? 30 : period === '90d' ? 90 : 7;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    const [sales, services] = await Promise.all([
      prisma.sale.findMany({
        where: { createdAt: { gte: startDate }, status: 'COMPLETED' },
        select: { createdAt: true, total: true },
      }),
      prisma.service.findMany({
        where: { createdAt: { gte: startDate }, status: 'COMPLETED' },
        select: { createdAt: true, total: true },
      }),
    ]);

    // Group by date in JS (SQLite compatible)
    const groupByDate = (items) => {
      const map = {}
      items.forEach(item => {
        const date = item.createdAt.toISOString().split('T')[0]
        if (!map[date]) map[date] = { date, revenue: 0, count: 0 }
        map[date].revenue += Number(item.total)
        map[date].count++
      })
      return Object.values(map).sort((a, b) => a.date.localeCompare(b.date))
    }

    res.json({ sales: groupByDate(sales), services: groupByDate(services) });
  } catch (err) { next(err) }
};

const getRecentSales = async (req, res, next) => {
  try {
    const sales = await prisma.sale.findMany({
      take: 8,
      orderBy: { createdAt: 'desc' },
      where: { status: 'COMPLETED' },
      include: {
        client: { select: { id: true, name: true } },
        _count: { select: { items: true } },
      },
    });
    res.json(sales);
  } catch (err) { next(err) }
};

const getRecentClients = async (req, res, next) => {
  try {
    const clients = await prisma.client.findMany({
      take: 6,
      orderBy: { createdAt: 'desc' },
      where: { active: true },
      select: { id: true, name: true, phone: true, createdAt: true, _count: { select: { sales: true } } },
    });
    res.json(clients);
  } catch (err) { next(err) }
};

const getLowStock = async (req, res, next) => {
  try {
    const products = await prisma.product.findMany({
      where: { active: true },
      orderBy: { stock: 'asc' },
      take: 20,
      select: { id: true, code: true, name: true, stock: true, minStock: true, brand: true },
    });
    res.json(products.filter(p => p.stock <= p.minStock).slice(0, 8));
  } catch (err) { next(err) }
};

module.exports = { getMetrics, getRevenueChart, getRecentSales, getRecentClients, getLowStock };
