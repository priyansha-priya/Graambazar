/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useState } from 'react';
import {
  BarChart3,
  Calendar,
  IndianRupee,
  ShoppingBag,
  TrendingUp,
} from 'lucide-react';
import { Order } from '../../../../types/order';
import { formatINR } from '../../../../utils/currency';
import {
  DashboardDatePreset,
  SalesGranularity,
  computeDashboardTrends,
} from './dashboardHelpers';

export interface DashboardTrendsSectionProps {
  orders: Order[];
  datePreset: DashboardDatePreset;
  onDatePresetChange: (preset: DashboardDatePreset) => void;
  customFrom: string;
  onCustomFromChange: (val: string) => void;
  customTo: string;
  onCustomToChange: (val: string) => void;
}

const DATE_PRESET_OPTIONS: { key: DashboardDatePreset; label: string }[] = [
  { key: '7D', label: 'Last 7 Days' },
  { key: '30D', label: 'Last 30 Days' },
  { key: '90D', label: 'Last 90 Days' },
  { key: 'CUSTOM', label: 'Custom Range' },
  { key: 'ALL', label: 'All Time' },
];

const GRANULARITY_OPTIONS: { key: SalesGranularity; label: string }[] = [
  { key: 'DAILY', label: 'Daily GMV' },
  { key: 'WEEKLY', label: 'Weekly GMV' },
  { key: 'MONTHLY', label: 'Monthly GMV' },
];

export const DashboardTrendsSection: React.FC<DashboardTrendsSectionProps> = ({
  orders,
  datePreset,
  onDatePresetChange,
  customFrom,
  onCustomFromChange,
  customTo,
  onCustomToChange,
}) => {
  const [granularity, setGranularity] = useState<SalesGranularity>('DAILY');
  const [hoveredSalesIdx, setHoveredSalesIdx] = useState<number | null>(null);
  const [hoveredOrderIdx, setHoveredOrderIdx] = useState<number | null>(null);

  const trends = useMemo(
    () =>
      computeDashboardTrends(
        orders,
        datePreset,
        customFrom,
        customTo,
        granularity
      ),
    [orders, datePreset, customFrom, customTo, granularity]
  );

  const maxGmv = useMemo(
    () => Math.max(...trends.buckets.map((b) => b.gmvPaise), 1),
    [trends.buckets]
  );

  const maxOrders = useMemo(
    () => Math.max(...trends.buckets.map((b) => b.totalOrders), 1),
    [trends.buckets]
  );

  const handlePresetSwitch = (preset: DashboardDatePreset) => {
    onDatePresetChange(preset);
    if (preset === '7D') setGranularity('DAILY');
    if (preset === '30D' && granularity === 'MONTHLY') setGranularity('WEEKLY');
  };

  return (
    <section className="space-y-4">
      {/* Unified Date Filter Bar */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] p-4 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-[#E8F5E9] text-[#218838] flex items-center justify-center shrink-0">
            <TrendingUp className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-[#1F2937]">
              Sales &amp; Order Trends
            </h2>
            <p className="text-xs text-[#6B7280]">
              Dynamically computed from live marketplace orders for the selected date window
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex flex-wrap bg-[#F1F5F9] p-1 rounded-xl border border-[#E5E7EB] gap-0.5">
            {DATE_PRESET_OPTIONS.map((opt) => (
              <button
                key={opt.key}
                type="button"
                onClick={() => handlePresetSwitch(opt.key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  datePreset === opt.key
                    ? 'bg-[#218838] text-white shadow-xs'
                    : 'text-[#475569] hover:text-[#1F2937]'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {datePreset === 'CUSTOM' && (
            <div className="flex items-center gap-2 flex-wrap bg-[#F8FAFC] px-3 py-1.5 rounded-xl border border-[#E5E7EB]">
              <Calendar className="w-3.5 h-3.5 text-[#6B7280]" />
              <input
                type="date"
                aria-label="Trend start date"
                value={customFrom}
                onChange={(e) => onCustomFromChange(e.target.value)}
                className="text-xs bg-white border border-[#E5E7EB] rounded-lg px-2 py-1 text-[#1F2937] outline-none focus:border-[#218838]"
              />
              <span className="text-xs text-[#6B7280]">to</span>
              <input
                type="date"
                aria-label="Trend end date"
                value={customTo}
                onChange={(e) => onCustomToChange(e.target.value)}
                className="text-xs bg-white border border-[#E5E7EB] rounded-lg px-2 py-1 text-[#1F2937] outline-none focus:border-[#218838]"
              />
            </div>
          )}
        </div>
      </div>

      {/* 2-Column Charts Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        {/* Chart 1: Sales Trend (Daily / Weekly / Monthly GMV) */}
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 shadow-xs flex flex-col justify-between gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <IndianRupee className="w-4 h-4 text-[#218838]" />
                <h3 className="text-sm font-bold text-[#1F2937]">Sales Trend (GMV)</h3>
              </div>
              <p className="text-xs text-[#6B7280] mt-0.5">
                Valid order GMV: <strong className="text-[#1F2937]">{formatINR(trends.periodGmvPaise)}</strong>
                {' • '}Avg Order Value:{' '}
                <strong className="text-[#1F2937]">{formatINR(trends.avgOrderValuePaise)}</strong>
              </p>
            </div>

            <div className="inline-flex bg-[#F8FAFC] p-1 rounded-full border border-[#E5E7EB] self-start sm:self-auto">
              {GRANULARITY_OPTIONS.map((opt) => (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => setGranularity(opt.key)}
                  className={`px-2.5 py-1 rounded-full text-[11px] font-semibold cursor-pointer transition-colors ${
                    granularity === opt.key
                      ? 'bg-[#218838] text-white'
                      : 'text-[#6B7280] hover:text-[#1F2937]'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {trends.buckets.length === 0 ? (
            <div className="h-52 rounded-xl bg-[#F8FAFC] border border-dashed border-[#E5E7EB] flex flex-col items-center justify-center text-center p-4">
              <BarChart3 className="w-6 h-6 text-[#9CA3AF] mb-1.5" />
              <p className="text-xs font-semibold text-[#1F2937]">
                No sales orders in selected date range
              </p>
              <p className="text-[11px] text-[#6B7280] mt-0.5">
                Choose a broader window or clear custom dates to view live sales activity.
              </p>
            </div>
          ) : (
            <div className="pt-2">
              <div className="h-52 flex items-end gap-2 sm:gap-3 px-2 pt-8 pb-2 bg-[#F8FAFC] rounded-xl border border-[#F1F5F9]">
                {trends.buckets.map((bucket, idx) => {
                  const heightPct = Math.max(
                    bucket.gmvPaise > 0 ? Math.round((bucket.gmvPaise / maxGmv) * 100) : 0,
                    bucket.gmvPaise > 0 ? 8 : 2
                  );
                  const isHovered = hoveredSalesIdx === idx;
                  return (
                    <div
                      key={bucket.key}
                      onMouseEnter={() => setHoveredSalesIdx(idx)}
                      onMouseLeave={() => setHoveredSalesIdx(null)}
                      className="flex-1 min-w-0 h-full flex flex-col items-center justify-end relative group"
                    >
                      {/* Hover tooltip */}
                      <div
                        className={`absolute -top-7 left-1/2 -translate-x-1/2 px-2 py-1 rounded-lg bg-[#1F2937] text-white text-[10px] font-semibold whitespace-nowrap shadow-md pointer-events-none transition-opacity z-10 ${
                          isHovered ? 'opacity-100' : 'opacity-0'
                        }`}
                      >
                        {bucket.label}: {formatINR(bucket.gmvPaise)} ({bucket.totalOrders} ord)
                      </div>

                      <span className="text-[10px] font-bold text-[#1F2937] mb-1 tabular-nums truncate max-w-full">
                        {formatINR(bucket.gmvPaise)}
                      </span>

                      <div className="w-full max-w-[48px] flex-1 flex items-end">
                        <div
                          className={`w-full rounded-t-lg transition-all duration-300 ${
                            isHovered ? 'bg-[#176B2C]' : 'bg-[#218838]'
                          }`}
                          style={{ height: `${heightPct}%` }}
                        />
                      </div>

                      <span className="text-[10px] font-medium text-[#6B7280] mt-1.5 truncate max-w-full">
                        {bucket.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Chart 2: Orders Trend (Total, Completed, Pending, Cancelled) */}
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 shadow-xs flex flex-col justify-between gap-4">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-[#2563EB]" />
                <h3 className="text-sm font-bold text-[#1F2937]">Orders Trend by Status</h3>
              </div>
              <p className="text-xs text-[#6B7280] mt-0.5">
                Total: <strong className="text-[#1F2937]">{trends.periodOrders}</strong>
                {' • '}Completed: <strong className="text-[#16A34A]">{trends.periodCompleted}</strong>
                {' • '}Pending: <strong className="text-[#D97706]">{trends.periodPending}</strong>
                {' • '}Cancelled: <strong className="text-[#DC2626]">{trends.periodCancelled}</strong>
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 text-[11px] font-medium text-[#475569]">
              <span className="inline-flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-xs bg-[#16A34A]" />
                Completed
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-xs bg-[#F59E0B]" />
                Pending
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-xs bg-[#DC2626]" />
                Cancelled
              </span>
            </div>
          </div>

          {trends.buckets.length === 0 ? (
            <div className="h-52 rounded-xl bg-[#F8FAFC] border border-dashed border-[#E5E7EB] flex flex-col items-center justify-center text-center p-4">
              <ShoppingBag className="w-6 h-6 text-[#9CA3AF] mb-1.5" />
              <p className="text-xs font-semibold text-[#1F2937]">
                No orders recorded in selected period
              </p>
              <p className="text-[11px] text-[#6B7280] mt-0.5">
                Orders placed or updated within the date filter will appear here automatically.
              </p>
            </div>
          ) : (
            <div className="pt-2">
              <div className="h-52 flex items-end gap-2 sm:gap-3 px-2 pt-8 pb-2 bg-[#F8FAFC] rounded-xl border border-[#F1F5F9]">
                {trends.buckets.map((bucket, idx) => {
                  const totalHeightPct = Math.max(
                    Math.round((bucket.totalOrders / maxOrders) * 100),
                    10
                  );
                  const otherCount = Math.max(
                    0,
                    bucket.totalOrders -
                      bucket.completedOrders -
                      bucket.pendingOrders -
                      bucket.cancelledOrders
                  );
                  const compPct = (bucket.completedOrders / bucket.totalOrders) * 100;
                  const pendPct = (bucket.pendingOrders / bucket.totalOrders) * 100;
                  const cancPct = (bucket.cancelledOrders / bucket.totalOrders) * 100;
                  const otherPct = (otherCount / bucket.totalOrders) * 100;
                  const isHovered = hoveredOrderIdx === idx;

                  return (
                    <div
                      key={bucket.key}
                      onMouseEnter={() => setHoveredOrderIdx(idx)}
                      onMouseLeave={() => setHoveredOrderIdx(null)}
                      className="flex-1 min-w-0 h-full flex flex-col items-center justify-end relative"
                    >
                      {/* Hover tooltip */}
                      <div
                        className={`absolute -top-7 left-1/2 -translate-x-1/2 px-2.5 py-1 rounded-lg bg-[#1F2937] text-white text-[10px] font-semibold whitespace-nowrap shadow-md pointer-events-none transition-opacity z-10 ${
                          isHovered ? 'opacity-100' : 'opacity-0'
                        }`}
                      >
                        {bucket.label}: {bucket.totalOrders} total • {bucket.completedOrders} done •{' '}
                        {bucket.pendingOrders} pend • {bucket.cancelledOrders} canc
                      </div>

                      <span className="text-[10px] font-bold text-[#1F2937] mb-1 tabular-nums">
                        {bucket.totalOrders}
                      </span>

                      <div className="w-full max-w-[48px] flex-1 flex items-end">
                        <div
                          className="w-full rounded-t-lg overflow-hidden flex flex-col justify-end bg-[#E2E8F0] transition-all duration-300"
                          style={{ height: `${totalHeightPct}%` }}
                        >
                          {otherPct > 0 && (
                            <div
                              className="w-full bg-[#64748B]"
                              style={{ height: `${otherPct}%` }}
                            />
                          )}
                          {cancPct > 0 && (
                            <div
                              className="w-full bg-[#DC2626]"
                              style={{ height: `${cancPct}%` }}
                            />
                          )}
                          {pendPct > 0 && (
                            <div
                              className="w-full bg-[#F59E0B]"
                              style={{ height: `${pendPct}%` }}
                            />
                          )}
                          {compPct > 0 && (
                            <div
                              className="w-full bg-[#16A34A]"
                              style={{ height: `${compPct}%` }}
                            />
                          )}
                        </div>
                      </div>

                      <span className="text-[10px] font-medium text-[#6B7280] mt-1.5 truncate max-w-full">
                        {bucket.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
