const prisma = require('../config/database');

const findAll = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, active } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const where = { tenantId: req.tenantId };
    if (active !== undefined) where.active = active === 'true';

    const [clients, total] = await Promise.all([
      prisma.client.findMany({
        where, skip, take: parseInt(limit),
        orderBy: { name: 'asc' },
        include: { _count: { select: { sales: true, services: true } } },
      }),
      prisma.client.count({ where }),
    ]);
    res.json({ data: clients, total, page: parseInt(page), limit: parseInt(limit) });
  } catch (err) { next(err); }
};

const search = async (req, res, next) => {
  try {
    const { q } = req.query;
    if (!q) return res.json([]);
    const clients = await prisma.client.findMany({
      where: {
        tenantId: req.tenantId,
        OR: [
          { name: { contains: q, mode: 'insensitive' } },
          { document: { contains: q } },
          { phone: { contains: q } },
          { email: { contains: q } },
        ],
        active: true,
      },
      take: 10,
      select: { id: true, name: true, document: true, phone: true, whatsapp: true, email: true },
    });
    res.json(clients);
  } catch (err) { next(err); }
};

const findOne = async (req, res, next) => {
  try {
    const client = await prisma.client.findFirst({
      where: { id: req.params.id, tenantId: req.tenantId },
      include: {
        vehicles: true,
        sales: { take: 5, orderBy: { createdAt: 'desc' }, select: { id: true, number: true, total: true, status: true, createdAt: true } },
        services: { take: 5, orderBy: { createdAt: 'desc' }, select: { id: true, number: true, type: true, status: true, total: true, createdAt: true } },
      },
    });
    if (!client) return res.status(404).json({ message: 'Cliente não encontrado' });
    res.json(client);
  } catch (err) { next(err); }
};

const create = async (req, res, next) => {
  try {
    const client = await prisma.client.create({ data: { ...req.body, tenantId: req.tenantId } });
    res.status(201).json(client);
  } catch (err) { next(err); }
};

const update = async (req, res, next) => {
  try {
    const client = await prisma.client.updateMany({
      where: { id: req.params.id, tenantId: req.tenantId },
      data: req.body,
    });
    if (!client.count) return res.status(404).json({ message: 'Cliente não encontrado' });
    res.json(await prisma.client.findUnique({ where: { id: req.params.id } }));
  } catch (err) { next(err); }
};

const remove = async (req, res, next) => {
  try {
    await prisma.client.updateMany({
      where: { id: req.params.id, tenantId: req.tenantId },
      data: { active: false },
    });
    res.json({ message: 'Cliente desativado com sucesso' });
  } catch (err) { next(err); }
};

const getHistory = async (req, res, next) => {
  try {
    const [sales, services] = await Promise.all([
      prisma.sale.findMany({
        where: { clientId: req.params.id, tenantId: req.tenantId },
        orderBy: { createdAt: 'desc' },
        include: { items: { include: { product: { select: { name: true } } } } },
      }),
      prisma.service.findMany({
        where: { clientId: req.params.id, tenantId: req.tenantId },
        orderBy: { createdAt: 'desc' },
        include: { vehicle: true, items: true },
      }),
    ]);
    res.json({ sales, services });
  } catch (err) { next(err); }
};

module.exports = { findAll, search, findOne, create, update, remove, getHistory };
