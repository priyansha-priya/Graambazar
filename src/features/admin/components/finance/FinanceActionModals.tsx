/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Info,
  ShieldAlert,
  XCircle,
} from 'lucide-react';
import { RefundLedgerRecord, SellerPayoutRecord } from '../../../../types/admin';
import { Modal } from '../../../../components/ui/Modal';
import { Button } from '../../../../components/ui/Button';
import { Input } from '../../../../components/ui/Input';
import { Select } from '../../../../components/ui/Select';
import { formatINR } from '../../../../utils/currency';
import { REFUND_CHANNEL_LABELS } from './financeHelpers';

/* ============================================================================
 * 1. RECORD SETTLEMENT & UTR CONFIRMATION MODAL
 * ========================================================================== */

export interface SettlePayoutModalProps {
  payout: SellerPayoutRecord | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirmSettle: (
    payoutId: string,
    payload: {
      paymentMode: SellerPayoutRecord['paymentMode'];
      utrNumber: string;
      notes?: string;
    }
  ) => void;
}

export const SettlePayoutModal: React.FC<SettlePayoutModalProps> = ({
  payout,
  isOpen,
  onClose,
  onConfirmSettle,
}) => {
  const [paymentMode, setPaymentMode] = useState<SellerPayoutRecord['paymentMode']>('NEFT_IMPS');
  const [utrNumber, setUtrNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (payout && isOpen) {
      setPaymentMode(payout.paymentMode);
      setUtrNumber(payout.utrNumber || '');
      setNotes(payout.notes || '');
      setErrorMsg('');
    }
  }, [payout, isOpen]);

  if (!payout) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!utrNumber.trim()) {
      setErrorMsg('Enter a valid Bank UTR / UPI Reference number before settling.');
      return;
    }
    onConfirmSettle(payout.id, {
      paymentMode,
      utrNumber: utrNumber.trim().toUpperCase(),
      notes: notes.trim() || undefined,
    });
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Confirm Seller Settlement & Record UTR"
      description={`${payout.sellerName} (${payout.id}) • ${payout.periodLabel}`}
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-left">
        <div className="p-3 bg-[#EFF6FF] border border-[#BFDBFE] rounded-xl flex items-start gap-2.5 text-xs text-[#1E40AF]">
          <Info className="w-4 h-4 shrink-0 mt-0.5 text-[#2563EB]" />
          <p>
            <strong>Simulated Ledger Reconciliation:</strong> Records UTR proof and marks this batch as Settled in local frontend state. No live bank transfer is triggered.
          </p>
        </div>

        {/* Accounting Recap */}
        <div className="p-3.5 bg-[#F8FAFC] border border-[#E5E7EB] rounded-xl space-y-1.5 text-xs">
          <div className="flex justify-between text-[#6B7280]">
            <span>Gross Sales ({payout.ordersCount} orders)</span>
            <span className="font-semibold text-[#1F2937]">{formatINR(payout.grossAmountPaise)}</span>
          </div>
          <div className="flex justify-between text-[#6B7280]">
            <span>Commission &amp; Deductions</span>
            <span className="font-semibold text-[#DC2626]">
              -
              {formatINR(
                payout.commissionPaise +
                  payout.refundDeductionsPaise +
                  (payout.otherDeductionsPaise || 0)
              )}
            </span>
          </div>
          <div className="flex justify-between pt-2 border-t border-[#E5E7EB]">
            <span className="font-bold text-[#1F2937]">Net Settlement Payable</span>
            <span className="text-base font-black text-[#218838]">
              {formatINR(payout.netPayablePaise)}
            </span>
          </div>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-xl bg-[#FEE2E2] border border-[#FCA5A5] text-[#991B1B] text-xs font-semibold">
            {errorMsg}
          </div>
        )}

        <Select
          label="Transfer Mode"
          required
          value={paymentMode}
          onChange={(e) => setPaymentMode(e.target.value as SellerPayoutRecord['paymentMode'])}
          options={[
            { value: 'NEFT_IMPS', label: 'NEFT / IMPS Bank Transfer' },
            { value: 'UPI', label: 'Direct Merchant UPI' },
            { value: 'CASH_SETTLEMENT', label: 'Village Cash Settlement' },
          ]}
        />

        <Input
          label="UTR / Bank Reference Number"
          placeholder="e.g. UTR632290184712"
          value={utrNumber}
          onChange={(e) => {
            setUtrNumber(e.target.value);
            setErrorMsg('');
          }}
          required
        />

        <Input
          label="Finance Remarks (Optional)"
          placeholder="e.g. Settled to registered cooperative bank account"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />

        <div className="flex justify-end gap-2 pt-3 border-t border-[#E5E7EB]">
          <Button variant="secondary" size="sm" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            type="submit"
            leftIcon={<CheckCircle2 className="w-4 h-4" />}
          >
            Confirm &amp; Mark Settled
          </Button>
        </div>
      </form>
    </Modal>
  );
};

/* ============================================================================
 * 2. MARK SETTLEMENT PROCESSING CONFIRMATION MODAL
 * ========================================================================== */

export interface MarkProcessingModalProps {
  payout: SellerPayoutRecord | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirmProcessing: (payoutId: string) => void;
}

export const MarkProcessingModal: React.FC<MarkProcessingModalProps> = ({
  payout,
  isOpen,
  onClose,
  onConfirmProcessing,
}) => {
  if (!payout) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Move Batch to Processing?"
      description={`${payout.sellerName} • ${payout.id}`}
      size="sm"
      footer={
        <>
          <Button variant="secondary" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              onConfirmProcessing(payout.id);
              onClose();
            }}
          >
            Mark as Processing
          </Button>
        </>
      }
    >
      <div className="flex items-start gap-3 text-left text-xs">
        <div className="w-9 h-9 rounded-full bg-[#FEF3C7] text-[#D97706] flex items-center justify-center shrink-0">
          <AlertTriangle className="w-4 h-4" />
        </div>
        <div className="space-y-1">
          <p className="font-bold text-[#1F2937]">
            Queue {formatINR(payout.netPayablePaise)} for Disbursement
          </p>
          <p className="text-[#475569] leading-relaxed">
            This marks batch <strong>{payout.id}</strong> ({payout.ordersCount} orders) as{' '}
            <strong>Processing</strong> so finance operators can complete the bank/UPI transfer and record the UTR reference.
          </p>
        </div>
      </div>
    </Modal>
  );
};

/* ============================================================================
 * 3. REFUND APPROVE / REJECT CONFIRMATION MODAL
 * ========================================================================== */

export interface RefundDecisionModalProps {
  refund: RefundLedgerRecord | null;
  mode: 'APPROVE' | 'REJECT' | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirmDecision: (
    refundId: string,
    status: RefundLedgerRecord['status'],
    reason?: string
  ) => void;
}

const REJECTION_PRESETS = [
  'Outside permitted return/dispute window',
  'Delivery OTP & item handover confirmed without issue',
  'Insufficient proof provided for quality claim',
  'Duplicate refund claim already settled on order',
];

export const RefundDecisionModal: React.FC<RefundDecisionModalProps> = ({
  refund,
  mode,
  isOpen,
  onClose,
  onConfirmDecision,
}) => {
  const [reason, setReason] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (isOpen) {
      setReason('');
      setErrorMsg('');
    }
  }, [isOpen, refund?.id, mode]);

  if (!refund || !mode) return null;

  const isReject = mode === 'REJECT';

  const handleConfirm = () => {
    if (isReject && !reason.trim()) {
      setErrorMsg('A mandatory rejection reason is required for audit compliance.');
      return;
    }
    onConfirmDecision(
      refund.id,
      isReject ? 'REJECTED' : 'PROCESSED',
      reason.trim() ||
        (isReject
          ? undefined
          : `Approved refund of ${formatINR(refund.amountPaise)} via ${
              REFUND_CHANNEL_LABELS[refund.refundChannel]
            }`)
    );
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isReject ? 'Reject Refund Request' : 'Approve & Complete Refund'}
      description={`${refund.id} • Order ${refund.orderId}`}
      size="md"
      footer={
        <>
          <Button variant="secondary" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant={isReject ? 'destructive' : 'primary'}
            size="sm"
            onClick={handleConfirm}
            leftIcon={
              isReject ? <XCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />
            }
          >
            {isReject ? 'Confirm Rejection' : 'Confirm Refund Approval'}
          </Button>
        </>
      }
    >
      <div className="space-y-4 text-left text-xs">
        {isReject ? (
          <div className="p-3 bg-[#FEF2F2] border border-[#FECACA] rounded-xl flex items-start gap-2.5 text-[#991B1B]">
            <ShieldAlert className="w-4 h-4 text-[#DC2626] shrink-0 mt-0.5" />
            <p>
              Rejecting refund <strong>{refund.id}</strong> for{' '}
              <strong>{refund.customerName}</strong> requires a clear compliance justification recorded in the audit trail.
            </p>
          </div>
        ) : (
          <div className="p-3 bg-[#EFF6FF] border border-[#BFDBFE] rounded-xl flex items-start gap-2.5 text-[#1E40AF]">
            <Info className="w-4 h-4 text-[#2563EB] shrink-0 mt-0.5" />
            <p>
              <strong>Simulated Finance Action:</strong> Marks refund{' '}
              <strong>{refund.id}</strong> as Completed in local state. Live payment gateway reversal requires backend integration.
            </p>
          </div>
        )}

        <div className="p-3.5 bg-[#F8FAFC] border border-[#E5E7EB] rounded-xl space-y-2">
          <div className="flex justify-between">
            <span className="text-[#6B7280]">Customer</span>
            <span className="font-bold text-[#1F2937]">{refund.customerName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#6B7280]">Seller</span>
            <span className="font-semibold text-[#1F2937]">{refund.sellerName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#6B7280]">Refund Channel</span>
            <span className="font-semibold text-[#1F2937]">
              {REFUND_CHANNEL_LABELS[refund.refundChannel]}
            </span>
          </div>
          <div className="flex justify-between pt-2 border-t border-[#E5E7EB]">
            <span className="font-bold text-[#1F2937]">Refund Amount</span>
            <span className="text-base font-black text-[#DC2626]">
              {formatINR(refund.amountPaise)}
            </span>
          </div>
        </div>

        {errorMsg && (
          <div className="p-2.5 bg-[#FEE2E2] text-[#DC2626] rounded-xl font-semibold">
            {errorMsg}
          </div>
        )}

        {isReject ? (
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#1F2937] mb-1.5">
              Mandatory Rejection Reason *
            </label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {REJECTION_PRESETS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => {
                    setReason(preset);
                    setErrorMsg('');
                  }}
                  className="text-[11px] px-2.5 py-1 rounded-full bg-[#F8FAFC] border border-[#E5E7EB] text-[#475569] hover:border-[#DC2626] hover:text-[#DC2626] transition-colors cursor-pointer"
                >
                  {preset}
                </button>
              ))}
            </div>
            <textarea
              rows={3}
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                setErrorMsg('');
              }}
              placeholder="Explain why this refund request is rejected..."
              className="w-full p-3 text-xs bg-[#F8FAFC] border border-[#E5E7EB] rounded-xl outline-none focus:border-[#DC2626] focus:bg-white"
            />
          </div>
        ) : (
          <Input
            label="Approval Note / Reference (Optional)"
            placeholder="e.g., Verified with merchant and approved for UPI refund"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        )}
      </div>
    </Modal>
  );
};
