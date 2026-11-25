# GramBazaar Database Business Rules

This document defines the strict **database-enforced** and **transactional application-layer** business rules across every GramBazaar workflow. Every rule maps directly to the PostgreSQL schema and Prisma transaction boundaries.

---

## 1. Seller Registration
- A seller registers via a `users` account and creates a `sellers` row starting in `status = 'PENDING_APPROVAL'` and `kyc_status = 'PENDING'`.
- Every seller MUST specify: `owner_user_id`, `public_name`, `business_type`, `primary_vertical_id`, `village_id`, `contact_phone`, and `shop_address`.
- **Strict No-Tiffin Rule (Food Vertical):** If `primary_vertical_id` (or any entry in `seller_verticals`) corresponds to `verticals.code = 'FOOD'`, then `sellers.business_type` MUST be one of `RESTAURANT`, `HOTEL`, `DHABA`, or `BAKERY`. Tiffin services / meal subscription kitchens are strictly disallowed.
- On creation, the seller's home `village_id` is automatically inserted into `seller_serviceable_villages`, and `primary_vertical_id` is mirrored in `seller_verticals (is_primary = true)`.
- Multi-vertical listing (`COUNT(seller_verticals) > 1`) is only permitted when `platform_settings.allow_multi_vertical_sellers = true`.
- A seller cannot receive customer orders (`is_open_now` cannot be set `true` and listings are hidden from storefront) until `sellers.status = 'ACTIVE'` AND `sellers.kyc_status = 'APPROVED'`.

---

## 2. Seller KYC Verification
- Required documents are governed dynamically by `verticals.required_kyc_docs` (e.g., `FOOD` mandates `FSSAI`, `AADHAAR`, `PAN`, `STORE_PHOTO`; `GROCERY` mandates `AADHAAR`, `PAN`, `STORE_PHOTO`, and `FSSAI` for packaged food/kirana; `AGRICULTURE` mandates `AGRI_LICENSE`).
- Each document in `seller_kyc_documents` has `UNIQUE(seller_id, doc_code)`. Sensitive document numbers (Aadhaar, PAN, bank account) are stored encrypted (`*_encrypted`) with only masked strings (`XXXX-XXXX-4321`) returned to standard UIs.
- Every admin review action (`APPROVED`, `REJECTED`, `CHANGES_REQUESTED`) MUST atomically:
  1. Update `seller_kyc_documents.status`, `reviewed_by_user_id`, and `reviewed_at`.
  2. Append an immutable row to `seller_kyc_document_events` with a mandatory `note` (especially on rejection/change requests).
  3. Write an entry to `audit_logs`.
- `sellers.kyc_status` transitions to `APPROVED` only when **all** `required_kyc_docs` for every assigned vertical have `status = 'APPROVED'`. If `FSSAI` is approved, `sellers.fssai_verified = true`.

---

## 3. Product Creation (Universal Catalog + Seller Listings)
- Sellers MUST select active centralized masters (`categories`, `units`, optionally `brands`, `packaging_masters`, `availability_stock_configs`, `option_groups`) belonging to an enabled vertical assigned to their shop.
- **No Separate Product Tables Per Category:** Grocery, Food, Hardware, Apparel, Electronics, Furniture, and Agriculture all insert into `products` (universal metadata), `product_attribute_values` (category-specific specs), `product_variants` (size/weight/portion SKUs), and `seller_product_listings` (seller's price, stock, local unit, rack/shelf, expiry).
- `diet_type` (`VEG`, `NON_VEG`, `EGG`) is mandatory when `verticals.code = 'FOOD'` and nullable for non-food verticals.
- `seller_product_listings.selling_price` MUST satisfy `0 <= selling_price <= mrp_price`.
- Rural local units (e.g., `1 pav = 250 g`) may only be customized on `seller_product_listings.local_unit_*` if the selected `units.allow_seller_local_override = true`.

---

## 4. Product Approval & Moderation
- Newly created universal `products` submitted by a seller enter `moderation_status = 'PENDING_REVIEW'` unless created from an existing Admin-approved universal template (`is_universal_template = true`).
- Only products where `products.moderation_status = 'APPROVED' AND products.is_active = true` AND `seller_product_listings.moderation_status = 'APPROVED' AND seller_product_listings.is_active = true` are visible to customers on the storefront.
- Rejecting or requesting changes on a product requires non-empty `moderation_notes`, sets `moderated_by_user_id` and `moderated_at`, and logs an `audit_logs` record.

---

## 5. Inventory & Kirana Stock Management
- Inventory is strictly **seller-specific** in `seller_product_listings` (two Kirana shops selling the same universal `India Gate Basmati Rice 1kg` maintain independent stock counts, thresholds, rack locations, expiry dates, and suppliers).
- **Stock Health Status Classification** (matching Kirana Store Inventory UI):
  - **Out of Stock:** `stock_quantity <= 0 OR is_available = false`
  - **Low Stock:** `is_available = true AND stock_quantity > 0 AND stock_quantity <= low_stock_threshold`
  - **In Stock:** `is_available = true AND stock_quantity > low_stock_threshold`
- **Auto-Availability Sync:**
  - When `track_stock = true` and `stock_quantity` drops to `0` (and `auto_disable_on_zero_stock = true`), `is_available` automatically sets to `false`.
  - When a seller restocks a `0`-stock / unavailable item to `stock_quantity > 0`, `is_available` automatically sets back to `true` in the same transaction.
- **Immutable Stock Ledger:** Every single stock change (manual edit, `-1 / +5 / +10 / +20 Restock`, Bulk Update, Order Deduction, Order Cancellation Restore, Return Restock, Damage/Expiry Write-Off) MUST execute inside a database transaction that locks the `seller_product_listings` row (`SELECT ... FOR UPDATE`), updates `stock_quantity`, and inserts an append-only row into `inventory_stock_movements` (`quantity_before`, `quantity_delta`, `quantity_after`).
- **Concurrency Safety:** `CHECK(stock_quantity >= 0)` prevents overselling under concurrent checkouts.
- **Bulk Inventory Updates:** Each bulk update action logs a summary row in `seller_bulk_inventory_jobs` and individual movement rows in `inventory_stock_movements` for every affected listing.
- **FEFO / Expiry Compliance:** Kirana listings with `expiry_date < CURRENT_DATE` trigger a seller alert and should be blocked from sale via scheduled job (`is_available = false` + `EXPIRY_WRITE_OFF` workflow).

---

## 6. Shopping Cart
- **Single-Seller Cart Rule:** `carts` has `UNIQUE(customer_id)` and a single `seller_id`. Adding an item from a different seller requires explicit customer confirmation (`forceAddItem`), which atomically clears `cart_items` and reassigns `carts.seller_id`.
- Every `cart_items.seller_listing_id` MUST belong to `carts.seller_id`, and `quantity >= listing.min_quantity` and `quantity` must respect `quantity_step` (e.g., `0.250 kg` increments for loose Kirana grains).
- Cart does NOT permanently lock inventory; stock is re-validated atomically at Checkout.

---

## 7. Checkout
Checkout runs inside a single serializable / row-locked PostgreSQL transaction (`prisma.$transaction`):
1. Verify seller is `ACTIVE`, `kyc_status = 'APPROVED'`, `is_open_now = true`, and `is_paused = false`.
2. Verify village serviceability: if `fulfilment_mode = 'DELIVERY'`, customer's address `village_id` MUST exist in `seller_serviceable_villages` with `is_active = true`, and `customer_addresses.landmark` MUST be non-empty.
3. Verify `item_subtotal >= sellers.minimum_order_amount`.
4. Lock all involved `seller_product_listings` rows (`FOR UPDATE`), verify `is_available = true` and `stock_quantity >= requested_quantity` (when `track_stock = true`), and deduct/reserve stock with `inventory_stock_movements`.
5. Validate coupon (if applied): active window, village/vertical/seller scope, `min_order_amount`, `used_count < usage_limit`, and customer usage `< per_customer_limit`.
6. Compute exact `NUMERIC(12,2)` totals:
   `total_amount = item_subtotal - item_discount - coupon_discount + delivery_fee + packaging_fee + tax_amount + platform_fee`
   *(If `fulfilment_mode = 'PICKUP'`, `delivery_fee = 0.00`.)*
7. Validate payment method: if `UDHAR`, execute Udhari credit eligibility & atomic ledger posting (see Section 18–19).
8. Freeze immutable snapshots into `orders`, `order_items`, `order_status_history`, `order_deliveries`, `payment_transactions`, and `coupon_redemptions`.
9. Create seller order alert in `notifications` (with `accept_deadline_at = NOW() + platform_settings.auto_cancel_unaccepted_mins`) and clear `cart_items`.

---

## 8. Orders & State Machine
Valid forward & terminal transitions enforced by application state machine and logged in `order_status_history`:
- `PLACED` → `PENDING` → `ACCEPTED` | `REJECTED` | `CANCELLED`
- `ACCEPTED` → `PREPARING` | `CANCELLED`
- `PREPARING` → `READY_FOR_PICKUP` (if `PICKUP`) | `READY_FOR_DELIVERY` (if `DELIVERY`)
- `READY_FOR_PICKUP` → `COMPLETED` | `CANCELLED`
- `READY_FOR_DELIVERY` → `OUT_FOR_DELIVERY`
- `OUT_FOR_DELIVERY` → `COMPLETED` | `DELIVERY_FAILED`
- `COMPLETED` → `RETURNED` (on approved return) → `REFUNDED`
- **Historical Data Preservation:** `orders` and `order_items` NEVER read live prices/names from `products` or `seller_product_listings` after creation. All invoice/order-history queries read frozen `*_snapshot`, `unit_price`, `mrp_unit_price`, and `line_total` columns.
- **Auto-Cancel SLA:** A background job cancels orders still in `PLACED`/`PENDING` past `accept_deadline_at` (`cancelled_by_actor = 'SYSTEM'`), restoring inventory and reversing Udhari/prepaid payments.

---

## 9. Order Cancellation
- Every cancellation MUST insert a `order_cancellations` row (`UNIQUE order_id`) referencing the matched `cancellation_policy_rules.id` and append an `order_status_history` entry.
- Customer free cancellation is allowed within `free_cancel_window_mins` (or before `PREPARING` starts). Beyond the window, `penalty_amount` may apply per rule.
- On cancellation:
  1. Restore tracked stock via `inventory_stock_movements (movement_type = 'ORDER_CANCELLED_RESTORE')`.
  2. If `payment_method = 'UDHAR'`, append an offsetting `SALE_REVERSAL` entry in `credit_ledger_entries` and reduce `customer_credit_profiles.outstanding_balance`.
  3. If prepaid (`PLATFORM_UPI` / `SELLER_UPI` with `CAPTURED`), automatically create a `refunds` row (`status = 'INITIATED'`).
  4. Decrement `offers_coupons.used_count` if the order was cancelled prior to completion.

---

## 10. Payments & Failed Payments
- Every payment attempt creates a row in `payment_transactions` with a unique `transaction_ref`.
- **Failed Payments:** Failed UPI/gateway attempts are permanently stored with `status = 'FAILED'`, `failure_code`, and `failure_reason` (never overwritten or deleted). A customer retry creates a **new** `payment_transactions` row linked to the same `order_id`.
- `COD` orders create a `payment_transactions` row with `status = 'PENDING_COD'` at placement and transition to `CAPTURED` (with `paid_at`) when the runner/shop marks the order handed over and paid.
- `orders.payment_status` stays strictly synchronized with the aggregate state of `payment_transactions` and `refunds`.

---

## 11. Refunds
- A refund can only be initiated against an order with captured payment or an approved `order_returns` / `support_cases` record.
- **Refund Ceiling Rule:** `SUM(refunds.amount WHERE order_id = X AND status NOT IN ('REJECTED', 'FAILED')) <= orders.total_amount`.
- Refund channel mapping:
  - `UDHAR` order → `channel = 'UDHAR_REVERSAL'` (posts `SALE_REVERSAL` in `credit_ledger_entries`).
  - `UPI` order → `channel = 'ORIGINAL_UPI'` or `STORE_CREDIT`.
  - `COD` order → `channel = 'BANK_TRANSFER'`, `CASH_SETTLEMENT`, or `STORE_CREDIT`.
- When a refund is processed after a seller was already paid in a settlement, the refund amount is captured as `refund_deductions` in the seller's **next** `seller_settlements` batch.

---

## 12. Platform Commission
- At checkout, the active `fee_rules` row matching the order's vertical (or global `vertical_id IS NULL` fallback) where `effective_from <= NOW() AND (effective_until IS NULL OR effective_until > NOW())` is snapshotted onto `orders.fee_rule_id` and `orders.commission_rate_bps_snapshot`.
- Seller-specific overrides (`sellers.commission_rate_bps`) take precedence when configured by Admin Finance.
- `commission_amount = ROUND((item_subtotal - item_discount) * (commission_rate_bps_snapshot / 10000.0), 2)`.
- **Pilot Shadow Mode:** When `fee_rules.is_pilot_shadow_mode = true`, `orders.is_shadow_commission = true` — the commission is computed and stored for financial analytics/auditing, while `seller_settlement_orders.order_commission_amount` deducts `0.00` during the free pilot period.

---

## 13. Seller Settlements (Payouts)
- Only `COMPLETED` orders whose payments are collected through platform-settled flows (and not yet present in `seller_settlement_orders`) are eligible for payout batching.
- **Zero Double-Payout Guarantee:** `seller_settlement_orders.order_id` has a database-level `UNIQUE` constraint.
- **Formula Integrity:**
  `net_payable = gross_amount - commission_amount - refund_deductions - platform_fee_deduction - other_deductions`
  Enforced via `CHECK` constraint and verified against `SUM(seller_settlement_orders.order_net_amount)`.
- Transitioning a settlement to `SETTLED` requires a unique `utr_number` (for `UPI` / `NEFT_IMPS`), sets `settled_at`, updates included orders' `payment_status = 'SETTLED'`, and writes an immutable `audit_logs` record.

---

## 14. Delivery (Seller In-House Runners & Platform Fleet)
- Every `DELIVERY` order creates an `order_deliveries` row with `fulfilment_type = 'SELLER_RUNNER'` (assigning `seller_staff_id`) or `'PLATFORM_PARTNER'` (assigning `delivery_partner_id`).
- `CHECK` constraint enforces mutual exclusivity:
  - `SELLER_RUNNER` → `seller_staff_id IS NOT NULL` (once assigned) and `delivery_partner_id IS NULL`.
  - `PLATFORM_PARTNER` → `delivery_partner_id IS NOT NULL` (once assigned) and `seller_staff_id IS NULL`.
- Runner name and phone are snapshotted (`runner_name_snapshot`, `runner_phone_snapshot`) on dispatch so historical orders keep delivery accountability even if staff leave.
- Failed delivery requires `failed_reason` and transitions `orders.status = 'DELIVERY_FAILED'`.

---

## 15. Customer Pickup
- Only allowed when `sellers.supports_pickup = true` and `platform_settings.default_pickup_enabled = true`.
- `orders.delivery_fee` MUST be `0.00` and `delivery_address_id` is `NULL`.
- `order_deliveries.fulfilment_type = 'CUSTOMER_PICKUP'`, with both `seller_staff_id` and `delivery_partner_id` set to `NULL`, and generates a short 4–6 digit `pickup_code` verified at the shop counter upon handover (`status = 'PICKED_UP_BY_CUSTOMER'`).

---

## 16. Offers & Coupons
- `offers_coupons.code` is stored uppercase and `UNIQUE`.
- Validity enforced on checkout: `is_active = true`, `NOW() BETWEEN valid_from AND valid_until`, `used_count < usage_limit`, `item_subtotal >= min_order_amount`, and matching `vertical_id` / `village_id` / `seller_id` (when non-null).
- `PERCENTAGE` discounts are capped at `max_discount_amount` (if set); `FLAT` discounts cannot exceed `item_subtotal`; `FREE_DELIVERY` zeroes `delivery_fee`.
- `coupon_redemptions` enforces `UNIQUE(order_id)` and checks `COUNT(*) WHERE coupon_id = C AND customer_id = U < per_customer_limit`.
- `funded_by` (`PLATFORM` vs `SELLER`) determines whether `coupon_discount` reduces seller gross payable during settlement reconciliation.

---

## 17. Reviews
- A customer can submit a review (`reviews`) **only** for an order where `orders.customer_id = auth_user_id` AND `orders.status = 'COMPLETED'`.
- `UNIQUE(order_id)` ensures 1 review per order; `CHECK(rating BETWEEN 1 AND 5)` validates star rating.
- On `PUBLISHED` review creation or Admin moderation (`FLAGGED` / `HIDDEN`), `sellers.rating_avg` and `sellers.review_count` are recalculated atomically using only `status = 'PUBLISHED'` reviews.

---

## 18. Seller-Managed Udhari (Ownership & Policy Gate)
- **Strict Seller Ownership:** Udhari is a direct trust relationship between a specific village shop (`seller_id`) and a specific customer (`customer_id`). GramBazaar does NOT underwrite, lend, or bear default liability.
- A seller MUST explicitly enable Udhari and acknowledge the credit risk policy (`sellers.udhari_enabled = true AND sellers.udhari_policy_acknowledged_at IS NOT NULL`) before creating `customer_credit_profiles` or accepting `UDHAR` checkout orders.
- Admin users can view Udhari exposure and mediate disputes (`AdminUdhariView`), but CANNOT create credit limits or post sales on a seller's behalf.

---

## 19. Customer-Specific Credit Limits & Udhari Ledger
- `customer_credit_profiles` enforces `UNIQUE(seller_id, customer_id)`. A customer can have ₹2,500 limit at Gupta Kirana and ₹1,500 limit at Sharma Dhaba completely independently.
- **Checkout Credit Gate (Atomic Row Lock):**
  1. Lock `customer_credit_profiles` (`SELECT ... FOR UPDATE`).
  2. Require `sellers.udhari_enabled = true` AND `profile.status = 'ACTIVE'`.
  3. Require `profile.outstanding_balance + order.total_amount <= profile.credit_limit`.
  4. Insert an append-only `credit_ledger_entries` row (`entry_type = 'CREDIT_SALE'`, `direction = 'INCREASES_OWED'`, `running_balance = profile.outstanding_balance + order.total_amount`, `due_date = NOW() + default_due_days`).
  5. Update `customer_credit_profiles.outstanding_balance = running_balance`.
- **Immutable Ledger:** `credit_ledger_entries` rows are NEVER updated for amount or deleted. Mistakes or order cancellations MUST post an offsetting `SALE_REVERSAL`, `REPAYMENT_REVERSAL`, or `ADJUSTMENT_*` row referencing `reversed_entry_id`.
- **Overdue Calculation:** A daily scheduled job marks `POSTED` `CREDIT_SALE` entries with `due_date < NOW()` (not covered by subsequent repayments) as `is_overdue = true` and refreshes `customer_credit_profiles.overdue_amount`.

---

## 20. Udhari Repayments & Disputes
- Only the owning seller (or authorized `SELLER_STAFF` / `CASHIER` of that `seller_id`) can record a repayment in `credit_repayments`.
- **Repayment Validation:**
  - `amount > 0`
  - `amount <= customer_credit_profiles.outstanding_balance` *(subject to Open Business Decision #3 regarding advance deposits)*.
- Recording a repayment atomically:
  1. Locks `customer_credit_profiles` (`FOR UPDATE`).
  2. Inserts `credit_repayments` with unique `repayment_reference` (e.g., `REC-2026-0045`).
  3. Inserts `credit_ledger_entries` (`entry_type = 'REPAYMENT'`, `direction = 'DECREASES_OWED'`, `repayment_id`, `running_balance = previous - amount`).
  4. Updates `customer_credit_profiles.outstanding_balance` and `last_payment_at = received_at`.
  5. Sends a repayment receipt notification to the customer (`notifications`).
- Customers may open a `credit_disputes` record linked to any `ledger_entry_id`; opening a dispute marks `credit_ledger_entries.status = 'DISPUTED'` until resolved with a mandatory `resolution_note`.

---

## 21. Food & Grocery Seller Safety, Quality & Assessment Rules
- Every Food or Grocery seller has a 1:1 `seller_safety_profiles` row initialized with `track = 'FOOD'` or `'GROCERY'`.
- Daily checklists enforce `UNIQUE(seller_id, submission_date)` (1 submission per calendar day IST).
- **Certification Badge Computation:**
  - `GOLD_CERTIFIED`: 100% mandatory modules completed, exam passed (`>= 80%`), latest checklist `>= 90%`, no active retraining/safety suspension.
  - `VERIFIED_SAFE`: 100% mandatory modules completed, exam passed (`>= 70%`), latest checklist `>= 75%`.
  - `ACTION_REQUIRED`: `retraining_required = true`, `suspended_for_safety = true`, or failed inspection (`WARNING_ISSUED` / `RETRAINING_REQUIRED`).
  - `IN_PROGRESS`: All other cases.
- If an Admin sets `suspended_for_safety = true` after a failed `safety_inspection_audits`, `sellers.status` is atomically set to `SUSPENDED` and logged in `audit_logs`.
