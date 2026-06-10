const prisma = require('../config/database');

const findAll = async (req, res, next) => {
  try {
    const invoices = await prisma.invoice.findMany({
      orderBy: { createdAt: 'desc' },
      include: { client: { select: { id: true, name: true } } },
    });
    res.json(invoices);
  } catch (err) {
    next(err);
  }
};

const findOne = async (req, res, next) => {
  try {
    const invoice = await prisma.invoice.findUnique({
      where: { id: req.params.id },
      include: { client: true, sale: true, service: true },
    });
    if (!invoice) return res.status(404).json({ message: 'Nota fiscal não encontrada' });
    res.json(invoice);
  } catch (err) {
    next(err);
  }
};

// Placeholder for NFS-e integration
const issue = async (req, res, next) => {
  try {
    const { saleId, serviceId, clientId, amount } = req.body;

    if (!process.env.FISCAL_ENABLED || process.env.FISCAL_ENABLED !== 'true') {
      return res.status(503).json({
        message: 'Módulo fiscal não configurado. Configure as variáveis FISCAL_* no .env',
      });
    }

    // Integration point for NFS-e provider
    // Each municipality has its own API
    // This is the abstraction layer ready to be implemented
    const invoice = await prisma.invoice.create({
      data: {
        saleId: saleId || null,
        serviceId: serviceId || null,
        clientId,
        status: 'DRAFT',
        amount: Number(amount),
      },
    });

    res.status(201).json(invoice);
  } catch (err) {
    next(err);
  }
};

const cancel = async (req, res, next) => {
  try {
    const invoice = await prisma.invoice.update({
      where: { id: req.params.id },
      data: { status: 'CANCELLED' },
    });
    res.json(invoice);
  } catch (err) {
    next(err);
  }
};

module.exports = { findAll, findOne, issue, cancel };
