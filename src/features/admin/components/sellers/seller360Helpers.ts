/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  AuditLogRecord,
  CategoryRecord,
  CustomerReviewRecord,
  MasterSellerRecord,
  PaymentTransactionRecord,
  RefundLedgerRecord,
  SellerAccountStatus,
  SellerActivityEvent,
  SellerDocumentStatus,
  SellerKycStatus,
  SellerPayoutRecord,
  SupportCaseRecord,
  UniversalProductRecord,
} from '../../../../types/admin';
import { Order } from '../../../../types/order';
import { BadgeVariant } from '../../../../components/ui/Badge';

export type SellerDatePreset = 'ALL' | '7D' | '30D' | '90D' | 'CUSTOM';

export const SELLER_STATUS_META: Record<
  SellerAccountStatus,
  { label: string; variant: BadgeVariant; category: 'ACTIVE' | 'INACTIVE_SUSPENDED' | 'PENDING' | 'APPROVED' | 'REJECTED' }
> = {
  PENDING_APPROVAL: { label: 'Pending Approval', variant: 'warning', category: 'PENDING' },
  KYC_PENDING: { label: 'KYC Pending', variant: 'warning', category: 'PENDING' },
  KYC_UNDER_REVIEW: { label: 'KYC Under Review', variant: 'info', category: 'PENDING' },
  APPROVED: { label: 'Approved', variant: 'primary', category: 'APPROVED' },
  ACTIVE: { label: 'Active', variant: 'success', category: 'ACTIVE' },
  INACTIVE: { label: 'Inactive', variant: 'neutral', category: 'INACTIVE_SUSPENDED' },
  PAUSED: { label: 'Inactive (Paused)', variant: 'neutral', category: 'INACTIVE_SUSPENDED' },
  SUSPENDED: { label: 'Suspended', variant: 'error', category: 'INACTIVE_SUSPENDED' },
  REJECTED: { label: 'Rejected', variant: 'error', category: 'REJECTED' },
};

export const KYC_STATUS_META: Record<
  SellerKycStatus,
  { label: string; variant: BadgeVariant }
> = {
  PENDING: { label: 'KYC Pending', variant: 'warning' },
  UNDER_REVIEW: { label: 'KYC Under Review', variant: 'info' },
  APPROVED: { label: 'KYC Approved', variant: 'success' },
  REJECTED: { label: 'KYC Rejected', variant: 'error' },
  CHANGES_REQUESTED: { label: 'Requires Changes', variant: 'warning' },
};

export const DOC_STATUS_META: Record<
  SellerDocumentStatus,
  { label: string; variant: BadgeVariant }
> = {
  PENDING: { label: 'Pending', variant: 'warning' },
  APPROVED: { label: 'Approved', variant: 'success' },
  REJECTED: { label: 'Rejected', variant: 'error' },
  CHANGES_REQUESTED: { label: 'Requires Changes', variant: 'warning' },
};

export function getResolvedKycStatus(seller: MasterSellerRecord): SellerKycStatus {
  if (seller.kycStatus) return seller.kycStatus;
  if (seller.status === 'REJECTED') return 'REJECTED';
  if (seller.status === 'KYC_PENDING' || seller.status === 'PENDING_APPROVAL') return 'PENDING';
  if (seller.status === 'KYC_UNDER_REVIEW') return 'UNDER_REVIEW';
  return 'APPROVED';
}

export function sellerHasPendingDocuments(seller: MasterSellerRecord): boolean {
  const docs = seller.kycDocuments || [];
  return docs.some((d) => d.status === 'PENDING' || d.status === 'CHANGES_REQUESTED');
}

export function matchesSellerDateRange(
  isoOrDate: string | undefined,
  preset: SellerDatePreset,
  customFrom: string,
  customTo: string
): boolean {
  if (preset === 'ALL') return true;
  if (!isoOrDate) return false;

  const ts = new Date(isoOrDate).getTime();
  if (Number.isNaN(ts)) return false;

  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;

  if (preset === '7D') return ts >= now - 7 * dayMs;
  if (preset === '30D') return ts >= now - 30 * dayMs;
  if (preset === '90D') return ts >= now - 90 * dayMs;

  if (preset === 'CUSTOM') {
    if (customFrom) {
      const fromTs = new Date(`${customFrom}T00:00:00`).getTime();
      if (ts < fromTs) return false;
    }
    if (customTo) {
      const toTs = new Date(`${customTo}T23:59:59.999`).getTime();
      if (ts > toTs) return false;
    }
  }
  return true;
}

export function getSellerIdSet(seller: MasterSellerRecord): Set<string> {
  return new Set([seller.id, ...(seller.aliasIds || [])]);
}

function matchesSellerIdentity(
  seller: MasterSellerRecord,
  recordSellerId?: string,
  recordSellerName?: string
): boolean {
  const idSet = getSellerIdSet(seller);
  if (recordSellerId && idSet.has(recordSellerId)) return true;
  if (
    recordSellerName &&
    recordSellerName.trim().toLowerCase() === seller.name.trim().toLowerCase()
  ) {
    return true;
  }
  return false;
}

export function getSellerProducts(
  seller: MasterSellerRecord,
  allProducts: UniversalProductRecord[]
): UniversalProductRecord[] {
  return allProducts.filter((p) => matchesSellerIdentity(seller, p.sellerId, p.sellerName));
}

export function getSellerOrders(seller: MasterSellerRecord, allOrders: Order[]): Order[] {
  return allOrders
    .filter((o) => matchesSellerIdentity(seller, o.sellerId, o.sellerName))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function getSellerPayouts(
  seller: MasterSellerRecord,
  allPayouts: SellerPayoutRecord[]
): SellerPayoutRecord[] {
  return allPayouts
    .filter((p) => matchesSellerIdentity(seller, p.sellerId, p.sellerName))
    .sort(
      (a, b) =>
        new Date(b.settledAt || b.settlementDate || 0).getTime() -
        new Date(a.settledAt || a.settlementDate || 0).getTime()
    );
}

export function getSellerTransactions(
  seller: MasterSellerRecord,
  allTxns: PaymentTransactionRecord[]
): PaymentTransactionRecord[] {
  return allTxns
    .filter((t) => matchesSellerIdentity(seller, t.sellerId, t.sellerName))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function getSellerRefunds(
  seller: MasterSellerRecord,
  allRefunds: RefundLedgerRecord[],
  sellerOrderIds: Set<string>
): RefundLedgerRecord[] {
  return allRefunds
    .filter(
      (r) =>
        sellerOrderIds.has(r.orderId) ||
        matchesSellerIdentity(seller, undefined, r.sellerName)
    )
    .sort((a, b) => new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime());
}

export function getSellerReviews(
  seller: MasterSellerRecord,
  allReviews: CustomerReviewRecord[]
): CustomerReviewRecord[] {
  return allReviews
    .filter((r) => matchesSellerIdentity(seller, r.sellerId, r.sellerName))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function getSellerSupportCases(
  seller: MasterSellerRecord,
  allCases: SupportCaseRecord[]
): SupportCaseRecord[] {
  return allCases
    .filter((c) => matchesSellerIdentity(seller, c.sellerId, c.sellerName))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export interface SellerFinancialSummary {
  totalSalesGmvPaise: number;
  totalCommissionPaise: number;
  totalRefundsPaise: number;
  totalAdjustmentsPaise: number;
  totalSettledPaise: number;
  pendingSettlementPaise: number;
  processingSettlementPaise: number;
  payoutCount: number;
}

export function computeSellerFinancialSummary(
  seller: MasterSellerRecord,
  sellerPayouts: SellerPayoutRecord[],
  sellerRefunds: RefundLedgerRecord[]
): SellerFinancialSummary {
  const payoutGmv = sellerPayouts.reduce((s, p) => s + p.grossAmountPaise, 0);
  const totalSalesGmvPaise = Math.max(seller.gmvPaise, payoutGmv);

  const payoutCommission = sellerPayouts.reduce((s, p) => s + p.commissionPaise, 0);
  const totalCommissionPaise =
    payoutCommission > 0
      ? payoutCommission
      : Math.round((totalSalesGmvPaise * seller.commissionRateBps) / 10000);

  const payoutRefunds = sellerPayouts.reduce((s, p) => s + p.refundDeductionsPaise, 0);
  const ledgerRefunds = sellerRefunds
    .filter((r) => r.status !== 'REJECTED' && r.status !== 'FAILED')
    .reduce((s, r) => s + r.amountPaise, 0);
  const totalRefundsPaise = Math.max(payoutRefunds, ledgerRefunds);

  const totalAdjustmentsPaise = sellerPayouts.reduce(
    (s, p) => s + (p.otherDeductionsPaise || 0),
    0
  );

  const totalSettledPaise = sellerPayouts
    .filter((p) => p.status === 'SETTLED')
    .reduce((s, p) => s + p.netPayablePaise, 0);

  const pendingSettlementPaise = sellerPayouts
    .filter((p) => p.status === 'PENDING' || p.status === 'FAILED')
    .reduce((s, p) => s + p.netPayablePaise, 0);

  const processingSettlementPaise = sellerPayouts
    .filter((p) => p.status === 'PROCESSING')
    .reduce((s, p) => s + p.netPayablePaise, 0);

  return {
    totalSalesGmvPaise,
    totalCommissionPaise,
    totalRefundsPaise,
    totalAdjustmentsPaise,
    totalSettledPaise,
    pendingSettlementPaise,
    processingSettlementPaise,
    payoutCount: sellerPayouts.length,
  };
}

export interface SellerOrderMetrics {
  trackedLiveOrders: number;
  displayTotalOrders: number;
  completedCount: number;
  cancelledCount: number;
  returnedCount: number;
  completionRatePct: number | null;
  cancellationRatePct: number | null;
  averageOrderValuePaise: number;
}

export function computeSellerOrderMetrics(
  seller: MasterSellerRecord,
  sellerOrders: Order[]
): SellerOrderMetrics {
  const trackedLiveOrders = sellerOrders.length;
  const displayTotalOrders = Math.max(seller.totalOrders, trackedLiveOrders);

  const completedCount = sellerOrders.filter((o) => o.status === 'completed').length;
  const cancelledCount = sellerOrders.filter(
    (o) => o.status === 'cancelled' || o.status === 'rejected'
  ).length;
  const returnedCount = sellerOrders.filter(
    (o) => o.status === 'returned' || o.status === 'refunded'
  ).length;

  const completionRatePct =
    trackedLiveOrders > 0 ? Math.round((completedCount / trackedLiveOrders) * 100) : null;
  const cancellationRatePct =
    trackedLiveOrders > 0 ? Math.round((cancelledCount / trackedLiveOrders) * 100) : null;

  const liveOrderGmv = sellerOrders.reduce((s, o) => s + o.totalPaise, 0);
  const averageOrderValuePaise =
    trackedLiveOrders > 0
      ? Math.round(liveOrderGmv / trackedLiveOrders)
      : seller.totalOrders > 0
      ? Math.round(seller.gmvPaise / seller.totalOrders)
      : 0;

  return {
    trackedLiveOrders,
    displayTotalOrders,
    completedCount,
    cancelledCount,
    returnedCount,
    completionRatePct,
    cancellationRatePct,
    averageOrderValuePaise,
  };
}

export interface SellerAnalyticsTrendPoint {
  label: string;
  salesPaise: number;
  ordersCount: number;
}

export interface SellerTopProductRow {
  productName: string;
  unitsSold: number;
  revenuePaise: number;
  orderCount: number;
}

export interface SellerCategorySalesRow {
  categoryName: string;
  revenuePaise: number;
  itemCount: number;
}

export interface SellerRatingTrendPoint {
  dateLabel: string;
  rating: number;
  customerName: string;
}

export interface SellerAnalyticsData {
  salesTrend: SellerAnalyticsTrendPoint[];
  topProducts: SellerTopProductRow[];
  categorySales: SellerCategorySalesRow[];
  ratingTrend: SellerRatingTrendPoint[];
  scopedOrdersCount: number;
  scopedSalesPaise: number;
  avgOrderValuePaise: number;
  completionRatePct: number | null;
  cancellationRatePct: number | null;
  hasAnyData: boolean;
}

export function computeSellerAnalytics(
  sellerOrders: Order[],
  sellerPayouts: SellerPayoutRecord[],
  sellerProducts: UniversalProductRecord[],
  sellerReviews: CustomerReviewRecord[],
  categories: CategoryRecord[],
  datePreset: SellerDatePreset,
  customFrom: string,
  customTo: string
): SellerAnalyticsData {
  const scopedOrders = sellerOrders.filter((o) =>
    matchesSellerDateRange(o.createdAt, datePreset, customFrom, customTo)
  );
  const scopedPayouts = sellerPayouts.filter((p) =>
    matchesSellerDateRange(p.settledAt || p.settlementDate, datePreset, customFrom, customTo)
  );
  const scopedReviews = sellerReviews.filter((r) =>
    matchesSellerDateRange(r.createdAt, datePreset, customFrom, customTo)
  );

  // Build Sales & Orders Trend dynamically from orders (grouped by day) or settlement cycles if no live orders in range
  const trendMap = new Map<string, { label: string; salesPaise: number; ordersCount: number; ts: number }>();

  if (scopedOrders.length > 0) {
    scopedOrders.forEach((o) => {
      const d = new Date(o.createdAt);
      const key = d.toISOString().split('T')[0];
      const label = d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
      const prev = trendMap.get(key) || { label, salesPaise: 0, ordersCount: 0, ts: d.getTime() };
      prev.salesPaise += o.totalPaise;
      prev.ordersCount += 1;
      trendMap.set(key, prev);
    });
  } else if (scopedPayouts.length > 0) {
    scopedPayouts.forEach((p) => {
      const ts = new Date(p.settledAt || p.settlementDate || Date.now()).getTime();
      const prev = trendMap.get(p.periodLabel) || {
        label: p.periodLabel,
        salesPaise: 0,
        ordersCount: 0,
        ts,
      };
      prev.salesPaise += p.grossAmountPaise;
      prev.ordersCount += p.ordersCount;
      trendMap.set(p.periodLabel, prev);
    });
  }

  const salesTrend: SellerAnalyticsTrendPoint[] = Array.from(trendMap.values())
    .sort((a, b) => a.ts - b.ts)
    .map(({ label, salesPaise, ordersCount }) => ({ label, salesPaise, ordersCount }));

  // Top Selling Products dynamically from scoped orders
  const prodMap = new Map<string, SellerTopProductRow>();
  scopedOrders.forEach((o) => {
    o.items.forEach((it) => {
      const key = it.productName;
      const prev = prodMap.get(key) || {
        productName: it.productName,
        unitsSold: 0,
        revenuePaise: 0,
        orderCount: 0,
      };
      prev.unitsSold += it.requestedQuantity;
      prev.revenuePaise += it.lineTotalPaise;
      prev.orderCount += 1;
      prodMap.set(key, prev);
    });
  });

  const topProducts = Array.from(prodMap.values()).sort((a, b) => b.revenuePaise - a.revenuePaise);

  // Sales by Category (matching order item names to seller catalog categories, fallback to order vertical)
  const catNameById = new Map(categories.map((c) => [c.id, c.name]));
  const catSalesMap = new Map<string, SellerCategorySalesRow>();

  if (scopedOrders.length > 0) {
    scopedOrders.forEach((o) => {
      o.items.forEach((it) => {
        const catalogMatch = sellerProducts.find(
          (p) =>
            p.id === it.productId ||
            p.name.toLowerCase() === it.productName.toLowerCase()
        );
        const fallbackCat = it.catalogueType || 'GENERAL';
        const catName =
          (catalogMatch && catNameById.get(catalogMatch.categoryId)) ||
          (fallbackCat === 'FOOD'
            ? 'Food & Kitchen'
            : fallbackCat === 'GROCERY'
            ? 'Grocery & Staples'
            : fallbackCat);

        const prev = catSalesMap.get(catName) || {
          categoryName: catName,
          revenuePaise: 0,
          itemCount: 0,
        };
        prev.revenuePaise += it.lineTotalPaise;
        prev.itemCount += it.requestedQuantity;
        catSalesMap.set(catName, prev);
      });
    });
  } else if (sellerProducts.length > 0 && scopedPayouts.length > 0) {
    // Distribute settlement sales proportionally across seller's active catalog categories
    const totalPayoutGmv = scopedPayouts.reduce((s, p) => s + p.grossAmountPaise, 0);
    const byCat = new Map<string, number>();
    sellerProducts.forEach((p) => {
      const catName = catNameById.get(p.categoryId) || p.vertical;
      byCat.set(catName, (byCat.get(catName) || 0) + 1);
    });
    byCat.forEach((count, catName) => {
      catSalesMap.set(catName, {
        categoryName: catName,
        revenuePaise: Math.round((totalPayoutGmv * count) / sellerProducts.length),
        itemCount: count,
      });
    });
  }

  const categorySales = Array.from(catSalesMap.values()).sort(
    (a, b) => b.revenuePaise - a.revenuePaise
  );

  // Customer Rating Trend dynamically from scoped reviews
  const ratingTrend: SellerRatingTrendPoint[] = scopedReviews
    .slice()
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
    .map((r) => ({
      dateLabel: new Date(r.createdAt).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
      }),
      rating: r.rating,
      customerName: r.customerName,
    }));

  const scopedSalesPaise =
    scopedOrders.length > 0
      ? scopedOrders.reduce((s, o) => s + o.totalPaise, 0)
      : scopedPayouts.reduce((s, p) => s + p.grossAmountPaise, 0);

  const scopedOrdersCount =
    scopedOrders.length > 0
      ? scopedOrders.length
      : scopedPayouts.reduce((s, p) => s + p.ordersCount, 0);

  const avgOrderValuePaise =
    scopedOrdersCount > 0 ? Math.round(scopedSalesPaise / scopedOrdersCount) : 0;

  const completed = scopedOrders.filter((o) => o.status === 'completed').length;
  const cancelled = scopedOrders.filter(
    (o) => o.status === 'cancelled' || o.status === 'rejected'
  ).length;

  const completionRatePct =
    scopedOrders.length > 0 ? Math.round((completed / scopedOrders.length) * 100) : null;
  const cancellationRatePct =
    scopedOrders.length > 0 ? Math.round((cancelled / scopedOrders.length) * 100) : null;

  return {
    salesTrend,
    topProducts,
    categorySales,
    ratingTrend,
    scopedOrdersCount,
    scopedSalesPaise,
    avgOrderValuePaise,
    completionRatePct,
    cancellationRatePct,
    hasAnyData:
      salesTrend.length > 0 ||
      topProducts.length > 0 ||
      ratingTrend.length > 0 ||
      categorySales.length > 0,
  };
}

export function buildSellerTimeline(
  seller: MasterSellerRecord,
  sellerProducts: UniversalProductRecord[],
  sellerOrders: Order[],
  sellerPayouts: SellerPayoutRecord[],
  allAuditLogs: AuditLogRecord[]
): SellerActivityEvent[] {
  const events: SellerActivityEvent[] = [...(seller.activityHistory || [])];

  // Ensure registration event exists even for older stored sellers
  if (!events.some((e) => e.type === 'REGISTRATION')) {
    events.push({
      id: `derived_reg_${seller.id}`,
      type: 'REGISTRATION',
      title: 'Seller Registered',
      description: `${seller.name} joined GramBazaar in ${seller.villageName}.`,
      actor: seller.ownerName,
      timestamp: `${seller.joinedAt}T08:00:00Z`,
    });
  }

  // Add Product Added & Product Approved events
  sellerProducts.slice(0, 6).forEach((p) => {
    events.push({
      id: `derived_prod_add_${p.id}`,
      type: 'PRODUCT_ADDED',
      title: `Product Listed: ${p.name}`,
      description: `SKU ${p.sku} added under ${p.vertical} vertical.`,
      actor: seller.ownerName,
      timestamp: p.createdAt,
    });
    if (p.moderationStatus === 'APPROVED') {
      events.push({
        id: `derived_prod_app_${p.id}`,
        type: 'PRODUCT_APPROVED',
        title: `Product Approved: ${p.name}`,
        description: `Catalog item ${p.sku} passed admin moderation.`,
        actor: 'Catalog Admin',
        timestamp: p.updatedAt,
      });
    }
  });

  // Add Recent Orders Received
  sellerOrders.slice(0, 5).forEach((o) => {
    events.push({
      id: `derived_ord_${o.id}`,
      type: 'ORDER_RECEIVED',
      title: `Order Received: ${o.orderNumber}`,
      description: `${o.customerName} placed a ${o.items.length}-item order (${o.fulfilmentMode}).`,
      actor: o.customerName,
      timestamp: o.createdAt,
    });
  });

  // Add Settlements Processed
  sellerPayouts
    .filter((p) => p.status === 'SETTLED')
    .slice(0, 4)
    .forEach((p) => {
      events.push({
        id: `derived_pay_${p.id}`,
        type: 'SETTLEMENT_PROCESSED',
        title: `Settlement Processed: ${p.id}`,
        description: `Cycle ${p.periodLabel} settled via ${p.paymentMode.replace(/_/g, '/')} (UTR: ${
          p.utrNumber || 'Recorded'
        }).`,
        actor: 'Finance Ops',
        timestamp: p.settledAt || p.settlementDate || new Date().toISOString(),
      });
    });

  // Add matching Admin Audit Logs not already duplicated by timestamp/action
  const idSet = getSellerIdSet(seller);
  allAuditLogs
    .filter((l) => l.targetEntity === 'Seller' && idSet.has(l.targetId))
    .slice(0, 8)
    .forEach((l) => {
      const alreadyHas = events.some(
        (e) =>
          Math.abs(new Date(e.timestamp).getTime() - new Date(l.timestamp).getTime()) < 2000 &&
          e.actor === l.actor
      );
      if (!alreadyHas) {
        events.push({
          id: `derived_audit_${l.id}`,
          type: 'ADMIN_ACTION',
          title: l.actionType.replace(/_/g, ' '),
          description: l.details,
          actor: l.actor,
          timestamp: l.timestamp,
          reason: l.reason,
        });
      }
    });

  return events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}
