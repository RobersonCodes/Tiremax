const express = require('express');
const { authorize } = require('../middlewares/auth');
const router = express.Router();
const serviceController = require('../controllers/service.controller');


router.get('/', serviceController.findAll);
router.get('/:id', serviceController.findOne);
router.post('/', serviceController.create);
router.put('/:id', serviceController.update);
router.patch('/:id/status', serviceController.updateStatus);
router.delete('/:id', authorize('ADMIN'), serviceController.remove);

module.exports = router;
