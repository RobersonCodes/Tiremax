/**
 * Wrapper para a API do Focus NFe (https://focusnfe.com.br).
 *
 * IMPORTANTE — leia antes de usar em produção:
 * 1. Cada borracharia (tenant) precisa ter uma "empresa" cadastrada no painel
 *    do Focus NFe, com CNPJ, certificado digital A1 e configuração fiscal.
 *    Isso é feito HOJE manualmente pelo painel deles — este wrapper não
 *    cadastra empresa nem sobe certificado (de propósito: o certificado
 *    nunca deveria passar pelo servidor do TireMax se não for
 *    estritamente necessário).
 * 2. FOCUS_NFE_TOKEN no .env é o token da SUA conta master no Focus NFe.
 *    A emissão é feita "em nome de" cada empresa usando o CNPJ do tenant.
 * 3. Ambiente: homologação (testes, não vale fiscalmente) vs produção.
 *    Use `tenant.fiscalEnvironment` pra decidir a base URL.
 */

const axios = require('axios');

const BASE_URLS = {
  homologacao: 'https://homologacao.focusnfe.com.br',
  producao: 'https://api.focusnfe.com.br',
};

function client(environment = 'homologacao') {
  const token = process.env.FOCUS_NFE_TOKEN;
  if (!token) {
    throw Object.assign(new Error('FOCUS_NFE_TOKEN não configurado no .env'), { statusCode: 500 });
  }
  return axios.create({
    baseURL: BASE_URLS[environment] || BASE_URLS.homologacao,
    auth: { username: token, password: '' },
    timeout: 15000,
  });
}

/**
 * Emite uma NFS-e (nota de serviço) referente a uma Ordem de Serviço.
 * ref: identificador único que você escolhe (usamos o id da Invoice) —
 * é o que você usa depois pra consultar o status.
 */
const issueNFSe = async ({ tenant, invoice, service, client: clientData }) => {
  const api = client(tenant.fiscalEnvironment);
  const payload = {
    data_emissao: new Date().toISOString(),
    prestador: { cnpj: onlyDigits(tenant.cnpj), inscricao_municipal: tenant.inscricaoMunicipal },
    tomador: {
      cpf: clientData.documentType === 'CPF' ? onlyDigits(clientData.document) : undefined,
      cnpj: clientData.documentType === 'CNPJ' ? onlyDigits(clientData.document) : undefined,
      razao_social: clientData.name,
      email: clientData.email || undefined,
      endereco: clientData.address ? {
        logradouro: clientData.address, municipio: clientData.city, uf: clientData.state,
      } : undefined,
    },
    servico: {
      item_lista_servico: tenant.itemListaServico,
      discriminacao: service.description || service.type,
      iss_retido: false,
      aliquota: tenant.aliquotaIss || 0,
      valor_servicos: service.total,
    },
  };
  const { data } = await api.post(`/v2/nfse?ref=${invoice.id}`, payload);
  return data; // { status: 'processando_autorizacao', ... }
};

/**
 * Emite uma NFC-e (nota de consumidor) referente a uma venda do PDV.
 */
const issueNFCe = async ({ tenant, invoice, sale, items, client: clientData }) => {
  const api = client(tenant.fiscalEnvironment);
  const payload = {
    natureza_operacao: 'Venda ao consumidor',
    data_emissao: new Date().toISOString(),
    presenca_comprador: 1,
    cnpj_emitente: onlyDigits(tenant.cnpj),
    valor_produtos: sale.subtotal,
    valor_desconto: sale.discount || 0,
    modalidade_frete: '9',
    cpf_destinatario: clientData?.documentType === 'CPF' ? onlyDigits(clientData.document) : undefined,
    items: items.map((item, i) => ({
      numero_item: i + 1,
      codigo_produto: item.productId || String(i + 1),
      descricao: item.description,
      cfop: '5102',
      unidade_comercial: 'UN',
      quantidade_comercial: item.quantity,
      valor_unitario_comercial: item.unitPrice,
      valor_bruto: item.quantity * item.unitPrice,
    })),
  };
  const { data } = await api.post(`/v2/nfce?ref=${invoice.id}`, payload);
  return data;
};

/**
 * Consulta o status de emissão (a emissão é assíncrona — o Focus processa
 * em fila e você consulta até virar "autorizado" ou "erro_autorizacao").
 */
const checkStatus = async ({ tenant, invoice }) => {
  const api = client(tenant.fiscalEnvironment);
  const endpoint = invoice.type === 'NFCE' ? 'nfce' : 'nfse';
  const { data } = await api.get(`/v2/${endpoint}/${invoice.id}`);
  return data;
};

const cancel = async ({ tenant, invoice, justificativa }) => {
  const api = client(tenant.fiscalEnvironment);
  const endpoint = invoice.type === 'NFCE' ? 'nfce' : 'nfse';
  const { data } = await api.delete(`/v2/${endpoint}/${invoice.id}`, { data: { justificativa } });
  return data;
};

function onlyDigits(v) {
  return v ? String(v).replace(/\D/g, '') : undefined;
}

module.exports = { issueNFSe, issueNFCe, checkStatus, cancel };
