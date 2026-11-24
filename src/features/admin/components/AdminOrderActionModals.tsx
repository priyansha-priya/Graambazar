/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import {
  AlertTriangle,
  RefreshCw,
  RotateCcw,
  ShieldAlert,
  XCircle,
  CheckCircle2,
  Info,
} from 'lucide-react';
import {
  Order,
  CancelledByActor,
  ReturnStatus,
  OrderReturnItem,
  RefundMethod,
  RefundStatus,
} from '../../../types/order';
import {
  AdminCancelOrderPayload,
  RecordOrderReturnPayload,
  ProcessOrderRefundPayload,
} from '../../../contexts/OrderContext';
import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { Badge } from '../../../components/ui/Badge';
import { formatINR } from '../../../utils/currency';
import {
  getDefaultRefundMethod,
  REFUND_METHOD_LABELS,
  PAYMENT_METHOD_LABELS,
} from './orderManagementHelpers';

/* ============================================================================
 * 1. PROCESS / UPDATE REFUND MODAL (WITH CONFIRMATION STEP)
 * ========================================================================== */

export interface ProcessRefundModalProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
  adminName: string;
  onConfirmRefund: (orderId: string, payload: ProcessOrderRefundPayload) => void;
}

export const ProcessRefundModal: React.FC<ProcessRefundModalProps> = ({
  order,
  isOpen,
  onClose,
  adminName,
  onConfirmRefund,
}) => {
  const [amountRupees, setAmountRupees] = useState('');
  const [method, setMethod] = useState<RefundMethod>('ORIGINAL_UPI');
  const [status, setStatus] = useState<RefundStatus>('COMPLETED');
  const [reason, setReason] = useState('');
  const [referenceId, setReferenceId] = useState('');
  const [failureReason, setFailureReason] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [confirmStep, setConfirmStep] = useState(false);

  useEffect(() => {
    if (order && isOpen) {
      const returnedSum =
        order.returnInfo?.returnedItems.reduce((sum, ri) => sum + ri.refundValuePaise, 0) || 0;
      const defaultAmountPaise =
        order.refundInfo?.amountPaise ||
        (returnedSum > 0 && returnedSum <= order.totalPaise ? returnedSum : order.totalPaise);

      setAmountRupees((defaultAmountPaise / 100).toFixed(2));
      setMethod(order.refundInfo?.method || getDefaultRefundMethod(order.paymentMethod));
      setStatus(order.refundInfo?.status === 'PENDING' ? 'COMPLETED' : order.refundInfo?.status || 'COMPLETED');
      setReason(
        order.refundInfo?.reason ||
          order.returnInfo?.reason ||
          order.cancellation?.reason ||
          ''
      );
      setReferenceId(order.refundInfo?.referenceId || '');
      setFailureReason(order.refundInfo?.failureReason || '');
      setErrorMsg('');
      setConfirmStep(false);
    }
  }, [order, isOpen]);

  if (!order) return null;

  const maxRefundPaise = order.totalPaise;
  const parsedAmountPaise = Math.round((parseFloat(amountRupees) || 0) * 100);

  const validateAndAdvance = () => {
    if (isNaN(parsedAmountPaise) || parsedAmountPaise <= 0) {
      setErrorMsg('Please enter a valid refund amount greater than ₹0.00.');
      return;
    }
    if (parsedAmountPaise > maxRefundPaise) {
      setErrorMsg(
        `Refund amount cannot exceed total order value (${formatINR(maxRefundPaise)}).`
      );
      return;
    }
    if (!reason.trim()) {
      setErrorMsg('Please provide a clear refund reason for audit compliance.');
      return;
    }
    if (status === 'FAILED' && !failureReason.trim()) {
      setErrorMsg('Please specify the failure reason when marking a refund as Failed.');
      return;
    }
    setErrorMsg('');
    setConfirmStep(true);
  };

  const handleFinalSubmit = () => {
    onConfirmRefund(order.id, {
      amountPaise: parsedAmountPaise,
      method,
      status,
      reason: reason.trim(),
      referenceId: referenceId.trim() || undefined,
      initiatedBy: adminName,
      failureReason: status === 'FAILED' ? failureReason.trim() : undefined,
    });
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={order.refundInfo ? 'Update Order Refund' : 'Process Order Refund'}
      description={`Order ${order.orderNumber} • ${order.customerName} (${formatINR(order.totalPaise)})`}
      size="md"
      footer={
        confirmStep ? (
          <>
            <Button variant="secondary" size="sm" onClick={() => setConfirmStep(false)}>
              Back to Edit
            </Button>
            <Button
              variant={status === 'FAILED' ? 'destructive' : 'primary'}
              size="sm"
              onClick={handleFinalSubmit}
              leftIcon={<CheckCircle2 className="w-4 h-4" />}
            >
              Confirm & Apply Refund
            </Button>
          </>
        ) : (
          <>
            <Button variant="secondary" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={validateAndAdvance}
              leftIcon={<RefreshCw className="w-4 h-4" />}
            >
              Review & Confirm Refund
            </Button>
          </>
        )
      }
    >
      <div className="space-y-4 text-left">
        {/* Simulation transparency banner */}
        <div className="p-3 bg-[#EFF6FF] border border-[#BFDBFE] rounded-xl flex items-start gap-2.5 text-xs text-[#1E40AF]">
          <Info className="w-4 h-4 shrink-0 mt-0.5 text-[#2563EB]" />
          <p>
            <strong>Simulated Admin Action:</strong> Updates refund status, order status, and audit trail in local frontend state. Live UPI/Bank gateway settlement requires backend payment integration.
          </p>
        </div>

        {errorMsg && (
          <div className="p-3 bg-[#FEE2E2] border border-[#FCA5A5] rounded-xl text-xs font-semibold text-[#991B1B]">
            {errorMsg}
          </div>
        )}

        {!confirmStep ? (
          <>
            {/* Original Payment Context */}
            <div className="p-3.5 bg-[#F8FAFC] border border-[#E5E7EB] rounded-xl grid grid-cols-2 gap-3 text-xs">
              <div>
                <p className="text-[11px] text-[#6B7280]">Original Payment</p>
                <p className="font-bold text-[#1F2937]">
                  {PAYMENT_METHOD_LABELS[order.paymentMethod]}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[11px] text-[#6B7280]">Maximum Refundable</p>
                <p className="font-black text-[#218838]">{formatINR(maxRefundPaise)}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <Input
                label="Refund Amount (₹)"
                type="number"
                step="0.01"
                min="0.01"
                max={(maxRefundPaise / 100).toFixed(2)}
                required
                value={amountRupees}
                onChange={(e) => setAmountRupees(e.target.value)}
                helperText={`Order total: ${formatINR(maxRefundPaise)}`}
              />
              <Select
                label="Refund Status"
                required
                value={status}
                onChange={(e) => setStatus(e.target.value as RefundStatus)}
                options={[
                  { value: 'PENDING', label: 'Pending (Queued)' },
                  { value: 'PROCESSING', label: 'Processing (In Transit)' },
                  { value: 'COMPLETED', label: 'Completed (Settled)' },
                  { value: 'FAILED', label: 'Failed (Requires Retry)' },
                ]}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <Select
                label="Refund Method"
                required
                value={method}
                onChange={(e) => setMethod(e.target.value as RefundMethod)}
                options={(Object.keys(REFUND_METHOD_LABELS) as RefundMethod[]).map((m) => ({
                  value: m,
                  label: REFUND_METHOD_LABELS[m],
                }))}
              />
              <Input
                label="UTR / Reference ID (Optional)"
                placeholder="e.g., UTR2026112300192"
                value={referenceId}
                onChange={(e) => setReferenceId(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#1F2937] mb-1.5">
                Refund Reason *
              </label>
              <textarea
                rows={2}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Explain why this refund is being issued..."
                className="w-full p-3 text-xs bg-[#F8FAFC] border border-[#E5E7EB] rounded-xl outline-none focus:border-[#218838] focus:bg-white"
              />
            </div>

            {status === 'FAILED' && (
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#DC2626] mb-1.5">
                  Failure Reason *
                </label>
                <input
                  type="text"
                  value={failureReason}
                  onChange={(e) => setFailureReason(e.target.value)}
                  placeholder="e.g., Customer UPI handle invalid or bank server timeout"
                  className="w-full h-10 px-3 text-xs bg-[#FEF2F2] border border-[#FCA5A5] rounded-xl outline-none focus:border-[#DC2626]"
                />
              </div>
            )}
          </>
        ) : (
          /* Confirmation Review Screen */
          <div className="space-y-4">
            <div className="p-4 bg-[#FEF3C7]/60 border border-[#FCD34D] rounded-xl flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-[#D97706] shrink-0 mt-0.5" />
              <div className="text-xs">
                <p className="font-bold text-[#92400E]">Confirm Refund Action</p>
                <p className="text-[#92400E]/90 mt-0.5">
                  {status === 'COMPLETED'
                    ? `Marking this refund as Completed will transition Order ${order.orderNumber} to Refunded and update its payment status.`
                    : `This will update the refund state for Order ${order.orderNumber} to ${status} and record an immutable admin audit entry.`}
                </p>
              </div>
            </div>

            <div className="bg-[#F8FAFC] border border-[#E5E7EB] rounded-xl p-4 space-y-2.5 text-xs">
              <div className="flex justify-between">
                <span className="text-[#6B7280]">Order Number</span>
                <span className="font-mono font-bold text-[#1F2937]">{order.orderNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6B7280]">Refund Amount</span>
                <span className="font-black text-sm text-[#218838]">
                  {formatINR(parsedAmountPaise)}{' '}
                  <span className="text-[11px] font-semibold text-[#6B7280]">
                    ({parsedAmountPaise >= maxRefundPaise ? 'Full' : 'Partial'})
                  </span>
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6B7280]">Target Refund Status</span>
                <Badge
                  variant={
                    status === 'COMPLETED'
                      ? 'success'
                      : status === 'FAILED'
                      ? 'error'
                      : status === 'PROCESSING'
                      ? 'info'
                      : 'warning'
                  }
                  size="sm"
                >
                  {status}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6B7280]">Refund Method</span>
                <span className="font-semibold text-[#1F2937]">{REFUND_METHOD_LABELS[method]}</span>
              </div>
              <div className="pt-2 border-t border-[#E5E7EB]">
                <span className="text-[#6B7280] block mb-0.5">Reason</span>
                <p className="text-[#1F2937] font-medium">{reason}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};

/* ============================================================================
 * 2. ADMIN CANCEL ORDER CONFIRMATION MODAL
 * ========================================================================== */

export interface AdminCancelOrderModalProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirmCancel: (orderId: string, payload: AdminCancelOrderPayload) => void;
}

const CANCEL_PRESETS = [
  'Customer requested cancellation via helpline',
  'Merchant unable to fulfill items / out of stock',
  'Delivery area temporarily unreachable',
  'Duplicate or fraudulent order detected',
];

export const AdminCancelOrderModal: React.FC<AdminCancelOrderModalProps> = ({
  order,
  isOpen,
  onClose,
  onConfirmCancel,
}) => {
  const [cancelledBy, setCancelledBy] = useState<CancelledByActor>('ADMIN');
  const [reason, setReason] = useState('');
  const [refundEligible, setRefundEligible] = useState(false);
  const [notes, setNotes] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (order && isOpen) {
      setCancelledBy('ADMIN');
      setReason('');
      setRefundEligible(
        order.paymentStatus === 'collected' || order.paymentStatus === 'settled'
      );
      setNotes('');
      setErrorMsg('');
    }
  }, [order, isOpen]);

  if (!order) return null;

  const handleSubmit = () => {
    if (!reason.trim()) {
      setErrorMsg('Cancellation reason is mandatory.');
      return;
    }
    onConfirmCancel(order.id, {
      cancelledBy,
      reason: reason.trim(),
      refundEligible,
      notes: notes.trim() || undefined,
    });
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Cancel Order Confirmation"
      description={`Order ${order.orderNumber} • ${order.sellerName}`}
      size="md"
      footer={
        <>
          <Button variant="secondary" size="sm" onClick={onClose}>
            Keep Order
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={handleSubmit}
            leftIcon={<XCircle className="w-4 h-4" />}
          >
            Confirm Cancellation
          </Button>
        </>
      }
    >
      <div className="space-y-4 text-left">
        <div className="p-3.5 bg-[#FEF2F2] border border-[#FECACA] rounded-xl flex items-start gap-2.5 text-xs text-[#991B1B]">
          <ShieldAlert className="w-4 h-4 text-[#DC2626] shrink-0 mt-0.5" />
          <div>
            <p className="font-bold">Irreversible Fulfillment Stop</p>
            <p className="mt-0.5 text-[#B91C1C]">
              Cancelling order <strong>{order.orderNumber}</strong> will mark it as Cancelled and log the actor and compliance reason in the immutable audit trail.
            </p>
          </div>
        </div>

        {errorMsg && (
          <div className="p-2.5 bg-[#FEE2E2] text-[#DC2626] rounded-xl text-xs font-semibold">
            {errorMsg}
          </div>
        )}

        <Select
          label="Cancelled By"
          required
          value={cancelledBy}
          onChange={(e) => setCancelledBy(e.target.value as CancelledByActor)}
          options={[
            { value: 'ADMIN', label: 'Admin (Operations Intervention)' },
            { value: 'CUSTOMER', label: 'Customer (Requested via Support)' },
            { value: 'SELLER', label: 'Seller (Store Rejection / Stock-Out)' },
          ]}
        />

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-[#1F2937] mb-1.5">
            Cancellation Reason *
          </label>
          <div className="flex flex-wrap gap-1.5 mb-2">
            {CANCEL_PRESETS.map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => {
                  setReason(preset);
                  setErrorMsg('');
                }}
                className="text-[11px] px-2.5 py-1 rounded-full bg-[#F8FAFC] border border-[#E5E7EB] text-[#475569] hover:border-[#218838] hover:text-[#218838] transition-colors cursor-pointer"
              >
                {preset}
              </button>
            ))}
          </div>
          <textarea
            rows={2}
            value={reason}
            onChange={(e) => {
              setReason(e.target.value);
              setErrorMsg('');
            }}
            placeholder="Enter detailed cancellation reason..."
            className="w-full p-3 text-xs bg-[#F8FAFC] border border-[#E5E7EB] rounded-xl outline-none focus:border-[#DC2626] focus:bg-white"
          />
        </div>

        <label className="flex items-start gap-2.5 p-3 rounded-xl bg-[#F8FAFC] border border-[#E5E7EB] cursor-pointer">
          <input
            type="checkbox"
            checked={refundEligible}
            onChange={(e) => setRefundEligible(e.target.checked)}
            className="mt-0.5 rounded accent-[#218838]"
          />
          <div className="text-xs">
            <span className="font-bold text-[#1F2937] block">Eligible for Customer Refund</span>
            <span className="text-[11px] text-[#6B7280]">
              Payment method: {PAYMENT_METHOD_LABELS[order.paymentMethod]} ({order.paymentStatus.toUpperCase()})
            </span>
          </div>
        </label>

        <Input
          label="Internal Notes (Optional)"
          placeholder="e.g., Informed shopkeeper by phone"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </div>
    </Modal>
  );
};

/* ============================================================================
 * 3. RECORD / UPDATE RETURN MODAL
 * ========================================================================== */

export interface RecordReturnModalProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirmReturn: (orderId: string, payload: RecordOrderReturnPayload) => void;
}

export const RecordReturnModal: React.FC<RecordReturnModalProps> = ({
  order,
  isOpen,
  onClose,
  onConfirmReturn,
}) => {
  const [returnStatus, setReturnStatus] = useState<ReturnStatus>('REQUESTED');
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');
  const [itemQuantities, setItemQuantities] = useState<Record<string, number>>({});
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (order && isOpen) {
      setReturnStatus(order.returnInfo?.status || 'RECEIVED');
      setReason(order.returnInfo?.reason || '');
      setNotes(order.returnInfo?.notes || '');
      const initialQty: Record<string, number> = {};
      order.items.forEach((it) => {
        const existingReturned = order.returnInfo?.returnedItems.find(
          (ri) => ri.orderItemId === it.id
        );
        initialQty[it.id] = existingReturned
          ? existingReturned.quantity
          : order.returnInfo
          ? 0
          : it.requestedQuantity;
      });
      setItemQuantities(initialQty);
      setErrorMsg('');
    }
  }, [order, isOpen]);

  if (!order) return null;

  const selectedReturnItems: OrderReturnItem[] = order.items
    .filter((it) => (itemQuantities[it.id] || 0) > 0)
    .map((it) => {
      const qty = itemQuantities[it.id] || 0;
      const ratio = it.requestedQuantity > 0 ? qty / it.requestedQuantity : 1;
      return {
        orderItemId: it.id,
        productName: it.productName,
        variantLabel: it.variantLabel,
        quantity: qty,
        unitLabel: it.requestedUnitLabel,
        refundValuePaise: Math.round(it.lineTotalPaise * ratio),
      };
    });

  const estimatedReturnValue = selectedReturnItems.reduce(
    (sum, ri) => sum + ri.refundValuePaise,
    0
  );

  const handleSubmit = () => {
    if (!reason.trim()) {
      setErrorMsg('Please enter a return reason.');
      return;
    }
    if (selectedReturnItems.length === 0) {
      setErrorMsg('Select at least one returned item quantity greater than 0.');
      return;
    }
    onConfirmReturn(order.id, {
      status: returnStatus,
      reason: reason.trim(),
      notes: notes.trim() || undefined,
      returnedItems: selectedReturnItems,
    });
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={order.returnInfo ? 'Update Return Details' : 'Record Order Return'}
      description={`Order ${order.orderNumber} • Select returned items & status`}
      size="lg"
      footer={
        <>
          <Button variant="secondary" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleSubmit}
            leftIcon={<RotateCcw className="w-4 h-4" />}
          >
            Save Return Record
          </Button>
        </>
      }
    >
      <div className="space-y-4 text-left">
        {errorMsg && (
          <div className="p-2.5 bg-[#FEE2E2] text-[#DC2626] rounded-xl text-xs font-semibold">
            {errorMsg}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <Select
            label="Return Status"
            required
            value={returnStatus}
            onChange={(e) => setReturnStatus(e.target.value as ReturnStatus)}
            options={[
              { value: 'REQUESTED', label: 'Return Requested' },
              { value: 'APPROVED', label: 'Return Approved' },
              { value: 'PICKED_UP', label: 'Picked Up by Runner' },
              { value: 'RECEIVED', label: 'Received at Store' },
              { value: 'REJECTED', label: 'Return Rejected' },
            ]}
          />
          <div className="p-3 bg-[#F8FAFC] border border-[#E5E7EB] rounded-xl flex flex-col justify-center">
            <span className="text-[11px] text-[#6B7280]">Estimated Returned Item Value</span>
            <span className="text-base font-black text-[#218838]">
              {formatINR(estimatedReturnValue)}
            </span>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-[#1F2937] mb-1.5">
            Returned Items & Quantities *
          </label>
          <div className="border border-[#E5E7EB] rounded-xl divide-y divide-[#E5E7EB] overflow-hidden">
            {order.items.map((item) => {
              const currentQty = itemQuantities[item.id] ?? 0;
              return (
                <div
                  key={item.id}
                  className="p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-white text-xs"
                >
                  <div>
                    <p className="font-bold text-[#1F2937]">{item.productName}</p>
                    <p className="text-[11px] text-[#6B7280]">
                      Ordered: {item.requestedQuantity} × {item.requestedUnitLabel} ({formatINR(item.lineTotalPaise)})
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[11px] text-[#6B7280]">Return Qty:</span>
                    <input
                      type="number"
                      min={0}
                      max={item.requestedQuantity}
                      value={currentQty}
                      onChange={(e) => {
                        const val = Math.max(
                          0,
                          Math.min(item.requestedQuantity, parseInt(e.target.value, 10) || 0)
                        );
                        setItemQuantities((prev) => ({ ...prev, [item.id]: val }));
                        setErrorMsg('');
                      }}
                      className="w-20 h-9 px-2.5 text-xs font-bold text-right bg-[#F8FAFC] border border-[#E5E7EB] rounded-lg focus:outline-none focus:border-[#218838]"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-[#1F2937] mb-1.5">
            Return Reason *
          </label>
          <textarea
            rows={2}
            value={reason}
            onChange={(e) => {
              setReason(e.target.value);
              setErrorMsg('');
            }}
            placeholder="e.g., Damaged packaging, spoiled item, wrong variant delivered..."
            className="w-full p-3 text-xs bg-[#F8FAFC] border border-[#E5E7EB] rounded-xl outline-none focus:border-[#218838] focus:bg-white"
          />
        </div>

        <Input
          label="Inspection / Handover Notes (Optional)"
          placeholder="e.g., Verified by store runner at return handover"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </div>
    </Modal>
  );
};
