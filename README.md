# GramBazaar (frontend)

Rural hyperlocal marketplace: React + Vite frontend (Customer, Seller, Admin portals).

The API lives in a separate project, `GramBazar/backend` (Express + Drizzle + Neon Postgres +
Better Auth). In development the Vite server forwards every `/api` request to it, so the
browser talks to one origin and the login cookie works without extra setup.

## Project Structure

```text
frontend/
├── src/                  # React app
│   ├── contexts/         # App state; AuthContext wraps the Better Auth client
│   ├── features/auth/    # Login (mobile OTP / email / Google), sign-up, phone verification
│   └── lib/authClient.ts # Better Auth browser client
├── public/               # Static public assets
├── docs/                 # Database & architecture documentation
├── vite.config.ts        # Dev server on port 3000, /api proxied to the backend
└── package.json
```

## Quick Start

Start the backend first (port 4000), then the frontend:

```bash
cd ../backend && npm run dev     # http://localhost:4000
cd ../frontend && npm install && npm run dev   # http://localhost:3000
```

Set `API_PROXY_TARGET` to point the proxy at a backend on another address.

## Sign-in

- **Mobile OTP**: no SMS provider is connected yet, so in development the code is printed in the
  backend terminal (`[auth] OTP for +91...`).
- **Email + password**, and **Google** once `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET` are set in
  `backend/.env`.
- Accounts without a verified mobile number are asked to verify one; the API refuses orders until then.

## Checks

```bash
npm run lint    # TypeScript
npm run build   # production build
```
