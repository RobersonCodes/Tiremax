const express = require('express');
const router = express.Router();
const { create } = require('../controllers/tenant.controller');

// POST /api/register — cadastro público, sem autenticação
router.post('/', create);

module.exports = router;
