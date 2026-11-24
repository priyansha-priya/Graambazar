/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useState } from 'react';
import { Scale, ArrowRightLeft, AlertCircle } from 'lucide-react';
import { useAdmin } from '../../../contexts/AdminContext';
import { UnitFamily, UnitMasterRecord } from '../../../types/admin';
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

const UNIT_FAMILIES: { value: UnitFamily; label: string; defaultBase: string }[] = [
  { value: 'WEIGHT', label: 'Weight (g, kg, pav)', defaultBase: 'g' },
  { value: 'VOLUME', label: 'Volume (ml, L)', defaultBase: 'ml' },
  { value: 'PORTION', label: 'Food Portion (plate, half, bowl)', defaultBase: 'portion' },
  { value: 'COUNT', label: 'Count (pcs, dozen, pack)', defaultBase: 'pcs' },
  { value: 'BULK_PACK', label: 'Bulk Pack (bori, sack, crate)', defaultBase: 'kg' },
  { value: 'LENGTH', label: 'Length (ft, meter, inch)', defaultBase: 'ft' },
  { value: 'AREA', label: 'Area (sq ft, sq m)', defaultBase: 'sqft' },
];

export const UnitMeasurementMasterView: React.FC = () => {
  const {
    units,
    verticalConfigs,
    addUnit,
    updateUnit,
    toggleUnitStatus,
    deleteUnit,
    hasPermission,
  } = useAdmin();

  const canManage = hasPermission('MASTER_UNITS', 'manage');



  const [viewingUnit, setViewingUnit] = useState<UnitMasterRecord | null>(null);
  const [convQty, setConvQty] = useState('2');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUnit, setEditingUnit] = useState<UnitMasterRecord | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<UnitMasterRecord | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: '',
    hindiName: '',
    symbol: '',
    family: 'WEIGHT' as UnitFamily,
    baseUnit: 'g',
    conversionFactor: '1',
    allowDecimal: false,
    allowSellerLocalOverride: false,
    verticals: ['GROCERY', 'FOOD'] as string[],
    isActive: true,
  });

  const showFeedback = (msg: string) => {
    setFeedback(msg);
    setTimeout(() => setFeedback(null), 3500);
  };

  const tableFilters = useMemo<MasterTableFilterConfig<UnitMasterRecord>[]>(
    () => [
      {
        id: 'family',
        label: 'Filter by measurement family',
        allLabel: 'All Families',
        options: UNIT_FAMILIES.map((f) => ({
          value: f.value,
          label: f.value.replace(/_/g, ' '),
        })),
        predicate: (u, val) => u.family === val,
      },
      {
        id: 'vertical',
        label: 'Filter by vertical',
        allLabel: 'All Verticals',
        options: verticalConfigs.map((v) => ({ value: v.id, label: v.name })),
        predicate: (u, val) => u.verticals.includes(val) || u.verticals.includes('ALL'),
      },
    ],
    [verticalConfigs]
  );

  const columns = useMemo<MasterTableColumn<UnitMasterRecord>[]>(
    () => [
      {
        key: 'name',
        header: 'Unit & Symbol',
        sortable: true,
        sortValue: (u) => u.name,
        render: (unit) => (
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-lg bg-[#E8F5E9] text-[#176B2C] font-mono font-bold text-[11px]">
              {unit.symbol}
            </span>
            <div>
              <p className="font-bold text-[#1F2937]">{unit.name}</p>
              <p className="text-[11px] text-[#6B7280]">{unit.hindiName}</p>
            </div>
          </div>
        ),
      },
      {
        key: 'family',
        header: 'Family',
        sortable: true,
        sortValue: (u) => u.family,
        render: (unit) => (
          <Badge variant="neutral" size="sm">
            {unit.family.replace(/_/g, ' ')}
          </Badge>
        ),
      },
      {
        key: 'conversion',
        header: 'Base Conversion',
        cellClassName: 'font-mono text-[11px] text-[#1F2937]',
        render: (unit) =>
          unit.baseUnit && unit.conversionFactor ? (
            <span className="font-semibold">
              1 {unit.symbol} = {unit.conversionFactor} {unit.baseUnit}
            </span>
          ) : (
            <span className="text-[#6B7280]">Discrete / Portion</span>
          ),
      },
      {
        key: 'rules',
        header: 'Rules',
        cellClassName: 'text-[11px] text-[#475569] space-y-0.5',
        render: (unit) => (
          <>
            <div>{unit.allowDecimal ? 'Decimals allowed' : 'Whole numbers only'}</div>
            {unit.allowSellerLocalOverride && (
              <span className="text-[10px] font-semibold text-[#218838]">
                Local seller label enabled
              </span>
            )}
          </>
        ),
      },
      {
        key: 'verticals',
        header: 'Verticals',
        render: (unit) => (
          <div className="flex flex-wrap gap-1">
            {unit.verticals.map((v) => (
              <VerticalBadge key={v} vertical={v} />
            ))}
          </div>
        ),
      },
    ],
    []
  );

  const openAddModal = () => {
    setEditingUnit(null);
    setFormError(null);
    setForm({
      name: '',
      hindiName: '',
      symbol: '',
      family: 'WEIGHT',
      baseUnit: 'g',
      conversionFactor: '250',
      allowDecimal: false,
      allowSellerLocalOverride: true,
      verticals: ['GROCERY', 'FOOD'],
      isActive: true,
    });
    setIsModalOpen(true);
  };

  const openEditModal = (unit: UnitMasterRecord) => {
    setEditingUnit(unit);
    setFormError(null);
    setForm({
      name: unit.name,
      hindiName: unit.hindiName,
      symbol: unit.symbol,
      family: unit.family,
      baseUnit: unit.baseUnit || '',
      conversionFactor: unit.conversionFactor ? String(unit.conversionFactor) : '',
      allowDecimal: unit.allowDecimal,
      allowSellerLocalOverride: unit.allowSellerLocalOverride,
      verticals: unit.verticals.length ? unit.verticals : ['GROCERY'],
      isActive: unit.isActive,
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
    if (!form.name.trim() || !form.symbol.trim()) {
      setFormError('Unit name and short symbol (e.g., kg, pav, plate) are required.');
      return;
    }
    if (!form.hindiName.trim()) {
      setFormError('Hindi / rural display label is required.');
      return;
    }
    if (form.verticals.length === 0) {
      setFormError('Select at least one applicable vertical.');
      return;
    }

    const parsedFactor = form.conversionFactor.trim()
      ? Number(form.conversionFactor)
      : undefined;
    if (parsedFactor !== undefined && (Number.isNaN(parsedFactor) || parsedFactor <= 0)) {
      setFormError('Conversion factor must be a positive number.');
      return;
    }

    const payload: Omit<UnitMasterRecord, 'id'> = {
      name: form.name.trim(),
      hindiName: form.hindiName.trim(),
      symbol: form.symbol.trim(),
      family: form.family,
      baseUnit: form.baseUnit.trim() || undefined,
      conversionFactor: parsedFactor,
      allowDecimal: form.allowDecimal,
      allowSellerLocalOverride: form.allowSellerLocalOverride,
      verticals: form.verticals,
      isActive: form.isActive,
    };

    if (editingUnit) {
      updateUnit(editingUnit.id, payload);
      showFeedback(`Updated unit "${payload.name} (${payload.symbol})".`);
    } else {
      addUnit(payload);
      showFeedback(`Created measurement unit "${payload.name} (${payload.symbol})".`);
    }
    setIsModalOpen(false);
  };

  // Compatible units in the same family for live conversion preview
  const getCompatibleConversions = (unit: UnitMasterRecord, qty: number) => {
    if (!unit.baseUnit || !unit.conversionFactor) return [];
    return units.filter(
      (other) =>
        other.id !== unit.id &&
        other.family === unit.family &&
        other.baseUnit === unit.baseUnit &&
        other.conversionFactor
    ).map((other) => ({
      other,
      convertedValue: (qty * unit.conversionFactor!) / other.conversionFactor!,
    }));
  };

  return (
    <>
      <MasterPageShell
        icon={<Scale className="w-5 h-5" />}
        title="Unit & Measurement Master"
        subtitle="Configure standardized and rural local units (kg, g, Pav, Litre, Full Plate, Half Plate, Bori) with compatible base unit conversion rules."
        totalCount={units.length}
        activeCount={units.filter((u) => u.isActive).length}
        addButtonLabel="Add New Unit"
        onAddNew={openAddModal}
        canManage={canManage}
        feedback={feedback}
      >
        <MasterDataTable<UnitMasterRecord>
          data={units}
          columns={columns}
          searchPlaceholder="Search unit, symbol, Hindi label..."
          searchMatcher={(u, q) =>
            u.name.toLowerCase().includes(q) ||
            u.hindiName.toLowerCase().includes(q) ||
            u.symbol.toLowerCase().includes(q) ||
            (u.baseUnit || '').toLowerCase().includes(q)
          }
          filters={tableFilters}
          actions={{
            canManage,
            getRowLabel: (u) => `${u.name} (${u.symbol})`,
            onView: (unit) => {
              setViewingUnit(unit);
              setConvQty('2');
            },
            onEdit: (unit) => openEditModal(unit),
            onToggleStatus: (unit) => {
              toggleUnitStatus(unit.id);
              showFeedback(
                `Unit "${unit.name}" marked ${unit.isActive ? 'Inactive' : 'Active'}.`
              );
            },
            onDelete: (unit) => setDeleteTarget(unit),
          }}
          emptyIcon={<Scale className="w-6 h-6" />}
          emptyTitle="No measurement units found"
          emptyDescription="Create standard or local rural measurement units with conversion rules."
          emptyActionLabel={canManage ? 'Add New Unit' : undefined}
          onEmptyAction={canManage ? openAddModal : undefined}
        />
      </MasterPageShell>

      {/* View Detail Drawer with Live Conversion Calculator */}
      <Drawer
        isOpen={!!viewingUnit}
        onClose={() => setViewingUnit(null)}
        title={viewingUnit ? `${viewingUnit.name} (${viewingUnit.symbol})` : 'Unit Details'}
        subtitle={viewingUnit ? viewingUnit.hindiName : undefined}
      >
        {viewingUnit && (
          <div className="space-y-5 text-xs text-left">
            <div className="p-4 bg-[#F8FAFC] rounded-xl border border-[#E5E7EB] grid grid-cols-2 gap-3">
              <div>
                <p className="text-[11px] text-[#6B7280]">Measurement Family</p>
                <p className="font-bold text-[#1F2937] mt-0.5">
                  {viewingUnit.family.replace(/_/g, ' ')}
                </p>
              </div>
              <div>
                <p className="text-[11px] text-[#6B7280]">Base Equivalence</p>
                <p className="font-mono font-bold text-[#218838] mt-0.5">
                  {viewingUnit.baseUnit && viewingUnit.conversionFactor
                    ? `1 ${viewingUnit.symbol} = ${viewingUnit.conversionFactor} ${viewingUnit.baseUnit}`
                    : 'Discrete Unit'}
                </p>
              </div>
              <div>
                <p className="text-[11px] text-[#6B7280]">Decimal Quantities</p>
                <p className="font-semibold text-[#1F2937] mt-0.5">
                  {viewingUnit.allowDecimal ? 'Permitted (e.g., 1.5)' : 'Integer Only'}
                </p>
              </div>
              <div>
                <p className="text-[11px] text-[#6B7280]">Local Rural Override</p>
                <p className="font-semibold text-[#1F2937] mt-0.5">
                  {viewingUnit.allowSellerLocalOverride ? 'Enabled' : 'Standard Only'}
                </p>
              </div>
            </div>

            {viewingUnit.baseUnit && viewingUnit.conversionFactor && (
              <div className="p-4 bg-emerald-50/60 border border-emerald-200 rounded-xl space-y-3">
                <div className="flex items-center gap-2 font-bold text-[#176B2C]">
                  <ArrowRightLeft className="w-4 h-4" />
                  <span>Compatible Measurement Conversion Preview</span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0.1"
                    step="0.5"
                    value={convQty}
                    onChange={(e) => setConvQty(e.target.value)}
                    className="w-24 h-9 px-3 bg-white border border-emerald-200 rounded-lg font-bold text-[#1F2937]"
                  />
                  <span className="font-bold text-[#1F2937]">{viewingUnit.symbol}</span>
                  <span className="text-[#6B7280]">=</span>
                  <span className="font-mono font-bold text-[#218838]">
                    {((Number(convQty) || 0) * viewingUnit.conversionFactor).toLocaleString('en-IN')}{' '}
                    {viewingUnit.baseUnit}
                  </span>
                </div>

                {getCompatibleConversions(viewingUnit, Number(convQty) || 0).length > 0 && (
                  <div className="pt-2 border-t border-emerald-200/70 space-y-1">
                    {getCompatibleConversions(viewingUnit, Number(convQty) || 0).map(
                      ({ other, convertedValue }) => (
                        <div key={other.id} className="flex justify-between text-[11px]">
                          <span className="text-[#475569]">{other.name}:</span>
                          <span className="font-mono font-bold text-[#1F2937]">
                            {Number.isInteger(convertedValue)
                              ? convertedValue
                              : convertedValue.toFixed(3)}{' '}
                            {other.symbol}
                          </span>
                        </div>
                      )
                    )}
                  </div>
                )}
              </div>
            )}

            <div className="space-y-1.5">
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-[#6B7280]">
                Applicable Verticals
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {viewingUnit.verticals.map((v) => (
                  <VerticalBadge key={v} vertical={v} />
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
        title={editingUnit ? `Edit Unit: ${editingUnit.name}` : 'Add Measurement Unit'}
        size="lg"
        footer={
          <div className="flex items-center justify-end gap-2">
            <Button variant="secondary" size="sm" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleSave}>
              {editingUnit ? 'Save Changes' : 'Create Unit'}
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
              label="Unit Name *"
              value={form.name}
              onChange={(e) => {
                setForm({ ...form, name: e.target.value });
                setFormError(null);
              }}
              placeholder="e.g., Pav (250g) or Dozen"
            />
            <Input
              label="Hindi / Local Label *"
              value={form.hindiName}
              onChange={(e) => {
                setForm({ ...form, hindiName: e.target.value });
                setFormError(null);
              }}
              placeholder="e.g., पाव (250 ग्राम)"
            />
            <Input
              label="Short Symbol *"
              value={form.symbol}
              onChange={(e) => {
                setForm({ ...form, symbol: e.target.value });
                setFormError(null);
              }}
              placeholder="e.g., pav, kg, plate"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-[#1F2937] mb-1.5">
                Measurement Family *
              </label>
              <select
                value={form.family}
                onChange={(e) => {
                  const fam = e.target.value as UnitFamily;
                  const meta = UNIT_FAMILIES.find((f) => f.value === fam);
                  setForm({
                    ...form,
                    family: fam,
                    baseUnit: meta?.defaultBase || '',
                  });
                }}
                className="w-full h-10 px-3 bg-white border border-[#E5E7EB] rounded-xl text-xs font-semibold text-[#1F2937] outline-none focus:border-[#218838]"
              >
                {UNIT_FAMILIES.map((f) => (
                  <option key={f.value} value={f.value}>
                    {f.label}
                  </option>
                ))}
              </select>
            </div>

            <Input
              label="Base Unit Symbol"
              value={form.baseUnit}
              onChange={(e) => setForm({ ...form, baseUnit: e.target.value })}
              placeholder="e.g., g, ml, pcs"
            />

            <Input
              label="Conversion Factor to Base"
              type="number"
              min={0.01}
              step="any"
              value={form.conversionFactor}
              onChange={(e) => setForm({ ...form, conversionFactor: e.target.value })}
              placeholder="e.g., 250 (1 pav = 250 g)"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-[#1F2937]">
              Applicable Verticals *
            </label>
            <div className="flex flex-wrap gap-1.5 p-3 bg-[#F8FAFC] border border-[#E5E7EB] rounded-xl">
              {[{ id: 'ALL', name: 'All Verticals' }, ...verticalConfigs].map((v) => {
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

          <div className="flex flex-wrap items-center gap-5 pt-1">
            <label className="inline-flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.allowDecimal}
                onChange={(e) => setForm({ ...form, allowDecimal: e.target.checked })}
                className="rounded accent-[#218838]"
              />
              <span className="font-semibold text-[#1F2937]">Allow Decimal Quantities</span>
            </label>

            <label className="inline-flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.allowSellerLocalOverride}
                onChange={(e) =>
                  setForm({ ...form, allowSellerLocalOverride: e.target.checked })
                }
                className="rounded accent-[#218838]"
              />
              <span className="font-semibold text-[#1F2937]">Allow Seller Local Alias</span>
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
            deleteUnit(deleteTarget.id);
            showFeedback(`Deleted unit "${deleteTarget.name}".`);
            setDeleteTarget(null);
          }
        }}
        title="Delete Measurement Unit?"
        message={
          deleteTarget
            ? `Delete "${deleteTarget.name} (${deleteTarget.symbol})"? Ensure no active categories or variant templates strictly depend on this unit.`
            : ''
        }
        confirmText="Delete Unit"
        isDestructive
      />
    </>
  );
};
