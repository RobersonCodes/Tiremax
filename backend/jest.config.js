module.exports = {
  testEnvironment: 'node',
  globalSetup: '<rootDir>/tests/globalSetup.js',
  setupFiles: ['<rootDir>/tests/setupEnv.js'],
  testMatch: ['<rootDir>/tests/**/*.test.js'],
  // Uma DB de teste compartilhada entre arquivos — evita corrida entre
  // truncates concorrentes.
  maxWorkers: 1,
};
