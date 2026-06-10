const prisma = require('../config/database');

const getReceivable = async (req, res, next) => {
  try {
    const { status } = req.query;
    const where = status ? { status } : {};
    const items = await prisma.accountReceivable.findMany({
      where,
      orderBy: { dueDate: 'asc' },
    });
    res.json(items);
  } catch (err) {
    next(err);
  }
};

const createReceivable = async (req, res, next) => {
  try {
    const item = await prisma.accountReceivable.create({ data: req.body });
    res.status(201).json(item);
  } catch (err) {
    next(err);
  }
};

const payReceivable = async (req, res, next) => {
  try {
    const { paidAmount } = req.body;
    const item = await prisma.accountReceivable.update({
      where: { id: req.params.id },
      data: { status: 'PAID', paidAt: new Date(), paidAmount: Number(paidAmount) },
    });
    res.json(item);
  } catch (err) {
    next(err);
  }
};

const getPayable = async (req, res, next) => {
  try {
    const { status } = req.query;
    const where = status ? { status } : {};
    const items = await prisma.accountPayable.findMany({
      where,
      orderBy: { dueDate: 'asc' },
    });
    res.json(items);
  } catch (err) {
    next(err);
  }
};

const createPayable = async (req, res, next) => {
  try {
    const item = await prisma.accountPayable.create({ data: req.body });
    res.status(201).json(item);
  } catch (err) {
    next(err);
  }
};

const payPayable = async (req, res, next) => {
  try {
    const { paidAmount } = req.body;
    const item = await prisma.accountPayable.update({
      where: { id: req.params.id },
      data: { status: 'PAID', paidAt: new Date(), paidAmount: Number(paidAmount) },
    });
    res.json(item);
  } catch (err) {
    next(err);
  }
};

const getCashflow = async (req, res, next) => {
  try {
    const { month, year } = req.query;
    const m = parseInt(month) || new Date().getMonth() + 1;
    const y = parseInt(year) || new Date().getFullYear();

    const start = new Date(y, m - 1, 1);
    const end = new Date(y, m, 0, 23, 59, 59);

    const [salesRevenue, servicesRevenue, payables] = await Promise.all([
      prisma.sale.aggregate({
        where: { createdAt: { gte: start, lte: end }, status: 'COMPLETED' },
        _sum: { total: true },
      }),
      prisma.service.aggregate({
        where: { createdAt: { gte: start, lte: end }, status: 'COMPLETED' },
        _sum: { total: true },
      }),
      prisma.accountPayable.aggregate({
        where: { dueDate: { gte: start, lte: end }, status: 'PAID' },
        _sum: { paidAmount: true },
      }),
    ]);

    const totalIncome =
      Number(salesRevenue._sum.total || 0) + Number(servicesRevenue._sum.total || 0);
    const totalExpenses = Number(payables._sum.paidAmount || 0);

    res.json({
      income: totalIncome,
      expenses: totalExpenses,
      balance: totalIncome - totalExpenses,
      salesRevenue: Number(salesRevenue._sum.total || 0),
      servicesRevenue: Number(servicesRevenue._sum.total || 0),
    });
  } catch (err) {
    next(err);
  }
};

const getSummary = async (req, res, next) => {
  try {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);

    const [totalReceivable, totalPayable, overdueReceivable, overduePayable] = await Promise.all([
      prisma.accountReceivable.aggregate({
        where: { status: 'PENDING' },
        _sum: { amount: true },
      }),
      prisma.accountPayable.aggregate({
        where: { status: 'PENDING' },
        _sum: { amount: true },
      }),
      prisma.accountReceivable.count({
        where: { status: 'PENDING', dueDate: { lt: now } },
      }),
      prisma.accountPayable.count({
        where: { status: 'PENDING', dueDate: { lt: now } },
      }),
    ]);

    res.json({
      totalReceivable: Number(totalReceivable._sum.amount || 0),
      totalPayable: Number(totalPayable._sum.amount || 0),
      overdueReceivable,
      overduePayable,
      netBalance:
        Number(totalReceivable._sum.amount || 0) - Number(totalPayable._sum.amount || 0),
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getReceivable,
  createReceivable,
  payReceivable,
  getPayable,
  createPayable,
  payPayable,
  getCashflow,
  getSummary,
};
