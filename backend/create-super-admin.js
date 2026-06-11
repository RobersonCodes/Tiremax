const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
  const t = await prisma.tenant.upsert({
    where: { slug: 'super-admin' },
    update: {},
    create: { name: 'Oliveira Systems', slug: 'super-admin', plan: 'ENTERPRISE', status: 'ACTIVE' }
  });

  const pass = await bcrypt.hash('Tiremax@2024!', 10);

  await prisma.user.deleteMany({ where: { email: 'roberson@oliveirasystems.dev' } });

  await prisma.user.create({
    data: { tenantId: t.id, name: 'Roberson Oliveira', email: 'roberson@oliveirasystems.dev', password: pass, role: 'SUPER_ADMIN' }
  });

  console.log('Super Admin criado!');
  console.log('Login: roberson@oliveirasystems.dev / Tiremax@2024!');
}

main().catch(console.error).finally(() => prisma.$disconnect());