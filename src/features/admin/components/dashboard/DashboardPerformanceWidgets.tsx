/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  ArrowRight,
  Award,
  CheckCircle2,
  Clock,
  Eye,
  IndianRupee,
  Info,
  MapPin,
  Package,
  Receipt,
  RotateCcw,
  ShoppingBag,
  Store,
  Users,
  Wallet,
} from 'lucide-react';
import { Order } from '../../../../types/order';
import { AdminViewType } from '../../../../components/layout/AdminSidebar';
import { Badge } from '../../../../components/ui/Badge';
import { Button } from '../../../../components/ui/Button';
import { Modal } from '../../../../components/ui/Modal';
import { VerticalBadge } from '../VerticalBadge';
import { formatINR } from '../../../../utils/currency';
import { FinanceOverviewMetrics } from '../finance/financeHelpers';
import {
  ORDER_STATUS_META,
  PAYMENT_STATUS_META,
} from '../orderManagementHelpers';
import { TopSellingProductRow, VillageSalesRow } from './dashboardHelpers';

/* ============================================================================
 * 1. PLATFORM REVENUE OVERVIEW (Uses computeFinanceOverview — zero double-counting)
 * ========================================================================== */

export interface PlatformRevenueOverviewCardProps {
  finance: FinanceOverviewMetrics;
  onNavigate: (view: AdminViewType) => void;
}

export const PlatformRevenueOverviewCard: React.FC<PlatformRevenueOverviewCardProps> = ({
  finance,
  onNavigate,
}) => {
  const items = [
    {
      label: 'Total GMV',
      value: formatINR(finance.gmvPaise),
      note: 'Gross merchant order value (not platform revenue)',
      icon: ShoppingBag,
      tone: 'bg-[#F1F5F9] text-[#475569]',
      valueClass: 'text-[#1F2937]',
    },
    {
      label: 'Total Commission',
      value: formatINR(finance.totalCommissionPaise),
      note: `Plus ${formatINR(finance.platformFeesPaise + finance.otherPlatformIncomePaise)} platform fees`,
      icon: IndianRupee,
      tone: 'bg-[#E8F5E9] text-[#218838]',
      valueClass: 'text-[#218838]',
    },
    {
      label: 'Total Refunds',
      value: formatINR(finance.totalRefundAmountPaise),
      note: `${finance.totalActiveRefundsCount} committed refund(s) • excluded from revenue`,
      icon: RotateCcw,
      tone: 'bg-red-50 text-[#DC2626]',
      valueClass: 'text-[#DC2626]',
    },
    {
      label: 'Net Platform Revenue',
      value: formatINR(finance.netPlatformEarningsPaise),
      note: 'Commission + fees net of refund commission reversal',
      icon: Receipt,
      tone: 'bg-emerald-50 text-[#16A34A]',
      valueClass: 'text-[#16A34A]',
    },
    {
      label: 'Pending Seller Settlement',
      value: formatINR(finance.pendingSellerSettlementsPaise),
      note: `${finance.pendingSellerSettlementsCount} batch(es) awaiting payout`,
      icon: Clock,
      tone: 'bg-amber-50 text-[#D97706]',
      valueClass: 'text-[#D97706]',
    },
    {
      label: 'Completed Settlements',
      value: formatINR(finance.totalSettledPayoutsPaise),
      note: `${finance.settledPayoutsCount} settled batch(es) disbursed`,
      icon: CheckCircle2,
      tone: 'bg-blue-50 text-[#2563EB]',
      valueClass: 'text-[#1F2937]',
    },
  ];

  return (
    <section className="bg-white rounded-2xl border border-[#E5E7EB] p-5 shadow-xs space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-[#E8F5E9] text-[#218838] flex items-center justify-center shrink-0">
            <Wallet className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-[#1F2937]">Platform Revenue Overview</h2>
            <p className="text-xs text-[#6B7280]">
              Reconciled directly with Payments &amp; Finance settlement and refund ledgers
            </p>
          </div>
        </div>

        <Button
          variant="secondary"
          size="sm"
          onClick={() => onNavigate('PAYOUTS')}
          rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
        >
          Open Payments &amp; Finance
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.label}
              className="rounded-xl border border-[#E5E7EB] bg-[#F8FAFC] p-3.5 flex flex-col justify-between gap-2"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-semibold text-[#6B7280] leading-tight">
                  {item.label}
                </span>
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${item.tone}`}
                >
                  <Icon className="w-3.5 h-3.5" />
                </div>
              </div>
              <div>
                <p className={`text-lg font-black tabular-nums ${item.valueClass}`}>
                  {item.value}
                </p>
                <p className="text-[10px] text-[#6B7280] mt-1 leading-snug">{item.note}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#F8FAFC] border border-[#E5E7EB] text-[11px] text-[#475569]">
        <Info className="w-3.5 h-3.5 text-[#2563EB] shrink-0" />
        <span>
          <strong>Accounting Rule:</strong> GMV represents gross customer order value and is strictly separated from Platform Revenue (Commission + Platform Fees). Refunds are deducted from seller payables and never counted as revenue.
        </span>
      </div>
    </section>
  );
};

/* ============================================================================
 * 2. RECENT ORDERS SECTION (Reuses existing AdminOrderDetailDrawer)
 * ========================================================================== */

export interface RecentOrdersWidgetProps {
  orders: Order[];
  onSelectOrder: (order: Order) => void;
  onViewAll: () => void;
}

const formatOrderDate = (iso: string): string => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const RecentOrdersWidget: React.FC<RecentOrdersWidgetProps> = ({
  orders,
  onSelectOrder,
  onViewAll,
}) => {
  const recentOrders = [...orders]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 7);

  return (
    <section className="bg-white rounded-2xl border border-[#E5E7EB] p-5 shadow-xs space-y-4">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div>
          <h2 className="text-sm font-bold text-[#1F2937]">Recent Orders</h2>
          <p className="text-xs text-[#6B7280]">
            Latest marketplace orders sorted by order timestamp — click any row to inspect full order details
          </p>
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={onViewAll}
          rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
        >
          View All
        </Button>
      </div>

      {recentOrders.length === 0 ? (
        <div className="p-8 text-center rounded-xl bg-[#F8FAFC] border border-dashed border-[#E5E7EB] text-xs text-[#6B7280]">
          No recent orders available yet.
        </div>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-[#F8FAFC] text-[#6B7280] uppercase tracking-wider font-semibold border-y border-[#E5E7EB]">
                <tr>
                  <th className="py-3 px-3">Order ID</th>
                  <th className="py-3 px-3">Customer</th>
                  <th className="py-3 px-3">Seller / Shop</th>
                  <th className="py-3 px-3 text-right">Amount</th>
                  <th className="py-3 px-3">Payment Status</th>
                  <th className="py-3 px-3">Order Status</th>
                  <th className="py-3 px-3 text-right">Order Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E7EB]">
                {recentOrders.map((order) => {
                  const statusMeta = ORDER_STATUS_META[order.status];
                  const payMeta = PAYMENT_STATUS_META[order.paymentStatus];
                  return (
                    <tr
                      key={order.id}
                      onClick={() => onSelectOrder(order)}
                      className="hover:bg-[#F8FAFC] transition-colors cursor-pointer group"
                    >
                      <td className="py-3 px-3 font-mono font-bold text-[#1F2937] group-hover:text-[#218838] whitespace-nowrap">
                        {order.orderNumber}
                      </td>
                      <td className="py-3 px-3">
                        <p className="font-semibold text-[#1F2937]">{order.customerName}</p>
                        <p className="text-[10px] text-[#6B7280]">{order.customerPhone}</p>
                      </td>
                      <td className="py-3 px-3 font-medium text-[#475569] max-w-[180px] truncate">
                        {order.sellerName}
                      </td>
                      <td className="py-3 px-3 text-right font-bold text-[#1F2937] tabular-nums whitespace-nowrap">
                        {formatINR(order.totalPaise)}
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        <Badge variant={payMeta?.variant || 'neutral'} size="sm">
                          {payMeta?.label || order.paymentStatus}
                        </Badge>
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        <Badge variant={statusMeta?.variant || 'neutral'} size="sm" dot>
                          {statusMeta?.shortLabel || order.status}
                        </Badge>
                      </td>
                      <td className="py-3 px-3 text-right text-[#6B7280] whitespace-nowrap">
                        {formatOrderDate(order.createdAt)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden space-y-2.5">
            {recentOrders.map((order) => {
              const statusMeta = ORDER_STATUS_META[order.status];
              const payMeta = PAYMENT_STATUS_META[order.paymentStatus];
              return (
                <button
                  key={order.id}
                  type="button"
                  onClick={() => onSelectOrder(order)}
                  className="w-full text-left p-3.5 rounded-xl border border-[#E5E7EB] bg-[#F8FAFC] hover:border-[#218838]/60 transition-colors space-y-2 cursor-pointer"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-xs font-bold text-[#1F2937]">
                      {order.orderNumber}
                    </span>
                    <span className="text-xs font-black text-[#1F2937]">
                      {formatINR(order.totalPaise)}
                    </span>
                  </div>
                  <div className="text-[11px] text-[#475569]">
                    <p className="font-semibold text-[#1F2937]">{order.customerName}</p>
                    <p className="truncate">{order.sellerName}</p>
                  </div>
                  <div className="flex items-center justify-between gap-2 flex-wrap pt-1 border-t border-[#E5E7EB]">
                    <div className="flex items-center gap-1.5">
                      <Badge variant={statusMeta?.variant || 'neutral'} size="sm" dot>
                        {statusMeta?.shortLabel || order.status}
                      </Badge>
                      <Badge variant={payMeta?.variant || 'neutral'} size="sm">
                        {payMeta?.label || order.paymentStatus}
                      </Badge>
                    </div>
                    <span className="text-[10px] text-[#6B7280]">
                      {formatOrderDate(order.createdAt)}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </>
      )}
    </section>
  );
};

/* ============================================================================
 * 3. TOP SELLING PRODUCTS (Top 5 calculated dynamically from order line items)
 * ========================================================================== */

export interface TopSellingProductsWidgetProps {
  products: TopSellingProductRow[];
  onViewAll: () => void;
}

export const TopSellingProductsWidget: React.FC<TopSellingProductsWidgetProps> = ({
  products,
  onViewAll,
}) => {
  const [inspectingProduct, setInspectingProduct] = useState<TopSellingProductRow | null>(null);

  return (
    <section className="bg-white rounded-2xl border border-[#E5E7EB] p-5 shadow-xs space-y-4">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div>
          <h2 className="text-sm font-bold text-[#1F2937]">Top Selling Products</h2>
          <p className="text-xs text-[#6B7280]">
            Top 5 products ranked dynamically by live order revenue and units sold
          </p>
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={onViewAll}
          rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
        >
          View All
        </Button>
      </div>

      {products.length === 0 ? (
        <div className="p-8 text-center rounded-xl bg-[#F8FAFC] border border-dashed border-[#E5E7EB] text-xs text-[#6B7280]">
          No product sales recorded yet.
        </div>
      ) : (
        <div className="space-y-2.5">
          {products.map((item, idx) => {
            const initials = item.productName
              .split(' ')
              .map((w) => w[0])
              .join('')
              .slice(0, 2)
              .toUpperCase();
            return (
              <div
                key={item.key}
                onClick={() => setInspectingProduct(item)}
                className="flex items-center justify-between gap-3 p-3 rounded-xl border border-[#E5E7EB] bg-[#F8FAFC] hover:bg-white hover:border-[#218838]/60 transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  {/* Visual Product Thumbnail / Rank Tile */}
                  <div className="relative w-11 h-11 rounded-xl bg-white border border-[#E5E7EB] flex items-center justify-center shrink-0">
                    <span className="text-xs font-black text-[#218838]">{initials}</span>
                    <span className="absolute -top-1.5 -left-1.5 w-5 h-5 rounded-full bg-[#1F2937] text-white text-[10px] font-bold flex items-center justify-center">
                      {idx + 1}
                    </span>
                  </div>

                  <div className="min-w-0">
                    <p className="text-xs font-bold text-[#1F2937] group-hover:text-[#218838] transition-colors truncate">
                      {item.productName}
                    </p>
                    <p className="text-[11px] text-[#6B7280] truncate">
                      {item.sellerName} • {item.categoryName}
                    </p>
                    <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                      <VerticalBadge vertical={item.vertical} />
                      <Badge variant={item.statusVariant} size="sm">
                        {item.statusLabel}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <p className="text-xs font-black text-[#1F2937] tabular-nums">
                    {formatINR(item.revenuePaise)}
                  </p>
                  <p className="text-[11px] text-[#6B7280] tabular-nums">
                    {item.unitsSold} unit{item.unitsSold !== 1 ? 's' : ''} sold
                  </p>
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#218838] mt-0.5">
                    <Eye className="w-3 h-3" /> Inspect
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Quick Product Detail Modal */}
      <Modal
        isOpen={Boolean(inspectingProduct)}
        onClose={() => setInspectingProduct(null)}
        title={inspectingProduct?.productName || 'Product Snapshot'}
        size="md"
      >
        {inspectingProduct && (
          <div className="space-y-4 text-left text-xs">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2">
                <VerticalBadge vertical={inspectingProduct.vertical} />
                <Badge variant={inspectingProduct.statusVariant} size="sm">
                  {inspectingProduct.statusLabel}
                </Badge>
              </div>
              {inspectingProduct.productRecord?.sku && (
                <span className="font-mono text-[11px] text-[#6B7280]">
                  SKU: {inspectingProduct.productRecord.sku}
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3 bg-[#F8FAFC] p-3.5 rounded-xl border border-[#E5E7EB]">
              <div>
                <p className="text-[10px] text-[#6B7280] uppercase font-semibold">Seller</p>
                <p className="font-bold text-[#1F2937] mt-0.5">{inspectingProduct.sellerName}</p>
              </div>
              <div>
                <p className="text-[10px] text-[#6B7280] uppercase font-semibold">Category</p>
                <p className="font-bold text-[#1F2937] mt-0.5">{inspectingProduct.categoryName}</p>
              </div>
              <div>
                <p className="text-[10px] text-[#6B7280] uppercase font-semibold">Units Sold</p>
                <p className="font-bold text-[#1F2937] mt-0.5">
                  {inspectingProduct.unitsSold} across {inspectingProduct.ordersCount} order(s)
                </p>
              </div>
              <div>
                <p className="text-[10px] text-[#6B7280] uppercase font-semibold">Order Revenue</p>
                <p className="font-bold text-[#218838] mt-0.5">
                  {formatINR(inspectingProduct.revenuePaise)}
                </p>
              </div>
            </div>

            {inspectingProduct.productRecord && (
              <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl border border-[#E5E7EB]">
                <div>
                  <p className="text-[10px] text-[#6B7280] uppercase font-semibold">
                    Catalog Selling Price
                  </p>
                  <p className="font-bold text-[#1F2937] mt-0.5">
                    {formatINR(inspectingProduct.productRecord.pricePaise)}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-[#6B7280] uppercase font-semibold">
                    Moderation Status
                  </p>
                  <p className="font-bold text-[#1F2937] mt-0.5">
                    {inspectingProduct.productRecord.moderationStatus.replace(/_/g, ' ')}
                  </p>
                </div>
              </div>
            )}

            <div className="pt-3 border-t border-[#E5E7EB] flex items-center justify-end gap-2">
              <Button variant="secondary" size="sm" onClick={() => setInspectingProduct(null)}>
                Close
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  setInspectingProduct(null);
                  onViewAll();
                }}
                leftIcon={<Package className="w-3.5 h-3.5" />}
              >
                Open Product Catalog
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </section>
  );
};

/* ============================================================================
 * 4. VILLAGE-WISE SALES OVERVIEW (Dynamic village comparison)
 * ========================================================================== */

export interface VillageSalesOverviewWidgetProps {
  villages: VillageSalesRow[];
  onNavigate: (view: AdminViewType) => void;
}

export const VillageSalesOverviewWidget: React.FC<VillageSalesOverviewWidgetProps> = ({
  villages,
  onNavigate,
}) => {
  const topVillage = villages[0];

  return (
    <section className="bg-white rounded-2xl border border-[#E5E7EB] p-5 shadow-xs space-y-4">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div>
          <h2 className="text-sm font-bold text-[#1F2937]">Village-wise Sales Overview</h2>
          <p className="text-xs text-[#6B7280]">
            Dynamic performance comparison across active pilot villages
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onNavigate('ANALYTICS')}
          >
            Reports
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => onNavigate('SERVICE_AREAS')}
            rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
          >
            View All
          </Button>
        </div>
      </div>

      {/* Top Performing Village Callout */}
      {topVillage && topVillage.totalSalesPaise > 0 && (
        <div className="p-3.5 rounded-xl bg-[#E8F5E9]/60 border border-[#218838]/25 flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#218838] text-white flex items-center justify-center shrink-0">
              <Award className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-[#176B2C]">
                Top Performing Village
              </p>
              <p className="text-sm font-black text-[#1F2937]">
                {topVillage.villageName}{' '}
                <span className="text-xs font-semibold text-[#176B2C]">
                  ({topVillage.sharePct}% of marketplace GMV)
                </span>
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm font-black text-[#1F2937]">
              {formatINR(topVillage.totalSalesPaise)}
            </p>
            <p className="text-[11px] text-[#475569]">
              {topVillage.totalOrders} orders • {topVillage.activeSellers} active seller(s)
            </p>
          </div>
        </div>
      )}

      {/* Village Comparison Bars & Metrics */}
      <div className="space-y-2.5">
        {villages.map((v) => (
          <div
            key={v.id}
            className="p-3 rounded-xl border border-[#E5E7EB] bg-[#F8FAFC] space-y-2"
          >
            <div className="flex items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2 min-w-0">
                <MapPin className="w-3.5 h-3.5 text-[#218838] shrink-0" />
                <span className="font-bold text-[#1F2937] truncate">{v.villageName}</span>
                {v.district && (
                  <span className="text-[10px] text-[#6B7280] hidden sm:inline">
                    {v.district}
                  </span>
                )}
                {!v.isActive && (
                  <Badge variant="neutral" size="sm">
                    Inactive
                  </Badge>
                )}
              </div>
              <div className="text-right shrink-0 font-bold text-[#1F2937] tabular-nums">
                {formatINR(v.totalSalesPaise)}{' '}
                <span className="text-[11px] font-semibold text-[#6B7280]">
                  ({v.sharePct}%)
                </span>
              </div>
            </div>

            <div className="w-full h-2 bg-[#E2E8F0] rounded-full overflow-hidden">
              <div
                className="h-2 bg-[#218838] rounded-full transition-all"
                style={{ width: `${Math.max(v.sharePct, v.totalOrders > 0 ? 4 : 0)}%` }}
              />
            </div>

            <div className="flex items-center justify-between gap-2 flex-wrap text-[11px] text-[#6B7280]">
              <span className="inline-flex items-center gap-1">
                <ShoppingBag className="w-3 h-3" />
                <strong className="text-[#1F2937]">{v.totalOrders}</strong> orders
              </span>
              <span className="inline-flex items-center gap-1">
                <Store className="w-3 h-3" />
                <strong className="text-[#1F2937]">{v.activeSellers}</strong> active seller(s)
              </span>
              <span className="inline-flex items-center gap-1">
                <Users className="w-3 h-3" />
                <strong className="text-[#1F2937]">{v.customersCount}</strong> customer(s)
              </span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
