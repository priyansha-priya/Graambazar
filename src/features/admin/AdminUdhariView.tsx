/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useState } from 'react';
import {
  BookOpenCheck,
  Search,
  Download,
  AlertTriangle,
  ShieldCheck,
  Store,
  IndianRupee,
  Users,
} from 'lucide-react';
import { useUdhari } from '../../contexts/UdhariContext';
import { useSeller } from '../../contexts/SellerContext';
import { formatPaiseToINR } from '../../utils/currency';
import { exportToCsv } from '../../utils/exportCsv';
import { KPICard } from '../../components/data-display/KPICard';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { EmptyState } from '../../components/feedback/EmptyState';

export const AdminUdhariView: React.FC = () => {
  const { platformProfiles, platformLedgerEntries, platformDisputes, sellerCreditSettings } = useUdhari();
  const { allSellers } = useSeller();

  const [searchQuery, setSearchQuery] = useState('');
  const [sellerFilter, setSellerFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'OVERDUE' | 'ACTIVE' | 'DISABLED'>('ALL');

  const getSellerName = (sellerId: string) =>
    allSellers.find((s) => s.id === sellerId)?.publicName || sellerId;

  const totalOutstandingPaise = useMemo(
    () => platformProfiles.reduce((sum, p) => sum + p.outstandingBalancePaise, 0),
    [platformProfiles]
  );

  const totalOverduePaise = useMemo(
    () => platformProfiles.reduce((sum, p) => sum + p.overdueAmountPaise, 0),
    [platformProfiles]
  );

  const totalCreditLimitPaise = useMemo(
    () => platformProfiles.reduce((sum, p) => sum + p.creditLimitPaise, 0),
    [platformProfiles]
  );

  const optedInSellersCount = Object.values(sellerCreditSettings).filter((s) => s.enabled).length;

  const filteredProfiles = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return platformProfiles.filter((p) => {
      const matchS = sellerFilter === 'ALL' || p.sellerId === sellerFilter;
      const matchStatus =
        statusFilter === 'ALL'
          ? true
          : statusFilter === 'OVERDUE'
          ? p.overdueAmountPaise > 0
          : p.status === statusFilter;
      const matchQ =
        !q ||
        p.customerName.toLowerCase().includes(q) ||
        p.customerPhone.includes(q) ||
        p.villageName.toLowerCase().includes(q) ||
        getSellerName(p.sellerId).toLowerCase().includes(q);
      return matchS && matchStatus && matchQ;
    });
  }, [platformProfiles, searchQuery, sellerFilter, statusFilter, allSellers]);

  const handleExportCsv = () => {
    exportToCsv(
      `grambazaar_udhari_oversight_${new Date().toISOString().split('T')[0]}`,
      [
        { header: 'Seller Store', accessor: (p) => getSellerName(p.sellerId) },
        { header: 'Customer', accessor: (p) => p.customerName },
        { header: 'Phone', accessor: (p) => p.customerPhone },
        { header: 'Village', accessor: (p) => p.villageName },
        { header: 'Credit Limit (INR)', accessor: (p) => (p.creditLimitPaise / 100).toFixed(2) },
        { header: 'Outstanding (INR)', accessor: (p) => (p.outstandingBalancePaise / 100).toFixed(2) },
        { header: 'Overdue (INR)', accessor: (p) => (p.overdueAmountPaise / 100).toFixed(2) },
        { header: 'Due Days', accessor: (p) => p.dueDays },
        { header: 'Status', accessor: (p) => p.status },
      ],
      filteredProfiles
    );
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#1F2937] flex items-center gap-2">
            <BookOpenCheck className="w-6 h-6 text-[#218838]" />
            Udhari / Village Credit Oversight
          </h2>
          <p className="text-sm text-[#6B7280] mt-0.5">
            Read-only platform visibility into seller-segregated khata ledgers, overdue exposure, and credit disputes.
          </p>
        </div>

        <Button variant="secondary" size="md" onClick={handleExportCsv} leftIcon={<Download className="w-4 h-4" />}>
          Export Ledger Summary
        </Button>
      </div>

      {/* Policy Guardrail Banner */}
      <div className="bg-[#EFF6FF] border border-[#BFDBFE] rounded-2xl p-4 flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-[#2563EB] shrink-0 mt-0.5" />
        <div className="text-xs text-[#1E40AF] leading-relaxed">
          <strong className="font-bold">Strict Seller-Owned Risk Policy:</strong> Every customer khata is isolated per seller store. Individual shopkeepers set limits, accept repayments, and own 100% of credit risk. GramBazaar provides digital ledger transparency and dispute audit logs only — no cross-seller credit pooling.
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <KPICard
          title="Total Outstanding (All Sellers)"
          value={formatPaiseToINR(totalOutstandingPaise)}
          helperText={`Across ${platformProfiles.length} active khata accounts`}
          icon={<IndianRupee className="w-5 h-5" />}
          iconBgClass="bg-[#E8F5E9] text-[#218838]"
        />
        <KPICard
          title="Overdue Exposure"
          value={formatPaiseToINR(totalOverduePaise)}
          helperText={totalOverduePaise > 0 ? 'Requires seller follow-up' : 'No overdue accounts'}
          icon={<AlertTriangle className="w-5 h-5" />}
          iconBgClass="bg-[#FEE2E2] text-[#DC2626]"
        />
        <KPICard
          title="Sanctioned Seller Limits"
          value={formatPaiseToINR(totalCreditLimitPaise)}
          helperText={`${optedInSellersCount} opted-in sellers`}
          icon={<Store className="w-5 h-5" />}
          iconBgClass="bg-[#EFF6FF] text-[#2563EB]"
        />
        <KPICard
          title="Ledger Entries & Disputes"
          value={`${platformLedgerEntries.length}`}
          helperText={`${platformDisputes.filter((d) => d.status === 'OPEN').length} open credit disputes`}
          icon={<Users className="w-5 h-5" />}
          iconBgClass="bg-[#FEF3C7] text-[#D97706]"
        />
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] p-4 flex flex-col sm:flex-row gap-3 shadow-xs">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-[#6B7280] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search customer, phone, village, or seller store..."
            className="w-full h-10 pl-10 pr-4 text-sm bg-[#F8FAFC] border border-[#E5E7EB] rounded-xl focus:outline-none focus:border-[#218838] focus:bg-white"
          />
        </div>
        <select
          value={sellerFilter}
          onChange={(e) => setSellerFilter(e.target.value)}
          className="h-10 px-3 text-sm bg-[#F8FAFC] border border-[#E5E7EB] rounded-xl focus:outline-none focus:border-[#218838] cursor-pointer sm:w-56"
        >
          <option value="ALL">All Seller Stores (Segregated)</option>
          {allSellers.map((s) => (
            <option key={s.id} value={s.id}>{s.publicName}</option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as 'ALL' | 'OVERDUE' | 'ACTIVE' | 'DISABLED')}
          className="h-10 px-3 text-sm bg-[#F8FAFC] border border-[#E5E7EB] rounded-xl focus:outline-none focus:border-[#218838] cursor-pointer sm:w-44"
        >
          <option value="ALL">All Statuses</option>
          <option value="OVERDUE">Overdue Only</option>
          <option value="ACTIVE">Active Accounts</option>
          <option value="DISABLED">Disabled Accounts</option>
        </select>
      </div>

      {/* Segregated Khata Profiles Table */}
      {filteredProfiles.length === 0 ? (
        <EmptyState
          icon={<BookOpenCheck className="w-7 h-7" />}
          title="No khata accounts match your filter"
          description="Try selecting a different seller store or clearing search filters."
        />
      ) : (
        <div className="bg-white rounded-2xl border border-[#E5E7EB] overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#F8FAFC] border-b border-[#E5E7EB] text-xs font-bold uppercase tracking-wider text-[#6B7280]">
                  <th className="py-3.5 px-5">Seller Store (Owner of Risk)</th>
                  <th className="py-3.5 px-5">Customer & Village</th>
                  <th className="py-3.5 px-5 text-right">Sanctioned Limit</th>
                  <th className="py-3.5 px-5 text-right">Outstanding</th>
                  <th className="py-3.5 px-5 text-right">Overdue</th>
                  <th className="py-3.5 px-5">Utilization & Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E7EB] text-sm">
                {filteredProfiles.map((prof) => {
                  const utilization =
                    prof.creditLimitPaise > 0
                      ? Math.min(100, Math.round((prof.outstandingBalancePaise / prof.creditLimitPaise) * 100))
                      : 0;
                  return (
                    <tr key={prof.id} className="hover:bg-[#F8FAFC] transition-colors">
                      <td className="py-3.5 px-5">
                        <p className="font-bold text-[#1F2937]">{getSellerName(prof.sellerId)}</p>
                        <p className="text-xs text-[#6B7280]">Due Cycle: {prof.dueDays} days</p>
                      </td>
                      <td className="py-3.5 px-5">
                        <p className="font-semibold text-[#1F2937]">{prof.customerName}</p>
                        <p className="text-xs text-[#6B7280]">{prof.customerPhone} • {prof.villageName}</p>
                      </td>
                      <td className="py-3.5 px-5 text-right font-semibold text-[#1F2937]">
                        {formatPaiseToINR(prof.creditLimitPaise)}
                      </td>
                      <td className="py-3.5 px-5 text-right font-bold text-[#1F2937]">
                        {formatPaiseToINR(prof.outstandingBalancePaise)}
                      </td>
                      <td className="py-3.5 px-5 text-right">
                        {prof.overdueAmountPaise > 0 ? (
                          <span className="font-bold text-[#DC2626]">{formatPaiseToINR(prof.overdueAmountPaise)}</span>
                        ) : (
                          <span className="text-xs text-[#6B7280]">₹0.00</span>
                        )}
                      </td>
                      <td className="py-3.5 px-5">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant={prof.overdueAmountPaise > 0 ? 'error' : prof.status === 'ACTIVE' ? 'success' : 'neutral'} dot>
                            {prof.overdueAmountPaise > 0 ? 'Overdue' : prof.status}
                          </Badge>
                          <span className="text-xs font-semibold text-[#6B7280]">{utilization}% used</span>
                        </div>
                        <div className="w-32 h-1.5 bg-[#E2E8F0] rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              utilization >= 80 ? 'bg-[#DC2626]' : utilization >= 50 ? 'bg-[#D97706]' : 'bg-[#218838]'
                            }`}
                            style={{ width: `${utilization}%` }}
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
