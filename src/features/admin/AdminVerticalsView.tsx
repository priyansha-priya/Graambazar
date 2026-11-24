/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Grid3X3,
  Utensils,
  ShoppingBag,
  Sprout,
  Wrench,
  Shirt,
  Smartphone,
  Armchair,
  CheckCircle2,
  Power,
  Plus,
  Settings2,
  ShieldCheck,
} from 'lucide-react';
import { useAdmin } from '../../contexts/AdminContext';
import { KycDocCode, VerticalConfigRecord, VerticalWorkflowType } from '../../types/admin';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { Drawer } from '../../components/ui/Drawer';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';

const WORKFLOW_OPTIONS: { label: string; value: VerticalWorkflowType }[] = [
  { label: 'Food Kitchen Prep (Prep Timers)', value: 'FOOD_KITCHEN' },
  { label: 'Grocery Weight & Loose Units', value: 'GROCERY_WEIGHT' },
  { label: 'Physical Retail / Variant Stock', value: 'PHYSICAL_RETAIL' },
  { label: 'Made-to-Order / Custom Lead Days', value: 'MADE_TO_ORDER' },
];

const ALL_KYC_DOCS: { code: KycDocCode; label: string }[] = [
  { code: 'FSSAI', label: 'FSSAI License' },
  { code: 'AADHAAR', label: 'Aadhaar (Masked)' },
  { code: 'PAN', label: 'PAN Card' },
  { code: 'STORE_PHOTO', label: 'Storefront Photo' },
  { code: 'GST_TRADE', label: 'GST / Trade License' },
  { code: 'AGRI_LICENSE', label: 'Agri Input License' },
];

const ICON_OPTIONS = [
  { label: 'Food / Utensils', value: 'Utensils' },
  { label: 'Grocery / Bag', value: 'ShoppingBag' },
  { label: 'Agriculture / Sprout', value: 'Sprout' },
  { label: 'Hardware / Wrench', value: 'Wrench' },
  { label: 'Electronics / Smartphone', value: 'Smartphone' },
  { label: 'Clothing / Shirt', value: 'Shirt' },
  { label: 'Furniture / Armchair', value: 'Armchair' },
  { label: 'General / Grid', value: 'Grid3X3' },
];

export const AdminVerticalsView: React.FC = () => {
  const { verticalConfigs, sellers, toggleVerticalEnabled, addVertical, updateVertical, hasPermission } = useAdmin();
  const canManage = hasPermission('VERTICALS', 'manage');

  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [formError, setFormError] = useState('');
  const [newForm, setNewForm] = useState({
    id: '',
    name: '',
    hindiName: '',
    icon: 'Grid3X3',
    description: '',
    fulfillmentWorkflow: 'PHYSICAL_RETAIL' as VerticalWorkflowType,
    requiredKycDocs: ['AADHAAR', 'PAN', 'STORE_PHOTO'] as KycDocCode[],
    rulesCsv: 'Seller-managed delivery or store pickup, Standard return policy',
  });

  const [configTarget, setConfigTarget] = useState<VerticalConfigRecord | null>(null);
  const [configForm, setConfigForm] = useState({
    name: '',
    hindiName: '',
    description: '',
    fulfillmentWorkflow: 'PHYSICAL_RETAIL' as VerticalWorkflowType,
    requiredKycDocs: [] as KycDocCode[],
    rulesCsv: '',
  });

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const getVerticalIcon = (iconName: string) => {
    switch (iconName) {
      case 'Utensils':
        return <Utensils className="w-5 h-5 text-orange-500" />;
      case 'ShoppingBag':
        return <ShoppingBag className="w-5 h-5 text-emerald-600" />;
      case 'Sprout':
        return <Sprout className="w-5 h-5 text-green-600" />;
      case 'Wrench':
        return <Wrench className="w-5 h-5 text-blue-600" />;
      case 'Shirt':
        return <Shirt className="w-5 h-5 text-purple-600" />;
      case 'Smartphone':
        return <Smartphone className="w-5 h-5 text-indigo-600" />;
      case 'Armchair':
        return <Armchair className="w-5 h-5 text-amber-700" />;
      default:
        return <Grid3X3 className="w-5 h-5 text-[#218838]" />;
    }
  };

  const toggleDoc = (list: KycDocCode[], code: KycDocCode) =>
    list.includes(code) ? list.filter((c) => c !== code) : [...list, code];

  const handleCreateVertical = () => {
    if (!newForm.id.trim() || !newForm.name.trim()) {
      setFormError('Vertical Code (ID) and Display Name are required.');
      return;
    }
    const res = addVertical({
      id: newForm.id.trim().toUpperCase(),
      name: newForm.name.trim(),
      hindiName: newForm.hindiName.trim() || newForm.name.trim(),
      icon: newForm.icon,
      isEnabled: true,
      description: newForm.description.trim() || 'Universal marketplace vertical.',
      fulfillmentWorkflow: newForm.fulfillmentWorkflow,
      requiredKycDocs: newForm.requiredKycDocs.length ? newForm.requiredKycDocs : ['AADHAAR', 'PAN'],
      specialRules: newForm.rulesCsv
        .split(',')
        .map((r) => r.trim())
        .filter(Boolean),
    });
    if (!res.success) {
      setFormError(res.message);
      return;
    }
    setAddOpen(false);
    setFormError('');
    setNewForm({
      id: '',
      name: '',
      hindiName: '',
      icon: 'Grid3X3',
      description: '',
      fulfillmentWorkflow: 'PHYSICAL_RETAIL',
      requiredKycDocs: ['AADHAAR', 'PAN', 'STORE_PHOTO'],
      rulesCsv: 'Seller-managed delivery or store pickup',
    });
    showToast(res.message);
  };

  const openConfigDrawer = (v: VerticalConfigRecord) => {
    setConfigTarget(v);
    setConfigForm({
      name: v.name,
      hindiName: v.hindiName,
      description: v.description,
      fulfillmentWorkflow: v.fulfillmentWorkflow,
      requiredKycDocs: [...v.requiredKycDocs],
      rulesCsv: v.specialRules.join(', '),
    });
  };

  const handleSaveConfig = () => {
    if (!configTarget) return;
    updateVertical(configTarget.id, {
      name: configForm.name.trim() || configTarget.name,
      hindiName: configForm.hindiName.trim() || configTarget.hindiName,
      description: configForm.description.trim(),
      fulfillmentWorkflow: configForm.fulfillmentWorkflow,
      requiredKycDocs: configForm.requiredKycDocs,
      specialRules: configForm.rulesCsv
        .split(',')
        .map((r) => r.trim())
        .filter(Boolean),
    });
    showToast(`Updated vertical configuration for ${configForm.name}`);
    setConfigTarget(null);
  };

  return (
    <div className="space-y-6 animate-fade-in text-left">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <h1 className="text-xl font-black text-[#1F2937]">Multi-Vertical Scalability Engine</h1>
            <Badge variant="primary">{verticalConfigs.filter((v) => v.isEnabled).length} / {verticalConfigs.length} Active</Badge>
          </div>
          <p className="text-xs text-[#6B7280]">
            Add and configure any marketplace vertical (Food, Grocery, Hardware, Electronics, Apparel, Furniture, Agriculture, or future categories) with custom fulfillment workflows and KYC requirements.
          </p>
        </div>

        {canManage && (
          <Button variant="primary" size="sm" onClick={() => setAddOpen(true)} leftIcon={<Plus className="w-4 h-4" />}>
            Create New Vertical
          </Button>
        )}
      </div>

      {toastMsg && (
        <div className="bg-[#E8F5E9] border border-[#218838]/30 text-[#176B2C] px-4 py-3 rounded-xl text-sm font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Grid of Vertical Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {verticalConfigs.map((vertical) => {
          const liveSellerCount = sellers.filter(
            (s) => s.vertical === vertical.id || s.supportedVerticals?.includes(vertical.id)
          ).length;

          return (
            <div
              key={vertical.id}
              className={`bg-white rounded-2xl border p-5 shadow-xs transition-all flex flex-col justify-between ${
                vertical.isEnabled ? 'border-[#E5E7EB]' : 'border-slate-200 opacity-80 bg-slate-50/70'
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-xl bg-[#F8FAFC] flex items-center justify-center border border-[#E5E7EB] shrink-0">
                      {getVerticalIcon(vertical.icon)}
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-[#1F2937]">{vertical.name}</h3>
                      <p className="text-[11px] text-[#6B7280]">{vertical.hindiName}</p>
                    </div>
                  </div>

                  <Badge variant={vertical.isEnabled ? 'success' : 'neutral'} size="sm" dot>
                    {vertical.isEnabled ? 'Active' : 'Disabled'}
                  </Badge>
                </div>

                <p className="text-xs text-[#6B7280] leading-relaxed">{vertical.description}</p>

                {/* Workflow & KYC Pills */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  <Badge variant="info" size="sm">
                    {vertical.fulfillmentWorkflow.replace(/_/g, ' ')}
                  </Badge>
                  <Badge variant="neutral" size="sm">
                    <ShieldCheck className="w-3 h-3 mr-1" />
                    {vertical.requiredKycDocs.length} KYC Docs
                  </Badge>
                </div>

                {/* Special Domain Rules */}
                <div className="pt-2 border-t border-[#E5E7EB] space-y-1.5">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[#9CA3AF]">
                    Domain Rules & Attributes:
                  </p>
                  <div className="space-y-1">
                    {vertical.specialRules.map((rule, idx) => (
                      <div key={idx} className="flex items-center gap-1.5 text-[11px] text-[#475569]">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#218838] shrink-0" />
                        <span>{rule}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Footer Actions */}
              <div className="pt-4 mt-4 border-t border-[#E5E7EB] flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-[#1F2937]">
                  {liveSellerCount} Registered Shop{liveSellerCount === 1 ? '' : 's'}
                </span>

                {canManage && (
                  <div className="flex items-center gap-1.5">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openConfigDrawer(vertical)}
                      leftIcon={<Settings2 className="w-3.5 h-3.5" />}
                    >
                      Configure
                    </Button>
                    <button
                      onClick={() => toggleVerticalEnabled(vertical.id)}
                      className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                        vertical.isEnabled
                          ? 'bg-red-50 text-red-700 hover:bg-red-100'
                          : 'bg-[#E8F5E9] text-[#176B2C] hover:bg-[#C8E6C9]'
                      }`}
                    >
                      <Power className="w-3.5 h-3.5" />
                      <span>{vertical.isEnabled ? 'Disable' : 'Activate'}</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Create New Vertical Modal */}
      <Modal
        isOpen={addOpen}
        onClose={() => setAddOpen(false)}
        title="Add New Marketplace Vertical"
        description="Launch a brand-new product vertical dynamically without code changes."
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleCreateVertical}>Create Vertical</Button>
          </>
        }
      >
        <div className="space-y-4">
          {formError && <div className="p-3 rounded-xl bg-[#FEE2E2] text-[#DC2626] text-xs font-semibold">{formError}</div>}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input
              label="Vertical Code (ID)"
              required
              placeholder="e.g., STATIONERY, MEDICAL"
              value={newForm.id}
              onChange={(e) => setNewForm({ ...newForm, id: e.target.value.toUpperCase() })}
            />
            <Input
              label="Display Name (English)"
              required
              placeholder="e.g., Books & Stationery"
              value={newForm.name}
              onChange={(e) => setNewForm({ ...newForm, name: e.target.value })}
            />
            <Input
              label="Hindi Name"
              placeholder="e.g., किताबें और स्टेशनरी"
              value={newForm.hindiName}
              onChange={(e) => setNewForm({ ...newForm, hindiName: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Fulfillment Workflow"
              value={newForm.fulfillmentWorkflow}
              options={WORKFLOW_OPTIONS}
              onChange={(e) => setNewForm({ ...newForm, fulfillmentWorkflow: e.target.value as VerticalWorkflowType })}
            />
            <Select
              label="Vertical Icon"
              value={newForm.icon}
              options={ICON_OPTIONS}
              onChange={(e) => setNewForm({ ...newForm, icon: e.target.value })}
            />
          </div>
          <Input
            label="Description"
            placeholder="Describe what sellers can list under this vertical..."
            value={newForm.description}
            onChange={(e) => setNewForm({ ...newForm, description: e.target.value })}
          />
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[#1F2937] mb-2">Required Seller KYC Documents</p>
            <div className="flex flex-wrap gap-2">
              {ALL_KYC_DOCS.map((doc) => {
                const selected = newForm.requiredKycDocs.includes(doc.code);
                return (
                  <button
                    key={doc.code}
                    type="button"
                    onClick={() => setNewForm({ ...newForm, requiredKycDocs: toggleDoc(newForm.requiredKycDocs, doc.code) })}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold border cursor-pointer ${
                      selected ? 'bg-[#218838] text-white border-[#218838]' : 'bg-white text-[#475569] border-[#E5E7EB]'
                    }`}
                  >
                    {doc.label}
                  </button>
                );
              })}
            </div>
          </div>
          <Input
            label="Special Domain Rules (Comma-separated)"
            value={newForm.rulesCsv}
            onChange={(e) => setNewForm({ ...newForm, rulesCsv: e.target.value })}
          />
        </div>
      </Modal>

      {/* Configure Vertical Drawer */}
      <Drawer
        isOpen={Boolean(configTarget)}
        onClose={() => setConfigTarget(null)}
        title={configTarget ? `Configure Vertical: ${configTarget.name}` : 'Configure Vertical'}
        subtitle={configTarget ? `Vertical ID: ${configTarget.id}` : undefined}
        width="max-w-lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setConfigTarget(null)}>Cancel</Button>
            <Button variant="primary" onClick={handleSaveConfig}>Save Configuration</Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label="Display Name"
            value={configForm.name}
            onChange={(e) => setConfigForm({ ...configForm, name: e.target.value })}
          />
          <Input
            label="Hindi Name"
            value={configForm.hindiName}
            onChange={(e) => setConfigForm({ ...configForm, hindiName: e.target.value })}
          />
          <Select
            label="Fulfillment Workflow"
            value={configForm.fulfillmentWorkflow}
            options={WORKFLOW_OPTIONS}
            onChange={(e) => setConfigForm({ ...configForm, fulfillmentWorkflow: e.target.value as VerticalWorkflowType })}
          />
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-[#1F2937] block mb-1.5">Description</label>
            <textarea
              rows={3}
              value={configForm.description}
              onChange={(e) => setConfigForm({ ...configForm, description: e.target.value })}
              className="w-full p-3 text-sm border border-[#E5E7EB] rounded-xl focus:outline-none focus:border-[#218838]"
            />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[#1F2937] mb-2">Mandatory Seller KYC Checklist</p>
            <div className="flex flex-wrap gap-2">
              {ALL_KYC_DOCS.map((doc) => {
                const selected = configForm.requiredKycDocs.includes(doc.code);
                return (
                  <button
                    key={doc.code}
                    type="button"
                    onClick={() =>
                      setConfigForm({ ...configForm, requiredKycDocs: toggleDoc(configForm.requiredKycDocs, doc.code) })
                    }
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold border cursor-pointer ${
                      selected ? 'bg-[#218838] text-white border-[#218838]' : 'bg-white text-[#475569] border-[#E5E7EB]'
                    }`}
                  >
                    {doc.label}
                  </button>
                );
              })}
            </div>
          </div>
          <Input
            label="Domain Rules (Comma-separated)"
            value={configForm.rulesCsv}
            onChange={(e) => setConfigForm({ ...configForm, rulesCsv: e.target.value })}
          />
        </div>
      </Drawer>
    </div>
  );
};
