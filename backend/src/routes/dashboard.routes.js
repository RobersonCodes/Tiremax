const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboard.controller');
const { authenticate } = require('../middlewares/auth');

router.use(authenticate);

router.get('/metrics', dashboardController.getMetrics);
router.get('/revenue-chart', dashboardController.getRevenueChart);
router.get('/recent-sales', dashboardController.getRecentSales);
router.get('/recent-clients', dashboardController.getRecentClients);
router.get('/low-stock', dashboardController.getLowStock);

module.exports = router;
