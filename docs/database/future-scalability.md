# GramBazaar Future Scalability & Evolution Roadmap

This document explains how the current **74-table PostgreSQL + Prisma** architecture scales smoothly from a single-block rural pilot (3–5 villages) to a multi-state regional marketplace serving **10,000+ villages, 50,000+ sellers, and millions of monthly orders** without schema rewrites.

---

## 1. Expanding to Additional Villages, Multiple Districts & Multiple States

- **Already Built-In:** `villages` stores `(code, name, district, state, postal_codes, latitude, longitude)` with `UNIQUE(name, district, state)`, and `inter_village_routes` models dynamic village-to-village distances and surcharges.
- **Zero-Downtime Geo Hierarchy Extension:** When expanding across hundreds of districts/states, add parent reference tables `states` → `districts` → `blocks_tehsils` and link `villages.block_id` via an optional FK without breaking existing queries.
- **PostGIS Spatial Upgrade:** Add `PostGIS` (`GEOGRAPHY(POINT, 4326)` + `GiST` index) on `villages`, `sellers`, and `customer_addresses` to support polygon service zones and exact road-distance delivery pricing as rural GPS coverage matures.
- **Regional Operations Scaling:** `admin_village_scopes` already partitions `ADMIN_OPS` and `ADMIN_SUPPORT` workload by village; extending it with optional `district_id` allows District Managers to oversee 50–100 villages cleanly.

---

## 2. Scaling Sellers & Multi-Category Catalogs

- **Zero Per-Vertical Schema Changes:** Adding new rural categories (e.g., *Pharmacy*, *Dairy Co-op*, *Tractor Parts*, *Stationery*, *Building Materials*) requires **only data inserts** into `verticals`, `categories`, `attributes`, `units`, and `availability_stock_configs` — zero DDL migrations or new product tables.
- **Universal Catalog Reuse:** As seller count grows from 20 to 50,000 Kirana shops, 90% of FMCG/packaged goods share canonical rows in `products` and `product_variants` (`is_universal_template = true`), while each shop maintains lightweight, isolated rows in `seller_product_listings` (price, stock, rack, expiry).
- **Search Scaling:** Start with PostgreSQL `pg_trgm` + bilingual English/Hindi `tsvector` GIN indexes. Beyond ~500,000 active listings, stream `products` and `seller_product_listings` changes via **Debezium / CDC** into **Meilisearch** or **OpenSearch** for typo-tolerant transliterated Hinglish search (*"aata"*, *"chawal"*, *"sarson tel"*).

---

## 3. High Customer & Order Volume Scaling (1M+ Orders / Month)

### A. Declarative Table Partitioning (PostgreSQL Native)
High-append tables are designed with `created_at` / `posted_at` timestamps so they can be converted to **monthly RANGE partitions** with minimal application impact:
- `orders` (partition by `created_at` monthly)
- `order_items` & `order_status_history` (partition aligned with `orders`)
- `inventory_stock_movements` (partition by `created_at` monthly)
- `credit_ledger_entries` (partition by `posted_at` quarterly)
- `notifications` & `audit_logs` (partition monthly; archive partitions > 18 months to cold object storage / Parquet while preserving 8-year tax archives)

### B. Read/Write Separation & Caching
- **Connection Pooling:** PgBouncer in transaction mode sits between horizontally scaled Express.js pods and PostgreSQL primary.
- **Read Replicas:** Route Customer storefront browsing, Kirana search, Admin Analytics, and Seller Reports to PostgreSQL Read Replicas (`Prisma` read-replica extension).
- **Redis Cache Layer:** Cache hot, slowly changing catalog masters (`villages`, `verticals`, `categories`, `brands`, `units`, `cms_banners`, `platform_settings`) and active shop open/closed status with event-driven cache invalidation.
- **Async Job Queue (BullMQ / Redis):** Offload non-critical post-checkout tasks (WhatsApp/SMS alerts, seller buzzer push notifications, PDF invoice generation, daily Udhari overdue recalculation, safety badge recomputation) out of the checkout DB transaction.

---

## 4. Expanding Delivery Systems (3PL, Hyperlocal Riders & Live GPS)

The `order_deliveries` table cleanly decouples order fulfilment from `orders` via `fulfilment_type`:
- **Phase 1 (Current):** `SELLER_RUNNER` (in-house shop staff) + `CUSTOMER_PICKUP` + `PLATFORM_PARTNER` (village cycle/bike/e-rickshaw riders).
- **Phase 2 (Fleet Dispatch & Live Tracking):** Add `delivery_partner_locations` (time-series GPS pings stored in TimescaleDB/Redis Geo) and `delivery_partner_payouts` without altering `orders`.
- **Phase 3 (Third-Party Logistics / ONDC):** Add `EXTERNAL_3PL` to `delivery_fulfilment_type` plus a `external_logistics_shipments` table storing 3PL partner ID, AWB/tracking URL, and webhook status events.

---

## 5. Future Native Mobile Applications (Customer, Seller & Rider Apps)

- **Multi-Device Auth Ready:** `auth_tokens` supports concurrent mobile & web refresh sessions per user with per-device `user_agent` tracking and selective sign-out.
- **Push Notifications Ready:** Add a lightweight `user_push_tokens (id, user_id, device_platform, fcm_token, is_active, updated_at)` table linked to `users.id` so the existing `notifications` and `broadcast_campaigns` tables immediately dispatch FCM/APNs push notifications (including high-priority Android alarm sounds for Seller Order Buzzer).
- **Offline-First Rural Resilience:** UUID primary keys + idempotency keys (`payment_transactions.transaction_ref`, `credit_repayments.repayment_reference`) allow future Seller Android apps to safely retry flaky 2G/3G/4G village network requests without creating duplicate orders, stock adjustments, or Udhari receipts.

---

## 6. Future AI Features (Zero Core Schema Disruption)

The normalized schema cleanly feeds rural AI capabilities via PostgreSQL `pgvector` or external ML pipelines:
- **Voice & Vernacular Hinglish Search:** Add a `search_embedding vector(768)` column (via `pgvector`) to `products` to enable Hindi/regional voice queries (*"2 kilo chakki aata aur sarson ka tel bhej do"*).
- **Smart Kirana Reorder Forecasting:** `inventory_stock_movements` + `order_items` provide daily item-level velocity per shop (`seller_id`), enabling automated predicted stockout dates and wholesaler reorder lists.
- **Udhari Default Risk Scoring (Advisory for Sellers):** `credit_ledger_entries` + `credit_repayments` provide exact repayment timeliness (`received_at` vs `due_date`), enabling a seller-only reliability indicator without exposing one seller's private ledger to another.
- **Automated Food & Grocery Quality Triage:** `reviews`, `support_cases`, and `seller_checklist_submissions` can feed anomaly detection to flag shops needing proactive `safety_inspection_audits`.

---

## 7. Analytics, Reporting & Data Warehousing

- **Operational Reporting (Near-Real-Time):** Refresh PostgreSQL Materialized Views (`mv_daily_village_gmv`, `mv_seller_fulfilment_sla`, `mv_kirana_low_stock_summary`, `mv_udhari_aging_buckets`) on a 15-minute schedule on a Read Replica to power `AdminAnalyticsView` and `SellerAnalyticsView`.
- **Enterprise OLAP Warehouse (Long-Term):** Stream operational tables via Change Data Capture (CDC) into **BigQuery / ClickHouse / Snowflake** using a Star Schema:
  - **Fact Tables:** `fact_orders`, `fact_order_items`, `fact_inventory_movements`, `fact_credit_ledger`, `fact_settlements`.
  - **Dimension Tables:** `dim_village`, `dim_seller`, `dim_product`, `dim_vertical`, `dim_date`.
- Because `orders` and `order_items` already preserve immutable historical snapshots (prices, commission bps, tax labels, delivery village), historical BI reports remain 100% accurate across years of price and policy changes.
