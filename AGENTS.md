# GramBazar frontend – agent guide

GramBazar is a local marketplace (food, quick commerce, apparel, furniture, …) that works in any
town or village. This repo is the React app; the API lives in the separate `backend` repo
(read `../backend/AGENTS.md` for the API, data rules and backend roadmap).

## Rules (always follow)
- Work one phase/step at a time: **plan first, wait for the owner's approval, then change, then
  report and stop.** Ask permission again before the next step.
- Commit or push only when the owner asks. Never work on `main`: create a branch per phase.
- Never commit or print secrets (`.env*`).
- The backend is the source of truth: never send or trust client-side prices, roles or ownership.
  Send ids and quantities; show what the API returns.
- If a screen needs a backend change, stop and describe it. Backend work happens in the backend
  repo, with its own approval.
- Before reporting a step as done, run `npm run lint` (`tsc --noEmit`) and `npm run build`, and
  check the screen in the browser.
- Windows machine, CRLF line endings: edit files with real file edits, not shell string-replace hacks.

## Setup
- React + Vite 8 + Tailwind 4. `npm run dev` serves on port 3000. Vite proxies `/api` to the
  backend at `http://localhost:4000` (override with `API_PROXY_TARGET`), so the browser sees one
  origin and the Better Auth session cookie works. Open `http://localhost:3000`, not `0.0.0.0`.
- Start the backend first (`npm run dev` in `../backend`, Neon `dev` branch).
- Auth: Better Auth react client (`src/lib/authClient.ts`, `src/contexts/AuthContext.tsx`),
  `LoginScreen`, `SignUpScreen`, `VerifyPhoneScreen`, `PhoneOtpForm`, `GoogleSignInButton`.
- State lives in contexts under `src/contexts/` (Cart, Order, Seller, Admin, Safety, Udhari, Village).

## Backend APIs to use
- Quick commerce: `GET /api/quick/home`, `/api/quick/categories/:slug`, `/api/quick/search?q=`,
  `/api/quick/items/:id`. All take `?pincode=&lat=&lng=` (+ optional `&state=&city=`). A reply of
  `serviceable: false` with a `reason` means no store serves the address: show that message, not an error.
- Quick checkout: `POST /api/checkout/quote`. Order items use the `productId` from the item cards.
- Public catalog and orders: `src/routes/publicCatalogRoutes.ts` and `orderRoutes.ts` in the backend.
- Village endpoints were removed from the backend. Locations are now address + pincode + optional lat/lng.

## Roadmap
- [x] Better Auth login / sign-up / phone verification against the standalone backend
- [ ] **Location**: replace `VillageContext` and the village endpoints with an address / pincode /
      current-location picker (saved per user), used by the storefront, checkout and orders
- [ ] **Quick commerce storefront UI**: home (store + ETA banner, departments, rails), category
      list, search, item page with pack sizes, a not-serviceable state, "Only N left" and the
      max-per-order limit
- [ ] **Cart + checkout**: one store per order, fees from the checkout quote (delivery, handling,
      small-cart, "add ₹X for free delivery"), real `productId`s instead of the demo product ids
- [ ] **Order tracking** with the API's `statusLabel` / `orderFlow` (quick orders show packing steps)
- [ ] **Seller stock screen** on the new seller endpoints (after backend Phase 4)
- [ ] Admin screens on the new admin endpoints (after backend Phases 5–6)
- [ ] Udhari screens — **skipped until the owner decides**

## Backend shape changes to adopt

- `GET /api/catalog/masters`: `packagingMasters: [records] → []`; `variantMasters` now represents `catalog_items` (UUID `id`, schema `categoryId`/`unitId`, `family_key` in `productId`, shared catalog MRP). Per-store `sellingPricePaise`, `stockQuantity`, and `lowStockThreshold` are removed from this shared catalog list; store values come from products. Consumers: `src/contexts/AdminContext.tsx`, `src/features/admin/masters/ProductVariantSizeMasterView.tsx`, `src/features/seller/components/SellerAddProductModal.tsx`, and `src/features/seller/SellerCatalogView.tsx`. `src/features/admin/masters/PackagingMasterView.tsx` must be retired or hidden.
- `/api/admin/categories` (GET/POST/PATCH/toggle/DELETE): response envelopes and fields remain; `attributeIds` / `allowedUnitIds` change from legacy master identifiers to UUIDs in `category_attributes` / `category_units`, and `itemCount` is now computed from products. `id` and `parentId` remain category slugs. Consumers: `src/contexts/AdminContext.tsx`, `src/features/admin/masters/CategorySubcategoryMasterView.tsx`.
- `/api/admin/products` (GET/POST/PATCH/moderate/inventory/toggle-availability/DELETE): `{ products }` / `{ product }` and DTO keys remain; `id` is now a product UUID, `categoryId` a category slug, `brandId` / `unitId` schema UUIDs, `sellerId` a seller slug; `stockQuantity` is absent when inventory is untracked. Consumers: `src/contexts/AdminContext.tsx`, `src/features/admin/AdminProductsView.tsx`, `src/features/admin/components/sellers/Seller360TabProducts.tsx`, `src/features/seller/SellerCatalogView.tsx`.
- `/api/admin/sellers` (GET/POST/status/config/kyc-documents/kyc-changes): `{ sellers }` / `{ seller }` and DTO keys remain; `id` is the seller slug, `villageId` / `pinCode` / `serviceableVillageIds` now contain pincodes rather than village IDs, and `bankAccountNumberMasked` is reconstructed from the stored last four digits. KYC documents and activity history come from `kyc_documents` and `audit_logs`. Consumers: `src/contexts/AdminContext.tsx`, `src/features/admin/AdminSellerDirectoryView.tsx`, `src/features/admin/AdminDashboardView.tsx`, and `src/features/admin/components/sellers/Seller360Drawer.tsx`.

When a phase is finished and approved, tick it here in the same commit.

## How to start a session
Read this file and `../backend/AGENTS.md`, check that the app builds, then plan the next unchecked
roadmap item: screens, contexts and API calls you'll touch. Wait for approval before changing anything.
