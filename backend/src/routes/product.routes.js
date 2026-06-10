const express = require('express');
const { authorize } = require('../middlewares/auth');
const router = express.Router();
const productController = require('../controllers/product.controller');


router.get('/', productController.findAll);
router.get('/low-stock', productController.lowStock);
router.get('/search', productController.search);
router.get('/:id', productController.findOne);
router.post('/', authorize('ADMIN', 'EMPLOYEE'), productController.create);
router.put('/:id', authorize('ADMIN', 'EMPLOYEE'), productController.update);
router.delete('/:id', authorize('ADMIN'), productController.remove);

module.exports = router;
