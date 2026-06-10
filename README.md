# 🚗 TireMax ERP — Sistema de Gestão Automotiva

> ERP completo para empresas de pneus e serviços automotivos. Stack moderna, arquitetura limpa, visual premium.

![TireMax ERP](https://img.shields.io/badge/TireMax-ERP%20v1.0-3b64ff?style=for-the-badge)
![Node.js](https://img.shields.io/badge/Node.js-20-green?style=flat-square)
![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square)
![Prisma](https://img.shields.io/badge/Prisma-5-2D3748?style=flat-square)
![MySQL](https://img.shields.io/badge/MySQL-8-4479A1?style=flat-square)

---

## 📋 Funcionalidades

| Módulo | Funcionalidades |
|--------|----------------|
| 🔐 **Auth** | Login JWT, controle de permissões (Admin/Funcionário/Financeiro) |
| 📊 **Dashboard** | Métricas em tempo real, gráfico de faturamento, estoque baixo |
| 👥 **Clientes** | CRUD completo, busca dinâmica, histórico de compras e serviços |
| 📦 **Estoque** | Pneus, peças, movimentações, alertas de estoque baixo |
| 🛒 **PDV** | Ponto de venda moderno, carrinho, desconto, múltiplos pagamentos |
| 🔧 **Serviços** | Ordens de serviço, status, peças, mão de obra |
| 💰 **Financeiro** | Contas a pagar/receber, fluxo de caixa |
| 📈 **Relatórios** | Gráficos de faturamento, análise de estoque |
| 🧾 **Fiscal** | Estrutura preparada para NFS-e (integração por município) |

---

## 🚀 Instalação Rápida

### Pré-requisitos
- Node.js 18+
- MySQL 8.0+ rodando
- npm ou yarn

### 1. Clone e instale dependências

```bash
# Backend
cd backend
cp .env.example .env
# Edite .env com suas credenciais MySQL
npm install

# Frontend
cd ../frontend
npm install
```

### 2. Configure o banco de dados

Edite `backend/.env`:
```env
DATABASE_URL="mysql://root:sua_senha@localhost:3306/tiremax_erp"
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
cd backend
npm run dev

# Terminal 2 — Frontend (porta 5173)
cd frontend
npm run dev
```

Acesse: **http://localhost:5173**

---

## 🔑 Credenciais de Acesso (Demo)

| Perfil | E-mail | Senha |
|--------|--------|-------|
| **Admin** | admin@tiremax.com | admin123 |
| **Funcionário** | funcionario@tiremax.com | emp123 |
| **Financeiro** | financeiro@tiremax.com | fin123 |

---

## 🐳 Docker Compose

```bash
# Sobe tudo (MySQL + Backend + Frontend)
docker-compose up -d

# Ver logs
docker-compose logs -f backend

# Rodar seed
docker-compose exec backend node prisma/seed.js
```

---

## 📁 Estrutura do Projeto

```
tiremax-erp/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma      # Schema completo do banco
│   │   └── seed.js            # Dados iniciais
│   ├── src/
│   │   ├── config/
│   │   │   └── database.js    # Prisma client
│   │   ├── controllers/       # Lógica de negócio por módulo
│   │   │   ├── auth.controller.js
│   │   │   ├── client.controller.js
│   │   │   ├── dashboard.controller.js
│   │   │   ├── financial.controller.js
│   │   │   ├── invoice.controller.js
│   │   │   ├── product.controller.js
│   │   │   ├── sale.controller.js
│   │   │   ├── service.controller.js
│   │   │   ├── stock.controller.js
│   │   │   ├── user.controller.js
│   │   │   └── vehicle.controller.js
│   │   ├── middlewares/
│   │   │   ├── auth.js        # JWT + autorização por role
│   │   │   ├── errorHandler.js
│   │   │   └── notFound.js
│   │   ├── routes/            # Rotas por módulo
│   │   ├── app.js             # Express app
│   │   └── server.js          # Entry point
│   ├── .env.example
│   ├── Dockerfile
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── layout/
│   │   │   │   ├── Sidebar.jsx   # Navegação lateral
│   │   │   │   └── Header.jsx    # Header com notificações
│   │   │   ├── ui/
│   │   │   │   └── index.jsx     # Components reutilizáveis
│   │   │   └── PrivateRoute.jsx
│   │   ├── contexts/
│   │   │   └── AuthContext.jsx   # Autenticação global
│   │   ├── layouts/
│   │   │   └── AppLayout.jsx
│   │   ├── pages/
│   │   │   ├── auth/LoginPage.jsx
│   │   │   ├── dashboard/DashboardPage.jsx
│   │   │   ├── clients/
│   │   │   ├── inventory/
│   │   │   ├── sales/
│   │   │   ├── services/
│   │   │   ├── financial/
│   │   │   └── reports/
│   │   ├── services/
│   │   │   └── api.js           # Axios configurado
│   │   ├── styles/
│   │   │   └── globals.css      # Tailwind + custom CSS
│   │   └── utils/
│   │       └── format.js        # Formatadores BRL, datas, etc
│   ├── tailwind.config.js
│   ├── vite.config.js
│   └── package.json
│
└── docker-compose.yml
```

---

## 🗄️ Banco de Dados

| Tabela | Descrição |
|--------|-----------|
| `users` | Usuários do sistema com roles |
| `clients` | Cadastro de clientes PF/PJ |
| `vehicles` | Veículos vinculados a clientes |
| `categories` | Categorias de produtos |
| `products` | Pneus, peças e materiais |
| `sales` | Vendas realizadas |
| `sale_items` | Itens de cada venda |
| `services` | Ordens de serviço |
| `service_items` | Peças/serviços por OS |
| `stock_movements` | Histórico de movimentações |
| `invoices` | Notas fiscais (NFS-e) |
| `payments` | Pagamentos de vendas |
| `accounts_receivable` | Contas a receber |
| `accounts_payable` | Contas a pagar |

---

## 🔌 API Endpoints

```
POST   /api/auth/login
GET    /api/auth/me

GET    /api/dashboard/metrics
GET    /api/dashboard/revenue-chart
GET    /api/dashboard/recent-sales
GET    /api/dashboard/low-stock

GET    /api/clients
GET    /api/clients/search?q=
POST   /api/clients
GET    /api/clients/:id
PUT    /api/clients/:id
GET    /api/clients/:id/history

GET    /api/products
GET    /api/products/search?q=
GET    /api/products/low-stock
POST   /api/products
GET    /api/products/:id
PUT    /api/products/:id

GET    /api/sales
POST   /api/sales
GET    /api/sales/:id
PATCH  /api/sales/:id/cancel

GET    /api/services
POST   /api/services
GET    /api/services/:id
PUT    /api/services/:id
PATCH  /api/services/:id/status

GET    /api/stock/movements
POST   /api/stock/movements
GET    /api/stock/report

GET    /api/financial/receivable
POST   /api/financial/receivable
PATCH  /api/financial/receivable/:id/pay
GET    /api/financial/payable
POST   /api/financial/payable
PATCH  /api/financial/payable/:id/pay
GET    /api/financial/cashflow
GET    /api/financial/summary
```

---

## 🧩 Módulo Fiscal (NFS-e)

O sistema possui arquitetura preparada para emissão de Nota Fiscal de Serviços Eletrônica (NFS-e). Para ativar:

1. Configure as variáveis no `.env`:
```env
FISCAL_ENABLED=true
FISCAL_PROVIDER=enotasgw  # ou seu provedor
FISCAL_API_URL=https://api.provedor.com
FISCAL_TOKEN=seu-token
FISCAL_CNPJ=00000000000000
FISCAL_IM=0000000  # Inscrição Municipal
```

2. Implemente o provedor em `backend/src/modules/fiscal/`

> Cada município tem sua própria API de NFS-e. O sistema usa uma camada de abstração para facilitar a integração com qualquer provedor.

---

## 🎨 Design System

- **Tema**: Dark mode profissional
- **Fontes**: DM Sans (corpo) + Syne (display) + JetBrains Mono (código)
- **Cores**: Azul brand (#3b64ff) + Cyan accent (#06d6e8)
- **Componentes**: Glassmorphism, cards com glow, micro-animações
- **Responsivo**: Desktop, Tablet, Mobile

---

## 🛠️ Tecnologias

**Backend:** Node.js · Express · Prisma ORM · MySQL · JWT · Bcrypt · Multer  
**Frontend:** React 18 · Vite · Tailwind CSS · Framer Motion · Recharts · Lucide

---

## 📄 Licença

MIT © 2024 TireMax ERP

---

## 📱 App Mobile (Capacitor)

O TireMax ERP pode ser instalado como app nativo em Android e iOS via Capacitor.

### Android (APK)

```bash
cd frontend
npm install
cp .env.example .env
# Edite .env: VITE_API_URL=http://SEU_IP:3001

npx cap add android
npm run cap:sync
npx cap open android
# No Android Studio: Build → Build APK
```

📖 Guia completo: [CAPACITOR_ANDROID.md](./CAPACITOR_ANDROID.md)

### iOS (IPA)

Requer Mac + Xcode + Apple Developer Account.

```bash
npx cap add ios
npm run cap:ios
# Xcode abre automaticamente
```

📖 Guia completo: [CAPACITOR_IOS.md](./CAPACITOR_IOS.md)

### Funcionalidades nativas incluídas

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
