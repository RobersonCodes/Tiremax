<div align="center">

<img src="https://capsule-render.vercel.app/api?type=waving&color=0:0f2027,100:203a43&height=200&section=header&text=TireMax%20ERP&fontSize=46&fontColor=ffffff&animation=fadeIn&fontAlignY=35&desc=Gest%C3%A3o%20completa%20para%20borracharias%20e%20centros%20automotivos&descAlignY=58&descSize=16"/>

**ERP multi-tenant em produção** para borracharias e centros automotivos: clientes/veículos, ordens de serviço, estoque, PDV, financeiro e apps nativos Android/iOS a partir da mesma base React.

<p>
<img src="https://img.shields.io/badge/Node.js-20-339933?style=flat-square&logo=nodedotjs&logoColor=white"/>
<img src="https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react&logoColor=black"/>
<img src="https://img.shields.io/badge/Prisma-5-2D3748?style=flat-square&logo=prisma&logoColor=white"/>
<img src="https://img.shields.io/badge/PostgreSQL-16-4169E1?style=flat-square&logo=postgresql&logoColor=white"/>
<img src="https://img.shields.io/badge/Deploy-live-2ea44f?style=flat-square"/>
<img src="https://img.shields.io/badge/Tests-148%20passing-2ea44f?style=flat-square"/>
<img src="https://img.shields.io/badge/License-MIT-yellow?style=flat-square"/>
</p>

<p>
<a href="https://github.com/RobersonCodes/Tiremax/actions/workflows/ci.yml"><img src="https://github.com/RobersonCodes/Tiremax/actions/workflows/ci.yml/badge.svg"/></a>
<a href="https://tiremax.vercel.app"><img src="https://img.shields.io/badge/demo-tiremax.vercel.app-3b64ff?style=flat-square&logo=vercel&logoColor=white"/></a>
<a href="https://github.com/RobersonCodes"><img src="https://img.shields.io/badge/perfil-RobersonCodes-181717?style=flat-square&logo=github&logoColor=white"/></a>
</p>

</div>

---

> **Nota de transparência**: tinha bug de verdade escondido aqui, não só desatualização de texto — ver [Bugs corrigidos](#bugs-corrigidos).

## Sumário

- [Funcionalidades](#-funcionalidades)
- [Arquitetura](#arquitetura)
- [Multi-tenancy](#multi-tenancy)
- [Instalação rápida](#-instalação-rápida)
- [Docker Compose](#-docker-compose)
- [Estrutura do projeto](#-estrutura-do-projeto)
- [Banco de dados](#️-banco-de-dados)
- [API Endpoints](#-api-endpoints)
- [Testes automatizados](#-testes-automatizados)
- [App mobile (Capacitor)](#-app-mobile-capacitor)
- [Comparação com produtos consolidados](#comparação-com-produtos-consolidados)
- [Roadmap](#roadmap)
- [Bugs corrigidos](#bugs-corrigidos)
- [Licença](#-licença)

---

## 📋 Funcionalidades

| Módulo | Funcionalidades |
|--------|----------------|
| 🔐 **Auth** | Login JWT, controle de permissões (Admin/Funcionário/Financeiro), esqueci/redefinir senha por e-mail |
| 👤 **Equipe** | Convite e gestão de usuários do tenant (ativar/desativar, trocar cargo) — só Admin |
| 📊 **Dashboard** | Métricas em tempo real, gráfico de faturamento, estoque baixo |
| 👥 **Clientes** | CRUD completo, busca dinâmica, histórico de compras e serviços |
| 📦 **Estoque** | Pneus, peças, movimentações, alertas de estoque baixo |
| 🛒 **PDV** | Ponto de venda, carrinho, desconto, múltiplos pagamentos |
| 🔧 **Serviços** | Ordens de serviço, status, peças, mão de obra |
| 💰 **Financeiro** | Contas a pagar/receber, fluxo de caixa |
| 📈 **Relatórios** | Gráficos de faturamento, análise de estoque |
| 🧾 **Fiscal** | Emissão de NFC-e (venda) e NFS-e (serviço) via [Focus NFe](https://focusnfe.com.br/), com consulta de status assíncrona e cancelamento (ver nota abaixo) |

> O módulo Fiscal integra com a Focus NFe como provedor único (`backend/src/services/focusNfe.service.js`) — cada tenant cadastra sua própria empresa/certificado A1 no painel da Focus NFe antes de emitir. Ainda não é a abstração "um provedor por município" originalmente cogitada (`backend/src/modules/fiscal/`), é uma integração direta e pragmática com um único parceiro.

---

## Arquitetura

MVC pragmático: rotas → controllers → Prisma. Sem camada de serviço/domínio separada — decisão consciente para o tamanho atual do projeto, não uma limitação acidental.

```mermaid
graph TD
    Client[React SPA / App Capacitor] -->|HTTPS + JWT| API[Express API]
    API --> MW[Middleware: auth JWT + role]
    MW --> Ctrl[Controllers por módulo]
    Ctrl --> Prisma[Prisma Client]
    Prisma --> DB[(PostgreSQL)]
    API -.build estático.-> CDN[Vercel]
```

- **Backend**: Node.js + Express, controllers finos por módulo (`client`, `product`, `sale`, `service`, `financial`, ...), Prisma como única camada de acesso a dados.
- **Frontend**: React 18 + Vite + Tailwind, Framer Motion para as micro-animações, Recharts para os gráficos do dashboard.
- **Mobile**: mesma base React empacotada via Capacitor para Android/iOS — não é um app nativo separado, é o mesmo SPA rodando num WebView com plugins nativos (câmera, push, haptics).

---

## Multi-tenancy

Isolamento por tenant é **estrutural**, não só convenção manual — cada controller ainda escreve `where: { tenantId: req.tenantId }` (isso continua, é a defesa em primeira camada), mas agora existe uma segunda camada que não depende do dev lembrar:

```mermaid
sequenceDiagram
    participant C as Cliente
    participant MW as tenantMiddleware
    participant Ctx as AsyncLocalStorage
    participant Ctrl as Controller
    participant Ext as Prisma Client Extension
    participant DB as PostgreSQL

    C->>MW: Request + JWT (contém tenantId)
    MW->>Ctx: runWithTenant(tenantId, next)
    Ctx->>Ctrl: resto da requisição roda dentro do contexto
    Ctrl->>Ext: prisma.produto.findMany({ where: {...} })
    Note over Ext: injeta/força tenantId no where<br/>(e no data, contra mass-assignment)<br/>usando o tenantId do contexto, não o que o controller passou
    Ext->>DB: Query sempre filtrada pelo tenant certo
    DB-->>Ctrl: Dados do tenant
```

`backend/src/config/tenantContext.js` carrega o `tenantId` da requisição atual via `AsyncLocalStorage` através de toda a cadeia async; `backend/src/config/database.js` usa um Prisma Client Extension (`$allModels.$allOperations`) que, sempre que há um contexto ativo, força `tenantId` no `where` de toda leitura/escrita e no `data` de `create`/`update` em todo modelo com essa coluna — mesmo que o controller esqueça, ou que o corpo da requisição tente forjar um `tenantId` de outro tenant. Rotas sem `tenantMiddleware` (login, `/register`, administração via SUPER_ADMIN) não têm contexto ativo, então continuam funcionando sem restrição — é assim que login por e-mail (cross-tenant por natureza) e o painel de SUPER_ADMIN seguem funcionando normalmente.

**Por que isso existia como problema**: um controller que esquecesse o `tenantId` no `where` vazava dados entre tenants sem erro nenhum — silencioso. Não era hipotético: os testes de isolamento pegaram exatamente esse padrão em produção, em quatro controllers (`product`, `vehicle`, `service`, `user` — ver [Changelog](./CHANGELOG.md) e [Bugs corrigidos](#bugs-corrigidos)). A extension fecha essa classe inteira de bug — `backend/tests/tenant-extension.test.js` prova isso simulando, via uma rota que roda o `tenantMiddleware` de verdade, exatamente o tipo de "esqueceu o tenantId" que já vazou antes.

Comparado ao [EduLex](https://github.com/RobersonCodes/SaaS-Educativo), onde o mesmo problema é resolvido via `HasQueryFilter` automático do EF Core — mesma ideia (isolamento automático na camada de acesso a dados), implementação equivalente aqui via Prisma.

---

## 🚀 Instalação rápida

### Pré-requisitos
- Node.js 18+
- PostgreSQL 16+ rodando
- npm ou yarn

### 1. Clone e instale dependências

```bash
# Backend
cd backend
cp .env.example .env
# Edite .env com suas credenciais PostgreSQL
npm install

# Frontend
cd ../frontend
npm install
```

### 2. Configure as variáveis de ambiente

Edite `backend/.env`:
```env
DATABASE_URL="postgresql://postgres:sua_senha@localhost:5432/tiremax_erp"
JWT_SECRET="sua-chave-secreta-muito-segura"
```

Opcionais, só necessárias para os recursos correspondentes (ver `backend/.env.example`):
- `FRONTEND_URL` + `RESEND_API_KEY` / `EMAIL_FROM` — para o e-mail de redefinição de senha funcionar de verdade (sem isso o link é gerado, mas o e-mail não é enviado).
- `FOCUS_NFE_TOKEN` — token da conta master na Focus NFe, necessário pra emitir nota fiscal.

### 3. Rode as migrations e seed

```bash
cd backend
npm run db:migrate   # Cria as tabelas
npm run db:seed      # Popula com dados iniciais
```

### 4. Inicie o projeto

```bash
# Terminal 1 — Backend (porta 3001)
cd backend && npm run dev

# Terminal 2 — Frontend (porta 5173)
cd frontend && npm run dev
```

Acesse: **http://localhost:5173**

---

## 🔑 Credenciais de acesso (demo/seed)

| Perfil | E-mail | Senha |
|--------|--------|-------|
| **Admin** | admin@tiremax.com | admin123 |
| **Funcionário** | funcionario@tiremax.com | emp123 |
| **Financeiro** | financeiro@tiremax.com | fin123 |

---

## 🐳 Docker Compose

```bash
# Sobe tudo (PostgreSQL + Backend + Frontend)
docker-compose up -d

# Ver logs
docker-compose logs -f backend

# Rodar seed
docker-compose exec backend node prisma/seed.js
```

---

## 📁 Estrutura do projeto

```
tiremax-erp/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma      # Schema completo do banco (PostgreSQL, 15 models)
│   │   └── seed.js
│   ├── src/
│   │   ├── config/database.js     # Prisma client
│   │   ├── controllers/           # Lógica por módulo (client, product, sale, service, financial...)
│   │   ├── middlewares/           # auth (JWT + role), errorHandler, notFound
│   │   ├── routes/
│   │   ├── app.js
│   │   └── server.js
│   ├── .env.example
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── components/            # layout, ui, PrivateRoute
│   │   ├── contexts/AuthContext.jsx
│   │   ├── pages/                 # dashboard, clients, inventory, sales, services, financial, reports
│   │   ├── services/api.js
│   │   └── utils/format.js
│   ├── capacitor.config.ts
│   └── Dockerfile
└── docker-compose.yml
```

---

## 🗄️ Banco de dados

15 models no Prisma schema — 9 mostrados aqui (núcleo do domínio):

```mermaid
erDiagram
    TENANT ||--o{ USER : emprega
    TENANT ||--o{ CLIENT : atende
    TENANT ||--o{ PRODUCT : estoca
    TENANT ||--o{ SALE : registra
    TENANT ||--o{ SERVICE : registra
    CLIENT ||--o{ VEHICLE : possui
    SALE ||--o{ SALE_ITEM : contem
    SERVICE ||--o{ SERVICE_ITEM : contem
    PRODUCT ||--o{ SALE_ITEM : vendido_em
    PRODUCT ||--o{ STOCK_MOVEMENT : movimenta
    SALE ||--|| INVOICE : gera
    TENANT ||--o{ ACCOUNT_RECEIVABLE : possui
    TENANT ||--o{ ACCOUNT_PAYABLE : possui
```

| Tabela | Descrição |
|--------|-----------|
| `users` | Usuários do sistema com roles |
| `clients` | Cadastro de clientes PF/PJ |
| `vehicles` | Veículos vinculados a clientes |
| `products` | Pneus, peças e materiais |
| `sales` / `sale_items` | Vendas e itens |
| `services` / `service_items` | Ordens de serviço e itens |
| `stock_movements` | Histórico de movimentações |
| `invoices` | Notas fiscais NFC-e/NFS-e — status, PDF/XML e referência na Focus NFe |
| `payments` | Pagamentos de vendas |
| `accounts_receivable` / `accounts_payable` | Contas a receber/pagar |

Constraints únicas por tenant bem pensadas: e-mail, placa de veículo, código de produto e número de venda são únicos **dentro do tenant**, não globalmente — duas borracharias diferentes podem ter clientes com o mesmo e-mail sem colisão.

---

## 🔌 API Endpoints

```
POST   /api/auth/login             POST   /api/auth/forgot-password
GET    /api/auth/me                POST   /api/auth/reset-password

GET    /api/users              POST   /api/users
GET    /api/users/:id          PUT    /api/users/:id       DELETE /api/users/:id

GET    /api/dashboard/metrics
GET    /api/dashboard/revenue-chart
GET    /api/dashboard/recent-sales
GET    /api/dashboard/low-stock

GET    /api/clients            GET    /api/clients/search?q=
POST   /api/clients            GET    /api/clients/:id
PUT    /api/clients/:id        GET    /api/clients/:id/history

GET    /api/products           GET    /api/products/search?q=
GET    /api/products/low-stock POST   /api/products
GET    /api/products/:id       PUT    /api/products/:id

GET    /api/sales              POST   /api/sales
GET    /api/sales/:id          PATCH  /api/sales/:id/cancel

GET    /api/services           POST   /api/services
GET    /api/services/:id       PUT    /api/services/:id
PATCH  /api/services/:id/status

GET    /api/stock/movements    POST   /api/stock/movements
GET    /api/stock/report

GET    /api/financial/receivable   POST   /api/financial/receivable
PATCH  /api/financial/receivable/:id/pay
GET    /api/financial/payable      POST   /api/financial/payable
PATCH  /api/financial/payable/:id/pay
GET    /api/financial/cashflow     GET    /api/financial/summary

GET    /api/invoices               GET    /api/invoices/:id
POST   /api/invoices/from-sale/:saleId       POST   /api/invoices/from-service/:serviceId
POST   /api/invoices/issue/:id     GET    /api/invoices/:id/status
POST   /api/invoices/cancel/:id
```

---

## 🧪 Testes automatizados

148 testes (Jest + Supertest, `backend/tests/`) cobrindo todos os controllers do backend — auth (login, reset de senha), isolamento de tenant (incluindo o Prisma Client Extension, ver seção acima), autorização por role, notas fiscais (Focus NFe mockada, sem chamada de rede real), rate limiting, e as regras de negócio de cada módulo (numeração sequencial por tenant, débito de estoque, constraints únicas).

```bash
cd backend
cp .env.test.example .env.test   # aponta pra um Postgres SÓ de teste
npm test
```

A `DATABASE_URL` de `.env.test` **precisa terminar em `_test`** — é uma trava de segurança (`tests/helpers/testDb.js`) pensada porque este projeto está em produção: os testes recusam rodar contra qualquer banco que não pareça ser dedicado a teste. O `globalSetup` do Jest aplica as migrations nesse banco automaticamente; cada teste limpa as tabelas via `TRUNCATE ... CASCADE` antes de rodar.

Roda em CI a cada push/PR pra `main` (`.github/workflows/ci.yml`): um job sobe um Postgres efêmero (só existe dentro do job, nunca é o de dev/produção) e roda a suíte inteira; outro job roda `lint` + `build` do frontend.

---

## 🎨 Design System

- **Tema**: Dark mode profissional
- **Fontes**: Space Grotesk (display) + Inter (corpo) + JetBrains Mono (código)
- **Cores**: Brand âmbar/dourado (`#f0b400`) sobre neutros escuros (`surface-950`…`surface-400`), com verde/vermelho/azul de apoio para status
- **Componentes**: Set compartilhado em `frontend/src/components/ui/index.jsx` (`Button`, `Card`, `Table`, `StatusBadge`, `Modal`, `PageHeader`...) — migração em andamento, algumas páginas ainda usam classes antigas (ver `CLAUDE.md`)
- **Responsivo**: Desktop, Tablet, Mobile

## 🛠️ Tecnologias

**Backend:** Node.js · Express · Prisma ORM · PostgreSQL · JWT · Bcrypt · Multer
**Frontend:** React 18 · Vite · Tailwind CSS · Framer Motion · Recharts · Lucide

---

## 📱 App mobile (Capacitor)

O TireMax ERP pode ser instalado como app nativo em Android e iOS via Capacitor — mesma base React, sem app nativo paralelo para manter.

| Feature | Android | iOS |
|---------|---------|-----|
| Vibração (haptics) | ✅ | ✅ |
| Status bar customizada | ✅ | ✅ |
| Splash screen | ✅ | ✅ |
| Botão voltar | ✅ | — |
| Câmera | ✅ | ✅ |
| Push notifications | ✅ | ✅ |
| Detector de rede offline | ✅ | ✅ |
| Storage nativo | ✅ | ✅ |

Guias completos: [Android](./CAPACITOR_ANDROID.md) · [iOS](./CAPACITOR_IOS.md) (Mac + Xcode + Apple Developer Account necessários para iOS).

---

## Comparação com produtos consolidados

| Dimensão | TireMax (este repo) | ERP SaaS consolidado |
|---|---|---|
| Em produção com uso real | ✅ Deploy público, dashboard ao vivo | ✅ |
| Multi-tenancy | ✅ Estrutural — Prisma Client Extension + convenção manual (defesa em duas camadas) | ✅ Estrutural (RLS ou middleware garantido) |
| Testes automatizados | ✅ 148 testes (Jest/Supertest), rodando em CI a cada push/PR | ✅ |
| CI/CD | 🟡 GitHub Actions roda lint/build/test; deploy é automático mas separado (Vercel/Railway, não gatilhado pelo CI) | ✅ |
| Segurança HTTP (helmet, rate limit) | ✅ helmet + rate limit geral e reforçado em auth | ✅ |
| Módulo fiscal | 🟡 Focus NFe integrado (NFC-e/NFS-e), mas um único provedor, não abstração multi-município | ✅ Integração ativa |
| App mobile | ✅ Android/iOS via Capacitor, mesma base | Varia |

O que ainda mais pesa aqui é o módulo fiscal ser um provedor único (Focus NFe) em vez de uma abstração multi-município, e o CI não disparar o próprio deploy (Vercel/Railway seguem automáticos, mas independentes do pipeline). Ver [Changelog](./CHANGELOG.md) para o histórico completo de versões.

---

## Roadmap

- [x] Migrar isolamento de tenant de manual para estrutural — Prisma Client Extension (`backend/src/config/database.js` + `tenantContext.js`)
- [x] Suíte de testes automatizados (148 testes, Jest + Supertest — ver [Testes automatizados](#-testes-automatizados))
- [x] CI (lint + build + test) via GitHub Actions (`.github/workflows/ci.yml`)
- [x] `helmet` + rate limiting no backend
- [x] Changelog e releases versionadas (ver [CHANGELOG.md](./CHANGELOG.md))
- [ ] CI disparando o deploy (hoje Vercel/Railway são automáticos, mas independentes do pipeline)
- [ ] Decidir se vale abstrair o módulo fiscal pra múltiplos provedores/municípios ou manter só Focus NFe

---

## Bugs corrigidos

Fica registrado porque foi feio: o `docker-compose.yml` subia MySQL enquanto o `schema.prisma` e o `.env.example` sempre foram PostgreSQL — ou seja, `docker-compose up` derrubava a API na primeira query. Junto com isso:

1. **`docker-compose.yml` com o banco errado** — trocado o serviço `mysql:8.0` por `postgres:16-alpine`, consistente com o schema real.
2. **`.env.example` com 5 variáveis mortas** (`WHATSAPP_ENABLED`, `EVOLUTION_API_URL`, `EVOLUTION_API_KEY`, `EVOLUTION_INSTANCE`, `STORE_WHATSAPP`) de uma automação via WhatsApp que nunca saiu do papel — zero ocorrências no resto do código. Removidas.
3. **Licença alegada sem arquivo** — o README dizia "MIT © 2024" mas não existia `LICENSE` no repositório. Adicionado.
4. **`database.sql` na raiz era um script MySQL avulso**, sem tabelas reais e sem nada referenciando ele — a migração de verdade vem do Prisma (`backend/prisma/migrations/`). Removido.
5. **README documentava instalação com MySQL** (badge, `DATABASE_URL` de exemplo, seção de tecnologias) — atualizado pra PostgreSQL em todas as ocorrências.
6. **Migration faltante para o schema fiscal/invoice/reset de senha** — os campos novos em `tenants` (fiscal), `invoices` (`type`, `pdf_url`, `xml_url`, `focus_ref`, `error_message`) e `users` (`reset_token`, `reset_token_expiry`) tinham sido adicionados no `schema.prisma`, mas a migration correspondente nunca foi gerada. Como o `start.js` do Railway roda só `prisma migrate deploy` (aplica migrations existentes, não gera novas), o banco de produção ficou sem essas colunas até a migration ser criada e commitada.
7. **`authorize('ADMIN', 'FINANCIAL')` removido sem querer nas rotas de nota fiscal** — no refactor pra Focus NFe, `invoice.routes.js` perdeu o middleware de permissão em `issue`/`cancel` (e nunca teve nas novas `from-sale`/`from-service`), permitindo que qualquer usuário autenticado do tenant emitisse ou cancelasse notas fiscais. Restaurado.
8. **`npm run lint` do frontend nunca funcionou** — não existia `.eslintrc.cjs` (nem qualquer config) no repositório, então o comando falhava antes de analisar um único arquivo. Adicionada a config e corrigido o backlog de 44 problemas que ela revelou (catch vazios sem comentário, deps de hook faltando, imports mortos, aspas não escapadas em JSX).
9. **Vazamento cross-tenant real em `product`/`vehicle`/`service`/`user` (`update`)** — o pior bug encontrado neste projeto. Cada um fazia um `updateMany` corretamente escopado por `tenantId` (então nunca escrevia em registro de outro tenant), mas em seguida buscava o registro pra devolver na resposta com `findUnique({ where: { id } })` **sem `tenantId`**. Se o `updateMany` não casasse nenhuma linha (ID de outro tenant), a resposta ainda vinha com os dados completos do registro alheio — preço de custo de produto, nome/telefone de cliente vinculado a uma OS, nome/e-mail de usuário. Corrigido checando `.count` do `updateMany` antes de buscar; testes de regressão em `tenant-isolation.test.js` pra cada um dos quatro. **Atualização**: esse padrão inteiro de bug — qualquer query que esqueça `tenantId` — foi fechado estruturalmente depois, ver [Multi-tenancy](#multi-tenancy) e o [Changelog](./CHANGELOG.md).
10. **"Sucesso enganoso" espalhado por `remove`/`cancel`/`updateStatus`** — em `client`, `product`, `sale`, `service`, `user`, `vehicle` e `financial`, o padrão `updateMany`/`deleteMany` escopado por `tenantId` respondia 200 mesmo quando nenhuma linha era afetada (ID inexistente ou de outro tenant). Sem vazamento de dado — a escrita nunca acontecia — mas a API mentia sobre o resultado. Corrigido em todos os pontos encontrados, checando `.count`/`.length` antes de responder sucesso.
11. **`stock.controller.js` retornava 500 em vez de 404** — `createMovement` lançava um `Error` puro (sem `statusCode`) ao tentar mexer em produto de outro tenant, caindo no handler genérico de erro. Corrigido pra usar `statusCode: 404`, como o resto do código já fazia.

---

## 📄 Licença

MIT — ver [`LICENSE`](LICENSE).

---

<div align="center">

Parte do portfólio de **[Roberson de Oliveira](https://github.com/RobersonCodes)** · Full-Stack Engineer

<img src="https://capsule-render.vercel.app/api?type=waving&color=0:203a43,100:0f2027&height=100&section=footer"/>

</div>
