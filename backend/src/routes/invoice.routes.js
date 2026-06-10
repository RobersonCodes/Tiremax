const express = require('express');
const { authorize } = require('../middlewares/auth');
const router = express.Router();
const invoiceController = require('../controllers/invoice.controller');


router.get('/', invoiceController.findAll);
router.get('/:id', invoiceController.findOne);
router.post('/issue', authorize('ADMIN', 'FINANCIAL'), invoiceController.issue);
router.post('/cancel/:id', authorize('ADMIN', 'FINANCIAL'), invoiceController.cancel);

module.exports = router;
