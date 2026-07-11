const express = require('express');
const { authorize } = require('../middlewares/auth');
const router = express.Router();
const invoiceController = require('../controllers/invoice.controller');

router.get('/', invoiceController.findAll);
router.get('/:id', invoiceController.findOne);
router.post('/from-sale/:saleId', authorize('ADMIN', 'FINANCIAL'), invoiceController.createFromSale);
router.post('/from-service/:serviceId', authorize('ADMIN', 'FINANCIAL'), invoiceController.createFromService);
router.post('/issue/:id', authorize('ADMIN', 'FINANCIAL'), invoiceController.issue);
router.get('/:id/status', invoiceController.checkStatus);
router.post('/cancel/:id', authorize('ADMIN', 'FINANCIAL'), invoiceController.cancel);

module.exports = router;
