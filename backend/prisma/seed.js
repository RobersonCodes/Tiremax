const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')
const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting seed...')

  const adminPassword = await bcrypt.hash('admin123', 10)
  const empPassword = await bcrypt.hash('emp123', 10)

  await prisma.user.upsert({
    where: { email: 'admin@tiremax.com' },
    update: {},
    create: { name: 'Administrador', email: 'admin@tiremax.com', password: adminPassword, role: 'ADMIN', phone: '(11) 99999-0001' },
  })
  await prisma.user.upsert({
    where: { email: 'funcionario@tiremax.com' },
    update: {},
    create: { name: 'João Silva', email: 'funcionario@tiremax.com', password: empPassword, role: 'EMPLOYEE', phone: '(11) 99999-0002' },
  })
  await prisma.user.upsert({
    where: { email: 'financeiro@tiremax.com' },
    update: {},
    create: { name: 'Maria Financeiro', email: 'financeiro@tiremax.com', password: await bcrypt.hash('fin123', 10), role: 'FINANCIAL', phone: '(11) 99999-0003' },
  })
  console.log('✅ Users created')

  await prisma.category.upsert({ where: { id: 'cat-pneus' }, update: {}, create: { id: 'cat-pneus', name: 'Pneus' } })
  await prisma.category.upsert({ where: { id: 'cat-pecas' }, update: {}, create: { id: 'cat-pecas', name: 'Peças' } })
  await prisma.category.upsert({ where: { id: 'cat-oleo' }, update: {}, create: { id: 'cat-oleo', name: 'Lubrificantes' } })
  await prisma.category.upsert({ where: { id: 'cat-acessorios' }, update: {}, create: { id: 'cat-acessorios', name: 'Acessórios' } })
  console.log('✅ Categories created')

  const products = [
    { id: 'prod-1', code: 'PNE001', name: 'Pneu Michelin 175/70 R13', categoryId: 'cat-pneus', brand: 'Michelin', costPrice: 180, salePrice: 280, stock: 25, minStock: 5 },
    { id: 'prod-2', code: 'PNE002', name: 'Pneu Bridgestone 195/65 R15', categoryId: 'cat-pneus', brand: 'Bridgestone', costPrice: 250, salePrice: 380, stock: 15, minStock: 4 },
    { id: 'prod-3', code: 'PNE003', name: 'Pneu Continental 205/55 R16', categoryId: 'cat-pneus', brand: 'Continental', costPrice: 320, salePrice: 490, stock: 3, minStock: 4 },
    { id: 'prod-4', code: 'PNE004', name: 'Pneu Pirelli 185/60 R14', categoryId: 'cat-pneus', brand: 'Pirelli', costPrice: 210, salePrice: 320, stock: 2, minStock: 5 },
    { id: 'prod-5', code: 'OLE001', name: 'Óleo Motor 5W30 Sintético 1L', categoryId: 'cat-oleo', brand: 'Mobil', unit: 'LT', costPrice: 22, salePrice: 38, stock: 50, minStock: 10 },
    { id: 'prod-6', code: 'PEC001', name: 'Pastilha de Freio Dianteira', categoryId: 'cat-pecas', brand: 'Bosch', unit: 'JG', costPrice: 65, salePrice: 110, stock: 12, minStock: 3 },
    { id: 'prod-7', code: 'PEC002', name: 'Filtro de Ar Universal', categoryId: 'cat-pecas', brand: 'Fram', costPrice: 18, salePrice: 32, stock: 30, minStock: 8 },
    { id: 'prod-8', code: 'PEC003', name: 'Velas de Ignição NGK', categoryId: 'cat-pecas', brand: 'NGK', unit: 'JG', costPrice: 42, salePrice: 72, stock: 1, minStock: 5 },
  ]
  for (const p of products) {
    await prisma.product.upsert({ where: { id: p.id }, update: {}, create: p })
  }
  console.log('✅ Products created')

  const clients = [
    { id: 'cli-1', name: 'Carlos Eduardo Santos', document: '123.456.789-01', documentType: 'CPF', phone: '(11) 98765-4321', whatsapp: '11987654321', city: 'São Paulo', state: 'SP' },
    { id: 'cli-2', name: 'Ana Paula Ferreira', document: '987.654.321-09', documentType: 'CPF', phone: '(11) 91234-5678', city: 'São Paulo', state: 'SP' },
    { id: 'cli-3', name: 'Empresa ABC Ltda', document: '12.345.678/0001-90', documentType: 'CNPJ', phone: '(11) 3333-4444', city: 'São Paulo', state: 'SP' },
    { id: 'cli-4', name: 'Roberto Alves', document: '456.789.123-00', documentType: 'CPF', phone: '(11) 95555-6666', city: 'Guarulhos', state: 'SP' },
  ]
  for (const c of clients) {
    await prisma.client.upsert({ where: { id: c.id }, update: {}, create: c })
  }
  console.log('✅ Clients created')

  const vehicles = [
    { id: 'veh-1', clientId: 'cli-1', plate: 'ABC1D23', brand: 'Volkswagen', model: 'Gol', year: 2019, color: 'Branco' },
    { id: 'veh-2', clientId: 'cli-2', plate: 'XYZ9W87', brand: 'Chevrolet', model: 'Onix', year: 2021, color: 'Prata' },
    { id: 'veh-3', clientId: 'cli-4', plate: 'GHI7F89', brand: 'Toyota', model: 'Corolla', year: 2022, color: 'Cinza' },
  ]
  for (const v of vehicles) {
    await prisma.vehicle.upsert({ where: { id: v.id }, update: {}, create: v })
  }
  console.log('✅ Vehicles created')

  await prisma.accountPayable.createMany({
    skipDuplicates: true,
    data: [
      { description: 'Aluguel do estabelecimento', supplier: 'Imobiliária Santos', amount: 3500, dueDate: new Date(new Date().getFullYear(), new Date().getMonth(), 5), category: 'Aluguel' },
      { description: 'Conta de energia elétrica', supplier: 'ENEL', amount: 580, dueDate: new Date(new Date().getFullYear(), new Date().getMonth(), 15), category: 'Utilidades' },
    ],
  })
  console.log('✅ Financial records created')

  console.log('\n🎉 Seed completed!\n')
  console.log('📋 Login:')
  console.log('   admin@tiremax.com / admin123')
  console.log('   funcionario@tiremax.com / emp123')
  console.log('   financeiro@tiremax.com / fin123\n')
}

main().catch(e => { console.error('❌ Seed error:', e); process.exit(1) }).finally(() => prisma.$disconnect())
