const prisma = require('../config/database');

const findAll = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, categoryId, active } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const where = {};
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
  } catch (err) { next(err) }
};

const search = async (req, res, next) => {
  try {
    const { q } = req.query;
    if (!q) return res.json([]);

    const products = await prisma.product.findMany({
      where: {
        OR: [
          { name: { contains: q } },
          { code: { contains: q } },
          { brand: { contains: q } },
        ],
        active: true,
      },
      take: 15,
      include: { category: { select: { name: true } } },
    });

    res.json(products);
  } catch (err) { next(err) }
};

const lowStock = async (req, res, next) => {
  try {
    const products = await prisma.product.findMany({
      where: { active: true },
      orderBy: { stock: 'asc' },
      include: { category: { select: { name: true } } },
    });
    res.json(products.filter(p => p.stock <= p.minStock));
  } catch (err) { next(err) }
};

const findOne = async (req, res, next) => {
  try {
    const product = await prisma.product.findUnique({
      where: { id: req.params.id },
      include: {
        category: true,
        stockMovements: { take: 10, orderBy: { createdAt: 'desc' } },
      },
    });
    if (!product) return res.status(404).json({ message: 'Produto não encontrado' });
    res.json(product);
  } catch (err) { next(err) }
};

const create = async (req, res, next) => {
  try {
    const product = await prisma.product.create({
      data: req.body,
      include: { category: true },
    });
    res.status(201).json(product);
  } catch (err) { next(err) }
};

const update = async (req, res, next) => {
  try {
    const product = await prisma.product.update({
      where: { id: req.params.id },
      data: req.body,
      include: { category: true },
    });
    res.json(product);
  } catch (err) { next(err) }
};

const remove = async (req, res, next) => {
  try {
    await prisma.product.update({ where: { id: req.params.id }, data: { active: false } });
    res.json({ message: 'Produto desativado com sucesso' });
  } catch (err) { next(err) }
};

module.exports = { findAll, search, lowStock, findOne, create, update, remove };
