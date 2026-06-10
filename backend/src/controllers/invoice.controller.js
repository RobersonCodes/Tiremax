const prisma = require('../config/database');

const findAll = async (req, res, next) => {
  try {
    const invoices = await prisma.invoice.findMany({
      where: { tenantId: req.tenantId },
      orderBy: { createdAt: 'desc' },
      include: { client: { select: { id: true, name: true } } },
    });
    res.json(invoices);
  } catch (err) { next(err); }
};

const findOne = async (req, res, next) => {
  try {
    const invoice = await prisma.invoice.findFirst({
      where: { id: req.params.id, tenantId: req.tenantId },
      include: { client: true, sale: true, service: true },
    });
    if (!invoice) return res.status(404).json({ message: 'Nota fiscal não encontrada' });
    res.json(invoice);
  } catch (err) { next(err); }
};

const issue = async (req, res, next) => {
  try {
    const invoice = await prisma.invoice.findFirst({ where: { id: req.params.id, tenantId: req.tenantId } });
    if (!invoice) return res.status(404).json({ message: 'Nota não encontrada' });
    res.json(await prisma.invoice.update({
      where: { id: req.params.id },
      data: { status: 'ISSUED', issueDate: new Date() },
    }));
  } catch (err) { next(err); }
};

module.exports = { findAll, findOne, issue };
