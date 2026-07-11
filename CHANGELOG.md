# Changelog

Todas as mudanças notáveis deste projeto são documentadas aqui. Formato baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/), versionamento em [SemVer](https://semver.org/lang/pt-BR/).

## [Unreleased]

## [1.1.0] - 2026-07-11

### Added
- Emissão de NFC-e (venda) e NFS-e (serviço) via [Focus NFe](https://focusnfe.com.br/): criação de rascunho a partir de venda/OS, emissão, consulta de status assíncrona e cancelamento.
- Fluxo de esqueci/redefinir senha por e-mail (Resend).
- Página de gestão de equipe — convidar, editar cargo, ativar/desativar usuários do tenant.
- Suíte de testes automatizados (Jest + Supertest, 148 testes) cobrindo todos os controllers do backend, rodando contra um Postgres isolado dedicado a teste.
- CI via GitHub Actions: testes de backend (com Postgres efêmero) + lint/build de frontend em todo push/PR.
- Isolamento de tenant estrutural via Prisma Client Extension (`backend/src/config/database.js` + `tenantContext.js`, AsyncLocalStorage) — além da convenção manual já existente, agora `tenantId` é injetado/validado automaticamente em toda query de modelo tenant-scoped, fechando a classe inteira de bug descrita abaixo.
- `helmet` + rate limiting (geral e reforçado em login/forgot-password/reset-password) no backend.

### Fixed
- Vazamento de dado cross-tenant real em `product`/`vehicle`/`service`/`user` (`update` podia devolver dados completos de registro de outro tenant via `findUnique` sem `tenantId`).
- "Sucesso enganoso" (resposta 200 sem alterar nada) em vários endpoints de `remove`/`cancel`/`updateStatus`/`pay`.
- `authorize('ADMIN', 'FINANCIAL')` removido acidentalmente das rotas de nota fiscal durante o refactor pra Focus NFe — restaurado.
- Migration faltante para os campos fiscais/invoice/reset de senha, causando drift entre `schema.prisma` e o banco de produção.
- `docker-compose.yml` migrado de MySQL pra PostgreSQL, consistente com o schema real.
- `stock.controller.js` retornava 500 em vez de 404 ao tentar mexer em produto de outro tenant.
- ESLint sem nenhuma configuração no frontend — `npm run lint` não rodava; corrigido o backlog de 44 problemas que a config revelou.
- `.env.example` com variáveis mortas de uma automação via WhatsApp que nunca saiu do papel.
- Licença alegada no README sem arquivo `LICENSE` correspondente.

### Changed
- Design system do frontend: paleta âmbar/dourada (`#f0b400`) sobre neutros escuros, Space Grotesk (display) + Inter (corpo), substituindo o azul/DM Sans antigo.

## [1.0.0] - histórico anterior

Base do ERP antes deste ciclo de correções: clientes/veículos, estoque, PDV, ordens de serviço, financeiro, dashboard, multi-tenancy por convenção manual, deploy em produção (Vercel + Railway). Sem changelog formal até aqui — ver `git log` para o histórico completo.
