const prisma = require('../config/database')

const getNextNumber = async (model) => {
  const last = await prisma[model].findFirst({ orderBy: { number: 'desc' }, select: { number: true } })
  return (last?.number || 0) + 1
}

const findAll = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status, startDate, endDate } = req.query
    const skip = (parseInt(page) - 1) * parseInt(limit)
    const where = {}
    if (status) where.status = status
    if (startDate || endDate) {
      where.createdAt = {}
      if (startDate) where.createdAt.gte = new Date(startDate)
      if (endDate) where.createdAt.lte = new Date(endDate)
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
    ])
    res.json({ data: sales, total, page: parseInt(page), limit: parseInt(limit) })
  } catch (err) { next(err) }
}

const findOne = async (req, res, next) => {
  try {
    const sale = await prisma.sale.findUnique({
      where: { id: req.params.id },
      include: {
        client: true,
        user: { select: { id: true, name: true } },
        items: { include: { product: { select: { id: true, name: true, code: true, unit: true } } } },
        payments: true,
        invoice: true,
      },
    })
    if (!sale) return res.status(404).json({ message: 'Venda não encontrada' })
    res.json(sale)
  } catch (err) { next(err) }
}

const create = async (req, res, next) => {
  try {
    const { clientId, items, discount = 0, paymentMethod, notes } = req.body
    if (!items || items.length === 0) return res.status(400).json({ message: 'A venda deve ter pelo menos um item' })

    const productIds = items.map(i => i.productId)
    const products = await prisma.product.findMany({ where: { id: { in: productIds }, active: true } })

    let subtotal = 0
    const enrichedItems = items.map(item => {
      const product = products.find(p => p.id === item.productId)
      if (!product) throw { statusCode: 400, message: `Produto não encontrado` }
      if (product.stock < item.quantity) throw { statusCode: 400, message: `Estoque insuficiente para ${product.name}` }
      const unitPrice = Number(product.salePrice)
      const itemDiscount = Number(item.discount || 0)
      const total = (unitPrice * item.quantity) - itemDiscount
      subtotal += total
      return { productId: item.productId, quantity: item.quantity, unitPrice, discount: itemDiscount, total }
    })

    const total = subtotal - Number(discount)
    const number = await getNextNumber('sale')

    const sale = await prisma.$transaction(async (tx) => {
      const newSale = await tx.sale.create({
        data: {
          number,
          clientId: clientId || null,
          userId: req.user.id,
          status: 'COMPLETED',
          subtotal, discount: Number(discount), total,
          paymentMethod, notes,
          items: { create: enrichedItems },
          payments: { create: [{ method: paymentMethod, amount: total }] },
        },
        include: { items: { include: { product: true } }, client: true },
      })
      for (const item of enrichedItems) {
        await tx.product.update({ where: { id: item.productId }, data: { stock: { decrement: item.quantity } } })
        await tx.stockMovement.create({
          data: { productId: item.productId, type: 'OUT', quantity: item.quantity, reason: 'SALE', reference: `VENDA #${number}` },
        })
      }
      return newSale
    })

    res.status(201).json(sale)
  } catch (err) { next(err) }
}

const updateStatus = async (req, res, next) => {
  try {
    const sale = await prisma.sale.update({ where: { id: req.params.id }, data: { status: req.body.status } })
    res.json(sale)
  } catch (err) { next(err) }
}

const cancel = async (req, res, next) => {
  try {
    const sale = await prisma.$transaction(async (tx) => {
      const existing = await tx.sale.findUnique({ where: { id: req.params.id }, include: { items: true } })
      if (!existing) throw { statusCode: 404, message: 'Venda não encontrada' }
      if (existing.status === 'CANCELLED') throw { statusCode: 400, message: 'Venda já cancelada' }
      for (const item of existing.items) {
        await tx.product.update({ where: { id: item.productId }, data: { stock: { increment: item.quantity } } })
        await tx.stockMovement.create({
          data: { productId: item.productId, type: 'IN', quantity: item.quantity, reason: 'SALE_CANCEL', reference: `CANCELAMENTO #${existing.number}` },
        })
      }
      return tx.sale.update({ where: { id: req.params.id }, data: { status: 'CANCELLED' } })
    })
    res.json(sale)
  } catch (err) { next(err) }
}

module.exports = { findAll, findOne, create, updateStatus, cancel }
