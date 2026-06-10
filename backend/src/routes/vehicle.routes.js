const express = require('express');
const router = express.Router();
const vehicleController = require('../controllers/vehicle.controller');


router.get('/', vehicleController.findAll);
router.get('/:id', vehicleController.findOne);
router.post('/', vehicleController.create);
router.put('/:id', vehicleController.update);
router.delete('/:id', vehicleController.remove);

module.exports = router;
