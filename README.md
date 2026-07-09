<div align="center">

<img src="https://capsule-render.vercel.app/api?type=waving&color=0:0f2027,100:203a43&height=200&section=header&text=TireMax%20ERP&fontSize=46&fontColor=ffffff&animation=fadeIn&fontAlignY=35&desc=Gest%C3%A3o%20completa%20para%20borracharias%20e%20centros%20automotivos&descAlignY=58&descSize=16"/>

**ERP multi-tenant em produção** para borracharias e centros automotivos: clientes/veículos, ordens de serviço, estoque, PDV, financeiro e apps nativos Android/iOS a partir da mesma base React.

<p>
<img src="https://img.shields.io/badge/Node.js-20-339933?style=flat-square&logo=nodedotjs&logoColor=white"/>
<img src="https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react&logoColor=black"/>
<img src="https://img.shields.io/badge/Prisma-5-2D3748?style=flat-square&logo=prisma&logoColor=white"/>
<img src="https://img.shields.io/badge/PostgreSQL-16-4169E1?style=flat-square&logo=postgresql&logoColor=white"/>
<img src="https://img.shields.io/badge/Deploy-live-2ea44f?style=flat-square"/>
<img src="https://img.shields.io/badge/Tests-none%20yet-orange?style=flat-square"/>
<img src="https://img.shields.io/badge/License-MIT-yellow?style=flat-square"/>
</p>

<p>
<a href="https://tiremax.vercel.app"><img src="https://img.shields.io/badge/demo-tiremax.vercel.app-3b64ff?style=flat-square&logo=vercel&logoColor=white"/></a>
<a href="https://github.com/RobersonCodes"><img src="https://img.shields.io/badge/perfil-RobersonCodes-181717?style=flat-square&logo=github&logoColor=white"/></a>
</p>

</div>

---

> **Nota de transparência**: esta reescrita corrigiu 3 inconsistências reais encontradas entre o README anterior e o código — não só texto, mas bugs de repositório. Ver [Correções aplicadas nesta revisão](#correções-aplicadas-nesta-revisão).

## Sumário

- [Funcionalidades](#-funcionalidades)
- [Arquitetura](#arquitetura)
- [Multi-tenancy](#multi-tenancy--ponto-de-atenção-conhecido)
- [Instalação rápida](#-instalação-rápida)
- [Docker Compose](#-docker-compose)
- [Estrutura do projeto](#-estrutura-do-projeto)
- [Banco de dados](#️-banco-de-dados)
- [API Endpoints](#-api-endpoints)
- [App mobile (Capacitor)](#-app-mobile-capacitor)
- [Comparação com produtos consolidados](#comparação-com-produtos-consolidados)
- [Roadmap](#roadmap)
- [Correções aplicadas nesta revisão](#correções-aplicadas-nesta-revisão)
- [Licença](#-licença)

---

## 📋 Funcionalidades

| Módulo | Funcionalidades |
|--------|----------------|
| 🔐 **Auth** | Login JWT, controle de permissões (Admin/Funcionário/Financeiro) |
| 📊 **Dashboard** | Métricas em tempo real, gráfico de faturamento, estoque baixo |
| 👥 **Clientes** | CRUD completo, busca dinâmica, histórico de compras e serviços |
| 📦 **Estoque** | Pneus, peças, movimentações, alertas de estoque baixo |
| 🛒 **PDV** | Ponto de venda, carrinho, desconto, múltiplos pagamentos |
| 🔧 **Serviços** | Ordens de serviço, status, peças, mão de obra |
| 💰 **Financeiro** | Contas a pagar/receber, fluxo de caixa |
| 📈 **Relatórios** | Gráficos de faturamento, análise de estoque |
| 🧾 **Fiscal** | Estrutura de configuração para NFS-e — provedor **ainda não implementado** (ver nota abaixo) |

> O módulo Fiscal expõe as variáveis de ambiente e o ponto de extensão (`backend/src/modules/fiscal/`), mas nenhum provedor de NFS-e está implementado ainda — é andaime, não recurso pronto. Corrigido nesta revisão para não prometer mais do que existe.

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

## Multi-tenancy — ponto de atenção conhecido

Isolamento por tenant **funciona hoje**, mas por convenção manual em cada controller (`where: { tenantId: req.tenantId }`), não por *enforcement* estrutural:

```mermaid
sequenceDiagram
    participant C as Cliente
    participant Ctrl as Controller
    participant Prisma as Prisma Client
    participant DB as PostgreSQL

    C->>Ctrl: Request + JWT (contém tenantId)
    Ctrl->>Ctrl: Lê tenantId do token
    Note over Ctrl: Cada controller precisa incluir<br/>where: { tenantId } manualmente
    Ctrl->>Prisma: findMany({ where: { tenantId, ... } })
    Prisma->>DB: Query filtrada
    DB-->>Ctrl: Dados do tenant
    Note over Ctrl,DB: Sem middleware/RLS —<br/>isolamento depende de disciplina do dev,<br/>não de garantia estrutural
```

**Por que isso importa**: um controller novo que esqueça o `tenantId` no `where` vaza dados entre tenants sem erro nenhum — o bug é silencioso. É o principal item do roadmap de engenharia deste projeto (ver abaixo), com dois caminhos concretos de correção: um Prisma Client Extension que injeta `tenantId` automaticamente em toda query, ou Row-Level Security nativo do Postgres.

Comparado ao [EduLex](https://github.com/RobersonCodes/SaaS-Educativo), onde o mesmo problema é resolvido via `HasQueryFilter` automático do EF Core — a diferença entre os dois projetos é deliberada: aqui o ERP precisava ir ao ar rápido para um cliente real validar o modelo de negócio primeiro.

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

### 2. Configure o banco de dados

Edite `backend/.env`:
```env
DATABASE_URL="postgresql://postgres:sua_senha@localhost:5432/tiremax_erp"
JWT_SECRET="sua-chave-secreta-muito-segura"
```

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
| `invoices` | Notas fiscais (NFS-e — estrutura, sem provedor implementado) |
| `payments` | Pagamentos de vendas |
| `accounts_receivable` / `accounts_payable` | Contas a receber/pagar |

Constraints únicas por tenant bem pensadas: e-mail, placa de veículo, código de produto e número de venda são únicos **dentro do tenant**, não globalmente — duas borracharias diferentes podem ter clientes com o mesmo e-mail sem colisão.

---

## 🔌 API Endpoints

```
POST   /api/auth/login
GET    /api/auth/me

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
```

---

## 🎨 Design System

- **Tema**: Dark mode profissional
- **Fontes**: DM Sans (corpo) + Syne (display) + JetBrains Mono (código)
- **Cores**: Azul brand (`#3b64ff`) + Cyan accent (`#06d6e8`)
- **Componentes**: Glassmorphism, cards com glow, micro-animações
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
| Multi-tenancy | 🟡 Funcional, mas manual por convenção — sem enforcement estrutural | ✅ Estrutural (RLS ou middleware garantido) |
| Testes automatizados | ❌ Nenhum ainda | ✅ |
| CI/CD | ❌ Não configurado | ✅ |
| Segurança HTTP (helmet, rate limit) | ❌ Ausente hoje | ✅ |
| Módulo fiscal | 🟡 Estrutura pronta, sem provedor implementado | ✅ Integração ativa |
| App mobile | ✅ Android/iOS via Capacitor, mesma base | Varia |

**O que falta para reduzir essa distância**: migrar o isolamento de tenant de convenção manual para garantia estrutural é o item que mais importa aqui — é uma questão de correção, não só de maturidade. Depois disso: testes automatizados (zero hoje), `helmet` + rate limiting, e decidir se o módulo fiscal vale a pena implementar de fato ou deve sair do README até ter um provedor real.

---

## Roadmap

- [ ] Migrar isolamento de tenant de manual para estrutural (Prisma Client Extension ou Row-Level Security no Postgres) — **prioridade 1**
- [ ] Suíte de testes automatizados (zero hoje)
- [ ] CI (lint + test) via GitHub Actions
- [ ] `helmet` + rate limiting no backend
- [ ] Decidir destino do módulo Fiscal: implementar um provedor de NFS-e real ou remover a seção até ter um
- [ ] Changelog e releases versionadas

---

## Correções aplicadas nesta revisão

Esta reescrita não mudou só o texto — corrigiu bugs reais encontrados ao auditar o repositório:

1. **`docker-compose.yml` subia o banco errado**: o serviço declarava `mysql:8.0`, mas `schema.prisma` e `.env.example` sempre foram PostgreSQL. Rodar `docker-compose up` derrubava a API na primeira query (`Prisma Client` gerado para `postgresql`, `DATABASE_URL` apontando para MySQL). Corrigido para um serviço `postgres:16-alpine` consistente com o schema real.
2. **`.env.example` tinha 5 variáveis mortas** (`WHATSAPP_ENABLED`, `EVOLUTION_API_URL`, `EVOLUTION_API_KEY`, `EVOLUTION_INSTANCE`, `STORE_WHATSAPP`) de uma automação via WhatsApp que nunca existiu no código — confirmado por busca no repositório inteiro, zero ocorrências fora do `.env.example`. Removidas.
3. **Licença alegada sem arquivo**: o README dizia "MIT © 2024" mas não existia `LICENSE` no repositório. Adicionado o arquivo.
4. **`database.sql` na raiz era um script MySQL obsoleto**, sem tabelas reais, não referenciado por nenhuma ferramenta do projeto — a migração real vem do Prisma (`backend/prisma/migrations/`). Removido para não confundir quem abrir o repositório.
5. **README documentava instalação com MySQL** (badge, `DATABASE_URL` de exemplo, seção de tecnologias) — corrigido para PostgreSQL em todas as ocorrências.

---

## 📄 Licença

MIT — ver [`LICENSE`](LICENSE).

---

<div align="center">

Parte do portfólio de **[Roberson de Oliveira](https://github.com/RobersonCodes)** · Full-Stack Engineer

<img src="https://capsule-render.vercel.app/api?type=waving&color=0:203a43,100:0f2027&height=100&section=footer"/>

</div>
