/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { lockBodyScroll } from '../../../../utils/scrollLock';
import {
  AlertTriangle,
  Building,
  Check,
  CheckCircle2,
  Copy,
  CreditCard,
  FileText,
  RefreshCw,
  RotateCw,
  ShieldAlert,
  ShieldCheck,
  X,
  XCircle,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import {
  MasterSellerRecord,
  SellerDocumentStatus,
  SellerKycDocumentRecord,
} from '../../../../types/admin';
import { Modal } from '../../../../components/ui/Modal';
import { Button } from '../../../../components/ui/Button';
import { Badge } from '../../../../components/ui/Badge';
import { DOC_STATUS_META } from './seller360Helpers';

/* ============================================================================
 * 1. SELLER GOVERNANCE ACTION MODAL (Approve, Reject, Request KYC Changes,
 *    Activate, Deactivate, Suspend, Unsuspend)
 * ========================================================================== */

export type SellerGovernanceActionType =
  | 'APPROVE'
  | 'REJECT'
  | 'REQUEST_KYC_CHANGES'
  | 'ACTIVATE'
  | 'DEACTIVATE'
  | 'SUSPEND'
  | 'UNSUSPEND';

const ACTION_CONFIG: Record<
  SellerGovernanceActionType,
  {
    title: string;
    confirmLabel: string;
    buttonVariant: 'primary' | 'destructive' | 'secondary';
    requireReason: boolean;
    bannerTone: 'info' | 'warning' | 'danger' | 'success';
    description: (seller: MasterSellerRecord) => string;
    presets: string[];
    placeholder: string;
  }
> = {
  APPROVE: {
    title: 'Approve Seller Account',
    confirmLabel: 'Confirm Seller Approval',
    buttonVariant: 'primary',
    requireReason: false,
    bannerTone: 'success',
    description: (s) =>
      `Approving ${s.name} marks KYC as verified and qualifies the store to go live on GramBazaar.`,
    presets: ['All KYC documents verified and field check passed', 'Approved for initial village pilot'],
    placeholder: 'Optional approval remarks for the seller audit trail...',
  },
  REJECT: {
    title: 'Reject Seller Application',
    confirmLabel: 'Confirm Rejection',
    buttonVariant: 'destructive',
    requireReason: true,
    bannerTone: 'danger',
    description: (s) =>
      `Rejecting ${s.name} prevents the merchant from listing products or accepting orders. A documented compliance reason is mandatory.`,
    presets: [
      'PAN or Aadhaar identity mismatch with proprietor details',
      'Expired or invalid FSSAI / Trade license',
      'Shop location outside currently serviceable village cluster',
      'Duplicate seller registration detected',
    ],
    placeholder: 'Enter mandatory rejection reason...',
  },
  REQUEST_KYC_CHANGES: {
    title: 'Request KYC Document Changes',
    confirmLabel: 'Send KYC Change Request',
    buttonVariant: 'primary',
    requireReason: true,
    bannerTone: 'warning',
    description: (s) =>
      `Notifies ${s.name} to re-upload or clarify pending KYC documents before activation.`,
    presets: [
      'Uploaded GST / Trade license scan is blurry or cropped',
      'FSSAI certificate expiry date not clearly visible',
      'Storefront photo must clearly show shop signage',
      'Bank cancelled cheque / IFSC verification required',
    ],
    placeholder: 'Specify exact document corrections needed...',
  },
  ACTIVATE: {
    title: 'Activate Seller Storefront',
    confirmLabel: 'Activate Store',
    buttonVariant: 'primary',
    requireReason: false,
    bannerTone: 'success',
    description: (s) =>
      `Makes ${s.name} visible to customers across ${s.serviceableVillageIds?.length || 1} serviceable village(s).`,
    presets: ['KYC compliance verified — ready for live orders', 'Reactivated upon merchant confirmation'],
    placeholder: 'Optional activation note...',
  },
  DEACTIVATE: {
    title: 'Deactivate Seller Storefront',
    confirmLabel: 'Deactivate Store',
    buttonVariant: 'secondary',
    requireReason: true,
    bannerTone: 'warning',
    description: (s) =>
      `Temporarily sets ${s.name} to Inactive, pausing new incoming customer orders while keeping historical data intact.`,
    presets: [
      'Temporary shop closure requested by seller',
      'Pending updated trade / FSSAI license renewal',
      'Seasonal inventory restock pause',
    ],
    placeholder: 'Enter reason for deactivating storefront...',
  },
  SUSPEND: {
    title: 'Suspend Seller Storefront',
    confirmLabel: 'Confirm Suspension',
    buttonVariant: 'destructive',
    requireReason: true,
    bannerTone: 'danger',
    description: (s) =>
      `Immediately suspends ${s.name}, hides all listings from customer search, and logs an immutable compliance audit entry.`,
    presets: [
      'Repeated seller-initiated order cancellations',
      'Unresolved food safety / packaging quality complaints',
      'Expired compliance license not renewed after reminder',
      'Policy violation / pricing discrepancy reported',
    ],
    placeholder: 'Mandatory administrative reason & compliance notes...',
  },
  UNSUSPEND: {
    title: 'Unsuspend & Reactivate Seller',
    confirmLabel: 'Confirm Unsuspend',
    buttonVariant: 'primary',
    requireReason: true,
    bannerTone: 'info',
    description: (s) =>
      `Lifts the active suspension on ${s.name} and restores the storefront to Active status.`,
    presets: [
      'Compliance issue resolved and re-verified by field ops',
      'Renewed license verified and SLA warning acknowledged',
      'Disputes settled and merchant reinstated',
    ],
    placeholder: 'Document resolution summary before lifting suspension...',
  },
};

export interface SellerGovernanceModalProps {
  seller: MasterSellerRecord | null;
  action: SellerGovernanceActionType | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (sellerId: string, action: SellerGovernanceActionType, reason: string) => void;
}

export const SellerGovernanceModal: React.FC<SellerGovernanceModalProps> = ({
  seller,
  action,
  isOpen,
  onClose,
  onConfirm,
}) => {
  const [reason, setReason] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (isOpen) {
      setReason('');
      setErrorMsg('');
    }
  }, [isOpen, seller?.id, action]);

  if (!seller || !action) return null;

  const cfg = ACTION_CONFIG[action];

  const bannerClasses =
    cfg.bannerTone === 'danger'
      ? 'bg-[#FEF2F2] border-[#FECACA] text-[#991B1B]'
      : cfg.bannerTone === 'warning'
      ? 'bg-[#FEF3C7]/60 border-[#FCD34D] text-[#92400E]'
      : cfg.bannerTone === 'success'
      ? 'bg-[#E8F5E9] border-[#A7F3D0] text-[#176B2C]'
      : 'bg-[#EFF6FF] border-[#BFDBFE] text-[#1E40AF]';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (cfg.requireReason && !reason.trim()) {
      setErrorMsg('Please provide a clear administrative reason before continuing.');
      return;
    }
    onConfirm(seller.id, action, reason.trim());
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={cfg.title}
      description={`${seller.name} (${seller.id}) • ${seller.villageName}`}
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-left text-xs">
        <div className={`p-3.5 rounded-xl border flex items-start gap-2.5 ${bannerClasses}`}>
          {cfg.bannerTone === 'danger' ? (
            <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
          ) : cfg.bannerTone === 'warning' ? (
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          ) : (
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
          )}
          <p className="leading-relaxed">{cfg.description(seller)}</p>
        </div>

        {errorMsg && (
          <div className="p-2.5 rounded-xl bg-[#FEE2E2] border border-[#FCA5A5] text-[#DC2626] font-semibold">
            {errorMsg}
          </div>
        )}

        <div className="space-y-2">
          <label className="block font-bold text-[#1F2937]">
            {cfg.requireReason ? 'Mandatory Reason & Compliance Remarks *' : 'Administrative Remarks (Optional)'}
          </label>
          {cfg.presets.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {cfg.presets.map((preset) => (
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
          )}
          <textarea
            rows={3}
            value={reason}
            onChange={(e) => {
              setReason(e.target.value);
              setErrorMsg('');
            }}
            placeholder={cfg.placeholder}
            className="w-full p-3 text-xs bg-[#F8FAFC] border border-[#E5E7EB] rounded-xl outline-none focus:border-[#218838] focus:bg-white"
          />
        </div>

        <div className="flex justify-end gap-2 pt-3 border-t border-[#E5E7EB]">
          <Button variant="secondary" size="sm" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button variant={cfg.buttonVariant} size="sm" type="submit">
            {cfg.confirmLabel}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

/* ============================================================================
 * 2. DOCUMENT VERIFICATION ACTION MODAL (Approve / Reject / Request Changes)
 * ========================================================================== */

export interface DocumentReviewModalProps {
  sellerName: string;
  document: SellerKycDocumentRecord | null;
  targetStatus: Extract<SellerDocumentStatus, 'APPROVED' | 'REJECTED' | 'CHANGES_REQUESTED'> | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (docId: string, status: SellerDocumentStatus, note: string) => void;
}

export const DocumentReviewModal: React.FC<DocumentReviewModalProps> = ({
  sellerName,
  document,
  targetStatus,
  isOpen,
  onClose,
  onConfirm,
}) => {
  const [note, setNote] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (isOpen) {
      setNote('');
      setErrorMsg('');
    }
  }, [isOpen, document?.id, targetStatus]);

  if (!document || !targetStatus) return null;

  const isApprove = targetStatus === 'APPROVED';
  const isReject = targetStatus === 'REJECTED';

  const handleConfirm = () => {
    if (!isApprove && !note.trim()) {
      setErrorMsg('Please provide a specific reason so the seller knows what to fix.');
      return;
    }
    onConfirm(document.id, targetStatus, note.trim());
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        isApprove
          ? `Approve ${document.label}`
          : isReject
          ? `Reject ${document.label}`
          : `Request Changes: ${document.label}`
      }
      description={`${sellerName} • Ref ${document.documentNumberMasked}`}
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
            {isApprove ? 'Confirm Approval' : isReject ? 'Confirm Rejection' : 'Request Re-upload'}
          </Button>
        </>
      }
    >
      <div className="space-y-4 text-left text-xs">
        <div className="p-3 bg-[#F8FAFC] border border-[#E5E7EB] rounded-xl space-y-1">
          <p className="font-bold text-[#1F2937]">{document.label}</p>
          <p className="font-mono text-[11px] text-[#6B7280]">
            File: {document.fileName} • Number: {document.documentNumberMasked}
          </p>
        </div>

        {errorMsg && (
          <div className="p-2.5 bg-[#FEE2E2] text-[#DC2626] rounded-xl font-semibold">
            {errorMsg}
          </div>
        )}

        <div>
          <label className="block font-bold text-[#1F2937] mb-1.5">
            {isApprove ? 'Verification Note (Optional)' : 'Mandatory Reason / Required Correction *'}
          </label>
          <textarea
            rows={3}
            value={note}
            onChange={(e) => {
              setNote(e.target.value);
              setErrorMsg('');
            }}
            placeholder={
              isApprove
                ? 'e.g., Matched certificate number with official registry.'
                : 'e.g., Expiry date is cut off or details do not match owner name.'
            }
            className="w-full p-3 text-xs bg-[#F8FAFC] border border-[#E5E7EB] rounded-xl outline-none focus:border-[#218838] focus:bg-white"
          />
        </div>
      </div>
    </Modal>
  );
};

/* ============================================================================
 * 3. SELLER 360 KYC DOCUMENT LIGHTBOX PREVIEW MODAL
 * ========================================================================== */

export interface SellerKycDocPreviewModalProps {
  seller: MasterSellerRecord;
  document: SellerKycDocumentRecord | null;
  isOpen: boolean;
  onClose: () => void;
  canApprove: boolean;
  onRequestDocAction: (
    doc: SellerKycDocumentRecord,
    targetStatus: Extract<SellerDocumentStatus, 'APPROVED' | 'REJECTED' | 'CHANGES_REQUESTED'>
  ) => void;
}

export const SellerKycDocPreviewModal: React.FC<SellerKycDocPreviewModalProps> = ({
  seller,
  document,
  isOpen,
  onClose,
  canApprove,
  onRequestDocAction,
}) => {
  const [zoomLevel, setZoomLevel] = useState(100);
  const [rotation, setRotation] = useState(0);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setZoomLevel(100);
    setRotation(0);
    setCopied(false);
  }, [document?.id, isOpen]);

  useEffect(() => {
    if (!isOpen || !document) return;
    return lockBodyScroll();
  }, [isOpen, document]);

  if (!isOpen || !document) return null;

  const statusMeta = DOC_STATUS_META[document.status];

  const handleCopy = () => {
    navigator.clipboard?.writeText(document.documentNumberMasked);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const previewMarkup = (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/80 backdrop-blur-xs overflow-hidden text-left"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="bg-white w-full max-w-3xl max-h-[calc(100dvh-1.5rem)] sm:max-h-[90dvh] rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-slate-700"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Bar */}
        <div className="shrink-0 bg-slate-900 text-white px-5 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#218838] flex items-center justify-center">
              <ShieldCheck className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-bold">{document.label}</h3>
              <p className="text-[11px] text-slate-400">
                {seller.name} • {document.fileName}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Zoom / Rotate Toolbar */}
        <div className="shrink-0 bg-[#F8FAFC] px-5 py-2.5 border-b border-[#E5E7EB] flex items-center justify-between flex-wrap gap-2 text-xs">
          <div className="flex items-center gap-2">
            <Badge variant={statusMeta.variant} size="sm" dot>
              {statusMeta.label}
            </Badge>
            <span className="font-mono font-bold text-[#1F2937]">{document.documentNumberMasked}</span>
            <button
              type="button"
              onClick={handleCopy}
              className="p-1 text-[#6B7280] hover:text-[#218838] cursor-pointer"
              title="Copy masked reference"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-[#16A34A]" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
          <div className="flex items-center gap-1 bg-white border border-[#E5E7EB] px-2 py-1 rounded-xl">
            <button
              type="button"
              onClick={() => setZoomLevel((z) => Math.max(60, z - 20))}
              className="p-1 rounded hover:bg-slate-100 cursor-pointer"
              title="Zoom out"
            >
              <ZoomOut className="w-4 h-4 text-[#475569]" />
            </button>
            <span className="font-mono font-bold min-w-[40px] text-center">{zoomLevel}%</span>
            <button
              type="button"
              onClick={() => setZoomLevel((z) => Math.min(180, z + 20))}
              className="p-1 rounded hover:bg-slate-100 cursor-pointer"
              title="Zoom in"
            >
              <ZoomIn className="w-4 h-4 text-[#475569]" />
            </button>
            <button
              type="button"
              onClick={() => setRotation((r) => (r + 90) % 360)}
              className="p-1 rounded hover:bg-slate-100 cursor-pointer"
              title="Rotate"
            >
              <RotateCw className="w-4 h-4 text-[#475569]" />
            </button>
            <button
              type="button"
              onClick={() => {
                setZoomLevel(100);
                setRotation(0);
              }}
              className="p-1 rounded hover:bg-slate-100 cursor-pointer"
              title="Reset"
            >
              <RefreshCw className="w-3.5 h-3.5 text-[#475569]" />
            </button>
          </div>
        </div>

        {/* Simulated Document Canvas */}
        <div className="flex-1 min-h-0 bg-slate-200/80 overflow-auto overscroll-contain modal-scroll p-6 flex">
          <div
            style={{
              transform: `scale(${zoomLevel / 100}) rotate(${rotation}deg)`,
              transition: 'transform 0.15s ease-out',
            }}
            className="m-auto origin-center bg-white w-full max-w-lg rounded-xl border border-slate-300 shadow-lg p-6 space-y-4"
          >
            <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-3">
              <div className="flex items-center gap-2">
                {document.code === 'STORE_PHOTO' ? (
                  <Building className="w-5 h-5 text-[#218838]" />
                ) : document.code === 'PAN' ? (
                  <CreditCard className="w-5 h-5 text-[#2563EB]" />
                ) : (
                  <FileText className="w-5 h-5 text-[#218838]" />
                )}
                <span className="font-black text-sm text-[#1F2937]">{document.label}</span>
              </div>
              <Badge variant="neutral" size="sm">
                {document.code}
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E5E7EB]">
                <p className="text-[10px] uppercase text-[#6B7280]">Masked Number</p>
                <p className="font-mono font-black text-sm text-[#1F2937] mt-0.5">
                  {document.documentNumberMasked}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E5E7EB]">
                <p className="text-[10px] uppercase text-[#6B7280]">File Name</p>
                <p className="font-mono text-[11px] font-semibold text-[#1F2937] mt-0.5 truncate">
                  {document.fileName}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E5E7EB]">
                <p className="text-[10px] uppercase text-[#6B7280]">Business / Proprietor</p>
                <p className="font-bold text-[#1F2937] mt-0.5">{seller.name}</p>
                <p className="text-[11px] text-[#6B7280]">{seller.ownerName}</p>
              </div>
              <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E5E7EB]">
                <p className="text-[10px] uppercase text-[#6B7280]">Registered Location</p>
                <p className="font-bold text-[#1F2937] mt-0.5">{seller.villageName}</p>
                <p className="text-[11px] text-[#6B7280]">
                  {seller.district || 'Unnao'}, {seller.state || 'UP'} {seller.pinCode || ''}
                </p>
              </div>
            </div>

            {document.rejectionReason && (
              <div className="p-3 rounded-xl bg-[#FEF2F2] border border-[#FECACA] text-xs text-[#991B1B]">
                <strong>Compliance Flag:</strong> {document.rejectionReason}
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="shrink-0 bg-white px-5 py-3 border-t border-[#E5E7EB] flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            {canApprove && (
              <>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    onClose();
                    onRequestDocAction(document, 'APPROVED');
                  }}
                >
                  Approve Document
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    onClose();
                    onRequestDocAction(document, 'CHANGES_REQUESTED');
                  }}
                >
                  Request Changes
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => {
                    onClose();
                    onRequestDocAction(document, 'REJECTED');
                  }}
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
      </div>
    </div>
  );

  if (typeof window === 'undefined') return previewMarkup;
  return createPortal(previewMarkup, window.document.body);
};
