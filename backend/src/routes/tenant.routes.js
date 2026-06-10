const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middlewares/auth');
const tenantMiddleware = require('../middlewares/tenant');
const { create, findAll, findOne, updateStatus, updatePlan } = require('../controllers/tenant.controller');

// Rotas super-admin (protegidas por SUPER_ADMIN role)
router.post('/', create); // criação via você mesmo (sem auth por ora)
router.get('/', authenticate, authorize('SUPER_ADMIN'), findAll);
router.get('/:id', authenticate, authorize('SUPER_ADMIN'), findOne);
router.put('/:id/status', authenticate, authorize('SUPER_ADMIN'), updateStatus);
router.put('/:id/plan', authenticate, authorize('SUPER_ADMIN'), updatePlan);

module.exports = router;
