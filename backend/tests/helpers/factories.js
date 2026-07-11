const bcrypt = require('bcryptjs');
const { randomUUID } = require('crypto');
const request = require('supertest');
const prisma = require('../../src/config/database');

async function createTenant(overrides = {}) {
  return prisma.tenant.create({
    data: {
      name: 'Borracharia de Teste',
      slug: `tenant-${randomUUID()}`,
      status: 'ACTIVE',
      plan: 'PRO',
      ...overrides,
    },
  });
}

async function createUser(tenantId, { password = 'senha123', ...overrides } = {}) {
  const hashed = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: {
      tenantId,
      name: 'Usuário de Teste',
      email: `user-${randomUUID()}@teste.com`,
      role: 'ADMIN',
      active: true,
      ...overrides,
      password: hashed,
    },
  });
  return { ...user, plainPassword: password };
}

async function loginAndGetToken(app, email, password) {
  const res = await request(app).post('/api/auth/login').send({ email, password });
  if (res.status !== 200) {
    throw new Error(`Login falhou no setup do teste (${res.status}): ${JSON.stringify(res.body)}`);
  }
  return res.body.token;
}

module.exports = { createTenant, createUser, loginAndGetToken };
