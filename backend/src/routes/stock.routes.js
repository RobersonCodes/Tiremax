const express = require('express');
const router = express.Router();
const stockController = require('../controllers/stock.controller');
const { authenticate, authorize } = require('../middlewares/auth');

router.use(authenticate);

router.get('/movements', stockController.getMovements);
router.post('/movements', authorize('ADMIN', 'EMPLOYEE'), stockController.createMovement);
router.get('/report', stockController.getReport);

module.exports = router;
