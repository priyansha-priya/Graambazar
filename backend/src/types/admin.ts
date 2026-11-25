/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type AdminRole = 'SUPER_ADMIN' | 'ADMIN_OPS' | 'ADMIN_FINANCE' | 'ADMIN_SUPPORT';

export type AdminModuleKey =
  | 'DASHBOARD'
  | 'VERTICALS'
  | 'MASTER_CATEGORIES'
  | 'MASTER_BRANDS'
  | 'MASTER_UNITS'
  | 'MASTER_ATTRIBUTES'
  | 'MASTER_VARIANTS'
  | 'MASTER_ADDONS'
  | 'MASTER_PACKAGING'
  | 'MASTER_AVAILABILITY'
  | 'PRODUCTS'
  | 'APPLICATIONS'
  | 'SELLERS'
  | 'SAFETY_QUALITY'
  | 'SERVICE_AREAS'
  | 'ORDERS'
  | 'CUSTOMERS'
  | 'DELIVERY_FLEET'
  | 'OFFERS'
  | 'CMS_BANNERS'
  | 'BROADCASTS'
  | 'REVIEWS'
  | 'FEE_RULES'
  | 'PAYOUTS'
  | 'POLICIES_TAX'
  | 'UDHARI'
  | 'ANALYTICS'
  | 'SUPPORT'
  | 'ROLES'
  | 'SETTINGS'
  | 'AUDIT_LOGS';

export interface RoleModulePermission {
  view: boolean;
  manage: boolean;
  approve?: boolean;
  export?: boolean;
}

export type RolePermissionMatrix = Record<AdminRole, Record<AdminModuleKey, RoleModulePermission>>;

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: AdminRole;
  status?: 'ACTIVE' | 'SUSPENDED';
  assignedVillages?: string[]; // ['ALL'] or specific villageIds
  lastActiveAt?: string;
  avatar?: string;
}

export type VerticalWorkflowType =
  | 'FOOD_KITCHEN'
  | 'GROCERY_WEIGHT'
  | 'PHYSICAL_RETAIL'
  | 'MADE_TO_ORDER';

export type KycDocCode =
  | 'FSSAI'
  | 'AADHAAR'
  | 'PAN'
  | 'STORE_PHOTO'
  | 'GST_TRADE'
  | 'AGRI_LICENSE';

export interface VerticalConfigRecord {
  id: string; // e.g., 'FOOD', 'GROCERY', 'AGRICULTURE', 'HARDWARE', 'APPAREL', 'ELECTRONICS', 'FURNITURE', or custom
  name: string;
  hindiName: string;
  icon: string;
  isEnabled: boolean;
  sellerCount: number;
  description: string;
  specialRules: string[];
  fulfillmentWorkflow: VerticalWorkflowType;
  requiredKycDocs: KycDocCode[];
}

export type SellerBusinessType =
  | 'RESTAURANT'
  | 'HOTEL'
  | 'DHABA'
  | 'BAKERY'
  | 'KIRANA'
  | 'HARDWARE_STORE'
  | 'ELECTRONICS_DEALER'
  | 'CLOTHING_STORE'
  | 'FURNITURE_SHOP'
  | 'AGRI_KENDRA'
  | 'MULTI_CATEGORY';

export type ApplicationStatus = 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED' | 'CHANGES_REQUESTED';

export interface SellerApplication {
  id: string;
  applicantName: string;
  businessName: string;
  businessType?: SellerBusinessType;
  phone: string;
  villageId: string;
  villageName: string;
  vertical: string;
  supportedVerticals?: string[];
  fssaiNumber?: string;
  fssaiDocumentName?: string;
  gstOrTradeNumber?: string;
  agriLicenseNumber?: string;
  aadhaarMasked?: string;
  panNumber?: string;
  verifiedDocs?: Record<string, boolean>;
  bankAccountHolder: string;
  bankAccountNumber: string;
  ifscCode: string;
  appliedAt: string;
  status: ApplicationStatus;
  reviewNotes?: string;
  reviewedBy?: string;
  reviewedAt?: string;
}

export type SellerAccountStatus =
  | 'PENDING_APPROVAL'
  | 'KYC_PENDING'
  | 'KYC_UNDER_REVIEW'
  | 'APPROVED'
  | 'ACTIVE'
  | 'INACTIVE'
  | 'PAUSED'
  | 'SUSPENDED'
  | 'REJECTED';

export type SellerKycStatus =
  | 'PENDING'
  | 'UNDER_REVIEW'
  | 'APPROVED'
  | 'REJECTED'
  | 'CHANGES_REQUESTED';

export type SellerDocumentStatus =
  | 'PENDING'
  | 'APPROVED'
  | 'REJECTED'
  | 'CHANGES_REQUESTED';

export interface SellerDocumentVerificationEvent {
  status: SellerDocumentStatus;
  actor: string;
  timestamp: string;
  note: string;
}

export interface SellerKycDocumentRecord {
  id: string;
  code: KycDocCode;
  label: string;
  documentNumberMasked: string;
  fileName: string;
  uploadedAt: string;
  status: SellerDocumentStatus;
  rejectionReason?: string;
  history: SellerDocumentVerificationEvent[];
}

export type SellerActivityEventType =
  | 'REGISTRATION'
  | 'KYC_SUBMITTED'
  | 'KYC_APPROVED'
  | 'KYC_REJECTED'
  | 'KYC_CHANGES_REQUESTED'
  | 'DOC_UPDATED'
  | 'STORE_ACTIVATED'
  | 'STORE_DEACTIVATED'
  | 'STORE_SUSPENDED'
  | 'STORE_UNSUSPENDED'
  | 'PRODUCT_ADDED'
  | 'PRODUCT_APPROVED'
  | 'ORDER_RECEIVED'
  | 'SETTLEMENT_PROCESSED'
  | 'ADMIN_ACTION';

export interface SellerActivityEvent {
  id: string;
  type: SellerActivityEventType;
  title: string;
  description: string;
  actor: string;
  timestamp: string;
  reason?: string;
}

export interface MasterSellerRecord {
  id: string;
  name: string;
  ownerName: string;
  businessType?: SellerBusinessType;
  phone: string;
  email?: string;
  logoInitials?: string;
  logoBgClass?: string;
  shopAddress?: string;
  villageId: string;
  villageName: string;
  district?: string;
  state?: string;
  pinCode?: string;
  serviceableVillageIds?: string[];
  vertical: string;
  supportedVerticals?: string[];
  fulfilmentModes?: ('DELIVERY' | 'PICKUP')[];
  openingHours?: string;
  status: SellerAccountStatus;
  kycStatus?: SellerKycStatus;
  kycDocuments?: SellerKycDocumentRecord[];
  rating: number;
  totalOrders: number;
  gmvPaise: number;
  commissionRateBps: number; // e.g. 500 = 5.0%
  suspensionReason?: string;
  rejectionReason?: string;
  kycChangeRequestNotes?: string;
  bankAccountHolder?: string;
  bankAccountNumberMasked?: string;
  ifscCode?: string;
  aliasIds?: string[];
  activityHistory?: SellerActivityEvent[];
  fssaiVerified: boolean;
  joinedAt: string;
}

export interface CategoryRecord {
  id: string;
  name: string;
  hindiName: string;
  vertical: string;
  parentId?: string; // If set, this is a Subcategory
  icon: string;
  itemCount: number;
  isActive: boolean;
  sortOrder: number;
  attributeIds?: string[];
  allowedUnitIds?: string[];
}

export type AttributeDataType =
  | 'TEXT'
  | 'NUMBER'
  | 'SELECT'
  | 'MULTI_SELECT'
  | 'BOOLEAN'
  | 'DIMENSIONS';

export interface AttributeMasterRecord {
  id: string;
  name: string;
  hindiName: string;
  slug: string;
  dataType: AttributeDataType;
  options?: string[];
  unitSuffix?: string;
  isRequired: boolean;
  isFilterable: boolean;
  isVariantAxis: boolean; // Can generate SKU variants (e.g., Size, Colour, Weight Pack)
  verticals: string[];
  categoryIds?: string[]; // Configurable by Category
  isActive: boolean;
}

export type UnitFamily =
  | 'WEIGHT'
  | 'VOLUME'
  | 'LENGTH'
  | 'COUNT'
  | 'PORTION'
  | 'BULK_PACK'
  | 'AREA';

export interface UnitMasterRecord {
  id: string;
  name: string;
  hindiName: string;
  symbol: string;
  family: UnitFamily;
  baseUnit?: string;
  conversionFactor?: number; // e.g. 1 pav = 250g -> baseUnit='g', conversionFactor=250
  allowDecimal: boolean;
  allowSellerLocalOverride: boolean;
  verticals: string[];
  isActive: boolean;
}

export interface OptionGroupItem {
  id: string;
  label: string;
  priceDeltaPaise: number;
  dietType?: 'VEG' | 'NON_VEG' | 'EGG';
  isDefault: boolean;
  isAvailable: boolean;
}

export interface OptionGroupMasterRecord {
  id: string;
  name: string;
  hindiName: string;
  verticals: string[];
  categoryIds?: string[];
  selectionType: 'SINGLE' | 'MULTIPLE';
  isRequired: boolean;
  minSelect: number;
  maxSelect: number;
  options: OptionGroupItem[];
  isActive: boolean;
}

export interface BrandMasterRecord {
  id: string;
  code?: string;
  name: string;
  manufacturer?: string;
  verticals: string[];
  isVerified: boolean;
  description?: string;
  productCount: number;
  isActive: boolean;
}

export interface VariantSizeMasterRecord {
  id: string;
  sku: string;
  name: string; // e.g., "Aashirvaad Atta 5 Kg Pack" or "Paneer Butter Masala Full Plate"
  sizeLabel: string; // e.g., "5 Kg", "Full Plate", "Large 12\""
  vertical: string;
  categoryId: string;
  productId?: string;
  unitId: string;
  unitQuantity: number;
  mrpPaise: number;
  sellingPricePaise: number;
  stockQuantity: number;
  lowStockThreshold: number;
  attributes?: Record<string, string>;
  isActive: boolean;
}

export type PackagingMaterialType =
  | 'FOOD_CONTAINER'
  | 'THERMAL_BOX'
  | 'ECO_BAG'
  | 'SEALED_POUCH'
  | 'BOTTLE_JAR'
  | 'CORRUGATED_CARTON';

export interface PackagingMasterRecord {
  id: string;
  code: string;
  name: string;
  hindiName?: string;
  materialType: PackagingMaterialType;
  capacityLabel: string; // e.g., "500 ml", "Up to 5 kg"
  unitId?: string;
  feePaise: number;
  isFoodGrade: boolean;
  isEcoFriendly: boolean;
  isLeakProof: boolean;
  verticals: string[];
  categoryIds: string[];
  productIds: string[];
  isActive: boolean;
}

export type AvailabilityWorkflowMode =
  | 'TRACKED_INVENTORY'
  | 'DAILY_PREP_SLOTS'
  | 'MADE_TO_ORDER'
  | 'UNLIMITED_SERVICE';

export interface AvailabilityStockConfigRecord {
  id: string;
  code: string;
  name: string;
  vertical: string;
  categoryId: string;
  productId?: string;
  workflowMode: AvailabilityWorkflowMode;
  serviceSlots: string[];
  prepTimeMinutes?: number;
  dailyBatchLimit?: number;
  lowStockThreshold: number;
  maxQtyPerOrder: number;
  autoDisableOnZeroStock: boolean;
  allowPreOrder: boolean;
  restockLeadHours?: number;
  isActive: boolean;
}

export type InventoryMode =
  | 'QUANTITY_STOCK'
  | 'WEIGHT_STOCK'
  | 'VARIANT_STOCK'
  | 'PREPARED_FOOD'
  | 'MADE_TO_ORDER';

export type ProductModerationStatus =
  | 'PENDING_REVIEW'
  | 'APPROVED'
  | 'REJECTED'
  | 'CHANGES_REQUESTED';

export interface ProductVariantRecord {
  id: string;
  sku: string;
  label: string; // e.g., "L / White" or "500 g Pack"
  attributes: Record<string, string>;
  mrpPaise: number;
  pricePaise: number;
  stockQuantity: number;
  isAvailable: boolean;
}

export interface UniversalProductRecord {
  id: string;
  sku: string;
  name: string;
  hindiName?: string;
  description?: string;
  vertical: string;
  categoryId: string;
  subcategoryId?: string;
  brandId?: string;
  sellerId: string;
  sellerName: string;
  unitId: string;
  inventoryMode: InventoryMode;
  mrpPaise: number;
  pricePaise: number;
  stockQuantity?: number;
  lowStockThreshold?: number;
  prepTimeMinutes?: number;
  leadTimeDays?: number;
  dietType?: 'VEG' | 'NON_VEG' | 'EGG';
  attributes: Record<string, string | number | boolean>;
  variants: ProductVariantRecord[];
  optionGroupIds: string[];
  moderationStatus: ProductModerationStatus;
  moderationNotes?: string;
  isActive: boolean;
  isAvailable: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface VillageServiceAreaRecord {
  id: string;
  name: string;
  postalCode: string;
  district: string;
  state: string;
  isActive: boolean;
  activeSellersCount: number;
  baseDeliveryFeePaise: number;
  minOrderFreeDeliveryPaise: number;
  landmarksCount: number;
  landmarks?: string[];
}

export interface InterVillageRouteRecord {
  id: string;
  fromVillageId: string;
  fromVillageName: string;
  toVillageId: string;
  toVillageName: string;
  distanceKm: number;
  surchargePaise: number;
  isActive: boolean;
}

export interface FeeRuleRecord {
  id: string;
  name: string;
  vertical: string; // 'ALL' or any vertical id
  commissionBps: number;
  platformFeePaise: number;
  effectiveFrom: string;
  isPilotShadowMode: boolean; // Shadow mode calculates for audit without charging
  status: 'ACTIVE' | 'DEPRECATED';
}

export interface OfferCouponRecord {
  id: string;
  code: string;
  title: string;
  discountType: 'FLAT' | 'PERCENTAGE' | 'FREE_DELIVERY';
  discountValue: number; // Paise for FLAT, whole % for PERCENTAGE, 0 for FREE_DELIVERY
  minOrderPaise: number;
  maxDiscountPaise?: number;
  vertical: string; // 'ALL' or vertical id
  villageId: string; // 'ALL' or village id
  fundedBy: 'PLATFORM' | 'SELLER';
  validFrom: string;
  validUntil: string;
  usageLimit: number;
  usedCount: number;
  isActive: boolean;
}

export type SupportIssueType =
  | 'FOOD_QUALITY'
  | 'MISSING_ITEM'
  | 'DELIVERY_DELAY'
  | 'PAYMENT_ISSUE'
  | 'DEFECTIVE_PRODUCT'
  | 'WRONG_VARIANT'
  | 'DAMAGED_IN_TRANSIT'
  | 'WARRANTY_CLAIM'
  | 'UDHARI_DISPUTE'
  | 'OTHER';

export interface SupportCaseRecord {
  id: string;
  orderId: string;
  vertical?: string;
  customerName: string;
  customerPhone: string;
  sellerId: string;
  sellerName: string;
  issueType: SupportIssueType;
  status: 'OPEN' | 'INVESTIGATING' | 'REFUND_APPROVED' | 'RESOLVED' | 'CLOSED';
  amountPaise: number;
  approvedRefundPaise?: number;
  description: string;
  resolutionNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PlatformSettingsRecord {
  platformName: string;
  tagline: string;
  supportPhone: string;
  whatsappSupport: string;
  defaultDeliveryEnabled: boolean;
  defaultPickupEnabled: boolean;
  allowMultiVerticalSellers: boolean;
  autoCancelUnacceptedMins: number;
  foodPrepSlaMins: number;
  maintenanceMode: boolean;
  maintenanceMessage: string;
}

export interface AuditLogRecord {
  id: string;
  actor: string;
  actorRole: AdminRole | 'SELLER' | 'SYSTEM';
  actionType: string;
  targetEntity: string;
  targetId: string;
  timestamp: string;
  ipAddress: string;
  details: string;
  reason?: string;
  metadata?: Record<string, unknown>;
}

// --- EXTENDED ENTERPRISE ADMIN MODULES ---

export interface AdminCustomerRecord {
  id: string;
  name: string;
  phone: string;
  email: string;
  villageId: string;
  villageName: string;
  landmark: string;
  totalOrders: number;
  totalSpendPaise: number;
  udhariBalancePaise: number;
  status: 'ACTIVE' | 'BLOCKED';
  blockReason?: string;
  joinedAt: string;
  lastOrderAt: string;
  adminNotes?: string;
}

export interface FinanceHistoryEntry {
  status: string;
  note: string;
  timestamp: string;
  actor: string;
}

export interface SellerPayoutRecord {
  id: string;
  sellerId: string;
  sellerName: string;
  villageName: string;
  vertical?: 'FOOD' | 'GROCERY' | string;
  periodLabel: string;
  ordersCount: number;
  grossAmountPaise: number;
  commissionPaise: number;
  refundDeductionsPaise: number;
  otherDeductionsPaise?: number;
  platformFeePaise?: number;
  netPayablePaise: number;
  paymentMode: 'UPI' | 'NEFT_IMPS' | 'CASH_SETTLEMENT';
  utrNumber?: string;
  status: 'PENDING' | 'PROCESSING' | 'SETTLED' | 'FAILED';
  settlementDate?: string;
  settledAt?: string;
  includedOrderIds?: string[];
  notes?: string;
  history?: FinanceHistoryEntry[];
}

export interface PaymentTransactionRecord {
  id: string;
  orderId: string;
  customerName: string;
  customerPhone?: string;
  sellerId?: string;
  sellerName: string;
  villageName: string;
  vertical?: 'FOOD' | 'GROCERY' | string;
  amountPaise: number;
  method: 'UPI' | 'COD' | 'UDHARI';
  gatewayRef: string;
  status: 'CAPTURED' | 'PENDING_COD' | 'REFUNDED' | 'FAILED';
  failureReason?: string;
  refundId?: string;
  refundAmountPaise?: number;
  platformFeePaise?: number;
  createdAt: string;
}

export interface RefundLedgerRecord {
  id: string;
  orderId: string;
  originalTransactionId?: string;
  originalPaymentMethod?: 'UPI' | 'COD' | 'UDHARI';
  originalAmountPaise?: number;
  supportCaseId?: string;
  customerName: string;
  customerPhone?: string;
  villageName?: string;
  sellerName: string;
  amountPaise: number;
  reason: string;
  rejectionReason?: string;
  refundChannel: 'ORIGINAL_UPI' | 'STORE_CREDIT' | 'CASH_ADJUSTMENT';
  status: 'INITIATED' | 'PROCESSING' | 'PROCESSED' | 'FAILED' | 'REJECTED';
  requestedAt: string;
  processedAt?: string;
  history?: FinanceHistoryEntry[];
}

export interface CmsBannerRecord {
  id: string;
  title: string;
  subtitle: string;
  placement: 'HERO_CAROUSEL' | 'MID_PROMO' | 'FESTIVAL_STRIP';
  targetVertical: string; // 'ALL' or vertical id
  targetVillage: string; // 'ALL' or village id
  ctaLabel: string;
  accentColor: string;
  validFrom: string;
  validUntil: string;
  priority: number;
  isActive: boolean;
}

export interface CmsPolicyPageRecord {
  id: string;
  slug: 'terms' | 'privacy' | 'refund' | 'seller-policy';
  title: string;
  version: string;
  summary: string;
  content: string;
  updatedAt: string;
  updatedBy: string;
}

export interface CustomerReviewRecord {
  id: string;
  orderId: string;
  customerName: string;
  sellerId: string;
  sellerName: string;
  vertical: string;
  villageName: string;
  rating: number;
  comment: string;
  status: 'PUBLISHED' | 'FLAGGED' | 'HIDDEN';
  flagReason?: string;
  moderationNotes?: string;
  createdAt: string;
}

export interface BroadcastMessageRecord {
  id: string;
  title: string;
  message: string;
  channel: 'APP_PUSH' | 'WHATSAPP' | 'SMS' | 'ALL';
  audience: 'ALL_CUSTOMERS' | 'ALL_SELLERS' | 'VILLAGE_CUSTOMERS' | 'VILLAGE_SELLERS';
  targetVillage: string; // 'ALL' or village name
  priority: 'NORMAL' | 'FESTIVE' | 'URGENT_ALERT';
  estimatedReach: number;
  deliveredCount: number;
  status: 'SENT' | 'SCHEDULED' | 'DRAFT';
  scheduledFor?: string;
  sentAt: string;
  createdBy: string;
}

export interface TaxSlabRecord {
  id: string;
  name: string;
  vertical: string; // 'ALL' or vertical id
  gstPercent: number;
  hsnPrefix: string;
  isInclusive: boolean;
  description: string;
  isActive: boolean;
}

export interface CancellationPolicyRuleRecord {
  id: string;
  actor: 'CUSTOMER' | 'SELLER' | 'DELIVERY_FAILED';
  code: string;
  label: string;
  freeCancelWindowMins: number;
  penaltyPercent: number;
  autoRefundEligible: boolean;
  isActive: boolean;
}

export interface DeliveryPartnerRecord {
  id: string;
  name: string;
  phone: string;
  villageId: string;
  villageName: string;
  vehicleType: 'CYCLE' | 'BIKE' | 'E_RICKSHAW';
  vehicleNumber?: string;
  kycVerified: boolean;
  status: 'AVAILABLE' | 'ON_DELIVERY' | 'OFFLINE' | 'SUSPENDED';
  completedDeliveries: number;
  rating: number;
  joinedAt: string;
}

