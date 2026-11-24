/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Percent,
  Plus,
  Shield,
  Download,
  Edit3,
  Archive,
  CheckCircle2,
} from 'lucide-react';
import { useAdmin } from '../../contexts/AdminContext';
import { FeeRuleRecord } from '../../types/admin';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { EmptyState } from '../../components/feedback/EmptyState';
import { VerticalBadge } from './components/VerticalBadge';
import { formatINR, rupeesToPaise } from '../../utils/currency';
import { exportToCsv } from '../../utils/exportCsv';

export const AdminFeeRulesView: React.FC = () => {
  const {
    feeRules,
    verticalConfigs,
    togglePilotShadowMode,
    createFeeRule,
    updateFeeRule,
    deprecateFeeRule,
    hasPermission,
  } = useAdmin();

  const canManage = hasPermission('FEE_RULES', 'manage');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<FeeRuleRecord | null>(null);
  const [formError, setFormError] = useState('');
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: '',
    vertical: 'FOOD',
    commissionPercent: '5.0',
    platformFeeRupees: '2.0',
    effectiveFrom: new Date().toISOString().split('T')[0],
    isShadow: true,
  });

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const openModal = (rule?: FeeRuleRecord) => {
    setFormError('');
    if (rule) {
      setEditingRule(rule);
      setForm({
        name: rule.name,
        vertical: rule.vertical,
        commissionPercent: (rule.commissionBps / 100).toFixed(1),
        platformFeeRupees: (rule.platformFeePaise / 100).toFixed(1),
        effectiveFrom: rule.effectiveFrom,
        isShadow: rule.isPilotShadowMode,
      });
    } else {
      setEditingRule(null);
      setForm({
        name: '',
        vertical: 'FOOD',
        commissionPercent: '4.0',
        platformFeeRupees: '2.0',
        effectiveFrom: new Date().toISOString().split('T')[0],
        isShadow: true,
      });
    }
    setIsModalOpen(true);
  };

  const handleExportFeeRulesCsv = () => {
    exportToCsv(
      `grambazaar_fee_rules_${new Date().toISOString().split('T')[0]}`,
      [
        { header: 'Rule ID', accessor: (r) => r.id },
        { header: 'Rule Name', accessor: (r) => r.name },
        { header: 'Vertical', accessor: (r) => r.vertical },
        { header: 'Commission Rate (%)', accessor: (r) => (r.commissionBps / 100).toFixed(2) },
        { header: 'Platform Fee (INR)', accessor: (r) => (r.platformFeePaise / 100).toFixed(2) },
        { header: 'Effective From', accessor: (r) => r.effectiveFrom },
        { header: 'Shadow Pilot Active', accessor: (r) => (r.isPilotShadowMode ? 'YES' : 'NO') },
        { header: 'Status', accessor: (r) => r.status },
      ],
      feeRules
    );
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setFormError('Please provide a descriptive rule name.');
      return;
    }

    const bps = Math.round((parseFloat(form.commissionPercent) || 0) * 100);
    const feePaise = rupeesToPaise(parseFloat(form.platformFeeRupees) || 0);

    if (editingRule) {
      updateFeeRule(editingRule.id, {
        name: form.name.trim(),
        vertical: form.vertical,
        commissionBps: bps,
        platformFeePaise: feePaise,
        effectiveFrom: form.effectiveFrom,
        isPilotShadowMode: form.isShadow,
      });
      showToast(`Updated fee rule "${form.name.trim()}"`);
    } else {
      createFeeRule({
        name: form.name.trim(),
        vertical: form.vertical,
        commissionBps: bps,
        platformFeePaise: feePaise,
        effectiveFrom: form.effectiveFrom,
        isPilotShadowMode: form.isShadow,
      });
      showToast(`Created fee rule "${form.name.trim()}"`);
    }

    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6 animate-fade-in text-left">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <h1 className="text-xl font-black text-[#1F2937]">Fee Rules & Commission Governance</h1>
            <Badge variant="primary">Multi-Vertical Tariff Engine</Badge>
          </div>
          <p className="text-xs text-[#6B7280]">
            Define platform commission rates (basis points) and fixed facilitation fees across any vertical, with Pilot Shadow Mode simulation.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={handleExportFeeRulesCsv}
            leftIcon={<Download className="w-3.5 h-3.5" />}
          >
            Export CSV
          </Button>
          {canManage && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => openModal()}
              leftIcon={<Plus className="w-3.5 h-3.5" />}
            >
              Create Fee Rule
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

      {/* Shadow Mode Info */}
      <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-start gap-3">
        <Shield className="w-5 h-5 text-[#218838] shrink-0 mt-0.5" />
        <div className="text-xs text-[#1F2937] space-y-1">
          <p className="font-bold text-[#176B2C]">Pilot Shadow Mode</p>
          <p className="text-[#475569] leading-relaxed">
            In <strong>Shadow Mode</strong>, commission calculations are recorded in financial analytics and audit logs while 100% of net order value is settled to local sellers during village onboarding.
          </p>
        </div>
      </div>

      {/* Fee Rules Table */}
      {feeRules.length === 0 ? (
        <EmptyState
          icon={<Percent className="w-7 h-7" />}
          title="No fee rules configured"
          description="Create commission rules for Food, Grocery, Hardware, Electronics, Clothing, Furniture, or Agriculture."
          actionText={canManage ? 'Create Fee Rule' : undefined}
          onAction={canManage ? () => openModal() : undefined}
        />
      ) : (
        <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-[#F8FAFC] text-[#6B7280] uppercase tracking-wider font-semibold border-b border-[#E5E7EB]">
                <tr>
                  <th className="py-3.5 px-4">Rule Name</th>
                  <th className="py-3.5 px-4">Vertical</th>
                  <th className="py-3.5 px-4">Commission</th>
                  <th className="py-3.5 px-4">Platform Fee</th>
                  <th className="py-3.5 px-4">Effective From</th>
                  <th className="py-3.5 px-4">Mode & Status</th>
                  {canManage && <th className="py-3.5 px-4 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E7EB]">
                {feeRules.map((rule) => (
                  <tr key={rule.id} className="hover:bg-[#F8FAFC]/80 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-[#1F2937]">{rule.name}</td>
                    <td className="py-3.5 px-4">
                      <VerticalBadge vertical={rule.vertical} />
                    </td>
                    <td className="py-3.5 px-4 font-bold text-[#1F2937]">
                      {(rule.commissionBps / 100).toFixed(1)}%{' '}
                      <span className="text-[10px] text-[#6B7280] font-normal">({rule.commissionBps} bps)</span>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-[#1F2937]">
                      {formatINR(rule.platformFeePaise)}
                    </td>
                    <td className="py-3.5 px-4 text-[#6B7280]">{rule.effectiveFrom}</td>
                    <td className="py-3.5 px-4">
                      <div className="flex flex-wrap gap-1.5">
                        <Badge variant={rule.isPilotShadowMode ? 'warning' : 'success'} size="sm">
                          {rule.isPilotShadowMode ? 'Shadow Pilot' : 'Live Deduction'}
                        </Badge>
                        {rule.status === 'DEPRECATED' && (
                          <Badge variant="neutral" size="sm">Deprecated</Badge>
                        )}
                      </div>
                    </td>
                    {canManage && (
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5">
                          <Button variant="ghost" size="sm" onClick={() => openModal(rule)}>
                            <Edit3 className="w-3.5 h-3.5" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => togglePilotShadowMode(rule.id)}>
                            {rule.isPilotShadowMode ? 'Go Live' : 'Shadow'}
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => deprecateFeeRule(rule.id)}>
                            <Archive className="w-3.5 h-3.5 text-[#6B7280]" />
                          </Button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create / Edit Rule Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingRule ? 'Edit Fee Rule' : 'Create Fee Rule Version'}
        size="md"
      >
        <form onSubmit={handleSave} className="space-y-4 text-left">
          {formError && <div className="p-3 rounded-xl bg-[#FEE2E2] text-[#DC2626] text-xs font-semibold">{formError}</div>}
          <Input
            label="Rule Name"
            placeholder="e.g. Electronics & Appliances Standard Rule"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Select
              label="Target Vertical"
              value={form.vertical}
              onChange={(e) => setForm({ ...form, vertical: e.target.value })}
              options={[
                { value: 'ALL', label: 'All Verticals' },
                ...verticalConfigs.map((v) => ({ value: v.id, label: v.name })),
              ]}
            />
            <Input
              label="Effective From"
              type="date"
              value={form.effectiveFrom}
              onChange={(e) => setForm({ ...form, effectiveFrom: e.target.value })}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Commission (%)"
              type="number"
              step="0.1"
              value={form.commissionPercent}
              onChange={(e) => setForm({ ...form, commissionPercent: e.target.value })}
              required
            />
            <Input
              label="Platform Fee (₹)"
              type="number"
              step="0.5"
              value={form.platformFeeRupees}
              onChange={(e) => setForm({ ...form, platformFeeRupees: e.target.value })}
              required
            />
          </div>
          <div className="p-3 bg-[#F8FAFC] rounded-xl border border-[#E5E7EB] flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-[#1F2937]">Enable Shadow Mode</p>
              <p className="text-[11px] text-[#6B7280]">Track in reports without charging rural sellers</p>
            </div>
            <input
              type="checkbox"
              checked={form.isShadow}
              onChange={(e) => setForm({ ...form, isShadow: e.target.checked })}
              className="w-4 h-4 accent-[#218838] cursor-pointer"
            />
          </div>
          <div className="pt-3 border-t border-[#E5E7EB] flex items-center justify-end gap-2.5">
            <Button variant="secondary" size="sm" type="button" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit">
              {editingRule ? 'Update Rule' : 'Save Rule Version'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
