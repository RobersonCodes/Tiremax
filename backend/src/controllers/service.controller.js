const prisma = require('../config/database')

const getNextNumber = async () => {
  const last = await prisma.service.findFirst({ orderBy: { number: 'desc' }, select: { number: true } })
  return (last?.number || 0) + 1
}

const findAll = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status, clientId } = req.query
    const skip = (parseInt(page) - 1) * parseInt(limit)
    const where = {}
    if (status) where.status = status
    if (clientId) where.clientId = clientId
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
    ])
    res.json({ data: services, total, page: parseInt(page), limit: parseInt(limit) })
  } catch (err) { next(err) }
}

const findOne = async (req, res, next) => {
  try {
    const service = await prisma.service.findUnique({
      where: { id: req.params.id },
      include: {
        client: true, vehicle: true,
        createdBy: { select: { id: true, name: true } },
        assignedTo: { select: { id: true, name: true } },
        items: { include: { product: true } },
        invoice: true,
      },
    })
    if (!service) return res.status(404).json({ message: 'Serviço não encontrado' })
    res.json(service)
  } catch (err) { next(err) }
}

const create = async (req, res, next) => {
  try {
    const { clientId, vehicleId, assignedToId, type, description, diagnosis, laborCost, items, estimatedAt, notes } = req.body
    let partsCost = 0
    const enrichedItems = []
    if (items && items.length > 0) {
      for (const item of items) {
        partsCost += Number(item.unitPrice) * Number(item.quantity)
        enrichedItems.push({ productId: item.productId || null, description: item.description, quantity: Number(item.quantity), unitPrice: Number(item.unitPrice), total: Number(item.unitPrice) * Number(item.quantity) })
      }
    }
    const total = Number(laborCost || 0) + partsCost
    const number = await getNextNumber()
    const service = await prisma.service.create({
      data: {
        number, clientId, vehicleId: vehicleId || null,
        createdById: req.user.id, assignedToId: assignedToId || null,
        type, description, diagnosis,
        laborCost: Number(laborCost || 0), partsCost, total,
        estimatedAt: estimatedAt ? new Date(estimatedAt) : null, notes,
        items: { create: enrichedItems },
      },
      include: { client: true, vehicle: true, items: true },
    })
    res.status(201).json(service)
  } catch (err) { next(err) }
}

const update = async (req, res, next) => {
  try {
    const { items, ...data } = req.body
    const service = await prisma.service.update({ where: { id: req.params.id }, data })
    res.json(service)
  } catch (err) { next(err) }
}

const updateStatus = async (req, res, next) => {
  try {
    const data = { status: req.body.status }
    if (req.body.status === 'COMPLETED') data.completedAt = new Date()
    const service = await prisma.service.update({ where: { id: req.params.id }, data })
    res.json(service)
  } catch (err) { next(err) }
}

const remove = async (req, res, next) => {
  try {
    await prisma.service.update({ where: { id: req.params.id }, data: { status: 'CANCELLED' } })
    res.json({ message: 'Serviço cancelado com sucesso' })
  } catch (err) { next(err) }
}

module.exports = { findAll, findOne, create, update, updateStatus, remove }
