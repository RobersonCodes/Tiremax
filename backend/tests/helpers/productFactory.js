const { randomUUID } = require('crypto');
const prisma = require('../../src/config/database');

async function createProduct(tenantId, overrides = {}) {
  return prisma.product.create({
    data: {
      tenantId,
      code: `COD-${randomUUID().slice(0, 8)}`,
      name: 'Pneu 175/70 R13',
      costPrice: 100,
      salePrice: 180,
      stock: 10,
      minStock: 5,
      ...overrides,
    },
  });
}

module.exports = { createProduct };
