# GramBazaar Database Security, Privacy & Compliance Architecture

This document defines the security controls required to protect customer PII, seller KYC/bank data, financial ledgers, Udhari balances, and administrative actions in a production PostgreSQL + Node.js/Express + Prisma deployment.

---

## 1. Data Classification & Sensitive Fields Inventory

| Classification | Tables & Columns | Required Protection |
|---|---|---|
| **Restricted Secrets** | `users.password_hash`, `auth_tokens.token_hash` | One-way hashing only (`Argon2id` for passwords, `SHA-256` + server pepper for tokens/OTPs). Never selected in default Prisma queries or logged. |
| **Highly Sensitive PII / KYC / Financial** | `sellers.bank_account_encrypted`, `sellers.ifsc_code`, `sellers.fssai_number`, `sellers.gst_or_trade_number`, `seller_kyc_documents.document_number_encrypted`, `seller_kyc_documents.file_url` | Application-level **envelope encryption (AES-256-GCM)** backed by KMS (Cloud KMS / AWS KMS) before writing to PostgreSQL. Store only masked variants (`bank_account_last4`, `document_number_masked`) for routine UI rendering. KYC files stored in private object storage buckets accessed solely via short-lived (≤ 5 min) signed URLs. |
| **Personal Identifiable Information (PII)** | `users.full_name`, `users.phone`, `users.email`, `customer_addresses.*`, `orders.delivery_address_snapshot`, `seller_staff_members.phone`, `delivery_partners.vehicle_number` | TLS 1.3 in transit, disk encryption at rest, strict RBAC/ownership filtering, masked in application error logs. |
| **Financial & Immutable Ledgers** | `orders`, `order_items`, `payment_transactions`, `refunds`, `seller_settlements`, `seller_settlement_orders`, `credit_ledger_entries`, `credit_repayments`, `inventory_stock_movements`, `audit_logs` | **Append-only** enforcement (`REVOKE UPDATE, DELETE` for the runtime DB role on immutable ledger/audit tables). |

---

## 2. Password & Authentication Security

1. **Password Hashing (`users.password_hash`):**
   - Use **Argon2id** (`memoryCost: 65536` KiB, `timeCost: 3`, `parallelism: 1`) via Node `argon2` library — never MD5, SHA-1, or plain SHA-256.
   - Enforce minimum 8 characters with complexity checks (matching `SignUpScreen` & `ResetPasswordScreen`).
2. **Session & Reset Tokens (`auth_tokens`):**
   - Generate cryptographically secure 256-bit random tokens (`crypto.randomBytes(32)`).
   - Store **only** `SHA-256(raw_token)` in `auth_tokens.token_hash`.
   - Short TTLs: `PHONE_OTP` = 5 minutes (max 5 attempts), `PASSWORD_RESET` = 15 minutes (single-use: set `consumed_at` immediately), `REFRESH_SESSION` = 14 days with **refresh-token rotation** and reuse detection (revoke all user tokens on suspected replay).
   - Changing a password atomically revokes all active `REFRESH_SESSION` tokens for that user.

---

## 3. Access Restrictions & Least-Privilege Database Roles

Never run the Node.js application as PostgreSQL `postgres` superuser. Separate database roles cleanly:

| PostgreSQL DB Role | Used By | Privileges |
|---|---|---|
| `gb_migrator` | CI/CD Prisma Migrations only | `DDL` (`CREATE`, `ALTER`, `DROP`) on `public` schema. Never exposed to runtime Express app. |
| `gb_app_rw` | Express.js / Prisma runtime | `SELECT, INSERT, UPDATE` on operational tables; **`SELECT, INSERT` ONLY** (NO `UPDATE`/`DELETE`) on `audit_logs`, `order_status_history`, `inventory_stock_movements`, `seller_kyc_document_events`, and `credit_ledger_entries` (except status column via controlled stored procedure/limited privilege). |
| `gb_analytics_ro` | BI / Reporting / Read Replica | `SELECT` only on sanitized analytics views (excluding `password_hash`, `auth_tokens`, `*_encrypted` KYC/bank columns). |

---

## 4. Multi-Tenant & Role-Based Access Control (RBAC)

### Application & Optional PostgreSQL Row-Level Security (RLS)
Every API route validates JWT identity + `user_roles` + `role_permissions`, and can be reinforced with PostgreSQL RLS session variables (`SET LOCAL app.current_user_id = ...; SET LOCAL app.current_seller_id = ...`):

- **Customer Isolation:**
  - Can only read/write their own `customer_addresses`, `carts`, `orders` (`customer_id = auth_user_id`), `reviews`, `support_cases`, `notifications`, and their own `customer_credit_profiles` / `credit_ledger_entries` (read-only on ledger, write only on `credit_disputes`).
- **Seller Multi-Tenant Isolation:**
  - A `SELLER_OWNER` or `SELLER_STAFF` can ONLY access rows where `seller_id` belongs to their authorized shop across `seller_product_listings`, `inventory_stock_movements`, `orders`, `seller_settlements`, `customer_credit_profiles`, `credit_repayments`, `credit_ledger_entries`, and `seller_safety_profiles`.
  - **Udhari Hard Boundary:** Seller A can NEVER see Customer X's credit limit, outstanding balance, or repayment history at Seller B.
- **Admin Module & Regional Village Scoping:**
  - Every Admin endpoint checks `role_permissions` (`can_view`, `can_manage`, `can_approve`, `can_export`) for the exact `module_key` (e.g., only `SUPER_ADMIN` and `ADMIN_FINANCE` can approve `seller_settlements` or `refunds`).
  - If an `ADMIN_OPS` or `ADMIN_SUPPORT` user has rows in `admin_village_scopes`, every query on `sellers`, `orders`, `support_cases`, and `delivery_partners` is strictly filtered by `village_id IN (SELECT village_id FROM admin_village_scopes WHERE user_id = current_admin)`.

---

## 5. Data Privacy & Indian Compliance (DPDP Act 2023)

1. **Consent Tracking:** `users.terms_accepted_at` and `sellers.udhari_policy_acknowledged_at` provide auditable consent timestamps.
2. **Right to Erasure vs. Statutory Retention:**
   - Indian GST / Income Tax rules require retaining commercial invoices, payments, settlements, and credit ledgers for **8 years**.
   - On customer account deletion request: soft-delete `users` (`deleted_at = NOW()`, `status = 'INACTIVE'`), scrub/anonymize `users.full_name`, `users.email`, `users.phone` (replaced with deterministic irreversible pseudonym), delete `auth_tokens` and `customer_addresses`, while preserving anonymized `orders` / `payment_transactions` / `credit_ledger_entries` for legal accounting integrity.
3. **Data Minimization in Snapshots:** `orders.delivery_address_snapshot` stores only delivery-required fields (recipient name, phone, village, address line, landmark) — never user emails, passwords, or payment credentials.
4. **No Raw Bank/KYC Leaks in API Serializers:** Prisma queries on `sellers` and `seller_kyc_documents` MUST use explicit `select` whitelists excluding `*_encrypted` fields; decryption occurs only inside dedicated Payout Disbursal or Admin KYC Review services and triggers an `audit_logs` entry (`VIEW_SENSITIVE_KYC` / `EXPORT_PAYOUT_BANK_DETAILS`).

---

## 6. Immutable Audit Trail Requirements (`audit_logs`)

The following high-risk actions MUST write a synchronous `audit_logs` record inside the same database transaction as the state change:
- Seller approval, rejection, suspension, or reactivation (`SELLERS`)
- Individual KYC document approval/rejection/change-request (`SELLER_KYC`)
- Product catalog approval/rejection (`PRODUCTS`)
- Fee rule, tax slab, or cancellation policy edits (`FEE_RULES`, `POLICIES_TAX`)
- Refund approval/rejection/processing and Seller Settlement payout marking (`PAYOUTS`)
- Customer blocking/unblocking (`CUSTOMERS`)
- Admin role permission matrix modifications (`ROLES`)
- Safety inspection failures & safety-triggered seller suspensions (`SAFETY_QUALITY`)
- Udhari dispute resolutions and manual ledger adjustments (`UDHARI`)
- Bulk inventory updates (`seller_bulk_inventory_jobs` + `audit_logs`)

---

## 7. Infrastructure & Operational Database Security

- **Encryption in Transit:** Enforce `sslmode=verify-full` (TLS 1.3) between Express.js/Prisma and PostgreSQL.
- **SQL Injection Prevention:** Exclusively use Prisma parameterized queries; prohibit raw string interpolation (`$queryRawUnsafe`).
- **Automated Encrypted Backups & PITR:** Daily encrypted full snapshots + continuous WAL archiving for **Point-in-Time Recovery (PITR)** to protect against accidental corruption or ransomware, tested quarterly via restore drills.
- **Connection Pooling & Limits:** Deploy **PgBouncer** (transaction pooling mode) with per-role connection caps and `statement_timeout = '15s'` to prevent runaway queries or DoS exhaustion.
