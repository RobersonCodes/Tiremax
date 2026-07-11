jest.mock('../src/services/email.service');

const request = require('supertest');
const crypto = require('crypto');
const app = require('../src/app');
const prisma = require('../src/config/database');
const { sendPasswordReset } = require('../src/services/email.service');
const { cleanDatabase } = require('./helpers/cleanDb');
const { createTenant, createUser, loginAndGetToken } = require('./helpers/factories');

beforeEach(async () => {
  await cleanDatabase();
  sendPasswordReset.mockClear();
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe('POST /api/auth/login', () => {
  it('retorna token e dados do usuário com credenciais válidas', async () => {
    const tenant = await createTenant();
    const user = await createUser(tenant.id, { email: 'admin@teste.com', password: 'senha123' });

    const res = await request(app).post('/api/auth/login').send({ email: user.email, password: 'senha123' });

    expect(res.status).toBe(200);
    expect(res.body.token).toEqual(expect.any(String));
    expect(res.body.user.email).toBe(user.email);
    expect(res.body.tenant.id).toBe(tenant.id);
  });

  it('rejeita senha errada', async () => {
    const tenant = await createTenant();
    const user = await createUser(tenant.id, { email: 'admin2@teste.com', password: 'senha123' });

    const res = await request(app).post('/api/auth/login').send({ email: user.email, password: 'errada' });
    expect(res.status).toBe(401);
  });

  it('rejeita email inexistente', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: 'ninguem@teste.com', password: 'x' });
    expect(res.status).toBe(401);
  });

  it('rejeita usuário inativo', async () => {
    const tenant = await createTenant();
    const user = await createUser(tenant.id, { email: 'inativo@teste.com', password: 'senha123', active: false });

    const res = await request(app).post('/api/auth/login').send({ email: user.email, password: 'senha123' });
    expect(res.status).toBe(401);
  });

  it('bloqueia login de tenant suspenso mesmo com credenciais corretas', async () => {
    const tenant = await createTenant({ status: 'SUSPENDED' });
    const user = await createUser(tenant.id, { email: 'susp@teste.com', password: 'senha123' });

    const res = await request(app).post('/api/auth/login').send({ email: user.email, password: 'senha123' });
    expect(res.status).toBe(403);
  });
});

describe('GET /api/auth/me', () => {
  it('exige autenticação', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });

  it('retorna o usuário autenticado', async () => {
    const tenant = await createTenant();
    const user = await createUser(tenant.id, { email: 'me@teste.com' });
    const token = await loginAndGetToken(app, user.email, user.plainPassword);

    const res = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.email).toBe(user.email);
  });
});

describe('POST /api/auth/forgot-password', () => {
  it('responde com a mesma mensagem genérica pra email existente e inexistente (anti-enumeração)', async () => {
    const resInexistente = await request(app).post('/api/auth/forgot-password').send({ email: 'nao-existe@teste.com' });

    const tenant = await createTenant();
    const user = await createUser(tenant.id, { email: 'existe@teste.com' });
    const resExistente = await request(app).post('/api/auth/forgot-password').send({ email: user.email });

    expect(resInexistente.status).toBe(200);
    expect(resExistente.status).toBe(200);
    expect(resInexistente.body.message).toBe(resExistente.body.message);
  });

  it('gera resetToken hasheado (não em texto puro) quando o email existe', async () => {
    const tenant = await createTenant();
    const user = await createUser(tenant.id, { email: 'reset@teste.com' });

    await request(app).post('/api/auth/forgot-password').send({ email: user.email });

    const updated = await prisma.user.findUnique({ where: { id: user.id } });
    expect(updated.resetToken).toEqual(expect.any(String));
    expect(updated.resetTokenExpiry.getTime()).toBeGreaterThan(Date.now());

    const [{ resetUrl }] = sendPasswordReset.mock.calls.at(-1);
    const rawTokenSentByEmail = new URL(resetUrl).searchParams.get('token');
    expect(updated.resetToken).not.toBe(rawTokenSentByEmail); // token salvo é o hash, não o valor cru
  });

  it('não mexe em nada quando o email não existe', async () => {
    const res = await request(app).post('/api/auth/forgot-password').send({ email: 'fantasma@teste.com' });
    expect(res.status).toBe(200);
    expect(sendPasswordReset).not.toHaveBeenCalled();
  });
});

describe('POST /api/auth/reset-password', () => {
  it('com token válido troca a senha e invalida a antiga', async () => {
    const tenant = await createTenant();
    const user = await createUser(tenant.id, { email: 'trocar@teste.com', password: 'antiga123' });

    await request(app).post('/api/auth/forgot-password').send({ email: user.email });
    const [{ resetUrl }] = sendPasswordReset.mock.calls.at(-1);
    const rawToken = new URL(resetUrl).searchParams.get('token');

    const res = await request(app).post('/api/auth/reset-password').send({ token: rawToken, password: 'nova12345' });
    expect(res.status).toBe(200);

    const loginComSenhaAntiga = await request(app).post('/api/auth/login').send({ email: user.email, password: 'antiga123' });
    expect(loginComSenhaAntiga.status).toBe(401);

    const loginComSenhaNova = await request(app).post('/api/auth/login').send({ email: user.email, password: 'nova12345' });
    expect(loginComSenhaNova.status).toBe(200);
  });

  it('o mesmo token não pode ser reaproveitado depois de usado', async () => {
    const tenant = await createTenant();
    const user = await createUser(tenant.id, { email: 'reuso@teste.com' });

    await request(app).post('/api/auth/forgot-password').send({ email: user.email });
    const [{ resetUrl }] = sendPasswordReset.mock.calls.at(-1);
    const rawToken = new URL(resetUrl).searchParams.get('token');

    await request(app).post('/api/auth/reset-password').send({ token: rawToken, password: 'primeira123' });
    const segundaTentativa = await request(app).post('/api/auth/reset-password').send({ token: rawToken, password: 'segunda123' });

    expect(segundaTentativa.status).toBe(400);
  });

  it('rejeita token inválido', async () => {
    const res = await request(app).post('/api/auth/reset-password').send({ token: 'token-que-nao-existe', password: 'nova12345' });
    expect(res.status).toBe(400);
  });

  it('rejeita token expirado', async () => {
    const tenant = await createTenant();
    const user = await createUser(tenant.id, { email: 'expirado@teste.com' });
    const rawToken = 'token-de-teste-expirado';
    const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');
    await prisma.user.update({
      where: { id: user.id },
      data: { resetToken: hashedToken, resetTokenExpiry: new Date(Date.now() - 1000) },
    });

    const res = await request(app).post('/api/auth/reset-password').send({ token: rawToken, password: 'nova12345' });
    expect(res.status).toBe(400);
  });

  it('rejeita senha nova curta demais', async () => {
    const res = await request(app).post('/api/auth/reset-password').send({ token: 'qualquer-coisa', password: '123' });
    expect(res.status).toBe(400);
  });
});
