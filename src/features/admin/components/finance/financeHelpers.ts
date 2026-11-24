/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  PaymentTransactionRecord,
  RefundLedgerRecord,
  SellerPayoutRecord,
} from '../../../../types/admin';
import { BadgeVariant } from '../../../../components/ui/Badge';

export type FinanceDatePreset = 'ALL' | '7D' | '30D' | '90D' | 'CUSTOM';

export const TXN_STATUS_META: Record<
  PaymentTransactionRecord['status'],
  { label: string; filterGroup: 'SUCCESSFUL' | 'PENDING' | 'FAILED' | 'REFUNDED'; variant: BadgeVariant }
> = {
  CAPTURED: { label: 'Successful', filterGroup: 'SUCCESSFUL', variant: 'success' },
  PENDING_COD: { label: 'Pending (COD)', filterGroup: 'PENDING', variant: 'warning' },
  FAILED: { label: 'Failed', filterGroup: 'FAILED', variant: 'error' },
  REFUNDED: { label: 'Refunded', filterGroup: 'REFUNDED', variant: 'primary' },
};

export const PAYOUT_STATUS_META: Record<
  SellerPayoutRecord['status'],
  { label: string; variant: BadgeVariant }
> = {
  PENDING: { label: 'Pending', variant: 'warning' },
  PROCESSING: { label: 'Processing', variant: 'info' },
  SETTLED: { label: 'Settled', variant: 'success' },
  FAILED: { label: 'Failed', variant: 'error' },
};

export const REFUND_STATUS_META: Record<
  RefundLedgerRecord['status'],
  { label: string; variant: BadgeVariant }
> = {
  INITIATED: { label: 'Pending', variant: 'warning' },
  PROCESSING: { label: 'Processing', variant: 'info' },
  PROCESSED: { label: 'Completed', variant: 'success' },
  FAILED: { label: 'Failed', variant: 'error' },
  REJECTED: { label: 'Rejected', variant: 'neutral' },
};

export const REFUND_CHANNEL_LABELS: Record<RefundLedgerRecord['refundChannel'], string> = {
  ORIGINAL_UPI: 'Original UPI Account',
  STORE_CREDIT: 'Store Credit',
  CASH_ADJUSTMENT: 'Cash Adjustment',
};

export const PAYMENT_METHOD_META: Record<
  PaymentTransactionRecord['method'],
  { label: string; variant: BadgeVariant }
> = {
  UPI: { label: 'UPI', variant: 'info' },
  COD: { label: 'Cash / COD', variant: 'neutral' },
  UDHARI: { label: 'Udhari Credit', variant: 'warning' },
};

export function matchesFinanceDateRange(
  isoDate: string | undefined,
  preset: FinanceDatePreset,
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
      if (ts < fromTs) return false;
    }
    if (customTo) {
      const toTs = new Date(`${customTo}T23:59:59.999`).getTime();
      if (ts > toTs) return false;
    }
  }
  return true;
}

export interface FinanceOverviewMetrics {
  // Payment Flows
  totalTransactionAmountPaise: number;
  totalValidTransactionCount: number;
  successfulPaymentsPaise: number;
  successfulPaymentsCount: number;
  pendingPaymentsPaise: number;
  pendingPaymentsCount: number;
  failedPaymentsPaise: number;
  failedPaymentsCount: number;

  // Refunds
  totalRefundAmountPaise: number;
  totalActiveRefundsCount: number;
  pendingRefundsPaise: number;
  pendingRefundsCount: number;
  completedRefundsPaise: number;

  // Seller Settlements
  totalSettledPayoutsPaise: number;
  settledPayoutsCount: number;
  pendingSellerSettlementsPaise: number;
  pendingSellerSettlementsCount: number;
  failedSettlementsCount: number;

  // Platform Accounting (Strictly distinct from GMV)
  gmvPaise: number;
  totalCommissionPaise: number;
  platformFeesPaise: number;
  otherPlatformIncomePaise: number;
  platformRevenuePaise: number;
  estimatedCommissionReversalPaise: number;
  netPlatformEarningsPaise: number;
  totalSellerPayablePaise: number;
}

export function computeFinanceOverview(
  payouts: SellerPayoutRecord[],
  transactions: PaymentTransactionRecord[],
  refunds: RefundLedgerRecord[]
): FinanceOverviewMetrics {
  // 1. Customer Payment Transactions (exclude FAILED from valid payment volume)
  const successfulTxns = transactions.filter((t) => t.status === 'CAPTURED');
  const pendingTxns = transactions.filter((t) => t.status === 'PENDING_COD');
  const failedTxns = transactions.filter((t) => t.status === 'FAILED');
  const validTxns = transactions.filter((t) => t.status !== 'FAILED');

  const totalTransactionAmountPaise = validTxns.reduce((s, t) => s + t.amountPaise, 0);
  const successfulPaymentsPaise = successfulTxns.reduce((s, t) => s + t.amountPaise, 0);
  const pendingPaymentsPaise = pendingTxns.reduce((s, t) => s + t.amountPaise, 0);
  const failedPaymentsPaise = failedTxns.reduce((s, t) => s + t.amountPaise, 0);

  // 2. Refunds (exclude REJECTED and FAILED from committed refund liability)
  const committedRefunds = refunds.filter(
    (r) => r.status === 'PROCESSED' || r.status === 'PROCESSING' || r.status === 'INITIATED'
  );
  const pendingRefunds = refunds.filter(
    (r) => r.status === 'INITIATED' || r.status === 'PROCESSING'
  );
  const completedRefunds = refunds.filter((r) => r.status === 'PROCESSED');

  const totalRefundAmountPaise = committedRefunds.reduce((s, r) => s + r.amountPaise, 0);
  const pendingRefundsPaise = pendingRefunds.reduce((s, r) => s + r.amountPaise, 0);
  const completedRefundsPaise = completedRefunds.reduce((s, r) => s + r.amountPaise, 0);

  // 3. Seller Settlements
  const settledPayouts = payouts.filter((p) => p.status === 'SETTLED');
  const pendingPayouts = payouts.filter((p) => p.status !== 'SETTLED');
  const failedSettlementsCount = payouts.filter((p) => p.status === 'FAILED').length;

  const totalSettledPayoutsPaise = settledPayouts.reduce((s, p) => s + p.netPayablePaise, 0);
  const pendingSellerSettlementsPaise = pendingPayouts.reduce((s, p) => s + p.netPayablePaise, 0);

  // 4. Platform Revenue & Net Earnings (Strictly separated from GMV & Seller Payable)
  const gmvPaise = payouts.reduce((s, p) => s + p.grossAmountPaise, 0);
  const totalCommissionPaise = payouts.reduce((s, p) => s + p.commissionPaise, 0);
  const platformFeesPaise = payouts.reduce((s, p) => s + (p.platformFeePaise || 0), 0);
  const otherPlatformIncomePaise = payouts.reduce((s, p) => s + (p.otherDeductionsPaise || 0), 0);
  const totalSellerPayablePaise = payouts.reduce((s, p) => s + p.netPayablePaise, 0);

  // Gross Platform Revenue = Commission + Platform Fees + Other Platform Adjustments (NOT GMV)
  const platformRevenuePaise = totalCommissionPaise + platformFeesPaise + otherPlatformIncomePaise;

  // Commission impact of refunded orders (avoid subtracting seller principal twice)
  const avgCommissionRate = gmvPaise > 0 ? totalCommissionPaise / gmvPaise : 0;
  const settlementRefundDeductionsPaise = payouts.reduce((s, p) => s + p.refundDeductionsPaise, 0);
  const estimatedCommissionReversalPaise = Math.round(
    settlementRefundDeductionsPaise * avgCommissionRate
  );

  const netPlatformEarningsPaise = Math.max(
    0,
    platformRevenuePaise - estimatedCommissionReversalPaise
  );

  return {
    totalTransactionAmountPaise,
    totalValidTransactionCount: validTxns.length,
    successfulPaymentsPaise,
    successfulPaymentsCount: successfulTxns.length,
    pendingPaymentsPaise,
    pendingPaymentsCount: pendingTxns.length,
    failedPaymentsPaise,
    failedPaymentsCount: failedTxns.length,
    totalRefundAmountPaise,
    totalActiveRefundsCount: committedRefunds.length,
    pendingRefundsPaise,
    pendingRefundsCount: pendingRefunds.length,
    completedRefundsPaise,
    totalSettledPayoutsPaise,
    settledPayoutsCount: settledPayouts.length,
    pendingSellerSettlementsPaise,
    pendingSellerSettlementsCount: pendingPayouts.length,
    failedSettlementsCount,
    gmvPaise,
    totalCommissionPaise,
    platformFeesPaise,
    otherPlatformIncomePaise,
    platformRevenuePaise,
    estimatedCommissionReversalPaise,
    netPlatformEarningsPaise,
    totalSellerPayablePaise,
  };
}

export interface RevenueBreakdownRow {
  key: string;
  label: string;
  sublabel?: string;
  ordersCount: number;
  gmvPaise: number;
  commissionPaise: number;
  platformFeePaise: number;
  refundsPaise: number;
  sellerPayablePaise: number;
  netPlatformRevenuePaise: number;
}

export function computeVerticalBreakdown(payouts: SellerPayoutRecord[]): RevenueBreakdownRow[] {
  const map = new Map<string, RevenueBreakdownRow>();
  payouts.forEach((p) => {
    const key = (p.vertical || 'GROCERY').toUpperCase();
    const label = key === 'FOOD' ? 'Food & Kitchens' : key === 'GROCERY' ? 'Grocery & Kirana' : key;
    const existing = map.get(key) || {
      key,
      label,
      ordersCount: 0,
      gmvPaise: 0,
      commissionPaise: 0,
      platformFeePaise: 0,
      refundsPaise: 0,
      sellerPayablePaise: 0,
      netPlatformRevenuePaise: 0,
    };
    existing.ordersCount += p.ordersCount;
    existing.gmvPaise += p.grossAmountPaise;
    existing.commissionPaise += p.commissionPaise;
    existing.platformFeePaise += (p.platformFeePaise || 0) + (p.otherDeductionsPaise || 0);
    existing.refundsPaise += p.refundDeductionsPaise;
    existing.sellerPayablePaise += p.netPayablePaise;
    existing.netPlatformRevenuePaise = existing.commissionPaise + existing.platformFeePaise;
    map.set(key, existing);
  });
  return Array.from(map.values()).sort((a, b) => b.gmvPaise - a.gmvPaise);
}

export function computeVillageBreakdown(payouts: SellerPayoutRecord[]): RevenueBreakdownRow[] {
  const map = new Map<string, RevenueBreakdownRow>();
  payouts.forEach((p) => {
    const key = p.villageName;
    const existing = map.get(key) || {
      key,
      label: p.villageName,
      ordersCount: 0,
      gmvPaise: 0,
      commissionPaise: 0,
      platformFeePaise: 0,
      refundsPaise: 0,
      sellerPayablePaise: 0,
      netPlatformRevenuePaise: 0,
    };
    existing.ordersCount += p.ordersCount;
    existing.gmvPaise += p.grossAmountPaise;
    existing.commissionPaise += p.commissionPaise;
    existing.platformFeePaise += (p.platformFeePaise || 0) + (p.otherDeductionsPaise || 0);
    existing.refundsPaise += p.refundDeductionsPaise;
    existing.sellerPayablePaise += p.netPayablePaise;
    existing.netPlatformRevenuePaise = existing.commissionPaise + existing.platformFeePaise;
    map.set(key, existing);
  });
  return Array.from(map.values()).sort((a, b) => b.gmvPaise - a.gmvPaise);
}

export function computeSellerBreakdown(payouts: SellerPayoutRecord[]): RevenueBreakdownRow[] {
  const map = new Map<string, RevenueBreakdownRow>();
  payouts.forEach((p) => {
    const key = p.sellerId;
    const existing = map.get(key) || {
      key,
      label: p.sellerName,
      sublabel: `${p.villageName} • ${(p.vertical || 'GROCERY').toUpperCase()}`,
      ordersCount: 0,
      gmvPaise: 0,
      commissionPaise: 0,
      platformFeePaise: 0,
      refundsPaise: 0,
      sellerPayablePaise: 0,
      netPlatformRevenuePaise: 0,
    };
    existing.ordersCount += p.ordersCount;
    existing.gmvPaise += p.grossAmountPaise;
    existing.commissionPaise += p.commissionPaise;
    existing.platformFeePaise += (p.platformFeePaise || 0) + (p.otherDeductionsPaise || 0);
    existing.refundsPaise += p.refundDeductionsPaise;
    existing.sellerPayablePaise += p.netPayablePaise;
    existing.netPlatformRevenuePaise = existing.commissionPaise + existing.platformFeePaise;
    map.set(key, existing);
  });
  return Array.from(map.values()).sort((a, b) => b.gmvPaise - a.gmvPaise);
}

export interface RevenueTrendPoint {
  periodLabel: string;
  gmvPaise: number;
  platformRevenuePaise: number;
  commissionPaise: number;
  ordersCount: number;
}

export function computeRevenueTrendPoints(payouts: SellerPayoutRecord[]): RevenueTrendPoint[] {
  const map = new Map<string, RevenueTrendPoint & { sortTs: number }>();
  payouts.forEach((p) => {
    const key = p.periodLabel;
    const sortTs = new Date(p.settledAt || p.settlementDate || Date.now()).getTime();
    const existing = map.get(key) || {
      periodLabel: key,
      gmvPaise: 0,
      platformRevenuePaise: 0,
      commissionPaise: 0,
      ordersCount: 0,
      sortTs,
    };
    existing.gmvPaise += p.grossAmountPaise;
    existing.commissionPaise += p.commissionPaise;
    existing.platformRevenuePaise +=
      p.commissionPaise + (p.platformFeePaise || 0) + (p.otherDeductionsPaise || 0);
    existing.ordersCount += p.ordersCount;
    existing.sortTs = Math.max(existing.sortTs, sortTs);
    map.set(key, existing);
  });
  return Array.from(map.values())
    .sort((a, b) => a.sortTs - b.sortTs)
    .map(({ sortTs: _unused, ...rest }) => rest);
}
