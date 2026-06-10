const express = require('express');
const router = express.Router();
const financialController = require('../controllers/financial.controller');

router.use(authorize('ADMIN', 'FINANCIAL'));

router.get('/receivable', financialController.getReceivable);
router.post('/receivable', financialController.createReceivable);
router.patch('/receivable/:id/pay', financialController.payReceivable);

router.get('/payable', financialController.getPayable);
router.post('/payable', financialController.createPayable);
router.patch('/payable/:id/pay', financialController.payPayable);

router.get('/cashflow', financialController.getCashflow);
router.get('/summary', financialController.getSummary);

module.exports = router;
