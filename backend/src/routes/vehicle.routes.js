const express = require('express');
const router = express.Router();
const vehicleController = require('../controllers/vehicle.controller');
const { authenticate } = require('../middlewares/auth');

router.use(authenticate);

router.get('/', vehicleController.findAll);
router.get('/:id', vehicleController.findOne);
router.post('/', vehicleController.create);
router.put('/:id', vehicleController.update);
router.delete('/:id', vehicleController.remove);

module.exports = router;
