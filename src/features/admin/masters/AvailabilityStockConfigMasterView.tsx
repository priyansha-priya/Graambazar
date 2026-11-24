/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useState } from 'react';
import { Clock, AlertCircle, Plus, X } from 'lucide-react';
import { useAdmin } from '../../../contexts/AdminContext';
import {
  AvailabilityStockConfigRecord,
  AvailabilityWorkflowMode,
} from '../../../types/admin';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { Modal } from '../../../components/ui/Modal';
import { Drawer } from '../../../components/ui/Drawer';
import { Input } from '../../../components/ui/Input';
import { ConfirmDialog } from '../../../components/feedback/ConfirmDialog';
import { VerticalBadge } from '../components/VerticalBadge';
import { MasterPageShell } from './MasterPageShell';
import {
  MasterDataTable,
  MasterTableColumn,
  MasterTableFilterConfig,
} from '../../../components/data-display/MasterDataTable';

const WORKFLOW_MODES: { value: AvailabilityWorkflowMode; label: string; description: string }[] = [
  {
    value: 'TRACKED_INVENTORY',
    label: 'Tracked Stock (Grocery / Retail)',
    description: 'Real-time quantity/weight stock deduction with low-stock alerts.',
  },
  {
    value: 'DAILY_PREP_SLOTS',
    label: 'Daily Prep Slots (Dhaba / Food)',
    description: 'Scheduled meal windows (Breakfast/Lunch/Dinner) with daily batch caps.',
  },
  {
    value: 'MADE_TO_ORDER',
    label: 'Made to Order (Kitchen SLA)',
    description: 'Freshly prepared on order acceptance using preparation time SLA.',
  },
  {
    value: 'UNLIMITED_SERVICE',
    label: 'Always Available (Service Hours)',
    description: 'Open during store operating hours without hard stock limits.',
  },
];

const PRESET_SLOTS = [
  'Morning Nashta (07:00 - 11:00)',
  'Lunch (11:30 - 15:30)',
  'Evening Chai (16:00 - 20:00)',
  'Dinner (19:00 - 22:30)',
  'Store Hours (06:30 - 21:30)',
  'All-Day Kitchen (11:00 - 22:00)',
];

export const AvailabilityStockConfigMasterView: React.FC = () => {
  const {
    availabilityConfigs,
    verticalConfigs,
    categories,
    products,
    addAvailabilityConfig,
    updateAvailabilityConfig,
    toggleAvailabilityConfigStatus,
    deleteAvailabilityConfig,
    hasPermission,
  } = useAdmin();

  const canManage = hasPermission('MASTER_AVAILABILITY', 'manage');

  const [activeVerticalFilter, setActiveVerticalFilter] = useState('ALL');

  const [viewingCfg, setViewingCfg] = useState<AvailabilityStockConfigRecord | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCfg, setEditingCfg] = useState<AvailabilityStockConfigRecord | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AvailabilityStockConfigRecord | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [customSlotInput, setCustomSlotInput] = useState('');

  const [form, setForm] = useState({
    code: '',
    name: '',
    vertical: 'FOOD',
    categoryId: '',
    productId: '',
    workflowMode: 'DAILY_PREP_SLOTS' as AvailabilityWorkflowMode,
    serviceSlots: ['Lunch (11:30 - 15:30)', 'Dinner (19:00 - 22:30)'] as string[],
    prepTimeMinutes: '20',
    dailyBatchLimit: '60',
    lowStockThreshold: '10',
    maxQtyPerOrder: '6',
    restockLeadHours: '24',
    autoDisableOnZeroStock: true,
    allowPreOrder: false,
    isActive: true,
  });

  const showFeedback = (msg: string) => {
    setFeedback(msg);
    setTimeout(() => setFeedback(null), 3500);
  };

  const getCategoryName = (id: string) =>
    categories.find((c) => c.id === id)?.name || id;
  const getProductName = (id?: string) =>
    id ? products.find((p) => p.id === id)?.name : undefined;
  const getWorkflowMeta = (mode: AvailabilityWorkflowMode) =>
    WORKFLOW_MODES.find((w) => w.value === mode);

  const tableFilters = useMemo<MasterTableFilterConfig<AvailabilityStockConfigRecord>[]>(
    () => [
      {
        id: 'vertical',
        label: 'Filter by vertical',
        allLabel: 'All Verticals',
        options: verticalConfigs.map((v) => ({ value: v.id, label: v.name })),
        predicate: (cfg, val) => cfg.vertical === val,
      },
      {
        id: 'mode',
        label: 'Filter by workflow mode',
        allLabel: 'All Workflow Modes',
        options: WORKFLOW_MODES.map((m) => ({ value: m.value, label: m.label })),
        predicate: (cfg, val) => cfg.workflowMode === val,
      },
    ],
    [verticalConfigs]
  );

  const columns = useMemo<MasterTableColumn<AvailabilityStockConfigRecord>[]>(
    () => [
      {
        key: 'name',
        header: 'Rule & Code',
        sortable: true,
        sortValue: (cfg) => cfg.name,
        render: (cfg) => (
          <div>
            <p className="font-bold text-[#1F2937]">{cfg.name}</p>
            <p className="font-mono text-[10px] text-[#6B7280]">{cfg.code}</p>
          </div>
        ),
      },
      {
        key: 'vertical',
        header: 'Vertical & Category',
        sortable: true,
        sortValue: (cfg) => getCategoryName(cfg.categoryId),
        render: (cfg) => (
          <div>
            <div className="mb-1">
              <VerticalBadge vertical={cfg.vertical} />
            </div>
            <p className="text-[11px] text-[#475569]">{getCategoryName(cfg.categoryId)}</p>
          </div>
        ),
      },
      {
        key: 'workflowMode',
        header: 'Workflow & Windows',
        sortable: true,
        sortValue: (cfg) => cfg.workflowMode,
        render: (cfg) => (
          <div>
            <Badge
              variant={
                cfg.workflowMode === 'TRACKED_INVENTORY'
                  ? 'primary'
                  : cfg.workflowMode === 'DAILY_PREP_SLOTS'
                  ? 'warning'
                  : 'info'
              }
              size="sm"
            >
              {cfg.workflowMode.replace(/_/g, ' ')}
            </Badge>
            <p className="text-[11px] text-[#6B7280] mt-1 max-w-[240px] truncate">
              {cfg.serviceSlots.join(' • ')}
            </p>
          </div>
        ),
      },
      {
        key: 'limits',
        header: 'Stock / SLA Limits',
        cellClassName: 'text-[11px] text-[#475569] space-y-0.5',
        render: (cfg) => (
          <>
            {cfg.prepTimeMinutes !== undefined && (
              <div>
                Prep SLA: <strong className="text-[#1F2937]">{cfg.prepTimeMinutes} min</strong>
                {cfg.dailyBatchLimit ? ` • Cap ${cfg.dailyBatchLimit}/day` : ''}
              </div>
            )}
            <div>
              Low Alert ≤ <strong className="text-[#1F2937]">{cfg.lowStockThreshold}</strong> •
              Max/Order: <strong className="text-[#1F2937]">{cfg.maxQtyPerOrder}</strong>
            </div>
            <div className="text-[10px] text-[#6B7280]">
              {cfg.autoDisableOnZeroStock ? 'Auto-hide at 0 stock' : 'Manual toggle'}
              {cfg.allowPreOrder ? ' • Pre-order ON' : ''}
            </div>
          </>
        ),
      },
    ],
    [categories]
  );

  const openAddModal = () => {
    const defVert = activeVerticalFilter !== 'ALL' ? activeVerticalFilter : 'FOOD';
    const firstCat = categories.find((c) => c.vertical === defVert);
    setEditingCfg(null);
    setFormError(null);
    setCustomSlotInput('');
    setForm({
      code: '',
      name: '',
      vertical: defVert,
      categoryId: firstCat?.id || categories[0]?.id || '',
      productId: '',
      workflowMode: defVert === 'FOOD' ? 'DAILY_PREP_SLOTS' : 'TRACKED_INVENTORY',
      serviceSlots:
        defVert === 'FOOD'
          ? ['Lunch (11:30 - 15:30)', 'Dinner (19:00 - 22:30)']
          : ['Store Hours (06:30 - 21:30)'],
      prepTimeMinutes: defVert === 'FOOD' ? '20' : '',
      dailyBatchLimit: defVert === 'FOOD' ? '60' : '',
      lowStockThreshold: '10',
      maxQtyPerOrder: '6',
      restockLeadHours: defVert === 'GROCERY' ? '24' : '',
      autoDisableOnZeroStock: true,
      allowPreOrder: false,
      isActive: true,
    });
    setIsModalOpen(true);
  };

  const openEditModal = (cfg: AvailabilityStockConfigRecord) => {
    setEditingCfg(cfg);
    setFormError(null);
    setCustomSlotInput('');
    setForm({
      code: cfg.code,
      name: cfg.name,
      vertical: cfg.vertical,
      categoryId: cfg.categoryId,
      productId: cfg.productId || '',
      workflowMode: cfg.workflowMode,
      serviceSlots: cfg.serviceSlots || [],
      prepTimeMinutes: cfg.prepTimeMinutes !== undefined ? String(cfg.prepTimeMinutes) : '',
      dailyBatchLimit: cfg.dailyBatchLimit !== undefined ? String(cfg.dailyBatchLimit) : '',
      lowStockThreshold: String(cfg.lowStockThreshold),
      maxQtyPerOrder: String(cfg.maxQtyPerOrder),
      restockLeadHours: cfg.restockLeadHours !== undefined ? String(cfg.restockLeadHours) : '',
      autoDisableOnZeroStock: cfg.autoDisableOnZeroStock,
      allowPreOrder: cfg.allowPreOrder,
      isActive: cfg.isActive,
    });
    setIsModalOpen(true);
  };

  const toggleSlot = (slot: string) => {
    setForm((prev) => ({
      ...prev,
      serviceSlots: prev.serviceSlots.includes(slot)
        ? prev.serviceSlots.filter((s) => s !== slot)
        : [...prev.serviceSlots, slot],
    }));
  };

  const addCustomSlot = () => {
    const val = customSlotInput.trim();
    if (!val) return;
    if (!form.serviceSlots.includes(val)) {
      setForm((prev) => ({ ...prev, serviceSlots: [...prev.serviceSlots, val] }));
    }
    setCustomSlotInput('');
  };

  const handleSave = () => {
    if (!form.name.trim()) {
      setFormError('Configuration rule name is required.');
      return;
    }
    if (!form.categoryId) {
      setFormError('Select a target category.');
      return;
    }
    if (form.serviceSlots.length === 0) {
      setFormError('Add at least one active service window / operating time slot.');
      return;
    }

    const lowVal = Number(form.lowStockThreshold);
    const maxOrderVal = Number(form.maxQtyPerOrder);
    if (Number.isNaN(lowVal) || lowVal < 0 || Number.isNaN(maxOrderVal) || maxOrderVal < 1) {
      setFormError('Low stock threshold must be ≥ 0 and Max Qty per order must be ≥ 1.');
      return;
    }

    const cleanCode =
      form.code.trim().toUpperCase() ||
      `AVL-${form.vertical.slice(0, 2)}-${Date.now().toString().slice(-4)}`;

    const payload: Omit<AvailabilityStockConfigRecord, 'id'> = {
      code: cleanCode,
      name: form.name.trim(),
      vertical: form.vertical,
      categoryId: form.categoryId,
      productId: form.productId || undefined,
      workflowMode: form.workflowMode,
      serviceSlots: form.serviceSlots,
      prepTimeMinutes: form.prepTimeMinutes.trim() ? Number(form.prepTimeMinutes) : undefined,
      dailyBatchLimit: form.dailyBatchLimit.trim() ? Number(form.dailyBatchLimit) : undefined,
      lowStockThreshold: Math.floor(lowVal),
      maxQtyPerOrder: Math.floor(maxOrderVal),
      restockLeadHours: form.restockLeadHours.trim() ? Number(form.restockLeadHours) : undefined,
      autoDisableOnZeroStock: form.autoDisableOnZeroStock,
      allowPreOrder: form.allowPreOrder,
      isActive: form.isActive,
    };

    if (editingCfg) {
      updateAvailabilityConfig(editingCfg.id, payload);
      showFeedback(`Updated availability configuration "${payload.name}".`);
    } else {
      addAvailabilityConfig(payload);
      showFeedback(`Created availability configuration "${payload.name}".`);
    }
    setIsModalOpen(false);
  };

  const modalCategories = categories.filter((c) => c.vertical === form.vertical);
  const modalProducts = products.filter(
    (p) => p.vertical === form.vertical && (!form.categoryId || p.categoryId === form.categoryId)
  );

  const isFoodWorkflow =
    form.workflowMode === 'DAILY_PREP_SLOTS' || form.workflowMode === 'MADE_TO_ORDER';

  return (
    <>
      <MasterPageShell
        icon={<Clock className="w-5 h-5" />}
        title="Product Availability & Stock Configuration"
        subtitle="Configure Food meal prep slots, kitchen SLAs, daily batch caps, and Grocery real-time stock thresholds, restock lead times, and auto-disable policies."
        totalCount={availabilityConfigs.length}
        activeCount={availabilityConfigs.filter((c) => c.isActive).length}
        addButtonLabel="Add Availability Rule"
        onAddNew={openAddModal}
        canManage={canManage}
        feedback={feedback}
      >
        <MasterDataTable<AvailabilityStockConfigRecord>
          data={availabilityConfigs}
          columns={columns}
          searchPlaceholder="Search rule name, code, category, time slot..."
          searchMatcher={(cfg, q) =>
            cfg.name.toLowerCase().includes(q) ||
            cfg.code.toLowerCase().includes(q) ||
            getCategoryName(cfg.categoryId).toLowerCase().includes(q) ||
            cfg.serviceSlots.some((s) => s.toLowerCase().includes(q))
          }
          filters={tableFilters}
          onFilterStateChange={(state) => setActiveVerticalFilter(state.vertical || 'ALL')}
          actions={{
            canManage,
            getRowLabel: (cfg) => cfg.name,
            onView: (cfg) => setViewingCfg(cfg),
            onEdit: (cfg) => openEditModal(cfg),
            onToggleStatus: (cfg) => {
              toggleAvailabilityConfigStatus(cfg.id);
              showFeedback(
                `Rule "${cfg.name}" marked ${cfg.isActive ? 'Inactive' : 'Active'}.`
              );
            },
            onDelete: (cfg) => setDeleteTarget(cfg),
          }}
          emptyIcon={<Clock className="w-6 h-6" />}
          emptyTitle="No availability & stock configurations found"
          emptyDescription="Create Food kitchen prep slot rules or Grocery inventory threshold policies."
          emptyActionLabel={canManage ? 'Add Availability Rule' : undefined}
          onEmptyAction={canManage ? openAddModal : undefined}
        />
      </MasterPageShell>

      {/* View Detail Drawer */}
      <Drawer
        isOpen={!!viewingCfg}
        onClose={() => setViewingCfg(null)}
        title={viewingCfg ? viewingCfg.name : 'Availability Rule Details'}
        subtitle={viewingCfg ? `Code: ${viewingCfg.code}` : undefined}
      >
        {viewingCfg && (
          <div className="space-y-5 text-xs text-left">
            <div className="p-4 bg-[#F8FAFC] rounded-xl border border-[#E5E7EB] grid grid-cols-2 gap-3">
              <div>
                <p className="text-[11px] text-[#6B7280]">Workflow Mode</p>
                <p className="font-bold text-[#1F2937] mt-0.5">
                  {getWorkflowMeta(viewingCfg.workflowMode)?.label || viewingCfg.workflowMode}
                </p>
              </div>
              <div>
                <p className="text-[11px] text-[#6B7280]">Category / Product</p>
                <p className="font-bold text-[#1F2937] mt-0.5">
                  {getCategoryName(viewingCfg.categoryId)}
                  {getProductName(viewingCfg.productId)
                    ? ` → ${getProductName(viewingCfg.productId)}`
                    : ''}
                </p>
              </div>
              <div>
                <p className="text-[11px] text-[#6B7280]">Low Stock Threshold</p>
                <p className="font-bold text-[#1F2937] mt-0.5">{viewingCfg.lowStockThreshold}</p>
              </div>
              <div>
                <p className="text-[11px] text-[#6B7280]">Max Quantity Per Order</p>
                <p className="font-bold text-[#1F2937] mt-0.5">{viewingCfg.maxQtyPerOrder}</p>
              </div>
              {viewingCfg.prepTimeMinutes !== undefined && (
                <div>
                  <p className="text-[11px] text-[#6B7280]">Kitchen Prep SLA</p>
                  <p className="font-bold text-[#218838] mt-0.5">
                    {viewingCfg.prepTimeMinutes} mins
                  </p>
                </div>
              )}
              {viewingCfg.dailyBatchLimit !== undefined && (
                <div>
                  <p className="text-[11px] text-[#6B7280]">Daily Batch Cap</p>
                  <p className="font-bold text-[#1F2937] mt-0.5">
                    {viewingCfg.dailyBatchLimit} portions/day
                  </p>
                </div>
              )}
              {viewingCfg.restockLeadHours !== undefined && (
                <div>
                  <p className="text-[11px] text-[#6B7280]">Restock Lead Time</p>
                  <p className="font-bold text-[#1F2937] mt-0.5">
                    {viewingCfg.restockLeadHours} hours
                  </p>
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-[#6B7280]">
                Active Service Windows ({viewingCfg.serviceSlots.length})
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {viewingCfg.serviceSlots.map((slot) => (
                  <Badge key={slot} variant="primary" size="sm">
                    {slot}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Badge variant={viewingCfg.autoDisableOnZeroStock ? 'success' : 'neutral'} size="sm">
                Auto-Disable at 0 Stock: {viewingCfg.autoDisableOnZeroStock ? 'ON' : 'OFF'}
              </Badge>
              <Badge variant={viewingCfg.allowPreOrder ? 'info' : 'neutral'} size="sm">
                Pre-Order Allowed: {viewingCfg.allowPreOrder ? 'YES' : 'NO'}
              </Badge>
            </div>
          </div>
        )}
      </Drawer>

      {/* Add / Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={
          editingCfg
            ? `Edit Availability Rule: ${editingCfg.code}`
            : 'Add Availability & Stock Configuration'
        }
        size="lg"
        footer={
          <div className="flex items-center justify-end gap-2">
            <Button variant="secondary" size="sm" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleSave}>
              {editingCfg ? 'Save Changes' : 'Create Rule'}
            </Button>
          </div>
        }
      >
        <div className="space-y-4 text-left text-xs">
          {formError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div className="sm:col-span-2">
              <Input
                label="Configuration Rule Name *"
                value={form.name}
                onChange={(e) => {
                  setForm({ ...form, name: e.target.value });
                  setFormError(null);
                }}
                placeholder="e.g., Dhaba Lunch/Dinner Slots or Kirana Staple Stock Rule"
              />
            </div>
            <Input
              label="Rule Code"
              value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
              placeholder="auto if blank (AVL-...)"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-[#1F2937] mb-1.5">
                Vertical *
              </label>
              <select
                value={form.vertical}
                onChange={(e) => {
                  const nextV = e.target.value;
                  const firstCat = categories.find((c) => c.vertical === nextV);
                  setForm({
                    ...form,
                    vertical: nextV,
                    categoryId: firstCat?.id || '',
                    productId: '',
                    workflowMode:
                      nextV === 'FOOD' ? 'DAILY_PREP_SLOTS' : 'TRACKED_INVENTORY',
                  });
                }}
                className="w-full h-10 px-3 bg-white border border-[#E5E7EB] rounded-xl text-xs font-semibold text-[#1F2937] outline-none focus:border-[#218838]"
              >
                {verticalConfigs.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#1F2937] mb-1.5">
                Category *
              </label>
              <select
                value={form.categoryId}
                onChange={(e) =>
                  setForm({ ...form, categoryId: e.target.value, productId: '' })
                }
                className="w-full h-10 px-3 bg-white border border-[#E5E7EB] rounded-xl text-xs font-semibold text-[#1F2937] outline-none focus:border-[#218838]"
              >
                <option value="">Select category...</option>
                {modalCategories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#1F2937] mb-1.5">
                Specific Product (Optional)
              </label>
              <select
                value={form.productId}
                onChange={(e) => setForm({ ...form, productId: e.target.value })}
                className="w-full h-10 px-3 bg-white border border-[#E5E7EB] rounded-xl text-xs font-semibold text-[#1F2937] outline-none focus:border-[#218838]"
              >
                <option value="">Applies to Entire Category</option>
                {modalProducts.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#1F2937] mb-1.5">
              Availability & Stock Workflow Mode *
            </label>
            <select
              value={form.workflowMode}
              onChange={(e) =>
                setForm({
                  ...form,
                  workflowMode: e.target.value as AvailabilityWorkflowMode,
                })
              }
              className="w-full h-10 px-3 bg-white border border-[#E5E7EB] rounded-xl text-xs font-semibold text-[#1F2937] outline-none focus:border-[#218838]"
            >
              {WORKFLOW_MODES.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
            <p className="text-[11px] text-[#6B7280] mt-1">
              {getWorkflowMeta(form.workflowMode)?.description}
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
            {isFoodWorkflow ? (
              <>
                <Input
                  label="Prep SLA (Mins)"
                  type="number"
                  min={5}
                  value={form.prepTimeMinutes}
                  onChange={(e) => setForm({ ...form, prepTimeMinutes: e.target.value })}
                />
                <Input
                  label="Daily Batch Cap"
                  type="number"
                  min={1}
                  value={form.dailyBatchLimit}
                  onChange={(e) => setForm({ ...form, dailyBatchLimit: e.target.value })}
                />
              </>
            ) : (
              <Input
                label="Restock Lead (Hrs)"
                type="number"
                min={1}
                value={form.restockLeadHours}
                onChange={(e) => setForm({ ...form, restockLeadHours: e.target.value })}
              />
            )}
            <Input
              label="Low Stock Alert ≤ *"
              type="number"
              min={0}
              value={form.lowStockThreshold}
              onChange={(e) => setForm({ ...form, lowStockThreshold: e.target.value })}
            />
            <Input
              label="Max Qty / Order *"
              type="number"
              min={1}
              value={form.maxQtyPerOrder}
              onChange={(e) => setForm({ ...form, maxQtyPerOrder: e.target.value })}
            />
          </div>

          {/* Service Slots */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-[#1F2937]">
              Operating Windows / Service Slots * ({form.serviceSlots.length} active)
            </label>
            <div className="flex flex-wrap gap-1.5">
              {PRESET_SLOTS.map((slot) => {
                const selected = form.serviceSlots.includes(slot);
                return (
                  <button
                    type="button"
                    key={slot}
                    onClick={() => toggleSlot(slot)}
                    className={`px-2.5 py-1 rounded-full text-[11px] font-semibold cursor-pointer transition-colors ${
                      selected
                        ? 'bg-[#218838] text-white'
                        : 'bg-[#F8FAFC] text-[#475569] border border-[#E5E7EB] hover:border-[#218838]'
                    }`}
                  >
                    {slot}
                  </button>
                );
              })}
            </div>

            {/* Custom slot tags */}
            {form.serviceSlots.some((s) => !PRESET_SLOTS.includes(s)) && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {form.serviceSlots
                  .filter((s) => !PRESET_SLOTS.includes(s))
                  .map((slot) => (
                    <span
                      key={slot}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-100 text-[#176B2C] text-[11px] font-semibold"
                    >
                      {slot}
                      <button
                        type="button"
                        onClick={() => toggleSlot(slot)}
                        className="cursor-pointer hover:text-red-700"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
              </div>
            )}

            <div className="flex items-center gap-2 pt-1">
              <input
                type="text"
                value={customSlotInput}
                onChange={(e) => setCustomSlotInput(e.target.value)}
                placeholder="Add custom window (e.g., Sunday Haat 08:00 - 14:00)"
                className="flex-1 h-9 px-3 bg-[#F8FAFC] border border-[#E5E7EB] rounded-xl text-xs outline-none focus:border-[#218838]"
              />
              <Button
                variant="secondary"
                size="sm"
                onClick={addCustomSlot}
                leftIcon={<Plus className="w-3.5 h-3.5" />}
              >
                Add Slot
              </Button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-5 pt-1">
            <label className="inline-flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.autoDisableOnZeroStock}
                onChange={(e) =>
                  setForm({ ...form, autoDisableOnZeroStock: e.target.checked })
                }
                className="rounded accent-[#218838]"
              />
              <span className="font-semibold text-[#1F2937]">Auto-Disable on Zero Stock</span>
            </label>
            <label className="inline-flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.allowPreOrder}
                onChange={(e) => setForm({ ...form, allowPreOrder: e.target.checked })}
                className="rounded accent-[#218838]"
              />
              <span className="font-semibold text-[#1F2937]">Allow Advance Pre-Order</span>
            </label>
            <label className="inline-flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                className="rounded accent-[#218838]"
              />
              <span className="font-semibold text-[#1F2937]">Active</span>
            </label>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) {
            deleteAvailabilityConfig(deleteTarget.id);
            showFeedback(`Deleted availability configuration "${deleteTarget.name}".`);
            setDeleteTarget(null);
          }
        }}
        title="Delete Availability Configuration?"
        message={
          deleteTarget
            ? `Delete "${deleteTarget.name}" (${deleteTarget.code})? Products in this category will fall back to default store hours.`
            : ''
        }
        confirmText="Delete Rule"
        isDestructive
      />
    </>
  );
};
