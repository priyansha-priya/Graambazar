# GramBazaar

Rural hyperlocal marketplace platform with a React + Vite frontend and a modular Express + Drizzle ORM + PostgreSQL (`Cloud SQL`) + Firebase Admin backend.

## Project Structure

```text
Graambazar/
├── src/                  # React + Vite frontend (Customer, Seller, Admin portals)
├── public/               # Static public assets
├── docs/                 # Database & architecture documentation
├── backend/              # Standalone Express + Drizzle + PostgreSQL backend
│   ├── src/              # Modular routes, middleware, Firebase Admin, DB schema & queries
│   ├── tests/            # Node built-in API test suite (health, 404, catalog, auth guards)
│   ├── package.json
│   ├── tsconfig.json
│   ├── .env.example
│   └── README.md
├── server.ts             # Thin preview host mounting backend/src/app.ts + Vite on port 3000
├── package.json          # Root frontend & preview scripts
└── README.md
```

## Quick Start

### Preview / Full-Stack Mode (Port 3000)
```bash
npm install
npm run dev
```

### Standalone Backend Mode (Port 4000)
```bash
cd backend
cp .env.example .env
npm install
npm run dev
```

### Backend Verification & Tests
```bash
npx tsx --test backend/tests/api.test.ts
npx tsc -p backend/tsconfig.json --noEmit
```
