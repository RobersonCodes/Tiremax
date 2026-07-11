const prisma = require('../config/database');

const findAll = async (req, res, next) => {
  try {
    const { clientId } = req.query;
    const where = { tenantId: req.tenantId };
    if (clientId) where.clientId = clientId;
    const vehicles = await prisma.vehicle.findMany({
      where,
      include: { client: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'desc' },
    });
    res.json(vehicles);
  } catch (err) { next(err); }
};

const findOne = async (req, res, next) => {
  try {
    const vehicle = await prisma.vehicle.findFirst({
      where: { id: req.params.id, tenantId: req.tenantId },
      include: { client: true, services: { take: 10, orderBy: { createdAt: 'desc' } } },
    });
    if (!vehicle) return res.status(404).json({ message: 'Veículo não encontrado' });
    res.json(vehicle);
  } catch (err) { next(err); }
};

const create = async (req, res, next) => {
  try {
    const vehicle = await prisma.vehicle.create({ data: { ...req.body, tenantId: req.tenantId } });
    res.status(201).json(vehicle);
  } catch (err) { next(err); }
};

const update = async (req, res, next) => {
  try {
    const result = await prisma.vehicle.updateMany({ where: { id: req.params.id, tenantId: req.tenantId }, data: req.body });
    if (!result.count) return res.status(404).json({ message: 'Veículo não encontrado' });
    res.json(await prisma.vehicle.findUnique({ where: { id: req.params.id } }));
  } catch (err) { next(err); }
};

const remove = async (req, res, next) => {
  try {
    await prisma.vehicle.deleteMany({ where: { id: req.params.id, tenantId: req.tenantId } });
    res.json({ message: 'Veículo removido' });
  } catch (err) { next(err); }
};

module.exports = { findAll, findOne, create, update, remove };
