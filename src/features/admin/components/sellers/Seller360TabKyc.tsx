/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Eye,
  FileText,
  History,
  RefreshCcw,
  ShieldCheck,
  XCircle,
} from 'lucide-react';
import {
  MasterSellerRecord,
  SellerDocumentStatus,
  SellerKycDocumentRecord,
} from '../../../../types/admin';
import { Badge } from '../../../../components/ui/Badge';
import { Button } from '../../../../components/ui/Button';
import { EmptyState } from '../../../../components/feedback/EmptyState';
import { formatDateTime } from '../../../../utils/dates';
import {
  DOC_STATUS_META,
  KYC_STATUS_META,
  getResolvedKycStatus,
} from './seller360Helpers';
import { DocumentReviewModal, SellerKycDocPreviewModal } from './SellerActionModals';

export interface Seller360TabKycProps {
  seller: MasterSellerRecord;
  canApprove: boolean;
  onUpdateDocument: (
    sellerId: string,
    docId: string,
    status: SellerDocumentStatus,
    note?: string
  ) => void;
}

export const Seller360TabKyc: React.FC<Seller360TabKycProps> = ({
  seller,
  canApprove,
  onUpdateDocument,
}) => {
  const [previewDocId, setPreviewDocId] = useState<string | null>(null);
  const [reviewAction, setReviewAction] = useState<{
    doc: SellerKycDocumentRecord;
    targetStatus: Extract<SellerDocumentStatus, 'APPROVED' | 'REJECTED' | 'CHANGES_REQUESTED'>;
  } | null>(null);

  const docs = seller.kycDocuments || [];
  const kycStatus = getResolvedKycStatus(seller);
  const kycMeta = KYC_STATUS_META[kycStatus];
  const approvedCount = docs.filter((d) => d.status === 'APPROVED').length;
  const pendingCount = docs.filter(
    (d) => d.status === 'PENDING' || d.status === 'CHANGES_REQUESTED'
  ).length;
  const rejectedCount = docs.filter((d) => d.status === 'REJECTED').length;

  const previewDoc = docs.find((d) => d.id === previewDocId) || null;

  return (
    <div className="space-y-5 text-left text-xs">
      {/* KYC Compliance Progress Header */}
      <div className="bg-[#F8FAFC] rounded-2xl border border-[#E5E7EB] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <ShieldCheck className="w-4 h-4 text-[#218838]" />
            <h3 className="text-sm font-black text-[#1F2937]">KYC &amp; Compliance Dossier</h3>
            <Badge variant={kycMeta.variant} size="sm" dot>
              {kycMeta.label}
            </Badge>
          </div>
          <p className="text-[#6B7280]">
            {approvedCount} of {docs.length} document(s) approved • {pendingCount} pending/changes •{' '}
            {rejectedCount} rejected
          </p>
        </div>

        <div className="w-full sm:w-48">
          <div className="flex justify-between text-[11px] font-semibold text-[#475569] mb-1">
            <span>Verification Progress</span>
            <span>{docs.length > 0 ? Math.round((approvedCount / docs.length) * 100) : 0}%</span>
          </div>
          <div className="h-2 bg-[#E2E8F0] rounded-full overflow-hidden">
            <div
              className="h-full bg-[#218838] rounded-full transition-all duration-300"
              style={{
                width: `${docs.length > 0 ? Math.round((approvedCount / docs.length) * 100) : 0}%`,
              }}
            />
          </div>
        </div>
      </div>

      {/* Document Cards */}
      {docs.length === 0 ? (
        <EmptyState
          icon={<FileText className="w-6 h-6" />}
          title="No KYC documents uploaded yet"
          description="This seller has not uploaded compliance documents yet."
        />
      ) : (
        <div className="space-y-3.5">
          {docs.map((doc) => {
            const meta = DOC_STATUS_META[doc.status];
            return (
              <div
                key={doc.id}
                className="bg-white rounded-2xl border border-[#E5E7EB] p-4 shadow-xs space-y-3"
              >
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                        doc.status === 'APPROVED'
                          ? 'bg-[#E8F5E9] text-[#218838]'
                          : doc.status === 'REJECTED'
                          ? 'bg-[#FEE2E2] text-[#DC2626]'
                          : 'bg-[#FEF3C7] text-[#D97706]'
                      }`}
                    >
                      <FileText className="w-5 h-5" />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-bold text-sm text-[#1F2937]">{doc.label}</h4>
                        <Badge variant={meta.variant} size="sm" dot>
                          {meta.label}
                        </Badge>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-[#6B7280]">
                        <span>
                          Document No:{' '}
                          <strong className="font-mono text-[#1F2937]">
                            {doc.documentNumberMasked}
                          </strong>
                        </span>
                        <span>
                          File: <strong className="font-mono text-[#475569]">{doc.fileName}</strong>
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" /> Uploaded {formatDateTime(doc.uploadedAt)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Admin Document Actions */}
                  <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setPreviewDocId(doc.id)}
                      leftIcon={<Eye className="w-3.5 h-3.5" />}
                    >
                      Preview
                    </Button>
                    {canApprove && doc.status !== 'APPROVED' && (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => setReviewAction({ doc, targetStatus: 'APPROVED' })}
                        leftIcon={<CheckCircle2 className="w-3.5 h-3.5" />}
                      >
                        Approve
                      </Button>
                    )}
                    {canApprove && doc.status !== 'CHANGES_REQUESTED' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setReviewAction({ doc, targetStatus: 'CHANGES_REQUESTED' })}
                        leftIcon={<RefreshCcw className="w-3.5 h-3.5" />}
                      >
                        Request Changes
                      </Button>
                    )}
                    {canApprove && doc.status !== 'REJECTED' && (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => setReviewAction({ doc, targetStatus: 'REJECTED' })}
                        leftIcon={<XCircle className="w-3.5 h-3.5" />}
                      >
                        Reject
                      </Button>
                    )}
                  </div>
                </div>

                {/* Rejection / Changes Requested Reason */}
                {doc.rejectionReason && (
                  <div className="p-3 rounded-xl bg-[#FEF2F2] border border-[#FECACA] flex items-start gap-2 text-[#991B1B]">
                    <AlertTriangle className="w-4 h-4 text-[#DC2626] shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold">
                        {doc.status === 'REJECTED' ? 'Rejection Reason' : 'Requested Changes'}
                      </p>
                      <p className="mt-0.5">{doc.rejectionReason}</p>
                    </div>
                  </div>
                )}

                {/* Verification History */}
                <div className="pt-2.5 border-t border-[#E5E7EB] space-y-2">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-[#6B7280] flex items-center gap-1">
                    <History className="w-3.5 h-3.5" /> Verification History ({doc.history.length})
                  </p>
                  <div className="space-y-1.5">
                    {doc.history
                      .slice()
                      .reverse()
                      .map((ev, idx) => (
                        <div
                          key={`${ev.timestamp}-${idx}`}
                          className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[11px] bg-[#F8FAFC] px-3 py-2 rounded-lg border border-[#E5E7EB]"
                        >
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge variant={DOC_STATUS_META[ev.status].variant} size="sm">
                              {DOC_STATUS_META[ev.status].label}
                            </Badge>
                            <span className="font-semibold text-[#1F2937]">{ev.actor}:</span>
                            <span className="text-[#475569]">{ev.note}</span>
                          </div>
                          <span className="font-mono text-[10px] text-[#6B7280] shrink-0">
                            {formatDateTime(ev.timestamp)}
                          </span>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Document Preview Lightbox */}
      <SellerKycDocPreviewModal
        seller={seller}
        document={previewDoc}
        isOpen={Boolean(previewDoc)}
        onClose={() => setPreviewDocId(null)}
        canApprove={canApprove}
        onRequestDocAction={(doc, targetStatus) => setReviewAction({ doc, targetStatus })}
      />

      {/* Confirmation Modal for Document Approve / Reject / Request Changes */}
      <DocumentReviewModal
        sellerName={seller.name}
        document={reviewAction?.doc || null}
        targetStatus={reviewAction?.targetStatus || null}
        isOpen={Boolean(reviewAction)}
        onClose={() => setReviewAction(null)}
        onConfirm={(docId, status, note) => onUpdateDocument(seller.id, docId, status, note)}
      />
    </div>
  );
};
