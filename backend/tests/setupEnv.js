const path = require('path');
const dotenv = require('dotenv');
const { assertTestDatabase } = require('./helpers/testDb');

dotenv.config({ path: path.join(__dirname, '..', '.env.test'), override: true });
assertTestDatabase(process.env.DATABASE_URL);
