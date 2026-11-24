/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import {
  Copy,
  Check,
  User,
  Phone,
  MapPin,
  Store,
  Clock,
  Truck,
  CreditCard,
  Package,
  Printer,
  ShieldCheck,
  Tag,
  XCircle,
  RotateCcw,
  RefreshCw,
  AlertTriangle,
  Receipt,
  CheckCircle2,
  History,
  FileText,
  ArrowRight,
} from 'lucide-react';
import { Order, OrderStatus } from '../../../types/order';
import {
  AdminCancelOrderPayload,
  RecordOrderReturnPayload,
  ProcessOrderRefundPayload,
} from '../../../contexts/OrderContext';
import { Drawer } from '../../../components/ui/Drawer';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { Tabs } from '../../../components/ui/Tabs';
import { VerticalBadge } from './VerticalBadge';
import { AdminOrderTimeline } from './AdminOrderTimeline';
import {
  ProcessRefundModal,
  AdminCancelOrderModal,
  RecordReturnModal,
} from './AdminOrderActionModals';
import {
  ORDER_STATUS_META,
  PAYMENT_STATUS_META,
  PAYMENT_METHOD_LABELS,
  RETURN_STATUS_META,
  REFUND_STATUS_META,
  REFUND_METHOD_LABELS,
  computeOrderFinancials,
  getResolvedCancellationInfo,
} from './orderManagementHelpers';
import { formatINR } from '../../../utils/currency';
import { formatDateTime, formatTimeAgo } from '../../../utils/dates';

type DrawerTab = 'OVERVIEW' | 'ITEMS_FINANCIALS' | 'RETURNS_REFUNDS' | 'TIMELINE';

export interface AdminOrderDetailDrawerProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
  adminName?: string;
  onStatusChange?: (orderId: string, nextStatus: OrderStatus, reason?: string) => void;
  onCancelOrder?: (orderId: string, payload: AdminCancelOrderPayload) => void;
  onRecordReturn?: (orderId: string, payload: RecordOrderReturnPayload) => void;
  onProcessRefund?: (orderId: string, payload: ProcessOrderRefundPayload) => void;
}

export const AdminOrderDetailDrawer: React.FC<AdminOrderDetailDrawerProps> = ({
  order,
  isOpen,
  onClose,
  adminName = 'Super Admin',
  onStatusChange,
  onCancelOrder,
  onRecordReturn,
  onProcessRefund,
}) => {
  const [activeTab, setActiveTab] = useState<DrawerTab>('OVERVIEW');
  const [copiedId, setCopiedId] = useState(false);
  const [copiedSlip, setCopiedSlip] = useState(false);
  const [showStatusChanger, setShowStatusChanger] = useState(false);
  const [selectedNextStatus, setSelectedNextStatus] = useState<OrderStatus>('completed');
  const [statusChangeReason, setStatusChangeReason] = useState('');

  // Action Modals
  const [isRefundModalOpen, setIsRefundModalOpen] = useState(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);

  // Reset transient drawer UI state whenever the inspected order changes
  useEffect(() => {
    setActiveTab('OVERVIEW');
    setShowStatusChanger(false);
    setStatusChangeReason('');
    setCopiedId(false);
    setCopiedSlip(false);
    setIsRefundModalOpen(false);
    setIsCancelModalOpen(false);
    setIsReturnModalOpen(false);
    if (order) {
      setSelectedNextStatus(order.status === 'completed' ? 'returned' : 'completed');
    }
  }, [order?.id]);

  if (!order) return null;

  const canManage = Boolean(onStatusChange || onCancelOrder || onRecordReturn || onProcessRefund);
  const financials = computeOrderFinancials(order);
  const cancellationInfo = getResolvedCancellationInfo(order);
  const statusMeta = ORDER_STATUS_META[order.status] || {
    label: order.status.replace(/_/g, ' '),
    shortLabel: order.status,
    variant: 'neutral' as const,
  };
  const paymentStatusMeta = PAYMENT_STATUS_META[order.paymentStatus] || {
    label: order.paymentStatus,
    variant: 'neutral' as const,
  };

  const isCancellable = !['cancelled', 'rejected', 'returned', 'refunded'].includes(order.status);
  const isReturnable = ['completed', 'returned', 'delivery_failed'].includes(order.status);
  const canIssueRefund =
    order.paymentStatus !== 'refunded' &&
    (order.refundInfo?.status !== 'COMPLETED' ||
      (order.refundInfo?.amountPaise || 0) < order.totalPaise);

  const workflowStatusOptions: Array<{ value: OrderStatus; label: string }> = [
    { value: 'placed', label: 'New' },
    { value: 'pending', label: 'Pending' },
    { value: 'accepted', label: 'Confirmed' },
    { value: 'preparing', label: 'Preparing' },
    ...(order.fulfilmentMode === 'PICKUP'
      ? [{ value: 'ready_for_pickup' as OrderStatus, label: 'Ready (Pickup)' }]
      : [
          { value: 'ready_for_delivery' as OrderStatus, label: 'Ready (Delivery)' },
          { value: 'out_for_delivery' as OrderStatus, label: 'Out for Delivery' },
          { value: 'delivery_failed' as OrderStatus, label: 'Delivery Failed' },
        ]),
    { value: 'completed', label: 'Delivered' },
    { value: 'cancelled', label: 'Cancelled' },
    { value: 'returned', label: 'Returned' },
    { value: 'refunded', label: 'Refunded' },
  ];

  const handleCopyOrderId = () => {
    navigator.clipboard.writeText(order.orderNumber || order.id);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const handleCopySlipText = () => {
    const itemsText = order.items
      .map((it) => {
        const variantPart = it.variantLabel ? ` [${it.variantLabel}]` : '';
        const optionsPart =
          it.selectedOptions && it.selectedOptions.length > 0
            ? ` (+ ${it.selectedOptions.map((op) => op.optionLabel).join(', ')})`
            : '';
        return `• ${it.productName}${variantPart}${optionsPart} (${it.requestedQuantity} × ${it.requestedUnitLabel}) - ${formatINR(
          it.lineTotalPaise
        )}`;
      })
      .join('\n');

    const slipLines = [
      `*GRAMBAZAAR ORDER SLIP*`,
      `Order No: ${order.orderNumber} (${order.id})`,
      `Store: ${order.sellerName} (${order.sellerPhone})`,
      `Customer: ${order.customerName} (${order.customerPhone})`,
      `Destination: ${order.deliveryAddress?.landmark || 'Store Pickup'}, ${
        order.deliveryAddress?.villageName || 'Rampur'
      }`,
      `Payment: ${PAYMENT_METHOD_LABELS[order.paymentMethod]} (${paymentStatusMeta.label})`,
      ``,
      `*ITEMS (${financials.totalQuantity} qty):*`,
      itemsText,
      ``,
      `Subtotal: ${formatINR(financials.subtotalPaise)}`,
      ...(financials.itemDiscountPaise > 0
        ? [`Item Discount: -${formatINR(financials.itemDiscountPaise)}`]
        : []),
      ...(financials.couponDiscountPaise > 0
        ? [
            `Coupon (${order.couponCode || 'OFFER'}): -${formatINR(
              financials.couponDiscountPaise
            )}`,
          ]
        : []),
      `Delivery Charge: ${formatINR(financials.deliveryFeePaise)}`,
      ...(financials.packagingFeePaise > 0
        ? [`Packaging Fee: ${formatINR(financials.packagingFeePaise)}`]
        : []),
      ...(financials.taxPaise > 0
        ? [`${financials.taxLabel}: ${formatINR(financials.taxPaise)}`]
        : []),
      ...(financials.platformFeePaise > 0
        ? [`Platform Fee: ${formatINR(financials.platformFeePaise)}`]
        : []),
      `*Total Paid: ${formatINR(financials.totalPaidPaise)}*`,
      ...(order.refundInfo
        ? [
            `Refund (${order.refundInfo.status}): ${formatINR(order.refundInfo.amountPaise)}`,
          ]
        : []),
      `Order Status: ${statusMeta.label}`,
    ];

    navigator.clipboard.writeText(slipLines.join('\n'));
    setCopiedSlip(true);
    setTimeout(() => setCopiedSlip(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleApplyStatusChange = () => {
    if (onStatusChange && selectedNextStatus !== order.status) {
      onStatusChange(
        order.id,
        selectedNextStatus,
        statusChangeReason.trim() ||
          `Administrative status override to ${ORDER_STATUS_META[selectedNextStatus]?.label || selectedNextStatus}`
      );
      setShowStatusChanger(false);
      setStatusChangeReason('');
    }
  };

  const postOrderBadgeCount =
    (cancellationInfo ? 1 : 0) + (order.returnInfo ? 1 : 0) + (order.refundInfo ? 1 : 0);

  return (
    <>
      <Drawer
        isOpen={isOpen}
        onClose={onClose}
        title={`Order ${order.orderNumber}`}
        subtitle={`${order.sellerName} • Placed ${formatTimeAgo(order.createdAt)}`}
        width="max-w-3xl"
        footer={
          <div className="w-full flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs">
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={handleCopySlipText}
                leftIcon={
                  copiedSlip ? (
                    <Check className="w-3.5 h-3.5 text-[#218838]" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )
                }
              >
                {copiedSlip ? 'Copied Slip!' : 'Copy Slip'}
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={handlePrint}
                leftIcon={<Printer className="w-3.5 h-3.5" />}
              >
                Print
              </Button>
            </div>

            <div className="flex flex-wrap items-center justify-end gap-2">
              {canManage && onProcessRefund && canIssueRefund && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsRefundModalOpen(true)}
                  leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
                >
                  {order.refundInfo ? 'Update Refund' : 'Process Refund'}
                </Button>
              )}
              {onStatusChange && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    setShowStatusChanger((v) => !v);
                    setActiveTab('TIMELINE');
                  }}
                >
                  {showStatusChanger ? 'Cancel Override' : 'Override Status'}
                </Button>
              )}
              <Button variant="secondary" size="sm" onClick={onClose}>
                Close
              </Button>
            </div>
          </div>
        }
      >
        <div className="space-y-5 text-left pb-4">
          {/* SECTION 1: ORDER OVERVIEW HEADER CARD */}
          <div className="bg-[#F8FAFC] border border-[#E5E7EB] rounded-2xl p-4 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <span className="font-mono font-black text-sm text-[#1F2937]">
                  {order.orderNumber}
                </span>
                <span className="font-mono text-[11px] text-[#6B7280] hidden sm:inline">
                  ({order.id})
                </span>
                <button
                  type="button"
                  onClick={handleCopyOrderId}
                  className="p-1 rounded-md text-[#6B7280] hover:text-[#1F2937] hover:bg-[#E5E7EB] transition-colors cursor-pointer"
                  title="Copy Order Number"
                  aria-label="Copy Order Number"
                >
                  {copiedId ? (
                    <Check className="w-3.5 h-3.5 text-[#218838]" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-1.5">
                <Badge variant={statusMeta.variant} size="sm" dot>
                  {statusMeta.label}
                </Badge>
                <Badge variant="neutral" size="sm">
                  {order.fulfilmentMode === 'DELIVERY' ? 'Doorstep Delivery' : 'Self-Pickup'}
                </Badge>
                <Badge variant={paymentStatusMeta.variant} size="sm">
                  {order.paymentMethod === 'SELLER_UPI' ? 'UPI' : order.paymentMethod} •{' '}
                  {paymentStatusMeta.label}
                </Badge>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2.5 border-t border-[#E5E7EB] text-xs">
              <div>
                <p className="text-[#6B7280] text-[11px]">Placed At</p>
                <p className="font-semibold text-[#1F2937]">{formatDateTime(order.createdAt)}</p>
              </div>
              <div>
                <p className="text-[#6B7280] text-[11px]">Village Territory</p>
                <p className="font-semibold text-[#1F2937]">
                  {order.deliveryAddress?.villageName || 'Store Counter Pickup'}
                </p>
              </div>
              <div>
                <p className="text-[#6B7280] text-[11px]">Items & Quantity</p>
                <p className="font-semibold text-[#1F2937]">
                  {financials.totalItemCount} SKU{financials.totalItemCount !== 1 ? 's' : ''} ({financials.totalQuantity} qty)
                </p>
              </div>
              <div>
                <p className="text-[#6B7280] text-[11px]">Total Paid</p>
                <p className="font-black text-[#218838] text-sm">
                  {formatINR(financials.totalPaidPaise)}
                </p>
                {order.refundInfo && (
                  <p className="text-[10px] font-semibold text-[#D97706]">
                    Refund ({order.refundInfo.status}): {formatINR(order.refundInfo.amountPaise)}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* SECTION NAVIGATION TABS */}
          <Tabs
            variant="underline"
            activeTab={activeTab}
            onChange={(id) => setActiveTab(id as DrawerTab)}
            tabs={[
              { id: 'OVERVIEW', label: 'Overview & Parties', icon: <User className="w-3.5 h-3.5" /> },
              {
                id: 'ITEMS_FINANCIALS',
                label: 'Items & Financials',
                icon: <Receipt className="w-3.5 h-3.5" />,
                count: order.items.length,
              },
              {
                id: 'RETURNS_REFUNDS',
                label: 'Cancel, Return & Refund',
                icon: <RotateCcw className="w-3.5 h-3.5" />,
                count: postOrderBadgeCount > 0 ? postOrderBadgeCount : undefined,
              },
              {
                id: 'TIMELINE',
                label: 'Timeline & History',
                icon: <History className="w-3.5 h-3.5" />,
                count: order.statusHistory?.length || 0,
              },
            ]}
          />

          {/* =================================================================
           * TAB 1: OVERVIEW, CUSTOMER, SELLER, DELIVERY/PICKUP & PAYMENT
           * ================================================================= */}
          {activeTab === 'OVERVIEW' && (
            <div className="space-y-4">
              {/* Contextual Banners for Cancelled / Returned / Refunded */}
              {cancellationInfo && (
                <div className="p-3.5 bg-[#FEF2F2] border border-[#FECACA] rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                  <div className="flex items-start gap-2.5">
                    <XCircle className="w-4 h-4 text-[#DC2626] shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-[#991B1B]">
                        Cancelled by {cancellationInfo.cancelledBy} •{' '}
                        {formatDateTime(cancellationInfo.cancelledAt)}
                      </p>
                      <p className="text-[#B91C1C] mt-0.5">{cancellationInfo.reason}</p>
                    </div>
                  </div>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setActiveTab('RETURNS_REFUNDS')}
                    rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                  >
                    View Details
                  </Button>
                </div>
              )}

              {(order.returnInfo || order.refundInfo) && (
                <div className="p-3.5 bg-[#FEF3C7]/60 border border-[#FCD34D] rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                  <div className="flex items-start gap-2.5">
                    <RotateCcw className="w-4 h-4 text-[#D97706] shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-[#92400E]">
                        {order.returnInfo ? `Return ${order.returnInfo.returnId} (${RETURN_STATUS_META[order.returnInfo.status].label})` : 'Post-Order Refund Active'}
                      </p>
                      <p className="text-[#92400E]/90 mt-0.5">
                        {order.refundInfo
                          ? `Refund ${order.refundInfo.refundId}: ${formatINR(order.refundInfo.amountPaise)} — Status: ${REFUND_STATUS_META[order.refundInfo.status].label}`
                          : order.returnInfo?.reason}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setActiveTab('RETURNS_REFUNDS')}
                    rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                  >
                    Manage
                  </Button>
                </div>
              )}

              {/* SECTIONS 2 & 3: CUSTOMER & SELLER CARDS */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Section 2: Customer Details */}
                <div className="bg-white border border-[#E5E7EB] rounded-2xl p-4 space-y-3">
                  <div className="flex items-center gap-2 pb-2 border-b border-[#E5E7EB]">
                    <User className="w-4 h-4 text-[#218838]" />
                    <h4 className="text-xs font-bold text-[#1F2937]">Customer Details</h4>
                  </div>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between gap-2">
                      <span className="text-[#6B7280]">Customer Name</span>
                      <span className="font-bold text-[#1F2937] text-right">{order.customerName}</span>
                    </div>
                    <div className="flex justify-between gap-2">
                      <span className="text-[#6B7280]">Customer ID</span>
                      <span className="font-mono text-[11px] text-[#475569]">{order.customerId}</span>
                    </div>
                    <div className="flex justify-between gap-2">
                      <span className="text-[#6B7280]">Phone</span>
                      <a
                        href={`tel:${order.customerPhone}`}
                        className="font-semibold text-[#218838] hover:underline flex items-center gap-1"
                      >
                        <Phone className="w-3.5 h-3.5" />
                        {order.customerPhone}
                      </a>
                    </div>
                    {order.deliveryAddress &&
                      order.deliveryAddress.recipientName !== order.customerName && (
                        <div className="pt-2 border-t border-[#E5E7EB] text-[11px] text-[#6B7280]">
                          <span className="font-semibold text-[#1F2937]">Alternate Recipient:</span>{' '}
                          {order.deliveryAddress.recipientName} ({order.deliveryAddress.recipientPhone})
                        </div>
                      )}
                  </div>
                </div>

                {/* Section 3: Seller / Shop Details */}
                <div className="bg-white border border-[#E5E7EB] rounded-2xl p-4 space-y-3">
                  <div className="flex items-center gap-2 pb-2 border-b border-[#E5E7EB]">
                    <Store className="w-4 h-4 text-[#218838]" />
                    <h4 className="text-xs font-bold text-[#1F2937]">Seller / Shop Details</h4>
                  </div>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between gap-2">
                      <span className="text-[#6B7280]">Shop Name</span>
                      <span className="font-bold text-[#1F2937] text-right">{order.sellerName}</span>
                    </div>
                    <div className="flex justify-between gap-2">
                      <span className="text-[#6B7280]">Seller ID</span>
                      <span className="font-mono text-[11px] text-[#475569]">{order.sellerId}</span>
                    </div>
                    <div className="flex justify-between gap-2">
                      <span className="text-[#6B7280]">Shop Phone</span>
                      <a
                        href={`tel:${order.sellerPhone}`}
                        className="font-semibold text-[#218838] hover:underline flex items-center gap-1"
                      >
                        <Phone className="w-3.5 h-3.5" />
                        {order.sellerPhone}
                      </a>
                    </div>
                    <div className="flex justify-between gap-2">
                      <span className="text-[#6B7280]">Village Zone</span>
                      <span className="font-semibold text-[#1F2937] capitalize">{order.villageId}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* SECTIONS 6 & 7: PAYMENT DETAILS + DELIVERY / PICKUP DETAILS */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Section 6: Payment Details */}
                <div className="bg-white border border-[#E5E7EB] rounded-2xl p-4 space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-[#E5E7EB]">
                    <div className="flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-[#218838]" />
                      <h4 className="text-xs font-bold text-[#1F2937]">Payment Details</h4>
                    </div>
                    <Badge variant={paymentStatusMeta.variant} size="sm">
                      {paymentStatusMeta.label}
                    </Badge>
                  </div>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between gap-2">
                      <span className="text-[#6B7280]">Method</span>
                      <span className="font-bold text-[#1F2937]">
                        {PAYMENT_METHOD_LABELS[order.paymentMethod]}
                      </span>
                    </div>
                    <div className="flex justify-between gap-2">
                      <span className="text-[#6B7280]">Total Amount</span>
                      <span className="font-black text-[#1F2937]">{formatINR(order.totalPaise)}</span>
                    </div>
                    <div className="flex justify-between gap-2">
                      <span className="text-[#6B7280]">Payment Ref / UTR</span>
                      <span className="font-mono text-[11px] text-[#475569]">
                        {order.paymentReferenceId || (order.paymentMethod === 'COD' ? 'Cash on Handover' : 'Pending Verification')}
                      </span>
                    </div>
                    {order.paidAt && (
                      <div className="flex justify-between gap-2">
                        <span className="text-[#6B7280]">Paid At</span>
                        <span className="text-[#1F2937] font-medium">{formatDateTime(order.paidAt)}</span>
                      </div>
                    )}
                    {order.refundInfo && (
                      <div className="pt-2 border-t border-[#E5E7EB] flex justify-between items-center gap-2">
                        <span className="text-[#6B7280]">Refund Status</span>
                        <Badge variant={REFUND_STATUS_META[order.refundInfo.status].variant} size="sm">
                          {REFUND_STATUS_META[order.refundInfo.status].label} ({formatINR(order.refundInfo.amountPaise)})
                        </Badge>
                      </div>
                    )}
                  </div>
                </div>

                {/* Section 7: Delivery / Pickup Details */}
                <div className="bg-white border border-[#E5E7EB] rounded-2xl p-4 space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-[#E5E7EB]">
                    <div className="flex items-center gap-2">
                      <Truck className="w-4 h-4 text-[#218838]" />
                      <h4 className="text-xs font-bold text-[#1F2937]">Delivery / Pickup Details</h4>
                    </div>
                    <Badge variant="neutral" size="sm">
                      {order.fulfilmentMode === 'DELIVERY' ? 'Delivery' : 'Self-Pickup'}
                    </Badge>
                  </div>
                  <div className="space-y-2.5 text-xs">
                    {order.deliveryAddress ? (
                      <div className="bg-[#E8F5E9]/50 border border-[#218838]/20 rounded-xl p-2.5">
                        <div className="flex items-start gap-1.5 text-[#176B2C]">
                          <MapPin className="w-4 h-4 shrink-0 mt-0.5" />
                          <div>
                            <p className="font-bold text-xs">{order.deliveryAddress.landmark}</p>
                            <p className="text-[11px] text-[#1F2937] mt-0.5">
                              {order.deliveryAddress.addressLine1}
                            </p>
                            <p className="text-[10px] text-[#6B7280] mt-0.5">
                              Village: {order.deliveryAddress.villageName} • Label:{' '}
                              {order.deliveryAddress.addressLabel}
                            </p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="p-2.5 bg-[#F8FAFC] border border-[#E5E7EB] rounded-xl text-[11px] text-[#475569] flex items-center gap-2">
                        <Store className="w-4 h-4 text-[#218838] shrink-0" />
                        <span>Customer will collect order directly at {order.sellerName} counter.</span>
                      </div>
                    )}

                    {order.assignedRunnerName ? (
                      <div className="bg-[#EFF6FF] border border-[#BFDBFE] rounded-xl p-2.5 text-xs text-[#1E40AF]">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-bold">Assigned Runner</span>
                          <span className="text-[11px] font-semibold">{order.assignedRunnerName}</span>
                        </div>
                        {order.assignedRunnerPhone && (
                          <a
                            href={`tel:${order.assignedRunnerPhone}`}
                            className="text-[11px] text-[#2563EB] underline inline-flex items-center gap-1 mt-1"
                          >
                            <Phone className="w-3 h-3" />
                            {order.assignedRunnerPhone}
                          </a>
                        )}
                      </div>
                    ) : (
                      <p className="text-[11px] text-[#6B7280]">
                        {order.fulfilmentMode === 'PICKUP'
                          ? 'No delivery runner required for self-pickup.'
                          : 'Fulfillment handled directly by merchant or unassigned runner.'}
                      </p>
                    )}

                    {order.deliveryNote && (
                      <div className="p-2 bg-[#FEF3C7]/60 border border-[#FCD34D] rounded-lg text-[11px] text-[#92400E]">
                        <strong>Note:</strong> {order.deliveryNote}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* =================================================================
           * TAB 2: ORDERED PRODUCTS, VARIANTS/ADD-ONS & FINANCIAL BREAKDOWN
           * ================================================================= */}
          {activeTab === 'ITEMS_FINANCIALS' && (
            <div className="space-y-5">
              {/* SECTIONS 4 & 5: ORDERED PRODUCTS, VARIANTS, QUANTITIES & ADD-ONS */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-[#6B7280] uppercase tracking-wider flex items-center gap-1.5">
                    <Package className="w-3.5 h-3.5 text-[#218838]" />
                    <span>
                      Ordered Products ({financials.totalItemCount} SKU
                      {financials.totalItemCount !== 1 ? 's' : ''} • {financials.totalQuantity} Total Qty)
                    </span>
                  </h4>
                  <span className="text-[11px] text-[#6B7280]">
                    Subtotal:{' '}
                    <strong className="text-[#1F2937]">{formatINR(financials.subtotalPaise)}</strong>
                  </span>
                </div>

                <div className="border border-[#E5E7EB] rounded-2xl overflow-hidden bg-white shadow-2xs divide-y divide-[#E5E7EB]">
                  {order.items.map((item, index) => (
                    <div
                      key={item.id || index}
                      className="p-3.5 flex flex-col sm:flex-row sm:items-start justify-between gap-3 text-xs hover:bg-[#F8FAFC]/50 transition-colors"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-[#E8F5E9] text-[#176B2C] flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                          {index + 1}
                        </div>
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <p className="font-bold text-[#1F2937] text-sm">{item.productName}</p>
                            <VerticalBadge vertical={item.catalogueType} />
                            {item.sku && (
                              <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-[#F1F5F9] text-[#475569]">
                                SKU: {item.sku}
                              </span>
                            )}
                            {item.returnedQuantity && item.returnedQuantity > 0 && (
                              <Badge variant="warning" size="sm">
                                Returned: {item.returnedQuantity} qty
                              </Badge>
                            )}
                          </div>

                          {/* Variant Label & Attributes */}
                          {(item.variantLabel ||
                            (item.variantAttributes &&
                              Object.keys(item.variantAttributes).length > 0)) && (
                            <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                              {item.variantLabel && (
                                <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#DBEAFE] text-[#1E40AF]">
                                  <Tag className="w-2.5 h-2.5" />
                                  {item.variantLabel}
                                </span>
                              )}
                              {item.variantAttributes &&
                                Object.entries(item.variantAttributes).map(([k, v]) => (
                                  <span
                                    key={k}
                                    className="text-[10px] px-2 py-0.5 rounded-full bg-[#F1F5F9] text-[#475569]"
                                  >
                                    {k}: <strong>{v}</strong>
                                  </span>
                                ))}
                            </div>
                          )}

                          {/* Add-ons / Customizations */}
                          {item.selectedOptions && item.selectedOptions.length > 0 && (
                            <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                              {item.selectedOptions.map((opt, optIdx) => (
                                <span
                                  key={`${opt.groupName}-${opt.optionLabel}-${optIdx}`}
                                  className="text-[10px] px-2 py-0.5 rounded-md bg-[#E8F5E9] text-[#176B2C] border border-[#A7F3D0]"
                                >
                                  {opt.groupName}: <strong>{opt.optionLabel}</strong>
                                  {opt.priceDeltaPaise > 0 && (
                                    <span className="ml-1 text-[#218838] font-bold">
                                      (+{formatINR(opt.priceDeltaPaise)})
                                    </span>
                                  )}
                                </span>
                              ))}
                            </div>
                          )}

                          <p className="text-[11px] text-[#6B7280]">
                            Qty: <strong className="text-[#1F2937]">{item.requestedQuantity}</strong> ×{' '}
                            {item.requestedUnitLabel}
                            <span className="mx-1.5">•</span>
                            Unit Price:{' '}
                            <strong className="text-[#1F2937]">{formatINR(item.unitPricePaise)}</strong>
                            {item.mrpUnitPricePaise && item.mrpUnitPricePaise > item.unitPricePaise && (
                              <span className="ml-1.5 line-through text-[#94A3B8]">
                                {formatINR(item.mrpUnitPricePaise)}
                              </span>
                            )}
                          </p>
                          {item.itemDiscountPaise && item.itemDiscountPaise > 0 && (
                            <p className="text-[11px] font-semibold text-[#16A34A]">
                              Item Discount: -{formatINR(item.itemDiscountPaise)}
                            </p>
                          )}
                          {item.customerNote && (
                            <p className="text-[11px] text-[#92400E] italic bg-[#FEF3C7]/60 px-2 py-0.5 rounded-md inline-block mt-1">
                              Note: "{item.customerNote}"
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="sm:text-right shrink-0 pl-11 sm:pl-0">
                        <p className="font-black text-sm text-[#1F2937]">
                          {formatINR(item.lineTotalPaise)}
                        </p>
                        <p className="text-[10px] text-[#6B7280]">Line Total</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* SECTION 8: FINANCIAL BREAKDOWN */}
              <div className="space-y-2.5">
                <h4 className="text-xs font-bold text-[#6B7280] uppercase tracking-wider flex items-center gap-1.5">
                  <Receipt className="w-3.5 h-3.5 text-[#218838]" />
                  <span>Complete Financial Breakdown</span>
                </h4>

                <div className="bg-[#F8FAFC] border border-[#E5E7EB] rounded-2xl p-4 space-y-2.5 text-xs">
                  <div className="flex items-center justify-between text-[#6B7280]">
                    <span>
                      Items Subtotal ({financials.totalItemCount} item
                      {financials.totalItemCount !== 1 ? 's' : ''}, {financials.totalQuantity} qty)
                    </span>
                    <span className="font-bold text-[#1F2937]">
                      {formatINR(financials.subtotalPaise)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[#6B7280]">
                    <span>Item Discounts</span>
                    <span
                      className={`font-bold ${
                        financials.itemDiscountPaise > 0 ? 'text-[#16A34A]' : 'text-[#6B7280]'
                      }`}
                    >
                      {financials.itemDiscountPaise > 0
                        ? `-${formatINR(financials.itemDiscountPaise)}`
                        : '₹0.00'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[#6B7280]">
                    <div className="flex items-center gap-1.5">
                      <span>Coupon / Offer Discount</span>
                      {order.couponCode && (
                        <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#E8F5E9] text-[#176B2C] border border-[#A7F3D0]">
                          {order.couponCode}
                        </span>
                      )}
                    </div>
                    <span
                      className={`font-bold ${
                        financials.couponDiscountPaise > 0 ? 'text-[#16A34A]' : 'text-[#6B7280]'
                      }`}
                    >
                      {financials.couponDiscountPaise > 0
                        ? `-${formatINR(financials.couponDiscountPaise)}`
                        : '₹0.00'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[#6B7280]">
                    <span>Delivery Charge</span>
                    <span className="font-bold text-[#1F2937]">
                      {financials.deliveryFeePaise > 0
                        ? formatINR(financials.deliveryFeePaise)
                        : 'Free (₹0.00)'}
                    </span>
                  </div>

                  {financials.packagingFeePaise > 0 && (
                    <div className="flex items-center justify-between text-[#6B7280]">
                      <span>Packaging & Safe Bags</span>
                      <span className="font-bold text-[#1F2937]">
                        {formatINR(financials.packagingFeePaise)}
                      </span>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-[#6B7280]">
                    <span>{financials.taxLabel}</span>
                    <span className="font-bold text-[#1F2937]">
                      {formatINR(financials.taxPaise)}
                    </span>
                  </div>

                  {financials.platformFeePaise > 0 && (
                    <div className="flex items-center justify-between text-[#6B7280]">
                      <span>Platform Fee</span>
                      <span className="font-bold text-[#1F2937]">
                        {formatINR(financials.platformFeePaise)}
                      </span>
                    </div>
                  )}

                  {/* Total Paid */}
                  <div className="pt-3 border-t border-[#E5E7EB] flex items-center justify-between">
                    <div>
                      <p className="text-sm font-black text-[#1F2937]">Total Paid / Order Total</p>
                      <p className="text-[11px] text-[#6B7280]">
                        Via <strong className="text-[#1F2937]">{PAYMENT_METHOD_LABELS[order.paymentMethod]}</strong>{' '}
                        ({paymentStatusMeta.label})
                      </p>
                    </div>
                    <span className="text-xl font-black text-[#218838]">
                      {formatINR(financials.totalPaidPaise)}
                    </span>
                  </div>

                  {/* Refund Summary inside Financial Breakdown (if applicable) */}
                  {order.refundInfo && (
                    <div className="pt-3 border-t border-dashed border-[#CBD5E1] space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-[#92400E] flex items-center gap-1.5">
                          <span>Refund Amount</span>
                          <Badge variant={REFUND_STATUS_META[order.refundInfo.status].variant} size="sm">
                            {REFUND_STATUS_META[order.refundInfo.status].label}
                          </Badge>
                        </span>
                        <span className="font-black text-[#DC2626]">
                          -{formatINR(financials.refundAmountPaise)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-[#6B7280]">Net Retained Order Value</span>
                        <span className="font-bold text-[#1F2937]">
                          {formatINR(financials.netRetainedPaise)}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* =================================================================
           * TAB 3: CANCELLATION, RETURN & REFUND MANAGEMENT
           * ================================================================= */}
          {activeTab === 'RETURNS_REFUNDS' && (
            <div className="space-y-5">
              {/* SECTION 9: CANCELLATION DETAILS */}
              <div className="bg-white border border-[#E5E7EB] rounded-2xl p-4 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-[#E5E7EB]">
                  <div className="flex items-center gap-2">
                    <XCircle className="w-4 h-4 text-[#DC2626]" />
                    <h4 className="text-xs font-bold text-[#1F2937]">Cancellation Details</h4>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={cancellationInfo ? 'error' : 'neutral'} size="sm">
                      {cancellationInfo ? 'Cancelled' : 'Not Cancelled'}
                    </Badge>
                    {canManage && onCancelOrder && isCancellable && (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => setIsCancelModalOpen(true)}
                        leftIcon={<XCircle className="w-3.5 h-3.5" />}
                      >
                        Cancel Order
                      </Button>
                    )}
                  </div>
                </div>

                {cancellationInfo ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="p-3 bg-[#FEF2F2]/70 border border-[#FECACA] rounded-xl sm:col-span-2">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-[#991B1B]">
                        Cancellation Reason
                      </p>
                      <p className="text-[#1F2937] font-medium mt-1">{cancellationInfo.reason}</p>
                      {cancellationInfo.notes && (
                        <p className="text-[11px] text-[#6B7280] mt-1">
                          Note: {cancellationInfo.notes}
                        </p>
                      )}
                    </div>
                    <div className="p-3 bg-[#F8FAFC] border border-[#E5E7EB] rounded-xl">
                      <p className="text-[11px] text-[#6B7280]">Cancelled By</p>
                      <p className="font-bold text-[#1F2937] mt-0.5">{cancellationInfo.cancelledBy}</p>
                    </div>
                    <div className="p-3 bg-[#F8FAFC] border border-[#E5E7EB] rounded-xl">
                      <p className="text-[11px] text-[#6B7280]">Cancellation Date & Time</p>
                      <p className="font-semibold text-[#1F2937] mt-0.5">
                        {formatDateTime(cancellationInfo.cancelledAt)}
                      </p>
                    </div>
                    <div className="p-3 bg-[#F8FAFC] border border-[#E5E7EB] rounded-xl">
                      <p className="text-[11px] text-[#6B7280]">Refund Eligibility</p>
                      <div className="mt-1">
                        <Badge
                          variant={cancellationInfo.refundEligible ? 'success' : 'neutral'}
                          size="sm"
                        >
                          {cancellationInfo.refundEligible
                            ? 'Eligible for Refund'
                            : 'No Refund Required (Unpaid / COD)'}
                        </Badge>
                      </div>
                    </div>
                    <div className="p-3 bg-[#F8FAFC] border border-[#E5E7EB] rounded-xl">
                      <p className="text-[11px] text-[#6B7280]">Linked Refund Status</p>
                      <div className="mt-1">
                        {order.refundInfo ? (
                          <Badge
                            variant={REFUND_STATUS_META[order.refundInfo.status].variant}
                            size="sm"
                          >
                            {REFUND_STATUS_META[order.refundInfo.status].label}
                          </Badge>
                        ) : (
                          <span className="text-[11px] font-semibold text-[#6B7280]">
                            {cancellationInfo.refundEligible ? 'Not Yet Initiated' : 'N/A'}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-[#6B7280]">
                    This order has not been cancelled. Admins can cancel active orders with a mandatory compliance reason and actor attribution.
                  </p>
                )}
              </div>

              {/* SECTION 10A: RETURN MANAGEMENT DETAILS */}
              <div className="bg-white border border-[#E5E7EB] rounded-2xl p-4 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-[#E5E7EB]">
                  <div className="flex items-center gap-2">
                    <RotateCcw className="w-4 h-4 text-[#D97706]" />
                    <h4 className="text-xs font-bold text-[#1F2937]">Return Request & Items</h4>
                  </div>
                  <div className="flex items-center gap-2">
                    {order.returnInfo && (
                      <Badge variant={RETURN_STATUS_META[order.returnInfo.status].variant} size="sm">
                        {RETURN_STATUS_META[order.returnInfo.status].label}
                      </Badge>
                    )}
                    {canManage && onRecordReturn && isReturnable && (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setIsReturnModalOpen(true)}
                        leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
                      >
                        {order.returnInfo ? 'Update Return' : 'Record Return'}
                      </Button>
                    )}
                  </div>
                </div>

                {order.returnInfo ? (
                  <div className="space-y-3 text-xs">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="p-3 bg-[#F8FAFC] border border-[#E5E7EB] rounded-xl">
                        <p className="text-[11px] text-[#6B7280]">Return ID</p>
                        <p className="font-mono font-bold text-[#1F2937] mt-0.5">
                          {order.returnInfo.returnId}
                        </p>
                      </div>
                      <div className="p-3 bg-[#F8FAFC] border border-[#E5E7EB] rounded-xl">
                        <p className="text-[11px] text-[#6B7280]">Return Requested Date</p>
                        <p className="font-semibold text-[#1F2937] mt-0.5">
                          {formatDateTime(order.returnInfo.requestedAt)}
                        </p>
                      </div>
                      <div className="p-3 bg-[#F8FAFC] border border-[#E5E7EB] rounded-xl">
                        <p className="text-[11px] text-[#6B7280]">Last Updated</p>
                        <p className="font-semibold text-[#1F2937] mt-0.5">
                          {formatDateTime(order.returnInfo.updatedAt)}
                        </p>
                      </div>
                    </div>

                    <div className="p-3 bg-[#FEF3C7]/50 border border-[#FCD34D] rounded-xl">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-[#92400E]">
                        Return Reason
                      </p>
                      <p className="text-[#1F2937] font-medium mt-0.5">{order.returnInfo.reason}</p>
                      {order.returnInfo.notes && (
                        <p className="text-[11px] text-[#6B7280] mt-1">
                          Inspection Note: {order.returnInfo.notes}
                        </p>
                      )}
                    </div>

                    {/* Returned Items List */}
                    <div className="border border-[#E5E7EB] rounded-xl overflow-hidden">
                      <div className="px-3.5 py-2 bg-[#F8FAFC] border-b border-[#E5E7EB] text-[11px] font-bold uppercase tracking-wider text-[#6B7280]">
                        Returned Items ({order.returnInfo.returnedItems.length})
                      </div>
                      <div className="divide-y divide-[#E5E7EB]">
                        {order.returnInfo.returnedItems.map((ri) => (
                          <div
                            key={ri.orderItemId}
                            className="p-3 flex items-center justify-between gap-2 bg-white"
                          >
                            <div>
                              <p className="font-bold text-[#1F2937]">
                                {ri.productName}{' '}
                                {ri.variantLabel && (
                                  <span className="font-normal text-[#6B7280]">
                                    ({ri.variantLabel})
                                  </span>
                                )}
                              </p>
                              <p className="text-[11px] text-[#6B7280]">
                                Returned Qty: <strong>{ri.quantity}</strong> ({ri.unitLabel})
                                {ri.conditionNote ? ` • ${ri.conditionNote}` : ''}
                              </p>
                            </div>
                            <span className="font-bold text-[#1F2937] shrink-0">
                              {formatINR(ri.refundValuePaise)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-[#6B7280]">
                    {isReturnable
                      ? 'No return has been recorded for this order yet. Use "Record Return" to log returned items and condition details.'
                      : 'Return recording becomes available once an order is delivered or marked delivery failed.'}
                  </p>
                )}
              </div>

              {/* SECTION 10B: REFUND DETAILS & PROCESS REFUND */}
              <div className="bg-white border border-[#E5E7EB] rounded-2xl p-4 space-y-3.5">
                <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-[#E5E7EB]">
                  <div className="flex items-center gap-2">
                    <RefreshCw className="w-4 h-4 text-[#218838]" />
                    <h4 className="text-xs font-bold text-[#1F2937]">Refund Summary & Processing</h4>
                  </div>
                  <div className="flex items-center gap-2">
                    {order.refundInfo && (
                      <Badge variant={REFUND_STATUS_META[order.refundInfo.status].variant} size="sm" dot>
                        {REFUND_STATUS_META[order.refundInfo.status].label}
                      </Badge>
                    )}
                    {canManage && onProcessRefund && (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => setIsRefundModalOpen(true)}
                        leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
                      >
                        {order.refundInfo ? 'Update Refund Status' : 'Process Refund'}
                      </Button>
                    )}
                  </div>
                </div>

                {/* Refund State Progress Pills */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                  {(['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED'] as const).map((st) => {
                    const isCurrent = order.refundInfo?.status === st;
                    return (
                      <div
                        key={st}
                        className={`px-2.5 py-2 rounded-xl border text-center font-semibold transition-colors ${
                          isCurrent
                            ? st === 'COMPLETED'
                              ? 'bg-[#DCFCE7] border-[#86EFAC] text-[#166534]'
                              : st === 'FAILED'
                              ? 'bg-[#FEE2E2] border-[#FCA5A5] text-[#991B1B]'
                              : st === 'PROCESSING'
                              ? 'bg-[#DBEAFE] border-[#93C5FD] text-[#1E40AF]'
                              : 'bg-[#FEF3C7] border-[#FCD34D] text-[#92400E]'
                            : 'bg-[#F8FAFC] border-[#E5E7EB] text-[#94A3B8]'
                        }`}
                      >
                        {REFUND_STATUS_META[st].label}
                      </div>
                    );
                  })}
                </div>

                {order.refundInfo ? (
                  <div className="space-y-3 text-xs">
                    {order.refundInfo.status === 'FAILED' && order.refundInfo.failureReason && (
                      <div className="p-3 bg-[#FEF2F2] border border-[#FECACA] rounded-xl text-[#991B1B] flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 text-[#DC2626] shrink-0 mt-0.5" />
                        <div>
                          <p className="font-bold">Refund Execution Failed</p>
                          <p className="mt-0.5">{order.refundInfo.failureReason}</p>
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="p-3 bg-[#F8FAFC] border border-[#E5E7EB] rounded-xl">
                        <p className="text-[11px] text-[#6B7280]">Refund Amount</p>
                        <p className="text-base font-black text-[#218838] mt-0.5">
                          {formatINR(order.refundInfo.amountPaise)}{' '}
                          <span className="text-[11px] font-semibold text-[#6B7280]">
                            ({order.refundInfo.amountPaise >= order.totalPaise ? 'Full' : 'Partial'})
                          </span>
                        </p>
                      </div>
                      <div className="p-3 bg-[#F8FAFC] border border-[#E5E7EB] rounded-xl">
                        <p className="text-[11px] text-[#6B7280]">Refund Method</p>
                        <p className="font-bold text-[#1F2937] mt-0.5">
                          {REFUND_METHOD_LABELS[order.refundInfo.method]}
                        </p>
                      </div>
                      <div className="p-3 bg-[#F8FAFC] border border-[#E5E7EB] rounded-xl">
                        <p className="text-[11px] text-[#6B7280]">Refund ID & Reference</p>
                        <p className="font-mono font-bold text-[#1F2937] mt-0.5">
                          {order.refundInfo.refundId}
                        </p>
                        {order.refundInfo.referenceId && (
                          <p className="font-mono text-[10px] text-[#6B7280] mt-0.5">
                            Ref: {order.refundInfo.referenceId}
                          </p>
                        )}
                      </div>
                      <div className="p-3 bg-[#F8FAFC] border border-[#E5E7EB] rounded-xl">
                        <p className="text-[11px] text-[#6B7280]">Refund Date</p>
                        <p className="font-semibold text-[#1F2937] mt-0.5">
                          {order.refundInfo.completedAt
                            ? `Completed ${formatDateTime(order.refundInfo.completedAt)}`
                            : `Initiated ${formatDateTime(order.refundInfo.initiatedAt)}`}
                        </p>
                        <p className="text-[10px] text-[#6B7280] mt-0.5">
                          By {order.refundInfo.initiatedBy}
                        </p>
                      </div>
                    </div>

                    <div className="p-3 bg-[#F8FAFC] border border-[#E5E7EB] rounded-xl space-y-1">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-[#6B7280]">
                        Refund Reason
                      </p>
                      <p className="text-[#1F2937] font-medium">{order.refundInfo.reason}</p>
                    </div>

                    {/* Original Payment Reference Summary */}
                    <div className="p-3 bg-[#E8F5E9]/40 border border-[#A7F3D0] rounded-xl flex flex-wrap items-center justify-between gap-2 text-[11px]">
                      <div className="flex items-center gap-1.5 text-[#176B2C]">
                        <CheckCircle2 className="w-4 h-4 shrink-0" />
                        <span>
                          Original Payment: <strong>{PAYMENT_METHOD_LABELS[order.paymentMethod]}</strong>{' '}
                          ({formatINR(order.totalPaise)})
                          {order.paymentReferenceId ? ` • Ref ${order.paymentReferenceId}` : ''}
                        </span>
                      </div>
                      <span className="font-bold text-[#176B2C]">
                        Net Retained: {formatINR(financials.netRetainedPaise)}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 bg-[#F8FAFC] border border-dashed border-[#CBD5E1] rounded-xl text-xs text-[#6B7280] space-y-1">
                    <p className="font-semibold text-[#1F2937]">No refund initiated for this order.</p>
                    <p>
                      Original payment: <strong>{PAYMENT_METHOD_LABELS[order.paymentMethod]}</strong> (
                      {paymentStatusMeta.label}) for <strong>{formatINR(order.totalPaise)}</strong>. Click{' '}
                      <strong>Process Refund</strong> to initiate a full or partial refund with confirmation.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* =================================================================
           * TAB 4: ORDER TIMELINE, STATUS HISTORY & ADMIN OVERRIDE
           * ================================================================= */}
          {activeTab === 'TIMELINE' && (
            <div className="space-y-5">
              {/* Admin Status Override Panel (when toggled) */}
              {showStatusChanger && onStatusChange && (
                <div className="p-4 bg-[#FEF3C7]/60 border border-[#FCD34D] rounded-2xl space-y-3 text-xs">
                  <div className="flex items-center gap-2 text-[#92400E] font-bold">
                    <ShieldCheck className="w-4 h-4 text-[#D97706]" />
                    <span>Admin Order Status Override ({order.fulfilmentMode} Workflow)</span>
                  </div>
                  <p className="text-[11px] text-[#92400E]">
                    Manually transition order status to resolve stuck orders, runner exceptions, or offline cash settlements. All overrides are written to the immutable audit log.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-[#1F2937] mb-1">
                        Target Status
                      </label>
                      <select
                        value={selectedNextStatus}
                        onChange={(e) => setSelectedNextStatus(e.target.value as OrderStatus)}
                        className="w-full h-9 px-3 bg-white border border-[#E5E7EB] rounded-lg text-xs font-semibold text-[#1F2937]"
                      >
                        {workflowStatusOptions.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-[#1F2937] mb-1">
                        Reason for Override
                      </label>
                      <input
                        type="text"
                        placeholder="e.g., Verified handover with customer over phone"
                        value={statusChangeReason}
                        onChange={(e) => setStatusChangeReason(e.target.value)}
                        className="w-full h-9 px-3 bg-white border border-[#E5E7EB] rounded-lg text-xs text-[#1F2937]"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 pt-1">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setShowStatusChanger(false)}
                    >
                      Dismiss
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={handleApplyStatusChange}
                      disabled={selectedNextStatus === order.status}
                    >
                      Apply Override
                    </Button>
                  </div>
                </div>
              )}

              {/* SECTION 11: VISUAL ORDER TIMELINE */}
              <AdminOrderTimeline order={order} />

              {/* SECTION 12: STATUS HISTORY AUDIT TRAIL */}
              <div className="border border-[#E5E7EB] rounded-2xl overflow-hidden bg-white">
                <div className="px-4 py-3 bg-[#F8FAFC] border-b border-[#E5E7EB] flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-[#1F2937]">
                    <FileText className="w-4 h-4 text-[#218838]" />
                    <span>Complete Status History ({order.statusHistory?.length || 0} events)</span>
                  </div>
                  <Clock className="w-3.5 h-3.5 text-[#6B7280]" />
                </div>

                {order.statusHistory && order.statusHistory.length > 0 ? (
                  <div className="p-4 divide-y divide-[#E5E7EB] text-xs">
                    {order.statusHistory
                      .slice()
                      .reverse()
                      .map((ev) => {
                        const toLabel = ORDER_STATUS_META[ev.toStatus]?.label || ev.toStatus;
                        const fromLabel = ORDER_STATUS_META[ev.fromStatus]?.label || ev.fromStatus;
                        return (
                          <div key={ev.id} className="py-2.5 first:pt-0 last:pb-0 space-y-1">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <div className="flex flex-wrap items-center gap-1.5 font-bold text-[#1F2937]">
                                {ev.fromStatus !== ev.toStatus ? (
                                  <span>
                                    <span className="text-[#6B7280] font-medium">{fromLabel}</span>{' '}
                                    → <span>{toLabel}</span>
                                  </span>
                                ) : (
                                  <span>{toLabel}</span>
                                )}
                                <Badge variant="neutral" size="sm">
                                  {ev.actorRole}
                                </Badge>
                              </div>
                              <span className="text-[11px] font-mono text-[#6B7280]">
                                {formatDateTime(ev.timestamp)}
                              </span>
                            </div>
                            {ev.reason && (
                              <p className="text-[11px] text-[#475569]">{ev.reason}</p>
                            )}
                          </div>
                        );
                      })}
                  </div>
                ) : (
                  <p className="p-4 text-xs text-[#6B7280]">No status history events recorded.</p>
                )}
              </div>
            </div>
          )}
        </div>
      </Drawer>

      {/* CONFIRMATION & ACTION MODALS */}
      {onProcessRefund && (
        <ProcessRefundModal
          order={order}
          isOpen={isRefundModalOpen}
          onClose={() => setIsRefundModalOpen(false)}
          adminName={adminName}
          onConfirmRefund={onProcessRefund}
        />
      )}

      {onCancelOrder && (
        <AdminCancelOrderModal
          order={order}
          isOpen={isCancelModalOpen}
          onClose={() => setIsCancelModalOpen(false)}
          onConfirmCancel={onCancelOrder}
        />
      )}

      {onRecordReturn && (
        <RecordReturnModal
          order={order}
          isOpen={isReturnModalOpen}
          onClose={() => setIsReturnModalOpen(false)}
          onConfirmReturn={onRecordReturn}
        />
      )}
    </>
  );
};
