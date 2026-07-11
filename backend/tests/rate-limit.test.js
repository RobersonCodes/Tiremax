const request = require('supertest');
const app = require('../src/app');
const prisma = require('../src/config/database');
const { cleanDatabase } = require('./helpers/cleanDb');

const originalNodeEnv = process.env.NODE_ENV;

beforeEach(async () => {
  await cleanDatabase();
});

afterAll(async () => {
  process.env.NODE_ENV = originalNodeEnv;
  await prisma.$disconnect();
});

describe('Rate limiting em /api/auth/login', () => {
  // O rate limiter é desligado em NODE_ENV=test (senão os helpers de teste,
  // que fazem login dezenas de vezes por arquivo, esbarrariam nele). Pra
  // provar que ele realmente bloqueia, força um NODE_ENV diferente só
  // durante este teste.
  it('responde 429 depois de estourar o limite de tentativas', async () => {
    process.env.NODE_ENV = 'production';
    try {
      let lastStatus;
      for (let i = 0; i < 21; i++) {
        const res = await request(app).post('/api/auth/login').send({ email: 'nao-existe@teste.com', password: 'x' });
        lastStatus = res.status;
      }
      expect(lastStatus).toBe(429);
    } finally {
      process.env.NODE_ENV = originalNodeEnv;
    }
  });
});
