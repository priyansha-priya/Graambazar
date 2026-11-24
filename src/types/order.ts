/**
 * Order & State Machine Domain Types
 */

import { FulfilmentMode } from './merchant';
import { CustomerAddress } from './village';

export type OrderStatus =
  | 'placed'
  | 'pending'
  | 'accepted'
  | 'preparing'
  | 'ready_for_pickup'
  | 'ready_for_delivery'
  | 'out_for_delivery'
  | 'completed'
  | 'rejected'
  | 'cancelled'
  | 'delivery_failed'
  | 'returned'
  | 'refunded';

export type PaymentMethod = 'COD' | 'SELLER_UPI' | 'UDHAR';

export type PaymentStatus =
  | 'pending'
  | 'collected'
  | 'settled'
  | 'reversed'
  | 'refunded'
  | 'partially_refunded'
  | 'failed';

export type CancelledByActor = 'CUSTOMER' | 'SELLER' | 'ADMIN';

export type ReturnStatus = 'REQUESTED' | 'APPROVED' | 'PICKED_UP' | 'RECEIVED' | 'REJECTED';

export type RefundStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';

export type RefundMethod =
  | 'ORIGINAL_UPI'
  | 'BANK_TRANSFER'
  | 'UDHAR_REVERSAL'
  | 'CASH_SETTLEMENT'
  | 'STORE_CREDIT';

export interface OrderItemOptionSnapshot {
  groupName: string;
  optionLabel: string;
  priceDeltaPaise: number;
}

export interface OrderItemSnapshot {
  id: string;
  productId: string;
  productName: string;
  catalogueType: string; // Supports FOOD, GROCERY, HARDWARE, ELECTRONICS, APPAREL, FURNITURE, AGRICULTURE, etc.
  sku?: string;
  variantLabel?: string;
  variantAttributes?: Record<string, string>;
  selectedOptions?: OrderItemOptionSnapshot[];
  unitPricePaise: number;
  mrpUnitPricePaise?: number;
  itemDiscountPaise?: number;
  requestedQuantity: number;
  requestedUnitLabel: string; // e.g. "1 kg", "Full Plate", "1 pav (250g)"
  lineTotalPaise: number;
  returnedQuantity?: number;
  customerNote?: string;
}

export interface OrderEvent {
  id: string;
  orderId: string;
  fromStatus: OrderStatus;
  toStatus: OrderStatus;
  actorRole: string;
  reason?: string;
  timestamp: string;
}

export interface OrderCancellationInfo {
  cancelledBy: CancelledByActor;
  reason: string;
  cancelledAt: string;
  refundEligible: boolean;
  notes?: string;
}

export interface OrderReturnItem {
  orderItemId: string;
  productName: string;
  variantLabel?: string;
  quantity: number;
  unitLabel: string;
  refundValuePaise: number;
  conditionNote?: string;
}

export interface OrderReturnInfo {
  returnId: string;
  status: ReturnStatus;
  reason: string;
  requestedAt: string;
  updatedAt: string;
  returnedItems: OrderReturnItem[];
  notes?: string;
}

export interface OrderRefundInfo {
  refundId: string;
  amountPaise: number;
  status: RefundStatus;
  method: RefundMethod;
  reason: string;
  initiatedAt: string;
  completedAt?: string;
  referenceId?: string;
  initiatedBy: string;
  failureReason?: string;
}

export interface Order {
  id: string;
  orderNumber: string; // e.g. "GB-2026-0042"
  customerId: string;
  customerName: string;
  customerPhone: string;
  sellerId: string;
  sellerName: string;
  sellerPhone: string;
  villageId: string;
  fulfilmentMode: FulfilmentMode;
  deliveryAddress?: CustomerAddress;
  deliveryNote?: string;
  status: OrderStatus;
  statusHistory: OrderEvent[];
  items: OrderItemSnapshot[];
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  paymentReferenceId?: string;
  paidAt?: string;
  itemSubtotalPaise: number;
  itemDiscountPaise?: number;
  couponCode?: string;
  couponDiscountPaise?: number;
  deliveryFeePaise: number;
  packagingFeePaise: number;
  taxPaise?: number;
  taxLabel?: string;
  platformFeePaise: number;
  totalPaise: number;
  estimatedDeliveryMinutes?: number;
  acceptWindowSeconds?: number;
  acceptDeadlineAt?: string;
  acceptedAt?: string;
  assignedRunnerName?: string;
  assignedRunnerPhone?: string;
  cancellation?: OrderCancellationInfo;
  returnInfo?: OrderReturnInfo;
  refundInfo?: OrderRefundInfo;
  createdAt: string;
  updatedAt: string;
}

export interface SellerOrderNotification {
  id: string;
  orderId: string;
  orderNumber: string;
  sellerId: string;
  sellerName: string;
  customerName: string;
  villageName: string;
  itemsCount: number;
  totalPaise: number;
  paymentMethod: PaymentMethod;
  createdAt: string;
  acceptDeadlineAt: string;
  read: boolean;
}
