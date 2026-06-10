const express = require('express');
const router = express.Router();
const { authenticate } = require('../middlewares/auth');
const tenantMiddleware = require('../middlewares/tenant');

const authRoutes = require('./auth.routes');
const tenantRoutes = require('./tenant.routes');
const userRoutes = require('./user.routes');
const clientRoutes = require('./client.routes');
const productRoutes = require('./product.routes');
const saleRoutes = require('./sale.routes');
const serviceRoutes = require('./service.routes');
const stockRoutes = require('./stock.routes');
const financialRoutes = require('./financial.routes');
const dashboardRoutes = require('./dashboard.routes');
const invoiceRoutes = require('./invoice.routes');
const vehicleRoutes = require('./vehicle.routes');
const settingsRoutes = require('./settings.routes');

// Rotas públicas
router.use('/auth', authRoutes);
router.use('/tenants', tenantRoutes);

// Middleware global: autenticação + tenant em todas as rotas protegidas
router.use(authenticate);
router.use(tenantMiddleware);

// Rotas protegidas
router.use('/users', userRoutes);
router.use('/clients', clientRoutes);
router.use('/products', productRoutes);
router.use('/sales', saleRoutes);
router.use('/services', serviceRoutes);
router.use('/stock', stockRoutes);
router.use('/financial', financialRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/invoices', invoiceRoutes);
router.use('/vehicles', vehicleRoutes);
router.use('/settings', settingsRoutes);

module.exports = router;
