/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useState } from 'react';
import { PackageCheck, Leaf, Droplets, ShieldCheck, AlertCircle } from 'lucide-react';
import { useAdmin } from '../../../contexts/AdminContext';
import { PackagingMasterRecord, PackagingMaterialType } from '../../../types/admin';
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

const MATERIAL_TYPES: { value: PackagingMaterialType; label: string }[] = [
  { value: 'FOOD_CONTAINER', label: 'Food Container / Box' },
  { value: 'THERMAL_BOX', label: 'Thermal / Insulated Box' },
  { value: 'ECO_BAG', label: 'Eco Kraft / Cloth Carry Bag' },
  { value: 'SEALED_POUCH', label: 'Tamper-Sealed Pouch' },
  { value: 'BOTTLE_JAR', label: 'Bottle / Jar' },
  { value: 'CORRUGATED_CARTON', label: 'Corrugated Carton' },
];

export const PackagingMasterView: React.FC = () => {
  const {
    packagingMasters,
    verticalConfigs,
    categories,
    products,
    units,
    addPackagingMaster,
    updatePackagingMaster,
    togglePackagingMasterStatus,
    deletePackagingMaster,
    hasPermission,
  } = useAdmin();

  const canManage = hasPermission('MASTER_PACKAGING', 'manage');



  const [viewingPkg, setViewingPkg] = useState<PackagingMasterRecord | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPkg, setEditingPkg] = useState<PackagingMasterRecord | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<PackagingMasterRecord | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const [form, setForm] = useState({
    code: '',
    name: '',
    hindiName: '',
    materialType: 'FOOD_CONTAINER' as PackagingMaterialType,
    capacityLabel: '',
    unitId: '',
    feeInr: '10',
    isFoodGrade: true,
    isEcoFriendly: true,
    isLeakProof: false,
    verticals: ['FOOD'] as string[],
    categoryIds: [] as string[],
    productIds: [] as string[],
    isActive: true,
  });

  const showFeedback = (msg: string) => {
    setFeedback(msg);
    setTimeout(() => setFeedback(null), 3500);
  };

  const getMaterialLabel = (type: PackagingMaterialType) =>
    MATERIAL_TYPES.find((m) => m.value === type)?.label || type;

  const tableFilters = useMemo<MasterTableFilterConfig<PackagingMasterRecord>[]>(
    () => [
      {
        id: 'vertical',
        label: 'Filter by vertical',
        allLabel: 'All Verticals',
        options: verticalConfigs.map((v) => ({ value: v.id, label: v.name })),
        predicate: (pkg, val) => pkg.verticals.includes(val),
      },
      {
        id: 'material',
        label: 'Filter by material type',
        allLabel: 'All Material Types',
        options: MATERIAL_TYPES.map((m) => ({ value: m.value, label: m.label })),
        predicate: (pkg, val) => pkg.materialType === val,
      },
    ],
    [verticalConfigs]
  );

  const columns = useMemo<MasterTableColumn<PackagingMasterRecord>[]>(
    () => [
      {
        key: 'name',
        header: 'Packaging & Code',
        sortable: true,
        sortValue: (pkg) => pkg.name,
        render: (pkg) => (
          <div>
            <p className="font-bold text-[#1F2937]">{pkg.name}</p>
            <p className="text-[11px] text-[#6B7280]">
              <span className="font-mono">{pkg.code}</span>
              {pkg.hindiName ? ` • ${pkg.hindiName}` : ''}
            </p>
          </div>
        ),
      },
      {
        key: 'materialType',
        header: 'Type & Capacity',
        sortable: true,
        sortValue: (pkg) => getMaterialLabel(pkg.materialType),
        render: (pkg) => (
          <div>
            <Badge variant="neutral" size="sm">
              {getMaterialLabel(pkg.materialType)}
            </Badge>
            <p className="text-[11px] text-[#475569] mt-1">{pkg.capacityLabel}</p>
          </div>
        ),
      },
      {
        key: 'feePaise',
        header: 'Charge',
        sortable: true,
        sortValue: (pkg) => pkg.feePaise,
        cellClassName: 'font-black text-[#1F2937]',
        render: (pkg) => <>{pkg.feePaise > 0 ? formatINR(pkg.feePaise) : 'Free (₹0)'}</>,
      },
      {
        key: 'safety',
        header: 'Safety & Mapping',
        render: (pkg) => (
          <div className="space-y-1">
            <div className="flex flex-wrap gap-1">
              {pkg.verticals.map((v) => (
                <VerticalBadge key={v} vertical={v} />
              ))}
              {pkg.isEcoFriendly && (
                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-emerald-50 text-[#16A34A] text-[10px] font-semibold">
                  <Leaf className="w-2.5 h-2.5" /> Eco
                </span>
              )}
              {pkg.isLeakProof && (
                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-blue-50 text-[#2563EB] text-[10px] font-semibold">
                  <Droplets className="w-2.5 h-2.5" /> Leak-Proof
                </span>
              )}
            </div>
            <p className="text-[11px] text-[#6B7280]">
              {pkg.categoryIds.length} category(ies) • {pkg.productIds.length} product(s)
            </p>
          </div>
        ),
      },
    ],
    []
  );

  const openAddModal = () => {
    setEditingPkg(null);
    setFormError(null);
    setForm({
      code: '',
      name: '',
      hindiName: '',
      materialType: 'FOOD_CONTAINER',
      capacityLabel: '',
      unitId: '',
      feeInr: '10',
      isFoodGrade: true,
      isEcoFriendly: true,
      isLeakProof: true,
      verticals: ['FOOD'],
      categoryIds: [],
      productIds: [],
      isActive: true,
    });
    setIsModalOpen(true);
  };

  const openEditModal = (pkg: PackagingMasterRecord) => {
    setEditingPkg(pkg);
    setFormError(null);
    setForm({
      code: pkg.code,
      name: pkg.name,
      hindiName: pkg.hindiName || '',
      materialType: pkg.materialType,
      capacityLabel: pkg.capacityLabel,
      unitId: pkg.unitId || '',
      feeInr: (pkg.feePaise / 100).toFixed(2),
      isFoodGrade: pkg.isFoodGrade,
      isEcoFriendly: pkg.isEcoFriendly,
      isLeakProof: pkg.isLeakProof,
      verticals: pkg.verticals.length ? pkg.verticals : ['FOOD'],
      categoryIds: pkg.categoryIds || [],
      productIds: pkg.productIds || [],
      isActive: pkg.isActive,
    });
    setIsModalOpen(true);
  };

  const toggleInList = (list: string[], id: string) =>
    list.includes(id) ? list.filter((x) => x !== id) : [...list, id];

  const handleSave = () => {
    if (!form.name.trim() || !form.capacityLabel.trim()) {
      setFormError('Packaging name and capacity label (e.g., 500 ml, Up to 5 kg) are required.');
      return;
    }
    if (form.verticals.length === 0) {
      setFormError('Select at least one applicable vertical.');
      return;
    }
    const feeVal = Number(form.feeInr);
    if (Number.isNaN(feeVal) || feeVal < 0) {
      setFormError('Packaging charge must be 0 or a positive INR amount.');
      return;
    }

    const cleanCode =
      form.code.trim().toUpperCase() ||
      `PKG-${form.name.trim().replace(/[^A-Za-z0-9]/g, '').slice(0, 5).toUpperCase()}`;

    const duplicate = packagingMasters.find(
      (p) => p.code.toUpperCase() === cleanCode && p.id !== editingPkg?.id
    );
    if (duplicate) {
      setFormError(`Packaging code "${cleanCode}" already exists.`);
      return;
    }

    const payload: Omit<PackagingMasterRecord, 'id'> = {
      code: cleanCode,
      name: form.name.trim(),
      hindiName: form.hindiName.trim() || undefined,
      materialType: form.materialType,
      capacityLabel: form.capacityLabel.trim(),
      unitId: form.unitId || undefined,
      feePaise: Math.round(feeVal * 100),
      isFoodGrade: form.isFoodGrade,
      isEcoFriendly: form.isEcoFriendly,
      isLeakProof: form.isLeakProof,
      verticals: form.verticals,
      categoryIds: form.categoryIds,
      productIds: form.productIds,
      isActive: form.isActive,
    };

    if (editingPkg) {
      updatePackagingMaster(editingPkg.id, payload);
      showFeedback(`Updated packaging "${payload.name}".`);
    } else {
      addPackagingMaster(payload);
      showFeedback(`Created packaging "${payload.name}" (${payload.code}).`);
    }
    setIsModalOpen(false);
  };

  const eligibleCategories = categories.filter((c) => form.verticals.includes(c.vertical));
  const eligibleProducts = products.filter((p) => form.verticals.includes(p.vertical));

  return (
    <>
      <MasterPageShell
        icon={<PackageCheck className="w-5 h-5" />}
        title="Packaging Master"
        subtitle="Configure standardized food-grade containers, thermal pizza boxes, eco kirana bags, and tamper-sealed pouches mapped to categories and products."
        totalCount={packagingMasters.length}
        activeCount={packagingMasters.filter((p) => p.isActive).length}
        addButtonLabel="Add Packaging Type"
        onAddNew={openAddModal}
        canManage={canManage}
        feedback={feedback}
      >
        <MasterDataTable<PackagingMasterRecord>
          data={packagingMasters}
          columns={columns}
          searchPlaceholder="Search packaging name, code, capacity..."
          searchMatcher={(pkg, q) =>
            pkg.name.toLowerCase().includes(q) ||
            pkg.code.toLowerCase().includes(q) ||
            (pkg.hindiName || '').toLowerCase().includes(q) ||
            pkg.capacityLabel.toLowerCase().includes(q)
          }
          filters={tableFilters}
          actions={{
            canManage,
            getRowLabel: (pkg) => pkg.name,
            onView: (pkg) => setViewingPkg(pkg),
            onEdit: (pkg) => openEditModal(pkg),
            onToggleStatus: (pkg) => {
              togglePackagingMasterStatus(pkg.id);
              showFeedback(
                `Packaging "${pkg.name}" marked ${pkg.isActive ? 'Inactive' : 'Active'}.`
              );
            },
            onDelete: (pkg) => setDeleteTarget(pkg),
          }}
          emptyIcon={<PackageCheck className="w-6 h-6" />}
          emptyTitle="No packaging types found"
          emptyDescription="Define standardized Food & Grocery packaging containers, fees, and category/product mappings."
          emptyActionLabel={canManage ? 'Add Packaging Type' : undefined}
          onEmptyAction={canManage ? openAddModal : undefined}
        />
      </MasterPageShell>

      {/* View Detail Drawer */}
      <Drawer
        isOpen={!!viewingPkg}
        onClose={() => setViewingPkg(null)}
        title={viewingPkg ? viewingPkg.name : 'Packaging Details'}
        subtitle={viewingPkg ? `Code: ${viewingPkg.code}` : undefined}
      >
        {viewingPkg && (
          <div className="space-y-5 text-xs text-left">
            <div className="p-4 bg-[#F8FAFC] rounded-xl border border-[#E5E7EB] grid grid-cols-2 gap-3">
              <div>
                <p className="text-[11px] text-[#6B7280]">Material Type</p>
                <p className="font-bold text-[#1F2937] mt-0.5">
                  {getMaterialLabel(viewingPkg.materialType)}
                </p>
              </div>
              <div>
                <p className="text-[11px] text-[#6B7280]">Capacity</p>
                <p className="font-bold text-[#1F2937] mt-0.5">{viewingPkg.capacityLabel}</p>
              </div>
              <div>
                <p className="text-[11px] text-[#6B7280]">Standard Packaging Fee</p>
                <p className="font-black text-[#218838] mt-0.5">
                  {formatINR(viewingPkg.feePaise)}
                </p>
              </div>
              <div>
                <p className="text-[11px] text-[#6B7280]">Linked Unit</p>
                <p className="font-semibold text-[#1F2937] mt-0.5">
                  {units.find((u) => u.id === viewingPkg.unitId)?.name || 'General'}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {viewingPkg.isFoodGrade && (
                <Badge variant="success" size="sm">
                  <span className="inline-flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" /> Food-Grade Safe
                  </span>
                </Badge>
              )}
              {viewingPkg.isEcoFriendly && (
                <Badge variant="primary" size="sm">
                  <span className="inline-flex items-center gap-1">
                    <Leaf className="w-3 h-3" /> Eco-Friendly
                  </span>
                </Badge>
              )}
              {viewingPkg.isLeakProof && (
                <Badge variant="info" size="sm">
                  <span className="inline-flex items-center gap-1">
                    <Droplets className="w-3 h-3" /> Leak-Proof Seal
                  </span>
                </Badge>
              )}
            </div>

            <div className="space-y-1.5">
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-[#6B7280]">
                Mapped Categories ({viewingPkg.categoryIds.length})
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {viewingPkg.categoryIds.length > 0 ? (
                  viewingPkg.categoryIds.map((cid) => (
                    <Badge key={cid} variant="primary" size="sm">
                      {categories.find((c) => c.id === cid)?.name || cid}
                    </Badge>
                  ))
                ) : (
                  <p className="text-[#6B7280]">No specific categories mapped.</p>
                )}
              </div>
            </div>

            <div className="space-y-1.5">
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-[#6B7280]">
                Mapped Products ({viewingPkg.productIds.length})
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {viewingPkg.productIds.length > 0 ? (
                  viewingPkg.productIds.map((pid) => (
                    <Badge key={pid} variant="info" size="sm">
                      {products.find((p) => p.id === pid)?.name || pid}
                    </Badge>
                  ))
                ) : (
                  <p className="text-[#6B7280]">Applies dynamically by mapped categories.</p>
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
        title={editingPkg ? `Edit Packaging: ${editingPkg.code}` : 'Add Packaging Master'}
        size="lg"
        footer={
          <div className="flex items-center justify-end gap-2">
            <Button variant="secondary" size="sm" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleSave}>
              {editingPkg ? 'Save Changes' : 'Create Packaging'}
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
              label="Packaging Name *"
              value={form.name}
              onChange={(e) => {
                setForm({ ...form, name: e.target.value });
                setFormError(null);
              }}
              placeholder="e.g., 5-Compartment Thali Box"
            />
            <Input
              label="Hindi / Local Label"
              value={form.hindiName}
              onChange={(e) => setForm({ ...form, hindiName: e.target.value })}
              placeholder="e.g., थाली पैकिंग बॉक्स"
            />
            <Input
              label="Packaging Code"
              value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
              placeholder="auto if blank (PKG-...)"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-[#1F2937] mb-1.5">
                Material Type *
              </label>
              <select
                value={form.materialType}
                onChange={(e) =>
                  setForm({ ...form, materialType: e.target.value as PackagingMaterialType })
                }
                className="w-full h-10 px-3 bg-white border border-[#E5E7EB] rounded-xl text-xs font-semibold text-[#1F2937] outline-none focus:border-[#218838]"
              >
                {MATERIAL_TYPES.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>
            <Input
              label="Capacity Label *"
              value={form.capacityLabel}
              onChange={(e) => {
                setForm({ ...form, capacityLabel: e.target.value });
                setFormError(null);
              }}
              placeholder="e.g., 500 ml, Up to 5 kg"
            />
            <div>
              <label className="block text-xs font-semibold text-[#1F2937] mb-1.5">
                Reference Unit
              </label>
              <select
                value={form.unitId}
                onChange={(e) => setForm({ ...form, unitId: e.target.value })}
                className="w-full h-10 px-3 bg-white border border-[#E5E7EB] rounded-xl text-xs font-semibold text-[#1F2937] outline-none focus:border-[#218838]"
              >
                <option value="">General</option>
                {units.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.symbol})
                  </option>
                ))}
              </select>
            </div>
            <Input
              label="Standard Fee (₹) *"
              type="number"
              min={0}
              step="0.50"
              value={form.feeInr}
              onChange={(e) => setForm({ ...form, feeInr: e.target.value })}
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

          {/* Category Mapping */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-[#1F2937]">
              Map to Categories ({form.categoryIds.length} selected)
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

          {/* Product Mapping */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-[#1F2937]">
              Map to Specific Products (Optional — {form.productIds.length} selected)
            </label>
            <div className="flex flex-wrap gap-1.5 p-2.5 bg-[#F8FAFC] border border-[#E5E7EB] rounded-xl max-h-24 overflow-y-auto">
              {eligibleProducts.length > 0 ? (
                eligibleProducts.map((p) => {
                  const selected = form.productIds.includes(p.id);
                  return (
                    <button
                      type="button"
                      key={p.id}
                      onClick={() =>
                        setForm({ ...form, productIds: toggleInList(form.productIds, p.id) })
                      }
                      className={`px-2.5 py-1 rounded-full text-[11px] font-semibold cursor-pointer ${
                        selected
                          ? 'bg-[#218838] text-white'
                          : 'bg-white text-[#475569] border border-[#E5E7EB]'
                      }`}
                    >
                      {p.name}
                    </button>
                  );
                })
              ) : (
                <span className="text-[#6B7280]">No catalog items in selected vertical(s).</span>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-5 pt-1">
            <label className="inline-flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.isFoodGrade}
                onChange={(e) => setForm({ ...form, isFoodGrade: e.target.checked })}
                className="rounded accent-[#218838]"
              />
              <span className="font-semibold text-[#1F2937]">Food-Grade Safe</span>
            </label>
            <label className="inline-flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.isEcoFriendly}
                onChange={(e) => setForm({ ...form, isEcoFriendly: e.target.checked })}
                className="rounded accent-[#218838]"
              />
              <span className="font-semibold text-[#1F2937]">Eco-Friendly</span>
            </label>
            <label className="inline-flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.isLeakProof}
                onChange={(e) => setForm({ ...form, isLeakProof: e.target.checked })}
                className="rounded accent-[#218838]"
              />
              <span className="font-semibold text-[#1F2937]">Leak-Proof</span>
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
            deletePackagingMaster(deleteTarget.id);
            showFeedback(`Deleted packaging "${deleteTarget.name}".`);
            setDeleteTarget(null);
          }
        }}
        title="Delete Packaging Type?"
        message={
          deleteTarget
            ? `Delete "${deleteTarget.name}" (${deleteTarget.code})? Sellers will no longer be able to assign this packaging rule.`
            : ''
        }
        confirmText="Delete Packaging"
        isDestructive
      />
    </>
  );
};
