const prisma = require('../config/database');

const getNextNumber = async (tenantId) => {
  const last = await prisma.sale.findFirst({
    where: { tenantId },
    orderBy: { number: 'desc' },
    select: { number: true },
  });
  return (last?.number || 0) + 1;
};

const findAll = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status, startDate, endDate } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const where = { tenantId: req.tenantId };
    if (status) where.status = status;
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }
    const [sales, total] = await Promise.all([
      prisma.sale.findMany({
        where, skip, take: parseInt(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          client: { select: { id: true, name: true } },
          user: { select: { id: true, name: true } },
          _count: { select: { items: true } },
        },
      }),
      prisma.sale.count({ where }),
    ]);
    res.json({ data: sales, total, page: parseInt(page), limit: parseInt(limit) });
  } catch (err) { next(err); }
};

const findOne = async (req, res, next) => {
  try {
    const sale = await prisma.sale.findFirst({
      where: { id: req.params.id, tenantId: req.tenantId },
      include: {
        client: true,
        user: { select: { id: true, name: true } },
        items: { include: { product: { select: { id: true, name: true, unit: true } } } },
        payments: true,
      },
    });
    if (!sale) return res.status(404).json({ message: 'Venda não encontrada' });
    res.json(sale);
  } catch (err) { next(err); }
};

const create = async (req, res, next) => {
  try {
    const { clientId, items, discount = 0, paymentMethod, notes, payments } = req.body;
    const number = await getNextNumber(req.tenantId);

    const sale = await prisma.$transaction(async (tx) => {
      const subtotal = items.reduce((s, i) => s + i.unitPrice * i.quantity, 0);
      const total = subtotal - discount;

      const s = await tx.sale.create({
        data: {
          tenantId: req.tenantId,
          number,
          clientId,
          userId: req.user.id,
          status: 'COMPLETED',
          subtotal,
          discount,
          total,
          paymentMethod,
          notes,
          items: {
            create: items.map(i => ({
              productId: i.productId,
              quantity: i.quantity,
              unitPrice: i.unitPrice,
              discount: i.discount || 0,
              total: i.unitPrice * i.quantity - (i.discount || 0),
            })),
          },
        },
        include: { items: true },
      });

      // Atualiza estoque
      for (const item of items) {
        await tx.product.updateMany({
          where: { id: item.productId, tenantId: req.tenantId },
          data: { stock: { decrement: item.quantity } },
        });
        await tx.stockMovement.create({
          data: {
            tenantId: req.tenantId,
            productId: item.productId,
            type: 'OUT',
            quantity: item.quantity,
            reason: 'SALE',
            reference: `VENDA #${number}`,
          },
        });
      }

      // Registra pagamentos
      if (payments?.length) {
        await tx.payment.createMany({
          data: payments.map(p => ({
            tenantId: req.tenantId,
            saleId: s.id,
            method: p.method,
            amount: p.amount,
            reference: p.reference,
          })),
        });
      }

      return s;
    });

    res.status(201).json(sale);
  } catch (err) { next(err); }
};

const cancel = async (req, res, next) => {
  try {
    await prisma.sale.updateMany({
      where: { id: req.params.id, tenantId: req.tenantId },
      data: { status: 'CANCELLED' },
    });
    res.json({ message: 'Venda cancelada' });
  } catch (err) { next(err); }
};



const updateStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    await prisma.sale.updateMany({ where: { id: req.params.id, tenantId: req.tenantId }, data: { status } });
    res.json({ message: 'Status atualizado' });
  } catch (err) { next(err); }
};
module.exports = { findAll, findOne, create, updateStatus, cancel };
