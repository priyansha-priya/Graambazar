/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  ArrowUpRight,
  Ban,
  CalendarClock,
  CheckCircle,
  CheckCircle2,
  Clock,
  Eye,
  FileWarning,
  IndianRupee,
  MapPin,
  Package,
  PackageCheck,
  PackageX,
  Receipt,
  ShieldCheck,
  ShoppingBag,
  Star,
  Store,
  UserCheck,
  Users,
  Wallet,
} from 'lucide-react';
import { useAdmin } from '../../contexts/AdminContext';
import { useOrders } from '../../contexts/OrderContext';
import { MasterSellerRecord } from '../../types/admin';
import { Order, OrderStatus } from '../../types/order';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { KPICard } from '../../components/data-display/KPICard';
import { Breadcrumbs } from '../../components/layout/Breadcrumbs';
import { VerticalBadge } from './components/VerticalBadge';
import { formatINR } from '../../utils/currency';
import { AdminViewType } from '../../components/layout/AdminSidebar';
import { AdminOrderDetailDrawer } from './components/AdminOrderDetailDrawer';
import { Seller360Drawer } from './components/sellers/Seller360Drawer';
import {
  SellerGovernanceActionType,
  SellerGovernanceModal,
} from './components/sellers/SellerActionModals';
import { SELLER_STATUS_META } from './components/sellers/seller360Helpers';
import {
  DashboardDatePreset,
  buildDashboardActivityFeed,
  computeDashboardKpis,
  computePendingAdminAlerts,
  computeTopSellers,
  computeTopSellingProducts,
  computeVerticalOverview,
  computeVillageSalesOverview,
} from './components/dashboard/dashboardHelpers';
import { DashboardTrendsSection } from './components/dashboard/DashboardTrendsSection';
import {
  PlatformRevenueOverviewCard,
  RecentOrdersWidget,
  TopSellingProductsWidget,
  VillageSalesOverviewWidget,
} from './components/dashboard/DashboardPerformanceWidgets';
import {
  PendingAdminActionsWidget,
  RecentActivityFeedWidget,
} from './components/dashboard/DashboardAttentionAndActivity';

interface AdminDashboardViewProps {
  onNavigate: (view: AdminViewType) => void;
}

interface DashboardKpiTile {
  label: string;
  value: string | number;
  helper: string;
  badgeText?: string;
  icon: React.ComponentType<{ className?: string }>;
  iconBg: string;
  targetView: AdminViewType;
  actionLabel: string;
}

export const AdminDashboardView: React.FC<AdminDashboardViewProps> = ({ onNavigate }) => {
  const {
    currentAdmin,
    sellers,
    verticalConfigs,
    categories,
    products,
    customers,
    payouts,
    paymentTransactions,
    refundLedger,
    applications,
    pendingProductsCount,
    pendingApplicationsCount,
    serviceAreas,
    openSupportCasesCount,
    offers,
    reviews,
    auditLogs,
    updateSellerStatus,
    requestSellerKycChanges,
  } = useAdmin();

  const {
    orders,
    transitionOrder,
    adminCancelOrder,
    recordOrderReturn,
    processOrderRefund,
  } = useOrders();

  // Dynamic Trend Date Filter state (default Last 7 Days for real live orders)
  const [datePreset, setDatePreset] = useState<DashboardDatePreset>('7D');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');

  // Reusable detail drawers (zero duplicate order/seller detail systems)
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [selectedSellerId, setSelectedSellerId] = useState<string | null>(null);
  const [governanceTarget, setGovernanceTarget] = useState<{
    seller: MasterSellerRecord;
    action: SellerGovernanceActionType;
  } | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const showFeedback = (msg: string) => {
    setFeedback(msg);
    setTimeout(() => setFeedback(null), 3500);
  };

  const selectedOrder: Order | null = useMemo(
    () => (selectedOrderId ? orders.find((o) => o.id === selectedOrderId) || null : null),
    [orders, selectedOrderId]
  );

  const selectedSeller: MasterSellerRecord | null = useMemo(
    () => (selectedSellerId ? sellers.find((s) => s.id === selectedSellerId) || null : null),
    [sellers, selectedSellerId]
  );

  // All business metrics computed dynamically from live context state
  const kpis = useMemo(
    () =>
      computeDashboardKpis({
        sellers,
        orders,
        customers,
        products,
        serviceAreas,
        payouts,
        paymentTransactions,
        refundLedger,
        applications,
      }),
    [
      sellers,
      orders,
      customers,
      products,
      serviceAreas,
      payouts,
      paymentTransactions,
      refundLedger,
      applications,
    ]
  );

  const verticalOverview = useMemo(
    () => computeVerticalOverview(verticalConfigs, sellers, products, orders),
    [verticalConfigs, sellers, products, orders]
  );

  const topSellers = useMemo(
    () => computeTopSellers(sellers, orders, products, payouts, refundLedger),
    [sellers, orders, products, payouts, refundLedger]
  );

  const topSellingProducts = useMemo(
    () => computeTopSellingProducts(orders, products, categories, 5),
    [orders, products, categories]
  );

  const villageSales = useMemo(
    () => computeVillageSalesOverview(serviceAreas, sellers, orders, customers),
    [serviceAreas, sellers, orders, customers]
  );

  const pendingAlerts = useMemo(
    () =>
      computePendingAdminAlerts({
        kpis,
        pendingProductsCount,
        openSupportCasesCount,
        reviews,
      }),
    [kpis, pendingProductsCount, openSupportCasesCount, reviews]
  );

  const recentActivities = useMemo(
    () =>
      buildDashboardActivityFeed({
        orders,
        sellers,
        products,
        paymentTransactions,
        payouts,
        refundLedger,
        auditLogs,
        limit: 30,
      }),
    [orders, sellers, products, paymentTransactions, payouts, refundLedger, auditLogs]
  );

  const activeVerticalsCount = verticalConfigs.filter((v) => v.isEnabled).length;
  const foodSellers = sellers.filter((s) => s.vertical === 'FOOD');
  const foodFssaiRate = foodSellers.length
    ? Math.round((foodSellers.filter((s) => s.fssaiVerified).length / foodSellers.length) * 100)
    : 100;

  // All 18 required business KPIs grouped into 3 consistent rows using shared KPICard
  const activeProductPct =
    kpis.totalProducts > 0
      ? Math.round((kpis.activeProducts / kpis.totalProducts) * 100)
      : 0;
  const activeSellerPct =
    kpis.totalSellers > 0
      ? Math.round((kpis.activeSellers / kpis.totalSellers) * 100)
      : 0;

  const kpiGroups: { title: string; tiles: DashboardKpiTile[] }[] = [
    {
      title: 'Orders & Gross Merchandise Value',
      tiles: [
        {
          label: 'Total GMV',
          value: formatINR(kpis.totalGmvPaise),
          helper: 'Settlement ledger gross sales',
          icon: IndianRupee,
          iconBg: 'bg-[#E8F5E9] text-[#218838]',
          targetView: 'PAYOUTS',
          actionLabel: 'Finance',
        },
        {
          label: 'Total Orders',
          value: kpis.totalOrders.toLocaleString('en-IN'),
          helper: `${kpis.returnedOrRefundedOrders} returned / refunded`,
          icon: ShoppingBag,
          iconBg: 'bg-[#EFF6FF] text-[#2563EB]',
          targetView: 'ORDERS',
          actionLabel: 'Orders',
        },
        {
          label: "Today's Orders",
          value: kpis.todaysOrders.toLocaleString('en-IN'),
          helper: 'Placed on current calendar day',
          icon: CalendarClock,
          iconBg: 'bg-indigo-50 text-indigo-600',
          targetView: 'ORDERS',
          actionLabel: 'Orders',
        },
        {
          label: 'Completed Orders',
          value: kpis.completedOrders.toLocaleString('en-IN'),
          helper: 'Delivered & fulfilled',
          icon: CheckCircle2,
          iconBg: 'bg-emerald-50 text-[#16A34A]',
          targetView: 'ORDERS',
          actionLabel: 'Orders',
        },
        {
          label: 'Pending Orders',
          value: kpis.pendingOrders.toLocaleString('en-IN'),
          helper: 'Active fulfillment pipeline',
          icon: Clock,
          iconBg: 'bg-amber-50 text-[#D97706]',
          targetView: 'ORDERS',
          actionLabel: 'Orders',
        },
        {
          label: 'Cancelled Orders',
          value: kpis.cancelledOrders.toLocaleString('en-IN'),
          helper: 'Cancelled, rejected & failed',
          icon: Ban,
          iconBg: 'bg-red-50 text-[#DC2626]',
          targetView: 'ORDERS',
          actionLabel: 'Orders',
        },
      ],
    },
    {
      title: 'Customers, Sellers & Villages',
      tiles: [
        {
          label: 'Total Customers',
          value: kpis.totalCustomers.toLocaleString('en-IN'),
          helper: 'Registered village buyers',
          icon: Users,
          iconBg: 'bg-blue-50 text-[#2563EB]',
          targetView: 'CUSTOMERS',
          actionLabel: 'Customers',
        },
        {
          label: 'Active Customers',
          value: kpis.activeCustomers.toLocaleString('en-IN'),
          helper: `${kpis.totalCustomers - kpis.activeCustomers} blocked / inactive`,
          icon: UserCheck,
          iconBg: 'bg-emerald-50 text-[#16A34A]',
          targetView: 'CUSTOMERS',
          actionLabel: 'Customers',
        },
        {
          label: 'Total Sellers',
          value: kpis.totalSellers.toLocaleString('en-IN'),
          helper: 'Registered village stores',
          icon: Store,
          iconBg: 'bg-slate-100 text-[#475569]',
          targetView: 'SELLERS',
          actionLabel: 'Sellers',
        },
        {
          label: 'Active Sellers',
          value: kpis.activeSellers.toLocaleString('en-IN'),
          badgeText: `${activeSellerPct}% live`,
          helper: `Live across ${activeVerticalsCount} verticals`,
          icon: ShieldCheck,
          iconBg: 'bg-[#E8F5E9] text-[#218838]',
          targetView: 'SELLERS',
          actionLabel: 'Sellers',
        },
        {
          label: 'Pending Seller KYC',
          value: kpis.pendingSellerKyc.toLocaleString('en-IN'),
          helper: `${kpis.pendingApplicationsCount} onboarding app(s)`,
          icon: FileWarning,
          iconBg: 'bg-amber-50 text-[#D97706]',
          targetView:
            kpis.pendingSellerKyc > 0 ? 'SELLERS' : 'APPLICATIONS',
          actionLabel: 'Review KYC',
        },
        {
          label: 'Total Villages',
          value: kpis.totalVillages.toLocaleString('en-IN'),
          helper: `${kpis.activeVillages} active service areas`,
          icon: MapPin,
          iconBg: 'bg-purple-50 text-purple-700',
          targetView: 'SERVICE_AREAS',
          actionLabel: 'Villages',
        },
      ],
    },
    {
      title: 'Catalog & Platform Finance',
      tiles: [
        {
          label: 'Total Products',
          value: kpis.totalProducts.toLocaleString('en-IN'),
          helper: `${pendingProductsCount} pending moderation`,
          icon: Package,
          iconBg: 'bg-purple-50 text-purple-700',
          targetView: 'PRODUCTS',
          actionLabel: 'Products',
        },
        {
          label: 'Active Products',
          value: kpis.activeProducts.toLocaleString('en-IN'),
          badgeText: `${activeProductPct}% live`,
          helper: 'Visible in customer storefront',
          icon: PackageCheck,
          iconBg: 'bg-emerald-50 text-[#16A34A]',
          targetView: 'PRODUCTS',
          actionLabel: 'Products',
        },
        {
          label: 'Inactive Products',
          value: kpis.inactiveProducts.toLocaleString('en-IN'),
          helper: 'Hidden or disabled SKUs',
          icon: PackageX,
          iconBg: 'bg-slate-100 text-[#6B7280]',
          targetView: 'PRODUCTS',
          actionLabel: 'Products',
        },
        {
          label: 'Platform Commission Revenue',
          value: formatINR(kpis.finance.totalCommissionPaise),
          helper: `Net earnings ${formatINR(kpis.finance.netPlatformEarningsPaise)}`,
          icon: Receipt,
          iconBg: 'bg-[#E8F5E9] text-[#218838]',
          targetView: 'PAYOUTS',
          actionLabel: 'Finance',
        },
        {
          label: 'Pending Payments',
          value: formatINR(kpis.finance.pendingPaymentsPaise),
          helper: `${kpis.finance.pendingPaymentsCount} pending transaction(s)`,
          icon: Clock,
          iconBg: 'bg-amber-50 text-[#D97706]',
          targetView: 'PAYOUTS',
          actionLabel: 'Payments',
        },
        {
          label: 'Pending Seller Settlements',
          value: formatINR(kpis.finance.pendingSellerSettlementsPaise),
          helper: `${kpis.finance.pendingSellerSettlementsCount} batch(es) pending`,
          icon: Wallet,
          iconBg: 'bg-orange-50 text-[#D97706]',
          targetView: 'PAYOUTS',
          actionLabel: 'Settlements',
        },
      ],
    },
  ];

  // Governance modal submission (for actions triggered inside Seller360Drawer)
  const handleConfirmGovernance = (
    sellerId: string,
    action: SellerGovernanceActionType,
    reason: string
  ) => {
    let res: { success: boolean; message: string };
    switch (action) {
      case 'APPROVE':
        res = updateSellerStatus(sellerId, 'APPROVED', reason || 'Approved by Admin');
        break;
      case 'REJECT':
        res = updateSellerStatus(sellerId, 'REJECTED', reason);
        break;
      case 'REQUEST_KYC_CHANGES':
        res = requestSellerKycChanges(sellerId, reason);
        break;
      case 'ACTIVATE':
        res = updateSellerStatus(sellerId, 'ACTIVE', reason || 'Activated by Admin');
        break;
      case 'DEACTIVATE':
        res = updateSellerStatus(sellerId, 'INACTIVE', reason);
        break;
      case 'SUSPEND':
        res = updateSellerStatus(sellerId, 'SUSPENDED', reason);
        break;
      case 'UNSUSPEND':
        res = updateSellerStatus(sellerId, 'ACTIVE', reason);
        break;
    }
    if (res.success) {
      showFeedback(res.message);
      setGovernanceTarget(null);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in text-left">
      {/* Breadcrumb */}
      <Breadcrumbs
        items={[
          { label: 'Admin Panel' },
          { label: 'Dashboard', active: true },
        ]}
      />

      {/* Preserved Top Operations Banner */}
      <div className="p-6 bg-gradient-to-r from-slate-900 via-slate-800 to-[#176B2C] text-white rounded-2xl shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Universal Marketplace Active
            </span>
            <span className="text-xs text-slate-300">
              {activeVerticalsCount} Live Verticals • {kpis.activeVillages} Active Villages
            </span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white">
            GramBazaar Operations Control Center
          </h1>
          <p className="text-xs text-slate-300 mt-1 max-w-2xl">
            Real-time overview of orders, sellers, customers, village coverage, multi-vertical sales, and platform revenue across GramBazaar.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {pendingApplicationsCount > 0 && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => onNavigate('APPLICATIONS')}
              leftIcon={<AlertTriangle className="w-3.5 h-3.5" />}
            >
              {pendingApplicationsCount} KYC App{pendingApplicationsCount > 1 ? 's' : ''} Pending
            </Button>
          )}
          <Button
            variant="secondary"
            size="sm"
            onClick={() => onNavigate('ORDERS')}
            rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
          >
            Manage Orders
          </Button>
        </div>
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold rounded-xl flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-[#16A34A] shrink-0" />
            <span>{feedback}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-emerald-700 hover:text-emerald-900 text-[11px] font-bold cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* SECTION 1 — Comprehensive Business KPI Overview (18 Shared KPICard Tiles, Clickable Navigation) */}
      <div className="space-y-4">
        {kpiGroups.map((group) => (
          <div key={group.title} className="space-y-2">
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#6B7280] px-0.5">
              {group.title}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6 gap-3">
              {group.tiles.map((tile) => {
                const Icon = tile.icon;
                return (
                  <KPICard
                    key={tile.label}
                    title={tile.label}
                    value={tile.value}
                    badgeText={tile.badgeText}
                    helperText={tile.helper}
                    icon={<Icon className="w-4 h-4" />}
                    iconBgClass={tile.iconBg}
                    size="sm"
                    onClick={() => onNavigate(tile.targetView)}
                    actionLabel={tile.actionLabel}
                  />
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* SECTION 2 — Dynamic Sales & Order Trends */}
      <DashboardTrendsSection
        orders={orders}
        datePreset={datePreset}
        onDatePresetChange={setDatePreset}
        customFrom={customFrom}
        onCustomFromChange={setCustomFrom}
        customTo={customTo}
        onCustomToChange={setCustomTo}
      />

      {/* SECTION 8 — Platform Revenue Overview (Reconciled with Payments & Finance) */}
      <PlatformRevenueOverviewCard finance={kpis.finance} onNavigate={onNavigate} />

      {/* ROW 3 — Seller Performance + Top Selling Products */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        <section className="xl:col-span-7 bg-white rounded-2xl border border-[#E5E7EB] p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div>
              <h2 className="text-sm font-bold text-[#1F2937]">Top Sellers Performance</h2>
              <p className="text-xs text-[#6B7280]">
                Ranked by total sales &amp; orders — click any seller to open their Seller 360° profile
              </p>
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => onNavigate('SELLERS')}
              rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
            >
              View All
            </Button>
          </div>

          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-[#F8FAFC] text-[#6B7280] uppercase tracking-wider font-semibold border-y border-[#E5E7EB]">
                <tr>
                  <th className="py-3 px-3">Seller Name</th>
                  <th className="py-3 px-2.5 text-right">Orders</th>
                  <th className="py-3 px-2.5 text-right">Total Sales</th>
                  <th className="py-3 px-2.5 text-center">Rating</th>
                  <th className="py-3 px-2.5 text-right">Active SKUs</th>
                  <th className="py-3 px-2.5">Status</th>
                  <th className="py-3 px-3 text-right">Profile</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E7EB]">
                {topSellers.slice(0, 6).map((row) => {
                  const { seller } = row;
                  const statusMeta = SELLER_STATUS_META[seller.status] || {
                    label: seller.status,
                    variant: 'neutral' as const,
                  };
                  return (
                    <tr
                      key={seller.id}
                      onClick={() => setSelectedSellerId(seller.id)}
                      className="hover:bg-[#F8FAFC] transition-colors cursor-pointer group"
                    >
                      <td className="py-3 px-3">
                        <p className="font-bold text-[#1F2937] group-hover:text-[#218838] transition-colors">
                          {seller.name}
                        </p>
                        <p className="text-[11px] text-[#6B7280]">
                          {seller.villageName} • {seller.ownerName}
                        </p>
                      </td>
                      <td className="py-3 px-2.5 text-right font-bold text-[#1F2937] tabular-nums">
                        {row.totalOrders}
                      </td>
                      <td className="py-3 px-2.5 text-right font-bold text-[#1F2937] tabular-nums whitespace-nowrap">
                        {formatINR(row.totalSalesPaise)}
                      </td>
                      <td className="py-3 px-2.5 text-center whitespace-nowrap">
                        {row.avgRating > 0 ? (
                          <span className="inline-flex items-center gap-1 font-bold text-[#1F2937] bg-amber-50 border border-amber-200/70 px-2 py-0.5 rounded-full text-[11px]">
                            <Star className="w-3 h-3 fill-[#F59E0B] text-[#F59E0B]" />
                            {row.avgRating.toFixed(1)}
                          </span>
                        ) : (
                          <span className="text-[11px] text-[#6B7280]">New</span>
                        )}
                      </td>
                      <td className="py-3 px-2.5 text-right tabular-nums whitespace-nowrap">
                        <span className="font-bold text-[#1F2937]">{row.activeProductCount}</span>
                        <span className="text-[#6B7280]"> / {row.totalProductCount}</span>
                      </td>
                      <td className="py-3 px-2.5 whitespace-nowrap">
                        <Badge variant={statusMeta.variant} size="sm" dot>
                          {statusMeta.label}
                        </Badge>
                      </td>
                      <td
                        className="py-3 px-3 text-right whitespace-nowrap"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedSellerId(seller.id)}
                          leftIcon={<Eye className="w-3.5 h-3.5" />}
                        >
                          360°
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Seller Cards */}
          <div className="md:hidden space-y-2.5">
            {topSellers.slice(0, 6).map((row) => {
              const { seller } = row;
              const statusMeta = SELLER_STATUS_META[seller.status] || {
                label: seller.status,
                variant: 'neutral' as const,
              };
              return (
                <button
                  key={seller.id}
                  type="button"
                  onClick={() => setSelectedSellerId(seller.id)}
                  className="w-full text-left p-3.5 rounded-xl border border-[#E5E7EB] bg-[#F8FAFC] hover:border-[#218838]/60 transition-colors space-y-2 cursor-pointer"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-[#1F2937] truncate">{seller.name}</p>
                      <p className="text-[11px] text-[#6B7280]">
                        {seller.villageName} • {seller.ownerName}
                      </p>
                    </div>
                    <Badge variant={statusMeta.variant} size="sm" dot>
                      {statusMeta.label}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-4 gap-2 pt-2 border-t border-[#E5E7EB] text-center">
                    <div>
                      <p className="text-[10px] text-[#6B7280]">Orders</p>
                      <p className="text-xs font-bold text-[#1F2937]">{row.totalOrders}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-[#6B7280]">Sales</p>
                      <p className="text-xs font-bold text-[#1F2937]">
                        {formatINR(row.totalSalesPaise)}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-[#6B7280]">Rating</p>
                      <p className="text-xs font-bold text-[#1F2937]">
                        {row.avgRating > 0 ? `★ ${row.avgRating.toFixed(1)}` : 'New'}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-[#6B7280]">Active SKUs</p>
                      <p className="text-xs font-bold text-[#1F2937]">{row.activeProductCount}</p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        <div className="xl:col-span-5">
          <TopSellingProductsWidget
            products={topSellingProducts}
            onViewAll={() => onNavigate('PRODUCTS')}
          />
        </div>
      </div>

      {/* ROW 4 — Recent Orders + Pending Admin Actions */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        <div className="xl:col-span-8">
          <RecentOrdersWidget
            orders={orders}
            onSelectOrder={(order) => setSelectedOrderId(order.id)}
            onViewAll={() => onNavigate('ORDERS')}
          />
        </div>
        <div className="xl:col-span-4">
          <PendingAdminActionsWidget
            alerts={pendingAlerts}
            onNavigate={onNavigate}
          />
        </div>
      </div>

      {/* ROW 5 — Village-wise Sales Overview + Business Vertical Overview */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">
        <VillageSalesOverviewWidget
          villages={villageSales}
          onNavigate={onNavigate}
        />

        <section className="bg-white rounded-2xl border border-[#E5E7EB] p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <h2 className="text-sm font-bold text-[#1F2937]">Business Vertical Overview</h2>
              <p className="text-xs text-[#6B7280]">
                Orders, GMV, products, and active sellers across configured marketplace verticals
              </p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => onNavigate('VERTICALS')}>
              Manage Verticals
            </Button>
          </div>

          <div className="space-y-3">
            {verticalOverview.map((v) => (
              <div
                key={v.id}
                className="p-3.5 rounded-xl bg-[#F8FAFC] border border-[#E5E7EB] space-y-2"
              >
                <div className="flex items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2 flex-wrap">
                    <VerticalBadge vertical={v.id} />
                    <span className="font-bold text-[#1F2937]">{v.name}</span>
                    {!v.isEnabled && (
                      <Badge variant="neutral" size="sm">
                        Coming Soon
                      </Badge>
                    )}
                  </div>
                  <div className="text-right font-bold text-[#1F2937] tabular-nums">
                    {formatINR(v.gmvPaise)}{' '}
                    <span className="text-[11px] font-semibold text-[#6B7280]">
                      ({v.pct}%)
                    </span>
                  </div>
                </div>
                <div className="w-full bg-[#E2E8F0] rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-[#218838] h-2 rounded-full transition-all"
                    style={{ width: `${Math.max(v.pct, v.activeSellersCount > 0 ? 4 : 0)}%` }}
                  />
                </div>
                <div className="flex items-center justify-between flex-wrap gap-2 text-[11px] text-[#6B7280]">
                  <span>
                    <strong className="text-[#1F2937]">{v.ordersCount}</strong> orders •{' '}
                    <strong className="text-[#1F2937]">{v.productCount}</strong> products
                  </span>
                  <span>
                    <strong className="text-[#1F2937]">{v.activeSellersCount}</strong> active of{' '}
                    {v.totalSellersCount} seller(s)
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Preserved Compliance Strip */}
          <div className="pt-3 border-t border-[#E5E7EB] flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-[#475569]">
              <ShieldCheck className="w-4 h-4 text-[#218838]" />
              <span>
                Food FSSAI verification rate: <strong>{foodFssaiRate}% of food sellers</strong>
              </span>
            </div>
            {openSupportCasesCount > 0 && (
              <button
                type="button"
                onClick={() => onNavigate('SUPPORT')}
                className="text-amber-700 font-semibold bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200 cursor-pointer hover:bg-amber-100"
              >
                {openSupportCasesCount} Open Support Dispute(s)
              </button>
            )}
          </div>
        </section>
      </div>

      {/* ROW 6 — Recent Platform Activity Feed + Preserved Universal Master Shortcuts */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        <div className="xl:col-span-8">
          <RecentActivityFeedWidget
            activities={recentActivities}
            onOpenOrder={(orderId) => setSelectedOrderId(orderId)}
            onOpenSeller={(sellerId) => setSelectedSellerId(sellerId)}
            onNavigate={onNavigate}
          />
        </div>

        {/* Preserved Dynamic Governance Shortcuts */}
        <section className="xl:col-span-4 bg-white rounded-2xl border border-[#E5E7EB] p-5 shadow-xs space-y-4">
          <h2 className="text-sm font-bold text-[#1F2937]">Universal Master Shortcuts</h2>

          <div className="space-y-2">
            {[
              {
                view: 'PRODUCTS' as AdminViewType,
                title: 'Universal Products & Moderation',
                subtitle: `${products.length} SKUs across all verticals`,
                badge: pendingProductsCount > 0 ? `${pendingProductsCount} Review` : undefined,
                badgeVariant: 'warning' as const,
              },
              {
                view: 'MASTER_CATEGORIES' as AdminViewType,
                title: 'Category & Subcategory Master',
                subtitle: `${categories.length} taxonomy nodes across verticals`,
              },
              {
                view: 'MASTER_UNITS' as AdminViewType,
                title: 'Unit & Measurement Master',
                subtitle: 'Standard & rural units (kg, pav, plate, bori)',
              },
              {
                view: 'SERVICE_AREAS' as AdminViewType,
                title: 'Villages & Neighbor Matrix',
                subtitle: `${kpis.activeVillages} active of ${serviceAreas.length} villages`,
              },
              {
                view: 'OFFERS' as AdminViewType,
                title: 'Offers & Coupons Master',
                subtitle: `${offers.filter((o) => o.isActive).length} active promotions`,
              },
              {
                view: 'UDHARI' as AdminViewType,
                title: 'Udhari / Village Credit Monitor',
                subtitle: 'Seller-segregated khata oversight',
              },
            ].map((item) => (
              <button
                key={item.view}
                type="button"
                onClick={() => onNavigate(item.view)}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-[#F8FAFC] hover:bg-[#F1F5F9] border border-[#E5E7EB] transition-colors cursor-pointer text-left group"
              >
                <div>
                  <p className="text-xs font-bold text-[#1F2937] group-hover:text-[#218838] transition-colors">
                    {item.title}
                  </p>
                  <p className="text-[11px] text-[#6B7280]">{item.subtitle}</p>
                </div>
                {item.badge ? (
                  <Badge variant={item.badgeVariant || 'primary'} size="sm">
                    {item.badge}
                  </Badge>
                ) : (
                  <ArrowUpRight className="w-4 h-4 text-[#9CA3AF]" />
                )}
              </button>
            ))}
          </div>
        </section>
      </div>

      {/* Reused Existing Order Detail Drawer */}
      <AdminOrderDetailDrawer
        order={selectedOrder}
        isOpen={Boolean(selectedOrder)}
        onClose={() => setSelectedOrderId(null)}
        adminName={currentAdmin.name}
        onStatusChange={(orderId: string, nextStatus: OrderStatus, reason?: string) => {
          transitionOrder(orderId, nextStatus, reason, 'ADMIN');
          showFeedback(`Order updated to ${nextStatus.replace(/_/g, ' ')}.`);
        }}
        onCancelOrder={(orderId, payload) => {
          adminCancelOrder(orderId, payload);
          showFeedback('Order cancellation recorded.');
        }}
        onRecordReturn={(orderId, payload) => {
          recordOrderReturn(orderId, payload);
          showFeedback('Order return details recorded.');
        }}
        onProcessRefund={(orderId, payload) => {
          processOrderRefund(orderId, payload);
          showFeedback('Order refund processed.');
        }}
      />

      {/* Reused Existing Seller 360° Drawer */}
      <Seller360Drawer
        seller={selectedSeller}
        isOpen={Boolean(selectedSeller)}
        onClose={() => setSelectedSellerId(null)}
        onTriggerGovernanceAction={(seller, action) =>
          setGovernanceTarget({ seller, action })
        }
        onShowFeedback={showFeedback}
      />

      {/* Reused Existing Seller Governance Confirmation Modal */}
      <SellerGovernanceModal
        seller={governanceTarget?.seller || null}
        action={governanceTarget?.action || null}
        isOpen={Boolean(governanceTarget)}
        onClose={() => setGovernanceTarget(null)}
        onConfirm={handleConfirmGovernance}
      />
    </div>
  );
};
