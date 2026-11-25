# GramBazaar Backend

Standalone Express + Drizzle ORM + PostgreSQL (Cloud SQL) + Firebase Admin API service for GramBazaar.

## Folder Structure

```text
backend/
├── src/
│   ├── config/env.ts              # Safe layered dotenv loader
│   ├── db/
│   │   ├── index.ts               # PostgreSQL Pool + Drizzle instance
│   │   ├── schema.ts              # Canonical 25-table Drizzle schema
│   │   ├── drizzle.config.ts      # Standalone Drizzle Kit config
│   │   ├── queries.ts             # Public catalog, orders, inventory, udhari queries
│   │   ├── adminQueries.ts        # Admin sellers, categories, products queries
│   │   ├── adminOpsQueries.ts     # Applications, service areas, routes, fleet, audit logs, orders
│   │   ├── adminMasterQueries.ts  # All 8 Catalog Masters CRUD + idempotent seeders
│   │   └── adminSeed.ts           # Baseline seed data for admin tables
│   ├── lib/firebase-admin.ts      # Firebase Admin SDK token verifier
│   ├── middleware/auth.ts         # requireAuth + requireAdmin role guard
│   ├── routes/
│   │   ├── healthRoutes.ts        # GET /api/health
│   │   ├── publicCatalogRoutes.ts # /api/catalog/*
│   │   ├── appRoutes.ts           # /api/auth/me, /api/inventory/*, /api/orders/*, /api/udhari/*
│   │   ├── adminOpsRoutes.ts      # /api/admin/* (sellers, categories, products, ops, orders)
│   │   └── adminMastersRoutes.ts  # /api/catalog/masters + /api/admin/masters/* (all 8 masters)
│   ├── types/admin.ts             # Shared admin domain types
│   ├── app.ts                     # Express app factory (createBackendApp)
│   └── index.ts                   # Standalone server entrypoint (PORT=4000)
├── tests/
│   └── api.test.ts                # Node built-in test suite (health, 404, catalog, auth guards)
├── package.json
├── tsconfig.json
└── .env.example
```

## Running Modes

### 1. Inside AI Studio Preview (Default)
The root `server.ts` mounts `createBackendApp()` from `backend/src/app.ts` alongside Vite on port `3000`, so frontend and `/api/*` run on the same origin with zero CORS setup.

### 2. Standalone Backend Service
Copy `backend/.env.example` to `backend/.env`, configure your PostgreSQL & Firebase variables, and run:

```bash
cd backend
npm install
npm run dev      # Starts standalone API on http://localhost:4000
npm run test     # Runs Node test suite
npm run lint     # TypeScript type check
```

## Key API Endpoints

- **Health:** `GET /api/health`
- **Public Catalog:** `GET /api/catalog/villages`, `/sellers`, `/inventory/:sellerCode`, `/categories`, `/products`, `/admin-sellers`, `/service-areas`, `/routes`, `/masters`
- **Authenticated User/Seller:** `GET /api/auth/me`, `GET/POST /api/orders`, `PATCH /api/orders/:orderNumber/status`, `PATCH /api/inventory/:externalId/stock`, `POST /api/inventory/bulk-update`, `GET /api/udhari/:sellerCode`, `POST /api/udhari/:profileId/repayments`
- **Admin Operations (Firebase Bearer token + DB admin role):** `/api/admin/categories`, `/products`, `/sellers`, `/applications`, `/service-areas`, `/routes`, `/delivery-partners`, `/audit-logs`, `/orders`
- **Admin Catalog Masters:** `/api/admin/masters/{verticals,attributes,units,option-groups,brands,variant-masters,packaging-masters,availability-configs}`
