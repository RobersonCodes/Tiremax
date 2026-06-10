const express = require('express');
const router = express.Router();
const invoiceController = require('../controllers/invoice.controller');
const { authenticate, authorize } = require('../middlewares/auth');

router.use(authenticate);

router.get('/', invoiceController.findAll);
router.get('/:id', invoiceController.findOne);
router.post('/issue', authorize('ADMIN', 'FINANCIAL'), invoiceController.issue);
router.post('/cancel/:id', authorize('ADMIN', 'FINANCIAL'), invoiceController.cancel);

module.exports = router;
