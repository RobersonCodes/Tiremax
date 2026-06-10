const { execSync } = require('child_process');

process.env.JWT_SECRET = process.env.JWT_SECRET || 'tiremax-secret-2024';
process.env.JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
process.env.PORT = process.env.PORT || '3001';
process.env.NODE_ENV = process.env.NODE_ENV || 'production';

console.log('[TireMax] Iniciando servidor...');
console.log('[TireMax] NODE_ENV:', process.env.NODE_ENV);
console.log('[TireMax] PORT:', process.env.PORT);
console.log('[TireMax] DATABASE_URL presente:', !!process.env.DATABASE_URL);

try {
  console.log('[TireMax] Gerando Prisma Client...');
  execSync('npx prisma generate', { stdio: 'inherit' });
  console.log('[TireMax] Prisma Client gerado!');
} catch (e) {
  console.error('[TireMax] Falha ao gerar Prisma Client:', e.message);
}

if (process.env.DATABASE_URL) {
  try {
    console.log('[TireMax] Rodando migrations...');
    execSync('npx prisma migrate deploy', { stdio: 'inherit' });
    console.log('[TireMax] Migrations concluidas!');
  } catch (e) {
    console.error('[TireMax] Falha nas migrations:', e.message);
  }
} else {
  console.warn('[TireMax] DATABASE_URL nao definida!');
}

require('./src/server.js');
