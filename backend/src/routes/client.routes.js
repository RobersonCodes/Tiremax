const express = require('express');
const router = express.Router();
const clientController = require('../controllers/client.controller');


router.get('/', clientController.findAll);
router.get('/search', clientController.search);
router.get('/:id', clientController.findOne);
router.post('/', clientController.create);
router.put('/:id', clientController.update);
router.delete('/:id', clientController.remove);
router.get('/:id/history', clientController.getHistory);

module.exports = router;
