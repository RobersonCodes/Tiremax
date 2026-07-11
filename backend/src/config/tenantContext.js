const { AsyncLocalStorage } = require('node:async_hooks');

// Carrega o tenantId da requisição atual através de toda a cadeia async
// (middlewares, controllers, dentro de $transaction) sem precisar passá-lo
// explicitamente por parâmetro em cada chamada — é isso que permite ao
// Prisma Client Extension em config/database.js aplicar o isolamento de
// tenant automaticamente, sem tocar em nenhum controller.
const storage = new AsyncLocalStorage();

function runWithTenant(tenantId, callback) {
  return storage.run({ tenantId }, callback);
}

function getTenantId() {
  return storage.getStore()?.tenantId;
}

module.exports = { runWithTenant, getTenantId };
