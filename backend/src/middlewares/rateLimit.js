const rateLimit = require('express-rate-limit');

// Testes fazem dezenas de logins por arquivo (helpers/factories.js) — sem
// isso, a suíte inteira ia bater no limite de auth em poucos segundos.
const skipInTests = () => process.env.NODE_ENV === 'test';

// Limite geral pra toda a API — generoso o bastante pra não incomodar uso
// normal (dashboard carrega 5 endpoints de uma vez, polling de status de
// nota fiscal a cada ~5s), mas o suficiente pra segurar um scraper/bot óbvio.
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 600,
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipInTests,
  message: { message: 'Muitas requisições. Tente novamente em alguns minutos.' },
});

// Limite mais apertado só pra login/forgot-password/reset-password — os
// alvos clássicos de força bruta e credential stuffing.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipInTests,
  message: { message: 'Muitas tentativas. Tente novamente em alguns minutos.' },
});

module.exports = { apiLimiter, authLimiter };
