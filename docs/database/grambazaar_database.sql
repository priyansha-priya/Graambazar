-- ============================================================================
-- GramBazaar Marketplace — Complete PostgreSQL Database Schema Export
-- Target Database: PostgreSQL 16+ / Neon PostgreSQL (Serverless Postgres)
-- Source Audit: docs/database/ (er-diagram.dbml, database-design.md,
--               data-dictionary.md, table-relationships.md,
--               indexes-and-constraints.md)
-- Coverage: 13 Domains | 55 ENUM Types | 74 Tables | All Constraints & Indexes
-- Execution Order: Topologically sorted by foreign-key dependency levels
--                  (Level 0 -> Level 7) for zero-error import into Neon.
-- ============================================================================

BEGIN;

-- Ensure pgcrypto is available (gen_random_uuid() is native in PG 13+/Neon)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============================================================================
-- SECTION 1: POSTGRESQL ENUM TYPES (55 ENUMS)
-- ============================================================================

-- Domain 1: Identity, Auth & RBAC
CREATE TYPE user_status AS ENUM (
  'ACTIVE',
  'BLOCKED',
  'SUSPENDED',
  'INACTIVE'
);

CREATE TYPE role_code AS ENUM (
  'CUSTOMER',
  'SELLER_OWNER',
  'SELLER_STAFF',
  'SELLER_RUNNER',
  'DELIVERY_PARTNER',
  'SUPER_ADMIN',
  'ADMIN_OPS',
  'ADMIN_FINANCE',
  'ADMIN_SUPPORT'
);

CREATE TYPE auth_token_type AS ENUM (
  'REFRESH_SESSION',
  'PASSWORD_RESET',
  'PHONE_OTP',
  'EMAIL_VERIFY'
);

-- Domain 2: Geography & Rural Addresses
CREATE TYPE address_label AS ENUM (
  'HOME',
  'WORK',
  'OTHER'
);

-- Domain 3: Verticals, Sellers, KYC & Shop Staff
CREATE TYPE vertical_workflow_type AS ENUM (
  'FOOD_KITCHEN',
  'GROCERY_WEIGHT',
  'PHYSICAL_RETAIL',
  'MADE_TO_ORDER'
);

-- Food category is restricted to RESTAURANT, HOTEL, DHABA, BAKERY (no tiffin services)
CREATE TYPE seller_business_type AS ENUM (
  'RESTAURANT',
  'HOTEL',
  'DHABA',
  'BAKERY',
  'KIRANA',
  'GENERAL_STORE',
  'HARDWARE_STORE',
  'ELECTRONICS_DEALER',
  'CLOTHING_STORE',
  'FURNITURE_SHOP',
  'AGRI_KENDRA',
  'MULTI_CATEGORY'
);

CREATE TYPE seller_account_status AS ENUM (
  'DRAFT',
  'PENDING_APPROVAL',
  'KYC_PENDING',
  'KYC_UNDER_REVIEW',
  'APPROVED',
  'ACTIVE',
  'INACTIVE',
  'PAUSED',
  'SUSPENDED',
  'REJECTED'
);

CREATE TYPE kyc_status AS ENUM (
  'PENDING',
  'UNDER_REVIEW',
  'APPROVED',
  'REJECTED',
  'CHANGES_REQUESTED'
);

CREATE TYPE kyc_doc_code AS ENUM (
  'FSSAI',
  'AADHAAR',
  'PAN',
  'STORE_PHOTO',
  'GST_TRADE',
  'AGRI_LICENSE'
);

CREATE TYPE seller_staff_role AS ENUM (
  'MANAGER',
  'CASHIER',
  'SHOP_RUNNER',
  'DELIVERY_STAFF',
  'FAMILY_HELPER'
);

-- Domain 4: Universal Product Catalog & 8 Centralized Masters
CREATE TYPE unit_family AS ENUM (
  'WEIGHT',
  'VOLUME',
  'LENGTH',
  'COUNT',
  'PORTION',
  'BULK_PACK',
  'AREA'
);

CREATE TYPE attribute_data_type AS ENUM (
  'TEXT',
  'NUMBER',
  'SELECT',
  'MULTI_SELECT',
  'BOOLEAN',
  'DIMENSIONS'
);

CREATE TYPE selection_type AS ENUM (
  'SINGLE',
  'MULTIPLE'
);

CREATE TYPE diet_type AS ENUM (
  'VEG',
  'NON_VEG',
  'EGG'
);

CREATE TYPE packaging_material_type AS ENUM (
  'FOOD_CONTAINER',
  'THERMAL_BOX',
  'ECO_BAG',
  'SEALED_POUCH',
  'BOTTLE_JAR',
  'CORRUGATED_CARTON'
);

CREATE TYPE availability_workflow_mode AS ENUM (
  'TRACKED_INVENTORY',
  'DAILY_PREP_SLOTS',
  'MADE_TO_ORDER',
  'UNLIMITED_SERVICE'
);

-- Domain 5: Seller Listings & Kirana Inventory
CREATE TYPE inventory_mode AS ENUM (
  'QUANTITY_STOCK',
  'WEIGHT_STOCK',
  'VARIANT_STOCK',
  'PREPARED_FOOD',
  'MADE_TO_ORDER'
);

CREATE TYPE quantity_mode AS ENUM (
  'FIXED_PACK',
  'PREDEFINED_OPTIONS',
  'CUSTOM_QUANTITY'
);

CREATE TYPE moderation_status AS ENUM (
  'PENDING_REVIEW',
  'APPROVED',
  'REJECTED',
  'CHANGES_REQUESTED'
);

CREATE TYPE stock_movement_type AS ENUM (
  'INITIAL_STOCK',
  'ORDER_RESERVED',
  'ORDER_DEDUCTED',
  'ORDER_CANCELLED_RESTORE',
  'RETURN_RESTOCK',
  'MANUAL_RESTOCK',
  'BULK_UPDATE',
  'DAMAGE_WRITE_OFF',
  'EXPIRY_WRITE_OFF',
  'AUDIT_ADJUSTMENT'
);

-- Domain 6 & 7: Cart, Orders, Cancellations & Returns
CREATE TYPE fulfilment_mode AS ENUM (
  'DELIVERY',
  'PICKUP'
);

CREATE TYPE order_status AS ENUM (
  'PLACED',
  'PENDING',
  'ACCEPTED',
  'PREPARING',
  'READY_FOR_PICKUP',
  'READY_FOR_DELIVERY',
  'OUT_FOR_DELIVERY',
  'COMPLETED',
  'REJECTED',
  'CANCELLED',
  'DELIVERY_FAILED',
  'RETURNED',
  'REFUNDED'
);

CREATE TYPE payment_method AS ENUM (
  'COD',
  'SELLER_UPI',
  'PLATFORM_UPI',
  'UDHAR'
);

CREATE TYPE payment_status AS ENUM (
  'PENDING',
  'COLLECTED',
  'SETTLED',
  'REVERSED',
  'REFUNDED',
  'PARTIALLY_REFUNDED',
  'FAILED'
);

CREATE TYPE payment_tx_status AS ENUM (
  'INITIATED',
  'CAPTURED',
  'PENDING_COD',
  'FAILED',
  'REVERSED',
  'REFUNDED'
);

CREATE TYPE cancelled_by_actor AS ENUM (
  'CUSTOMER',
  'SELLER',
  'ADMIN',
  'SYSTEM'
);

CREATE TYPE return_status AS ENUM (
  'REQUESTED',
  'APPROVED',
  'PICKED_UP',
  'RECEIVED',
  'REJECTED'
);

CREATE TYPE refund_status AS ENUM (
  'INITIATED',
  'PROCESSING',
  'PROCESSED',
  'FAILED',
  'REJECTED'
);

CREATE TYPE refund_channel AS ENUM (
  'ORIGINAL_UPI',
  'BANK_TRANSFER',
  'UDHAR_REVERSAL',
  'CASH_SETTLEMENT',
  'STORE_CREDIT'
);

-- Domain 8: Delivery Fleet & Pickup
CREATE TYPE delivery_fulfilment_type AS ENUM (
  'SELLER_RUNNER',
  'PLATFORM_PARTNER',
  'CUSTOMER_PICKUP'
);

CREATE TYPE delivery_status AS ENUM (
  'UNASSIGNED',
  'ASSIGNED',
  'PICKED_UP',
  'OUT_FOR_DELIVERY',
  'DELIVERED',
  'READY_FOR_PICKUP',
  'PICKED_UP_BY_CUSTOMER',
  'FAILED'
);

CREATE TYPE vehicle_type AS ENUM (
  'CYCLE',
  'BIKE',
  'E_RICKSHAW'
);

CREATE TYPE delivery_partner_status AS ENUM (
  'AVAILABLE',
  'ON_DELIVERY',
  'OFFLINE',
  'SUSPENDED'
);

-- Domain 9: Settlements
CREATE TYPE settlement_status AS ENUM (
  'PENDING',
  'PROCESSING',
  'SETTLED',
  'FAILED'
);

CREATE TYPE settlement_payment_mode AS ENUM (
  'UPI',
  'NEFT_IMPS',
  'CASH_SETTLEMENT'
);

-- Domain 10: Seller-Managed Udhari (Rural Credit)
CREATE TYPE credit_profile_status AS ENUM (
  'ACTIVE',
  'DISABLED',
  'BLOCKED'
);

CREATE TYPE credit_entry_type AS ENUM (
  'CREDIT_SALE',
  'REPAYMENT',
  'SALE_REVERSAL',
  'REPAYMENT_REVERSAL',
  'ADJUSTMENT_INCREASE',
  'ADJUSTMENT_DECREASE'
);

CREATE TYPE credit_entry_direction AS ENUM (
  'INCREASES_OWED',
  'DECREASES_OWED'
);

CREATE TYPE credit_entry_status AS ENUM (
  'POSTED',
  'REVERSED',
  'DISPUTED'
);

CREATE TYPE repayment_method AS ENUM (
  'CASH',
  'SELLER_UPI_DIRECT',
  'BANK_TRANSFER',
  'OTHER'
);

CREATE TYPE credit_dispute_reason AS ENUM (
  'WRONG_AMOUNT',
  'PAYMENT_NOT_RECORDED',
  'ORDER_CANCELLED',
  'OTHER'
);

CREATE TYPE credit_dispute_status AS ENUM (
  'OPEN',
  'UNDER_REVIEW',
  'RESOLVED',
  'REJECTED'
);

-- Domain 11: Offers, Reviews & Support
CREATE TYPE discount_type AS ENUM (
  'FLAT',
  'PERCENTAGE',
  'FREE_DELIVERY'
);

CREATE TYPE offer_funding_source AS ENUM (
  'PLATFORM',
  'SELLER'
);

CREATE TYPE review_status AS ENUM (
  'PUBLISHED',
  'FLAGGED',
  'HIDDEN'
);

CREATE TYPE support_issue_type AS ENUM (
  'FOOD_QUALITY',
  'MISSING_ITEM',
  'DELIVERY_DELAY',
  'PAYMENT_ISSUE',
  'DEFECTIVE_PRODUCT',
  'WRONG_VARIANT',
  'DAMAGED_IN_TRANSIT',
  'WARRANTY_CLAIM',
  'UDHARI_DISPUTE',
  'OTHER'
);

CREATE TYPE support_case_status AS ENUM (
  'OPEN',
  'INVESTIGATING',
  'REFUND_APPROVED',
  'RESOLVED',
  'CLOSED'
);

-- Domain 12: Food & Grocery Seller Safety, Quality & Assessment
CREATE TYPE safety_track AS ENUM (
  'FOOD',
  'GROCERY'
);

CREATE TYPE certification_badge_level AS ENUM (
  'GOLD_CERTIFIED',
  'VERIFIED_SAFE',
  'IN_PROGRESS',
  'ACTION_REQUIRED'
);

CREATE TYPE inspection_outcome AS ENUM (
  'PASSED',
  'RETRAINING_REQUIRED',
  'WARNING_ISSUED'
);

-- Domain 13: Notifications, Broadcasts & CMS
CREATE TYPE notification_channel AS ENUM (
  'IN_APP',
  'APP_PUSH',
  'WHATSAPP',
  'SMS'
);

CREATE TYPE broadcast_audience AS ENUM (
  'ALL_CUSTOMERS',
  'ALL_SELLERS',
  'VILLAGE_CUSTOMERS',
  'VILLAGE_SELLERS'
);

CREATE TYPE broadcast_priority AS ENUM (
  'NORMAL',
  'FESTIVE',
  'URGENT_ALERT'
);

CREATE TYPE broadcast_status AS ENUM (
  'DRAFT',
  'SCHEDULED',
  'SENT',
  'FAILED'
);

CREATE TYPE banner_placement AS ENUM (
  'HERO_CAROUSEL',
  'MID_PROMO',
  'FESTIVAL_STRIP'
);

-- ============================================================================
-- SECTION 2: TABLES (74 TABLES IN STRICT FOREIGN-KEY DEPENDENCY ORDER)
-- ============================================================================

-- ----------------------------------------------------------------------------
-- DEPENDENCY LEVEL 0: Root Tables (No Foreign Key Dependencies)
-- ----------------------------------------------------------------------------

-- 1. villages
CREATE TABLE villages (
  id                      UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  code                    VARCHAR(40)   NOT NULL UNIQUE,
  name                    VARCHAR(120)  NOT NULL,
  hindi_name              VARCHAR(120),
  district                VARCHAR(100)  NOT NULL,
  state                   VARCHAR(100)  NOT NULL,
  postal_codes            TEXT[]        NOT NULL DEFAULT '{}'::text[],
  base_delivery_fee       NUMERIC(12,2) NOT NULL DEFAULT 0.00,
  min_order_free_delivery NUMERIC(12,2) NOT NULL DEFAULT 0.00,
  latitude                NUMERIC(9,6),
  longitude               NUMERIC(9,6),
  is_active               BOOLEAN       NOT NULL DEFAULT TRUE,
  created_at              TIMESTAMPTZ   NOT NULL DEFAULT now(),
  updated_at              TIMESTAMPTZ   NOT NULL DEFAULT now(),
  CONSTRAINT uq_villages_name_district_state UNIQUE (name, district, state),
  CONSTRAINT chk_villages_fees_non_neg CHECK (base_delivery_fee >= 0 AND min_order_free_delivery >= 0)
);

-- 2. roles
CREATE TABLE roles (
  id          UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  code        role_code    NOT NULL UNIQUE,
  name        VARCHAR(80)  NOT NULL,
  description TEXT,
  is_system   BOOLEAN      NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- 3. verticals
CREATE TABLE verticals (
  id                   UUID                   PRIMARY KEY DEFAULT gen_random_uuid(),
  code                 VARCHAR(40)            NOT NULL UNIQUE,
  name                 VARCHAR(100)           NOT NULL,
  hindi_name           VARCHAR(100),
  icon                 VARCHAR(60),
  description          TEXT,
  fulfillment_workflow vertical_workflow_type NOT NULL,
  required_kyc_docs    kyc_doc_code[]         NOT NULL DEFAULT '{}'::kyc_doc_code[],
  special_rules        TEXT[]                 NOT NULL DEFAULT '{}'::text[],
  is_enabled           BOOLEAN                NOT NULL DEFAULT TRUE,
  sort_order           INTEGER                NOT NULL DEFAULT 0,
  created_at           TIMESTAMPTZ            NOT NULL DEFAULT now(),
  updated_at           TIMESTAMPTZ            NOT NULL DEFAULT now()
);

-- 4. brands
CREATE TABLE brands (
  id           UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  code         VARCHAR(40)  UNIQUE,
  name         VARCHAR(120) NOT NULL UNIQUE,
  manufacturer VARCHAR(160),
  description  TEXT,
  is_verified  BOOLEAN      NOT NULL DEFAULT FALSE,
  is_active    BOOLEAN      NOT NULL DEFAULT TRUE,
  created_at   TIMESTAMPTZ  NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- 5. units
CREATE TABLE units (
  id                          UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  name                        VARCHAR(80)   NOT NULL,
  hindi_name                  VARCHAR(80),
  symbol                      VARCHAR(20)   NOT NULL UNIQUE,
  family                      unit_family   NOT NULL,
  base_unit                   VARCHAR(20),
  conversion_factor           NUMERIC(12,4),
  allow_decimal               BOOLEAN       NOT NULL DEFAULT FALSE,
  allow_seller_local_override BOOLEAN       NOT NULL DEFAULT FALSE,
  is_active                   BOOLEAN       NOT NULL DEFAULT TRUE,
  created_at                  TIMESTAMPTZ   NOT NULL DEFAULT now()
);

-- 6. attributes
CREATE TABLE attributes (
  id              UUID                PRIMARY KEY DEFAULT gen_random_uuid(),
  name            VARCHAR(100)        NOT NULL,
  hindi_name      VARCHAR(100),
  slug            VARCHAR(120)        NOT NULL UNIQUE,
  data_type       attribute_data_type NOT NULL,
  allowed_options JSONB,
  unit_suffix     VARCHAR(20),
  is_required     BOOLEAN             NOT NULL DEFAULT FALSE,
  is_filterable   BOOLEAN             NOT NULL DEFAULT TRUE,
  is_variant_axis BOOLEAN             NOT NULL DEFAULT FALSE,
  is_active       BOOLEAN             NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ         NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ         NOT NULL DEFAULT now()
);

-- 7. safety_training_modules
CREATE TABLE safety_training_modules (
  id                     UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  track                  safety_track NOT NULL,
  module_number          INTEGER      NOT NULL,
  title                  VARCHAR(180) NOT NULL,
  hindi_title            VARCHAR(180),
  duration_minutes       INTEGER      NOT NULL,
  is_mandatory           BOOLEAN      NOT NULL DEFAULT TRUE,
  summary                TEXT         NOT NULL,
  key_standards          JSONB        NOT NULL,
  do_practices           JSONB        NOT NULL,
  dont_practices         JSONB        NOT NULL,
  critical_control_point TEXT         NOT NULL,
  village_practical_tip  TEXT,
  is_active              BOOLEAN      NOT NULL DEFAULT TRUE,
  created_at             TIMESTAMPTZ  NOT NULL DEFAULT now(),
  CONSTRAINT uq_safety_training_track_module UNIQUE (track, module_number)
);

-- 8. safety_checklist_items
CREATE TABLE safety_checklist_items (
  id          UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  track       safety_track NOT NULL,
  section     VARCHAR(100) NOT NULL,
  title       VARCHAR(200) NOT NULL,
  hindi_title VARCHAR(200),
  weight      INTEGER      NOT NULL DEFAULT 1,
  is_critical BOOLEAN      NOT NULL DEFAULT FALSE,
  is_active   BOOLEAN      NOT NULL DEFAULT TRUE
);

-- 9. safety_exam_questions
CREATE TABLE safety_exam_questions (
  id            UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  track         safety_track NOT NULL,
  topic         VARCHAR(120) NOT NULL,
  question      TEXT         NOT NULL,
  hindi_hint    TEXT,
  options       JSONB        NOT NULL,
  correct_index SMALLINT     NOT NULL,
  explanation   TEXT         NOT NULL,
  is_active     BOOLEAN      NOT NULL DEFAULT TRUE,
  CONSTRAINT chk_safety_exam_correct_index CHECK (correct_index BETWEEN 0 AND 3)
);

-- 10. cancellation_policy_rules
CREATE TABLE cancellation_policy_rules (
  id                      UUID               PRIMARY KEY DEFAULT gen_random_uuid(),
  actor                   cancelled_by_actor NOT NULL,
  code                    VARCHAR(60)        NOT NULL UNIQUE,
  label                   VARCHAR(140)       NOT NULL,
  free_cancel_window_mins INTEGER            NOT NULL DEFAULT 5,
  penalty_percent         NUMERIC(5,2)       NOT NULL DEFAULT 0.00,
  auto_refund_eligible    BOOLEAN            NOT NULL DEFAULT TRUE,
  is_active               BOOLEAN            NOT NULL DEFAULT TRUE,
  created_at              TIMESTAMPTZ        NOT NULL DEFAULT now(),
  updated_at              TIMESTAMPTZ        NOT NULL DEFAULT now(),
  CONSTRAINT chk_cancel_policy_non_neg CHECK (free_cancel_window_mins >= 0 AND penalty_percent BETWEEN 0.00 AND 100.00)
);

-- ----------------------------------------------------------------------------
-- DEPENDENCY LEVEL 1: Tables Depending Only on Level 0
-- ----------------------------------------------------------------------------

-- 11. users
CREATE TABLE users (
  id                UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name         VARCHAR(120) NOT NULL,
  phone             VARCHAR(15)  NOT NULL UNIQUE,
  email             VARCHAR(255) UNIQUE,
  password_hash     TEXT         NOT NULL,
  avatar_url        TEXT,
  active_village_id UUID         REFERENCES villages(id) ON DELETE SET NULL,
  status            user_status  NOT NULL DEFAULT 'ACTIVE',
  block_reason      TEXT,
  admin_notes       TEXT,
  terms_accepted_at TIMESTAMPTZ,
  phone_verified_at TIMESTAMPTZ,
  last_login_at     TIMESTAMPTZ,
  created_at        TIMESTAMPTZ  NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ  NOT NULL DEFAULT now(),
  deleted_at        TIMESTAMPTZ
);

-- 12. village_landmarks
CREATE TABLE village_landmarks (
  id         UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  village_id UUID         NOT NULL REFERENCES villages(id) ON DELETE RESTRICT,
  name       VARCHAR(150) NOT NULL,
  hindi_name VARCHAR(150),
  is_popular BOOLEAN      NOT NULL DEFAULT TRUE,
  is_active  BOOLEAN      NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ  NOT NULL DEFAULT now(),
  CONSTRAINT uq_village_landmarks_village_name UNIQUE (village_id, name)
);

-- 13. inter_village_routes
CREATE TABLE inter_village_routes (
  id               UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  from_village_id  UUID          NOT NULL REFERENCES villages(id) ON DELETE RESTRICT,
  to_village_id    UUID          NOT NULL REFERENCES villages(id) ON DELETE RESTRICT,
  distance_km      NUMERIC(6,2)  NOT NULL,
  surcharge_amount NUMERIC(12,2) NOT NULL DEFAULT 0.00,
  is_active        BOOLEAN       NOT NULL DEFAULT TRUE,
  created_at       TIMESTAMPTZ   NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ   NOT NULL DEFAULT now(),
  CONSTRAINT uq_inter_village_routes_pair UNIQUE (from_village_id, to_village_id),
  CONSTRAINT chk_routes_distinct_villages CHECK (from_village_id <> to_village_id),
  CONSTRAINT chk_routes_non_negative CHECK (distance_km >= 0 AND surcharge_amount >= 0)
);

-- 14. role_permissions
CREATE TABLE role_permissions (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id     UUID        NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  module_key  VARCHAR(60) NOT NULL,
  can_view    BOOLEAN     NOT NULL DEFAULT FALSE,
  can_manage  BOOLEAN     NOT NULL DEFAULT FALSE,
  can_approve BOOLEAN     NOT NULL DEFAULT FALSE,
  can_export  BOOLEAN     NOT NULL DEFAULT FALSE,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_role_permissions_role_module UNIQUE (role_id, module_key)
);

-- 15. categories (self-referencing parent_id for subcategories)
CREATE TABLE categories (
  id          UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  vertical_id UUID         NOT NULL REFERENCES verticals(id) ON DELETE RESTRICT,
  parent_id   UUID         REFERENCES categories(id) ON DELETE RESTRICT,
  name        VARCHAR(120) NOT NULL,
  hindi_name  VARCHAR(120),
  slug        VARCHAR(140) NOT NULL UNIQUE,
  icon        VARCHAR(60),
  sort_order  INTEGER      NOT NULL DEFAULT 0,
  is_active   BOOLEAN      NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- 16. brand_verticals
CREATE TABLE brand_verticals (
  brand_id    UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  vertical_id UUID NOT NULL REFERENCES verticals(id) ON DELETE CASCADE,
  PRIMARY KEY (brand_id, vertical_id)
);

-- 17. packaging_masters
CREATE TABLE packaging_masters (
  id              UUID                    PRIMARY KEY DEFAULT gen_random_uuid(),
  code            VARCHAR(40)             NOT NULL UNIQUE,
  name            VARCHAR(120)            NOT NULL,
  hindi_name      VARCHAR(120),
  material_type   packaging_material_type NOT NULL,
  capacity_label  VARCHAR(60)             NOT NULL,
  unit_id         UUID                    REFERENCES units(id) ON DELETE SET NULL,
  fee_amount      NUMERIC(12,2)           NOT NULL DEFAULT 0.00,
  is_food_grade   BOOLEAN                 NOT NULL DEFAULT FALSE,
  is_eco_friendly BOOLEAN                 NOT NULL DEFAULT FALSE,
  is_leak_proof   BOOLEAN                 NOT NULL DEFAULT FALSE,
  is_active       BOOLEAN                 NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ             NOT NULL DEFAULT now(),
  CONSTRAINT chk_packaging_fee_non_neg CHECK (fee_amount >= 0)
);

-- 18. fee_rules
CREATE TABLE fee_rules (
  id                   UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  name                 VARCHAR(120)  NOT NULL,
  vertical_id          UUID          REFERENCES verticals(id) ON DELETE RESTRICT,
  commission_bps       INTEGER       NOT NULL,
  platform_fee         NUMERIC(12,2) NOT NULL DEFAULT 0.00,
  effective_from       TIMESTAMPTZ   NOT NULL,
  effective_until      TIMESTAMPTZ,
  is_pilot_shadow_mode BOOLEAN       NOT NULL DEFAULT FALSE,
  is_active            BOOLEAN       NOT NULL DEFAULT TRUE,
  created_at           TIMESTAMPTZ   NOT NULL DEFAULT now(),
  updated_at           TIMESTAMPTZ   NOT NULL DEFAULT now(),
  CONSTRAINT chk_fee_rules_values CHECK (commission_bps BETWEEN 0 AND 5000 AND platform_fee >= 0)
);

-- 19. tax_slabs
CREATE TABLE tax_slabs (
  id           UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  name         VARCHAR(120) NOT NULL,
  vertical_id  UUID         REFERENCES verticals(id) ON DELETE RESTRICT,
  gst_percent  NUMERIC(5,2) NOT NULL,
  hsn_prefix   VARCHAR(16),
  is_inclusive BOOLEAN      NOT NULL DEFAULT TRUE,
  description  TEXT,
  is_active    BOOLEAN      NOT NULL DEFAULT TRUE,
  created_at   TIMESTAMPTZ  NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ  NOT NULL DEFAULT now(),
  CONSTRAINT chk_tax_slabs_gst CHECK (gst_percent BETWEEN 0.00 AND 28.00)
);

-- ----------------------------------------------------------------------------
-- DEPENDENCY LEVEL 2: Tables Depending on Levels 0–1
-- ----------------------------------------------------------------------------

-- 20. user_roles
CREATE TABLE user_roles (
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role_id             UUID        NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  assigned_by_user_id UUID        REFERENCES users(id) ON DELETE SET NULL,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_user_roles_user_role UNIQUE (user_id, role_id)
);

-- 21. admin_village_scopes
CREATE TABLE admin_village_scopes (
  user_id     UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  village_id  UUID        NOT NULL REFERENCES villages(id) ON DELETE CASCADE,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, village_id)
);

-- 22. auth_tokens
CREATE TABLE auth_tokens (
  id          UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID            NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_type  auth_token_type NOT NULL,
  token_hash  VARCHAR(128)    NOT NULL UNIQUE,
  expires_at  TIMESTAMPTZ     NOT NULL,
  consumed_at TIMESTAMPTZ,
  ip_address  INET,
  user_agent  TEXT,
  created_at  TIMESTAMPTZ     NOT NULL DEFAULT now()
);

-- 23. customer_addresses
CREATE TABLE customer_addresses (
  id              UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID          NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  village_id      UUID          NOT NULL REFERENCES villages(id) ON DELETE RESTRICT,
  recipient_name  VARCHAR(120)  NOT NULL,
  recipient_phone VARCHAR(15)   NOT NULL,
  address_line1   VARCHAR(255)  NOT NULL,
  landmark        VARCHAR(200)  NOT NULL,
  address_label   address_label NOT NULL DEFAULT 'HOME',
  latitude        NUMERIC(9,6),
  longitude       NUMERIC(9,6),
  is_default      BOOLEAN       NOT NULL DEFAULT FALSE,
  created_at      TIMESTAMPTZ   NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ   NOT NULL DEFAULT now(),
  deleted_at      TIMESTAMPTZ
);

-- 24. sellers (Unified Shop & Onboarding / KYC Review Entity)
CREATE TABLE sellers (
  id                            UUID                  PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id                 UUID                  NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  public_name                   VARCHAR(160)          NOT NULL,
  business_type                 seller_business_type  NOT NULL,
  primary_vertical_id           UUID                  NOT NULL REFERENCES verticals(id) ON DELETE RESTRICT,
  description                   TEXT,
  contact_phone                 VARCHAR(15)           NOT NULL,
  email                         VARCHAR(255),
  village_id                    UUID                  NOT NULL REFERENCES villages(id) ON DELETE RESTRICT,
  shop_address                  VARCHAR(255)          NOT NULL,
  pin_code                      VARCHAR(10),
  status                        seller_account_status NOT NULL DEFAULT 'PENDING_APPROVAL',
  kyc_status                    kyc_status            NOT NULL DEFAULT 'PENDING',
  is_open_now                   BOOLEAN               NOT NULL DEFAULT FALSE,
  is_paused                     BOOLEAN               NOT NULL DEFAULT FALSE,
  supports_delivery             BOOLEAN               NOT NULL DEFAULT TRUE,
  supports_pickup               BOOLEAN               NOT NULL DEFAULT TRUE,
  delivery_radius_km            NUMERIC(5,2)          NOT NULL DEFAULT 5.00,
  minimum_order_amount          NUMERIC(12,2)         NOT NULL DEFAULT 0.00,
  packaging_fee                 NUMERIC(12,2)         NOT NULL DEFAULT 0.00,
  delivery_fee                  NUMERIC(12,2)         NOT NULL DEFAULT 0.00,
  opening_time                  TIME,
  closing_time                  TIME,
  closed_days                   TEXT[]                NOT NULL DEFAULT '{}'::text[],
  fssai_number                  VARCHAR(20),
  fssai_verified                BOOLEAN               NOT NULL DEFAULT FALSE,
  gst_or_trade_number           VARCHAR(30),
  agri_license_number           VARCHAR(40),
  upi_id                        VARCHAR(120),
  bank_account_holder           VARCHAR(120),
  bank_account_encrypted        TEXT,
  bank_account_last4            VARCHAR(4),
  ifsc_code                     VARCHAR(11),
  commission_rate_bps           INTEGER               NOT NULL DEFAULT 500,
  udhari_enabled                BOOLEAN               NOT NULL DEFAULT FALSE,
  udhari_policy_acknowledged_at TIMESTAMPTZ,
  banner_url                    TEXT,
  logo_initials                 VARCHAR(4),
  rating_avg                    NUMERIC(3,2)          NOT NULL DEFAULT 0.00,
  review_count                  INTEGER               NOT NULL DEFAULT 0,
  suspension_reason             TEXT,
  rejection_reason              TEXT,
  kyc_change_request_notes      TEXT,
  reviewed_by_user_id           UUID                  REFERENCES users(id) ON DELETE SET NULL,
  reviewed_at                   TIMESTAMPTZ,
  joined_at                     TIMESTAMPTZ,
  created_at                    TIMESTAMPTZ           NOT NULL DEFAULT now(),
  updated_at                    TIMESTAMPTZ           NOT NULL DEFAULT now(),
  deleted_at                    TIMESTAMPTZ,
  CONSTRAINT chk_sellers_amounts_non_neg CHECK (
    delivery_radius_km >= 0
    AND minimum_order_amount >= 0
    AND packaging_fee >= 0
    AND delivery_fee >= 0
    AND commission_rate_bps BETWEEN 0 AND 5000
    AND rating_avg BETWEEN 0.00 AND 5.00
    AND review_count >= 0
  ),
  CONSTRAINT chk_sellers_udhari_ack CHECK (
    udhari_enabled = FALSE OR udhari_policy_acknowledged_at IS NOT NULL
  )
);

-- 25. category_allowed_units
CREATE TABLE category_allowed_units (
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  unit_id     UUID NOT NULL REFERENCES units(id) ON DELETE CASCADE,
  PRIMARY KEY (category_id, unit_id)
);

-- 26. category_attributes
CREATE TABLE category_attributes (
  category_id          UUID    NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  attribute_id         UUID    NOT NULL REFERENCES attributes(id) ON DELETE CASCADE,
  is_required_override BOOLEAN,
  PRIMARY KEY (category_id, attribute_id)
);

-- 27. option_groups
CREATE TABLE option_groups (
  id             UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
  name           VARCHAR(120)   NOT NULL,
  hindi_name     VARCHAR(120),
  vertical_id    UUID           REFERENCES verticals(id) ON DELETE SET NULL,
  category_id    UUID           REFERENCES categories(id) ON DELETE SET NULL,
  selection_type selection_type NOT NULL,
  is_required    BOOLEAN        NOT NULL DEFAULT FALSE,
  min_select     INTEGER        NOT NULL DEFAULT 0,
  max_select     INTEGER        NOT NULL DEFAULT 1,
  is_active      BOOLEAN        NOT NULL DEFAULT TRUE,
  created_at     TIMESTAMPTZ    NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ    NOT NULL DEFAULT now(),
  CONSTRAINT chk_option_groups_select_bounds CHECK (min_select >= 0 AND max_select >= min_select)
);

-- 28. availability_stock_configs
CREATE TABLE availability_stock_configs (
  id                          UUID                       PRIMARY KEY DEFAULT gen_random_uuid(),
  code                        VARCHAR(40)                NOT NULL UNIQUE,
  name                        VARCHAR(120)               NOT NULL,
  vertical_id                 UUID                       NOT NULL REFERENCES verticals(id) ON DELETE RESTRICT,
  category_id                 UUID                       REFERENCES categories(id) ON DELETE SET NULL,
  workflow_mode               availability_workflow_mode NOT NULL,
  service_slots               TEXT[]                     NOT NULL DEFAULT '{}'::text[],
  prep_time_minutes           INTEGER,
  daily_batch_limit           INTEGER,
  default_low_stock_threshold NUMERIC(10,3)              NOT NULL DEFAULT 5.000,
  max_qty_per_order           NUMERIC(10,3)              NOT NULL DEFAULT 20.000,
  auto_disable_on_zero_stock  BOOLEAN                    NOT NULL DEFAULT TRUE,
  allow_pre_order             BOOLEAN                    NOT NULL DEFAULT FALSE,
  restock_lead_hours          INTEGER,
  is_active                   BOOLEAN                    NOT NULL DEFAULT TRUE,
  created_at                  TIMESTAMPTZ                NOT NULL DEFAULT now(),
  updated_at                  TIMESTAMPTZ                NOT NULL DEFAULT now(),
  CONSTRAINT chk_avail_stock_cfg_bounds CHECK (
    default_low_stock_threshold >= 0 AND max_qty_per_order > 0
  )
);

-- 29. delivery_partners
CREATE TABLE delivery_partners (
  id                   UUID                    PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id              UUID                    NOT NULL UNIQUE REFERENCES users(id) ON DELETE RESTRICT,
  village_id           UUID                    NOT NULL REFERENCES villages(id) ON DELETE RESTRICT,
  vehicle_type         vehicle_type            NOT NULL,
  vehicle_number       VARCHAR(30),
  kyc_verified         BOOLEAN                 NOT NULL DEFAULT FALSE,
  status               delivery_partner_status NOT NULL DEFAULT 'OFFLINE',
  completed_deliveries INTEGER                 NOT NULL DEFAULT 0,
  rating_avg           NUMERIC(3,2)            NOT NULL DEFAULT 0.00,
  joined_at            TIMESTAMPTZ             NOT NULL DEFAULT now(),
  updated_at           TIMESTAMPTZ             NOT NULL DEFAULT now(),
  CONSTRAINT chk_delivery_partner_stats CHECK (
    completed_deliveries >= 0 AND rating_avg BETWEEN 0.00 AND 5.00
  )
);

-- 30. broadcast_campaigns
CREATE TABLE broadcast_campaigns (
  id                 UUID                 PRIMARY KEY DEFAULT gen_random_uuid(),
  title              VARCHAR(160)         NOT NULL,
  message            TEXT                 NOT NULL,
  channel            notification_channel NOT NULL,
  audience           broadcast_audience   NOT NULL,
  target_village_id  UUID                 REFERENCES villages(id) ON DELETE SET NULL,
  priority           broadcast_priority   NOT NULL DEFAULT 'NORMAL',
  estimated_reach    INTEGER              NOT NULL DEFAULT 0,
  delivered_count    INTEGER              NOT NULL DEFAULT 0,
  status             broadcast_status     NOT NULL DEFAULT 'DRAFT',
  scheduled_for      TIMESTAMPTZ,
  sent_at            TIMESTAMPTZ,
  created_by_user_id UUID                 NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  created_at         TIMESTAMPTZ          NOT NULL DEFAULT now()
);

-- 31. cms_banners
CREATE TABLE cms_banners (
  id                 UUID             PRIMARY KEY DEFAULT gen_random_uuid(),
  title              VARCHAR(160)     NOT NULL,
  subtitle           VARCHAR(240),
  placement          banner_placement NOT NULL,
  target_vertical_id UUID             REFERENCES verticals(id) ON DELETE SET NULL,
  target_village_id  UUID             REFERENCES villages(id) ON DELETE SET NULL,
  cta_label          VARCHAR(60),
  accent_color       VARCHAR(20),
  valid_from         TIMESTAMPTZ      NOT NULL,
  valid_until        TIMESTAMPTZ      NOT NULL,
  priority           INTEGER          NOT NULL DEFAULT 0,
  is_active          BOOLEAN          NOT NULL DEFAULT TRUE,
  created_at         TIMESTAMPTZ      NOT NULL DEFAULT now(),
  updated_at         TIMESTAMPTZ      NOT NULL DEFAULT now()
);

-- 32. cms_policy_pages
CREATE TABLE cms_policy_pages (
  id                 UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  slug               VARCHAR(60)  NOT NULL UNIQUE,
  title              VARCHAR(160) NOT NULL,
  version            VARCHAR(20)  NOT NULL,
  summary            TEXT,
  content            TEXT         NOT NULL,
  updated_by_user_id UUID         NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  updated_at         TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- 33. platform_settings (Typed Singleton Configuration Table)
CREATE TABLE platform_settings (
  id                           SMALLINT     PRIMARY KEY DEFAULT 1,
  platform_name                VARCHAR(120) NOT NULL,
  tagline                      VARCHAR(200),
  support_phone                VARCHAR(20)  NOT NULL,
  whatsapp_support             VARCHAR(20),
  default_delivery_enabled     BOOLEAN      NOT NULL DEFAULT TRUE,
  default_pickup_enabled       BOOLEAN      NOT NULL DEFAULT TRUE,
  allow_multi_vertical_sellers BOOLEAN      NOT NULL DEFAULT TRUE,
  auto_cancel_unaccepted_mins  INTEGER      NOT NULL DEFAULT 15,
  food_prep_sla_mins           INTEGER      NOT NULL DEFAULT 30,
  maintenance_mode             BOOLEAN      NOT NULL DEFAULT FALSE,
  maintenance_message          TEXT,
  updated_by_user_id           UUID         REFERENCES users(id) ON DELETE SET NULL,
  updated_at                   TIMESTAMPTZ  NOT NULL DEFAULT now(),
  CONSTRAINT chk_platform_settings_singleton CHECK (id = 1)
);

-- 34. audit_logs (Immutable Administrative & Security Audit Trail)
CREATE TABLE audit_logs (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_user_id UUID        REFERENCES users(id) ON DELETE SET NULL,
  actor_role    VARCHAR(40) NOT NULL,
  action_type   VARCHAR(80) NOT NULL,
  target_entity VARCHAR(60) NOT NULL,
  target_id     VARCHAR(64) NOT NULL,
  ip_address    INET,
  details       TEXT        NOT NULL,
  reason        TEXT,
  metadata      JSONB,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ----------------------------------------------------------------------------
-- DEPENDENCY LEVEL 3: Tables Depending on Levels 0–2
-- ----------------------------------------------------------------------------

-- 35. seller_verticals
CREATE TABLE seller_verticals (
  seller_id   UUID        NOT NULL REFERENCES sellers(id) ON DELETE CASCADE,
  vertical_id UUID        NOT NULL REFERENCES verticals(id) ON DELETE RESTRICT,
  is_primary  BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (seller_id, vertical_id)
);

-- 36. seller_serviceable_villages
CREATE TABLE seller_serviceable_villages (
  seller_id           UUID          NOT NULL REFERENCES sellers(id) ON DELETE CASCADE,
  village_id          UUID          NOT NULL REFERENCES villages(id) ON DELETE RESTRICT,
  custom_delivery_fee NUMERIC(12,2),
  is_active           BOOLEAN       NOT NULL DEFAULT TRUE,
  created_at          TIMESTAMPTZ   NOT NULL DEFAULT now(),
  PRIMARY KEY (seller_id, village_id),
  CONSTRAINT chk_ssv_custom_fee_non_neg CHECK (custom_delivery_fee IS NULL OR custom_delivery_fee >= 0)
);

-- 37. seller_kyc_documents
CREATE TABLE seller_kyc_documents (
  id                        UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id                 UUID         NOT NULL REFERENCES sellers(id) ON DELETE RESTRICT,
  doc_code                  kyc_doc_code NOT NULL,
  label                     VARCHAR(100) NOT NULL,
  document_number_encrypted TEXT,
  document_number_masked    VARCHAR(40),
  file_url                  TEXT         NOT NULL,
  file_name                 VARCHAR(200) NOT NULL,
  status                    kyc_status   NOT NULL DEFAULT 'PENDING',
  rejection_reason          TEXT,
  reviewed_by_user_id       UUID         REFERENCES users(id) ON DELETE SET NULL,
  reviewed_at               TIMESTAMPTZ,
  uploaded_at               TIMESTAMPTZ  NOT NULL DEFAULT now(),
  updated_at                TIMESTAMPTZ  NOT NULL DEFAULT now(),
  CONSTRAINT uq_seller_kyc_documents_seller_doc UNIQUE (seller_id, doc_code)
);

-- 38. seller_staff_members
CREATE TABLE seller_staff_members (
  id           UUID              PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id    UUID              NOT NULL REFERENCES sellers(id) ON DELETE RESTRICT,
  user_id      UUID              REFERENCES users(id) ON DELETE SET NULL,
  full_name    VARCHAR(120)      NOT NULL,
  phone        VARCHAR(15)       NOT NULL,
  staff_role   seller_staff_role NOT NULL,
  is_available BOOLEAN           NOT NULL DEFAULT TRUE,
  is_active    BOOLEAN           NOT NULL DEFAULT TRUE,
  created_at   TIMESTAMPTZ       NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ       NOT NULL DEFAULT now()
);

-- 39. option_group_items
CREATE TABLE option_group_items (
  id              UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  option_group_id UUID          NOT NULL REFERENCES option_groups(id) ON DELETE CASCADE,
  label           VARCHAR(120)  NOT NULL,
  price_delta     NUMERIC(12,2) NOT NULL DEFAULT 0.00,
  diet_type       diet_type,
  is_default      BOOLEAN       NOT NULL DEFAULT FALSE,
  is_available    BOOLEAN       NOT NULL DEFAULT TRUE,
  sort_order      INTEGER       NOT NULL DEFAULT 0
);

-- 40. products (Universal Product Master across Grocery, Food, Hardware, Apparel, etc.)
CREATE TABLE products (
  id                     UUID              PRIMARY KEY DEFAULT gen_random_uuid(),
  sku_code               VARCHAR(64)       NOT NULL UNIQUE,
  vertical_id            UUID              NOT NULL REFERENCES verticals(id) ON DELETE RESTRICT,
  category_id            UUID              NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
  subcategory_id         UUID              REFERENCES categories(id) ON DELETE SET NULL,
  brand_id               UUID              REFERENCES brands(id) ON DELETE SET NULL,
  default_unit_id        UUID              NOT NULL REFERENCES units(id) ON DELETE RESTRICT,
  default_packaging_id   UUID              REFERENCES packaging_masters(id) ON DELETE SET NULL,
  availability_config_id UUID              REFERENCES availability_stock_configs(id) ON DELETE SET NULL,
  tax_slab_id            UUID              REFERENCES tax_slabs(id) ON DELETE SET NULL,
  name                   VARCHAR(200)      NOT NULL,
  hindi_name             VARCHAR(200),
  description            TEXT,
  diet_type              diet_type,
  image_url              TEXT,
  is_universal_template  BOOLEAN           NOT NULL DEFAULT FALSE,
  created_by_seller_id   UUID              REFERENCES sellers(id) ON DELETE SET NULL,
  moderation_status      moderation_status NOT NULL DEFAULT 'PENDING_REVIEW',
  moderation_notes       TEXT,
  moderated_by_user_id   UUID              REFERENCES users(id) ON DELETE SET NULL,
  moderated_at           TIMESTAMPTZ,
  is_active              BOOLEAN           NOT NULL DEFAULT TRUE,
  created_at             TIMESTAMPTZ       NOT NULL DEFAULT now(),
  updated_at             TIMESTAMPTZ       NOT NULL DEFAULT now(),
  deleted_at             TIMESTAMPTZ
);

-- 41. seller_bulk_inventory_jobs
CREATE TABLE seller_bulk_inventory_jobs (
  id                      UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id               UUID        NOT NULL REFERENCES sellers(id) ON DELETE RESTRICT,
  initiated_by_user_id    UUID        NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  affected_listings_count INTEGER     NOT NULL,
  payload_summary         JSONB       NOT NULL,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 42. offers_coupons
CREATE TABLE offers_coupons (
  id                  UUID                 PRIMARY KEY DEFAULT gen_random_uuid(),
  code                VARCHAR(40)          NOT NULL UNIQUE,
  title               VARCHAR(160)         NOT NULL,
  discount_type       discount_type        NOT NULL,
  discount_value      NUMERIC(12,2)        NOT NULL,
  min_order_amount    NUMERIC(12,2)        NOT NULL DEFAULT 0.00,
  max_discount_amount NUMERIC(12,2),
  vertical_id         UUID                 REFERENCES verticals(id) ON DELETE SET NULL,
  village_id          UUID                 REFERENCES villages(id) ON DELETE SET NULL,
  seller_id           UUID                 REFERENCES sellers(id) ON DELETE SET NULL,
  funded_by           offer_funding_source NOT NULL,
  valid_from          TIMESTAMPTZ          NOT NULL,
  valid_until         TIMESTAMPTZ          NOT NULL,
  usage_limit         INTEGER              NOT NULL,
  per_customer_limit  INTEGER              NOT NULL DEFAULT 1,
  used_count          INTEGER              NOT NULL DEFAULT 0,
  is_active           BOOLEAN              NOT NULL DEFAULT TRUE,
  created_at          TIMESTAMPTZ          NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ          NOT NULL DEFAULT now(),
  CONSTRAINT chk_coupon_validity CHECK (
    valid_until > valid_from
    AND discount_value >= 0
    AND min_order_amount >= 0
    AND usage_limit > 0
    AND per_customer_limit > 0
    AND used_count >= 0
    AND used_count <= usage_limit
  )
);

-- 43. seller_settlements
CREATE TABLE seller_settlements (
  id                     UUID                    PRIMARY KEY DEFAULT gen_random_uuid(),
  settlement_number      VARCHAR(40)             NOT NULL UNIQUE,
  seller_id              UUID                    NOT NULL REFERENCES sellers(id) ON DELETE RESTRICT,
  period_start           DATE                    NOT NULL,
  period_end             DATE                    NOT NULL,
  period_label           VARCHAR(60)             NOT NULL,
  orders_count           INTEGER                 NOT NULL,
  gross_amount           NUMERIC(12,2)           NOT NULL,
  commission_amount      NUMERIC(12,2)           NOT NULL,
  refund_deductions      NUMERIC(12,2)           NOT NULL DEFAULT 0.00,
  other_deductions       NUMERIC(12,2)           NOT NULL DEFAULT 0.00,
  platform_fee_deduction NUMERIC(12,2)           NOT NULL DEFAULT 0.00,
  net_payable            NUMERIC(12,2)           NOT NULL,
  payment_mode           settlement_payment_mode NOT NULL,
  utr_number             VARCHAR(64)             UNIQUE,
  status                 settlement_status       NOT NULL DEFAULT 'PENDING',
  settlement_date        DATE,
  settled_at             TIMESTAMPTZ,
  notes                  TEXT,
  created_by_user_id     UUID                    NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  created_at             TIMESTAMPTZ             NOT NULL DEFAULT now(),
  updated_at             TIMESTAMPTZ             NOT NULL DEFAULT now(),
  CONSTRAINT chk_settlement_period CHECK (period_end >= period_start AND orders_count >= 0),
  CONSTRAINT chk_settlement_net_formula CHECK (
    net_payable = gross_amount - commission_amount - refund_deductions - platform_fee_deduction - other_deductions
  )
);

-- 44. customer_credit_profiles (Seller-Owned Udhari Account per Customer)
CREATE TABLE customer_credit_profiles (
  id                  UUID                  PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id           UUID                  NOT NULL REFERENCES sellers(id) ON DELETE RESTRICT,
  customer_id         UUID                  NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  status              credit_profile_status NOT NULL DEFAULT 'ACTIVE',
  credit_limit        NUMERIC(12,2)         NOT NULL DEFAULT 0.00,
  outstanding_balance NUMERIC(12,2)         NOT NULL DEFAULT 0.00,
  overdue_amount      NUMERIC(12,2)         NOT NULL DEFAULT 0.00,
  default_due_days    INTEGER               NOT NULL DEFAULT 15,
  last_payment_at     TIMESTAMPTZ,
  internal_note       TEXT,
  created_at          TIMESTAMPTZ           NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ           NOT NULL DEFAULT now(),
  CONSTRAINT uq_customer_credit_profiles_seller_customer UNIQUE (seller_id, customer_id),
  CONSTRAINT chk_credit_profile_non_neg CHECK (
    credit_limit >= 0
    AND outstanding_balance >= 0
    AND overdue_amount >= 0
    AND default_due_days > 0
  )
);

-- 45. seller_training_completions
CREATE TABLE seller_training_completions (
  seller_id    UUID        NOT NULL REFERENCES sellers(id) ON DELETE CASCADE,
  module_id    UUID        NOT NULL REFERENCES safety_training_modules(id) ON DELETE CASCADE,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (seller_id, module_id)
);

-- 46. seller_checklist_submissions
CREATE TABLE seller_checklist_submissions (
  id                       UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id                UUID         NOT NULL REFERENCES sellers(id) ON DELETE RESTRICT,
  submission_date          DATE         NOT NULL,
  track                    safety_track NOT NULL,
  checked_item_ids         JSONB        NOT NULL,
  score_percent            NUMERIC(5,2) NOT NULL,
  completed_critical_count INTEGER      NOT NULL,
  total_critical_count     INTEGER      NOT NULL,
  notes                    TEXT,
  submitted_at             TIMESTAMPTZ  NOT NULL DEFAULT now(),
  CONSTRAINT uq_seller_checklist_seller_date UNIQUE (seller_id, submission_date),
  CONSTRAINT chk_checklist_score CHECK (score_percent BETWEEN 0.00 AND 100.00)
);

-- 47. seller_exam_attempts
CREATE TABLE seller_exam_attempts (
  id                 UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id          UUID         NOT NULL REFERENCES sellers(id) ON DELETE RESTRICT,
  track              safety_track NOT NULL,
  score_percent      NUMERIC(5,2) NOT NULL,
  correct_count      INTEGER      NOT NULL,
  total_questions    INTEGER      NOT NULL,
  passed             BOOLEAN      NOT NULL,
  time_taken_seconds INTEGER      NOT NULL,
  weak_topics        JSONB        NOT NULL,
  answers            JSONB        NOT NULL,
  submitted_at       TIMESTAMPTZ  NOT NULL DEFAULT now(),
  CONSTRAINT chk_exam_attempt_score CHECK (score_percent BETWEEN 0.00 AND 100.00)
);

-- 48. seller_safety_profiles (1:1 per Seller)
CREATE TABLE seller_safety_profiles (
  seller_id                UUID                      PRIMARY KEY REFERENCES sellers(id) ON DELETE RESTRICT,
  track                    safety_track              NOT NULL,
  badge_level              certification_badge_level NOT NULL DEFAULT 'IN_PROGRESS',
  overall_compliance_score NUMERIC(5,2)              NOT NULL DEFAULT 0.00,
  retraining_required      BOOLEAN                   NOT NULL DEFAULT FALSE,
  retraining_reason        TEXT,
  suspended_for_safety     BOOLEAN                   NOT NULL DEFAULT FALSE,
  certificate_number       VARCHAR(60)               UNIQUE,
  certified_at             TIMESTAMPTZ,
  certificate_valid_until  TIMESTAMPTZ,
  updated_at               TIMESTAMPTZ               NOT NULL DEFAULT now(),
  CONSTRAINT chk_safety_profile_score CHECK (overall_compliance_score BETWEEN 0.00 AND 100.00)
);

-- 49. safety_inspection_audits
CREATE TABLE safety_inspection_audits (
  id                UUID               PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id         UUID               NOT NULL REFERENCES sellers(id) ON DELETE RESTRICT,
  inspector_user_id UUID               NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  score_percent     NUMERIC(5,2)       NOT NULL,
  outcome           inspection_outcome NOT NULL,
  remarks           TEXT               NOT NULL,
  findings          JSONB              NOT NULL,
  inspected_at      TIMESTAMPTZ        NOT NULL DEFAULT now(),
  CONSTRAINT chk_inspection_score CHECK (score_percent BETWEEN 0.00 AND 100.00)
);

-- ----------------------------------------------------------------------------
-- DEPENDENCY LEVEL 4: Tables Depending on Levels 0–3
-- ----------------------------------------------------------------------------

-- 50. seller_kyc_document_events
CREATE TABLE seller_kyc_document_events (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  kyc_document_id UUID        NOT NULL REFERENCES seller_kyc_documents(id) ON DELETE CASCADE,
  status          kyc_status  NOT NULL,
  actor_user_id   UUID        NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  note            TEXT        NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 51. product_attribute_values
CREATE TABLE product_attribute_values (
  id            UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id    UUID          NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  attribute_id  UUID          NOT NULL REFERENCES attributes(id) ON DELETE RESTRICT,
  value_text    TEXT,
  value_number  NUMERIC(12,4),
  value_boolean BOOLEAN,
  value_json    JSONB,
  CONSTRAINT uq_product_attribute_values_prod_attr UNIQUE (product_id, attribute_id)
);

-- 52. product_variants
CREATE TABLE product_variants (
  id                 UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id         UUID          NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  sku                VARCHAR(64)   NOT NULL UNIQUE,
  label              VARCHAR(120)  NOT NULL,
  unit_id            UUID          NOT NULL REFERENCES units(id) ON DELETE RESTRICT,
  unit_quantity      NUMERIC(10,3) NOT NULL,
  variant_attributes JSONB         NOT NULL DEFAULT '{}'::jsonb,
  default_mrp        NUMERIC(12,2) NOT NULL,
  is_active          BOOLEAN       NOT NULL DEFAULT TRUE,
  created_at         TIMESTAMPTZ   NOT NULL DEFAULT now(),
  updated_at         TIMESTAMPTZ   NOT NULL DEFAULT now(),
  CONSTRAINT chk_product_variants_positive CHECK (unit_quantity > 0 AND default_mrp >= 0)
);

-- 53. product_option_groups
CREATE TABLE product_option_groups (
  product_id      UUID    NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  option_group_id UUID    NOT NULL REFERENCES option_groups(id) ON DELETE CASCADE,
  sort_order      INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (product_id, option_group_id)
);

-- 54. carts (Single-Seller Active Cart per Customer)
CREATE TABLE carts (
  id              UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id     UUID            NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  seller_id       UUID            REFERENCES sellers(id) ON DELETE SET NULL,
  village_id      UUID            REFERENCES villages(id) ON DELETE SET NULL,
  fulfilment_mode fulfilment_mode NOT NULL DEFAULT 'DELIVERY',
  coupon_id       UUID            REFERENCES offers_coupons(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ     NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ     NOT NULL DEFAULT now()
);

-- 55. orders
CREATE TABLE orders (
  id                           UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number                 VARCHAR(30)     NOT NULL UNIQUE,
  customer_id                  UUID            NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  seller_id                    UUID            NOT NULL REFERENCES sellers(id) ON DELETE RESTRICT,
  village_id                   UUID            NOT NULL REFERENCES villages(id) ON DELETE RESTRICT,
  fulfilment_mode              fulfilment_mode NOT NULL,
  delivery_address_id          UUID            REFERENCES customer_addresses(id) ON DELETE SET NULL,
  delivery_address_snapshot    JSONB,
  delivery_note                TEXT,
  status                       order_status    NOT NULL DEFAULT 'PLACED',
  payment_method               payment_method  NOT NULL,
  payment_status               payment_status  NOT NULL DEFAULT 'PENDING',
  coupon_id                    UUID            REFERENCES offers_coupons(id) ON DELETE SET NULL,
  coupon_code_snapshot         VARCHAR(40),
  item_subtotal                NUMERIC(12,2)   NOT NULL,
  item_discount                NUMERIC(12,2)   NOT NULL DEFAULT 0.00,
  coupon_discount              NUMERIC(12,2)   NOT NULL DEFAULT 0.00,
  delivery_fee                 NUMERIC(12,2)   NOT NULL DEFAULT 0.00,
  packaging_fee                NUMERIC(12,2)   NOT NULL DEFAULT 0.00,
  tax_amount                   NUMERIC(12,2)   NOT NULL DEFAULT 0.00,
  tax_label_snapshot           VARCHAR(80),
  platform_fee                 NUMERIC(12,2)   NOT NULL DEFAULT 0.00,
  total_amount                 NUMERIC(12,2)   NOT NULL,
  fee_rule_id                  UUID            REFERENCES fee_rules(id) ON DELETE SET NULL,
  commission_rate_bps_snapshot INTEGER         NOT NULL DEFAULT 0,
  commission_amount            NUMERIC(12,2)   NOT NULL DEFAULT 0.00,
  is_shadow_commission         BOOLEAN         NOT NULL DEFAULT FALSE,
  estimated_delivery_minutes   INTEGER,
  accept_deadline_at           TIMESTAMPTZ,
  accepted_at                  TIMESTAMPTZ,
  completed_at                 TIMESTAMPTZ,
  created_at                   TIMESTAMPTZ     NOT NULL DEFAULT now(),
  updated_at                   TIMESTAMPTZ     NOT NULL DEFAULT now(),
  CONSTRAINT chk_orders_totals_non_neg CHECK (
    item_subtotal >= 0
    AND item_discount >= 0
    AND coupon_discount >= 0
    AND delivery_fee >= 0
    AND packaging_fee >= 0
    AND tax_amount >= 0
    AND platform_fee >= 0
    AND total_amount >= 0
    AND commission_amount >= 0
  ),
  CONSTRAINT chk_orders_pickup_zero_delivery CHECK (
    fulfilment_mode <> 'PICKUP'::fulfilment_mode OR delivery_fee = 0.00
  )
);

-- 56. credit_repayments
CREATE TABLE credit_repayments (
  id                  UUID             PRIMARY KEY DEFAULT gen_random_uuid(),
  repayment_reference VARCHAR(40)      NOT NULL UNIQUE,
  credit_profile_id   UUID             NOT NULL REFERENCES customer_credit_profiles(id) ON DELETE RESTRICT,
  seller_id           UUID             NOT NULL REFERENCES sellers(id) ON DELETE RESTRICT,
  customer_id         UUID             NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  amount              NUMERIC(12,2)    NOT NULL,
  method              repayment_method NOT NULL,
  reference_number    VARCHAR(80),
  note                TEXT,
  recorded_by_user_id UUID             NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  received_at         TIMESTAMPTZ      NOT NULL DEFAULT now(),
  created_at          TIMESTAMPTZ      NOT NULL DEFAULT now(),
  CONSTRAINT chk_credit_repayments_amount CHECK (amount > 0)
);

-- ----------------------------------------------------------------------------
-- DEPENDENCY LEVEL 5: Tables Depending on Levels 0–4
-- ----------------------------------------------------------------------------

-- 57. seller_product_listings (Seller-Specific Pricing, Rural Units & Kirana Inventory)
CREATE TABLE seller_product_listings (
  id                          UUID              PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id                   UUID              NOT NULL REFERENCES sellers(id) ON DELETE RESTRICT,
  product_id                  UUID              NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  variant_id                  UUID              REFERENCES product_variants(id) ON DELETE RESTRICT,
  seller_sku                  VARCHAR(64),
  mrp_price                   NUMERIC(12,2)     NOT NULL,
  selling_price               NUMERIC(12,2)     NOT NULL,
  inventory_mode              inventory_mode    NOT NULL,
  quantity_mode               quantity_mode     NOT NULL DEFAULT 'FIXED_PACK',
  predefined_quantity_options JSONB,
  min_quantity                NUMERIC(10,3)     NOT NULL DEFAULT 1.000,
  quantity_step               NUMERIC(10,3)     NOT NULL DEFAULT 1.000,
  quantity_precision          SMALLINT          NOT NULL DEFAULT 0,
  variable_weight             BOOLEAN           NOT NULL DEFAULT FALSE,
  local_unit_label            VARCHAR(40),
  local_unit_conversion_grams NUMERIC(10,2),
  local_unit_note             VARCHAR(200),
  prep_time_minutes           INTEGER,
  lead_time_days              INTEGER,
  track_stock                 BOOLEAN           NOT NULL DEFAULT TRUE,
  stock_quantity              NUMERIC(10,3)     NOT NULL DEFAULT 0.000,
  reserved_quantity           NUMERIC(10,3)     NOT NULL DEFAULT 0.000,
  low_stock_threshold         NUMERIC(10,3)     NOT NULL DEFAULT 5.000,
  shelf_location              VARCHAR(80),
  batch_number                VARCHAR(60),
  expiry_date                 DATE,
  supplier_name               VARCHAR(140),
  is_available                BOOLEAN           NOT NULL DEFAULT TRUE,
  is_active                   BOOLEAN           NOT NULL DEFAULT TRUE,
  moderation_status           moderation_status NOT NULL DEFAULT 'APPROVED',
  created_at                  TIMESTAMPTZ       NOT NULL DEFAULT now(),
  updated_at                  TIMESTAMPTZ       NOT NULL DEFAULT now(),
  deleted_at                  TIMESTAMPTZ,
  CONSTRAINT chk_listing_prices CHECK (selling_price >= 0 AND mrp_price >= selling_price),
  CONSTRAINT chk_listing_stock CHECK (
    stock_quantity >= 0
    AND reserved_quantity >= 0
    AND low_stock_threshold >= 0
    AND min_quantity > 0
    AND quantity_step > 0
    AND quantity_precision BETWEEN 0 AND 3
  )
);

-- 58. order_status_history
CREATE TABLE order_status_history (
  id            UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id      UUID         NOT NULL REFERENCES orders(id) ON DELETE RESTRICT,
  from_status   order_status,
  to_status     order_status NOT NULL,
  actor_user_id UUID         REFERENCES users(id) ON DELETE SET NULL,
  actor_role    VARCHAR(40)  NOT NULL,
  reason        TEXT,
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- 59. order_cancellations (1:1 per Order)
CREATE TABLE order_cancellations (
  id                   UUID               PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id             UUID               NOT NULL UNIQUE REFERENCES orders(id) ON DELETE RESTRICT,
  cancelled_by_actor   cancelled_by_actor NOT NULL,
  cancelled_by_user_id UUID               REFERENCES users(id) ON DELETE SET NULL,
  policy_rule_id       UUID               REFERENCES cancellation_policy_rules(id) ON DELETE SET NULL,
  reason               TEXT               NOT NULL,
  penalty_amount       NUMERIC(12,2)      NOT NULL DEFAULT 0.00,
  refund_eligible      BOOLEAN            NOT NULL DEFAULT FALSE,
  notes                TEXT,
  cancelled_at         TIMESTAMPTZ        NOT NULL DEFAULT now(),
  CONSTRAINT chk_order_cancel_penalty_non_neg CHECK (penalty_amount >= 0)
);

-- 60. order_returns
CREATE TABLE order_returns (
  id                   UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  return_number        VARCHAR(30)   NOT NULL UNIQUE,
  order_id             UUID          NOT NULL REFERENCES orders(id) ON DELETE RESTRICT,
  requested_by_user_id UUID          NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  status               return_status NOT NULL DEFAULT 'REQUESTED',
  reason               TEXT          NOT NULL,
  notes                TEXT,
  requested_at         TIMESTAMPTZ   NOT NULL DEFAULT now(),
  updated_at           TIMESTAMPTZ   NOT NULL DEFAULT now()
);

-- 61. order_deliveries (1:1 per Order — Seller Runner, Platform Partner, or Customer Pickup)
CREATE TABLE order_deliveries (
  id                    UUID                     PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id              UUID                     NOT NULL UNIQUE REFERENCES orders(id) ON DELETE RESTRICT,
  fulfilment_type       delivery_fulfilment_type NOT NULL,
  seller_staff_id       UUID                     REFERENCES seller_staff_members(id) ON DELETE SET NULL,
  delivery_partner_id   UUID                     REFERENCES delivery_partners(id) ON DELETE SET NULL,
  runner_name_snapshot  VARCHAR(120),
  runner_phone_snapshot VARCHAR(15),
  pickup_code           VARCHAR(12),
  status                delivery_status          NOT NULL DEFAULT 'UNASSIGNED',
  assigned_at           TIMESTAMPTZ,
  picked_up_at          TIMESTAMPTZ,
  delivered_at          TIMESTAMPTZ,
  failed_reason         TEXT,
  delivery_proof_url    TEXT,
  created_at            TIMESTAMPTZ              NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ              NOT NULL DEFAULT now(),
  CONSTRAINT chk_delivery_assignee_exclusive CHECK (
    (fulfilment_type = 'CUSTOMER_PICKUP'::delivery_fulfilment_type AND seller_staff_id IS NULL AND delivery_partner_id IS NULL)
    OR (fulfilment_type = 'SELLER_RUNNER'::delivery_fulfilment_type AND delivery_partner_id IS NULL)
    OR (fulfilment_type = 'PLATFORM_PARTNER'::delivery_fulfilment_type AND seller_staff_id IS NULL)
  )
);

-- 62. payment_transactions
CREATE TABLE payment_transactions (
  id                     UUID              PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_ref        VARCHAR(60)       NOT NULL UNIQUE,
  order_id               UUID              NOT NULL REFERENCES orders(id) ON DELETE RESTRICT,
  customer_id            UUID              NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  seller_id              UUID              NOT NULL REFERENCES sellers(id) ON DELETE RESTRICT,
  amount                 NUMERIC(12,2)     NOT NULL,
  method                 payment_method    NOT NULL,
  gateway_name           VARCHAR(60),
  gateway_ref            VARCHAR(120),
  status                 payment_tx_status NOT NULL,
  failure_code           VARCHAR(60),
  failure_reason         TEXT,
  platform_fee_component NUMERIC(12,2)     NOT NULL DEFAULT 0.00,
  paid_at                TIMESTAMPTZ,
  created_at             TIMESTAMPTZ       NOT NULL DEFAULT now(),
  updated_at             TIMESTAMPTZ       NOT NULL DEFAULT now(),
  CONSTRAINT chk_payment_tx_amount CHECK (amount > 0 AND platform_fee_component >= 0)
);

-- 63. seller_settlement_orders (UNIQUE order_id enforces zero double-settlement)
CREATE TABLE seller_settlement_orders (
  id                      UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  settlement_id           UUID          NOT NULL REFERENCES seller_settlements(id) ON DELETE RESTRICT,
  order_id                UUID          NOT NULL UNIQUE REFERENCES orders(id) ON DELETE RESTRICT,
  order_gross_amount      NUMERIC(12,2) NOT NULL,
  order_commission_amount NUMERIC(12,2) NOT NULL,
  order_refund_deduction  NUMERIC(12,2) NOT NULL DEFAULT 0.00,
  order_net_amount        NUMERIC(12,2) NOT NULL
);

-- 64. credit_ledger_entries (Append-Only Double-Entry Udhari Ledger with Self-FK Reversal)
CREATE TABLE credit_ledger_entries (
  id                  UUID                   PRIMARY KEY DEFAULT gen_random_uuid(),
  ledger_reference    VARCHAR(40)            NOT NULL UNIQUE,
  credit_profile_id   UUID                   NOT NULL REFERENCES customer_credit_profiles(id) ON DELETE RESTRICT,
  seller_id           UUID                   NOT NULL REFERENCES sellers(id) ON DELETE RESTRICT,
  customer_id         UUID                   NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  order_id            UUID                   REFERENCES orders(id) ON DELETE RESTRICT,
  repayment_id        UUID                   REFERENCES credit_repayments(id) ON DELETE RESTRICT,
  reversed_entry_id   UUID                   REFERENCES credit_ledger_entries(id) ON DELETE RESTRICT,
  entry_type          credit_entry_type      NOT NULL,
  direction           credit_entry_direction NOT NULL,
  amount              NUMERIC(12,2)          NOT NULL,
  running_balance     NUMERIC(12,2)          NOT NULL,
  due_date            TIMESTAMPTZ,
  is_overdue          BOOLEAN                NOT NULL DEFAULT FALSE,
  status              credit_entry_status    NOT NULL DEFAULT 'POSTED',
  reason              TEXT,
  recorded_by_user_id UUID                   NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  posted_at           TIMESTAMPTZ            NOT NULL DEFAULT now(),
  CONSTRAINT chk_credit_ledger_amount CHECK (amount > 0 AND running_balance >= 0)
);

-- 65. coupon_redemptions
CREATE TABLE coupon_redemptions (
  id               UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  coupon_id        UUID          NOT NULL REFERENCES offers_coupons(id) ON DELETE RESTRICT,
  order_id         UUID          NOT NULL UNIQUE REFERENCES orders(id) ON DELETE RESTRICT,
  customer_id      UUID          NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  discount_applied NUMERIC(12,2) NOT NULL,
  redeemed_at      TIMESTAMPTZ   NOT NULL DEFAULT now(),
  CONSTRAINT chk_coupon_redemption_discount CHECK (discount_applied >= 0)
);

-- 66. reviews (One Verified Review per Order)
CREATE TABLE reviews (
  id                   UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id             UUID          NOT NULL UNIQUE REFERENCES orders(id) ON DELETE RESTRICT,
  customer_id          UUID          NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  seller_id            UUID          NOT NULL REFERENCES sellers(id) ON DELETE RESTRICT,
  rating               SMALLINT      NOT NULL,
  comment              TEXT,
  status               review_status NOT NULL DEFAULT 'PUBLISHED',
  flag_reason          TEXT,
  moderation_notes     TEXT,
  moderated_by_user_id UUID          REFERENCES users(id) ON DELETE SET NULL,
  created_at           TIMESTAMPTZ   NOT NULL DEFAULT now(),
  updated_at           TIMESTAMPTZ   NOT NULL DEFAULT now(),
  CONSTRAINT chk_reviews_rating CHECK (rating BETWEEN 1 AND 5)
);

-- 67. support_cases
CREATE TABLE support_cases (
  id                     UUID                PRIMARY KEY DEFAULT gen_random_uuid(),
  case_number            VARCHAR(30)         NOT NULL UNIQUE,
  order_id               UUID                REFERENCES orders(id) ON DELETE SET NULL,
  customer_id            UUID                NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  seller_id              UUID                REFERENCES sellers(id) ON DELETE SET NULL,
  issue_type             support_issue_type  NOT NULL,
  status                 support_case_status NOT NULL DEFAULT 'OPEN',
  disputed_amount        NUMERIC(12,2)       NOT NULL DEFAULT 0.00,
  approved_refund_amount NUMERIC(12,2),
  description            TEXT                NOT NULL,
  resolution_notes       TEXT,
  assigned_admin_id      UUID                REFERENCES users(id) ON DELETE SET NULL,
  created_at             TIMESTAMPTZ         NOT NULL DEFAULT now(),
  updated_at             TIMESTAMPTZ         NOT NULL DEFAULT now(),
  CONSTRAINT chk_support_cases_amounts CHECK (
    disputed_amount >= 0 AND (approved_refund_amount IS NULL OR approved_refund_amount >= 0)
  )
);

-- 68. notifications
CREATE TABLE notifications (
  id                UUID                 PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID                 NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  seller_id         UUID                 REFERENCES sellers(id) ON DELETE SET NULL,
  order_id          UUID                 REFERENCES orders(id) ON DELETE SET NULL,
  channel           notification_channel NOT NULL DEFAULT 'IN_APP',
  notification_type VARCHAR(60)          NOT NULL,
  title             VARCHAR(160)         NOT NULL,
  body              TEXT                 NOT NULL,
  metadata          JSONB,
  is_read           BOOLEAN              NOT NULL DEFAULT FALSE,
  read_at           TIMESTAMPTZ,
  sent_at           TIMESTAMPTZ,
  created_at        TIMESTAMPTZ          NOT NULL DEFAULT now()
);

-- ----------------------------------------------------------------------------
-- DEPENDENCY LEVEL 6: Tables Depending on Levels 0–5
-- ----------------------------------------------------------------------------

-- 69. inventory_stock_movements (Append-Only Kirana Stock Audit Trail)
CREATE TABLE inventory_stock_movements (
  id                   UUID                PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_listing_id    UUID                NOT NULL REFERENCES seller_product_listings(id) ON DELETE RESTRICT,
  seller_id            UUID                NOT NULL REFERENCES sellers(id) ON DELETE RESTRICT,
  movement_type        stock_movement_type NOT NULL,
  quantity_delta       NUMERIC(10,3)       NOT NULL,
  quantity_before      NUMERIC(10,3)       NOT NULL,
  quantity_after       NUMERIC(10,3)       NOT NULL,
  reference_type       VARCHAR(40),
  reference_id         UUID,
  reason               TEXT,
  performed_by_user_id UUID                NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  created_at           TIMESTAMPTZ         NOT NULL DEFAULT now()
);

-- 70. cart_items
CREATE TABLE cart_items (
  id                UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  cart_id           UUID          NOT NULL REFERENCES carts(id) ON DELETE CASCADE,
  seller_listing_id UUID          NOT NULL REFERENCES seller_product_listings(id) ON DELETE RESTRICT,
  quantity          NUMERIC(10,3) NOT NULL,
  selected_options  JSONB         NOT NULL DEFAULT '[]'::jsonb,
  customer_note     VARCHAR(255),
  created_at        TIMESTAMPTZ   NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ   NOT NULL DEFAULT now(),
  CONSTRAINT chk_cart_items_quantity CHECK (quantity > 0)
);

-- 71. order_items (Immutable Historical Product & Price Snapshots)
CREATE TABLE order_items (
  id                          UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id                    UUID          NOT NULL REFERENCES orders(id) ON DELETE RESTRICT,
  seller_listing_id           UUID          REFERENCES seller_product_listings(id) ON DELETE SET NULL,
  product_id                  UUID          REFERENCES products(id) ON DELETE SET NULL,
  variant_id                  UUID          REFERENCES product_variants(id) ON DELETE SET NULL,
  product_name_snapshot       VARCHAR(200)  NOT NULL,
  vertical_code_snapshot      VARCHAR(40)   NOT NULL,
  sku_snapshot                VARCHAR(64),
  variant_label_snapshot      VARCHAR(120),
  variant_attributes_snapshot JSONB         NOT NULL DEFAULT '{}'::jsonb,
  selected_options_snapshot   JSONB         NOT NULL DEFAULT '[]'::jsonb,
  mrp_unit_price              NUMERIC(12,2),
  unit_price                  NUMERIC(12,2) NOT NULL,
  item_discount               NUMERIC(12,2) NOT NULL DEFAULT 0.00,
  requested_quantity          NUMERIC(10,3) NOT NULL,
  requested_unit_label        VARCHAR(60)   NOT NULL,
  line_total                  NUMERIC(12,2) NOT NULL,
  returned_quantity           NUMERIC(10,3) NOT NULL DEFAULT 0.000,
  customer_note               VARCHAR(255),
  created_at                  TIMESTAMPTZ   NOT NULL DEFAULT now(),
  CONSTRAINT chk_order_items_qty CHECK (
    requested_quantity > 0
    AND returned_quantity >= 0
    AND returned_quantity <= requested_quantity
    AND unit_price >= 0
    AND item_discount >= 0
    AND line_total >= 0
  )
);

-- 72. refunds
CREATE TABLE refunds (
  id                     UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
  refund_number          VARCHAR(40)    NOT NULL UNIQUE,
  order_id               UUID           NOT NULL REFERENCES orders(id) ON DELETE RESTRICT,
  payment_transaction_id UUID           REFERENCES payment_transactions(id) ON DELETE RESTRICT,
  support_case_id        UUID           REFERENCES support_cases(id) ON DELETE SET NULL,
  order_return_id        UUID           REFERENCES order_returns(id) ON DELETE SET NULL,
  amount                 NUMERIC(12,2)  NOT NULL,
  channel                refund_channel NOT NULL,
  status                 refund_status  NOT NULL DEFAULT 'INITIATED',
  reason                 TEXT           NOT NULL,
  rejection_reason       TEXT,
  failure_reason         TEXT,
  gateway_refund_ref     VARCHAR(120),
  initiated_by_user_id   UUID           NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  initiated_at           TIMESTAMPTZ    NOT NULL DEFAULT now(),
  processed_at           TIMESTAMPTZ,
  updated_at             TIMESTAMPTZ    NOT NULL DEFAULT now(),
  CONSTRAINT chk_refunds_amount CHECK (amount > 0)
);

-- 73. credit_disputes
CREATE TABLE credit_disputes (
  id                  UUID                  PRIMARY KEY DEFAULT gen_random_uuid(),
  credit_profile_id   UUID                  NOT NULL REFERENCES customer_credit_profiles(id) ON DELETE RESTRICT,
  ledger_entry_id     UUID                  NOT NULL REFERENCES credit_ledger_entries(id) ON DELETE RESTRICT,
  seller_id           UUID                  NOT NULL REFERENCES sellers(id) ON DELETE RESTRICT,
  customer_id         UUID                  NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  reason_code         credit_dispute_reason NOT NULL,
  description         TEXT                  NOT NULL,
  status              credit_dispute_status NOT NULL DEFAULT 'OPEN',
  resolution_note     TEXT,
  resolved_by_user_id UUID                  REFERENCES users(id) ON DELETE SET NULL,
  opened_at           TIMESTAMPTZ           NOT NULL DEFAULT now(),
  resolved_at         TIMESTAMPTZ
);

-- ----------------------------------------------------------------------------
-- DEPENDENCY LEVEL 7: Tables Depending on Level 6
-- ----------------------------------------------------------------------------

-- 74. order_return_items
CREATE TABLE order_return_items (
  id              UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  order_return_id UUID          NOT NULL REFERENCES order_returns(id) ON DELETE RESTRICT,
  order_item_id   UUID          NOT NULL REFERENCES order_items(id) ON DELETE RESTRICT,
  quantity        NUMERIC(10,3) NOT NULL,
  refund_amount   NUMERIC(12,2) NOT NULL,
  condition_note  TEXT,
  CONSTRAINT chk_order_return_items_values CHECK (quantity > 0 AND refund_amount >= 0)
);

-- ============================================================================
-- SECTION 3: CRITICAL PARTIAL UNIQUE INDEXES
-- ============================================================================

-- 1. Only one active default address per customer
CREATE UNIQUE INDEX uq_customer_addresses_one_default
  ON customer_addresses (user_id)
  WHERE is_default = TRUE AND deleted_at IS NULL;

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
  WHERE entry_type = 'CREDIT_SALE'::credit_entry_type AND status = 'POSTED'::credit_entry_status;

-- ============================================================================
-- SECTION 4: PERFORMANCE, SEARCH & FOREIGN-KEY INDEXES
-- ============================================================================

-- A. Storefront Discovery & Search Indexes
CREATE INDEX idx_sellers_village_status
  ON sellers (village_id, status, is_open_now, is_paused);

CREATE INDEX idx_sellers_owner_user
  ON sellers (owner_user_id);

CREATE INDEX idx_ssv_village_active
  ON seller_serviceable_villages (village_id, seller_id)
  WHERE is_active = TRUE;

CREATE INDEX idx_products_vertical_cat
  ON products (vertical_id, category_id, moderation_status, is_active);

CREATE INDEX idx_products_search_tsv
  ON products
  USING GIN (to_tsvector('simple', name || ' ' || COALESCE(hindi_name, '')));

CREATE INDEX idx_pav_attr_text
  ON product_attribute_values (attribute_id, value_text);

CREATE INDEX idx_pav_attr_num
  ON product_attribute_values (attribute_id, value_number);

CREATE INDEX idx_product_variants_product
  ON product_variants (product_id);

CREATE INDEX idx_categories_vertical_parent
  ON categories (vertical_id, parent_id);

-- B. Kirana Store Inventory & Low Stock Indexes
CREATE INDEX idx_spl_seller_active
  ON seller_product_listings (seller_id, is_active, is_available)
  WHERE deleted_at IS NULL;

CREATE INDEX idx_spl_product
  ON seller_product_listings (product_id);

CREATE INDEX idx_spl_low_stock
  ON seller_product_listings (seller_id, stock_quantity)
  WHERE track_stock = TRUE
    AND is_available = TRUE
    AND stock_quantity <= low_stock_threshold
    AND deleted_at IS NULL;

CREATE INDEX idx_spl_out_of_stock
  ON seller_product_listings (seller_id)
  WHERE (stock_quantity <= 0 OR is_available = FALSE)
    AND deleted_at IS NULL;

CREATE INDEX idx_spl_expiry
  ON seller_product_listings (seller_id, expiry_date)
  WHERE expiry_date IS NOT NULL AND deleted_at IS NULL;

CREATE INDEX idx_ism_listing_time
  ON inventory_stock_movements (seller_listing_id, created_at DESC);

CREATE INDEX idx_ism_seller_time
  ON inventory_stock_movements (seller_id, created_at DESC);

-- C. Orders, Live Tracking & Seller Terminal Indexes
CREATE INDEX idx_orders_seller_status_time
  ON orders (seller_id, status, created_at DESC);

CREATE INDEX idx_orders_customer_time
  ON orders (customer_id, created_at DESC);

CREATE INDEX idx_orders_village_time
  ON orders (village_id, created_at DESC);

CREATE INDEX idx_orders_accept_sla
  ON orders (accept_deadline_at)
  WHERE status IN ('PLACED'::order_status, 'PENDING'::order_status);

CREATE INDEX idx_order_items_order
  ON order_items (order_id);

CREATE INDEX idx_osh_order_time
  ON order_status_history (order_id, created_at ASC);

CREATE INDEX idx_order_returns_order
  ON order_returns (order_id);

CREATE INDEX idx_order_return_items_return
  ON order_return_items (order_return_id);

CREATE INDEX idx_od_staff_status
  ON order_deliveries (seller_staff_id, status);

CREATE INDEX idx_od_partner_status
  ON order_deliveries (delivery_partner_id, status);

CREATE INDEX idx_cart_items_cart
  ON cart_items (cart_id);

-- D. Payments, Refunds, Settlements & Udhari Indexes
CREATE INDEX idx_ptx_order_time
  ON payment_transactions (order_id, created_at DESC);

CREATE INDEX idx_ptx_status_time
  ON payment_transactions (status, created_at DESC);

CREATE INDEX idx_refunds_order
  ON refunds (order_id);

CREATE INDEX idx_refunds_status_time
  ON refunds (status, initiated_at DESC);

CREATE INDEX idx_settlements_seller_period
  ON seller_settlements (seller_id, period_end DESC);

CREATE INDEX idx_settlement_orders_settlement
  ON seller_settlement_orders (settlement_id);

CREATE INDEX idx_ccp_seller_status_bal
  ON customer_credit_profiles (seller_id, status, outstanding_balance DESC);

CREATE INDEX idx_ccp_customer
  ON customer_credit_profiles (customer_id);

CREATE INDEX idx_credit_repayments_profile_time
  ON credit_repayments (credit_profile_id, received_at DESC);

CREATE INDEX idx_cle_profile_time
  ON credit_ledger_entries (credit_profile_id, posted_at DESC);

CREATE INDEX idx_cle_overdue_scan
  ON credit_ledger_entries (due_date)
  WHERE entry_type = 'CREDIT_SALE'::credit_entry_type
    AND status = 'POSTED'::credit_entry_status
    AND is_overdue = FALSE;

CREATE INDEX idx_credit_disputes_profile_status
  ON credit_disputes (credit_profile_id, status);

-- E. Offers, Reviews, Support, Safety, Notifications & Audit Indexes
CREATE INDEX idx_coupon_redemptions_coupon_customer
  ON coupon_redemptions (coupon_id, customer_id);

CREATE INDEX idx_reviews_seller_status
  ON reviews (seller_id, status, created_at DESC);

CREATE INDEX idx_support_cases_status_time
  ON support_cases (status, created_at DESC);

CREATE INDEX idx_support_cases_order
  ON support_cases (order_id);

CREATE INDEX idx_seller_exam_attempts_seller
  ON seller_exam_attempts (seller_id, submitted_at DESC);

CREATE INDEX idx_safety_audits_seller
  ON safety_inspection_audits (seller_id, inspected_at DESC);

CREATE INDEX idx_notif_user_unread
  ON notifications (user_id, created_at DESC)
  WHERE is_read = FALSE;

CREATE INDEX idx_audit_entity_time
  ON audit_logs (target_entity, target_id, created_at DESC);

CREATE INDEX idx_audit_actor_time
  ON audit_logs (actor_user_id, created_at DESC);

CREATE INDEX idx_auth_tokens_user_type
  ON auth_tokens (user_id, token_type, expires_at DESC);

CREATE INDEX idx_customer_addresses_user
  ON customer_addresses (user_id)
  WHERE deleted_at IS NULL;

CREATE INDEX idx_seller_kyc_docs_seller
  ON seller_kyc_documents (seller_id, status);

CREATE INDEX idx_seller_kyc_events_doc
  ON seller_kyc_document_events (kyc_document_id, created_at ASC);

CREATE INDEX idx_seller_staff_seller
  ON seller_staff_members (seller_id, is_active);

COMMIT;
