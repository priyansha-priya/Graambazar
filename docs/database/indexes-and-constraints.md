# GramBazaar Indexes, Constraints & Query Optimization

This guide documents every **Unique Constraint**, **Check / Integrity Constraint**, **Foreign Key Index**, **Composite B-Tree / Partial / GIN Index**, and **PostgreSQL Query Optimization strategy** for the GramBazaar database.

> **PostgreSQL Rule of Thumb:** Unlike Primary Keys and Unique Constraints, PostgreSQL does **NOT** automatically create indexes on `FOREIGN KEY` columns. Every frequently joined or filtered FK column is explicitly indexed below to prevent full-table scans on joins and parent-row deletes.

---

## 1. Unique Constraints & Partial Unique Indexes

### Standard `UNIQUE` Constraints
| Table | Unique Columns | Purpose |
|---|---|---|
| `users` | `(phone)` | One primary account per mobile number |
| `users` | `(email)` | Unique login/recovery email (when non-null) |
| `roles` | `(code)` | Unique canonical RBAC role code |
| `user_roles` | `(user_id, role_id)` | Prevent duplicate role assignments |
| `role_permissions` | `(role_id, module_key)` | Single permission row per role/module |
| `auth_tokens` | `(token_hash)` | Guaranteed token uniqueness |
| `villages` | `(code)` and `(name, district, state)` | Prevent duplicate village entries |
| `village_landmarks` | `(village_id, name)` | Unique landmark within a village |
| `inter_village_routes` | `(from_village_id, to_village_id)` | One directional route per village pair |
| `verticals` | `(code)` | Unique vertical identifier |
| `seller_kyc_documents` | `(seller_id, doc_code)` | One active KYC submission per doc type per shop |
| `categories` | `(slug)` | Unique URL slug |
| `brands` | `(name)` and `(code)` | Prevent duplicate brands |
| `units` | `(symbol)` | Unique measurement symbol (`kg`, `g`, `pav`, `plate`) |
| `attributes` | `(slug)` | Unique attribute slug |
| `packaging_masters` | `(code)` | Unique packaging code |
| `availability_stock_configs` | `(code)` | Unique availability rule code |
| `products` | `(sku_code)` | Unique universal product SKU |
| `product_attribute_values` | `(product_id, attribute_id)` | One attribute value per product/attribute |
| `product_variants` | `(sku)` | Unique variant SKU |
| `carts` | `(customer_id)` | Single active cart per customer |
| `orders` | `(order_number)` | Unique customer-facing order ID (`GB-2026-XXXX`) |
| `order_cancellations` | `(order_id)` | Order can only be cancelled once |
| `order_returns` | `(return_number)` | Unique return tracking number |
| `delivery_partners` | `(user_id)` | One fleet profile per user |
| `order_deliveries` | `(order_id)` | One fulfilment record per order |
| `payment_transactions` | `(transaction_ref)` | Idempotency key preventing duplicate charges |
| `refunds` | `(refund_number)` | Unique refund ID |
| `seller_settlements` | `(settlement_number)` and `(utr_number)` | Unique payout batch & bank UTR reference |
| `seller_settlement_orders` | `(order_id)` | **Zero double-settlement guarantee** |
| `customer_credit_profiles` | `(seller_id, customer_id)` | Seller-isolated Udhari account per customer |
| `credit_repayments` | `(repayment_reference)` | Unique receipt number (`REC-2026-XXXX`) |
| `credit_ledger_entries` | `(ledger_reference)` | Unique ledger voucher (`LED-2026-XXXX`) |
| `offers_coupons` | `(code)` | Unique uppercase promo code |
| `coupon_redemptions` | `(order_id)` | One coupon redemption per order |
| `reviews` | `(order_id)` | One verified review per order |
| `support_cases` | `(case_number)` | Unique ticket number |
| `safety_training_modules` | `(track, module_number)` | Ordered training curriculum per track |
| `seller_checklist_submissions` | `(seller_id, submission_date)` | One daily hygiene checklist per shop/day |
| `seller_safety_profiles` | `(certificate_number)` | Unique issued safety certificate |
| `cms_policy_pages` | `(slug)` | Unique legal page slug |
| `cancellation_policy_rules` | `(code)` | Unique cancellation rule code |

### Critical Partial Unique Indexes (PostgreSQL Raw Migration SQL alongside Prisma)
```sql
-- 1. Only one active default address per customer
CREATE UNIQUE INDEX uq_customer_addresses_one_default
  ON customer_addresses (user_id)
  WHERE is_default = true AND deleted_at IS NULL;

-- 2. Prevent duplicate active seller listings for the same product + variant (handling NULL variant_id)
CREATE UNIQUE INDEX uq_seller_listing_active_product_variant
  ON seller_product_listings (
    seller_id,
    product_id,
    COALESCE(variant_id, '00000000-0000-0000-0000-000000000000'::uuid)
  )
  WHERE deleted_at IS NULL;

-- 3. Prevent duplicate seller-local SKU within the same Kirana shop
CREATE UNIQUE INDEX uq_seller_listing_sku
  ON seller_product_listings (seller_id, seller_sku)
  WHERE seller_sku IS NOT NULL AND deleted_at IS NULL;

-- 4. Prevent duplicate CREDIT_SALE ledger entry for the same order
CREATE UNIQUE INDEX uq_credit_ledger_one_sale_per_order
  ON credit_ledger_entries (order_id)
  WHERE entry_type = 'CREDIT_SALE' AND status = 'POSTED';
```

---

## 2. Database-Level `CHECK` & Integrity Constraints

Enforce domain invariants directly inside PostgreSQL so no buggy script or API request can corrupt financial or inventory state:

```sql
-- Geography
ALTER TABLE inter_village_routes
  ADD CONSTRAINT chk_routes_distinct_villages CHECK (from_village_id <> to_village_id),
  ADD CONSTRAINT chk_routes_non_negative CHECK (distance_km >= 0 AND surcharge_amount >= 0);

-- Sellers & Fees
ALTER TABLE sellers
  ADD CONSTRAINT chk_sellers_amounts_non_neg CHECK (
    delivery_radius_km >= 0 AND minimum_order_amount >= 0
    AND packaging_fee >= 0 AND delivery_fee >= 0
    AND commission_rate_bps BETWEEN 0 AND 5000
    AND rating_avg BETWEEN 0.00 AND 5.00
  ),
  ADD CONSTRAINT chk_sellers_udhari_ack CHECK (
    udhari_enabled = false OR udhari_policy_acknowledged_at IS NOT NULL
  );

-- Seller Listings & Kirana Inventory
ALTER TABLE seller_product_listings
  ADD CONSTRAINT chk_listing_prices CHECK (selling_price >= 0 AND mrp_price >= selling_price),
  ADD CONSTRAINT chk_listing_stock CHECK (
    stock_quantity >= 0 AND reserved_quantity >= 0
    AND low_stock_threshold >= 0 AND min_quantity > 0 AND quantity_step > 0
  );

-- Orders & Order Items
ALTER TABLE orders
  ADD CONSTRAINT chk_orders_totals_non_neg CHECK (
    item_subtotal >= 0 AND item_discount >= 0 AND coupon_discount >= 0
    AND delivery_fee >= 0 AND packaging_fee >= 0 AND tax_amount >= 0
    AND platform_fee >= 0 AND total_amount >= 0 AND commission_amount >= 0
  ),
  ADD CONSTRAINT chk_orders_pickup_zero_delivery CHECK (
    fulfilment_mode <> 'PICKUP' OR delivery_fee = 0.00
  );

ALTER TABLE order_items
  ADD CONSTRAINT chk_order_items_qty CHECK (
    requested_quantity > 0 AND returned_quantity >= 0
    AND returned_quantity <= requested_quantity
    AND unit_price >= 0 AND line_total >= 0
  );

-- Delivery Mutual Exclusivity
ALTER TABLE order_deliveries
  ADD CONSTRAINT chk_delivery_assignee_exclusive CHECK (
    (fulfilment_type = 'CUSTOMER_PICKUP' AND seller_staff_id IS NULL AND delivery_partner_id IS NULL)
    OR (fulfilment_type = 'SELLER_RUNNER' AND delivery_partner_id IS NULL)
    OR (fulfilment_type = 'PLATFORM_PARTNER' AND seller_staff_id IS NULL)
  );

-- Settlements Formula Integrity
ALTER TABLE seller_settlements
  ADD CONSTRAINT chk_settlement_period CHECK (period_end >= period_start),
  ADD CONSTRAINT chk_settlement_net_formula CHECK (
    net_payable = gross_amount - commission_amount - refund_deductions - platform_fee_deduction - other_deductions
  );

-- Udhari Credit Integrity
ALTER TABLE customer_credit_profiles
  ADD CONSTRAINT chk_credit_profile_non_neg CHECK (
    credit_limit >= 0 AND outstanding_balance >= 0
    AND overdue_amount >= 0 AND default_due_days > 0
  );

ALTER TABLE credit_ledger_entries
  ADD CONSTRAINT chk_credit_ledger_amount CHECK (amount > 0 AND running_balance >= 0);

-- Coupons, Reviews & Platform Settings Singleton
ALTER TABLE offers_coupons
  ADD CONSTRAINT chk_coupon_validity CHECK (valid_until > valid_from AND used_count <= usage_limit);

ALTER TABLE reviews
  ADD CONSTRAINT chk_reviews_rating CHECK (rating BETWEEN 1 AND 5);

ALTER TABLE platform_settings
  ADD CONSTRAINT chk_platform_settings_singleton CHECK (id = 1);
```

---

## 3. High-Impact Performance Indexes

### A. Storefront Discovery & Search Indexes
| Table | Index Definition | Query Accelerated |
|---|---|---|
| `sellers` | `idx_sellers_village_status (village_id, status, is_open_now, is_paused)` | Active open shops in customer's village |
| `seller_serviceable_villages` | `idx_ssv_village_active (village_id, seller_id) WHERE is_active = true` | Neighbor-village deliverable shops lookup |
| `products` | `idx_products_vertical_cat (vertical_id, category_id, moderation_status, is_active)` | Category browsing & Admin moderation queue |
| `products` | `GIN (to_tsvector('simple', name \|\| ' ' \|\| COALESCE(hindi_name, '')))` | Fast bilingual English + Hindi product search |
| `product_attribute_values` | `idx_pav_attr_text (attribute_id, value_text)` and `idx_pav_attr_num (attribute_id, value_number)` | Faceted attribute filtering (Diet, Size, Brand, Weight) |

### B. Kirana Store Inventory & Low Stock Indexes
| Table | Index Definition | Query Accelerated |
|---|---|---|
| `seller_product_listings` | `idx_spl_seller_active (seller_id, is_active, is_available) WHERE deleted_at IS NULL` | Seller catalog & Kirana inventory dashboard |
| `seller_product_listings` | `idx_spl_low_stock (seller_id, stock_quantity) WHERE track_stock = true AND is_available = true AND stock_quantity <= low_stock_threshold AND deleted_at IS NULL` | Instant **Low Stock Alerts** count & reorder strip |
| `seller_product_listings` | `idx_spl_out_of_stock (seller_id) WHERE (stock_quantity <= 0 OR is_available = false) AND deleted_at IS NULL` | Instant **Out of Stock** filter tab |
| `seller_product_listings` | `idx_spl_expiry (seller_id, expiry_date) WHERE expiry_date IS NOT NULL AND deleted_at IS NULL` | FEFO near-expiry & expired stock alerts |
| `inventory_stock_movements` | `idx_ism_listing_time (seller_listing_id, created_at DESC)` | Item-level stock movement history |

### C. Orders, Live Tracking & Seller Terminal Indexes
| Table | Index Definition | Query Accelerated |
|---|---|---|
| `orders` | `idx_orders_seller_status_time (seller_id, status, created_at DESC)` | Seller Orders Terminal (`PLACED`/`PENDING`/`PREPARING`) |
| `orders` | `idx_orders_customer_time (customer_id, created_at DESC)` | Customer Drawer Order History |
| `orders` | `idx_orders_village_time (village_id, created_at DESC)` | Admin village-scoped order dashboard & analytics |
| `orders` | `idx_orders_accept_sla (accept_deadline_at) WHERE status IN ('PLACED', 'PENDING')` | Auto-cancel SLA background worker |
| `order_items` | `idx_order_items_order (order_id)` | Fast order line-item loading |
| `order_status_history` | `idx_osh_order_time (order_id, created_at ASC)` | Order Tracking timeline |
| `order_deliveries` | `idx_od_staff_status (seller_staff_id, status)` & `idx_od_partner_status (delivery_partner_id, status)` | Active dispatch runs per shop runner / village rider |

### D. Payments, Refunds, Settlements & Udhari Indexes
| Table | Index Definition | Query Accelerated |
|---|---|---|
| `payment_transactions` | `idx_ptx_order_time (order_id, created_at DESC)` & `idx_ptx_status_time (status, created_at DESC)` | Failed payments monitor & order reconciliation |
| `refunds` | `idx_refunds_status_time (status, initiated_at DESC)` | Admin Refund Queue (`INITIATED`, `PROCESSING`) |
| `seller_settlements` | `idx_settlements_seller_period (seller_id, period_end DESC)` | Seller payout history & Admin payout batching |
| `customer_credit_profiles` | `idx_ccp_seller_status_bal (seller_id, status, outstanding_balance DESC)` | Seller Udhari ledger list sorted by highest dues |
| `credit_ledger_entries` | `idx_cle_profile_time (credit_profile_id, posted_at DESC)` | Customer khata passbook statement |
| `credit_ledger_entries` | `idx_cle_overdue_scan (due_date) WHERE entry_type = 'CREDIT_SALE' AND status = 'POSTED' AND is_overdue = false` | Nightly overdue aging job |
| `notifications` | `idx_notif_user_unread (user_id, created_at DESC) WHERE is_read = false` | Unread notification badge & Seller Buzzer poll |
| `audit_logs` | `idx_audit_entity_time (target_entity, target_id, created_at DESC)` & `idx_audit_actor_time (actor_user_id, created_at DESC)` | Admin compliance & forensic audit filtering |

---

## 4. Query Optimization Guidelines (Prisma + PostgreSQL)

1. **Keyset (Cursor) Pagination over `OFFSET`:** For high-growth tables (`orders`, `inventory_stock_movements`, `credit_ledger_entries`, `audit_logs`, `notifications`), use cursor pagination on `(created_at DESC, id DESC)` instead of `OFFSET N` to avoid $O(N)$ scan degradation.
2. **Eliminate N+1 Queries in Storefront & Inventory:** Always load `seller_product_listings` with a single `JOIN` / Prisma `include` on `product`, `variant`, `category`, and `brand`.
3. **Short-Lived Row Locks for Concurrency:** Always sort `seller_listing_id` UUIDs ascending before acquiring `SELECT ... FOR UPDATE` locks during Checkout or Bulk Inventory Update — this **eliminates deadlocks** when two customers buy the same Kirana staples simultaneously.
4. **Partial Indexes for Hot Operational Queues:** Queues like `PENDING` orders, `OPEN` support cases, `UNREAD` notifications, and `LOW_STOCK` Kirana items represent a tiny fraction of total rows over time — partial indexes keep them permanently cached in PostgreSQL shared buffers.
5. **Materialized Views for Admin Analytics:** Use periodically refreshed materialized views (`mv_daily_village_gmv`, `mv_seller_performance_summary`) for `AdminAnalyticsView` and `SellerAnalyticsView` rather than scanning millions of `orders` rows live.
