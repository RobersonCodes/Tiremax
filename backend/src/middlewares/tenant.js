const prisma = require('../config/database');
const { runWithTenant } = require('../config/tenantContext');

// Middleware que injeta tenantId em todas as requisições autenticadas
const tenantMiddleware = async (req, res, next) => {
  try {
    if (!req.user) return next();

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: { tenant: true },
    });

    if (!user || !user.tenant) {
      return res.status(403).json({ message: 'Tenant não encontrado' });
    }

    if (user.tenant.status === 'SUSPENDED') {
      return res.status(403).json({ message: 'Conta suspensa. Entre em contato com o suporte.' });
    }

    // Trial expirado
    if (user.tenant.plan === 'TRIAL' && user.tenant.trialEndsAt && new Date() > user.tenant.trialEndsAt) {
      return res.status(403).json({ message: 'Período de teste encerrado. Assine um plano para continuar.' });
    }

    req.tenantId = user.tenant.id;
    req.tenant = user.tenant;
    runWithTenant(req.tenantId, next);
  } catch (err) {
    next(err);
  }
};

module.exports = tenantMiddleware;
