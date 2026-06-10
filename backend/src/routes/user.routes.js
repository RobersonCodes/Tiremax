const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');


router.get('/', authorize('ADMIN'), userController.findAll);
router.get('/:id', userController.findOne);
router.post('/', authorize('ADMIN'), userController.create);
router.put('/:id', userController.update);
router.delete('/:id', authorize('ADMIN'), userController.remove);
router.patch('/:id/password', userController.changePassword);

module.exports = router;
