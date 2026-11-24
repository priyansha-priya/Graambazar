# GramBazaar – Pending Tasks & Unstarted Scope

**Document Version:** 1.0.0  
**Audit Date:** November 2, 2026  
**Auditor:** Lead Systems Engineer

---

## 1. Summary of Remaining Scope

While the client-side single-page application (SPA) architecture, design system, and multi-role views (Customer, Seller, Super Admin) are largely implemented with in-memory React Contexts, the application still requires permanent database persistence, external service connections, and hardware integrations before reaching production deployment.

```
Total Master Tasks Planned: 48
Tasks Fully Completed (Client/UI/Contexts): 36
Tasks Partially Completed (UI done, Backend pending): 4
Tasks Not Started (Backend, Real Hardware, Real Gateways): 8
```

---

## 2. Phase-by-Phase Pending Task Inventory

### Phase 7: Super Admin Suite (Completed for Frontend – 98%)

The administrative UI, local state handlers, KYC inspection lightbox, and report export features are fully built in `/src/features/admin/`, `/src/features/admin/components/DocumentPreviewModal.tsx`, and `/src/contexts/AdminContext.tsx`.

| Task ID | Item | Current State | Status / Details |
|---|---|---|---|
| **ADM-01** | Cross-Admin Live State Sync | In-memory React Context & localStorage | **Pending Backend** (Phase 8 WebSockets / real-time Firestore listeners). |
| **ADM-02** | Persistent Audit Log Store | LocalStorage fallback implemented (`grambazaar_admin_audit_logs_v1`) | **Frontend Complete** (Persists across reloads; DB sync planned for Phase 8 BE-01). |
| **ADM-03** | CSV/Excel Export for Admin Reports | Client-side CSV generator with UTF-8 BOM (`/src/utils/exportCsv.ts`) | **Completed** (Integrated in Orders, Seller Directory, Audit Trail, Fee Rules). |
| **ADM-04** | Document Preview Modal for KYC | Zoomable lightbox modal (`/src/features/admin/components/DocumentPreviewModal.tsx`) | **Completed** (Supports FSSAI, Aadhaar, PAN, Storefront with zoom, rotate, copy ID, and verification chips). |

---

### Phase 8: Backend Persistence, Cloud Database & External Integrations (Not Started – 0%)

Phase 8 encompasses production infrastructure and real-world third-party services:

| Task ID | Item | Target Technology | Status | Work Required |
|---|---|---|:---:|---|
| **BE-01** | Relational Database / Persistent Store | Cloud SQL (PostgreSQL) or Firebase Firestore | **Not Started** | Provision schema tables/collections (`villages`, `users`, `merchants`, `products`, `orders`, `udhari_ledgers`, `audit_logs`). |
| **BE-02** | Secure REST / RPC Backend APIs | Express / Node.js API server (`/server.ts`) | **Not Started** | Implement endpoints with authorization middleware for customer orders, seller dispatch, and admin overrides. |
| **BE-03** | Real Phone OTP Authentication | Fast2SMS / Twilio / Firebase Auth SMS | **Not Started** | Replace instant mock OTP entry with genuine 6-digit SMS verification for rural phone numbers. |
| **BE-04** | Direct ESC/POS Bluetooth Thermal Printing | Web Bluetooth API / RawBT Service | **Not Started** | Replace `window.print()` browser dialog with direct ESC/POS command byte streaming to 58mm/80mm Bluetooth receipt printers. |
| **BE-05** | Production Payment Gateway Webhooks | Razorpay / PhonePe Payment Gateway | **Not Started** | Implement server-side signature validation for online UPI payments and automated refund webhooks. |
| **BE-06** | Real-Time Push Notifications / Audio Beeper | Web Push Notifications & Audio API | **Not Started** | Continuous foreground audio alert loop on Seller Terminal when a new incoming order arrives until merchant accepts. |
| **BE-07** | Automated End-to-End Test Suite | Vitest / Playwright | **Not Started** | Unit tests for cart calculations, single-seller isolation logic, and order state machine transitions. |
| **BE-08** | Offline PWA Support & Service Worker | Vite PWA Plugin / Workbox | **Not Started** | Cache static assets and catalog data for low-connectivity 2G/3G rural networks. |

---

## 3. Immediate Recommended Task Sequence

1. **Step 1:** Confirm and lock Phase 7 Super Admin Suite requirements with stakeholder.
2. **Step 2:** Decide the primary persistence backend (Relational Cloud SQL PostgreSQL via Drizzle ORM vs. Firebase Firestore).
3. **Step 3:** Implement Express backend routes (`/server.ts`) to serve data persistently and mount Vite dev middleware.
4. **Step 4:** Integrate real SMS OTP authentication flow for Customer and Seller logins.
5. **Step 5:** Connect Bluetooth thermal printing driver for rural merchant receipt generation.
