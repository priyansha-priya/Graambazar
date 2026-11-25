import { relations } from 'drizzle-orm';
import {
  boolean,
  integer,
  numeric,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
} from 'drizzle-orm/pg-core';

// 1. Users (Linked to Firebase Auth UID)
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(),
  email: text('email').notNull(),
  displayName: text('display_name'),
  phone: text('phone'),
  role: text('role').notNull().default('CUSTOMER'),
  activeVillageCode: text('active_village_code').default('rampur'),
  activeLandmark: text('active_landmark').default('Purani Basti'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// 2. Villages & Rural Service Areas
export const villages = pgTable('villages', {
  id: serial('id').primaryKey(),
  code: text('code').notNull().unique(),
  name: text('name').notNull(),
  hindiName: text('hindi_name'),
  district: text('district').notNull(),
  state: text('state').notNull(),
  baseDeliveryFee: numeric('base_delivery_fee', { precision: 12, scale: 2 })
    .notNull()
    .default('15.00'),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 3. Sellers (Unified Storefront + Admin Master Directory — No Tiffin Services)
export const sellers = pgTable('sellers', {
  id: serial('id').primaryKey(),
  code: text('code').notNull().unique(),
  ownerUid: text('owner_uid'),
  ownerName: text('owner_name').notNull().default('Store Owner'),
  publicName: text('public_name').notNull(),
  businessType: text('business_type').notNull(),
  primaryVertical: text('primary_vertical').notNull(),
  contactPhone: text('contact_phone').notNull(),
  email: text('email'),
  logoInitials: text('logo_initials'),
  logoBgClass: text('logo_bg_class'),
  villageId: integer('village_id')
    .references(() => villages.id)
    .notNull(),
  shopAddress: text('shop_address').notNull(),
  district: text('district').default('Unnao'),
  state: text('state').default('Uttar Pradesh'),
  pinCode: text('pin_code'),
  serviceableVillageIdsJson: text('serviceable_village_ids_json').notNull().default('[]'),
  supportedVerticalsJson: text('supported_verticals_json').notNull().default('[]'),
  fulfilmentModesJson: text('fulfilment_modes_json').notNull().default('["DELIVERY","PICKUP"]'),
  openingHours: text('opening_hours').default('08:00 AM - 09:30 PM'),
  status: text('status').notNull().default('ACTIVE'),
  kycStatus: text('kyc_status').notNull().default('APPROVED'),
  isOpenNow: boolean('is_open_now').notNull().default(true),
  isPaused: boolean('is_paused').notNull().default(false),
  minimumOrderAmount: numeric('minimum_order_amount', { precision: 12, scale: 2 })
    .notNull()
    .default('0.00'),
  packagingFee: numeric('packaging_fee', { precision: 12, scale: 2 })
    .notNull()
    .default('0.00'),
  deliveryFee: numeric('delivery_fee', { precision: 12, scale: 2 })
    .notNull()
    .default('15.00'),
  deliveryRadiusKm: integer('delivery_radius_km').notNull().default(5),
  upiId: text('upi_id'),
  udhariEnabled: boolean('udhari_enabled').notNull().default(false),
  ratingAvg: numeric('rating_avg', { precision: 3, scale: 2 }).notNull().default('4.50'),
  totalOrders: integer('total_orders').notNull().default(0),
  gmvAmount: numeric('gmv_amount', { precision: 14, scale: 2 }).notNull().default('0.00'),
  commissionRateBps: integer('commission_rate_bps').notNull().default(400),
  suspensionReason: text('suspension_reason'),
  rejectionReason: text('rejection_reason'),
  kycChangeRequestNotes: text('kyc_change_request_notes'),
  bankAccountHolder: text('bank_account_holder'),
  bankAccountNumberMasked: text('bank_account_number_masked'),
  ifscCode: text('ifsc_code'),
  aliasIdsJson: text('alias_ids_json').notNull().default('[]'),
  fssaiVerified: boolean('fssai_verified').notNull().default(false),
  joinedAt: text('joined_at'),
  kycDocumentsJson: text('kyc_documents_json').notNull().default('[]'),
  activityHistoryJson: text('activity_history_json').notNull().default('[]'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// 4. Seller-Specific Product Listings & Kirana Store Inventory
export const sellerInventoryItems = pgTable(
  'seller_inventory_items',
  {
    id: serial('id').primaryKey(),
    externalId: text('external_id').notNull().unique(),
    sellerId: integer('seller_id')
      .references(() => sellers.id)
      .notNull(),
    sku: text('sku').notNull(),
    name: text('name').notNull(),
    categoryName: text('category_name').notNull(),
    brandName: text('brand_name'),
    vertical: text('vertical').notNull().default('GROCERY'),
    unitLabel: text('unit_label').notNull(),
    mrpAmount: numeric('mrp_amount', { precision: 12, scale: 2 }).notNull(),
    sellingPrice: numeric('selling_price', { precision: 12, scale: 2 }).notNull(),
    stockQuantity: numeric('stock_quantity', { precision: 10, scale: 3 })
      .notNull()
      .default('0.000'),
    lowStockThreshold: numeric('low_stock_threshold', { precision: 10, scale: 3 })
      .notNull()
      .default('8.000'),
    shelfLocation: text('shelf_location'),
    expiryDate: text('expiry_date'),
    supplierName: text('supplier_name'),
    isAvailable: boolean('is_available').notNull().default(true),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => [uniqueIndex('uq_seller_inventory_seller_sku').on(table.sellerId, table.sku)]
);

// 5. Append-Only Inventory Stock Movements Ledger
export const inventoryStockMovements = pgTable('inventory_stock_movements', {
  id: serial('id').primaryKey(),
  listingId: integer('listing_id')
    .references(() => sellerInventoryItems.id)
    .notNull(),
  sellerId: integer('seller_id')
    .references(() => sellers.id)
    .notNull(),
  movementType: text('movement_type').notNull(),
  quantityDelta: numeric('quantity_delta', { precision: 10, scale: 3 }).notNull(),
  quantityBefore: numeric('quantity_before', { precision: 10, scale: 3 }).notNull(),
  quantityAfter: numeric('quantity_after', { precision: 10, scale: 3 }).notNull(),
  reason: text('reason'),
  actorUid: text('actor_uid').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 6. Orders
export const orders = pgTable('orders', {
  id: serial('id').primaryKey(),
  orderNumber: text('order_number').notNull().unique(),
  customerUid: text('customer_uid').notNull(),
  customerName: text('customer_name').notNull(),
  customerPhone: text('customer_phone').notNull(),
  sellerId: integer('seller_id')
    .references(() => sellers.id)
    .notNull(),
  villageCode: text('village_code').notNull(),
  fulfilmentMode: text('fulfilment_mode').notNull().default('DELIVERY'),
  deliveryAddressJson: text('delivery_address_json'),
  deliveryNote: text('delivery_note'),
  status: text('status').notNull().default('placed'),
  paymentMethod: text('payment_method').notNull().default('COD'),
  paymentStatus: text('payment_status').notNull().default('pending'),
  itemSubtotal: numeric('item_subtotal', { precision: 12, scale: 2 }).notNull(),
  deliveryFee: numeric('delivery_fee', { precision: 12, scale: 2 }).notNull().default('0.00'),
  packagingFee: numeric('packaging_fee', { precision: 12, scale: 2 }).notNull().default('0.00'),
  platformFee: numeric('platform_fee', { precision: 12, scale: 2 }).notNull().default('0.00'),
  couponCode: text('coupon_code'),
  couponDiscount: numeric('coupon_discount', { precision: 12, scale: 2 }).notNull().default('0.00'),
  totalAmount: numeric('total_amount', { precision: 12, scale: 2 }).notNull(),
  cancellationJson: text('cancellation_json'),
  returnInfoJson: text('return_info_json'),
  refundInfoJson: text('refund_info_json'),
  assignedRunnerId: text('assigned_runner_id'),
  assignedRunnerName: text('assigned_runner_name'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// 7. Historical Order Item Snapshots
export const orderItems = pgTable('order_items', {
  id: serial('id').primaryKey(),
  orderId: integer('order_id')
    .references(() => orders.id)
    .notNull(),
  listingId: integer('listing_id').references(() => sellerInventoryItems.id),
  productNameSnapshot: text('product_name_snapshot').notNull(),
  verticalSnapshot: text('vertical_snapshot').notNull(),
  skuSnapshot: text('sku_snapshot'),
  unitPriceSnapshot: numeric('unit_price_snapshot', { precision: 12, scale: 2 }).notNull(),
  requestedQuantity: numeric('requested_quantity', { precision: 10, scale: 3 }).notNull(),
  requestedUnitLabel: text('requested_unit_label').notNull(),
  lineTotal: numeric('line_total', { precision: 12, scale: 2 }).notNull(),
  customerNote: text('customer_note'),
});

// 8. Order Status History
export const orderStatusHistory = pgTable('order_status_history', {
  id: serial('id').primaryKey(),
  orderId: integer('order_id')
    .references(() => orders.id)
    .notNull(),
  fromStatus: text('from_status'),
  toStatus: text('to_status').notNull(),
  actorRole: text('actor_role').notNull(),
  reason: text('reason'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 9. Seller-Managed Udhari Credit Profiles
export const udhariCreditProfiles = pgTable(
  'udhari_credit_profiles',
  {
    id: serial('id').primaryKey(),
    externalId: text('external_id'),
    sellerId: integer('seller_id')
      .references(() => sellers.id)
      .notNull(),
    customerUid: text('customer_uid').notNull(),
    customerName: text('customer_name').notNull(),
    customerPhone: text('customer_phone').notNull(),
    villageName: text('village_name').notNull().default('Rampur'),
    status: text('status').notNull().default('ACTIVE'),
    creditLimit: numeric('credit_limit', { precision: 12, scale: 2 }).notNull().default('0.00'),
    outstandingBalance: numeric('outstanding_balance', { precision: 12, scale: 2 })
      .notNull()
      .default('0.00'),
    overdueAmount: numeric('overdue_amount', { precision: 12, scale: 2 })
      .notNull()
      .default('0.00'),
    dueDays: integer('due_days').notNull().default(15),
    internalNote: text('internal_note'),
    lastPaymentAt: timestamp('last_payment_at'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex('uq_udhari_seller_customer').on(table.sellerId, table.customerUid),
  ]
);

// 10. Immutable Double-Entry Udhari Ledger
export const udhariLedgerEntries = pgTable('udhari_ledger_entries', {
  id: serial('id').primaryKey(),
  externalId: text('external_id'),
  ledgerReference: text('ledger_reference').notNull().unique(),
  profileId: integer('profile_id')
    .references(() => udhariCreditProfiles.id)
    .notNull(),
  sellerId: integer('seller_id')
    .references(() => sellers.id)
    .notNull(),
  customerUid: text('customer_uid'),
  orderId: integer('order_id').references(() => orders.id),
  orderNumberRef: text('order_number_ref'),
  repaymentRef: text('repayment_ref'),
  entryType: text('entry_type').notNull(),
  direction: text('direction').notNull(),
  amount: numeric('amount', { precision: 12, scale: 2 }).notNull(),
  runningBalance: numeric('running_balance', { precision: 12, scale: 2 }).notNull(),
  dueDateIso: text('due_date_iso'),
  isOverdue: boolean('is_overdue').notNull().default(false),
  status: text('status').notNull().default('POSTED'),
  reason: text('reason'),
  recordedBy: text('recorded_by').notNull(),
  postedAt: timestamp('posted_at').defaultNow().notNull(),
});

// 11. Admin Master Categories & Subcategories
export const adminCategories = pgTable('admin_categories', {
  id: serial('id').primaryKey(),
  externalId: text('external_id').notNull().unique(),
  name: text('name').notNull(),
  hindiName: text('hindi_name').notNull().default(''),
  vertical: text('vertical').notNull(),
  parentExternalId: text('parent_external_id'),
  icon: text('icon').notNull().default('Layers'),
  itemCount: integer('item_count').notNull().default(0),
  isActive: boolean('is_active').notNull().default(true),
  sortOrder: integer('sort_order').notNull().default(0),
  attributeIdsJson: text('attribute_ids_json').notNull().default('[]'),
  allowedUnitIdsJson: text('allowed_unit_ids_json').notNull().default('[]'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// 12. Admin Universal Multi-Vertical Products Catalog
export const adminProducts = pgTable('admin_products', {
  id: serial('id').primaryKey(),
  externalId: text('external_id').notNull().unique(),
  sku: text('sku').notNull().unique(),
  name: text('name').notNull(),
  hindiName: text('hindi_name'),
  description: text('description'),
  vertical: text('vertical').notNull(),
  categoryExternalId: text('category_external_id').notNull(),
  subcategoryExternalId: text('subcategory_external_id'),
  brandId: text('brand_id'),
  sellerId: integer('seller_id').references(() => sellers.id),
  sellerExternalId: text('seller_external_id').notNull(),
  sellerName: text('seller_name').notNull(),
  unitId: text('unit_id').notNull().default('unit_piece'),
  inventoryMode: text('inventory_mode').notNull().default('QUANTITY_STOCK'),
  mrpAmount: numeric('mrp_amount', { precision: 12, scale: 2 }).notNull().default('0.00'),
  sellingPrice: numeric('selling_price', { precision: 12, scale: 2 }).notNull().default('0.00'),
  stockQuantity: numeric('stock_quantity', { precision: 10, scale: 3 }),
  lowStockThreshold: numeric('low_stock_threshold', { precision: 10, scale: 3 }),
  prepTimeMinutes: integer('prep_time_minutes'),
  leadTimeDays: integer('lead_time_days'),
  dietType: text('diet_type'),
  attributesJson: text('attributes_json').notNull().default('{}'),
  variantsJson: text('variants_json').notNull().default('[]'),
  optionGroupIdsJson: text('option_group_ids_json').notNull().default('[]'),
  moderationStatus: text('moderation_status').notNull().default('PENDING_REVIEW'),
  moderationNotes: text('moderation_notes'),
  isActive: boolean('is_active').notNull().default(true),
  isAvailable: boolean('is_available').notNull().default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// 13. Admin Seller Onboarding Applications & KYC Queue
export const adminSellerApplications = pgTable('admin_seller_applications', {
  id: serial('id').primaryKey(),
  externalId: text('external_id').notNull().unique(),
  applicantName: text('applicant_name').notNull(),
  businessName: text('business_name').notNull(),
  businessType: text('business_type').notNull().default('MULTI_CATEGORY'),
  phone: text('phone').notNull(),
  villageId: text('village_id').notNull(),
  villageName: text('village_name').notNull(),
  vertical: text('vertical').notNull(),
  supportedVerticalsJson: text('supported_verticals_json').notNull().default('[]'),
  fssaiNumber: text('fssai_number'),
  fssaiDocumentName: text('fssai_document_name'),
  gstOrTradeNumber: text('gst_or_trade_number'),
  agriLicenseNumber: text('agri_license_number'),
  aadhaarMasked: text('aadhaar_masked'),
  panNumber: text('pan_number'),
  verifiedDocsJson: text('verified_docs_json').notNull().default('{}'),
  bankAccountHolder: text('bank_account_holder').notNull(),
  bankAccountNumberMasked: text('bank_account_number_masked').notNull(),
  ifscCode: text('ifsc_code').notNull(),
  appliedAt: text('applied_at').notNull(),
  status: text('status').notNull().default('PENDING_REVIEW'),
  reviewNotes: text('review_notes'),
  reviewedBy: text('reviewed_by'),
  reviewedAt: text('reviewed_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// 14. Admin Village Service Areas & Delivery Zones
export const adminServiceAreas = pgTable('admin_service_areas', {
  id: serial('id').primaryKey(),
  externalId: text('external_id').notNull().unique(),
  name: text('name').notNull(),
  postalCode: text('postal_code').notNull(),
  district: text('district').notNull(),
  state: text('state').notNull(),
  isActive: boolean('is_active').notNull().default(true),
  activeSellersCount: integer('active_sellers_count').notNull().default(0),
  baseDeliveryFeePaise: integer('base_delivery_fee_paise').notNull().default(1500),
  minOrderFreeDeliveryPaise: integer('min_order_free_delivery_paise').notNull().default(40000),
  landmarksJson: text('landmarks_json').notNull().default('[]'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// 15. Admin Inter-Village Delivery Routes Matrix
export const adminInterVillageRoutes = pgTable('admin_inter_village_routes', {
  id: serial('id').primaryKey(),
  externalId: text('external_id').notNull().unique(),
  fromVillageId: text('from_village_id').notNull(),
  fromVillageName: text('from_village_name').notNull(),
  toVillageId: text('to_village_id').notNull(),
  toVillageName: text('to_village_name').notNull(),
  distanceKm: numeric('distance_km', { precision: 6, scale: 2 }).notNull().default('3.00'),
  surchargePaise: integer('surcharge_paise').notNull().default(1500),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// 16. Admin Delivery Partners & Runner Fleet
export const adminDeliveryPartners = pgTable('admin_delivery_partners', {
  id: serial('id').primaryKey(),
  externalId: text('external_id').notNull().unique(),
  name: text('name').notNull(),
  phone: text('phone').notNull(),
  villageId: text('village_id').notNull(),
  villageName: text('village_name').notNull(),
  vehicleType: text('vehicle_type').notNull().default('BIKE'),
  vehicleNumber: text('vehicle_number'),
  kycVerified: boolean('kyc_verified').notNull().default(false),
  status: text('status').notNull().default('AVAILABLE'),
  completedDeliveries: integer('completed_deliveries').notNull().default(0),
  rating: numeric('rating', { precision: 3, scale: 2 }).notNull().default('5.00'),
  joinedAt: text('joined_at').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// 17. Admin Compliance & Action Audit Logs
export const adminAuditLogs = pgTable('admin_audit_logs', {
  id: serial('id').primaryKey(),
  externalId: text('external_id').notNull().unique(),
  actor: text('actor').notNull(),
  actorRole: text('actor_role').notNull(),
  actionType: text('action_type').notNull(),
  targetEntity: text('target_entity').notNull(),
  targetId: text('target_id').notNull(),
  ipAddress: text('ip_address').notNull().default('server'),
  details: text('details').notNull(),
  reason: text('reason'),
  metadataJson: text('metadata_json'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 18. Admin Multi-Verticals Master
export const adminVerticals = pgTable('admin_verticals', {
  id: serial('id').primaryKey(),
  externalId: text('external_id').notNull().unique(),
  name: text('name').notNull(),
  hindiName: text('hindi_name').notNull().default(''),
  icon: text('icon').notNull().default('Layers'),
  isEnabled: boolean('is_enabled').notNull().default(true),
  sellerCount: integer('seller_count').notNull().default(0),
  description: text('description').notNull().default(''),
  specialRulesJson: text('special_rules_json').notNull().default('[]'),
  fulfillmentWorkflow: text('fulfillment_workflow').notNull().default('PHYSICAL_RETAIL'),
  requiredKycDocsJson: text('required_kyc_docs_json').notNull().default('[]'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// 19. Admin Attributes & Specifications Master
export const adminAttributes = pgTable('admin_attributes', {
  id: serial('id').primaryKey(),
  externalId: text('external_id').notNull().unique(),
  name: text('name').notNull(),
  hindiName: text('hindi_name').notNull().default(''),
  slug: text('slug').notNull(),
  dataType: text('data_type').notNull().default('TEXT'),
  optionsJson: text('options_json').notNull().default('[]'),
  unitSuffix: text('unit_suffix'),
  isRequired: boolean('is_required').notNull().default(false),
  isFilterable: boolean('is_filterable').notNull().default(true),
  isVariantAxis: boolean('is_variant_axis').notNull().default(false),
  verticalsJson: text('verticals_json').notNull().default('[]'),
  categoryIdsJson: text('category_ids_json').notNull().default('[]'),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// 20. Admin Units & Measurement Master
export const adminUnits = pgTable('admin_units', {
  id: serial('id').primaryKey(),
  externalId: text('external_id').notNull().unique(),
  name: text('name').notNull(),
  hindiName: text('hindi_name').notNull().default(''),
  symbol: text('symbol').notNull(),
  family: text('family').notNull().default('COUNT'),
  baseUnit: text('base_unit'),
  conversionFactor: numeric('conversion_factor', { precision: 12, scale: 4 }),
  allowDecimal: boolean('allow_decimal').notNull().default(false),
  allowSellerLocalOverride: boolean('allow_seller_local_override').notNull().default(false),
  verticalsJson: text('verticals_json').notNull().default('[]'),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// 21. Admin Option Groups & Customizations Master
export const adminOptionGroups = pgTable('admin_option_groups', {
  id: serial('id').primaryKey(),
  externalId: text('external_id').notNull().unique(),
  name: text('name').notNull(),
  hindiName: text('hindi_name').notNull().default(''),
  verticalsJson: text('verticals_json').notNull().default('[]'),
  categoryIdsJson: text('category_ids_json').notNull().default('[]'),
  selectionType: text('selection_type').notNull().default('SINGLE'),
  isRequired: boolean('is_required').notNull().default(false),
  minSelect: integer('min_select').notNull().default(0),
  maxSelect: integer('max_select').notNull().default(1),
  optionsJson: text('options_json').notNull().default('[]'),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// 22. Admin Brand Master
export const adminBrands = pgTable('admin_brands', {
  id: serial('id').primaryKey(),
  externalId: text('external_id').notNull().unique(),
  code: text('code'),
  name: text('name').notNull(),
  manufacturer: text('manufacturer'),
  verticalsJson: text('verticals_json').notNull().default('[]'),
  isVerified: boolean('is_verified').notNull().default(false),
  description: text('description'),
  productCount: integer('product_count').notNull().default(0),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// 23. Admin Product Variant & Size Master
export const adminVariantMasters = pgTable('admin_variant_masters', {
  id: serial('id').primaryKey(),
  externalId: text('external_id').notNull().unique(),
  sku: text('sku').notNull().unique(),
  name: text('name').notNull(),
  sizeLabel: text('size_label').notNull(),
  vertical: text('vertical').notNull(),
  categoryId: text('category_id').notNull(),
  productId: text('product_id'),
  unitId: text('unit_id').notNull(),
  unitQuantity: numeric('unit_quantity', { precision: 10, scale: 3 }).notNull().default('1.000'),
  mrpPaise: integer('mrp_paise').notNull().default(0),
  sellingPricePaise: integer('selling_price_paise').notNull().default(0),
  stockQuantity: numeric('stock_quantity', { precision: 10, scale: 3 }).notNull().default('0.000'),
  lowStockThreshold: numeric('low_stock_threshold', { precision: 10, scale: 3 })
    .notNull()
    .default('5.000'),
  attributesJson: text('attributes_json').notNull().default('{}'),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// 24. Admin Packaging Master
export const adminPackagingMasters = pgTable('admin_packaging_masters', {
  id: serial('id').primaryKey(),
  externalId: text('external_id').notNull().unique(),
  code: text('code').notNull().unique(),
  name: text('name').notNull(),
  hindiName: text('hindi_name'),
  materialType: text('material_type').notNull().default('FOOD_CONTAINER'),
  capacityLabel: text('capacity_label').notNull(),
  unitId: text('unit_id'),
  feePaise: integer('fee_paise').notNull().default(0),
  isFoodGrade: boolean('is_food_grade').notNull().default(true),
  isEcoFriendly: boolean('is_eco_friendly').notNull().default(false),
  isLeakProof: boolean('is_leak_proof').notNull().default(false),
  verticalsJson: text('verticals_json').notNull().default('[]'),
  categoryIdsJson: text('category_ids_json').notNull().default('[]'),
  productIdsJson: text('product_ids_json').notNull().default('[]'),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// 25. Admin Product Availability & Stock Configuration Master
export const adminAvailabilityConfigs = pgTable('admin_availability_configs', {
  id: serial('id').primaryKey(),
  externalId: text('external_id').notNull().unique(),
  code: text('code').notNull().unique(),
  name: text('name').notNull(),
  vertical: text('vertical').notNull(),
  categoryId: text('category_id').notNull(),
  productId: text('product_id'),
  workflowMode: text('workflow_mode').notNull().default('TRACKED_INVENTORY'),
  serviceSlotsJson: text('service_slots_json').notNull().default('[]'),
  prepTimeMinutes: integer('prep_time_minutes'),
  dailyBatchLimit: integer('daily_batch_limit'),
  lowStockThreshold: integer('low_stock_threshold').notNull().default(5),
  maxQtyPerOrder: integer('max_qty_per_order').notNull().default(10),
  autoDisableOnZeroStock: boolean('auto_disable_on_zero_stock').notNull().default(true),
  allowPreOrder: boolean('allow_pre_order').notNull().default(false),
  restockLeadHours: integer('restock_lead_hours'),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// 26. Admin Fee & Commission Rules
export const adminFeeRules = pgTable('admin_fee_rules', {
  id: serial('id').primaryKey(),
  externalId: text('external_id').notNull().unique(),
  name: text('name').notNull(),
  vertical: text('vertical').notNull().default('ALL'),
  commissionBps: integer('commission_bps').notNull().default(0),
  platformFeePaise: integer('platform_fee_paise').notNull().default(0),
  effectiveFrom: text('effective_from').notNull(),
  isPilotShadowMode: boolean('is_pilot_shadow_mode').notNull().default(true),
  status: text('status').notNull().default('ACTIVE'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// 27. Admin Offers & Promo Coupons
export const adminOffers = pgTable('admin_offers', {
  id: serial('id').primaryKey(),
  externalId: text('external_id').notNull().unique(),
  code: text('code').notNull().unique(),
  title: text('title').notNull(),
  discountType: text('discount_type').notNull().default('FLAT'),
  discountValue: integer('discount_value').notNull().default(0),
  minOrderPaise: integer('min_order_paise').notNull().default(0),
  maxDiscountPaise: integer('max_discount_paise'),
  vertical: text('vertical').notNull().default('ALL'),
  villageId: text('village_id').notNull().default('ALL'),
  fundedBy: text('funded_by').notNull().default('PLATFORM'),
  validFrom: text('valid_from').notNull(),
  validUntil: text('valid_until').notNull(),
  usageLimit: integer('usage_limit').notNull().default(100),
  usedCount: integer('used_count').notNull().default(0),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// 28. Admin Tax / GST Slabs
export const adminTaxSlabs = pgTable('admin_tax_slabs', {
  id: serial('id').primaryKey(),
  externalId: text('external_id').notNull().unique(),
  name: text('name').notNull(),
  vertical: text('vertical').notNull().default('ALL'),
  gstPercent: numeric('gst_percent', { precision: 5, scale: 2 }).notNull().default('0.00'),
  hsnPrefix: text('hsn_prefix').notNull().default(''),
  isInclusive: boolean('is_inclusive').notNull().default(true),
  description: text('description').notNull().default(''),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// 29. Admin Cancellation Policy Rules
export const adminCancellationRules = pgTable('admin_cancellation_rules', {
  id: serial('id').primaryKey(),
  externalId: text('external_id').notNull().unique(),
  actor: text('actor').notNull().default('CUSTOMER'),
  code: text('code').notNull().unique(),
  label: text('label').notNull(),
  freeCancelWindowMins: integer('free_cancel_window_mins').notNull().default(0),
  penaltyPercent: integer('penalty_percent').notNull().default(0),
  autoRefundEligible: boolean('auto_refund_eligible').notNull().default(true),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// 30. Admin Seller Settlement Payouts
export const adminSellerPayouts = pgTable('admin_seller_payouts', {
  id: serial('id').primaryKey(),
  externalId: text('external_id').notNull().unique(),
  sellerId: text('seller_id').notNull(),
  sellerName: text('seller_name').notNull(),
  villageName: text('village_name').notNull(),
  vertical: text('vertical'),
  periodLabel: text('period_label').notNull(),
  ordersCount: integer('orders_count').notNull().default(0),
  grossAmountPaise: integer('gross_amount_paise').notNull().default(0),
  commissionPaise: integer('commission_paise').notNull().default(0),
  refundDeductionsPaise: integer('refund_deductions_paise').notNull().default(0),
  otherDeductionsPaise: integer('other_deductions_paise').notNull().default(0),
  platformFeePaise: integer('platform_fee_paise').notNull().default(0),
  netPayablePaise: integer('net_payable_paise').notNull().default(0),
  paymentMode: text('payment_mode').notNull().default('NEFT_IMPS'),
  utrNumber: text('utr_number'),
  status: text('status').notNull().default('PENDING'),
  settlementDate: text('settlement_date'),
  settledAt: text('settled_at'),
  includedOrderIdsJson: text('included_order_ids_json').notNull().default('[]'),
  notes: text('notes'),
  historyJson: text('history_json').notNull().default('[]'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// 31. Admin Payment Transactions Ledger
export const adminPaymentTransactions = pgTable('admin_payment_transactions', {
  id: serial('id').primaryKey(),
  externalId: text('external_id').notNull().unique(),
  orderId: text('order_id').notNull(),
  customerName: text('customer_name').notNull(),
  customerPhone: text('customer_phone'),
  sellerId: text('seller_id'),
  sellerName: text('seller_name').notNull(),
  villageName: text('village_name').notNull(),
  vertical: text('vertical'),
  amountPaise: integer('amount_paise').notNull().default(0),
  method: text('method').notNull().default('UPI'),
  gatewayRef: text('gateway_ref').notNull(),
  status: text('status').notNull().default('CAPTURED'),
  failureReason: text('failure_reason'),
  refundId: text('refund_id'),
  refundAmountPaise: integer('refund_amount_paise'),
  platformFeePaise: integer('platform_fee_paise'),
  recordedAt: text('recorded_at').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 32. Admin Refund Ledger
export const adminRefundLedger = pgTable('admin_refund_ledger', {
  id: serial('id').primaryKey(),
  externalId: text('external_id').notNull().unique(),
  orderId: text('order_id').notNull(),
  originalTransactionId: text('original_transaction_id'),
  originalPaymentMethod: text('original_payment_method'),
  originalAmountPaise: integer('original_amount_paise'),
  supportCaseId: text('support_case_id'),
  customerName: text('customer_name').notNull(),
  customerPhone: text('customer_phone'),
  villageName: text('village_name'),
  sellerName: text('seller_name').notNull(),
  amountPaise: integer('amount_paise').notNull().default(0),
  reason: text('reason').notNull(),
  rejectionReason: text('rejection_reason'),
  refundChannel: text('refund_channel').notNull().default('ORIGINAL_UPI'),
  status: text('status').notNull().default('INITIATED'),
  requestedAt: text('requested_at').notNull(),
  processedAt: text('processed_at'),
  historyJson: text('history_json').notNull().default('[]'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// ---------------------------------------------------------------------------
// Phase 4: Support, Customers, Platform Settings, CMS, Reviews & Broadcasts
// ---------------------------------------------------------------------------

// 33. Admin Support Cases & Disputes
export const adminSupportCases = pgTable('admin_support_cases', {
  id: serial('id').primaryKey(),
  externalId: text('external_id').notNull().unique(),
  orderId: text('order_id').notNull(),
  vertical: text('vertical'),
  customerName: text('customer_name').notNull(),
  customerPhone: text('customer_phone').notNull(),
  sellerId: text('seller_id').notNull(),
  sellerName: text('seller_name').notNull(),
  issueType: text('issue_type').notNull(),
  status: text('status').notNull().default('OPEN'),
  amountPaise: integer('amount_paise').notNull().default(0),
  approvedRefundPaise: integer('approved_refund_paise'),
  description: text('description').notNull(),
  resolutionNotes: text('resolution_notes'),
  createdAtIso: text('created_at_iso').notNull(),
  updatedAtIso: text('updated_at_iso').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// 34. Admin Customer Directory & Moderation Profiles
export const adminCustomers = pgTable('admin_customers', {
  id: serial('id').primaryKey(),
  externalId: text('external_id').notNull().unique(),
  name: text('name').notNull(),
  phone: text('phone').notNull(),
  email: text('email').notNull().default(''),
  villageId: text('village_id').notNull(),
  villageName: text('village_name').notNull(),
  landmark: text('landmark').notNull().default(''),
  totalOrders: integer('total_orders').notNull().default(0),
  totalSpendPaise: integer('total_spend_paise').notNull().default(0),
  udhariBalancePaise: integer('udhari_balance_paise').notNull().default(0),
  status: text('status').notNull().default('ACTIVE'),
  blockReason: text('block_reason'),
  joinedAt: text('joined_at').notNull(),
  lastOrderAt: text('last_order_at').notNull(),
  adminNotes: text('admin_notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// 35. Global Platform Settings (singleton keyed by settings_key = 'global')
export const adminPlatformSettings = pgTable('admin_platform_settings', {
  id: serial('id').primaryKey(),
  settingsKey: text('settings_key').notNull().unique(),
  platformName: text('platform_name').notNull(),
  tagline: text('tagline').notNull(),
  supportPhone: text('support_phone').notNull(),
  whatsappSupport: text('whatsapp_support').notNull(),
  defaultDeliveryEnabled: boolean('default_delivery_enabled').notNull().default(true),
  defaultPickupEnabled: boolean('default_pickup_enabled').notNull().default(true),
  allowMultiVerticalSellers: boolean('allow_multi_vertical_sellers').notNull().default(true),
  autoCancelUnacceptedMins: integer('auto_cancel_unaccepted_mins').notNull().default(15),
  foodPrepSlaMins: integer('food_prep_sla_mins').notNull().default(35),
  maintenanceMode: boolean('maintenance_mode').notNull().default(false),
  maintenanceMessage: text('maintenance_message').notNull().default(''),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// 36. CMS Promotional Banners
export const adminCmsBanners = pgTable('admin_cms_banners', {
  id: serial('id').primaryKey(),
  externalId: text('external_id').notNull().unique(),
  title: text('title').notNull(),
  subtitle: text('subtitle').notNull().default(''),
  placement: text('placement').notNull().default('HERO_CAROUSEL'),
  targetVertical: text('target_vertical').notNull().default('ALL'),
  targetVillage: text('target_village').notNull().default('ALL'),
  ctaLabel: text('cta_label').notNull().default('Explore'),
  accentColor: text('accent_color').notNull().default('#218838'),
  validFrom: text('valid_from').notNull(),
  validUntil: text('valid_until').notNull(),
  priority: integer('priority').notNull().default(1),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// 37. Homepage Featured Sellers
export const adminFeaturedSellers = pgTable('admin_featured_sellers', {
  id: serial('id').primaryKey(),
  sellerExternalId: text('seller_external_id').notNull().unique(),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 38. CMS Legal & Policy Pages
export const adminCmsPolicies = pgTable('admin_cms_policies', {
  id: serial('id').primaryKey(),
  externalId: text('external_id').notNull().unique(),
  slug: text('slug').notNull().unique(),
  title: text('title').notNull(),
  version: text('version').notNull().default('v1.0'),
  summary: text('summary').notNull().default(''),
  content: text('content').notNull().default(''),
  updatedAtDate: text('updated_at_date').notNull(),
  updatedBy: text('updated_by').notNull().default('Admin'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// 39. Customer Reviews & Moderation Queue
export const adminReviews = pgTable('admin_reviews', {
  id: serial('id').primaryKey(),
  externalId: text('external_id').notNull().unique(),
  orderId: text('order_id').notNull(),
  customerUid: text('customer_uid'),
  customerName: text('customer_name').notNull(),
  sellerId: text('seller_id').notNull(),
  sellerName: text('seller_name').notNull(),
  vertical: text('vertical').notNull(),
  villageName: text('village_name').notNull(),
  rating: integer('rating').notNull().default(5),
  comment: text('comment').notNull(),
  status: text('status').notNull().default('PUBLISHED'),
  flagReason: text('flag_reason'),
  moderationNotes: text('moderation_notes'),
  createdAtIso: text('created_at_iso').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// 40. Village & Seller Broadcast Messages
export const adminBroadcasts = pgTable('admin_broadcasts', {
  id: serial('id').primaryKey(),
  externalId: text('external_id').notNull().unique(),
  title: text('title').notNull(),
  message: text('message').notNull(),
  channel: text('channel').notNull().default('APP_PUSH'),
  audience: text('audience').notNull().default('ALL_CUSTOMERS'),
  targetVillage: text('target_village').notNull().default('ALL'),
  priority: text('priority').notNull().default('NORMAL'),
  estimatedReach: integer('estimated_reach').notNull().default(0),
  deliveredCount: integer('delivered_count').notNull().default(0),
  status: text('status').notNull().default('SENT'),
  scheduledFor: text('scheduled_for'),
  sentAtIso: text('sent_at_iso').notNull(),
  createdBy: text('created_by').notNull().default('Admin'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// ---------------------------------------------------------------------------
// Phase 5: Admin RBAC & Team Accounts, Udhari Settings & Disputes
// ---------------------------------------------------------------------------

// 41. Admin Team Users
export const adminTeamUsers = pgTable('admin_team_users', {
  id: serial('id').primaryKey(),
  externalId: text('external_id').notNull().unique(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  phone: text('phone').notNull(),
  role: text('role').notNull().default('ADMIN_OPS'),
  status: text('status').notNull().default('ACTIVE'),
  assignedVillagesJson: text('assigned_villages_json').notNull().default('["ALL"]'),
  lastActiveAt: text('last_active_at').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// 42. Admin Role Permission Matrix
export const adminRolePermissions = pgTable('admin_role_permissions', {
  id: serial('id').primaryKey(),
  role: text('role').notNull().unique(),
  permissionsJson: text('permissions_json').notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// 43. Seller Udhari Credit Settings & Policy Acknowledgements
export const udhariSellerSettings = pgTable('udhari_seller_settings', {
  id: serial('id').primaryKey(),
  sellerCode: text('seller_code').notNull().unique(),
  enabled: boolean('enabled').notNull().default(false),
  acknowledgedAt: text('acknowledged_at'),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// 44. Udhari Ledger Disputes
export const udhariDisputes = pgTable('udhari_disputes', {
  id: serial('id').primaryKey(),
  externalId: text('external_id').notNull().unique(),
  sellerCode: text('seller_code').notNull(),
  customerId: text('customer_id').notNull(),
  ledgerEntryId: text('ledger_entry_id').notNull(),
  reasonCode: text('reason_code').notNull(),
  description: text('description').notNull(),
  status: text('status').notNull().default('OPEN'),
  resolutionNote: text('resolution_note'),
  openedAtIso: text('opened_at_iso').notNull(),
  resolvedAtIso: text('resolved_at_iso'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// ---------------------------------------------------------------------------
// Phase 6: Seller Safety & Quality Compliance (100% Admin Panel Coverage)
// ---------------------------------------------------------------------------

// 45. Seller Safety & Hygiene Certification Profiles
export const sellerSafetyProfiles = pgTable('seller_safety_profiles', {
  id: serial('id').primaryKey(),
  sellerCode: text('seller_code').notNull().unique(),
  track: text('track').notNull().default('GROCERY'),
  completedModuleIdsJson: text('completed_module_ids_json').notNull().default('[]'),
  retrainingRequired: boolean('retraining_required').notNull().default(false),
  retrainingReason: text('retraining_reason'),
  suspendedForSafety: boolean('suspended_for_safety').notNull().default(false),
  certificateNumber: text('certificate_number'),
  certifiedAt: text('certified_at'),
  certificateValidUntil: text('certificate_valid_until'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// 46. Seller Daily Hygiene Checklist Submissions
export const sellerSafetyChecklists = pgTable(
  'seller_safety_checklists',
  {
    id: serial('id').primaryKey(),
    externalId: text('external_id').notNull().unique(),
    sellerCode: text('seller_code').notNull(),
    dateKey: text('date_key').notNull(),
    track: text('track').notNull().default('GROCERY'),
    checkedItemIdsJson: text('checked_item_ids_json').notNull().default('[]'),
    scorePercent: integer('score_percent').notNull().default(0),
    completedCriticalCount: integer('completed_critical_count').notNull().default(0),
    totalCriticalCount: integer('total_critical_count').notNull().default(0),
    notes: text('notes'),
    submittedAtIso: text('submitted_at_iso').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex('uq_safety_checklist_seller_date').on(table.sellerCode, table.dateKey),
  ]
);

// 47. Seller Safety Certification Exam Attempts
export const sellerSafetyExamAttempts = pgTable('seller_safety_exam_attempts', {
  id: serial('id').primaryKey(),
  externalId: text('external_id').notNull().unique(),
  sellerCode: text('seller_code').notNull(),
  track: text('track').notNull().default('GROCERY'),
  scorePercent: integer('score_percent').notNull().default(0),
  correctCount: integer('correct_count').notNull().default(0),
  totalQuestions: integer('total_questions').notNull().default(0),
  passed: boolean('passed').notNull().default(false),
  timeTakenSeconds: integer('time_taken_seconds').notNull().default(0),
  weakTopicsJson: text('weak_topics_json').notNull().default('[]'),
  answersJson: text('answers_json').notNull().default('{}'),
  submittedAtIso: text('submitted_at_iso').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 48. Admin Safety & Quality Inspection Audits
export const sellerSafetyInspections = pgTable('seller_safety_inspections', {
  id: serial('id').primaryKey(),
  externalId: text('external_id').notNull().unique(),
  sellerCode: text('seller_code').notNull(),
  inspectorName: text('inspector_name').notNull(),
  scorePercent: integer('score_percent').notNull().default(0),
  outcome: text('outcome').notNull().default('PASSED'),
  remarks: text('remarks').notNull(),
  findingsJson: text('findings_json').notNull().default('[]'),
  inspectedAtIso: text('inspected_at_iso').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ---------------------------------------------------------------------------
// Phase 7: Seller Role Operations — In-House Runners & Dispatch
// ---------------------------------------------------------------------------

// 49. Seller In-House Delivery Runners
export const sellerRunners = pgTable('seller_runners', {
  id: serial('id').primaryKey(),
  externalId: text('external_id').notNull().unique(),
  sellerCode: text('seller_code').notNull(),
  name: text('name').notNull(),
  phone: text('phone').notNull(),
  role: text('role').notNull().default('Shop Runner'),
  activeOrdersCount: integer('active_orders_count').notNull().default(0),
  isAvailable: boolean('is_available').notNull().default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// ---------------------------------------------------------------------------
// Phase 8: Customer Role Operations — Saved Village Addresses
// ---------------------------------------------------------------------------

// 50. Customer Saved Village Delivery Addresses
export const customerAddresses = pgTable('customer_addresses', {
  id: serial('id').primaryKey(),
  externalId: text('external_id').notNull().unique(),
  customerUid: text('customer_uid').notNull(),
  recipientName: text('recipient_name').notNull(),
  recipientPhone: text('recipient_phone').notNull(),
  villageCode: text('village_code').notNull().default('rampur'),
  villageName: text('village_name').notNull().default('Rampur'),
  addressLine1: text('address_line1').notNull(),
  landmark: text('landmark').notNull(),
  addressLabel: text('address_label').notNull().default('Home'),
  isDefault: boolean('is_default').notNull().default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Relations
export const villagesRelations = relations(villages, ({ many }) => ({
  sellers: many(sellers),
}));

export const sellersRelations = relations(sellers, ({ one, many }) => ({
  village: one(villages, {
    fields: [sellers.villageId],
    references: [villages.id],
  }),
  inventoryItems: many(sellerInventoryItems),
  adminProducts: many(adminProducts),
  orders: many(orders),
  udhariProfiles: many(udhariCreditProfiles),
}));

export const adminProductsRelations = relations(adminProducts, ({ one }) => ({
  seller: one(sellers, {
    fields: [adminProducts.sellerId],
    references: [sellers.id],
  }),
}));

export const sellerInventoryItemsRelations = relations(sellerInventoryItems, ({ one, many }) => ({
  seller: one(sellers, {
    fields: [sellerInventoryItems.sellerId],
    references: [sellers.id],
  }),
  movements: many(inventoryStockMovements),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  seller: one(sellers, {
    fields: [orders.sellerId],
    references: [sellers.id],
  }),
  items: many(orderItems),
  statusHistory: many(orderStatusHistory),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id],
  }),
  listing: one(sellerInventoryItems, {
    fields: [orderItems.listingId],
    references: [sellerInventoryItems.id],
  }),
}));

export const orderStatusHistoryRelations = relations(orderStatusHistory, ({ one }) => ({
  order: one(orders, {
    fields: [orderStatusHistory.orderId],
    references: [orders.id],
  }),
}));

export const udhariCreditProfilesRelations = relations(
  udhariCreditProfiles,
  ({ one, many }) => ({
    seller: one(sellers, {
      fields: [udhariCreditProfiles.sellerId],
      references: [sellers.id],
    }),
    ledgerEntries: many(udhariLedgerEntries),
  })
);

export const udhariLedgerEntriesRelations = relations(udhariLedgerEntries, ({ one }) => ({
  profile: one(udhariCreditProfiles, {
    fields: [udhariLedgerEntries.profileId],
    references: [udhariCreditProfiles.id],
  }),
  order: one(orders, {
    fields: [udhariLedgerEntries.orderId],
    references: [orders.id],
  }),
}));
