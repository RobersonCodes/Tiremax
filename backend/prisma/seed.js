const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed multi-tenant...');

  // Tenant demo: TireMax Demo
  const trialEndsAt = new Date();
  trialEndsAt.setDate(trialEndsAt.getDate() + 30);

  const tenant = await prisma.tenant.upsert({
    where: { slug: 'tiremax-demo' },
    update: {},
    create: {
      name: 'TireMax Borracharia Demo',
      slug: 'tiremax-demo',
      cnpj: '00.000.000/0001-00',
      phone: '(51) 99999-9999',
      whatsapp: '5551999999999',
      email: 'demo@tiremax.com.br',
      address: 'Rua das Borrachas, 123',
      city: 'São Leopoldo',
      state: 'RS',
      zipCode: '93000-000',
      openHours: 'Seg - Sáb: 08:00 às 18:00',
      primaryColor: '#f5c800',
      plan: 'TRIAL',
      trialEndsAt,
    },
  });
  console.log('✅ Tenant criado:', tenant.name);

  // Usuários
  const adminPass = await bcrypt.hash('admin123', 10);
  const empPass = await bcrypt.hash('emp123', 10);
  const finPass = await bcrypt.hash('fin123', 10);

  await prisma.user.upsert({
    where: { id: 'user-admin-demo' },
    update: {},
    create: { id: 'user-admin-demo', tenantId: tenant.id, name: 'Administrador', email: 'admin@tiremax.com', password: adminPass, role: 'ADMIN' },
  });
  await prisma.user.upsert({
    where: { id: 'user-emp-demo' },
    update: {},
    create: { id: 'user-emp-demo', tenantId: tenant.id, name: 'João Funcionário', email: 'funcionario@tiremax.com', password: empPass, role: 'EMPLOYEE' },
  });
  await prisma.user.upsert({
    where: { id: 'user-fin-demo' },
    update: {},
    create: { id: 'user-fin-demo', tenantId: tenant.id, name: 'Maria Financeiro', email: 'financeiro@tiremax.com', password: finPass, role: 'FINANCIAL' },
  });
  console.log('✅ Usuários criados');

  // Categorias
  const cats = await Promise.all([
    prisma.category.upsert({ where: { id: 'cat-pneus' }, update: {}, create: { id: 'cat-pneus', tenantId: tenant.id, name: 'Pneus' } }),
    prisma.category.upsert({ where: { id: 'cat-rodas' }, update: {}, create: { id: 'cat-rodas', tenantId: tenant.id, name: 'Rodas e Aros' } }),
    prisma.category.upsert({ where: { id: 'cat-pecas' }, update: {}, create: { id: 'cat-pecas', tenantId: tenant.id, name: 'Peças e Acessórios' } }),
  ]);
  console.log('✅ Categorias criadas');

  // Produtos
  await prisma.product.upsert({ where: { id: 'prod-1' }, update: {}, create: { id: 'prod-1', tenantId: tenant.id, code: 'P001', name: 'Pneu Pirelli 195/60 R14', categoryId: cats[0].id, brand: 'Pirelli', costPrice: 280, salePrice: 420, stock: 2, minStock: 3 } });
  await prisma.product.upsert({ where: { id: 'prod-2' }, update: {}, create: { id: 'prod-2', tenantId: tenant.id, code: 'P002', name: 'Pneu Continental 205/55 R16', categoryId: cats[0].id, brand: 'Continental', costPrice: 380, salePrice: 580, stock: 3, minStock: 4 } });
  await prisma.product.upsert({ where: { id: 'prod-3' }, update: {}, create: { id: 'prod-3', tenantId: tenant.id, code: 'A001', name: 'Velas de Ignição NGK', categoryId: cats[2].id, brand: 'NGK', costPrice: 35, salePrice: 65, stock: 1, minStock: 5 } });
  console.log('✅ Produtos criados');

  // Clientes
  const client1 = await prisma.client.upsert({ where: { id: 'cli-1' }, update: {}, create: { id: 'cli-1', tenantId: tenant.id, name: 'Carlos Silva', document: '123.456.789-00', documentType: 'CPF', phone: '(51) 98765-4321', whatsapp: '5551987654321', email: 'carlos@email.com', city: 'São Leopoldo', state: 'RS' } });
  const client2 = await prisma.client.upsert({ where: { id: 'cli-2' }, update: {}, create: { id: 'cli-2', tenantId: tenant.id, name: 'Ana Souza', document: '987.654.321-00', documentType: 'CPF', phone: '(51) 91234-5678', city: 'Novo Hamburgo', state: 'RS' } });
  console.log('✅ Clientes criados');

  // Veículos
  await prisma.vehicle.upsert({ where: { id: 'vei-1' }, update: {}, create: { id: 'vei-1', tenantId: tenant.id, clientId: client1.id, plate: 'ABC-1234', brand: 'Volkswagen', model: 'Gol', year: 2018, color: 'Prata' } });
  await prisma.vehicle.upsert({ where: { id: 'vei-2' }, update: {}, create: { id: 'vei-2', tenantId: tenant.id, clientId: client2.id, plate: 'DEF-5678', brand: 'Fiat', model: 'Uno', year: 2020, color: 'Branco' } });
  console.log('✅ Veículos criados');

  console.log('\n🎉 Seed concluído!');
  console.log('📋 Login:');
  console.log('   admin@tiremax.com / admin123');
  console.log('   funcionario@tiremax.com / emp123');
  console.log('   financeiro@tiremax.com / fin123');
}

main().catch(console.error).finally(() => prisma.$disconnect());
