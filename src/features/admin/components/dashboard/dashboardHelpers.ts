/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  AdminCustomerRecord,
  AdminModuleKey,
  AuditLogRecord,
  CategoryRecord,
  CustomerReviewRecord,
  MasterSellerRecord,
  PaymentTransactionRecord,
  RefundLedgerRecord,
  SellerApplication,
  SellerPayoutRecord,
  UniversalProductRecord,
  VerticalConfigRecord,
  VillageServiceAreaRecord,
} from '../../../../types/admin';
import { Order, OrderStatus } from '../../../../types/order';
import { formatINR } from '../../../../utils/currency';
import {
  FinanceOverviewMetrics,
  computeFinanceOverview,
} from '../finance/financeHelpers';
import {
  computeSellerFinancialSummary,
  computeSellerOrderMetrics,
  getResolvedKycStatus,
  getSellerOrders,
  getSellerPayouts,
  getSellerProducts,
  getSellerRefunds,
} from '../sellers/seller360Helpers';

export type DashboardDatePreset = '7D' | '30D' | '90D' | 'CUSTOM' | 'ALL';
export type SalesGranularity = 'DAILY' | 'WEEKLY' | 'MONTHLY';

const COMPLETED_STATUSES: ReadonlySet<OrderStatus> = new Set(['completed']);
const CANCELLED_STATUSES: ReadonlySet<OrderStatus> = new Set([
  'cancelled',
  'rejected',
  'delivery_failed',
]);
const PENDING_STATUSES: ReadonlySet<OrderStatus> = new Set([
  'placed',
  'pending',
  'accepted',
  'preparing',
  'ready_for_pickup',
  'ready_for_delivery',
  'out_for_delivery',
]);

export function isSameLocalDay(isoDate: string, refDate: Date = new Date()): boolean {
  const d = new Date(isoDate);
  if (Number.isNaN(d.getTime())) return false;
  return (
    d.getFullYear() === refDate.getFullYear() &&
    d.getMonth() === refDate.getMonth() &&
    d.getDate() === refDate.getDate()
  );
}

export function matchesDashboardDateFilter(
  isoDate: string | undefined,
  preset: DashboardDatePreset,
  customFrom: string,
  customTo: string
): boolean {
  if (preset === 'ALL') return true;
  if (!isoDate) return false;
  const ts = new Date(isoDate).getTime();
  if (Number.isNaN(ts)) return false;

  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;

  if (preset === '7D') return ts >= now - 7 * dayMs;
  if (preset === '30D') return ts >= now - 30 * dayMs;
  if (preset === '90D') return ts >= now - 90 * dayMs;

  if (preset === 'CUSTOM') {
    if (customFrom) {
      const fromTs = new Date(`${customFrom}T00:00:00`).getTime();
      if (!Number.isNaN(fromTs) && ts < fromTs) return false;
    }
    if (customTo) {
      const toTs = new Date(`${customTo}T23:59:59.999`).getTime();
      if (!Number.isNaN(toTs) && ts > toTs) return false;
    }
  }
  return true;
}

export interface DashboardKpiSummary {
  // Orders & GMV
  totalGmvPaise: number;
  totalOrders: number;
  todaysOrders: number;
  completedOrders: number;
  pendingOrders: number;
  cancelledOrders: number;
  returnedOrRefundedOrders: number;

  // Customers & Sellers
  totalCustomers: number;
  activeCustomers: number;
  totalSellers: number;
  activeSellers: number;
  pendingSellerKyc: number;
  pendingApplicationsCount: number;

  // Products & Villages
  totalProducts: number;
  activeProducts: number;
  inactiveProducts: number;
  totalVillages: number;
  activeVillages: number;

  // Finance (strictly delegated to computeFinanceOverview)
  finance: FinanceOverviewMetrics;
}

export function computeDashboardKpis(params: {
  sellers: MasterSellerRecord[];
  orders: Order[];
  customers: AdminCustomerRecord[];
  products: UniversalProductRecord[];
  serviceAreas: VillageServiceAreaRecord[];
  payouts: SellerPayoutRecord[];
  paymentTransactions: PaymentTransactionRecord[];
  refundLedger: RefundLedgerRecord[];
  applications: SellerApplication[];
}): DashboardKpiSummary {
  const {
    sellers,
    orders,
    customers,
    products,
    serviceAreas,
    payouts,
    paymentTransactions,
    refundLedger,
    applications,
  } = params;

  const finance = computeFinanceOverview(payouts, paymentTransactions, refundLedger);

  const now = new Date();
  const todaysOrders = orders.filter((o) => isSameLocalDay(o.createdAt, now)).length;
  const completedOrders = orders.filter((o) => COMPLETED_STATUSES.has(o.status)).length;
  const pendingOrders = orders.filter((o) => PENDING_STATUSES.has(o.status)).length;
  const cancelledOrders = orders.filter((o) => CANCELLED_STATUSES.has(o.status)).length;
  const returnedOrRefundedOrders = orders.filter(
    (o) => o.status === 'returned' || o.status === 'refunded'
  ).length;

  const activeCustomers = customers.filter((c) => c.status === 'ACTIVE').length;
  const activeSellers = sellers.filter((s) => s.status === 'ACTIVE').length;
  const pendingSellerKyc = sellers.filter((s) => {
    const kyc = getResolvedKycStatus(s);
    return kyc === 'PENDING' || kyc === 'UNDER_REVIEW' || kyc === 'CHANGES_REQUESTED';
  }).length;
  const pendingApplicationsCount = applications.filter(
    (a) => a.status === 'PENDING_REVIEW' || a.status === 'CHANGES_REQUESTED'
  ).length;

  const activeProducts = products.filter((p) => p.isActive).length;
  const inactiveProducts = products.length - activeProducts;
  const activeVillages = serviceAreas.filter((v) => v.isActive).length;

  // Use finance.gmvPaise as single source of truth for Total GMV so KPI & Platform Revenue match 1:1
  const totalGmvPaise =
    finance.gmvPaise > 0
      ? finance.gmvPaise
      : orders
          .filter((o) => !CANCELLED_STATUSES.has(o.status))
          .reduce((sum, o) => sum + o.totalPaise, 0);

  return {
    totalGmvPaise,
    totalOrders: orders.length,
    todaysOrders,
    completedOrders,
    pendingOrders,
    cancelledOrders,
    returnedOrRefundedOrders,
    totalCustomers: customers.length,
    activeCustomers,
    totalSellers: sellers.length,
    activeSellers,
    pendingSellerKyc,
    pendingApplicationsCount,
    totalProducts: products.length,
    activeProducts,
    inactiveProducts,
    totalVillages: serviceAreas.length,
    activeVillages,
    finance,
  };
}

export interface DashboardTrendBucket {
  key: string;
  label: string;
  gmvPaise: number;
  totalOrders: number;
  completedOrders: number;
  pendingOrders: number;
  cancelledOrders: number;
  sortTs: number;
}

export interface DashboardTrendsResult {
  buckets: DashboardTrendBucket[];
  periodGmvPaise: number;
  periodOrders: number;
  periodCompleted: number;
  periodPending: number;
  periodCancelled: number;
  avgOrderValuePaise: number;
}

function getBucketKeyAndLabel(
  isoDate: string,
  granularity: SalesGranularity
): { key: string; label: string; sortTs: number } {
  const d = new Date(isoDate);
  if (granularity === 'DAILY') {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return {
      key: `${y}-${m}-${day}`,
      label: d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
      sortTs: new Date(y, d.getMonth(), d.getDate()).getTime(),
    };
  }

  if (granularity === 'WEEKLY') {
    // Monday-anchored week start
    const copy = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    const diff = (copy.getDay() + 6) % 7;
    copy.setDate(copy.getDate() - diff);
    const y = copy.getFullYear();
    const m = String(copy.getMonth() + 1).padStart(2, '0');
    const day = String(copy.getDate()).padStart(2, '0');
    return {
      key: `W-${y}-${m}-${day}`,
      label: `Wk ${copy.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}`,
      sortTs: copy.getTime(),
    };
  }

  // MONTHLY
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  return {
    key: `${y}-${m}`,
    label: d.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' }),
    sortTs: new Date(y, d.getMonth(), 1).getTime(),
  };
}

export function computeDashboardTrends(
  orders: Order[],
  datePreset: DashboardDatePreset,
  customFrom: string,
  customTo: string,
  granularity: SalesGranularity
): DashboardTrendsResult {
  const scopedOrders = orders.filter((o) =>
    matchesDashboardDateFilter(o.createdAt, datePreset, customFrom, customTo)
  );

  const map = new Map<string, DashboardTrendBucket>();

  scopedOrders.forEach((order) => {
    const { key, label, sortTs } = getBucketKeyAndLabel(order.createdAt, granularity);
    const bucket = map.get(key) || {
      key,
      label,
      gmvPaise: 0,
      totalOrders: 0,
      completedOrders: 0,
      pendingOrders: 0,
      cancelledOrders: 0,
      sortTs,
    };

    bucket.totalOrders += 1;
    // Exclude cancelled/rejected orders from GMV so sales trend reflects valid order value
    if (!CANCELLED_STATUSES.has(order.status)) {
      bucket.gmvPaise += order.totalPaise;
    }
    if (COMPLETED_STATUSES.has(order.status)) {
      bucket.completedOrders += 1;
    } else if (PENDING_STATUSES.has(order.status)) {
      bucket.pendingOrders += 1;
    } else if (CANCELLED_STATUSES.has(order.status)) {
      bucket.cancelledOrders += 1;
    }

    map.set(key, bucket);
  });

  const buckets = Array.from(map.values()).sort((a, b) => a.sortTs - b.sortTs);
  const periodGmvPaise = buckets.reduce((s, b) => s + b.gmvPaise, 0);
  const periodOrders = buckets.reduce((s, b) => s + b.totalOrders, 0);
  const periodCompleted = buckets.reduce((s, b) => s + b.completedOrders, 0);
  const periodPending = buckets.reduce((s, b) => s + b.pendingOrders, 0);
  const periodCancelled = buckets.reduce((s, b) => s + b.cancelledOrders, 0);
  const nonCancelledOrders = Math.max(0, periodOrders - periodCancelled);
  const avgOrderValuePaise =
    nonCancelledOrders > 0 ? Math.round(periodGmvPaise / nonCancelledOrders) : 0;

  return {
    buckets,
    periodGmvPaise,
    periodOrders,
    periodCompleted,
    periodPending,
    periodCancelled,
    avgOrderValuePaise,
  };
}

export interface TopSellerPerformanceRow {
  seller: MasterSellerRecord;
  totalOrders: number;
  totalSalesPaise: number;
  avgRating: number;
  activeProductCount: number;
  totalProductCount: number;
}

export function computeTopSellers(
  sellers: MasterSellerRecord[],
  orders: Order[],
  products: UniversalProductRecord[],
  payouts: SellerPayoutRecord[],
  refundLedger: RefundLedgerRecord[]
): TopSellerPerformanceRow[] {
  return sellers
    .map((seller) => {
      const sOrders = getSellerOrders(seller, orders);
      const sOrderIds = new Set(sOrders.map((o) => o.id));
      const sPayouts = getSellerPayouts(seller, payouts);
      const sRefunds = getSellerRefunds(seller, refundLedger, sOrderIds);
      const sProducts = getSellerProducts(seller, products);
      const fin = computeSellerFinancialSummary(seller, sPayouts, sRefunds);
      const ordMetrics = computeSellerOrderMetrics(seller, sOrders);

      return {
        seller,
        totalOrders: ordMetrics.displayTotalOrders,
        totalSalesPaise: fin.totalSalesGmvPaise,
        avgRating: seller.rating,
        activeProductCount: sProducts.filter((p) => p.isActive).length,
        totalProductCount: sProducts.length,
      };
    })
    .sort((a, b) => b.totalSalesPaise - a.totalSalesPaise || b.totalOrders - a.totalOrders);
}

export interface TopSellingProductRow {
  key: string;
  productId?: string;
  productRecord?: UniversalProductRecord;
  productName: string;
  sellerName: string;
  categoryName: string;
  vertical: string;
  unitsSold: number;
  revenuePaise: number;
  ordersCount: number;
  statusLabel: 'Active' | 'Inactive' | 'Pending Review' | 'Catalog Unlisted';
  statusVariant: 'success' | 'neutral' | 'warning';
}

export function computeTopSellingProducts(
  orders: Order[],
  products: UniversalProductRecord[],
  categories: CategoryRecord[],
  limit: number = 5
): TopSellingProductRow[] {
  const catNameById = new Map(categories.map((c) => [c.id, c.name]));
  const map = new Map<string, TopSellingProductRow>();

  // Aggregate dynamically from non-cancelled orders
  const validOrders = orders.filter((o) => !CANCELLED_STATUSES.has(o.status));

  validOrders.forEach((order) => {
    order.items.forEach((item) => {
      const matchedProduct = products.find(
        (p) =>
          p.id === item.productId ||
          p.name.trim().toLowerCase() === item.productName.trim().toLowerCase()
      );

      const key = matchedProduct ? matchedProduct.id : `line:${item.productName.trim().toLowerCase()}`;
      const existing = map.get(key);

      if (existing) {
        existing.unitsSold += item.requestedQuantity;
        existing.revenuePaise += item.lineTotalPaise;
        existing.ordersCount += 1;
      } else {
        const categoryName = matchedProduct
          ? catNameById.get(matchedProduct.categoryId) || matchedProduct.vertical
          : item.catalogueType === 'FOOD'
          ? 'Food & Kitchen'
          : item.catalogueType === 'GROCERY'
          ? 'Grocery & Staples'
          : item.catalogueType || 'General';

        let statusLabel: TopSellingProductRow['statusLabel'] = 'Active';
        let statusVariant: TopSellingProductRow['statusVariant'] = 'success';

        if (matchedProduct) {
          if (matchedProduct.moderationStatus === 'PENDING_REVIEW') {
            statusLabel = 'Pending Review';
            statusVariant = 'warning';
          } else if (!matchedProduct.isActive) {
            statusLabel = 'Inactive';
            statusVariant = 'neutral';
          }
        } else {
          statusLabel = 'Active';
          statusVariant = 'success';
        }

        map.set(key, {
          key,
          productId: matchedProduct?.id || item.productId,
          productRecord: matchedProduct,
          productName: matchedProduct?.name || item.productName,
          sellerName: matchedProduct?.sellerName || order.sellerName,
          categoryName,
          vertical: matchedProduct?.vertical || item.catalogueType || 'GROCERY',
          unitsSold: item.requestedQuantity,
          revenuePaise: item.lineTotalPaise,
          ordersCount: 1,
          statusLabel,
          statusVariant,
        });
      }
    });
  });

  return Array.from(map.values())
    .sort((a, b) => b.revenuePaise - a.revenuePaise || b.unitsSold - a.unitsSold)
    .slice(0, limit);
}

export interface VillageSalesRow {
  id: string;
  villageName: string;
  district?: string;
  isActive: boolean;
  totalOrders: number;
  liveOrdersCount: number;
  totalSalesPaise: number;
  activeSellers: number;
  totalSellers: number;
  customersCount: number;
  sharePct: number;
}

function normalizeVillageToken(raw?: string): string {
  if (!raw) return '';
  return raw
    .toLowerCase()
    .replace(/^v-/, '')
    .replace(/^vil_/, '')
    .replace(/\bkalan\b/g, '')
    .replace(/[^a-z0-9]/g, '')
    .trim();
}

export function computeVillageSalesOverview(
  serviceAreas: VillageServiceAreaRecord[],
  sellers: MasterSellerRecord[],
  orders: Order[],
  customers: AdminCustomerRecord[]
): VillageSalesRow[] {
  const rows: VillageSalesRow[] = [];
  const claimedOrderIds = new Set<string>();

  serviceAreas.forEach((area) => {
    const token = normalizeVillageToken(area.name);
    const idToken = normalizeVillageToken(area.id);

    const vSellers = sellers.filter(
      (s) =>
        s.villageId === area.id ||
        normalizeVillageToken(s.villageName) === token ||
        normalizeVillageToken(s.villageId) === idToken
    );

    const vOrders = orders.filter((o) => {
      const oTok = normalizeVillageToken(o.villageId);
      const addrTok = normalizeVillageToken(o.deliveryAddress?.villageName);
      return oTok === token || oTok === idToken || addrTok === token;
    });
    vOrders.forEach((o) => claimedOrderIds.add(o.id));

    const vCustomers = customers.filter((c) => {
      const cTok = normalizeVillageToken(c.villageName);
      const cIdTok = normalizeVillageToken(c.villageId);
      return cTok === token || cIdTok === token || cIdTok === idToken;
    });

    const sellerOrders = vSellers.reduce((s, m) => s + m.totalOrders, 0);
    const sellerGmv = vSellers.reduce((s, m) => s + m.gmvPaise, 0);
    const liveValidGmv = vOrders
      .filter((o) => !CANCELLED_STATUSES.has(o.status))
      .reduce((s, o) => s + o.totalPaise, 0);

    rows.push({
      id: area.id,
      villageName: area.name,
      district: area.district,
      isActive: area.isActive,
      totalOrders: Math.max(sellerOrders, vOrders.length),
      liveOrdersCount: vOrders.length,
      totalSalesPaise: Math.max(sellerGmv, liveValidGmv),
      activeSellers: vSellers.filter((s) => s.status === 'ACTIVE').length,
      totalSellers: vSellers.length,
      customersCount: vCustomers.length,
      sharePct: 0,
    });
  });

  // Also surface any live orders from neighboring/pilot villages not yet in serviceAreas
  const extraMap = new Map<string, { name: string; orders: Order[] }>();
  orders.forEach((o) => {
    if (claimedOrderIds.has(o.id)) return;
    const rawName = o.deliveryAddress?.villageName || o.villageId;
    if (!rawName) return;
    const key = normalizeVillageToken(rawName);
    const prettyName = rawName.charAt(0).toUpperCase() + rawName.slice(1);
    const prev = extraMap.get(key) || { name: prettyName, orders: [] };
    prev.orders.push(o);
    extraMap.set(key, prev);
  });

  extraMap.forEach((val, key) => {
    const liveValidGmv = val.orders
      .filter((o) => !CANCELLED_STATUSES.has(o.status))
      .reduce((s, o) => s + o.totalPaise, 0);
    const uniqueCustomerPhones = new Set(val.orders.map((o) => o.customerPhone)).size;
    rows.push({
      id: `extra-${key}`,
      villageName: val.name,
      district: 'Pilot Zone',
      isActive: true,
      totalOrders: val.orders.length,
      liveOrdersCount: val.orders.length,
      totalSalesPaise: liveValidGmv,
      activeSellers: new Set(val.orders.map((o) => o.sellerId)).size,
      totalSellers: new Set(val.orders.map((o) => o.sellerId)).size,
      customersCount: uniqueCustomerPhones,
      sharePct: 0,
    });
  });

  const totalGmv = rows.reduce((s, r) => s + r.totalSalesPaise, 0) || 1;
  return rows
    .map((r) => ({
      ...r,
      sharePct: Math.round((r.totalSalesPaise / totalGmv) * 100),
    }))
    .sort((a, b) => b.totalSalesPaise - a.totalSalesPaise || b.totalOrders - a.totalOrders);
}

export interface VerticalOverviewRow {
  id: string;
  name: string;
  isEnabled: boolean;
  ordersCount: number;
  gmvPaise: number;
  productCount: number;
  activeSellersCount: number;
  totalSellersCount: number;
  pct: number;
}

export function computeVerticalOverview(
  verticalConfigs: VerticalConfigRecord[],
  sellers: MasterSellerRecord[],
  products: UniversalProductRecord[],
  orders: Order[]
): VerticalOverviewRow[] {
  const baseRows = verticalConfigs.map((v) => {
    const vSellers = sellers.filter(
      (s) => s.vertical === v.id || s.supportedVerticals?.includes(v.id)
    );
    const primarySellers = sellers.filter((s) => s.vertical === v.id);
    const sellerGmv = primarySellers.reduce((sum, s) => sum + s.gmvPaise, 0);
    const sellerOrders = primarySellers.reduce((sum, s) => sum + s.totalOrders, 0);

    // Count live orders that contain at least one item belonging to this vertical
    const liveOrdersInVertical = orders.filter((o) =>
      o.items.some((it) => (it.catalogueType || '').toUpperCase() === v.id.toUpperCase())
    );
    const liveValidGmv = liveOrdersInVertical
      .filter((o) => !CANCELLED_STATUSES.has(o.status))
      .reduce((sum, o) => sum + o.totalPaise, 0);

    return {
      id: v.id,
      name: v.name,
      isEnabled: v.isEnabled,
      ordersCount: Math.max(sellerOrders, liveOrdersInVertical.length),
      gmvPaise: Math.max(sellerGmv, liveValidGmv),
      productCount: products.filter((p) => p.vertical === v.id).length,
      activeSellersCount: vSellers.filter((s) => s.status === 'ACTIVE').length,
      totalSellersCount: vSellers.length,
      pct: 0,
    };
  });

  const totalGmv = baseRows.reduce((s, r) => s + r.gmvPaise, 0) || 1;
  return baseRows
    .map((r) => ({ ...r, pct: Math.round((r.gmvPaise / totalGmv) * 100) }))
    .sort((a, b) => b.gmvPaise - a.gmvPaise || Number(b.isEnabled) - Number(a.isEnabled));
}

/* ============================================================================
 * SECTION 9: PENDING ADMIN ACTIONS / ATTENTION ALERTS
 * (Strictly tied to existing modules and real live counts — zero fabricated alerts)
 * ========================================================================== */

export type AdminAlertSeverity = 'CRITICAL' | 'WARNING' | 'INFO';

export interface PendingAdminAlertItem {
  id: string;
  title: string;
  description: string;
  count: number;
  severity: AdminAlertSeverity;
  targetView: AdminModuleKey;
  actionLabel: string;
}

export function computePendingAdminAlerts(params: {
  kpis: DashboardKpiSummary;
  pendingProductsCount: number;
  openSupportCasesCount: number;
  reviews: CustomerReviewRecord[];
}): PendingAdminAlertItem[] {
  const { kpis, pendingProductsCount, openSupportCasesCount, reviews } = params;
  const flaggedReviewsCount = reviews.filter((r) => r.status === 'FLAGGED').length;

  const alerts: PendingAdminAlertItem[] = [
    {
      id: 'pending_seller_kyc',
      title: 'Pending Seller KYC',
      description:
        kpis.pendingApplicationsCount > 0
          ? `${kpis.pendingSellerKyc} seller KYC review(s) & ${kpis.pendingApplicationsCount} onboarding app(s)`
          : 'Sellers awaiting KYC or document verification',
      count: kpis.pendingSellerKyc,
      severity: 'WARNING',
      targetView: 'SELLERS',
      actionLabel: 'Review KYC',
    },
    {
      id: 'pending_products',
      title: 'Products Pending Approval',
      description: 'New or edited merchant listings awaiting catalog moderation',
      count: pendingProductsCount,
      severity: 'WARNING',
      targetView: 'PRODUCTS',
      actionLabel: 'Moderate SKUs',
    },
    {
      id: 'pending_refunds',
      title: 'Pending Refund Approvals',
      description: `${formatINR(kpis.finance.pendingRefundsPaise)} awaiting refund review/completion`,
      count: kpis.finance.pendingRefundsCount,
      severity: 'CRITICAL',
      targetView: 'PAYOUTS',
      actionLabel: 'Review Refunds',
    },
    {
      id: 'failed_payments',
      title: 'Failed Payments',
      description: `${formatINR(kpis.finance.failedPaymentsPaise)} in failed payment attempts requiring check`,
      count: kpis.finance.failedPaymentsCount,
      severity: 'CRITICAL',
      targetView: 'PAYOUTS',
      actionLabel: 'Inspect Txns',
    },
    {
      id: 'open_disputes',
      title: 'Open Disputes & Complaints',
      description: 'Active customer complaints and order disputes awaiting resolution',
      count: openSupportCasesCount,
      severity: 'CRITICAL',
      targetView: 'SUPPORT',
      actionLabel: 'Resolve Cases',
    },
    {
      id: 'pending_settlements',
      title: 'Pending Seller Settlements',
      description:
        kpis.finance.failedSettlementsCount > 0
          ? `${formatINR(kpis.finance.pendingSellerSettlementsPaise)} pending (${kpis.finance.failedSettlementsCount} failed batch)`
          : `${formatINR(kpis.finance.pendingSellerSettlementsPaise)} across pending settlement batches`,
      count: kpis.finance.pendingSellerSettlementsCount,
      severity: kpis.finance.failedSettlementsCount > 0 ? 'CRITICAL' : 'INFO',
      targetView: 'PAYOUTS',
      actionLabel: 'View Payouts',
    },
    {
      id: 'flagged_reviews',
      title: 'Flagged Customer Reviews',
      description: 'Customer reviews flagged for admin moderation',
      count: flaggedReviewsCount,
      severity: 'INFO',
      targetView: 'REVIEWS',
      actionLabel: 'Moderate',
    },
  ];

  // Put active (>0) critical/warning alerts first so urgent admin items surface immediately
  const severityWeight: Record<AdminAlertSeverity, number> = {
    CRITICAL: 0,
    WARNING: 1,
    INFO: 2,
  };

  return alerts.sort((a, b) => {
    const aHas = a.count > 0 ? 0 : 1;
    const bHas = b.count > 0 ? 0 : 1;
    if (aHas !== bHas) return aHas - bHas;
    if (severityWeight[a.severity] !== severityWeight[b.severity]) {
      return severityWeight[a.severity] - severityWeight[b.severity];
    }
    return b.count - a.count;
  });
}

/* ============================================================================
 * SECTION 10: RECENT PLATFORM ACTIVITY FEED
 * (Aggregated strictly from existing context state — no new backend logger)
 * ========================================================================== */

export type DashboardActivityCategory =
  | 'ORDERS'
  | 'SELLERS'
  | 'CATALOG'
  | 'FINANCE'
  | 'ADMIN';

export type DashboardActivityKind =
  | 'ORDER_PLACED'
  | 'ORDER_COMPLETED'
  | 'SELLER_REGISTERED'
  | 'SELLER_APPROVED'
  | 'PRODUCT_ADDED'
  | 'PRODUCT_APPROVED'
  | 'PAYMENT_RECEIVED'
  | 'SETTLEMENT_COMPLETED'
  | 'REFUND_PROCESSED'
  | 'ADMIN_ACTION';

export interface DashboardActivityItem {
  id: string;
  kind: DashboardActivityKind;
  category: DashboardActivityCategory;
  title: string;
  description: string;
  actor: string;
  timestamp: string;
  sortTs: number;
  orderId?: string;
  sellerId?: string;
  targetView?: AdminModuleKey;
}

function toValidTs(iso?: string): number | null {
  if (!iso) return null;
  const ts = new Date(iso).getTime();
  return Number.isNaN(ts) ? null : ts;
}

export function buildDashboardActivityFeed(params: {
  orders: Order[];
  sellers: MasterSellerRecord[];
  products: UniversalProductRecord[];
  paymentTransactions: PaymentTransactionRecord[];
  payouts: SellerPayoutRecord[];
  refundLedger: RefundLedgerRecord[];
  auditLogs: AuditLogRecord[];
  limit?: number;
}): DashboardActivityItem[] {
  const {
    orders,
    sellers,
    products,
    paymentTransactions,
    payouts,
    refundLedger,
    auditLogs,
    limit = 30,
  } = params;

  const items: DashboardActivityItem[] = [];

  // 1. Orders Placed & Completed
  orders.forEach((order) => {
    const placedTs = toValidTs(order.createdAt);
    if (placedTs !== null) {
      items.push({
        id: `act_ord_placed_${order.id}`,
        kind: 'ORDER_PLACED',
        category: 'ORDERS',
        title: `Order Placed • ${order.orderNumber}`,
        description: `${order.customerName} ordered ${formatINR(order.totalPaise)} from ${order.sellerName}`,
        actor: order.customerName,
        timestamp: order.createdAt,
        sortTs: placedTs,
        orderId: order.id,
      });
    }

    if (order.status === 'completed') {
      const completedEvent = [...(order.statusHistory || [])]
        .reverse()
        .find((ev) => ev.toStatus === 'completed');
      const doneIso = completedEvent?.timestamp || order.updatedAt || order.createdAt;
      const doneTs = toValidTs(doneIso);
      if (doneTs !== null) {
        items.push({
          id: `act_ord_done_${order.id}`,
          kind: 'ORDER_COMPLETED',
          category: 'ORDERS',
          title: `Order Completed • ${order.orderNumber}`,
          description: `Delivered for ${order.customerName} (${formatINR(order.totalPaise)}) by ${order.sellerName}`,
          actor: order.sellerName,
          timestamp: doneIso,
          sortTs: doneTs,
          orderId: order.id,
        });
      }
    }
  });

  // 2. New Seller Registration & Seller Approved
  sellers.forEach((seller) => {
    const joinedTs = toValidTs(seller.joinedAt);
    if (joinedTs !== null) {
      items.push({
        id: `act_sel_reg_${seller.id}`,
        kind: 'SELLER_REGISTERED',
        category: 'SELLERS',
        title: `New Seller Registration • ${seller.name}`,
        description: `${seller.ownerName} registered in ${seller.villageName} (${seller.vertical})`,
        actor: seller.ownerName,
        timestamp: seller.joinedAt,
        sortTs: joinedTs,
        sellerId: seller.id,
      });
    }

    const approvalEv = (seller.activityHistory || []).find(
      (ev) => ev.type === 'KYC_APPROVED'
    );
    if (approvalEv) {
      const appTs = toValidTs(approvalEv.timestamp);
      if (appTs !== null) {
        items.push({
          id: `act_sel_app_${seller.id}_${approvalEv.id}`,
          kind: 'SELLER_APPROVED',
          category: 'SELLERS',
          title: `Seller Approved • ${seller.name}`,
          description: approvalEv.description,
          actor: approvalEv.actor || 'Admin',
          timestamp: approvalEv.timestamp,
          sortTs: appTs,
          sellerId: seller.id,
        });
      }
    }
  });

  // 3. New Product Added & Product Approved
  products.forEach((prod) => {
    const createdTs = toValidTs(prod.createdAt);
    if (createdTs !== null) {
      items.push({
        id: `act_prod_add_${prod.id}`,
        kind: 'PRODUCT_ADDED',
        category: 'CATALOG',
        title: `New Product Added • ${prod.name}`,
        description: `Listed by ${prod.sellerName} at ${formatINR(prod.pricePaise)} (${prod.vertical})`,
        actor: prod.sellerName,
        timestamp: prod.createdAt,
        sortTs: createdTs,
        targetView: 'PRODUCTS',
      });
    }

    if (prod.moderationStatus === 'APPROVED') {
      const updIso = prod.updatedAt || prod.createdAt;
      const updTs = toValidTs(updIso);
      if (updTs !== null && updIso !== prod.createdAt) {
        items.push({
          id: `act_prod_app_${prod.id}`,
          kind: 'PRODUCT_APPROVED',
          category: 'CATALOG',
          title: `Product Approved • ${prod.name}`,
          description: `Approved for customer storefront (${prod.sellerName})`,
          actor: 'Catalog Moderation',
          timestamp: updIso,
          sortTs: updTs,
          targetView: 'PRODUCTS',
        });
      }
    }
  });

  // 4. Payment Received
  paymentTransactions
    .filter((t) => t.status === 'CAPTURED')
    .forEach((txn) => {
      const ts = toValidTs(txn.createdAt);
      if (ts !== null) {
        items.push({
          id: `act_pay_rx_${txn.id}`,
          kind: 'PAYMENT_RECEIVED',
          category: 'FINANCE',
          title: `Payment Received • ${formatINR(txn.amountPaise)}`,
          description: `${txn.method} captured for order ${txn.orderId} (${txn.customerName} → ${txn.sellerName})`,
          actor: txn.customerName,
          timestamp: txn.createdAt,
          sortTs: ts,
          targetView: 'PAYOUTS',
        });
      }
    });

  // 5. Settlement Completed
  payouts
    .filter((p) => p.status === 'SETTLED')
    .forEach((payout) => {
      const iso = payout.settledAt || payout.settlementDate;
      const ts = toValidTs(iso);
      if (iso && ts !== null) {
        items.push({
          id: `act_settle_${payout.id}`,
          kind: 'SETTLEMENT_COMPLETED',
          category: 'FINANCE',
          title: `Settlement Completed • ${payout.sellerName}`,
          description: `${formatINR(payout.netPayablePaise)} settled via ${payout.paymentMode}${payout.utrNumber ? ` (UTR: ${payout.utrNumber})` : ''}`,
          actor: 'Finance Ops',
          timestamp: iso,
          sortTs: ts,
          targetView: 'PAYOUTS',
        });
      }
    });

  // 6. Refund Processed
  refundLedger
    .filter((r) => r.status === 'PROCESSED')
    .forEach((ref) => {
      const iso = ref.processedAt || ref.requestedAt;
      const ts = toValidTs(iso);
      if (iso && ts !== null) {
        const lastActor =
          ref.history && ref.history.length > 0
            ? ref.history[ref.history.length - 1].actor
            : 'Finance Admin';
        items.push({
          id: `act_ref_${ref.id}`,
          kind: 'REFUND_PROCESSED',
          category: 'FINANCE',
          title: `Refund Processed • ${formatINR(ref.amountPaise)}`,
          description: `Refunded to ${ref.customerName} for ${ref.orderId} (${ref.reason})`,
          actor: lastActor,
          timestamp: iso,
          sortTs: ts,
          targetView: 'PAYOUTS',
        });
      }
    });

  // 7. Admin Actions from existing auditLogs
  auditLogs.forEach((log) => {
    const ts = toValidTs(log.timestamp);
    if (ts !== null) {
      items.push({
        id: `act_audit_${log.id}`,
        kind: 'ADMIN_ACTION',
        category: 'ADMIN',
        title: `Admin Action • ${log.actionType.replace(/_/g, ' ')}`,
        description: `${log.details}${log.reason ? ` — ${log.reason}` : ''}`,
        actor: log.actor,
        timestamp: log.timestamp,
        sortTs: ts,
        targetView: 'AUDIT_LOGS',
      });
    }
  });

  return items.sort((a, b) => b.sortTs - a.sortTs).slice(0, limit);
}

