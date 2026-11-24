/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  CheckCircle2,
  Clock,
  Eye,
  IndianRupee,
  Info,
  RefreshCcw,
  SlidersHorizontal,
  TrendingUp,
  Wallet,
} from 'lucide-react';
import { SellerPayoutRecord } from '../../../../types/admin';
import { Badge } from '../../../../components/ui/Badge';
import { Button } from '../../../../components/ui/Button';
import { EmptyState } from '../../../../components/feedback/EmptyState';
import { formatINR } from '../../../../utils/currency';
import { formatDateTime } from '../../../../utils/dates';
import { PAYOUT_STATUS_META } from '../finance/financeHelpers';
import { SellerFinancialSummary } from './seller360Helpers';

export interface Seller360TabFinanceProps {
  financials: SellerFinancialSummary;
  payouts: SellerPayoutRecord[];
  onInspectSettlement: (payout: SellerPayoutRecord) => void;
}

export const Seller360TabFinance: React.FC<Seller360TabFinanceProps> = ({
  financials,
  payouts,
  onInspectSettlement,
}) => {
  return (
    <div className="space-y-5 text-left text-xs">
      {/* Read-only Simulation Notice */}
      <div className="p-3 rounded-xl bg-[#EFF6FF] border border-[#BFDBFE] text-[#1E40AF] flex items-start gap-2">
        <Info className="w-4 h-4 text-[#2563EB] shrink-0 mt-0.5" />
        <p>
          <strong>Read-Only Seller Financial Ledger:</strong> Displays seller-specific GMV, commission, refunds, adjustments, and settlement cycles from the Payments &amp; Finance ledger. Real bank disbursements are not triggered here.
        </p>
      </div>

      {/* 7 Financial Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        <div className="bg-white rounded-xl border border-[#E5E7EB] p-3.5">
          <div className="flex items-center justify-between text-[#6B7280]">
            <span className="text-[11px] font-semibold">Total Sales (GMV)</span>
            <TrendingUp className="w-4 h-4 text-[#218838]" />
          </div>
          <p className="text-lg font-black text-[#1F2937] mt-1.5">
            {formatINR(financials.totalSalesGmvPaise)}
          </p>
        </div>

        <div className="bg-white rounded-xl border border-[#E5E7EB] p-3.5">
          <div className="flex items-center justify-between text-[#6B7280]">
            <span className="text-[11px] font-semibold">Total Commission</span>
            <IndianRupee className="w-4 h-4 text-[#2563EB]" />
          </div>
          <p className="text-lg font-black text-[#2563EB] mt-1.5">
            {formatINR(financials.totalCommissionPaise)}
          </p>
        </div>

        <div className="bg-white rounded-xl border border-[#E5E7EB] p-3.5">
          <div className="flex items-center justify-between text-[#6B7280]">
            <span className="text-[11px] font-semibold">Total Refunds</span>
            <RefreshCcw className="w-4 h-4 text-[#DC2626]" />
          </div>
          <p className="text-lg font-black text-[#DC2626] mt-1.5">
            {formatINR(financials.totalRefundsPaise)}
          </p>
        </div>

        <div className="bg-white rounded-xl border border-[#E5E7EB] p-3.5">
          <div className="flex items-center justify-between text-[#6B7280]">
            <span className="text-[11px] font-semibold">Adjustments</span>
            <SlidersHorizontal className="w-4 h-4 text-[#6B7280]" />
          </div>
          <p className="text-lg font-black text-[#1F2937] mt-1.5">
            {formatINR(financials.totalAdjustmentsPaise)}
          </p>
        </div>

        <div className="bg-[#E8F5E9]/50 rounded-xl border border-[#A7F3D0] p-3.5">
          <div className="flex items-center justify-between text-[#176B2C]">
            <span className="text-[11px] font-bold">Total Settled</span>
            <CheckCircle2 className="w-4 h-4 text-[#218838]" />
          </div>
          <p className="text-lg font-black text-[#218838] mt-1.5">
            {formatINR(financials.totalSettledPaise)}
          </p>
        </div>

        <div className="bg-white rounded-xl border border-[#E5E7EB] p-3.5">
          <div className="flex items-center justify-between text-[#6B7280]">
            <span className="text-[11px] font-semibold">Pending Settlement</span>
            <Wallet className="w-4 h-4 text-[#D97706]" />
          </div>
          <p className="text-lg font-black text-[#D97706] mt-1.5">
            {formatINR(financials.pendingSettlementPaise)}
          </p>
        </div>

        <div className="bg-white rounded-xl border border-[#E5E7EB] p-3.5 col-span-2 sm:col-span-1 lg:col-span-2">
          <div className="flex items-center justify-between text-[#6B7280]">
            <span className="text-[11px] font-semibold">Processing Settlement</span>
            <Clock className="w-4 h-4 text-[#2563EB]" />
          </div>
          <p className="text-lg font-black text-[#2563EB] mt-1.5">
            {formatINR(financials.processingSettlementPaise)}
          </p>
        </div>
      </div>

      {/* Settlement History */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="font-bold text-sm text-[#1F2937]">
            Settlement History ({payouts.length} Batch{payouts.length === 1 ? '' : 'es'})
          </h4>
        </div>

        {payouts.length === 0 ? (
          <EmptyState
            icon={<Wallet className="w-6 h-6" />}
            title="No settlement batches recorded yet"
            description="Weekly or cycle-based seller settlement batches will appear here once orders settle."
          />
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block bg-white rounded-2xl border border-[#E5E7EB] overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-[#F8FAFC] text-[#6B7280] uppercase tracking-wider font-semibold border-b border-[#E5E7EB] text-[11px]">
                    <tr>
                      <th className="py-3 px-3">Settlement ID</th>
                      <th className="py-3 px-3">Period / Date</th>
                      <th className="py-3 px-3 text-right">Gross</th>
                      <th className="py-3 px-3 text-right">Commission</th>
                      <th className="py-3 px-3 text-right">Adjustments</th>
                      <th className="py-3 px-3 text-right">Refund Ded.</th>
                      <th className="py-3 px-3 text-right">Net Payable</th>
                      <th className="py-3 px-3">Status</th>
                      <th className="py-3 px-3">UTR / Ref</th>
                      <th className="py-3 px-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E5E7EB]">
                    {payouts.map((p) => {
                      const meta = PAYOUT_STATUS_META[p.status];
                      const displayDate = p.settledAt || p.settlementDate;
                      return (
                        <tr
                          key={p.id}
                          onClick={() => onInspectSettlement(p)}
                          className="hover:bg-[#F8FAFC]/80 cursor-pointer"
                        >
                          <td className="py-3 px-3 font-mono font-bold text-[#1F2937] whitespace-nowrap">
                            {p.id}
                          </td>
                          <td className="py-3 px-3 whitespace-nowrap">
                            <p className="font-semibold text-[#1F2937]">{p.periodLabel}</p>
                            {displayDate && (
                              <p className="text-[10px] text-[#6B7280]">
                                {formatDateTime(displayDate).split(',')[0]}
                              </p>
                            )}
                          </td>
                          <td className="py-3 px-3 text-right font-semibold text-[#1F2937] whitespace-nowrap">
                            {formatINR(p.grossAmountPaise)}
                          </td>
                          <td className="py-3 px-3 text-right text-[#475569] whitespace-nowrap">
                            -{formatINR(p.commissionPaise)}
                          </td>
                          <td className="py-3 px-3 text-right text-[#475569] whitespace-nowrap">
                            {(p.otherDeductionsPaise || 0) > 0
                              ? `-${formatINR(p.otherDeductionsPaise || 0)}`
                              : '₹0'}
                          </td>
                          <td className="py-3 px-3 text-right whitespace-nowrap">
                            {p.refundDeductionsPaise > 0 ? (
                              <span className="text-[#DC2626] font-semibold">
                                -{formatINR(p.refundDeductionsPaise)}
                              </span>
                            ) : (
                              <span className="text-[#6B7280]">₹0</span>
                            )}
                          </td>
                          <td className="py-3 px-3 text-right font-black text-[#176B2C] whitespace-nowrap">
                            {formatINR(p.netPayablePaise)}
                          </td>
                          <td className="py-3 px-3 whitespace-nowrap">
                            <Badge variant={meta.variant} size="sm" dot>
                              {meta.label}
                            </Badge>
                          </td>
                          <td className="py-3 px-3 font-mono text-[11px] text-[#475569] whitespace-nowrap">
                            {p.utrNumber || '—'}
                          </td>
                          <td
                            className="py-3 px-3 text-right whitespace-nowrap"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onInspectSettlement(p)}
                              leftIcon={<Eye className="w-3.5 h-3.5" />}
                            >
                              Details
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden space-y-2.5">
              {payouts.map((p) => {
                const meta = PAYOUT_STATUS_META[p.status];
                return (
                  <div
                    key={p.id}
                    onClick={() => onInspectSettlement(p)}
                    className="bg-white rounded-2xl border border-[#E5E7EB] p-3.5 space-y-2 cursor-pointer"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-bold text-[#1F2937]">{p.id}</span>
                          <Badge variant={meta.variant} size="sm" dot>
                            {meta.label}
                          </Badge>
                        </div>
                        <p className="text-[11px] text-[#6B7280] mt-0.5">{p.periodLabel}</p>
                      </div>
                      <p className="text-base font-black text-[#176B2C]">
                        {formatINR(p.netPayablePaise)}
                      </p>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-[11px] p-2.5 rounded-xl bg-[#F8FAFC] border border-[#E5E7EB]">
                      <div>
                        <span className="text-[#6B7280] block">Gross</span>
                        <strong className="text-[#1F2937]">{formatINR(p.grossAmountPaise)}</strong>
                      </div>
                      <div>
                        <span className="text-[#6B7280] block">Comm.</span>
                        <strong className="text-[#DC2626]">-{formatINR(p.commissionPaise)}</strong>
                      </div>
                      <div>
                        <span className="text-[#6B7280] block">UTR</span>
                        <strong className="font-mono text-[#1F2937] truncate block">
                          {p.utrNumber || '—'}
                        </strong>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
