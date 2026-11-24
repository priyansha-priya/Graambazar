/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useState } from 'react';
import {
  Award,
  CheckCircle2,
  ClipboardCheck,
  Search,
  ShieldAlert,
  ShieldCheck,
  Utensils,
  ShoppingBag,
  Eye,
  FileCheck2,
  AlertTriangle,
} from 'lucide-react';
import { MOCK_SELLERS } from '../../constants/mockData';
import { useSafety } from '../../contexts/SafetyContext';
import { useAdmin } from '../../contexts/AdminContext';
import { CertificationBadgeLevel, InspectionOutcome } from '../../types/safety';
import { formatDateTime } from '../../utils/dates';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';

export const AdminSafetyQualityView: React.FC = () => {
  const { currentAdmin } = useAdmin();
  const {
    getSellerProfile,
    getSellerMetrics,
    recordAdminInspection,
    assignRetraining,
    clearRetraining,
    toggleSafetySuspension,
  } = useSafety();

  const [searchQuery, setSearchQuery] = useState('');
  const [trackFilter, setTrackFilter] = useState<'ALL' | 'FOOD' | 'GROCERY'>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | CertificationBadgeLevel>('ALL');
  const [selectedSellerId, setSelectedSellerId] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Inspection Form State inside Modal
  const [inspectionScore, setInspectionScore] = useState<number>(88);
  const [inspectionOutcome, setInspectionOutcome] = useState<InspectionOutcome>('PASSED');
  const [inspectionRemarks, setInspectionRemarks] = useState<string>('');
  const [inspectionFinding, setInspectionFinding] = useState<string>('');

  const showToast = (msg: string) => {
    setToastMsg(msg);
    window.setTimeout(() => setToastMsg(null), 3500);
  };

  const sellerRows = useMemo(() => {
    return MOCK_SELLERS.map((seller) => {
      const profile = getSellerProfile(seller.id);
      const metrics = getSellerMetrics(seller.id);
      return { seller, profile, metrics };
    });
  }, [getSellerProfile, getSellerMetrics]);

  const kpiStats = useMemo(() => {
    const total = sellerRows.length;
    const certified = sellerRows.filter((r) => r.metrics.isCertified).length;
    const avgCompliance =
      total > 0
        ? Math.round(
            sellerRows.reduce((sum, r) => sum + r.metrics.overallComplianceScore, 0) / total
          )
        : 0;
    const todayChecklists = sellerRows.filter((r) => r.metrics.completedTodayChecklist).length;
    const actionRequired = sellerRows.filter(
      (r) => r.metrics.badgeLevel === 'ACTION_REQUIRED'
    ).length;

    return { total, certified, avgCompliance, todayChecklists, actionRequired };
  }, [sellerRows]);

  const filteredRows = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return sellerRows
      .filter((row) => {
        if (trackFilter !== 'ALL' && row.metrics.track !== trackFilter) return false;
        if (statusFilter !== 'ALL' && row.metrics.badgeLevel !== statusFilter) return false;
        if (!q) return true;
        return (
          row.seller.publicName.toLowerCase().includes(q) ||
          row.seller.villageName.toLowerCase().includes(q) ||
          row.seller.sellerType.toLowerCase().includes(q) ||
          (row.profile.certificateNumber?.toLowerCase().includes(q) ?? false)
        );
      })
      .sort((a, b) => a.metrics.overallComplianceScore - b.metrics.overallComplianceScore);
  }, [sellerRows, trackFilter, statusFilter, searchQuery]);

  const selectedRecord = selectedSellerId
    ? sellerRows.find((r) => r.seller.id === selectedSellerId) ?? null
    : null;

  const handleOpenAuditModal = (sellerId: string) => {
    const row = sellerRows.find((r) => r.seller.id === sellerId);
    setSelectedSellerId(sellerId);
    setInspectionScore(row ? Math.max(50, row.metrics.overallComplianceScore) : 85);
    setInspectionOutcome('PASSED');
    setInspectionRemarks('');
    setInspectionFinding('');
  };

  const handleSaveInspection = () => {
    if (!selectedRecord) return;
    const remarksText =
      inspectionRemarks.trim() ||
      (inspectionOutcome === 'PASSED'
        ? 'Spot hygiene and storage verification passed all marketplace standards.'
        : 'Corrective safety action and mandatory module review assigned.');
    const findings = inspectionFinding
      .split('\n')
      .map((f) => f.trim())
      .filter(Boolean);

    recordAdminInspection(
      selectedRecord.seller.id,
      `${currentAdmin.name} (Admin Quality Audit)`,
      inspectionScore,
      inspectionOutcome,
      remarksText,
      findings
    );
    showToast(
      `Inspection logged for ${selectedRecord.seller.publicName} (${inspectionScore}% · ${inspectionOutcome.replace(/_/g, ' ')}).`
    );
    setInspectionRemarks('');
    setInspectionFinding('');
  };

  const badgeTone = (level: CertificationBadgeLevel) => {
    switch (level) {
      case 'GOLD_CERTIFIED':
        return 'bg-[#E8F5E9] text-[#176B2C]';
      case 'VERIFIED_SAFE':
        return 'bg-[#DBEAFE] text-[#1D4ED8]';
      case 'IN_PROGRESS':
        return 'bg-[#FEF3C7] text-[#B45309]';
      case 'ACTION_REQUIRED':
        return 'bg-[#FEE2E2] text-[#B91C1C]';
    }
  };

  return (
    <div className="space-y-5 text-left animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-[#1F2937] tracking-tight">
            Food &amp; Grocery Safety, Quality &amp; Assessments
          </h1>
          <p className="text-xs sm:text-sm text-[#6B7280] mt-0.5">
            Monitor seller hygiene training, daily compliance checklists, examination scores, and field inspections across all villages.
          </p>
        </div>
      </div>

      {toastMsg && (
        <div className="px-4 py-3 rounded-xl bg-[#E8F5E9] border border-[#218838]/30 text-xs font-semibold text-[#176B2C] flex items-center justify-between">
          <span className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#16A34A]" />
            {toastMsg}
          </span>
          <button
            type="button"
            onClick={() => setToastMsg(null)}
            className="font-bold hover:underline cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* 4 Enterprise KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-4 space-y-1.5">
          <div className="flex items-center justify-between text-xs text-[#6B7280]">
            <span className="font-semibold">Certified Safe Sellers</span>
            <Award className="w-4 h-4 text-[#218838]" />
          </div>
          <p className="text-2xl font-extrabold text-[#1F2937] tabular-nums">
            {kpiStats.certified} / {kpiStats.total}
          </p>
          <p className="text-[11px] text-[#16A34A] font-medium tabular-nums">
            {Math.round((kpiStats.certified / Math.max(1, kpiStats.total)) * 100)}% platform coverage
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-4 space-y-1.5">
          <div className="flex items-center justify-between text-xs text-[#6B7280]">
            <span className="font-semibold">Avg Compliance Score</span>
            <ShieldCheck className="w-4 h-4 text-[#2563EB]" />
          </div>
          <p className="text-2xl font-extrabold text-[#1F2937] tabular-nums">
            {kpiStats.avgCompliance}%
          </p>
          <p className="text-[11px] text-[#6B7280]">
            Weighted across training, checklist &amp; exam
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-4 space-y-1.5">
          <div className="flex items-center justify-between text-xs text-[#6B7280]">
            <span className="font-semibold">Today&apos;s Checklists Logged</span>
            <ClipboardCheck className="w-4 h-4 text-[#D97706]" />
          </div>
          <p className="text-2xl font-extrabold text-[#1F2937] tabular-nums">
            {kpiStats.todayChecklists} / {kpiStats.total}
          </p>
          <p className="text-[11px] text-[#6B7280]">Daily pre-opening hygiene self-audits</p>
        </div>

        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-4 space-y-1.5">
          <div className="flex items-center justify-between text-xs text-[#6B7280]">
            <span className="font-semibold">Action / Retraining Needed</span>
            <ShieldAlert className="w-4 h-4 text-[#DC2626]" />
          </div>
          <p className="text-2xl font-extrabold text-[#DC2626] tabular-nums">
            {kpiStats.actionRequired}
          </p>
          <p className="text-[11px] text-[#6B7280]">Requires follow-up inspection or re-exam</p>
        </div>
      </div>

      {/* Filters Toolbar */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-[#6B7280] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search shop name, village, or certificate ID..."
            className="w-full h-10 pl-10 pr-4 bg-[#F8FAFC] border border-[#E5E7EB] rounded-full text-xs text-[#1F2937] outline-none focus:border-[#218838]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Track Filter */}
          <div className="inline-flex items-center p-1 bg-[#F1F5F9] rounded-lg border border-[#E5E7EB]">
            {(
              [
                { key: 'ALL', label: 'All Tracks' },
                { key: 'FOOD', label: 'Food Sellers' },
                { key: 'GROCERY', label: 'Grocery Sellers' },
              ] as const
            ).map((opt) => (
              <button
                key={opt.key}
                type="button"
                onClick={() => setTrackFilter(opt.key)}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                  trackFilter === opt.key
                    ? 'bg-white text-[#1F2937] shadow-xs font-bold'
                    : 'text-[#6B7280] hover:text-[#1F2937]'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* Certification Status Select */}
          <select
            aria-label="Filter by certification tier"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as 'ALL' | CertificationBadgeLevel)}
            className="h-10 px-3 bg-[#F8FAFC] border border-[#E5E7EB] rounded-lg text-xs font-semibold text-[#1F2937] outline-none focus:border-[#218838] cursor-pointer"
          >
            <option value="ALL">All Statuses</option>
            <option value="GOLD_CERTIFIED">Gold Certified</option>
            <option value="VERIFIED_SAFE">Verified Safe</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="ACTION_REQUIRED">Action Required</option>
          </select>
        </div>
      </div>

      {/* Seller Compliance Data Table */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#F8FAFC] border-b border-[#E5E7EB] text-[11px] font-bold text-[#6B7280] uppercase tracking-wider">
                <th className="py-3 px-4">Seller &amp; Village</th>
                <th className="py-3 px-4">Track</th>
                <th className="py-3 px-4">Training</th>
                <th className="py-3 px-4 text-right">Checklist</th>
                <th className="py-3 px-4 text-right">Best Exam</th>
                <th className="py-3 px-4 text-right">Overall</th>
                <th className="py-3 px-4">Compliance Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F1F5F9] text-xs">
              {filteredRows.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-[#6B7280]">
                    No sellers match the current safety filter criteria.
                  </td>
                </tr>
              ) : (
                filteredRows.map(({ seller, profile, metrics }) => (
                  <tr key={seller.id} className="hover:bg-[#F8FAFC] transition-colors">
                    <td className="py-3 px-4">
                      <p className="font-bold text-[#1F2937]">{seller.publicName}</p>
                      <p className="text-[11px] text-[#6B7280]">
                        {seller.villageName} · {seller.sellerType}
                        {profile.certificateNumber ? ` · ${profile.certificateNumber}` : ''}
                      </p>
                    </td>

                    <td className="py-3 px-4">
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#374151]">
                        {metrics.track === 'FOOD' ? (
                          <Utensils className="w-3.5 h-3.5 text-[#D97706]" />
                        ) : (
                          <ShoppingBag className="w-3.5 h-3.5 text-[#218838]" />
                        )}
                        {metrics.track === 'FOOD' ? 'Food' : 'Grocery'}
                      </span>
                    </td>

                    <td className="py-3 px-4 min-w-[130px]">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 bg-[#E5E7EB] rounded-full overflow-hidden">
                          <div
                            className="h-full bg-[#218838] rounded-full"
                            style={{ width: `${metrics.trainingProgressPercent}%` }}
                          />
                        </div>
                        <span className="tabular-nums font-semibold text-[#1F2937]">
                          {metrics.completedModulesCount}/{metrics.totalModulesCount}
                        </span>
                      </div>
                    </td>

                    <td className="py-3 px-4 text-right tabular-nums font-semibold text-[#1F2937]">
                      {metrics.latestChecklistScore !== null
                        ? `${metrics.latestChecklistScore}%`
                        : '—'}
                    </td>

                    <td className="py-3 px-4 text-right tabular-nums font-semibold">
                      {metrics.bestExamScore !== null ? (
                        <span
                          className={
                            metrics.bestExamScore >= 80 ? 'text-[#16A34A]' : 'text-[#DC2626]'
                          }
                        >
                          {metrics.bestExamScore}%
                        </span>
                      ) : (
                        <span className="text-[#9CA3AF]">Not taken</span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-right tabular-nums font-extrabold text-[#1F2937]">
                      {metrics.overallComplianceScore}%
                    </td>

                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-bold ${badgeTone(
                          metrics.badgeLevel
                        )}`}
                      >
                        {metrics.badgeLabel}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-right">
                      <Button
                        variant="secondary"
                        size="sm"
                        leftIcon={<Eye className="w-3.5 h-3.5" />}
                        onClick={() => handleOpenAuditModal(seller.id)}
                      >
                        Audit &amp; Inspect
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Inspection & Governance Modal */}
      <Modal
        isOpen={Boolean(selectedRecord)}
        onClose={() => setSelectedSellerId(null)}
        title={
          selectedRecord
            ? `Safety & Quality Audit — ${selectedRecord.seller.publicName}`
            : 'Safety Audit'
        }
        size="lg"
      >
        {selectedRecord && (
          <div className="space-y-5 text-left">
            {/* Summary Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 bg-[#F8FAFC] rounded-xl border border-[#E5E7EB] text-xs">
              <div>
                <p className="text-[#6B7280]">Track</p>
                <p className="font-bold text-[#1F2937] mt-0.5">{selectedRecord.metrics.track}</p>
              </div>
              <div>
                <p className="text-[#6B7280]">Training</p>
                <p className="font-bold text-[#1F2937] mt-0.5 tabular-nums">
                  {selectedRecord.metrics.completedModulesCount}/
                  {selectedRecord.metrics.totalModulesCount} ({selectedRecord.metrics.trainingProgressPercent}%)
                </p>
              </div>
              <div>
                <p className="text-[#6B7280]">Exam Score</p>
                <p className="font-bold text-[#1F2937] mt-0.5 tabular-nums">
                  {selectedRecord.metrics.bestExamScore !== null
                    ? `${selectedRecord.metrics.bestExamScore}%`
                    : 'Not taken'}
                </p>
              </div>
              <div>
                <p className="text-[#6B7280]">Overall Score</p>
                <p className="font-extrabold text-[#176B2C] mt-0.5 tabular-nums">
                  {selectedRecord.metrics.overallComplianceScore}%
                </p>
              </div>
            </div>

            {/* Governance Quick Controls */}
            <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-[#E5E7EB]">
              <div className="text-xs">
                <p className="font-bold text-[#1F2937]">Compliance Enforcement</p>
                <p className="text-[#6B7280]">
                  {selectedRecord.profile.retrainingRequired
                    ? `Retraining active: ${selectedRecord.profile.retrainingReason || 'Mandatory review'}`
                    : 'No active compliance hold on this seller.'}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {selectedRecord.profile.retrainingRequired ? (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      clearRetraining(selectedRecord.seller.id);
                      showToast(`Retraining flag cleared for ${selectedRecord.seller.publicName}.`);
                    }}
                  >
                    Clear Retraining
                  </Button>
                ) : (
                  <Button
                    variant="secondary"
                    size="sm"
                    leftIcon={<AlertTriangle className="w-3.5 h-3.5 text-[#D97706]" />}
                    onClick={() => {
                      assignRetraining(
                        selectedRecord.seller.id,
                        'Admin requested refresher training on hygiene, storage & expiry controls.'
                      );
                      showToast(`Retraining assigned to ${selectedRecord.seller.publicName}.`);
                    }}
                  >
                    Assign Retraining
                  </Button>
                )}

                <Button
                  variant={selectedRecord.profile.suspendedForSafety ? 'primary' : 'destructive'}
                  size="sm"
                  onClick={() => {
                    const nextPause = !selectedRecord.profile.suspendedForSafety;
                    toggleSafetySuspension(selectedRecord.seller.id, nextPause);
                    showToast(
                      nextPause
                        ? `${selectedRecord.seller.publicName} paused pending safety compliance.`
                        : `${selectedRecord.seller.publicName} restored to active standing.`
                    );
                  }}
                >
                  {selectedRecord.profile.suspendedForSafety
                    ? 'Restore Store'
                    : 'Pause for Safety'}
                </Button>
              </div>
            </div>

            {/* Log New Field Inspection Form */}
            <div className="space-y-3">
              <h4 className="text-sm font-bold text-[#1F2937] flex items-center gap-1.5">
                <FileCheck2 className="w-4 h-4 text-[#218838]" />
                <span>Log Field / Spot Inspection Audit</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#1F2937] mb-1">
                    Inspection Score (0–100%)
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={inspectionScore}
                    onChange={(e) =>
                      setInspectionScore(Math.max(0, Math.min(100, Number(e.target.value) || 0)))
                    }
                    className="w-full h-10 px-3 bg-[#F8FAFC] border border-[#E5E7EB] rounded-xl text-xs font-bold text-[#1F2937] outline-none focus:border-[#218838] tabular-nums"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#1F2937] mb-1">
                    Audit Outcome
                  </label>
                  <select
                    value={inspectionOutcome}
                    onChange={(e) => setInspectionOutcome(e.target.value as InspectionOutcome)}
                    className="w-full h-10 px-3 bg-[#F8FAFC] border border-[#E5E7EB] rounded-xl text-xs font-semibold text-[#1F2937] outline-none focus:border-[#218838]"
                  >
                    <option value="PASSED">Passed Inspection</option>
                    <option value="WARNING_ISSUED">Warning Issued</option>
                    <option value="RETRAINING_REQUIRED">Retraining Required</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1F2937] mb-1">
                  Inspector Remarks
                </label>
                <input
                  type="text"
                  value={inspectionRemarks}
                  onChange={(e) => setInspectionRemarks(e.target.value)}
                  placeholder="Summary of kitchen/store hygiene, storage, and expiry compliance..."
                  className="w-full h-10 px-3 bg-[#F8FAFC] border border-[#E5E7EB] rounded-xl text-xs text-[#1F2937] outline-none focus:border-[#218838]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1F2937] mb-1">
                  Key Findings (one per line, optional)
                </label>
                <textarea
                  rows={2}
                  value={inspectionFinding}
                  onChange={(e) => setInspectionFinding(e.target.value)}
                  placeholder="e.g. Clean covered storage drums verified&#10;FEFO shelf rotation confirmed"
                  className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#E5E7EB] rounded-xl text-xs text-[#1F2937] outline-none focus:border-[#218838]"
                />
              </div>

              <div className="flex justify-end">
                <Button variant="primary" size="sm" onClick={handleSaveInspection}>
                  Save Inspection Audit
                </Button>
              </div>
            </div>

            {/* Past Inspections */}
            {selectedRecord.profile.inspections.length > 0 && (
              <div className="pt-4 border-t border-[#E5E7EB] space-y-2.5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#6B7280]">
                  Audit Trail ({selectedRecord.profile.inspections.length})
                </h4>
                <div className="divide-y divide-[#F1F5F9] max-h-48 overflow-y-auto">
                  {selectedRecord.profile.inspections.map((insp) => (
                    <div key={insp.id} className="py-2.5 text-xs space-y-0.5">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-[#1F2937]">{insp.inspectorName}</span>
                        <span className="font-bold tabular-nums text-[#176B2C]">
                          {insp.scorePercent}% · {insp.outcome.replace(/_/g, ' ')}
                        </span>
                      </div>
                      <p className="text-[#475569]">{insp.remarks}</p>
                      <p className="text-[11px] text-[#9CA3AF]">{formatDateTime(insp.inspectedAt)}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};
