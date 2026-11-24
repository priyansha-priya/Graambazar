/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useState } from 'react';
import { Boxes, AlertCircle, AlertTriangle } from 'lucide-react';
import { useAdmin } from '../../../contexts/AdminContext';
import { VariantSizeMasterRecord } from '../../../types/admin';
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

export const ProductVariantSizeMasterView: React.FC = () => {
  const {
    variantMasters,
    verticalConfigs,
    categories,
    units,
    products,
    addVariantMaster,
    updateVariantMaster,
    toggleVariantMasterStatus,
    deleteVariantMaster,
    hasPermission,
  } = useAdmin();

  const canManage = hasPermission('MASTER_VARIANTS', 'manage');

  const [activeVerticalFilter, setActiveVerticalFilter] = useState('ALL');

  const [viewingVariant, setViewingVariant] = useState<VariantSizeMasterRecord | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVariant, setEditingVariant] = useState<VariantSizeMasterRecord | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<VariantSizeMasterRecord | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const [form, setForm] = useState({
    sku: '',
    name: '',
    sizeLabel: '',
    vertical: 'GROCERY',
    categoryId: '',
    productId: '',
    unitId: 'unit_kg',
    unitQuantity: '1',
    mrpInr: '',
    sellingPriceInr: '',
    stockQuantity: '20',
    lowStockThreshold: '5',
    isActive: true,
  });

  const showFeedback = (msg: string) => {
    setFeedback(msg);
    setTimeout(() => setFeedback(null), 3500);
  };

  const getCategoryName = (id: string) =>
    categories.find((c) => c.id === id)?.name || id;
  const getUnitLabel = (id: string) => {
    const u = units.find((item) => item.id === id);
    return u ? `${u.name} (${u.symbol})` : id;
  };
  const getProductName = (id?: string) =>
    id ? products.find((p) => p.id === id)?.name : undefined;

  const tableFilters = useMemo<MasterTableFilterConfig<VariantSizeMasterRecord>[]>(
    () => [
      {
        id: 'vertical',
        label: 'Filter by vertical',
        allLabel: 'All Verticals',
        options: verticalConfigs.map((v) => ({ value: v.id, label: v.name })),
        predicate: (v, val) => v.vertical === val,
      },
      {
        id: 'category',
        label: 'Filter by category',
        allLabel: 'All Categories',
        options: categories.map((c) => ({ value: c.id, label: c.name })),
        predicate: (v, val) => v.categoryId === val,
      },
      {
        id: 'stock',
        label: 'Filter by stock level',
        allLabel: 'All Stock Levels',
        options: [
          { value: 'LOW', label: 'Low Stock' },
          { value: 'OUT', label: 'Out of Stock' },
        ],
        predicate: (v, val) =>
          val === 'OUT'
            ? v.stockQuantity <= 0
            : v.stockQuantity > 0 && v.stockQuantity <= v.lowStockThreshold,
      },
    ],
    [verticalConfigs, categories]
  );

  const columns = useMemo<MasterTableColumn<VariantSizeMasterRecord>[]>(
    () => [
      {
        key: 'name',
        header: 'Variant & SKU',
        sortable: true,
        sortValue: (v) => v.name,
        render: (v) => (
          <div>
            <p className="font-bold text-[#1F2937]">{v.name}</p>
            <p className="font-mono text-[10px] text-[#6B7280]">{v.sku}</p>
          </div>
        ),
      },
      {
        key: 'sizeLabel',
        header: 'Size & Unit',
        sortable: true,
        sortValue: (v) => v.sizeLabel,
        render: (v) => (
          <div>
            <Badge variant="primary" size="sm">
              {v.sizeLabel}
            </Badge>
            <p className="text-[11px] text-[#6B7280] mt-0.5">
              {v.unitQuantity} × {getUnitLabel(v.unitId)}
            </p>
          </div>
        ),
      },
      {
        key: 'vertical',
        header: 'Vertical & Category',
        render: (v) => (
          <div>
            <div className="mb-1">
              <VerticalBadge vertical={v.vertical} />
            </div>
            <p className="text-[11px] text-[#475569]">{getCategoryName(v.categoryId)}</p>
          </div>
        ),
      },
      {
        key: 'sellingPricePaise',
        header: 'Price / MRP',
        sortable: true,
        sortValue: (v) => v.sellingPricePaise,
        render: (v) => {
          const discountPct =
            v.mrpPaise > v.sellingPricePaise
              ? Math.round(((v.mrpPaise - v.sellingPricePaise) / v.mrpPaise) * 100)
              : 0;
          return (
            <div>
              <p className="font-black text-[#1F2937]">{formatINR(v.sellingPricePaise)}</p>
              <p className="text-[11px] text-[#6B7280]">
                <span className="line-through">{formatINR(v.mrpPaise)}</span>
                {discountPct > 0 && (
                  <span className="ml-1 text-[#16A34A] font-semibold">
                    {discountPct}% off
                  </span>
                )}
              </p>
            </div>
          );
        },
      },
      {
        key: 'stockQuantity',
        header: 'Stock',
        sortable: true,
        sortValue: (v) => v.stockQuantity,
        render: (v) => {
          const isOut = v.stockQuantity <= 0;
          const isLow = !isOut && v.stockQuantity <= v.lowStockThreshold;
          return (
            <div>
              <div className="flex items-center gap-1.5">
                <span
                  className={`font-bold ${
                    isOut
                      ? 'text-[#DC2626]'
                      : isLow
                      ? 'text-[#D97706]'
                      : 'text-[#1F2937]'
                  }`}
                >
                  {v.stockQuantity}
                </span>
                {(isOut || isLow) && (
                  <AlertTriangle
                    className={`w-3.5 h-3.5 ${isOut ? 'text-[#DC2626]' : 'text-[#D97706]'}`}
                  />
                )}
              </div>
              <p className="text-[10px] text-[#6B7280]">Alert ≤ {v.lowStockThreshold}</p>
            </div>
          );
        },
      },
    ],
    [categories, units]
  );

  const openAddModal = () => {
    const defaultVertical = activeVerticalFilter !== 'ALL' ? activeVerticalFilter : 'GROCERY';
    const firstCat = categories.find((c) => c.vertical === defaultVertical);
    setEditingVariant(null);
    setFormError(null);
    setForm({
      sku: '',
      name: '',
      sizeLabel: '',
      vertical: defaultVertical,
      categoryId: firstCat?.id || categories[0]?.id || '',
      productId: '',
      unitId: defaultVertical === 'FOOD' ? 'unit_plate' : 'unit_kg',
      unitQuantity: '1',
      mrpInr: '',
      sellingPriceInr: '',
      stockQuantity: '20',
      lowStockThreshold: '5',
      isActive: true,
    });
    setIsModalOpen(true);
  };

  const openEditModal = (v: VariantSizeMasterRecord) => {
    setEditingVariant(v);
    setFormError(null);
    setForm({
      sku: v.sku,
      name: v.name,
      sizeLabel: v.sizeLabel,
      vertical: v.vertical,
      categoryId: v.categoryId,
      productId: v.productId || '',
      unitId: v.unitId,
      unitQuantity: String(v.unitQuantity),
      mrpInr: (v.mrpPaise / 100).toFixed(2),
      sellingPriceInr: (v.sellingPricePaise / 100).toFixed(2),
      stockQuantity: String(v.stockQuantity),
      lowStockThreshold: String(v.lowStockThreshold),
      isActive: v.isActive,
    });
    setIsModalOpen(true);
  };

  const handleSave = () => {
    if (!form.name.trim() || !form.sizeLabel.trim() || !form.sku.trim()) {
      setFormError('Variant name, size/pack label, and unique SKU code are required.');
      return;
    }
    if (!form.categoryId || !form.unitId) {
      setFormError('Category and Measurement Unit must be selected.');
      return;
    }

    const mrpVal = Number(form.mrpInr);
    const sellVal = Number(form.sellingPriceInr);
    const qtyVal = Number(form.unitQuantity);
    const stockVal = Number(form.stockQuantity);
    const lowVal = Number(form.lowStockThreshold);

    if (Number.isNaN(mrpVal) || mrpVal <= 0 || Number.isNaN(sellVal) || sellVal <= 0) {
      setFormError('MRP and Selling Price must be positive INR amounts.');
      return;
    }
    if (sellVal > mrpVal) {
      setFormError('Selling price cannot exceed MRP.');
      return;
    }
    if (Number.isNaN(qtyVal) || qtyVal <= 0) {
      setFormError('Unit quantity must be greater than 0.');
      return;
    }
    if (Number.isNaN(stockVal) || stockVal < 0 || Number.isNaN(lowVal) || lowVal < 0) {
      setFormError('Stock quantity and low-stock threshold must be 0 or greater.');
      return;
    }

    const cleanSku = form.sku.trim().toUpperCase();
    const duplicateSku = variantMasters.find(
      (v) => v.sku.toUpperCase() === cleanSku && v.id !== editingVariant?.id
    );
    if (duplicateSku) {
      setFormError(`SKU "${cleanSku}" already exists in the Variant Master.`);
      return;
    }

    const payload: Omit<VariantSizeMasterRecord, 'id'> = {
      sku: cleanSku,
      name: form.name.trim(),
      sizeLabel: form.sizeLabel.trim(),
      vertical: form.vertical,
      categoryId: form.categoryId,
      productId: form.productId || undefined,
      unitId: form.unitId,
      unitQuantity: qtyVal,
      mrpPaise: Math.round(mrpVal * 100),
      sellingPricePaise: Math.round(sellVal * 100),
      stockQuantity: Math.floor(stockVal),
      lowStockThreshold: Math.floor(lowVal),
      attributes: editingVariant?.attributes,
      isActive: form.isActive,
    };

    if (editingVariant) {
      updateVariantMaster(editingVariant.id, payload);
      showFeedback(`Updated variant "${payload.name}".`);
    } else {
      addVariantMaster(payload);
      showFeedback(`Created variant "${payload.name}" (${payload.sku}).`);
    }
    setIsModalOpen(false);
  };

  const modalCategories = categories.filter((c) => c.vertical === form.vertical);
  const modalProducts = products.filter(
    (p) => p.vertical === form.vertical && (!form.categoryId || p.categoryId === form.categoryId)
  );

  return (
    <>
      <MasterPageShell
        icon={<Boxes className="w-5 h-5" />}
        title="Product Variant & Size Master"
        subtitle="Standardize pack sizes, food portions, SKUs, units, MRP vs selling prices, and stock thresholds across Food & Grocery categories."
        totalCount={variantMasters.length}
        activeCount={variantMasters.filter((v) => v.isActive).length}
        addButtonLabel="Add New Variant"
        onAddNew={openAddModal}
        canManage={canManage}
        feedback={feedback}
      >
        <MasterDataTable<VariantSizeMasterRecord>
          data={variantMasters}
          columns={columns}
          searchPlaceholder="Search SKU, variant name, size label..."
          searchMatcher={(v, q) =>
            v.name.toLowerCase().includes(q) ||
            v.sku.toLowerCase().includes(q) ||
            v.sizeLabel.toLowerCase().includes(q) ||
            getCategoryName(v.categoryId).toLowerCase().includes(q)
          }
          filters={tableFilters}
          onFilterStateChange={(state) => setActiveVerticalFilter(state.vertical || 'ALL')}
          actions={{
            canManage,
            getRowLabel: (v) => `${v.name} (${v.sku})`,
            onView: (v) => setViewingVariant(v),
            onEdit: (v) => openEditModal(v),
            onToggleStatus: (v) => {
              toggleVariantMasterStatus(v.id);
              showFeedback(
                `Variant "${v.name}" marked ${v.isActive ? 'Inactive' : 'Active'}.`
              );
            },
            onDelete: (v) => setDeleteTarget(v),
          }}
          emptyIcon={<Boxes className="w-6 h-6" />}
          emptyTitle="No variants or sizes found"
          emptyDescription="Create a new SKU variant with pack size, pricing, unit, and stock rules."
          emptyActionLabel={canManage ? 'Add New Variant' : undefined}
          onEmptyAction={canManage ? openAddModal : undefined}
        />
      </MasterPageShell>

      {/* View Detail Drawer */}
      <Drawer
        isOpen={!!viewingVariant}
        onClose={() => setViewingVariant(null)}
        title={viewingVariant ? viewingVariant.name : 'Variant Details'}
        subtitle={viewingVariant ? `SKU: ${viewingVariant.sku}` : undefined}
      >
        {viewingVariant && (
          <div className="space-y-5 text-xs text-left">
            <div className="p-4 bg-[#F8FAFC] rounded-xl border border-[#E5E7EB] grid grid-cols-2 gap-3">
              <div>
                <p className="text-[11px] text-[#6B7280]">Size / Pack Label</p>
                <p className="font-bold text-[#1F2937] mt-0.5">{viewingVariant.sizeLabel}</p>
              </div>
              <div>
                <p className="text-[11px] text-[#6B7280]">Measurement Unit</p>
                <p className="font-bold text-[#1F2937] mt-0.5">
                  {viewingVariant.unitQuantity} × {getUnitLabel(viewingVariant.unitId)}
                </p>
              </div>
              <div>
                <p className="text-[11px] text-[#6B7280]">Selling Price / MRP</p>
                <p className="font-black text-[#218838] mt-0.5">
                  {formatINR(viewingVariant.sellingPricePaise)}{' '}
                  <span className="text-[#6B7280] font-normal line-through">
                    {formatINR(viewingVariant.mrpPaise)}
                  </span>
                </p>
              </div>
              <div>
                <p className="text-[11px] text-[#6B7280]">Stock / Low Threshold</p>
                <p className="font-bold text-[#1F2937] mt-0.5">
                  {viewingVariant.stockQuantity} units (Alert ≤ {viewingVariant.lowStockThreshold})
                </p>
              </div>
              <div>
                <p className="text-[11px] text-[#6B7280]">Category</p>
                <p className="font-semibold text-[#1F2937] mt-0.5">
                  {getCategoryName(viewingVariant.categoryId)}
                </p>
              </div>
              <div>
                <p className="text-[11px] text-[#6B7280]">Linked Product</p>
                <p className="font-semibold text-[#1F2937] mt-0.5">
                  {getProductName(viewingVariant.productId) || 'Reusable Category Template'}
                </p>
              </div>
            </div>

            {viewingVariant.attributes && Object.keys(viewingVariant.attributes).length > 0 && (
              <div className="space-y-1.5">
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-[#6B7280]">
                  Variant Attribute Values
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {Object.entries(viewingVariant.attributes).map(([k, val]) => (
                    <Badge key={k} variant="info" size="sm">
                      {k}: {val}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Drawer>

      {/* Add / Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={
          editingVariant ? `Edit Variant: ${editingVariant.sku}` : 'Add Product Variant / Size'
        }
        size="lg"
        footer={
          <div className="flex items-center justify-end gap-2">
            <Button variant="secondary" size="sm" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleSave}>
              {editingVariant ? 'Save Changes' : 'Create Variant'}
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
              label="Variant / Display Name *"
              value={form.name}
              onChange={(e) => {
                setForm({ ...form, name: e.target.value });
                setFormError(null);
              }}
              placeholder="e.g., Shudh Chakki Atta 5 Kg"
            />
            <Input
              label="Size / Portion Label *"
              value={form.sizeLabel}
              onChange={(e) => {
                setForm({ ...form, sizeLabel: e.target.value });
                setFormError(null);
              }}
              placeholder="e.g., 5 kg Pack, Full Plate"
            />
            <Input
              label="Unique SKU Code *"
              value={form.sku}
              onChange={(e) => {
                setForm({ ...form, sku: e.target.value.toUpperCase() });
                setFormError(null);
              }}
              placeholder="e.g., GB-GROC-ATTA-5KG"
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
                Linked Product (Optional)
              </label>
              <select
                value={form.productId}
                onChange={(e) => setForm({ ...form, productId: e.target.value })}
                className="w-full h-10 px-3 bg-white border border-[#E5E7EB] rounded-xl text-xs font-semibold text-[#1F2937] outline-none focus:border-[#218838]"
              >
                <option value="">Reusable Category Variant</option>
                {modalProducts.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-[#1F2937] mb-1.5">
                Measurement Unit *
              </label>
              <select
                value={form.unitId}
                onChange={(e) => setForm({ ...form, unitId: e.target.value })}
                className="w-full h-10 px-3 bg-white border border-[#E5E7EB] rounded-xl text-xs font-semibold text-[#1F2937] outline-none focus:border-[#218838]"
              >
                {units.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.symbol})
                  </option>
                ))}
              </select>
            </div>
            <Input
              label="Unit Quantity *"
              type="number"
              min={0.1}
              step="any"
              value={form.unitQuantity}
              onChange={(e) => setForm({ ...form, unitQuantity: e.target.value })}
              placeholder="e.g., 1, 5, 250"
            />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
            <Input
              label="MRP (₹) *"
              type="number"
              min={1}
              step="0.50"
              value={form.mrpInr}
              onChange={(e) => {
                setForm({ ...form, mrpInr: e.target.value });
                setFormError(null);
              }}
              placeholder="e.g., 260"
            />
            <Input
              label="Selling Price (₹) *"
              type="number"
              min={1}
              step="0.50"
              value={form.sellingPriceInr}
              onChange={(e) => {
                setForm({ ...form, sellingPriceInr: e.target.value });
                setFormError(null);
              }}
              placeholder="e.g., 235"
            />
            <Input
              label="Stock Qty *"
              type="number"
              min={0}
              value={form.stockQuantity}
              onChange={(e) => setForm({ ...form, stockQuantity: e.target.value })}
            />
            <Input
              label="Low Stock Alert"
              type="number"
              min={0}
              value={form.lowStockThreshold}
              onChange={(e) => setForm({ ...form, lowStockThreshold: e.target.value })}
            />
          </div>

          <label className="inline-flex items-center gap-2 cursor-pointer pt-1">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
              className="rounded accent-[#218838]"
            />
            <span className="font-semibold text-[#1F2937]">Active Variant</span>
          </label>
        </div>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) {
            deleteVariantMaster(deleteTarget.id);
            showFeedback(`Deleted variant "${deleteTarget.name}".`);
            setDeleteTarget(null);
          }
        }}
        title="Delete Variant / Size?"
        message={
          deleteTarget
            ? `Delete SKU "${deleteTarget.sku}" (${deleteTarget.name}) from the Variant & Size Master?`
            : ''
        }
        confirmText="Delete Variant"
        isDestructive
      />
    </>
  );
};
