const express = require('express');
const router = express.Router();
const productController = require('../controllers/product.controller');
const { authenticate, authorize } = require('../middlewares/auth');

router.use(authenticate);

router.get('/', productController.findAll);
router.get('/low-stock', productController.lowStock);
router.get('/search', productController.search);
router.get('/:id', productController.findOne);
router.post('/', authorize('ADMIN', 'EMPLOYEE'), productController.create);
router.put('/:id', authorize('ADMIN', 'EMPLOYEE'), productController.update);
router.delete('/:id', authorize('ADMIN'), productController.remove);

module.exports = router;
