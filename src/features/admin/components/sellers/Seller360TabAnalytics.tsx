/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useState } from 'react';
import {
  BarChart3,
  Calendar,
  CheckCircle2,
  Package,
  ShoppingBag,
  Star,
  TrendingUp,
  XCircle,
} from 'lucide-react';
import {
  CategoryRecord,
  CustomerReviewRecord,
  SellerPayoutRecord,
  UniversalProductRecord,
} from '../../../../types/admin';
import { Order } from '../../../../types/order';
import { Badge } from '../../../../components/ui/Badge';
import { EmptyState } from '../../../../components/feedback/EmptyState';
import { formatINR } from '../../../../utils/currency';
import {
  SellerDatePreset,
  computeSellerAnalytics,
} from './seller360Helpers';

export interface Seller360TabAnalyticsProps {
  sellerOrders: Order[];
  sellerPayouts: SellerPayoutRecord[];
  sellerProducts: UniversalProductRecord[];
  sellerReviews: CustomerReviewRecord[];
  categories: CategoryRecord[];
}

export const Seller360TabAnalytics: React.FC<Seller360TabAnalyticsProps> = ({
  sellerOrders,
  sellerPayouts,
  sellerProducts,
  sellerReviews,
  categories,
}) => {
  const [datePreset, setDatePreset] = useState<SellerDatePreset>('ALL');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');

  const analytics = useMemo(
    () =>
      computeSellerAnalytics(
        sellerOrders,
        sellerPayouts,
        sellerProducts,
        sellerReviews,
        categories,
        datePreset,
        customFrom,
        customTo
      ),
    [
      sellerOrders,
      sellerPayouts,
      sellerProducts,
      sellerReviews,
      categories,
      datePreset,
      customFrom,
      customTo,
    ]
  );

  const maxSales = Math.max(1, ...analytics.salesTrend.map((p) => p.salesPaise));
  const maxOrders = Math.max(1, ...analytics.salesTrend.map((p) => p.ordersCount));
  const totalCatRev = Math.max(
    1,
    analytics.categorySales.reduce((s, c) => s + c.revenuePaise, 0)
  );

  return (
    <div className="space-y-5 text-left text-xs">
      {/* Date Range Controls */}
      <div className="bg-[#F8FAFC] rounded-2xl border border-[#E5E7EB] p-3.5 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="font-bold text-[#1F2937] flex items-center gap-1.5 mr-1">
              <Calendar className="w-4 h-4 text-[#218838]" /> Analytics Window:
            </span>
            {(
              [
                { id: '7D', label: '7 Days' },
                { id: '30D', label: '30 Days' },
                { id: '90D', label: '90 Days' },
                { id: 'ALL', label: 'All Time' },
                { id: 'CUSTOM', label: 'Custom Range' },
              ] as const
            ).map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setDatePreset(opt.id)}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors cursor-pointer ${
                  datePreset === opt.id
                    ? 'bg-[#218838] text-white'
                    : 'bg-white text-[#475569] border border-[#E5E7EB] hover:bg-slate-100'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <Badge variant="neutral" size="sm">
            Derived from Live Project State
          </Badge>
        </div>

        {datePreset === 'CUSTOM' && (
          <div className="flex flex-wrap items-center gap-3 pt-1">
            <div className="flex items-center gap-1.5">
              <label className="text-[11px] font-semibold text-[#6B7280]">From</label>
              <input
                type="date"
                value={customFrom}
                onChange={(e) => setCustomFrom(e.target.value)}
                className="h-8 px-2 bg-white border border-[#E5E7EB] rounded-lg text-xs"
              />
            </div>
            <div className="flex items-center gap-1.5">
              <label className="text-[11px] font-semibold text-[#6B7280]">To</label>
              <input
                type="date"
                value={customTo}
                onChange={(e) => setCustomTo(e.target.value)}
                className="h-8 px-2 bg-white border border-[#E5E7EB] rounded-lg text-xs"
              />
            </div>
          </div>
        )}
      </div>

      {!analytics.hasAnyData ? (
        <EmptyState
          icon={<BarChart3 className="w-6 h-6" />}
          title="No analytics data for this window"
          description="This seller has no recorded orders, settlement batches, or reviews in the selected timeframe."
          actionText={datePreset !== 'ALL' ? 'View All Time' : undefined}
          onAction={datePreset !== 'ALL' ? () => setDatePreset('ALL') : undefined}
        />
      ) : (
        <>
          {/* Performance KPI Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white rounded-xl border border-[#E5E7EB] p-3.5">
              <div className="flex items-center justify-between text-[#6B7280]">
                <span className="text-[11px] font-semibold">Average Order Value</span>
                <TrendingUp className="w-4 h-4 text-[#218838]" />
              </div>
              <p className="text-lg font-black text-[#1F2937] mt-1.5">
                {analytics.avgOrderValuePaise > 0 ? formatINR(analytics.avgOrderValuePaise) : '—'}
              </p>
              <p className="text-[10px] text-[#6B7280] mt-0.5">
                Across {analytics.scopedOrdersCount} order(s)
              </p>
            </div>

            <div className="bg-white rounded-xl border border-[#E5E7EB] p-3.5">
              <div className="flex items-center justify-between text-[#6B7280]">
                <span className="text-[11px] font-semibold">Order Completion Rate</span>
                <CheckCircle2 className="w-4 h-4 text-[#16A34A]" />
              </div>
              <p className="text-lg font-black text-[#16A34A] mt-1.5">
                {analytics.completionRatePct !== null ? `${analytics.completionRatePct}%` : '—'}
              </p>
              <p className="text-[10px] text-[#6B7280] mt-0.5">Delivered / Picked Up</p>
            </div>

            <div className="bg-white rounded-xl border border-[#E5E7EB] p-3.5">
              <div className="flex items-center justify-between text-[#6B7280]">
                <span className="text-[11px] font-semibold">Cancellation Rate</span>
                <XCircle className="w-4 h-4 text-[#DC2626]" />
              </div>
              <p className="text-lg font-black text-[#DC2626] mt-1.5">
                {analytics.cancellationRatePct !== null ? `${analytics.cancellationRatePct}%` : '—'}
              </p>
              <p className="text-[10px] text-[#6B7280] mt-0.5">Cancelled &amp; Rejected orders</p>
            </div>

            <div className="bg-white rounded-xl border border-[#E5E7EB] p-3.5">
              <div className="flex items-center justify-between text-[#6B7280]">
                <span className="text-[11px] font-semibold">Scoped Sales Volume</span>
                <ShoppingBag className="w-4 h-4 text-[#2563EB]" />
              </div>
              <p className="text-lg font-black text-[#1F2937] mt-1.5">
                {formatINR(analytics.scopedSalesPaise)}
              </p>
              <p className="text-[10px] text-[#6B7280] mt-0.5">Selected window GMV</p>
            </div>
          </div>

          {/* Sales Trend & Orders Trend Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-white rounded-2xl border border-[#E5E7EB] p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-[#1F2937] flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4 text-[#218838]" /> Sales Trend
                </h4>
                <Badge variant="primary" size="sm">
                  {analytics.salesTrend.length} Period(s)
                </Badge>
              </div>
              {analytics.salesTrend.length === 0 ? (
                <p className="text-[#6B7280] py-4">No sales points recorded in this period.</p>
              ) : (
                <div className="space-y-2.5">
                  {analytics.salesTrend.map((pt) => (
                    <div key={pt.label} className="space-y-1">
                      <div className="flex justify-between text-[11px]">
                        <span className="font-semibold text-[#1F2937]">{pt.label}</span>
                        <span className="font-bold text-[#218838]">{formatINR(pt.salesPaise)}</span>
                      </div>
                      <div className="h-2.5 bg-[#F1F5F9] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#218838] rounded-full transition-all duration-300"
                          style={{
                            width: `${Math.max(8, Math.round((pt.salesPaise / maxSales) * 100))}%`,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-white rounded-2xl border border-[#E5E7EB] p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-[#1F2937] flex items-center gap-1.5">
                  <ShoppingBag className="w-4 h-4 text-[#2563EB]" /> Orders Trend
                </h4>
                <Badge variant="info" size="sm">
                  {analytics.scopedOrdersCount} Orders
                </Badge>
              </div>
              {analytics.salesTrend.length === 0 ? (
                <p className="text-[#6B7280] py-4">No order volume recorded in this period.</p>
              ) : (
                <div className="space-y-2.5">
                  {analytics.salesTrend.map((pt) => (
                    <div key={pt.label} className="space-y-1">
                      <div className="flex justify-between text-[11px]">
                        <span className="font-semibold text-[#1F2937]">{pt.label}</span>
                        <span className="font-bold text-[#2563EB]">
                          {pt.ordersCount} order{pt.ordersCount === 1 ? '' : 's'}
                        </span>
                      </div>
                      <div className="h-2.5 bg-[#F1F5F9] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#2563EB] rounded-full transition-all duration-300"
                          style={{
                            width: `${Math.max(8, Math.round((pt.ordersCount / maxOrders) * 100))}%`,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Top Selling Products & Sales by Category */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Top Selling Products */}
            <div className="bg-white rounded-2xl border border-[#E5E7EB] overflow-hidden">
              <div className="px-4 py-3 bg-[#F8FAFC] border-b border-[#E5E7EB] font-bold text-[#1F2937] flex items-center gap-1.5">
                <Package className="w-4 h-4 text-[#218838]" /> Top Selling Products &amp; Product Performance
              </div>
              {analytics.topProducts.length === 0 ? (
                <p className="p-4 text-[#6B7280]">
                  No line-item sales recorded in live orders for this window.
                </p>
              ) : (
                <div className="divide-y divide-[#E5E7EB]">
                  {analytics.topProducts.slice(0, 6).map((prod, idx) => (
                    <div
                      key={prod.productName}
                      className="px-4 py-2.5 flex items-center justify-between gap-2"
                    >
                      <div className="min-w-0">
                        <p className="font-bold text-[#1F2937] truncate">
                          {idx + 1}. {prod.productName}
                        </p>
                        <p className="text-[11px] text-[#6B7280]">
                          {prod.unitsSold} unit(s) across {prod.orderCount} order(s)
                        </p>
                      </div>
                      <span className="font-black text-[#176B2C] shrink-0">
                        {formatINR(prod.revenuePaise)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Sales by Category & Rating Trend */}
            <div className="space-y-4">
              <div className="bg-white rounded-2xl border border-[#E5E7EB] p-4 space-y-3">
                <h4 className="font-bold text-[#1F2937]">Sales by Category</h4>
                {analytics.categorySales.length === 0 ? (
                  <p className="text-[#6B7280]">No category sales data in this period.</p>
                ) : (
                  <div className="space-y-2.5">
                    {analytics.categorySales.map((cat) => {
                      const pct = Math.round((cat.revenuePaise / totalCatRev) * 100);
                      return (
                        <div key={cat.categoryName} className="space-y-1">
                          <div className="flex justify-between text-[11px]">
                            <span className="font-semibold text-[#1F2937]">{cat.categoryName}</span>
                            <span className="font-bold text-[#1F2937]">
                              {formatINR(cat.revenuePaise)} ({pct}%)
                            </span>
                          </div>
                          <div className="h-2 bg-[#F1F5F9] rounded-full overflow-hidden">
                            <div
                              className="h-full bg-[#F59E0B] rounded-full"
                              style={{ width: `${Math.max(6, pct)}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="bg-white rounded-2xl border border-[#E5E7EB] p-4 space-y-3">
                <h4 className="font-bold text-[#1F2937] flex items-center gap-1.5">
                  <Star className="w-4 h-4 text-[#F59E0B]" /> Customer Rating Trend
                </h4>
                {analytics.ratingTrend.length === 0 ? (
                  <p className="text-[#6B7280]">
                    No customer reviews logged in this date window.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {analytics.ratingTrend.map((rt, i) => (
                      <div key={`${rt.dateLabel}-${i}`} className="flex items-center gap-3">
                        <span className="text-[11px] font-mono text-[#6B7280] w-14 shrink-0">
                          {rt.dateLabel}
                        </span>
                        <div className="flex-1 h-2 bg-[#F1F5F9] rounded-full overflow-hidden">
                          <div
                            className="h-full bg-[#F59E0B] rounded-full"
                            style={{ width: `${Math.round((rt.rating / 5) * 100)}%` }}
                          />
                        </div>
                        <span className="font-bold text-[#1F2937] w-10 text-right shrink-0">
                          ★ {rt.rating}.0
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
