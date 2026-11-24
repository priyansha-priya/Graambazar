/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo } from 'react';
import {
  BarChart3,
  Calendar,
  Download,
  IndianRupee,
  Info,
  MapPin,
  Store,
  TrendingUp,
  UtensilsCrossed,
  ShoppingBasket,
} from 'lucide-react';
import {
  PaymentTransactionRecord,
  RefundLedgerRecord,
  SellerPayoutRecord,
} from '../../../../types/admin';
import { Badge } from '../../../../components/ui/Badge';
import { Button } from '../../../../components/ui/Button';
import { EmptyState } from '../../../../components/feedback/EmptyState';
import { formatINR } from '../../../../utils/currency';
import {
  FinanceDatePreset,
  computeFinanceOverview,
  computeRevenueTrendPoints,
  computeSellerBreakdown,
  computeVerticalBreakdown,
  computeVillageBreakdown,
  matchesFinanceDateRange,
} from './financeHelpers';

export interface FinanceRevenueSummaryTabProps {
  payouts: SellerPayoutRecord[];
  transactions: PaymentTransactionRecord[];
  refunds: RefundLedgerRecord[];
  datePreset: FinanceDatePreset;
  customFrom: string;
  customTo: string;
  onDatePresetChange: (preset: FinanceDatePreset) => void;
  onCustomFromChange: (val: string) => void;
  onCustomToChange: (val: string) => void;
  canExport: boolean;
  onExportRevenueCsv: () => void;
}

export const FinanceRevenueSummaryTab: React.FC<FinanceRevenueSummaryTabProps> = ({
  payouts,
  transactions,
  refunds,
  datePreset,
  customFrom,
  customTo,
  onDatePresetChange,
  onCustomFromChange,
  onCustomToChange,
  canExport,
  onExportRevenueCsv,
}) => {
  const scopedPayouts = useMemo(
    () =>
      payouts.filter((p) =>
        matchesFinanceDateRange(
          p.settledAt || p.settlementDate,
          datePreset,
          customFrom,
          customTo
        )
      ),
    [payouts, datePreset, customFrom, customTo]
  );

  const scopedTransactions = useMemo(
    () =>
      transactions.filter((t) =>
        matchesFinanceDateRange(t.createdAt, datePreset, customFrom, customTo)
      ),
    [transactions, datePreset, customFrom, customTo]
  );

  const scopedRefunds = useMemo(
    () =>
      refunds.filter((r) =>
        matchesFinanceDateRange(r.requestedAt, datePreset, customFrom, customTo)
      ),
    [refunds, datePreset, customFrom, customTo]
  );

  const metrics = useMemo(
    () => computeFinanceOverview(scopedPayouts, scopedTransactions, scopedRefunds),
    [scopedPayouts, scopedTransactions, scopedRefunds]
  );

  const trendPoints = useMemo(() => computeRevenueTrendPoints(scopedPayouts), [scopedPayouts]);
  const verticalRows = useMemo(() => computeVerticalBreakdown(scopedPayouts), [scopedPayouts]);
  const villageRows = useMemo(() => computeVillageBreakdown(scopedPayouts), [scopedPayouts]);
  const sellerRows = useMemo(() => computeSellerBreakdown(scopedPayouts), [scopedPayouts]);

  const maxTrendRev = Math.max(1, ...trendPoints.map((pt) => pt.platformRevenuePaise));
  const maxTrendComm = Math.max(1, ...trendPoints.map((pt) => pt.commissionPaise));

  return (
    <div className="space-y-5 text-left">
      {/* Date Range Controls & Accounting Clarity Banner */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] p-4 shadow-xs space-y-3.5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-[#1F2937] flex items-center gap-1.5 mr-1">
              <Calendar className="w-4 h-4 text-[#218838]" /> Reporting Window:
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
                onClick={() => onDatePresetChange(opt.id)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors cursor-pointer ${
                  datePreset === opt.id
                    ? 'bg-[#218838] text-white'
                    : 'bg-[#F8FAFC] text-[#475569] border border-[#E5E7EB] hover:bg-slate-100'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {canExport && (
            <Button
              variant="secondary"
              size="sm"
              onClick={onExportRevenueCsv}
              disabled={scopedPayouts.length === 0}
              leftIcon={<Download className="w-3.5 h-3.5" />}
            >
              Export Revenue Report CSV
            </Button>
          )}
        </div>

        {datePreset === 'CUSTOM' && (
          <div className="flex flex-wrap items-center gap-3 p-3 rounded-xl bg-[#F8FAFC] border border-[#E5E7EB] text-xs">
            <div className="flex items-center gap-2">
              <label className="text-[11px] font-semibold text-[#6B7280]">From</label>
              <input
                type="date"
                value={customFrom}
                onChange={(e) => onCustomFromChange(e.target.value)}
                className="h-8 px-2.5 bg-white border border-[#E5E7EB] rounded-lg text-xs text-[#1F2937]"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-[11px] font-semibold text-[#6B7280]">To</label>
              <input
                type="date"
                value={customTo}
                onChange={(e) => onCustomToChange(e.target.value)}
                className="h-8 px-2.5 bg-white border border-[#E5E7EB] rounded-lg text-xs text-[#1F2937]"
              />
            </div>
          </div>
        )}

        {/* Strict GMV vs Platform Earnings Accounting Rule Banner */}
        <div className="p-3 rounded-xl bg-[#E8F5E9]/60 border border-[#A7F3D0] flex items-start gap-2.5 text-xs text-[#176B2C]">
          <Info className="w-4 h-4 shrink-0 mt-0.5 text-[#218838]" />
          <p>
            <strong>Accounting Separation:</strong> <strong>GMV</strong> represents total gross marketplace sales across sellers and is <em>not</em> platform revenue.{' '}
            <strong>Platform Revenue</strong> = Commission Earned + Platform Fees + Other Adjustments.{' '}
            <strong>Net Platform Earnings</strong> = Platform Revenue minus commission reversal on refunded orders.
          </p>
        </div>
      </div>

      {scopedPayouts.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-8">
          <EmptyState
            icon={<BarChart3 className="w-6 h-6" />}
            title="No revenue records in selected period"
            description="Expand the reporting window to 30 Days, 90 Days, or All Time to inspect marketplace revenue and commission breakdowns."
            actionText="Show All Time"
            onAction={() => onDatePresetChange('ALL')}
          />
        </div>
      ) : (
        <>
          {/* 6 Accounting Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="bg-white rounded-2xl border border-[#E5E7EB] p-4 shadow-xs">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-[#6B7280]">
                  Gross Marketplace Sales (GMV)
                </span>
                <Badge variant="neutral" size="sm">
                  Not Platform Revenue
                </Badge>
              </div>
              <p className="text-2xl font-black text-[#1F2937] mt-2">
                {formatINR(metrics.gmvPaise)}
              </p>
              <p className="text-[11px] text-[#6B7280] mt-1">
                Total order value across {scopedPayouts.reduce((s, p) => s + p.ordersCount, 0)} settled/queued orders
              </p>
            </div>

            <div className="bg-white rounded-2xl border border-[#E5E7EB] p-4 shadow-xs">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-[#6B7280]">
                  Total Commission Earned
                </span>
                <Badge variant="info" size="sm">
                  Platform Income
                </Badge>
              </div>
              <p className="text-2xl font-black text-[#2563EB] mt-2">
                {formatINR(metrics.totalCommissionPaise)}
              </p>
              <p className="text-[11px] text-[#6B7280] mt-1">
                Avg take rate:{' '}
                <strong>
                  {metrics.gmvPaise > 0
                    ? ((metrics.totalCommissionPaise / metrics.gmvPaise) * 100).toFixed(2)
                    : '0.00'}
                  %
                </strong>
              </p>
            </div>

            <div className="bg-white rounded-2xl border border-[#E5E7EB] p-4 shadow-xs">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-[#6B7280]">
                  Platform Fees &amp; Other Income
                </span>
                <Badge variant="info" size="sm">
                  Ancillary
                </Badge>
              </div>
              <p className="text-2xl font-black text-[#1F2937] mt-2">
                {formatINR(metrics.platformFeesPaise + metrics.otherPlatformIncomePaise)}
              </p>
              <p className="text-[11px] text-[#6B7280] mt-1">
                Fees: {formatINR(metrics.platformFeesPaise)} • Other:{' '}
                {formatINR(metrics.otherPlatformIncomePaise)}
              </p>
            </div>

            <div className="bg-white rounded-2xl border border-[#E5E7EB] p-4 shadow-xs">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-[#6B7280]">
                  Seller Payable Amount
                </span>
                <Badge variant="warning" size="sm">
                  Merchant Share
                </Badge>
              </div>
              <p className="text-2xl font-black text-[#1F2937] mt-2">
                {formatINR(metrics.totalSellerPayablePaise)}
              </p>
              <p className="text-[11px] text-[#6B7280] mt-1">
                Settled: {formatINR(metrics.totalSettledPayoutsPaise)} • Pending:{' '}
                {formatINR(metrics.pendingSellerSettlementsPaise)}
              </p>
            </div>

            <div className="bg-white rounded-2xl border border-[#E5E7EB] p-4 shadow-xs">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-[#6B7280]">
                  Refunds &amp; Adjustments
                </span>
                <Badge variant="error" size="sm">
                  Deductions
                </Badge>
              </div>
              <p className="text-2xl font-black text-[#DC2626] mt-2">
                {formatINR(metrics.totalRefundAmountPaise)}
              </p>
              <p className="text-[11px] text-[#6B7280] mt-1">
                Est. platform commission reversal: -{formatINR(metrics.estimatedCommissionReversalPaise)}
              </p>
            </div>

            <div className="bg-[#E8F5E9]/50 rounded-2xl border border-[#86EFAC] p-4 shadow-xs">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-[#176B2C]">
                  Net Platform Earnings
                </span>
                <Badge variant="success" size="sm">
                  Net Income
                </Badge>
              </div>
              <p className="text-2xl font-black text-[#218838] mt-2">
                {formatINR(metrics.netPlatformEarningsPaise)}
              </p>
              <p className="text-[11px] text-[#176B2C] mt-1">
                Gross Platform Rev ({formatINR(metrics.platformRevenuePaise)}) − Refund Comm. Impact
              </p>
            </div>
          </div>

          {/* Revenue Trend & Commission Trend Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Revenue Trend */}
            <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-[#1F2937] flex items-center gap-1.5">
                    <TrendingUp className="w-4 h-4 text-[#218838]" />
                    Platform Revenue Trend
                  </h3>
                  <p className="text-[11px] text-[#6B7280]">
                    Gross Platform Revenue (Commission + Fees) per settlement cycle
                  </p>
                </div>
                <Badge variant="primary" size="sm">
                  {trendPoints.length} Cycle(s)
                </Badge>
              </div>

              <div className="space-y-3 pt-1">
                {trendPoints.map((pt) => {
                  const pct = Math.max(8, Math.round((pt.platformRevenuePaise / maxTrendRev) * 100));
                  return (
                    <div key={pt.periodLabel} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-[#1F2937]">{pt.periodLabel}</span>
                        <span className="font-bold text-[#218838]">
                          {formatINR(pt.platformRevenuePaise)}{' '}
                          <span className="text-[10px] font-normal text-[#6B7280]">
                            (GMV {formatINR(pt.gmvPaise)})
                          </span>
                        </span>
                      </div>
                      <div className="w-full h-3 bg-[#F1F5F9] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#218838] rounded-full transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Commission Trend */}
            <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-[#1F2937] flex items-center gap-1.5">
                    <IndianRupee className="w-4 h-4 text-[#2563EB]" />
                    Commission Earnings Trend
                  </h3>
                  <p className="text-[11px] text-[#6B7280]">
                    Earned marketplace commission across cycles (excl. GMV)
                  </p>
                </div>
                <Badge variant="info" size="sm">
                  Commission Only
                </Badge>
              </div>

              <div className="space-y-3 pt-1">
                {trendPoints.map((pt) => {
                  const pct = Math.max(8, Math.round((pt.commissionPaise / maxTrendComm) * 100));
                  const ratePct =
                    pt.gmvPaise > 0 ? ((pt.commissionPaise / pt.gmvPaise) * 100).toFixed(1) : '0.0';
                  return (
                    <div key={pt.periodLabel} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-[#1F2937]">
                          {pt.periodLabel}{' '}
                          <span className="text-[10px] text-[#6B7280]">({pt.ordersCount} orders)</span>
                        </span>
                        <span className="font-bold text-[#2563EB]">
                          {formatINR(pt.commissionPaise)}{' '}
                          <span className="text-[10px] font-normal text-[#6B7280]">
                            ({ratePct}%)
                          </span>
                        </span>
                      </div>
                      <div className="w-full h-3 bg-[#F1F5F9] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#2563EB] rounded-full transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Food vs Grocery Breakdown */}
          <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 shadow-xs space-y-3.5">
            <h3 className="text-sm font-bold text-[#1F2937]">Food vs Grocery Breakdown</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {verticalRows.map((row) => {
                const sharePct =
                  metrics.gmvPaise > 0 ? Math.round((row.gmvPaise / metrics.gmvPaise) * 100) : 0;
                const isFood = row.key === 'FOOD';
                return (
                  <div
                    key={row.key}
                    className="p-4 rounded-2xl border border-[#E5E7EB] bg-[#F8FAFC] space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                            isFood
                              ? 'bg-[#FEF3C7] text-[#D97706]'
                              : 'bg-[#E8F5E9] text-[#218838]'
                          }`}
                        >
                          {isFood ? (
                            <UtensilsCrossed className="w-4 h-4" />
                          ) : (
                            <ShoppingBasket className="w-4 h-4" />
                          )}
                        </span>
                        <div>
                          <p className="text-xs font-bold text-[#1F2937]">{row.label}</p>
                          <p className="text-[11px] text-[#6B7280]">{row.ordersCount} orders</p>
                        </div>
                      </div>
                      <Badge variant={isFood ? 'warning' : 'primary'} size="sm">
                        {sharePct}% GMV Share
                      </Badge>
                    </div>
                    <div className="grid grid-cols-3 gap-2 pt-2 border-t border-[#E5E7EB] text-xs">
                      <div>
                        <p className="text-[10px] text-[#6B7280]">GMV</p>
                        <p className="font-bold text-[#1F2937]">{formatINR(row.gmvPaise)}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-[#6B7280]">Commission</p>
                        <p className="font-bold text-[#2563EB]">{formatINR(row.commissionPaise)}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-[#6B7280]">Seller Payable</p>
                        <p className="font-bold text-[#176B2C]">
                          {formatINR(row.sellerPayablePaise)}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Village-wise & Seller-wise Breakdowns */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            {/* Village-wise */}
            <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-xs overflow-hidden">
              <div className="px-4 py-3.5 border-b border-[#E5E7EB] bg-[#F8FAFC] flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#1F2937] flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-[#218838]" /> Village-wise Breakdown
                </h3>
                <span className="text-[11px] text-[#6B7280]">{villageRows.length} Villages</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-[#F8FAFC] text-[#6B7280] border-b border-[#E5E7EB]">
                    <tr>
                      <th className="py-2.5 px-4">Village</th>
                      <th className="py-2.5 px-4 text-right">Orders</th>
                      <th className="py-2.5 px-4 text-right">GMV</th>
                      <th className="py-2.5 px-4 text-right">Commission</th>
                      <th className="py-2.5 px-4 text-right">Platform Rev</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E5E7EB]">
                    {villageRows.map((v) => (
                      <tr key={v.key} className="hover:bg-[#F8FAFC]/80">
                        <td className="py-2.5 px-4 font-bold text-[#1F2937]">{v.label}</td>
                        <td className="py-2.5 px-4 text-right text-[#475569]">{v.ordersCount}</td>
                        <td className="py-2.5 px-4 text-right font-semibold text-[#1F2937]">
                          {formatINR(v.gmvPaise)}
                        </td>
                        <td className="py-2.5 px-4 text-right font-semibold text-[#2563EB]">
                          {formatINR(v.commissionPaise)}
                        </td>
                        <td className="py-2.5 px-4 text-right font-black text-[#218838]">
                          {formatINR(v.netPlatformRevenuePaise)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Seller-wise */}
            <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-xs overflow-hidden">
              <div className="px-4 py-3.5 border-b border-[#E5E7EB] bg-[#F8FAFC] flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#1F2937] flex items-center gap-1.5">
                  <Store className="w-3.5 h-3.5 text-[#218838]" /> Seller-wise Breakdown
                </h3>
                <span className="text-[11px] text-[#6B7280]">{sellerRows.length} Sellers</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-[#F8FAFC] text-[#6B7280] border-b border-[#E5E7EB]">
                    <tr>
                      <th className="py-2.5 px-4">Seller</th>
                      <th className="py-2.5 px-4 text-right">GMV</th>
                      <th className="py-2.5 px-4 text-right">Commission</th>
                      <th className="py-2.5 px-4 text-right">Seller Payable</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E5E7EB]">
                    {sellerRows.map((s) => (
                      <tr key={s.key} className="hover:bg-[#F8FAFC]/80">
                        <td className="py-2.5 px-4">
                          <p className="font-bold text-[#1F2937]">{s.label}</p>
                          <p className="text-[10px] text-[#6B7280]">
                            {s.sublabel} • {s.ordersCount} orders
                          </p>
                        </td>
                        <td className="py-2.5 px-4 text-right font-semibold text-[#1F2937]">
                          {formatINR(s.gmvPaise)}
                        </td>
                        <td className="py-2.5 px-4 text-right font-semibold text-[#2563EB]">
                          {formatINR(s.commissionPaise)}
                        </td>
                        <td className="py-2.5 px-4 text-right font-black text-[#176B2C]">
                          {formatINR(s.sellerPayablePaise)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
