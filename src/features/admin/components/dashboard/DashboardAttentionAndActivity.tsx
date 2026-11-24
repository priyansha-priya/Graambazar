/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useState } from 'react';
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  Bell,
  CheckCircle2,
  CreditCard,
  FileWarning,
  Headphones,
  MessageSquareWarning,
  Package,
  PackageCheck,
  RotateCcw,
  ShieldCheck,
  ShoppingBag,
  Store,
  UserCheck,
  Wallet,
} from 'lucide-react';
import { AdminViewType } from '../../../../components/layout/AdminSidebar';
import { Badge } from '../../../../components/ui/Badge';
import { Button } from '../../../../components/ui/Button';
import {
  DashboardActivityCategory,
  DashboardActivityItem,
  DashboardActivityKind,
  PendingAdminAlertItem,
} from './dashboardHelpers';

/* ============================================================================
 * 1. PENDING ACTIONS / ADMIN ATTENTION WIDGET (Section 9)
 * ========================================================================== */

export interface PendingAdminActionsWidgetProps {
  alerts: PendingAdminAlertItem[];
  onNavigate: (view: AdminViewType) => void;
}

const ALERT_ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  pending_seller_kyc: FileWarning,
  pending_products: Package,
  pending_refunds: RotateCcw,
  failed_payments: AlertCircle,
  open_disputes: Headphones,
  pending_settlements: Wallet,
  flagged_reviews: MessageSquareWarning,
};

export const PendingAdminActionsWidget: React.FC<PendingAdminActionsWidgetProps> = ({
  alerts,
  onNavigate,
}) => {
  const totalActionItems = alerts.reduce((sum, a) => sum + a.count, 0);
  const activeAlertsCount = alerts.filter((a) => a.count > 0).length;

  return (
    <section className="bg-white rounded-2xl border border-[#E5E7EB] p-5 shadow-xs flex flex-col justify-between gap-4 h-full">
      <div className="space-y-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                totalActionItems > 0
                  ? 'bg-amber-50 text-[#D97706]'
                  : 'bg-[#E8F5E9] text-[#218838]'
              }`}
            >
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[#1F2937]">
                Pending Actions &amp; Alerts
              </h2>
              <p className="text-xs text-[#6B7280]">
                {activeAlertsCount > 0
                  ? `${activeAlertsCount} queue${activeAlertsCount > 1 ? 's' : ''} requiring admin attention`
                  : 'All operational queues are clear'}
              </p>
            </div>
          </div>

          <Badge
            variant={totalActionItems > 0 ? 'warning' : 'success'}
            size="sm"
            dot
          >
            {totalActionItems} Open
          </Badge>
        </div>

        <div className="space-y-2">
          {alerts.map((alert) => {
            const Icon = ALERT_ICON_MAP[alert.id] || AlertTriangle;
            const hasPending = alert.count > 0;

            const toneClasses = !hasPending
              ? {
                  row: 'bg-[#F8FAFC] border-[#E5E7EB] hover:border-[#CBD5E1]',
                  icon: 'bg-emerald-50 text-[#16A34A]',
                  badge: 'neutral' as const,
                }
              : alert.severity === 'CRITICAL'
              ? {
                  row: 'bg-red-50/40 border-red-200/80 hover:border-red-400',
                  icon: 'bg-red-100 text-[#DC2626]',
                  badge: 'error' as const,
                }
              : alert.severity === 'WARNING'
              ? {
                  row: 'bg-amber-50/40 border-amber-200/80 hover:border-amber-400',
                  icon: 'bg-amber-100 text-[#D97706]',
                  badge: 'warning' as const,
                }
              : {
                  row: 'bg-blue-50/40 border-blue-200/80 hover:border-blue-400',
                  icon: 'bg-blue-100 text-[#2563EB]',
                  badge: 'info' as const,
                };

            return (
              <button
                key={alert.id}
                type="button"
                onClick={() => onNavigate(alert.targetView)}
                className={`w-full text-left p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 group ${toneClasses.row}`}
              >
                <div className="flex items-start gap-2.5 min-w-0">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${toneClasses.icon}`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <p className="text-xs font-bold text-[#1F2937] group-hover:text-[#218838] transition-colors">
                        {alert.title}
                      </p>
                    </div>
                    <p className="text-[11px] text-[#6B7280] leading-snug mt-0.5 line-clamp-2">
                      {alert.description}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Badge variant={toneClasses.badge} size="sm">
                    {alert.count}
                  </Badge>
                  <ArrowRight className="w-3.5 h-3.5 text-[#9CA3AF] group-hover:text-[#218838] group-hover:translate-x-0.5 transition-all" />
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
};

/* ============================================================================
 * 2. RECENT PLATFORM ACTIVITY FEED WIDGET (Section 10)
 * ========================================================================== */

export interface RecentActivityFeedWidgetProps {
  activities: DashboardActivityItem[];
  onOpenOrder: (orderId: string) => void;
  onOpenSeller: (sellerId: string) => void;
  onNavigate: (view: AdminViewType) => void;
}

const CATEGORY_FILTERS: { key: 'ALL' | DashboardActivityCategory; label: string }[] = [
  { key: 'ALL', label: 'All' },
  { key: 'ORDERS', label: 'Orders' },
  { key: 'SELLERS', label: 'Sellers' },
  { key: 'FINANCE', label: 'Finance' },
  { key: 'CATALOG', label: 'Products' },
  { key: 'ADMIN', label: 'Admin' },
];

const ACTIVITY_STYLE: Record<
  DashboardActivityKind,
  {
    icon: React.ComponentType<{ className?: string }>;
    tone: string;
    label: string;
    badgeVariant: 'primary' | 'success' | 'warning' | 'info' | 'neutral';
  }
> = {
  ORDER_PLACED: {
    icon: ShoppingBag,
    tone: 'bg-blue-50 text-[#2563EB]',
    label: 'Order Placed',
    badgeVariant: 'info',
  },
  ORDER_COMPLETED: {
    icon: CheckCircle2,
    tone: 'bg-emerald-50 text-[#16A34A]',
    label: 'Order Completed',
    badgeVariant: 'success',
  },
  SELLER_REGISTERED: {
    icon: Store,
    tone: 'bg-amber-50 text-[#D97706]',
    label: 'Seller Registered',
    badgeVariant: 'warning',
  },
  SELLER_APPROVED: {
    icon: UserCheck,
    tone: 'bg-[#E8F5E9] text-[#218838]',
    label: 'Seller Approved',
    badgeVariant: 'success',
  },
  PRODUCT_ADDED: {
    icon: Package,
    tone: 'bg-purple-50 text-purple-700',
    label: 'Product Added',
    badgeVariant: 'neutral',
  },
  PRODUCT_APPROVED: {
    icon: PackageCheck,
    tone: 'bg-emerald-50 text-[#16A34A]',
    label: 'Product Approved',
    badgeVariant: 'success',
  },
  PAYMENT_RECEIVED: {
    icon: CreditCard,
    tone: 'bg-[#E8F5E9] text-[#218838]',
    label: 'Payment Received',
    badgeVariant: 'success',
  },
  SETTLEMENT_COMPLETED: {
    icon: Wallet,
    tone: 'bg-blue-50 text-[#2563EB]',
    label: 'Settlement Done',
    badgeVariant: 'primary',
  },
  REFUND_PROCESSED: {
    icon: RotateCcw,
    tone: 'bg-amber-50 text-[#D97706]',
    label: 'Refund Processed',
    badgeVariant: 'warning',
  },
  ADMIN_ACTION: {
    icon: ShieldCheck,
    tone: 'bg-slate-100 text-[#475569]',
    label: 'Admin Action',
    badgeVariant: 'neutral',
  },
};

const formatActivityTimestamp = (iso: string): string => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const diffMs = Date.now() - d.getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins >= 0 && mins < 1) return 'Just now';
  if (mins >= 1 && mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs >= 1 && hrs < 24) return `${hrs}h ago`;
  return d.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const RecentActivityFeedWidget: React.FC<RecentActivityFeedWidgetProps> = ({
  activities,
  onOpenOrder,
  onOpenSeller,
  onNavigate,
}) => {
  const [categoryFilter, setCategoryFilter] = useState<'ALL' | DashboardActivityCategory>('ALL');

  const visibleActivities = useMemo(() => {
    const filtered =
      categoryFilter === 'ALL'
        ? activities
        : activities.filter((a) => a.category === categoryFilter);
    return filtered.slice(0, 10);
  }, [activities, categoryFilter]);

  const handleClickActivity = (item: DashboardActivityItem) => {
    if (item.orderId) {
      onOpenOrder(item.orderId);
      return;
    }
    if (item.sellerId) {
      onOpenSeller(item.sellerId);
      return;
    }
    if (item.targetView) {
      onNavigate(item.targetView);
    }
  };

  return (
    <section className="bg-white rounded-2xl border border-[#E5E7EB] p-5 shadow-xs space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-[#F1F5F9] text-[#1F2937] flex items-center justify-center shrink-0">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-[#1F2937]">Recent Platform Activity</h2>
            <p className="text-xs text-[#6B7280]">
              Chronological events aggregated from orders, sellers, products, finance, and audit logs
            </p>
          </div>
        </div>

        <Button
          variant="secondary"
          size="sm"
          onClick={() => onNavigate('AUDIT_LOGS')}
          rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
        >
          View Audit Logs
        </Button>
      </div>

      {/* Category Filter Pills */}
      <div className="flex items-center gap-1.5 flex-wrap">
        {CATEGORY_FILTERS.map((cat) => (
          <button
            key={cat.key}
            type="button"
            onClick={() => setCategoryFilter(cat.key)}
            className={`px-3 py-1 rounded-full text-xs font-semibold border transition-colors cursor-pointer ${
              categoryFilter === cat.key
                ? 'bg-[#218838] text-white border-[#218838]'
                : 'bg-[#F8FAFC] text-[#475569] border-[#E5E7EB] hover:border-[#218838]/50 hover:text-[#1F2937]'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {visibleActivities.length === 0 ? (
        <div className="p-8 text-center rounded-xl bg-[#F8FAFC] border border-dashed border-[#E5E7EB] text-xs text-[#6B7280]">
          No platform activity recorded for this category yet.
        </div>
      ) : (
        <div className="divide-y divide-[#F1F5F9] border border-[#E5E7EB] rounded-xl overflow-hidden">
          {visibleActivities.map((item) => {
            const style = ACTIVITY_STYLE[item.kind];
            const Icon = style.icon;
            const clickable = Boolean(item.orderId || item.sellerId || item.targetView);

            return (
              <button
                key={item.id}
                type="button"
                disabled={!clickable}
                onClick={() => handleClickActivity(item)}
                className={`w-full text-left p-3.5 bg-white transition-colors flex items-start justify-between gap-3 ${
                  clickable ? 'hover:bg-[#F8FAFC] cursor-pointer group' : 'cursor-default'
                }`}
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${style.tone}`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-xs font-bold text-[#1F2937] group-hover:text-[#218838] transition-colors truncate">
                        {item.title}
                      </p>
                      <Badge variant={style.badgeVariant} size="sm">
                        {style.label}
                      </Badge>
                    </div>
                    <p className="text-[11px] text-[#475569] mt-0.5 line-clamp-2">
                      {item.description}
                    </p>
                    <p className="text-[10px] text-[#6B7280] mt-1">
                      By <span className="font-semibold text-[#475569]">{item.actor}</span>
                    </p>
                  </div>
                </div>

                <span className="text-[11px] font-medium text-[#6B7280] whitespace-nowrap shrink-0 mt-0.5">
                  {formatActivityTimestamp(item.timestamp)}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
};
