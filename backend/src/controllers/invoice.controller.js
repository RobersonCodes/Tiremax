const prisma = require('../config/database');
const focusNfe = require('../services/focusNfe.service');

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

const badRequest = (message) => Object.assign(new Error(message), { statusCode: 400 });

const assertFiscalConfigured = (tenant) => {
  if (!tenant.cnpj) throw badRequest('Configure o CNPJ da borracharia em Configurações antes de emitir notas.');
  if (!tenant.fiscalEnabled) throw badRequest('Emissão de nota fiscal não está habilitada. Configure em Configurações → Fiscal.');
};

// Cria (se não existir) o rascunho de Invoice a partir de uma venda do PDV → NFC-e
const createFromSale = async (req, res, next) => {
  try {
    const sale = await prisma.sale.findFirst({
      where: { id: req.params.saleId, tenantId: req.tenantId },
      include: { client: true, items: true, invoice: true },
    });
    if (!sale) return res.status(404).json({ message: 'Venda não encontrada' });
    if (sale.invoice) return res.json(sale.invoice);

    const invoice = await prisma.invoice.create({
      data: {
        tenantId: req.tenantId,
        type: 'NFCE',
        saleId: sale.id,
        clientId: sale.clientId,
        amount: sale.total,
        status: 'DRAFT',
      },
    });
    res.status(201).json(invoice);
  } catch (err) { next(err); }
};

// Cria (se não existir) o rascunho de Invoice a partir de uma OS → NFS-e
const createFromService = async (req, res, next) => {
  try {
    const service = await prisma.service.findFirst({
      where: { id: req.params.serviceId, tenantId: req.tenantId },
      include: { client: true, invoice: true },
    });
    if (!service) return res.status(404).json({ message: 'Ordem de serviço não encontrada' });
    if (!service.clientId) return res.status(400).json({ message: 'OS sem cliente vinculado — não é possível emitir nota' });
    if (service.invoice) return res.json(service.invoice);

    const invoice = await prisma.invoice.create({
      data: {
        tenantId: req.tenantId,
        type: 'NFSE',
        serviceId: service.id,
        clientId: service.clientId,
        amount: service.total,
        status: 'DRAFT',
      },
    });
    res.status(201).json(invoice);
  } catch (err) { next(err); }
};

// Envia a nota pro Focus NFe. Emissão é ASSÍNCRONA — aqui só disparamos e
// marcamos como PROCESSING; o status final vem via checkStatus().
const issue = async (req, res, next) => {
  try {
    const invoice = await prisma.invoice.findFirst({
      where: { id: req.params.id, tenantId: req.tenantId },
      include: { client: true, sale: { include: { items: true } }, service: true },
    });
    if (!invoice) return res.status(404).json({ message: 'Nota não encontrada' });
    if (invoice.status === 'ISSUED') return res.json(invoice);

    assertFiscalConfigured(req.tenant);

    try {
      if (invoice.type === 'NFCE') {
        await focusNfe.issueNFCe({
          tenant: req.tenant, invoice, sale: invoice.sale,
          items: invoice.sale.items, client: invoice.client,
        });
      } else {
        await focusNfe.issueNFSe({
          tenant: req.tenant, invoice, service: invoice.service, client: invoice.client,
        });
      }
      const updated = await prisma.invoice.update({
        where: { id: invoice.id },
        data: { status: 'PROCESSING', focusRef: invoice.id, errorMessage: null },
      });
      res.json(updated);
    } catch (focusErr) {
      const message = focusErr.response?.data?.mensagem || focusErr.message || 'Erro ao comunicar com o Focus NFe';
      await prisma.invoice.update({ where: { id: invoice.id }, data: { status: 'ERROR', errorMessage: message } });
      return res.status(422).json({ message });
    }
  } catch (err) { next(err); }
};

// Consulta o status na Focus NFe e atualiza o registro local.
// Chamar em polling (ex: a cada 5s) enquanto status === 'PROCESSING'.
const checkStatus = async (req, res, next) => {
  try {
    const invoice = await prisma.invoice.findFirst({ where: { id: req.params.id, tenantId: req.tenantId } });
    if (!invoice) return res.status(404).json({ message: 'Nota não encontrada' });
    if (invoice.status !== 'PROCESSING') return res.json(invoice);

    const data = await focusNfe.checkStatus({ tenant: req.tenant, invoice });

    if (data.status === 'autorizado') {
      const updated = await prisma.invoice.update({
        where: { id: invoice.id },
        data: {
          status: 'ISSUED', number: data.numero || data.numero_rps,
          issueDate: new Date(), pdfUrl: data.caminho_danfse || data.caminho_danfe,
          xmlUrl: data.caminho_xml_nota_fiscal, errorMessage: null,
        },
      });
      return res.json(updated);
    }
    if (data.status?.startsWith('erro')) {
      const updated = await prisma.invoice.update({
        where: { id: invoice.id },
        data: { status: 'ERROR', errorMessage: data.mensagem_sefaz || data.mensagem || 'Rejeitado' },
      });
      return res.json(updated);
    }
    // ainda processando
    res.json(invoice);
  } catch (err) { next(err); }
};

const cancel = async (req, res, next) => {
  try {
    const invoice = await prisma.invoice.findFirst({ where: { id: req.params.id, tenantId: req.tenantId } });
    if (!invoice) return res.status(404).json({ message: 'Nota não encontrada' });
    if (invoice.status !== 'ISSUED') return res.status(400).json({ message: 'Só é possível cancelar notas já autorizadas' });

    const justificativa = req.body.justificativa || 'Cancelamento solicitado pelo estabelecimento';
    try {
      await focusNfe.cancel({ tenant: req.tenant, invoice, justificativa });
    } catch (focusErr) {
      const message = focusErr.response?.data?.mensagem || focusErr.message;
      return res.status(422).json({ message });
    }
    res.json(await prisma.invoice.update({ where: { id: req.params.id }, data: { status: 'CANCELLED' } }));
  } catch (err) { next(err); }
};

module.exports = { findAll, findOne, createFromSale, createFromService, issue, checkStatus, cancel };
