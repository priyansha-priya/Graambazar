/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import type { Order, OrderEvent, OrderItemSnapshot, OrderStatus, PaymentMethod, PaymentStatus } from '../types/order';
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
  deleteProduct: (productId: string) => void;
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
  sellerCreateProduct: (
    sellerCode: string,
    product: Omit<UniversalProductRecord, 'id' | 'createdAt' | 'updatedAt'>
  ) => void;
  sellerUpdateProduct: (
    sellerCode: string,
    productId: string,
    patch: Partial<UniversalProductRecord>
  ) => void;
  sellerUpdateProductInventory: (
    sellerCode: string,
    productId: string,
    stockQuantity: number,
    variantStocks?: Record<string, number>
  ) => void;
  sellerToggleProductAvailability: (sellerCode: string, productId: string) => void;

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

  // Global Platform Orders (PostgreSQL /api/admin/orders) & API Feedback
  adminOrders: Order[];
  refreshAdminOrders: () => Promise<void>;
  lastApiError: string | null;
  clearApiError: () => void;
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

// Catalog Masters, sellers, applications, universal products, service areas, routes, delivery partners,
// audit logs, fee rules, offers, tax slabs, cancellation rules, payouts, transactions, and refunds
// are hydrated directly from PostgreSQL.

const DEFAULT_PLATFORM_SETTINGS: PlatformSettingsRecord = {
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
  maintenanceMessage: '',
};

// Audit logs are stored and queried from PostgreSQL (/api/admin/audit-logs).

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
  const { firebaseUser, getAuthHeaders } = useAuth();

  // Hydrated from PostgreSQL (/api/admin/rbac/summary); only active persona selector is stored locally
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>(INITIAL_ADMIN_USERS);
  const [currentAdminId, setCurrentAdminId] = useState<string>(() =>
    loadStored(STORAGE_KEYS.CURRENT_ADMIN_ID, INITIAL_ADMIN_USERS[0].id)
  );
  const [rolePermissions, setRolePermissions] = useState<RolePermissionMatrix>(
    INITIAL_ROLE_PERMISSIONS
  );
  // Hydrated directly from PostgreSQL (no localStorage or client-side mock fallback)
  const [applications, setApplications] = useState<SellerApplication[]>([]);
  const [sellers, setSellers] = useState<MasterSellerRecord[]>([]);
  const [verticalConfigs, setVerticalConfigs] = useState<VerticalConfigRecord[]>([]);
  const [categories, setCategories] = useState<CategoryRecord[]>([]);
  const [attributes, setAttributes] = useState<AttributeMasterRecord[]>([]);
  const [units, setUnits] = useState<UnitMasterRecord[]>([]);
  const [optionGroups, setOptionGroups] = useState<OptionGroupMasterRecord[]>([]);
  const [brands, setBrands] = useState<BrandMasterRecord[]>([]);
  const [variantMasters, setVariantMasters] = useState<VariantSizeMasterRecord[]>([]);
  const [packagingMasters, setPackagingMasters] = useState<PackagingMasterRecord[]>([]);
  const [availabilityConfigs, setAvailabilityConfigs] = useState<AvailabilityStockConfigRecord[]>([]);
  const [products, setProducts] = useState<UniversalProductRecord[]>([]);
  const [serviceAreas, setServiceAreas] = useState<VillageServiceAreaRecord[]>([]);
  const [interVillageRoutes, setInterVillageRoutes] = useState<InterVillageRouteRecord[]>([]);
  const [feeRules, setFeeRules] = useState<FeeRuleRecord[]>([]);
  const [offers, setOffers] = useState<OfferCouponRecord[]>([]);
  const [supportCases, setSupportCases] = useState<SupportCaseRecord[]>([]);
  const [platformSettings, setPlatformSettings] = useState<PlatformSettingsRecord>(
    DEFAULT_PLATFORM_SETTINGS
  );
  const [customers, setCustomers] = useState<AdminCustomerRecord[]>([]);
  const [payouts, setPayouts] = useState<SellerPayoutRecord[]>([]);
  const [paymentTransactions, setPaymentTransactions] = useState<PaymentTransactionRecord[]>([]);
  const [refundLedger, setRefundLedger] = useState<RefundLedgerRecord[]>([]);
  const [cmsBanners, setCmsBanners] = useState<CmsBannerRecord[]>([]);
  const [featuredSellerIds, setFeaturedSellerIds] = useState<string[]>([]);
  const [cmsPolicies, setCmsPolicies] = useState<CmsPolicyPageRecord[]>([]);
  const [reviews, setReviews] = useState<CustomerReviewRecord[]>([]);
  const [broadcasts, setBroadcasts] = useState<BroadcastMessageRecord[]>([]);
  const [taxSlabs, setTaxSlabs] = useState<TaxSlabRecord[]>([]);
  const [cancellationRules, setCancellationRules] = useState<CancellationPolicyRuleRecord[]>([]);
  const [deliveryPartners, setDeliveryPartners] = useState<DeliveryPartnerRecord[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogRecord[]>([]);
  const [adminOrders, setAdminOrders] = useState<Order[]>([]);
  const [lastApiError, setLastApiError] = useState<string | null>(null);

  const clearApiError = useCallback(() => setLastApiError(null), []);

  const currentAdmin = adminUsers.find((u) => u.id === currentAdminId) || adminUsers[0] || INITIAL_ADMIN_USERS[0];

  const mapDbAdminOrder = useCallback((raw: Record<string, unknown>): Order => {
    const id = String(raw.orderNumber || raw.id || '');
    const itemsRaw = Array.isArray(raw.items) ? (raw.items as Record<string, unknown>[]) : [];
    const historyRaw = Array.isArray(raw.statusHistory)
      ? (raw.statusHistory as Record<string, unknown>[])
      : [];

    const items: OrderItemSnapshot[] = itemsRaw.map((item, idx) => ({
      id: String(item.id || `${id}_item_${idx}`),
      productId: String(item.productId || item.sku || item.id || `prod_${idx}`),
      productName: String(item.productName || 'Item'),
      catalogueType: String(item.catalogueType || 'GROCERY'),
      sku: typeof item.sku === 'string' ? item.sku : undefined,
      unitPricePaise: Number(item.unitPricePaise) || 0,
      requestedQuantity: Number(item.requestedQuantity) || 1,
      requestedUnitLabel: String(item.requestedUnitLabel || 'unit'),
      lineTotalPaise: Number(item.lineTotalPaise) || 0,
      customerNote: typeof item.customerNote === 'string' ? item.customerNote : undefined,
    }));

    const statusHistory: OrderEvent[] = historyRaw.map((h, idx) => ({
      id: `${id}_evt_${idx}`,
      orderId: id,
      fromStatus: (String(h.fromStatus || 'placed') as OrderStatus),
      toStatus: (String(h.toStatus || raw.status || 'placed') as OrderStatus),
      actorRole: String(h.actorRole || 'SYSTEM'),
      reason: typeof h.reason === 'string' ? h.reason : undefined,
      timestamp: String(h.timestamp || raw.createdAt || new Date().toISOString()),
    }));

    return {
      id,
      orderNumber: id,
      customerId: String(raw.customerUid || 'customer'),
      customerName: String(raw.customerName || 'Customer'),
      customerPhone: String(raw.customerPhone || ''),
      sellerId: String(raw.sellerId || ''),
      sellerName: String(raw.sellerName || 'GramBazaar Store'),
      sellerPhone: '',
      villageId: String(raw.villageId || 'rampur'),
      fulfilmentMode: raw.fulfilmentMode === 'PICKUP' ? 'PICKUP' : 'DELIVERY',
      deliveryAddress:
        raw.deliveryAddress && typeof raw.deliveryAddress === 'object'
          ? (raw.deliveryAddress as Order['deliveryAddress'])
          : undefined,
      deliveryNote: typeof raw.deliveryNote === 'string' ? raw.deliveryNote : undefined,
      status: String(raw.status || 'placed') as OrderStatus,
      statusHistory,
      items,
      paymentMethod: (String(raw.paymentMethod || 'COD') as PaymentMethod),
      paymentStatus: (String(raw.paymentStatus || 'pending') as PaymentStatus),
      itemSubtotalPaise: Number(raw.itemSubtotalPaise) || 0,
      deliveryFeePaise: Number(raw.deliveryFeePaise) || 0,
      packagingFeePaise: Number(raw.packagingFeePaise) || 0,
      platformFeePaise: Number(raw.platformFeePaise) || 0,
      totalPaise: Number(raw.totalPaise) || 0,
      cancellation:
        raw.cancellation && typeof raw.cancellation === 'object'
          ? (raw.cancellation as Order['cancellation'])
          : undefined,
      returnInfo:
        raw.returnInfo && typeof raw.returnInfo === 'object'
          ? (raw.returnInfo as Order['returnInfo'])
          : undefined,
      refundInfo:
        raw.refundInfo && typeof raw.refundInfo === 'object'
          ? (raw.refundInfo as Order['refundInfo'])
          : undefined,
      createdAt: String(raw.createdAt || new Date().toISOString()),
      updatedAt: String(raw.updatedAt || raw.createdAt || new Date().toISOString()),
    };
  }, []);

  const adminRequest = useCallback(
    async <T,>(path: string, init: RequestInit = {}): Promise<T | null> => {
      const method = (init.method || 'GET').toUpperCase();
      try {
        const authHeaders = await getAuthHeaders();
        if (!authHeaders) {
          if (method !== 'GET') {
            setLastApiError('Changes save karne ke liye pehle Admin Google account se sign in karein.');
          }
          return null;
        }
        const headers: Record<string, string> = {
          ...authHeaders,
          ...(init.body ? { 'Content-Type': 'application/json' } : {}),
          ...((init.headers as Record<string, string>) || {}),
        };
        const res = await fetch(path, { ...init, headers });
        if (!res.ok) {
          let serverMessage = '';
          try {
            const errPayload = (await res.json()) as { error?: string };
            serverMessage = errPayload.error || '';
          } catch {
            // Non-JSON error body
          }
          if (res.status === 401) {
            setLastApiError('Session expired ya sign-in zaroori hai. Please Admin Google account se sign in karein.');
          } else if (res.status === 403) {
            setLastApiError('Is action ke liye Admin role permission chahiye.');
          } else if (method !== 'GET') {
            setLastApiError(serverMessage || 'Changes save nahi ho paaye. Please try again.');
          }
          console.error(`Admin API ${method} ${path} failed (${res.status})`);
          return null;
        }
        if (method !== 'GET') {
          setLastApiError(null);
        }
        return (await res.json()) as T;
      } catch (error) {
        if (method !== 'GET') {
          setLastApiError('Server se connection nahi ho paaya. Please try again.');
        }
        console.error(`Admin API request error for ${path}:`, error);
        return null;
      }
    },
    [getAuthHeaders]
  );

  const refreshAdminOrders = useCallback(async () => {
    const authHeaders = await getAuthHeaders();
    if (!authHeaders?.Authorization) {
      setAdminOrders([]);
      return;
    }
    try {
      const res = await fetch('/api/admin/orders', { headers: authHeaders });
      if (res.ok) {
        const data = (await res.json()) as { orders?: Record<string, unknown>[] };
        if (Array.isArray(data.orders)) {
          setAdminOrders(data.orders.map(mapDbAdminOrder));
        }
      }
    } catch (error) {
      console.error('Failed to refresh admin orders from PostgreSQL:', error);
    }
  }, [getAuthHeaders, mapDbAdminOrder]);

  const hydrateFromDatabase = useCallback(async () => {
    try {
      const authHeaders = await getAuthHeaders();
      const hasAuth = Boolean(authHeaders?.Authorization);

      const [
        mastersRes,
        catRes,
        prodRes,
        sellerRes,
        areaRes,
        routeRes,
        appRes,
        partnerRes,
        auditRes,
        ordersRes,
        financeSummaryRes,
        engagementSummaryRes,
        rbacSummaryRes,
      ] = await Promise.all([
        fetch('/api/catalog/masters'),
        fetch('/api/catalog/categories'),
        fetch('/api/catalog/products'),
        hasAuth && authHeaders
          ? fetch('/api/admin/sellers', { headers: authHeaders }).then((r) =>
              r.ok ? r : fetch('/api/catalog/admin-sellers')
            )
          : fetch('/api/catalog/admin-sellers'),
        fetch('/api/catalog/service-areas'),
        fetch('/api/catalog/routes'),
        hasAuth && authHeaders
          ? fetch('/api/admin/applications', { headers: authHeaders })
          : Promise.resolve(null),
        hasAuth && authHeaders
          ? fetch('/api/admin/delivery-partners', { headers: authHeaders })
          : Promise.resolve(null),
        hasAuth && authHeaders
          ? fetch('/api/admin/audit-logs', { headers: authHeaders })
          : Promise.resolve(null),
        hasAuth && authHeaders
          ? fetch('/api/admin/orders', { headers: authHeaders })
          : Promise.resolve(null),
        hasAuth && authHeaders
          ? fetch('/api/admin/finance/summary', { headers: authHeaders })
          : Promise.resolve(null),
        hasAuth && authHeaders
          ? fetch('/api/admin/engagement/summary', { headers: authHeaders })
          : Promise.resolve(null),
        hasAuth && authHeaders
          ? fetch('/api/admin/rbac/summary', { headers: authHeaders })
          : Promise.resolve(null),
      ]);

      if (mastersRes.ok) {
        const data = (await mastersRes.json()) as {
          verticals?: VerticalConfigRecord[];
          attributes?: AttributeMasterRecord[];
          units?: UnitMasterRecord[];
          optionGroups?: OptionGroupMasterRecord[];
          brands?: BrandMasterRecord[];
          variantMasters?: VariantSizeMasterRecord[];
          packagingMasters?: PackagingMasterRecord[];
          availabilityConfigs?: AvailabilityStockConfigRecord[];
        };
        if (Array.isArray(data.verticals)) setVerticalConfigs(data.verticals);
        if (Array.isArray(data.attributes)) setAttributes(data.attributes);
        if (Array.isArray(data.units)) setUnits(data.units);
        if (Array.isArray(data.optionGroups)) setOptionGroups(data.optionGroups);
        if (Array.isArray(data.brands)) setBrands(data.brands);
        if (Array.isArray(data.variantMasters)) setVariantMasters(data.variantMasters);
        if (Array.isArray(data.packagingMasters)) setPackagingMasters(data.packagingMasters);
        if (Array.isArray(data.availabilityConfigs)) setAvailabilityConfigs(data.availabilityConfigs);
      }
      if (catRes.ok) {
        const data = (await catRes.json()) as { categories?: CategoryRecord[] };
        if (Array.isArray(data.categories)) setCategories(data.categories);
      }
      if (prodRes.ok) {
        const data = (await prodRes.json()) as { products?: UniversalProductRecord[] };
        if (Array.isArray(data.products)) setProducts(data.products);
      }
      if (sellerRes.ok) {
        const data = (await sellerRes.json()) as { sellers?: MasterSellerRecord[] };
        if (Array.isArray(data.sellers)) setSellers(data.sellers);
      }
      if (areaRes.ok) {
        const data = (await areaRes.json()) as { serviceAreas?: VillageServiceAreaRecord[] };
        if (Array.isArray(data.serviceAreas)) setServiceAreas(data.serviceAreas);
      }
      if (routeRes.ok) {
        const data = (await routeRes.json()) as { routes?: InterVillageRouteRecord[] };
        if (Array.isArray(data.routes)) setInterVillageRoutes(data.routes);
      }
      if (appRes && appRes.ok) {
        const data = (await appRes.json()) as { applications?: SellerApplication[] };
        if (Array.isArray(data.applications)) setApplications(data.applications);
      }
      if (partnerRes && partnerRes.ok) {
        const data = (await partnerRes.json()) as { deliveryPartners?: DeliveryPartnerRecord[] };
        if (Array.isArray(data.deliveryPartners)) setDeliveryPartners(data.deliveryPartners);
      }
      if (auditRes && auditRes.ok) {
        const data = (await auditRes.json()) as { auditLogs?: AuditLogRecord[] };
        if (Array.isArray(data.auditLogs)) setAuditLogs(data.auditLogs);
      }
      if (ordersRes && ordersRes.ok) {
        const data = (await ordersRes.json()) as { orders?: Record<string, unknown>[] };
        if (Array.isArray(data.orders)) setAdminOrders(data.orders.map(mapDbAdminOrder));
      } else if (!hasAuth) {
        setAdminOrders([]);
      }

      if (financeSummaryRes && financeSummaryRes.ok) {
        const financeData = (await financeSummaryRes.json()) as {
          feeRules?: FeeRuleRecord[];
          offers?: OfferCouponRecord[];
          taxSlabs?: TaxSlabRecord[];
          cancellationRules?: CancellationPolicyRuleRecord[];
          payouts?: SellerPayoutRecord[];
          paymentTransactions?: PaymentTransactionRecord[];
          refundLedger?: RefundLedgerRecord[];
        };
        if (Array.isArray(financeData.feeRules)) setFeeRules(financeData.feeRules);
        if (Array.isArray(financeData.offers)) setOffers(financeData.offers);
        if (Array.isArray(financeData.taxSlabs)) setTaxSlabs(financeData.taxSlabs);
        if (Array.isArray(financeData.cancellationRules)) setCancellationRules(financeData.cancellationRules);
        if (Array.isArray(financeData.payouts)) setPayouts(financeData.payouts);
        if (Array.isArray(financeData.paymentTransactions)) {
          setPaymentTransactions(financeData.paymentTransactions);
        }
        if (Array.isArray(financeData.refundLedger)) setRefundLedger(financeData.refundLedger);
      } else {
        const [pubOffersRes, pubTaxRes, pubCancelRes] = await Promise.all([
          fetch('/api/catalog/offers'),
          fetch('/api/catalog/tax-slabs'),
          fetch('/api/catalog/cancellation-rules'),
        ]);
        if (pubOffersRes.ok) {
          const data = (await pubOffersRes.json()) as { offers?: OfferCouponRecord[] };
          if (Array.isArray(data.offers)) setOffers(data.offers);
        }
        if (pubTaxRes.ok) {
          const data = (await pubTaxRes.json()) as { taxSlabs?: TaxSlabRecord[] };
          if (Array.isArray(data.taxSlabs)) setTaxSlabs(data.taxSlabs);
        }
        if (pubCancelRes.ok) {
          const data = (await pubCancelRes.json()) as { cancellationRules?: CancellationPolicyRuleRecord[] };
          if (Array.isArray(data.cancellationRules)) setCancellationRules(data.cancellationRules);
        }
        if (!hasAuth) {
          setFeeRules([]);
          setPayouts([]);
          setPaymentTransactions([]);
          setRefundLedger([]);
        }
      }

      if (engagementSummaryRes && engagementSummaryRes.ok) {
        const engData = (await engagementSummaryRes.json()) as {
          supportCases?: SupportCaseRecord[];
          customers?: AdminCustomerRecord[];
          platformSettings?: PlatformSettingsRecord;
          cmsBanners?: CmsBannerRecord[];
          featuredSellerIds?: string[];
          cmsPolicies?: CmsPolicyPageRecord[];
          reviews?: CustomerReviewRecord[];
          broadcasts?: BroadcastMessageRecord[];
        };
        if (Array.isArray(engData.supportCases)) setSupportCases(engData.supportCases);
        if (Array.isArray(engData.customers)) setCustomers(engData.customers);
        if (engData.platformSettings) setPlatformSettings(engData.platformSettings);
        if (Array.isArray(engData.cmsBanners)) setCmsBanners(engData.cmsBanners);
        if (Array.isArray(engData.featuredSellerIds)) setFeaturedSellerIds(engData.featuredSellerIds);
        if (Array.isArray(engData.cmsPolicies)) setCmsPolicies(engData.cmsPolicies);
        if (Array.isArray(engData.reviews)) setReviews(engData.reviews);
        if (Array.isArray(engData.broadcasts)) setBroadcasts(engData.broadcasts);
      } else {
        const pubContentRes = await fetch('/api/catalog/storefront-content');
        if (pubContentRes.ok) {
          const pubData = (await pubContentRes.json()) as {
            platformSettings?: PlatformSettingsRecord;
            cmsBanners?: CmsBannerRecord[];
            featuredSellerIds?: string[];
            cmsPolicies?: CmsPolicyPageRecord[];
            reviews?: CustomerReviewRecord[];
          };
          if (pubData.platformSettings) setPlatformSettings(pubData.platformSettings);
          if (Array.isArray(pubData.cmsBanners)) setCmsBanners(pubData.cmsBanners);
          if (Array.isArray(pubData.featuredSellerIds)) setFeaturedSellerIds(pubData.featuredSellerIds);
          if (Array.isArray(pubData.cmsPolicies)) setCmsPolicies(pubData.cmsPolicies);
          if (Array.isArray(pubData.reviews)) setReviews(pubData.reviews);
        }
        if (!hasAuth) {
          setSupportCases([]);
          setCustomers([]);
          setBroadcasts([]);
        }
      }
      if (rbacSummaryRes && rbacSummaryRes.ok) {
        const rbacData = (await rbacSummaryRes.json()) as {
          adminUsers?: AdminUser[];
          rolePermissions?: RolePermissionMatrix;
        };
        if (Array.isArray(rbacData.adminUsers) && rbacData.adminUsers.length > 0) {
          setAdminUsers(rbacData.adminUsers);
        }
        if (rbacData.rolePermissions) {
          setRolePermissions(rbacData.rolePermissions);
        }
      }
    } catch (error) {
      console.error('Failed to hydrate admin catalog from PostgreSQL:', error);
    }
  }, [getAuthHeaders, mapDbAdminOrder]);

  useEffect(() => {
    void hydrateFromDatabase();
  }, [hydrateFromDatabase, firebaseUser?.uid]);

  // Only active admin persona switcher preference is stored locally; RBAC users, permissions, and all platform data are persisted in PostgreSQL
  useEffect(() => { saveStored(STORAGE_KEYS.CURRENT_ADMIN_ID, currentAdminId); }, [currentAdminId]);

  const logAuditEvent = (
    actionType: string,
    targetEntity: string,
    targetId: string,
    details: string,
    reason?: string,
    metadata?: Record<string, unknown>
  ) => {
    const id = `aud_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const newLog: AuditLogRecord = {
      id,
      actor: currentAdmin.name,
      actorRole: currentAdmin.role,
      actionType,
      targetEntity,
      targetId,
      timestamp: new Date().toISOString(),
      ipAddress: 'server',
      details,
      reason,
      metadata,
    };
    setAuditLogs((prev) => [newLog, ...prev]);
    void adminRequest<{ auditLog?: AuditLogRecord }>('/api/admin/audit-logs', {
      method: 'POST',
      body: JSON.stringify({
        id,
        actor: currentAdmin.name,
        actionType,
        targetEntity,
        targetId,
        details,
        reason,
        metadata,
      }),
    }).then((res) => {
      if (res?.auditLog) {
        setAuditLogs((prev) => prev.map((l) => (l.id === id ? res.auditLog! : l)));
      }
    });
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
    const nowIso = new Date().toISOString();
    setCurrentAdminId(adminId);
    setAdminUsers((prev) =>
      prev.map((u) => (u.id === adminId ? { ...u, lastActiveAt: nowIso } : u))
    );
    void adminRequest<{ adminUser?: AdminUser }>(
      `/api/admin/rbac/users/${encodeURIComponent(adminId)}`,
      {
        method: 'PATCH',
        body: JSON.stringify({ lastActiveAt: nowIso }),
      }
    );
  };

  const addAdminUser = (user: Omit<AdminUser, 'id' | 'lastActiveAt'>) => {
    const id = `admin_${Date.now()}`;
    const nowIso = new Date().toISOString();
    setAdminUsers((prev) => [
      { ...user, id, status: user.status || 'ACTIVE', lastActiveAt: nowIso },
      ...prev,
    ]);
    void adminRequest<{ adminUser?: AdminUser }>('/api/admin/rbac/users', {
      method: 'POST',
      body: JSON.stringify({ ...user, id }),
    }).then((res) => {
      if (res?.adminUser) {
        setAdminUsers((prev) => prev.map((u) => (u.id === id ? res.adminUser! : u)));
      } else {
        void hydrateFromDatabase();
      }
    });
    logAuditEvent('ADMIN_USER_CREATED', 'AdminUser', id, `Created admin account ${user.name} (${user.role})`);
  };

  const updateAdminUser = (adminId: string, patch: Partial<AdminUser>) => {
    setAdminUsers((prev) => prev.map((u) => (u.id === adminId ? { ...u, ...patch } : u)));
    void adminRequest<{ adminUser?: AdminUser }>(
      `/api/admin/rbac/users/${encodeURIComponent(adminId)}`,
      {
        method: 'PATCH',
        body: JSON.stringify(patch),
      }
    ).then((res) => {
      if (res?.adminUser) {
        setAdminUsers((prev) => prev.map((u) => (u.id === adminId ? res.adminUser! : u)));
      } else {
        void hydrateFromDatabase();
      }
    });
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
    void adminRequest<{ rolePermissions?: RolePermissionMatrix }>('/api/admin/rbac/permissions', {
      method: 'PATCH',
      body: JSON.stringify({ role, module, key, value }),
    }).then((res) => {
      if (res?.rolePermissions) {
        setRolePermissions(res.rolePermissions);
      } else {
        void hydrateFromDatabase();
      }
    });
    logAuditEvent('RBAC_PERMISSION_UPDATED', 'RolePermission', `${role}:${module}`, `Set ${role}.${module}.${key} = ${value}`);
  };

  // Applications & KYC (PostgreSQL-backed CRUD)
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

    void adminRequest<{ application?: SellerApplication; createdSeller?: MasterSellerRecord }>(
      `/api/admin/applications/${encodeURIComponent(applicationId)}/review`,
      {
        method: 'PATCH',
        body: JSON.stringify({ status, notes, reviewedBy: currentAdmin.name }),
      }
    ).then((res) => {
      if (res?.application) {
        setApplications((prev) =>
          prev.map((a) => (a.id === applicationId ? res.application! : a))
        );
        if (res.createdSeller) {
          setSellers((prev) => [res.createdSeller!, ...prev]);
        }
      } else {
        void hydrateFromDatabase();
      }
    });

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
    void adminRequest<{ application?: SellerApplication }>(
      `/api/admin/applications/${encodeURIComponent(applicationId)}/docs/${encodeURIComponent(docCode)}/toggle`,
      { method: 'PATCH' }
    ).then((res) => {
      if (res?.application) {
        setApplications((prev) =>
          prev.map((a) => (a.id === applicationId ? res.application! : a))
        );
      } else {
        void hydrateFromDatabase();
      }
    });
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

    void adminRequest<{ seller?: MasterSellerRecord }>(
      `/api/admin/sellers/${encodeURIComponent(sellerId)}/status`,
      {
        method: 'PATCH',
        body: JSON.stringify({ status, reason, actorName: currentAdmin.name }),
      }
    ).then((res) => {
      if (res?.seller) {
        setSellers((prev) => prev.map((s) => (s.id === sellerId ? res.seller! : s)));
      } else {
        void hydrateFromDatabase();
      }
    });

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
    void adminRequest<{ seller?: MasterSellerRecord }>(
      `/api/admin/sellers/${encodeURIComponent(sellerId)}/config`,
      {
        method: 'PATCH',
        body: JSON.stringify({ patch, actorName: currentAdmin.name }),
      }
    ).then((res) => {
      if (res?.seller) {
        setSellers((prev) => prev.map((s) => (s.id === sellerId ? res.seller! : s)));
      } else {
        void hydrateFromDatabase();
      }
    });
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

    void adminRequest<{ seller?: MasterSellerRecord }>(
      `/api/admin/sellers/${encodeURIComponent(sellerId)}/kyc-documents/${encodeURIComponent(docId)}`,
      {
        method: 'PATCH',
        body: JSON.stringify({ status, note: finalNote, actorName: currentAdmin.name }),
      }
    ).then((res) => {
      if (res?.seller) {
        setSellers((prev) => prev.map((s) => (s.id === sellerId ? res.seller! : s)));
      } else {
        void hydrateFromDatabase();
      }
    });

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

    void adminRequest<{ seller?: MasterSellerRecord }>(
      `/api/admin/sellers/${encodeURIComponent(sellerId)}/kyc-changes`,
      {
        method: 'POST',
        body: JSON.stringify({ reason, actorName: currentAdmin.name }),
      }
    ).then((res) => {
      if (res?.seller) {
        setSellers((prev) => prev.map((s) => (s.id === sellerId ? res.seller! : s)));
      } else {
        void hydrateFromDatabase();
      }
    });

    logAuditEvent(
      'SELLER_KYC_CHANGES_REQUESTED',
      'Seller',
      sellerId,
      `Requested KYC document changes from ${seller.name}. Reason: ${reason}`,
      reason
    );

    return { success: true, message: `KYC change request sent to ${seller.name}.` };
  };

  // Multi-Verticals Master (PostgreSQL-backed CRUD)
  const toggleVerticalEnabled = (verticalId: string) => {
    const vert = verticalConfigs.find((v) => v.id === verticalId);
    setVerticalConfigs((prev) =>
      prev.map((v) => (v.id === verticalId ? { ...v, isEnabled: !v.isEnabled } : v))
    );
    void adminRequest<{ vertical?: VerticalConfigRecord }>(
      `/api/admin/masters/verticals/${encodeURIComponent(verticalId)}/toggle`,
      { method: 'PATCH' }
    ).then((res) => {
      if (res?.vertical) {
        setVerticalConfigs((prev) => prev.map((v) => (v.id === verticalId ? res.vertical! : v)));
      } else {
        void hydrateFromDatabase();
      }
    });
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
    void adminRequest<{ vertical?: VerticalConfigRecord }>('/api/admin/masters/verticals', {
      method: 'POST',
      body: JSON.stringify({ ...vertical, id: cleanId }),
    }).then((res) => {
      if (res?.vertical) {
        setVerticalConfigs((prev) => prev.map((v) => (v.id === cleanId ? res.vertical! : v)));
      } else {
        void hydrateFromDatabase();
      }
    });
    logAuditEvent('VERTICAL_CREATED', 'VerticalConfig', cleanId, `Created new marketplace vertical: ${vertical.name}`);
    return { success: true, message: `Vertical "${vertical.name}" created.` };
  };

  const updateVertical = (verticalId: string, patch: Partial<VerticalConfigRecord>) => {
    setVerticalConfigs((prev) =>
      prev.map((v) => (v.id === verticalId ? { ...v, ...patch } : v))
    );
    void adminRequest<{ vertical?: VerticalConfigRecord }>(
      `/api/admin/masters/verticals/${encodeURIComponent(verticalId)}`,
      {
        method: 'PATCH',
        body: JSON.stringify(patch),
      }
    ).then((res) => {
      if (res?.vertical) {
        setVerticalConfigs((prev) => prev.map((v) => (v.id === verticalId ? res.vertical! : v)));
      } else {
        void hydrateFromDatabase();
      }
    });
    logAuditEvent('VERTICAL_UPDATED', 'VerticalConfig', verticalId, `Updated vertical configuration for ${verticalId}`, undefined, patch as Record<string, unknown>);
  };

  // Categories (PostgreSQL-backed CRUD)
  const toggleCategoryStatus = (categoryId: string) => {
    const cat = categories.find((c) => c.id === categoryId);
    setCategories((prev) =>
      prev.map((c) => (c.id === categoryId ? { ...c, isActive: !c.isActive } : c))
    );
    void adminRequest<{ category?: CategoryRecord }>(
      `/api/admin/categories/${encodeURIComponent(categoryId)}/toggle`,
      { method: 'PATCH' }
    ).then((res) => {
      if (res?.category) {
        setCategories((prev) => prev.map((c) => (c.id === categoryId ? res.category! : c)));
      } else {
        void hydrateFromDatabase();
      }
    });
    logAuditEvent('CATEGORY_STATUS_TOGGLED', 'Category', categoryId, `Category ${cat?.name} is now ${!cat?.isActive ? 'ACTIVE' : 'INACTIVE'}`);
  };

  const addCategory = (newCat: Omit<CategoryRecord, 'id' | 'itemCount'>) => {
    const id = `cat_${Date.now()}`;
    const category: CategoryRecord = { ...newCat, id, itemCount: 0 };
    setCategories((prev) => [...prev, category]);
    void adminRequest<{ category?: CategoryRecord }>('/api/admin/categories', {
      method: 'POST',
      body: JSON.stringify({ ...newCat, id }),
    }).then((res) => {
      if (res?.category) {
        setCategories((prev) => prev.map((c) => (c.id === id ? res.category! : c)));
      } else {
        void hydrateFromDatabase();
      }
    });
    logAuditEvent('CATEGORY_CREATED', 'Category', id, `Created category ${category.name} under ${category.vertical}`);
  };

  const updateCategory = (categoryId: string, patch: Partial<CategoryRecord>) => {
    setCategories((prev) => prev.map((c) => (c.id === categoryId ? { ...c, ...patch } : c)));
    void adminRequest<{ category?: CategoryRecord }>(
      `/api/admin/categories/${encodeURIComponent(categoryId)}`,
      {
        method: 'PATCH',
        body: JSON.stringify(patch),
      }
    ).then((res) => {
      if (res?.category) {
        setCategories((prev) => prev.map((c) => (c.id === categoryId ? res.category! : c)));
      } else {
        void hydrateFromDatabase();
      }
    });
    logAuditEvent('CATEGORY_UPDATED', 'Category', categoryId, `Updated category ${categoryId}`, undefined, patch as Record<string, unknown>);
  };

  const deleteCategory = (categoryId: string) => {
    const cat = categories.find((c) => c.id === categoryId);
    setCategories((prev) => prev.filter((c) => c.id !== categoryId && c.parentId !== categoryId));
    void adminRequest<{ deleted?: boolean }>(
      `/api/admin/categories/${encodeURIComponent(categoryId)}`,
      { method: 'DELETE' }
    ).then((res) => {
      if (!res?.deleted) {
        void hydrateFromDatabase();
      }
    });
    logAuditEvent('CATEGORY_DELETED', 'Category', categoryId, `Archived/removed category ${cat?.name || categoryId}`);
  };

  // Attributes Master (PostgreSQL-backed CRUD)
  const addAttribute = (attr: Omit<AttributeMasterRecord, 'id'>) => {
    const id = `attr_${Date.now()}`;
    setAttributes((prev) => [{ ...attr, id }, ...prev]);
    void adminRequest<{ attribute?: AttributeMasterRecord }>('/api/admin/masters/attributes', {
      method: 'POST',
      body: JSON.stringify({ ...attr, id }),
    }).then((res) => {
      if (res?.attribute) {
        setAttributes((prev) => prev.map((a) => (a.id === id ? res.attribute! : a)));
      } else {
        void hydrateFromDatabase();
      }
    });
    logAuditEvent('ATTRIBUTE_CREATED', 'AttributeMaster', id, `Created attribute ${attr.name} (${attr.dataType})`);
  };

  const updateAttribute = (attrId: string, patch: Partial<AttributeMasterRecord>) => {
    setAttributes((prev) => prev.map((a) => (a.id === attrId ? { ...a, ...patch } : a)));
    void adminRequest<{ attribute?: AttributeMasterRecord }>(
      `/api/admin/masters/attributes/${encodeURIComponent(attrId)}`,
      {
        method: 'PATCH',
        body: JSON.stringify(patch),
      }
    ).then((res) => {
      if (res?.attribute) {
        setAttributes((prev) => prev.map((a) => (a.id === attrId ? res.attribute! : a)));
      } else {
        void hydrateFromDatabase();
      }
    });
    logAuditEvent('ATTRIBUTE_UPDATED', 'AttributeMaster', attrId, `Updated attribute ${attrId}`);
  };

  const toggleAttributeStatus = (attrId: string) => {
    const target = attributes.find((a) => a.id === attrId);
    setAttributes((prev) => prev.map((a) => (a.id === attrId ? { ...a, isActive: !a.isActive } : a)));
    void adminRequest<{ attribute?: AttributeMasterRecord }>(
      `/api/admin/masters/attributes/${encodeURIComponent(attrId)}/toggle`,
      { method: 'PATCH' }
    ).then((res) => {
      if (res?.attribute) {
        setAttributes((prev) => prev.map((a) => (a.id === attrId ? res.attribute! : a)));
      } else {
        void hydrateFromDatabase();
      }
    });
    logAuditEvent('ATTRIBUTE_TOGGLED', 'AttributeMaster', attrId, `Attribute ${target?.name} set to ${!target?.isActive}`);
  };

  const deleteAttribute = (attrId: string) => {
    const target = attributes.find((a) => a.id === attrId);
    setAttributes((prev) => prev.filter((a) => a.id !== attrId));
    void adminRequest<{ deleted?: boolean }>(
      `/api/admin/masters/attributes/${encodeURIComponent(attrId)}`,
      { method: 'DELETE' }
    ).then((res) => {
      if (!res?.deleted) void hydrateFromDatabase();
    });
    logAuditEvent('ATTRIBUTE_DELETED', 'AttributeMaster', attrId, `Deleted attribute ${target?.name || attrId}`);
  };

  // Units Master (PostgreSQL-backed CRUD)
  const addUnit = (unit: Omit<UnitMasterRecord, 'id'>) => {
    const id = `unit_${Date.now()}`;
    setUnits((prev) => [{ ...unit, id }, ...prev]);
    void adminRequest<{ unit?: UnitMasterRecord }>('/api/admin/masters/units', {
      method: 'POST',
      body: JSON.stringify({ ...unit, id }),
    }).then((res) => {
      if (res?.unit) {
        setUnits((prev) => prev.map((u) => (u.id === id ? res.unit! : u)));
      } else {
        void hydrateFromDatabase();
      }
    });
    logAuditEvent('UNIT_CREATED', 'UnitMaster', id, `Created measurement unit ${unit.name} (${unit.symbol})`);
  };

  const updateUnit = (unitId: string, patch: Partial<UnitMasterRecord>) => {
    setUnits((prev) => prev.map((u) => (u.id === unitId ? { ...u, ...patch } : u)));
    void adminRequest<{ unit?: UnitMasterRecord }>(
      `/api/admin/masters/units/${encodeURIComponent(unitId)}`,
      {
        method: 'PATCH',
        body: JSON.stringify(patch),
      }
    ).then((res) => {
      if (res?.unit) {
        setUnits((prev) => prev.map((u) => (u.id === unitId ? res.unit! : u)));
      } else {
        void hydrateFromDatabase();
      }
    });
    logAuditEvent('UNIT_UPDATED', 'UnitMaster', unitId, `Updated unit ${unitId}`);
  };

  const toggleUnitStatus = (unitId: string) => {
    const target = units.find((u) => u.id === unitId);
    setUnits((prev) => prev.map((u) => (u.id === unitId ? { ...u, isActive: !u.isActive } : u)));
    void adminRequest<{ unit?: UnitMasterRecord }>(
      `/api/admin/masters/units/${encodeURIComponent(unitId)}/toggle`,
      { method: 'PATCH' }
    ).then((res) => {
      if (res?.unit) {
        setUnits((prev) => prev.map((u) => (u.id === unitId ? res.unit! : u)));
      } else {
        void hydrateFromDatabase();
      }
    });
    logAuditEvent('UNIT_TOGGLED', 'UnitMaster', unitId, `Unit ${target?.name} set to ${!target?.isActive}`);
  };

  const deleteUnit = (unitId: string) => {
    const target = units.find((u) => u.id === unitId);
    setUnits((prev) => prev.filter((u) => u.id !== unitId));
    void adminRequest<{ deleted?: boolean }>(
      `/api/admin/masters/units/${encodeURIComponent(unitId)}`,
      { method: 'DELETE' }
    ).then((res) => {
      if (!res?.deleted) void hydrateFromDatabase();
    });
    logAuditEvent('UNIT_DELETED', 'UnitMaster', unitId, `Deleted unit ${target?.name || unitId}`);
  };

  // Option Groups Master (PostgreSQL-backed CRUD)
  const addOptionGroup = (group: Omit<OptionGroupMasterRecord, 'id'>) => {
    const id = `opt_${Date.now()}`;
    setOptionGroups((prev) => [{ ...group, id }, ...prev]);
    void adminRequest<{ optionGroup?: OptionGroupMasterRecord }>('/api/admin/masters/option-groups', {
      method: 'POST',
      body: JSON.stringify({ ...group, id }),
    }).then((res) => {
      if (res?.optionGroup) {
        setOptionGroups((prev) => prev.map((g) => (g.id === id ? res.optionGroup! : g)));
      } else {
        void hydrateFromDatabase();
      }
    });
    logAuditEvent('OPTION_GROUP_CREATED', 'OptionGroup', id, `Created option group ${group.name} (${group.options.length} options)`);
  };

  const updateOptionGroup = (groupId: string, patch: Partial<OptionGroupMasterRecord>) => {
    setOptionGroups((prev) => prev.map((g) => (g.id === groupId ? { ...g, ...patch } : g)));
    void adminRequest<{ optionGroup?: OptionGroupMasterRecord }>(
      `/api/admin/masters/option-groups/${encodeURIComponent(groupId)}`,
      {
        method: 'PATCH',
        body: JSON.stringify(patch),
      }
    ).then((res) => {
      if (res?.optionGroup) {
        setOptionGroups((prev) => prev.map((g) => (g.id === groupId ? res.optionGroup! : g)));
      } else {
        void hydrateFromDatabase();
      }
    });
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
    void adminRequest<{ optionGroup?: OptionGroupMasterRecord }>(
      `/api/admin/masters/option-groups/${encodeURIComponent(groupId)}/duplicate`,
      {
        method: 'POST',
        body: JSON.stringify({ id }),
      }
    ).then((res) => {
      if (res?.optionGroup) {
        setOptionGroups((prev) => prev.map((g) => (g.id === id ? res.optionGroup! : g)));
      } else {
        void hydrateFromDatabase();
      }
    });
    logAuditEvent('OPTION_GROUP_DUPLICATED', 'OptionGroup', id, `Duplicated option group from ${src.name}`);
  };

  const toggleOptionGroupStatus = (groupId: string) => {
    const target = optionGroups.find((g) => g.id === groupId);
    setOptionGroups((prev) => prev.map((g) => (g.id === groupId ? { ...g, isActive: !g.isActive } : g)));
    void adminRequest<{ optionGroup?: OptionGroupMasterRecord }>(
      `/api/admin/masters/option-groups/${encodeURIComponent(groupId)}/toggle`,
      { method: 'PATCH' }
    ).then((res) => {
      if (res?.optionGroup) {
        setOptionGroups((prev) => prev.map((g) => (g.id === groupId ? res.optionGroup! : g)));
      } else {
        void hydrateFromDatabase();
      }
    });
    logAuditEvent('OPTION_GROUP_TOGGLED', 'OptionGroup', groupId, `Option group ${target?.name} set to ${!target?.isActive}`);
  };

  const deleteOptionGroup = (groupId: string) => {
    const target = optionGroups.find((g) => g.id === groupId);
    setOptionGroups((prev) => prev.filter((g) => g.id !== groupId));
    void adminRequest<{ deleted?: boolean }>(
      `/api/admin/masters/option-groups/${encodeURIComponent(groupId)}`,
      { method: 'DELETE' }
    ).then((res) => {
      if (!res?.deleted) void hydrateFromDatabase();
    });
    logAuditEvent('OPTION_GROUP_DELETED', 'OptionGroup', groupId, `Deleted option group ${target?.name || groupId}`);
  };

  // Brands Master (PostgreSQL-backed CRUD)
  const addBrand = (brand: Omit<BrandMasterRecord, 'id' | 'productCount'>) => {
    const id = `brand_${Date.now()}`;
    setBrands((prev) => [{ ...brand, id, productCount: 0 }, ...prev]);
    void adminRequest<{ brand?: BrandMasterRecord }>('/api/admin/masters/brands', {
      method: 'POST',
      body: JSON.stringify({ ...brand, id }),
    }).then((res) => {
      if (res?.brand) {
        setBrands((prev) => prev.map((b) => (b.id === id ? res.brand! : b)));
      } else {
        void hydrateFromDatabase();
      }
    });
    logAuditEvent('BRAND_CREATED', 'BrandMaster', id, `Created brand ${brand.name}`);
  };

  const updateBrand = (brandId: string, patch: Partial<BrandMasterRecord>) => {
    setBrands((prev) => prev.map((b) => (b.id === brandId ? { ...b, ...patch } : b)));
    void adminRequest<{ brand?: BrandMasterRecord }>(
      `/api/admin/masters/brands/${encodeURIComponent(brandId)}`,
      {
        method: 'PATCH',
        body: JSON.stringify(patch),
      }
    ).then((res) => {
      if (res?.brand) {
        setBrands((prev) => prev.map((b) => (b.id === brandId ? res.brand! : b)));
      } else {
        void hydrateFromDatabase();
      }
    });
    logAuditEvent('BRAND_UPDATED', 'BrandMaster', brandId, `Updated brand ${brandId}`);
  };

  const toggleBrandVerified = (brandId: string) => {
    const target = brands.find((b) => b.id === brandId);
    setBrands((prev) => prev.map((b) => (b.id === brandId ? { ...b, isVerified: !b.isVerified } : b)));
    void adminRequest<{ brand?: BrandMasterRecord }>(
      `/api/admin/masters/brands/${encodeURIComponent(brandId)}/toggle-verified`,
      { method: 'PATCH' }
    ).then((res) => {
      if (res?.brand) {
        setBrands((prev) => prev.map((b) => (b.id === brandId ? res.brand! : b)));
      } else {
        void hydrateFromDatabase();
      }
    });
    logAuditEvent('BRAND_VERIFIED_TOGGLED', 'BrandMaster', brandId, `Brand ${target?.name} verified=${!target?.isVerified}`);
  };

  const toggleBrandStatus = (brandId: string) => {
    const target = brands.find((b) => b.id === brandId);
    setBrands((prev) => prev.map((b) => (b.id === brandId ? { ...b, isActive: !b.isActive } : b)));
    void adminRequest<{ brand?: BrandMasterRecord }>(
      `/api/admin/masters/brands/${encodeURIComponent(brandId)}/toggle`,
      { method: 'PATCH' }
    ).then((res) => {
      if (res?.brand) {
        setBrands((prev) => prev.map((b) => (b.id === brandId ? res.brand! : b)));
      } else {
        void hydrateFromDatabase();
      }
    });
    logAuditEvent('BRAND_TOGGLED', 'BrandMaster', brandId, `Brand ${target?.name} active=${!target?.isActive}`);
  };

  const deleteBrand = (brandId: string) => {
    const target = brands.find((b) => b.id === brandId);
    setBrands((prev) => prev.filter((b) => b.id !== brandId));
    void adminRequest<{ deleted?: boolean }>(
      `/api/admin/masters/brands/${encodeURIComponent(brandId)}`,
      { method: 'DELETE' }
    ).then((res) => {
      if (!res?.deleted) void hydrateFromDatabase();
    });
    logAuditEvent('BRAND_DELETED', 'BrandMaster', brandId, `Deleted brand ${target?.name || brandId}`);
  };

  // Product Variant & Size Master (PostgreSQL-backed CRUD)
  const addVariantMaster = (variant: Omit<VariantSizeMasterRecord, 'id'>) => {
    const id = `var_${Date.now()}`;
    setVariantMasters((prev) => [{ ...variant, id }, ...prev]);
    void adminRequest<{ variantMaster?: VariantSizeMasterRecord }>('/api/admin/masters/variants', {
      method: 'POST',
      body: JSON.stringify({ ...variant, id }),
    }).then((res) => {
      if (res?.variantMaster) {
        setVariantMasters((prev) => prev.map((v) => (v.id === id ? res.variantMaster! : v)));
      } else {
        void hydrateFromDatabase();
      }
    });
    logAuditEvent('VARIANT_MASTER_CREATED', 'VariantSizeMaster', id, `Created variant ${variant.name} (${variant.sku})`);
  };

  const updateVariantMaster = (variantId: string, patch: Partial<VariantSizeMasterRecord>) => {
    setVariantMasters((prev) => prev.map((v) => (v.id === variantId ? { ...v, ...patch } : v)));
    void adminRequest<{ variantMaster?: VariantSizeMasterRecord }>(
      `/api/admin/masters/variants/${encodeURIComponent(variantId)}`,
      {
        method: 'PATCH',
        body: JSON.stringify(patch),
      }
    ).then((res) => {
      if (res?.variantMaster) {
        setVariantMasters((prev) => prev.map((v) => (v.id === variantId ? res.variantMaster! : v)));
      } else {
        void hydrateFromDatabase();
      }
    });
    logAuditEvent('VARIANT_MASTER_UPDATED', 'VariantSizeMaster', variantId, `Updated variant master ${variantId}`);
  };

  const toggleVariantMasterStatus = (variantId: string) => {
    const target = variantMasters.find((v) => v.id === variantId);
    setVariantMasters((prev) => prev.map((v) => (v.id === variantId ? { ...v, isActive: !v.isActive } : v)));
    void adminRequest<{ variantMaster?: VariantSizeMasterRecord }>(
      `/api/admin/masters/variants/${encodeURIComponent(variantId)}/toggle`,
      { method: 'PATCH' }
    ).then((res) => {
      if (res?.variantMaster) {
        setVariantMasters((prev) => prev.map((v) => (v.id === variantId ? res.variantMaster! : v)));
      } else {
        void hydrateFromDatabase();
      }
    });
    logAuditEvent('VARIANT_MASTER_TOGGLED', 'VariantSizeMaster', variantId, `Variant ${target?.name} active=${!target?.isActive}`);
  };

  const deleteVariantMaster = (variantId: string) => {
    const target = variantMasters.find((v) => v.id === variantId);
    setVariantMasters((prev) => prev.filter((v) => v.id !== variantId));
    void adminRequest<{ deleted?: boolean }>(
      `/api/admin/masters/variants/${encodeURIComponent(variantId)}`,
      { method: 'DELETE' }
    ).then((res) => {
      if (!res?.deleted) void hydrateFromDatabase();
    });
    logAuditEvent('VARIANT_MASTER_DELETED', 'VariantSizeMaster', variantId, `Deleted variant ${target?.name || variantId}`);
  };

  // Packaging Master (PostgreSQL-backed CRUD)
  const addPackagingMaster = (pkg: Omit<PackagingMasterRecord, 'id'>) => {
    const id = `pkg_${Date.now()}`;
    setPackagingMasters((prev) => [{ ...pkg, id }, ...prev]);
    void adminRequest<{ packagingMaster?: PackagingMasterRecord }>('/api/admin/masters/packaging', {
      method: 'POST',
      body: JSON.stringify({ ...pkg, id }),
    }).then((res) => {
      if (res?.packagingMaster) {
        setPackagingMasters((prev) => prev.map((p) => (p.id === id ? res.packagingMaster! : p)));
      } else {
        void hydrateFromDatabase();
      }
    });
    logAuditEvent('PACKAGING_CREATED', 'PackagingMaster', id, `Created packaging ${pkg.name} (${pkg.code})`);
  };

  const updatePackagingMaster = (pkgId: string, patch: Partial<PackagingMasterRecord>) => {
    setPackagingMasters((prev) => prev.map((p) => (p.id === pkgId ? { ...p, ...patch } : p)));
    void adminRequest<{ packagingMaster?: PackagingMasterRecord }>(
      `/api/admin/masters/packaging/${encodeURIComponent(pkgId)}`,
      {
        method: 'PATCH',
        body: JSON.stringify(patch),
      }
    ).then((res) => {
      if (res?.packagingMaster) {
        setPackagingMasters((prev) => prev.map((p) => (p.id === pkgId ? res.packagingMaster! : p)));
      } else {
        void hydrateFromDatabase();
      }
    });
    logAuditEvent('PACKAGING_UPDATED', 'PackagingMaster', pkgId, `Updated packaging master ${pkgId}`);
  };

  const togglePackagingMasterStatus = (pkgId: string) => {
    const target = packagingMasters.find((p) => p.id === pkgId);
    setPackagingMasters((prev) => prev.map((p) => (p.id === pkgId ? { ...p, isActive: !p.isActive } : p)));
    void adminRequest<{ packagingMaster?: PackagingMasterRecord }>(
      `/api/admin/masters/packaging/${encodeURIComponent(pkgId)}/toggle`,
      { method: 'PATCH' }
    ).then((res) => {
      if (res?.packagingMaster) {
        setPackagingMasters((prev) => prev.map((p) => (p.id === pkgId ? res.packagingMaster! : p)));
      } else {
        void hydrateFromDatabase();
      }
    });
    logAuditEvent('PACKAGING_TOGGLED', 'PackagingMaster', pkgId, `Packaging ${target?.name} active=${!target?.isActive}`);
  };

  const deletePackagingMaster = (pkgId: string) => {
    const target = packagingMasters.find((p) => p.id === pkgId);
    setPackagingMasters((prev) => prev.filter((p) => p.id !== pkgId));
    void adminRequest<{ deleted?: boolean }>(
      `/api/admin/masters/packaging/${encodeURIComponent(pkgId)}`,
      { method: 'DELETE' }
    ).then((res) => {
      if (!res?.deleted) void hydrateFromDatabase();
    });
    logAuditEvent('PACKAGING_DELETED', 'PackagingMaster', pkgId, `Deleted packaging ${target?.name || pkgId}`);
  };

  // Product Availability & Stock Configuration Master (PostgreSQL-backed CRUD)
  const addAvailabilityConfig = (cfg: Omit<AvailabilityStockConfigRecord, 'id'>) => {
    const id = `avail_${Date.now()}`;
    setAvailabilityConfigs((prev) => [{ ...cfg, id }, ...prev]);
    void adminRequest<{ availabilityConfig?: AvailabilityStockConfigRecord }>(
      '/api/admin/masters/availability',
      {
        method: 'POST',
        body: JSON.stringify({ ...cfg, id }),
      }
    ).then((res) => {
      if (res?.availabilityConfig) {
        setAvailabilityConfigs((prev) =>
          prev.map((c) => (c.id === id ? res.availabilityConfig! : c))
        );
      } else {
        void hydrateFromDatabase();
      }
    });
    logAuditEvent('AVAILABILITY_CONFIG_CREATED', 'AvailabilityStockConfig', id, `Created availability rule ${cfg.name} (${cfg.workflowMode})`);
  };

  const updateAvailabilityConfig = (cfgId: string, patch: Partial<AvailabilityStockConfigRecord>) => {
    setAvailabilityConfigs((prev) => prev.map((c) => (c.id === cfgId ? { ...c, ...patch } : c)));
    void adminRequest<{ availabilityConfig?: AvailabilityStockConfigRecord }>(
      `/api/admin/masters/availability/${encodeURIComponent(cfgId)}`,
      {
        method: 'PATCH',
        body: JSON.stringify(patch),
      }
    ).then((res) => {
      if (res?.availabilityConfig) {
        setAvailabilityConfigs((prev) =>
          prev.map((c) => (c.id === cfgId ? res.availabilityConfig! : c))
        );
      } else {
        void hydrateFromDatabase();
      }
    });
    logAuditEvent('AVAILABILITY_CONFIG_UPDATED', 'AvailabilityStockConfig', cfgId, `Updated availability config ${cfgId}`);
  };

  const toggleAvailabilityConfigStatus = (cfgId: string) => {
    const target = availabilityConfigs.find((c) => c.id === cfgId);
    setAvailabilityConfigs((prev) => prev.map((c) => (c.id === cfgId ? { ...c, isActive: !c.isActive } : c)));
    void adminRequest<{ availabilityConfig?: AvailabilityStockConfigRecord }>(
      `/api/admin/masters/availability/${encodeURIComponent(cfgId)}/toggle`,
      { method: 'PATCH' }
    ).then((res) => {
      if (res?.availabilityConfig) {
        setAvailabilityConfigs((prev) =>
          prev.map((c) => (c.id === cfgId ? res.availabilityConfig! : c))
        );
      } else {
        void hydrateFromDatabase();
      }
    });
    logAuditEvent('AVAILABILITY_CONFIG_TOGGLED', 'AvailabilityStockConfig', cfgId, `Availability config ${target?.name} active=${!target?.isActive}`);
  };

  const deleteAvailabilityConfig = (cfgId: string) => {
    const target = availabilityConfigs.find((c) => c.id === cfgId);
    setAvailabilityConfigs((prev) => prev.filter((c) => c.id !== cfgId));
    void adminRequest<{ deleted?: boolean }>(
      `/api/admin/masters/availability/${encodeURIComponent(cfgId)}`,
      { method: 'DELETE' }
    ).then((res) => {
      if (!res?.deleted) void hydrateFromDatabase();
    });
    logAuditEvent('AVAILABILITY_CONFIG_DELETED', 'AvailabilityStockConfig', cfgId, `Deleted availability config ${target?.name || cfgId}`);
  };

  // Universal Products Master (PostgreSQL-backed CRUD)
  const addProduct = (product: Omit<UniversalProductRecord, 'id' | 'createdAt' | 'updatedAt'>) => {
    const id = `prod_${Date.now()}`;
    const now = new Date().toISOString();
    setProducts((prev) => [{ ...product, id, createdAt: now, updatedAt: now }, ...prev]);
    void adminRequest<{ product?: UniversalProductRecord }>('/api/admin/products', {
      method: 'POST',
      body: JSON.stringify({ ...product, id }),
    }).then((res) => {
      if (res?.product) {
        setProducts((prev) => prev.map((p) => (p.id === id ? res.product! : p)));
      } else {
        void hydrateFromDatabase();
      }
    });
    logAuditEvent('PRODUCT_CREATED', 'Product', id, `Created universal product ${product.name} (${product.vertical}) for ${product.sellerName}`);
  };

  const updateProduct = (productId: string, patch: Partial<UniversalProductRecord>) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === productId ? { ...p, ...patch, updatedAt: new Date().toISOString() } : p))
    );
    void adminRequest<{ product?: UniversalProductRecord }>(
      `/api/admin/products/${encodeURIComponent(productId)}`,
      {
        method: 'PATCH',
        body: JSON.stringify(patch),
      }
    ).then((res) => {
      if (res?.product) {
        setProducts((prev) => prev.map((p) => (p.id === productId ? res.product! : p)));
      } else {
        void hydrateFromDatabase();
      }
    });
    logAuditEvent('PRODUCT_UPDATED', 'Product', productId, `Updated product ${productId}`);
  };

  const deleteProduct = (productId: string) => {
    const target = products.find((p) => p.id === productId);
    setProducts((prev) => prev.filter((p) => p.id !== productId));
    void adminRequest<{ deleted?: boolean }>(
      `/api/admin/products/${encodeURIComponent(productId)}`,
      { method: 'DELETE' }
    ).then((res) => {
      if (!res?.deleted) {
        void hydrateFromDatabase();
      }
    });
    logAuditEvent('PRODUCT_DELETED', 'Product', productId, `Deleted product ${target?.name || productId}`);
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
    void adminRequest<{ product?: UniversalProductRecord }>(
      `/api/admin/products/${encodeURIComponent(productId)}/moderate`,
      {
        method: 'PATCH',
        body: JSON.stringify({ status, notes }),
      }
    ).then((res) => {
      if (res?.product) {
        setProducts((prev) => prev.map((p) => (p.id === productId ? res.product! : p)));
      } else {
        void hydrateFromDatabase();
      }
    });
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
    void adminRequest<{ product?: UniversalProductRecord }>(
      `/api/admin/products/${encodeURIComponent(productId)}/inventory`,
      {
        method: 'PATCH',
        body: JSON.stringify({ stockQuantity, variantStocks }),
      }
    ).then((res) => {
      if (res?.product) {
        setProducts((prev) => prev.map((p) => (p.id === productId ? res.product! : p)));
      } else {
        void hydrateFromDatabase();
      }
    });
    logAuditEvent('INVENTORY_UPDATED', 'Product', productId, `Updated stock for "${target?.name}" to ${stockQuantity}`);
  };

  const sellerRequest = useCallback(
    async <T,>(path: string, init?: RequestInit): Promise<T | null> => {
      const authHeaders = await getAuthHeaders();
      if (!authHeaders?.Authorization) return null;
      try {
        const res = await fetch(path, {
          ...init,
          headers: {
            ...authHeaders,
            ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
            ...(init?.headers ?? {}),
          },
        });
        if (!res.ok) return null;
        return (await res.json()) as T;
      } catch {
        return null;
      }
    },
    [getAuthHeaders]
  );

  const sellerCreateProduct = (
    sellerCode: string,
    product: Omit<UniversalProductRecord, 'id' | 'createdAt' | 'updatedAt'>
  ) => {
    const id = `prod_${Date.now()}`;
    const now = new Date().toISOString();
    const optimistic: UniversalProductRecord = {
      ...product,
      id,
      sellerId: sellerCode,
      moderationStatus: 'PENDING_REVIEW',
      createdAt: now,
      updatedAt: now,
    };
    setProducts((prev) => [optimistic, ...prev]);
    void sellerRequest<{ product?: UniversalProductRecord }>(
      `/api/seller/${encodeURIComponent(sellerCode)}/products`,
      {
        method: 'POST',
        body: JSON.stringify({ ...product, id }),
      }
    ).then((res) => {
      if (res?.product) {
        setProducts((prev) => prev.map((p) => (p.id === id ? res.product! : p)));
      }
    });
  };

  const sellerUpdateProduct = (
    sellerCode: string,
    productId: string,
    patch: Partial<UniversalProductRecord>
  ) => {
    setProducts((prev) =>
      prev.map((p) =>
        p.id === productId ? { ...p, ...patch, updatedAt: new Date().toISOString() } : p
      )
    );
    void sellerRequest<{ product?: UniversalProductRecord }>(
      `/api/seller/${encodeURIComponent(sellerCode)}/products/${encodeURIComponent(productId)}`,
      {
        method: 'PATCH',
        body: JSON.stringify(patch),
      }
    ).then((res) => {
      if (res?.product) {
        setProducts((prev) => prev.map((p) => (p.id === productId ? res.product! : p)));
      }
    });
  };

  const sellerUpdateProductInventory = (
    sellerCode: string,
    productId: string,
    stockQuantity: number,
    variantStocks?: Record<string, number>
  ) => {
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id !== productId) return p;
        const updatedVariants = variantStocks
          ? p.variants.map((v) =>
              variantStocks[v.id] !== undefined
                ? {
                    ...v,
                    stockQuantity: Math.max(0, variantStocks[v.id]),
                    isAvailable: variantStocks[v.id] > 0,
                  }
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
          isAvailable:
            totalStock > 0 ||
            p.inventoryMode === 'PREPARED_FOOD' ||
            p.inventoryMode === 'MADE_TO_ORDER',
          updatedAt: new Date().toISOString(),
        };
      })
    );
    void sellerRequest<{ product?: UniversalProductRecord }>(
      `/api/seller/${encodeURIComponent(sellerCode)}/products/${encodeURIComponent(productId)}/inventory`,
      {
        method: 'PATCH',
        body: JSON.stringify({ stockQuantity, variantStocks }),
      }
    ).then((res) => {
      if (res?.product) {
        setProducts((prev) => prev.map((p) => (p.id === productId ? res.product! : p)));
      }
    });
  };

  const sellerToggleProductAvailability = (sellerCode: string, productId: string) => {
    setProducts((prev) =>
      prev.map((p) =>
        p.id === productId
          ? { ...p, isAvailable: !p.isAvailable, updatedAt: new Date().toISOString() }
          : p
      )
    );
    void sellerRequest<{ product?: UniversalProductRecord }>(
      `/api/seller/${encodeURIComponent(sellerCode)}/products/${encodeURIComponent(productId)}/availability`,
      { method: 'PATCH' }
    ).then((res) => {
      if (res?.product) {
        setProducts((prev) => prev.map((p) => (p.id === productId ? res.product! : p)));
      }
    });
  };

  const toggleProductAvailability = (productId: string) => {
    const target = products.find((p) => p.id === productId);
    setProducts((prev) =>
      prev.map((p) =>
        p.id === productId ? { ...p, isAvailable: !p.isAvailable, updatedAt: new Date().toISOString() } : p
      )
    );
    void adminRequest<{ product?: UniversalProductRecord }>(
      `/api/admin/products/${encodeURIComponent(productId)}/toggle-availability`,
      { method: 'PATCH' }
    ).then((res) => {
      if (res?.product) {
        setProducts((prev) => prev.map((p) => (p.id === productId ? res.product! : p)));
      } else {
        void hydrateFromDatabase();
      }
    });
    logAuditEvent('PRODUCT_AVAILABILITY_TOGGLED', 'Product', productId, `Toggled availability for "${target?.name}" to ${!target?.isAvailable}`);
  };

  // Service Areas & Routes (PostgreSQL-backed CRUD)
  const toggleServiceAreaStatus = (areaId: string) => {
    const area = serviceAreas.find((a) => a.id === areaId);
    setServiceAreas((prev) =>
      prev.map((a) => (a.id === areaId ? { ...a, isActive: !a.isActive } : a))
    );
    void adminRequest<{ serviceArea?: VillageServiceAreaRecord }>(
      `/api/admin/service-areas/${encodeURIComponent(areaId)}/toggle`,
      { method: 'PATCH' }
    ).then((res) => {
      if (res?.serviceArea) {
        setServiceAreas((prev) => prev.map((a) => (a.id === areaId ? res.serviceArea! : a)));
      } else {
        void hydrateFromDatabase();
      }
    });
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
    void adminRequest<{ serviceArea?: VillageServiceAreaRecord }>('/api/admin/service-areas', {
      method: 'POST',
      body: JSON.stringify({ ...newArea, id, landmarks }),
    }).then((res) => {
      if (res?.serviceArea) {
        setServiceAreas((prev) => prev.map((a) => (a.id === id ? res.serviceArea! : a)));
      } else {
        void hydrateFromDatabase();
      }
    });
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
    void adminRequest<{ serviceArea?: VillageServiceAreaRecord }>(
      `/api/admin/service-areas/${encodeURIComponent(areaId)}`,
      {
        method: 'PATCH',
        body: JSON.stringify(patch),
      }
    ).then((res) => {
      if (res?.serviceArea) {
        setServiceAreas((prev) => prev.map((a) => (a.id === areaId ? res.serviceArea! : a)));
      } else {
        void hydrateFromDatabase();
      }
    });
    logAuditEvent('SERVICE_AREA_UPDATED', 'VillageServiceArea', areaId, `Updated village service area ${areaId}`);
  };

  const updateDeliveryFee = (areaId: string, baseFeePaise: number) => {
    setServiceAreas((prev) =>
      prev.map((a) => (a.id === areaId ? { ...a, baseDeliveryFeePaise: baseFeePaise } : a))
    );
    void adminRequest<{ serviceArea?: VillageServiceAreaRecord }>(
      `/api/admin/service-areas/${encodeURIComponent(areaId)}`,
      {
        method: 'PATCH',
        body: JSON.stringify({ baseDeliveryFeePaise: baseFeePaise }),
      }
    ).then((res) => {
      if (res?.serviceArea) {
        setServiceAreas((prev) => prev.map((a) => (a.id === areaId ? res.serviceArea! : a)));
      } else {
        void hydrateFromDatabase();
      }
    });
    logAuditEvent('DELIVERY_FEE_UPDATED', 'VillageServiceArea', areaId, `Base delivery fee updated to ${baseFeePaise} paise for ${areaId}`);
  };

  const addInterVillageRoute = (route: Omit<InterVillageRouteRecord, 'id'>) => {
    const id = `rt_${Date.now()}`;
    setInterVillageRoutes((prev) => [...prev, { ...route, id }]);
    void adminRequest<{ route?: InterVillageRouteRecord }>('/api/admin/routes', {
      method: 'POST',
      body: JSON.stringify({ ...route, id }),
    }).then((res) => {
      if (res?.route) {
        setInterVillageRoutes((prev) => prev.map((r) => (r.id === id ? res.route! : r)));
      } else {
        void hydrateFromDatabase();
      }
    });
    logAuditEvent('INTER_VILLAGE_ROUTE_ADDED', 'InterVillageRoute', id, `Added route ${route.fromVillageName} -> ${route.toVillageName}`);
  };

  const updateInterVillageRoute = (routeId: string, patch: Partial<InterVillageRouteRecord>) => {
    setInterVillageRoutes((prev) => prev.map((r) => (r.id === routeId ? { ...r, ...patch } : r)));
    void adminRequest<{ route?: InterVillageRouteRecord }>(
      `/api/admin/routes/${encodeURIComponent(routeId)}`,
      {
        method: 'PATCH',
        body: JSON.stringify(patch),
      }
    ).then((res) => {
      if (res?.route) {
        setInterVillageRoutes((prev) => prev.map((r) => (r.id === routeId ? res.route! : r)));
      } else {
        void hydrateFromDatabase();
      }
    });
    logAuditEvent('INTER_VILLAGE_ROUTE_UPDATED', 'InterVillageRoute', routeId, `Updated route ${routeId}`);
  };

  const deleteInterVillageRoute = (routeId: string) => {
    setInterVillageRoutes((prev) => prev.filter((r) => r.id !== routeId));
    void adminRequest<{ deleted?: boolean }>(
      `/api/admin/routes/${encodeURIComponent(routeId)}`,
      { method: 'DELETE' }
    ).then((res) => {
      if (!res?.deleted) {
        void hydrateFromDatabase();
      }
    });
    logAuditEvent('INTER_VILLAGE_ROUTE_DELETED', 'InterVillageRoute', routeId, `Removed inter-village route ${routeId}`);
  };

  // Fee Rules (PostgreSQL-backed)
  const togglePilotShadowMode = (ruleId: string) => {
    const rule = feeRules.find((r) => r.id === ruleId);
    setFeeRules((prev) =>
      prev.map((r) => (r.id === ruleId ? { ...r, isPilotShadowMode: !r.isPilotShadowMode } : r))
    );
    void adminRequest<{ feeRule?: FeeRuleRecord }>(
      `/api/admin/fee-rules/${encodeURIComponent(ruleId)}/toggle-shadow`,
      { method: 'PATCH' }
    ).then((res) => {
      if (res?.feeRule) {
        setFeeRules((prev) => prev.map((r) => (r.id === ruleId ? res.feeRule! : r)));
      } else {
        void hydrateFromDatabase();
      }
    });
    logAuditEvent('FEE_SHADOW_MODE_TOGGLED', 'FeeRule', ruleId, `Rule ${rule?.name} shadow mode set to ${!rule?.isPilotShadowMode}`);
  };

  const createFeeRule = (rule: Omit<FeeRuleRecord, 'id' | 'status'>) => {
    const id = `fee_${Date.now()}`;
    setFeeRules((prev) => [{ ...rule, id, status: 'ACTIVE' }, ...prev]);
    void adminRequest<{ feeRule?: FeeRuleRecord }>('/api/admin/fee-rules', {
      method: 'POST',
      body: JSON.stringify({ ...rule, id }),
    }).then((res) => {
      if (res?.feeRule) {
        setFeeRules((prev) => prev.map((r) => (r.id === id ? res.feeRule! : r)));
      } else {
        void hydrateFromDatabase();
      }
    });
    logAuditEvent('FEE_RULE_CREATED', 'FeeRule', id, `Created fee rule ${rule.name}: ${rule.commissionBps} bps`);
  };

  const updateFeeRule = (ruleId: string, patch: Partial<FeeRuleRecord>) => {
    setFeeRules((prev) => prev.map((r) => (r.id === ruleId ? { ...r, ...patch } : r)));
    void adminRequest<{ feeRule?: FeeRuleRecord }>(
      `/api/admin/fee-rules/${encodeURIComponent(ruleId)}`,
      {
        method: 'PATCH',
        body: JSON.stringify(patch),
      }
    ).then((res) => {
      if (res?.feeRule) {
        setFeeRules((prev) => prev.map((r) => (r.id === ruleId ? res.feeRule! : r)));
      } else {
        void hydrateFromDatabase();
      }
    });
    logAuditEvent('FEE_RULE_UPDATED', 'FeeRule', ruleId, `Updated fee rule ${ruleId}`);
  };

  const deprecateFeeRule = (ruleId: string) => {
    const rule = feeRules.find((r) => r.id === ruleId);
    setFeeRules((prev) =>
      prev.map((r) => (r.id === ruleId ? { ...r, status: r.status === 'ACTIVE' ? 'DEPRECATED' : 'ACTIVE' } : r))
    );
    void adminRequest<{ feeRule?: FeeRuleRecord }>(
      `/api/admin/fee-rules/${encodeURIComponent(ruleId)}/toggle-status`,
      { method: 'PATCH' }
    ).then((res) => {
      if (res?.feeRule) {
        setFeeRules((prev) => prev.map((r) => (r.id === ruleId ? res.feeRule! : r)));
      } else {
        void hydrateFromDatabase();
      }
    });
    logAuditEvent('FEE_RULE_STATUS_CHANGED', 'FeeRule', ruleId, `Toggled status for rule ${rule?.name || ruleId}`);
  };

  // Offers & Coupons (PostgreSQL-backed)
  const addOffer = (offer: Omit<OfferCouponRecord, 'id' | 'usedCount'>) => {
    const id = `off_${Date.now()}`;
    const normalizedCode = offer.code.trim().toUpperCase();
    setOffers((prev) => [{ ...offer, id, code: normalizedCode, usedCount: 0 }, ...prev]);
    void adminRequest<{ offer?: OfferCouponRecord }>('/api/admin/offers', {
      method: 'POST',
      body: JSON.stringify({ ...offer, id, code: normalizedCode }),
    }).then((res) => {
      if (res?.offer) {
        setOffers((prev) => prev.map((o) => (o.id === id ? res.offer! : o)));
      } else {
        void hydrateFromDatabase();
      }
    });
    logAuditEvent('OFFER_CREATED', 'OfferCoupon', id, `Created coupon ${normalizedCode} (${offer.title})`);
  };

  const updateOffer = (offerId: string, patch: Partial<OfferCouponRecord>) => {
    setOffers((prev) => prev.map((o) => (o.id === offerId ? { ...o, ...patch } : o)));
    void adminRequest<{ offer?: OfferCouponRecord }>(
      `/api/admin/offers/${encodeURIComponent(offerId)}`,
      {
        method: 'PATCH',
        body: JSON.stringify(patch),
      }
    ).then((res) => {
      if (res?.offer) {
        setOffers((prev) => prev.map((o) => (o.id === offerId ? res.offer! : o)));
      } else {
        void hydrateFromDatabase();
      }
    });
    logAuditEvent('OFFER_UPDATED', 'OfferCoupon', offerId, `Updated offer ${offerId}`);
  };

  const toggleOfferStatus = (offerId: string) => {
    const target = offers.find((o) => o.id === offerId);
    setOffers((prev) => prev.map((o) => (o.id === offerId ? { ...o, isActive: !o.isActive } : o)));
    void adminRequest<{ offer?: OfferCouponRecord }>(
      `/api/admin/offers/${encodeURIComponent(offerId)}/toggle`,
      { method: 'PATCH' }
    ).then((res) => {
      if (res?.offer) {
        setOffers((prev) => prev.map((o) => (o.id === offerId ? res.offer! : o)));
      } else {
        void hydrateFromDatabase();
      }
    });
    logAuditEvent('OFFER_TOGGLED', 'OfferCoupon', offerId, `Coupon ${target?.code} set to ${!target?.isActive}`);
  };

  const deleteOffer = (offerId: string) => {
    const target = offers.find((o) => o.id === offerId);
    setOffers((prev) => prev.filter((o) => o.id !== offerId));
    void adminRequest<{ deleted?: boolean }>(
      `/api/admin/offers/${encodeURIComponent(offerId)}`,
      { method: 'DELETE' }
    ).then((res) => {
      if (!res?.deleted) {
        void hydrateFromDatabase();
      }
    });
    logAuditEvent('OFFER_DELETED', 'OfferCoupon', offerId, `Deleted coupon ${target?.code || offerId}`);
  };

  // Support Cases (PostgreSQL-backed)
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
    void adminRequest<{ supportCase?: SupportCaseRecord }>(
      `/api/admin/support-cases/${encodeURIComponent(caseId)}`,
      {
        method: 'PATCH',
        body: JSON.stringify({ status, resolutionNotes, approvedRefundPaise }),
      }
    ).then((res) => {
      if (res?.supportCase) {
        setSupportCases((prev) => prev.map((c) => (c.id === caseId ? res.supportCase! : c)));
      } else {
        void hydrateFromDatabase();
      }
    });
    logAuditEvent(
      `SUPPORT_CASE_${status}`,
      'SupportCase',
      caseId,
      `Support case ${caseId} marked as ${status}. Resolution: ${resolutionNotes}`,
      resolutionNotes,
      approvedRefundPaise !== undefined ? { approvedRefundPaise } : undefined
    );
  };

  // Platform Settings (PostgreSQL-backed)
  const updatePlatformSettings = (patch: Partial<PlatformSettingsRecord>) => {
    setPlatformSettings((prev) => ({ ...prev, ...patch }));
    void adminRequest<{ platformSettings?: PlatformSettingsRecord }>(
      '/api/admin/platform-settings',
      {
        method: 'PATCH',
        body: JSON.stringify(patch),
      }
    ).then((res) => {
      if (res?.platformSettings) {
        setPlatformSettings(res.platformSettings);
      } else {
        void hydrateFromDatabase();
      }
    });
    logAuditEvent('PLATFORM_SETTINGS_UPDATED', 'PlatformSettings', 'global', 'Updated global platform settings', undefined, patch as Record<string, unknown>);
  };

  // Audit Log Maintenance (PostgreSQL-backed)
  const clearAuditLogs = () => {
    const freshLog: AuditLogRecord = {
      id: `aud_${Date.now()}`,
      actor: currentAdmin.name,
      actorRole: currentAdmin.role,
      actionType: 'AUDIT_LOGS_PURGED',
      targetEntity: 'AuditLog',
      targetId: 'all',
      timestamp: new Date().toISOString(),
      ipAddress: 'server',
      details: 'Audit trail purged and archived by Super Admin authorization.',
      reason: 'Administrative purge',
    };
    setAuditLogs([freshLog]);
    void adminRequest<{ auditLog?: AuditLogRecord }>('/api/admin/audit-logs', {
      method: 'DELETE',
    }).then((res) => {
      if (res?.auditLog) {
        setAuditLogs([res.auditLog]);
      } else {
        void hydrateFromDatabase();
      }
    });
  };

  // --- EXTENDED ENTERPRISE ADMIN ACTIONS (PostgreSQL-backed) ---
  const toggleCustomerBlock = (customerId: string, block: boolean, reason: string) => {
    setCustomers((prev) =>
      prev.map((c) =>
        c.id === customerId
          ? { ...c, status: block ? 'BLOCKED' : 'ACTIVE', blockReason: block ? reason : undefined }
          : c
      )
    );
    void adminRequest<{ customer?: AdminCustomerRecord }>(
      `/api/admin/customers/${encodeURIComponent(customerId)}/status`,
      {
        method: 'PATCH',
        body: JSON.stringify({ block, reason }),
      }
    ).then((res) => {
      if (res?.customer) {
        setCustomers((prev) => prev.map((c) => (c.id === customerId ? res.customer! : c)));
      } else {
        void hydrateFromDatabase();
      }
    });
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
    void adminRequest<{ customer?: AdminCustomerRecord }>(
      `/api/admin/customers/${encodeURIComponent(customerId)}/notes`,
      {
        method: 'PATCH',
        body: JSON.stringify({ notes }),
      }
    ).then((res) => {
      if (res?.customer) {
        setCustomers((prev) => prev.map((c) => (c.id === customerId ? res.customer! : c)));
      } else {
        void hydrateFromDatabase();
      }
    });
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
    void adminRequest<{ payout?: SellerPayoutRecord }>(
      `/api/admin/payouts/${encodeURIComponent(payoutId)}/settle`,
      {
        method: 'POST',
        body: JSON.stringify(payload),
      }
    ).then((res) => {
      if (res?.payout) {
        setPayouts((prev) => prev.map((p) => (p.id === payoutId ? res.payout! : p)));
      } else {
        void hydrateFromDatabase();
      }
    });
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
    void adminRequest<{ payout?: SellerPayoutRecord }>(
      `/api/admin/payouts/${encodeURIComponent(payoutId)}/processing`,
      { method: 'PATCH' }
    ).then((res) => {
      if (res?.payout) {
        setPayouts((prev) => prev.map((p) => (p.id === payoutId ? res.payout! : p)));
      } else {
        void hydrateFromDatabase();
      }
    });
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
    void adminRequest<{ refund?: RefundLedgerRecord }>(
      `/api/admin/refunds/${encodeURIComponent(refundId)}/status`,
      {
        method: 'PATCH',
        body: JSON.stringify({ status, reason }),
      }
    ).then((res) => {
      if (res?.refund) {
        setRefundLedger((prev) => prev.map((r) => (r.id === refundId ? res.refund! : r)));
      } else {
        void hydrateFromDatabase();
      }
    });
    logAuditEvent(
      'REFUND_STATUS_UPDATED',
      'Refund',
      refundId,
      `Updated refund record status to ${status}`,
      reason
    );
  };

  const addCmsBanner = (banner: Omit<CmsBannerRecord, 'id'>) => {
    const id = `bnr_${Date.now()}`;
    const created: CmsBannerRecord = { ...banner, id };
    setCmsBanners((prev) => [created, ...prev]);
    void adminRequest<{ banner?: CmsBannerRecord }>('/api/admin/cms/banners', {
      method: 'POST',
      body: JSON.stringify(created),
    }).then((res) => {
      if (res?.banner) {
        setCmsBanners((prev) => prev.map((b) => (b.id === id ? res.banner! : b)));
      } else {
        void hydrateFromDatabase();
      }
    });
    logAuditEvent('CMS_BANNER_CREATED', 'CmsBanner', created.id, `Created banner "${created.title}" (${created.placement})`);
  };

  const updateCmsBanner = (bannerId: string, patch: Partial<CmsBannerRecord>) => {
    setCmsBanners((prev) => prev.map((b) => (b.id === bannerId ? { ...b, ...patch } : b)));
    void adminRequest<{ banner?: CmsBannerRecord }>(
      `/api/admin/cms/banners/${encodeURIComponent(bannerId)}`,
      {
        method: 'PATCH',
        body: JSON.stringify(patch),
      }
    ).then((res) => {
      if (res?.banner) {
        setCmsBanners((prev) => prev.map((b) => (b.id === bannerId ? res.banner! : b)));
      } else {
        void hydrateFromDatabase();
      }
    });
    logAuditEvent('CMS_BANNER_UPDATED', 'CmsBanner', bannerId, `Updated CMS banner ${bannerId}`);
  };

  const toggleCmsBannerStatus = (bannerId: string) => {
    setCmsBanners((prev) => prev.map((b) => (b.id === bannerId ? { ...b, isActive: !b.isActive } : b)));
    void adminRequest<{ banner?: CmsBannerRecord }>(
      `/api/admin/cms/banners/${encodeURIComponent(bannerId)}/toggle`,
      { method: 'PATCH' }
    ).then((res) => {
      if (res?.banner) {
        setCmsBanners((prev) => prev.map((b) => (b.id === bannerId ? res.banner! : b)));
      } else {
        void hydrateFromDatabase();
      }
    });
    logAuditEvent('CMS_BANNER_TOGGLED', 'CmsBanner', bannerId, 'Toggled homepage banner visibility.');
  };

  const deleteCmsBanner = (bannerId: string) => {
    setCmsBanners((prev) => prev.filter((b) => b.id !== bannerId));
    void adminRequest<{ deleted?: boolean }>(
      `/api/admin/cms/banners/${encodeURIComponent(bannerId)}`,
      { method: 'DELETE' }
    ).then((res) => {
      if (!res?.deleted) {
        void hydrateFromDatabase();
      }
    });
    logAuditEvent('CMS_BANNER_DELETED', 'CmsBanner', bannerId, 'Deleted CMS promotional banner.');
  };

  const toggleFeaturedSeller = (sellerId: string) => {
    const exists = featuredSellerIds.includes(sellerId);
    setFeaturedSellerIds((prev) =>
      prev.includes(sellerId) ? prev.filter((id) => id !== sellerId) : [...prev, sellerId]
    );
    void adminRequest<{ featuredSellerIds?: string[] }>(
      `/api/admin/cms/featured-sellers/${encodeURIComponent(sellerId)}/toggle`,
      { method: 'POST' }
    ).then((res) => {
      if (Array.isArray(res?.featuredSellerIds)) {
        setFeaturedSellerIds(res.featuredSellerIds);
      } else {
        void hydrateFromDatabase();
      }
    });
    logAuditEvent(
      exists ? 'SELLER_UNFEATURED' : 'SELLER_FEATURED',
      'Seller',
      sellerId,
      exists ? 'Removed shop from homepage Featured Stores.' : 'Pinned shop to homepage Featured Stores.'
    );
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
    void adminRequest<{ policy?: CmsPolicyPageRecord }>(
      `/api/admin/cms/policies/${encodeURIComponent(policyId)}`,
      {
        method: 'PATCH',
        body: JSON.stringify(patch),
      }
    ).then((res) => {
      if (res?.policy) {
        setCmsPolicies((prev) => prev.map((p) => (p.id === policyId ? res.policy! : p)));
      } else {
        void hydrateFromDatabase();
      }
    });
    logAuditEvent('CMS_POLICY_UPDATED', 'CmsPolicy', policyId, `Published policy revision ${patch.version}`);
  };

  const moderateReview = (reviewId: string, status: CustomerReviewRecord['status'], notes?: string) => {
    setReviews((prev) =>
      prev.map((r) => (r.id === reviewId ? { ...r, status, moderationNotes: notes || r.moderationNotes } : r))
    );
    void adminRequest<{ review?: CustomerReviewRecord }>(
      `/api/admin/reviews/${encodeURIComponent(reviewId)}/moderate`,
      {
        method: 'PATCH',
        body: JSON.stringify({ status, notes }),
      }
    ).then((res) => {
      if (res?.review) {
        setReviews((prev) => prev.map((r) => (r.id === reviewId ? res.review! : r)));
      } else {
        void hydrateFromDatabase();
      }
    });
    logAuditEvent('REVIEW_MODERATED', 'CustomerReview', reviewId, `Changed review status to ${status}`, notes);
  };

  const deleteReview = (reviewId: string) => {
    setReviews((prev) => prev.filter((r) => r.id !== reviewId));
    void adminRequest<{ deleted?: boolean }>(
      `/api/admin/reviews/${encodeURIComponent(reviewId)}`,
      { method: 'DELETE' }
    ).then((res) => {
      if (!res?.deleted) {
        void hydrateFromDatabase();
      }
    });
    logAuditEvent('REVIEW_DELETED', 'CustomerReview', reviewId, 'Removed abusive/spam customer review.');
  };

  const sendBroadcast = (
    broadcast: Omit<BroadcastMessageRecord, 'id' | 'sentAt' | 'createdBy' | 'deliveredCount'>
  ) => {
    const id = `brd_${Date.now()}`;
    const created: BroadcastMessageRecord = {
      ...broadcast,
      id,
      deliveredCount: broadcast.status === 'SENT' ? Math.max(1, Math.round(broadcast.estimatedReach * 0.97)) : 0,
      sentAt: new Date().toISOString(),
      createdBy: currentAdmin.name,
    };
    setBroadcasts((prev) => [created, ...prev]);
    void adminRequest<{ broadcast?: BroadcastMessageRecord }>('/api/admin/broadcasts', {
      method: 'POST',
      body: JSON.stringify({ ...broadcast, id }),
    }).then((res) => {
      if (res?.broadcast) {
        setBroadcasts((prev) => prev.map((b) => (b.id === id ? res.broadcast! : b)));
      } else {
        void hydrateFromDatabase();
      }
    });
    logAuditEvent(
      'BROADCAST_DISPATCHED',
      'Broadcast',
      created.id,
      `${created.status === 'SENT' ? 'Sent' : 'Scheduled'} "${created.title}" via ${created.channel} to ${created.audience}`
    );
  };

  const deleteBroadcast = (broadcastId: string) => {
    setBroadcasts((prev) => prev.filter((b) => b.id !== broadcastId));
    void adminRequest<{ deleted?: boolean }>(
      `/api/admin/broadcasts/${encodeURIComponent(broadcastId)}`,
      { method: 'DELETE' }
    ).then((res) => {
      if (!res?.deleted) {
        void hydrateFromDatabase();
      }
    });
    logAuditEvent('BROADCAST_DELETED', 'Broadcast', broadcastId, 'Deleted broadcast entry.');
  };

  const addTaxSlab = (slab: Omit<TaxSlabRecord, 'id'>) => {
    const id = `tax_${Date.now()}`;
    const created: TaxSlabRecord = { ...slab, id };
    setTaxSlabs((prev) => [created, ...prev]);
    void adminRequest<{ taxSlab?: TaxSlabRecord }>('/api/admin/tax-slabs', {
      method: 'POST',
      body: JSON.stringify(created),
    }).then((res) => {
      if (res?.taxSlab) {
        setTaxSlabs((prev) => prev.map((t) => (t.id === id ? res.taxSlab! : t)));
      } else {
        void hydrateFromDatabase();
      }
    });
    logAuditEvent('TAX_SLAB_CREATED', 'TaxSlab', created.id, `Added ${created.gstPercent}% GST slab "${created.name}"`);
  };

  const updateTaxSlab = (slabId: string, patch: Partial<TaxSlabRecord>) => {
    setTaxSlabs((prev) => prev.map((t) => (t.id === slabId ? { ...t, ...patch } : t)));
    void adminRequest<{ taxSlab?: TaxSlabRecord }>(
      `/api/admin/tax-slabs/${encodeURIComponent(slabId)}`,
      {
        method: 'PATCH',
        body: JSON.stringify(patch),
      }
    ).then((res) => {
      if (res?.taxSlab) {
        setTaxSlabs((prev) => prev.map((t) => (t.id === slabId ? res.taxSlab! : t)));
      } else {
        void hydrateFromDatabase();
      }
    });
    logAuditEvent('TAX_SLAB_UPDATED', 'TaxSlab', slabId, `Updated GST slab ${slabId}`);
  };

  const toggleTaxSlabStatus = (slabId: string) => {
    setTaxSlabs((prev) => prev.map((t) => (t.id === slabId ? { ...t, isActive: !t.isActive } : t)));
    void adminRequest<{ taxSlab?: TaxSlabRecord }>(
      `/api/admin/tax-slabs/${encodeURIComponent(slabId)}/toggle`,
      { method: 'PATCH' }
    ).then((res) => {
      if (res?.taxSlab) {
        setTaxSlabs((prev) => prev.map((t) => (t.id === slabId ? res.taxSlab! : t)));
      } else {
        void hydrateFromDatabase();
      }
    });
    logAuditEvent('TAX_SLAB_TOGGLED', 'TaxSlab', slabId, 'Toggled GST slab status.');
  };

  const deleteTaxSlab = (slabId: string) => {
    setTaxSlabs((prev) => prev.filter((t) => t.id !== slabId));
    void adminRequest<{ deleted?: boolean }>(
      `/api/admin/tax-slabs/${encodeURIComponent(slabId)}`,
      { method: 'DELETE' }
    ).then((res) => {
      if (!res?.deleted) {
        void hydrateFromDatabase();
      }
    });
    logAuditEvent('TAX_SLAB_DELETED', 'TaxSlab', slabId, 'Deleted GST slab.');
  };

  const addCancellationRule = (rule: Omit<CancellationPolicyRuleRecord, 'id'>) => {
    const id = `can_${Date.now()}`;
    const created: CancellationPolicyRuleRecord = { ...rule, id, code: rule.code.trim().toUpperCase() };
    setCancellationRules((prev) => [created, ...prev]);
    void adminRequest<{ cancellationRule?: CancellationPolicyRuleRecord }>('/api/admin/cancellation-rules', {
      method: 'POST',
      body: JSON.stringify(created),
    }).then((res) => {
      if (res?.cancellationRule) {
        setCancellationRules((prev) => prev.map((r) => (r.id === id ? res.cancellationRule! : r)));
      } else {
        void hydrateFromDatabase();
      }
    });
    logAuditEvent('CANCELLATION_RULE_CREATED', 'CancellationPolicy', created.id, `Added rule "${created.code}"`);
  };

  const updateCancellationRule = (ruleId: string, patch: Partial<CancellationPolicyRuleRecord>) => {
    setCancellationRules((prev) => prev.map((r) => (r.id === ruleId ? { ...r, ...patch } : r)));
    void adminRequest<{ cancellationRule?: CancellationPolicyRuleRecord }>(
      `/api/admin/cancellation-rules/${encodeURIComponent(ruleId)}`,
      {
        method: 'PATCH',
        body: JSON.stringify(patch),
      }
    ).then((res) => {
      if (res?.cancellationRule) {
        setCancellationRules((prev) => prev.map((r) => (r.id === ruleId ? res.cancellationRule! : r)));
      } else {
        void hydrateFromDatabase();
      }
    });
    logAuditEvent('CANCELLATION_RULE_UPDATED', 'CancellationPolicy', ruleId, `Updated cancellation rule ${ruleId}`);
  };

  const toggleCancellationRuleStatus = (ruleId: string) => {
    setCancellationRules((prev) => prev.map((r) => (r.id === ruleId ? { ...r, isActive: !r.isActive } : r)));
    void adminRequest<{ cancellationRule?: CancellationPolicyRuleRecord }>(
      `/api/admin/cancellation-rules/${encodeURIComponent(ruleId)}/toggle`,
      { method: 'PATCH' }
    ).then((res) => {
      if (res?.cancellationRule) {
        setCancellationRules((prev) => prev.map((r) => (r.id === ruleId ? res.cancellationRule! : r)));
      } else {
        void hydrateFromDatabase();
      }
    });
    logAuditEvent('CANCELLATION_RULE_TOGGLED', 'CancellationPolicy', ruleId, 'Toggled cancellation rule.');
  };

  const deleteCancellationRule = (ruleId: string) => {
    setCancellationRules((prev) => prev.filter((r) => r.id !== ruleId));
    void adminRequest<{ deleted?: boolean }>(
      `/api/admin/cancellation-rules/${encodeURIComponent(ruleId)}`,
      { method: 'DELETE' }
    ).then((res) => {
      if (!res?.deleted) {
        void hydrateFromDatabase();
      }
    });
    logAuditEvent('CANCELLATION_RULE_DELETED', 'CancellationPolicy', ruleId, 'Deleted cancellation rule.');
  };

  const addDeliveryPartner = (
    partner: Omit<DeliveryPartnerRecord, 'id' | 'completedDeliveries' | 'rating' | 'joinedAt'>
  ) => {
    const id = `rid_${Date.now()}`;
    const created: DeliveryPartnerRecord = {
      ...partner,
      id,
      completedDeliveries: 0,
      rating: 5.0,
      joinedAt: new Date().toISOString().split('T')[0],
    };
    setDeliveryPartners((prev) => [created, ...prev]);
    void adminRequest<{ deliveryPartner?: DeliveryPartnerRecord }>('/api/admin/delivery-partners', {
      method: 'POST',
      body: JSON.stringify({ ...partner, id }),
    }).then((res) => {
      if (res?.deliveryPartner) {
        setDeliveryPartners((prev) => prev.map((d) => (d.id === id ? res.deliveryPartner! : d)));
      } else {
        void hydrateFromDatabase();
      }
    });
    logAuditEvent('DELIVERY_PARTNER_ADDED', 'DeliveryPartner', created.id, `Registered delivery partner "${created.name}" (${created.villageName})`);
  };

  const updateDeliveryPartner = (partnerId: string, patch: Partial<DeliveryPartnerRecord>) => {
    setDeliveryPartners((prev) => prev.map((d) => (d.id === partnerId ? { ...d, ...patch } : d)));
    void adminRequest<{ deliveryPartner?: DeliveryPartnerRecord }>(
      `/api/admin/delivery-partners/${encodeURIComponent(partnerId)}`,
      {
        method: 'PATCH',
        body: JSON.stringify(patch),
      }
    ).then((res) => {
      if (res?.deliveryPartner) {
        setDeliveryPartners((prev) =>
          prev.map((d) => (d.id === partnerId ? res.deliveryPartner! : d))
        );
      } else {
        void hydrateFromDatabase();
      }
    });
    logAuditEvent('DELIVERY_PARTNER_UPDATED', 'DeliveryPartner', partnerId, `Updated delivery partner ${partnerId}`);
  };

  const deleteDeliveryPartner = (partnerId: string) => {
    setDeliveryPartners((prev) => prev.filter((d) => d.id !== partnerId));
    void adminRequest<{ deleted?: boolean }>(
      `/api/admin/delivery-partners/${encodeURIComponent(partnerId)}`,
      { method: 'DELETE' }
    ).then((res) => {
      if (!res?.deleted) {
        void hydrateFromDatabase();
      }
    });
    logAuditEvent('DELIVERY_PARTNER_DELETED', 'DeliveryPartner', partnerId, 'Removed delivery partner from fleet registry.');
  };

  const resetAdminData = () => {
    Object.values(STORAGE_KEYS).forEach((k) => {
      try { localStorage.removeItem(k); } catch {}
    });
    setAdminUsers(INITIAL_ADMIN_USERS);
    setCurrentAdminId(INITIAL_ADMIN_USERS[0].id);
    setRolePermissions(INITIAL_ROLE_PERMISSIONS);
    void hydrateFromDatabase();
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
        deleteProduct,
        moderateProduct,
        updateProductInventory,
        toggleProductAvailability,
        sellerCreateProduct,
        sellerUpdateProduct,
        sellerUpdateProductInventory,
        sellerToggleProductAvailability,
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
        adminOrders,
        refreshAdminOrders,
        lastApiError,
        clearApiError,
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
