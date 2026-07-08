/**
 * secure-demo-accounts.js
 *
 * One-off fix for the demo accounts that were exposed on the public
 * login page (admin@tiremax.com / funcionario@tiremax.com /
 * financeiro@tiremax.com). By default this DEACTIVATES the three
 * accounts (active = false).
 *
 * USAGE
 *   node scripts/secure-demo-accounts.js              # deactivates the 3 accounts
 *   node scripts/secure-demo-accounts.js --rotate      # keeps them active, sets new random passwords
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const prisma = new PrismaClient();

const DEMO_EMAILS = [
  'admin@tiremax.com',
  'funcionario@tiremax.com',
  'financeiro@tiremax.com',
];

function generateStrongPassword() {
  return crypto.randomBytes(12).toString('base64url');
}

async function main() {
  const rotate = process.argv.includes('--rotate');

  const users = await prisma.user.findMany({
    where: { email: { in: DEMO_EMAILS } },
    select: { id: true, email: true, tenantId: true, active: true },
  });

  if (users.length === 0) {
    console.log('Nenhuma das contas demo foi encontrada — nada a fazer.');
    return;
  }

  console.log(`Encontradas ${users.length} conta(s) demo:\n`);

  for (const user of users) {
    if (rotate) {
      const newPassword = generateStrongPassword();
      const hashed = await bcrypt.hash(newPassword, 10);
      await prisma.user.update({ where: { id: user.id }, data: { password: hashed } });
      console.log(`Nova senha para ${user.email}: ${newPassword}`);
    } else {
      await prisma.user.update({ where: { id: user.id }, data: { active: false } });
      console.log(`Desativada: ${user.email}`);
    }
  }

  console.log(rotate ? '\nGuarde essas senhas agora.' : '\nPronto. Essas 3 contas nao conseguem mais logar.');
}

main()
  .catch((err) => { console.error('Erro:', err); process.exitCode = 1; })
  .finally(() => prisma.$disconnect());
