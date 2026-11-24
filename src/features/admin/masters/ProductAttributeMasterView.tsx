/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useState } from 'react';
import { Sliders, AlertCircle } from 'lucide-react';
import { useAdmin } from '../../../contexts/AdminContext';
import { AttributeDataType, AttributeMasterRecord } from '../../../types/admin';
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

const DATA_TYPES: { value: AttributeDataType; label: string }[] = [
  { value: 'SELECT', label: 'Single Select Dropdown' },
  { value: 'MULTI_SELECT', label: 'Multi-Select Chips' },
  { value: 'TEXT', label: 'Free Text' },
  { value: 'NUMBER', label: 'Numeric Value' },
  { value: 'BOOLEAN', label: 'Yes / No Toggle' },
  { value: 'DIMENSIONS', label: 'Dimensions (L × W × H)' },
];

export const ProductAttributeMasterView: React.FC = () => {
  const {
    attributes,
    categories,
    verticalConfigs,
    addAttribute,
    updateAttribute,
    toggleAttributeStatus,
    deleteAttribute,
    hasPermission,
  } = useAdmin();

  const canManage = hasPermission('MASTER_ATTRIBUTES', 'manage');



  const [viewingAttr, setViewingAttr] = useState<AttributeMasterRecord | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAttr, setEditingAttr] = useState<AttributeMasterRecord | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AttributeMasterRecord | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: '',
    hindiName: '',
    slug: '',
    dataType: 'SELECT' as AttributeDataType,
    optionsCsv: '',
    unitSuffix: '',
    isRequired: false,
    isFilterable: true,
    isVariantAxis: false,
    verticals: ['FOOD'] as string[],
    categoryIds: [] as string[],
    isActive: true,
  });

  const showFeedback = (msg: string) => {
    setFeedback(msg);
    setTimeout(() => setFeedback(null), 3500);
  };

  // Resolve categories that reference this attribute either via categoryIds or Category.attributeIds
  const getLinkedCategories = (attr: AttributeMasterRecord) => {
    const directIds = new Set(attr.categoryIds || []);
    categories.forEach((c) => {
      if (c.attributeIds?.includes(attr.id)) directIds.add(c.id);
    });
    return categories.filter((c) => directIds.has(c.id));
  };

  const tableFilters = useMemo<MasterTableFilterConfig<AttributeMasterRecord>[]>(
    () => [
      {
        id: 'vertical',
        label: 'Filter by vertical',
        allLabel: 'All Verticals',
        options: verticalConfigs.map((v) => ({ value: v.id, label: v.name })),
        predicate: (attr, val) => attr.verticals.includes(val),
      },
      {
        id: 'category',
        label: 'Filter by category',
        allLabel: 'All Categories',
        options: categories.map((c) => ({ value: c.id, label: c.name })),
        predicate: (attr, val) => getLinkedCategories(attr).some((c) => c.id === val),
      },
      {
        id: 'dataType',
        label: 'Filter by data type',
        allLabel: 'All Types',
        options: DATA_TYPES.map((t) => ({
          value: t.value,
          label: t.value.replace(/_/g, ' '),
        })),
        predicate: (attr, val) => attr.dataType === val,
      },
    ],
    [verticalConfigs, categories]
  );

  const columns = useMemo<MasterTableColumn<AttributeMasterRecord>[]>(
    () => [
      {
        key: 'name',
        header: 'Attribute & Slug',
        sortable: true,
        sortValue: (attr) => attr.name,
        render: (attr) => (
          <div>
            <p className="font-bold text-[#1F2937]">{attr.name}</p>
            <p className="text-[11px] text-[#6B7280]">
              {attr.hindiName} • <span className="font-mono">{attr.slug}</span>
            </p>
          </div>
        ),
      },
      {
        key: 'dataType',
        header: 'Type & Options',
        sortable: true,
        sortValue: (attr) => attr.dataType,
        render: (attr) => (
          <div>
            <Badge variant="info" size="sm">
              {attr.dataType.replace(/_/g, ' ')}
            </Badge>
            {attr.options && attr.options.length > 0 && (
              <p className="text-[11px] text-[#6B7280] mt-1 max-w-[200px] truncate">
                {attr.options.join(', ')}
              </p>
            )}
            {attr.unitSuffix && (
              <p className="text-[10px] font-mono text-[#6B7280] mt-0.5">
                Suffix: {attr.unitSuffix}
              </p>
            )}
          </div>
        ),
      },
      {
        key: 'verticals',
        header: 'Verticals & Categories',
        render: (attr) => {
          const linkedCats = getLinkedCategories(attr);
          return (
            <div>
              <div className="flex flex-wrap gap-1 mb-1">
                {attr.verticals.map((v) => (
                  <VerticalBadge key={v} vertical={v} />
                ))}
              </div>
              <p className="text-[11px] text-[#6B7280]">
                {linkedCats.length > 0
                  ? `${linkedCats.length} category(ies): ${linkedCats
                      .slice(0, 2)
                      .map((c) => c.name)
                      .join(', ')}${linkedCats.length > 2 ? '…' : ''}`
                  : 'Applies to full vertical'}
              </p>
            </div>
          );
        },
      },
      {
        key: 'flags',
        header: 'Flags',
        render: (attr) => (
          <div className="flex flex-wrap gap-1">
            {attr.isRequired && (
              <Badge variant="error" size="sm">
                Required
              </Badge>
            )}
            {attr.isVariantAxis && (
              <Badge variant="primary" size="sm">
                Variant Axis
              </Badge>
            )}
            {attr.isFilterable && (
              <Badge variant="neutral" size="sm">
                Filterable
              </Badge>
            )}
          </div>
        ),
      },
    ],
    [categories]
  );

  const openAddModal = () => {
    setEditingAttr(null);
    setFormError(null);
    setForm({
      name: '',
      hindiName: '',
      slug: '',
      dataType: 'SELECT',
      optionsCsv: '',
      unitSuffix: '',
      isRequired: false,
      isFilterable: true,
      isVariantAxis: false,
      verticals: ['FOOD'],
      categoryIds: [],
      isActive: true,
    });
    setIsModalOpen(true);
  };

  const openEditModal = (attr: AttributeMasterRecord) => {
    const linked = getLinkedCategories(attr).map((c) => c.id);
    setEditingAttr(attr);
    setFormError(null);
    setForm({
      name: attr.name,
      hindiName: attr.hindiName,
      slug: attr.slug,
      dataType: attr.dataType,
      optionsCsv: (attr.options || []).join(', '),
      unitSuffix: attr.unitSuffix || '',
      isRequired: attr.isRequired,
      isFilterable: attr.isFilterable,
      isVariantAxis: attr.isVariantAxis,
      verticals: attr.verticals.length ? attr.verticals : ['FOOD'],
      categoryIds: linked,
      isActive: attr.isActive,
    });
    setIsModalOpen(true);
  };

  const toggleInList = (list: string[], val: string) =>
    list.includes(val) ? list.filter((x) => x !== val) : [...list, val];

  const handleSave = () => {
    if (!form.name.trim()) {
      setFormError('Attribute name is required.');
      return;
    }
    if (!form.hindiName.trim()) {
      setFormError('Hindi / local label is required.');
      return;
    }
    if (form.verticals.length === 0) {
      setFormError('Select at least one vertical.');
      return;
    }

    const options =
      form.dataType === 'SELECT' || form.dataType === 'MULTI_SELECT'
        ? form.optionsCsv
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean)
        : undefined;

    if (
      (form.dataType === 'SELECT' || form.dataType === 'MULTI_SELECT') &&
      (!options || options.length === 0)
    ) {
      setFormError('Provide at least one comma-separated option for Select / Multi-Select attributes.');
      return;
    }

    const slug =
      form.slug.trim().toLowerCase().replace(/[^a-z0-9_]/g, '_') ||
      form.name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_');

    const payload: Omit<AttributeMasterRecord, 'id'> = {
      name: form.name.trim(),
      hindiName: form.hindiName.trim(),
      slug,
      dataType: form.dataType,
      options,
      unitSuffix: form.unitSuffix.trim() || undefined,
      isRequired: form.isRequired,
      isFilterable: form.isFilterable,
      isVariantAxis: form.isVariantAxis,
      verticals: form.verticals,
      categoryIds: form.categoryIds,
      isActive: form.isActive,
    };

    if (editingAttr) {
      updateAttribute(editingAttr.id, payload);
      showFeedback(`Updated attribute "${payload.name}".`);
    } else {
      addAttribute(payload);
      showFeedback(`Created attribute "${payload.name}".`);
    }
    setIsModalOpen(false);
  };

  const eligibleCategories = categories.filter((c) =>
    form.verticals.includes(c.vertical)
  );

  return (
    <>
      <MasterPageShell
        icon={<Sliders className="w-5 h-5" />}
        title="Product Attribute Master"
        subtitle="Configure category-specific product specifications (Dietary Type, Spice Level, Pack Weight, Shelf Life, Material, Warranty) and variant-generating axes."
        totalCount={attributes.length}
        activeCount={attributes.filter((a) => a.isActive).length}
        addButtonLabel="Add New Attribute"
        onAddNew={openAddModal}
        canManage={canManage}
        feedback={feedback}
      >
        <MasterDataTable<AttributeMasterRecord>
          data={attributes}
          columns={columns}
          searchPlaceholder="Search attribute, slug, options..."
          searchMatcher={(attr, q) =>
            attr.name.toLowerCase().includes(q) ||
            attr.hindiName.toLowerCase().includes(q) ||
            attr.slug.toLowerCase().includes(q) ||
            (attr.options || []).some((opt) => opt.toLowerCase().includes(q))
          }
          filters={tableFilters}
          actions={{
            canManage,
            getRowLabel: (attr) => attr.name,
            onView: (attr) => setViewingAttr(attr),
            onEdit: (attr) => openEditModal(attr),
            onToggleStatus: (attr) => {
              toggleAttributeStatus(attr.id);
              showFeedback(
                `Attribute "${attr.name}" marked ${attr.isActive ? 'Inactive' : 'Active'}.`
              );
            },
            onDelete: (attr) => setDeleteTarget(attr),
          }}
          emptyIcon={<Sliders className="w-6 h-6" />}
          emptyTitle="No attributes found"
          emptyDescription="Create category-configurable product specifications and variant axes."
          emptyActionLabel={canManage ? 'Add New Attribute' : undefined}
          onEmptyAction={canManage ? openAddModal : undefined}
        />
      </MasterPageShell>

      {/* View Detail Drawer */}
      <Drawer
        isOpen={!!viewingAttr}
        onClose={() => setViewingAttr(null)}
        title={viewingAttr ? viewingAttr.name : 'Attribute Details'}
        subtitle={viewingAttr ? `${viewingAttr.hindiName} • slug: ${viewingAttr.slug}` : undefined}
      >
        {viewingAttr && (
          <div className="space-y-5 text-xs text-left">
            <div className="p-4 bg-[#F8FAFC] rounded-xl border border-[#E5E7EB] grid grid-cols-2 gap-3">
              <div>
                <p className="text-[11px] text-[#6B7280]">Data Type</p>
                <p className="font-bold text-[#1F2937] mt-0.5">{viewingAttr.dataType}</p>
              </div>
              <div>
                <p className="text-[11px] text-[#6B7280]">Unit Suffix</p>
                <p className="font-bold text-[#1F2937] mt-0.5">
                  {viewingAttr.unitSuffix || 'None'}
                </p>
              </div>
              <div>
                <p className="text-[11px] text-[#6B7280]">Required on Listing</p>
                <p className="font-bold text-[#1F2937] mt-0.5">
                  {viewingAttr.isRequired ? 'Yes (Mandatory)' : 'Optional'}
                </p>
              </div>
              <div>
                <p className="text-[11px] text-[#6B7280]">Variant Axis</p>
                <p className="font-bold text-[#1F2937] mt-0.5">
                  {viewingAttr.isVariantAxis ? 'Generates Variants / Sizes' : 'Specification Only'}
                </p>
              </div>
            </div>

            {viewingAttr.options && viewingAttr.options.length > 0 && (
              <div className="space-y-1.5">
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-[#6B7280]">
                  Allowed Values ({viewingAttr.options.length})
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {viewingAttr.options.map((opt) => (
                    <Badge key={opt} variant="neutral" size="sm">
                      {opt}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-[#6B7280]">
                Configured Categories ({getLinkedCategories(viewingAttr).length})
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {getLinkedCategories(viewingAttr).length > 0 ? (
                  getLinkedCategories(viewingAttr).map((c) => (
                    <Badge key={c.id} variant="primary" size="sm">
                      {c.name}
                    </Badge>
                  ))
                ) : (
                  <p className="text-[#6B7280]">Applies to all categories in selected verticals.</p>
                )}
              </div>
            </div>
          </div>
        )}
      </Drawer>

      {/* Add / Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingAttr ? `Edit Attribute: ${editingAttr.name}` : 'Add Product Attribute'}
        size="lg"
        footer={
          <div className="flex items-center justify-end gap-2">
            <Button variant="secondary" size="sm" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleSave}>
              {editingAttr ? 'Save Changes' : 'Create Attribute'}
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
            <Input
              label="Attribute Name *"
              value={form.name}
              onChange={(e) => {
                setForm({ ...form, name: e.target.value });
                setFormError(null);
              }}
              placeholder="e.g., Spice Level, Pack Weight"
            />
            <Input
              label="Hindi / Local Label *"
              value={form.hindiName}
              onChange={(e) => {
                setForm({ ...form, hindiName: e.target.value });
                setFormError(null);
              }}
              placeholder="e.g., तीखापन"
            />
            <Input
              label="Field Code / Slug"
              value={form.slug}
              onChange={(e) => setForm({ ...form, slug: e.target.value })}
              placeholder="auto-generated if blank"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-[#1F2937] mb-1.5">
                Input Data Type *
              </label>
              <select
                value={form.dataType}
                onChange={(e) =>
                  setForm({ ...form, dataType: e.target.value as AttributeDataType })
                }
                className="w-full h-10 px-3 bg-white border border-[#E5E7EB] rounded-xl text-xs font-semibold text-[#1F2937] outline-none focus:border-[#218838]"
              >
                {DATA_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
            <Input
              label="Unit Suffix (Optional)"
              value={form.unitSuffix}
              onChange={(e) => setForm({ ...form, unitSuffix: e.target.value })}
              placeholder="e.g., g, ml, days, W"
            />
          </div>

          {(form.dataType === 'SELECT' || form.dataType === 'MULTI_SELECT') && (
            <Input
              label="Allowed Options (Comma Separated) *"
              value={form.optionsCsv}
              onChange={(e) => {
                setForm({ ...form, optionsCsv: e.target.value });
                setFormError(null);
              }}
              placeholder="e.g., Mild, Medium, Spicy"
            />
          )}

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-[#1F2937]">
              Applicable Verticals *
            </label>
            <div className="flex flex-wrap gap-1.5 p-3 bg-[#F8FAFC] border border-[#E5E7EB] rounded-xl">
              {verticalConfigs.map((v) => {
                const selected = form.verticals.includes(v.id);
                return (
                  <button
                    type="button"
                    key={v.id}
                    onClick={() =>
                      setForm({
                        ...form,
                        verticals: toggleInList(form.verticals, v.id),
                      })
                    }
                    className={`px-2.5 py-1 rounded-full text-[11px] font-semibold cursor-pointer transition-colors ${
                      selected
                        ? 'bg-[#218838] text-white'
                        : 'bg-white text-[#475569] border border-[#E5E7EB] hover:border-[#218838]'
                    }`}
                  >
                    {v.name}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-[#1F2937]">
              Map to Specific Categories ({form.categoryIds.length} selected)
            </label>
            <div className="flex flex-wrap gap-1.5 p-3 bg-[#F8FAFC] border border-[#E5E7EB] rounded-xl max-h-28 overflow-y-auto">
              {eligibleCategories.length > 0 ? (
                eligibleCategories.map((c) => {
                  const selected = form.categoryIds.includes(c.id);
                  return (
                    <button
                      type="button"
                      key={c.id}
                      onClick={() =>
                        setForm({
                          ...form,
                          categoryIds: toggleInList(form.categoryIds, c.id),
                        })
                      }
                      className={`px-2.5 py-1 rounded-full text-[11px] font-semibold cursor-pointer transition-colors ${
                        selected
                          ? 'bg-[#218838] text-white'
                          : 'bg-white text-[#475569] border border-[#E5E7EB] hover:border-[#218838]'
                      }`}
                    >
                      {c.name}
                    </button>
                  );
                })
              ) : (
                <span className="text-[#6B7280]">Select a vertical above to pick categories.</span>
              )}
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
              <span className="font-semibold text-[#1F2937]">Required Field</span>
            </label>
            <label className="inline-flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.isFilterable}
                onChange={(e) => setForm({ ...form, isFilterable: e.target.checked })}
                className="rounded accent-[#218838]"
              />
              <span className="font-semibold text-[#1F2937]">Show in Filters</span>
            </label>
            <label className="inline-flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.isVariantAxis}
                onChange={(e) => setForm({ ...form, isVariantAxis: e.target.checked })}
                className="rounded accent-[#218838]"
              />
              <span className="font-semibold text-[#1F2937]">Variant / Size Axis</span>
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
            deleteAttribute(deleteTarget.id);
            showFeedback(`Deleted attribute "${deleteTarget.name}".`);
            setDeleteTarget(null);
          }
        }}
        title="Delete Product Attribute?"
        message={
          deleteTarget
            ? `Are you sure you want to delete "${deleteTarget.name}"? This removes it from future product forms.`
            : ''
        }
        confirmText="Delete Attribute"
        isDestructive
      />
    </>
  );
};
