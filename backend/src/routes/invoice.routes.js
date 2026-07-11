const express = require('express');
const router = express.Router();
const invoiceController = require('../controllers/invoice.controller');

router.get('/', invoiceController.findAll);
router.get('/:id', invoiceController.findOne);
router.post('/from-sale/:saleId', invoiceController.createFromSale);
router.post('/from-service/:serviceId', invoiceController.createFromService);
router.post('/issue/:id', invoiceController.issue);
router.get('/:id/status', invoiceController.checkStatus);
router.post('/cancel/:id', invoiceController.cancel);

module.exports = router;
