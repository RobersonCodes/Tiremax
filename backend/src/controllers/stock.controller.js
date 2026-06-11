const prisma = require('../config/database');

const getMovements = async (req, res, next) => {
  try {
    const { page = 1, limit = 30, productId, type } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const where = { tenantId: req.tenantId };
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
  } catch (err) { next(err); }
};

const createMovement = async (req, res, next) => {
  try {
    const { productId, type, quantity, reason, reference, unitCost, notes } = req.body;

    const movement = await prisma.$transaction(async (tx) => {
      // Verifica se produto pertence ao tenant
      const product = await tx.product.findFirst({ where: { id: productId, tenantId: req.tenantId } });
      if (!product) throw new Error('Produto não encontrado');

      const mov = await tx.stockMovement.create({
        data: { tenantId: req.tenantId, productId, type, quantity: Number(quantity), reason, reference, unitCost, notes },
      });

      const increment = type === 'IN' ? Number(quantity) : -Number(quantity);
      await tx.product.update({ where: { id: productId }, data: { stock: { increment } } });

      return mov;
    });

    res.status(201).json(movement);
  } catch (err) { next(err); }
};



const getReport = async (req, res, next) => {
  try {
    const products = await prisma.product.findMany({
      where: { tenantId: req.tenantId, active: true },
      orderBy: { name: 'asc' },
      include: { category: { select: { name: true } } },
    });
    const totalValue = products.reduce((s, p) => s + p.stock * p.costPrice, 0);
    const lowStock = products.filter(p => p.stock <= p.minStock);
    res.json({ products, totalValue, lowStockCount: lowStock.length, totalProducts: products.length });
  } catch (err) { next(err); }
};
module.exports = { getMovements, createMovement, getReport };
