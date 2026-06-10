const express = require('express');
const router = express.Router();
const saleController = require('../controllers/sale.controller');
const { authenticate, authorize } = require('../middlewares/auth');

router.use(authenticate);

router.get('/', saleController.findAll);
router.get('/:id', saleController.findOne);
router.post('/', saleController.create);
router.patch('/:id/status', saleController.updateStatus);
router.patch('/:id/cancel', authorize('ADMIN', 'FINANCIAL'), saleController.cancel);

module.exports = router;
