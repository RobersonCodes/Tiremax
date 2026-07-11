const { PrismaClient } = require('@prisma/client');
const { getTenantId } = require('./tenantContext');

// Isolamento de tenant estrutural, não só convenção manual em cada controller.
// Modelos com coluna tenant_id — Tenant fica de fora (é o próprio tenant).
const TENANT_SCOPED_MODELS = new Set([
  'User', 'Client', 'Vehicle', 'Category', 'Product', 'Sale',
  'Service', 'StockMovement', 'Invoice', 'Payment',
  'AccountReceivable', 'AccountPayable',
]);

// Operações cujo `where` recebe o filtro de tenant.
const WHERE_OPS = new Set([
  'findFirst', 'findFirstOrThrow', 'findUnique', 'findUniqueOrThrow',
  'findMany', 'count', 'aggregate', 'groupBy',
  'update', 'updateMany', 'delete', 'deleteMany', 'upsert',
]);

const basePrisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
});

const prisma = basePrisma.$extends({
  name: 'tenant-isolation',
  query: {
    $allModels: {
      async $allOperations({ model, operation, args, query }) {
        // Sem tenantId no contexto (login, registro, rotas de SUPER_ADMIN —
        // nenhuma passa por tenantMiddleware) ou modelo não é tenant-scoped:
        // comportamento inalterado.
        const tenantId = getTenantId();
        if (!tenantId || !TENANT_SCOPED_MODELS.has(model)) {
          return query(args);
        }

        if (WHERE_OPS.has(operation)) {
          args.where = { ...(args.where ?? {}), tenantId };
        }

        // Além de restringir leitura/escrita ao tenant certo, também trava
        // contra mass-assignment: um `data: req.body` que contenha um
        // `tenantId` de outro tenant nunca sobrescreve o valor real.
        if (operation === 'create') {
          args.data = { ...(args.data ?? {}), tenantId };
        } else if (operation === 'createMany' && Array.isArray(args.data)) {
          args.data = args.data.map((d) => ({ ...d, tenantId }));
        } else if ((operation === 'update' || operation === 'updateMany') && args.data) {
          args.data = { ...args.data, tenantId };
        } else if (operation === 'upsert') {
          args.create = { ...(args.create ?? {}), tenantId };
          if (args.update) args.update = { ...args.update, tenantId };
        }

        return query(args);
      },
    },
  },
});

module.exports = prisma;
