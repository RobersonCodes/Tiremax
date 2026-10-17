const { execSync } = require('child_process');
require('dotenv').config();

process.env.JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

const requiredEnv = ['DATABASE_URL', 'JWT_SECRET'];
const missingEnv = requiredEnv.filter(name => !process.env[name]);
if (missingEnv.length) {
  throw new Error(`Variáveis obrigatórias ausentes: ${missingEnv.join(', ')}`);
}
// Hosts antigos podem usar a mesma URL para consultas e migrations.
process.env.DIRECT_URL = process.env.DIRECT_URL || process.env.DATABASE_URL;

if (process.env.JWT_SECRET === 'tiremax-secret-2024') {
  throw new Error('JWT_SECRET usa uma chave pública e insegura; gere uma chave forte antes de iniciar.');
}

console.log('[TireMax] Iniciando servidor...');
console.log('[TireMax] NODE_ENV:', process.env.NODE_ENV);
console.log('[TireMax] DATABASE_URL presente:', !!process.env.DATABASE_URL);

console.log('[TireMax] Aplicando migrations...');
execSync('npx prisma migrate deploy', { stdio: 'inherit' });
console.log('[TireMax] Migrations concluídas!');

require('./src/server.js');
