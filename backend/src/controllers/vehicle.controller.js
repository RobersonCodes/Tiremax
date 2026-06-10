const prisma = require('../config/database');

const findAll = async (req, res, next) => {
  try {
    const { clientId } = req.query;
    const where = clientId ? { clientId } : {};
    const vehicles = await prisma.vehicle.findMany({
      where,
      include: { client: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'desc' },
    });
    res.json(vehicles);
  } catch (err) {
    next(err);
  }
};

const findOne = async (req, res, next) => {
  try {
    const vehicle = await prisma.vehicle.findUnique({
      where: { id: req.params.id },
      include: { client: true, services: { take: 10, orderBy: { createdAt: 'desc' } } },
    });
    if (!vehicle) return res.status(404).json({ message: 'Veículo não encontrado' });
    res.json(vehicle);
  } catch (err) {
    next(err);
  }
};

const create = async (req, res, next) => {
  try {
    const vehicle = await prisma.vehicle.create({ data: req.body });
    res.status(201).json(vehicle);
  } catch (err) {
    next(err);
  }
};

const update = async (req, res, next) => {
  try {
    const vehicle = await prisma.vehicle.update({
      where: { id: req.params.id },
      data: req.body,
    });
    res.json(vehicle);
  } catch (err) {
    next(err);
  }
};

const remove = async (req, res, next) => {
  try {
    await prisma.vehicle.delete({ where: { id: req.params.id } });
    res.json({ message: 'Veículo removido com sucesso' });
  } catch (err) {
    next(err);
  }
};

module.exports = { findAll, findOne, create, update, remove };
