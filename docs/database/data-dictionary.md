# GramBazaar Data Dictionary

Complete column-level specification for all **74 tables** across the 13 GramBazaar domains (PostgreSQL 16+ / Prisma ORM).

**Legend:** `PK` = Primary Key · `FK` = Foreign Key · `UQ` = Unique · `NN` = NOT NULL · `NULL` = Nullable

---

## Domain 1: Identity, Authentication & RBAC

### 1. `users`
| Column | Type | Null | Default | Keys / Constraints | Description |
|---|---|---|---|---|---|
| `id` | `uuid` | NN | `gen_random_uuid()` | PK | Unique user identifier |
| `full_name` | `varchar(120)` | NN | — | — | User's full display name |
| `phone` | `varchar(15)` | NN | — | UQ | E.164 mobile number (`+91XXXXXXXXXX`) |
| `email` | `varchar(255)` | NULL | `NULL` | UQ | Optional email address (lowercased) |
| `password_hash` | `text` | NN | — | — | Argon2id password hash |
| `avatar_url` | `text` | NULL | `NULL` | — | Profile image URL |
| `active_village_id` | `uuid` | NULL | `NULL` | FK → `villages.id` | User's currently selected village |
| `status` | `user_status` | NN | `'ACTIVE'` | — | `ACTIVE`, `BLOCKED`, `SUSPENDED`, `INACTIVE` |
| `block_reason` | `text` | NULL | `NULL` | — | Mandatory when `status = 'BLOCKED'` |
| `admin_notes` | `text` | NULL | `NULL` | — | Internal admin remarks |
| `terms_accepted_at` | `timestamptz` | NULL | `NULL` | — | Timestamp of T&C consent on signup |
| `phone_verified_at` | `timestamptz` | NULL | `NULL` | — | OTP verification timestamp |
| `last_login_at` | `timestamptz` | NULL | `NULL` | — | Most recent authenticated login |
| `created_at` | `timestamptz` | NN | `now()` | — | Creation timestamp |
| `updated_at` | `timestamptz` | NN | `now()` | — | Last update timestamp |
| `deleted_at` | `timestamptz` | NULL | `NULL` | — | Soft-delete timestamp |

### 2. `roles`
| Column | Type | Null | Default | Keys / Constraints | Description |
|---|---|---|---|---|---|
| `id` | `uuid` | NN | `gen_random_uuid()` | PK | Role ID |
| `code` | `role_code` | NN | — | UQ | Canonical role code |
| `name` | `varchar(80)` | NN | — | — | Human-readable role title |
| `description` | `text` | NULL | `NULL` | — | Role responsibilities |
| `is_system` | `boolean` | NN | `true` | — | Prevents accidental deletion of system roles |
| `created_at` | `timestamptz` | NN | `now()` | — | Creation timestamp |

### 3. `user_roles`
| Column | Type | Null | Default | Keys / Constraints | Description |
|---|---|---|---|---|---|
| `id` | `uuid` | NN | `gen_random_uuid()` | PK | Assignment ID |
| `user_id` | `uuid` | NN | — | FK → `users.id`, UQ(`user_id, role_id`) | Target user |
| `role_id` | `uuid` | NN | — | FK → `roles.id`, UQ(`user_id, role_id`) | Assigned role |
| `assigned_by_user_id` | `uuid` | NULL | `NULL` | FK → `users.id` | Admin who assigned role |
| `created_at` | `timestamptz` | NN | `now()` | — | Assignment timestamp |

### 4. `role_permissions`
| Column | Type | Null | Default | Keys / Constraints | Description |
|---|---|---|---|---|---|
| `id` | `uuid` | NN | `gen_random_uuid()` | PK | Permission row ID |
| `role_id` | `uuid` | NN | — | FK → `roles.id`, UQ(`role_id, module_key`) | Target role |
| `module_key` | `varchar(60)` | NN | — | UQ(`role_id, module_key`) | Admin module key (e.g., `SELLERS`, `PAYOUTS`, `UDHARI`) |
| `can_view` | `boolean` | NN | `false` | — | Read access flag |
| `can_manage` | `boolean` | NN | `false` | — | Create/edit access flag |
| `can_approve` | `boolean` | NN | `false` | — | Approval/moderation access flag |
| `can_export` | `boolean` | NN | `false` | — | CSV/report export access flag |
| `updated_at` | `timestamptz` | NN | `now()` | — | Last update timestamp |

### 5. `admin_village_scopes`
| Column | Type | Null | Default | Keys / Constraints | Description |
|---|---|---|---|---|---|
| `user_id` | `uuid` | NN | — | PK, FK → `users.id` | Admin user |
| `village_id` | `uuid` | NN | — | PK, FK → `villages.id` | Assigned village |
| `assigned_at` | `timestamptz` | NN | `now()` | — | Assignment timestamp |

### 6. `auth_tokens`
| Column | Type | Null | Default | Keys / Constraints | Description |
|---|---|---|---|---|---|
| `id` | `uuid` | NN | `gen_random_uuid()` | PK | Token record ID |
| `user_id` | `uuid` | NN | — | FK → `users.id` | Token owner |
| `token_type` | `auth_token_type` | NN | — | — | `REFRESH_SESSION`, `PASSWORD_RESET`, `PHONE_OTP`, `EMAIL_VERIFY` |
| `token_hash` | `varchar(128)` | NN | — | UQ | SHA-256 hash of raw token/OTP |
| `expires_at` | `timestamptz` | NN | — | — | Expiration timestamp |
| `consumed_at` | `timestamptz` | NULL | `NULL` | — | Timestamp when used/revoked |
| `ip_address` | `inet` | NULL | `NULL` | — | Request IP |
| `user_agent` | `text` | NULL | `NULL` | — | Client device info |
| `created_at` | `timestamptz` | NN | `now()` | — | Issued timestamp |

---

## Domain 2: Geography & Rural Addresses

### 7. `villages`
| Column | Type | Null | Default | Keys / Constraints | Description |
|---|---|---|---|---|---|
| `id` | `uuid` | NN | `gen_random_uuid()` | PK | Village ID |
| `code` | `varchar(40)` | NN | — | UQ | Machine-readable village slug (e.g., `rampur-up`) |
| `name` | `varchar(120)` | NN | — | UQ(`name, district, state`) | English village name |
| `hindi_name` | `varchar(120)` | NULL | `NULL` | — | Devanagari village name |
| `district` | `varchar(100)` | NN | — | UQ(`name, district, state`) | District name |
| `state` | `varchar(100)` | NN | — | UQ(`name, district, state`) | Indian State / UT |
| `postal_codes` | `text[]` | NN | `'{}'` | — | Array of PIN codes |
| `base_delivery_fee` | `numeric(12,2)` | NN | `0.00` | `CHECK >= 0` | Standard intra-village delivery fee (₹) |
| `min_order_free_delivery` | `numeric(12,2)` | NN | `0.00` | `CHECK >= 0` | Threshold for free delivery (₹) |
| `latitude` | `numeric(9,6)` | NULL | `NULL` | — | Village center latitude |
| `longitude` | `numeric(9,6)` | NULL | `NULL` | — | Village center longitude |
| `is_active` | `boolean` | NN | `true` | — | Serviceability toggle |
| `created_at` / `updated_at` | `timestamptz` | NN | `now()` | — | Audit timestamps |

### 8. `village_landmarks`
| Column | Type | Null | Default | Keys / Constraints | Description |
|---|---|---|---|---|---|
| `id` | `uuid` | NN | `gen_random_uuid()` | PK | Landmark ID |
| `village_id` | `uuid` | NN | — | FK → `villages.id`, UQ(`village_id, name`) | Parent village |
| `name` | `varchar(150)` | NN | — | UQ(`village_id, name`) | Landmark title (e.g., *Kali Mandir Chowk*) |
| `hindi_name` | `varchar(150)` | NULL | `NULL` | — | Hindi landmark name |
| `is_popular` | `boolean` | NN | `true` | — | Highlighted in quick-select dropdown |
| `is_active` | `boolean` | NN | `true` | — | Active flag |
| `created_at` | `timestamptz` | NN | `now()` | — | Creation timestamp |

### 9. `inter_village_routes`
| Column | Type | Null | Default | Keys / Constraints | Description |
|---|---|---|---|---|---|
| `id` | `uuid` | NN | `gen_random_uuid()` | PK | Route ID |
| `from_village_id` | `uuid` | NN | — | FK → `villages.id`, UQ(`from, to`) | Origin village |
| `to_village_id` | `uuid` | NN | — | FK → `villages.id`, UQ(`from, to`), `CHECK(from <> to)` | Destination village |
| `distance_km` | `numeric(6,2)` | NN | — | `CHECK >= 0` | Road distance in kilometers |
| `surcharge_amount` | `numeric(12,2)` | NN | `0.00` | `CHECK >= 0` | Extra inter-village delivery fee (₹) |
| `is_active` | `boolean` | NN | `true` | — | Route enabled flag |
| `created_at` / `updated_at` | `timestamptz` | NN | `now()` | — | Audit timestamps |

### 10. `customer_addresses`
| Column | Type | Null | Default | Keys / Constraints | Description |
|---|---|---|---|---|---|
| `id` | `uuid` | NN | `gen_random_uuid()` | PK | Address ID |
| `user_id` | `uuid` | NN | — | FK → `users.id` | Customer owner |
| `village_id` | `uuid` | NN | — | FK → `villages.id` | Village of address |
| `recipient_name` | `varchar(120)` | NN | — | — | Person receiving order |
| `recipient_phone` | `varchar(15)` | NN | — | — | Contact phone at doorstep |
| `address_line1` | `varchar(255)` | NN | — | — | House / Mohalla / Street |
| `landmark` | `varchar(200)` | NN | — | — | Mandatory rural landmark |
| `address_label` | `address_label` | NN | `'HOME'` | — | `HOME`, `WORK`, `OTHER` |
| `latitude` / `longitude` | `numeric(9,6)` | NULL | `NULL` | — | Optional GPS pin |
| `is_default` | `boolean` | NN | `false` | Partial UQ per `user_id` | Default checkout address |
| `created_at` / `updated_at` / `deleted_at` | `timestamptz` | NN / NN / NULL | `now()` | — | Lifecycle timestamps |

---

## Domain 3: Verticals, Sellers, Onboarding, KYC & Shop Staff

### 11. `verticals`
| Column | Type | Null | Default | Keys / Constraints | Description |
|---|---|---|---|---|---|
| `id` | `uuid` | NN | `gen_random_uuid()` | PK | Vertical ID |
| `code` | `varchar(40)` | NN | — | UQ | `FOOD`, `GROCERY`, `HARDWARE`, `APPAREL`, `ELECTRONICS`, `FURNITURE`, `AGRICULTURE` |
| `name` / `hindi_name` | `varchar(100)` | NN / NULL | — | — | Display names |
| `icon` | `varchar(60)` | NULL | `NULL` | — | UI icon key |
| `description` | `text` | NULL | `NULL` | — | Vertical overview |
| `fulfillment_workflow` | `vertical_workflow_type` | NN | — | — | `FOOD_KITCHEN`, `GROCERY_WEIGHT`, `PHYSICAL_RETAIL`, `MADE_TO_ORDER` |
| `required_kyc_docs` | `kyc_doc_code[]` | NN | `'{}'` | — | Mandatory KYC codes for sellers in this vertical |
| `special_rules` | `text[]` | NN | `'{}'` | — | Policy notes (e.g., *No Tiffin Services*) |
| `is_enabled` | `boolean` | NN | `true` | — | Marketplace visibility switch |
| `sort_order` | `integer` | NN | `0` | — | Display ordering |
| `created_at` / `updated_at` | `timestamptz` | NN | `now()` | — | Timestamps |

### 12. `sellers`
| Column | Type | Null | Default | Keys / Constraints | Description |
|---|---|---|---|---|---|
| `id` | `uuid` | NN | `gen_random_uuid()` | PK | Seller shop ID |
| `owner_user_id` | `uuid` | NN | — | FK → `users.id` | Shop owner user account |
| `public_name` | `varchar(160)` | NN | — | — | Public storefront shop name |
| `business_type` | `seller_business_type` | NN | — | — | `RESTAURANT`, `HOTEL`, `DHABA`, `BAKERY`, `KIRANA`, etc. |
| `primary_vertical_id` | `uuid` | NN | — | FK → `verticals.id` | Main business vertical |
| `description` | `text` | NULL | `NULL` | — | Shop bio / specialty |
| `contact_phone` / `email` | `varchar(15)` / `varchar(255)` | NN / NULL | — | — | Shop phone/WhatsApp and optional email |
| `village_id` | `uuid` | NN | — | FK → `villages.id` | Physical village location |
| `shop_address` / `pin_code` | `varchar(255)` / `varchar(10)` | NN / NULL | — | — | Physical shop address & PIN |
| `status` | `seller_account_status` | NN | `'PENDING_APPROVAL'` | — | Lifecycle status (replaces separate applications table) |
| `kyc_status` | `kyc_status` | NN | `'PENDING'` | — | Aggregate KYC verification status |
| `is_open_now` / `is_paused` | `boolean` | NN | `false` | — | Real-time open/manual-pause flags |
| `supports_delivery` / `supports_pickup` | `boolean` | NN | `true` | — | Supported fulfilment modes |
| `delivery_radius_km` | `numeric(5,2)` | NN | `5.00` | `CHECK >= 0` | Max runner delivery distance |
| `minimum_order_amount` | `numeric(12,2)` | NN | `0.00` | `CHECK >= 0` | Minimum cart subtotal (₹) |
| `packaging_fee` / `delivery_fee` | `numeric(12,2)` | NN | `0.00` | `CHECK >= 0` | Default seller packaging & delivery charges (₹) |
| `opening_time` / `closing_time` | `time` | NULL | `NULL` | — | Daily shop schedule |
| `closed_days` | `text[]` | NN | `'{}'` | — | Weekly off days (e.g., `['Tuesday']`) |
| `fssai_number` / `fssai_verified` | `varchar(20)` / `boolean` | NULL / NN | `NULL` / `false` | — | 14-digit FSSAI license & verification flag |
| `gst_or_trade_number` / `agri_license_number` | `varchar(30)` / `varchar(40)` | NULL | `NULL` | — | Optional GSTIN/Trade/Agri license numbers |
| `upi_id` | `varchar(120)` | NULL | `NULL` | — | Direct Seller UPI VPA for QR payments |
| `bank_account_holder` | `varchar(120)` | NULL | `NULL` | — | Beneficiary name for payouts |
| `bank_account_encrypted` / `bank_account_last4` | `text` / `varchar(4)` | NULL | `NULL` | — | AES-256-GCM encrypted account # and masked last 4 |
| `ifsc_code` | `varchar(11)` | NULL | `NULL` | — | Bank IFSC code |
| `commission_rate_bps` | `integer` | NN | `500` | `CHECK 0..5000` | Seller commission override in basis points (`500` = 5%) |
| `udhari_enabled` | `boolean` | NN | `false` | — | Master switch for seller-managed Udhari |
| `udhari_policy_acknowledged_at` | `timestamptz` | NULL | `NULL` | — | Policy acceptance timestamp |
| `banner_url` / `logo_initials` | `text` / `varchar(4)` | NULL | `NULL` | — | Storefront visual branding |
| `rating_avg` / `review_count` | `numeric(3,2)` / `integer` | NN | `0.00` / `0` | — | Denormalized published review summary |
| `suspension_reason` / `rejection_reason` / `kyc_change_request_notes` | `text` | NULL | `NULL` | — | Admin governance remarks |
| `reviewed_by_user_id` / `reviewed_at` / `joined_at` | `uuid` / `timestamptz` | NULL | `NULL` | FK → `users.id` | Onboarding approval traceability |
| `created_at` / `updated_at` / `deleted_at` | `timestamptz` | NN / NN / NULL | `now()` | — | Lifecycle timestamps |

### 13. `seller_verticals`
| Column | Type | Null | Default | Keys / Constraints | Description |
|---|---|---|---|---|---|
| `seller_id` | `uuid` | NN | — | PK, FK → `sellers.id` | Seller ID |
| `vertical_id` | `uuid` | NN | — | PK, FK → `verticals.id` | Assigned vertical |
| `is_primary` | `boolean` | NN | `false` | — | Primary vertical indicator |
| `created_at` | `timestamptz` | NN | `now()` | — | Assignment timestamp |

### 14. `seller_serviceable_villages`
| Column | Type | Null | Default | Keys / Constraints | Description |
|---|---|---|---|---|---|
| `seller_id` | `uuid` | NN | — | PK, FK → `sellers.id` | Seller ID |
| `village_id` | `uuid` | NN | — | PK, FK → `villages.id` | Serviceable destination village |
| `custom_delivery_fee` | `numeric(12,2)` | NULL | `NULL` | `CHECK >= 0` | Optional seller override delivery fee |
| `is_active` | `boolean` | NN | `true` | — | Active delivery coverage toggle |
| `created_at` | `timestamptz` | NN | `now()` | — | Timestamp |

### 15. `seller_kyc_documents`
| Column | Type | Null | Default | Keys / Constraints | Description |
|---|---|---|---|---|---|
| `id` | `uuid` | NN | `gen_random_uuid()` | PK | Document ID |
| `seller_id` | `uuid` | NN | — | FK → `sellers.id`, UQ(`seller_id, doc_code`) | Owning seller |
| `doc_code` | `kyc_doc_code` | NN | — | UQ(`seller_id, doc_code`) | `FSSAI`, `AADHAAR`, `PAN`, `STORE_PHOTO`, `GST_TRADE`, `AGRI_LICENSE` |
| `label` | `varchar(100)` | NN | — | — | Display label |
| `document_number_encrypted` | `text` | NULL | `NULL` | — | Encrypted ID/license number |
| `document_number_masked` | `varchar(40)` | NULL | `NULL` | — | Masked UI display value |
| `file_url` / `file_name` | `text` / `varchar(200)` | NN | — | — | Signed-URL storage key & filename |
| `status` | `kyc_status` | NN | `'PENDING'` | — | Verification status |
| `rejection_reason` | `text` | NULL | `NULL` | — | Reason if rejected/changes requested |
| `reviewed_by_user_id` / `reviewed_at` | `uuid` / `timestamptz` | NULL | `NULL` | FK → `users.id` | Reviewing admin |
| `uploaded_at` / `updated_at` | `timestamptz` | NN | `now()` | — | Timestamps |

### 16. `seller_kyc_document_events`
| Column | Type | Null | Default | Keys / Constraints | Description |
|---|---|---|---|---|---|
| `id` | `uuid` | NN | `gen_random_uuid()` | PK | Event ID |
| `kyc_document_id` | `uuid` | NN | — | FK → `seller_kyc_documents.id` | Target KYC document |
| `status` | `kyc_status` | NN | — | — | Resulting status |
| `actor_user_id` | `uuid` | NN | — | FK → `users.id` | Reviewing admin or seller |
| `note` | `text` | NN | — | — | Verification comment |
| `created_at` | `timestamptz` | NN | `now()` | — | Event timestamp |

### 17. `seller_staff_members`
| Column | Type | Null | Default | Keys / Constraints | Description |
|---|---|---|---|---|---|
| `id` | `uuid` | NN | `gen_random_uuid()` | PK | Staff/runner ID |
| `seller_id` | `uuid` | NN | — | FK → `sellers.id` | Employing shop |
| `user_id` | `uuid` | NULL | `NULL` | FK → `users.id` | Optional linked login account |
| `full_name` / `phone` | `varchar(120)` / `varchar(15)` | NN | — | — | Staff/runner contact |
| `staff_role` | `seller_staff_role` | NN | — | — | `MANAGER`, `CASHIER`, `SHOP_RUNNER`, `DELIVERY_STAFF`, `FAMILY_HELPER` |
| `is_available` / `is_active` | `boolean` | NN | `true` | — | Dispatch availability & employment toggle |
| `created_at` / `updated_at` | `timestamptz` | NN | `now()` | — | Timestamps |

---

## Domain 4: Universal Product Catalog & 8 Centralized Masters

### 18. `categories`
| Column | Type | Null | Default | Keys / Constraints | Description |
|---|---|---|---|---|---|
| `id` | `uuid` | NN | `gen_random_uuid()` | PK | Category ID |
| `vertical_id` | `uuid` | NN | — | FK → `verticals.id` | Parent vertical |
| `parent_id` | `uuid` | NULL | `NULL` | FK → `categories.id` | `NULL` = root category; set = subcategory |
| `name` / `hindi_name` | `varchar(120)` | NN / NULL | — | — | Category names |
| `slug` | `varchar(140)` | NN | — | UQ | URL-safe unique slug |
| `icon` | `varchar(60)` | NULL | `NULL` | — | UI icon |
| `sort_order` | `integer` | NN | `0` | — | Display sort position |
| `is_active` | `boolean` | NN | `true` | — | Active flag |
| `created_at` / `updated_at` | `timestamptz` | NN | `now()` | — | Timestamps |

### 19–20. `brands` & `brand_verticals`
- **`brands`**: `id` (PK), `code` (`varchar(40)` UQ NULL), `name` (`varchar(120)` UQ NN), `manufacturer` (`varchar(160)` NULL), `description` (`text` NULL), `is_verified` (`boolean` DEFAULT `false`), `is_active` (`boolean` DEFAULT `true`), `created_at`, `updated_at`.
- **`brand_verticals`**: `brand_id` (PK, FK → `brands.id`), `vertical_id` (PK, FK → `verticals.id`).

### 21–22. `units` & `category_allowed_units`
- **`units`**: `id` (PK), `name` (`varchar(80)` NN), `hindi_name` (`varchar(80)` NULL), `symbol` (`varchar(20)` UQ NN), `family` (`unit_family` NN), `base_unit` (`varchar(20)` NULL), `conversion_factor` (`numeric(12,4)` NULL), `allow_decimal` (`boolean` DEFAULT `false`), `allow_seller_local_override` (`boolean` DEFAULT `false`), `is_active` (`boolean` DEFAULT `true`), `created_at`.
- **`category_allowed_units`**: `category_id` (PK, FK → `categories.id`), `unit_id` (PK, FK → `units.id`).

### 23–24. `attributes` & `category_attributes`
- **`attributes`**: `id` (PK), `name` (`varchar(100)` NN), `hindi_name` (`varchar(100)` NULL), `slug` (`varchar(120)` UQ NN), `data_type` (`attribute_data_type` NN), `allowed_options` (`jsonb` NULL), `unit_suffix` (`varchar(20)` NULL), `is_required` (`boolean` DEFAULT `false`), `is_filterable` (`boolean` DEFAULT `true`), `is_variant_axis` (`boolean` DEFAULT `false`), `is_active` (`boolean` DEFAULT `true`), `created_at`, `updated_at`.
- **`category_attributes`**: `category_id` (PK, FK → `categories.id`), `attribute_id` (PK, FK → `attributes.id`), `is_required_override` (`boolean` NULL).

### 25–26. `option_groups` & `option_group_items`
- **`option_groups`**: `id` (PK), `name` (`varchar(120)` NN), `hindi_name` (`varchar(120)` NULL), `vertical_id` (FK → `verticals.id` NULL), `category_id` (FK → `categories.id` NULL), `selection_type` (`selection_type` NN), `is_required` (`boolean` DEFAULT `false`), `min_select` (`integer` DEFAULT `0`), `max_select` (`integer` DEFAULT `1`), `is_active` (`boolean` DEFAULT `true`), `created_at`, `updated_at`.
- **`option_group_items`**: `id` (PK), `option_group_id` (FK → `option_groups.id` NN), `label` (`varchar(120)` NN), `price_delta` (`numeric(12,2)` DEFAULT `0.00`), `diet_type` (`diet_type` NULL), `is_default` (`boolean` DEFAULT `false`), `is_available` (`boolean` DEFAULT `true`), `sort_order` (`integer` DEFAULT `0`).

### 27. `packaging_masters`
| Column | Type | Null | Default | Keys / Constraints | Description |
|---|---|---|---|---|---|
| `id` | `uuid` | NN | `gen_random_uuid()` | PK | Packaging master ID |
| `code` | `varchar(40)` | NN | — | UQ | Short code (e.g., `PKG-THALI-500`) |
| `name` / `hindi_name` | `varchar(120)` | NN / NULL | — | — | Packaging name |
| `material_type` | `packaging_material_type` | NN | — | — | Container / pouch / eco-bag classification |
| `capacity_label` | `varchar(60)` | NN | — | — | E.g., `500 ml`, `Up to 5 kg` |
| `unit_id` | `uuid` | NULL | `NULL` | FK → `units.id` | Optional linked unit |
| `fee_amount` | `numeric(12,2)` | NN | `0.00` | `CHECK >= 0` | Standard packaging fee (₹) |
| `is_food_grade` / `is_eco_friendly` / `is_leak_proof` | `boolean` | NN | `false` | — | Safety & sustainability flags |
| `is_active` | `boolean` | NN | `true` | — | Active flag |
| `created_at` | `timestamptz` | NN | `now()` | — | Creation timestamp |

### 28. `availability_stock_configs`
| Column | Type | Null | Default | Keys / Constraints | Description |
|---|---|---|---|---|---|
| `id` | `uuid` | NN | `gen_random_uuid()` | PK | Rule ID |
| `code` | `varchar(40)` | NN | — | UQ | Rule code |
| `name` | `varchar(120)` | NN | — | — | Display rule name |
| `vertical_id` / `category_id` | `uuid` | NN / NULL | — | FK → `verticals.id`, `categories.id` | Target scope |
| `workflow_mode` | `availability_workflow_mode` | NN | — | — | `TRACKED_INVENTORY`, `DAILY_PREP_SLOTS`, `MADE_TO_ORDER`, `UNLIMITED_SERVICE` |
| `service_slots` | `text[]` | NN | `'{}'` | — | E.g., `['Morning 8-12', 'Evening 5-10']` |
| `prep_time_minutes` / `daily_batch_limit` | `integer` | NULL | `NULL` | — | Kitchen prep & batch caps |
| `default_low_stock_threshold` | `numeric(10,3)` | NN | `5.000` | `CHECK >= 0` | Default Kirana reorder alert threshold |
| `max_qty_per_order` | `numeric(10,3)` | NN | `20.000` | `CHECK > 0` | Anti-hoarding per-order limit |
| `auto_disable_on_zero_stock` / `allow_pre_order` | `boolean` | NN | `true` / `false` | — | Stock automation flags |
| `restock_lead_hours` | `integer` | NULL | `NULL` | — | Estimated restock lead time |
| `is_active` | `boolean` | NN | `true` | — | Active flag |
| `created_at` / `updated_at` | `timestamptz` | NN | `now()` | — | Timestamps |

### 29–32. `products`, `product_attribute_values`, `product_variants`, `product_option_groups`
- **`products`**: `id` (PK), `sku_code` (`varchar(64)` UQ NN), `vertical_id` (FK NN), `category_id` (FK NN), `subcategory_id` (FK NULL), `brand_id` (FK NULL), `default_unit_id` (FK NN), `default_packaging_id` (FK NULL), `availability_config_id` (FK NULL), `tax_slab_id` (FK NULL), `name` (`varchar(200)` NN), `hindi_name` (`varchar(200)` NULL), `description` (`text` NULL), `diet_type` (`diet_type` NULL), `image_url` (`text` NULL), `is_universal_template` (`boolean` DEFAULT `false`), `created_by_seller_id` (FK → `sellers.id` NULL), `moderation_status` (`moderation_status` DEFAULT `'PENDING_REVIEW'`), `moderation_notes` (`text` NULL), `moderated_by_user_id` (FK → `users.id` NULL), `moderated_at` (`timestamptz` NULL), `is_active` (`boolean` DEFAULT `true`), `created_at`, `updated_at`, `deleted_at`.
- **`product_attribute_values`**: `id` (PK), `product_id` (FK NN), `attribute_id` (FK NN), `value_text` (`text` NULL), `value_number` (`numeric(12,4)` NULL), `value_boolean` (`boolean` NULL), `value_json` (`jsonb` NULL), `UQ(product_id, attribute_id)`.
- **`product_variants`**: `id` (PK), `product_id` (FK NN), `sku` (`varchar(64)` UQ NN), `label` (`varchar(120)` NN), `unit_id` (FK NN), `unit_quantity` (`numeric(10,3)` NN), `variant_attributes` (`jsonb` NN), `default_mrp` (`numeric(12,2)` NN), `is_active` (`boolean` DEFAULT `true`), `created_at`, `updated_at`.
- **`product_option_groups`**: `product_id` (PK, FK), `option_group_id` (PK, FK), `sort_order` (`integer` DEFAULT `0`).

---

## Domain 5: Seller Listings & Kirana Store Inventory

### 33. `seller_product_listings`
| Column | Type | Null | Default | Keys / Constraints | Description |
|---|---|---|---|---|---|
| `id` | `uuid` | NN | `gen_random_uuid()` | PK | Listing ID |
| `seller_id` | `uuid` | NN | — | FK → `sellers.id` | Owning seller |
| `product_id` | `uuid` | NN | — | FK → `products.id` | Universal product |
| `variant_id` | `uuid` | NULL | `NULL` | FK → `product_variants.id` | Optional product variant |
| `seller_sku` | `varchar(64)` | NULL | `NULL` | — | Shop-specific Kirana SKU (e.g., `KIR-ATTA-01`) |
| `mrp_price` / `selling_price` | `numeric(12,2)` | NN | — | `CHECK(selling_price >= 0 AND mrp_price >= selling_price)` | Shop MRP & selling rate (₹) |
| `inventory_mode` | `inventory_mode` | NN | — | — | `QUANTITY_STOCK`, `WEIGHT_STOCK`, `VARIANT_STOCK`, `PREPARED_FOOD`, `MADE_TO_ORDER` |
| `quantity_mode` | `quantity_mode` | NN | `'FIXED_PACK'` | — | `FIXED_PACK`, `PREDEFINED_OPTIONS`, `CUSTOM_QUANTITY` |
| `predefined_quantity_options` | `jsonb` | NULL | `NULL` | — | Quick-pick weights/packs (`250g`, `500g`, `1kg`) |
| `min_quantity` / `quantity_step` | `numeric(10,3)` | NN | `1.000` | `CHECK > 0` | Min purchasable qty & increment step |
| `quantity_precision` | `smallint` | NN | `0` | `CHECK 0..3` | Decimal places allowed |
| `variable_weight` | `boolean` | NN | `false` | — | True for loose weighed produce/staples |
| `local_unit_label` / `local_unit_conversion_grams` / `local_unit_note` | `varchar(40)` / `numeric(10,2)` / `varchar(200)` | NULL | `NULL` | — | Seller rural local unit definition (e.g., `1 pav = 250g`) |
| `prep_time_minutes` / `lead_time_days` | `integer` | NULL | `NULL` | — | Kitchen prep time or made-to-order lead days |
| `track_stock` | `boolean` | NN | `true` | — | Whether inventory count is actively tracked |
| `stock_quantity` / `reserved_quantity` | `numeric(10,3)` | NN | `0.000` | `CHECK >= 0` | On-hand and checkout-reserved stock |
| `low_stock_threshold` | `numeric(10,3)` | NN | `5.000` | `CHECK >= 0` | Triggers Low Stock alert when `0 < qty <= threshold` |
| `shelf_location` | `varchar(80)` | NULL | `NULL` | — | Kirana rack/aisle (e.g., `Rack A1 - Staples`) |
| `batch_number` / `expiry_date` | `varchar(60)` / `date` | NULL | `NULL` | — | Batch & FEFO expiry tracking |
| `supplier_name` | `varchar(140)` | NULL | `NULL` | — | Mandi / wholesaler / distributor name |
| `is_available` / `is_active` | `boolean` | NN | `true` | — | Storefront availability & active flags |
| `moderation_status` | `moderation_status` | NN | `'APPROVED'` | — | Listing approval status |
| `created_at` / `updated_at` / `deleted_at` | `timestamptz` | NN / NN / NULL | `now()` | — | Lifecycle timestamps |

### 34–35. `inventory_stock_movements` & `seller_bulk_inventory_jobs`
- **`inventory_stock_movements`**: `id` (PK), `seller_listing_id` (FK NN), `seller_id` (FK NN), `movement_type` (`stock_movement_type` NN), `quantity_delta` (`numeric(10,3)` NN), `quantity_before` (`numeric(10,3)` NN), `quantity_after` (`numeric(10,3)` NN), `reference_type` (`varchar(40)` NULL), `reference_id` (`uuid` NULL), `reason` (`text` NULL), `performed_by_user_id` (FK → `users.id` NN), `created_at`.
- **`seller_bulk_inventory_jobs`**: `id` (PK), `seller_id` (FK NN), `initiated_by_user_id` (FK NN), `affected_listings_count` (`integer` NN), `payload_summary` (`jsonb` NN), `created_at`.

---

## Domain 6: Shopping Cart

### 36–37. `carts` & `cart_items`
- **`carts`**: `id` (PK), `customer_id` (UQ FK → `users.id` NN), `seller_id` (FK → `sellers.id` NULL), `village_id` (FK → `villages.id` NULL), `fulfilment_mode` (`fulfilment_mode` DEFAULT `'DELIVERY'`), `coupon_id` (FK → `offers_coupons.id` NULL), `created_at`, `updated_at`.
- **`cart_items`**: `id` (PK), `cart_id` (FK → `carts.id` NN), `seller_listing_id` (FK → `seller_product_listings.id` NN), `quantity` (`numeric(10,3)` NN `CHECK > 0`), `selected_options` (`jsonb` DEFAULT `'[]'`), `customer_note` (`varchar(255)` NULL), `created_at`, `updated_at`.

---

## Domain 7: Orders, Historical Snapshots, Cancellations & Returns

### 38. `orders`
| Column | Type | Null | Default | Keys / Constraints | Description |
|---|---|---|---|---|---|
| `id` | `uuid` | NN | `gen_random_uuid()` | PK | Order ID |
| `order_number` | `varchar(30)` | NN | — | UQ | Human-readable number (`GB-2026-0042`) |
| `customer_id` / `seller_id` / `village_id` | `uuid` | NN | — | FK → `users`, `sellers`, `villages` | Core order parties & location |
| `fulfilment_mode` | `fulfilment_mode` | NN | — | — | `DELIVERY` or `PICKUP` |
| `delivery_address_id` | `uuid` | NULL | `NULL` | FK → `customer_addresses.id` | Original address ref |
| `delivery_address_snapshot` | `jsonb` | NULL | `NULL` | — | Frozen doorstep address + landmark snapshot |
| `delivery_note` | `text` | NULL | `NULL` | — | Delivery instructions |
| `status` | `order_status` | NN | `'PLACED'` | — | Current state machine status |
| `payment_method` / `payment_status` | `payment_method` / `payment_status` | NN | — / `'PENDING'` | — | Payment mode & aggregate status |
| `coupon_id` / `coupon_code_snapshot` | `uuid` / `varchar(40)` | NULL | `NULL` | FK → `offers_coupons.id` | Applied coupon reference & frozen code |
| `item_subtotal` / `item_discount` / `coupon_discount` | `numeric(12,2)` | NN | — / `0.00` | `CHECK >= 0` | Item & discount totals (₹) |
| `delivery_fee` / `packaging_fee` / `tax_amount` / `platform_fee` | `numeric(12,2)` | NN | `0.00` | `CHECK >= 0` | Charge breakdown (₹) |
| `tax_label_snapshot` | `varchar(80)` | NULL | `NULL` | — | Frozen tax slab description |
| `total_amount` | `numeric(12,2)` | NN | — | `CHECK >= 0` | Final customer payable total (₹) |
| `fee_rule_id` / `commission_rate_bps_snapshot` / `commission_amount` / `is_shadow_commission` | `uuid` / `int` / `numeric(12,2)` / `bool` | NULL / NN | `0` / `0.00` / `false` | FK → `fee_rules.id` | Frozen commission audit fields |
| `estimated_delivery_minutes` | `integer` | NULL | `NULL` | — | Promised ETA |
| `accept_deadline_at` / `accepted_at` / `completed_at` | `timestamptz` | NULL | `NULL` | — | SLA & lifecycle milestones |
| `created_at` / `updated_at` | `timestamptz` | NN | `now()` | — | Timestamps |

### 39–43. `order_items`, `order_status_history`, `order_cancellations`, `order_returns`, `order_return_items`
- **`order_items`**: `id` (PK), `order_id` (FK NN), `seller_listing_id` (FK NULL), `product_id` (FK NULL), `variant_id` (FK NULL), `product_name_snapshot` (`varchar(200)` NN), `vertical_code_snapshot` (`varchar(40)` NN), `sku_snapshot` (`varchar(64)` NULL), `variant_label_snapshot` (`varchar(120)` NULL), `variant_attributes_snapshot` (`jsonb` NN), `selected_options_snapshot` (`jsonb` NN), `mrp_unit_price` (`numeric(12,2)` NULL), `unit_price` (`numeric(12,2)` NN), `item_discount` (`numeric(12,2)` DEFAULT `0.00`), `requested_quantity` (`numeric(10,3)` NN `CHECK > 0`), `requested_unit_label` (`varchar(60)` NN), `line_total` (`numeric(12,2)` NN), `returned_quantity` (`numeric(10,3)` DEFAULT `0.000`), `customer_note` (`varchar(255)` NULL), `created_at`.
- **`order_status_history`**: `id` (PK), `order_id` (FK NN), `from_status` (`order_status` NULL), `to_status` (`order_status` NN), `actor_user_id` (FK NULL), `actor_role` (`varchar(40)` NN), `reason` (`text` NULL), `created_at`.
- **`order_cancellations`**: `id` (PK), `order_id` (UQ FK NN), `cancelled_by_actor` (`cancelled_by_actor` NN), `cancelled_by_user_id` (FK NULL), `policy_rule_id` (FK NULL), `reason` (`text` NN), `penalty_amount` (`numeric(12,2)` DEFAULT `0.00`), `refund_eligible` (`boolean` DEFAULT `false`), `notes` (`text` NULL), `cancelled_at`.
- **`order_returns`**: `id` (PK), `return_number` (`varchar(30)` UQ NN), `order_id` (FK NN), `requested_by_user_id` (FK NN), `status` (`return_status` DEFAULT `'REQUESTED'`), `reason` (`text` NN), `notes` (`text` NULL), `requested_at`, `updated_at`.
- **`order_return_items`**: `id` (PK), `order_return_id` (FK NN), `order_item_id` (FK NN), `quantity` (`numeric(10,3)` NN `CHECK > 0`), `refund_amount` (`numeric(12,2)` NN `CHECK >= 0`), `condition_note` (`text` NULL).

---

## Domain 8: Delivery Fleet & Pickup Fulfilment

### 44–45. `delivery_partners` & `order_deliveries`
- **`delivery_partners`**: `id` (PK), `user_id` (UQ FK NN), `village_id` (FK NN), `vehicle_type` (`vehicle_type` NN), `vehicle_number` (`varchar(30)` NULL), `kyc_verified` (`boolean` DEFAULT `false`), `status` (`delivery_partner_status` DEFAULT `'OFFLINE'`), `completed_deliveries` (`integer` DEFAULT `0`), `rating_avg` (`numeric(3,2)` DEFAULT `0.00`), `joined_at`, `updated_at`.
- **`order_deliveries`**: `id` (PK), `order_id` (UQ FK NN), `fulfilment_type` (`delivery_fulfilment_type` NN), `seller_staff_id` (FK NULL), `delivery_partner_id` (FK NULL), `runner_name_snapshot` (`varchar(120)` NULL), `runner_phone_snapshot` (`varchar(15)` NULL), `pickup_code` (`varchar(12)` NULL), `status` (`delivery_status` DEFAULT `'UNASSIGNED'`), `assigned_at`, `picked_up_at`, `delivered_at`, `failed_reason` (`text` NULL), `delivery_proof_url` (`text` NULL), `created_at`, `updated_at`.

---

## Domain 9: Payments, Refunds, Taxes, Commission & Settlements

### 46–51. Finance Tables
- **`fee_rules`**: `id` (PK), `name` (`varchar(120)` NN), `vertical_id` (FK NULL), `commission_bps` (`integer` NN `CHECK 0..5000`), `platform_fee` (`numeric(12,2)` DEFAULT `0.00`), `effective_from` (`timestamptz` NN), `effective_until` (`timestamptz` NULL), `is_pilot_shadow_mode` (`boolean` DEFAULT `false`), `is_active` (`boolean` DEFAULT `true`), `created_at`, `updated_at`.
- **`tax_slabs`**: `id` (PK), `name` (`varchar(120)` NN), `vertical_id` (FK NULL), `gst_percent` (`numeric(5,2)` NN `CHECK 0..28`), `hsn_prefix` (`varchar(16)` NULL), `is_inclusive` (`boolean` DEFAULT `true`), `description` (`text` NULL), `is_active` (`boolean` DEFAULT `true`), `created_at`, `updated_at`.
- **`payment_transactions`**: `id` (PK), `transaction_ref` (`varchar(60)` UQ NN), `order_id` (FK NN), `customer_id` (FK NN), `seller_id` (FK NN), `amount` (`numeric(12,2)` NN `CHECK > 0`), `method` (`payment_method` NN), `gateway_name` (`varchar(60)` NULL), `gateway_ref` (`varchar(120)` NULL), `status` (`payment_tx_status` NN), `failure_code` (`varchar(60)` NULL), `failure_reason` (`text` NULL), `platform_fee_component` (`numeric(12,2)` DEFAULT `0.00`), `paid_at` (`timestamptz` NULL), `created_at`, `updated_at`.
- **`refunds`**: `id` (PK), `refund_number` (`varchar(40)` UQ NN), `order_id` (FK NN), `payment_transaction_id` (FK NULL), `support_case_id` (FK NULL), `order_return_id` (FK NULL), `amount` (`numeric(12,2)` NN `CHECK > 0`), `channel` (`refund_channel` NN), `status` (`refund_status` DEFAULT `'INITIATED'`), `reason` (`text` NN), `rejection_reason` (`text` NULL), `failure_reason` (`text` NULL), `gateway_refund_ref` (`varchar(120)` NULL), `initiated_by_user_id` (FK NN), `initiated_at`, `processed_at`, `updated_at`.
- **`seller_settlements`**: `id` (PK), `settlement_number` (`varchar(40)` UQ NN), `seller_id` (FK NN), `period_start` (`date` NN), `period_end` (`date` NN), `period_label` (`varchar(60)` NN), `orders_count` (`integer` NN `CHECK >= 0`), `gross_amount` (`numeric(12,2)` NN), `commission_amount` (`numeric(12,2)` NN), `refund_deductions` (`numeric(12,2)` DEFAULT `0.00`), `other_deductions` (`numeric(12,2)` DEFAULT `0.00`), `platform_fee_deduction` (`numeric(12,2)` DEFAULT `0.00`), `net_payable` (`numeric(12,2)` NN), `payment_mode` (`settlement_payment_mode` NN), `utr_number` (`varchar(64)` UQ NULL), `status` (`settlement_status` DEFAULT `'PENDING'`), `settlement_date` (`date` NULL), `settled_at` (`timestamptz` NULL), `notes` (`text` NULL), `created_by_user_id` (FK NN), `created_at`, `updated_at`.
- **`seller_settlement_orders`**: `id` (PK), `settlement_id` (FK NN), `order_id` (UQ FK NN), `order_gross_amount` (`numeric(12,2)` NN), `order_commission_amount` (`numeric(12,2)` NN), `order_refund_deduction` (`numeric(12,2)` DEFAULT `0.00`), `order_net_amount` (`numeric(12,2)` NN).

---

## Domain 10: Seller-Managed Udhari (Rural Credit)

### 52–55. Udhari Tables
- **`customer_credit_profiles`**: `id` (PK), `seller_id` (FK NN), `customer_id` (FK NN), `status` (`credit_profile_status` DEFAULT `'ACTIVE'`), `credit_limit` (`numeric(12,2)` DEFAULT `0.00` `CHECK >= 0`), `outstanding_balance` (`numeric(12,2)` DEFAULT `0.00` `CHECK >= 0`), `overdue_amount` (`numeric(12,2)` DEFAULT `0.00` `CHECK >= 0`), `default_due_days` (`integer` DEFAULT `15` `CHECK > 0`), `last_payment_at` (`timestamptz` NULL), `internal_note` (`text` NULL), `created_at`, `updated_at`, `UQ(seller_id, customer_id)`.
- **`credit_repayments`**: `id` (PK), `repayment_reference` (`varchar(40)` UQ NN), `credit_profile_id` (FK NN), `seller_id` (FK NN), `customer_id` (FK NN), `amount` (`numeric(12,2)` NN `CHECK > 0`), `method` (`repayment_method` NN), `reference_number` (`varchar(80)` NULL), `note` (`text` NULL), `recorded_by_user_id` (FK NN), `received_at` (`timestamptz` NN), `created_at`.
- **`credit_ledger_entries`**: `id` (PK), `ledger_reference` (`varchar(40)` UQ NN), `credit_profile_id` (FK NN), `seller_id` (FK NN), `customer_id` (FK NN), `order_id` (FK NULL), `repayment_id` (FK NULL), `reversed_entry_id` (self-FK NULL), `entry_type` (`credit_entry_type` NN), `direction` (`credit_entry_direction` NN), `amount` (`numeric(12,2)` NN `CHECK > 0`), `running_balance` (`numeric(12,2)` NN `CHECK >= 0`), `due_date` (`timestamptz` NULL), `is_overdue` (`boolean` DEFAULT `false`), `status` (`credit_entry_status` DEFAULT `'POSTED'`), `reason` (`text` NULL), `recorded_by_user_id` (FK NN), `posted_at` (`timestamptz` NN).
- **`credit_disputes`**: `id` (PK), `credit_profile_id` (FK NN), `ledger_entry_id` (FK NN), `seller_id` (FK NN), `customer_id` (FK NN), `reason_code` (`credit_dispute_reason` NN), `description` (`text` NN), `status` (`credit_dispute_status` DEFAULT `'OPEN'`), `resolution_note` (`text` NULL), `resolved_by_user_id` (FK NULL), `opened_at`, `resolved_at`.

---

## Domain 11: Offers, Coupons, Reviews & Support

### 56–59. Engagement & Support Tables
- **`offers_coupons`**: `id` (PK), `code` (`varchar(40)` UQ NN), `title` (`varchar(160)` NN), `discount_type` (`discount_type` NN), `discount_value` (`numeric(12,2)` NN `CHECK >= 0`), `min_order_amount` (`numeric(12,2)` DEFAULT `0.00`), `max_discount_amount` (`numeric(12,2)` NULL), `vertical_id` (FK NULL), `village_id` (FK NULL), `seller_id` (FK NULL), `funded_by` (`offer_funding_source` NN), `valid_from` (`timestamptz` NN), `valid_until` (`timestamptz` NN), `usage_limit` (`integer` NN `CHECK > 0`), `per_customer_limit` (`integer` DEFAULT `1` `CHECK > 0`), `used_count` (`integer` DEFAULT `0` `CHECK >= 0`), `is_active` (`boolean` DEFAULT `true`), `created_at`, `updated_at`.
- **`coupon_redemptions`**: `id` (PK), `coupon_id` (FK NN), `order_id` (UQ FK NN), `customer_id` (FK NN), `discount_applied` (`numeric(12,2)` NN `CHECK >= 0`), `redeemed_at`.
- **`reviews`**: `id` (PK), `order_id` (UQ FK NN), `customer_id` (FK NN), `seller_id` (FK NN), `rating` (`smallint` NN `CHECK 1..5`), `comment` (`text` NULL), `status` (`review_status` DEFAULT `'PUBLISHED'`), `flag_reason` (`text` NULL), `moderation_notes` (`text` NULL), `moderated_by_user_id` (FK NULL), `created_at`, `updated_at`.
- **`support_cases`**: `id` (PK), `case_number` (`varchar(30)` UQ NN), `order_id` (FK NULL), `customer_id` (FK NN), `seller_id` (FK NULL), `issue_type` (`support_issue_type` NN), `status` (`support_case_status` DEFAULT `'OPEN'`), `disputed_amount` (`numeric(12,2)` DEFAULT `0.00`), `approved_refund_amount` (`numeric(12,2)` NULL), `description` (`text` NN), `resolution_notes` (`text` NULL), `assigned_admin_id` (FK NULL), `created_at`, `updated_at`.

---

## Domain 12: Food & Grocery Seller Safety, Quality & Assessment

### 60–67. Safety & Assessment Tables
- **`safety_training_modules`**: `id` (PK), `track` (`safety_track` NN), `module_number` (`integer` NN), `title` (`varchar(180)` NN), `hindi_title` (`varchar(180)` NULL), `duration_minutes` (`integer` NN), `is_mandatory` (`boolean` DEFAULT `true`), `summary` (`text` NN), `key_standards` (`jsonb` NN), `do_practices` (`jsonb` NN), `dont_practices` (`jsonb` NN), `critical_control_point` (`text` NN), `village_practical_tip` (`text` NULL), `is_active` (`boolean` DEFAULT `true`), `created_at`, `UQ(track, module_number)`.
- **`seller_training_completions`**: `seller_id` (PK, FK NN), `module_id` (PK, FK NN), `completed_at` (`timestamptz` NN).
- **`safety_checklist_items`**: `id` (PK), `track` (`safety_track` NN), `section` (`varchar(100)` NN), `title` (`varchar(200)` NN), `hindi_title` (`varchar(200)` NULL), `weight` (`integer` DEFAULT `1`), `is_critical` (`boolean` DEFAULT `false`), `is_active` (`boolean` DEFAULT `true`).
- **`seller_checklist_submissions`**: `id` (PK), `seller_id` (FK NN), `submission_date` (`date` NN), `track` (`safety_track` NN), `checked_item_ids` (`jsonb` NN), `score_percent` (`numeric(5,2)` NN `CHECK 0..100`), `completed_critical_count` (`integer` NN), `total_critical_count` (`integer` NN), `notes` (`text` NULL), `submitted_at`, `UQ(seller_id, submission_date)`.
- **`safety_exam_questions`**: `id` (PK), `track` (`safety_track` NN), `topic` (`varchar(120)` NN), `question` (`text` NN), `hindi_hint` (`text` NULL), `options` (`jsonb` NN), `correct_index` (`smallint` NN `CHECK 0..3`), `explanation` (`text` NN), `is_active` (`boolean` DEFAULT `true`).
- **`seller_exam_attempts`**: `id` (PK), `seller_id` (FK NN), `track` (`safety_track` NN), `score_percent` (`numeric(5,2)` NN `CHECK 0..100`), `correct_count` (`integer` NN), `total_questions` (`integer` NN), `passed` (`boolean` NN), `time_taken_seconds` (`integer` NN), `weak_topics` (`jsonb` NN), `answers` (`jsonb` NN), `submitted_at`.
- **`seller_safety_profiles`**: `seller_id` (PK, FK → `sellers.id`), `track` (`safety_track` NN), `badge_level` (`certification_badge_level` DEFAULT `'IN_PROGRESS'`), `overall_compliance_score` (`numeric(5,2)` DEFAULT `0.00`), `retraining_required` (`boolean` DEFAULT `false`), `retraining_reason` (`text` NULL), `suspended_for_safety` (`boolean` DEFAULT `false`), `certificate_number` (`varchar(60)` UQ NULL), `certified_at` (`timestamptz` NULL), `certificate_valid_until` (`timestamptz` NULL), `updated_at`.
- **`safety_inspection_audits`**: `id` (PK), `seller_id` (FK NN), `inspector_user_id` (FK NN), `score_percent` (`numeric(5,2)` NN `CHECK 0..100`), `outcome` (`inspection_outcome` NN), `remarks` (`text` NN), `findings` (`jsonb` NN), `inspected_at`.

---

## Domain 13: Notifications, Broadcasts, CMS, Policies, Settings & Audit

### 68–74. Operations & Governance Tables
- **`notifications`**: `id` (PK), `user_id` (FK NN), `seller_id` (FK NULL), `order_id` (FK NULL), `channel` (`notification_channel` DEFAULT `'IN_APP'`), `notification_type` (`varchar(60)` NN), `title` (`varchar(160)` NN), `body` (`text` NN), `metadata` (`jsonb` NULL), `is_read` (`boolean` DEFAULT `false`), `read_at` (`timestamptz` NULL), `sent_at` (`timestamptz` NULL), `created_at`.
- **`broadcast_campaigns`**: `id` (PK), `title` (`varchar(160)` NN), `message` (`text` NN), `channel` (`notification_channel` NN), `audience` (`broadcast_audience` NN), `target_village_id` (FK NULL), `priority` (`broadcast_priority` DEFAULT `'NORMAL'`), `estimated_reach` (`integer` DEFAULT `0`), `delivered_count` (`integer` DEFAULT `0`), `status` (`broadcast_status` DEFAULT `'DRAFT'`), `scheduled_for` (`timestamptz` NULL), `sent_at` (`timestamptz` NULL), `created_by_user_id` (FK NN), `created_at`.
- **`cms_banners`**: `id` (PK), `title` (`varchar(160)` NN), `subtitle` (`varchar(240)` NULL), `placement` (`banner_placement` NN), `target_vertical_id` (FK NULL), `target_village_id` (FK NULL), `cta_label` (`varchar(60)` NULL), `accent_color` (`varchar(20)` NULL), `valid_from` (`timestamptz` NN), `valid_until` (`timestamptz` NN), `priority` (`integer` DEFAULT `0`), `is_active` (`boolean` DEFAULT `true`), `created_at`, `updated_at`.
- **`cms_policy_pages`**: `id` (PK), `slug` (`varchar(60)` UQ NN), `title` (`varchar(160)` NN), `version` (`varchar(20)` NN), `summary` (`text` NULL), `content` (`text` NN), `updated_by_user_id` (FK NN), `updated_at`.
- **`cancellation_policy_rules`**: `id` (PK), `actor` (`cancelled_by_actor` NN), `code` (`varchar(60)` UQ NN), `label` (`varchar(140)` NN), `free_cancel_window_mins` (`integer` DEFAULT `5`), `penalty_percent` (`numeric(5,2)` DEFAULT `0.00`), `auto_refund_eligible` (`boolean` DEFAULT `true`), `is_active` (`boolean` DEFAULT `true`), `created_at`, `updated_at`.
- **`platform_settings`**: `id` (`smallint` PK `DEFAULT 1 CHECK(id = 1)`), `platform_name` (`varchar(120)` NN), `tagline` (`varchar(200)` NULL), `support_phone` (`varchar(20)` NN), `whatsapp_support` (`varchar(20)` NULL), `default_delivery_enabled` (`boolean` DEFAULT `true`), `default_pickup_enabled` (`boolean` DEFAULT `true`), `allow_multi_vertical_sellers` (`boolean` DEFAULT `true`), `auto_cancel_unaccepted_mins` (`integer` DEFAULT `15`), `food_prep_sla_mins` (`integer` DEFAULT `30`), `maintenance_mode` (`boolean` DEFAULT `false`), `maintenance_message` (`text` NULL), `updated_by_user_id` (FK NULL), `updated_at`.
- **`audit_logs`**: `id` (PK), `actor_user_id` (FK NULL), `actor_role` (`varchar(40)` NN), `action_type` (`varchar(80)` NN), `target_entity` (`varchar(60)` NN), `target_id` (`varchar(64)` NN), `ip_address` (`inet` NULL), `details` (`text` NN), `reason` (`text` NULL), `metadata` (`jsonb` NULL), `created_at`.
