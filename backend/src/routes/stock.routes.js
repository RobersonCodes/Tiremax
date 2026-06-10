const express = require('express');
const router = express.Router();
const stockController = require('../controllers/stock.controller');


router.get('/movements', stockController.getMovements);
router.post('/movements', authorize('ADMIN', 'EMPLOYEE'), stockController.createMovement);
router.get('/report', stockController.getReport);

module.exports = router;
