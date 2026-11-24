/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  EyeOff,
  FileCheck2,
  Flag,
  MessageSquare,
  Package,
  ShieldAlert,
  ShoppingBag,
  Star,
  Store,
  UserCheck,
  Wallet,
} from 'lucide-react';
import {
  CustomerReviewRecord,
  SellerActivityEvent,
  SupportCaseRecord,
} from '../../../../types/admin';
import { Badge } from '../../../../components/ui/Badge';
import { Button } from '../../../../components/ui/Button';
import { EmptyState } from '../../../../components/feedback/EmptyState';
import { formatINR } from '../../../../utils/currency';
import { formatDateTime } from '../../../../utils/dates';

/* ============================================================================
 * TAB 7: REVIEWS & COMPLAINTS
 * ========================================================================== */

export interface Seller360TabReviewsProps {
  reviews: CustomerReviewRecord[];
  supportCases: SupportCaseRecord[];
  canModerateReviews: boolean;
  onModerateReview: (
    reviewId: string,
    status: CustomerReviewRecord['status'],
    notes?: string
  ) => void;
}

export const Seller360TabReviews: React.FC<Seller360TabReviewsProps> = ({
  reviews,
  supportCases,
  canModerateReviews,
  onModerateReview,
}) => {
  return (
    <div className="space-y-6 text-left text-xs">
      {/* Customer Reviews Section */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-black text-[#1F2937] flex items-center gap-1.5">
            <Star className="w-4 h-4 text-[#F59E0B]" /> Customer Reviews &amp; Ratings ({reviews.length})
          </h4>
        </div>

        {reviews.length === 0 ? (
          <EmptyState
            icon={<MessageSquare className="w-6 h-6" />}
            title="No customer reviews yet"
            description="Verified customer ratings and feedback for this seller will appear here."
          />
        ) : (
          <div className="space-y-3">
            {reviews.map((rev) => (
              <div
                key={rev.id}
                className="bg-white rounded-2xl border border-[#E5E7EB] p-4 space-y-2.5"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-[#1F2937]">{rev.customerName}</span>
                      <span className="font-mono text-[11px] text-[#218838]">{rev.orderId}</span>
                      <span className="inline-flex items-center gap-0.5 font-bold text-[#D97706] bg-[#FEF3C7] px-2 py-0.5 rounded-full text-[11px]">
                        ★ {rev.rating}.0
                      </span>
                    </div>
                    <p className="text-[11px] text-[#6B7280] mt-0.5">
                      {rev.villageName} • {formatDateTime(rev.createdAt)}
                    </p>
                  </div>

                  <Badge
                    variant={
                      rev.status === 'PUBLISHED'
                        ? 'success'
                        : rev.status === 'FLAGGED'
                        ? 'warning'
                        : 'neutral'
                    }
                    size="sm"
                    dot
                  >
                    {rev.status}
                  </Badge>
                </div>

                <p className="text-[#1F2937] leading-relaxed">{rev.comment}</p>

                {rev.flagReason && (
                  <p className="text-[11px] text-[#92400E] bg-[#FEF3C7]/60 px-3 py-1.5 rounded-lg border border-[#FCD34D]">
                    <strong>Flagged Reason:</strong> {rev.flagReason}
                  </p>
                )}

                {canModerateReviews && (
                  <div className="flex flex-wrap items-center justify-end gap-1.5 pt-2 border-t border-[#E5E7EB]">
                    {rev.status !== 'PUBLISHED' && (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() =>
                          onModerateReview(rev.id, 'PUBLISHED', 'Approved from Seller 360°')
                        }
                        leftIcon={<CheckCircle2 className="w-3.5 h-3.5" />}
                      >
                        Publish
                      </Button>
                    )}
                    {rev.status !== 'FLAGGED' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          onModerateReview(rev.id, 'FLAGGED', 'Flagged for quality audit')
                        }
                        leftIcon={<Flag className="w-3.5 h-3.5" />}
                      >
                        Flag
                      </Button>
                    )}
                    {rev.status !== 'HIDDEN' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          onModerateReview(rev.id, 'HIDDEN', 'Hidden by Admin moderation')
                        }
                        leftIcon={<EyeOff className="w-3.5 h-3.5" />}
                      >
                        Hide
                      </Button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Complaints, Disputes & Reported Issues Section */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-black text-[#1F2937] flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4 text-[#DC2626]" /> Complaints, Disputes &amp; Reported Issues ({supportCases.length})
          </h4>
        </div>

        {supportCases.length === 0 ? (
          <EmptyState
            icon={<CheckCircle2 className="w-6 h-6" />}
            title="No complaints or disputes reported"
            description="This seller currently has a clean record with zero open or historical customer disputes."
          />
        ) : (
          <div className="space-y-3">
            {supportCases.map((c) => (
              <div
                key={c.id}
                className="bg-white rounded-2xl border border-[#E5E7EB] p-4 space-y-2"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono font-bold text-[#1F2937]">{c.id}</span>
                      <span className="font-mono text-[11px] text-[#218838]">{c.orderId}</span>
                      <Badge variant="error" size="sm">
                        {c.issueType.replace(/_/g, ' ')}
                      </Badge>
                    </div>
                    <p className="text-[11px] text-[#6B7280] mt-0.5">
                      Customer: <strong className="text-[#1F2937]">{c.customerName}</strong> ({c.customerPhone}) •{' '}
                      {formatDateTime(c.createdAt)}
                    </p>
                  </div>
                  <div className="text-right">
                    <Badge
                      variant={
                        c.status === 'RESOLVED' || c.status === 'CLOSED'
                          ? 'success'
                          : c.status === 'OPEN'
                          ? 'error'
                          : 'warning'
                      }
                      size="sm"
                      dot
                    >
                      {c.status.replace(/_/g, ' ')}
                    </Badge>
                    <p className="font-bold text-[#1F2937] mt-1">{formatINR(c.amountPaise)}</p>
                  </div>
                </div>
                <p className="text-[#475569] leading-relaxed">{c.description}</p>
                {c.resolutionNotes && (
                  <p className="text-[11px] text-[#176B2C] bg-[#E8F5E9]/60 px-3 py-1.5 rounded-lg border border-[#A7F3D0]">
                    <strong>Resolution:</strong> {c.resolutionNotes}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

/* ============================================================================
 * TAB 8: SELLER ACTIVITY TIMELINE
 * ========================================================================== */

export interface Seller360TabTimelineProps {
  events: SellerActivityEvent[];
}

export const Seller360TabTimeline: React.FC<Seller360TabTimelineProps> = ({ events }) => {
  const getIconMeta = (type: SellerActivityEvent['type']) => {
    switch (type) {
      case 'REGISTRATION':
        return { icon: <UserCheck className="w-4 h-4" />, cls: 'bg-[#EFF6FF] text-[#2563EB]' };
      case 'KYC_SUBMITTED':
      case 'DOC_UPDATED':
        return { icon: <FileCheck2 className="w-4 h-4" />, cls: 'bg-[#FEF3C7] text-[#D97706]' };
      case 'KYC_APPROVED':
      case 'STORE_ACTIVATED':
      case 'STORE_UNSUSPENDED':
        return { icon: <CheckCircle2 className="w-4 h-4" />, cls: 'bg-[#E8F5E9] text-[#218838]' };
      case 'KYC_REJECTED':
      case 'STORE_SUSPENDED':
        return { icon: <ShieldAlert className="w-4 h-4" />, cls: 'bg-[#FEE2E2] text-[#DC2626]' };
      case 'KYC_CHANGES_REQUESTED':
      case 'STORE_DEACTIVATED':
        return { icon: <AlertTriangle className="w-4 h-4" />, cls: 'bg-[#FEF3C7] text-[#D97706]' };
      case 'PRODUCT_ADDED':
      case 'PRODUCT_APPROVED':
        return { icon: <Package className="w-4 h-4" />, cls: 'bg-purple-100 text-purple-700' };
      case 'ORDER_RECEIVED':
        return { icon: <ShoppingBag className="w-4 h-4" />, cls: 'bg-[#E8F5E9] text-[#176B2C]' };
      case 'SETTLEMENT_PROCESSED':
        return { icon: <Wallet className="w-4 h-4" />, cls: 'bg-[#EFF6FF] text-[#2563EB]' };
      default:
        return { icon: <Store className="w-4 h-4" />, cls: 'bg-slate-100 text-slate-700' };
    }
  };

  if (events.length === 0) {
    return (
      <EmptyState
        icon={<Clock className="w-6 h-6" />}
        title="No activity recorded yet"
        description="Seller registration, KYC, product, order, settlement, and admin events will appear chronologically here."
      />
    );
  }

  return (
    <div className="space-y-4 text-left text-xs">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-black text-[#1F2937] flex items-center gap-1.5">
          <Clock className="w-4 h-4 text-[#218838]" /> Complete Seller Activity Timeline
        </h4>
        <Badge variant="neutral" size="sm">
          {events.length} Events
        </Badge>
      </div>

      <div className="relative pl-6 space-y-3.5 before:content-[''] before:absolute before:left-[15px] before:top-3 before:bottom-3 before:w-0.5 before:bg-[#E5E7EB]">
        {events.map((ev) => {
          const meta = getIconMeta(ev.type);
          return (
            <div key={ev.id} className="relative">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center absolute -left-6 top-1 border-2 border-white shadow-xs ${meta.cls}`}
              >
                {meta.icon}
              </div>
              <div className="ml-4 bg-white rounded-2xl border border-[#E5E7EB] p-3.5 shadow-2xs space-y-1">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <p className="font-bold text-[#1F2937]">{ev.title}</p>
                  <span className="font-mono text-[10px] text-[#6B7280]">
                    {formatDateTime(ev.timestamp)}
                  </span>
                </div>
                <p className="text-[#475569] leading-relaxed">{ev.description}</p>
                {ev.reason && (
                  <p className="text-[11px] font-semibold text-[#92400E] bg-[#FEF3C7]/50 px-2.5 py-1 rounded-lg inline-block mt-1">
                    Reason: {ev.reason}
                  </p>
                )}
                <p className="text-[10px] text-[#6B7280] pt-0.5">
                  Actor: <strong className="text-[#475569]">{ev.actor}</strong>
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
