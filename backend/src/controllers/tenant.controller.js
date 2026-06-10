const bcrypt = require('bcryptjs');
const prisma = require('../config/database');

// Gera slug único a partir do nome
function generateSlug(name) {
  return name
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

// POST /api/tenants — cria novo tenant + admin (uso interno seu)
const create = async (req, res, next) => {
  try {
    const { name, cnpj, email, phone, adminName, adminEmail, adminPassword, plan = 'TRIAL' } = req.body;

    if (!name || !adminEmail || !adminPassword) {
      return res.status(400).json({ message: 'Nome, email e senha do admin são obrigatórios' });
    }

    // Gera slug único
    let slug = generateSlug(name);
    const existing = await prisma.tenant.findUnique({ where: { slug } });
    if (existing) slug = `${slug}-${Date.now()}`;

    // Trial de 30 dias
    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + 30);

    const hashedPassword = await bcrypt.hash(adminPassword, 10);

    const tenant = await prisma.$transaction(async (tx) => {
      const t = await tx.tenant.create({
        data: {
          name,
          slug,
          cnpj,
          email,
          phone,
          plan,
          trialEndsAt: plan === 'TRIAL' ? trialEndsAt : null,
        },
      });

      await tx.user.create({
        data: {
          tenantId: t.id,
          name: adminName || 'Administrador',
          email: adminEmail,
          password: hashedPassword,
          role: 'ADMIN',
        },
      });

      return t;
    });

    res.status(201).json({
      message: 'Borracharia criada com sucesso!',
      tenant: { id: tenant.id, name: tenant.name, slug: tenant.slug, plan: tenant.plan, trialEndsAt: tenant.trialEndsAt },
      login: { email: adminEmail, password: adminPassword },
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/tenants — lista todos (super admin)
const findAll = async (req, res, next) => {
  try {
    const tenants = await prisma.tenant.findMany({
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { users: true, clients: true, services: true } } },
    });
    res.json(tenants);
  } catch (err) {
    next(err);
  }
};

// GET /api/tenants/:id — detalhes de um tenant
const findOne = async (req, res, next) => {
  try {
    const tenant = await prisma.tenant.findUnique({
      where: { id: req.params.id },
      include: { _count: { select: { users: true, clients: true, services: true, sales: true } } },
    });
    if (!tenant) return res.status(404).json({ message: 'Tenant não encontrado' });
    res.json(tenant);
  } catch (err) {
    next(err);
  }
};

// PUT /api/tenants/:id/status — suspender/ativar
const updateStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const tenant = await prisma.tenant.update({
      where: { id: req.params.id },
      data: { status },
    });
    res.json(tenant);
  } catch (err) {
    next(err);
  }
};

// PUT /api/tenants/:id/plan — mudar plano
const updatePlan = async (req, res, next) => {
  try {
    const { plan } = req.body;
    const tenant = await prisma.tenant.update({
      where: { id: req.params.id },
      data: { plan, trialEndsAt: null },
    });
    res.json(tenant);
  } catch (err) {
    next(err);
  }
};

// GET /api/settings — retorna settings do tenant logado
const getSettings = async (req, res, next) => {
  try {
    const tenant = await prisma.tenant.findUnique({ where: { id: req.tenantId } });
    res.json(tenant);
  } catch (err) {
    next(err);
  }
};

// PUT /api/settings — atualiza settings do tenant logado
const updateSettings = async (req, res, next) => {
  try {
    const { name, phone, whatsapp, email, address, city, state, zipCode, openHours, primaryColor, cnpj } = req.body;
    const tenant = await prisma.tenant.update({
      where: { id: req.tenantId },
      data: { name, phone, whatsapp, email, address, city, state, zipCode, openHours, primaryColor, cnpj },
    });
    res.json(tenant);
  } catch (err) {
    next(err);
  }
};

module.exports = { create, findAll, findOne, updateStatus, updatePlan, getSettings, updateSettings };
