# GramBazaar Complete Database Design (PostgreSQL + Prisma)

## 1. Database Architecture Overview

GramBazaar is a **multi-village, multi-seller local commerce platform** supporting:
- **Grocery & Kirana Stores** (weight-based staples, local rural units like `pav`, packaged FMCG, rack/shelf & expiry tracking, low-stock reorder alerts).
- **Food Establishments** (**Restaurants, Hotels, Dhabas, and Bakeries strictly** — tiffin/subscription meal services are explicitly prohibited).
- **Future & Non-Food Rural Retail Verticals** (Hardware, Apparel, Electronics, Furniture, Agriculture) using a single universal catalog architecture without creating separate product tables per category.
- **Seller-Managed Udhari (Rural Credit)** with seller-owned per-customer credit limits, double-entry ledgers, repayments, and disputes.
- **Food & Grocery Seller Safety, Quality & Assessment System** (training modules, daily hygiene/storage checklists, certification exams, and admin inspection audits).

### Core Architectural Standards

| Standard | Implementation in PostgreSQL & Prisma |
|---|---|
| **Naming Convention** | `snake_case` table names (plural) and `snake_case` column names in PostgreSQL; Prisma models use `PascalCase` mapped via `@@map(...)` and `@map(...)`. |
| **Primary Keys** | `UUID` (`@id @default(uuid())` or PostgreSQL `gen_random_uuid()` / UUIDv7) to avoid sequential ID enumeration across public APIs. |
| **Financial Precision** | `NUMERIC(12, 2)` in **INR (₹)** (Prisma `Decimal @db.Decimal(12, 2)`). Supports up to ₹9,99,99,99,999.99 with exact arithmetic. |
| **Quantity / Weight Precision** | `NUMERIC(10, 3)` (Prisma `Decimal @db.Decimal(10, 3)`) to accurately store `0.250 kg`, `0.500 L`, `1.250 kg`, or whole counts `25.000`. |
| **Rates & Percentages** | Commission rates in basis points (`INTEGER`, e.g., `500` = `5.00%`); GST/discounts/scores in `NUMERIC(5, 2)`. |
| **Timestamps** | `TIMESTAMPTZ` (UTC) for all `created_at`, `updated_at`, and business timestamps. |
| **Soft Deletes** | `deleted_at TIMESTAMPTZ` on master/user/address/listing entities; **hard deletes prohibited** on financial, order, inventory movement, Udhari ledger, and audit tables. |
| **Deduplication Decisions** | 1. **Unified `sellers` table** replaces separate `seller_applications` and `sellers` tables (onboarding queue = sellers in `PENDING_APPROVAL` / `KYC_PENDING` / `KYC_UNDER_REVIEW`).<br>2. **Unified `products` + `seller_product_listings`** eliminates separate `food_products` / `grocery_products` tables while keeping Kirana inventory, local units, and pricing strictly seller-specific.<br>3. **Unified `users` table** serves Customers, Seller Owners, Staff/Runners, Delivery Partners, and Admins via RBAC (`user_roles`). |

---

## 2. Domain Summary (13 Domains — 74 Tables)

| # | Domain | Tables | Count |
|---|---|---|---:|
| 1 | Identity, Authentication & RBAC | `users`, `roles`, `user_roles`, `role_permissions`, `admin_village_scopes`, `auth_tokens` | 6 |
| 2 | Geography & Rural Addresses | `villages`, `village_landmarks`, `inter_village_routes`, `customer_addresses` | 4 |
| 3 | Verticals, Sellers, Onboarding, KYC & Staff | `verticals`, `sellers`, `seller_verticals`, `seller_serviceable_villages`, `seller_kyc_documents`, `seller_kyc_document_events`, `seller_staff_members` | 7 |
| 4 | Universal Product Catalog & 8 Centralized Masters | `categories`, `brands`, `brand_verticals`, `units`, `category_allowed_units`, `attributes`, `category_attributes`, `option_groups`, `option_group_items`, `packaging_masters`, `availability_stock_configs`, `products`, `product_attribute_values`, `product_variants`, `product_option_groups` | 15 |
| 5 | Seller Listings & Kirana Inventory | `seller_product_listings`, `inventory_stock_movements`, `seller_bulk_inventory_jobs` | 3 |
| 6 | Shopping Cart | `carts`, `cart_items` | 2 |
| 7 | Orders, Historical Snapshots, Cancellations & Returns | `orders`, `order_items`, `order_status_history`, `order_cancellations`, `order_returns`, `order_return_items` | 6 |
| 8 | Delivery Fleet & Pickup Fulfilment | `delivery_partners`, `order_deliveries` | 2 |
| 9 | Payments, Refunds, Taxes, Commission & Settlements | `fee_rules`, `tax_slabs`, `payment_transactions`, `refunds`, `seller_settlements`, `seller_settlement_orders` | 6 |
| 10 | Seller-Managed Udhari (Rural Credit) | `customer_credit_profiles`, `credit_repayments`, `credit_ledger_entries`, `credit_disputes` | 4 |
| 11 | Offers, Coupons, Reviews & Support Complaints | `offers_coupons`, `coupon_redemptions`, `reviews`, `support_cases` | 4 |
| 12 | Food & Grocery Seller Safety, Quality & Assessment | `safety_training_modules`, `seller_training_completions`, `safety_checklist_items`, `seller_checklist_submissions`, `safety_exam_questions`, `seller_exam_attempts`, `seller_safety_profiles`, `safety_inspection_audits` | 8 |
| 13 | Notifications, Broadcasts, CMS, Policies, Settings & Audit | `notifications`, `broadcast_campaigns`, `cms_banners`, `cms_policy_pages`, `cancellation_policy_rules`, `platform_settings`, `audit_logs` | 7 |
| | **Total** | | **74** |

---

## 3. PostgreSQL Enum Types (Status & Domain Vocabularies)

All status and categorical fields use strongly-typed PostgreSQL `ENUM`s (mapped directly to Prisma `enum`):

- `user_status`: `ACTIVE`, `BLOCKED`, `SUSPENDED`, `INACTIVE`
- `role_code`: `CUSTOMER`, `SELLER_OWNER`, `SELLER_STAFF`, `SELLER_RUNNER`, `DELIVERY_PARTNER`, `SUPER_ADMIN`, `ADMIN_OPS`, `ADMIN_FINANCE`, `ADMIN_SUPPORT`
- `auth_token_type`: `REFRESH_SESSION`, `PASSWORD_RESET`, `PHONE_OTP`, `EMAIL_VERIFY`
- `address_label`: `HOME`, `WORK`, `OTHER`
- `vertical_workflow_type`: `FOOD_KITCHEN`, `GROCERY_WEIGHT`, `PHYSICAL_RETAIL`, `MADE_TO_ORDER`
- `seller_business_type`: `RESTAURANT`, `HOTEL`, `DHABA`, `BAKERY`, `KIRANA`, `GENERAL_STORE`, `HARDWARE_STORE`, `ELECTRONICS_DEALER`, `CLOTHING_STORE`, `FURNITURE_SHOP`, `AGRI_KENDRA`, `MULTI_CATEGORY` *(No `TIFFIN_SERVICE`)*
- `seller_account_status`: `DRAFT`, `PENDING_APPROVAL`, `KYC_PENDING`, `KYC_UNDER_REVIEW`, `APPROVED`, `ACTIVE`, `INACTIVE`, `PAUSED`, `SUSPENDED`, `REJECTED`
- `kyc_status`: `PENDING`, `UNDER_REVIEW`, `APPROVED`, `REJECTED`, `CHANGES_REQUESTED`
- `kyc_doc_code`: `FSSAI`, `AADHAAR`, `PAN`, `STORE_PHOTO`, `GST_TRADE`, `AGRI_LICENSE`
- `seller_staff_role`: `MANAGER`, `CASHIER`, `SHOP_RUNNER`, `DELIVERY_STAFF`, `FAMILY_HELPER`
- `unit_family`: `WEIGHT`, `VOLUME`, `LENGTH`, `COUNT`, `PORTION`, `BULK_PACK`, `AREA`
- `attribute_data_type`: `TEXT`, `NUMBER`, `SELECT`, `MULTI_SELECT`, `BOOLEAN`, `DIMENSIONS`
- `selection_type`: `SINGLE`, `MULTIPLE`
- `diet_type`: `VEG`, `NON_VEG`, `EGG`
- `packaging_material_type`: `FOOD_CONTAINER`, `THERMAL_BOX`, `ECO_BAG`, `SEALED_POUCH`, `BOTTLE_JAR`, `CORRUGATED_CARTON`
- `availability_workflow_mode`: `TRACKED_INVENTORY`, `DAILY_PREP_SLOTS`, `MADE_TO_ORDER`, `UNLIMITED_SERVICE`
- `inventory_mode`: `QUANTITY_STOCK`, `WEIGHT_STOCK`, `VARIANT_STOCK`, `PREPARED_FOOD`, `MADE_TO_ORDER`
- `quantity_mode`: `FIXED_PACK`, `PREDEFINED_OPTIONS`, `CUSTOM_QUANTITY`
- `moderation_status`: `PENDING_REVIEW`, `APPROVED`, `REJECTED`, `CHANGES_REQUESTED`
- `stock_movement_type`: `INITIAL_STOCK`, `ORDER_RESERVED`, `ORDER_DEDUCTED`, `ORDER_CANCELLED_RESTORE`, `RETURN_RESTOCK`, `MANUAL_RESTOCK`, `BULK_UPDATE`, `DAMAGE_WRITE_OFF`, `EXPIRY_WRITE_OFF`, `AUDIT_ADJUSTMENT`
- `fulfilment_mode`: `DELIVERY`, `PICKUP`
- `order_status`: `PLACED`, `PENDING`, `ACCEPTED`, `PREPARING`, `READY_FOR_PICKUP`, `READY_FOR_DELIVERY`, `OUT_FOR_DELIVERY`, `COMPLETED`, `REJECTED`, `CANCELLED`, `DELIVERY_FAILED`, `RETURNED`, `REFUNDED`
- `payment_method`: `COD`, `SELLER_UPI`, `PLATFORM_UPI`, `UDHAR`
- `payment_status`: `PENDING`, `COLLECTED`, `SETTLED`, `REVERSED`, `REFUNDED`, `PARTIALLY_REFUNDED`, `FAILED`
- `payment_tx_status`: `INITIATED`, `CAPTURED`, `PENDING_COD`, `FAILED`, `REVERSED`, `REFUNDED`
- `cancelled_by_actor`: `CUSTOMER`, `SELLER`, `ADMIN`, `SYSTEM`
- `return_status`: `REQUESTED`, `APPROVED`, `PICKED_UP`, `RECEIVED`, `REJECTED`
- `refund_status`: `INITIATED`, `PROCESSING`, `PROCESSED`, `FAILED`, `REJECTED`
- `refund_channel`: `ORIGINAL_UPI`, `BANK_TRANSFER`, `UDHAR_REVERSAL`, `CASH_SETTLEMENT`, `STORE_CREDIT`
- `delivery_fulfilment_type`: `SELLER_RUNNER`, `PLATFORM_PARTNER`, `CUSTOMER_PICKUP`
- `delivery_status`: `UNASSIGNED`, `ASSIGNED`, `PICKED_UP`, `OUT_FOR_DELIVERY`, `DELIVERED`, `READY_FOR_PICKUP`, `PICKED_UP_BY_CUSTOMER`, `FAILED`
- `vehicle_type`: `CYCLE`, `BIKE`, `E_RICKSHAW`
- `delivery_partner_status`: `AVAILABLE`, `ON_DELIVERY`, `OFFLINE`, `SUSPENDED`
- `settlement_status`: `PENDING`, `PROCESSING`, `SETTLED`, `FAILED`
- `settlement_payment_mode`: `UPI`, `NEFT_IMPS`, `CASH_SETTLEMENT`
- `credit_profile_status`: `ACTIVE`, `DISABLED`, `BLOCKED`
- `credit_entry_type`: `CREDIT_SALE`, `REPAYMENT`, `SALE_REVERSAL`, `REPAYMENT_REVERSAL`, `ADJUSTMENT_INCREASE`, `ADJUSTMENT_DECREASE`
- `credit_entry_direction`: `INCREASES_OWED`, `DECREASES_OWED`
- `credit_entry_status`: `POSTED`, `REVERSED`, `DISPUTED`
- `repayment_method`: `CASH`, `SELLER_UPI_DIRECT`, `BANK_TRANSFER`, `OTHER`
- `credit_dispute_reason`: `WRONG_AMOUNT`, `PAYMENT_NOT_RECORDED`, `ORDER_CANCELLED`, `OTHER`
- `credit_dispute_status`: `OPEN`, `UNDER_REVIEW`, `RESOLVED`, `REJECTED`
- `discount_type`: `FLAT`, `PERCENTAGE`, `FREE_DELIVERY`
- `offer_funding_source`: `PLATFORM`, `SELLER`
- `review_status`: `PUBLISHED`, `FLAGGED`, `HIDDEN`
- `support_issue_type`: `FOOD_QUALITY`, `MISSING_ITEM`, `DELIVERY_DELAY`, `PAYMENT_ISSUE`, `DEFECTIVE_PRODUCT`, `WRONG_VARIANT`, `DAMAGED_IN_TRANSIT`, `WARRANTY_CLAIM`, `UDHARI_DISPUTE`, `OTHER`
- `support_case_status`: `OPEN`, `INVESTIGATING`, `REFUND_APPROVED`, `RESOLVED`, `CLOSED`
- `safety_track`: `FOOD`, `GROCERY`
- `certification_badge_level`: `GOLD_CERTIFIED`, `VERIFIED_SAFE`, `IN_PROGRESS`, `ACTION_REQUIRED`
- `inspection_outcome`: `PASSED`, `RETRAINING_REQUIRED`, `WARNING_ISSUED`
- `notification_channel`: `IN_APP`, `APP_PUSH`, `WHATSAPP`, `SMS`
- `broadcast_audience`: `ALL_CUSTOMERS`, `ALL_SELLERS`, `VILLAGE_CUSTOMERS`, `VILLAGE_SELLERS`
- `broadcast_priority`: `NORMAL`, `FESTIVE`, `URGENT_ALERT`
- `broadcast_status`: `DRAFT`, `SCHEDULED`, `SENT`, `FAILED`
- `banner_placement`: `HERO_CAROUSEL`, `MID_PROMO`, `FESTIVAL_STRIP`

---

## 4. Detailed Table-by-Table Architecture

### Domain 1: Identity, Authentication & RBAC

#### 1.1 `users`
**Purpose:** Single source of truth for all human actors (Customers, Seller Owners, Seller Staff, Runners, Delivery Partners, Admins).
- **Columns:** `id` (UUID PK), `full_name` (`VARCHAR(120)` NOT NULL), `phone` (`VARCHAR(15)` UNIQUE NOT NULL), `email` (`VARCHAR(255)` UNIQUE NULL), `password_hash` (`TEXT` NOT NULL), `avatar_url` (`TEXT` NULL), `active_village_id` (`UUID` FK → `villages.id` NULL), `status` (`user_status` DEFAULT `'ACTIVE'`), `block_reason` (`TEXT` NULL), `admin_notes` (`TEXT` NULL), `terms_accepted_at` (`TIMESTAMPTZ` NULL), `phone_verified_at` (`TIMESTAMPTZ` NULL), `last_login_at` (`TIMESTAMPTZ` NULL), `created_at`, `updated_at`, `deleted_at`.
- **Rules:** Phone is normalized to E.164 (`+91XXXXXXXXXX`); a single user can hold both `CUSTOMER` and `SELLER_OWNER` roles via `user_roles`.

#### 1.2 `roles`
**Purpose:** Canonical role registry for portal access control.
- **Columns:** `id` (UUID PK), `code` (`role_code` UNIQUE NOT NULL), `name` (`VARCHAR(80)` NOT NULL), `description` (`TEXT` NULL), `is_system` (`BOOLEAN` DEFAULT `TRUE`), `created_at`.

#### 1.3 `user_roles`
**Purpose:** Assigns one or more roles to a user.
- **Columns:** `id` (UUID PK), `user_id` (`UUID` FK → `users.id`), `role_id` (`UUID` FK → `roles.id`), `assigned_by_user_id` (`UUID` FK → `users.id` NULL), `created_at`.
- **Constraints:** `UNIQUE(user_id, role_id)`.

#### 1.4 `role_permissions`
**Purpose:** Powers `AdminRolesView` — granular module-level permission matrix across all 31 admin modules.
- **Columns:** `id` (UUID PK), `role_id` (`UUID` FK → `roles.id`), `module_key` (`VARCHAR(60)` NOT NULL), `can_view` (`BOOLEAN` DEFAULT `FALSE`), `can_manage` (`BOOLEAN` DEFAULT `FALSE`), `can_approve` (`BOOLEAN` DEFAULT `FALSE`), `can_export` (`BOOLEAN` DEFAULT `FALSE`), `updated_at`.
- **Constraints:** `UNIQUE(role_id, module_key)`.

#### 1.5 `admin_village_scopes`
**Purpose:** Restricts Regional Ops / Support Admins to specific villages (if empty for `SUPER_ADMIN`, grants access to all villages).
- **Columns:** `user_id` (`UUID` FK → `users.id`), `village_id` (`UUID` FK → `villages.id`), `assigned_at` (`TIMESTAMPTZ`).
- **Constraints:** Composite PK `(user_id, village_id)`.

#### 1.6 `auth_tokens`
**Purpose:** Stores hashed refresh sessions, password reset tokens (`ForgotPasswordScreen` / `ResetPasswordScreen`), and OTP verification codes.
- **Columns:** `id` (UUID PK), `user_id` (`UUID` FK → `users.id`), `token_type` (`auth_token_type` NOT NULL), `token_hash` (`VARCHAR(128)` UNIQUE NOT NULL), `expires_at` (`TIMESTAMPTZ` NOT NULL), `consumed_at` (`TIMESTAMPTZ` NULL), `ip_address` (`INET` NULL), `user_agent` (`TEXT` NULL), `created_at`.

---

### Domain 2: Geography & Rural Addresses

#### 2.1 `villages`
**Purpose:** Multi-village serviceability catalog powering location selection, delivery fees, and store discovery.
- **Columns:** `id` (UUID PK), `code` (`VARCHAR(40)` UNIQUE NOT NULL), `name` (`VARCHAR(120)` NOT NULL), `hindi_name` (`VARCHAR(120)` NULL), `district` (`VARCHAR(100)` NOT NULL), `state` (`VARCHAR(100)` NOT NULL), `postal_codes` (`TEXT[]` NOT NULL), `base_delivery_fee` (`NUMERIC(12,2)` DEFAULT `0.00`), `min_order_free_delivery` (`NUMERIC(12,2)` DEFAULT `0.00`), `latitude` (`NUMERIC(9,6)` NULL), `longitude` (`NUMERIC(9,6)` NULL), `is_active` (`BOOLEAN` DEFAULT `TRUE`), `created_at`, `updated_at`.
- **Constraints:** `UNIQUE(name, district, state)`.

#### 2.2 `village_landmarks`
**Purpose:** Rural landmarks required for accurate village doorstep delivery (e.g., *Near Kali Mandir Chowk*, *Opposite Panchayat Bhavan*).
- **Columns:** `id` (UUID PK), `village_id` (`UUID` FK → `villages.id`), `name` (`VARCHAR(150)` NOT NULL), `hindi_name` (`VARCHAR(150)` NULL), `is_popular` (`BOOLEAN` DEFAULT `TRUE`), `is_active` (`BOOLEAN` DEFAULT `TRUE`), `created_at`.
- **Constraints:** `UNIQUE(village_id, name)`.

#### 2.3 `inter_village_routes`
**Purpose:** Defines neighbor-village delivery feasibility, distance, and inter-village surcharge (`AdminServiceAreasView`).
- **Columns:** `id` (UUID PK), `from_village_id` (`UUID` FK → `villages.id`), `to_village_id` (`UUID` FK → `villages.id`), `distance_km` (`NUMERIC(6,2)` NOT NULL), `surcharge_amount` (`NUMERIC(12,2)` DEFAULT `0.00`), `is_active` (`BOOLEAN` DEFAULT `TRUE`), `created_at`, `updated_at`.
- **Constraints:** `UNIQUE(from_village_id, to_village_id)`, `CHECK(from_village_id <> to_village_id)`, `CHECK(distance_km >= 0)`.

#### 2.4 `customer_addresses`
**Purpose:** Saved rural delivery addresses with mandatory `landmark`.
- **Columns:** `id` (UUID PK), `user_id` (`UUID` FK → `users.id`), `village_id` (`UUID` FK → `villages.id`), `recipient_name` (`VARCHAR(120)` NOT NULL), `recipient_phone` (`VARCHAR(15)` NOT NULL), `address_line1` (`VARCHAR(255)` NOT NULL), `landmark` (`VARCHAR(200)` NOT NULL), `address_label` (`address_label` DEFAULT `'HOME'`), `latitude` (`NUMERIC(9,6)` NULL), `longitude` (`NUMERIC(9,6)` NULL), `is_default` (`BOOLEAN` DEFAULT `FALSE`), `created_at`, `updated_at`, `deleted_at`.
- **Constraints:** Partial unique index ensuring at most one `is_default = TRUE` active address per `user_id`.

---

### Domain 3: Verticals, Sellers, Onboarding, KYC & Staff

#### 3.1 `verticals`
**Purpose:** Dynamic marketplace verticals (`FOOD`, `GROCERY`, `HARDWARE`, `APPAREL`, `ELECTRONICS`, `FURNITURE`, `AGRICULTURE`).
- **Columns:** `id` (UUID PK), `code` (`VARCHAR(40)` UNIQUE NOT NULL), `name` (`VARCHAR(100)` NOT NULL), `hindi_name` (`VARCHAR(100)` NULL), `icon` (`VARCHAR(60)` NULL), `description` (`TEXT` NULL), `fulfillment_workflow` (`vertical_workflow_type` NOT NULL), `required_kyc_docs` (`kyc_doc_code[]` NOT NULL), `special_rules` (`TEXT[]` DEFAULT `'{}'`), `is_enabled` (`BOOLEAN` DEFAULT `TRUE`), `sort_order` (`INTEGER` DEFAULT `0`), `created_at`, `updated_at`.

#### 3.2 `sellers`
**Purpose:** Unified seller shop & onboarding record (covers both Seller Applications Queue and Active Seller Directory without duplicating fields).
- **Columns:** `id` (UUID PK), `owner_user_id` (`UUID` FK → `users.id` NOT NULL), `public_name` (`VARCHAR(160)` NOT NULL), `business_type` (`seller_business_type` NOT NULL), `primary_vertical_id` (`UUID` FK → `verticals.id` NOT NULL), `description` (`TEXT` NULL), `contact_phone` (`VARCHAR(15)` NOT NULL), `email` (`VARCHAR(255)` NULL), `village_id` (`UUID` FK → `villages.id` NOT NULL), `shop_address` (`VARCHAR(255)` NOT NULL), `pin_code` (`VARCHAR(10)` NULL), `status` (`seller_account_status` DEFAULT `'PENDING_APPROVAL'`), `kyc_status` (`kyc_status` DEFAULT `'PENDING'`), `is_open_now` (`BOOLEAN` DEFAULT `FALSE`), `is_paused` (`BOOLEAN` DEFAULT `FALSE`), `supports_delivery` (`BOOLEAN` DEFAULT `TRUE`), `supports_pickup` (`BOOLEAN` DEFAULT `TRUE`), `delivery_radius_km` (`NUMERIC(5,2)` DEFAULT `5.00`), `minimum_order_amount` (`NUMERIC(12,2)` DEFAULT `0.00`), `packaging_fee` (`NUMERIC(12,2)` DEFAULT `0.00`), `delivery_fee` (`NUMERIC(12,2)` DEFAULT `0.00`), `opening_time` (`TIME` NULL), `closing_time` (`TIME` NULL), `closed_days` (`TEXT[]` DEFAULT `'{}'`), `fssai_number` (`VARCHAR(20)` NULL), `fssai_verified` (`BOOLEAN` DEFAULT `FALSE`), `gst_or_trade_number` (`VARCHAR(30)` NULL), `agri_license_number` (`VARCHAR(40)` NULL), `upi_id` (`VARCHAR(120)` NULL), `bank_account_holder` (`VARCHAR(120)` NULL), `bank_account_encrypted` (`TEXT` NULL), `bank_account_last4` (`VARCHAR(4)` NULL), `ifsc_code` (`VARCHAR(11)` NULL), `commission_rate_bps` (`INTEGER` DEFAULT `500`), `udhari_enabled` (`BOOLEAN` DEFAULT `FALSE`), `udhari_policy_acknowledged_at` (`TIMESTAMPTZ` NULL), `banner_url` (`TEXT` NULL), `logo_initials` (`VARCHAR(4)` NULL), `rating_avg` (`NUMERIC(3,2)` DEFAULT `0.00`), `review_count` (`INTEGER` DEFAULT `0`), `suspension_reason` (`TEXT` NULL), `rejection_reason` (`TEXT` NULL), `kyc_change_request_notes` (`TEXT` NULL), `reviewed_by_user_id` (`UUID` FK → `users.id` NULL), `reviewed_at` (`TIMESTAMPTZ` NULL), `joined_at` (`TIMESTAMPTZ` NULL), `created_at`, `updated_at`, `deleted_at`.
- **Business Rule:** `FOOD` vertical sellers MUST have `business_type IN ('RESTAURANT', 'HOTEL', 'DHABA', 'BAKERY')` and valid `FSSAI` KYC before activation. Tiffin services are prohibited.

#### 3.3 `seller_verticals`
**Purpose:** Allows multi-category shops (e.g., Kirana + Agriculture) when `allow_multi_vertical_sellers` setting is enabled.
- **Columns:** `seller_id` (`UUID` FK → `sellers.id`), `vertical_id` (`UUID` FK → `verticals.id`), `is_primary` (`BOOLEAN` DEFAULT `FALSE`), `created_at`.
- **Constraints:** Composite PK `(seller_id, vertical_id)`.

#### 3.4 `seller_serviceable_villages`
**Purpose:** Maps which villages each seller delivers to (with optional seller-specific village fee override).
- **Columns:** `seller_id` (`UUID` FK → `sellers.id`), `village_id` (`UUID` FK → `villages.id`), `custom_delivery_fee` (`NUMERIC(12,2)` NULL), `is_active` (`BOOLEAN` DEFAULT `TRUE`), `created_at`.
- **Constraints:** Composite PK `(seller_id, village_id)`.

#### 3.5 `seller_kyc_documents`
**Purpose:** Tracks every uploaded KYC document (`FSSAI`, `AADHAAR`, `PAN`, `STORE_PHOTO`, `GST_TRADE`, `AGRI_LICENSE`) and its verification status.
- **Columns:** `id` (UUID PK), `seller_id` (`UUID` FK → `sellers.id`), `doc_code` (`kyc_doc_code` NOT NULL), `label` (`VARCHAR(100)` NOT NULL), `document_number_encrypted` (`TEXT` NULL), `document_number_masked` (`VARCHAR(40)` NULL), `file_url` (`TEXT` NOT NULL), `file_name` (`VARCHAR(200)` NOT NULL), `status` (`kyc_status` DEFAULT `'PENDING'`), `rejection_reason` (`TEXT` NULL), `reviewed_by_user_id` (`UUID` FK → `users.id` NULL), `reviewed_at` (`TIMESTAMPTZ` NULL), `uploaded_at`, `updated_at`.
- **Constraints:** `UNIQUE(seller_id, doc_code)` for active document version (or latest submission replacement with full history in `seller_kyc_document_events`).

#### 3.6 `seller_kyc_document_events`
**Purpose:** Immutable verification history per KYC document (`SellerDocumentVerificationEvent`).
- **Columns:** `id` (UUID PK), `kyc_document_id` (`UUID` FK → `seller_kyc_documents.id`), `status` (`kyc_status` NOT NULL), `actor_user_id` (`UUID` FK → `users.id` NOT NULL), `note` (`TEXT` NOT NULL), `created_at`.

#### 3.7 `seller_staff_members`
**Purpose:** In-house shop runners, delivery boys, family helpers, and cashiers (`SellerDispatchView` / `InHouseRunner`).
- **Columns:** `id` (UUID PK), `seller_id` (`UUID` FK → `sellers.id`), `user_id` (`UUID` FK → `users.id` NULL), `full_name` (`VARCHAR(120)` NOT NULL), `phone` (`VARCHAR(15)` NOT NULL), `staff_role` (`seller_staff_role` NOT NULL), `is_available` (`BOOLEAN` DEFAULT `TRUE`), `is_active` (`BOOLEAN` DEFAULT `TRUE`), `created_at`, `updated_at`.

---

### Domain 4: Universal Product Catalog & 8 Centralized Masters

> **Key Flexibility Design:** All product types (Grocery, Food, Hardware, Apparel, Electronics, Furniture, Agriculture) live in one normalized `products` + `product_variants` + `product_attribute_values` structure, while seller-specific prices, local rural units, stock, rack locations, and expiry dates live in `seller_product_listings`.

#### 4.1 `categories` (Master 1: Category & Subcategory)
- **Columns:** `id` (UUID PK), `vertical_id` (`UUID` FK → `verticals.id`), `parent_id` (`UUID` self-FK → `categories.id` NULL), `name` (`VARCHAR(120)` NOT NULL), `hindi_name` (`VARCHAR(120)` NULL), `slug` (`VARCHAR(140)` UNIQUE NOT NULL), `icon` (`VARCHAR(60)` NULL), `sort_order` (`INTEGER` DEFAULT `0`), `is_active` (`BOOLEAN` DEFAULT `TRUE`), `created_at`, `updated_at`.

#### 4.2 `brands` & 4.3 `brand_verticals` (Master 2: Brand Master)
- `brands`: `id` (UUID PK), `code` (`VARCHAR(40)` UNIQUE NULL), `name` (`VARCHAR(120)` UNIQUE NOT NULL), `manufacturer` (`VARCHAR(160)` NULL), `description` (`TEXT` NULL), `is_verified` (`BOOLEAN` DEFAULT `FALSE`), `is_active` (`BOOLEAN` DEFAULT `TRUE`), `created_at`, `updated_at`.
- `brand_verticals`: Composite PK `(brand_id, vertical_id)`.

#### 4.4 `units` & 4.5 `category_allowed_units` (Master 3: Unit & Measurement Master)
- `units`: `id` (UUID PK), `name` (`VARCHAR(80)` NOT NULL), `hindi_name` (`VARCHAR(80)` NULL), `symbol` (`VARCHAR(20)` UNIQUE NOT NULL), `family` (`unit_family` NOT NULL), `base_unit` (`VARCHAR(20)` NULL), `conversion_factor` (`NUMERIC(12,4)` NULL — e.g. `1 pav = 250 g`), `allow_decimal` (`BOOLEAN` DEFAULT `FALSE`), `allow_seller_local_override` (`BOOLEAN` DEFAULT `FALSE`), `is_active` (`BOOLEAN` DEFAULT `TRUE`), `created_at`.
- `category_allowed_units`: Composite PK `(category_id, unit_id)`.

#### 4.6 `attributes` & 4.7 `category_attributes` (Master 4: Product Attributes)
- `attributes`: `id` (UUID PK), `name` (`VARCHAR(100)` NOT NULL), `hindi_name` (`VARCHAR(100)` NULL), `slug` (`VARCHAR(120)` UNIQUE NOT NULL), `data_type` (`attribute_data_type` NOT NULL), `allowed_options` (`JSONB` NULL), `unit_suffix` (`VARCHAR(20)` NULL), `is_required` (`BOOLEAN` DEFAULT `FALSE`), `is_filterable` (`BOOLEAN` DEFAULT `TRUE`), `is_variant_axis` (`BOOLEAN` DEFAULT `FALSE`), `is_active` (`BOOLEAN` DEFAULT `TRUE`), `created_at`, `updated_at`.
- `category_attributes`: Composite PK `(category_id, attribute_id)` with `is_required_override` (`BOOLEAN` NULL).

#### 4.8 `option_groups` & 4.9 `option_group_items` (Master 5: Add-ons & Customizations)
- `option_groups`: `id` (UUID PK), `name` (`VARCHAR(120)` NOT NULL), `hindi_name` (`VARCHAR(120)` NULL), `vertical_id` (`UUID` FK → `verticals.id` NULL), `category_id` (`UUID` FK → `categories.id` NULL), `selection_type` (`selection_type` NOT NULL), `is_required` (`BOOLEAN` DEFAULT `FALSE`), `min_select` (`INTEGER` DEFAULT `0`), `max_select` (`INTEGER` DEFAULT `1`), `is_active` (`BOOLEAN` DEFAULT `TRUE`), `created_at`, `updated_at`.
- `option_group_items`: `id` (UUID PK), `option_group_id` (`UUID` FK → `option_groups.id`), `label` (`VARCHAR(120)` NOT NULL), `price_delta` (`NUMERIC(12,2)` DEFAULT `0.00`), `diet_type` (`diet_type` NULL), `is_default` (`BOOLEAN` DEFAULT `FALSE`), `is_available` (`BOOLEAN` DEFAULT `TRUE`), `sort_order` (`INTEGER` DEFAULT `0`).

#### 4.10 `packaging_masters` (Master 6: Packaging Master)
- **Columns:** `id` (UUID PK), `code` (`VARCHAR(40)` UNIQUE NOT NULL), `name` (`VARCHAR(120)` NOT NULL), `hindi_name` (`VARCHAR(120)` NULL), `material_type` (`packaging_material_type` NOT NULL), `capacity_label` (`VARCHAR(60)` NOT NULL), `unit_id` (`UUID` FK → `units.id` NULL), `fee_amount` (`NUMERIC(12,2)` DEFAULT `0.00`), `is_food_grade` (`BOOLEAN` DEFAULT `FALSE`), `is_eco_friendly` (`BOOLEAN` DEFAULT `FALSE`), `is_leak_proof` (`BOOLEAN` DEFAULT `FALSE`), `is_active` (`BOOLEAN` DEFAULT `TRUE`), `created_at`.

#### 4.11 `availability_stock_configs` (Master 7: Availability & Stock Rules)
- **Columns:** `id` (UUID PK), `code` (`VARCHAR(40)` UNIQUE NOT NULL), `name` (`VARCHAR(120)` NOT NULL), `vertical_id` (`UUID` FK → `verticals.id`), `category_id` (`UUID` FK → `categories.id` NULL), `workflow_mode` (`availability_workflow_mode` NOT NULL), `service_slots` (`TEXT[]` DEFAULT `'{}'`), `prep_time_minutes` (`INTEGER` NULL), `daily_batch_limit` (`INTEGER` NULL), `default_low_stock_threshold` (`NUMERIC(10,3)` DEFAULT `5.000`), `max_qty_per_order` (`NUMERIC(10,3)` DEFAULT `20.000`), `auto_disable_on_zero_stock` (`BOOLEAN` DEFAULT `TRUE`), `allow_pre_order` (`BOOLEAN` DEFAULT `FALSE`), `restock_lead_hours` (`INTEGER` NULL), `is_active` (`BOOLEAN` DEFAULT `TRUE`), `created_at`, `updated_at`.

#### 4.12 `products` (Universal Product Master — Master 8 + Catalog Core)
- **Columns:** `id` (UUID PK), `sku_code` (`VARCHAR(64)` UNIQUE NOT NULL), `vertical_id` (`UUID` FK → `verticals.id` NOT NULL), `category_id` (`UUID` FK → `categories.id` NOT NULL), `subcategory_id` (`UUID` FK → `categories.id` NULL), `brand_id` (`UUID` FK → `brands.id` NULL), `default_unit_id` (`UUID` FK → `units.id` NOT NULL), `default_packaging_id` (`UUID` FK → `packaging_masters.id` NULL), `availability_config_id` (`UUID` FK → `availability_stock_configs.id` NULL), `tax_slab_id` (`UUID` FK → `tax_slabs.id` NULL), `name` (`VARCHAR(200)` NOT NULL), `hindi_name` (`VARCHAR(200)` NULL), `description` (`TEXT` NULL), `diet_type` (`diet_type` NULL — used for `FOOD` items), `image_url` (`TEXT` NULL), `is_universal_template` (`BOOLEAN` DEFAULT `FALSE`), `created_by_seller_id` (`UUID` FK → `sellers.id` NULL), `moderation_status` (`moderation_status` DEFAULT `'PENDING_REVIEW'`), `moderation_notes` (`TEXT` NULL), `moderated_by_user_id` (`UUID` FK → `users.id` NULL), `moderated_at` (`TIMESTAMPTZ` NULL), `is_active` (`BOOLEAN` DEFAULT `TRUE`), `created_at`, `updated_at`, `deleted_at`.

#### 4.13 `product_attribute_values`
- **Purpose:** Typed EAV storage for flexible category-specific attributes (e.g., Grain Type, Voltage, Size, Fabric, Warranty Months) without altering table schema.
- **Columns:** `id` (UUID PK), `product_id` (`UUID` FK → `products.id`), `attribute_id` (`UUID` FK → `attributes.id`), `value_text` (`TEXT` NULL), `value_number` (`NUMERIC(12,4)` NULL), `value_boolean` (`BOOLEAN` NULL), `value_json` (`JSONB` NULL).
- **Constraints:** `UNIQUE(product_id, attribute_id)`.

#### 4.14 `product_variants` (Variant & Size Templates / SKUs)
- **Purpose:** Size/pack/portion variants of a universal product (e.g., `1 kg Pack`, `5 kg Bag`, `Half Plate`, `Full Plate`, `Size L / White`).
- **Columns:** `id` (UUID PK), `product_id` (`UUID` FK → `products.id`), `sku` (`VARCHAR(64)` UNIQUE NOT NULL), `label` (`VARCHAR(120)` NOT NULL), `unit_id` (`UUID` FK → `units.id` NOT NULL), `unit_quantity` (`NUMERIC(10,3)` NOT NULL), `variant_attributes` (`JSONB` DEFAULT `'{}'`), `default_mrp` (`NUMERIC(12,2)` NOT NULL), `is_active` (`BOOLEAN` DEFAULT `TRUE`), `created_at`, `updated_at`.

#### 4.15 `product_option_groups`
- **Purpose:** Links universal products to applicable add-on/customization groups (e.g., Extra Butter, Spice Level, Masala Pack).
- **Columns:** `product_id` (`UUID` FK → `products.id`), `option_group_id` (`UUID` FK → `option_groups.id`), `sort_order` (`INTEGER` DEFAULT `0`).
- **Constraints:** Composite PK `(product_id, option_group_id)`.

---

### Domain 5: Seller Listings & Kirana Store Inventory

#### 5.1 `seller_product_listings`
**Purpose:** Seller-specific offer, pricing, rural unit overrides, availability, and **Kirana Store Inventory** (stock level, low-stock alert threshold, rack/shelf location, expiry date, supplier).
- **Columns:** `id` (UUID PK), `seller_id` (`UUID` FK → `sellers.id` NOT NULL), `product_id` (`UUID` FK → `products.id` NOT NULL), `variant_id` (`UUID` FK → `product_variants.id` NULL), `seller_sku` (`VARCHAR(64)` NULL), `mrp_price` (`NUMERIC(12,2)` NOT NULL), `selling_price` (`NUMERIC(12,2)` NOT NULL), `inventory_mode` (`inventory_mode` NOT NULL), `quantity_mode` (`quantity_mode` DEFAULT `'FIXED_PACK'`), `predefined_quantity_options` (`JSONB` NULL), `min_quantity` (`NUMERIC(10,3)` DEFAULT `1.000`), `quantity_step` (`NUMERIC(10,3)` DEFAULT `1.000`), `quantity_precision` (`SMALLINT` DEFAULT `0`), `variable_weight` (`BOOLEAN` DEFAULT `FALSE`), `local_unit_label` (`VARCHAR(40)` NULL), `local_unit_conversion_grams` (`NUMERIC(10,2)` NULL), `local_unit_note` (`VARCHAR(200)` NULL), `prep_time_minutes` (`INTEGER` NULL), `lead_time_days` (`INTEGER` NULL), `track_stock` (`BOOLEAN` DEFAULT `TRUE`), `stock_quantity` (`NUMERIC(10,3)` DEFAULT `0.000`), `reserved_quantity` (`NUMERIC(10,3)` DEFAULT `0.000`), `low_stock_threshold` (`NUMERIC(10,3)` DEFAULT `5.000`), `shelf_location` (`VARCHAR(80)` NULL — e.g. `Rack A1 - Staples`), `batch_number` (`VARCHAR(60)` NULL), `expiry_date` (`DATE` NULL), `supplier_name` (`VARCHAR(140)` NULL), `is_available` (`BOOLEAN` DEFAULT `TRUE`), `is_active` (`BOOLEAN` DEFAULT `TRUE`), `moderation_status` (`moderation_status` DEFAULT `'APPROVED'`), `created_at`, `updated_at`, `deleted_at`.
- **Constraints:** `CHECK(selling_price >= 0)`, `CHECK(mrp_price >= selling_price)`, `CHECK(stock_quantity >= 0)`, `CHECK(reserved_quantity >= 0)`, `CHECK(low_stock_threshold >= 0)`. Partial unique index on `(seller_id, product_id, COALESCE(variant_id, '00000000-0000-0000-0000-000000000000')) WHERE deleted_at IS NULL`.

#### 5.2 `inventory_stock_movements`
**Purpose:** Append-only stock adjustment ledger for every restock, order deduction, cancellation restore, bulk update, expiry write-off, or manual edit.
- **Columns:** `id` (UUID PK), `seller_listing_id` (`UUID` FK → `seller_product_listings.id`), `seller_id` (`UUID` FK → `sellers.id`), `movement_type` (`stock_movement_type` NOT NULL), `quantity_delta` (`NUMERIC(10,3)` NOT NULL), `quantity_before` (`NUMERIC(10,3)` NOT NULL), `quantity_after` (`NUMERIC(10,3)` NOT NULL), `reference_type` (`VARCHAR(40)` NULL — e.g. `ORDER`, `RETURN`, `BULK_JOB`, `MANUAL`), `reference_id` (`UUID` NULL), `reason` (`TEXT` NULL), `performed_by_user_id` (`UUID` FK → `users.id` NOT NULL), `created_at`.

#### 5.3 `seller_bulk_inventory_jobs`
**Purpose:** Audit log for bulk inventory updates (`BulkInventoryUpdateModal` — simultaneous price, stock, and availability edits).
- **Columns:** `id` (UUID PK), `seller_id` (`UUID` FK → `sellers.id`), `initiated_by_user_id` (`UUID` FK → `users.id`), `affected_listings_count` (`INTEGER` NOT NULL), `payload_summary` (`JSONB` NOT NULL), `created_at`.

---

### Domain 6: Shopping Cart

#### 6.1 `carts`
**Purpose:** Active customer cart strictly bound to **one seller** at a time (enforcing GramBazaar's single-seller cart guard).
- **Columns:** `id` (UUID PK), `customer_id` (`UUID` FK → `users.id` UNIQUE NOT NULL), `seller_id` (`UUID` FK → `sellers.id` NULL), `village_id` (`UUID` FK → `villages.id` NULL), `fulfilment_mode` (`fulfilment_mode` DEFAULT `'DELIVERY'`), `coupon_id` (`UUID` FK → `offers_coupons.id` NULL), `created_at`, `updated_at`.

#### 6.2 `cart_items`
**Purpose:** Line items in a customer's cart referencing live `seller_product_listings`.
- **Columns:** `id` (UUID PK), `cart_id` (`UUID` FK → `carts.id` ON DELETE CASCADE), `seller_listing_id` (`UUID` FK → `seller_product_listings.id`), `quantity` (`NUMERIC(10,3)` NOT NULL), `selected_options` (`JSONB` DEFAULT `'[]'`), `customer_note` (`VARCHAR(255)` NULL), `created_at`, `updated_at`.
- **Constraints:** `CHECK(quantity > 0)`.

---

### Domain 7: Orders, Historical Snapshots, Cancellations & Returns

#### 7.1 `orders`
**Purpose:** Core transactional order header with frozen financial breakdown, delivery address snapshot, and commission calculation.
- **Columns:** `id` (UUID PK), `order_number` (`VARCHAR(30)` UNIQUE NOT NULL — e.g. `GB-2026-0042`), `customer_id` (`UUID` FK → `users.id`), `seller_id` (`UUID` FK → `sellers.id`), `village_id` (`UUID` FK → `villages.id`), `fulfilment_mode` (`fulfilment_mode` NOT NULL), `delivery_address_id` (`UUID` FK → `customer_addresses.id` NULL), `delivery_address_snapshot` (`JSONB` NULL), `delivery_note` (`TEXT` NULL), `status` (`order_status` DEFAULT `'PLACED'`), `payment_method` (`payment_method` NOT NULL), `payment_status` (`payment_status` DEFAULT `'PENDING'`), `coupon_id` (`UUID` FK → `offers_coupons.id` NULL), `coupon_code_snapshot` (`VARCHAR(40)` NULL), `item_subtotal` (`NUMERIC(12,2)` NOT NULL), `item_discount` (`NUMERIC(12,2)` DEFAULT `0.00`), `coupon_discount` (`NUMERIC(12,2)` DEFAULT `0.00`), `delivery_fee` (`NUMERIC(12,2)` DEFAULT `0.00`), `packaging_fee` (`NUMERIC(12,2)` DEFAULT `0.00`), `tax_amount` (`NUMERIC(12,2)` DEFAULT `0.00`), `tax_label_snapshot` (`VARCHAR(80)` NULL), `platform_fee` (`NUMERIC(12,2)` DEFAULT `0.00`), `total_amount` (`NUMERIC(12,2)` NOT NULL), `fee_rule_id` (`UUID` FK → `fee_rules.id` NULL), `commission_rate_bps_snapshot` (`INTEGER` DEFAULT `0`), `commission_amount` (`NUMERIC(12,2)` DEFAULT `0.00`), `is_shadow_commission` (`BOOLEAN` DEFAULT `FALSE`), `estimated_delivery_minutes` (`INTEGER` NULL), `accept_deadline_at` (`TIMESTAMPTZ` NULL), `accepted_at` (`TIMESTAMPTZ` NULL), `completed_at` (`TIMESTAMPTZ` NULL), `created_at`, `updated_at`.

#### 7.2 `order_items`
**Purpose:** **Historical immutable snapshot** of every item purchased so future catalog price/name/variant changes never alter historical invoices or order history.
- **Columns:** `id` (UUID PK), `order_id` (`UUID` FK → `orders.id`), `seller_listing_id` (`UUID` FK → `seller_product_listings.id` NULL), `product_id` (`UUID` FK → `products.id` NULL), `variant_id` (`UUID` FK → `product_variants.id` NULL), `product_name_snapshot` (`VARCHAR(200)` NOT NULL), `vertical_code_snapshot` (`VARCHAR(40)` NOT NULL), `sku_snapshot` (`VARCHAR(64)` NULL), `variant_label_snapshot` (`VARCHAR(120)` NULL), `variant_attributes_snapshot` (`JSONB` DEFAULT `'{}'`), `selected_options_snapshot` (`JSONB` DEFAULT `'[]'`), `mrp_unit_price` (`NUMERIC(12,2)` NULL), `unit_price` (`NUMERIC(12,2)` NOT NULL), `item_discount` (`NUMERIC(12,2)` DEFAULT `0.00`), `requested_quantity` (`NUMERIC(10,3)` NOT NULL), `requested_unit_label` (`VARCHAR(60)` NOT NULL), `line_total` (`NUMERIC(12,2)` NOT NULL), `returned_quantity` (`NUMERIC(10,3)` DEFAULT `0.000`), `customer_note` (`VARCHAR(255)` NULL), `created_at`.

#### 7.3 `order_status_history`
**Purpose:** Immutable audit timeline powering `OrderTrackingView` and dispute investigations.
- **Columns:** `id` (UUID PK), `order_id` (`UUID` FK → `orders.id`), `from_status` (`order_status` NULL), `to_status` (`order_status` NOT NULL), `actor_user_id` (`UUID` FK → `users.id` NULL), `actor_role` (`VARCHAR(40)` NOT NULL), `reason` (`TEXT` NULL), `created_at`.

#### 7.4 `order_cancellations`
**Purpose:** Captures actor, cancellation policy applied, penalty, and refund eligibility.
- **Columns:** `id` (UUID PK), `order_id` (`UUID` UNIQUE FK → `orders.id`), `cancelled_by_actor` (`cancelled_by_actor` NOT NULL), `cancelled_by_user_id` (`UUID` FK → `users.id` NULL), `policy_rule_id` (`UUID` FK → `cancellation_policy_rules.id` NULL), `reason` (`TEXT` NOT NULL), `penalty_amount` (`NUMERIC(12,2)` DEFAULT `0.00`), `refund_eligible` (`BOOLEAN` DEFAULT `FALSE`), `notes` (`TEXT` NULL), `cancelled_at`.

#### 7.5 `order_returns` & 7.6 `order_return_items`
- `order_returns`: `id` (UUID PK), `return_number` (`VARCHAR(30)` UNIQUE NOT NULL), `order_id` (`UUID` FK → `orders.id`), `requested_by_user_id` (`UUID` FK → `users.id`), `status` (`return_status` DEFAULT `'REQUESTED'`), `reason` (`TEXT` NOT NULL), `notes` (`TEXT` NULL), `requested_at`, `updated_at`.
- `order_return_items`: `id` (UUID PK), `order_return_id` (`UUID` FK → `order_returns.id`), `order_item_id` (`UUID` FK → `order_items.id`), `quantity` (`NUMERIC(10,3)` NOT NULL), `refund_amount` (`NUMERIC(12,2)` NOT NULL), `condition_note` (`TEXT` NULL).

---

### Domain 8: Delivery Fleet & Pickup Fulfilment

#### 8.1 `delivery_partners`
**Purpose:** Platform-managed village riders (`AdminDeliveryFleetView` — Cycle, Bike, E-Rickshaw).
- **Columns:** `id` (UUID PK), `user_id` (`UUID` UNIQUE FK → `users.id`), `village_id` (`UUID` FK → `villages.id`), `vehicle_type` (`vehicle_type` NOT NULL), `vehicle_number` (`VARCHAR(30)` NULL), `kyc_verified` (`BOOLEAN` DEFAULT `FALSE`), `status` (`delivery_partner_status` DEFAULT `'OFFLINE'`), `completed_deliveries` (`INTEGER` DEFAULT `0`), `rating_avg` (`NUMERIC(3,2)` DEFAULT `0.00`), `joined_at`, `updated_at`.

#### 8.2 `order_deliveries`
**Purpose:** Fulfilment record per order supporting **Seller In-House Runners**, **Platform Delivery Partners**, and **Customer Self-Pickup**.
- **Columns:** `id` (UUID PK), `order_id` (`UUID` UNIQUE FK → `orders.id`), `fulfilment_type` (`delivery_fulfilment_type` NOT NULL), `seller_staff_id` (`UUID` FK → `seller_staff_members.id` NULL), `delivery_partner_id` (`UUID` FK → `delivery_partners.id` NULL), `runner_name_snapshot` (`VARCHAR(120)` NULL), `runner_phone_snapshot` (`VARCHAR(15)` NULL), `pickup_code` (`VARCHAR(12)` NULL), `status` (`delivery_status` DEFAULT `'UNASSIGNED'`), `assigned_at`, `picked_up_at`, `delivered_at`, `failed_reason` (`TEXT` NULL), `delivery_proof_url` (`TEXT` NULL), `created_at`, `updated_at`.

---

### Domain 9: Payments, Refunds, Taxes, Commission & Settlements

#### 9.1 `fee_rules`
**Purpose:** Versioned commission & platform fee schedules per vertical, supporting pilot shadow-mode auditing (`AdminFeeRulesView`).
- **Columns:** `id` (UUID PK), `name` (`VARCHAR(120)` NOT NULL), `vertical_id` (`UUID` FK → `verticals.id` NULL — `NULL` = applies to all verticals), `commission_bps` (`INTEGER` NOT NULL), `platform_fee` (`NUMERIC(12,2)` DEFAULT `0.00`), `effective_from` (`TIMESTAMPTZ` NOT NULL), `effective_until` (`TIMESTAMPTZ` NULL), `is_pilot_shadow_mode` (`BOOLEAN` DEFAULT `FALSE`), `is_active` (`BOOLEAN` DEFAULT `TRUE`), `created_at`, `updated_at`.

#### 9.2 `tax_slabs`
**Purpose:** GST & HSN rules per vertical (`AdminTaxPoliciesView`).
- **Columns:** `id` (UUID PK), `name` (`VARCHAR(120)` NOT NULL), `vertical_id` (`UUID` FK → `verticals.id` NULL), `gst_percent` (`NUMERIC(5,2)` NOT NULL), `hsn_prefix` (`VARCHAR(16)` NULL), `is_inclusive` (`BOOLEAN` DEFAULT `TRUE`), `description` (`TEXT` NULL), `is_active` (`BOOLEAN` DEFAULT `TRUE`), `created_at`, `updated_at`.

#### 9.3 `payment_transactions`
**Purpose:** Records every payment attempt — including **failed payments**, retries, COD collections, Seller UPI, Platform UPI, and Udhari postings.
- **Columns:** `id` (UUID PK), `transaction_ref` (`VARCHAR(60)` UNIQUE NOT NULL), `order_id` (`UUID` FK → `orders.id`), `customer_id` (`UUID` FK → `users.id`), `seller_id` (`UUID` FK → `sellers.id`), `amount` (`NUMERIC(12,2)` NOT NULL), `method` (`payment_method` NOT NULL), `gateway_name` (`VARCHAR(60)` NULL), `gateway_ref` (`VARCHAR(120)` NULL), `status` (`payment_tx_status` NOT NULL), `failure_code` (`VARCHAR(60)` NULL), `failure_reason` (`TEXT` NULL), `platform_fee_component` (`NUMERIC(12,2)` DEFAULT `0.00`), `paid_at` (`TIMESTAMPTZ` NULL), `created_at`, `updated_at`.

#### 9.4 `refunds`
**Purpose:** Full refund lifecycle tied to orders, original payment transactions, returns, or support cases (`AdminPayoutsView`).
- **Columns:** `id` (UUID PK), `refund_number` (`VARCHAR(40)` UNIQUE NOT NULL), `order_id` (`UUID` FK → `orders.id`), `payment_transaction_id` (`UUID` FK → `payment_transactions.id` NULL), `support_case_id` (`UUID` FK → `support_cases.id` NULL), `order_return_id` (`UUID` FK → `order_returns.id` NULL), `amount` (`NUMERIC(12,2)` NOT NULL), `channel` (`refund_channel` NOT NULL), `status` (`refund_status` DEFAULT `'INITIATED'`), `reason` (`TEXT` NOT NULL), `rejection_reason` (`TEXT` NULL), `failure_reason` (`TEXT` NULL), `gateway_refund_ref` (`VARCHAR(120)` NULL), `initiated_by_user_id` (`UUID` FK → `users.id`), `initiated_at`, `processed_at`, `updated_at`.

#### 9.5 `seller_settlements` & 9.6 `seller_settlement_orders`
- `seller_settlements`: `id` (UUID PK), `settlement_number` (`VARCHAR(40)` UNIQUE NOT NULL), `seller_id` (`UUID` FK → `sellers.id`), `period_start` (`DATE` NOT NULL), `period_end` (`DATE` NOT NULL), `period_label` (`VARCHAR(60)` NOT NULL), `orders_count` (`INTEGER` NOT NULL), `gross_amount` (`NUMERIC(12,2)` NOT NULL), `commission_amount` (`NUMERIC(12,2)` NOT NULL), `refund_deductions` (`NUMERIC(12,2)` DEFAULT `0.00`), `other_deductions` (`NUMERIC(12,2)` DEFAULT `0.00`), `platform_fee_deduction` (`NUMERIC(12,2)` DEFAULT `0.00`), `net_payable` (`NUMERIC(12,2)` NOT NULL), `payment_mode` (`settlement_payment_mode` NOT NULL), `utr_number` (`VARCHAR(64)` UNIQUE NULL), `status` (`settlement_status` DEFAULT `'PENDING'`), `settlement_date` (`DATE` NULL), `settled_at` (`TIMESTAMPTZ` NULL), `notes` (`TEXT` NULL), `created_by_user_id` (`UUID` FK → `users.id`), `created_at`, `updated_at`.
- `seller_settlement_orders`: `id` (UUID PK), `settlement_id` (`UUID` FK → `seller_settlements.id`), `order_id` (`UUID` UNIQUE FK → `orders.id` — guarantees an order is never double-settled!), `order_gross_amount` (`NUMERIC(12,2)`), `order_commission_amount` (`NUMERIC(12,2)`), `order_refund_deduction` (`NUMERIC(12,2)`), `order_net_amount` (`NUMERIC(12,2)`).

---

### Domain 10: Seller-Managed Udhari (Rural Credit)

#### 10.1 `customer_credit_profiles`
**Purpose:** Seller-owned customer khata/credit account storing customer-specific credit limit and running balance.
- **Columns:** `id` (UUID PK), `seller_id` (`UUID` FK → `sellers.id`), `customer_id` (`UUID` FK → `users.id`), `status` (`credit_profile_status` DEFAULT `'ACTIVE'`), `credit_limit` (`NUMERIC(12,2)` NOT NULL), `outstanding_balance` (`NUMERIC(12,2)` DEFAULT `0.00`), `overdue_amount` (`NUMERIC(12,2)` DEFAULT `0.00`), `default_due_days` (`INTEGER` DEFAULT `15`), `last_payment_at` (`TIMESTAMPTZ` NULL), `internal_note` (`TEXT` NULL), `created_at`, `updated_at`.
- **Constraints:** `UNIQUE(seller_id, customer_id)`, `CHECK(credit_limit >= 0)`, `CHECK(outstanding_balance >= 0)`. *(Note: `available_credit` is derived as `GREATEST(0, credit_limit - outstanding_balance)` — not redundantly stored to avoid drift.)*

#### 10.2 `credit_repayments`
**Purpose:** Receipt record for Cash / Direct Seller UPI / Bank Transfer repayments recorded by the seller.
- **Columns:** `id` (UUID PK), `repayment_reference` (`VARCHAR(40)` UNIQUE NOT NULL — e.g. `REC-2026-0045`), `credit_profile_id` (`UUID` FK → `customer_credit_profiles.id`), `seller_id` (`UUID` FK → `sellers.id`), `customer_id` (`UUID` FK → `users.id`), `amount` (`NUMERIC(12,2)` NOT NULL), `method` (`repayment_method` NOT NULL), `reference_number` (`VARCHAR(80)` NULL), `note` (`TEXT` NULL), `recorded_by_user_id` (`UUID` FK → `users.id`), `received_at` (`TIMESTAMPTZ` NOT NULL), `created_at`.

#### 10.3 `credit_ledger_entries`
**Purpose:** Append-only double-entry Udhari ledger tracking every credit sale, repayment, reversal, and manual adjustment.
- **Columns:** `id` (UUID PK), `ledger_reference` (`VARCHAR(40)` UNIQUE NOT NULL — e.g. `LED-2026-0012`), `credit_profile_id` (`UUID` FK → `customer_credit_profiles.id`), `seller_id` (`UUID` FK → `sellers.id`), `customer_id` (`UUID` FK → `users.id`), `order_id` (`UUID` FK → `orders.id` NULL), `repayment_id` (`UUID` FK → `credit_repayments.id` NULL), `reversed_entry_id` (`UUID` self-FK → `credit_ledger_entries.id` NULL), `entry_type` (`credit_entry_type` NOT NULL), `direction` (`credit_entry_direction` NOT NULL), `amount` (`NUMERIC(12,2)` NOT NULL), `running_balance` (`NUMERIC(12,2)` NOT NULL), `due_date` (`TIMESTAMPTZ` NULL), `is_overdue` (`BOOLEAN` DEFAULT `FALSE`), `status` (`credit_entry_status` DEFAULT `'POSTED'`), `reason` (`TEXT` NULL), `recorded_by_user_id` (`UUID` FK → `users.id`), `posted_at` (`TIMESTAMPTZ` NOT NULL).

#### 10.4 `credit_disputes`
**Purpose:** Customer disputes raised against specific Udhari ledger entries (`CustomerUdharView` / `AdminUdhariView`).
- **Columns:** `id` (UUID PK), `credit_profile_id` (`UUID` FK → `customer_credit_profiles.id`), `ledger_entry_id` (`UUID` FK → `credit_ledger_entries.id`), `seller_id` (`UUID` FK → `sellers.id`), `customer_id` (`UUID` FK → `users.id`), `reason_code` (`credit_dispute_reason` NOT NULL), `description` (`TEXT` NOT NULL), `status` (`credit_dispute_status` DEFAULT `'OPEN'`), `resolution_note` (`TEXT` NULL), `resolved_by_user_id` (`UUID` FK → `users.id` NULL), `opened_at`, `resolved_at`.

---

### Domain 11: Offers, Coupons, Reviews & Support Complaints

#### 11.1 `offers_coupons` & 11.2 `coupon_redemptions`
- `offers_coupons`: `id` (UUID PK), `code` (`VARCHAR(40)` UNIQUE NOT NULL), `title` (`VARCHAR(160)` NOT NULL), `discount_type` (`discount_type` NOT NULL), `discount_value` (`NUMERIC(12,2)` NOT NULL), `min_order_amount` (`NUMERIC(12,2)` DEFAULT `0.00`), `max_discount_amount` (`NUMERIC(12,2)` NULL), `vertical_id` (`UUID` FK → `verticals.id` NULL), `village_id` (`UUID` FK → `villages.id` NULL), `seller_id` (`UUID` FK → `sellers.id` NULL), `funded_by` (`offer_funding_source` NOT NULL), `valid_from` (`TIMESTAMPTZ` NOT NULL), `valid_until` (`TIMESTAMPTZ` NOT NULL), `usage_limit` (`INTEGER` NOT NULL), `per_customer_limit` (`INTEGER` DEFAULT `1`), `used_count` (`INTEGER` DEFAULT `0`), `is_active` (`BOOLEAN` DEFAULT `TRUE`), `created_at`, `updated_at`.
- `coupon_redemptions`: `id` (UUID PK), `coupon_id` (`UUID` FK → `offers_coupons.id`), `order_id` (`UUID` UNIQUE FK → `orders.id`), `customer_id` (`UUID` FK → `users.id`), `discount_applied` (`NUMERIC(12,2)` NOT NULL), `redeemed_at`.

#### 11.3 `reviews`
**Purpose:** Verified-order ratings and moderated customer feedback (`AdminReviewsView`).
- **Columns:** `id` (UUID PK), `order_id` (`UUID` UNIQUE FK → `orders.id`), `customer_id` (`UUID` FK → `users.id`), `seller_id` (`UUID` FK → `sellers.id`), `rating` (`SMALLINT` NOT NULL `CHECK(rating BETWEEN 1 AND 5)`), `comment` (`TEXT` NULL), `status` (`review_status` DEFAULT `'PUBLISHED'`), `flag_reason` (`TEXT` NULL), `moderation_notes` (`TEXT` NULL), `moderated_by_user_id` (`UUID` FK → `users.id` NULL), `created_at`, `updated_at`.

#### 11.4 `support_cases`
**Purpose:** Customer complaints, order issues, food quality reports, and refund escalations (`AdminSupportView`).
- **Columns:** `id` (UUID PK), `case_number` (`VARCHAR(30)` UNIQUE NOT NULL), `order_id` (`UUID` FK → `orders.id` NULL), `customer_id` (`UUID` FK → `users.id`), `seller_id` (`UUID` FK → `sellers.id` NULL), `issue_type` (`support_issue_type` NOT NULL), `status` (`support_case_status` DEFAULT `'OPEN'`), `disputed_amount` (`NUMERIC(12,2)` DEFAULT `0.00`), `approved_refund_amount` (`NUMERIC(12,2)` NULL), `description` (`TEXT` NOT NULL), `resolution_notes` (`TEXT` NULL), `assigned_admin_id` (`UUID` FK → `users.id` NULL), `created_at`, `updated_at`.

---

### Domain 12: Food & Grocery Seller Safety, Quality & Assessment System

Supports the complete `SellerSafetyQualityView` & `AdminSafetyQualityView` framework already built in GramBazaar:

- **12.1 `safety_training_modules`**: Curriculum for `FOOD` (hygiene, kitchen sanitation, raw/cooked separation, temperature, pest control) and `GROCERY` (authenticity, expiry/batch checks, FIFO/FEFO, contamination prevention, grains/spices handling).
- **12.2 `seller_training_completions`**: M:N `(seller_id, module_id)` with `completed_at`.
- **12.3 `safety_checklist_items`**: Weighted daily hygiene/storage checklist items with `is_critical` flag.
- **12.4 `seller_checklist_submissions`**: Daily submission per seller (`UNIQUE(seller_id, submission_date)`), storing checked item IDs, `score_percent`, and critical compliance counts.
- **12.5 `safety_exam_questions`**: Track-specific MCQ exam question bank with Hindi hints and explanations.
- **12.6 `seller_exam_attempts`**: Timestamped exam attempts with `score_percent`, `passed`, `time_taken_seconds`, `weak_topics`, and submitted `answers`.
- **12.7 `seller_safety_profiles`**: 1:1 compliance summary per seller (`badge_level`, `overall_compliance_score`, `retraining_required`, `suspended_for_safety`, `certificate_number`, `certified_at`, `certificate_valid_until`).
- **12.8 `safety_inspection_audits`**: Physical/remote admin inspection records with `inspector_user_id`, `score_percent`, `outcome`, `remarks`, and `findings`.

---

### Domain 13: Notifications, Broadcasts, CMS, Policies, Settings & Audit Logs

- **13.1 `notifications`**: Per-user / per-seller notifications (new order buzzer alerts with `accept_deadline_at`, order status alerts, Kirana low-stock alerts, Udhari payment reminders).
- **13.2 `broadcast_campaigns`**: Admin scheduled/sent campaigns targeting village/all customers or sellers across App Push, WhatsApp, and SMS.
- **13.3 `cms_banners`**: Storefront hero carousel, mid-promo, and festival banners scoped by vertical and village.
- **13.4 `cms_policy_pages`**: Versioned Terms, Privacy, Refund, and Seller Policy content.
- **13.5 `cancellation_policy_rules`**: Configurable free-cancel windows, penalty percentages, and auto-refund flags per actor (`CUSTOMER`, `SELLER`, `DELIVERY_FAILED`).
- **13.6 `platform_settings`**: Typed global platform configuration (`platform_name`, `support_phone`, `auto_cancel_unaccepted_mins`, `food_prep_sla_mins`, `maintenance_mode`, etc.).
- **13.7 `audit_logs`**: Immutable administrative & security audit trail recording actor, role, action type, target entity/ID, IP address, reason, and structured metadata.

---

## 5. Design Review Checklist (Self-Audit Verification)

| Verification Requirement | Status & Proof |
|---|---|
| All existing UI modules covered? | **Verified** — All Customer, Seller (including Kirana Inventory, Bulk Update, Safety & Quality, Udhari, Runners), and all 31 Admin modules map to explicit tables. |
| Duplicate entities eliminated? | **Verified** — Unified `users`, unified `sellers` (no duplicate `seller_applications`), unified `products` + `seller_product_listings`. |
| Universal product flexibility? | **Verified** — `verticals` + `products` + `product_variants` + `product_attribute_values` support Grocery, Food, Hardware, Apparel, Electronics, Furniture, Agriculture with zero per-vertical tables. |
| Food category excludes tiffin services? | **Verified** — `seller_business_type` enum restricts `FOOD` to `RESTAURANT`, `HOTEL`, `DHABA`, `BAKERY`. |
| Financial precision uses Decimal/Numeric? | **Verified** — All money columns use `NUMERIC(12, 2)` in INR. |
| Historical order price preservation? | **Verified** — `order_items` snapshots product name, SKU, variant, options, MRP, unit price, unit label, and line total; `orders` snapshots delivery address, tax label, coupon code, and commission bps. |
| Seller-specific inventory? | **Verified** — `seller_product_listings` holds per-seller `stock_quantity`, `reserved_quantity`, `low_stock_threshold`, `shelf_location`, `expiry_date`, `supplier_name`, plus `inventory_stock_movements` audit trail. |
| Udhari strictly seller-owned? | **Verified** — `customer_credit_profiles` has `UNIQUE(seller_id, customer_id)` and `sellers.udhari_enabled` policy gate; balances & repayments are strictly isolated per seller. |
| Multi-village support? | **Verified** — `villages`, `village_landmarks`, `inter_village_routes`, `seller_serviceable_villages`, and `admin_village_scopes`. |

---

## 6. OPEN BUSINESS DECISIONS

The following business rules were either ambiguous or had minor discrepancies in the existing frontend prototype and **must be confirmed by stakeholders before backend implementation**:

1. **INR Decimal vs. Integer Paise API Contract:**
   - The existing React frontend currently stores prices in integer paise (`pricePaise: 12000` for ₹120.00), whereas this PostgreSQL design uses `NUMERIC(12, 2)` in INR (`120.00`) per database specification.
   - *Decision Needed:* Should REST API responses return decimal INR strings (`"120.00"`) or maintain backward-compatible integer `paise` fields during frontend migration?
2. **Direct Seller UPI (`SELLER_UPI`) vs. Platform Escrow UPI Settlement:**
   - In `SellerSettingsView`, direct Seller UPI QR payments state *"zero-commission direct settlement"*, whereas `AdminPayoutsView` tracks platform settlements & commission deductions.
   - *Decision Needed:* When a customer pays via `SELLER_UPI` directly to the shop's QR code, how will platform commission (if non-zero after pilot) be recovered — deducted from future platform-collected payouts or billed via a seller commission wallet?
3. **Udhari Overpayment / Advance Credit Balance:**
   - Currently `UdhariContext` blocks repayments exceeding `outstanding_balance` (*"cannot exceed current outstanding balance in MVP"*).
   - *Decision Needed:* Should rural customers be allowed to deposit advance money (negative outstanding / store credit) with a Kirana shop, or keep strict `repayment <= outstanding_balance`?
4. **Stock Deduction Timing (Order Placed vs. Seller Accepted):**
   - For Kirana Grocery orders, should inventory be **reserved** (`reserved_quantity += qty`) on `PLACED` and permanently deducted on `ACCEPTED`, or deducted immediately on `PLACED` and restored on `REJECTED`/`CANCELLED`?
5. **Multi-Seller Orders vs. Single-Seller Cart:**
   - `CartContext` enforces 1 seller per cart/order.
   - *Decision Needed:* Will GramBazaar ever allow a single checkout spanning a Kirana store and a Restaurant (requiring a parent `order_groups` table), or will single-seller orders remain permanent?
6. **Product-Level vs. Seller-Level Reviews:**
   - `AdminReviewsView` currently models one review per order tied to a seller (`reviews.order_id` UNIQUE).
   - *Decision Needed:* Do you also want individual product-level star ratings (especially for Hardware/Apparel/Grocery items) in Phase 1, or keep order/seller-level reviews only?
7. **Safety Certification Mandatory Gate for Go-Live:**
   - Should passing the **Food & Grocery Safety Exam** (`seller_safety_profiles.badge_level IN ('VERIFIED_SAFE', 'GOLD_CERTIFIED')`) be a hard prerequisite before a seller's status can become `ACTIVE`, or remain an advisory trust badge with admin override?
8. **Variable-Weight Grocery Final Billing Adjustment:**
   - `GroceryProduct` includes `variableWeight: boolean` (e.g., loose potatoes/atta weighed at shop counter may weigh `1.06 kg` instead of `1.00 kg`).
   - *Decision Needed:* Should sellers be allowed to adjust final weighed quantity/total before dispatch (for COD/Udhari orders), or lock order totals strictly at checkout?
9. **Seller Self-Registration vs. Admin-Assisted Onboarding:**
   - Can village shopkeepers self-submit KYC from the mobile/web app immediately creating a `PENDING_APPROVAL` seller record, or can field agents (`ADMIN_OPS`) also register shops on their behalf?
10. **Data Retention & Account Deletion Policy (DPDP Act Compliance):**
    - Under India's Digital Personal Data Protection (DPDP) Act, when a customer requests account deletion, confirm that financial records (`orders`, `payment_transactions`, `credit_ledger_entries`) are retained for 8 years (Indian tax/accounting statutory requirement) while anonymizing PII on `users` and `customer_addresses`.
