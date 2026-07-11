const path = require('path');
const { execSync } = require('child_process');
const dotenv = require('dotenv');
const { assertTestDatabase } = require('./helpers/testDb');

module.exports = async function globalSetup() {
  dotenv.config({ path: path.join(__dirname, '..', '.env.test') });

  const dbName = assertTestDatabase(process.env.DATABASE_URL);
  console.log(`[tests] aplicando migrations em "${dbName}"...`);

  execSync('npx prisma migrate deploy', {
    cwd: path.join(__dirname, '..'),
    env: process.env,
    stdio: 'inherit',
  });
};
