// Trava de segurança: qualquer script aqui só pode rodar contra o banco de
// teste. Isso existe porque o TireMax já está em produção — um TRUNCATE ou
// migrate deploy disparado com a DATABASE_URL errada apagaria dados reais.
function assertTestDatabase(url) {
  let parsed;
  try {
    parsed = new URL(url || '');
  } catch {
    throw new Error(`DATABASE_URL inválida para testes: "${url}"`);
  }
  const dbName = parsed.pathname.replace(/^\//, '');
  if (!dbName.endsWith('_test')) {
    throw new Error(
      `Recusando rodar testes contra o banco "${dbName}" — o nome precisa terminar em "_test". ` +
      'Verifique se backend/.env.test aponta para um banco isolado de dev/produção.'
    );
  }
  return dbName;
}

module.exports = { assertTestDatabase };
