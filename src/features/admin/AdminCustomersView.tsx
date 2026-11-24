/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useMemo, useState } from 'react';
import {
  Ban,
  BookOpen,
  CheckCircle2,
  Download,
  Eye,
  MapPin,
  RotateCcw,
  Search,
  ShoppingBag,
  UserCheck,
  Users,
} from 'lucide-react';
import { useAdmin } from '../../contexts/AdminContext';
import { AdminCustomerRecord } from '../../types/admin';
import { KPICard } from '../../components/data-display/KPICard';
import { Pagination } from '../../components/data-display/Pagination';
import { Breadcrumbs } from '../../components/layout/Breadcrumbs';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { EmptyState } from '../../components/feedback/EmptyState';
import { formatINR } from '../../utils/currency';
import { exportToCsv } from '../../utils/exportCsv';
import { Customer360Drawer } from './components/customers/Customer360Drawer';
import { getCustomerInitials } from './components/customers/customer360Helpers';

const PAGE_SIZE = 8;

export const AdminCustomersView: React.FC = () => {
  const {
    customers,
    serviceAreas,
    toggleCustomerBlock,
    hasPermission,
  } = useAdmin();

  const canManage = hasPermission('CUSTOMERS', 'manage');
  const canExport = hasPermission('CUSTOMERS', 'export');

  const [searchQuery, setSearchQuery] = useState('');
  const [villageFilter, setVillageFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'BLOCKED'>('ALL');
  const [udhariOnly, setUdhariOnly] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  // Reactive ID lookup so profile drawer always reflects latest customer state
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [blockTarget, setBlockTarget] = useState<AdminCustomerRecord | null>(null);
  const [blockReason, setBlockReason] = useState('');
  const [blockError, setBlockError] = useState('');
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3200);
  };

  const selectedCustomer = useMemo(
    () =>
      selectedCustomerId
        ? customers.find((c) => c.id === selectedCustomerId) || null
        : null,
    [customers, selectedCustomerId]
  );

  const filteredCustomers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return customers.filter((c) => {
      const matchesSearch =
        !q ||
        c.id.toLowerCase().includes(q) ||
        c.name.toLowerCase().includes(q) ||
        c.phone.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.landmark.toLowerCase().includes(q) ||
        c.villageName.toLowerCase().includes(q);
      const matchesVillage = villageFilter === 'ALL' || c.villageName === villageFilter;
      const matchesStatus = statusFilter === 'ALL' || c.status === statusFilter;
      const matchesUdhari = !udhariOnly || c.udhariBalancePaise > 0;
      return matchesSearch && matchesVillage && matchesStatus && matchesUdhari;
    });
  }, [customers, searchQuery, villageFilter, statusFilter, udhariOnly]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, villageFilter, statusFilter, udhariOnly]);

  const totalPages = Math.max(1, Math.ceil(filteredCustomers.length / PAGE_SIZE));
  const paginatedCustomers = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredCustomers.slice(start, start + PAGE_SIZE);
  }, [filteredCustomers, currentPage]);

  const totalSpendPaise = customers.reduce((sum, c) => sum + c.totalSpendPaise, 0);
  const totalUdhariPaise = customers.reduce((sum, c) => sum + c.udhariBalancePaise, 0);
  const activeCount = customers.filter((c) => c.status === 'ACTIVE').length;
  const blockedCount = customers.filter((c) => c.status === 'BLOCKED').length;

  const villageNames = useMemo(() => {
    const set = new Set<string>();
    serviceAreas.forEach((a) => set.add(a.name));
    customers.forEach((c) => set.add(c.villageName));
    return Array.from(set);
  }, [serviceAreas, customers]);

  const openBlockModal = (customer: AdminCustomerRecord) => {
    setBlockTarget(customer);
    setBlockReason(customer.blockReason || '');
    setBlockError('');
  };

  const handleConfirmBlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!blockTarget) return;
    if (blockTarget.status === 'ACTIVE' && !blockReason.trim()) {
      setBlockError('Please provide a reason for blocking this buyer account.');
      return;
    }
    const willBlock = blockTarget.status === 'ACTIVE';
    toggleCustomerBlock(
      blockTarget.id,
      willBlock,
      willBlock ? blockReason.trim() : 'Account restored by Admin after review'
    );
    showToast(
      willBlock
        ? `Blocked ${blockTarget.name}'s account and logged to audit trail.`
        : `Restored ${blockTarget.name}'s account.`
    );
    setBlockTarget(null);
    setBlockReason('');
    setBlockError('');
  };

  const resetFilters = () => {
    setSearchQuery('');
    setVillageFilter('ALL');
    setStatusFilter('ALL');
    setUdhariOnly(false);
  };

  const handleExportCsv = () => {
    exportToCsv(
      `grambazaar_customers_${new Date().toISOString().split('T')[0]}`,
      [
        { header: 'Customer ID', accessor: (c) => c.id },
        { header: 'Name', accessor: (c) => c.name },
        { header: 'Phone', accessor: (c) => c.phone },
        { header: 'Email', accessor: (c) => c.email },
        { header: 'Village', accessor: (c) => c.villageName },
        { header: 'Landmark', accessor: (c) => c.landmark },
        { header: 'Registered On', accessor: (c) => c.joinedAt },
        { header: 'Last Order Date', accessor: (c) => c.lastOrderAt },
        { header: 'Total Orders', accessor: (c) => c.totalOrders },
        { header: 'Total Spend (INR)', accessor: (c) => (c.totalSpendPaise / 100).toFixed(2) },
        { header: 'Udhari Balance (INR)', accessor: (c) => (c.udhariBalancePaise / 100).toFixed(2) },
        { header: 'Status', accessor: (c) => c.status },
      ],
      filteredCustomers
    );
  };

  const hasFilters = Boolean(
    searchQuery || villageFilter !== 'ALL' || statusFilter !== 'ALL' || udhariOnly
  );

  return (
    <div className="space-y-6 animate-fade-in text-left">
      {/* Breadcrumb + Header */}
      <div className="space-y-2">
        <Breadcrumbs
          items={[
            { label: 'Admin Panel' },
            { label: 'Operations' },
            { label: 'Customer Management', active: true },
          ]}
        />

        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <h1 className="text-xl font-black text-[#1F2937]">
                Customers Management (Customer 360°)
              </h1>
              <Badge variant="primary">Buyer Directory</Badge>
            </div>
            <p className="text-xs text-[#6B7280]">
              Monitor registered village buyers, lifetime spend, Udhari balances, complete order history, refunds, and COD abuse controls.
            </p>
          </div>

          {canExport && (
            <Button
              variant="secondary"
              size="sm"
              onClick={handleExportCsv}
              leftIcon={<Download className="w-3.5 h-3.5" />}
            >
              Export Customers CSV
            </Button>
          )}
        </div>
      </div>

      {toastMsg && (
        <div className="bg-[#E8F5E9] border border-[#218838]/30 text-[#176B2C] px-4 py-3 rounded-xl text-sm font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Preserved KPI Row (Clickable to Filter Directory) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <KPICard
          title="Registered Customers"
          value={customers.length}
          helperText={`${activeCount} active across ${villageNames.length} villages`}
          icon={<Users className="w-5 h-5" />}
          iconBgClass="bg-[#E8F5E9] text-[#218838]"
          onClick={resetFilters}
          actionLabel="Show All"
        />
        <KPICard
          title="Cumulative Buyer Spend"
          value={formatINR(totalSpendPaise)}
          helperText="Verified completed orders"
          icon={<ShoppingBag className="w-5 h-5" />}
          iconBgClass="bg-[#EFF6FF] text-[#2563EB]"
          onClick={() => {
            setUdhariOnly(false);
            setStatusFilter('ACTIVE');
          }}
          actionLabel="Active Buyers"
        />
        <KPICard
          title="Active Buyer Udhari"
          value={formatINR(totalUdhariPaise)}
          helperText="Across seller-segregated khatas"
          icon={<BookOpen className="w-5 h-5" />}
          iconBgClass="bg-[#FEF3C7] text-[#D97706]"
          onClick={() => {
            setStatusFilter('ALL');
            setUdhariOnly((prev) => !prev);
          }}
          actionLabel={udhariOnly ? 'Clear Filter' : 'Filter Udhari'}
        />
        <KPICard
          title="Blocked / Flagged"
          value={blockedCount}
          helperText="COD refusal & policy holds"
          icon={<Ban className="w-5 h-5" />}
          iconBgClass="bg-[#FEE2E2] text-[#DC2626]"
          onClick={() => {
            setUdhariOnly(false);
            setStatusFilter('BLOCKED');
          }}
          actionLabel="View Blocked"
        />
      </div>

      {/* Preserved Filters + Udhari Quick Toggle */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] p-4 shadow-xs flex flex-col lg:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-[#6B7280] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by customer ID, name, phone, email, village, or landmark..."
            className="w-full h-10 pl-10 pr-4 text-xs border border-[#E5E7EB] rounded-xl focus:outline-none focus:border-[#218838]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            aria-label="Filter customers by village"
            value={villageFilter}
            onChange={(e) => setVillageFilter(e.target.value)}
            className="h-10 px-3 text-xs font-semibold text-[#1F2937] bg-white border border-[#E5E7EB] rounded-xl focus:outline-none focus:border-[#218838]"
          >
            <option value="ALL">All Villages</option>
            {villageNames.map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>

          <select
            aria-label="Filter customers by account status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as 'ALL' | 'ACTIVE' | 'BLOCKED')}
            className="h-10 px-3 text-xs font-semibold text-[#1F2937] bg-white border border-[#E5E7EB] rounded-xl focus:outline-none focus:border-[#218838]"
          >
            <option value="ALL">All Status</option>
            <option value="ACTIVE">Active</option>
            <option value="BLOCKED">Blocked</option>
          </select>

          <label className="inline-flex items-center gap-1.5 h-10 px-3 rounded-xl border border-[#E5E7EB] bg-[#F8FAFC] text-xs font-semibold text-[#1F2937] cursor-pointer select-none">
            <input
              type="checkbox"
              checked={udhariOnly}
              onChange={(e) => setUdhariOnly(e.target.checked)}
              className="w-3.5 h-3.5 accent-[#218838] cursor-pointer"
            />
            <span>Has Udhari</span>
          </label>

          {hasFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={resetFilters}
              leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
            >
              Reset
            </Button>
          )}
        </div>
      </div>

      {/* Directory Table (Desktop) & Card List (Mobile) */}
      {filteredCustomers.length === 0 ? (
        <EmptyState
          icon={<Users className="w-7 h-7" />}
          title="No matching customers found"
          description="Try clearing search keywords or switching the village/status filters."
          actionText="Reset Filters"
          onAction={resetFilters}
        />
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden md:block bg-white rounded-2xl border border-[#E5E7EB] shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-[#F8FAFC] text-[#6B7280] uppercase tracking-wider font-semibold border-b border-[#E5E7EB]">
                  <tr>
                    <th className="py-3.5 px-4">Customer</th>
                    <th className="py-3.5 px-4">Village &amp; Landmark</th>
                    <th className="py-3.5 px-4 text-right">Orders</th>
                    <th className="py-3.5 px-4 text-right">Lifetime Spend</th>
                    <th className="py-3.5 px-4 text-right">Udhari Due</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E7EB]">
                  {paginatedCustomers.map((c) => (
                    <tr
                      key={c.id}
                      onClick={() => setSelectedCustomerId(c.id)}
                      className="hover:bg-[#F8FAFC]/80 transition-colors cursor-pointer group"
                    >
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-9 h-9 rounded-xl bg-[#E8F5E9] text-[#218838] flex items-center justify-center text-xs font-black shrink-0">
                            {getCustomerInitials(c.name)}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <p className="font-bold text-[#1F2937] group-hover:text-[#218838] transition-colors truncate">
                                {c.name}
                              </p>
                              <span className="text-[10px] font-mono text-[#6B7280]">
                                {c.id}
                              </span>
                            </div>
                            <p className="text-[11px] text-[#6B7280] truncate">
                              {c.phone} &middot; {c.email}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <p className="font-semibold text-[#1F2937] flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-[#218838] shrink-0" />
                          {c.villageName}
                        </p>
                        <p className="text-[11px] text-[#6B7280] truncate max-w-[210px]">
                          {c.landmark}
                        </p>
                      </td>
                      <td className="py-3.5 px-4 text-right font-bold text-[#1F2937] tabular-nums">
                        {c.totalOrders}
                      </td>
                      <td className="py-3.5 px-4 text-right font-bold text-[#1F2937] tabular-nums whitespace-nowrap">
                        {formatINR(c.totalSpendPaise)}
                      </td>
                      <td className="py-3.5 px-4 text-right tabular-nums whitespace-nowrap">
                        <span
                          className={`font-bold ${
                            c.udhariBalancePaise > 0 ? 'text-[#D97706]' : 'text-[#6B7280]'
                          }`}
                        >
                          {formatINR(c.udhariBalancePaise)}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <Badge
                          variant={c.status === 'ACTIVE' ? 'success' : 'error'}
                          size="sm"
                          dot
                        >
                          {c.status}
                        </Badge>
                      </td>
                      <td
                        className="py-3.5 px-4 text-right whitespace-nowrap"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="inline-flex items-center gap-1.5">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedCustomerId(c.id)}
                            leftIcon={<Eye className="w-3.5 h-3.5" />}
                          >
                            360°
                          </Button>
                          {canManage && (
                            <Button
                              variant={c.status === 'ACTIVE' ? 'destructive' : 'secondary'}
                              size="sm"
                              onClick={() => openBlockModal(c)}
                            >
                              {c.status === 'ACTIVE' ? 'Block' : 'Unblock'}
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden space-y-3">
            {paginatedCustomers.map((c) => (
              <div
                key={c.id}
                onClick={() => setSelectedCustomerId(c.id)}
                className="bg-white rounded-2xl border border-[#E5E7EB] p-4 shadow-xs space-y-3 cursor-pointer hover:border-[#218838]/60 transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-[#E8F5E9] text-[#218838] flex items-center justify-center text-xs font-black shrink-0">
                      {getCustomerInitials(c.name)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-[#1F2937] truncate">{c.name}</p>
                      <p className="text-[11px] text-[#6B7280] truncate">
                        {c.phone} • <span className="font-mono">{c.id}</span>
                      </p>
                    </div>
                  </div>
                  <Badge variant={c.status === 'ACTIVE' ? 'success' : 'error'} size="sm" dot>
                    {c.status}
                  </Badge>
                </div>

                <div className="text-xs text-[#475569] bg-[#F8FAFC] p-2.5 rounded-xl border border-[#F1F5F9]">
                  <p className="font-semibold text-[#1F2937] flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-[#218838]" />
                    {c.villageName}
                  </p>
                  <p className="text-[11px] text-[#6B7280] mt-0.5">{c.landmark}</p>
                </div>

                <div className="grid grid-cols-3 gap-2 pt-1 text-center">
                  <div>
                    <p className="text-[10px] text-[#6B7280]">Orders</p>
                    <p className="text-xs font-bold text-[#1F2937]">{c.totalOrders}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-[#6B7280]">Spend</p>
                    <p className="text-xs font-bold text-[#218838]">
                      {formatINR(c.totalSpendPaise)}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-[#6B7280]">Udhari</p>
                    <p
                      className={`text-xs font-bold ${
                        c.udhariBalancePaise > 0 ? 'text-[#D97706]' : 'text-[#6B7280]'
                      }`}
                    >
                      {formatINR(c.udhariBalancePaise)}
                    </p>
                  </div>
                </div>

                <div
                  className="flex items-center justify-end gap-2 pt-2 border-t border-[#E5E7EB]"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedCustomerId(c.id)}
                    leftIcon={<Eye className="w-3.5 h-3.5" />}
                  >
                    Customer 360°
                  </Button>
                  {canManage && (
                    <Button
                      variant={c.status === 'ACTIVE' ? 'destructive' : 'secondary'}
                      size="sm"
                      onClick={() => openBlockModal(c)}
                    >
                      {c.status === 'ACTIVE' ? 'Block' : 'Unblock'}
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {filteredCustomers.length > PAGE_SIZE && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalRecords={filteredCustomers.length}
              pageSize={PAGE_SIZE}
              onPageChange={setCurrentPage}
            />
          )}
        </>
      )}

      {/* Enhanced Customer 360° Profile Drawer */}
      <Customer360Drawer
        customer={selectedCustomer}
        isOpen={Boolean(selectedCustomer)}
        onClose={() => setSelectedCustomerId(null)}
        canManage={canManage}
        onRequestBlockToggle={openBlockModal}
        onShowToast={showToast}
      />

      {/* Preserved Block / Unblock Modal */}
      <Modal
        isOpen={Boolean(blockTarget)}
        onClose={() => setBlockTarget(null)}
        title={
          blockTarget?.status === 'ACTIVE'
            ? `Block ${blockTarget.name}?`
            : `Restore ${blockTarget?.name}'s Account?`
        }
        size="sm"
      >
        {blockTarget && (
          <form onSubmit={handleConfirmBlock} className="space-y-4 text-left">
            {blockError && (
              <p className="text-xs font-semibold text-[#DC2626] bg-[#FEF2F2] p-2.5 rounded-xl">
                {blockError}
              </p>
            )}
            <p className="text-xs text-[#6B7280] leading-relaxed">
              {blockTarget.status === 'ACTIVE'
                ? 'Blocked customers cannot place new COD or online orders until restored by an Admin.'
                : 'Restoring this account immediately re-enables ordering across GramBazaar villages.'}
            </p>
            {blockTarget.status === 'ACTIVE' && (
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-[#1F2937] block mb-1.5">
                  Mandatory Reason *
                </label>
                <textarea
                  rows={3}
                  value={blockReason}
                  onChange={(e) => {
                    setBlockReason(e.target.value);
                    setBlockError('');
                  }}
                  placeholder="e.g. Repeated fake COD orders / unreachable at delivery"
                  className="w-full p-3 text-xs border border-[#E5E7EB] rounded-xl focus:outline-none focus:border-[#218838]"
                />
              </div>
            )}
            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="secondary"
                size="sm"
                type="button"
                onClick={() => setBlockTarget(null)}
              >
                Cancel
              </Button>
              <Button
                variant={blockTarget.status === 'ACTIVE' ? 'destructive' : 'primary'}
                size="sm"
                type="submit"
                leftIcon={
                  blockTarget.status === 'ACTIVE' ? (
                    <Ban className="w-3.5 h-3.5" />
                  ) : (
                    <UserCheck className="w-3.5 h-3.5" />
                  )
                }
              >
                {blockTarget.status === 'ACTIVE' ? 'Confirm Block' : 'Restore Account'}
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};
