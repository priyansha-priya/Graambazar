# GramBazaar Database Architecture & Blueprint

This folder contains the complete, production-oriented **PostgreSQL + Prisma ORM** database design for **GramBazaar** — a rural/local-area Food (Restaurants, Hotels, Dhabas, Bakeries — strictly excluding tiffin services) and Grocery (Kirana & General Stores) multi-village marketplace, designed for extensibility across Hardware, Apparel, Electronics, Furniture, and Agriculture verticals.

> **Scope Notice:** This folder is a **Database Design Blueprint only**. No live database connection, backend service, Prisma package installation, or frontend code changes have been made.

---

## Target Technology Stack

| Layer | Target Technology |
|---|---|
| Database Engine | PostgreSQL 16+ |
| Backend Runtime | Node.js (LTS) + TypeScript |
| Web Framework | Express.js |
| ORM & Migrations | Prisma ORM (`prisma/schema.prisma`) |
| Primary Keys | UUID v7 / `gen_random_uuid()` (`uuid`) |
| Monetary Types | `NUMERIC(12, 2)` in INR (₹) — strictly never `FLOAT` or `DOUBLE PRECISION` |
| Quantities / Weights | `NUMERIC(10, 3)` (supports rural decimal weights like `0.250 kg`, `1.500 kg`, `0.500 pav`) |
| Timestamps | `TIMESTAMPTZ` (UTC stored; rendered in `Asia/Kolkata` IST on clients) |

---

## Folder Contents & Recommended Review Order

Review these files in the exact numbered sequence below to move from architectural overview to physical constraints, security, and long-term scaling:

| Order | File | Purpose | Audience |
|---|---|---|---|
| **1** | [`README.md`](./README.md) | Orientation, stack conventions, domain map, and audit summary of existing GramBazaar UI modules. | Everyone |
| **2** | [`database-design.md`](./database-design.md) | Master architectural blueprint covering all **13 domains (74 tables)**, columns, data types, keys, status state machines, design rationale, and **Open Business Decisions**. | Architects, Backend & Product Leads |
| **3** | [`er-diagram.dbml`](./er-diagram.dbml) | Complete, syntactically valid **DBML** schema ready to paste directly into [dbdiagram.io](https://dbdiagram.io) to visualize all 74 tables, table groups, enums, and foreign-key relationships. | Architects, Engineers, Stakeholders |
| **4** | [`table-relationships.md`](./table-relationships.md) | Explicit catalog of all **1:1**, **1:N**, **M:N**, and **self-referencing** relationships, foreign-key delete/update rules, and cross-module dependency flows. | Backend & Database Engineers |
| **5** | [`business-rules.md`](./business-rules.md) | Database-enforced and transaction-enforced business rules across all 20 operational workflows (KYC, Product Masters, Kirana Inventory, Cart, Orders, Payments, Refunds, Commission, Settlements, Delivery, Pickup, Offers, Reviews, Udhari Credit/Repayments, Safety & Quality). | Backend Engineers, QA, Product |
| **6** | [`data-dictionary.md`](./data-dictionary.md) | Exhaustive column-by-column reference dictionary for all **74 tables** with data types, nullability, defaults, constraints, and business meaning. | Backend Engineers, Analysts, QA |
| **7** | [`indexes-and-constraints.md`](./indexes-and-constraints.md) | Production `UNIQUE`, `CHECK`, `FOREIGN KEY`, partial unique indexes, composite B-Tree indexes, GIN indexes, and PostgreSQL query optimization guidance. | DBAs, Backend Engineers |
| **8** | [`database-security.md`](./database-security.md) | PII classification, encryption at rest/column level, password hashing (Argon2id), RBAC & multi-tenant seller isolation, Row-Level Security (RLS) patterns, and immutable audit logging. | Security, DevOps, Backend Leads |
| **9** | [`future-scalability.md`](./future-scalability.md) | Architectural roadmap for multi-district/multi-state expansion, high-volume order partitioning, third-party logistics (3PL), native mobile apps, AI recommendations, and OLAP analytics. | CTO, Architects, Tech Leads |

---

## Existing GramBazaar Project Audit Summary

Every table in this blueprint was derived directly from auditing the existing GramBazaar frontend codebase (`src/types/*`, `src/contexts/*`, and `src/features/*`):

| Portal / Module | Existing UI Screens Audited | Core Database Tables Mapped |
|---|---|---|
| **Authentication & RBAC** | `LoginScreen`, `SignUpScreen`, `ForgotPasswordScreen`, `ResetPasswordScreen`, `AdminRolesView` | `users`, `roles`, `user_roles`, `role_permissions`, `admin_village_scopes`, `auth_tokens` |
| **Geography & Service Areas** | `VillageContext`, `AdminServiceAreasView`, `CheckoutView` (Address modal) | `villages`, `village_landmarks`, `inter_village_routes`, `customer_addresses` |
| **Sellers & KYC Onboarding** | `AdminVerticalsView`, `AdminSellerApplicationsView`, `AdminSellerDirectoryView`, `SellerSettingsView` | `verticals`, `sellers`, `seller_verticals`, `seller_serviceable_villages`, `seller_kyc_documents`, `seller_kyc_document_events`, `seller_staff_members` |
| **Universal Catalog & 8 Masters** | `CategorySubcategoryMasterView`, `BrandMasterView`, `UnitMeasurementMasterView`, `ProductAttributeMasterView`, `ProductVariantSizeMasterView`, `AddonsCustomizationMasterView`, `PackagingMasterView`, `AvailabilityStockConfigMasterView`, `AdminProductsView`, `SellerAddProductModal` | `categories`, `brands`, `brand_verticals`, `units`, `category_allowed_units`, `attributes`, `category_attributes`, `option_groups`, `option_group_items`, `packaging_masters`, `availability_stock_configs`, `products`, `product_attribute_values`, `product_variants`, `product_option_groups` |
| **Kirana Inventory & Bulk Stock** | `SellerCatalogView` (In Stock / Low Stock / Out of Stock, SKU, Rack/Shelf, Expiry, Supplier, Bulk Update Modal) | `seller_product_listings`, `inventory_stock_movements`, `seller_bulk_inventory_jobs` |
| **Cart, Orders & Tracking** | `CartContext`, `CheckoutView`, `OrderContext`, `SellerOrdersTerminal`, `AdminOrdersView`, `CustomerDrawer` (Order History), `OrderTrackingView` | `carts`, `cart_items`, `orders`, `order_items`, `order_status_history`, `order_cancellations`, `order_returns`, `order_return_items` |
| **Delivery & Pickup** | `SellerDispatchView` (In-House Runners), `AdminDeliveryFleetView` | `delivery_partners`, `order_deliveries` |
| **Finance, Payments & Payouts** | `AdminFeeRulesView`, `AdminTaxPoliciesView`, `AdminPayoutsView` (Payments, Refunds, Settlements) | `fee_rules`, `tax_slabs`, `payment_transactions`, `refunds`, `seller_settlements`, `seller_settlement_orders` |
| **Seller-Managed Udhari** | `SellerUdhariView`, `CustomerUdharView`, `AdminUdhariView`, `UdhariContext` | `customer_credit_profiles`, `credit_repayments`, `credit_ledger_entries`, `credit_disputes` |
| **Offers, Reviews & Support** | `AdminOffersView`, `AdminReviewsView`, `AdminSupportView` | `offers_coupons`, `coupon_redemptions`, `reviews`, `support_cases` |
| **Safety, Quality & Assessment** | `SellerSafetyQualityView`, `AdminSafetyQualityView`, `SafetyContext` (Food & Grocery training, daily checklists, exams, inspections, certificates) | `safety_training_modules`, `seller_training_completions`, `safety_checklist_items`, `seller_checklist_submissions`, `safety_exam_questions`, `seller_exam_attempts`, `seller_safety_profiles`, `safety_inspection_audits` |
| **Comms, CMS, Settings & Audit** | `SellerOrderNotification` (Buzzer), `AdminBroadcastsView`, `AdminCmsBannersView`, `AdminTaxPoliciesView`, `AdminSettingsView`, `AdminAuditLogsView` | `notifications`, `broadcast_campaigns`, `cms_banners`, `cms_policy_pages`, `cancellation_policy_rules`, `platform_settings`, `audit_logs` |

---

## Key Architectural Principles

1. **Zero Per-Vertical Product Tables:** Grocery, Food (Restaurants/Hotels/Dhabas/Bakeries), Hardware, Apparel, Electronics, Furniture, and Agriculture all share a single universal `products` + `product_variants` + `product_attribute_values` + `seller_product_listings` architecture.
2. **Strict No-Tiffin Rule:** Enforced at the database level via `verticals` and `seller_business_type` enum (`RESTAURANT`, `HOTEL`, `DHABA`, `BAKERY` only for `FOOD`; no `TIFFIN_SERVICE` allowed).
3. **Immutable Financial & Stock Ledgers:** Orders snapshot product prices/names/variants/taxes at checkout; `inventory_stock_movements`, `credit_ledger_entries`, `order_status_history`, and `audit_logs` are append-only.
4. **Seller-Owned Udhari Isolation:** Credit limits, credit status, ledgers, and repayments are strictly scoped to `(seller_id, customer_id)`. Platform admins have read-only audit/dispute visibility and cannot grant credit on a seller's behalf.
5. **No Duplicate Entities:** Seller onboarding applications and approved sellers share one unified `sellers` table (tracked via `status` and `kyc_status`), avoiding duplicate business/bank/KYC storage.
