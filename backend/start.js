// Railway startup script with env fallbacks
process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/tiremax';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'tiremax-secret-2024';
process.env.JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
process.env.PORT = process.env.PORT || '3001';
process.env.NODE_ENV = process.env.NODE_ENV || 'production';

require('./src/server.js');
