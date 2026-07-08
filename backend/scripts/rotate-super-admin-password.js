const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const prisma = new PrismaClient();
const SUPER_ADMIN_EMAIL = 'roberson@oliveirasystems.dev';

function generateStrongPassword() {
  return crypto.randomBytes(12).toString('base64url');
}

async function main() {
  const user = await prisma.user.findFirst({
    where: { email: SUPER_ADMIN_EMAIL, role: 'SUPER_ADMIN' },
  });

  if (!user) {
    console.log(`Nenhum SUPER_ADMIN encontrado com o email ${SUPER_ADMIN_EMAIL}.`);
    return;
  }

  const newPassword = generateStrongPassword();
  const hashed = await bcrypt.hash(newPassword, 10);

  await prisma.user.update({ where: { id: user.id }, data: { password: hashed } });

  console.log(`Senha trocada para ${SUPER_ADMIN_EMAIL}`);
  console.log(`Nova senha: ${newPassword}`);
  console.log('\nGuarde agora - nao fica salva em nenhum lugar alem do banco (com hash).');
}

main()
  .catch((err) => { console.error('Erro:', err); process.exitCode = 1; })
  .finally(() => prisma.$disconnect());
