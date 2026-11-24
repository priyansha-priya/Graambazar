import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  EyeOff,
  MessageSquare,
  Search,
  Star,
  Trash2,
} from 'lucide-react';
import { useAdmin } from '../../contexts/AdminContext';
import { CustomerReviewRecord } from '../../types/admin';
import { KPICard } from '../../components/data-display/KPICard';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { ConfirmDialog } from '../../components/feedback/ConfirmDialog';
import { EmptyState } from '../../components/feedback/EmptyState';
import { VerticalBadge } from './components/VerticalBadge';

export const AdminReviewsView: React.FC = () => {
  const { reviews, moderateReview, deleteReview, hasPermission } = useAdmin();
  const canManage = hasPermission('REVIEWS', 'manage');

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | CustomerReviewRecord['status']>('ALL');
  const [ratingFilter, setRatingFilter] = useState<'ALL' | 'LOW' | 'HIGH'>('ALL');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const filteredReviews = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return reviews.filter((r) => {
      const matchesQ =
        !q ||
        r.customerName.toLowerCase().includes(q) ||
        r.sellerName.toLowerCase().includes(q) ||
        r.comment.toLowerCase().includes(q) ||
        r.orderId.toLowerCase().includes(q);
      const matchesStatus = statusFilter === 'ALL' || r.status === statusFilter;
      const matchesRating =
        ratingFilter === 'ALL' ||
        (ratingFilter === 'LOW' ? r.rating <= 2 : r.rating >= 4);
      return matchesQ && matchesStatus && matchesRating;
    });
  }, [reviews, searchQuery, statusFilter, ratingFilter]);

  const avgRating = reviews.length
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : '0.0';
  const flaggedCount = reviews.filter((r) => r.status === 'FLAGGED').length;
  const hiddenCount = reviews.filter((r) => r.status === 'HIDDEN').length;

  return (
    <div className="space-y-6 animate-fade-in text-left">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <h1 className="text-xl font-black text-[#1F2937]">Reviews &amp; Ratings Moderation</h1>
            <Badge variant="primary">Quality &amp; Trust</Badge>
          </div>
          <p className="text-xs text-[#6B7280]">
            Moderate customer ratings, filter spam or abusive comments, and catch low-rating alerts early.
          </p>
        </div>
      </div>

      {toastMsg && (
        <div className="bg-[#E8F5E9] border border-[#218838]/30 text-[#176B2C] px-4 py-3 rounded-xl text-sm font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <KPICard
          title="Average Rating"
          value={`${avgRating} ★`}
          helperText={`Across ${reviews.length} customer reviews`}
          icon={<Star className="w-5 h-5" />}
          iconBgClass="bg-[#FEF3C7] text-[#D97706]"
        />
        <KPICard
          title="Published Reviews"
          value={reviews.filter((r) => r.status === 'PUBLISHED').length}
          helperText="Visible on buyer storefronts"
          icon={<MessageSquare className="w-5 h-5" />}
          iconBgClass="bg-[#E8F5E9] text-[#218838]"
        />
        <KPICard
          title="Flagged for Review"
          value={flaggedCount}
          helperText="Low rating or spam alerts"
          icon={<AlertTriangle className="w-5 h-5" />}
          iconBgClass="bg-[#FEE2E2] text-[#DC2626]"
        />
        <KPICard
          title="Hidden by Admin"
          value={hiddenCount}
          helperText="Suppressed from public view"
          icon={<EyeOff className="w-5 h-5" />}
          iconBgClass="bg-[#F1F5F9] text-[#475569]"
        />
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] p-4 shadow-xs flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-[#6B7280] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by buyer, shop name, order ID, or review text..."
            className="w-full h-10 pl-10 pr-4 text-xs border border-[#E5E7EB] rounded-xl focus:outline-none focus:border-[#218838]"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as 'ALL' | CustomerReviewRecord['status'])}
          className="h-10 px-3 text-xs font-semibold text-[#1F2937] bg-white border border-[#E5E7EB] rounded-xl"
        >
          <option value="ALL">All Statuses</option>
          <option value="PUBLISHED">Published</option>
          <option value="FLAGGED">Flagged</option>
          <option value="HIDDEN">Hidden</option>
        </select>
        <select
          value={ratingFilter}
          onChange={(e) => setRatingFilter(e.target.value as 'ALL' | 'LOW' | 'HIGH')}
          className="h-10 px-3 text-xs font-semibold text-[#1F2937] bg-white border border-[#E5E7EB] rounded-xl"
        >
          <option value="ALL">All Ratings</option>
          <option value="LOW">Low (1–2 ★)</option>
          <option value="HIGH">Positive (4–5 ★)</option>
        </select>
      </div>

      {/* Reviews List */}
      {filteredReviews.length === 0 ? (
        <EmptyState
          icon={<MessageSquare className="w-7 h-7" />}
          title="No reviews match the current filter"
          description="Adjust status or rating filters to inspect all buyer feedback."
        />
      ) : (
        <div className="space-y-3">
          {filteredReviews.map((rev) => (
            <div
              key={rev.id}
              className="bg-white rounded-2xl border border-[#E5E7EB] p-5 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4"
            >
              <div className="space-y-2 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-black px-2 py-0.5 rounded-lg bg-[#FEF3C7] text-[#B45309]">
                    {rev.rating}.0 ★
                  </span>
                  <span className="text-sm font-bold text-[#1F2937]">{rev.sellerName}</span>
                  <VerticalBadge vertical={rev.vertical} />
                  <Badge
                    variant={
                      rev.status === 'PUBLISHED'
                        ? 'success'
                        : rev.status === 'FLAGGED'
                        ? 'error'
                        : 'neutral'
                    }
                    size="sm"
                    dot
                  >
                    {rev.status}
                  </Badge>
                </div>

                <p className="text-xs text-[#1F2937] leading-relaxed">{rev.comment}</p>

                {rev.flagReason && (
                  <p className="text-[11px] font-semibold text-[#DC2626]">
                    Alert: {rev.flagReason}
                  </p>
                )}

                <p className="text-[11px] text-[#6B7280]">
                  By <strong>{rev.customerName}</strong> &middot; Order {rev.orderId} &middot;{' '}
                  {rev.villageName}
                </p>
              </div>

              {canManage && (
                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  {rev.status !== 'PUBLISHED' && (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => {
                        moderateReview(rev.id, 'PUBLISHED', 'Verified and approved by Admin');
                        showToast(`Published review for ${rev.sellerName}.`);
                      }}
                    >
                      Approve
                    </Button>
                  )}
                  {rev.status !== 'HIDDEN' && (
                    <Button
                      variant="secondary"
                      size="sm"
                      leftIcon={<EyeOff className="w-3.5 h-3.5" />}
                      onClick={() => {
                        moderateReview(rev.id, 'HIDDEN', 'Hidden during moderation review');
                        showToast(`Hidden review ${rev.id} from storefront.`);
                      }}
                    >
                      Hide
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setDeleteId(rev.id)}
                  >
                    <Trash2 className="w-3.5 h-3.5 text-[#DC2626]" />
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog
        isOpen={Boolean(deleteId)}
        onClose={() => setDeleteId(null)}
        onConfirm={() => {
          if (deleteId) {
            deleteReview(deleteId);
            showToast('Deleted abusive review permanently.');
          }
          setDeleteId(null);
        }}
        title="Delete Customer Review?"
        message="This permanently removes the review record and logs the deletion in the audit trail."
        confirmText="Delete Review"
        isDestructive
      />
    </div>
  );
};
