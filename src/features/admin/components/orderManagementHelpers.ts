/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  Order,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
  RefundMethod,
  RefundStatus,
  ReturnStatus,
  OrderCancellationInfo,
} from '../../../types/order';
import { BadgeVariant } from '../../../components/ui/Badge';

export type WorkflowStatusKey =
  | 'new'
  | 'pending'
  | 'confirmed'
  | 'preparing'
  | 'ready'
  | 'out_for_delivery'
  | 'delivered'
  | 'cancelled'
  | 'returned'
  | 'refunded';

export interface StatusStyleTokens {
  label: string;
  shortLabel: string;
  variant: BadgeVariant;
  bgClass: string;
  textClass: string;
  borderClass: string;
  dotClass: string;
  hoverClass: string;
}

export interface WorkflowStatusOption extends StatusStyleTokens {
  key: WorkflowStatusKey;
  description: string;
  requiresConfirmation?: boolean;
}

export const WORKFLOW_STATUS_OPTIONS: ReadonlyArray<WorkflowStatusOption> = [
  {
    key: 'new',
    label: 'New',
    shortLabel: 'New',
    description: 'Newly placed order awaiting initial review',
    variant: 'info',
    bgClass: 'bg-[#EEF2FF]',
    textClass: 'text-[#3730A3]',
    borderClass: 'border-[#C7D2FE]',
    dotClass: 'bg-[#4F46E5]',
    hoverClass: 'hover:bg-[#E0E7FF]',
  },
  {
    key: 'pending',
    label: 'Pending',
    shortLabel: 'Pending',
    description: 'Pending confirmation or payment verification',
    variant: 'warning',
    bgClass: 'bg-[#FEF3C7]',
    textClass: 'text-[#92400E]',
    borderClass: 'border-[#FCD34D]',
    dotClass: 'bg-[#D97706]',
    hoverClass: 'hover:bg-[#FDE68A]/70',
  },
  {
    key: 'confirmed',
    label: 'Confirmed',
    shortLabel: 'Confirmed',
    description: 'Accepted by merchant store',
    variant: 'info',
    bgClass: 'bg-[#DBEAFE]',
    textClass: 'text-[#1E40AF]',
    borderClass: 'border-[#93C5FD]',
    dotClass: 'bg-[#2563EB]',
    hoverClass: 'hover:bg-[#BFDBFE]/70',
  },
  {
    key: 'preparing',
    label: 'Preparing',
    shortLabel: 'Preparing',
    description: 'Items being cooked or packed',
    variant: 'warning',
    bgClass: 'bg-[#FFEDD5]',
    textClass: 'text-[#9A3412]',
    borderClass: 'border-[#FDBA74]',
    dotClass: 'bg-[#EA580C]',
    hoverClass: 'hover:bg-[#FED7AA]/70',
  },
  {
    key: 'ready',
    label: 'Ready',
    shortLabel: 'Ready',
    description: 'Ready for pickup or runner dispatch',
    variant: 'info',
    bgClass: 'bg-[#CCFBF1]',
    textClass: 'text-[#115E59]',
    borderClass: 'border-[#5EEAD4]',
    dotClass: 'bg-[#0D9488]',
    hoverClass: 'hover:bg-[#99F6E4]/70',
  },
  {
    key: 'out_for_delivery',
    label: 'Out for Delivery',
    shortLabel: 'Out for Delivery',
    description: 'Dispatched with runner towards village landmark',
    variant: 'info',
    bgClass: 'bg-[#F3E8FF]',
    textClass: 'text-[#6B21A8]',
    borderClass: 'border-[#D8B4FE]',
    dotClass: 'bg-[#9333EA]',
    hoverClass: 'hover:bg-[#E9D5FF]/70',
  },
  {
    key: 'delivered',
    label: 'Delivered',
    shortLabel: 'Delivered',
    description: 'Successfully handed over to customer',
    variant: 'success',
    bgClass: 'bg-[#DCFCE7]',
    textClass: 'text-[#166534]',
    borderClass: 'border-[#86EFAC]',
    dotClass: 'bg-[#16A34A]',
    hoverClass: 'hover:bg-[#BBF7D0]/70',
  },
  {
    key: 'cancelled',
    label: 'Cancelled',
    shortLabel: 'Cancelled',
    description: 'Order stopped with cancellation reason',
    variant: 'error',
    bgClass: 'bg-[#FEE2E2]',
    textClass: 'text-[#991B1B]',
    borderClass: 'border-[#FCA5A5]',
    dotClass: 'bg-[#DC2626]',
    hoverClass: 'hover:bg-[#FECACA]/70',
    requiresConfirmation: true,
  },
  {
    key: 'returned',
    label: 'Returned',
    shortLabel: 'Returned',
    description: 'Items returned after delivery',
    variant: 'warning',
    bgClass: 'bg-[#FFE4E6]',
    textClass: 'text-[#9F1239]',
    borderClass: 'border-[#FDA4AF]',
    dotClass: 'bg-[#E11D48]',
    hoverClass: 'hover:bg-[#FECDD3]/70',
    requiresConfirmation: true,
  },
  {
    key: 'refunded',
    label: 'Refunded',
    shortLabel: 'Refunded',
    description: 'Customer refund processed & settled',
    variant: 'primary',
    bgClass: 'bg-[#E8F5E9]',
    textClass: 'text-[#176B2C]',
    borderClass: 'border-[#A7F3D0]',
    dotClass: 'bg-[#218838]',
    hoverClass: 'hover:bg-[#D1FAE5]/80',
    requiresConfirmation: true,
  },
];

export const ORDER_STATUS_META: Record<OrderStatus, StatusStyleTokens> = {
  placed: {
    label: 'New',
    shortLabel: 'New',
    variant: 'info',
    bgClass: 'bg-[#EEF2FF]',
    textClass: 'text-[#3730A3]',
    borderClass: 'border-[#C7D2FE]',
    dotClass: 'bg-[#4F46E5]',
    hoverClass: 'hover:bg-[#E0E7FF]',
  },
  pending: {
    label: 'Pending',
    shortLabel: 'Pending',
    variant: 'warning',
    bgClass: 'bg-[#FEF3C7]',
    textClass: 'text-[#92400E]',
    borderClass: 'border-[#FCD34D]',
    dotClass: 'bg-[#D97706]',
    hoverClass: 'hover:bg-[#FDE68A]/70',
  },
  accepted: {
    label: 'Confirmed',
    shortLabel: 'Confirmed',
    variant: 'info',
    bgClass: 'bg-[#DBEAFE]',
    textClass: 'text-[#1E40AF]',
    borderClass: 'border-[#93C5FD]',
    dotClass: 'bg-[#2563EB]',
    hoverClass: 'hover:bg-[#BFDBFE]/70',
  },
  preparing: {
    label: 'Preparing',
    shortLabel: 'Preparing',
    variant: 'warning',
    bgClass: 'bg-[#FFEDD5]',
    textClass: 'text-[#9A3412]',
    borderClass: 'border-[#FDBA74]',
    dotClass: 'bg-[#EA580C]',
    hoverClass: 'hover:bg-[#FED7AA]/70',
  },
  ready_for_pickup: {
    label: 'Ready (Pickup)',
    shortLabel: 'Ready',
    variant: 'info',
    bgClass: 'bg-[#CCFBF1]',
    textClass: 'text-[#115E59]',
    borderClass: 'border-[#5EEAD4]',
    dotClass: 'bg-[#0D9488]',
    hoverClass: 'hover:bg-[#99F6E4]/70',
  },
  ready_for_delivery: {
    label: 'Ready (Delivery)',
    shortLabel: 'Ready',
    variant: 'info',
    bgClass: 'bg-[#CCFBF1]',
    textClass: 'text-[#115E59]',
    borderClass: 'border-[#5EEAD4]',
    dotClass: 'bg-[#0D9488]',
    hoverClass: 'hover:bg-[#99F6E4]/70',
  },
  out_for_delivery: {
    label: 'Out for Delivery',
    shortLabel: 'Out for Delivery',
    variant: 'info',
    bgClass: 'bg-[#F3E8FF]',
    textClass: 'text-[#6B21A8]',
    borderClass: 'border-[#D8B4FE]',
    dotClass: 'bg-[#9333EA]',
    hoverClass: 'hover:bg-[#E9D5FF]/70',
  },
  completed: {
    label: 'Delivered',
    shortLabel: 'Delivered',
    variant: 'success',
    bgClass: 'bg-[#DCFCE7]',
    textClass: 'text-[#166534]',
    borderClass: 'border-[#86EFAC]',
    dotClass: 'bg-[#16A34A]',
    hoverClass: 'hover:bg-[#BBF7D0]/70',
  },
  cancelled: {
    label: 'Cancelled',
    shortLabel: 'Cancelled',
    variant: 'error',
    bgClass: 'bg-[#FEE2E2]',
    textClass: 'text-[#991B1B]',
    borderClass: 'border-[#FCA5A5]',
    dotClass: 'bg-[#DC2626]',
    hoverClass: 'hover:bg-[#FECACA]/70',
  },
  rejected: {
    label: 'Rejected',
    shortLabel: 'Rejected',
    variant: 'error',
    bgClass: 'bg-[#FEE2E2]',
    textClass: 'text-[#991B1B]',
    borderClass: 'border-[#FCA5A5]',
    dotClass: 'bg-[#DC2626]',
    hoverClass: 'hover:bg-[#FECACA]/70',
  },
  delivery_failed: {
    label: 'Delivery Failed',
    shortLabel: 'Delivery Failed',
    variant: 'error',
    bgClass: 'bg-[#FEF2F2]',
    textClass: 'text-[#B91C1C]',
    borderClass: 'border-[#FCA5A5]',
    dotClass: 'bg-[#EF4444]',
    hoverClass: 'hover:bg-[#FEE2E2]',
  },
  returned: {
    label: 'Returned',
    shortLabel: 'Returned',
    variant: 'warning',
    bgClass: 'bg-[#FFE4E6]',
    textClass: 'text-[#9F1239]',
    borderClass: 'border-[#FDA4AF]',
    dotClass: 'bg-[#E11D48]',
    hoverClass: 'hover:bg-[#FECDD3]/70',
  },
  refunded: {
    label: 'Refunded',
    shortLabel: 'Refunded',
    variant: 'primary',
    bgClass: 'bg-[#E8F5E9]',
    textClass: 'text-[#176B2C]',
    borderClass: 'border-[#A7F3D0]',
    dotClass: 'bg-[#218838]',
    hoverClass: 'hover:bg-[#D1FAE5]/80',
  },
};

export function mapOrderStatusToWorkflowKey(status: OrderStatus): WorkflowStatusKey {
  switch (status) {
    case 'placed':
      return 'new';
    case 'pending':
      return 'pending';
    case 'accepted':
      return 'confirmed';
    case 'preparing':
      return 'preparing';
    case 'ready_for_pickup':
    case 'ready_for_delivery':
      return 'ready';
    case 'out_for_delivery':
    case 'delivery_failed':
      return 'out_for_delivery';
    case 'completed':
      return 'delivered';
    case 'cancelled':
    case 'rejected':
      return 'cancelled';
    case 'returned':
      return 'returned';
    case 'refunded':
      return 'refunded';
  }
}

export function mapWorkflowKeyToOrderStatus(
  key: WorkflowStatusKey,
  fulfilmentMode: 'DELIVERY' | 'PICKUP' = 'DELIVERY'
): OrderStatus {
  switch (key) {
    case 'new':
      return 'placed';
    case 'pending':
      return 'pending';
    case 'confirmed':
      return 'accepted';
    case 'preparing':
      return 'preparing';
    case 'ready':
      return fulfilmentMode === 'PICKUP' ? 'ready_for_pickup' : 'ready_for_delivery';
    case 'out_for_delivery':
      return 'out_for_delivery';
    case 'delivered':
      return 'completed';
    case 'cancelled':
      return 'cancelled';
    case 'returned':
      return 'returned';
    case 'refunded':
      return 'refunded';
  }
}

export function matchesWorkflowFilter(
  status: OrderStatus,
  filter: 'ALL' | WorkflowStatusKey
): boolean {
  if (filter === 'ALL') return true;
  if (filter === 'ready') {
    return status === 'ready_for_pickup' || status === 'ready_for_delivery';
  }
  if (filter === 'cancelled') {
    return status === 'cancelled' || status === 'rejected';
  }
  return mapOrderStatusToWorkflowKey(status) === filter;
}

export const PAYMENT_STATUS_META: Record<
  PaymentStatus,
  { label: string; variant: BadgeVariant }
> = {
  pending: { label: 'Pending', variant: 'warning' },
  collected: { label: 'Paid / Collected', variant: 'success' },
  settled: { label: 'Settled', variant: 'primary' },
  reversed: { label: 'Reversed / Void', variant: 'neutral' },
  refunded: { label: 'Refunded', variant: 'primary' },
  partially_refunded: { label: 'Partially Refunded', variant: 'info' },
  failed: { label: 'Payment Failed', variant: 'error' },
};

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  COD: 'Cash on Delivery (COD)',
  SELLER_UPI: 'Seller UPI',
  UDHAR: 'Village Udhari Credit',
};

export const RETURN_STATUS_META: Record<
  ReturnStatus,
  { label: string; variant: BadgeVariant }
> = {
  REQUESTED: { label: 'Return Requested', variant: 'warning' },
  APPROVED: { label: 'Return Approved', variant: 'info' },
  PICKED_UP: { label: 'Picked Up by Runner', variant: 'info' },
  RECEIVED: { label: 'Received at Store', variant: 'primary' },
  REJECTED: { label: 'Return Rejected', variant: 'error' },
};

export const REFUND_STATUS_META: Record<
  RefundStatus,
  { label: string; variant: BadgeVariant }
> = {
  PENDING: { label: 'Pending', variant: 'warning' },
  PROCESSING: { label: 'Processing', variant: 'info' },
  COMPLETED: { label: 'Completed', variant: 'success' },
  FAILED: { label: 'Failed', variant: 'error' },
};

export const REFUND_METHOD_LABELS: Record<RefundMethod, string> = {
  ORIGINAL_UPI: 'Original UPI Account',
  BANK_TRANSFER: 'Direct Bank Transfer (IMPS/NEFT)',
  UDHAR_REVERSAL: 'Udhari Khata Reversal',
  CASH_SETTLEMENT: 'Cash Settlement',
  STORE_CREDIT: 'Marketplace Store Credit',
};

export interface OrderFinancialSummary {
  totalItemCount: number;
  totalQuantity: number;
  subtotalPaise: number;
  itemDiscountPaise: number;
  couponDiscountPaise: number;
  totalDiscountPaise: number;
  deliveryFeePaise: number;
  packagingFeePaise: number;
  taxPaise: number;
  taxLabel: string;
  platformFeePaise: number;
  totalPaidPaise: number;
  refundAmountPaise: number;
  completedRefundPaise: number;
  netRetainedPaise: number;
}

export function computeOrderFinancials(order: Order): OrderFinancialSummary {
  const totalItemCount = order.items.length;
  const totalQuantity = order.items.reduce((sum, it) => sum + (it.requestedQuantity || 0), 0);
  const derivedItemDiscount = order.items.reduce(
    (sum, it) => sum + (it.itemDiscountPaise || 0),
    0
  );
  const itemDiscountPaise =
    typeof order.itemDiscountPaise === 'number' ? order.itemDiscountPaise : derivedItemDiscount;
  const couponDiscountPaise = order.couponDiscountPaise || 0;
  const totalDiscountPaise = itemDiscountPaise + couponDiscountPaise;
  const deliveryFeePaise = order.deliveryFeePaise || 0;
  const packagingFeePaise = order.packagingFeePaise || 0;
  const taxPaise = order.taxPaise || 0;
  const taxLabel = order.taxLabel || 'Applicable Taxes (GST)';
  const platformFeePaise = order.platformFeePaise || 0;
  const subtotalPaise = order.itemSubtotalPaise;
  const totalPaidPaise = order.totalPaise;
  const refundAmountPaise = order.refundInfo?.amountPaise || 0;
  const completedRefundPaise =
    order.refundInfo?.status === 'COMPLETED' ? order.refundInfo.amountPaise : 0;
  const netRetainedPaise = Math.max(0, totalPaidPaise - completedRefundPaise);

  return {
    totalItemCount,
    totalQuantity,
    subtotalPaise,
    itemDiscountPaise,
    couponDiscountPaise,
    totalDiscountPaise,
    deliveryFeePaise,
    packagingFeePaise,
    taxPaise,
    taxLabel,
    platformFeePaise,
    totalPaidPaise,
    refundAmountPaise,
    completedRefundPaise,
    netRetainedPaise,
  };
}

export function getResolvedCancellationInfo(order: Order): OrderCancellationInfo | null {
  if (order.cancellation) return order.cancellation;
  if (order.status !== 'cancelled' && order.status !== 'rejected') return null;

  const cancelEv = order.statusHistory
    ?.slice()
    .reverse()
    .find((ev) => ev.toStatus === 'cancelled' || ev.toStatus === 'rejected');

  const actorRaw = (cancelEv?.actorRole || '').toUpperCase();
  const cancelledBy =
    actorRaw === 'ADMIN' ? 'ADMIN' : actorRaw === 'CUSTOMER' ? 'CUSTOMER' : 'SELLER';

  const refundEligible =
    order.paymentStatus === 'collected' ||
    order.paymentStatus === 'settled' ||
    order.paymentStatus === 'refunded' ||
    order.paymentStatus === 'partially_refunded';

  return {
    cancelledBy,
    reason:
      cancelEv?.reason ||
      (order.status === 'rejected'
        ? 'Order rejected by seller before preparation'
        : 'Order cancelled'),
    cancelledAt: cancelEv?.timestamp || order.updatedAt,
    refundEligible,
  };
}

export function getOrderPrimaryVertical(order: Order): string {
  const first = order.items[0]?.catalogueType;
  return first ? first.toUpperCase() : 'FOOD';
}

export function getDefaultRefundMethod(paymentMethod: PaymentMethod): RefundMethod {
  if (paymentMethod === 'SELLER_UPI') return 'ORIGINAL_UPI';
  if (paymentMethod === 'UDHAR') return 'UDHAR_REVERSAL';
  return 'BANK_TRANSFER';
}
