/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useState } from 'react';
import {
  Headphones,
  CheckCircle2,
  Search,
  AlertCircle,
  IndianRupee,
  RotateCcw,
} from 'lucide-react';
import { useAdmin } from '../../contexts/AdminContext';
import { SupportCaseRecord, SupportIssueType } from '../../types/admin';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Drawer } from '../../components/ui/Drawer';
import { EmptyState } from '../../components/feedback/EmptyState';
import { VerticalBadge } from './components/VerticalBadge';
import { formatINR } from '../../utils/currency';

const ISSUE_TYPE_LABELS: Record<SupportIssueType, string> = {
  FOOD_QUALITY: 'Food Quality',
  MISSING_ITEM: 'Missing Item',
  DELIVERY_DELAY: 'Delivery Delay',
  PAYMENT_ISSUE: 'Payment Issue',
  DEFECTIVE_PRODUCT: 'Defective Product',
  WRONG_VARIANT: 'Wrong Variant / Size',
  DAMAGED_IN_TRANSIT: 'Damaged in Transit',
  WARRANTY_CLAIM: 'Warranty Claim',
  UDHARI_DISPUTE: 'Udhari Credit Dispute',
  OTHER: 'Other Grievance',
};

const CASE_STATUSES: ReadonlyArray<'ALL' | SupportCaseRecord['status']> = [
  'ALL',
  'OPEN',
  'INVESTIGATING',
  'REFUND_APPROVED',
  'RESOLVED',
  'CLOSED',
];

export const AdminSupportView: React.FC = () => {
  const { supportCases, updateSupportCaseStatus, hasPermission } = useAdmin();

  const canManage = hasPermission('SUPPORT', 'manage');
  const canApproveRefund = hasPermission('SUPPORT', 'approve');

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | SupportCaseRecord['status']>('ALL');
  const [issueFilter, setIssueFilter] = useState<'ALL' | SupportIssueType>('ALL');
  const [selectedCase, setSelectedCase] = useState<SupportCaseRecord | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [refundAmountInr, setRefundAmountInr] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const openCaseDrawer = (c: SupportCaseRecord) => {
    setSelectedCase(c);
    setResolutionNotes(c.resolutionNotes || '');
    const defaultRefund = c.approvedRefundPaise ?? c.amountPaise;
    setRefundAmountInr((defaultRefund / 100).toFixed(2));
    setFormError(null);
  };

  const filteredCases = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return supportCases.filter((c) => {
      const matchesSearch =
        !q ||
        c.id.toLowerCase().includes(q) ||
        c.orderId.toLowerCase().includes(q) ||
        c.customerName.toLowerCase().includes(q) ||
        c.customerPhone.toLowerCase().includes(q) ||
        c.sellerName.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q);

      const matchesStatus = statusFilter === 'ALL' || c.status === statusFilter;
      const matchesIssue = issueFilter === 'ALL' || c.issueType === issueFilter;
      return matchesSearch && matchesStatus && matchesIssue;
    });
  }, [supportCases, searchQuery, statusFilter, issueFilter]);

  const hasActiveFilters =
    searchQuery.trim() !== '' || statusFilter !== 'ALL' || issueFilter !== 'ALL';

  const resetFilters = () => {
    setSearchQuery('');
    setStatusFilter('ALL');
    setIssueFilter('ALL');
  };

  const handleUpdateStatus = (status: SupportCaseRecord['status']) => {
    if (!selectedCase || !canManage) return;
    if (!resolutionNotes.trim()) {
      setFormError('Mandatory mediation remarks must be provided before updating case status.');
      return;
    }

    let approvedRefundPaise: number | undefined = undefined;
    if (status === 'REFUND_APPROVED') {
      if (!canApproveRefund) {
        setFormError('Your current role does not have permission to approve refunds or shop credits.');
        return;
      }
      const parsed = Number(refundAmountInr);
      if (Number.isNaN(parsed) || parsed < 0) {
        setFormError('Enter a valid non-negative refund amount in INR.');
        return;
      }
      const paise = Math.round(parsed * 100);
      if (paise > selectedCase.amountPaise) {
        setFormError(
          `Approved refund cannot exceed disputed order value (${formatINR(selectedCase.amountPaise)}).`
        );
        return;
      }
      approvedRefundPaise = paise;
    }

    updateSupportCaseStatus(
      selectedCase.id,
      status,
      resolutionNotes.trim(),
      approvedRefundPaise
    );
    setFeedback(
      status === 'REFUND_APPROVED' && approvedRefundPaise !== undefined
        ? `Case ${selectedCase.id} approved for ${formatINR(approvedRefundPaise)} refund/credit.`
        : `Support case ${selectedCase.id} updated to ${status.replace(/_/g, ' ')}.`
    );
    setSelectedCase(null);
    setResolutionNotes('');
    setRefundAmountInr('');
    setFormError(null);
    setTimeout(() => setFeedback(null), 4000);
  };

  const openCount = supportCases.filter(
    (c) => c.status === 'OPEN' || c.status === 'INVESTIGATING'
  ).length;

  return (
    <div className="space-y-6 animate-fade-in text-left">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <h1 className="text-xl font-black text-[#1F2937]">Customer Disputes & Grievance Support</h1>
            <Badge variant={openCount > 0 ? 'warning' : 'primary'}>
              {openCount} Active / {supportCases.length} Total
            </Badge>
          </div>
          <p className="text-xs text-[#6B7280]">
            Mediate food quality, missing items, wrong variants, defective electronics/hardware, warranty claims, and Udhari disputes across all verticals.
          </p>
        </div>

        {/* Search & Issue Filter */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-[220px]">
            <Search className="w-4 h-4 text-[#6B7280] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search case, order, customer, shop..."
              className="w-full h-10 pl-10 pr-4 bg-[#F8FAFC] border border-[#E5E7EB] rounded-full text-xs text-[#1F2937] outline-none focus:border-[#218838]"
            />
          </div>

          <select
            value={issueFilter}
            onChange={(e) => setIssueFilter(e.target.value as 'ALL' | SupportIssueType)}
            className="h-10 px-3 bg-[#F8FAFC] border border-[#E5E7EB] rounded-full text-xs font-semibold text-[#1F2937] outline-none focus:border-[#218838]"
          >
            <option value="ALL">All Issue Types</option>
            {(Object.keys(ISSUE_TYPE_LABELS) as SupportIssueType[]).map((key) => (
              <option key={key} value={key}>
                {ISSUE_TYPE_LABELS[key]}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Status Filter Pills */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {CASE_STATUSES.map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap cursor-pointer transition-colors ${
                statusFilter === status
                  ? 'bg-[#218838] text-white'
                  : 'bg-white text-[#475569] border border-[#E5E7EB] hover:bg-[#F8FAFC]'
              }`}
            >
              {status.replace(/_/g, ' ')}
            </button>
          ))}
        </div>

        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={resetFilters}
            leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
          >
            Reset Filters
          </Button>
        )}
      </div>

      {feedback && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold rounded-xl flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-[#16A34A]" />
          <span>{feedback}</span>
        </div>
      )}

      {/* Disputes Table */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-xs overflow-hidden">
        {filteredCases.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-[#F8FAFC] text-[#6B7280] uppercase tracking-wider font-semibold border-b border-[#E5E7EB]">
                <tr>
                  <th className="py-3.5 px-4">Case ID & Order</th>
                  <th className="py-3.5 px-4">Customer Details</th>
                  <th className="py-3.5 px-4">Merchant & Vertical</th>
                  <th className="py-3.5 px-4">Issue Classification</th>
                  <th className="py-3.5 px-4">Disputed / Refund</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Mediation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E7EB]">
                {filteredCases.map((c) => (
                  <tr key={c.id} className="hover:bg-[#F8FAFC]/80 transition-colors">
                    <td className="py-3.5 px-4">
                      <p className="font-mono font-bold text-[#1F2937]">{c.id}</p>
                      <p className="text-[11px] font-mono text-[#6B7280]">{c.orderId}</p>
                    </td>
                    <td className="py-3.5 px-4">
                      <p className="font-bold text-[#1F2937]">{c.customerName}</p>
                      <p className="text-[11px] text-[#6B7280]">{c.customerPhone}</p>
                    </td>
                    <td className="py-3.5 px-4">
                      <p className="font-semibold text-[#1F2937] mb-0.5">{c.sellerName}</p>
                      {c.vertical && <VerticalBadge vertical={c.vertical} />}
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge
                        variant={
                          c.issueType === 'FOOD_QUALITY' ||
                          c.issueType === 'DEFECTIVE_PRODUCT' ||
                          c.issueType === 'DAMAGED_IN_TRANSIT'
                            ? 'error'
                            : c.issueType === 'UDHARI_DISPUTE' ||
                              c.issueType === 'WARRANTY_CLAIM'
                            ? 'info'
                            : 'warning'
                        }
                        size="sm"
                      >
                        {ISSUE_TYPE_LABELS[c.issueType] || c.issueType.replace(/_/g, ' ')}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4">
                      <p className="font-bold text-[#1F2937]">{formatINR(c.amountPaise)}</p>
                      {c.approvedRefundPaise !== undefined && (
                        <p className="text-[10px] font-semibold text-[#218838]">
                          Refund: {formatINR(c.approvedRefundPaise)}
                        </p>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge
                        variant={
                          c.status === 'RESOLVED' ||
                          c.status === 'REFUND_APPROVED' ||
                          c.status === 'CLOSED'
                            ? 'primary'
                            : c.status === 'OPEN'
                            ? 'error'
                            : 'warning'
                        }
                        size="sm"
                      >
                        {c.status.replace(/_/g, ' ')}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => openCaseDrawer(c)}
                      >
                        Manage Case
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8">
            <EmptyState
              icon={<Headphones className="w-6 h-6" />}
              title="No support cases match your filter"
              description="Adjust your search query, status pill, or issue classification filter to inspect logged grievances."
              actionText={hasActiveFilters ? 'Reset Filters' : undefined}
              onAction={hasActiveFilters ? resetFilters : undefined}
            />
          </div>
        )}
      </div>

      {/* Case Management Drawer */}
      <Drawer
        isOpen={!!selectedCase}
        onClose={() => {
          setSelectedCase(null);
          setFormError(null);
        }}
        title={selectedCase ? `Dispute Resolution: ${selectedCase.id}` : 'Case Mediation'}
      >
        {selectedCase && (
          <div className="space-y-5 text-left">
            <div className="p-4 bg-[#F8FAFC] rounded-xl border border-[#E5E7EB] flex items-center justify-between gap-2">
              <div>
                <p className="text-xs text-[#6B7280]">Associated Order</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <p className="text-sm font-mono font-bold text-[#1F2937]">
                    {selectedCase.orderId}
                  </p>
                  {selectedCase.vertical && (
                    <VerticalBadge vertical={selectedCase.vertical} />
                  )}
                </div>
              </div>
              <Badge variant="primary">{selectedCase.status.replace(/_/g, ' ')}</Badge>
            </div>

            {/* Customer Statement */}
            <div className="p-4 bg-red-50/50 rounded-xl border border-red-100 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-red-900">
                  {ISSUE_TYPE_LABELS[selectedCase.issueType] ||
                    selectedCase.issueType.replace(/_/g, ' ')}
                </span>
                <span className="text-xs font-bold text-red-700">
                  Disputed: {formatINR(selectedCase.amountPaise)}
                </span>
              </div>
              <p className="text-xs text-[#1F2937] leading-relaxed italic bg-white p-3 rounded-lg border border-red-100">
                "{selectedCase.description}"
              </p>
              <div className="flex flex-wrap items-center gap-2 pt-1 text-xs text-[#6B7280]">
                <span>
                  Customer: <strong>{selectedCase.customerName}</strong>
                </span>
                <span>•</span>
                <span>
                  Phone: <strong>{selectedCase.customerPhone}</strong>
                </span>
              </div>
            </div>

            {/* Merchant Details */}
            <div className="p-3 bg-white rounded-xl border border-[#E5E7EB] text-xs flex items-center justify-between">
              <div>
                <span className="text-[#6B7280]">Respondent Merchant:</span>
                <p className="font-bold text-[#1F2937] text-sm">{selectedCase.sellerName}</p>
              </div>
              <span className="font-mono text-[11px] text-[#6B7280]">{selectedCase.sellerId}</span>
            </div>

            {/* Optional Partial / Full Refund Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#1F2937] flex items-center justify-between">
                <span>Approved Refund / Shop Credit Amount (₹)</span>
                <span className="text-[11px] font-normal text-[#6B7280]">
                  Max: {formatINR(selectedCase.amountPaise)}
                </span>
              </label>
              <div className="relative">
                <IndianRupee className="w-3.5 h-3.5 text-[#6B7280] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="number"
                  min={0}
                  max={selectedCase.amountPaise / 100}
                  step="0.50"
                  value={refundAmountInr}
                  onChange={(e) => {
                    setRefundAmountInr(e.target.value);
                    if (formError) setFormError(null);
                  }}
                  disabled={!canApproveRefund}
                  placeholder="Enter full or partial refund amount"
                  className="w-full h-10 pl-9 pr-3 text-xs bg-[#F8FAFC] border border-[#E5E7EB] rounded-xl outline-none focus:border-[#218838] disabled:opacity-60"
                />
              </div>
              <p className="text-[11px] text-[#6B7280]">
                Used when clicking "Approve Shop Credit / Refund". Supports partial item refunds without cancelling the full order.
              </p>
            </div>

            {/* Resolution Form */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-[#1F2937] block">
                Official Mediation Notes & Resolution Log *
              </label>
              <textarea
                value={resolutionNotes}
                onChange={(e) => {
                  setResolutionNotes(e.target.value);
                  if (formError) setFormError(null);
                }}
                rows={3}
                disabled={!canManage}
                placeholder="Document resolution discussions with customer and shopkeeper..."
                className="w-full p-3 text-xs bg-[#F8FAFC] border border-[#E5E7EB] rounded-xl outline-none focus:border-[#218838] disabled:opacity-60"
              />
            </div>

            {formError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-semibold flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{formError}</span>
              </div>
            )}

            {/* Decision Actions */}
            {canManage && (
              <div className="pt-4 border-t border-[#E5E7EB] flex flex-wrap items-center justify-end gap-2.5">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => handleUpdateStatus('INVESTIGATING')}
                >
                  Mark Under Investigation
                </Button>
                {canApproveRefund && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleUpdateStatus('REFUND_APPROVED')}
                  >
                    Approve Shop Credit / Refund
                  </Button>
                )}
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => handleUpdateStatus('RESOLVED')}
                >
                  Mark Resolved & Close
                </Button>
              </div>
            )}
          </div>
        )}
      </Drawer>
    </div>
  );
};
