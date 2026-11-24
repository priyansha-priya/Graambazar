/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  CreditCard,
  FileText,
  MapPin,
  Package,
  Phone,
  RefreshCcw,
  Store,
  User,
  Wallet,
  XCircle,
} from 'lucide-react';
import {
  PaymentTransactionRecord,
  RefundLedgerRecord,
  SellerPayoutRecord,
} from '../../../../types/admin';
import { Order } from '../../../../types/order';
import { Drawer } from '../../../../components/ui/Drawer';
import { Modal } from '../../../../components/ui/Modal';
import { Badge } from '../../../../components/ui/Badge';
import { Button } from '../../../../components/ui/Button';
import { formatINR } from '../../../../utils/currency';
import { formatDateTime } from '../../../../utils/dates';
import {
  PAYOUT_STATUS_META,
  PAYMENT_METHOD_META,
  REFUND_CHANNEL_LABELS,
  REFUND_STATUS_META,
  TXN_STATUS_META,
} from './financeHelpers';

/* ============================================================================
 * 1. CUSTOMER PAYMENT TRANSACTION DETAIL DRAWER
 * ========================================================================== */

export interface TransactionDetailDrawerProps {
  transaction: PaymentTransactionRecord | null;
  relatedOrder?: Order;
  relatedRefund?: RefundLedgerRecord;
  isOpen: boolean;
  onClose: () => void;
  onViewRelatedOrder?: (orderId: string) => void;
}

export const TransactionDetailDrawer: React.FC<TransactionDetailDrawerProps> = ({
  transaction,
  relatedOrder,
  relatedRefund,
  isOpen,
  onClose,
  onViewRelatedOrder,
}) => {
  if (!transaction) return null;

  const statusMeta = TXN_STATUS_META[transaction.status];
  const methodMeta = PAYMENT_METHOD_META[transaction.method];

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title={`Transaction ${transaction.id}`}
      subtitle={`Order ${transaction.orderId} • ${formatDateTime(transaction.createdAt)}`}
      width="max-w-xl"
      footer={
        <div className="w-full flex items-center justify-between gap-2">
          {onViewRelatedOrder ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onViewRelatedOrder(transaction.orderId)}
              leftIcon={<Package className="w-3.5 h-3.5" />}
            >
              View Related Order
            </Button>
          ) : (
            <span />
          )}
          <Button variant="secondary" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      }
    >
      <div className="space-y-5 text-left text-xs">
        {/* Top Amount & Status Banner */}
        <div className="p-4 bg-[#F8FAFC] border border-[#E5E7EB] rounded-2xl space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-[11px] text-[#6B7280]">Transaction Amount</p>
              <p className="text-2xl font-black text-[#1F2937]">
                {formatINR(transaction.amountPaise)}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              <Badge variant={statusMeta.variant} size="md" dot>
                {statusMeta.label}
              </Badge>
              <Badge variant={methodMeta.variant} size="md">
                {methodMeta.label}
              </Badge>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-3 border-t border-[#E5E7EB]">
            <div>
              <p className="text-[11px] text-[#6B7280]">Transaction ID</p>
              <p className="font-mono font-bold text-[#1F2937]">{transaction.id}</p>
            </div>
            <div>
              <p className="text-[11px] text-[#6B7280]">Order ID</p>
              <p className="font-mono font-bold text-[#218838]">{transaction.orderId}</p>
            </div>
            <div>
              <p className="text-[11px] text-[#6B7280]">Gateway Ref / UTR</p>
              <p className="font-mono font-semibold text-[#1F2937]">{transaction.gatewayRef}</p>
            </div>
            <div>
              <p className="text-[11px] text-[#6B7280]">Date &amp; Time</p>
              <p className="font-semibold text-[#1F2937]">{formatDateTime(transaction.createdAt)}</p>
            </div>
          </div>
        </div>

        {/* Failure Reason Banner (if failed) */}
        {transaction.status === 'FAILED' && (
          <div className="p-4 bg-[#FEF2F2] border border-[#FECACA] rounded-2xl flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-[#DC2626] shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-[#991B1B]">Payment Failure Reason</p>
              <p className="text-[#B91C1C] mt-1 leading-relaxed">
                {transaction.failureReason ||
                  'Payment authorization failed at gateway or collection stage.'}
              </p>
            </div>
          </div>
        )}

        {/* Customer & Seller Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div className="p-4 bg-white border border-[#E5E7EB] rounded-2xl space-y-2">
            <div className="flex items-center gap-1.5 font-bold text-[#1F2937] pb-2 border-b border-[#E5E7EB]">
              <User className="w-4 h-4 text-[#218838]" />
              <span>Customer Details</span>
            </div>
            <p className="font-bold text-[#1F2937]">{transaction.customerName}</p>
            {transaction.customerPhone && (
              <p className="text-[#6B7280] flex items-center gap-1">
                <Phone className="w-3 h-3" /> {transaction.customerPhone}
              </p>
            )}
            <p className="text-[#6B7280] flex items-center gap-1">
              <MapPin className="w-3 h-3" /> {transaction.villageName}
            </p>
          </div>

          <div className="p-4 bg-white border border-[#E5E7EB] rounded-2xl space-y-2">
            <div className="flex items-center gap-1.5 font-bold text-[#1F2937] pb-2 border-b border-[#E5E7EB]">
              <Store className="w-4 h-4 text-[#218838]" />
              <span>Seller Details</span>
            </div>
            <p className="font-bold text-[#1F2937]">{transaction.sellerName}</p>
            {transaction.sellerId && (
              <p className="font-mono text-[11px] text-[#6B7280]">ID: {transaction.sellerId}</p>
            )}
            <p className="text-[#6B7280]">
              Vertical: <strong className="text-[#1F2937]">{transaction.vertical || 'GROCERY'}</strong>
            </p>
          </div>
        </div>

        {/* Linked Refund Info (if applicable) */}
        {(relatedRefund || transaction.refundId) && (
          <div className="p-4 bg-[#FEF3C7]/50 border border-[#FCD34D] rounded-2xl space-y-2">
            <div className="flex items-center justify-between gap-2">
              <span className="font-bold text-[#92400E] flex items-center gap-1.5">
                <RefreshCcw className="w-4 h-4" /> Linked Refund Details
              </span>
              {relatedRefund && (
                <Badge variant={REFUND_STATUS_META[relatedRefund.status].variant} size="sm">
                  {REFUND_STATUS_META[relatedRefund.status].label}
                </Badge>
              )}
            </div>
            <div className="grid grid-cols-2 gap-2 pt-1">
              <div>
                <p className="text-[11px] text-[#92400E]/80">Refund ID</p>
                <p className="font-mono font-bold text-[#1F2937]">
                  {relatedRefund?.id || transaction.refundId}
                </p>
              </div>
              <div>
                <p className="text-[11px] text-[#92400E]/80">Refund Amount</p>
                <p className="font-black text-[#DC2626]">
                  {formatINR(relatedRefund?.amountPaise || transaction.refundAmountPaise || 0)}
                </p>
              </div>
            </div>
            {relatedRefund?.reason && (
              <p className="text-[11px] text-[#475569] pt-1">{relatedRefund.reason}</p>
            )}
          </div>
        )}

        {/* Linked Live Order Context (if found in OrderContext) */}
        {relatedOrder && (
          <div className="p-4 bg-[#E8F5E9]/40 border border-[#A7F3D0] rounded-2xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-[#176B2C] flex items-center gap-1.5">
                <Package className="w-4 h-4" /> Synced Order Record
              </span>
              <Badge variant="primary" size="sm">
                {relatedOrder.status.replace(/_/g, ' ')}
              </Badge>
            </div>
            <p className="text-[#1F2937]">
              Order <strong>{relatedOrder.orderNumber}</strong> • {relatedOrder.items.length} item(s) •{' '}
              {relatedOrder.fulfilmentMode === 'DELIVERY' ? 'Doorstep Delivery' : 'Self-Pickup'}
            </p>
          </div>
        )}
      </div>
    </Drawer>
  );
};

/* ============================================================================
 * 2. SELLER SETTLEMENT DETAIL DRAWER
 * ========================================================================== */

export interface SettlementDetailDrawerProps {
  payout: SellerPayoutRecord | null;
  isOpen: boolean;
  onClose: () => void;
  canManage: boolean;
  canApprove: boolean;
  onRequestProcessing: (payout: SellerPayoutRecord) => void;
  onRequestSettle: (payout: SellerPayoutRecord) => void;
}

export const SettlementDetailDrawer: React.FC<SettlementDetailDrawerProps> = ({
  payout,
  isOpen,
  onClose,
  canManage,
  canApprove,
  onRequestProcessing,
  onRequestSettle,
}) => {
  if (!payout) return null;

  const statusMeta = PAYOUT_STATUS_META[payout.status];
  const otherDed = payout.otherDeductionsPaise || 0;

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title={`Settlement ${payout.id}`}
      subtitle={`${payout.sellerName} • ${payout.periodLabel}`}
      width="max-w-2xl"
      footer={
        <div className="w-full flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            {canManage && payout.status === 'PENDING' && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => onRequestProcessing(payout)}
              >
                Mark as Processing
              </Button>
            )}
            {canManage && canApprove && payout.status !== 'SETTLED' && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => onRequestSettle(payout)}
                leftIcon={<CheckCircle2 className="w-3.5 h-3.5" />}
              >
                Mark Settled &amp; Record UTR
              </Button>
            )}
          </div>
          <Button variant="secondary" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      }
    >
      <div className="space-y-5 text-left text-xs">
        {/* Top Seller & Status Header */}
        <div className="p-4 bg-[#F8FAFC] border border-[#E5E7EB] rounded-2xl space-y-3">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <p className="font-black text-base text-[#1F2937]">{payout.sellerName}</p>
              <p className="text-[#6B7280] mt-0.5">
                Seller ID: <span className="font-mono font-semibold">{payout.sellerId}</span> •{' '}
                {payout.villageName} • {payout.vertical || 'GROCERY'}
              </p>
            </div>
            <Badge variant={statusMeta.variant} size="md" dot>
              {statusMeta.label}
            </Badge>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-[#E5E7EB]">
            <div>
              <p className="text-[11px] text-[#6B7280]">Settlement ID</p>
              <p className="font-mono font-bold text-[#1F2937]">{payout.id}</p>
            </div>
            <div>
              <p className="text-[11px] text-[#6B7280]">Cycle Period</p>
              <p className="font-semibold text-[#1F2937]">{payout.periodLabel}</p>
            </div>
            <div>
              <p className="text-[11px] text-[#6B7280]">Transfer Mode</p>
              <p className="font-semibold text-[#1F2937]">
                {payout.paymentMode.replace(/_/g, ' / ')}
              </p>
            </div>
            <div>
              <p className="text-[11px] text-[#6B7280]">UTR / Reference</p>
              <p className="font-mono font-bold text-[#218838]">
                {payout.utrNumber || 'Not Recorded'}
              </p>
            </div>
          </div>
        </div>

        {/* Financial Waterfall */}
        <div className="bg-white border border-[#E5E7EB] rounded-2xl p-4 space-y-2.5">
          <div className="flex items-center gap-2 pb-2 border-b border-[#E5E7EB] font-bold text-[#1F2937]">
            <Wallet className="w-4 h-4 text-[#218838]" />
            <span>Settlement Financial Breakdown ({payout.ordersCount} Orders)</span>
          </div>
          <div className="flex justify-between text-[#475569]">
            <span>Gross Marketplace Sales (Seller Orders)</span>
            <span className="font-bold text-[#1F2937]">{formatINR(payout.grossAmountPaise)}</span>
          </div>
          <div className="flex justify-between text-[#475569]">
            <span>Platform Commission Deducted</span>
            <span className="font-bold text-[#DC2626]">-{formatINR(payout.commissionPaise)}</span>
          </div>
          <div className="flex justify-between text-[#475569]">
            <span>Refunds / Order Adjustments</span>
            <span className="font-bold text-[#DC2626]">
              {payout.refundDeductionsPaise > 0
                ? `-${formatINR(payout.refundDeductionsPaise)}`
                : '₹0.00'}
            </span>
          </div>
          <div className="flex justify-between text-[#475569]">
            <span>Other Deductions (TDS / Handling)</span>
            <span className="font-bold text-[#DC2626]">
              {otherDed > 0 ? `-${formatINR(otherDed)}` : '₹0.00'}
            </span>
          </div>
          <div className="pt-3 border-t border-[#E5E7EB] flex items-center justify-between">
            <div>
              <p className="text-sm font-black text-[#1F2937]">Net Payable to Seller</p>
              {payout.settledAt && (
                <p className="text-[11px] text-[#6B7280]">
                  Settled on {formatDateTime(payout.settledAt)}
                </p>
              )}
            </div>
            <span className="text-xl font-black text-[#218838]">
              {formatINR(payout.netPayablePaise)}
            </span>
          </div>
        </div>

        {/* Included Orders */}
        <div className="bg-white border border-[#E5E7EB] rounded-2xl p-4 space-y-2.5">
          <div className="flex items-center justify-between pb-2 border-b border-[#E5E7EB]">
            <span className="font-bold text-[#1F2937] flex items-center gap-1.5">
              <Package className="w-4 h-4 text-[#218838]" /> Orders Included in Settlement
            </span>
            <Badge variant="neutral" size="sm">
              {payout.ordersCount} Total Orders
            </Badge>
          </div>
          {payout.includedOrderIds && payout.includedOrderIds.length > 0 ? (
            <div className="space-y-2">
              <div className="flex flex-wrap gap-1.5">
                {payout.includedOrderIds.map((oid) => (
                  <span
                    key={oid}
                    className="font-mono text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-[#F8FAFC] border border-[#E5E7EB] text-[#1F2937]"
                  >
                    {oid}
                  </span>
                ))}
                {payout.ordersCount > payout.includedOrderIds.length && (
                  <span className="text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-[#F1F5F9] text-[#6B7280]">
                    +{payout.ordersCount - payout.includedOrderIds.length} more orders in cycle
                  </span>
                )}
              </div>
            </div>
          ) : (
            <p className="text-[#6B7280]">
              Covers {payout.ordersCount} completed orders in cycle {payout.periodLabel}.
            </p>
          )}
          {payout.notes && (
            <p className="p-2.5 rounded-xl bg-[#F8FAFC] border border-[#E5E7EB] text-[#475569]">
              <strong>Notes:</strong> {payout.notes}
            </p>
          )}
        </div>

        {/* Settlement History */}
        <div className="bg-white border border-[#E5E7EB] rounded-2xl overflow-hidden">
          <div className="px-4 py-3 bg-[#F8FAFC] border-b border-[#E5E7EB] flex items-center justify-between font-bold text-[#1F2937]">
            <span className="flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-[#218838]" /> Settlement History
            </span>
            <span className="text-[11px] text-[#6B7280]">
              {(payout.history || []).length} event(s)
            </span>
          </div>
          <div className="p-4 divide-y divide-[#E5E7EB]">
            {payout.history && payout.history.length > 0 ? (
              payout.history
                .slice()
                .reverse()
                .map((h, i) => (
                  <div key={`${h.timestamp}-${i}`} className="py-2.5 first:pt-0 last:pb-0 space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <Badge variant="neutral" size="sm">
                          {h.status}
                        </Badge>
                        <span className="font-semibold text-[#1F2937]">{h.actor}</span>
                      </div>
                      <span className="font-mono text-[11px] text-[#6B7280]">
                        {formatDateTime(h.timestamp)}
                      </span>
                    </div>
                    <p className="text-[#475569]">{h.note}</p>
                  </div>
                ))
            ) : (
              <p className="text-[#6B7280]">No settlement history events recorded yet.</p>
            )}
          </div>
        </div>
      </div>
    </Drawer>
  );
};

/* ============================================================================
 * 3. REFUND DETAIL DRAWER
 * ========================================================================== */

export interface RefundDetailDrawerProps {
  refund: RefundLedgerRecord | null;
  relatedOrder?: Order;
  relatedTransaction?: PaymentTransactionRecord;
  isOpen: boolean;
  onClose: () => void;
  canApprove: boolean;
  onApprove: (refund: RefundLedgerRecord) => void;
  onReject: (refund: RefundLedgerRecord) => void;
}

export const RefundDetailDrawer: React.FC<RefundDetailDrawerProps> = ({
  refund,
  relatedOrder,
  relatedTransaction,
  isOpen,
  onClose,
  canApprove,
  onApprove,
  onReject,
}) => {
  if (!refund) return null;

  const statusMeta = REFUND_STATUS_META[refund.status];
  const isActionable = refund.status === 'INITIATED' || refund.status === 'PROCESSING';

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title={`Refund ${refund.id}`}
      subtitle={`Order ${refund.orderId} • Requested ${formatDateTime(refund.requestedAt)}`}
      width="max-w-xl"
      footer={
        <div className="w-full flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            {canApprove && isActionable && (
              <>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => onApprove(refund)}
                  leftIcon={<CheckCircle2 className="w-3.5 h-3.5" />}
                >
                  Approve Refund
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => onReject(refund)}
                  leftIcon={<XCircle className="w-3.5 h-3.5" />}
                >
                  Reject
                </Button>
              </>
            )}
          </div>
          <Button variant="secondary" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      }
    >
      <div className="space-y-5 text-left text-xs">
        {/* Top Refund Banner */}
        <div className="p-4 bg-[#F8FAFC] border border-[#E5E7EB] rounded-2xl space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-[11px] text-[#6B7280]">Refund Amount</p>
              <p className="text-2xl font-black text-[#DC2626]">
                {formatINR(refund.amountPaise)}
              </p>
              {refund.originalAmountPaise && (
                <p className="text-[11px] text-[#6B7280] mt-0.5">
                  Original Payment: <strong className="text-[#1F2937]">{formatINR(refund.originalAmountPaise)}</strong>{' '}
                  ({refund.amountPaise >= refund.originalAmountPaise ? 'Full Refund' : 'Partial Refund'})
                </p>
              )}
            </div>
            <Badge variant={statusMeta.variant} size="md" dot>
              {statusMeta.label}
            </Badge>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-3 border-t border-[#E5E7EB]">
            <div>
              <p className="text-[11px] text-[#6B7280]">Order ID</p>
              <p className="font-mono font-bold text-[#1F2937]">{refund.orderId}</p>
            </div>
            <div>
              <p className="text-[11px] text-[#6B7280]">Refund Method</p>
              <p className="font-semibold text-[#1F2937]">
                {REFUND_CHANNEL_LABELS[refund.refundChannel]}
              </p>
            </div>
            <div>
              <p className="text-[11px] text-[#6B7280]">Original Transaction</p>
              <p className="font-mono font-semibold text-[#1F2937]">
                {refund.originalTransactionId || relatedTransaction?.id || 'Linked via Order'}
              </p>
            </div>
            <div>
              <p className="text-[11px] text-[#6B7280]">Original Payment Method</p>
              <p className="font-semibold text-[#1F2937]">
                {refund.originalPaymentMethod || relatedTransaction?.method || 'UPI'}
              </p>
            </div>
          </div>
        </div>

        {/* Reason & Rejection Reason */}
        <div className="p-4 bg-white border border-[#E5E7EB] rounded-2xl space-y-2.5">
          <div className="flex items-center gap-1.5 font-bold text-[#1F2937]">
            <FileText className="w-4 h-4 text-[#218838]" />
            <span>Refund Reason</span>
          </div>
          <p className="text-[#1F2937] leading-relaxed">{refund.reason}</p>
          {refund.supportCaseId && (
            <p className="text-[11px] text-[#6B7280]">
              Support Case Reference: <span className="font-mono font-semibold">{refund.supportCaseId}</span>
            </p>
          )}
          {refund.status === 'REJECTED' && refund.rejectionReason && (
            <div className="p-3 bg-[#FEF2F2] border border-[#FECACA] rounded-xl text-[#991B1B]">
              <p className="font-bold">Rejection Justification</p>
              <p className="mt-0.5">{refund.rejectionReason}</p>
            </div>
          )}
        </div>

        {/* Customer & Seller */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div className="p-4 bg-white border border-[#E5E7EB] rounded-2xl space-y-1.5">
            <p className="font-bold text-[#1F2937] flex items-center gap-1.5">
              <User className="w-4 h-4 text-[#218838]" /> Customer
            </p>
            <p className="font-semibold text-[#1F2937]">{refund.customerName}</p>
            {refund.customerPhone && <p className="text-[#6B7280]">{refund.customerPhone}</p>}
            {refund.villageName && <p className="text-[#6B7280]">{refund.villageName}</p>}
          </div>

          <div className="p-4 bg-white border border-[#E5E7EB] rounded-2xl space-y-1.5">
            <p className="font-bold text-[#1F2937] flex items-center gap-1.5">
              <Store className="w-4 h-4 text-[#218838]" /> Seller
            </p>
            <p className="font-semibold text-[#1F2937]">{refund.sellerName}</p>
            <p className="text-[#6B7280]">Requested: {formatDateTime(refund.requestedAt)}</p>
            {refund.processedAt && (
              <p className="text-[#6B7280]">Closed: {formatDateTime(refund.processedAt)}</p>
            )}
          </div>
        </div>

        {/* Linked Order Sync Info */}
        {relatedOrder && (
          <div className="p-3.5 bg-[#E8F5E9]/40 border border-[#A7F3D0] rounded-2xl flex items-center justify-between gap-2">
            <div>
              <p className="font-bold text-[#176B2C]">Connected to Order Management</p>
              <p className="text-[11px] text-[#1F2937] mt-0.5">
                Order {relatedOrder.orderNumber} • Order Status:{' '}
                <strong className="capitalize">{relatedOrder.status.replace(/_/g, ' ')}</strong>
              </p>
            </div>
            <Badge variant="primary" size="sm">
              Synced
            </Badge>
          </div>
        )}

        {/* Refund History */}
        <div className="bg-white border border-[#E5E7EB] rounded-2xl overflow-hidden">
          <div className="px-4 py-3 bg-[#F8FAFC] border-b border-[#E5E7EB] font-bold text-[#1F2937] flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-[#218838]" /> Refund Audit History
          </div>
          <div className="p-4 divide-y divide-[#E5E7EB]">
            {refund.history && refund.history.length > 0 ? (
              refund.history
                .slice()
                .reverse()
                .map((h, i) => (
                  <div key={`${h.timestamp}-${i}`} className="py-2.5 first:pt-0 last:pb-0 space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <Badge variant="neutral" size="sm">
                          {h.status}
                        </Badge>
                        <span className="font-semibold text-[#1F2937]">{h.actor}</span>
                      </div>
                      <span className="font-mono text-[11px] text-[#6B7280]">
                        {formatDateTime(h.timestamp)}
                      </span>
                    </div>
                    <p className="text-[#475569]">{h.note}</p>
                  </div>
                ))
            ) : (
              <p className="text-[#6B7280]">Requested at {formatDateTime(refund.requestedAt)}.</p>
            )}
          </div>
        </div>
      </div>
    </Drawer>
  );
};

/* ============================================================================
 * 4. RELATED ORDER QUICK SNAPSHOT MODAL (Read-Only for Failed Payments / Txns)
 * ========================================================================== */

export interface RelatedOrderSnapshotModalProps {
  orderId: string | null;
  order?: Order;
  transaction?: PaymentTransactionRecord;
  isOpen: boolean;
  onClose: () => void;
}

export const RelatedOrderSnapshotModal: React.FC<RelatedOrderSnapshotModalProps> = ({
  orderId,
  order,
  transaction,
  isOpen,
  onClose,
}) => {
  if (!orderId) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Related Order: ${orderId}`}
      description="Read-only order context linked to this payment transaction"
      size="md"
      footer={
        <Button variant="secondary" size="sm" onClick={onClose}>
          Close
        </Button>
      }
    >
      <div className="space-y-4 text-left text-xs">
        {order ? (
          <>
            <div className="p-3.5 bg-[#F8FAFC] border border-[#E5E7EB] rounded-xl grid grid-cols-2 gap-3">
              <div>
                <p className="text-[11px] text-[#6B7280]">Order Number</p>
                <p className="font-mono font-bold text-[#1F2937]">{order.orderNumber}</p>
              </div>
              <div>
                <p className="text-[11px] text-[#6B7280]">Order Status</p>
                <Badge variant="info" size="sm">
                  {order.status.replace(/_/g, ' ')}
                </Badge>
              </div>
              <div>
                <p className="text-[11px] text-[#6B7280]">Customer</p>
                <p className="font-bold text-[#1F2937]">{order.customerName}</p>
                <p className="text-[11px] text-[#6B7280]">{order.customerPhone}</p>
              </div>
              <div>
                <p className="text-[11px] text-[#6B7280]">Seller</p>
                <p className="font-bold text-[#1F2937]">{order.sellerName}</p>
                <p className="text-[11px] text-[#6B7280]">{order.sellerPhone}</p>
              </div>
            </div>

            <div className="border border-[#E5E7EB] rounded-xl overflow-hidden">
              <div className="px-3.5 py-2 bg-[#F8FAFC] border-b border-[#E5E7EB] font-bold text-[#6B7280] uppercase text-[11px]">
                Ordered Items ({order.items.length})
              </div>
              <div className="divide-y divide-[#E5E7EB]">
                {order.items.map((item) => (
                  <div key={item.id} className="p-3 flex items-center justify-between gap-2">
                    <div>
                      <p className="font-bold text-[#1F2937]">{item.productName}</p>
                      <p className="text-[11px] text-[#6B7280]">
                        {item.requestedQuantity} × {item.requestedUnitLabel}
                      </p>
                    </div>
                    <span className="font-bold text-[#1F2937]">
                      {formatINR(item.lineTotalPaise)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-3.5 bg-[#E8F5E9]/40 border border-[#A7F3D0] rounded-xl flex items-center justify-between">
              <span className="font-bold text-[#176B2C]">Order Total</span>
              <span className="text-base font-black text-[#218838]">
                {formatINR(order.totalPaise)}
              </span>
            </div>
          </>
        ) : (
          <div className="space-y-3">
            <div className="p-3.5 bg-[#F8FAFC] border border-[#E5E7EB] rounded-xl flex items-start gap-2.5">
              <CreditCard className="w-4 h-4 text-[#218838] shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-[#1F2937]">Archived / External Order Reference</p>
                <p className="text-[#6B7280] mt-0.5">
                  Order <strong>{orderId}</strong> is part of the historical finance ledger and not present in the active live order session list.
                </p>
              </div>
            </div>
            {transaction && (
              <div className="p-3.5 bg-white border border-[#E5E7EB] rounded-xl space-y-2">
                <div className="flex justify-between">
                  <span className="text-[#6B7280]">Customer</span>
                  <span className="font-bold text-[#1F2937]">{transaction.customerName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#6B7280]">Seller</span>
                  <span className="font-bold text-[#1F2937]">{transaction.sellerName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#6B7280]">Village</span>
                  <span className="font-semibold text-[#1F2937]">{transaction.villageName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#6B7280]">Order Amount</span>
                  <span className="font-black text-[#1F2937]">
                    {formatINR(transaction.amountPaise)}
                  </span>
                </div>
                {transaction.failureReason && (
                  <div className="pt-2 border-t border-[#E5E7EB] text-[#DC2626]">
                    <strong>Failure Reason:</strong> {transaction.failureReason}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
};
