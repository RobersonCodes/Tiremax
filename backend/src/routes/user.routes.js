const express = require('express');
const { authorize } = require('../middlewares/auth');
const router = express.Router();
const userController = require('../controllers/user.controller');


router.get('/', authorize('ADMIN'), userController.findAll);
router.get('/:id', userController.findOne);
router.post('/', authorize('ADMIN'), userController.create);
router.put('/:id', userController.update);
router.delete('/:id', authorize('ADMIN'), userController.remove);

module.exports = router;
