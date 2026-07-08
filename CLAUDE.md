# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

TireMax ERP — multi-tenant SaaS ERP for tire shops / auto service businesses (clients, inventory, POS/sales, service orders, financial, invoicing/NFS-e). Node/Express + Prisma API backend, React SPA frontend, optional Capacitor wrapper for Android/iOS.

## Commands

Backend (`backend/`):
- `npm run dev` — start API with nodemon (port 3001)
- `npm start` — start API with plain node (`start.js`)
- `npm run db:migrate` — `prisma migrate dev`
- `npm run db:generate` — `prisma generate` (run after editing `prisma/schema.prisma`)
- `npm run db:seed` — `node prisma/seed.js`

There is no automated test suite (no test script) and no lint script in `backend/`.

Frontend (`frontend/`):
- `npm run dev` — Vite dev server (port 5173, proxies `/api` to the backend)
- `npm run build` — production build; **run this after any change to verify nothing broke**
- `npm run lint` — ESLint (`--max-warnings 0`, so any warning fails)
- `npm run preview` — preview a production build

No frontend test suite exists either — treat `npm run build` + `npm run lint` as the correctness bar, and manually exercise UI changes in the browser.

Capacitor (mobile) scripts (`cap:sync`, `cap:build:apk`, etc.) live in `frontend/package.json` — only relevant when working on the native app wrapper; see `CAPACITOR_ANDROID.md` / `CAPACITOR_IOS.md` at repo root.

## Architecture

### Multi-tenancy
Every protected API request is scoped to a `Tenant` (the tire shop/company). `backend/src/routes/index.js` chains `authenticate` (JWT → `req.user`) then `tenantMiddleware` (`backend/src/middlewares/tenant.js`, loads the user's tenant → `req.tenantId`/`req.tenant`) in front of every route except `/auth`, `/tenants`, `/register`. Controllers filter every Prisma query by `tenantId: req.tenantId` — when adding a new model/controller, follow this pattern or data will leak across tenants. The tenant middleware also enforces plan/trial/suspension state (`SUSPENDED` status, expired `TRIAL`), so those business rules live there, not in individual controllers.

Backend structure is a flat MVC: `routes/*.routes.js` → `controllers/*.controller.js` (no service/repository layer) → Prisma directly. `backend/src/config/database.js` exports a singleton `PrismaClient`.

### Database
Prisma + **PostgreSQL** (`backend/prisma/schema.prisma`, `datasource db { provider = "postgresql" }`, `DATABASE_URL`). Ignore the root `README.md`'s claim of MySQL — it's stale; Prisma/`.env.example` are authoritative.

### Frontend routing & auth
`frontend/src/App.jsx` is the single route table. The public marketing site (`pages/marketing/LandingPage.jsx`) owns `/`; auth'd app routes have no `/app` prefix and are wrapped in `<PrivateRoute><AppLayout /></PrivateRoute>`. `AuthContext` (`frontend/src/contexts/AuthContext.jsx`) holds `user`/`tenant`, persists the JWT via `services/api.js`'s `saveToken`/`clearToken` (Capacitor Preferences on native, `localStorage` on web), and a response interceptor in `services/api.js` force-redirects to `/login` on 401. `SettingsContext` holds tenant-level settings separately.

`services/api.js`'s `getBaseURL()` branches on environment: Vite dev proxy (`/api`) in browser, `VITE_API_URL` env var when set, hardcoded localhost fallback when running natively via Capacitor without that var configured — keep this in mind when debugging "works in browser, not in the app" issues.

### Frontend design system (mid-migration — important when touching pages)
The design system was recently overhauls: new brand ramp (`#f0b400`, amber/gold — not the older `#3b64ff` blue or `#f5c800` yellow the root `README.md` still describes), Space Grotesk (display) + Inter (body) fonts, and a shared component set in `frontend/src/components/ui/index.jsx` (`Button`, `Input`, `Card`, `MetricCard`, `Table`, `StatusBadge`, `EmptyState`, `PageHeader`, `Modal`, `FormGroup`, `Pagination`, `Skeleton`, `Tooltip`, `ErrorAlert`). Supporting Tailwind utility classes live in `frontend/src/styles/globals.css` under `@layer components` (`.card`, `.btn-yellow`/`.btn-dark`/`.btn-ghost`/`.btn-danger`, `.input-field`, `.table-row`/`.table-header`/`.table-cell`, `.badge-*`, `.skeleton`, `.sidebar-item*`).

**Only `Sidebar.jsx`, `Header.jsx`, and `DashboardPage.jsx` have been redesigned to this system so far** (plus `ClientsPage.jsx`). The remaining pages (`inventory/`, `sales/`, `services/`, `financial/`, `reports/`, `settings/`, `admin/`, and `clients/ClientDetailPage.jsx`) still reference the *old* class names — notably `glass-card`, `btn-primary`, `btn-secondary`, `text-brand-300`, `bg-brand-600/*` — which **no longer exist** in `globals.css`/`tailwind.config.js` and currently render unstyled/broken. When touching any of those pages, redesign them to the current system rather than assuming the old classes still work; `DashboardPage.jsx` is the best reference for the intended patterns (raw `card`/`table-row` classes for tables instead of the `Card`/`Table` wrapper components, since those wrappers hardcode padding that conflicts with edge-to-edge tables).

### Fiscal / NFS-e
Invoicing has an abstraction layer intended for per-municipality NFS-e providers, configured via `FISCAL_*` env vars, with providers meant to live under `backend/src/modules/fiscal/` (not yet present — see root `README.md` "Módulo Fiscal" section for the intended shape before implementing).
