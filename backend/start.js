const { execSync } = require('child_process');

process.env.JWT_SECRET = process.env.JWT_SECRET || 'tiremax-secret-2024';
process.env.JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
process.env.PORT = process.env.PORT || '3001';
process.env.NODE_ENV = process.env.NODE_ENV || 'production';

if (process.env.DATABASE_URL) {
  try {
    console.log('Running migrations...');
    execSync('npx prisma migrate deploy', { stdio: 'inherit' });
    console.log('Migrations done!');
  } catch (e) {
    console.error('Migration failed:', e.message);
  }
}

require('./src/server.js');