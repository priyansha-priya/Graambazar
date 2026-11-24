/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  AdminRole,
  AdminModuleKey,
  RolePermissionMatrix,
  AdminUser,
  SellerApplication,
  MasterSellerRecord,
  SellerAccountStatus,
  SellerKycStatus,
  SellerDocumentStatus,
  SellerKycDocumentRecord,
  SellerActivityEvent,
  CategoryRecord,
  AttributeMasterRecord,
  UnitMasterRecord,
  OptionGroupMasterRecord,
  BrandMasterRecord,
  VariantSizeMasterRecord,
  PackagingMasterRecord,
  AvailabilityStockConfigRecord,
  UniversalProductRecord,
  ProductModerationStatus,
  VillageServiceAreaRecord,
  InterVillageRouteRecord,
  FeeRuleRecord,
  OfferCouponRecord,
  SupportCaseRecord,
  PlatformSettingsRecord,
  AuditLogRecord,
  VerticalConfigRecord,
  ApplicationStatus,
  AdminCustomerRecord,
  SellerPayoutRecord,
  PaymentTransactionRecord,
  RefundLedgerRecord,
  CmsBannerRecord,
  CmsPolicyPageRecord,
  CustomerReviewRecord,
  BroadcastMessageRecord,
  TaxSlabRecord,
  CancellationPolicyRuleRecord,
  DeliveryPartnerRecord,
} from '../types/admin';
import {
  INITIAL_CUSTOMERS,
  INITIAL_PAYOUTS,
  INITIAL_PAYMENT_TRANSACTIONS,
  INITIAL_REFUNDS,
  INITIAL_CMS_BANNERS,
  INITIAL_CMS_POLICIES,
  INITIAL_REVIEWS,
  INITIAL_BROADCASTS,
  INITIAL_TAX_SLABS,
  INITIAL_CANCELLATION_RULES,
  INITIAL_DELIVERY_PARTNERS,
} from './adminExtendedSeed';

interface AdminContextType {
  // Admin Users & RBAC
  adminUsers: AdminUser[];
  currentAdmin: AdminUser;
  switchActiveAdmin: (adminId: string) => void;
  addAdminUser: (user: Omit<AdminUser, 'id' | 'lastActiveAt'>) => void;
  updateAdminUser: (adminId: string, patch: Partial<AdminUser>) => void;
  rolePermissions: RolePermissionMatrix;
  updateRolePermission: (
    role: AdminRole,
    module: AdminModuleKey,
    key: 'view' | 'manage' | 'approve' | 'export',
    value: boolean
  ) => void;
  hasPermission: (
    module: AdminModuleKey,
    action?: 'view' | 'manage' | 'approve' | 'export'
  ) => boolean;

  // Applications & KYC
  applications: SellerApplication[];
  pendingApplicationsCount: number;
  reviewApplication: (
    applicationId: string,
    status: ApplicationStatus,
    notes: string
  ) => { success: boolean; message: string };
  toggleApplicationDocVerified: (applicationId: string, docCode: string) => void;

  // Sellers
  sellers: MasterSellerRecord[];
  updateSellerStatus: (
    sellerId: string,
    status: SellerAccountStatus,
    reason: string
  ) => { success: boolean; message: string };
  updateSellerConfig: (
    sellerId: string,
    patch: Partial<MasterSellerRecord>
  ) => { success: boolean; message: string };
  updateSellerKycDocument: (
    sellerId: string,
    docId: string,
    status: SellerDocumentStatus,
    note?: string
  ) => { success: boolean; message: string };
  requestSellerKycChanges: (
    sellerId: string,
    reason: string
  ) => { success: boolean; message: string };

  // Multi-Verticals Master
  verticalConfigs: VerticalConfigRecord[];
  toggleVerticalEnabled: (verticalId: string) => void;
  addVertical: (vertical: Omit<VerticalConfigRecord, 'sellerCount'>) => { success: boolean; message: string };
  updateVertical: (verticalId: string, patch: Partial<VerticalConfigRecord>) => void;

  // Categories & Subcategories Master
  categories: CategoryRecord[];
  toggleCategoryStatus: (categoryId: string) => void;
  addCategory: (category: Omit<CategoryRecord, 'id' | 'itemCount'>) => void;
  updateCategory: (categoryId: string, patch: Partial<CategoryRecord>) => void;
  deleteCategory: (categoryId: string) => void;

  // Attributes & Specifications Master
  attributes: AttributeMasterRecord[];
  addAttribute: (attr: Omit<AttributeMasterRecord, 'id'>) => void;
  updateAttribute: (attrId: string, patch: Partial<AttributeMasterRecord>) => void;
  toggleAttributeStatus: (attrId: string) => void;
  deleteAttribute: (attrId: string) => void;

  // Units & Measurement Master
  units: UnitMasterRecord[];
  addUnit: (unit: Omit<UnitMasterRecord, 'id'>) => void;
  updateUnit: (unitId: string, patch: Partial<UnitMasterRecord>) => void;
  toggleUnitStatus: (unitId: string) => void;
  deleteUnit: (unitId: string) => void;

  // Option Groups & Customizations Master
  optionGroups: OptionGroupMasterRecord[];
  addOptionGroup: (group: Omit<OptionGroupMasterRecord, 'id'>) => void;
  updateOptionGroup: (groupId: string, patch: Partial<OptionGroupMasterRecord>) => void;
  duplicateOptionGroup: (groupId: string) => void;
  toggleOptionGroupStatus: (groupId: string) => void;
  deleteOptionGroup: (groupId: string) => void;

  // Brand Master
  brands: BrandMasterRecord[];
  addBrand: (brand: Omit<BrandMasterRecord, 'id' | 'productCount'>) => void;
  updateBrand: (brandId: string, patch: Partial<BrandMasterRecord>) => void;
  toggleBrandVerified: (brandId: string) => void;
  toggleBrandStatus: (brandId: string) => void;
  deleteBrand: (brandId: string) => void;

  // Product Variant & Size Master
  variantMasters: VariantSizeMasterRecord[];
  addVariantMaster: (variant: Omit<VariantSizeMasterRecord, 'id'>) => void;
  updateVariantMaster: (variantId: string, patch: Partial<VariantSizeMasterRecord>) => void;
  toggleVariantMasterStatus: (variantId: string) => void;
  deleteVariantMaster: (variantId: string) => void;

  // Packaging Master
  packagingMasters: PackagingMasterRecord[];
  addPackagingMaster: (pkg: Omit<PackagingMasterRecord, 'id'>) => void;
  updatePackagingMaster: (pkgId: string, patch: Partial<PackagingMasterRecord>) => void;
  togglePackagingMasterStatus: (pkgId: string) => void;
  deletePackagingMaster: (pkgId: string) => void;

  // Product Availability & Stock Configuration Master
  availabilityConfigs: AvailabilityStockConfigRecord[];
  addAvailabilityConfig: (cfg: Omit<AvailabilityStockConfigRecord, 'id'>) => void;
  updateAvailabilityConfig: (cfgId: string, patch: Partial<AvailabilityStockConfigRecord>) => void;
  toggleAvailabilityConfigStatus: (cfgId: string) => void;
  deleteAvailabilityConfig: (cfgId: string) => void;

  // Universal Product, Variant, Moderation & Inventory Master
  products: UniversalProductRecord[];
  pendingProductsCount: number;
  addProduct: (product: Omit<UniversalProductRecord, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateProduct: (productId: string, patch: Partial<UniversalProductRecord>) => void;
  moderateProduct: (
    productId: string,
    status: ProductModerationStatus,
    notes: string
  ) => void;
  updateProductInventory: (
    productId: string,
    stockQuantity: number,
    variantStocks?: Record<string, number>
  ) => void;
  toggleProductAvailability: (productId: string) => void;

  // Service Areas & Inter-Village Matrix Master
  serviceAreas: VillageServiceAreaRecord[];
  toggleServiceAreaStatus: (areaId: string) => void;
  addServiceArea: (area: Omit<VillageServiceAreaRecord, 'id' | 'activeSellersCount' | 'landmarksCount'>) => void;
  updateServiceArea: (areaId: string, patch: Partial<VillageServiceAreaRecord>) => void;
  updateDeliveryFee: (areaId: string, baseFeePaise: number) => void;
  interVillageRoutes: InterVillageRouteRecord[];
  addInterVillageRoute: (route: Omit<InterVillageRouteRecord, 'id'>) => void;
  updateInterVillageRoute: (routeId: string, patch: Partial<InterVillageRouteRecord>) => void;
  deleteInterVillageRoute: (routeId: string) => void;

  // Fee & Commission Rules Master
  feeRules: FeeRuleRecord[];
  togglePilotShadowMode: (ruleId: string) => void;
  createFeeRule: (rule: Omit<FeeRuleRecord, 'id' | 'status'>) => void;
  updateFeeRule: (ruleId: string, patch: Partial<FeeRuleRecord>) => void;
  deprecateFeeRule: (ruleId: string) => void;

  // Offers & Coupons Master
  offers: OfferCouponRecord[];
  addOffer: (offer: Omit<OfferCouponRecord, 'id' | 'usedCount'>) => void;
  updateOffer: (offerId: string, patch: Partial<OfferCouponRecord>) => void;
  toggleOfferStatus: (offerId: string) => void;
  deleteOffer: (offerId: string) => void;

  // Support & Disputes
  supportCases: SupportCaseRecord[];
  openSupportCasesCount: number;
  updateSupportCaseStatus: (
    caseId: string,
    status: SupportCaseRecord['status'],
    resolutionNotes: string,
    approvedRefundPaise?: number
  ) => void;

  // Platform Settings Master
  platformSettings: PlatformSettingsRecord;
  updatePlatformSettings: (patch: Partial<PlatformSettingsRecord>) => void;

  // Customers Management
  customers: AdminCustomerRecord[];
  toggleCustomerBlock: (customerId: string, block: boolean, reason: string) => void;
  updateCustomerNotes: (customerId: string, notes: string) => void;

  // Payouts, Payments & Refunds
  payouts: SellerPayoutRecord[];
  pendingPayoutsCount: number;
  settleSellerPayout: (
    payoutId: string,
    payload: { paymentMode: SellerPayoutRecord['paymentMode']; utrNumber: string; notes?: string }
  ) => void;
  markPayoutProcessing: (payoutId: string) => void;
  paymentTransactions: PaymentTransactionRecord[];
  refundLedger: RefundLedgerRecord[];
  updateRefundStatus: (
    refundId: string,
    status: RefundLedgerRecord['status'],
    reason?: string
  ) => void;

  // CMS Banners, Featured Sellers & Legal Policies
  cmsBanners: CmsBannerRecord[];
  addCmsBanner: (banner: Omit<CmsBannerRecord, 'id'>) => void;
  updateCmsBanner: (bannerId: string, patch: Partial<CmsBannerRecord>) => void;
  toggleCmsBannerStatus: (bannerId: string) => void;
  deleteCmsBanner: (bannerId: string) => void;
  featuredSellerIds: string[];
  toggleFeaturedSeller: (sellerId: string) => void;
  cmsPolicies: CmsPolicyPageRecord[];
  updateCmsPolicy: (policyId: string, patch: Pick<CmsPolicyPageRecord, 'version' | 'summary' | 'content'>) => void;

  // Reviews & Ratings Moderation
  reviews: CustomerReviewRecord[];
  flaggedReviewsCount: number;
  moderateReview: (reviewId: string, status: CustomerReviewRecord['status'], notes?: string) => void;
  deleteReview: (reviewId: string) => void;

  // Notifications & Village Broadcasts
  broadcasts: BroadcastMessageRecord[];
  sendBroadcast: (broadcast: Omit<BroadcastMessageRecord, 'id' | 'sentAt' | 'createdBy' | 'deliveredCount'>) => void;
  deleteBroadcast: (broadcastId: string) => void;

  // Tax/GST Slabs & Cancellation Policies
  taxSlabs: TaxSlabRecord[];
  addTaxSlab: (slab: Omit<TaxSlabRecord, 'id'>) => void;
  updateTaxSlab: (slabId: string, patch: Partial<TaxSlabRecord>) => void;
  toggleTaxSlabStatus: (slabId: string) => void;
  deleteTaxSlab: (slabId: string) => void;
  cancellationRules: CancellationPolicyRuleRecord[];
  addCancellationRule: (rule: Omit<CancellationPolicyRuleRecord, 'id'>) => void;
  updateCancellationRule: (ruleId: string, patch: Partial<CancellationPolicyRuleRecord>) => void;
  toggleCancellationRuleStatus: (ruleId: string) => void;
  deleteCancellationRule: (ruleId: string) => void;

  // Delivery Partners & Fleet
  deliveryPartners: DeliveryPartnerRecord[];
  addDeliveryPartner: (partner: Omit<DeliveryPartnerRecord, 'id' | 'completedDeliveries' | 'rating' | 'joinedAt'>) => void;
  updateDeliveryPartner: (partnerId: string, patch: Partial<DeliveryPartnerRecord>) => void;
  deleteDeliveryPartner: (partnerId: string) => void;

  // Audit Logs
  auditLogs: AuditLogRecord[];
  logAuditEvent: (
    actionType: string,
    targetEntity: string,
    targetId: string,
    details: string,
    reason?: string,
    metadata?: Record<string, unknown>
  ) => void;
  clearAuditLogs: () => void;
  resetAdminData: () => void;
}

const ALL_MODULES: AdminModuleKey[] = [
  'DASHBOARD',
  'ANALYTICS',
  'VERTICALS',
  'MASTER_CATEGORIES',
  'MASTER_BRANDS',
  'MASTER_UNITS',
  'MASTER_ATTRIBUTES',
  'MASTER_VARIANTS',
  'MASTER_ADDONS',
  'MASTER_PACKAGING',
  'MASTER_AVAILABILITY',
  'PRODUCTS',
  'APPLICATIONS',
  'SELLERS',
  'SAFETY_QUALITY',
  'CUSTOMERS',
  'SERVICE_AREAS',
  'ORDERS',
  'DELIVERY_FLEET',
  'OFFERS',
  'CMS_BANNERS',
  'BROADCASTS',
  'REVIEWS',
  'FEE_RULES',
  'PAYOUTS',
  'POLICIES_TAX',
  'UDHARI',
  'SUPPORT',
  'ROLES',
  'SETTINGS',
  'AUDIT_LOGS',
];

const createFullPermissions = (): Record<AdminModuleKey, { view: boolean; manage: boolean; approve: boolean; export: boolean }> => {
  const map = {} as Record<AdminModuleKey, { view: boolean; manage: boolean; approve: boolean; export: boolean }>;
  ALL_MODULES.forEach((m) => {
    map[m] = { view: true, manage: true, approve: true, export: true };
  });
  return map;
};

const INITIAL_ROLE_PERMISSIONS: RolePermissionMatrix = {
  SUPER_ADMIN: createFullPermissions(),
  ADMIN_OPS: {
    DASHBOARD: { view: true, manage: false, approve: false, export: true },
    ANALYTICS: { view: true, manage: false, approve: false, export: true },
    VERTICALS: { view: true, manage: true, approve: false, export: false },
    MASTER_CATEGORIES: { view: true, manage: true, approve: false, export: true },
    MASTER_BRANDS: { view: true, manage: true, approve: true, export: true },
    MASTER_UNITS: { view: true, manage: true, approve: false, export: true },
    MASTER_ATTRIBUTES: { view: true, manage: true, approve: false, export: true },
    MASTER_VARIANTS: { view: true, manage: true, approve: false, export: true },
    MASTER_ADDONS: { view: true, manage: true, approve: false, export: true },
    MASTER_PACKAGING: { view: true, manage: true, approve: false, export: true },
    MASTER_AVAILABILITY: { view: true, manage: true, approve: false, export: true },
    PRODUCTS: { view: true, manage: true, approve: true, export: true },
    APPLICATIONS: { view: true, manage: true, approve: true, export: true },
    SELLERS: { view: true, manage: true, approve: true, export: true },
    SAFETY_QUALITY: { view: true, manage: true, approve: true, export: true },
    CUSTOMERS: { view: true, manage: true, approve: false, export: true },
    SERVICE_AREAS: { view: true, manage: true, approve: false, export: true },
    ORDERS: { view: true, manage: true, approve: false, export: true },
    DELIVERY_FLEET: { view: true, manage: true, approve: true, export: true },
    OFFERS: { view: true, manage: true, approve: false, export: false },
    CMS_BANNERS: { view: true, manage: true, approve: false, export: false },
    BROADCASTS: { view: true, manage: true, approve: false, export: false },
    REVIEWS: { view: true, manage: true, approve: true, export: false },
    FEE_RULES: { view: true, manage: false, approve: false, export: false },
    PAYOUTS: { view: true, manage: false, approve: false, export: false },
    POLICIES_TAX: { view: true, manage: true, approve: false, export: false },
    UDHARI: { view: true, manage: false, approve: false, export: false },
    SUPPORT: { view: true, manage: true, approve: false, export: false },
    ROLES: { view: false, manage: false, approve: false, export: false },
    SETTINGS: { view: true, manage: false, approve: false, export: false },
    AUDIT_LOGS: { view: true, manage: false, approve: false, export: true },
  },
  ADMIN_FINANCE: {
    DASHBOARD: { view: true, manage: false, approve: false, export: true },
    ANALYTICS: { view: true, manage: false, approve: false, export: true },
    VERTICALS: { view: true, manage: false, approve: false, export: false },
    MASTER_CATEGORIES: { view: true, manage: false, approve: false, export: false },
    MASTER_BRANDS: { view: true, manage: false, approve: false, export: false },
    MASTER_UNITS: { view: false, manage: false, approve: false, export: false },
    MASTER_ATTRIBUTES: { view: false, manage: false, approve: false, export: false },
    MASTER_VARIANTS: { view: true, manage: false, approve: false, export: true },
    MASTER_ADDONS: { view: false, manage: false, approve: false, export: false },
    MASTER_PACKAGING: { view: true, manage: true, approve: false, export: true },
    MASTER_AVAILABILITY: { view: false, manage: false, approve: false, export: false },
    PRODUCTS: { view: true, manage: false, approve: false, export: true },
    APPLICATIONS: { view: true, manage: false, approve: false, export: false },
    SELLERS: { view: true, manage: false, approve: false, export: true },
    SAFETY_QUALITY: { view: true, manage: false, approve: false, export: false },
    CUSTOMERS: { view: true, manage: false, approve: false, export: true },
    SERVICE_AREAS: { view: true, manage: true, approve: false, export: true },
    ORDERS: { view: true, manage: false, approve: false, export: true },
    DELIVERY_FLEET: { view: false, manage: false, approve: false, export: false },
    OFFERS: { view: true, manage: true, approve: true, export: true },
    CMS_BANNERS: { view: false, manage: false, approve: false, export: false },
    BROADCASTS: { view: false, manage: false, approve: false, export: false },
    REVIEWS: { view: false, manage: false, approve: false, export: false },
    FEE_RULES: { view: true, manage: true, approve: true, export: true },
    PAYOUTS: { view: true, manage: true, approve: true, export: true },
    POLICIES_TAX: { view: true, manage: true, approve: true, export: true },
    UDHARI: { view: true, manage: false, approve: false, export: true },
    SUPPORT: { view: true, manage: true, approve: true, export: true },
    ROLES: { view: false, manage: false, approve: false, export: false },
    SETTINGS: { view: false, manage: false, approve: false, export: false },
    AUDIT_LOGS: { view: true, manage: false, approve: false, export: true },
  },
  ADMIN_SUPPORT: {
    DASHBOARD: { view: true, manage: false, approve: false, export: false },
    ANALYTICS: { view: true, manage: false, approve: false, export: false },
    VERTICALS: { view: false, manage: false, approve: false, export: false },
    MASTER_CATEGORIES: { view: true, manage: false, approve: false, export: false },
    MASTER_BRANDS: { view: false, manage: false, approve: false, export: false },
    MASTER_UNITS: { view: false, manage: false, approve: false, export: false },
    MASTER_ATTRIBUTES: { view: false, manage: false, approve: false, export: false },
    MASTER_VARIANTS: { view: false, manage: false, approve: false, export: false },
    MASTER_ADDONS: { view: false, manage: false, approve: false, export: false },
    MASTER_PACKAGING: { view: false, manage: false, approve: false, export: false },
    MASTER_AVAILABILITY: { view: true, manage: false, approve: false, export: false },
    PRODUCTS: { view: true, manage: false, approve: false, export: false },
    APPLICATIONS: { view: true, manage: false, approve: false, export: false },
    SELLERS: { view: true, manage: false, approve: false, export: false },
    SAFETY_QUALITY: { view: true, manage: false, approve: false, export: false },
    CUSTOMERS: { view: true, manage: true, approve: false, export: false },
    SERVICE_AREAS: { view: true, manage: false, approve: false, export: false },
    ORDERS: { view: true, manage: true, approve: false, export: false },
    DELIVERY_FLEET: { view: true, manage: false, approve: false, export: false },
    OFFERS: { view: true, manage: false, approve: false, export: false },
    CMS_BANNERS: { view: false, manage: false, approve: false, export: false },
    BROADCASTS: { view: true, manage: true, approve: false, export: false },
    REVIEWS: { view: true, manage: true, approve: true, export: false },
    FEE_RULES: { view: false, manage: false, approve: false, export: false },
    PAYOUTS: { view: false, manage: false, approve: false, export: false },
    POLICIES_TAX: { view: true, manage: false, approve: false, export: false },
    UDHARI: { view: true, manage: false, approve: false, export: false },
    SUPPORT: { view: true, manage: true, approve: true, export: true },
    ROLES: { view: false, manage: false, approve: false, export: false },
    SETTINGS: { view: false, manage: false, approve: false, export: false },
    AUDIT_LOGS: { view: true, manage: false, approve: false, export: false },
  },
};

const INITIAL_ADMIN_USERS: AdminUser[] = [
  {
    id: 'admin_super_01',
    name: 'Vikram Singh',
    email: 'vikram@grambazaar.local',
    phone: '+91 98111 22233',
    role: 'SUPER_ADMIN',
    status: 'ACTIVE',
    assignedVillages: ['ALL'],
    lastActiveAt: '2026-11-02T09:15:00Z',
  },
  {
    id: 'admin_ops_01',
    name: 'Meena Verma',
    email: 'meena.ops@grambazaar.local',
    phone: '+91 98111 22244',
    role: 'ADMIN_OPS',
    status: 'ACTIVE',
    assignedVillages: ['v-rampur', 'v-madhopur', 'v-shivpur'],
    lastActiveAt: '2026-11-02T08:40:00Z',
  },
  {
    id: 'admin_fin_01',
    name: 'Rajesh Tiwari',
    email: 'rajesh.fin@grambazaar.local',
    phone: '+91 98111 22255',
    role: 'ADMIN_FINANCE',
    status: 'ACTIVE',
    assignedVillages: ['ALL'],
    lastActiveAt: '2026-11-01T18:20:00Z',
  },
  {
    id: 'admin_sup_01',
    name: 'Pooja Yadav',
    email: 'pooja.support@grambazaar.local',
    phone: '+91 98111 22266',
    role: 'ADMIN_SUPPORT',
    status: 'ACTIVE',
    assignedVillages: ['v-rampur', 'v-kalyanpur'],
    lastActiveAt: '2026-11-02T09:05:00Z',
  },
];

const INITIAL_VERTICALS: VerticalConfigRecord[] = [
  {
    id: 'FOOD',
    name: 'Food & Restaurants',
    hindiName: 'होटल, ढाबा और तैयार भोजन',
    icon: 'Utensils',
    isEnabled: true,
    sellerCount: 3,
    description: 'Freshly prepared restaurant dishes, dhabas, mithai, veg/non-veg classification, and kitchen prep timers.',
    specialRules: ['Requires FSSAI license check', 'Mandatory Veg/Non-Veg/Egg tag', 'Kitchen prep timers (15-45m)'],
    fulfillmentWorkflow: 'FOOD_KITCHEN',
    requiredKycDocs: ['FSSAI', 'AADHAAR', 'PAN', 'STORE_PHOTO'],
  },
  {
    id: 'GROCERY',
    name: 'Grocery & Daily Essentials',
    hindiName: 'किराना और दैनिक राशन',
    icon: 'ShoppingBag',
    isEnabled: true,
    sellerCount: 2,
    description: 'Packaged and loose dry ration, atta, pulses, spices, edible oils, custom weights and village pav units.',
    specialRules: ['Metric & local pav (250g) unit pricing', 'Weight & pack inventory tracking', 'Seller-managed delivery or pickup'],
    fulfillmentWorkflow: 'GROCERY_WEIGHT',
    requiredKycDocs: ['AADHAAR', 'PAN', 'STORE_PHOTO', 'GST_TRADE'],
  },
  {
    id: 'AGRICULTURE',
    name: 'Agriculture Products',
    hindiName: 'कृषि, बीज और खाद भंडार',
    icon: 'Sprout',
    isEnabled: true,
    sellerCount: 1,
    description: 'Certified seeds, crop fertilizers, agricultural pesticides, animal fodder, and seasonal farm inputs.',
    specialRules: ['Department of Agriculture license check', 'Bulk Bori (40kg/50kg) & Quintal unit support'],
    fulfillmentWorkflow: 'PHYSICAL_RETAIL',
    requiredKycDocs: ['AGRI_LICENSE', 'AADHAAR', 'PAN', 'STORE_PHOTO'],
  },
  {
    id: 'HARDWARE',
    name: 'Hardware, Electric & Plumbing',
    hindiName: 'हार्डवेयर और बिजली का सामान',
    icon: 'Wrench',
    isEnabled: true,
    sellerCount: 1,
    description: 'PVC pipes, motors, switches, agricultural machinery spares, paint, and home repair essentials.',
    specialRules: ['Gauge/diameter/length attributes', 'Store pickup or vehicle-assisted delivery'],
    fulfillmentWorkflow: 'PHYSICAL_RETAIL',
    requiredKycDocs: ['AADHAAR', 'PAN', 'GST_TRADE', 'STORE_PHOTO'],
  },
  {
    id: 'ELECTRONICS',
    name: 'Electronics & Appliances',
    hindiName: 'इलेक्ट्रॉनिक्स और उपकरण',
    icon: 'Smartphone',
    isEnabled: true,
    sellerCount: 1,
    description: 'Ceiling fans, LED lights, mixers, mobile accessories, inverters, solar lamps, and small appliances.',
    specialRules: ['Brand warranty & wattage attributes', 'Serial/invoice verification on delivery'],
    fulfillmentWorkflow: 'PHYSICAL_RETAIL',
    requiredKycDocs: ['AADHAAR', 'PAN', 'GST_TRADE', 'STORE_PHOTO'],
  },
  {
    id: 'APPAREL',
    name: 'Clothing & Fashion',
    hindiName: 'कपड़े और परिधान',
    icon: 'Shirt',
    isEnabled: true,
    sellerCount: 1,
    description: 'Kurtas, sarees, school uniforms, footwear, winterwear, and festive garments from local village stores.',
    specialRules: ['Size × Colour SKU variant matrix', '48-hour size exchange policy'],
    fulfillmentWorkflow: 'PHYSICAL_RETAIL',
    requiredKycDocs: ['AADHAAR', 'PAN', 'STORE_PHOTO'],
  },
  {
    id: 'FURNITURE',
    name: 'Home & Furniture',
    hindiName: 'फर्नीचर और घरेलू साज-सज्जा',
    icon: 'Armchair',
    isEnabled: false,
    sellerCount: 0,
    description: 'Wooden cots (charpai), chairs, almirahs, tables, mattresses, and custom carpenter made-to-order pieces.',
    specialRules: ['Dimensions (L×W×H) & wood material specs', 'Made-to-order lead-time days & scheduled transport'],
    fulfillmentWorkflow: 'MADE_TO_ORDER',
    requiredKycDocs: ['AADHAAR', 'PAN', 'STORE_PHOTO'],
  },
];

const INITIAL_APPLICATIONS: SellerApplication[] = [
  {
    id: 'app_001',
    applicantName: 'Radheshyam Sharma',
    businessName: 'Sharma Sweets & Dairy',
    businessType: 'RESTAURANT',
    phone: '+91 98765 11223',
    villageId: 'v-rampur',
    villageName: 'Rampur',
    vertical: 'FOOD',
    supportedVerticals: ['FOOD', 'GROCERY'],
    fssaiNumber: '12723001000982',
    fssaiDocumentName: 'fssai_cert_sharma_sweets.pdf',
    aadhaarMasked: 'XXXX-XXXX-4821',
    panNumber: 'ABCPS4821K',
    verifiedDocs: { FSSAI: true, AADHAAR: true, PAN: false, STORE_PHOTO: false },
    bankAccountHolder: 'Radheshyam Sharma',
    bankAccountNumber: '50100458291038',
    ifscCode: 'HDFC0001234',
    appliedAt: '2026-11-01T08:30:00Z',
    status: 'PENDING_REVIEW',
  },
  {
    id: 'app_002',
    applicantName: 'Manoj Patel',
    businessName: 'Kisan Krishi Seva Kendra',
    businessType: 'AGRI_KENDRA',
    phone: '+91 94250 88312',
    villageId: 'v-madhopur',
    villageName: 'Madhopur',
    vertical: 'AGRICULTURE',
    supportedVerticals: ['AGRICULTURE', 'HARDWARE'],
    agriLicenseNumber: 'UP-UNN-AGRI-2025-8841',
    aadhaarMasked: 'XXXX-XXXX-7740',
    panNumber: 'BDEPP7740M',
    verifiedDocs: { AGRI_LICENSE: false, AADHAAR: true, PAN: true, STORE_PHOTO: true },
    bankAccountHolder: 'Manoj Patel & Sons',
    bankAccountNumber: '3029182390192',
    ifscCode: 'SBIN0004567',
    appliedAt: '2026-11-01T10:15:00Z',
    status: 'PENDING_REVIEW',
  },
  {
    id: 'app_004',
    applicantName: 'Rakesh Vishwakarma',
    businessName: 'Vishwakarma Timber & Furniture House',
    businessType: 'FURNITURE_SHOP',
    phone: '+91 97123 66781',
    villageId: 'v-rampur',
    villageName: 'Rampur',
    vertical: 'FURNITURE',
    supportedVerticals: ['FURNITURE', 'HARDWARE'],
    gstOrTradeNumber: '09AAFCV4421E1Z4',
    aadhaarMasked: 'XXXX-XXXX-9102',
    panNumber: 'AAFCV4421E',
    verifiedDocs: { AADHAAR: true, PAN: false, STORE_PHOTO: true },
    bankAccountHolder: 'Rakesh Vishwakarma',
    bankAccountNumber: '2019485736201',
    ifscCode: 'BARB0RAMPUR',
    appliedAt: '2026-11-02T06:45:00Z',
    status: 'PENDING_REVIEW',
  },
  {
    id: 'app_003',
    applicantName: 'Sunita Devi',
    businessName: 'Annapurna Rasoi Dhabe',
    businessType: 'DHABA',
    phone: '+91 98261 44556',
    villageId: 'v-shivpur',
    villageName: 'Shivpur',
    vertical: 'FOOD',
    supportedVerticals: ['FOOD'],
    fssaiNumber: '12724002000123',
    fssaiDocumentName: 'fssai_cert_annapurna.pdf',
    aadhaarMasked: 'XXXX-XXXX-3319',
    panNumber: 'AFGPD3319R',
    verifiedDocs: { FSSAI: true, AADHAAR: true, PAN: true, STORE_PHOTO: true },
    bankAccountHolder: 'Sunita Devi',
    bankAccountNumber: '918273645019',
    ifscCode: 'PUNB0007890',
    appliedAt: '2026-10-30T14:20:00Z',
    status: 'APPROVED',
    reviewNotes: 'Verified FSSAI certificate and physically verified shop front at Shivpur Bus Stand.',
    reviewedBy: 'Vikram Singh',
    reviewedAt: '2026-10-31T11:00:00Z',
  },
];

const INITIAL_SELLERS: MasterSellerRecord[] = [
  {
    id: 'sel_01',
    name: 'Chaudhary Dhaba & Sweets',
    ownerName: 'Ramveer Chaudhary',
    businessType: 'DHABA',
    phone: '+91 98765 43210',
    email: 'ramveer.chaudhary@grambazaar.in',
    logoInitials: 'CD',
    logoBgClass: 'bg-amber-100 text-amber-800',
    shopAddress: 'Shop No. 12, Main Chauraha, Near Gram Panchayat Bhawan',
    villageId: 'v-rampur',
    villageName: 'Rampur',
    district: 'Unnao',
    state: 'Uttar Pradesh',
    pinCode: '209801',
    serviceableVillageIds: ['v-rampur', 'v-madhopur'],
    vertical: 'FOOD',
    supportedVerticals: ['FOOD'],
    fulfilmentModes: ['DELIVERY', 'PICKUP'],
    openingHours: '08:00 AM - 10:30 PM',
    status: 'ACTIVE',
    kycStatus: 'APPROVED',
    rating: 4.8,
    totalOrders: 342,
    gmvPaise: 4892000,
    commissionRateBps: 500,
    bankAccountHolder: 'Ramveer Chaudhary',
    bankAccountNumberMasked: 'XXXXXX2910',
    ifscCode: 'SBIN0004521',
    aliasIds: ['sel_1', 'seller_chaudhary_sweets'],
    fssaiVerified: true,
    joinedAt: '2026-09-15',
    kycDocuments: [
      {
        id: 'doc_sel01_fssai',
        code: 'FSSAI',
        label: 'FSSAI Registration Certificate',
        documentNumberMasked: '12723001XXXX82',
        fileName: 'chaudhary_dhaba_fssai_2026.pdf',
        uploadedAt: '2026-09-13T10:15:00Z',
        status: 'APPROVED',
        history: [
          { status: 'PENDING', actor: 'Ramveer Chaudhary', timestamp: '2026-09-13T10:15:00Z', note: 'Uploaded FSSAI Registration Certificate.' },
          { status: 'APPROVED', actor: 'Vikram Singh', timestamp: '2026-09-14T15:30:00Z', note: 'Verified active license on FoSCoS portal.' },
        ],
      },
      {
        id: 'doc_sel01_aadhaar',
        code: 'AADHAAR',
        label: 'Owner Aadhaar Card (Masked)',
        documentNumberMasked: 'XXXX-XXXX-4190',
        fileName: 'ramveer_aadhaar_masked.pdf',
        uploadedAt: '2026-09-13T10:16:00Z',
        status: 'APPROVED',
        history: [
          { status: 'PENDING', actor: 'Ramveer Chaudhary', timestamp: '2026-09-13T10:16:00Z', note: 'Submitted masked UIDAI copy.' },
          { status: 'APPROVED', actor: 'Vikram Singh', timestamp: '2026-09-14T15:32:00Z', note: 'Address and identity matched.' },
        ],
      },
      {
        id: 'doc_sel01_pan',
        code: 'PAN',
        label: 'Business / Proprietor PAN',
        documentNumberMasked: 'ABCPCXXXXK',
        fileName: 'ramveer_pan_card.jpg',
        uploadedAt: '2026-09-13T10:18:00Z',
        status: 'APPROVED',
        history: [
          { status: 'APPROVED', actor: 'Vikram Singh', timestamp: '2026-09-14T15:34:00Z', note: 'PAN verified with bank account holder name.' },
        ],
      },
      {
        id: 'doc_sel01_store',
        code: 'STORE_PHOTO',
        label: 'Storefront & Kitchen Photo',
        documentNumberMasked: 'RAMPUR-GEO-101',
        fileName: 'chaudhary_dhaba_facade.jpg',
        uploadedAt: '2026-09-13T10:20:00Z',
        status: 'APPROVED',
        history: [
          { status: 'APPROVED', actor: 'Ananya Verma', timestamp: '2026-09-14T16:10:00Z', note: 'Physical village audit passed.' },
        ],
      },
    ],
    activityHistory: [
      { id: 'act_01_1', type: 'REGISTRATION', title: 'Seller Registered', description: 'Chaudhary Dhaba & Sweets submitted onboarding form from Rampur.', actor: 'Ramveer Chaudhary', timestamp: '2026-09-13T10:00:00Z' },
      { id: 'act_01_2', type: 'KYC_SUBMITTED', title: 'KYC Dossier Uploaded', description: '4 required Food vertical documents submitted for compliance check.', actor: 'Ramveer Chaudhary', timestamp: '2026-09-13T10:20:00Z' },
      { id: 'act_01_3', type: 'KYC_APPROVED', title: 'KYC Approved', description: 'All FSSAI, PAN, Aadhaar, and storefront inspections cleared.', actor: 'Vikram Singh', timestamp: '2026-09-14T16:15:00Z' },
      { id: 'act_01_4', type: 'STORE_ACTIVATED', title: 'Storefront Activated', description: 'Store went live for Rampur & Madhopur delivery/pickup.', actor: 'Vikram Singh', timestamp: '2026-09-15T08:00:00Z' },
    ],
  },
  {
    id: 'sel_02',
    name: 'Gupta Kirana & General Store',
    ownerName: 'Mohan Gupta',
    businessType: 'KIRANA',
    phone: '+91 98765 43211',
    email: 'mohan.gupta.kirana@grambazaar.in',
    logoInitials: 'GK',
    logoBgClass: 'bg-emerald-100 text-emerald-800',
    shopAddress: 'Plot 4, Bazaar Road, Opposite Primary School',
    villageId: 'v-rampur',
    villageName: 'Rampur',
    district: 'Unnao',
    state: 'Uttar Pradesh',
    pinCode: '209801',
    serviceableVillageIds: ['v-rampur', 'v-madhopur', 'v-shivpur'],
    vertical: 'GROCERY',
    supportedVerticals: ['GROCERY'],
    fulfilmentModes: ['DELIVERY', 'PICKUP'],
    openingHours: '07:00 AM - 09:30 PM',
    status: 'ACTIVE',
    kycStatus: 'APPROVED',
    rating: 4.9,
    totalOrders: 512,
    gmvPaise: 9140000,
    commissionRateBps: 300,
    bankAccountHolder: 'Mohan Gupta Kirana Store',
    bankAccountNumberMasked: 'XXXXXX8834',
    ifscCode: 'HDFC0001234',
    aliasIds: ['sel_2', 'seller_gupta_kirana'],
    fssaiVerified: true,
    joinedAt: '2026-09-10',
    kycDocuments: [
      {
        id: 'doc_sel02_gst',
        code: 'GST_TRADE',
        label: 'GST / Shop Act Certificate',
        documentNumberMasked: '09AABPGXXXX1Z5',
        fileName: 'gupta_kirana_shop_act.pdf',
        uploadedAt: '2026-09-08T09:10:00Z',
        status: 'APPROVED',
        history: [
          { status: 'APPROVED', actor: 'Vikram Singh', timestamp: '2026-09-09T14:20:00Z', note: 'Shop registration certificate verified.' },
        ],
      },
      {
        id: 'doc_sel02_aadhaar',
        code: 'AADHAAR',
        label: 'Owner Aadhaar Card (Masked)',
        documentNumberMasked: 'XXXX-XXXX-8812',
        fileName: 'mohan_gupta_aadhaar.pdf',
        uploadedAt: '2026-09-08T09:12:00Z',
        status: 'APPROVED',
        history: [
          { status: 'APPROVED', actor: 'Vikram Singh', timestamp: '2026-09-09T14:22:00Z', note: 'Identity confirmed.' },
        ],
      },
      {
        id: 'doc_sel02_pan',
        code: 'PAN',
        label: 'Proprietor PAN Card',
        documentNumberMasked: 'AABPGXXXXM',
        fileName: 'mohan_gupta_pan.jpg',
        uploadedAt: '2026-09-08T09:14:00Z',
        status: 'APPROVED',
        history: [
          { status: 'APPROVED', actor: 'Vikram Singh', timestamp: '2026-09-09T14:24:00Z', note: 'PAN verified.' },
        ],
      },
      {
        id: 'doc_sel02_store',
        code: 'STORE_PHOTO',
        label: 'Storefront Photo',
        documentNumberMasked: 'RAMPUR-GEO-102',
        fileName: 'gupta_kirana_front.jpg',
        uploadedAt: '2026-09-08T09:16:00Z',
        status: 'APPROVED',
        history: [
          { status: 'APPROVED', actor: 'Ananya Verma', timestamp: '2026-09-09T17:00:00Z', note: 'Storefront signage verified.' },
        ],
      },
    ],
    activityHistory: [
      { id: 'act_02_1', type: 'REGISTRATION', title: 'Seller Registered', description: 'Gupta Kirana & General Store registered on GramBazaar.', actor: 'Mohan Gupta', timestamp: '2026-09-08T09:00:00Z' },
      { id: 'act_02_2', type: 'KYC_APPROVED', title: 'KYC Approved', description: 'Grocery & Kirana compliance checks completed.', actor: 'Vikram Singh', timestamp: '2026-09-09T17:05:00Z' },
      { id: 'act_02_3', type: 'STORE_ACTIVATED', title: 'Store Activated', description: 'Enabled across Rampur, Madhopur, and Shivpur.', actor: 'Vikram Singh', timestamp: '2026-09-10T07:00:00Z' },
    ],
  },
  {
    id: 'sel_03',
    name: 'Kisan Krishi Seva & Beej Bhandar',
    ownerName: 'Balram Yadav',
    businessType: 'AGRI_KENDRA',
    phone: '+91 98765 43212',
    email: 'balram.krishi@grambazaar.in',
    logoInitials: 'KK',
    logoBgClass: 'bg-lime-100 text-lime-800',
    shopAddress: 'Near Mandi Gate, Madhopur Road',
    villageId: 'v-madhopur',
    villageName: 'Madhopur',
    district: 'Unnao',
    state: 'Uttar Pradesh',
    pinCode: '209802',
    serviceableVillageIds: ['v-madhopur', 'v-rampur', 'v-kalyanpur'],
    vertical: 'AGRICULTURE',
    supportedVerticals: ['AGRICULTURE', 'HARDWARE'],
    fulfilmentModes: ['DELIVERY', 'PICKUP'],
    openingHours: '07:30 AM - 07:30 PM',
    status: 'ACTIVE',
    kycStatus: 'APPROVED',
    rating: 4.6,
    totalOrders: 184,
    gmvPaise: 3840000,
    commissionRateBps: 250,
    bankAccountHolder: 'Balram Yadav Agri Center',
    bankAccountNumberMasked: 'XXXXXX5542',
    ifscCode: 'BARB0MADHOP',
    aliasIds: ['sel_3', 'seller_kisan_dairy'],
    fssaiVerified: false,
    joinedAt: '2026-10-01',
    kycDocuments: [
      {
        id: 'doc_sel03_agri',
        code: 'AGRI_LICENSE',
        label: 'Agri Input Dealer License',
        documentNumberMasked: 'UP-UNN-AGRI-XXXX12',
        fileName: 'kisan_seva_agri_license.pdf',
        uploadedAt: '2026-09-28T11:20:00Z',
        status: 'APPROVED',
        history: [
          { status: 'APPROVED', actor: 'Vikram Singh', timestamp: '2026-09-30T10:00:00Z', note: 'District Agriculture Officer license valid till 2028.' },
        ],
      },
      {
        id: 'doc_sel03_aadhaar',
        code: 'AADHAAR',
        label: 'Owner Aadhaar Card (Masked)',
        documentNumberMasked: 'XXXX-XXXX-6601',
        fileName: 'balram_aadhaar_masked.pdf',
        uploadedAt: '2026-09-28T11:22:00Z',
        status: 'APPROVED',
        history: [
          { status: 'APPROVED', actor: 'Vikram Singh', timestamp: '2026-09-30T10:05:00Z', note: 'Verified.' },
        ],
      },
      {
        id: 'doc_sel03_pan',
        code: 'PAN',
        label: 'Proprietor PAN Card',
        documentNumberMasked: 'ABJPYXXXXQ',
        fileName: 'balram_pan.jpg',
        uploadedAt: '2026-09-28T11:24:00Z',
        status: 'APPROVED',
        history: [
          { status: 'APPROVED', actor: 'Vikram Singh', timestamp: '2026-09-30T10:06:00Z', note: 'Verified.' },
        ],
      },
    ],
    activityHistory: [
      { id: 'act_03_1', type: 'REGISTRATION', title: 'Seller Registered', description: 'Registered as Agriculture & Hardware multi-vertical store.', actor: 'Balram Yadav', timestamp: '2026-09-28T11:00:00Z' },
      { id: 'act_03_2', type: 'KYC_APPROVED', title: 'KYC Approved', description: 'Agri license & proprietor KYC verified.', actor: 'Vikram Singh', timestamp: '2026-09-30T10:15:00Z' },
      { id: 'act_03_3', type: 'STORE_ACTIVATED', title: 'Store Activated', description: 'Store live across 3 serviceable villages.', actor: 'Vikram Singh', timestamp: '2026-10-01T08:00:00Z' },
    ],
  },
  {
    id: 'sel_04',
    name: 'Shiv Shakti Mishthan Bhandar',
    ownerName: 'Dinesh Sharma',
    businessType: 'RESTAURANT',
    phone: '+91 98765 43213',
    email: 'dinesh.shivshakti@grambazaar.in',
    logoInitials: 'SS',
    logoBgClass: 'bg-orange-100 text-orange-800',
    shopAddress: 'Bus Stand Market, Shivpur Crossing',
    villageId: 'v-shivpur',
    villageName: 'Shivpur',
    district: 'Unnao',
    state: 'Uttar Pradesh',
    pinCode: '209804',
    serviceableVillageIds: ['v-shivpur', 'v-rampur'],
    vertical: 'FOOD',
    supportedVerticals: ['FOOD'],
    fulfilmentModes: ['DELIVERY', 'PICKUP'],
    openingHours: '08:00 AM - 09:30 PM',
    status: 'ACTIVE',
    kycStatus: 'APPROVED',
    rating: 4.7,
    totalOrders: 278,
    gmvPaise: 3560000,
    commissionRateBps: 500,
    bankAccountHolder: 'Dinesh Sharma',
    bankAccountNumberMasked: 'XXXXXX9044',
    ifscCode: 'PUNB0007890',
    aliasIds: ['sel_4', 'seller_sharma_dhaba'],
    fssaiVerified: true,
    joinedAt: '2026-10-05',
    kycDocuments: [
      {
        id: 'doc_sel04_fssai',
        code: 'FSSAI',
        label: 'FSSAI License',
        documentNumberMasked: '12724002XXXX45',
        fileName: 'shiv_shakti_fssai.pdf',
        uploadedAt: '2026-10-02T12:00:00Z',
        status: 'APPROVED',
        history: [
          { status: 'APPROVED', actor: 'Vikram Singh', timestamp: '2026-10-04T11:30:00Z', note: 'FSSAI certificate validated.' },
        ],
      },
      {
        id: 'doc_sel04_aadhaar',
        code: 'AADHAAR',
        label: 'Owner Aadhaar Card (Masked)',
        documentNumberMasked: 'XXXX-XXXX-2214',
        fileName: 'dinesh_aadhaar.pdf',
        uploadedAt: '2026-10-02T12:05:00Z',
        status: 'APPROVED',
        history: [
          { status: 'APPROVED', actor: 'Vikram Singh', timestamp: '2026-10-04T11:32:00Z', note: 'Identity verified.' },
        ],
      },
      {
        id: 'doc_sel04_pan',
        code: 'PAN',
        label: 'Proprietor PAN Card',
        documentNumberMasked: 'ADFDSXXXXP',
        fileName: 'dinesh_pan.jpg',
        uploadedAt: '2026-10-02T12:08:00Z',
        status: 'APPROVED',
        history: [
          { status: 'APPROVED', actor: 'Vikram Singh', timestamp: '2026-10-04T11:35:00Z', note: 'PAN verified.' },
        ],
      },
    ],
    activityHistory: [
      { id: 'act_04_1', type: 'REGISTRATION', title: 'Seller Registered', description: 'Shiv Shakti Mishthan Bhandar registered from Shivpur.', actor: 'Dinesh Sharma', timestamp: '2026-10-02T12:00:00Z' },
      { id: 'act_04_2', type: 'KYC_APPROVED', title: 'KYC Approved', description: 'FSSAI & identity documents cleared.', actor: 'Vikram Singh', timestamp: '2026-10-04T11:40:00Z' },
      { id: 'act_04_3', type: 'STORE_ACTIVATED', title: 'Store Activated', description: 'Active on Food vertical.', actor: 'Vikram Singh', timestamp: '2026-10-05T09:00:00Z' },
    ],
  },
  {
    id: 'sel_05',
    name: 'Verma Hardware & Electric',
    ownerName: 'Santosh Verma',
    businessType: 'MULTI_CATEGORY',
    phone: '+91 98765 43214',
    email: 'santosh.verma.hw@grambazaar.in',
    logoInitials: 'VH',
    logoBgClass: 'bg-sky-100 text-sky-800',
    shopAddress: 'Station Road, Near Water Tank, Kalyanpur',
    villageId: 'v-kalyanpur',
    villageName: 'Kalyanpur',
    district: 'Unnao',
    state: 'Uttar Pradesh',
    pinCode: '209805',
    serviceableVillageIds: ['v-kalyanpur', 'v-rampur'],
    vertical: 'HARDWARE',
    supportedVerticals: ['HARDWARE', 'ELECTRONICS'],
    fulfilmentModes: ['PICKUP', 'DELIVERY'],
    openingHours: '09:00 AM - 08:00 PM',
    status: 'INACTIVE',
    kycStatus: 'CHANGES_REQUESTED',
    kycChangeRequestNotes: 'GST trade license renewal scan is blurry. Please upload clear FY26-27 copy.',
    rating: 4.5,
    totalOrders: 65,
    gmvPaise: 1250000,
    commissionRateBps: 400,
    bankAccountHolder: 'Santosh Verma Enterprises',
    bankAccountNumberMasked: 'XXXXXX3176',
    ifscCode: 'SBIN0008812',
    aliasIds: ['sel_5'],
    fssaiVerified: false,
    joinedAt: '2026-10-18',
    kycDocuments: [
      {
        id: 'doc_sel05_gst',
        code: 'GST_TRADE',
        label: 'GST / Trade License',
        documentNumberMasked: '09CCVPVXXXX1Z9',
        fileName: 'verma_hardware_gst_scan.jpg',
        uploadedAt: '2026-10-16T14:20:00Z',
        status: 'CHANGES_REQUESTED',
        rejectionReason: 'Document edges cropped; GSTIN stamp is partially illegible.',
        history: [
          { status: 'PENDING', actor: 'Santosh Verma', timestamp: '2026-10-16T14:20:00Z', note: 'Uploaded mobile photo of GST registration.' },
          { status: 'CHANGES_REQUESTED', actor: 'Ananya Verma', timestamp: '2026-11-10T10:15:00Z', note: 'Requested clearer PDF scan of updated GST certificate.' },
        ],
      },
      {
        id: 'doc_sel05_aadhaar',
        code: 'AADHAAR',
        label: 'Owner Aadhaar Card (Masked)',
        documentNumberMasked: 'XXXX-XXXX-7410',
        fileName: 'santosh_verma_aadhaar.pdf',
        uploadedAt: '2026-10-16T14:22:00Z',
        status: 'APPROVED',
        history: [
          { status: 'APPROVED', actor: 'Ananya Verma', timestamp: '2026-10-17T12:00:00Z', note: 'Identity confirmed.' },
        ],
      },
      {
        id: 'doc_sel05_pan',
        code: 'PAN',
        label: 'Proprietor PAN Card',
        documentNumberMasked: 'CCVPVXXXXL',
        fileName: 'santosh_verma_pan.jpg',
        uploadedAt: '2026-10-16T14:25:00Z',
        status: 'PENDING',
        history: [
          { status: 'PENDING', actor: 'Santosh Verma', timestamp: '2026-10-16T14:25:00Z', note: 'Awaiting secondary verification.' },
        ],
      },
    ],
    activityHistory: [
      { id: 'act_05_1', type: 'REGISTRATION', title: 'Seller Registered', description: 'Verma Hardware & Electric onboarded from Kalyanpur.', actor: 'Santosh Verma', timestamp: '2026-10-16T14:00:00Z' },
      { id: 'act_05_2', type: 'KYC_CHANGES_REQUESTED', title: 'KYC Re-verification Requested', description: 'Clearer GST trade license scan requested during compliance audit.', actor: 'Ananya Verma', timestamp: '2026-11-10T10:15:00Z', reason: 'Blurry GST scan' },
      { id: 'act_05_3', type: 'STORE_DEACTIVATED', title: 'Store Marked Inactive', description: 'Temporarily paused pending updated trade license document.', actor: 'Ananya Verma', timestamp: '2026-11-10T10:20:00Z' },
    ],
  },
  {
    id: 'sel_06',
    name: 'Shree Ram Vastra Bhandar',
    ownerName: 'Harish Agarwal',
    businessType: 'CLOTHING_STORE',
    phone: '+91 98765 43219',
    email: 'harish.vastra@grambazaar.in',
    logoInitials: 'SR',
    logoBgClass: 'bg-purple-100 text-purple-800',
    shopAddress: 'Main Kapda Market, Rampur Bazaar',
    villageId: 'v-rampur',
    villageName: 'Rampur',
    district: 'Unnao',
    state: 'Uttar Pradesh',
    pinCode: '209801',
    serviceableVillageIds: ['v-rampur', 'v-madhopur'],
    vertical: 'APPAREL',
    supportedVerticals: ['APPAREL'],
    fulfilmentModes: ['DELIVERY', 'PICKUP'],
    openingHours: '10:00 AM - 08:30 PM',
    status: 'ACTIVE',
    kycStatus: 'APPROVED',
    rating: 4.7,
    totalOrders: 94,
    gmvPaise: 2480000,
    commissionRateBps: 450,
    bankAccountHolder: 'Shree Ram Vastra Bhandar',
    bankAccountNumberMasked: 'XXXXXX6198',
    ifscCode: 'ICIC0002410',
    aliasIds: [],
    fssaiVerified: false,
    joinedAt: '2026-10-20',
    kycDocuments: [
      {
        id: 'doc_sel06_gst',
        code: 'GST_TRADE',
        label: 'GST Registration Certificate',
        documentNumberMasked: '09AAHPAXXXX1Z2',
        fileName: 'shree_ram_vastra_gst.pdf',
        uploadedAt: '2026-10-18T11:00:00Z',
        status: 'APPROVED',
        history: [
          { status: 'APPROVED', actor: 'Vikram Singh', timestamp: '2026-10-19T16:10:00Z', note: 'Active GSTIN verified.' },
        ],
      },
      {
        id: 'doc_sel06_aadhaar',
        code: 'AADHAAR',
        label: 'Owner Aadhaar Card (Masked)',
        documentNumberMasked: 'XXXX-XXXX-1983',
        fileName: 'harish_aadhaar.pdf',
        uploadedAt: '2026-10-18T11:02:00Z',
        status: 'APPROVED',
        history: [
          { status: 'APPROVED', actor: 'Vikram Singh', timestamp: '2026-10-19T16:12:00Z', note: 'Verified.' },
        ],
      },
      {
        id: 'doc_sel06_pan',
        code: 'PAN',
        label: 'Business PAN Card',
        documentNumberMasked: 'AAHPAXXXXN',
        fileName: 'harish_pan.jpg',
        uploadedAt: '2026-10-18T11:04:00Z',
        status: 'APPROVED',
        history: [
          { status: 'APPROVED', actor: 'Vikram Singh', timestamp: '2026-10-19T16:14:00Z', note: 'Verified.' },
        ],
      },
    ],
    activityHistory: [
      { id: 'act_06_1', type: 'REGISTRATION', title: 'Seller Registered', description: 'Shree Ram Vastra Bhandar onboarded under Apparel vertical.', actor: 'Harish Agarwal', timestamp: '2026-10-18T11:00:00Z' },
      { id: 'act_06_2', type: 'KYC_APPROVED', title: 'KYC Approved', description: 'GST & PAN verified.', actor: 'Vikram Singh', timestamp: '2026-10-19T16:15:00Z' },
      { id: 'act_06_3', type: 'STORE_ACTIVATED', title: 'Store Activated', description: 'Activated for Rampur & Madhopur.', actor: 'Vikram Singh', timestamp: '2026-10-20T10:00:00Z' },
    ],
  },
  {
    id: 'sel_07',
    name: 'Chandpur Spice & Oil Mills',
    ownerName: 'Prakash Tiwari',
    businessType: 'KIRANA',
    phone: '+91 98765 44901',
    email: 'prakash.chandpurmills@grambazaar.in',
    logoInitials: 'CS',
    logoBgClass: 'bg-rose-100 text-rose-800',
    shopAddress: 'Mill Compound, Chandpur Link Road',
    villageId: 'v-chandpur',
    villageName: 'Chandpur',
    district: 'Unnao',
    state: 'Uttar Pradesh',
    pinCode: '209806',
    serviceableVillageIds: ['v-chandpur'],
    vertical: 'GROCERY',
    supportedVerticals: ['GROCERY'],
    fulfilmentModes: ['PICKUP'],
    openingHours: '08:00 AM - 07:00 PM',
    status: 'SUSPENDED',
    kycStatus: 'APPROVED',
    suspensionReason: '3 consecutive order cancellations and packaging quality complaints in Week 45.',
    rating: 3.6,
    totalOrders: 41,
    gmvPaise: 620000,
    commissionRateBps: 350,
    bankAccountHolder: 'Prakash Tiwari',
    bankAccountNumberMasked: 'XXXXXX1120',
    ifscCode: 'SBIN0004567',
    aliasIds: [],
    fssaiVerified: true,
    joinedAt: '2026-10-12',
    kycDocuments: [
      {
        id: 'doc_sel07_fssai',
        code: 'FSSAI',
        label: 'FSSAI Registration',
        documentNumberMasked: '12724009XXXX31',
        fileName: 'chandpur_mills_fssai.pdf',
        uploadedAt: '2026-10-10T09:00:00Z',
        status: 'APPROVED',
        history: [
          { status: 'APPROVED', actor: 'Vikram Singh', timestamp: '2026-10-11T15:00:00Z', note: 'Verified.' },
        ],
      },
      {
        id: 'doc_sel07_aadhaar',
        code: 'AADHAAR',
        label: 'Owner Aadhaar Card (Masked)',
        documentNumberMasked: 'XXXX-XXXX-5012',
        fileName: 'prakash_aadhaar.pdf',
        uploadedAt: '2026-10-10T09:05:00Z',
        status: 'APPROVED',
        history: [
          { status: 'APPROVED', actor: 'Vikram Singh', timestamp: '2026-10-11T15:02:00Z', note: 'Verified.' },
        ],
      },
    ],
    activityHistory: [
      { id: 'act_07_1', type: 'REGISTRATION', title: 'Seller Registered', description: 'Chandpur Spice & Oil Mills joined GramBazaar.', actor: 'Prakash Tiwari', timestamp: '2026-10-10T09:00:00Z' },
      { id: 'act_07_2', type: 'STORE_ACTIVATED', title: 'Store Activated', description: 'Enabled for Chandpur.', actor: 'Vikram Singh', timestamp: '2026-10-12T08:00:00Z' },
      { id: 'act_07_3', type: 'STORE_SUSPENDED', title: 'Store Suspended', description: 'Suspended following repeated cancellations & packaging defects.', actor: 'Vikram Singh', timestamp: '2026-11-16T14:30:00Z', reason: '3 consecutive cancellations and packaging complaints' },
    ],
  },
  {
    id: 'sel_08',
    name: 'Sharma Sweets & Dairy Hub',
    ownerName: 'Radheshyam Sharma',
    businessType: 'BAKERY',
    phone: '+91 98765 11223',
    email: 'radheshyam.sweets@grambazaar.in',
    logoInitials: 'SD',
    logoBgClass: 'bg-yellow-100 text-yellow-800',
    shopAddress: 'Near Hanuman Mandir, Rampur Main Road',
    villageId: 'v-rampur',
    villageName: 'Rampur',
    district: 'Unnao',
    state: 'Uttar Pradesh',
    pinCode: '209801',
    serviceableVillageIds: ['v-rampur'],
    vertical: 'FOOD',
    supportedVerticals: ['FOOD', 'GROCERY'],
    fulfilmentModes: ['DELIVERY', 'PICKUP'],
    openingHours: '07:00 AM - 09:30 PM',
    status: 'KYC_UNDER_REVIEW',
    kycStatus: 'UNDER_REVIEW',
    rating: 0,
    totalOrders: 0,
    gmvPaise: 0,
    commissionRateBps: 500,
    bankAccountHolder: 'Radheshyam Sharma',
    bankAccountNumberMasked: 'XXXXXX1038',
    ifscCode: 'HDFC0001234',
    aliasIds: [],
    fssaiVerified: false,
    joinedAt: '2026-11-18',
    kycDocuments: [
      {
        id: 'doc_sel08_fssai',
        code: 'FSSAI',
        label: 'FSSAI Registration Certificate',
        documentNumberMasked: '12723001XXXX82',
        fileName: 'fssai_cert_sharma_sweets.pdf',
        uploadedAt: '2026-11-18T08:35:00Z',
        status: 'APPROVED',
        history: [
          { status: 'PENDING', actor: 'Radheshyam Sharma', timestamp: '2026-11-18T08:35:00Z', note: 'Uploaded FSSAI PDF.' },
          { status: 'APPROVED', actor: 'Ananya Verma', timestamp: '2026-11-19T10:10:00Z', note: 'License number matches FoSCoS.' },
        ],
      },
      {
        id: 'doc_sel08_aadhaar',
        code: 'AADHAAR',
        label: 'Owner Aadhaar Card (Masked)',
        documentNumberMasked: 'XXXX-XXXX-4821',
        fileName: 'radheshyam_aadhaar.pdf',
        uploadedAt: '2026-11-18T08:36:00Z',
        status: 'APPROVED',
        history: [
          { status: 'APPROVED', actor: 'Ananya Verma', timestamp: '2026-11-19T10:12:00Z', note: 'Verified.' },
        ],
      },
      {
        id: 'doc_sel08_pan',
        code: 'PAN',
        label: 'Proprietor PAN Card',
        documentNumberMasked: 'ABCPSXXXXK',
        fileName: 'radheshyam_pan.jpg',
        uploadedAt: '2026-11-18T08:38:00Z',
        status: 'PENDING',
        history: [
          { status: 'PENDING', actor: 'Radheshyam Sharma', timestamp: '2026-11-18T08:38:00Z', note: 'Submitted for PAN name check.' },
        ],
      },
      {
        id: 'doc_sel08_store',
        code: 'STORE_PHOTO',
        label: 'Storefront Photo',
        documentNumberMasked: 'RAMPUR-GEO-NEW',
        fileName: 'sharma_sweets_exterior.jpg',
        uploadedAt: '2026-11-18T08:40:00Z',
        status: 'PENDING',
        history: [
          { status: 'PENDING', actor: 'Radheshyam Sharma', timestamp: '2026-11-18T08:40:00Z', note: 'Pending field photo confirmation.' },
        ],
      },
    ],
    activityHistory: [
      { id: 'act_08_1', type: 'REGISTRATION', title: 'Seller Registered', description: 'Sharma Sweets & Dairy Hub applied for Food & Grocery onboarding.', actor: 'Radheshyam Sharma', timestamp: '2026-11-18T08:30:00Z' },
      { id: 'act_08_2', type: 'KYC_SUBMITTED', title: 'KYC Documents Submitted', description: 'Uploaded 4 KYC documents; 2 verified, 2 awaiting final review.', actor: 'Radheshyam Sharma', timestamp: '2026-11-18T08:40:00Z' },
    ],
  },
  {
    id: 'sel_09',
    name: 'Bajrang Electronics & Repair',
    ownerName: 'Suresh Kashyap',
    businessType: 'ELECTRONICS_DEALER',
    phone: '+91 96321 77410',
    email: 'suresh.bajrangelec@grambazaar.in',
    logoInitials: 'BE',
    logoBgClass: 'bg-slate-200 text-slate-800',
    shopAddress: 'Block Road, Madhopur Chauraha',
    villageId: 'v-madhopur',
    villageName: 'Madhopur',
    district: 'Unnao',
    state: 'Uttar Pradesh',
    pinCode: '209802',
    serviceableVillageIds: ['v-madhopur'],
    vertical: 'ELECTRONICS',
    supportedVerticals: ['ELECTRONICS'],
    fulfilmentModes: ['PICKUP'],
    openingHours: '10:00 AM - 08:00 PM',
    status: 'REJECTED',
    kycStatus: 'REJECTED',
    rejectionReason: 'Submitted PAN belongs to a different individual and trade license is expired.',
    rating: 0,
    totalOrders: 0,
    gmvPaise: 0,
    commissionRateBps: 450,
    bankAccountHolder: 'Suresh Kashyap',
    bankAccountNumberMasked: 'XXXXXX4409',
    ifscCode: 'BARB0MADHOP',
    aliasIds: [],
    fssaiVerified: false,
    joinedAt: '2026-11-08',
    kycDocuments: [
      {
        id: 'doc_sel09_gst',
        code: 'GST_TRADE',
        label: 'GST / Trade License',
        documentNumberMasked: '09BJKPKXXXX1Z1',
        fileName: 'bajrang_trade_license_2023.pdf',
        uploadedAt: '2026-11-08T13:10:00Z',
        status: 'REJECTED',
        rejectionReason: 'Trade license expired in March 2025.',
        history: [
          { status: 'PENDING', actor: 'Suresh Kashyap', timestamp: '2026-11-08T13:10:00Z', note: 'Uploaded trade certificate.' },
          { status: 'REJECTED', actor: 'Vikram Singh', timestamp: '2026-11-09T11:20:00Z', note: 'Certificate expired; cannot approve.' },
        ],
      },
      {
        id: 'doc_sel09_pan',
        code: 'PAN',
        label: 'Proprietor PAN Card',
        documentNumberMasked: 'BJKPKXXXXT',
        fileName: 'pan_upload_09.jpg',
        uploadedAt: '2026-11-08T13:12:00Z',
        status: 'REJECTED',
        rejectionReason: 'PAN holder name does not match applicant or bank account.',
        history: [
          { status: 'REJECTED', actor: 'Vikram Singh', timestamp: '2026-11-09T11:22:00Z', note: 'Name mismatch on PAN.' },
        ],
      },
    ],
    activityHistory: [
      { id: 'act_09_1', type: 'REGISTRATION', title: 'Seller Registered', description: 'Bajrang Electronics submitted onboarding request.', actor: 'Suresh Kashyap', timestamp: '2026-11-08T13:00:00Z' },
      { id: 'act_09_2', type: 'KYC_REJECTED', title: 'Seller KYC Rejected', description: 'Application rejected due to PAN mismatch and expired trade license.', actor: 'Vikram Singh', timestamp: '2026-11-09T11:25:00Z', reason: 'PAN mismatch & expired license' },
    ],
  },
  {
    id: 'sel_10',
    name: 'Gramin Fresh Vegetables & Dairy',
    ownerName: 'Kamlesh Maurya',
    businessType: 'KIRANA',
    phone: '+91 97921 60543',
    email: 'kamlesh.graminfresh@grambazaar.in',
    logoInitials: 'GF',
    logoBgClass: 'bg-teal-100 text-teal-800',
    shopAddress: 'Subzi Mandi Corner, Shivpur',
    villageId: 'v-shivpur',
    villageName: 'Shivpur',
    district: 'Unnao',
    state: 'Uttar Pradesh',
    pinCode: '209804',
    serviceableVillageIds: ['v-shivpur'],
    vertical: 'GROCERY',
    supportedVerticals: ['GROCERY'],
    fulfilmentModes: ['DELIVERY', 'PICKUP'],
    openingHours: '06:00 AM - 08:30 PM',
    status: 'PENDING_APPROVAL',
    kycStatus: 'PENDING',
    rating: 0,
    totalOrders: 0,
    gmvPaise: 0,
    commissionRateBps: 300,
    bankAccountHolder: 'Kamlesh Maurya',
    bankAccountNumberMasked: 'XXXXXX7823',
    ifscCode: 'PUNB0007890',
    aliasIds: [],
    fssaiVerified: false,
    joinedAt: '2026-11-21',
    kycDocuments: [
      {
        id: 'doc_sel10_aadhaar',
        code: 'AADHAAR',
        label: 'Owner Aadhaar Card (Masked)',
        documentNumberMasked: 'XXXX-XXXX-9341',
        fileName: 'kamlesh_aadhaar_masked.pdf',
        uploadedAt: '2026-11-21T07:45:00Z',
        status: 'PENDING',
        history: [
          { status: 'PENDING', actor: 'Kamlesh Maurya', timestamp: '2026-11-21T07:45:00Z', note: 'Uploaded Aadhaar copy.' },
        ],
      },
      {
        id: 'doc_sel10_pan',
        code: 'PAN',
        label: 'Proprietor PAN Card',
        documentNumberMasked: 'DDAPMXXXXC',
        fileName: 'kamlesh_pan.jpg',
        uploadedAt: '2026-11-21T07:48:00Z',
        status: 'PENDING',
        history: [
          { status: 'PENDING', actor: 'Kamlesh Maurya', timestamp: '2026-11-21T07:48:00Z', note: 'Uploaded PAN copy.' },
        ],
      },
      {
        id: 'doc_sel10_store',
        code: 'STORE_PHOTO',
        label: 'Storefront Photo',
        documentNumberMasked: 'SHIVPUR-GEO-204',
        fileName: 'gramin_fresh_stall.jpg',
        uploadedAt: '2026-11-21T07:50:00Z',
        status: 'PENDING',
        history: [
          { status: 'PENDING', actor: 'Kamlesh Maurya', timestamp: '2026-11-21T07:50:00Z', note: 'Uploaded storefront photo.' },
        ],
      },
    ],
    activityHistory: [
      { id: 'act_10_1', type: 'REGISTRATION', title: 'Seller Registered', description: 'Gramin Fresh Vegetables & Dairy registered for Grocery onboarding.', actor: 'Kamlesh Maurya', timestamp: '2026-11-21T07:30:00Z' },
      { id: 'act_10_2', type: 'KYC_SUBMITTED', title: 'KYC Submitted', description: 'Uploaded 3 compliance documents awaiting initial Admin review.', actor: 'Kamlesh Maurya', timestamp: '2026-11-21T07:50:00Z' },
    ],
  },
];

const INITIAL_CATEGORIES: CategoryRecord[] = [
  { id: 'cat_food_thali', name: 'Thali & Meals', hindiName: 'थाली और भोजन', vertical: 'FOOD', icon: 'Utensils', itemCount: 18, isActive: true, sortOrder: 1, attributeIds: ['attr_diet_type', 'attr_spice_level'], allowedUnitIds: ['unit_plate', 'unit_half_plate'] },
  { id: 'cat_food_pizza', name: 'Pizza & Fast Food', hindiName: 'पिज़्ज़ा और फ़ास्ट फ़ूड', vertical: 'FOOD', parentId: 'cat_food_thali', icon: 'Utensils', itemCount: 12, isActive: true, sortOrder: 2, attributeIds: ['attr_diet_type'], allowedUnitIds: ['unit_piece'] },
  { id: 'cat_food_snacks', name: 'Snacks & Samosa', hindiName: 'नाश्ता और समोसा', vertical: 'FOOD', icon: 'Coffee', itemCount: 24, isActive: true, sortOrder: 3, attributeIds: ['attr_diet_type'], allowedUnitIds: ['unit_piece', 'unit_plate'] },
  { id: 'cat_food_sweets', name: 'Mithai & Desserts', hindiName: 'मिठाई और जलेबी', vertical: 'FOOD', icon: 'Cookie', itemCount: 16, isActive: true, sortOrder: 4, attributeIds: ['attr_diet_type'], allowedUnitIds: ['unit_kg', 'unit_gm', 'unit_pav'] },
  { id: 'cat_groc_atta', name: 'Flour & Grains (Atta)', hindiName: 'आटा और अनाज', vertical: 'GROCERY', icon: 'Wheat', itemCount: 32, isActive: true, sortOrder: 5, attributeIds: ['attr_pack_weight'], allowedUnitIds: ['unit_kg', 'unit_gm', 'unit_pav'] },
  { id: 'cat_groc_dal', name: 'Pulses & Dal', hindiName: 'दालें और दलहन', vertical: 'GROCERY', icon: 'Layers', itemCount: 28, isActive: true, sortOrder: 6, attributeIds: ['attr_pack_weight'], allowedUnitIds: ['unit_kg', 'unit_gm', 'unit_pav'] },
  { id: 'cat_groc_oil', name: 'Edible Oils & Ghee', hindiName: 'तेल और शुद्ध घी', vertical: 'GROCERY', icon: 'Droplets', itemCount: 20, isActive: true, sortOrder: 7, attributeIds: ['attr_pack_weight'], allowedUnitIds: ['unit_litre', 'unit_ml'] },
  { id: 'cat_agri_seeds', name: 'Seeds & Fertilizer', hindiName: 'बीज और खाद', vertical: 'AGRICULTURE', icon: 'Sprout', itemCount: 30, isActive: true, sortOrder: 8, attributeIds: ['attr_crop_season', 'attr_pack_weight'], allowedUnitIds: ['unit_bori', 'unit_kg'] },
  { id: 'cat_hard_plumbing', name: 'Pipes & Plumbing', hindiName: 'पाइप और फिटिंग्स', vertical: 'HARDWARE', icon: 'Wrench', itemCount: 22, isActive: true, sortOrder: 9, attributeIds: ['attr_material', 'attr_pipe_dia'], allowedUnitIds: ['unit_ft', 'unit_piece'] },
  { id: 'cat_elec_fans', name: 'Fans & Cooling', hindiName: 'पंखे और कूलर', vertical: 'ELECTRONICS', icon: 'Smartphone', itemCount: 14, isActive: true, sortOrder: 10, attributeIds: ['attr_wattage', 'attr_warranty', 'attr_color'], allowedUnitIds: ['unit_piece'] },
  { id: 'cat_apparel_ethnic', name: 'Kurtas & Ethnic Wear', hindiName: 'कुर्ता और पारंपरिक वस्त्र', vertical: 'APPAREL', icon: 'Shirt', itemCount: 26, isActive: true, sortOrder: 11, attributeIds: ['attr_size', 'attr_color', 'attr_fabric'], allowedUnitIds: ['unit_piece'] },
  { id: 'cat_furn_seating', name: 'Wooden Chairs & Cots', hindiName: 'लकड़ी की कुर्सी और चारपाई', vertical: 'FURNITURE', icon: 'Armchair', itemCount: 9, isActive: true, sortOrder: 12, attributeIds: ['attr_material', 'attr_dimensions', 'attr_color'], allowedUnitIds: ['unit_piece'] },
];

const INITIAL_ATTRIBUTES: AttributeMasterRecord[] = [
  { id: 'attr_diet_type', name: 'Dietary Type', hindiName: 'शाकाहारी / मांसाहारी', slug: 'diet_type', dataType: 'SELECT', options: ['Pure Veg', 'Egg', 'Non-Veg'], isRequired: true, isFilterable: true, isVariantAxis: false, verticals: ['FOOD'], isActive: true },
  { id: 'attr_spice_level', name: 'Spice Level', hindiName: 'तीखापन', slug: 'spice_level', dataType: 'SELECT', options: ['Mild', 'Medium', 'Spicy'], isRequired: false, isFilterable: true, isVariantAxis: false, verticals: ['FOOD'], isActive: true },
  { id: 'attr_pack_weight', name: 'Pack Weight', hindiName: 'पैकेट वजन', slug: 'pack_weight', dataType: 'SELECT', options: ['250 g (1 Pav)', '500 g', '1 kg', '5 kg', '10 kg', '40 kg Bori'], isRequired: true, isFilterable: true, isVariantAxis: true, verticals: ['GROCERY', 'AGRICULTURE'], isActive: true },
  { id: 'attr_size', name: 'Apparel Size', hindiName: 'साइज', slug: 'size', dataType: 'SELECT', options: ['S', 'M', 'L', 'XL', 'XXL'], isRequired: true, isFilterable: true, isVariantAxis: true, verticals: ['APPAREL'], isActive: true },
  { id: 'attr_color', name: 'Colour', hindiName: 'रंग', slug: 'color', dataType: 'SELECT', options: ['White', 'Cream', 'Blue', 'Brown', 'Black', 'Red', 'Natural Teak'], isRequired: false, isFilterable: true, isVariantAxis: true, verticals: ['APPAREL', 'ELECTRONICS', 'FURNITURE'], isActive: true },
  { id: 'attr_fabric', name: 'Fabric', hindiName: 'कपड़ा प्रकार', slug: 'fabric', dataType: 'SELECT', options: ['100% Cotton', 'Khadi', 'Silk Blend', 'Polyester'], isRequired: false, isFilterable: true, isVariantAxis: false, verticals: ['APPAREL'], isActive: true },
  { id: 'attr_material', name: 'Material / Grade', hindiName: 'सामग्री', slug: 'material', dataType: 'SELECT', options: ['UPVC', 'CPVC', 'Galvanized Iron', 'Sheesham Wood', 'Teak Wood', 'Mild Steel'], isRequired: true, isFilterable: true, isVariantAxis: false, verticals: ['HARDWARE', 'FURNITURE'], isActive: true },
  { id: 'attr_pipe_dia', name: 'Pipe Diameter', hindiName: 'पाइप व्यास', slug: 'pipe_diameter', dataType: 'SELECT', options: ['0.5 inch', '0.75 inch', '1 inch', '2 inch', '4 inch'], unitSuffix: 'inch', isRequired: false, isFilterable: true, isVariantAxis: true, verticals: ['HARDWARE'], isActive: true },
  { id: 'attr_wattage', name: 'Power Rating', hindiName: 'वाट क्षमता', slug: 'wattage', dataType: 'NUMBER', unitSuffix: 'W', isRequired: true, isFilterable: true, isVariantAxis: false, verticals: ['ELECTRONICS', 'HARDWARE'], isActive: true },
  { id: 'attr_warranty', name: 'Warranty Period', hindiName: 'वारंटी अवधि', slug: 'warranty', dataType: 'SELECT', options: ['No Warranty', '6 Months', '1 Year', '2 Years', '5 Years'], isRequired: false, isFilterable: true, isVariantAxis: false, verticals: ['ELECTRONICS', 'HARDWARE', 'FURNITURE'], isActive: true },
  { id: 'attr_dimensions', name: 'Dimensions (L×W×H)', hindiName: 'आकार (लं×चौ×ऊं)', slug: 'dimensions', dataType: 'DIMENSIONS', unitSuffix: 'inches', isRequired: true, isFilterable: false, isVariantAxis: false, verticals: ['FURNITURE'], isActive: true },
  { id: 'attr_crop_season', name: 'Crop Season', hindiName: 'फसल मौसम', slug: 'crop_season', dataType: 'SELECT', options: ['Rabi (Winter)', 'Kharif (Monsoon)', 'Zaid (Summer)', 'All Season'], isRequired: false, isFilterable: true, isVariantAxis: false, verticals: ['AGRICULTURE'], isActive: true },
];

const INITIAL_UNITS: UnitMasterRecord[] = [
  { id: 'unit_kg', name: 'Kilogram', hindiName: 'किलोग्राम', symbol: 'kg', family: 'WEIGHT', baseUnit: 'g', conversionFactor: 1000, allowDecimal: true, allowSellerLocalOverride: false, verticals: ['GROCERY', 'AGRICULTURE', 'FOOD'], isActive: true },
  { id: 'unit_gm', name: 'Gram', hindiName: 'ग्राम', symbol: 'g', family: 'WEIGHT', baseUnit: 'g', conversionFactor: 1, allowDecimal: false, allowSellerLocalOverride: false, verticals: ['GROCERY', 'FOOD'], isActive: true },
  { id: 'unit_pav', name: 'Pav (Local Village Weight)', hindiName: 'पाव (250 ग्राम)', symbol: 'pav', family: 'WEIGHT', baseUnit: 'g', conversionFactor: 250, allowDecimal: false, allowSellerLocalOverride: true, verticals: ['GROCERY', 'FOOD'], isActive: true },
  { id: 'unit_litre', name: 'Litre', hindiName: 'लीटर', symbol: 'L', family: 'VOLUME', baseUnit: 'ml', conversionFactor: 1000, allowDecimal: true, allowSellerLocalOverride: false, verticals: ['GROCERY', 'AGRICULTURE'], isActive: true },
  { id: 'unit_ml', name: 'Millilitre', hindiName: 'मिलीलीटर', symbol: 'ml', family: 'VOLUME', baseUnit: 'ml', conversionFactor: 1, allowDecimal: false, allowSellerLocalOverride: false, verticals: ['GROCERY', 'FOOD'], isActive: true },
  { id: 'unit_plate', name: 'Full Plate / Thali', hindiName: 'फुल प्लेट / थाली', symbol: 'plate', family: 'PORTION', allowDecimal: false, allowSellerLocalOverride: true, verticals: ['FOOD'], isActive: true },
  { id: 'unit_half_plate', name: 'Half Plate', hindiName: 'हाफ प्लेट', symbol: 'half', family: 'PORTION', allowDecimal: false, allowSellerLocalOverride: true, verticals: ['FOOD'], isActive: true },
  { id: 'unit_piece', name: 'Piece / Unit', hindiName: 'पीस / नग', symbol: 'pcs', family: 'COUNT', allowDecimal: false, allowSellerLocalOverride: false, verticals: ['ALL'], isActive: true },
  { id: 'unit_ft', name: 'Foot (Length)', hindiName: 'फुट', symbol: 'ft', family: 'LENGTH', baseUnit: 'ft', conversionFactor: 1, allowDecimal: true, allowSellerLocalOverride: false, verticals: ['HARDWARE', 'FURNITURE'], isActive: true },
  { id: 'unit_bori', name: 'Bori / Sack (40 kg)', hindiName: 'बोरी (40 किलो)', symbol: 'bori', family: 'BULK_PACK', baseUnit: 'kg', conversionFactor: 40, allowDecimal: false, allowSellerLocalOverride: true, verticals: ['AGRICULTURE', 'GROCERY'], isActive: true },
];

const INITIAL_OPTION_GROUPS: OptionGroupMasterRecord[] = [
  {
    id: 'opt_pizza_size',
    name: 'Pizza Size',
    hindiName: 'पिज़्ज़ा साइज',
    verticals: ['FOOD'],
    selectionType: 'SINGLE',
    isRequired: true,
    minSelect: 1,
    maxSelect: 1,
    isActive: true,
    options: [
      { id: 'o_ps_1', label: 'Regular (7 inch)', priceDeltaPaise: 0, isDefault: true, isAvailable: true },
      { id: 'o_ps_2', label: 'Medium (10 inch)', priceDeltaPaise: 9000, isDefault: false, isAvailable: true },
      { id: 'o_ps_3', label: 'Large (12 inch)', priceDeltaPaise: 17000, isDefault: false, isAvailable: true },
    ],
  },
  {
    id: 'opt_pizza_crust',
    name: 'Pizza Crust',
    hindiName: 'पिज़्ज़ा बेस / क्रस्ट',
    verticals: ['FOOD'],
    selectionType: 'SINGLE',
    isRequired: true,
    minSelect: 1,
    maxSelect: 1,
    isActive: true,
    options: [
      { id: 'o_pc_1', label: 'Classic Hand Tossed', priceDeltaPaise: 0, isDefault: true, isAvailable: true },
      { id: 'o_pc_2', label: 'Cheese Burst', priceDeltaPaise: 6500, isDefault: false, isAvailable: true },
      { id: 'o_pc_3', label: 'Thin Wheat Crust', priceDeltaPaise: 3000, isDefault: false, isAvailable: true },
    ],
  },
  {
    id: 'opt_pizza_toppings',
    name: 'Extra Toppings & Add-ons',
    hindiName: 'एक्स्ट्रा टॉपिंग्स',
    verticals: ['FOOD'],
    selectionType: 'MULTIPLE',
    isRequired: false,
    minSelect: 0,
    maxSelect: 4,
    isActive: true,
    options: [
      { id: 'o_pt_1', label: 'Extra Mozzarella Cheese', priceDeltaPaise: 4000, isDefault: false, isAvailable: true },
      { id: 'o_pt_2', label: 'Roasted Paneer Cubes', priceDeltaPaise: 4500, isDefault: false, isAvailable: true },
      { id: 'o_pt_3', label: 'Sweet Corn & Jalapeno', priceDeltaPaise: 3000, isDefault: false, isAvailable: true },
      { id: 'o_pt_4', label: 'Butter Garlic Dip', priceDeltaPaise: 2500, isDefault: false, isAvailable: true },
    ],
  },
  {
    id: 'opt_thali_addons',
    name: 'Thali Extra Add-ons',
    hindiName: 'थाली अतिरिक्त विकल्प',
    verticals: ['FOOD'],
    selectionType: 'MULTIPLE',
    isRequired: false,
    minSelect: 0,
    maxSelect: 3,
    isActive: true,
    options: [
      { id: 'o_ta_1', label: 'Extra Butter Tandoori Roti (2 pcs)', priceDeltaPaise: 3000, isDefault: false, isAvailable: true },
      { id: 'o_ta_2', label: 'Sweet Lassi (Kulhad)', priceDeltaPaise: 4000, isDefault: false, isAvailable: true },
      { id: 'o_ta_3', label: 'Gulab Jamun (1 pc)', priceDeltaPaise: 2000, isDefault: false, isAvailable: true },
    ],
  },
  {
    id: 'opt_elec_install',
    name: 'Installation & Accessories',
    hindiName: 'इंस्टॉलेशन और फिटिंग',
    verticals: ['ELECTRONICS', 'HARDWARE'],
    selectionType: 'MULTIPLE',
    isRequired: false,
    minSelect: 0,
    maxSelect: 2,
    isActive: true,
    options: [
      { id: 'o_ei_1', label: 'Home Fitting by Technician', priceDeltaPaise: 15000, isDefault: false, isAvailable: true },
      { id: 'o_ei_2', label: 'Heavy Duty Regulator', priceDeltaPaise: 12000, isDefault: false, isAvailable: true },
    ],
  },
];

const INITIAL_BRANDS: BrandMasterRecord[] = [
  { id: 'brand_aashirvaad', code: 'BRD-AASH', name: 'Aashirvaad', manufacturer: 'ITC Foods Ltd.', verticals: ['GROCERY'], isVerified: true, description: 'Packaged whole wheat chakki atta, iodized salt, and authentic spices.', productCount: 14, isActive: true },
  { id: 'brand_fortune', code: 'BRD-FORT', name: 'Fortune', manufacturer: 'Adani Wilmar Ltd.', verticals: ['GROCERY'], isVerified: true, description: 'Edible mustard/refined oils, besan, basmati rice, and soya chunks.', productCount: 9, isActive: true },
  { id: 'brand_amul', code: 'BRD-AMUL', name: 'Amul', manufacturer: 'GCMMF Anand', verticals: ['GROCERY', 'FOOD'], isVerified: true, description: 'Fresh dairy milk, butter, paneer, ghee, and village cold-chain ice creams.', productCount: 16, isActive: true },
  { id: 'brand_tata', code: 'BRD-TATA', name: 'Tata Sampann', manufacturer: 'Tata Consumer Products', verticals: ['GROCERY'], isVerified: true, description: 'Unpolished dals, whole spices, poha, and premium tea blends.', productCount: 12, isActive: true },
  { id: 'brand_astral', code: 'BRD-ASTR', name: 'Astral Pipes', manufacturer: 'Astral Ltd.', verticals: ['HARDWARE'], isVerified: true, description: 'CPVC & UPVC plumbing and agricultural pipes.', productCount: 11, isActive: true },
  { id: 'brand_crompton', code: 'BRD-CROM', name: 'Crompton', manufacturer: 'Crompton Greaves', verticals: ['ELECTRONICS', 'HARDWARE'], isVerified: true, description: 'Ceiling fans, LED lights, and domestic water pumps.', productCount: 8, isActive: true },
  { id: 'brand_mahyco', code: 'BRD-MAHY', name: 'Mahyco Seeds', manufacturer: 'Maharashtra Hybrid Seeds', verticals: ['AGRICULTURE'], isVerified: true, description: 'Certified hybrid wheat, paddy, and vegetable seeds.', productCount: 6, isActive: true },
  { id: 'brand_gram_local', code: 'BRD-GRML', name: 'GramBazaar Local Kitchens & Crafts', manufacturer: 'Village Verified Merchants', verticals: ['FOOD', 'GROCERY', 'APPAREL', 'FURNITURE'], isVerified: true, description: 'Verified local village kitchens, mithai halwais, millers, and handloom artisans.', productCount: 21, isActive: true },
];

const INITIAL_VARIANT_MASTERS: VariantSizeMasterRecord[] = [
  {
    id: 'var_atta_1kg',
    sku: 'GB-GROC-ATTA-1KG',
    name: 'Aashirvaad Shudh Chakki Atta — 1 Kg',
    sizeLabel: '1 kg Pack',
    vertical: 'GROCERY',
    categoryId: 'cat_groc_atta',
    productId: 'prod_002',
    unitId: 'unit_kg',
    unitQuantity: 1,
    mrpPaise: 5800,
    sellingPricePaise: 5200,
    stockQuantity: 24,
    lowStockThreshold: 8,
    attributes: { pack_weight: '1 kg' },
    isActive: true,
  },
  {
    id: 'var_atta_5kg',
    sku: 'GB-GROC-ATTA-5KG',
    name: 'Aashirvaad Shudh Chakki Atta — 5 Kg Family Pack',
    sizeLabel: '5 kg Pack',
    vertical: 'GROCERY',
    categoryId: 'cat_groc_atta',
    productId: 'prod_002',
    unitId: 'unit_kg',
    unitQuantity: 5,
    mrpPaise: 26000,
    sellingPricePaise: 23500,
    stockQuantity: 12,
    lowStockThreshold: 5,
    attributes: { pack_weight: '5 kg' },
    isActive: true,
  },
  {
    id: 'var_atta_10kg',
    sku: 'GB-GROC-ATTA-10KG',
    name: 'Aashirvaad Shudh Chakki Atta — 10 Kg Saver',
    sizeLabel: '10 kg Pack',
    vertical: 'GROCERY',
    categoryId: 'cat_groc_atta',
    productId: 'prod_002',
    unitId: 'unit_kg',
    unitQuantity: 10,
    mrpPaise: 49500,
    sellingPricePaise: 45500,
    stockQuantity: 6,
    lowStockThreshold: 5,
    attributes: { pack_weight: '10 kg' },
    isActive: true,
  },
  {
    id: 'var_dal_pav',
    sku: 'GB-GROC-DAL-250G',
    name: 'Arhar / Toor Dal — 1 Pav (Loose Local Weight)',
    sizeLabel: '1 Pav (250 g)',
    vertical: 'GROCERY',
    categoryId: 'cat_groc_dal',
    unitId: 'unit_pav',
    unitQuantity: 1,
    mrpPaise: 4800,
    sellingPricePaise: 4400,
    stockQuantity: 45,
    lowStockThreshold: 10,
    attributes: { pack_weight: '250 g (1 Pav)' },
    isActive: true,
  },
  {
    id: 'var_oil_1l',
    sku: 'GB-GROC-OIL-1L',
    name: 'Fortune Kachi Ghani Mustard Oil — 1 Litre Pouch',
    sizeLabel: '1 L Pouch',
    vertical: 'GROCERY',
    categoryId: 'cat_groc_oil',
    unitId: 'unit_litre',
    unitQuantity: 1,
    mrpPaise: 17500,
    sellingPricePaise: 15800,
    stockQuantity: 18,
    lowStockThreshold: 6,
    attributes: { pack_weight: '1 L' },
    isActive: true,
  },
  {
    id: 'var_thali_full',
    sku: 'GB-FOOD-THALI-FULL',
    name: 'Special Shahi Veg Thali — Full Plate',
    sizeLabel: 'Full Plate',
    vertical: 'FOOD',
    categoryId: 'cat_food_thali',
    unitId: 'unit_plate',
    unitQuantity: 1,
    mrpPaise: 18000,
    sellingPricePaise: 16000,
    stockQuantity: 40,
    lowStockThreshold: 10,
    attributes: { diet_type: 'Pure Veg', spice_level: 'Medium' },
    isActive: true,
  },
  {
    id: 'var_thali_half',
    sku: 'GB-FOOD-THALI-HALF',
    name: 'Dal Tadka & Paneer Combo — Half Plate',
    sizeLabel: 'Half Plate',
    vertical: 'FOOD',
    categoryId: 'cat_food_thali',
    unitId: 'unit_half_plate',
    unitQuantity: 1,
    mrpPaise: 11000,
    sellingPricePaise: 9500,
    stockQuantity: 35,
    lowStockThreshold: 8,
    attributes: { diet_type: 'Pure Veg' },
    isActive: true,
  },
  {
    id: 'var_pizza_med',
    sku: 'GB-FOOD-PIZ-MED10',
    name: 'Farmhouse Paneer Tandoori Pizza — Medium 10"',
    sizeLabel: 'Medium (10 inch)',
    vertical: 'FOOD',
    categoryId: 'cat_food_pizza',
    productId: 'prod_001',
    unitId: 'unit_piece',
    unitQuantity: 1,
    mrpPaise: 32900,
    sellingPricePaise: 28900,
    stockQuantity: 25,
    lowStockThreshold: 5,
    attributes: { diet_type: 'Pure Veg', spice_level: 'Medium' },
    isActive: true,
  },
  {
    id: 'var_jalebi_pav',
    sku: 'GB-FOOD-JAL-250G',
    name: 'Desi Ghee Crispy Jalebi — 1 Pav Box',
    sizeLabel: '250 g (1 Pav)',
    vertical: 'FOOD',
    categoryId: 'cat_food_sweets',
    unitId: 'unit_pav',
    unitQuantity: 1,
    mrpPaise: 8500,
    sellingPricePaise: 7500,
    stockQuantity: 30,
    lowStockThreshold: 6,
    attributes: { diet_type: 'Pure Veg' },
    isActive: true,
  },
];

const INITIAL_PACKAGING_MASTERS: PackagingMasterRecord[] = [
  {
    id: 'pkg_thali_5cp',
    code: 'PKG-FD-THL5',
    name: '5-Compartment Leak-Proof Thali Box',
    hindiName: '5-खाने वाला लीक-प्रूफ थाली बॉक्स',
    materialType: 'FOOD_CONTAINER',
    capacityLabel: '1 Full Meal (750 ml)',
    unitId: 'unit_plate',
    feePaise: 1500,
    isFoodGrade: true,
    isEcoFriendly: true,
    isLeakProof: true,
    verticals: ['FOOD'],
    categoryIds: ['cat_food_thali'],
    productIds: [],
    isActive: true,
  },
  {
    id: 'pkg_pizza_10in',
    code: 'PKG-FD-PIZ10',
    name: 'Corrugated Thermal Pizza Box (10–12 inch)',
    hindiName: 'थर्मल पिज़्ज़ा बॉक्स',
    materialType: 'THERMAL_BOX',
    capacityLabel: 'Up to 12 inch Pizza',
    unitId: 'unit_piece',
    feePaise: 2000,
    isFoodGrade: true,
    isEcoFriendly: true,
    isLeakProof: false,
    verticals: ['FOOD'],
    categoryIds: ['cat_food_pizza'],
    productIds: ['prod_001'],
    isActive: true,
  },
  {
    id: 'pkg_curry_500ml',
    code: 'PKG-FD-CUR5',
    name: 'Microwave-Safe Gravy & Dal Container (500 ml)',
    hindiName: 'दाल-सब्जी कंटेनर (500 मिली)',
    materialType: 'FOOD_CONTAINER',
    capacityLabel: '500 ml',
    unitId: 'unit_ml',
    feePaise: 1000,
    isFoodGrade: true,
    isEcoFriendly: false,
    isLeakProof: true,
    verticals: ['FOOD'],
    categoryIds: ['cat_food_thali', 'cat_food_snacks'],
    productIds: [],
    isActive: true,
  },
  {
    id: 'pkg_sweet_box',
    code: 'PKG-FD-MTH1',
    name: 'Grease-Resistant Mithai & Jalebi Box (500g / 1kg)',
    hindiName: 'मिठाई पैकिंग डिब्बा',
    materialType: 'FOOD_CONTAINER',
    capacityLabel: '250 g – 1 kg',
    unitId: 'unit_kg',
    feePaise: 1200,
    isFoodGrade: true,
    isEcoFriendly: true,
    isLeakProof: true,
    verticals: ['FOOD'],
    categoryIds: ['cat_food_sweets'],
    productIds: [],
    isActive: true,
  },
  {
    id: 'pkg_groc_kraft',
    code: 'PKG-GR-KRF5',
    name: 'Heavy-Duty Eco Kraft Kirana Carry Bag',
    hindiName: 'इको पेपर किराना बैग (5 किलो तक)',
    materialType: 'ECO_BAG',
    capacityLabel: 'Up to 5 kg load',
    unitId: 'unit_kg',
    feePaise: 500,
    isFoodGrade: true,
    isEcoFriendly: true,
    isLeakProof: false,
    verticals: ['GROCERY'],
    categoryIds: ['cat_groc_atta', 'cat_groc_dal'],
    productIds: ['prod_002'],
    isActive: true,
  },
  {
    id: 'pkg_groc_zip',
    code: 'PKG-GR-ZIP1',
    name: 'Tamper-Sealed Loose Grain & Dal Zip Pouch',
    hindiName: 'सीलबंद अनाज/दाल पाउच',
    materialType: 'SEALED_POUCH',
    capacityLabel: '250 g – 2 kg',
    unitId: 'unit_pav',
    feePaise: 400,
    isFoodGrade: true,
    isEcoFriendly: false,
    isLeakProof: true,
    verticals: ['GROCERY'],
    categoryIds: ['cat_groc_dal', 'cat_groc_oil'],
    productIds: [],
    isActive: true,
  },
];

const INITIAL_AVAILABILITY_CONFIGS: AvailabilityStockConfigRecord[] = [
  {
    id: 'avail_food_lunch_dinner',
    code: 'AVL-FD-THALI',
    name: 'Dhaba Fresh Meals — Lunch & Dinner Prep Slots',
    vertical: 'FOOD',
    categoryId: 'cat_food_thali',
    workflowMode: 'DAILY_PREP_SLOTS',
    serviceSlots: ['Lunch (11:30 - 15:30)', 'Dinner (19:00 - 22:30)'],
    prepTimeMinutes: 25,
    dailyBatchLimit: 80,
    lowStockThreshold: 10,
    maxQtyPerOrder: 6,
    autoDisableOnZeroStock: true,
    allowPreOrder: true,
    isActive: true,
  },
  {
    id: 'avail_food_pizza',
    code: 'AVL-FD-PIZ',
    name: 'Stone-Baked Pizza — Made to Order Kitchen SLA',
    vertical: 'FOOD',
    categoryId: 'cat_food_pizza',
    productId: 'prod_001',
    workflowMode: 'MADE_TO_ORDER',
    serviceSlots: ['All-Day Kitchen (11:00 - 22:00)'],
    prepTimeMinutes: 20,
    dailyBatchLimit: 50,
    lowStockThreshold: 5,
    maxQtyPerOrder: 5,
    autoDisableOnZeroStock: false,
    allowPreOrder: false,
    isActive: true,
  },
  {
    id: 'avail_food_snacks',
    code: 'AVL-FD-SNK',
    name: 'Morning & Evening Hot Snacks / Samosa Batches',
    vertical: 'FOOD',
    categoryId: 'cat_food_snacks',
    workflowMode: 'DAILY_PREP_SLOTS',
    serviceSlots: ['Morning Nashta (07:00 - 11:00)', 'Evening Chai (16:00 - 20:00)'],
    prepTimeMinutes: 12,
    dailyBatchLimit: 120,
    lowStockThreshold: 15,
    maxQtyPerOrder: 12,
    autoDisableOnZeroStock: true,
    allowPreOrder: false,
    isActive: true,
  },
  {
    id: 'avail_groc_staples',
    code: 'AVL-GR-ATTA',
    name: 'Kirana Packaged Atta & Staples — Real-Time Stock',
    vertical: 'GROCERY',
    categoryId: 'cat_groc_atta',
    productId: 'prod_002',
    workflowMode: 'TRACKED_INVENTORY',
    serviceSlots: ['Store Hours (06:30 - 21:30)'],
    lowStockThreshold: 10,
    maxQtyPerOrder: 10,
    autoDisableOnZeroStock: true,
    allowPreOrder: false,
    restockLeadHours: 24,
    isActive: true,
  },
  {
    id: 'avail_groc_loose_dal',
    code: 'AVL-GR-DAL',
    name: 'Loose Pulses & Grains — Weight-Tracked Inventory',
    vertical: 'GROCERY',
    categoryId: 'cat_groc_dal',
    workflowMode: 'TRACKED_INVENTORY',
    serviceSlots: ['Store Hours (06:30 - 21:30)'],
    lowStockThreshold: 8,
    maxQtyPerOrder: 15,
    autoDisableOnZeroStock: true,
    allowPreOrder: false,
    restockLeadHours: 12,
    isActive: true,
  },
  {
    id: 'avail_groc_oils',
    code: 'AVL-GR-OIL',
    name: 'Edible Oils & Ghee — Low-Stock Auto-Alert Rule',
    vertical: 'GROCERY',
    categoryId: 'cat_groc_oil',
    workflowMode: 'TRACKED_INVENTORY',
    serviceSlots: ['Store Hours (07:00 - 21:00)'],
    lowStockThreshold: 6,
    maxQtyPerOrder: 6,
    autoDisableOnZeroStock: true,
    allowPreOrder: false,
    restockLeadHours: 24,
    isActive: true,
  },
];

const INITIAL_PRODUCTS: UniversalProductRecord[] = [
  {
    id: 'prod_001',
    sku: 'GB-FOOD-PIZ-01',
    name: 'Farmhouse Paneer Tandoori Pizza',
    hindiName: 'फार्महाउस पनीर तंदूरी पिज़्ज़ा',
    description: 'Stone-baked crust topped with spiced cottage cheese, capsicum, onion, and local mozzarella.',
    vertical: 'FOOD',
    categoryId: 'cat_food_pizza',
    brandId: 'brand_gram_local',
    sellerId: 'sel_01',
    sellerName: 'Chaudhary Dhaba & Sweets',
    unitId: 'unit_piece',
    inventoryMode: 'PREPARED_FOOD',
    mrpPaise: 24900,
    pricePaise: 19900,
    prepTimeMinutes: 20,
    dietType: 'VEG',
    attributes: { diet_type: 'Pure Veg', spice_level: 'Medium' },
    variants: [],
    optionGroupIds: ['opt_pizza_size', 'opt_pizza_crust', 'opt_pizza_toppings'],
    moderationStatus: 'APPROVED',
    isActive: true,
    isAvailable: true,
    createdAt: '2026-10-20T10:00:00Z',
    updatedAt: '2026-11-01T08:00:00Z',
  },
  {
    id: 'prod_002',
    sku: 'GB-GROC-ATTA-01',
    name: 'Aashirvaad Shudh Chakki Atta',
    hindiName: 'आशीर्वाद शुद्ध चक्की आटा',
    description: 'Whole wheat chakki atta available in 1 kg, 5 kg, and 10 kg packs.',
    vertical: 'GROCERY',
    categoryId: 'cat_groc_atta',
    brandId: 'brand_aashirvaad',
    sellerId: 'sel_02',
    sellerName: 'Gupta Kirana & General Store',
    unitId: 'unit_kg',
    inventoryMode: 'VARIANT_STOCK',
    mrpPaise: 26000,
    pricePaise: 23500,
    stockQuantity: 42,
    lowStockThreshold: 10,
    attributes: { pack_weight: '5 kg' },
    variants: [
      { id: 'v_atta_1', sku: 'GB-GROC-ATTA-1KG', label: '1 kg Pack', attributes: { pack_weight: '1 kg' }, mrpPaise: 5800, pricePaise: 5200, stockQuantity: 24, isAvailable: true },
      { id: 'v_atta_5', sku: 'GB-GROC-ATTA-5KG', label: '5 kg Pack', attributes: { pack_weight: '5 kg' }, mrpPaise: 26000, pricePaise: 23500, stockQuantity: 12, isAvailable: true },
      { id: 'v_atta_10', sku: 'GB-GROC-ATTA-10KG', label: '10 kg Pack', attributes: { pack_weight: '10 kg' }, mrpPaise: 49500, pricePaise: 45500, stockQuantity: 6, isAvailable: true },
    ],
    optionGroupIds: [],
    moderationStatus: 'APPROVED',
    isActive: true,
    isAvailable: true,
    createdAt: '2026-10-12T09:00:00Z',
    updatedAt: '2026-11-01T11:30:00Z',
  },
  {
    id: 'prod_003',
    sku: 'GB-HARD-PIPE-01',
    name: 'Astral UPVC Agricultural Pressure Pipe (10 ft)',
    hindiName: 'एस्ट्रल यूपीवीसी कृषि पाइप (10 फुट)',
    description: 'Heavy-duty ISI certified UPVC pipe suitable for submersible borewell and household water lines.',
    vertical: 'HARDWARE',
    categoryId: 'cat_hard_plumbing',
    brandId: 'brand_astral',
    sellerId: 'sel_05',
    sellerName: 'Verma Hardware & Electric',
    unitId: 'unit_piece',
    inventoryMode: 'VARIANT_STOCK',
    mrpPaise: 32000,
    pricePaise: 28500,
    stockQuantity: 35,
    lowStockThreshold: 8,
    attributes: { material: 'UPVC', warranty: '2 Years' },
    variants: [
      { id: 'v_pipe_1', sku: 'GB-HARD-PIPE-1IN', label: '1 inch × 10 ft', attributes: { pipe_diameter: '1 inch' }, mrpPaise: 32000, pricePaise: 28500, stockQuantity: 20, isAvailable: true },
      { id: 'v_pipe_2', sku: 'GB-HARD-PIPE-2IN', label: '2 inch × 10 ft', attributes: { pipe_diameter: '2 inch' }, mrpPaise: 54000, pricePaise: 49000, stockQuantity: 15, isAvailable: true },
    ],
    optionGroupIds: [],
    moderationStatus: 'PENDING_REVIEW',
    isActive: true,
    isAvailable: true,
    createdAt: '2026-11-01T14:20:00Z',
    updatedAt: '2026-11-01T14:20:00Z',
  },
  {
    id: 'prod_004',
    sku: 'GB-ELEC-FAN-01',
    name: 'Crompton High-Speed 1200mm Ceiling Fan',
    hindiName: 'क्रॉम्पटन हाई-स्पीड सीलिंग फैन',
    description: '100% copper winding anti-dust ceiling fan with 2-year manufacturer warranty.',
    vertical: 'ELECTRONICS',
    categoryId: 'cat_elec_fans',
    brandId: 'brand_crompton',
    sellerId: 'sel_05',
    sellerName: 'Verma Hardware & Electric',
    unitId: 'unit_piece',
    inventoryMode: 'QUANTITY_STOCK',
    mrpPaise: 249900,
    pricePaise: 189900,
    stockQuantity: 4,
    lowStockThreshold: 5,
    attributes: { wattage: 52, warranty: '2 Years', color: 'Brown' },
    variants: [],
    optionGroupIds: ['opt_elec_install'],
    moderationStatus: 'PENDING_REVIEW',
    isActive: true,
    isAvailable: true,
    createdAt: '2026-11-01T16:00:00Z',
    updatedAt: '2026-11-01T16:00:00Z',
  },
  {
    id: 'prod_005',
    sku: 'GB-APPR-KRT-01',
    name: 'Pure Khadi Cotton Men Festive Kurta',
    hindiName: 'शुद्ध खादी कॉटन कुर्ता',
    description: 'Breathable handloom khadi cotton kurta with mandarin collar.',
    vertical: 'APPAREL',
    categoryId: 'cat_apparel_ethnic',
    brandId: 'brand_gram_local',
    sellerId: 'sel_06',
    sellerName: 'Shree Ram Vastra Bhandar',
    unitId: 'unit_piece',
    inventoryMode: 'VARIANT_STOCK',
    mrpPaise: 89900,
    pricePaise: 64900,
    stockQuantity: 28,
    lowStockThreshold: 6,
    attributes: { fabric: 'Khadi' },
    variants: [
      { id: 'v_krt_mw', sku: 'GB-APPR-KRT-M-WHT', label: 'M / White', attributes: { size: 'M', color: 'White' }, mrpPaise: 89900, pricePaise: 64900, stockQuantity: 9, isAvailable: true },
      { id: 'v_krt_lw', sku: 'GB-APPR-KRT-L-WHT', label: 'L / White', attributes: { size: 'L', color: 'White' }, mrpPaise: 89900, pricePaise: 64900, stockQuantity: 11, isAvailable: true },
      { id: 'v_krt_xlb', sku: 'GB-APPR-KRT-XL-BLU', label: 'XL / Blue', attributes: { size: 'XL', color: 'Blue' }, mrpPaise: 94900, pricePaise: 69900, stockQuantity: 8, isAvailable: true },
    ],
    optionGroupIds: [],
    moderationStatus: 'APPROVED',
    isActive: true,
    isAvailable: true,
    createdAt: '2026-10-24T12:15:00Z',
    updatedAt: '2026-10-29T10:00:00Z',
  },
  {
    id: 'prod_006',
    sku: 'GB-AGRI-SEED-01',
    name: 'Mahyco Certified Rabi Wheat Seed (HD-2967)',
    hindiName: 'माहिको प्रमाणित गेहूं बीज (HD-2967)',
    description: 'High-yield rust-resistant wheat seed packed in 40 kg moisture-sealed Bori.',
    vertical: 'AGRICULTURE',
    categoryId: 'cat_agri_seeds',
    brandId: 'brand_mahyco',
    sellerId: 'sel_03',
    sellerName: 'Kisan Krishi Seva & Beej Bhandar',
    unitId: 'unit_bori',
    inventoryMode: 'WEIGHT_STOCK',
    mrpPaise: 155000,
    pricePaise: 142000,
    stockQuantity: 64,
    lowStockThreshold: 15,
    attributes: { crop_season: 'Rabi (Winter)', pack_weight: '40 kg Bori' },
    variants: [],
    optionGroupIds: [],
    moderationStatus: 'APPROVED',
    isActive: true,
    isAvailable: true,
    createdAt: '2026-10-18T08:00:00Z',
    updatedAt: '2026-10-30T15:00:00Z',
  },
  {
    id: 'prod_007',
    sku: 'GB-FURN-CHR-01',
    name: 'Handcrafted Solid Sheesham Armchair (Made to Order)',
    hindiName: 'शीशम की ठोस लकड़ी की कुर्सी',
    description: 'Custom polished Sheesham wood living room chair crafted by village artisans.',
    vertical: 'FURNITURE',
    categoryId: 'cat_furn_seating',
    brandId: 'brand_gram_local',
    sellerId: 'sel_05',
    sellerName: 'Verma Hardware & Electric',
    unitId: 'unit_piece',
    inventoryMode: 'MADE_TO_ORDER',
    mrpPaise: 480000,
    pricePaise: 425000,
    leadTimeDays: 5,
    attributes: { material: 'Sheesham Wood', dimensions: '24 × 22 × 36 inches', color: 'Natural Teak', warranty: '2 Years' },
    variants: [],
    optionGroupIds: [],
    moderationStatus: 'PENDING_REVIEW',
    isActive: true,
    isAvailable: true,
    createdAt: '2026-11-02T07:10:00Z',
    updatedAt: '2026-11-02T07:10:00Z',
  },
];

const INITIAL_SERVICE_AREAS: VillageServiceAreaRecord[] = [
  { id: 'v-rampur', name: 'Rampur', postalCode: '209801', district: 'Unnao', state: 'Uttar Pradesh', isActive: true, activeSellersCount: 3, baseDeliveryFeePaise: 1500, minOrderFreeDeliveryPaise: 40000, landmarksCount: 4, landmarks: ['Rampur Primary School', 'Shiv Mandir Chowk', 'Panchayat Bhawan', 'Main Mandi Gate'] },
  { id: 'v-madhopur', name: 'Madhopur', postalCode: '209802', district: 'Unnao', state: 'Uttar Pradesh', isActive: true, activeSellersCount: 2, baseDeliveryFeePaise: 1500, minOrderFreeDeliveryPaise: 40000, landmarksCount: 4, landmarks: ['Madhopur Bus Stand', 'Krishi Mandi', 'Canal Bridge', 'Health Sub-Centre'] },
  { id: 'v-shivpur', name: 'Shivpur', postalCode: '209803', district: 'Unnao', state: 'Uttar Pradesh', isActive: true, activeSellersCount: 2, baseDeliveryFeePaise: 1500, minOrderFreeDeliveryPaise: 40000, landmarksCount: 3, landmarks: ['Shivpur Chauraha', 'Hanuman Mandir', 'Government Tubewell'] },
  { id: 'v-kalyanpur', name: 'Kalyanpur', postalCode: '209804', district: 'Unnao', state: 'Uttar Pradesh', isActive: true, activeSellersCount: 1, baseDeliveryFeePaise: 2000, minOrderFreeDeliveryPaise: 50000, landmarksCount: 3, landmarks: ['Kalyanpur Haat', 'Post Office', 'Peepal Tree Crossing'] },
  { id: 'v-haridaspur', name: 'Haridaspur', postalCode: '209805', district: 'Unnao', state: 'Uttar Pradesh', isActive: true, activeSellersCount: 1, baseDeliveryFeePaise: 2000, minOrderFreeDeliveryPaise: 50000, landmarksCount: 3, landmarks: ['Haridaspur Talab', 'Primary School', 'Dairy Cooperative'] },
  { id: 'v-chandpur', name: 'Chandpur', postalCode: '209806', district: 'Unnao', state: 'Uttar Pradesh', isActive: true, activeSellersCount: 0, baseDeliveryFeePaise: 2500, minOrderFreeDeliveryPaise: 60000, landmarksCount: 2, landmarks: ['Chandpur Entry Gate', 'Gram Sabha Chaupal'] },
];

const INITIAL_INTER_VILLAGE_ROUTES: InterVillageRouteRecord[] = [
  { id: 'rt_01', fromVillageId: 'v-rampur', fromVillageName: 'Rampur', toVillageId: 'v-madhopur', toVillageName: 'Madhopur', distanceKm: 3.2, surchargePaise: 1500, isActive: true },
  { id: 'rt_02', fromVillageId: 'v-rampur', fromVillageName: 'Rampur', toVillageId: 'v-shivpur', toVillageName: 'Shivpur', distanceKm: 4.5, surchargePaise: 2000, isActive: true },
  { id: 'rt_03', fromVillageId: 'v-madhopur', fromVillageName: 'Madhopur', toVillageId: 'v-kalyanpur', toVillageName: 'Kalyanpur', distanceKm: 5.0, surchargePaise: 2500, isActive: true },
  { id: 'rt_04', fromVillageId: 'v-shivpur', fromVillageName: 'Shivpur', toVillageId: 'v-haridaspur', toVillageName: 'Haridaspur', distanceKm: 3.8, surchargePaise: 2000, isActive: true },
];

const INITIAL_FEE_RULES: FeeRuleRecord[] = [
  { id: 'fee_01', name: 'Standard Food Delivery Pilot Rule', vertical: 'FOOD', commissionBps: 500, platformFeePaise: 200, effectiveFrom: '2026-10-01', isPilotShadowMode: true, status: 'ACTIVE' },
  { id: 'fee_02', name: 'Standard Grocery Pilot Rule', vertical: 'GROCERY', commissionBps: 300, platformFeePaise: 200, effectiveFrom: '2026-10-01', isPilotShadowMode: true, status: 'ACTIVE' },
  { id: 'fee_03', name: 'Agri Inputs & Seeds Rule', vertical: 'AGRICULTURE', commissionBps: 250, platformFeePaise: 500, effectiveFrom: '2026-11-01', isPilotShadowMode: true, status: 'ACTIVE' },
  { id: 'fee_04', name: 'Hardware & Electronics Rule', vertical: 'HARDWARE', commissionBps: 400, platformFeePaise: 500, effectiveFrom: '2026-11-01', isPilotShadowMode: true, status: 'ACTIVE' },
];

const INITIAL_OFFERS: OfferCouponRecord[] = [
  { id: 'off_01', code: 'GRAM50', title: 'Welcome ₹50 Off on First Village Order', discountType: 'FLAT', discountValue: 5000, minOrderPaise: 25000, vertical: 'ALL', villageId: 'ALL', fundedBy: 'PLATFORM', validFrom: '2026-10-01', validUntil: '2026-12-31', usageLimit: 500, usedCount: 124, isActive: true },
  { id: 'off_02', code: 'RAMPURFREE', title: 'Free Delivery in Rampur & Madhopur', discountType: 'FREE_DELIVERY', discountValue: 0, minOrderPaise: 19900, vertical: 'FOOD', villageId: 'v-rampur', fundedBy: 'PLATFORM', validFrom: '2026-10-15', validUntil: '2026-11-30', usageLimit: 300, usedCount: 89, isActive: true },
  { id: 'off_03', code: 'KISAN10', title: '10% Off on Rabi Seeds & Fertilizer', discountType: 'PERCENTAGE', discountValue: 10, minOrderPaise: 100000, maxDiscountPaise: 25000, vertical: 'AGRICULTURE', villageId: 'ALL', fundedBy: 'SELLER', validFrom: '2026-10-20', validUntil: '2026-12-15', usageLimit: 150, usedCount: 31, isActive: true },
];

const INITIAL_SUPPORT_CASES: SupportCaseRecord[] = [
  {
    id: 'case_101',
    orderId: 'ORD-RAM-0881',
    vertical: 'FOOD',
    customerName: 'Suresh Kumar',
    customerPhone: '+91 98222 33441',
    sellerId: 'sel_01',
    sellerName: 'Chaudhary Dhaba & Sweets',
    issueType: 'MISSING_ITEM',
    status: 'OPEN',
    amountPaise: 12000,
    description: 'Ordered 2 Paneer Butter Masala and 4 Rotis. Received only 1 Paneer Butter Masala.',
    createdAt: '2026-11-02T07:15:00Z',
    updatedAt: '2026-11-02T07:15:00Z',
  },
  {
    id: 'case_102',
    orderId: 'ORD-RAM-0879',
    vertical: 'GROCERY',
    customerName: 'Anita Verma',
    customerPhone: '+91 98333 44552',
    sellerId: 'sel_02',
    sellerName: 'Gupta Kirana & General Store',
    issueType: 'DAMAGED_IN_TRANSIT',
    status: 'INVESTIGATING',
    amountPaise: 18000,
    description: 'Mustard oil bottle seal was broken during runner transit.',
    resolutionNotes: 'Spoke with shopkeeper Mohan Gupta; agreed to issue runner replacement.',
    createdAt: '2026-11-01T15:30:00Z',
    updatedAt: '2026-11-01T17:00:00Z',
  },
  {
    id: 'case_103',
    orderId: 'ORD-RAM-0864',
    vertical: 'APPAREL',
    customerName: 'Deepak Mishra',
    customerPhone: '+91 99182 55109',
    sellerId: 'sel_06',
    sellerName: 'Shree Ram Vastra Bhandar',
    issueType: 'WRONG_VARIANT',
    status: 'OPEN',
    amountPaise: 64900,
    description: 'Ordered Size L White Khadi Kurta but received Size M.',
    createdAt: '2026-11-02T08:10:00Z',
    updatedAt: '2026-11-02T08:10:00Z',
  },
];

const INITIAL_PLATFORM_SETTINGS: PlatformSettingsRecord = {
  platformName: 'GramBazaar',
  tagline: 'Apne Gaon Ka Apna Universal Bazaar',
  supportPhone: '+91 1800-120-4455',
  whatsappSupport: '+91 98111 22200',
  defaultDeliveryEnabled: true,
  defaultPickupEnabled: true,
  allowMultiVerticalSellers: true,
  autoCancelUnacceptedMins: 15,
  foodPrepSlaMins: 35,
  maintenanceMode: false,
  maintenanceMessage: 'GramBazaar is undergoing scheduled village catalogue maintenance. We will be back shortly.',
};

const INITIAL_AUDIT_LOGS: AuditLogRecord[] = [
  {
    id: 'aud_001',
    actor: 'Vikram Singh',
    actorRole: 'SUPER_ADMIN',
    actionType: 'MERCHANT_APPROVED',
    targetEntity: 'SellerApplication',
    targetId: 'app_003',
    timestamp: '2026-10-31T11:00:00Z',
    ipAddress: '192.168.1.104',
    details: 'Approved Annapurna Rasoi Dhabe after FSSAI registration verification.',
    reason: 'Verified FSSAI certificate 12724002000123 matching trade name.',
  },
  {
    id: 'aud_002',
    actor: 'Vikram Singh',
    actorRole: 'SUPER_ADMIN',
    actionType: 'SERVICE_AREA_EXPANDED',
    targetEntity: 'Village',
    targetId: 'v-chandpur',
    timestamp: '2026-10-25T14:10:00Z',
    ipAddress: '192.168.1.104',
    details: 'Configured new village boundary Chandpur (PIN 209806) with neighbor matrix.',
    reason: 'Gram Panchayat request for pilot integration.',
  },
  {
    id: 'aud_003',
    actor: 'System Automation',
    actorRole: 'SYSTEM',
    actionType: 'FEE_RULE_SHADOW_ACTIVE',
    targetEntity: 'FeeRule',
    targetId: 'fee_01',
    timestamp: '2026-10-01T00:00:00Z',
    ipAddress: '127.0.0.1',
    details: 'Enabled pilot shadow fee calculation for food delivery (500 bps).',
  },
];

const STORAGE_KEYS = {
  ADMIN_USERS: 'grambazaar_admin_users_v2',
  CURRENT_ADMIN_ID: 'grambazaar_current_admin_id_v2',
  ROLE_PERMISSIONS: 'grambazaar_role_permissions_v3',
  AUDIT_LOGS: 'grambazaar_admin_audit_logs_v2',
  APPLICATIONS: 'grambazaar_admin_applications_v2',
  SELLERS: 'grambazaar_admin_sellers_v2',
  VERTICALS: 'grambazaar_admin_verticals_v2',
  CATEGORIES: 'grambazaar_admin_categories_v2',
  ATTRIBUTES: 'grambazaar_admin_attributes_v2',
  UNITS: 'grambazaar_admin_units_v2',
  OPTION_GROUPS: 'grambazaar_admin_option_groups_v2',
  BRANDS: 'grambazaar_admin_brands_v2',
  VARIANT_MASTERS: 'grambazaar_admin_variant_masters_v1',
  PACKAGING_MASTERS: 'grambazaar_admin_packaging_masters_v1',
  AVAILABILITY_CONFIGS: 'grambazaar_admin_availability_configs_v1',
  PRODUCTS: 'grambazaar_admin_products_v2',
  SERVICE_AREAS: 'grambazaar_admin_service_areas_v2',
  ROUTES: 'grambazaar_admin_routes_v2',
  FEE_RULES: 'grambazaar_admin_fee_rules_v2',
  OFFERS: 'grambazaar_admin_offers_v2',
  SUPPORT_CASES: 'grambazaar_admin_support_v2',
  SETTINGS: 'grambazaar_admin_settings_v2',
  CUSTOMERS: 'grambazaar_admin_customers_v1',
  PAYOUTS: 'grambazaar_admin_payouts_v1',
  TRANSACTIONS: 'grambazaar_admin_transactions_v1',
  REFUNDS: 'grambazaar_admin_refunds_v1',
  CMS_BANNERS: 'grambazaar_admin_cms_banners_v1',
  FEATURED_SELLERS: 'grambazaar_admin_featured_sellers_v1',
  CMS_POLICIES: 'grambazaar_admin_cms_policies_v1',
  REVIEWS: 'grambazaar_admin_reviews_v1',
  BROADCASTS: 'grambazaar_admin_broadcasts_v1',
  TAX_SLABS: 'grambazaar_admin_tax_slabs_v1',
  CANCELLATION_RULES: 'grambazaar_admin_cancellation_rules_v1',
  DELIVERY_PARTNERS: 'grambazaar_admin_delivery_partners_v1',
};

function loadStored<T>(key: string, fallback: T): T {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : fallback;
  } catch {
    return fallback;
  }
}

function saveStored(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore storage quota errors in demo mode
  }
}

const AdminContext = createContext<AdminContextType | null>(null);

export const AdminProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>(() =>
    loadStored(STORAGE_KEYS.ADMIN_USERS, INITIAL_ADMIN_USERS)
  );
  const [currentAdminId, setCurrentAdminId] = useState<string>(() =>
    loadStored(STORAGE_KEYS.CURRENT_ADMIN_ID, INITIAL_ADMIN_USERS[0].id)
  );
  const [rolePermissions, setRolePermissions] = useState<RolePermissionMatrix>(() => {
    const stored = loadStored<Partial<RolePermissionMatrix>>(STORAGE_KEYS.ROLE_PERMISSIONS, {});
    const merged = { ...INITIAL_ROLE_PERMISSIONS } as RolePermissionMatrix;
    (['SUPER_ADMIN', 'ADMIN_OPS', 'ADMIN_FINANCE', 'ADMIN_SUPPORT'] as AdminRole[]).forEach((role) => {
      merged[role] = {
        ...INITIAL_ROLE_PERMISSIONS[role],
        ...(stored[role] || {}),
      };
    });
    return merged;
  });
  const [applications, setApplications] = useState<SellerApplication[]>(() =>
    loadStored(STORAGE_KEYS.APPLICATIONS, INITIAL_APPLICATIONS)
  );
  const [sellers, setSellers] = useState<MasterSellerRecord[]>(() => {
    const stored = loadStored(STORAGE_KEYS.SELLERS, INITIAL_SELLERS);
    const seedMap = new Map(INITIAL_SELLERS.map((s) => [s.id, s]));
    const hydrated = stored.map((s) => {
      const seed = seedMap.get(s.id);
      if (!seed) return s;
      return {
        ...seed,
        ...s,
        kycStatus: s.kycStatus || seed.kycStatus,
        kycDocuments: s.kycDocuments?.length ? s.kycDocuments : seed.kycDocuments,
        activityHistory: s.activityHistory?.length ? s.activityHistory : seed.activityHistory,
        aliasIds: s.aliasIds?.length ? s.aliasIds : seed.aliasIds,
      };
    });
    const existingIds = new Set(hydrated.map((s) => s.id));
    INITIAL_SELLERS.forEach((seed) => {
      if (!existingIds.has(seed.id)) {
        hydrated.push(seed);
      }
    });
    return hydrated;
  });
  const [verticalConfigs, setVerticalConfigs] = useState<VerticalConfigRecord[]>(() =>
    loadStored(STORAGE_KEYS.VERTICALS, INITIAL_VERTICALS)
  );
  const [categories, setCategories] = useState<CategoryRecord[]>(() =>
    loadStored(STORAGE_KEYS.CATEGORIES, INITIAL_CATEGORIES)
  );
  const [attributes, setAttributes] = useState<AttributeMasterRecord[]>(() =>
    loadStored(STORAGE_KEYS.ATTRIBUTES, INITIAL_ATTRIBUTES)
  );
  const [units, setUnits] = useState<UnitMasterRecord[]>(() =>
    loadStored(STORAGE_KEYS.UNITS, INITIAL_UNITS)
  );
  const [optionGroups, setOptionGroups] = useState<OptionGroupMasterRecord[]>(() =>
    loadStored(STORAGE_KEYS.OPTION_GROUPS, INITIAL_OPTION_GROUPS)
  );
  const [brands, setBrands] = useState<BrandMasterRecord[]>(() =>
    loadStored(STORAGE_KEYS.BRANDS, INITIAL_BRANDS)
  );
  const [variantMasters, setVariantMasters] = useState<VariantSizeMasterRecord[]>(() =>
    loadStored(STORAGE_KEYS.VARIANT_MASTERS, INITIAL_VARIANT_MASTERS)
  );
  const [packagingMasters, setPackagingMasters] = useState<PackagingMasterRecord[]>(() =>
    loadStored(STORAGE_KEYS.PACKAGING_MASTERS, INITIAL_PACKAGING_MASTERS)
  );
  const [availabilityConfigs, setAvailabilityConfigs] = useState<AvailabilityStockConfigRecord[]>(() =>
    loadStored(STORAGE_KEYS.AVAILABILITY_CONFIGS, INITIAL_AVAILABILITY_CONFIGS)
  );
  const [products, setProducts] = useState<UniversalProductRecord[]>(() =>
    loadStored(STORAGE_KEYS.PRODUCTS, INITIAL_PRODUCTS)
  );
  const [serviceAreas, setServiceAreas] = useState<VillageServiceAreaRecord[]>(() =>
    loadStored(STORAGE_KEYS.SERVICE_AREAS, INITIAL_SERVICE_AREAS)
  );
  const [interVillageRoutes, setInterVillageRoutes] = useState<InterVillageRouteRecord[]>(() =>
    loadStored(STORAGE_KEYS.ROUTES, INITIAL_INTER_VILLAGE_ROUTES)
  );
  const [feeRules, setFeeRules] = useState<FeeRuleRecord[]>(() =>
    loadStored(STORAGE_KEYS.FEE_RULES, INITIAL_FEE_RULES)
  );
  const [offers, setOffers] = useState<OfferCouponRecord[]>(() =>
    loadStored(STORAGE_KEYS.OFFERS, INITIAL_OFFERS)
  );
  const [supportCases, setSupportCases] = useState<SupportCaseRecord[]>(() =>
    loadStored(STORAGE_KEYS.SUPPORT_CASES, INITIAL_SUPPORT_CASES)
  );
  const [platformSettings, setPlatformSettings] = useState<PlatformSettingsRecord>(() =>
    loadStored(STORAGE_KEYS.SETTINGS, INITIAL_PLATFORM_SETTINGS)
  );
  const [customers, setCustomers] = useState<AdminCustomerRecord[]>(() =>
    loadStored(STORAGE_KEYS.CUSTOMERS, INITIAL_CUSTOMERS)
  );
  const [payouts, setPayouts] = useState<SellerPayoutRecord[]>(() => {
    const stored = loadStored(STORAGE_KEYS.PAYOUTS, INITIAL_PAYOUTS);
    const ids = new Set(stored.map((item) => item.id));
    const merged = [
      ...stored.map((item) => {
        const seedMatch = INITIAL_PAYOUTS.find((s) => s.id === item.id);
        return seedMatch ? { ...seedMatch, ...item } : item;
      }),
      ...INITIAL_PAYOUTS.filter((s) => !ids.has(s.id)),
    ];
    return merged;
  });
  const [paymentTransactions, setPaymentTransactions] = useState<PaymentTransactionRecord[]>(() => {
    const stored = loadStored(STORAGE_KEYS.TRANSACTIONS, INITIAL_PAYMENT_TRANSACTIONS);
    const ids = new Set(stored.map((item) => item.id));
    return [
      ...stored.map((item) => {
        const seedMatch = INITIAL_PAYMENT_TRANSACTIONS.find((s) => s.id === item.id);
        return seedMatch ? { ...seedMatch, ...item } : item;
      }),
      ...INITIAL_PAYMENT_TRANSACTIONS.filter((s) => !ids.has(s.id)),
    ];
  });
  const [refundLedger, setRefundLedger] = useState<RefundLedgerRecord[]>(() => {
    const stored = loadStored(STORAGE_KEYS.REFUNDS, INITIAL_REFUNDS);
    const ids = new Set(stored.map((item) => item.id));
    return [
      ...stored.map((item) => {
        const seedMatch = INITIAL_REFUNDS.find((s) => s.id === item.id);
        return seedMatch ? { ...seedMatch, ...item } : item;
      }),
      ...INITIAL_REFUNDS.filter((s) => !ids.has(s.id)),
    ];
  });
  const [cmsBanners, setCmsBanners] = useState<CmsBannerRecord[]>(() =>
    loadStored(STORAGE_KEYS.CMS_BANNERS, INITIAL_CMS_BANNERS)
  );
  const [featuredSellerIds, setFeaturedSellerIds] = useState<string[]>(() =>
    loadStored(STORAGE_KEYS.FEATURED_SELLERS, ['sel_1', 'sel_2'])
  );
  const [cmsPolicies, setCmsPolicies] = useState<CmsPolicyPageRecord[]>(() =>
    loadStored(STORAGE_KEYS.CMS_POLICIES, INITIAL_CMS_POLICIES)
  );
  const [reviews, setReviews] = useState<CustomerReviewRecord[]>(() =>
    loadStored(STORAGE_KEYS.REVIEWS, INITIAL_REVIEWS)
  );
  const [broadcasts, setBroadcasts] = useState<BroadcastMessageRecord[]>(() =>
    loadStored(STORAGE_KEYS.BROADCASTS, INITIAL_BROADCASTS)
  );
  const [taxSlabs, setTaxSlabs] = useState<TaxSlabRecord[]>(() =>
    loadStored(STORAGE_KEYS.TAX_SLABS, INITIAL_TAX_SLABS)
  );
  const [cancellationRules, setCancellationRules] = useState<CancellationPolicyRuleRecord[]>(() =>
    loadStored(STORAGE_KEYS.CANCELLATION_RULES, INITIAL_CANCELLATION_RULES)
  );
  const [deliveryPartners, setDeliveryPartners] = useState<DeliveryPartnerRecord[]>(() =>
    loadStored(STORAGE_KEYS.DELIVERY_PARTNERS, INITIAL_DELIVERY_PARTNERS)
  );
  const [auditLogs, setAuditLogs] = useState<AuditLogRecord[]>(() =>
    loadStored(STORAGE_KEYS.AUDIT_LOGS, INITIAL_AUDIT_LOGS)
  );

  const currentAdmin = adminUsers.find((u) => u.id === currentAdminId) || adminUsers[0] || INITIAL_ADMIN_USERS[0];

  // Persist all slices cleanly
  useEffect(() => { saveStored(STORAGE_KEYS.ADMIN_USERS, adminUsers); }, [adminUsers]);
  useEffect(() => { saveStored(STORAGE_KEYS.CURRENT_ADMIN_ID, currentAdminId); }, [currentAdminId]);
  useEffect(() => { saveStored(STORAGE_KEYS.ROLE_PERMISSIONS, rolePermissions); }, [rolePermissions]);
  useEffect(() => { saveStored(STORAGE_KEYS.AUDIT_LOGS, auditLogs); }, [auditLogs]);
  useEffect(() => { saveStored(STORAGE_KEYS.APPLICATIONS, applications); }, [applications]);
  useEffect(() => { saveStored(STORAGE_KEYS.SELLERS, sellers); }, [sellers]);
  useEffect(() => { saveStored(STORAGE_KEYS.VERTICALS, verticalConfigs); }, [verticalConfigs]);
  useEffect(() => { saveStored(STORAGE_KEYS.CATEGORIES, categories); }, [categories]);
  useEffect(() => { saveStored(STORAGE_KEYS.ATTRIBUTES, attributes); }, [attributes]);
  useEffect(() => { saveStored(STORAGE_KEYS.UNITS, units); }, [units]);
  useEffect(() => { saveStored(STORAGE_KEYS.OPTION_GROUPS, optionGroups); }, [optionGroups]);
  useEffect(() => { saveStored(STORAGE_KEYS.BRANDS, brands); }, [brands]);
  useEffect(() => { saveStored(STORAGE_KEYS.VARIANT_MASTERS, variantMasters); }, [variantMasters]);
  useEffect(() => { saveStored(STORAGE_KEYS.PACKAGING_MASTERS, packagingMasters); }, [packagingMasters]);
  useEffect(() => { saveStored(STORAGE_KEYS.AVAILABILITY_CONFIGS, availabilityConfigs); }, [availabilityConfigs]);
  useEffect(() => { saveStored(STORAGE_KEYS.PRODUCTS, products); }, [products]);
  useEffect(() => { saveStored(STORAGE_KEYS.SERVICE_AREAS, serviceAreas); }, [serviceAreas]);
  useEffect(() => { saveStored(STORAGE_KEYS.ROUTES, interVillageRoutes); }, [interVillageRoutes]);
  useEffect(() => { saveStored(STORAGE_KEYS.FEE_RULES, feeRules); }, [feeRules]);
  useEffect(() => { saveStored(STORAGE_KEYS.OFFERS, offers); }, [offers]);
  useEffect(() => { saveStored(STORAGE_KEYS.SUPPORT_CASES, supportCases); }, [supportCases]);
  useEffect(() => { saveStored(STORAGE_KEYS.SETTINGS, platformSettings); }, [platformSettings]);
  useEffect(() => { saveStored(STORAGE_KEYS.CUSTOMERS, customers); }, [customers]);
  useEffect(() => { saveStored(STORAGE_KEYS.PAYOUTS, payouts); }, [payouts]);
  useEffect(() => { saveStored(STORAGE_KEYS.TRANSACTIONS, paymentTransactions); }, [paymentTransactions]);
  useEffect(() => { saveStored(STORAGE_KEYS.REFUNDS, refundLedger); }, [refundLedger]);
  useEffect(() => { saveStored(STORAGE_KEYS.CMS_BANNERS, cmsBanners); }, [cmsBanners]);
  useEffect(() => { saveStored(STORAGE_KEYS.FEATURED_SELLERS, featuredSellerIds); }, [featuredSellerIds]);
  useEffect(() => { saveStored(STORAGE_KEYS.CMS_POLICIES, cmsPolicies); }, [cmsPolicies]);
  useEffect(() => { saveStored(STORAGE_KEYS.REVIEWS, reviews); }, [reviews]);
  useEffect(() => { saveStored(STORAGE_KEYS.BROADCASTS, broadcasts); }, [broadcasts]);
  useEffect(() => { saveStored(STORAGE_KEYS.TAX_SLABS, taxSlabs); }, [taxSlabs]);
  useEffect(() => { saveStored(STORAGE_KEYS.CANCELLATION_RULES, cancellationRules); }, [cancellationRules]);
  useEffect(() => { saveStored(STORAGE_KEYS.DELIVERY_PARTNERS, deliveryPartners); }, [deliveryPartners]);

  const logAuditEvent = (
    actionType: string,
    targetEntity: string,
    targetId: string,
    details: string,
    reason?: string,
    metadata?: Record<string, unknown>
  ) => {
    const newLog: AuditLogRecord = {
      id: `aud_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      actor: currentAdmin.name,
      actorRole: currentAdmin.role,
      actionType,
      targetEntity,
      targetId,
      timestamp: new Date().toISOString(),
      ipAddress: '192.168.1.104',
      details,
      reason,
      metadata,
    };
    setAuditLogs((prev) => [newLog, ...prev]);
  };

  // RBAC Helpers
  const hasPermission = (
    module: AdminModuleKey,
    action: 'view' | 'manage' | 'approve' | 'export' = 'view'
  ): boolean => {
    if (currentAdmin.role === 'SUPER_ADMIN') return true;
    const roleMap = rolePermissions[currentAdmin.role];
    const entry = roleMap?.[module] ?? INITIAL_ROLE_PERMISSIONS[currentAdmin.role]?.[module];
    if (!entry) return false;
    return Boolean(entry[action]);
  };

  const switchActiveAdmin = (adminId: string) => {
    const target = adminUsers.find((u) => u.id === adminId);
    if (!target) return;
    setCurrentAdminId(adminId);
    setAdminUsers((prev) =>
      prev.map((u) => (u.id === adminId ? { ...u, lastActiveAt: new Date().toISOString() } : u))
    );
  };

  const addAdminUser = (user: Omit<AdminUser, 'id' | 'lastActiveAt'>) => {
    const id = `admin_${Date.now()}`;
    setAdminUsers((prev) => [
      { ...user, id, status: user.status || 'ACTIVE', lastActiveAt: new Date().toISOString() },
      ...prev,
    ]);
    logAuditEvent('ADMIN_USER_CREATED', 'AdminUser', id, `Created admin account ${user.name} (${user.role})`);
  };

  const updateAdminUser = (adminId: string, patch: Partial<AdminUser>) => {
    setAdminUsers((prev) => prev.map((u) => (u.id === adminId ? { ...u, ...patch } : u)));
    logAuditEvent('ADMIN_USER_UPDATED', 'AdminUser', adminId, `Updated admin profile ${adminId}`, undefined, patch as Record<string, unknown>);
  };

  const updateRolePermission = (
    role: AdminRole,
    module: AdminModuleKey,
    key: 'view' | 'manage' | 'approve' | 'export',
    value: boolean
  ) => {
    if (role === 'SUPER_ADMIN') return; // Super Admin always retains full access
    setRolePermissions((prev) => ({
      ...prev,
      [role]: {
        ...prev[role],
        [module]: {
          ...prev[role][module],
          [key]: value,
        },
      },
    }));
    logAuditEvent('RBAC_PERMISSION_UPDATED', 'RolePermission', `${role}:${module}`, `Set ${role}.${module}.${key} = ${value}`);
  };

  // Applications & KYC
  const reviewApplication = (
    applicationId: string,
    status: ApplicationStatus,
    notes: string
  ) => {
    const app = applications.find((a) => a.id === applicationId);
    if (!app) return { success: false, message: 'Application not found' };

    setApplications((prev) =>
      prev.map((a) =>
        a.id === applicationId
          ? {
              ...a,
              status,
              reviewNotes: notes,
              reviewedBy: currentAdmin.name,
              reviewedAt: new Date().toISOString(),
            }
          : a
      )
    );

    if (status === 'APPROVED') {
      const nowIso = new Date().toISOString();
      const newSeller: MasterSellerRecord = {
        id: `sel_${Date.now().toString().slice(-4)}`,
        name: app.businessName,
        ownerName: app.applicantName,
        businessType: app.businessType || 'MULTI_CATEGORY',
        phone: app.phone,
        villageId: app.villageId,
        villageName: app.villageName,
        district: 'Unnao',
        state: 'Uttar Pradesh',
        serviceableVillageIds: [app.villageId],
        vertical: app.vertical,
        supportedVerticals: app.supportedVerticals?.length ? app.supportedVerticals : [app.vertical],
        fulfilmentModes: ['DELIVERY', 'PICKUP'],
        openingHours: '09:00 AM - 09:00 PM',
        status: 'ACTIVE',
        kycStatus: 'APPROVED',
        rating: 5.0,
        totalOrders: 0,
        gmvPaise: 0,
        commissionRateBps: app.vertical === 'FOOD' ? 500 : 400,
        bankAccountHolder: app.bankAccountHolder,
        bankAccountNumberMasked: `XXXXXX${app.bankAccountNumber.slice(-4)}`,
        ifscCode: app.ifscCode,
        fssaiVerified: Boolean(app.fssaiNumber),
        joinedAt: nowIso.split('T')[0],
        activityHistory: [
          {
            id: `act_${Date.now()}_reg`,
            type: 'REGISTRATION',
            title: 'Seller Onboarded',
            description: `Approved from application ${app.id} and activated.`,
            actor: currentAdmin.name,
            timestamp: nowIso,
            reason: notes,
          },
        ],
      };
      setSellers((prev) => [newSeller, ...prev]);
    }

    logAuditEvent(
      `APPLICATION_${status}`,
      'SellerApplication',
      applicationId,
      `Application for ${app.businessName} marked as ${status}. Notes: ${notes}`,
      notes
    );

    return { success: true, message: `Application ${applicationId} marked as ${status}.` };
  };

  const toggleApplicationDocVerified = (applicationId: string, docCode: string) => {
    setApplications((prev) =>
      prev.map((a) => {
        if (a.id !== applicationId) return a;
        const current = a.verifiedDocs?.[docCode] ?? false;
        return {
          ...a,
          verifiedDocs: {
            ...(a.verifiedDocs || {}),
            [docCode]: !current,
          },
        };
      })
    );
    logAuditEvent('KYC_DOCUMENT_TOGGLED', 'SellerApplication', applicationId, `Toggled KYC verification for ${docCode}`);
  };

  // Sellers
  const updateSellerStatus = (
    sellerId: string,
    status: SellerAccountStatus,
    reason: string
  ) => {
    const seller = sellers.find((s) => s.id === sellerId);
    if (!seller) return { success: false, message: 'Seller not found' };

    const nowIso = new Date().toISOString();
    const prevStatus = seller.status;
    let nextKycStatus: SellerKycStatus | undefined = seller.kycStatus;
    let eventType: SellerActivityEvent['type'] = 'ADMIN_ACTION';
    let eventTitle = `Status changed to ${status.replace(/_/g, ' ')}`;

    if (status === 'APPROVED') {
      nextKycStatus = 'APPROVED';
      eventType = 'KYC_APPROVED';
      eventTitle = 'Seller Approved';
    } else if (status === 'REJECTED') {
      nextKycStatus = 'REJECTED';
      eventType = 'KYC_REJECTED';
      eventTitle = 'Seller Rejected';
    } else if (status === 'ACTIVE') {
      if (prevStatus === 'SUSPENDED') {
        eventType = 'STORE_UNSUSPENDED';
        eventTitle = 'Seller Unsuspended & Activated';
      } else {
        eventType = 'STORE_ACTIVATED';
        eventTitle = 'Store Activated';
      }
      if (!nextKycStatus || nextKycStatus === 'PENDING' || nextKycStatus === 'UNDER_REVIEW') {
        nextKycStatus = 'APPROVED';
      }
    } else if (status === 'INACTIVE' || status === 'PAUSED') {
      eventType = 'STORE_DEACTIVATED';
      eventTitle = 'Store Deactivated';
    } else if (status === 'SUSPENDED') {
      eventType = 'STORE_SUSPENDED';
      eventTitle = 'Store Suspended';
    } else if (status === 'KYC_PENDING') {
      nextKycStatus = 'CHANGES_REQUESTED';
      eventType = 'KYC_CHANGES_REQUESTED';
      eventTitle = 'KYC Changes Requested';
    }

    const newActivity: SellerActivityEvent = {
      id: `act_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      type: eventType,
      title: eventTitle,
      description: `Status updated from ${prevStatus.replace(/_/g, ' ')} to ${status.replace(/_/g, ' ')}.${reason ? ` Note: ${reason}` : ''}`,
      actor: currentAdmin.name,
      timestamp: nowIso,
      reason: reason || undefined,
    };

    setSellers((prev) =>
      prev.map((s) =>
        s.id === sellerId
          ? {
              ...s,
              status,
              kycStatus: nextKycStatus,
              suspensionReason: status === 'SUSPENDED' ? reason : status === 'ACTIVE' ? undefined : s.suspensionReason,
              rejectionReason: status === 'REJECTED' ? reason : status === 'APPROVED' || status === 'ACTIVE' ? undefined : s.rejectionReason,
              kycChangeRequestNotes: status === 'KYC_PENDING' ? reason : status === 'APPROVED' ? undefined : s.kycChangeRequestNotes,
              activityHistory: [newActivity, ...(s.activityHistory || [])],
            }
          : s
      )
    );

    logAuditEvent(
      `SELLER_STATUS_${status}`,
      'Seller',
      sellerId,
      `Seller ${seller.name} status updated to ${status}. Reason: ${reason}`,
      reason
    );

    return { success: true, message: `Seller ${seller.name} updated to ${status.replace(/_/g, ' ')}.` };
  };

  const updateSellerConfig = (sellerId: string, patch: Partial<MasterSellerRecord>) => {
    const seller = sellers.find((s) => s.id === sellerId);
    if (!seller) return { success: false, message: 'Seller not found' };
    const nowIso = new Date().toISOString();
    const newActivity: SellerActivityEvent = {
      id: `act_${Date.now()}_cfg`,
      type: 'ADMIN_ACTION',
      title: 'Store Configuration Updated',
      description: `Updated store configuration settings (commission, hours, verticals, or serviceability).`,
      actor: currentAdmin.name,
      timestamp: nowIso,
    };
    setSellers((prev) =>
      prev.map((s) =>
        s.id === sellerId
          ? { ...s, ...patch, activityHistory: [newActivity, ...(s.activityHistory || [])] }
          : s
      )
    );
    logAuditEvent(
      'SELLER_CONFIG_UPDATED',
      'Seller',
      sellerId,
      `Updated store configuration for ${seller.name}`,
      undefined,
      patch as Record<string, unknown>
    );
    return { success: true, message: `Updated ${seller.name} configuration.` };
  };

  const updateSellerKycDocument = (
    sellerId: string,
    docId: string,
    status: SellerDocumentStatus,
    note?: string
  ) => {
    const seller = sellers.find((s) => s.id === sellerId);
    if (!seller) return { success: false, message: 'Seller not found' };
    const doc = (seller.kycDocuments || []).find((d) => d.id === docId);
    if (!doc) return { success: false, message: 'Document not found' };

    const nowIso = new Date().toISOString();
    const finalNote =
      note?.trim() ||
      (status === 'APPROVED'
        ? `${doc.label} verified and approved.`
        : status === 'REJECTED'
        ? `${doc.label} rejected during compliance review.`
        : `Requested re-upload / changes for ${doc.label}.`);

    const updatedDocs: SellerKycDocumentRecord[] = (seller.kycDocuments || []).map((d) =>
      d.id === docId
        ? {
            ...d,
            status,
            rejectionReason: status === 'REJECTED' || status === 'CHANGES_REQUESTED' ? finalNote : undefined,
            history: [
              ...d.history,
              {
                status,
                actor: currentAdmin.name,
                timestamp: nowIso,
                note: finalNote,
              },
            ],
          }
        : d
    );

    const hasRejected = updatedDocs.some((d) => d.status === 'REJECTED');
    const hasChangesReq = updatedDocs.some((d) => d.status === 'CHANGES_REQUESTED');
    const allApproved = updatedDocs.length > 0 && updatedDocs.every((d) => d.status === 'APPROVED');

    const derivedKycStatus: SellerKycStatus = allApproved
      ? 'APPROVED'
      : hasRejected
      ? 'REJECTED'
      : hasChangesReq
      ? 'CHANGES_REQUESTED'
      : 'UNDER_REVIEW';

    const fssaiDoc = updatedDocs.find((d) => d.code === 'FSSAI');

    const newActivity: SellerActivityEvent = {
      id: `act_${Date.now()}_doc`,
      type:
        status === 'APPROVED'
          ? 'DOC_UPDATED'
          : status === 'REJECTED'
          ? 'KYC_REJECTED'
          : 'KYC_CHANGES_REQUESTED',
      title: `${doc.label}: ${status.replace(/_/g, ' ')}`,
      description: finalNote,
      actor: currentAdmin.name,
      timestamp: nowIso,
      reason: status !== 'APPROVED' ? finalNote : undefined,
    };

    setSellers((prev) =>
      prev.map((s) =>
        s.id === sellerId
          ? {
              ...s,
              kycDocuments: updatedDocs,
              kycStatus: derivedKycStatus,
              fssaiVerified: fssaiDoc ? fssaiDoc.status === 'APPROVED' : s.fssaiVerified,
              activityHistory: [newActivity, ...(s.activityHistory || [])],
            }
          : s
      )
    );

    logAuditEvent(
      `SELLER_KYC_DOC_${status}`,
      'Seller',
      sellerId,
      `${doc.label} for ${seller.name} marked as ${status}. ${finalNote}`,
      status !== 'APPROVED' ? finalNote : undefined
    );

    return {
      success: true,
      message: `${doc.label} marked as ${status.replace(/_/g, ' ')}.`,
    };
  };

  const requestSellerKycChanges = (sellerId: string, reason: string) => {
    const seller = sellers.find((s) => s.id === sellerId);
    if (!seller) return { success: false, message: 'Seller not found' };

    const nowIso = new Date().toISOString();
    const newActivity: SellerActivityEvent = {
      id: `act_${Date.now()}_kyc_chg`,
      type: 'KYC_CHANGES_REQUESTED',
      title: 'KYC Changes Requested',
      description: reason,
      actor: currentAdmin.name,
      timestamp: nowIso,
      reason,
    };

    setSellers((prev) =>
      prev.map((s) =>
        s.id === sellerId
          ? {
              ...s,
              kycStatus: 'CHANGES_REQUESTED',
              status: s.status === 'PENDING_APPROVAL' || s.status === 'KYC_UNDER_REVIEW' ? 'KYC_PENDING' : s.status,
              kycChangeRequestNotes: reason,
              activityHistory: [newActivity, ...(s.activityHistory || [])],
            }
          : s
      )
    );

    logAuditEvent(
      'SELLER_KYC_CHANGES_REQUESTED',
      'Seller',
      sellerId,
      `Requested KYC document changes from ${seller.name}. Reason: ${reason}`,
      reason
    );

    return { success: true, message: `KYC change request sent to ${seller.name}.` };
  };

  // Multi-Verticals Master
  const toggleVerticalEnabled = (verticalId: string) => {
    const vert = verticalConfigs.find((v) => v.id === verticalId);
    setVerticalConfigs((prev) =>
      prev.map((v) => (v.id === verticalId ? { ...v, isEnabled: !v.isEnabled } : v))
    );
    logAuditEvent(
      'VERTICAL_ENABLED_TOGGLED',
      'VerticalConfig',
      verticalId,
      `Vertical ${vert?.name || verticalId} status toggled to ${!vert?.isEnabled}`
    );
  };

  const addVertical = (vertical: Omit<VerticalConfigRecord, 'sellerCount'>) => {
    const cleanId = vertical.id.trim().toUpperCase().replace(/[^A-Z0-9_]/g, '_');
    if (!cleanId) return { success: false, message: 'Vertical ID is required.' };
    if (verticalConfigs.some((v) => v.id === cleanId)) {
      return { success: false, message: `Vertical ${cleanId} already exists.` };
    }
    const created: VerticalConfigRecord = { ...vertical, id: cleanId, sellerCount: 0 };
    setVerticalConfigs((prev) => [...prev, created]);
    logAuditEvent('VERTICAL_CREATED', 'VerticalConfig', cleanId, `Created new marketplace vertical: ${vertical.name}`);
    return { success: true, message: `Vertical "${vertical.name}" created.` };
  };

  const updateVertical = (verticalId: string, patch: Partial<VerticalConfigRecord>) => {
    setVerticalConfigs((prev) =>
      prev.map((v) => (v.id === verticalId ? { ...v, ...patch } : v))
    );
    logAuditEvent('VERTICAL_UPDATED', 'VerticalConfig', verticalId, `Updated vertical configuration for ${verticalId}`, undefined, patch as Record<string, unknown>);
  };

  // Categories
  const toggleCategoryStatus = (categoryId: string) => {
    const cat = categories.find((c) => c.id === categoryId);
    setCategories((prev) =>
      prev.map((c) => (c.id === categoryId ? { ...c, isActive: !c.isActive } : c))
    );
    logAuditEvent('CATEGORY_STATUS_TOGGLED', 'Category', categoryId, `Category ${cat?.name} is now ${!cat?.isActive ? 'ACTIVE' : 'INACTIVE'}`);
  };

  const addCategory = (newCat: Omit<CategoryRecord, 'id' | 'itemCount'>) => {
    const id = `cat_${Date.now()}`;
    const category: CategoryRecord = { ...newCat, id, itemCount: 0 };
    setCategories((prev) => [...prev, category]);
    logAuditEvent('CATEGORY_CREATED', 'Category', id, `Created category ${category.name} under ${category.vertical}`);
  };

  const updateCategory = (categoryId: string, patch: Partial<CategoryRecord>) => {
    setCategories((prev) => prev.map((c) => (c.id === categoryId ? { ...c, ...patch } : c)));
    logAuditEvent('CATEGORY_UPDATED', 'Category', categoryId, `Updated category ${categoryId}`, undefined, patch as Record<string, unknown>);
  };

  const deleteCategory = (categoryId: string) => {
    const cat = categories.find((c) => c.id === categoryId);
    setCategories((prev) => prev.filter((c) => c.id !== categoryId && c.parentId !== categoryId));
    logAuditEvent('CATEGORY_DELETED', 'Category', categoryId, `Archived/removed category ${cat?.name || categoryId}`);
  };

  // Attributes Master
  const addAttribute = (attr: Omit<AttributeMasterRecord, 'id'>) => {
    const id = `attr_${Date.now()}`;
    setAttributes((prev) => [{ ...attr, id }, ...prev]);
    logAuditEvent('ATTRIBUTE_CREATED', 'AttributeMaster', id, `Created attribute ${attr.name} (${attr.dataType})`);
  };

  const updateAttribute = (attrId: string, patch: Partial<AttributeMasterRecord>) => {
    setAttributes((prev) => prev.map((a) => (a.id === attrId ? { ...a, ...patch } : a)));
    logAuditEvent('ATTRIBUTE_UPDATED', 'AttributeMaster', attrId, `Updated attribute ${attrId}`);
  };

  const toggleAttributeStatus = (attrId: string) => {
    const target = attributes.find((a) => a.id === attrId);
    setAttributes((prev) => prev.map((a) => (a.id === attrId ? { ...a, isActive: !a.isActive } : a)));
    logAuditEvent('ATTRIBUTE_TOGGLED', 'AttributeMaster', attrId, `Attribute ${target?.name} set to ${!target?.isActive}`);
  };

  const deleteAttribute = (attrId: string) => {
    const target = attributes.find((a) => a.id === attrId);
    setAttributes((prev) => prev.filter((a) => a.id !== attrId));
    logAuditEvent('ATTRIBUTE_DELETED', 'AttributeMaster', attrId, `Deleted attribute ${target?.name || attrId}`);
  };

  // Units Master
  const addUnit = (unit: Omit<UnitMasterRecord, 'id'>) => {
    const id = `unit_${Date.now()}`;
    setUnits((prev) => [{ ...unit, id }, ...prev]);
    logAuditEvent('UNIT_CREATED', 'UnitMaster', id, `Created measurement unit ${unit.name} (${unit.symbol})`);
  };

  const updateUnit = (unitId: string, patch: Partial<UnitMasterRecord>) => {
    setUnits((prev) => prev.map((u) => (u.id === unitId ? { ...u, ...patch } : u)));
    logAuditEvent('UNIT_UPDATED', 'UnitMaster', unitId, `Updated unit ${unitId}`);
  };

  const toggleUnitStatus = (unitId: string) => {
    const target = units.find((u) => u.id === unitId);
    setUnits((prev) => prev.map((u) => (u.id === unitId ? { ...u, isActive: !u.isActive } : u)));
    logAuditEvent('UNIT_TOGGLED', 'UnitMaster', unitId, `Unit ${target?.name} set to ${!target?.isActive}`);
  };

  const deleteUnit = (unitId: string) => {
    const target = units.find((u) => u.id === unitId);
    setUnits((prev) => prev.filter((u) => u.id !== unitId));
    logAuditEvent('UNIT_DELETED', 'UnitMaster', unitId, `Deleted unit ${target?.name || unitId}`);
  };

  // Option Groups Master
  const addOptionGroup = (group: Omit<OptionGroupMasterRecord, 'id'>) => {
    const id = `opt_${Date.now()}`;
    setOptionGroups((prev) => [{ ...group, id }, ...prev]);
    logAuditEvent('OPTION_GROUP_CREATED', 'OptionGroup', id, `Created option group ${group.name} (${group.options.length} options)`);
  };

  const updateOptionGroup = (groupId: string, patch: Partial<OptionGroupMasterRecord>) => {
    setOptionGroups((prev) => prev.map((g) => (g.id === groupId ? { ...g, ...patch } : g)));
    logAuditEvent('OPTION_GROUP_UPDATED', 'OptionGroup', groupId, `Updated option group ${groupId}`);
  };

  const duplicateOptionGroup = (groupId: string) => {
    const src = optionGroups.find((g) => g.id === groupId);
    if (!src) return;
    const id = `opt_${Date.now()}`;
    const copy: OptionGroupMasterRecord = {
      ...src,
      id,
      name: `${src.name} (Copy)`,
      options: src.options.map((o, idx) => ({ ...o, id: `${id}_o_${idx}` })),
    };
    setOptionGroups((prev) => [copy, ...prev]);
    logAuditEvent('OPTION_GROUP_DUPLICATED', 'OptionGroup', id, `Duplicated option group from ${src.name}`);
  };

  const toggleOptionGroupStatus = (groupId: string) => {
    const target = optionGroups.find((g) => g.id === groupId);
    setOptionGroups((prev) => prev.map((g) => (g.id === groupId ? { ...g, isActive: !g.isActive } : g)));
    logAuditEvent('OPTION_GROUP_TOGGLED', 'OptionGroup', groupId, `Option group ${target?.name} set to ${!target?.isActive}`);
  };

  const deleteOptionGroup = (groupId: string) => {
    const target = optionGroups.find((g) => g.id === groupId);
    setOptionGroups((prev) => prev.filter((g) => g.id !== groupId));
    logAuditEvent('OPTION_GROUP_DELETED', 'OptionGroup', groupId, `Deleted option group ${target?.name || groupId}`);
  };

  // Brands Master
  const addBrand = (brand: Omit<BrandMasterRecord, 'id' | 'productCount'>) => {
    const id = `brand_${Date.now()}`;
    setBrands((prev) => [{ ...brand, id, productCount: 0 }, ...prev]);
    logAuditEvent('BRAND_CREATED', 'BrandMaster', id, `Created brand ${brand.name}`);
  };

  const updateBrand = (brandId: string, patch: Partial<BrandMasterRecord>) => {
    setBrands((prev) => prev.map((b) => (b.id === brandId ? { ...b, ...patch } : b)));
    logAuditEvent('BRAND_UPDATED', 'BrandMaster', brandId, `Updated brand ${brandId}`);
  };

  const toggleBrandVerified = (brandId: string) => {
    const target = brands.find((b) => b.id === brandId);
    setBrands((prev) => prev.map((b) => (b.id === brandId ? { ...b, isVerified: !b.isVerified } : b)));
    logAuditEvent('BRAND_VERIFIED_TOGGLED', 'BrandMaster', brandId, `Brand ${target?.name} verified=${!target?.isVerified}`);
  };

  const toggleBrandStatus = (brandId: string) => {
    const target = brands.find((b) => b.id === brandId);
    setBrands((prev) => prev.map((b) => (b.id === brandId ? { ...b, isActive: !b.isActive } : b)));
    logAuditEvent('BRAND_TOGGLED', 'BrandMaster', brandId, `Brand ${target?.name} active=${!target?.isActive}`);
  };

  const deleteBrand = (brandId: string) => {
    const target = brands.find((b) => b.id === brandId);
    setBrands((prev) => prev.filter((b) => b.id !== brandId));
    logAuditEvent('BRAND_DELETED', 'BrandMaster', brandId, `Deleted brand ${target?.name || brandId}`);
  };

  // Product Variant & Size Master
  const addVariantMaster = (variant: Omit<VariantSizeMasterRecord, 'id'>) => {
    const id = `var_${Date.now()}`;
    setVariantMasters((prev) => [{ ...variant, id }, ...prev]);
    logAuditEvent('VARIANT_MASTER_CREATED', 'VariantSizeMaster', id, `Created variant ${variant.name} (${variant.sku})`);
  };

  const updateVariantMaster = (variantId: string, patch: Partial<VariantSizeMasterRecord>) => {
    setVariantMasters((prev) => prev.map((v) => (v.id === variantId ? { ...v, ...patch } : v)));
    logAuditEvent('VARIANT_MASTER_UPDATED', 'VariantSizeMaster', variantId, `Updated variant master ${variantId}`);
  };

  const toggleVariantMasterStatus = (variantId: string) => {
    const target = variantMasters.find((v) => v.id === variantId);
    setVariantMasters((prev) => prev.map((v) => (v.id === variantId ? { ...v, isActive: !v.isActive } : v)));
    logAuditEvent('VARIANT_MASTER_TOGGLED', 'VariantSizeMaster', variantId, `Variant ${target?.name} active=${!target?.isActive}`);
  };

  const deleteVariantMaster = (variantId: string) => {
    const target = variantMasters.find((v) => v.id === variantId);
    setVariantMasters((prev) => prev.filter((v) => v.id !== variantId));
    logAuditEvent('VARIANT_MASTER_DELETED', 'VariantSizeMaster', variantId, `Deleted variant ${target?.name || variantId}`);
  };

  // Packaging Master
  const addPackagingMaster = (pkg: Omit<PackagingMasterRecord, 'id'>) => {
    const id = `pkg_${Date.now()}`;
    setPackagingMasters((prev) => [{ ...pkg, id }, ...prev]);
    logAuditEvent('PACKAGING_CREATED', 'PackagingMaster', id, `Created packaging ${pkg.name} (${pkg.code})`);
  };

  const updatePackagingMaster = (pkgId: string, patch: Partial<PackagingMasterRecord>) => {
    setPackagingMasters((prev) => prev.map((p) => (p.id === pkgId ? { ...p, ...patch } : p)));
    logAuditEvent('PACKAGING_UPDATED', 'PackagingMaster', pkgId, `Updated packaging master ${pkgId}`);
  };

  const togglePackagingMasterStatus = (pkgId: string) => {
    const target = packagingMasters.find((p) => p.id === pkgId);
    setPackagingMasters((prev) => prev.map((p) => (p.id === pkgId ? { ...p, isActive: !p.isActive } : p)));
    logAuditEvent('PACKAGING_TOGGLED', 'PackagingMaster', pkgId, `Packaging ${target?.name} active=${!target?.isActive}`);
  };

  const deletePackagingMaster = (pkgId: string) => {
    const target = packagingMasters.find((p) => p.id === pkgId);
    setPackagingMasters((prev) => prev.filter((p) => p.id !== pkgId));
    logAuditEvent('PACKAGING_DELETED', 'PackagingMaster', pkgId, `Deleted packaging ${target?.name || pkgId}`);
  };

  // Product Availability & Stock Configuration Master
  const addAvailabilityConfig = (cfg: Omit<AvailabilityStockConfigRecord, 'id'>) => {
    const id = `avail_${Date.now()}`;
    setAvailabilityConfigs((prev) => [{ ...cfg, id }, ...prev]);
    logAuditEvent('AVAILABILITY_CONFIG_CREATED', 'AvailabilityStockConfig', id, `Created availability rule ${cfg.name} (${cfg.workflowMode})`);
  };

  const updateAvailabilityConfig = (cfgId: string, patch: Partial<AvailabilityStockConfigRecord>) => {
    setAvailabilityConfigs((prev) => prev.map((c) => (c.id === cfgId ? { ...c, ...patch } : c)));
    logAuditEvent('AVAILABILITY_CONFIG_UPDATED', 'AvailabilityStockConfig', cfgId, `Updated availability config ${cfgId}`);
  };

  const toggleAvailabilityConfigStatus = (cfgId: string) => {
    const target = availabilityConfigs.find((c) => c.id === cfgId);
    setAvailabilityConfigs((prev) => prev.map((c) => (c.id === cfgId ? { ...c, isActive: !c.isActive } : c)));
    logAuditEvent('AVAILABILITY_CONFIG_TOGGLED', 'AvailabilityStockConfig', cfgId, `Availability config ${target?.name} active=${!target?.isActive}`);
  };

  const deleteAvailabilityConfig = (cfgId: string) => {
    const target = availabilityConfigs.find((c) => c.id === cfgId);
    setAvailabilityConfigs((prev) => prev.filter((c) => c.id !== cfgId));
    logAuditEvent('AVAILABILITY_CONFIG_DELETED', 'AvailabilityStockConfig', cfgId, `Deleted availability config ${target?.name || cfgId}`);
  };

  // Universal Products Master
  const addProduct = (product: Omit<UniversalProductRecord, 'id' | 'createdAt' | 'updatedAt'>) => {
    const id = `prod_${Date.now()}`;
    const now = new Date().toISOString();
    setProducts((prev) => [{ ...product, id, createdAt: now, updatedAt: now }, ...prev]);
    logAuditEvent('PRODUCT_CREATED', 'Product', id, `Created universal product ${product.name} (${product.vertical}) for ${product.sellerName}`);
  };

  const updateProduct = (productId: string, patch: Partial<UniversalProductRecord>) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === productId ? { ...p, ...patch, updatedAt: new Date().toISOString() } : p))
    );
    logAuditEvent('PRODUCT_UPDATED', 'Product', productId, `Updated product ${productId}`);
  };

  const moderateProduct = (productId: string, status: ProductModerationStatus, notes: string) => {
    const target = products.find((p) => p.id === productId);
    setProducts((prev) =>
      prev.map((p) =>
        p.id === productId
          ? {
              ...p,
              moderationStatus: status,
              moderationNotes: notes,
              isAvailable: status === 'APPROVED' ? true : p.isAvailable,
              updatedAt: new Date().toISOString(),
            }
          : p
      )
    );
    logAuditEvent(
      `PRODUCT_${status}`,
      'Product',
      productId,
      `Product "${target?.name}" moderation set to ${status}. Notes: ${notes}`,
      notes
    );
  };

  const updateProductInventory = (
    productId: string,
    stockQuantity: number,
    variantStocks?: Record<string, number>
  ) => {
    const target = products.find((p) => p.id === productId);
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id !== productId) return p;
        const updatedVariants = variantStocks
          ? p.variants.map((v) =>
              variantStocks[v.id] !== undefined
                ? { ...v, stockQuantity: Math.max(0, variantStocks[v.id]), isAvailable: variantStocks[v.id] > 0 }
                : v
            )
          : p.variants;
        const totalStock =
          p.inventoryMode === 'VARIANT_STOCK' && updatedVariants.length > 0
            ? updatedVariants.reduce((sum, v) => sum + v.stockQuantity, 0)
            : Math.max(0, stockQuantity);
        return {
          ...p,
          stockQuantity: totalStock,
          variants: updatedVariants,
          isAvailable: totalStock > 0 || p.inventoryMode === 'PREPARED_FOOD' || p.inventoryMode === 'MADE_TO_ORDER',
          updatedAt: new Date().toISOString(),
        };
      })
    );
    logAuditEvent('INVENTORY_UPDATED', 'Product', productId, `Updated stock for "${target?.name}" to ${stockQuantity}`);
  };

  const toggleProductAvailability = (productId: string) => {
    const target = products.find((p) => p.id === productId);
    setProducts((prev) =>
      prev.map((p) =>
        p.id === productId ? { ...p, isAvailable: !p.isAvailable, updatedAt: new Date().toISOString() } : p
      )
    );
    logAuditEvent('PRODUCT_AVAILABILITY_TOGGLED', 'Product', productId, `Toggled availability for "${target?.name}" to ${!target?.isAvailable}`);
  };

  // Service Areas & Routes
  const toggleServiceAreaStatus = (areaId: string) => {
    const area = serviceAreas.find((a) => a.id === areaId);
    setServiceAreas((prev) =>
      prev.map((a) => (a.id === areaId ? { ...a, isActive: !a.isActive } : a))
    );
    logAuditEvent('SERVICE_AREA_TOGGLED', 'VillageServiceArea', areaId, `Village ${area?.name} active status set to ${!area?.isActive}`);
  };

  const addServiceArea = (
    newArea: Omit<VillageServiceAreaRecord, 'id' | 'activeSellersCount' | 'landmarksCount'>
  ) => {
    const id = `v-${newArea.name.toLowerCase().replace(/\s+/g, '-')}-${Date.now().toString().slice(-3)}`;
    const landmarks = newArea.landmarks?.length ? newArea.landmarks : ['Main Chowk', 'Primary School'];
    const record: VillageServiceAreaRecord = {
      ...newArea,
      id,
      activeSellersCount: 0,
      landmarks,
      landmarksCount: landmarks.length,
    };
    setServiceAreas((prev) => [...prev, record]);
    logAuditEvent('SERVICE_AREA_ADDED', 'VillageServiceArea', id, `Added village ${newArea.name} (${newArea.postalCode})`);
  };

  const updateServiceArea = (areaId: string, patch: Partial<VillageServiceAreaRecord>) => {
    setServiceAreas((prev) =>
      prev.map((a) => {
        if (a.id !== areaId) return a;
        const landmarks = patch.landmarks !== undefined ? patch.landmarks : a.landmarks;
        return {
          ...a,
          ...patch,
          landmarks,
          landmarksCount: landmarks ? landmarks.length : a.landmarksCount,
        };
      })
    );
    logAuditEvent('SERVICE_AREA_UPDATED', 'VillageServiceArea', areaId, `Updated village service area ${areaId}`);
  };

  const updateDeliveryFee = (areaId: string, baseFeePaise: number) => {
    setServiceAreas((prev) =>
      prev.map((a) => (a.id === areaId ? { ...a, baseDeliveryFeePaise: baseFeePaise } : a))
    );
    logAuditEvent('DELIVERY_FEE_UPDATED', 'VillageServiceArea', areaId, `Base delivery fee updated to ${baseFeePaise} paise for ${areaId}`);
  };

  const addInterVillageRoute = (route: Omit<InterVillageRouteRecord, 'id'>) => {
    const id = `rt_${Date.now()}`;
    setInterVillageRoutes((prev) => [...prev, { ...route, id }]);
    logAuditEvent('INTER_VILLAGE_ROUTE_ADDED', 'InterVillageRoute', id, `Added route ${route.fromVillageName} -> ${route.toVillageName}`);
  };

  const updateInterVillageRoute = (routeId: string, patch: Partial<InterVillageRouteRecord>) => {
    setInterVillageRoutes((prev) => prev.map((r) => (r.id === routeId ? { ...r, ...patch } : r)));
    logAuditEvent('INTER_VILLAGE_ROUTE_UPDATED', 'InterVillageRoute', routeId, `Updated route ${routeId}`);
  };

  const deleteInterVillageRoute = (routeId: string) => {
    setInterVillageRoutes((prev) => prev.filter((r) => r.id !== routeId));
    logAuditEvent('INTER_VILLAGE_ROUTE_DELETED', 'InterVillageRoute', routeId, `Removed inter-village route ${routeId}`);
  };

  // Fee Rules
  const togglePilotShadowMode = (ruleId: string) => {
    const rule = feeRules.find((r) => r.id === ruleId);
    setFeeRules((prev) =>
      prev.map((r) => (r.id === ruleId ? { ...r, isPilotShadowMode: !r.isPilotShadowMode } : r))
    );
    logAuditEvent('FEE_SHADOW_MODE_TOGGLED', 'FeeRule', ruleId, `Rule ${rule?.name} shadow mode set to ${!rule?.isPilotShadowMode}`);
  };

  const createFeeRule = (rule: Omit<FeeRuleRecord, 'id' | 'status'>) => {
    const id = `fee_${Date.now()}`;
    setFeeRules((prev) => [{ ...rule, id, status: 'ACTIVE' }, ...prev]);
    logAuditEvent('FEE_RULE_CREATED', 'FeeRule', id, `Created fee rule ${rule.name}: ${rule.commissionBps} bps`);
  };

  const updateFeeRule = (ruleId: string, patch: Partial<FeeRuleRecord>) => {
    setFeeRules((prev) => prev.map((r) => (r.id === ruleId ? { ...r, ...patch } : r)));
    logAuditEvent('FEE_RULE_UPDATED', 'FeeRule', ruleId, `Updated fee rule ${ruleId}`);
  };

  const deprecateFeeRule = (ruleId: string) => {
    const rule = feeRules.find((r) => r.id === ruleId);
    setFeeRules((prev) =>
      prev.map((r) => (r.id === ruleId ? { ...r, status: r.status === 'ACTIVE' ? 'DEPRECATED' : 'ACTIVE' } : r))
    );
    logAuditEvent('FEE_RULE_STATUS_CHANGED', 'FeeRule', ruleId, `Toggled status for rule ${rule?.name || ruleId}`);
  };

  // Offers & Coupons
  const addOffer = (offer: Omit<OfferCouponRecord, 'id' | 'usedCount'>) => {
    const id = `off_${Date.now()}`;
    setOffers((prev) => [{ ...offer, id, code: offer.code.trim().toUpperCase(), usedCount: 0 }, ...prev]);
    logAuditEvent('OFFER_CREATED', 'OfferCoupon', id, `Created coupon ${offer.code.toUpperCase()} (${offer.title})`);
  };

  const updateOffer = (offerId: string, patch: Partial<OfferCouponRecord>) => {
    setOffers((prev) => prev.map((o) => (o.id === offerId ? { ...o, ...patch } : o)));
    logAuditEvent('OFFER_UPDATED', 'OfferCoupon', offerId, `Updated offer ${offerId}`);
  };

  const toggleOfferStatus = (offerId: string) => {
    const target = offers.find((o) => o.id === offerId);
    setOffers((prev) => prev.map((o) => (o.id === offerId ? { ...o, isActive: !o.isActive } : o)));
    logAuditEvent('OFFER_TOGGLED', 'OfferCoupon', offerId, `Coupon ${target?.code} set to ${!target?.isActive}`);
  };

  const deleteOffer = (offerId: string) => {
    const target = offers.find((o) => o.id === offerId);
    setOffers((prev) => prev.filter((o) => o.id !== offerId));
    logAuditEvent('OFFER_DELETED', 'OfferCoupon', offerId, `Deleted coupon ${target?.code || offerId}`);
  };

  // Support Cases
  const updateSupportCaseStatus = (
    caseId: string,
    status: SupportCaseRecord['status'],
    resolutionNotes: string,
    approvedRefundPaise?: number
  ) => {
    setSupportCases((prev) =>
      prev.map((c) =>
        c.id === caseId
          ? {
              ...c,
              status,
              resolutionNotes,
              approvedRefundPaise: approvedRefundPaise !== undefined ? approvedRefundPaise : c.approvedRefundPaise,
              updatedAt: new Date().toISOString(),
            }
          : c
      )
    );
    logAuditEvent(
      `SUPPORT_CASE_${status}`,
      'SupportCase',
      caseId,
      `Support case ${caseId} marked as ${status}. Resolution: ${resolutionNotes}`,
      resolutionNotes,
      approvedRefundPaise !== undefined ? { approvedRefundPaise } : undefined
    );
  };

  // Platform Settings
  const updatePlatformSettings = (patch: Partial<PlatformSettingsRecord>) => {
    setPlatformSettings((prev) => ({ ...prev, ...patch }));
    logAuditEvent('PLATFORM_SETTINGS_UPDATED', 'PlatformSettings', 'global', 'Updated global platform settings', undefined, patch as Record<string, unknown>);
  };

  // Audit Log Maintenance
  const clearAuditLogs = () => {
    const freshLog: AuditLogRecord = {
      id: `aud_${Date.now()}`,
      actor: currentAdmin.name,
      actorRole: currentAdmin.role,
      actionType: 'AUDIT_LOGS_PURGED',
      targetEntity: 'AuditLog',
      targetId: 'all',
      timestamp: new Date().toISOString(),
      ipAddress: '192.168.1.104',
      details: 'Audit trail purged and archived by Super Admin authorization.',
      reason: 'Administrative purge',
    };
    setAuditLogs([freshLog]);
  };

  // --- EXTENDED ENTERPRISE ADMIN ACTIONS ---
  const toggleCustomerBlock = (customerId: string, block: boolean, reason: string) => {
    setCustomers((prev) =>
      prev.map((c) =>
        c.id === customerId
          ? { ...c, status: block ? 'BLOCKED' : 'ACTIVE', blockReason: block ? reason : undefined }
          : c
      )
    );
    logAuditEvent(
      block ? 'CUSTOMER_BLOCKED' : 'CUSTOMER_UNBLOCKED',
      'Customer',
      customerId,
      `${block ? 'Blocked' : 'Restored'} customer account ${customerId}`,
      reason
    );
  };

  const updateCustomerNotes = (customerId: string, notes: string) => {
    setCustomers((prev) => prev.map((c) => (c.id === customerId ? { ...c, adminNotes: notes } : c)));
    logAuditEvent('CUSTOMER_NOTES_UPDATED', 'Customer', customerId, 'Updated internal admin notes on buyer profile.');
  };

  const settleSellerPayout = (
    payoutId: string,
    payload: { paymentMode: SellerPayoutRecord['paymentMode']; utrNumber: string; notes?: string }
  ) => {
    const nowIso = new Date().toISOString();
    setPayouts((prev) =>
      prev.map((p) =>
        p.id === payoutId
          ? {
              ...p,
              status: 'SETTLED',
              paymentMode: payload.paymentMode,
              utrNumber: payload.utrNumber,
              notes: payload.notes || p.notes,
              settledAt: nowIso,
              settlementDate: nowIso,
              history: [
                ...(p.history || []),
                {
                  status: 'SETTLED',
                  note: `Settled via ${payload.paymentMode} (UTR: ${payload.utrNumber})${
                    payload.notes ? ` — ${payload.notes}` : ''
                  }`,
                  timestamp: nowIso,
                  actor: currentAdmin.name,
                },
              ],
            }
          : p
      )
    );
    logAuditEvent(
      'SELLER_PAYOUT_SETTLED',
      'SellerPayout',
      payoutId,
      `Settled payout via ${payload.paymentMode} (Ref: ${payload.utrNumber})`,
      payload.notes
    );
  };

  const markPayoutProcessing = (payoutId: string) => {
    const nowIso = new Date().toISOString();
    setPayouts((prev) =>
      prev.map((p) =>
        p.id === payoutId
          ? {
              ...p,
              status: 'PROCESSING',
              history: [
                ...(p.history || []),
                {
                  status: 'PROCESSING',
                  note: 'Moved settlement batch to active bank/UPI processing queue.',
                  timestamp: nowIso,
                  actor: currentAdmin.name,
                },
              ],
            }
          : p
      )
    );
    logAuditEvent('SELLER_PAYOUT_PROCESSING', 'SellerPayout', payoutId, 'Moved payout batch to processing queue.');
  };

  const updateRefundStatus = (
    refundId: string,
    status: RefundLedgerRecord['status'],
    reason?: string
  ) => {
    const nowIso = new Date().toISOString();
    setRefundLedger((prev) =>
      prev.map((r) =>
        r.id === refundId
          ? {
              ...r,
              status,
              rejectionReason: status === 'REJECTED' ? reason || r.rejectionReason : r.rejectionReason,
              processedAt:
                status === 'PROCESSED' || status === 'REJECTED' ? nowIso : r.processedAt,
              history: [
                ...(r.history || []),
                {
                  status,
                  note:
                    reason ||
                    (status === 'PROCESSED'
                      ? 'Approved and marked completed by Finance Admin.'
                      : status === 'REJECTED'
                      ? 'Refund request rejected.'
                      : `Refund status updated to ${status}.`),
                  timestamp: nowIso,
                  actor: currentAdmin.name,
                },
              ],
            }
          : r
      )
    );
    logAuditEvent(
      'REFUND_STATUS_UPDATED',
      'Refund',
      refundId,
      `Updated refund record status to ${status}`,
      reason
    );
  };

  const addCmsBanner = (banner: Omit<CmsBannerRecord, 'id'>) => {
    const created: CmsBannerRecord = { ...banner, id: `bnr_${Date.now()}` };
    setCmsBanners((prev) => [created, ...prev]);
    logAuditEvent('CMS_BANNER_CREATED', 'CmsBanner', created.id, `Created banner "${created.title}" (${created.placement})`);
  };

  const updateCmsBanner = (bannerId: string, patch: Partial<CmsBannerRecord>) => {
    setCmsBanners((prev) => prev.map((b) => (b.id === bannerId ? { ...b, ...patch } : b)));
    logAuditEvent('CMS_BANNER_UPDATED', 'CmsBanner', bannerId, `Updated CMS banner ${bannerId}`);
  };

  const toggleCmsBannerStatus = (bannerId: string) => {
    setCmsBanners((prev) => prev.map((b) => (b.id === bannerId ? { ...b, isActive: !b.isActive } : b)));
    logAuditEvent('CMS_BANNER_TOGGLED', 'CmsBanner', bannerId, 'Toggled homepage banner visibility.');
  };

  const deleteCmsBanner = (bannerId: string) => {
    setCmsBanners((prev) => prev.filter((b) => b.id !== bannerId));
    logAuditEvent('CMS_BANNER_DELETED', 'CmsBanner', bannerId, 'Deleted CMS promotional banner.');
  };

  const toggleFeaturedSeller = (sellerId: string) => {
    setFeaturedSellerIds((prev) => {
      const exists = prev.includes(sellerId);
      logAuditEvent(
        exists ? 'SELLER_UNFEATURED' : 'SELLER_FEATURED',
        'Seller',
        sellerId,
        exists ? 'Removed shop from homepage Featured Stores.' : 'Pinned shop to homepage Featured Stores.'
      );
      return exists ? prev.filter((id) => id !== sellerId) : [...prev, sellerId];
    });
  };

  const updateCmsPolicy = (
    policyId: string,
    patch: Pick<CmsPolicyPageRecord, 'version' | 'summary' | 'content'>
  ) => {
    setCmsPolicies((prev) =>
      prev.map((p) =>
        p.id === policyId
          ? { ...p, ...patch, updatedAt: new Date().toISOString().split('T')[0], updatedBy: currentAdmin.name }
          : p
      )
    );
    logAuditEvent('CMS_POLICY_UPDATED', 'CmsPolicy', policyId, `Published policy revision ${patch.version}`);
  };

  const moderateReview = (reviewId: string, status: CustomerReviewRecord['status'], notes?: string) => {
    setReviews((prev) =>
      prev.map((r) => (r.id === reviewId ? { ...r, status, moderationNotes: notes || r.moderationNotes } : r))
    );
    logAuditEvent('REVIEW_MODERATED', 'CustomerReview', reviewId, `Changed review status to ${status}`, notes);
  };

  const deleteReview = (reviewId: string) => {
    setReviews((prev) => prev.filter((r) => r.id !== reviewId));
    logAuditEvent('REVIEW_DELETED', 'CustomerReview', reviewId, 'Removed abusive/spam customer review.');
  };

  const sendBroadcast = (
    broadcast: Omit<BroadcastMessageRecord, 'id' | 'sentAt' | 'createdBy' | 'deliveredCount'>
  ) => {
    const created: BroadcastMessageRecord = {
      ...broadcast,
      id: `brd_${Date.now()}`,
      deliveredCount: broadcast.status === 'SENT' ? Math.max(1, Math.round(broadcast.estimatedReach * 0.97)) : 0,
      sentAt: new Date().toISOString(),
      createdBy: currentAdmin.name,
    };
    setBroadcasts((prev) => [created, ...prev]);
    logAuditEvent(
      'BROADCAST_DISPATCHED',
      'Broadcast',
      created.id,
      `${created.status === 'SENT' ? 'Sent' : 'Scheduled'} "${created.title}" via ${created.channel} to ${created.audience}`
    );
  };

  const deleteBroadcast = (broadcastId: string) => {
    setBroadcasts((prev) => prev.filter((b) => b.id !== broadcastId));
    logAuditEvent('BROADCAST_DELETED', 'Broadcast', broadcastId, 'Deleted broadcast entry.');
  };

  const addTaxSlab = (slab: Omit<TaxSlabRecord, 'id'>) => {
    const created: TaxSlabRecord = { ...slab, id: `tax_${Date.now()}` };
    setTaxSlabs((prev) => [created, ...prev]);
    logAuditEvent('TAX_SLAB_CREATED', 'TaxSlab', created.id, `Added ${created.gstPercent}% GST slab "${created.name}"`);
  };

  const updateTaxSlab = (slabId: string, patch: Partial<TaxSlabRecord>) => {
    setTaxSlabs((prev) => prev.map((t) => (t.id === slabId ? { ...t, ...patch } : t)));
    logAuditEvent('TAX_SLAB_UPDATED', 'TaxSlab', slabId, `Updated GST slab ${slabId}`);
  };

  const toggleTaxSlabStatus = (slabId: string) => {
    setTaxSlabs((prev) => prev.map((t) => (t.id === slabId ? { ...t, isActive: !t.isActive } : t)));
    logAuditEvent('TAX_SLAB_TOGGLED', 'TaxSlab', slabId, 'Toggled GST slab status.');
  };

  const deleteTaxSlab = (slabId: string) => {
    setTaxSlabs((prev) => prev.filter((t) => t.id !== slabId));
    logAuditEvent('TAX_SLAB_DELETED', 'TaxSlab', slabId, 'Deleted GST slab.');
  };

  const addCancellationRule = (rule: Omit<CancellationPolicyRuleRecord, 'id'>) => {
    const created: CancellationPolicyRuleRecord = { ...rule, id: `can_${Date.now()}` };
    setCancellationRules((prev) => [created, ...prev]);
    logAuditEvent('CANCELLATION_RULE_CREATED', 'CancellationPolicy', created.id, `Added rule "${created.code}"`);
  };

  const updateCancellationRule = (ruleId: string, patch: Partial<CancellationPolicyRuleRecord>) => {
    setCancellationRules((prev) => prev.map((r) => (r.id === ruleId ? { ...r, ...patch } : r)));
    logAuditEvent('CANCELLATION_RULE_UPDATED', 'CancellationPolicy', ruleId, `Updated cancellation rule ${ruleId}`);
  };

  const toggleCancellationRuleStatus = (ruleId: string) => {
    setCancellationRules((prev) => prev.map((r) => (r.id === ruleId ? { ...r, isActive: !r.isActive } : r)));
    logAuditEvent('CANCELLATION_RULE_TOGGLED', 'CancellationPolicy', ruleId, 'Toggled cancellation rule.');
  };

  const deleteCancellationRule = (ruleId: string) => {
    setCancellationRules((prev) => prev.filter((r) => r.id !== ruleId));
    logAuditEvent('CANCELLATION_RULE_DELETED', 'CancellationPolicy', ruleId, 'Deleted cancellation rule.');
  };

  const addDeliveryPartner = (
    partner: Omit<DeliveryPartnerRecord, 'id' | 'completedDeliveries' | 'rating' | 'joinedAt'>
  ) => {
    const created: DeliveryPartnerRecord = {
      ...partner,
      id: `rid_${Date.now()}`,
      completedDeliveries: 0,
      rating: 5.0,
      joinedAt: new Date().toISOString().split('T')[0],
    };
    setDeliveryPartners((prev) => [created, ...prev]);
    logAuditEvent('DELIVERY_PARTNER_ADDED', 'DeliveryPartner', created.id, `Registered delivery partner "${created.name}" (${created.villageName})`);
  };

  const updateDeliveryPartner = (partnerId: string, patch: Partial<DeliveryPartnerRecord>) => {
    setDeliveryPartners((prev) => prev.map((d) => (d.id === partnerId ? { ...d, ...patch } : d)));
    logAuditEvent('DELIVERY_PARTNER_UPDATED', 'DeliveryPartner', partnerId, `Updated delivery partner ${partnerId}`);
  };

  const deleteDeliveryPartner = (partnerId: string) => {
    setDeliveryPartners((prev) => prev.filter((d) => d.id !== partnerId));
    logAuditEvent('DELIVERY_PARTNER_DELETED', 'DeliveryPartner', partnerId, 'Removed delivery partner from fleet registry.');
  };

  const resetAdminData = () => {
    Object.values(STORAGE_KEYS).forEach((k) => {
      try { localStorage.removeItem(k); } catch {}
    });
    setAdminUsers(INITIAL_ADMIN_USERS);
    setCurrentAdminId(INITIAL_ADMIN_USERS[0].id);
    setRolePermissions(INITIAL_ROLE_PERMISSIONS);
    setApplications(INITIAL_APPLICATIONS);
    setSellers(INITIAL_SELLERS);
    setVerticalConfigs(INITIAL_VERTICALS);
    setCategories(INITIAL_CATEGORIES);
    setAttributes(INITIAL_ATTRIBUTES);
    setUnits(INITIAL_UNITS);
    setOptionGroups(INITIAL_OPTION_GROUPS);
    setBrands(INITIAL_BRANDS);
    setVariantMasters(INITIAL_VARIANT_MASTERS);
    setPackagingMasters(INITIAL_PACKAGING_MASTERS);
    setAvailabilityConfigs(INITIAL_AVAILABILITY_CONFIGS);
    setProducts(INITIAL_PRODUCTS);
    setServiceAreas(INITIAL_SERVICE_AREAS);
    setInterVillageRoutes(INITIAL_INTER_VILLAGE_ROUTES);
    setFeeRules(INITIAL_FEE_RULES);
    setOffers(INITIAL_OFFERS);
    setSupportCases(INITIAL_SUPPORT_CASES);
    setPlatformSettings(INITIAL_PLATFORM_SETTINGS);
    setCustomers(INITIAL_CUSTOMERS);
    setPayouts(INITIAL_PAYOUTS);
    setPaymentTransactions(INITIAL_PAYMENT_TRANSACTIONS);
    setRefundLedger(INITIAL_REFUNDS);
    setCmsBanners(INITIAL_CMS_BANNERS);
    setFeaturedSellerIds(['sel_1', 'sel_2']);
    setCmsPolicies(INITIAL_CMS_POLICIES);
    setReviews(INITIAL_REVIEWS);
    setBroadcasts(INITIAL_BROADCASTS);
    setTaxSlabs(INITIAL_TAX_SLABS);
    setCancellationRules(INITIAL_CANCELLATION_RULES);
    setDeliveryPartners(INITIAL_DELIVERY_PARTNERS);
    setAuditLogs(INITIAL_AUDIT_LOGS);
  };

  const pendingApplicationsCount = applications.filter((a) => a.status === 'PENDING_REVIEW').length;
  const pendingProductsCount = products.filter((p) => p.moderationStatus === 'PENDING_REVIEW').length;
  const openSupportCasesCount = supportCases.filter(
    (c) => c.status === 'OPEN' || c.status === 'INVESTIGATING'
  ).length;
  const pendingPayoutsCount = payouts.filter((p) => p.status !== 'SETTLED').length;
  const flaggedReviewsCount = reviews.filter((r) => r.status === 'FLAGGED').length;

  return (
    <AdminContext.Provider
      value={{
        adminUsers,
        currentAdmin,
        switchActiveAdmin,
        addAdminUser,
        updateAdminUser,
        rolePermissions,
        updateRolePermission,
        hasPermission,
        applications,
        pendingApplicationsCount,
        reviewApplication,
        toggleApplicationDocVerified,
        sellers,
        updateSellerStatus,
        updateSellerConfig,
        updateSellerKycDocument,
        requestSellerKycChanges,
        verticalConfigs,
        toggleVerticalEnabled,
        addVertical,
        updateVertical,
        categories,
        toggleCategoryStatus,
        addCategory,
        updateCategory,
        deleteCategory,
        attributes,
        addAttribute,
        updateAttribute,
        toggleAttributeStatus,
        deleteAttribute,
        units,
        addUnit,
        updateUnit,
        toggleUnitStatus,
        deleteUnit,
        optionGroups,
        addOptionGroup,
        updateOptionGroup,
        duplicateOptionGroup,
        toggleOptionGroupStatus,
        deleteOptionGroup,
        brands,
        addBrand,
        updateBrand,
        toggleBrandVerified,
        toggleBrandStatus,
        deleteBrand,
        variantMasters,
        addVariantMaster,
        updateVariantMaster,
        toggleVariantMasterStatus,
        deleteVariantMaster,
        packagingMasters,
        addPackagingMaster,
        updatePackagingMaster,
        togglePackagingMasterStatus,
        deletePackagingMaster,
        availabilityConfigs,
        addAvailabilityConfig,
        updateAvailabilityConfig,
        toggleAvailabilityConfigStatus,
        deleteAvailabilityConfig,
        products,
        pendingProductsCount,
        addProduct,
        updateProduct,
        moderateProduct,
        updateProductInventory,
        toggleProductAvailability,
        serviceAreas,
        toggleServiceAreaStatus,
        addServiceArea,
        updateServiceArea,
        updateDeliveryFee,
        interVillageRoutes,
        addInterVillageRoute,
        updateInterVillageRoute,
        deleteInterVillageRoute,
        feeRules,
        togglePilotShadowMode,
        createFeeRule,
        updateFeeRule,
        deprecateFeeRule,
        offers,
        addOffer,
        updateOffer,
        toggleOfferStatus,
        deleteOffer,
        supportCases,
        openSupportCasesCount,
        updateSupportCaseStatus,
        platformSettings,
        updatePlatformSettings,
        customers,
        toggleCustomerBlock,
        updateCustomerNotes,
        payouts,
        pendingPayoutsCount,
        settleSellerPayout,
        markPayoutProcessing,
        paymentTransactions,
        refundLedger,
        updateRefundStatus,
        cmsBanners,
        addCmsBanner,
        updateCmsBanner,
        toggleCmsBannerStatus,
        deleteCmsBanner,
        featuredSellerIds,
        toggleFeaturedSeller,
        cmsPolicies,
        updateCmsPolicy,
        reviews,
        flaggedReviewsCount,
        moderateReview,
        deleteReview,
        broadcasts,
        sendBroadcast,
        deleteBroadcast,
        taxSlabs,
        addTaxSlab,
        updateTaxSlab,
        toggleTaxSlabStatus,
        deleteTaxSlab,
        cancellationRules,
        addCancellationRule,
        updateCancellationRule,
        toggleCancellationRuleStatus,
        deleteCancellationRule,
        deliveryPartners,
        addDeliveryPartner,
        updateDeliveryPartner,
        deleteDeliveryPartner,
        auditLogs,
        logAuditEvent,
        clearAuditLogs,
        resetAdminData,
      }}
    >
      {children}
    </AdminContext.Provider>
  );
};

export const useAdmin = () => {
  const context = useContext(AdminContext);
  if (!context) {
    throw new Error('useAdmin must be used within an AdminProvider');
  }
  return context;
};
