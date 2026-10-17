const path = require('path');
const dotenv = require('dotenv');
const { assertTestDatabase } = require('./helpers/testDb');

dotenv.config({ path: path.join(__dirname, '..', '.env.test'), override: true });
process.env.DIRECT_URL = process.env.DIRECT_URL || process.env.DATABASE_URL;
assertTestDatabase(process.env.DATABASE_URL);
