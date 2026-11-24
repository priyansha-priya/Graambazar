import React, { useState } from 'react';
import {
  CheckCircle2,
  Edit3,
  Plus,
  Receipt,
  ShieldAlert,
  Trash2,
} from 'lucide-react';
import { useAdmin } from '../../contexts/AdminContext';
import { CancellationPolicyRuleRecord, TaxSlabRecord } from '../../types/admin';
import { Tabs } from '../../components/ui/Tabs';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { ConfirmDialog } from '../../components/feedback/ConfirmDialog';
import { VerticalBadge } from './components/VerticalBadge';

export const AdminTaxPoliciesView: React.FC = () => {
  const {
    taxSlabs,
    addTaxSlab,
    updateTaxSlab,
    toggleTaxSlabStatus,
    deleteTaxSlab,
    cancellationRules,
    addCancellationRule,
    updateCancellationRule,
    toggleCancellationRuleStatus,
    deleteCancellationRule,
    verticalConfigs,
    hasPermission,
  } = useAdmin();

  const canManage = hasPermission('POLICIES_TAX', 'manage');
  const [activeTab, setActiveTab] = useState<'TAX' | 'CANCELLATION'>('TAX');
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Tax modal state
  const [taxModalOpen, setTaxModalOpen] = useState(false);
  const [editingTax, setEditingTax] = useState<TaxSlabRecord | null>(null);
  const [deleteTaxId, setDeleteTaxId] = useState<string | null>(null);
  const [taxForm, setTaxForm] = useState({
    name: '',
    vertical: 'GROCERY',
    gstPercent: '5',
    hsnPrefix: '',
    isInclusive: true,
    description: '',
  });

  // Cancellation modal state
  const [ruleModalOpen, setRuleModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<CancellationPolicyRuleRecord | null>(null);
  const [deleteRuleId, setDeleteRuleId] = useState<string | null>(null);
  const [ruleForm, setRuleForm] = useState({
    actor: 'CUSTOMER' as CancellationPolicyRuleRecord['actor'],
    code: '',
    label: '',
    freeCancelWindowMins: '5',
    penaltyPercent: '0',
    autoRefundEligible: true,
  });

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const openTaxModal = (slab?: TaxSlabRecord) => {
    if (slab) {
      setEditingTax(slab);
      setTaxForm({
        name: slab.name,
        vertical: slab.vertical,
        gstPercent: String(slab.gstPercent),
        hsnPrefix: slab.hsnPrefix,
        isInclusive: slab.isInclusive,
        description: slab.description,
      });
    } else {
      setEditingTax(null);
      setTaxForm({
        name: '',
        vertical: 'GROCERY',
        gstPercent: '5',
        hsnPrefix: '',
        isInclusive: true,
        description: '',
      });
    }
    setTaxModalOpen(true);
  };

  const handleSaveTax = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taxForm.name.trim()) return;
    const payload = {
      name: taxForm.name.trim(),
      vertical: taxForm.vertical,
      gstPercent: Number(taxForm.gstPercent) || 0,
      hsnPrefix: taxForm.hsnPrefix.trim() || 'GENERAL',
      isInclusive: taxForm.isInclusive,
      description: taxForm.description.trim(),
      isActive: editingTax ? editingTax.isActive : true,
    };
    if (editingTax) {
      updateTaxSlab(editingTax.id, payload);
      showToast(`Updated GST slab "${payload.name}".`);
    } else {
      addTaxSlab(payload);
      showToast(`Added ${payload.gstPercent}% GST slab "${payload.name}".`);
    }
    setTaxModalOpen(false);
  };

  const openRuleModal = (rule?: CancellationPolicyRuleRecord) => {
    if (rule) {
      setEditingRule(rule);
      setRuleForm({
        actor: rule.actor,
        code: rule.code,
        label: rule.label,
        freeCancelWindowMins: String(rule.freeCancelWindowMins),
        penaltyPercent: String(rule.penaltyPercent),
        autoRefundEligible: rule.autoRefundEligible,
      });
    } else {
      setEditingRule(null);
      setRuleForm({
        actor: 'CUSTOMER',
        code: '',
        label: '',
        freeCancelWindowMins: '5',
        penaltyPercent: '0',
        autoRefundEligible: true,
      });
    }
    setRuleModalOpen(true);
  };

  const handleSaveRule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ruleForm.code.trim() || !ruleForm.label.trim()) return;
    const payload = {
      actor: ruleForm.actor,
      code: ruleForm.code.trim().toUpperCase().replace(/\s+/g, '_'),
      label: ruleForm.label.trim(),
      freeCancelWindowMins: Math.max(0, parseInt(ruleForm.freeCancelWindowMins, 10) || 0),
      penaltyPercent: Math.min(100, Math.max(0, parseInt(ruleForm.penaltyPercent, 10) || 0)),
      autoRefundEligible: ruleForm.autoRefundEligible,
      isActive: editingRule ? editingRule.isActive : true,
    };
    if (editingRule) {
      updateCancellationRule(editingRule.id, payload);
      showToast(`Updated cancellation rule ${payload.code}.`);
    } else {
      addCancellationRule(payload);
      showToast(`Created cancellation rule ${payload.code}.`);
    }
    setRuleModalOpen(false);
  };

  return (
    <div className="space-y-6 animate-fade-in text-left">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <h1 className="text-xl font-black text-[#1F2937]">Tax / GST &amp; Cancellation Policies</h1>
            <Badge variant="primary">Compliance Rules</Badge>
          </div>
          <p className="text-xs text-[#6B7280]">
            Configure vertical-wise GST tax slabs (0%, 5%, 12%, 18%) and standardized cancellation / auto-refund policies.
          </p>
        </div>

        {canManage && (
          <Button
            variant="primary"
            size="sm"
            onClick={() => (activeTab === 'TAX' ? openTaxModal() : openRuleModal())}
            leftIcon={<Plus className="w-3.5 h-3.5" />}
          >
            {activeTab === 'TAX' ? 'Add GST Slab' : 'Add Cancellation Rule'}
          </Button>
        )}
      </div>

      {toastMsg && (
        <div className="bg-[#E8F5E9] border border-[#218838]/30 text-[#176B2C] px-4 py-3 rounded-xl text-sm font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

      <Tabs
        activeTab={activeTab}
        onChange={(id) => setActiveTab(id as 'TAX' | 'CANCELLATION')}
        tabs={[
          { id: 'TAX', label: 'GST & Tax Slabs', count: taxSlabs.length },
          { id: 'CANCELLATION', label: 'Cancellation & Refund Rules', count: cancellationRules.length },
        ]}
      />

      {activeTab === 'TAX' && (
        <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-[#F8FAFC] text-[#6B7280] uppercase font-semibold border-b border-[#E5E7EB]">
                <tr>
                  <th className="py-3.5 px-4">Tax Slab Name</th>
                  <th className="py-3.5 px-4">Vertical</th>
                  <th className="py-3.5 px-4">GST %</th>
                  <th className="py-3.5 px-4">HSN / SAC</th>
                  <th className="py-3.5 px-4">Pricing Mode</th>
                  <th className="py-3.5 px-4">Status</th>
                  {canManage && <th className="py-3.5 px-4 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E7EB]">
                {taxSlabs.map((t) => (
                  <tr key={t.id} className="hover:bg-[#F8FAFC]/80">
                    <td className="py-3.5 px-4">
                      <p className="font-bold text-[#1F2937]">{t.name}</p>
                      <p className="text-[11px] text-[#6B7280]">{t.description}</p>
                    </td>
                    <td className="py-3.5 px-4">
                      <VerticalBadge vertical={t.vertical} />
                    </td>
                    <td className="py-3.5 px-4 font-black text-[#1F2937]">{t.gstPercent}%</td>
                    <td className="py-3.5 px-4 font-mono text-[11px] text-[#475569]">{t.hsnPrefix}</td>
                    <td className="py-3.5 px-4">
                      <Badge variant="neutral" size="sm">
                        {t.isInclusive ? 'MRP Inclusive' : 'Added at Checkout'}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge variant={t.isActive ? 'success' : 'neutral'} size="sm" dot>
                        {t.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </td>
                    {canManage && (
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="inline-flex gap-1">
                          <Button variant="ghost" size="sm" onClick={() => toggleTaxSlabStatus(t.id)}>
                            {t.isActive ? 'Disable' : 'Enable'}
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => openTaxModal(t)}>
                            <Edit3 className="w-3.5 h-3.5" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => setDeleteTaxId(t.id)}>
                            <Trash2 className="w-3.5 h-3.5 text-[#DC2626]" />
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

      {activeTab === 'CANCELLATION' && (
        <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-[#F8FAFC] text-[#6B7280] uppercase font-semibold border-b border-[#E5E7EB]">
                <tr>
                  <th className="py-3.5 px-4">Reason Code &amp; Policy</th>
                  <th className="py-3.5 px-4">Initiated By</th>
                  <th className="py-3.5 px-4">Free Window</th>
                  <th className="py-3.5 px-4">Penalty %</th>
                  <th className="py-3.5 px-4">Auto-Refund</th>
                  <th className="py-3.5 px-4">Status</th>
                  {canManage && <th className="py-3.5 px-4 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E7EB]">
                {cancellationRules.map((r) => (
                  <tr key={r.id} className="hover:bg-[#F8FAFC]/80">
                    <td className="py-3.5 px-4">
                      <p className="font-bold text-[#1F2937]">{r.label}</p>
                      <p className="text-[11px] font-mono text-[#6B7280]">{r.code}</p>
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge
                        variant={r.actor === 'SELLER' ? 'warning' : r.actor === 'CUSTOMER' ? 'info' : 'error'}
                        size="sm"
                      >
                        {r.actor.replace('_', ' ')}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-[#1F2937]">{r.freeCancelWindowMins} mins</td>
                    <td className="py-3.5 px-4 font-bold text-[#1F2937]">{r.penaltyPercent}%</td>
                    <td className="py-3.5 px-4">
                      <Badge variant={r.autoRefundEligible ? 'success' : 'neutral'} size="sm">
                        {r.autoRefundEligible ? 'Auto-Refund' : 'Manual Review'}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge variant={r.isActive ? 'success' : 'neutral'} size="sm" dot>
                        {r.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </td>
                    {canManage && (
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="inline-flex gap-1">
                          <Button variant="ghost" size="sm" onClick={() => toggleCancellationRuleStatus(r.id)}>
                            {r.isActive ? 'Disable' : 'Enable'}
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => openRuleModal(r)}>
                            <Edit3 className="w-3.5 h-3.5" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => setDeleteRuleId(r.id)}>
                            <Trash2 className="w-3.5 h-3.5 text-[#DC2626]" />
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

      {/* Tax Modal */}
      <Modal
        isOpen={taxModalOpen}
        onClose={() => setTaxModalOpen(false)}
        title={editingTax ? 'Edit GST Slab' : 'Create Tax / GST Slab'}
        size="md"
      >
        <form onSubmit={handleSaveTax} className="space-y-4 text-left">
          <Input
            label="Slab Name"
            value={taxForm.name}
            onChange={(e) => setTaxForm({ ...taxForm, name: e.target.value })}
            placeholder="e.g. Electronics & Accessories 18% GST"
            required
          />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Select
              label="Vertical"
              value={taxForm.vertical}
              onChange={(e) => setTaxForm({ ...taxForm, vertical: e.target.value })}
              options={[
                { value: 'ALL', label: 'All Verticals' },
                ...verticalConfigs.map((v) => ({ value: v.id, label: v.name })),
              ]}
            />
            <Input
              label="GST Rate (%)"
              type="number"
              min="0"
              max="28"
              value={taxForm.gstPercent}
              onChange={(e) => setTaxForm({ ...taxForm, gstPercent: e.target.value })}
              required
            />
            <Input
              label="HSN / SAC Prefix"
              value={taxForm.hsnPrefix}
              onChange={(e) => setTaxForm({ ...taxForm, hsnPrefix: e.target.value })}
              placeholder="e.g. 996331"
            />
          </div>
          <Input
            label="Description"
            value={taxForm.description}
            onChange={(e) => setTaxForm({ ...taxForm, description: e.target.value })}
          />
          <label className="flex items-center justify-between p-3 rounded-xl bg-[#F8FAFC] border border-[#E5E7EB] text-xs cursor-pointer">
            <span className="font-semibold text-[#1F2937]">Price is GST Inclusive (MRP includes tax)</span>
            <input
              type="checkbox"
              checked={taxForm.isInclusive}
              onChange={(e) => setTaxForm({ ...taxForm, isInclusive: e.target.checked })}
              className="w-4 h-4 accent-[#218838]"
            />
          </label>
          <div className="flex justify-end gap-2 pt-2 border-t border-[#E5E7EB]">
            <Button variant="secondary" size="sm" type="button" onClick={() => setTaxModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit" leftIcon={<Receipt className="w-3.5 h-3.5" />}>
              {editingTax ? 'Save Slab' : 'Create Slab'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Cancellation Rule Modal */}
      <Modal
        isOpen={ruleModalOpen}
        onClose={() => setRuleModalOpen(false)}
        title={editingRule ? 'Edit Cancellation Rule' : 'Add Cancellation Policy Rule'}
        size="md"
      >
        <form onSubmit={handleSaveRule} className="space-y-4 text-left">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Select
              label="Initiated By"
              value={ruleForm.actor}
              onChange={(e) =>
                setRuleForm({ ...ruleForm, actor: e.target.value as CancellationPolicyRuleRecord['actor'] })
              }
              options={[
                { value: 'CUSTOMER', label: 'Customer' },
                { value: 'SELLER', label: 'Seller' },
                { value: 'DELIVERY_FAILED', label: 'Delivery Failed' },
              ]}
            />
            <Input
              label="Reason Code"
              value={ruleForm.code}
              onChange={(e) => setRuleForm({ ...ruleForm, code: e.target.value })}
              placeholder="e.g. LATE_DELIVERY_CANCEL"
              required
            />
          </div>
          <Input
            label="Policy Description"
            value={ruleForm.label}
            onChange={(e) => setRuleForm({ ...ruleForm, label: e.target.value })}
            placeholder="Describe when this cancellation rule applies"
            required
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Free Cancel Window (mins)"
              type="number"
              min="0"
              value={ruleForm.freeCancelWindowMins}
              onChange={(e) => setRuleForm({ ...ruleForm, freeCancelWindowMins: e.target.value })}
            />
            <Input
              label="Penalty (%)"
              type="number"
              min="0"
              max="100"
              value={ruleForm.penaltyPercent}
              onChange={(e) => setRuleForm({ ...ruleForm, penaltyPercent: e.target.value })}
            />
          </div>
          <label className="flex items-center justify-between p-3 rounded-xl bg-[#F8FAFC] border border-[#E5E7EB] text-xs cursor-pointer">
            <span className="font-semibold text-[#1F2937]">Eligible for Automatic Instant Refund</span>
            <input
              type="checkbox"
              checked={ruleForm.autoRefundEligible}
              onChange={(e) => setRuleForm({ ...ruleForm, autoRefundEligible: e.target.checked })}
              className="w-4 h-4 accent-[#218838]"
            />
          </label>
          <div className="flex justify-end gap-2 pt-2 border-t border-[#E5E7EB]">
            <Button variant="secondary" size="sm" type="button" onClick={() => setRuleModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit" leftIcon={<ShieldAlert className="w-3.5 h-3.5" />}>
              {editingRule ? 'Save Rule' : 'Create Rule'}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={Boolean(deleteTaxId)}
        onClose={() => setDeleteTaxId(null)}
        onConfirm={() => {
          if (deleteTaxId) {
            deleteTaxSlab(deleteTaxId);
            showToast('Deleted GST slab.');
          }
          setDeleteTaxId(null);
        }}
        title="Delete GST Slab?"
        message="This removes the tax slab from Admin configuration."
        confirmText="Delete"
        isDestructive
      />

      <ConfirmDialog
        isOpen={Boolean(deleteRuleId)}
        onClose={() => setDeleteRuleId(null)}
        onConfirm={() => {
          if (deleteRuleId) {
            deleteCancellationRule(deleteRuleId);
            showToast('Deleted cancellation policy rule.');
          }
          setDeleteRuleId(null);
        }}
        title="Delete Cancellation Rule?"
        message="This removes the policy rule from order cancellation handling."
        confirmText="Delete"
        isDestructive
      />
    </div>
  );
};
