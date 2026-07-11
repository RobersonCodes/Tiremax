const prisma = require('../../src/config/database');
const { assertTestDatabase } = require('./testDb');

const TABLES = [
  'accounts_payable', 'accounts_receivable', 'payments', 'invoices',
  'stock_movements', 'service_items', 'services', 'sale_items', 'sales',
  'products', 'categories', 'vehicles', 'clients', 'users', 'tenants',
];

// Reafirma a trava mesmo em runtime — reforço contra qualquer import que
// tenha carregado a DATABASE_URL errada antes deste módulo.
async function cleanDatabase() {
  assertTestDatabase(process.env.DATABASE_URL);
  const list = TABLES.map(t => `"${t}"`).join(', ');
  await prisma.$executeRawUnsafe(`TRUNCATE TABLE ${list} RESTART IDENTITY CASCADE;`);
}

module.exports = { cleanDatabase };
