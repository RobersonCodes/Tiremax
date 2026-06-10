const prisma = require('../config/database');

const getMovements = async (req, res, next) => {
  try {
    const { page = 1, limit = 30, productId, type } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const where = {};
    if (productId) where.productId = productId;
    if (type) where.type = type;

    const [movements, total] = await Promise.all([
      prisma.stockMovement.findMany({
        where, skip, take: parseInt(limit),
        orderBy: { createdAt: 'desc' },
        include: { product: { select: { id: true, name: true, code: true, unit: true } } },
      }),
      prisma.stockMovement.count({ where }),
    ]);

    res.json({ data: movements, total, page: parseInt(page), limit: parseInt(limit) });
  } catch (err) { next(err) }
};

const createMovement = async (req, res, next) => {
  try {
    const { productId, type, quantity, reason, reference, unitCost, notes } = req.body;

    const movement = await prisma.$transaction(async (tx) => {
      const mov = await tx.stockMovement.create({
        data: { productId, type, quantity: Number(quantity), reason, reference, unitCost, notes },
      });

      if (type === 'IN') {
        await tx.product.update({ where: { id: productId }, data: { stock: { increment: Number(quantity) } } });
      } else if (type === 'OUT') {
        await tx.product.update({ where: { id: productId }, data: { stock: { decrement: Number(quantity) } } });
      } else if (type === 'ADJUSTMENT') {
        await tx.product.update({ where: { id: productId }, data: { stock: Number(quantity) } });
      }

      return mov;
    });

    res.status(201).json(movement);
  } catch (err) { next(err) }
};

const getReport = async (req, res, next) => {
  try {
    const products = await prisma.product.findMany({
      where: { active: true },
      orderBy: { name: 'asc' },
      include: { category: { select: { name: true } } },
    });

    const enriched = products.map(p => ({
      ...p,
      totalValue: p.stock * p.costPrice,
      categoryName: p.category?.name || null,
    }));

    const totals = {
      _sum: { stock: enriched.reduce((a, p) => a + p.stock, 0) },
      _count: enriched.length,
    };

    res.json({ products: enriched, totals });
  } catch (err) { next(err) }
};

module.exports = { getMovements, createMovement, getReport };
