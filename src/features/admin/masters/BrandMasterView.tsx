/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useState } from 'react';
import { Award, ShieldCheck, AlertCircle } from 'lucide-react';
import { useAdmin } from '../../../contexts/AdminContext';
import { BrandMasterRecord } from '../../../types/admin';
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

export const BrandMasterView: React.FC = () => {
  const {
    brands,
    verticalConfigs,
    products,
    addBrand,
    updateBrand,
    toggleBrandVerified,
    toggleBrandStatus,
    deleteBrand,
    hasPermission,
  } = useAdmin();

  const canManage = hasPermission('MASTER_BRANDS', 'manage');



  const [viewingBrand, setViewingBrand] = useState<BrandMasterRecord | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBrand, setEditingBrand] = useState<BrandMasterRecord | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<BrandMasterRecord | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const [form, setForm] = useState({
    code: '',
    name: '',
    manufacturer: '',
    description: '',
    verticals: ['GROCERY'] as string[],
    isVerified: true,
    isActive: true,
  });

  const showFeedback = (msg: string) => {
    setFeedback(msg);
    setTimeout(() => setFeedback(null), 3500);
  };

  const getLinkedProductsCount = (brandId: string, fallback: number) => {
    const live = products.filter((p) => p.brandId === brandId).length;
    return Math.max(live, fallback);
  };

  const tableFilters = useMemo<MasterTableFilterConfig<BrandMasterRecord>[]>(
    () => [
      {
        id: 'vertical',
        label: 'Filter by vertical',
        allLabel: 'All Verticals',
        options: verticalConfigs.map((v) => ({ value: v.id, label: v.name })),
        predicate: (b, val) => b.verticals.includes(val),
      },
      {
        id: 'verified',
        label: 'Filter by verification',
        allLabel: 'All Verification',
        options: [
          { value: 'VERIFIED', label: 'Verified Only' },
          { value: 'UNVERIFIED', label: 'Unverified Only' },
        ],
        predicate: (b, val) => (val === 'VERIFIED' ? b.isVerified : !b.isVerified),
      },
    ],
    [verticalConfigs]
  );

  const columns = useMemo<MasterTableColumn<BrandMasterRecord>[]>(
    () => [
      {
        key: 'name',
        header: 'Brand & Code',
        sortable: true,
        sortValue: (b) => b.name,
        render: (brand) => (
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#E8F5E9] text-[#176B2C] font-black text-xs flex items-center justify-center shrink-0">
              {brand.name.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <p className="font-bold text-[#1F2937]">{brand.name}</p>
              <p className="font-mono text-[10px] text-[#6B7280]">{brand.code || brand.id}</p>
            </div>
          </div>
        ),
      },
      {
        key: 'manufacturer',
        header: 'Manufacturer',
        sortable: true,
        sortValue: (b) => b.manufacturer || 'Independent / Local',
        cellClassName: 'text-[#475569]',
        render: (brand) => <>{brand.manufacturer || 'Independent / Local'}</>,
      },
      {
        key: 'verticals',
        header: 'Verticals',
        render: (brand) => (
          <div className="flex flex-wrap gap-1">
            {brand.verticals.map((v) => (
              <VerticalBadge key={v} vertical={v} />
            ))}
          </div>
        ),
      },
      {
        key: 'verification',
        header: 'Verification',
        render: (brand) => (
          <button
            type="button"
            disabled={!canManage}
            onClick={() => {
              toggleBrandVerified(brand.id);
              showFeedback(
                `Brand "${brand.name}" verification ${brand.isVerified ? 'removed' : 'confirmed'}.`
              );
            }}
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold transition-colors ${
              brand.isVerified
                ? 'bg-emerald-50 text-[#16A34A] border border-emerald-200'
                : 'bg-amber-50 text-[#D97706] border border-amber-200'
            } ${canManage ? 'cursor-pointer hover:opacity-80' : 'cursor-default'}`}
          >
            <ShieldCheck className="w-3 h-3" />
            {brand.isVerified ? 'Verified' : 'Unverified'}
          </button>
        ),
      },
      {
        key: 'productCount',
        header: 'Catalog Items',
        sortable: true,
        sortValue: (b) => getLinkedProductsCount(b.id, b.productCount),
        cellClassName: 'font-bold text-[#1F2937]',
        render: (brand) => <>{getLinkedProductsCount(brand.id, brand.productCount)} SKUs</>,
      },
    ],
    [canManage, products]
  );

  const openAddModal = () => {
    setEditingBrand(null);
    setFormError(null);
    setForm({
      code: '',
      name: '',
      manufacturer: '',
      description: '',
      verticals: ['GROCERY'],
      isVerified: true,
      isActive: true,
    });
    setIsModalOpen(true);
  };

  const openEditModal = (brand: BrandMasterRecord) => {
    setEditingBrand(brand);
    setFormError(null);
    setForm({
      code: brand.code || '',
      name: brand.name,
      manufacturer: brand.manufacturer || '',
      description: brand.description || '',
      verticals: brand.verticals.length ? brand.verticals : ['GROCERY'],
      isVerified: brand.isVerified,
      isActive: brand.isActive,
    });
    setIsModalOpen(true);
  };

  const toggleVertical = (vId: string) => {
    setForm((prev) => ({
      ...prev,
      verticals: prev.verticals.includes(vId)
        ? prev.verticals.filter((v) => v !== vId)
        : [...prev.verticals, vId],
    }));
  };

  const handleSave = () => {
    if (!form.name.trim()) {
      setFormError('Brand name is required.');
      return;
    }
    if (form.verticals.length === 0) {
      setFormError('Select at least one vertical for this brand.');
      return;
    }

    const code =
      form.code.trim().toUpperCase() ||
      `BRD-${form.name.trim().replace(/[^A-Za-z0-9]/g, '').slice(0, 4).toUpperCase()}`;

    const duplicate = brands.find(
      (b) =>
        b.name.toLowerCase() === form.name.trim().toLowerCase() &&
        b.id !== editingBrand?.id
    );
    if (duplicate) {
      setFormError(`Brand "${form.name.trim()}" already exists.`);
      return;
    }

    const payload = {
      code,
      name: form.name.trim(),
      manufacturer: form.manufacturer.trim() || undefined,
      description: form.description.trim() || undefined,
      verticals: form.verticals,
      isVerified: form.isVerified,
      isActive: form.isActive,
    };

    if (editingBrand) {
      updateBrand(editingBrand.id, payload);
      showFeedback(`Updated brand "${payload.name}".`);
    } else {
      addBrand(payload);
      showFeedback(`Created brand "${payload.name}".`);
    }
    setIsModalOpen(false);
  };

  return (
    <>
      <MasterPageShell
        icon={<Award className="w-5 h-5" />}
        title="Brand Master"
        subtitle="Manage verified packaged FMCG, dairy, kirana, local artisan kitchen, and multi-vertical brands with verification governance."
        totalCount={brands.length}
        activeCount={brands.filter((b) => b.isActive).length}
        addButtonLabel="Add New Brand"
        onAddNew={openAddModal}
        canManage={canManage}
        feedback={feedback}
      >
        <MasterDataTable<BrandMasterRecord>
          data={brands}
          columns={columns}
          searchPlaceholder="Search brand, code, manufacturer..."
          searchMatcher={(b, q) =>
            b.name.toLowerCase().includes(q) ||
            (b.code || '').toLowerCase().includes(q) ||
            (b.manufacturer || '').toLowerCase().includes(q) ||
            (b.description || '').toLowerCase().includes(q)
          }
          filters={tableFilters}
          actions={{
            canManage,
            getRowLabel: (b) => b.name,
            onView: (b) => setViewingBrand(b),
            onEdit: (b) => openEditModal(b),
            onToggleStatus: (b) => {
              toggleBrandStatus(b.id);
              showFeedback(`Brand "${b.name}" marked ${b.isActive ? 'Inactive' : 'Active'}.`);
            },
            onDelete: (b) => setDeleteTarget(b),
          }}
          emptyIcon={<Award className="w-6 h-6" />}
          emptyTitle="No brands found"
          emptyDescription="Add verified packaged FMCG, dairy, or local brands to the catalog."
          emptyActionLabel={canManage ? 'Add New Brand' : undefined}
          onEmptyAction={canManage ? openAddModal : undefined}
        />
      </MasterPageShell>

      {/* View Detail Drawer */}
      <Drawer
        isOpen={!!viewingBrand}
        onClose={() => setViewingBrand(null)}
        title={viewingBrand ? viewingBrand.name : 'Brand Details'}
        subtitle={viewingBrand ? `Code: ${viewingBrand.code || viewingBrand.id}` : undefined}
      >
        {viewingBrand && (
          <div className="space-y-5 text-xs text-left">
            <div className="p-4 bg-[#F8FAFC] rounded-xl border border-[#E5E7EB] grid grid-cols-2 gap-3">
              <div>
                <p className="text-[11px] text-[#6B7280]">Manufacturer / Company</p>
                <p className="font-bold text-[#1F2937] mt-0.5">
                  {viewingBrand.manufacturer || 'Local / Independent'}
                </p>
              </div>
              <div>
                <p className="text-[11px] text-[#6B7280]">Verification Status</p>
                <div className="mt-1">
                  <Badge variant={viewingBrand.isVerified ? 'success' : 'warning'} size="sm">
                    {viewingBrand.isVerified ? 'Verified Brand' : 'Pending Verification'}
                  </Badge>
                </div>
              </div>
              <div>
                <p className="text-[11px] text-[#6B7280]">Status</p>
                <div className="mt-1">
                  <Badge variant={viewingBrand.isActive ? 'success' : 'neutral'} size="sm" dot>
                    {viewingBrand.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </div>
              <div>
                <p className="text-[11px] text-[#6B7280]">Mapped Products</p>
                <p className="font-bold text-[#1F2937] mt-0.5">
                  {getLinkedProductsCount(viewingBrand.id, viewingBrand.productCount)} SKUs
                </p>
              </div>
            </div>

            <div className="space-y-1.5">
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-[#6B7280]">
                Applicable Verticals
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {viewingBrand.verticals.map((v) => (
                  <VerticalBadge key={v} vertical={v} />
                ))}
              </div>
            </div>

            {viewingBrand.description && (
              <div className="space-y-1.5">
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-[#6B7280]">
                  Brand Description
                </h4>
                <p className="p-3 bg-white border border-[#E5E7EB] rounded-xl text-[#475569] leading-relaxed">
                  {viewingBrand.description}
                </p>
              </div>
            )}
          </div>
        )}
      </Drawer>

      {/* Add / Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingBrand ? `Edit Brand: ${editingBrand.name}` : 'Add New Brand'}
        size="md"
        footer={
          <div className="flex items-center justify-end gap-2">
            <Button variant="secondary" size="sm" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleSave}>
              {editingBrand ? 'Save Changes' : 'Create Brand'}
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
              label="Brand Name *"
              value={form.name}
              onChange={(e) => {
                setForm({ ...form, name: e.target.value });
                setFormError(null);
              }}
              placeholder="e.g., Amul, Haldiram's, Tata Sampann"
            />
            <Input
              label="Brand Code"
              value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
              placeholder="e.g., BRD-AMUL (auto if blank)"
            />
          </div>

          <Input
            label="Manufacturer / Parent Company"
            value={form.manufacturer}
            onChange={(e) => setForm({ ...form, manufacturer: e.target.value })}
            placeholder="e.g., ITC Foods Ltd. or Local Village Dairy"
          />

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-[#1F2937]">
              Supported Verticals *
            </label>
            <div className="flex flex-wrap gap-1.5 p-3 bg-[#F8FAFC] border border-[#E5E7EB] rounded-xl">
              {verticalConfigs.map((v) => {
                const selected = form.verticals.includes(v.id);
                return (
                  <button
                    type="button"
                    key={v.id}
                    onClick={() => toggleVertical(v.id)}
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

          <div>
            <label className="block text-xs font-semibold text-[#1F2937] mb-1.5">
              Description
            </label>
            <textarea
              rows={2}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Short summary of product lines offered under this brand..."
              className="w-full p-3 bg-[#F8FAFC] border border-[#E5E7EB] rounded-xl text-xs text-[#1F2937] outline-none focus:border-[#218838]"
            />
          </div>

          <div className="flex flex-wrap items-center gap-5 pt-1">
            <label className="inline-flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.isVerified}
                onChange={(e) => setForm({ ...form, isVerified: e.target.checked })}
                className="rounded accent-[#218838]"
              />
              <span className="font-semibold text-[#1F2937]">Verified Authentic Brand</span>
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
            deleteBrand(deleteTarget.id);
            showFeedback(`Deleted brand "${deleteTarget.name}".`);
            setDeleteTarget(null);
          }
        }}
        title="Delete Brand?"
        message={
          deleteTarget
            ? `Are you sure you want to delete "${deleteTarget.name}" from the Brand Master? Existing products referencing this brand will retain their brand ID until updated.`
            : ''
        }
        confirmText="Delete Brand"
        isDestructive
      />
    </>
  );
};
