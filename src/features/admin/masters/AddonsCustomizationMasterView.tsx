/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useState } from 'react';
import { ListPlus, Plus, Trash2, Copy, AlertCircle } from 'lucide-react';
import { useAdmin } from '../../../contexts/AdminContext';
import { OptionGroupItem, OptionGroupMasterRecord } from '../../../types/admin';
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
import { formatINR } from '../../../utils/currency';

interface OptionDraft {
  id: string;
  label: string;
  priceDeltaInr: string;
  isDefault: boolean;
  isAvailable: boolean;
}

export const AddonsCustomizationMasterView: React.FC = () => {
  const {
    optionGroups,
    verticalConfigs,
    categories,
    addOptionGroup,
    updateOptionGroup,
    duplicateOptionGroup,
    toggleOptionGroupStatus,
    deleteOptionGroup,
    hasPermission,
  } = useAdmin();

  const canManage = hasPermission('MASTER_ADDONS', 'manage');



  const [viewingGroup, setViewingGroup] = useState<OptionGroupMasterRecord | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<OptionGroupMasterRecord | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<OptionGroupMasterRecord | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: '',
    hindiName: '',
    verticals: ['FOOD'] as string[],
    categoryIds: [] as string[],
    selectionType: 'MULTIPLE' as 'SINGLE' | 'MULTIPLE',
    isRequired: false,
    minSelect: '0',
    maxSelect: '3',
    isActive: true,
    options: [
      { id: 'draft_1', label: '', priceDeltaInr: '0', isDefault: false, isAvailable: true },
    ] as OptionDraft[],
  });

  const showFeedback = (msg: string) => {
    setFeedback(msg);
    setTimeout(() => setFeedback(null), 3500);
  };

  const tableFilters = useMemo<MasterTableFilterConfig<OptionGroupMasterRecord>[]>(
    () => [
      {
        id: 'vertical',
        label: 'Filter by vertical',
        allLabel: 'All Verticals',
        options: verticalConfigs.map((v) => ({ value: v.id, label: v.name })),
        predicate: (g, val) => g.verticals.includes(val),
      },
      {
        id: 'selection',
        label: 'Filter by selection type',
        allLabel: 'All Selection Rules',
        options: [
          { value: 'SINGLE', label: 'Single Choice (Radio)' },
          { value: 'MULTIPLE', label: 'Multi-Select (Checkbox)' },
        ],
        predicate: (g, val) => g.selectionType === val,
      },
    ],
    [verticalConfigs]
  );

  const columns = useMemo<MasterTableColumn<OptionGroupMasterRecord>[]>(
    () => [
      {
        key: 'name',
        header: 'Group Name',
        sortable: true,
        sortValue: (g) => g.name,
        render: (group) => (
          <div>
            <p className="font-bold text-[#1F2937]">{group.name}</p>
            <p className="text-[11px] text-[#6B7280]">{group.hindiName}</p>
          </div>
        ),
      },
      {
        key: 'selectionType',
        header: 'Selection Rule',
        sortable: true,
        sortValue: (g) => g.selectionType,
        render: (group) => (
          <div>
            <div className="flex flex-wrap items-center gap-1 mb-0.5">
              <Badge variant={group.selectionType === 'SINGLE' ? 'info' : 'primary'} size="sm">
                {group.selectionType}
              </Badge>
              {group.isRequired && (
                <Badge variant="error" size="sm">
                  Required
                </Badge>
              )}
            </div>
            <p className="text-[11px] text-[#6B7280]">
              Min {group.minSelect} • Max {group.maxSelect}
            </p>
          </div>
        ),
      },
      {
        key: 'options',
        header: 'Add-on Options & Pricing',
        sortable: true,
        sortValue: (g) => g.options.length,
        render: (group) => (
          <div>
            <p className="font-semibold text-[#1F2937] mb-0.5">
              {group.options.length} choice{group.options.length !== 1 ? 's' : ''}
            </p>
            <p className="text-[11px] text-[#6B7280] max-w-[260px] truncate">
              {group.options
                .map((o) =>
                  o.priceDeltaPaise > 0
                    ? `${o.label} (+${formatINR(o.priceDeltaPaise)})`
                    : o.label
                )
                .join(', ')}
            </p>
          </div>
        ),
      },
      {
        key: 'verticals',
        header: 'Verticals',
        render: (group) => (
          <div className="flex flex-wrap gap-1">
            {group.verticals.map((v) => (
              <VerticalBadge key={v} vertical={v} />
            ))}
          </div>
        ),
      },
    ],
    []
  );

  const openAddModal = () => {
    setEditingGroup(null);
    setFormError(null);
    setForm({
      name: '',
      hindiName: '',
      verticals: ['FOOD'],
      categoryIds: [],
      selectionType: 'MULTIPLE',
      isRequired: false,
      minSelect: '0',
      maxSelect: '3',
      isActive: true,
      options: [
        { id: `opt_row_${Date.now()}`, label: '', priceDeltaInr: '0', isDefault: false, isAvailable: true },
      ],
    });
    setIsModalOpen(true);
  };

  const openEditModal = (group: OptionGroupMasterRecord) => {
    setEditingGroup(group);
    setFormError(null);
    setForm({
      name: group.name,
      hindiName: group.hindiName,
      verticals: group.verticals.length ? group.verticals : ['FOOD'],
      categoryIds: group.categoryIds || [],
      selectionType: group.selectionType,
      isRequired: group.isRequired,
      minSelect: String(group.minSelect),
      maxSelect: String(group.maxSelect),
      isActive: group.isActive,
      options: group.options.map((o) => ({
        id: o.id,
        label: o.label,
        priceDeltaInr: (o.priceDeltaPaise / 100).toFixed(0),
        isDefault: o.isDefault,
        isAvailable: o.isAvailable,
      })),
    });
    setIsModalOpen(true);
  };

  const toggleInList = (list: string[], id: string) =>
    list.includes(id) ? list.filter((x) => x !== id) : [...list, id];

  const addOptionRow = () => {
    setForm((prev) => ({
      ...prev,
      options: [
        ...prev.options,
        {
          id: `opt_row_${Date.now()}_${prev.options.length}`,
          label: '',
          priceDeltaInr: '0',
          isDefault: false,
          isAvailable: true,
        },
      ],
    }));
  };

  const removeOptionRow = (rowId: string) => {
    setForm((prev) => ({
      ...prev,
      options: prev.options.filter((o) => o.id !== rowId),
    }));
  };

  const updateOptionRow = (rowId: string, patch: Partial<OptionDraft>) => {
    setForm((prev) => ({
      ...prev,
      options: prev.options.map((o) => (o.id === rowId ? { ...o, ...patch } : o)),
    }));
  };

  const handleSave = () => {
    if (!form.name.trim() || !form.hindiName.trim()) {
      setFormError('Group name and Hindi / local display label are required.');
      return;
    }
    if (form.verticals.length === 0) {
      setFormError('Select at least one applicable vertical.');
      return;
    }

    const cleanedOptions: OptionGroupItem[] = form.options
      .filter((o) => o.label.trim() !== '')
      .map((o) => ({
        id: o.id,
        label: o.label.trim(),
        priceDeltaPaise: Math.max(0, Math.round((Number(o.priceDeltaInr) || 0) * 100)),
        isDefault: o.isDefault,
        isAvailable: o.isAvailable,
      }));

    if (cleanedOptions.length === 0) {
      setFormError('Add at least one named option / add-on item.');
      return;
    }

    const minVal = form.isRequired ? Math.max(1, Number(form.minSelect) || 1) : Math.max(0, Number(form.minSelect) || 0);
    const maxVal =
      form.selectionType === 'SINGLE'
        ? 1
        : Math.max(minVal, Number(form.maxSelect) || cleanedOptions.length);

    if (maxVal > cleanedOptions.length) {
      setFormError(`Max selections (${maxVal}) cannot exceed total options (${cleanedOptions.length}).`);
      return;
    }

    const payload: Omit<OptionGroupMasterRecord, 'id'> = {
      name: form.name.trim(),
      hindiName: form.hindiName.trim(),
      verticals: form.verticals,
      categoryIds: form.categoryIds,
      selectionType: form.selectionType,
      isRequired: form.isRequired,
      minSelect: minVal,
      maxSelect: maxVal,
      options: cleanedOptions,
      isActive: form.isActive,
    };

    if (editingGroup) {
      updateOptionGroup(editingGroup.id, payload);
      showFeedback(`Updated customization group "${payload.name}".`);
    } else {
      addOptionGroup(payload);
      showFeedback(`Created customization group "${payload.name}".`);
    }
    setIsModalOpen(false);
  };

  const eligibleCategories = categories.filter((c) => form.verticals.includes(c.vertical));

  return (
    <>
      <MasterPageShell
        icon={<ListPlus className="w-5 h-5" />}
        title="Add-ons & Customization Master"
        subtitle="Manage reusable customization option groups (Pizza Crust, Toppings, Thali Add-ons, Spice & Portion extras) with min/max selection rules and delta pricing."
        totalCount={optionGroups.length}
        activeCount={optionGroups.filter((g) => g.isActive).length}
        addButtonLabel="Add Option Group"
        onAddNew={openAddModal}
        canManage={canManage}
        feedback={feedback}
      >
        <MasterDataTable<OptionGroupMasterRecord>
          data={optionGroups}
          columns={columns}
          searchPlaceholder="Search group name or add-on item..."
          searchMatcher={(g, q) =>
            g.name.toLowerCase().includes(q) ||
            g.hindiName.toLowerCase().includes(q) ||
            g.options.some((o) => o.label.toLowerCase().includes(q))
          }
          filters={tableFilters}
          actions={{
            canManage,
            getRowLabel: (group) => group.name,
            onView: (group) => setViewingGroup(group),
            onEdit: (group) => openEditModal(group),
            onToggleStatus: (group) => {
              toggleOptionGroupStatus(group.id);
              showFeedback(
                `Group "${group.name}" marked ${group.isActive ? 'Inactive' : 'Active'}.`
              );
            },
            onDelete: (group) => setDeleteTarget(group),
            extraActions: canManage
              ? [
                  {
                    id: 'duplicate',
                    label: 'Duplicate Group',
                    icon: <Copy className="w-3.5 h-3.5" />,
                    onClick: (group) => {
                      duplicateOptionGroup(group.id);
                      showFeedback(`Duplicated option group "${group.name}".`);
                    },
                  },
                ]
              : undefined,
          }}
          emptyIcon={<ListPlus className="w-6 h-6" />}
          emptyTitle="No add-on groups found"
          emptyDescription="Create an option group for food customizations, toppings, or add-on services."
          emptyActionLabel={canManage ? 'Add Option Group' : undefined}
          onEmptyAction={canManage ? openAddModal : undefined}
        />
      </MasterPageShell>

      {/* View Detail Drawer */}
      <Drawer
        isOpen={!!viewingGroup}
        onClose={() => setViewingGroup(null)}
        title={viewingGroup ? viewingGroup.name : 'Option Group Details'}
        subtitle={viewingGroup ? viewingGroup.hindiName : undefined}
      >
        {viewingGroup && (
          <div className="space-y-5 text-xs text-left">
            <div className="p-4 bg-[#F8FAFC] rounded-xl border border-[#E5E7EB] grid grid-cols-2 gap-3">
              <div>
                <p className="text-[11px] text-[#6B7280]">Selection Mode</p>
                <p className="font-bold text-[#1F2937] mt-0.5">
                  {viewingGroup.selectionType} ({viewingGroup.isRequired ? 'Required' : 'Optional'})
                </p>
              </div>
              <div>
                <p className="text-[11px] text-[#6B7280]">Min / Max Rules</p>
                <p className="font-bold text-[#1F2937] mt-0.5">
                  Min {viewingGroup.minSelect} • Max {viewingGroup.maxSelect}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-[#6B7280]">
                Configured Choices ({viewingGroup.options.length})
              </h4>
              <div className="divide-y divide-[#E5E7EB] border border-[#E5E7EB] rounded-xl overflow-hidden bg-white">
                {viewingGroup.options.map((o) => (
                  <div key={o.id} className="p-3 flex items-center justify-between gap-2">
                    <div>
                      <span className="font-bold text-[#1F2937]">{o.label}</span>
                      {o.isDefault && (
                        <span className="ml-2 text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#E8F5E9] text-[#176B2C]">
                          Default
                        </span>
                      )}
                    </div>
                    <span className="font-mono font-bold text-[#218838]">
                      {o.priceDeltaPaise > 0 ? `+${formatINR(o.priceDeltaPaise)}` : 'Included (₹0)'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </Drawer>

      {/* Add / Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={
          editingGroup
            ? `Edit Add-on Group: ${editingGroup.name}`
            : 'Add Customization / Add-on Group'
        }
        size="lg"
        footer={
          <div className="flex items-center justify-end gap-2">
            <Button variant="secondary" size="sm" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleSave}>
              {editingGroup ? 'Save Changes' : 'Create Option Group'}
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <Input
              label="Group Name *"
              value={form.name}
              onChange={(e) => {
                setForm({ ...form, name: e.target.value });
                setFormError(null);
              }}
              placeholder="e.g., Extra Toppings, Pizza Crust, Thali Extras"
            />
            <Input
              label="Hindi / Local Label *"
              value={form.hindiName}
              onChange={(e) => {
                setForm({ ...form, hindiName: e.target.value });
                setFormError(null);
              }}
              placeholder="e.g., एक्स्ट्रा टॉपिंग्स"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-[#1F2937] mb-1.5">
                Selection Type *
              </label>
              <select
                value={form.selectionType}
                onChange={(e) => {
                  const sel = e.target.value as 'SINGLE' | 'MULTIPLE';
                  setForm({
                    ...form,
                    selectionType: sel,
                    maxSelect: sel === 'SINGLE' ? '1' : form.maxSelect,
                  });
                }}
                className="w-full h-10 px-3 bg-white border border-[#E5E7EB] rounded-xl text-xs font-semibold text-[#1F2937] outline-none focus:border-[#218838]"
              >
                <option value="SINGLE">Single Select (Radio)</option>
                <option value="MULTIPLE">Multi-Select (Checkboxes)</option>
              </select>
            </div>
            <Input
              label="Min Selections"
              type="number"
              min={0}
              value={form.minSelect}
              onChange={(e) => setForm({ ...form, minSelect: e.target.value })}
            />
            <Input
              label="Max Selections"
              type="number"
              min={1}
              disabled={form.selectionType === 'SINGLE'}
              value={form.selectionType === 'SINGLE' ? '1' : form.maxSelect}
              onChange={(e) => setForm({ ...form, maxSelect: e.target.value })}
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-[#1F2937]">
              Applicable Verticals *
            </label>
            <div className="flex flex-wrap gap-1.5 p-2.5 bg-[#F8FAFC] border border-[#E5E7EB] rounded-xl">
              {verticalConfigs.map((v) => {
                const selected = form.verticals.includes(v.id);
                return (
                  <button
                    type="button"
                    key={v.id}
                    onClick={() =>
                      setForm({ ...form, verticals: toggleInList(form.verticals, v.id) })
                    }
                    className={`px-2.5 py-1 rounded-full text-[11px] font-semibold cursor-pointer ${
                      selected
                        ? 'bg-[#218838] text-white'
                        : 'bg-white text-[#475569] border border-[#E5E7EB]'
                    }`}
                  >
                    {v.name}
                  </button>
                );
              })}
            </div>
          </div>

          {eligibleCategories.length > 0 && (
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-[#1F2937]">
                Map to Categories (Optional)
              </label>
              <div className="flex flex-wrap gap-1.5 p-2.5 bg-[#F8FAFC] border border-[#E5E7EB] rounded-xl max-h-24 overflow-y-auto">
                {eligibleCategories.map((c) => {
                  const selected = form.categoryIds.includes(c.id);
                  return (
                    <button
                      type="button"
                      key={c.id}
                      onClick={() =>
                        setForm({ ...form, categoryIds: toggleInList(form.categoryIds, c.id) })
                      }
                      className={`px-2.5 py-1 rounded-full text-[11px] font-semibold cursor-pointer ${
                        selected
                          ? 'bg-[#218838] text-white'
                          : 'bg-white text-[#475569] border border-[#E5E7EB]'
                      }`}
                    >
                      {c.name}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Dynamic Options Builder */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-[#1F2937]">
                Customization Choices & Extra Price (₹) *
              </label>
              <Button
                variant="secondary"
                size="sm"
                onClick={addOptionRow}
                leftIcon={<Plus className="w-3.5 h-3.5" />}
              >
                Add Option
              </Button>
            </div>

            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {form.options.map((row) => (
                <div
                  key={row.id}
                  className="grid grid-cols-12 gap-2 items-center p-2 bg-[#F8FAFC] border border-[#E5E7EB] rounded-xl"
                >
                  <input
                    type="text"
                    value={row.label}
                    onChange={(e) => updateOptionRow(row.id, { label: e.target.value })}
                    placeholder="Option label (e.g., Extra Cheese)"
                    className="col-span-6 h-9 px-3 bg-white border border-[#E5E7EB] rounded-lg text-xs outline-none focus:border-[#218838]"
                  />
                  <input
                    type="number"
                    min={0}
                    step="1"
                    value={row.priceDeltaInr}
                    onChange={(e) =>
                      updateOptionRow(row.id, { priceDeltaInr: e.target.value })
                    }
                    placeholder="₹ extra"
                    className="col-span-3 h-9 px-3 bg-white border border-[#E5E7EB] rounded-lg text-xs outline-none focus:border-[#218838]"
                  />
                  <label className="col-span-2 inline-flex items-center gap-1 text-[11px] font-semibold text-[#475569] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={row.isDefault}
                      onChange={(e) =>
                        updateOptionRow(row.id, { isDefault: e.target.checked })
                      }
                      className="accent-[#218838]"
                    />
                    Def
                  </label>
                  <button
                    type="button"
                    onClick={() => removeOptionRow(row.id)}
                    disabled={form.options.length <= 1}
                    className="col-span-1 h-8 w-8 rounded-lg flex items-center justify-center text-[#6B7280] hover:text-[#DC2626] hover:bg-red-50 disabled:opacity-40 cursor-pointer"
                    title="Remove option"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-5 pt-1">
            <label className="inline-flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.isRequired}
                onChange={(e) => setForm({ ...form, isRequired: e.target.checked })}
                className="rounded accent-[#218838]"
              />
              <span className="font-semibold text-[#1F2937]">Required Selection</span>
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
            deleteOptionGroup(deleteTarget.id);
            showFeedback(`Deleted option group "${deleteTarget.name}".`);
            setDeleteTarget(null);
          }
        }}
        title="Delete Add-on / Option Group?"
        message={
          deleteTarget
            ? `Delete "${deleteTarget.name}" (${deleteTarget.options.length} choices)? Products using this customization group will no longer display these add-ons.`
            : ''
        }
        confirmText="Delete Group"
        isDestructive
      />
    </>
  );
};
