const prisma = require('../config/database');

const findAll = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, categoryId, active } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const where = { tenantId: req.tenantId };
    if (categoryId) where.categoryId = categoryId;
    if (active !== undefined) where.active = active === 'true';

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where, skip, take: parseInt(limit),
        orderBy: { name: 'asc' },
        include: { category: { select: { id: true, name: true } } },
      }),
      prisma.product.count({ where }),
    ]);
    res.json({ data: products, total, page: parseInt(page), limit: parseInt(limit) });
  } catch (err) { next(err); }
};

const search = async (req, res, next) => {
  try {
    const { q } = req.query;
    if (!q) return res.json([]);
    const products = await prisma.product.findMany({
      where: {
        tenantId: req.tenantId,
        OR: [
          { name: { contains: q, mode: 'insensitive' } },
          { code: { contains: q } },
          { barcode: { contains: q } },
        ],
        active: true,
      },
      take: 10,
      select: { id: true, name: true, code: true, salePrice: true, stock: true, unit: true },
    });
    res.json(products);
  } catch (err) { next(err); }
};

const findOne = async (req, res, next) => {
  try {
    const product = await prisma.product.findFirst({
      where: { id: req.params.id, tenantId: req.tenantId },
      include: { category: true },
    });
    if (!product) return res.status(404).json({ message: 'Produto não encontrado' });
    res.json(product);
  } catch (err) { next(err); }
};

const create = async (req, res, next) => {
  try {
    const product = await prisma.product.create({ data: { ...req.body, tenantId: req.tenantId } });
    res.status(201).json(product);
  } catch (err) { next(err); }
};

const update = async (req, res, next) => {
  try {
    await prisma.product.updateMany({ where: { id: req.params.id, tenantId: req.tenantId }, data: req.body });
    res.json(await prisma.product.findUnique({ where: { id: req.params.id } }));
  } catch (err) { next(err); }
};

const remove = async (req, res, next) => {
  try {
    await prisma.product.updateMany({ where: { id: req.params.id, tenantId: req.tenantId }, data: { active: false } });
    res.json({ message: 'Produto desativado' });
  } catch (err) { next(err); }
};

const lowStock = async (req, res, next) => {
  try {
    const products = await prisma.product.findMany({
      where: { tenantId: req.tenantId, active: true, stock: { lte: prisma.product.fields.minStock } },
      orderBy: { stock: 'asc' },
    });
    res.json(products);
  } catch (err) { next(err); }
};

module.exports = { findAll, search, findOne, create, update, remove, lowStock };
