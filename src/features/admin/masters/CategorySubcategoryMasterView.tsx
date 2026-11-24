/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useState } from 'react';
import { Layers, CornerDownRight, AlertCircle } from 'lucide-react';
import { useAdmin } from '../../../contexts/AdminContext';
import { CategoryRecord } from '../../../types/admin';
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

export const CategorySubcategoryMasterView: React.FC = () => {
  const {
    categories,
    verticalConfigs,
    attributes,
    units,
    products,
    addCategory,
    updateCategory,
    toggleCategoryStatus,
    deleteCategory,
    hasPermission,
  } = useAdmin();

  const canManage = hasPermission('MASTER_CATEGORIES', 'manage');

  // Track selected vertical filter to pre-fill Add modal
  const [activeVerticalFilter, setActiveVerticalFilter] = useState<string>('ALL');

  // Modals / Drawers
  const [viewingCat, setViewingCat] = useState<CategoryRecord | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCat, setEditingCat] = useState<CategoryRecord | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<CategoryRecord | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  // Form state
  const [form, setForm] = useState({
    name: '',
    hindiName: '',
    vertical: 'FOOD',
    parentId: '',
    icon: 'Layers',
    sortOrder: 10,
    attributeIds: [] as string[],
    allowedUnitIds: [] as string[],
    isActive: true,
  });

  const showFeedback = (msg: string) => {
    setFeedback(msg);
    setTimeout(() => setFeedback(null), 3500);
  };

  const categoryMap = useMemo(() => {
    const map = new Map<string, CategoryRecord>();
    categories.forEach((c) => map.set(c.id, c));
    return map;
  }, [categories]);

  const childCountOf = (catId: string) =>
    categories.filter((c) => c.parentId === catId).length;
  const productCountOf = (catId: string) =>
    products.filter((p) => p.categoryId === catId || p.subcategoryId === catId).length;

  const tableFilters = useMemo<MasterTableFilterConfig<CategoryRecord>[]>(
    () => [
      {
        id: 'vertical',
        label: 'Filter by vertical',
        allLabel: 'All Verticals',
        options: verticalConfigs.map((v) => ({ value: v.id, label: v.name })),
        predicate: (cat, val) => cat.vertical === val,
      },
      {
        id: 'hierarchy',
        label: 'Filter by hierarchy level',
        allLabel: 'All Levels',
        options: [
          { value: 'ROOT', label: 'Parent Categories' },
          { value: 'SUB', label: 'Subcategories Only' },
        ],
        predicate: (cat, val) =>
          val === 'ROOT' ? !cat.parentId : Boolean(cat.parentId),
      },
    ],
    [verticalConfigs]
  );

  const columns = useMemo<MasterTableColumn<CategoryRecord>[]>(
    () => [
      {
        key: 'sortOrder',
        header: 'Order',
        sortable: true,
        sortValue: (cat) => cat.sortOrder,
        cellClassName: 'font-mono text-[#6B7280]',
        render: (cat) => <>#{cat.sortOrder}</>,
      },
      {
        key: 'name',
        header: 'Category / Subcategory',
        sortable: true,
        sortValue: (cat) => cat.name,
        render: (cat) => (
          <div className="flex items-center gap-1.5">
            {cat.parentId && (
              <CornerDownRight className="w-3.5 h-3.5 text-[#6B7280] shrink-0" />
            )}
            <div>
              <p className="font-bold text-[#1F2937]">{cat.name}</p>
              <p className="text-[11px] text-[#6B7280]">{cat.hindiName}</p>
            </div>
          </div>
        ),
      },
      {
        key: 'vertical',
        header: 'Vertical',
        sortable: true,
        sortValue: (cat) => cat.vertical,
        render: (cat) => <VerticalBadge vertical={cat.vertical} />,
      },
      {
        key: 'hierarchy',
        header: 'Hierarchy',
        render: (cat) => {
          const parent = cat.parentId ? categoryMap.get(cat.parentId) : undefined;
          const subCount = childCountOf(cat.id);
          return parent ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-[10px] font-semibold">
              Sub of {parent.name}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-semibold">
              Root {subCount > 0 ? `(${subCount} sub)` : ''}
            </span>
          );
        },
      },
      {
        key: 'linkedMasters',
        header: 'Linked Masters',
        cellClassName: 'text-[11px] text-[#475569]',
        render: (cat) => (
          <>
            <span className="font-semibold">{cat.attributeIds?.length || 0}</span> attrs •{' '}
            <span className="font-semibold">{cat.allowedUnitIds?.length || 0}</span> units
          </>
        ),
      },
    ],
    [categoryMap, categories]
  );

  const openAddModal = () => {
    setEditingCat(null);
    setFormError(null);
    setForm({
      name: '',
      hindiName: '',
      vertical: activeVerticalFilter !== 'ALL' ? activeVerticalFilter : 'FOOD',
      parentId: '',
      icon: 'Layers',
      sortOrder: categories.length + 1,
      attributeIds: [],
      allowedUnitIds: [],
      isActive: true,
    });
    setIsModalOpen(true);
  };

  const openEditModal = (cat: CategoryRecord) => {
    setEditingCat(cat);
    setFormError(null);
    setForm({
      name: cat.name,
      hindiName: cat.hindiName,
      vertical: cat.vertical,
      parentId: cat.parentId || '',
      icon: cat.icon || 'Layers',
      sortOrder: cat.sortOrder,
      attributeIds: cat.attributeIds || [],
      allowedUnitIds: cat.allowedUnitIds || [],
      isActive: cat.isActive,
    });
    setIsModalOpen(true);
  };

  const toggleSelection = (list: string[], id: string): string[] =>
    list.includes(id) ? list.filter((item) => item !== id) : [...list, id];

  const handleSave = () => {
    if (!form.name.trim()) {
      setFormError('Category name is required.');
      return;
    }
    if (!form.hindiName.trim()) {
      setFormError('Hindi / local display label is required for rural village clarity.');
      return;
    }
    if (form.sortOrder < 1 || Number.isNaN(form.sortOrder)) {
      setFormError('Sort order must be a positive number.');
      return;
    }
    if (editingCat && form.parentId === editingCat.id) {
      setFormError('A category cannot be its own parent.');
      return;
    }

    const payload = {
      name: form.name.trim(),
      hindiName: form.hindiName.trim(),
      vertical: form.vertical,
      parentId: form.parentId || undefined,
      icon: form.icon || 'Layers',
      sortOrder: Number(form.sortOrder),
      attributeIds: form.attributeIds,
      allowedUnitIds: form.allowedUnitIds,
      isActive: form.isActive,
    };

    if (editingCat) {
      updateCategory(editingCat.id, payload);
      showFeedback(`Updated "${payload.name}" successfully.`);
    } else {
      addCategory(payload);
      showFeedback(`Created category "${payload.name}".`);
    }
    setIsModalOpen(false);
  };

  const parentCandidates = categories.filter(
    (c) => !c.parentId && c.vertical === form.vertical && c.id !== editingCat?.id
  );

  const verticalAttributes = attributes.filter(
    (a) => a.verticals.includes(form.vertical) || a.verticals.includes('ALL')
  );
  const verticalUnits = units.filter(
    (u) => u.verticals.includes(form.vertical) || u.verticals.includes('ALL')
  );

  return (
    <>
      <MasterPageShell
        icon={<Layers className="w-5 h-5" />}
        title="Category & Subcategory Master"
        subtitle="Define hierarchical categories and subcategories across Food, Grocery, and expansion verticals with linked product attributes and measurement units."
        totalCount={categories.length}
        activeCount={categories.filter((c) => c.isActive).length}
        addButtonLabel="Add New Category"
        onAddNew={openAddModal}
        canManage={canManage}
        feedback={feedback}
      >
        <MasterDataTable<CategoryRecord>
          data={categories}
          columns={columns}
          defaultSort={{ key: 'sortOrder', direction: 'asc' }}
          searchPlaceholder="Search category or Hindi name..."
          searchMatcher={(c, q) =>
            c.name.toLowerCase().includes(q) ||
            c.hindiName.toLowerCase().includes(q) ||
            c.vertical.toLowerCase().includes(q)
          }
          filters={tableFilters}
          onFilterStateChange={(state) => setActiveVerticalFilter(state.vertical || 'ALL')}
          actions={{
            canManage,
            getRowLabel: (cat) => cat.name,
            onView: (cat) => setViewingCat(cat),
            onEdit: (cat) => openEditModal(cat),
            onToggleStatus: (cat) => {
              toggleCategoryStatus(cat.id);
              showFeedback(
                `Category "${cat.name}" marked ${cat.isActive ? 'Inactive' : 'Active'}.`
              );
            },
            onDelete: (cat) => setDeleteTarget(cat),
          }}
          emptyIcon={<Layers className="w-6 h-6" />}
          emptyTitle="No categories found"
          emptyDescription="Create your first parent category or subcategory to structure the catalog."
          emptyActionLabel={canManage ? 'Add New Category' : undefined}
          onEmptyAction={canManage ? openAddModal : undefined}
        />
      </MasterPageShell>

      {/* View Detail Drawer */}
      <Drawer
        isOpen={!!viewingCat}
        onClose={() => setViewingCat(null)}
        title={viewingCat ? viewingCat.name : 'Category Details'}
        subtitle={viewingCat ? `${viewingCat.hindiName} • ID: ${viewingCat.id}` : undefined}
      >
        {viewingCat && (
          <div className="space-y-5 text-xs text-left">
            <div className="p-4 bg-[#F8FAFC] rounded-xl border border-[#E5E7EB] grid grid-cols-2 gap-3">
              <div>
                <p className="text-[11px] text-[#6B7280]">Vertical</p>
                <div className="mt-1">
                  <VerticalBadge vertical={viewingCat.vertical} />
                </div>
              </div>
              <div>
                <p className="text-[11px] text-[#6B7280]">Status</p>
                <div className="mt-1">
                  <Badge variant={viewingCat.isActive ? 'success' : 'neutral'} size="sm" dot>
                    {viewingCat.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </div>
              <div>
                <p className="text-[11px] text-[#6B7280]">Hierarchy</p>
                <p className="font-bold text-[#1F2937] mt-0.5">
                  {viewingCat.parentId
                    ? `Subcategory of ${categoryMap.get(viewingCat.parentId)?.name || viewingCat.parentId}`
                    : `Parent Category (${childCountOf(viewingCat.id)} subcategories)`}
                </p>
              </div>
              <div>
                <p className="text-[11px] text-[#6B7280]">Sort Priority & Products</p>
                <p className="font-bold text-[#1F2937] mt-0.5">
                  #{viewingCat.sortOrder} • {productCountOf(viewingCat.id)} catalog items
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-[#6B7280]">
                Mapped Product Attributes ({viewingCat.attributeIds?.length || 0})
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {viewingCat.attributeIds && viewingCat.attributeIds.length > 0 ? (
                  viewingCat.attributeIds.map((id) => {
                    const attr = attributes.find((a) => a.id === id);
                    return (
                      <Badge key={id} variant="info" size="sm">
                        {attr ? `${attr.name} (${attr.dataType})` : id}
                      </Badge>
                    );
                  })
                ) : (
                  <p className="text-[#6B7280]">No attributes linked yet.</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-[#6B7280]">
                Allowed Measurement Units ({viewingCat.allowedUnitIds?.length || 0})
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {viewingCat.allowedUnitIds && viewingCat.allowedUnitIds.length > 0 ? (
                  viewingCat.allowedUnitIds.map((id) => {
                    const unit = units.find((u) => u.id === id);
                    return (
                      <Badge key={id} variant="primary" size="sm">
                        {unit ? `${unit.name} (${unit.symbol})` : id}
                      </Badge>
                    );
                  })
                ) : (
                  <p className="text-[#6B7280]">Uses vertical default units.</p>
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
        title={editingCat ? `Edit Category: ${editingCat.name}` : 'Add Category / Subcategory'}
        size="lg"
        footer={
          <div className="flex items-center justify-end gap-2">
            <Button variant="secondary" size="sm" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleSave}>
              {editingCat ? 'Save Changes' : 'Create Category'}
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
              label="Category Name (English) *"
              value={form.name}
              onChange={(e) => {
                setForm({ ...form, name: e.target.value });
                setFormError(null);
              }}
              placeholder="e.g., Thali & Meals or Pulses & Dal"
            />
            <Input
              label="Local / Hindi Name *"
              value={form.hindiName}
              onChange={(e) => {
                setForm({ ...form, hindiName: e.target.value });
                setFormError(null);
              }}
              placeholder="e.g., थाली और भोजन"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-[#1F2937] mb-1.5">
                Vertical *
              </label>
              <select
                value={form.vertical}
                onChange={(e) =>
                  setForm({
                    ...form,
                    vertical: e.target.value,
                    parentId: '',
                  })
                }
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
                Parent Category (Optional)
              </label>
              <select
                value={form.parentId}
                onChange={(e) => setForm({ ...form, parentId: e.target.value })}
                className="w-full h-10 px-3 bg-white border border-[#E5E7EB] rounded-xl text-xs font-semibold text-[#1F2937] outline-none focus:border-[#218838]"
              >
                <option value="">None (Root Category)</option>
                {parentCandidates.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            <Input
              label="Display Sort Order *"
              type="number"
              min={1}
              value={String(form.sortOrder)}
              onChange={(e) =>
                setForm({ ...form, sortOrder: Number(e.target.value) || 1 })
              }
            />
          </div>

          {/* Linked Attributes */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-[#1F2937]">
              Applicable Product Attributes ({form.attributeIds.length} selected)
            </label>
            <div className="flex flex-wrap gap-1.5 p-3 bg-[#F8FAFC] border border-[#E5E7EB] rounded-xl max-h-28 overflow-y-auto">
              {verticalAttributes.length > 0 ? (
                verticalAttributes.map((attr) => {
                  const selected = form.attributeIds.includes(attr.id);
                  return (
                    <button
                      type="button"
                      key={attr.id}
                      onClick={() =>
                        setForm({
                          ...form,
                          attributeIds: toggleSelection(form.attributeIds, attr.id),
                        })
                      }
                      className={`px-2.5 py-1 rounded-full text-[11px] font-semibold cursor-pointer transition-colors ${
                        selected
                          ? 'bg-[#218838] text-white'
                          : 'bg-white text-[#475569] border border-[#E5E7EB] hover:border-[#218838]'
                      }`}
                    >
                      {attr.name}
                    </button>
                  );
                })
              ) : (
                <span className="text-[#6B7280]">No attributes defined for this vertical.</span>
              )}
            </div>
          </div>

          {/* Linked Units */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-[#1F2937]">
              Allowed Units & Measurements ({form.allowedUnitIds.length} selected)
            </label>
            <div className="flex flex-wrap gap-1.5 p-3 bg-[#F8FAFC] border border-[#E5E7EB] rounded-xl max-h-28 overflow-y-auto">
              {verticalUnits.map((unit) => {
                const selected = form.allowedUnitIds.includes(unit.id);
                return (
                  <button
                    type="button"
                    key={unit.id}
                    onClick={() =>
                      setForm({
                        ...form,
                        allowedUnitIds: toggleSelection(form.allowedUnitIds, unit.id),
                      })
                    }
                    className={`px-2.5 py-1 rounded-full text-[11px] font-semibold cursor-pointer transition-colors ${
                      selected
                        ? 'bg-[#218838] text-white'
                        : 'bg-white text-[#475569] border border-[#E5E7EB] hover:border-[#218838]'
                    }`}
                  >
                    {unit.name} ({unit.symbol})
                  </button>
                );
              })}
            </div>
          </div>

          <label className="inline-flex items-center gap-2 cursor-pointer pt-1">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
              className="rounded accent-[#218838]"
            />
            <span className="font-semibold text-[#1F2937]">Active on Marketplace</span>
          </label>
        </div>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) {
            deleteCategory(deleteTarget.id);
            showFeedback(`Deleted category "${deleteTarget.name}".`);
            setDeleteTarget(null);
          }
        }}
        title="Delete Category?"
        message={
          deleteTarget
            ? `Are you sure you want to delete "${deleteTarget.name}"?${
                childCountOf(deleteTarget.id) > 0
                  ? ` Warning: ${childCountOf(deleteTarget.id)} nested subcategory(ies) will also be removed.`
                  : ''
              }`
            : ''
        }
        confirmText="Delete Category"
        isDestructive
      />
    </>
  );
};
