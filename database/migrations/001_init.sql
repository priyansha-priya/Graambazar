-- =====================================================================
-- GramBazaar — initial schema (PROPOSAL, not yet applied anywhere)
-- Target: PostgreSQL 18+  (uses the built-in uuidv7(), added in PG 18)
--
-- Conventions
--   ids          uuid v7 (time-ordered) for API-addressable rows;
--                bigint identity for internal append-only tables;
--                text codes for small fixed lists (verticals, admin_modules)
--   money        bigint, whole paise, CHECK >= 0
--   deletion     three tiers:
--                  * history (orders, ledger, refunds, payouts, events, audit): never deleted
--                  * people (users, sellers, customers, admins): status flags; personal-data
--                    erasure anonymizes the row (users.anonymized_at) instead of deleting it
--                  * masters/config the admin UI can delete: deleted_at soft delete, kept
--                    separate from is_active (the UI has both "disable" and "delete")
--                Every query on a soft-deleted table must filter deleted_at IS NULL; uniqueness
--                on those tables is enforced only among live rows (partial unique indexes).
--   timestamps   timestamptz
--   enum values  text + CHECK (easy to extend; verticals are admin-defined)
--   "ALL"        frontend sentinel values become NULL (= applies to all)
--
-- No BEGIN/COMMIT here: most migration tools (dbmate, node-pg-migrate)
-- wrap each file in a transaction themselves. Add them if you run this
-- file by hand with psql.
--
-- Rule-enforcing unique indexes live in this file; performance indexes
-- are in 002_indexes.sql.
-- =====================================================================


-- ---------------------------------------------------------------------
-- A. Identity
-- ---------------------------------------------------------------------
CREATE TABLE users (
  id            uuid PRIMARY KEY DEFAULT uuidv7(),
  phone         text UNIQUE CHECK (phone ~ '^[6-9][0-9]{9}$'),  -- isValidIndianPhone
  email         text,
  display_name  text NOT NULL,
  password_hash text,                        -- NULL if OTP-only login (open question)
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  anonymized_at timestamptz,                 -- erasure request: phone/email/name cleared, row kept
  CHECK (phone IS NOT NULL OR anonymized_at IS NOT NULL)
);
CREATE UNIQUE INDEX users_email_uq ON users (lower(email)) WHERE email IS NOT NULL;


-- ---------------------------------------------------------------------
-- B. Villages & delivery coverage
-- ---------------------------------------------------------------------
CREATE TABLE villages (
  id                            uuid PRIMARY KEY DEFAULT uuidv7(),
  slug                          text NOT NULL UNIQUE,          -- 'rampur' (current frontend id)
  name                          text NOT NULL,
  hindi_name                    text,
  district                      text NOT NULL,
  state                         text NOT NULL,
  postal_codes                  text[] NOT NULL DEFAULT '{}',
  is_active                     boolean NOT NULL DEFAULT true,
  base_delivery_fee_paise       bigint NOT NULL DEFAULT 0 CHECK (base_delivery_fee_paise >= 0),
  min_order_free_delivery_paise bigint CHECK (min_order_free_delivery_paise >= 0),
  created_at                    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE village_landmarks (
  id         uuid PRIMARY KEY DEFAULT uuidv7(),
  village_id uuid NOT NULL REFERENCES villages(id) ON DELETE CASCADE,
  name       text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  UNIQUE (village_id, name)
);

-- Unifies Village.neighbors[] and InterVillageRouteRecord.
-- Directed: from = seller's village, to = customer's village.
CREATE TABLE village_routes (
  id              uuid PRIMARY KEY DEFAULT uuidv7(),
  from_village_id uuid NOT NULL REFERENCES villages(id) ON DELETE CASCADE,
  to_village_id   uuid NOT NULL REFERENCES villages(id) ON DELETE CASCADE,
  distance_km     numeric(6,2) NOT NULL CHECK (distance_km > 0),
  surcharge_paise bigint NOT NULL DEFAULT 0 CHECK (surcharge_paise >= 0),
  is_active       boolean NOT NULL DEFAULT true,
  deleted_at      timestamptz,
  CHECK (from_village_id <> to_village_id)
);
CREATE UNIQUE INDEX village_routes_pair_uq ON village_routes (from_village_id, to_village_id)
  WHERE deleted_at IS NULL;


-- ---------------------------------------------------------------------
-- C. Admins, RBAC, customers
-- ---------------------------------------------------------------------
CREATE TABLE admin_profiles (
  user_id        uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  admin_role     text NOT NULL CHECK (admin_role IN ('SUPER_ADMIN','ADMIN_OPS','ADMIN_FINANCE','ADMIN_SUPPORT')),
  status         text NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE','SUSPENDED')),
  all_villages   boolean NOT NULL DEFAULT false,          -- assignedVillages = ['ALL']
  avatar_url     text,
  last_active_at timestamptz
);

CREATE TABLE admin_village_scopes (
  admin_user_id uuid NOT NULL REFERENCES admin_profiles(user_id) ON DELETE CASCADE,
  village_id    uuid NOT NULL REFERENCES villages(id) ON DELETE CASCADE,
  PRIMARY KEY (admin_user_id, village_id)
);

CREATE TABLE admin_modules (
  key   text PRIMARY KEY,                 -- AdminModuleKey: 'ORDERS', 'PAYOUTS', ...
  label text NOT NULL
);

CREATE TABLE role_permissions (
  admin_role  text NOT NULL CHECK (admin_role IN ('SUPER_ADMIN','ADMIN_OPS','ADMIN_FINANCE','ADMIN_SUPPORT')),
  module_key  text NOT NULL REFERENCES admin_modules(key) ON DELETE CASCADE,
  can_view    boolean NOT NULL DEFAULT false,
  can_manage  boolean NOT NULL DEFAULT false,
  can_approve boolean NOT NULL DEFAULT false,
  can_export  boolean NOT NULL DEFAULT false,
  PRIMARY KEY (admin_role, module_key)
);

CREATE TABLE customer_profiles (
  user_id           uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  active_village_id uuid REFERENCES villages(id),
  landmark          text,
  status            text NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE','BLOCKED')),
  block_reason      text,
  admin_notes       text,
  joined_at         timestamptz NOT NULL DEFAULT now(),
  CHECK (status = 'ACTIVE' OR block_reason IS NOT NULL)
);

CREATE TABLE customer_addresses (
  id              uuid PRIMARY KEY DEFAULT uuidv7(),
  user_id         uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  recipient_name  text NOT NULL,
  recipient_phone text NOT NULL CHECK (recipient_phone ~ '^[6-9][0-9]{9}$'),
  village_id      uuid NOT NULL REFERENCES villages(id),
  address_line1   text NOT NULL,
  landmark        text NOT NULL CHECK (char_length(btrim(landmark)) BETWEEN 3 AND 100), -- isValidLandmark
  address_label   text NOT NULL DEFAULT 'Home' CHECK (address_label IN ('Home','Work','Other')),
  is_default      boolean NOT NULL DEFAULT false,
  created_at      timestamptz NOT NULL DEFAULT now(),
  deleted_at      timestamptz                -- soft delete; orders keep their own snapshot
);
-- Rule: at most one default address per user
CREATE UNIQUE INDEX customer_addresses_one_default ON customer_addresses (user_id)
  WHERE is_default AND deleted_at IS NULL;


-- ---------------------------------------------------------------------
-- D. Verticals, sellers, KYC
-- ---------------------------------------------------------------------
CREATE TABLE verticals (
  id                   text PRIMARY KEY CHECK (id ~ '^[A-Z_]+$'),   -- 'FOOD', 'GROCERY', ...
  name                 text NOT NULL,
  hindi_name           text,
  icon                 text,
  is_enabled           boolean NOT NULL DEFAULT true,
  description          text,
  special_rules        text[] NOT NULL DEFAULT '{}',
  fulfillment_workflow text NOT NULL CHECK (fulfillment_workflow IN
                         ('FOOD_KITCHEN','GROCERY_WEIGHT','PHYSICAL_RETAIL','MADE_TO_ORDER')),
  required_kyc_docs    text[] NOT NULL DEFAULT '{}'
);

CREATE TABLE sellers (
  id                       uuid PRIMARY KEY DEFAULT uuidv7(),
  slug                     text NOT NULL UNIQUE,           -- 'seller_gupta_kirana'
  owner_user_id            uuid NOT NULL REFERENCES users(id),
  public_name              text NOT NULL,
  business_type            text NOT NULL CHECK (business_type IN (
                             'RESTAURANT','HOTEL','DHABA','BAKERY','SNACKS','KIRANA','HARDWARE_STORE',
                             'ELECTRONICS_DEALER','CLOTHING_STORE','FURNITURE_SHOP','AGRI_KENDRA','MULTI_CATEGORY')),
  description              text,
  contact_phone            text NOT NULL,
  email                    text,
  village_id               uuid NOT NULL REFERENCES villages(id),
  address_line             text NOT NULL,
  pin_code                 text,
  status                   text NOT NULL DEFAULT 'PENDING_APPROVAL' CHECK (status IN (
                             'PENDING_APPROVAL','KYC_PENDING','KYC_UNDER_REVIEW','APPROVED','ACTIVE',
                             'INACTIVE','PAUSED','SUSPENDED','REJECTED')),
  kyc_status               text NOT NULL DEFAULT 'PENDING' CHECK (kyc_status IN (
                             'PENDING','UNDER_REVIEW','APPROVED','REJECTED','CHANGES_REQUESTED')),
  is_paused                boolean NOT NULL DEFAULT false,   -- "open now" is derived from hours + pause
  offers_delivery          boolean NOT NULL DEFAULT true,
  offers_pickup            boolean NOT NULL DEFAULT false,
  delivery_radius_km       numeric(5,2),
  minimum_order_paise      bigint NOT NULL DEFAULT 0 CHECK (minimum_order_paise >= 0),
  packaging_fee_paise      bigint NOT NULL DEFAULT 0 CHECK (packaging_fee_paise >= 0),
  delivery_fee_paise       bigint NOT NULL DEFAULT 0 CHECK (delivery_fee_paise >= 0),
  opens_at                 time,
  closes_at                time,
  closed_weekdays          smallint[] NOT NULL DEFAULT '{}',  -- 0 = Sunday ... 6 = Saturday
  fssai_number             text,
  fssai_verified           boolean NOT NULL DEFAULT false,
  banner_url               text,
  commission_rate_bps      integer NOT NULL DEFAULT 0 CHECK (commission_rate_bps BETWEEN 0 AND 10000),
  udhari_enabled           boolean NOT NULL DEFAULT false,
  udhari_policy_acknowledged_at timestamptz,
  bank_account_holder      text,
  bank_account_last4       text,
  bank_account_token       text,                -- encrypted / vault reference, never the raw number
  ifsc_code                text,
  suspension_reason        text,
  rejection_reason         text,
  kyc_change_request_notes text,
  rating_avg               numeric(2,1) NOT NULL DEFAULT 0 CHECK (rating_avg BETWEEN 0 AND 5),
  review_count             integer NOT NULL DEFAULT 0 CHECK (review_count >= 0),
  joined_at                timestamptz NOT NULL DEFAULT now(),
  updated_at               timestamptz NOT NULL DEFAULT now(),
  CHECK (offers_delivery OR offers_pickup),
  CHECK (NOT udhari_enabled OR udhari_policy_acknowledged_at IS NOT NULL)
);

CREATE TABLE seller_verticals (
  seller_id   uuid NOT NULL REFERENCES sellers(id) ON DELETE CASCADE,
  vertical_id text NOT NULL REFERENCES verticals(id),
  is_primary  boolean NOT NULL DEFAULT false,
  PRIMARY KEY (seller_id, vertical_id)
);
-- Rule: at most one primary vertical per seller
CREATE UNIQUE INDEX seller_verticals_one_primary ON seller_verticals (seller_id) WHERE is_primary;

CREATE TABLE seller_service_villages (       -- Seller.serviceableVillageIds
  seller_id  uuid NOT NULL REFERENCES sellers(id) ON DELETE CASCADE,
  village_id uuid NOT NULL REFERENCES villages(id) ON DELETE CASCADE,
  PRIMARY KEY (seller_id, village_id)
);

CREATE TABLE seller_runners (                 -- InHouseRunner (SellerContext)
  id           uuid PRIMARY KEY DEFAULT uuidv7(),
  seller_id    uuid NOT NULL REFERENCES sellers(id) ON DELETE CASCADE,
  name         text NOT NULL,
  phone        text NOT NULL,
  role         text NOT NULL CHECK (role IN ('SHOP_RUNNER','DELIVERY_STAFF','FAMILY_HELPER')),
  is_available boolean NOT NULL DEFAULT true,
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE delivery_partners (              -- platform fleet (DeliveryPartnerRecord)
  id             uuid PRIMARY KEY DEFAULT uuidv7(),
  name           text NOT NULL,
  phone          text NOT NULL,
  village_id     uuid NOT NULL REFERENCES villages(id),
  vehicle_type   text NOT NULL CHECK (vehicle_type IN ('CYCLE','BIKE','E_RICKSHAW')),
  vehicle_number text,
  kyc_verified   boolean NOT NULL DEFAULT false,
  status         text NOT NULL DEFAULT 'OFFLINE' CHECK (status IN ('AVAILABLE','ON_DELIVERY','OFFLINE','SUSPENDED')),
  rating_avg     numeric(2,1) NOT NULL DEFAULT 0,
  joined_at      timestamptz NOT NULL DEFAULT now(),
  deleted_at     timestamptz                -- soft delete: past orders still point here
);
CREATE UNIQUE INDEX delivery_partners_phone_uq ON delivery_partners (phone) WHERE deleted_at IS NULL;

CREATE TABLE seller_applications (
  id                     uuid PRIMARY KEY DEFAULT uuidv7(),
  applicant_user_id      uuid REFERENCES users(id),
  applicant_name         text NOT NULL,
  business_name          text NOT NULL,
  business_type          text,                       -- same values as sellers.business_type
  phone                  text NOT NULL,
  village_id             uuid NOT NULL REFERENCES villages(id),
  vertical_id            text NOT NULL REFERENCES verticals(id),
  supported_vertical_ids text[] NOT NULL DEFAULT '{}',
  fssai_number           text,
  gst_or_trade_number    text,
  agri_license_number    text,
  aadhaar_masked         text,                       -- masked only; never store full Aadhaar
  pan_number             text,
  bank_account_holder    text NOT NULL,
  bank_account_last4     text NOT NULL,
  bank_account_token     text NOT NULL,
  ifsc_code              text NOT NULL,
  status                 text NOT NULL DEFAULT 'PENDING_REVIEW' CHECK (status IN
                           ('PENDING_REVIEW','APPROVED','REJECTED','CHANGES_REQUESTED')),
  review_notes           text,
  reviewed_by            uuid REFERENCES users(id),
  reviewed_at            timestamptz,
  seller_id              uuid REFERENCES sellers(id), -- set when the approved application becomes a seller
  applied_at             timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE kyc_documents (                  -- history lives in audit_logs (target_entity = 'KycDocument')
  id                     uuid PRIMARY KEY DEFAULT uuidv7(),
  seller_id              uuid REFERENCES sellers(id) ON DELETE CASCADE,
  application_id         uuid REFERENCES seller_applications(id) ON DELETE CASCADE,
  doc_code               text NOT NULL CHECK (doc_code IN ('FSSAI','AADHAAR','PAN','STORE_PHOTO','GST_TRADE','AGRI_LICENSE')),
  document_number_masked text,
  file_name              text NOT NULL,
  storage_key            text NOT NULL,         -- object-storage path; files never go in the DB
  status                 text NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING','APPROVED','REJECTED','CHANGES_REQUESTED')),
  rejection_reason       text,
  uploaded_at            timestamptz NOT NULL DEFAULT now(),
  CHECK (seller_id IS NOT NULL OR application_id IS NOT NULL)
);


-- ---------------------------------------------------------------------
-- E. Catalog masters & products
-- ---------------------------------------------------------------------
CREATE TABLE categories (
  id          uuid PRIMARY KEY DEFAULT uuidv7(),
  slug        text NOT NULL,                   -- 'atta_flour', 'thali_meals'
  vertical_id text NOT NULL REFERENCES verticals(id),
  parent_id   uuid REFERENCES categories(id) ON DELETE RESTRICT,   -- set => subcategory
  name        text NOT NULL,
  hindi_name  text,
  icon        text,
  is_active   boolean NOT NULL DEFAULT true,
  sort_order  integer NOT NULL DEFAULT 0,
  deleted_at  timestamptz
);
CREATE UNIQUE INDEX categories_slug_uq ON categories (slug) WHERE deleted_at IS NULL;

CREATE TABLE units (
  id                          uuid PRIMARY KEY DEFAULT uuidv7(),
  name                        text NOT NULL,
  hindi_name                  text,
  symbol                      text NOT NULL,              -- 'kg', 'plate', 'pav'
  family                      text NOT NULL CHECK (family IN ('WEIGHT','VOLUME','LENGTH','COUNT','PORTION','BULK_PACK','AREA')),
  base_unit                   text,
  conversion_factor           numeric(14,6) CHECK (conversion_factor > 0),  -- 1 pav = 250 g
  allow_decimal               boolean NOT NULL DEFAULT false,
  allow_seller_local_override boolean NOT NULL DEFAULT false,
  vertical_ids                text[] NOT NULL DEFAULT '{}',
  is_active                   boolean NOT NULL DEFAULT true,
  deleted_at                  timestamptz
);
CREATE UNIQUE INDEX units_symbol_uq ON units (symbol) WHERE deleted_at IS NULL;

CREATE TABLE attributes (
  id              uuid PRIMARY KEY DEFAULT uuidv7(),
  slug            text NOT NULL,
  name            text NOT NULL,
  hindi_name      text,
  data_type       text NOT NULL CHECK (data_type IN ('TEXT','NUMBER','SELECT','MULTI_SELECT','BOOLEAN','DIMENSIONS')),
  options         text[] NOT NULL DEFAULT '{}',
  unit_suffix     text,
  is_required     boolean NOT NULL DEFAULT false,
  is_filterable   boolean NOT NULL DEFAULT false,
  is_variant_axis boolean NOT NULL DEFAULT false,
  vertical_ids    text[] NOT NULL DEFAULT '{}',
  is_active       boolean NOT NULL DEFAULT true,
  deleted_at      timestamptz
);
CREATE UNIQUE INDEX attributes_slug_uq ON attributes (slug) WHERE deleted_at IS NULL;

CREATE TABLE category_attributes (
  category_id  uuid NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  attribute_id uuid NOT NULL REFERENCES attributes(id) ON DELETE CASCADE,
  PRIMARY KEY (category_id, attribute_id)
);

CREATE TABLE category_units (
  category_id uuid NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  unit_id     uuid NOT NULL REFERENCES units(id) ON DELETE CASCADE,
  PRIMARY KEY (category_id, unit_id)
);

CREATE TABLE brands (
  id           uuid PRIMARY KEY DEFAULT uuidv7(),
  code         text,
  name         text NOT NULL,
  manufacturer text,
  description  text,
  vertical_ids text[] NOT NULL DEFAULT '{}',
  is_verified  boolean NOT NULL DEFAULT false,
  is_active    boolean NOT NULL DEFAULT true,
  deleted_at   timestamptz
);
CREATE UNIQUE INDEX brands_code_uq ON brands (code) WHERE code IS NOT NULL AND deleted_at IS NULL;

CREATE TABLE option_groups (                  -- portions, add-ons, customizations
  id             uuid PRIMARY KEY DEFAULT uuidv7(),
  name           text NOT NULL,
  hindi_name     text,
  vertical_ids   text[] NOT NULL DEFAULT '{}',
  category_ids   uuid[] NOT NULL DEFAULT '{}',
  selection_type text NOT NULL CHECK (selection_type IN ('SINGLE','MULTIPLE')),
  is_required    boolean NOT NULL DEFAULT false,
  min_select     smallint NOT NULL DEFAULT 0 CHECK (min_select >= 0),
  max_select     smallint NOT NULL DEFAULT 1,
  is_active      boolean NOT NULL DEFAULT true,
  deleted_at     timestamptz,
  CHECK (max_select >= min_select)
);

CREATE TABLE option_group_items (
  id                uuid PRIMARY KEY DEFAULT uuidv7(),
  option_group_id   uuid NOT NULL REFERENCES option_groups(id) ON DELETE CASCADE,
  label             text NOT NULL,
  price_delta_paise bigint NOT NULL DEFAULT 0,
  diet_type         text CHECK (diet_type IN ('VEG','NON_VEG','EGG')),
  is_default        boolean NOT NULL DEFAULT false,
  is_available      boolean NOT NULL DEFAULT true,
  sort_order        integer NOT NULL DEFAULT 0,
  deleted_at        timestamptz
);

CREATE TABLE products (                       -- UniversalProductRecord + GroceryProduct rules
  id                  uuid PRIMARY KEY DEFAULT uuidv7(),
  seller_id           uuid NOT NULL REFERENCES sellers(id) ON DELETE CASCADE,
  vertical_id         text NOT NULL REFERENCES verticals(id),
  category_id         uuid NOT NULL REFERENCES categories(id),
  subcategory_id      uuid REFERENCES categories(id),
  brand_id            uuid REFERENCES brands(id),
  unit_id             uuid NOT NULL REFERENCES units(id),
  sku                 text NOT NULL,
  name                text NOT NULL,
  hindi_name          text,
  description         text,
  image_url           text,
  inventory_mode      text NOT NULL CHECK (inventory_mode IN
                        ('QUANTITY_STOCK','WEIGHT_STOCK','VARIANT_STOCK','PREPARED_FOOD','MADE_TO_ORDER')),
  mrp_paise           bigint NOT NULL CHECK (mrp_paise >= 0),
  price_paise         bigint NOT NULL CHECK (price_paise >= 0),
  stock_quantity      numeric(12,3) CHECK (stock_quantity >= 0),     -- fractional for weight stock
  low_stock_threshold numeric(12,3),
  prep_time_minutes   integer CHECK (prep_time_minutes >= 0),
  lead_time_days      integer CHECK (lead_time_days >= 0),
  diet_type           text CHECK (diet_type IN ('VEG','NON_VEG','EGG')),
  quantity_mode       text CHECK (quantity_mode IN ('FIXED_PACK','PREDEFINED_OPTIONS','CUSTOM_QUANTITY')),
  min_quantity        numeric(12,3) NOT NULL DEFAULT 1 CHECK (min_quantity > 0),
  quantity_step       numeric(12,3) NOT NULL DEFAULT 1 CHECK (quantity_step > 0),
  quantity_precision  smallint NOT NULL DEFAULT 0 CHECK (quantity_precision BETWEEN 0 AND 3),
  variable_weight     boolean NOT NULL DEFAULT false,
  local_unit_label    text,                     -- 'pav'
  local_unit_note     text,                     -- '1 pav hamare yahan 250g hota hai'
  local_unit_grams    numeric(10,2),
  shelf_location      text,
  supplier_name       text,
  expiry_date         date,
  attributes          jsonb NOT NULL DEFAULT '{}',
  moderation_status   text NOT NULL DEFAULT 'PENDING_REVIEW' CHECK (moderation_status IN
                        ('PENDING_REVIEW','APPROVED','REJECTED','CHANGES_REQUESTED')),
  moderation_notes    text,
  is_active           boolean NOT NULL DEFAULT true,
  is_available        boolean NOT NULL DEFAULT true,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now(),
  deleted_at          timestamptz             -- order_items keep their own snapshot
);
CREATE UNIQUE INDEX products_seller_sku_uq ON products (seller_id, sku) WHERE deleted_at IS NULL;

CREATE TABLE product_variants (               -- also absorbs VariantSizeMasterRecord (open question)
  id                  uuid PRIMARY KEY DEFAULT uuidv7(),
  product_id          uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  sku                 text NOT NULL,
  label               text NOT NULL,            -- 'Half Plate', '500 g Pack'
  attributes          jsonb NOT NULL DEFAULT '{}',
  unit_quantity       numeric(12,3),
  mrp_paise           bigint NOT NULL CHECK (mrp_paise >= 0),
  price_paise         bigint NOT NULL CHECK (price_paise >= 0),
  stock_quantity      numeric(12,3) NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0),
  low_stock_threshold numeric(12,3),
  is_available        boolean NOT NULL DEFAULT true,
  sort_order          integer NOT NULL DEFAULT 0,
  deleted_at          timestamptz
);
CREATE UNIQUE INDEX product_variants_sku_uq ON product_variants (product_id, sku) WHERE deleted_at IS NULL;

CREATE TABLE product_option_groups (
  product_id      uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  option_group_id uuid NOT NULL REFERENCES option_groups(id) ON DELETE RESTRICT,
  sort_order      integer NOT NULL DEFAULT 0,
  PRIMARY KEY (product_id, option_group_id)
);

CREATE TABLE packaging_types (
  id              uuid PRIMARY KEY DEFAULT uuidv7(),
  code            text NOT NULL,
  name            text NOT NULL,
  hindi_name      text,
  material_type   text NOT NULL CHECK (material_type IN
                    ('FOOD_CONTAINER','THERMAL_BOX','ECO_BAG','SEALED_POUCH','BOTTLE_JAR','CORRUGATED_CARTON')),
  capacity_label  text NOT NULL,
  unit_id         uuid REFERENCES units(id),
  fee_paise       bigint NOT NULL DEFAULT 0 CHECK (fee_paise >= 0),
  is_food_grade   boolean NOT NULL DEFAULT false,
  is_eco_friendly boolean NOT NULL DEFAULT false,
  is_leak_proof   boolean NOT NULL DEFAULT false,
  vertical_ids    text[] NOT NULL DEFAULT '{}',
  category_ids    uuid[] NOT NULL DEFAULT '{}',
  product_ids     uuid[] NOT NULL DEFAULT '{}',
  is_active       boolean NOT NULL DEFAULT true,
  deleted_at      timestamptz
);
CREATE UNIQUE INDEX packaging_types_code_uq ON packaging_types (code) WHERE deleted_at IS NULL;

CREATE TABLE availability_configs (
  id                         uuid PRIMARY KEY DEFAULT uuidv7(),
  code                       text NOT NULL,
  name                       text NOT NULL,
  vertical_id                text NOT NULL REFERENCES verticals(id),
  category_id                uuid NOT NULL REFERENCES categories(id),
  product_id                 uuid REFERENCES products(id) ON DELETE CASCADE,
  workflow_mode              text NOT NULL CHECK (workflow_mode IN
                               ('TRACKED_INVENTORY','DAILY_PREP_SLOTS','MADE_TO_ORDER','UNLIMITED_SERVICE')),
  service_slots              text[] NOT NULL DEFAULT '{}',
  prep_time_minutes          integer,
  daily_batch_limit          integer,
  low_stock_threshold        numeric(12,3) NOT NULL DEFAULT 0,
  max_qty_per_order          numeric(12,3) NOT NULL CHECK (max_qty_per_order > 0),
  auto_disable_on_zero_stock boolean NOT NULL DEFAULT true,
  allow_pre_order            boolean NOT NULL DEFAULT false,
  restock_lead_hours         integer,
  is_active                  boolean NOT NULL DEFAULT true,
  deleted_at                 timestamptz
);
CREATE UNIQUE INDEX availability_configs_code_uq ON availability_configs (code) WHERE deleted_at IS NULL;


-- ---------------------------------------------------------------------
-- F. Pricing policy: fee rules, coupons, tax, cancellation
-- ---------------------------------------------------------------------
CREATE TABLE fee_rules (
  id                   uuid PRIMARY KEY DEFAULT uuidv7(),
  name                 text NOT NULL,
  vertical_id          text REFERENCES verticals(id),          -- NULL = ALL
  commission_bps       integer NOT NULL CHECK (commission_bps BETWEEN 0 AND 10000),
  platform_fee_paise   bigint NOT NULL DEFAULT 0 CHECK (platform_fee_paise >= 0),
  effective_from       timestamptz NOT NULL,
  is_pilot_shadow_mode boolean NOT NULL DEFAULT true,          -- calculated for audit, not charged
  status               text NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE','DEPRECATED'))
);

CREATE TABLE coupons (
  id                 uuid PRIMARY KEY DEFAULT uuidv7(),
  code               text NOT NULL,
  title              text NOT NULL,
  discount_type      text NOT NULL CHECK (discount_type IN ('FLAT','PERCENTAGE','FREE_DELIVERY')),
  discount_value     bigint NOT NULL DEFAULT 0 CHECK (discount_value >= 0),  -- paise (FLAT) or % (PERCENTAGE)
  min_order_paise    bigint NOT NULL DEFAULT 0 CHECK (min_order_paise >= 0),
  max_discount_paise bigint CHECK (max_discount_paise >= 0),
  vertical_id        text REFERENCES verticals(id),          -- NULL = ALL
  village_id         uuid REFERENCES villages(id),           -- NULL = ALL
  funded_by          text NOT NULL CHECK (funded_by IN ('PLATFORM','SELLER')),
  funding_seller_id  uuid REFERENCES sellers(id),            -- assumption (open question)
  valid_from         timestamptz NOT NULL,
  valid_until        timestamptz NOT NULL,
  usage_limit        integer NOT NULL CHECK (usage_limit >= 0),
  is_active          boolean NOT NULL DEFAULT true,
  deleted_at         timestamptz,            -- soft delete: orders.coupon_id still points here
  CHECK (valid_until > valid_from),
  CHECK (discount_type <> 'PERCENTAGE' OR discount_value BETWEEN 1 AND 100)
);
-- Rule: live coupon codes are unique regardless of case
CREATE UNIQUE INDEX coupons_code_uq ON coupons (upper(code)) WHERE deleted_at IS NULL;

CREATE TABLE tax_slabs (
  id           uuid PRIMARY KEY DEFAULT uuidv7(),
  name         text NOT NULL,
  vertical_id  text REFERENCES verticals(id),                -- NULL = ALL
  gst_percent  numeric(5,2) NOT NULL CHECK (gst_percent BETWEEN 0 AND 100),
  hsn_prefix   text NOT NULL,
  is_inclusive boolean NOT NULL DEFAULT true,
  description  text,
  is_active    boolean NOT NULL DEFAULT true,
  deleted_at   timestamptz                    -- kept so past orders' tax can be explained
);

CREATE TABLE cancellation_rules (
  id                      uuid PRIMARY KEY DEFAULT uuidv7(),
  actor                   text NOT NULL CHECK (actor IN ('CUSTOMER','SELLER','DELIVERY_FAILED')),
  code                    text NOT NULL,
  label                   text NOT NULL,
  free_cancel_window_mins integer NOT NULL DEFAULT 0 CHECK (free_cancel_window_mins >= 0),
  penalty_percent         numeric(5,2) NOT NULL DEFAULT 0 CHECK (penalty_percent BETWEEN 0 AND 100),
  auto_refund_eligible    boolean NOT NULL DEFAULT false,
  is_active               boolean NOT NULL DEFAULT true,
  deleted_at              timestamptz         -- kept so past cancellations can be explained
);
CREATE UNIQUE INDEX cancellation_rules_code_uq ON cancellation_rules (code) WHERE deleted_at IS NULL;


-- ---------------------------------------------------------------------
-- G. Orders
-- ---------------------------------------------------------------------
CREATE SEQUENCE order_number_seq START 100;   -- seed orders already use GB-2026-0016 ... 0099

CREATE TABLE orders (
  id                           uuid PRIMARY KEY DEFAULT uuidv7(),
  order_number                 text NOT NULL UNIQUE,         -- 'GB-2026-0100', generated by the API
  customer_id                  uuid NOT NULL REFERENCES users(id),
  seller_id                    uuid NOT NULL REFERENCES sellers(id),
  village_id                   uuid NOT NULL REFERENCES villages(id),   -- customer's village at checkout
  customer_name                text NOT NULL,                -- snapshot (address recipient at checkout)
  customer_phone               text NOT NULL,
  fulfilment_mode              text NOT NULL CHECK (fulfilment_mode IN ('DELIVERY','PICKUP')),
  delivery_address_id          uuid REFERENCES customer_addresses(id) ON DELETE SET NULL,
  delivery_address_snapshot    jsonb,                        -- frozen CustomerAddress
  delivery_note                text,
  status                       text NOT NULL DEFAULT 'placed' CHECK (status IN (
                                 'placed','pending','accepted','preparing','ready_for_pickup','ready_for_delivery',
                                 'out_for_delivery','completed','rejected','cancelled','delivery_failed',
                                 'returned','refunded')),
  payment_method               text NOT NULL CHECK (payment_method IN ('COD','SELLER_UPI','UDHAR')),
  payment_status               text NOT NULL DEFAULT 'pending' CHECK (payment_status IN (
                                 'pending','collected','settled','reversed','refunded','partially_refunded','failed')),
  payment_reference_id         text,
  paid_at                      timestamptz,
  item_subtotal_paise          bigint NOT NULL CHECK (item_subtotal_paise >= 0),
  item_discount_paise          bigint NOT NULL DEFAULT 0 CHECK (item_discount_paise >= 0),
  coupon_id                    uuid REFERENCES coupons(id),
  coupon_code                  text,
  coupon_discount_paise        bigint NOT NULL DEFAULT 0 CHECK (coupon_discount_paise >= 0),
  delivery_fee_paise           bigint NOT NULL DEFAULT 0 CHECK (delivery_fee_paise >= 0),
  packaging_fee_paise          bigint NOT NULL DEFAULT 0 CHECK (packaging_fee_paise >= 0),
  tax_paise                    bigint NOT NULL DEFAULT 0 CHECK (tax_paise >= 0),
  tax_label                    text,
  platform_fee_paise           bigint NOT NULL DEFAULT 0 CHECK (platform_fee_paise >= 0),
  total_paise                  bigint NOT NULL CHECK (total_paise >= 0),
  estimated_delivery_minutes   integer,
  accept_window_seconds        integer NOT NULL DEFAULT 300,
  accept_deadline_at           timestamptz,
  accepted_at                  timestamptz,
  assigned_runner_id           uuid REFERENCES seller_runners(id) ON DELETE SET NULL,
  assigned_delivery_partner_id uuid REFERENCES delivery_partners(id) ON DELETE SET NULL,
  assigned_runner_name         text,                         -- snapshot shown to the customer
  assigned_runner_phone        text,
  cancelled_by                 text CHECK (cancelled_by IN ('CUSTOMER','SELLER','ADMIN')),
  cancellation_reason          text,
  cancellation_notes           text,
  cancelled_at                 timestamptz,
  cancellation_refund_eligible boolean,
  created_at                   timestamptz NOT NULL DEFAULT now(),
  updated_at                   timestamptz NOT NULL DEFAULT now(),
  CHECK (fulfilment_mode = 'PICKUP' OR delivery_address_snapshot IS NOT NULL),
  CHECK (status <> 'cancelled' OR cancelled_by IS NOT NULL),
  -- Assumption: tax is added on top. Drop tax_paise from this formula if prices are GST-inclusive.
  CHECK (total_paise = item_subtotal_paise - item_discount_paise - coupon_discount_paise
                       + delivery_fee_paise + packaging_fee_paise + tax_paise + platform_fee_paise)
);

CREATE TABLE order_items (
  id                   uuid PRIMARY KEY DEFAULT uuidv7(),
  order_id             uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id           uuid REFERENCES products(id) ON DELETE SET NULL,
  variant_id           uuid REFERENCES product_variants(id) ON DELETE SET NULL,
  product_name         text NOT NULL,              -- snapshot fields below survive product edits
  catalogue_type       text NOT NULL,
  sku                  text,
  variant_label        text,
  variant_attributes   jsonb,
  selected_options     jsonb NOT NULL DEFAULT '[]', -- [{groupName, optionLabel, priceDeltaPaise}]
  unit_price_paise     bigint NOT NULL CHECK (unit_price_paise >= 0),
  mrp_unit_price_paise bigint,
  item_discount_paise  bigint NOT NULL DEFAULT 0 CHECK (item_discount_paise >= 0),
  requested_quantity   numeric(12,3) NOT NULL CHECK (requested_quantity > 0),
  requested_unit_label text NOT NULL,              -- '1 kg', 'Full Plate', '1 pav (250g)'
  line_total_paise     bigint NOT NULL CHECK (line_total_paise >= 0),
  returned_quantity    numeric(12,3) NOT NULL DEFAULT 0 CHECK (returned_quantity >= 0),
  customer_note        text,
  CHECK (returned_quantity <= requested_quantity)
);

CREATE TABLE order_status_events (            -- Order.statusHistory
  id            bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  order_id      uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  from_status   text,                          -- NULL for the creation event
  to_status     text NOT NULL,
  actor_role    text NOT NULL CHECK (actor_role IN ('CUSTOMER','SELLER','ADMIN','SYSTEM')),
  actor_user_id uuid REFERENCES users(id),
  reason        text,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE seller_order_notifications (     -- SellerOrderNotification; display fields come from the order
  id         uuid PRIMARY KEY DEFAULT uuidv7(),
  seller_id  uuid NOT NULL REFERENCES sellers(id) ON DELETE CASCADE,
  order_id   uuid NOT NULL UNIQUE REFERENCES orders(id) ON DELETE CASCADE,
  read_at    timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE order_returns (
  id               uuid PRIMARY KEY DEFAULT uuidv7(),
  return_reference text NOT NULL UNIQUE,
  order_id         uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  status           text NOT NULL CHECK (status IN ('REQUESTED','APPROVED','PICKED_UP','RECEIVED','REJECTED')),
  reason           text NOT NULL,
  notes            text,
  requested_at     timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE order_return_items (
  return_id          uuid NOT NULL REFERENCES order_returns(id) ON DELETE CASCADE,
  order_item_id      uuid NOT NULL REFERENCES order_items(id),
  quantity           numeric(12,3) NOT NULL CHECK (quantity > 0),
  unit_label         text NOT NULL,
  refund_value_paise bigint NOT NULL CHECK (refund_value_paise >= 0),
  condition_note     text,
  PRIMARY KEY (return_id, order_item_id)
);


-- ---------------------------------------------------------------------
-- H. Payments, support, refunds, payouts
-- ---------------------------------------------------------------------
CREATE TABLE payment_transactions (
  id                 uuid PRIMARY KEY DEFAULT uuidv7(),
  order_id           uuid NOT NULL REFERENCES orders(id),
  method             text NOT NULL CHECK (method IN ('COD','SELLER_UPI','UDHAR')),  -- same vocabulary as orders
  amount_paise       bigint NOT NULL CHECK (amount_paise >= 0),
  gateway_ref        text,
  status             text NOT NULL CHECK (status IN ('PENDING_COD','CAPTURED','REFUNDED','FAILED')),
  failure_reason     text,
  platform_fee_paise bigint NOT NULL DEFAULT 0,
  created_at         timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE support_cases (
  id                    uuid PRIMARY KEY DEFAULT uuidv7(),
  order_id              uuid NOT NULL REFERENCES orders(id),
  customer_id           uuid NOT NULL REFERENCES users(id),
  seller_id             uuid NOT NULL REFERENCES sellers(id),
  vertical_id           text REFERENCES verticals(id),
  issue_type            text NOT NULL CHECK (issue_type IN ('FOOD_QUALITY','MISSING_ITEM','DELIVERY_DELAY',
                          'PAYMENT_ISSUE','DEFECTIVE_PRODUCT','WRONG_VARIANT','DAMAGED_IN_TRANSIT',
                          'WARRANTY_CLAIM','UDHARI_DISPUTE','OTHER')),
  status                text NOT NULL DEFAULT 'OPEN' CHECK (status IN
                          ('OPEN','INVESTIGATING','REFUND_APPROVED','RESOLVED','CLOSED')),
  amount_paise          bigint NOT NULL DEFAULT 0 CHECK (amount_paise >= 0),
  approved_refund_paise bigint CHECK (approved_refund_paise >= 0),
  description           text NOT NULL,
  resolution_notes      text,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE refunds (                        -- unifies OrderRefundInfo + RefundLedgerRecord
  id                     uuid PRIMARY KEY DEFAULT uuidv7(),
  refund_reference       text NOT NULL UNIQUE,                  -- 'RFD-2026-...'
  order_id               uuid NOT NULL REFERENCES orders(id),
  payment_transaction_id uuid REFERENCES payment_transactions(id),
  support_case_id        uuid REFERENCES support_cases(id),
  amount_paise           bigint NOT NULL CHECK (amount_paise > 0),
  method                 text NOT NULL CHECK (method IN
                           ('ORIGINAL_UPI','BANK_TRANSFER','UDHAR_REVERSAL','CASH_SETTLEMENT','STORE_CREDIT')),
  status                 text NOT NULL DEFAULT 'INITIATED' CHECK (status IN
                           ('INITIATED','PROCESSING','COMPLETED','FAILED','REJECTED')),   -- open question
  reason                 text NOT NULL,
  failure_reason         text,
  rejection_reason       text,
  reference_id           text,                                  -- UTR / UPI reference
  initiated_by           uuid REFERENCES users(id),
  initiated_at           timestamptz NOT NULL DEFAULT now(),
  completed_at           timestamptz,
  CHECK (status <> 'COMPLETED' OR completed_at IS NOT NULL)
);

CREATE TABLE seller_payouts (
  id                      uuid PRIMARY KEY DEFAULT uuidv7(),
  seller_id               uuid NOT NULL REFERENCES sellers(id),
  period_start            date NOT NULL,
  period_end              date NOT NULL,
  period_label            text NOT NULL,
  gross_amount_paise      bigint NOT NULL CHECK (gross_amount_paise >= 0),
  commission_paise        bigint NOT NULL DEFAULT 0,
  refund_deductions_paise bigint NOT NULL DEFAULT 0,
  other_deductions_paise  bigint NOT NULL DEFAULT 0,
  platform_fee_paise      bigint NOT NULL DEFAULT 0,
  net_payable_paise       bigint NOT NULL,
  payment_mode            text NOT NULL CHECK (payment_mode IN ('UPI','NEFT_IMPS','CASH_SETTLEMENT')),
  utr_number              text,
  status                  text NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING','PROCESSING','SETTLED','FAILED')),
  settlement_date         date,
  settled_at              timestamptz,
  notes                   text,
  created_at              timestamptz NOT NULL DEFAULT now(),
  UNIQUE (seller_id, period_start, period_end),
  CHECK (period_end >= period_start)
);

CREATE TABLE payout_orders (                  -- SellerPayoutRecord.includedOrderIds
  payout_id uuid NOT NULL REFERENCES seller_payouts(id) ON DELETE CASCADE,
  order_id  uuid NOT NULL UNIQUE REFERENCES orders(id),   -- an order is paid out at most once
  PRIMARY KEY (payout_id, order_id)
);


-- ---------------------------------------------------------------------
-- I. Udhari (customer credit)
-- ---------------------------------------------------------------------
CREATE TABLE credit_accounts (                -- CustomerCreditProfile
  id                        uuid PRIMARY KEY DEFAULT uuidv7(),
  seller_id                 uuid NOT NULL REFERENCES sellers(id),
  customer_id               uuid NOT NULL REFERENCES users(id),
  status                    text NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE','DISABLED','BLOCKED')),
  credit_limit_paise        bigint NOT NULL CHECK (credit_limit_paise >= 0),
  outstanding_balance_paise bigint NOT NULL DEFAULT 0 CHECK (outstanding_balance_paise >= 0),
  available_credit_paise    bigint GENERATED ALWAYS AS
                              (GREATEST(credit_limit_paise - outstanding_balance_paise, 0)) STORED,
  due_days                  integer NOT NULL DEFAULT 15 CHECK (due_days > 0),
  last_payment_at           timestamptz,
  internal_note             text,
  created_at                timestamptz NOT NULL DEFAULT now(),
  updated_at                timestamptz NOT NULL DEFAULT now(),
  UNIQUE (seller_id, customer_id)
);

CREATE TABLE credit_repayments (
  id                  uuid PRIMARY KEY DEFAULT uuidv7(),
  repayment_reference text NOT NULL UNIQUE,     -- 'REC-2026-...'
  credit_account_id   uuid NOT NULL REFERENCES credit_accounts(id),
  amount_paise        bigint NOT NULL CHECK (amount_paise > 0),
  method              text NOT NULL CHECK (method IN ('CASH','SELLER_UPI_DIRECT','BANK_TRANSFER','OTHER')),
  reference_number    text,
  note                text,
  received_at         timestamptz NOT NULL DEFAULT now(),
  recorded_by         uuid REFERENCES users(id)
);

CREATE TABLE credit_ledger_entries (          -- append-only; corrections are reversal entries
  id                    uuid PRIMARY KEY DEFAULT uuidv7(),
  ledger_reference      text NOT NULL UNIQUE,   -- 'LED-2026-...'
  credit_account_id     uuid NOT NULL REFERENCES credit_accounts(id),
  order_id              uuid REFERENCES orders(id),             -- real FK (code stores orderNumber today)
  repayment_id          uuid REFERENCES credit_repayments(id),
  reverses_entry_id     uuid REFERENCES credit_ledger_entries(id),
  entry_type            text NOT NULL CHECK (entry_type IN ('CREDIT_SALE','REPAYMENT','SALE_REVERSAL',
                          'REPAYMENT_REVERSAL','ADJUSTMENT_INCREASE','ADJUSTMENT_DECREASE')),
  direction             text NOT NULL CHECK (direction IN ('INCREASES_OWED','DECREASES_OWED')),
  amount_paise          bigint NOT NULL CHECK (amount_paise > 0),
  running_balance_paise bigint NOT NULL CHECK (running_balance_paise >= 0),
  due_date              date,
  status                text NOT NULL DEFAULT 'POSTED' CHECK (status IN ('POSTED','REVERSED','DISPUTED')),
  reason                text,
  recorded_by           uuid REFERENCES users(id),
  recorded_by_label     text NOT NULL,          -- 'Order Checkout Engine', shop name
  posted_at             timestamptz NOT NULL DEFAULT now(),
  CHECK ((entry_type IN ('CREDIT_SALE','REPAYMENT_REVERSAL','ADJUSTMENT_INCREASE'))
         = (direction = 'INCREASES_OWED')),
  CHECK (entry_type <> 'CREDIT_SALE' OR (order_id IS NOT NULL AND due_date IS NOT NULL)),
  CHECK (entry_type <> 'REPAYMENT'   OR repayment_id IS NOT NULL)
);

CREATE TABLE credit_disputes (
  id              uuid PRIMARY KEY DEFAULT uuidv7(),
  ledger_entry_id uuid NOT NULL REFERENCES credit_ledger_entries(id),
  reason_code     text NOT NULL CHECK (reason_code IN ('WRONG_AMOUNT','PAYMENT_NOT_RECORDED','ORDER_CANCELLED','OTHER')),
  description     text NOT NULL,
  status          text NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN','UNDER_REVIEW','RESOLVED','REJECTED')),
  resolution_note text,
  opened_by       uuid REFERENCES users(id),
  resolved_by     uuid REFERENCES users(id),
  opened_at       timestamptz NOT NULL DEFAULT now(),
  resolved_at     timestamptz,
  CHECK (status NOT IN ('RESOLVED','REJECTED') OR resolved_at IS NOT NULL)
);


-- ---------------------------------------------------------------------
-- J. Seller safety & quality
--    Training content stays in src/constants/safetyData.ts for now
--    (module_id / checked_item_ids are ids from that file).
-- ---------------------------------------------------------------------
CREATE TABLE seller_safety_profiles (
  seller_id               uuid PRIMARY KEY REFERENCES sellers(id) ON DELETE CASCADE,
  track                   text NOT NULL CHECK (track IN ('FOOD','GROCERY')),
  retraining_required     boolean NOT NULL DEFAULT false,
  retraining_reason       text,
  suspended_for_safety    boolean NOT NULL DEFAULT false,
  certificate_number      text UNIQUE,
  certified_at            timestamptz,
  certificate_valid_until timestamptz
);

CREATE TABLE safety_module_completions (
  seller_id    uuid NOT NULL REFERENCES sellers(id) ON DELETE CASCADE,
  module_id    text NOT NULL,                  -- SafetyTrainingModule.id
  completed_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (seller_id, module_id)
);

CREATE TABLE safety_checklist_submissions (
  id                       uuid PRIMARY KEY DEFAULT uuidv7(),
  seller_id                uuid NOT NULL REFERENCES sellers(id) ON DELETE CASCADE,
  date_key                 date NOT NULL,
  track                    text NOT NULL CHECK (track IN ('FOOD','GROCERY')),
  checked_item_ids         text[] NOT NULL DEFAULT '{}',
  score_percent            smallint NOT NULL CHECK (score_percent BETWEEN 0 AND 100),
  completed_critical_count smallint NOT NULL,
  total_critical_count     smallint NOT NULL,
  notes                    text,
  submitted_at             timestamptz NOT NULL DEFAULT now(),
  UNIQUE (seller_id, date_key),                -- resubmission replaces => upsert
  CHECK (completed_critical_count BETWEEN 0 AND total_critical_count)
);

CREATE TABLE safety_exam_attempts (
  id                 uuid PRIMARY KEY DEFAULT uuidv7(),
  seller_id          uuid NOT NULL REFERENCES sellers(id) ON DELETE CASCADE,
  track              text NOT NULL CHECK (track IN ('FOOD','GROCERY')),
  score_percent      smallint NOT NULL CHECK (score_percent BETWEEN 0 AND 100),
  correct_count      smallint NOT NULL CHECK (correct_count >= 0),
  total_questions    smallint NOT NULL CHECK (total_questions > 0),
  passed             boolean NOT NULL,
  time_taken_seconds integer NOT NULL CHECK (time_taken_seconds >= 0),
  weak_topics        text[] NOT NULL DEFAULT '{}',
  answers            jsonb NOT NULL,           -- {questionId: chosenIndex}
  submitted_at       timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE safety_inspections (
  id                uuid PRIMARY KEY DEFAULT uuidv7(),
  seller_id         uuid NOT NULL REFERENCES sellers(id) ON DELETE CASCADE,
  inspector_user_id uuid REFERENCES users(id),
  inspector_name    text NOT NULL,
  score_percent     smallint NOT NULL CHECK (score_percent BETWEEN 0 AND 100),
  outcome           text NOT NULL CHECK (outcome IN ('PASSED','RETRAINING_REQUIRED','WARNING_ISSUED')),
  remarks           text NOT NULL,
  findings          text[] NOT NULL DEFAULT '{}',
  inspected_at      timestamptz NOT NULL DEFAULT now()
);


-- ---------------------------------------------------------------------
-- K. Reviews, CMS, broadcasts, settings, audit
-- ---------------------------------------------------------------------
CREATE TABLE reviews (
  id               uuid PRIMARY KEY DEFAULT uuidv7(),
  order_id         uuid NOT NULL UNIQUE REFERENCES orders(id),   -- assumption: one review per order
  customer_id      uuid NOT NULL REFERENCES users(id),
  seller_id        uuid NOT NULL REFERENCES sellers(id),
  rating           smallint NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment          text,
  status           text NOT NULL DEFAULT 'PUBLISHED' CHECK (status IN ('PUBLISHED','FLAGGED','HIDDEN')),
                                             -- admin "delete review" sets HIDDEN; no deleted_at
  flag_reason      text,
  moderation_notes text,
  created_at       timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE cms_banners (
  id                 uuid PRIMARY KEY DEFAULT uuidv7(),
  title              text NOT NULL,
  subtitle           text,
  placement          text NOT NULL CHECK (placement IN ('HERO_CAROUSEL','MID_PROMO','FESTIVAL_STRIP')),
  target_vertical_id text REFERENCES verticals(id),       -- NULL = ALL
  target_village_id  uuid REFERENCES villages(id),        -- NULL = ALL
  cta_label          text,
  accent_color       text,
  valid_from         timestamptz NOT NULL,
  valid_until        timestamptz NOT NULL,
  priority           integer NOT NULL DEFAULT 0,
  is_active          boolean NOT NULL DEFAULT true,
  CHECK (valid_until > valid_from)
);

CREATE TABLE featured_sellers (
  seller_id  uuid PRIMARY KEY REFERENCES sellers(id) ON DELETE CASCADE,
  sort_order integer NOT NULL DEFAULT 0
);

CREATE TABLE cms_policy_pages (
  id         uuid PRIMARY KEY DEFAULT uuidv7(),
  slug       text NOT NULL CHECK (slug IN ('terms','privacy','refund','seller-policy')),
  version    text NOT NULL,
  title      text NOT NULL,
  summary    text,
  content    text NOT NULL,
  updated_by uuid REFERENCES users(id),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (slug, version)
);

CREATE TABLE broadcasts (
  id                uuid PRIMARY KEY DEFAULT uuidv7(),
  title             text NOT NULL,
  message           text NOT NULL,
  channel           text NOT NULL CHECK (channel IN ('APP_PUSH','WHATSAPP','SMS','ALL')),
  audience          text NOT NULL CHECK (audience IN ('ALL_CUSTOMERS','ALL_SELLERS','VILLAGE_CUSTOMERS','VILLAGE_SELLERS')),
  target_village_id uuid REFERENCES villages(id),          -- code stores a village *name*
  priority          text NOT NULL DEFAULT 'NORMAL' CHECK (priority IN ('NORMAL','FESTIVE','URGENT_ALERT')),
  estimated_reach   integer NOT NULL DEFAULT 0,
  delivered_count   integer NOT NULL DEFAULT 0,
  status            text NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT','SCHEDULED','SENT')),
  scheduled_for     timestamptz,
  sent_at           timestamptz,
  created_by        uuid REFERENCES users(id),
  created_at        timestamptz NOT NULL DEFAULT now(),
  deleted_at        timestamptz,              -- DRAFT may be hard-deleted; SENT/SCHEDULED are soft-deleted
  CHECK (audience NOT LIKE 'VILLAGE_%' OR target_village_id IS NOT NULL),
  CHECK (status <> 'SCHEDULED' OR scheduled_for IS NOT NULL),
  CHECK (status <> 'SENT' OR sent_at IS NOT NULL)
);

CREATE TABLE platform_settings (              -- exactly one row
  id                           boolean PRIMARY KEY DEFAULT true CHECK (id),
  platform_name                text NOT NULL,
  tagline                      text,
  support_phone                text,
  whatsapp_support             text,
  default_delivery_enabled     boolean NOT NULL DEFAULT true,
  default_pickup_enabled       boolean NOT NULL DEFAULT false,
  allow_multi_vertical_sellers boolean NOT NULL DEFAULT false,
  auto_cancel_unaccepted_mins  integer NOT NULL,
  food_prep_sla_mins           integer NOT NULL,
  maintenance_mode             boolean NOT NULL DEFAULT false,
  maintenance_message          text,
  updated_at                   timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE audit_logs (                     -- also holds refund/payout/KYC-doc/seller-activity history
  id            bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  actor_user_id uuid REFERENCES users(id),
  actor_label   text NOT NULL,
  actor_role    text NOT NULL,                 -- AdminRole | 'SELLER' | 'CUSTOMER' | 'SYSTEM'
  action_type   text NOT NULL,                 -- 'STORE_SUSPENDED', 'REFUND_STATUS_CHANGED', ...
  target_entity text NOT NULL,                 -- 'Seller', 'Refund', 'KycDocument', ...
  target_id     text NOT NULL,
  ip_address    inet,
  details       text NOT NULL,
  reason        text,
  metadata      jsonb,
  created_at    timestamptz NOT NULL DEFAULT now()
);
