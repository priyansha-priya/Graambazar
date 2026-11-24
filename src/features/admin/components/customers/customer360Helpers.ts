/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  AdminCustomerRecord,
  AuditLogRecord,
  CustomerReviewRecord,
  PaymentTransactionRecord,
  RefundLedgerRecord,
  SupportCaseRecord,
  VillageServiceAreaRecord,
} from '../../../../types/admin';
import { CreditLedgerEntry, CustomerCreditProfile } from '../../../../types/credit';
import { Order } from '../../../../types/order';
import { BadgeVariant } from '../../../../components/ui/Badge';
import { formatINR } from '../../../../utils/currency';
import {
  ORDER_STATUS_META,
  PAYMENT_METHOD_LABELS,
  PAYMENT_STATUS_META,
} from '../orderManagementHelpers';
import {
  PAYMENT_METHOD_META,
  REFUND_STATUS_META,
  TXN_STATUS_META,
} from '../finance/financeHelpers';

/**
 * Normalize Indian phone numbers to last 10 digits so "+91 98765 43210" matches "9876543210".
 */
export function normalizePhone10(raw?: string): string {
  if (!raw) return '';
  const digits = raw.replace(/\D/g, '');
  return digits.length >= 10 ? digits.slice(-10) : digits;
}

export function getCustomerInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'CU';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export function matchesCustomerIdentity(
  customer: AdminCustomerRecord,
  candidate: {
    customerId?: string;
    customerName?: string;
    customerPhone?: string;
  }
): boolean {
  if (candidate.customerId && candidate.customerId === customer.id) return true;

  const cPhone = normalizePhone10(customer.phone);
  const candPhone = normalizePhone10(candidate.customerPhone);
  if (cPhone && candPhone && cPhone === candPhone) return true;

  if (
    candidate.customerName &&
    candidate.customerName.trim().toLowerCase() === customer.name.trim().toLowerCase()
  ) {
    return true;
  }

  return false;
}

export function getCustomerOrders(
  customer: AdminCustomerRecord,
  allOrders: Order[]
): Order[] {
  return allOrders
    .filter((o) =>
      matchesCustomerIdentity(customer, {
        customerId: o.customerId,
        customerName: o.customerName,
        customerPhone: o.customerPhone,
      })
    )
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function getCustomerTransactions(
  customer: AdminCustomerRecord,
  allTransactions: PaymentTransactionRecord[]
): PaymentTransactionRecord[] {
  return allTransactions
    .filter((t) =>
      matchesCustomerIdentity(customer, {
        customerName: t.customerName,
        customerPhone: t.customerPhone,
      })
    )
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function getCustomerRefunds(
  customer: AdminCustomerRecord,
  allRefunds: RefundLedgerRecord[],
  customerOrderKeys: Set<string>
): RefundLedgerRecord[] {
  return allRefunds
    .filter(
      (r) =>
        customerOrderKeys.has(r.orderId) ||
        matchesCustomerIdentity(customer, {
          customerName: r.customerName,
          customerPhone: r.customerPhone,
        })
    )
    .sort((a, b) => new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime());
}

export function getCustomerReviews(
  customer: AdminCustomerRecord,
  allReviews: CustomerReviewRecord[]
): CustomerReviewRecord[] {
  return allReviews
    .filter((r) =>
      matchesCustomerIdentity(customer, {
        customerName: r.customerName,
      })
    )
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function getCustomerSupportCases(
  customer: AdminCustomerRecord,
  allCases: SupportCaseRecord[]
): SupportCaseRecord[] {
  return allCases
    .filter((c) =>
      matchesCustomerIdentity(customer, {
        customerName: c.customerName,
        customerPhone: c.customerPhone,
      })
    )
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function getCustomerUdhariData(
  customer: AdminCustomerRecord,
  platformProfiles: CustomerCreditProfile[],
  platformLedgerEntries: CreditLedgerEntry[]
): {
  profiles: CustomerCreditProfile[];
  ledgerEntries: CreditLedgerEntry[];
} {
  const matchedProfiles = platformProfiles.filter((p) =>
    matchesCustomerIdentity(customer, {
      customerId: p.customerId,
      customerName: p.customerName,
      customerPhone: p.customerPhone,
    })
  );

  const profileCustomerIds = new Set(matchedProfiles.map((p) => p.customerId));
  profileCustomerIds.add(customer.id);

  const ledgerEntries = platformLedgerEntries
    .filter((e) => profileCustomerIds.has(e.customerId))
    .sort((a, b) => new Date(b.postedAt).getTime() - new Date(a.postedAt).getTime());

  return { profiles: matchedProfiles, ledgerEntries };
}

/* ============================================================================
 * COMPLETE ORDER HISTORY (Unifies Live Orders + Payment/Refund Ledger Orders)
 * ========================================================================== */

export type UnifiedOrderSource = 'LIVE_ORDER' | 'PAYMENT_LEDGER' | 'REFUND_LEDGER';

export interface CustomerUnifiedOrderRow {
  key: string;
  orderNumber: string;
  source: UnifiedOrderSource;
  orderDate: string;
  sortTs: number;
  sellerName: string;
  productsSummary: string;
  itemCount: number | null;
  amountPaise: number;
  paymentMethodLabel: string;
  paymentStatusLabel: string;
  paymentStatusVariant: BadgeVariant;
  orderStatusKey: string;
  orderStatusLabel: string;
  orderStatusVariant: BadgeVariant;
  liveOrder?: Order;
  transaction?: PaymentTransactionRecord;
  refund?: RefundLedgerRecord;
}

export function buildCustomerCompleteOrderHistory(
  liveOrders: Order[],
  transactions: PaymentTransactionRecord[],
  refunds: RefundLedgerRecord[]
): CustomerUnifiedOrderRow[] {
  const rows: CustomerUnifiedOrderRow[] = [];
  const seenKeys = new Set<string>();

  // 1. Live Orders from OrderContext (richest detail: line items, status machine, address)
  liveOrders.forEach((order) => {
    seenKeys.add(order.id);
    seenKeys.add(order.orderNumber);

    const statusMeta = ORDER_STATUS_META[order.status];
    const payMeta = PAYMENT_STATUS_META[order.paymentStatus];
    const items = order.items || [];
    const totalUnits = items.reduce((s, it) => s + it.requestedQuantity, 0);
    const firstNames = items.slice(0, 2).map((it) => it.productName);
    const productsSummary =
      items.length === 0
        ? 'Order items unavailable'
        : items.length <= 2
        ? firstNames.join(', ')
        : `${firstNames.join(', ')} +${items.length - 2} more`;

    const relatedTxn = transactions.find(
      (t) => t.orderId === order.orderNumber || t.orderId === order.id
    );
    const relatedRefund = refunds.find(
      (r) => r.orderId === order.orderNumber || r.orderId === order.id
    );

    rows.push({
      key: `live:${order.id}`,
      orderNumber: order.orderNumber,
      source: 'LIVE_ORDER',
      orderDate: order.createdAt,
      sortTs: new Date(order.createdAt).getTime() || 0,
      sellerName: order.sellerName,
      productsSummary,
      itemCount: totalUnits,
      amountPaise: order.totalPaise,
      paymentMethodLabel: PAYMENT_METHOD_LABELS[order.paymentMethod] || order.paymentMethod,
      paymentStatusLabel: payMeta?.label || order.paymentStatus,
      paymentStatusVariant: payMeta?.variant || 'neutral',
      orderStatusKey: order.status,
      orderStatusLabel: statusMeta?.shortLabel || order.status,
      orderStatusVariant: statusMeta?.variant || 'neutral',
      liveOrder: order,
      transaction: relatedTxn,
      refund: relatedRefund,
    });
  });

  // 2. Historical Orders present in Payment Transactions ledger (not already in liveOrders)
  transactions.forEach((txn) => {
    if (seenKeys.has(txn.orderId)) return;
    seenKeys.add(txn.orderId);

    const txnStatus = TXN_STATUS_META[txn.status];
    const methodMeta = PAYMENT_METHOD_META[txn.method];
    const relatedRefund = refunds.find((r) => r.orderId === txn.orderId);

    let orderStatusKey = 'completed';
    let orderStatusLabel = 'Completed';
    let orderStatusVariant: BadgeVariant = 'success';

    if (txn.status === 'REFUNDED' || relatedRefund?.status === 'PROCESSED') {
      orderStatusKey = 'refunded';
      orderStatusLabel = 'Refunded';
      orderStatusVariant = 'primary';
    } else if (txn.status === 'FAILED') {
      orderStatusKey = 'cancelled';
      orderStatusLabel = 'Payment Failed';
      orderStatusVariant = 'error';
    } else if (txn.status === 'PENDING_COD') {
      orderStatusKey = 'pending';
      orderStatusLabel = 'Pending COD';
      orderStatusVariant = 'warning';
    }

    rows.push({
      key: `txn:${txn.id}`,
      orderNumber: txn.orderId,
      source: 'PAYMENT_LEDGER',
      orderDate: txn.createdAt,
      sortTs: new Date(txn.createdAt).getTime() || 0,
      sellerName: txn.sellerName,
      productsSummary: txn.vertical
        ? `${txn.vertical === 'FOOD' ? 'Food & Kitchen' : txn.vertical === 'GROCERY' ? 'Grocery & Staples' : txn.vertical} Order (Ledger)`
        : 'Recorded via Payment Ledger',
      itemCount: null,
      amountPaise: txn.amountPaise,
      paymentMethodLabel: methodMeta?.label || txn.method,
      paymentStatusLabel: txnStatus?.label || txn.status,
      paymentStatusVariant: txnStatus?.variant || 'neutral',
      orderStatusKey,
      orderStatusLabel,
      orderStatusVariant,
      transaction: txn,
      refund: relatedRefund,
    });
  });

  // 3. Historical Orders present only in Refund Ledger
  refunds.forEach((ref) => {
    if (seenKeys.has(ref.orderId)) return;
    seenKeys.add(ref.orderId);

    const refMeta = REFUND_STATUS_META[ref.status];
    rows.push({
      key: `ref:${ref.id}`,
      orderNumber: ref.orderId,
      source: 'REFUND_LEDGER',
      orderDate: ref.requestedAt,
      sortTs: new Date(ref.requestedAt).getTime() || 0,
      sellerName: ref.sellerName,
      productsSummary: `Refund Claim • ${ref.reason}`,
      itemCount: null,
      amountPaise: ref.originalAmountPaise || ref.amountPaise,
      paymentMethodLabel: ref.originalPaymentMethod || 'Online / COD',
      paymentStatusLabel: ref.status === 'PROCESSED' ? 'Refunded' : `Refund ${refMeta.label}`,
      paymentStatusVariant: refMeta.variant,
      orderStatusKey: ref.status === 'PROCESSED' ? 'refunded' : 'returned',
      orderStatusLabel: ref.status === 'PROCESSED' ? 'Refunded' : 'Return / Refund',
      orderStatusVariant: refMeta.variant,
      refund: ref,
    });
  });

  return rows.sort((a, b) => b.sortTs - a.sortTs);
}

/* ============================================================================
 * CUSTOMER 360° METRICS SUMMARY (Strictly from real existing state)
 * ========================================================================== */

export interface Customer360Summary {
  totalOrders: number;
  trackedOrdersCount: number;
  totalSpendingPaise: number;
  averageOrderValuePaise: number;
  lastOrderDate: string;
  totalRefundsPaise: number;
  refundCount: number;
  completeAddress: string;
  udhariBalancePaise: number;
  udhariCreditLimitPaise: number;
  udhariAvailablePaise: number;
  udhariOverduePaise: number;
  activeKhataCount: number;
}

export function computeCustomer360Summary(params: {
  customer: AdminCustomerRecord;
  liveOrders: Order[];
  completeOrders: CustomerUnifiedOrderRow[];
  refunds: RefundLedgerRecord[];
  udhariProfiles: CustomerCreditProfile[];
  serviceAreas: VillageServiceAreaRecord[];
}): Customer360Summary {
  const {
    customer,
    liveOrders,
    completeOrders,
    refunds,
    udhariProfiles,
    serviceAreas,
  } = params;

  const totalOrders = Math.max(customer.totalOrders, completeOrders.length);
  const trackedSpendPaise = completeOrders
    .filter((o) => o.orderStatusKey !== 'cancelled' && o.orderStatusKey !== 'rejected')
    .reduce((sum, o) => sum + o.amountPaise, 0);
  const totalSpendingPaise = Math.max(customer.totalSpendPaise, trackedSpendPaise);
  const averageOrderValuePaise =
    totalOrders > 0 ? Math.round(totalSpendingPaise / totalOrders) : 0;

  // Determine most recent order date
  const latestTrackedIso = completeOrders[0]?.orderDate;
  const lastOrderDate =
    latestTrackedIso &&
    new Date(latestTrackedIso).getTime() > new Date(customer.lastOrderAt || 0).getTime()
      ? latestTrackedIso
      : customer.lastOrderAt;

  // Committed refunds (exclude REJECTED / FAILED)
  const committedLedgerRefunds = refunds.filter(
    (r) => r.status === 'PROCESSED' || r.status === 'PROCESSING' || r.status === 'INITIATED'
  );
  const ledgerRefundPaise = committedLedgerRefunds.reduce((s, r) => s + r.amountPaise, 0);

  // Check if any liveOrder has refundInfo not already represented in refundLedger
  const refundLedgerOrderIds = new Set(refunds.map((r) => r.orderId));
  const extraLiveOrderRefunds = liveOrders.filter(
    (o) =>
      o.refundInfo &&
      o.refundInfo.status !== 'FAILED' &&
      !refundLedgerOrderIds.has(o.orderNumber) &&
      !refundLedgerOrderIds.has(o.id)
  );
  const extraLiveRefundPaise = extraLiveOrderRefunds.reduce(
    (s, o) => s + (o.refundInfo?.amountPaise || 0),
    0
  );

  const totalRefundsPaise = ledgerRefundPaise + extraLiveRefundPaise;
  const refundCount = committedLedgerRefunds.length + extraLiveOrderRefunds.length;

  // Compose complete address from customer landmark + village service area + latest order delivery address
  const matchedArea = serviceAreas.find(
    (a) =>
      a.id === customer.villageId ||
      a.name.toLowerCase() === customer.villageName.toLowerCase() ||
      customer.villageName.toLowerCase().includes(a.name.toLowerCase())
  );
  const latestDeliveryAddr = liveOrders.find((o) => o.deliveryAddress)?.deliveryAddress;
  const addressParts: string[] = [];
  if (latestDeliveryAddr?.addressLine1) {
    addressParts.push(latestDeliveryAddr.addressLine1);
  }
  if (customer.landmark && !addressParts.some((p) => p.includes(customer.landmark))) {
    addressParts.push(customer.landmark);
  }
  addressParts.push(customer.villageName);
  if (matchedArea) {
    addressParts.push(`${matchedArea.district}, ${matchedArea.state} - ${matchedArea.postalCode}`);
  }
  const completeAddress = addressParts.filter(Boolean).join(', ');

  // Udhari overview reconciled with UdhariContext profiles when present
  const profileOutstanding = udhariProfiles.reduce(
    (s, p) => s + p.outstandingBalancePaise,
    0
  );
  const udhariBalancePaise = Math.max(customer.udhariBalancePaise, profileOutstanding);
  const udhariCreditLimitPaise = udhariProfiles.reduce(
    (s, p) => s + p.creditLimitPaise,
    0
  );
  const udhariAvailablePaise = udhariProfiles.reduce(
    (s, p) => s + p.availableCreditPaise,
    0
  );
  const udhariOverduePaise = udhariProfiles.reduce(
    (s, p) => s + p.overdueAmountPaise,
    0
  );

  return {
    totalOrders,
    trackedOrdersCount: completeOrders.length,
    totalSpendingPaise,
    averageOrderValuePaise,
    lastOrderDate,
    totalRefundsPaise,
    refundCount,
    completeAddress,
    udhariBalancePaise,
    udhariCreditLimitPaise,
    udhariAvailablePaise,
    udhariOverduePaise,
    activeKhataCount: udhariProfiles.filter((p) => p.status === 'ACTIVE').length,
  };
}

/* ============================================================================
 * CUSTOMER ACTIVITY TIMELINE (Aggregated from existing contexts)
 * ========================================================================== */

export type CustomerActivityType =
  | 'REGISTERED'
  | 'ORDER'
  | 'PAYMENT'
  | 'REFUND'
  | 'REVIEW'
  | 'SUPPORT'
  | 'ADMIN';

export interface CustomerActivityEvent {
  id: string;
  type: CustomerActivityType;
  title: string;
  description: string;
  timestamp: string;
  sortTs: number;
}

export function buildCustomerActivityTimeline(params: {
  customer: AdminCustomerRecord;
  completeOrders: CustomerUnifiedOrderRow[];
  transactions: PaymentTransactionRecord[];
  refunds: RefundLedgerRecord[];
  reviews: CustomerReviewRecord[];
  supportCases: SupportCaseRecord[];
  auditLogs: AuditLogRecord[];
}): CustomerActivityEvent[] {
  const {
    customer,
    completeOrders,
    transactions,
    refunds,
    reviews,
    supportCases,
    auditLogs,
  } = params;

  const events: CustomerActivityEvent[] = [];

  if (customer.joinedAt) {
    events.push({
      id: `reg_${customer.id}`,
      type: 'REGISTERED',
      title: 'Customer Account Registered',
      description: `Joined GramBazaar in ${customer.villageName} (${customer.landmark})`,
      timestamp: customer.joinedAt,
      sortTs: new Date(customer.joinedAt).getTime() || 0,
    });
  }

  completeOrders.forEach((ord) => {
    events.push({
      id: `ord_${ord.key}`,
      type: 'ORDER',
      title: `Order ${ord.orderNumber} (${ord.orderStatusLabel})`,
      description: `${formatINR(ord.amountPaise)} at ${ord.sellerName} • ${ord.productsSummary}`,
      timestamp: ord.orderDate,
      sortTs: ord.sortTs,
    });
  });

  transactions.forEach((txn) => {
    events.push({
      id: `txn_${txn.id}`,
      type: 'PAYMENT',
      title: `Payment ${TXN_STATUS_META[txn.status].label} (${txn.method})`,
      description: `${formatINR(txn.amountPaise)} for ${txn.orderId} • Ref: ${txn.gatewayRef}`,
      timestamp: txn.createdAt,
      sortTs: new Date(txn.createdAt).getTime() || 0,
    });
  });

  refunds.forEach((ref) => {
    events.push({
      id: `ref_${ref.id}`,
      type: 'REFUND',
      title: `Refund ${REFUND_STATUS_META[ref.status].label} • ${formatINR(ref.amountPaise)}`,
      description: `Order ${ref.orderId} • ${ref.reason}`,
      timestamp: ref.processedAt || ref.requestedAt,
      sortTs: new Date(ref.processedAt || ref.requestedAt).getTime() || 0,
    });
  });

  reviews.forEach((rev) => {
    events.push({
      id: `rev_${rev.id}`,
      type: 'REVIEW',
      title: `Rated ${rev.sellerName} ★ ${rev.rating}/5`,
      description: rev.comment,
      timestamp: rev.createdAt,
      sortTs: new Date(rev.createdAt).getTime() || 0,
    });
  });

  supportCases.forEach((sc) => {
    events.push({
      id: `sup_${sc.id}`,
      type: 'SUPPORT',
      title: `Support Case ${sc.id} (${sc.status})`,
      description: `${sc.issueType.replace(/_/g, ' ')} on ${sc.orderId} — ${sc.description}`,
      timestamp: sc.createdAt,
      sortTs: new Date(sc.createdAt).getTime() || 0,
    });
  });

  auditLogs
    .filter(
      (log) =>
        log.targetId === customer.id ||
        log.details.toLowerCase().includes(customer.name.toLowerCase())
    )
    .forEach((log) => {
      events.push({
        id: `aud_${log.id}`,
        type: 'ADMIN',
        title: `Admin: ${log.actionType.replace(/_/g, ' ')}`,
        description: `${log.details}${log.reason ? ` (${log.reason})` : ''}`,
        timestamp: log.timestamp,
        sortTs: new Date(log.timestamp).getTime() || 0,
      });
    });

  return events.sort((a, b) => b.sortTs - a.sortTs);
}
