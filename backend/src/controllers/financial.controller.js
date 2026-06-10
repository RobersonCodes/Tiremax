const prisma = require('../config/database');

const getReceivable = async (req, res, next) => {
  try {
    const { status } = req.query;
    const where = { tenantId: req.tenantId };
    if (status) where.status = status;
    res.json(await prisma.accountReceivable.findMany({ where, orderBy: { dueDate: 'asc' } }));
  } catch (err) { next(err); }
};

const createReceivable = async (req, res, next) => {
  try {
    res.status(201).json(await prisma.accountReceivable.create({ data: { ...req.body, tenantId: req.tenantId } }));
  } catch (err) { next(err); }
};

const payReceivable = async (req, res, next) => {
  try {
    const { paidAmount } = req.body;
    const item = await prisma.accountReceivable.findFirst({ where: { id: req.params.id, tenantId: req.tenantId } });
    if (!item) return res.status(404).json({ message: 'Registro não encontrado' });
    res.json(await prisma.accountReceivable.update({
      where: { id: req.params.id },
      data: { paidAmount, paidAt: new Date(), status: 'PAID' },
    }));
  } catch (err) { next(err); }
};

const deleteReceivable = async (req, res, next) => {
  try {
    await prisma.accountReceivable.deleteMany({ where: { id: req.params.id, tenantId: req.tenantId } });
    res.json({ message: 'Removido' });
  } catch (err) { next(err); }
};

const getPayable = async (req, res, next) => {
  try {
    const { status } = req.query;
    const where = { tenantId: req.tenantId };
    if (status) where.status = status;
    res.json(await prisma.accountPayable.findMany({ where, orderBy: { dueDate: 'asc' } }));
  } catch (err) { next(err); }
};

const createPayable = async (req, res, next) => {
  try {
    res.status(201).json(await prisma.accountPayable.create({ data: { ...req.body, tenantId: req.tenantId } }));
  } catch (err) { next(err); }
};

const payPayable = async (req, res, next) => {
  try {
    const { paidAmount } = req.body;
    const item = await prisma.accountPayable.findFirst({ where: { id: req.params.id, tenantId: req.tenantId } });
    if (!item) return res.status(404).json({ message: 'Registro não encontrado' });
    res.json(await prisma.accountPayable.update({
      where: { id: req.params.id },
      data: { paidAmount, paidAt: new Date(), status: 'PAID' },
    }));
  } catch (err) { next(err); }
};

const deletePayable = async (req, res, next) => {
  try {
    await prisma.accountPayable.deleteMany({ where: { id: req.params.id, tenantId: req.tenantId } });
    res.json({ message: 'Removido' });
  } catch (err) { next(err); }
};

const getSummary = async (req, res, next) => {
  try {
    const tid = req.tenantId;
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);

    const [salesMonth, receivablePending, payablePending, overdueReceivable, overduePayable] = await Promise.all([
      prisma.sale.aggregate({ where: { tenantId: tid, status: 'COMPLETED', createdAt: { gte: firstDay } }, _sum: { total: true } }),
      prisma.accountReceivable.aggregate({ where: { tenantId: tid, status: 'PENDING' }, _sum: { amount: true } }),
      prisma.accountPayable.aggregate({ where: { tenantId: tid, status: 'PENDING' }, _sum: { amount: true } }),
      prisma.accountReceivable.count({ where: { tenantId: tid, status: 'PENDING', dueDate: { lt: now } } }),
      prisma.accountPayable.count({ where: { tenantId: tid, status: 'PENDING', dueDate: { lt: now } } }),
    ]);

    res.json({
      salesMonth: salesMonth._sum.total || 0,
      receivablePending: receivablePending._sum.amount || 0,
      payablePending: payablePending._sum.amount || 0,
      overdueReceivable,
      overduePayable,
    });
  } catch (err) { next(err); }
};

module.exports = { getReceivable, createReceivable, payReceivable, deleteReceivable, getPayable, createPayable, payPayable, deletePayable, getSummary };
