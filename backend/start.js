// Railway startup script
if (!process.env.DATABASE_URL) {
  console.error('ERROR: DATABASE_URL not set!');
  process.exit(1);
}

process.env.JWT_SECRET = process.env.JWT_SECRET || 'tiremax-secret-2024';
process.env.JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
process.env.PORT = process.env.PORT || '3001';
process.env.NODE_ENV = process.env.NODE_ENV || 'production';

require('./src/server.js');