const prisma = require('../config/database');

const getNextNumber = async (tenantId) => {
  const last = await prisma.service.findFirst({
    where: { tenantId },
    orderBy: { number: 'desc' },
    select: { number: true },
  });
  return (last?.number || 0) + 1;
};

const findAll = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status, clientId } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const where = { tenantId: req.tenantId };
    if (status) where.status = status;
    if (clientId) where.clientId = clientId;

    const [services, total] = await Promise.all([
      prisma.service.findMany({
        where, skip, take: parseInt(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          client: { select: { id: true, name: true, phone: true } },
          vehicle: true,
          assignedTo: { select: { id: true, name: true } },
        },
      }),
      prisma.service.count({ where }),
    ]);
    res.json({ data: services, total, page: parseInt(page), limit: parseInt(limit) });
  } catch (err) { next(err); }
};

const findOne = async (req, res, next) => {
  try {
    const service = await prisma.service.findFirst({
      where: { id: req.params.id, tenantId: req.tenantId },
      include: {
        client: true,
        vehicle: true,
        createdBy: { select: { id: true, name: true } },
        assignedTo: { select: { id: true, name: true } },
        items: { include: { product: { select: { id: true, name: true, unit: true } } } },
        invoice: true,
      },
    });
    if (!service) return res.status(404).json({ message: 'Ordem de serviço não encontrada' });
    res.json(service);
  } catch (err) { next(err); }
};

const create = async (req, res, next) => {
  try {
    const number = await getNextNumber(req.tenantId);
    const { items, ...data } = req.body;

    const service = await prisma.service.create({
      data: {
        ...data,
        tenantId: req.tenantId,
        number,
        createdById: req.user.id,
        items: items?.length ? { create: items } : undefined,
      },
      include: { items: true, client: true, vehicle: true },
    });
    res.status(201).json(service);
  } catch (err) { next(err); }
};

const update = async (req, res, next) => {
  try {
    const { items, ...data } = req.body;
    await prisma.service.updateMany({
      where: { id: req.params.id, tenantId: req.tenantId },
      data,
    });
    res.json(await prisma.service.findUnique({
      where: { id: req.params.id },
      include: { items: true, client: true, vehicle: true },
    }));
  } catch (err) { next(err); }
};

const updateStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const data = { status };
    if (status === 'COMPLETED') data.completedAt = new Date();

    await prisma.service.updateMany({
      where: { id: req.params.id, tenantId: req.tenantId },
      data,
    });
    res.json({ message: 'Status atualizado' });
  } catch (err) { next(err); }
};



const remove = async (req, res, next) => {
  try {
    await prisma.service.updateMany({ where: { id: req.params.id, tenantId: req.tenantId }, data: { status: 'CANCELLED' } });
    res.json({ message: 'Ordem cancelada' });
  } catch (err) { next(err); }
};
module.exports = { findAll, findOne, create, update, updateStatus, remove };
