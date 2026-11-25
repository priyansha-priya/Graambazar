# GramBazaar Table Relationships & Foreign Key Architecture

This document catalogs every relationship across the **74 tables** in the GramBazaar PostgreSQL schema — organized by cardinality (**1:1**, **1:N**, **M:N**, and **Self-Referencing**), foreign key delete/update semantics, and cross-module dependency flows.

---

## 1. One-to-One (1:1) Relationships

Enforced in PostgreSQL via a `UNIQUE` constraint (or shared `PRIMARY KEY`) on the child table's foreign key.

| Parent Table | Child Table | FK Column | Purpose & Business Meaning | Delete Behavior |
|---|---|---|---|---|
| `users` | `carts` | `carts.customer_id` (UNIQUE) | Each customer has at most one active single-seller cart at any time. | `ON DELETE CASCADE` |
| `users` | `delivery_partners` | `delivery_partners.user_id` (UNIQUE) | Extends a user account with platform village delivery partner profile & vehicle info. | `ON DELETE RESTRICT` |
| `sellers` | `seller_safety_profiles` | `seller_safety_profiles.seller_id` (PK + FK) | Stores each food/grocery seller's overall safety certification badge, compliance score, and retraining/suspension status. | `ON DELETE RESTRICT` |
| `orders` | `order_cancellations` | `order_cancellations.order_id` (UNIQUE) | An order can be cancelled at most once, capturing actor, policy rule, penalty, and refund eligibility. | `ON DELETE RESTRICT` |
| `orders` | `order_deliveries` | `order_deliveries.order_id` (UNIQUE) | Every order has one active fulfilment record (Seller Runner, Platform Partner, or Customer Self-Pickup). | `ON DELETE RESTRICT` |
| `orders` | `seller_settlement_orders` | `seller_settlement_orders.order_id` (UNIQUE) | **Critical Financial Integrity:** Guarantees an order can be settled to a seller **only once**, preventing double payouts. | `ON DELETE RESTRICT` |
| `orders` | `coupon_redemptions` | `coupon_redemptions.order_id` (UNIQUE) | An order can redeem at most one coupon code. | `ON DELETE RESTRICT` |
| `orders` | `reviews` | `reviews.order_id` (UNIQUE) | One verified customer review per completed order. | `ON DELETE RESTRICT` |

---

## 2. One-to-Many (1:N) Relationships

### Identity, Geography & Sellers
| Parent (1) | Child (N) | FK Column | Notes |
|---|---|---|---|
| `villages` | `users` | `users.active_village_id` | Customer/user's currently selected village. (`ON DELETE SET NULL`) |
| `villages` | `village_landmarks` | `village_landmarks.village_id` | Rural landmarks belonging to a village. (`ON DELETE RESTRICT`) |
| `villages` | `inter_village_routes` | `from_village_id`, `to_village_id` | Directional neighbor-village distance and surcharge mapping. (`ON DELETE RESTRICT`) |
| `villages` | `customer_addresses` | `customer_addresses.village_id` | Each rural delivery address belongs to one village. (`ON DELETE RESTRICT`) |
| `users` | `customer_addresses` | `customer_addresses.user_id` | A customer can save multiple addresses (Home, Work, Other). (`ON DELETE CASCADE`) |
| `users` | `auth_tokens` | `auth_tokens.user_id` | Active refresh tokens, OTPs, and password reset tokens. (`ON DELETE CASCADE`) |
| `roles` | `role_permissions` | `role_permissions.role_id` | Module-level RBAC matrix per role. (`ON DELETE CASCADE`) |
| `users` | `sellers` | `sellers.owner_user_id` | One user may own one or more local shops. (`ON DELETE RESTRICT`) |
| `verticals` | `sellers` | `sellers.primary_vertical_id` | Primary business vertical (`FOOD`, `GROCERY`, etc.). (`ON DELETE RESTRICT`) |
| `villages` | `sellers` | `sellers.village_id` | Physical village where the shop is located. (`ON DELETE RESTRICT`) |
| `sellers` | `seller_kyc_documents` | `seller_kyc_documents.seller_id` | Uploaded FSSAI, Aadhaar, PAN, Store Photo, GST, Agri License docs. (`ON DELETE RESTRICT`) |
| `seller_kyc_documents` | `seller_kyc_document_events` | `kyc_document_id` | Chronological approve/reject/change-request audit log per document. (`ON DELETE CASCADE`) |
| `sellers` | `seller_staff_members` | `seller_staff_members.seller_id` | In-house shop runners, cashiers, delivery boys, family helpers. (`ON DELETE RESTRICT`) |

### Universal Product Catalog, Masters & Seller Inventory
| Parent (1) | Child (N) | FK Column | Notes |
|---|---|---|---|
| `verticals` | `categories` | `categories.vertical_id` | Categories scoped to a vertical. |
| `verticals` | `availability_stock_configs` | `availability_stock_configs.vertical_id` | Reusable stock/prep-slot policies per vertical. |
| `option_groups` | `option_group_items` | `option_group_items.option_group_id` | Individual add-on/portion choices within a group. (`ON DELETE CASCADE`) |
| `verticals` | `products` | `products.vertical_id` | Every universal product belongs to one vertical. |
| `categories` | `products` | `products.category_id`, `products.subcategory_id` | Primary category and optional subcategory. |
| `brands` | `products` | `products.brand_id` | Optional verified brand (nullable for loose local items/food). |
| `units` | `products` | `products.default_unit_id` | Base measurement unit (`kg`, `plate`, `piece`, `pav`). |
| `packaging_masters` | `products` | `products.default_packaging_id` | Default container/bag master. |
| `availability_stock_configs` | `products` | `products.availability_config_id` | Default stock/prep workflow config. |
| `tax_slabs` | `products` | `products.tax_slab_id` | Default GST/tax slab. |
| `products` | `product_attribute_values` | `product_attribute_values.product_id` | Dynamic category attributes per product. (`ON DELETE CASCADE`) |
| `attributes` | `product_attribute_values` | `product_attribute_values.attribute_id` | Links each value to its master attribute definition. |
| `products` | `product_variants` | `product_variants.product_id` | Size/weight/portion SKU variants for a universal product. |
| `sellers` | `seller_product_listings` | `seller_product_listings.seller_id` | **Seller-specific pricing, local units, shelf/expiry & stock.** |
| `products` | `seller_product_listings` | `seller_product_listings.product_id` | Multiple sellers can list the same universal product independently. |
| `product_variants` | `seller_product_listings` | `seller_product_listings.variant_id` | Optional variant-level listing. |
| `seller_product_listings` | `inventory_stock_movements` | `inventory_stock_movements.seller_listing_id` | Immutable stock adjustment & order deduction ledger. (`ON DELETE RESTRICT`) |
| `sellers` | `seller_bulk_inventory_jobs` | `seller_bulk_inventory_jobs.seller_id` | Audit history of bulk price/stock/status updates. |

### Cart, Orders, Delivery & Finance
| Parent (1) | Child (N) | FK Column | Notes |
|---|---|---|---|
| `carts` | `cart_items` | `cart_items.cart_id` | Line items inside active customer cart. (`ON DELETE CASCADE`) |
| `seller_product_listings` | `cart_items` | `cart_items.seller_listing_id` | Live seller listing referenced by cart item. |
| `users` | `orders` | `orders.customer_id` | Customer's complete order history. (`ON DELETE RESTRICT`) |
| `sellers` | `orders` | `orders.seller_id` | Orders received by a shop. (`ON DELETE RESTRICT`) |
| `villages` | `orders` | `orders.village_id` | Order fulfilment village for analytics & routing. (`ON DELETE RESTRICT`) |
| `orders` | `order_items` | `order_items.order_id` | Frozen historical line items for an order. (`ON DELETE RESTRICT`) |
| `orders` | `order_status_history` | `order_status_history.order_id` | Complete state transition timeline. (`ON DELETE RESTRICT`) |
| `orders` | `order_returns` | `order_returns.order_id` | Return requests (supports partial/multiple return requests). |
| `order_returns` | `order_return_items` | `order_return_items.order_return_id` | Specific line items returned and their refund values. |
| `order_items` | `order_return_items` | `order_return_items.order_item_id` | Enforces returned qty ≤ ordered qty. |
| `seller_staff_members` | `order_deliveries` | `order_deliveries.seller_staff_id` | Orders dispatched via shop's in-house runner. |
| `delivery_partners` | `order_deliveries` | `order_deliveries.delivery_partner_id` | Orders dispatched via GramBazaar village fleet rider. |
| `orders` | `payment_transactions` | `payment_transactions.order_id` | Supports multiple payment attempts (e.g., 1 failed UPI + 1 captured UPI retry). |
| `orders` | `refunds` | `refunds.order_id` | Supports full or multiple partial refunds on an order. |
| `payment_transactions` | `refunds` | `refunds.payment_transaction_id` | Traces refund back to original captured payment. |
| `sellers` | `seller_settlements` | `seller_settlements.seller_id` | Periodic payout statements for a seller. |
| `seller_settlements` | `seller_settlement_orders` | `seller_settlement_orders.settlement_id` | Exact orders included in each settlement batch. |

### Seller-Managed Udhari, Offers, Reviews, Support & Safety
| Parent (1) | Child (N) | FK Column | Notes |
|---|---|---|---|
| `sellers` | `customer_credit_profiles` | `customer_credit_profiles.seller_id` | All khata/credit customers managed by a seller. |
| `users` | `customer_credit_profiles` | `customer_credit_profiles.customer_id` | A customer may hold independent Udhari accounts at different shops. |
| `customer_credit_profiles` | `credit_repayments` | `credit_repayments.credit_profile_id` | All repayments made by customer to that seller. |
| `customer_credit_profiles` | `credit_ledger_entries` | `credit_ledger_entries.credit_profile_id` | Chronological double-entry Udhari ledger for `(seller, customer)`. |
| `orders` | `credit_ledger_entries` | `credit_ledger_entries.order_id` | Links `CREDIT_SALE` and `SALE_REVERSAL` entries to the exact order. |
| `credit_repayments` | `credit_ledger_entries` | `credit_ledger_entries.repayment_id` | Links `REPAYMENT` entries to their receipt record. |
| `credit_ledger_entries` | `credit_disputes` | `credit_disputes.ledger_entry_id` | Customer-raised disputes on a specific ledger line. |
| `offers_coupons` | `coupon_redemptions` | `coupon_redemptions.coupon_id` | All redemptions of a coupon code. |
| `sellers` | `reviews` | `reviews.seller_id` | Verified customer reviews for a seller. |
| `orders` | `support_cases` | `support_cases.order_id` | Customer complaints linked to an order. |
| `sellers` | `seller_checklist_submissions` | `seller_checklist_submissions.seller_id` | Daily hygiene/storage checklist records per seller. |
| `sellers` | `seller_exam_attempts` | `seller_exam_attempts.seller_id` | All certification exam attempts by a seller. |
| `sellers` | `safety_inspection_audits` | `safety_inspection_audits.seller_id` | Admin field/remote quality inspection records. |
| `users` | `notifications` | `notifications.user_id` | Targeted in-app/push/SMS/WhatsApp notifications. |

---

## 3. Many-to-Many (M:N) Relationships

Implemented cleanly via explicit junction tables (never comma-separated IDs):

| Entity A | Entity B | Junction Table | Composite PK / Unique | Purpose |
|---|---|---|---|---|
| `users` | `roles` | `user_roles` | `UNIQUE(user_id, role_id)` | Multi-role users (e.g., Customer + Seller Owner, or Admin Ops + Support). |
| `users` (Admins) | `villages` | `admin_village_scopes` | `PK(user_id, village_id)` | Regional village-scoped admin governance. |
| `sellers` | `verticals` | `seller_verticals` | `PK(seller_id, vertical_id)` | Multi-vertical shops (e.g., Kirana + Agriculture). |
| `sellers` | `villages` | `seller_serviceable_villages` | `PK(seller_id, village_id)` | Dynamic multi-village delivery coverage + optional custom village delivery fee. |
| `brands` | `verticals` | `brand_verticals` | `PK(brand_id, vertical_id)` | Brands applicable across one or more verticals. |
| `categories` | `units` | `category_allowed_units` | `PK(category_id, unit_id)` | Valid measurement units per category (e.g., `kg`/`g`/`pav` for Staples; `plate` for Food). |
| `categories` | `attributes` | `category_attributes` | `PK(category_id, attribute_id)` | Dynamic attribute schema per category (with optional `is_required_override`). |
| `products` | `option_groups` | `product_option_groups` | `PK(product_id, option_group_id)` | Add-ons & portion customizations attached to products. |
| `sellers` | `safety_training_modules` | `seller_training_completions` | `PK(seller_id, module_id)` | Tracks mandatory Food/Grocery safety training module completion per seller. |

---

## 4. Self-Referencing Relationships

| Table | Self-FK Column | Cardinality | Purpose |
|---|---|---|---|
| `categories` | `categories.parent_id` → `categories.id` | 1:N Tree | Category → Subcategory hierarchy (e.g., *Staples & Grains* → *Atta & Flours*, *Dal & Pulses*). |
| `credit_ledger_entries` | `credit_ledger_entries.reversed_entry_id` → `credit_ledger_entries.id` | 1:1 / 1:N Reversal | Append-only double-entry reversal: a `SALE_REVERSAL` or `REPAYMENT_REVERSAL` points to the original `POSTED` ledger entry rather than deleting or overwriting it. |

---

## 5. Cross-Module Dependency Flows (End-to-End Traceability)

### Flow A: Product Creation → Kirana Inventory → Order → Stock Ledger
```
verticals ─▶ categories ─▶ products ─▶ product_variants
                                │
                                ▼
                    seller_product_listings (seller_id, price, stock, rack, expiry)
                         │            │
                         ▼            ▼
                   cart_items    inventory_stock_movements (audit trail)
                         │
                         ▼
               orders ─▶ order_items (frozen price/name/variant snapshot)
```

### Flow B: Order → Payment / Refund / Commission → Seller Settlement
```
fee_rules ───────┐
                 ▼
orders ──┬──▶ payment_transactions (INITIATED / CAPTURED / FAILED / PENDING_COD)
         ├──▶ order_cancellations / order_returns ──▶ refunds
         └──▶ seller_settlement_orders (UNIQUE order_id) ──▶ seller_settlements (UTR payout)
```

### Flow C: Seller-Owned Udhari Credit Lifecycle
```
sellers (udhari_enabled=true) + users (customer)
                 │
                 ▼
      customer_credit_profiles (UNIQUE seller_id, customer_id)
                 │
     ┌───────────┴────────────────┐
     ▼                            ▼
orders (payment_method=UDHAR)   credit_repayments (CASH / SELLER_UPI_DIRECT)
     │                            │
     └──────────┬─────────────────┘
                ▼
      credit_ledger_entries (append-only, running_balance)
                │
                ▼
         credit_disputes (customer-raised, seller/admin-resolved)
```

---

## 6. Foreign Key Delete Policy Matrix

| Policy | Applied To | Rationale |
|---|---|---|
| **`ON DELETE RESTRICT`** | `orders`, `order_items`, `order_status_history`, `payment_transactions`, `refunds`, `seller_settlements`, `seller_settlement_orders`, `credit_ledger_entries`, `credit_repayments`, `inventory_stock_movements`, `seller_kyc_documents`, `sellers`, `villages`, `products` | Prevents accidental destruction of financial, tax, Udhari, compliance, or order history records. Use soft deletes (`deleted_at`) or status transitions (`INACTIVE` / `REVERSED`) instead. |
| **`ON DELETE CASCADE`** | `cart_items`, `user_roles`, `role_permissions`, `admin_village_scopes`, `auth_tokens`, `option_group_items`, `product_attribute_values`, `seller_kyc_document_events`, junction mappings (`brand_verticals`, `category_allowed_units`, `category_attributes`, `product_option_groups`, `seller_training_completions`) | Ephemeral or purely dependent child rows whose lifecycle cannot exist independently of their parent. |
| **`ON DELETE SET NULL`** | `users.active_village_id`, `orders.delivery_address_id`, `order_items.seller_listing_id`, `order_items.product_id`, `order_items.variant_id`, `orders.coupon_id`, `audit_logs.actor_user_id` | Preserves historical records intact even if a non-critical reference (like a customer's saved address or a soft-archived coupon) is later removed, because snapshot columns hold the historical values. |
