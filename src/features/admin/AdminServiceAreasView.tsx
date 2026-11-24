/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useState } from 'react';
import {
  MapPin,
  Plus,
  Power,
  Edit2,
  Navigation,
  Search,
  Trash2,
  CheckCircle2,
} from 'lucide-react';
import { useAdmin } from '../../contexts/AdminContext';
import { VillageServiceAreaRecord } from '../../types/admin';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { EmptyState } from '../../components/feedback/EmptyState';
import { formatINR, rupeesToPaise } from '../../utils/currency';

export const AdminServiceAreasView: React.FC = () => {
  const {
    serviceAreas,
    sellers,
    toggleServiceAreaStatus,
    addServiceArea,
    updateServiceArea,
    interVillageRoutes,
    addInterVillageRoute,
    deleteInterVillageRoute,
    hasPermission,
  } = useAdmin();

  const canManage = hasPermission('SERVICE_AREAS', 'manage');
  const [searchQuery, setSearchQuery] = useState('');
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Village Add / Edit Modal
  const [villageModalOpen, setVillageModalOpen] = useState(false);
  const [editingVillage, setEditingVillage] = useState<VillageServiceAreaRecord | null>(null);
  const [villageError, setVillageError] = useState('');
  const [vForm, setVForm] = useState({
    name: '',
    postalCode: '',
    district: 'Unnao',
    state: 'Uttar Pradesh',
    baseFeeRupees: '15',
    minOrderRupees: '400',
    landmarksCsv: 'Main Chowk, Primary School, Panchayat Bhawan',
  });

  // Inter-Village Route Modal
  const [routeModalOpen, setRouteModalOpen] = useState(false);
  const [routeError, setRouteError] = useState('');
  const [rForm, setRForm] = useState({
    fromVillageId: serviceAreas[0]?.id || '',
    toVillageId: serviceAreas[1]?.id || '',
    distanceKm: '3.5',
    surchargeRs: '15',
  });

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const filteredAreas = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return serviceAreas.filter(
      (a) =>
        !q ||
        a.name.toLowerCase().includes(q) ||
        a.postalCode.includes(q) ||
        a.district.toLowerCase().includes(q) ||
        (a.landmarks || []).some((l) => l.toLowerCase().includes(q))
    );
  }, [serviceAreas, searchQuery]);

  const openVillageModal = (area?: VillageServiceAreaRecord) => {
    setVillageError('');
    if (area) {
      setEditingVillage(area);
      setVForm({
        name: area.name,
        postalCode: area.postalCode,
        district: area.district,
        state: area.state,
        baseFeeRupees: (area.baseDeliveryFeePaise / 100).toString(),
        minOrderRupees: (area.minOrderFreeDeliveryPaise / 100).toString(),
        landmarksCsv: (area.landmarks || []).join(', '),
      });
    } else {
      setEditingVillage(null);
      setVForm({
        name: '',
        postalCode: '',
        district: 'Unnao',
        state: 'Uttar Pradesh',
        baseFeeRupees: '15',
        minOrderRupees: '400',
        landmarksCsv: 'Main Chowk, Primary School, Bus Stand',
      });
    }
    setVillageModalOpen(true);
  };

  const handleSaveVillage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!vForm.name.trim() || !vForm.postalCode.trim()) {
      setVillageError('Village name and postal PIN code are required.');
      return;
    }

    const landmarks = vForm.landmarksCsv
      .split(',')
      .map((l) => l.trim())
      .filter(Boolean);

    const payload = {
      name: vForm.name.trim(),
      postalCode: vForm.postalCode.trim(),
      district: vForm.district.trim(),
      state: vForm.state.trim(),
      isActive: editingVillage ? editingVillage.isActive : true,
      baseDeliveryFeePaise: rupeesToPaise(parseFloat(vForm.baseFeeRupees) || 15),
      minOrderFreeDeliveryPaise: rupeesToPaise(parseFloat(vForm.minOrderRupees) || 400),
      landmarks,
    };

    if (editingVillage) {
      updateServiceArea(editingVillage.id, payload);
      showToast(`Updated village "${payload.name}" and ${landmarks.length} landmarks.`);
    } else {
      addServiceArea(payload);
      showToast(`Added village "${payload.name}" to service matrix.`);
    }
    setVillageModalOpen(false);
  };

  const handleAddRoute = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rForm.fromVillageId || !rForm.toVillageId || rForm.fromVillageId === rForm.toVillageId) {
      setRouteError('Choose two different villages for an inter-village route.');
      return;
    }
    const fromV = serviceAreas.find((v) => v.id === rForm.fromVillageId);
    const toV = serviceAreas.find((v) => v.id === rForm.toVillageId);
    if (!fromV || !toV) return;

    addInterVillageRoute({
      fromVillageId: fromV.id,
      fromVillageName: fromV.name,
      toVillageId: toV.id,
      toVillageName: toV.name,
      distanceKm: parseFloat(rForm.distanceKm) || 3.5,
      surchargePaise: rupeesToPaise(parseFloat(rForm.surchargeRs) || 15),
      isActive: true,
    });
    showToast(`Added inter-village route ${fromV.name} ↔ ${toV.name}`);
    setRouteModalOpen(false);
    setRouteError('');
  };

  return (
    <div className="space-y-6 animate-fade-in text-left">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <h1 className="text-xl font-black text-[#1F2937]">Villages, Landmarks & Neighbor Matrix</h1>
            <Badge variant="primary">{serviceAreas.length} Villages</Badge>
          </div>
          <p className="text-xs text-[#6B7280]">
            Manage serviceable villages, delivery landmarks/hamlets, local fees, and cross-village neighbor routing surcharges.
          </p>
        </div>

        {canManage && (
          <Button
            variant="primary"
            size="sm"
            onClick={() => openVillageModal()}
            leftIcon={<Plus className="w-3.5 h-3.5" />}
          >
            Add Village
          </Button>
        )}
      </div>

      {toastMsg && (
        <div className="bg-[#E8F5E9] border border-[#218838]/30 text-[#176B2C] px-4 py-3 rounded-xl text-sm font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Search Bar */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] p-4 shadow-xs">
        <div className="relative">
          <Search className="w-4 h-4 text-[#6B7280] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search village name, PIN code, district, or landmark..."
            className="w-full h-10 pl-10 pr-4 text-sm bg-[#F8FAFC] border border-[#E5E7EB] rounded-xl focus:outline-none focus:border-[#218838] focus:bg-white"
          />
        </div>
      </div>

      {/* Villages Table */}
      {filteredAreas.length === 0 ? (
        <EmptyState
          icon={<MapPin className="w-7 h-7" />}
          title="No villages found"
          description="Register a new village service area with delivery fees and key local landmarks."
          actionText={canManage ? 'Add Village' : undefined}
          onAction={canManage ? () => openVillageModal() : undefined}
        />
      ) : (
        <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-[#F8FAFC] text-[#6B7280] uppercase tracking-wider font-semibold border-b border-[#E5E7EB]">
                <tr>
                  <th className="py-3.5 px-4">Village & District</th>
                  <th className="py-3.5 px-4">PIN Code</th>
                  <th className="py-3.5 px-4">Landmarks / Hamlets</th>
                  <th className="py-3.5 px-4">Active Stores</th>
                  <th className="py-3.5 px-4">Delivery Tariff</th>
                  <th className="py-3.5 px-4">Status</th>
                  {canManage && <th className="py-3.5 px-4 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E7EB]">
                {filteredAreas.map((area) => {
                  const storeCount = sellers.filter((s) => s.villageId === area.id && s.status === 'ACTIVE').length;
                  return (
                    <tr key={area.id} className="hover:bg-[#F8FAFC]/80 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-[#218838] shrink-0" />
                          <div>
                            <p className="font-bold text-[#1F2937]">{area.name}</p>
                            <p className="text-[11px] text-[#6B7280]">
                              {area.district}, {area.state}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-mono font-semibold text-[#1F2937]">{area.postalCode}</td>
                      <td className="py-3.5 px-4">
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {(area.landmarks || []).slice(0, 3).map((lm) => (
                            <span key={lm} className="text-[10px] bg-[#F1F5F9] text-[#475569] px-2 py-0.5 rounded-md">
                              {lm}
                            </span>
                          ))}
                          {(area.landmarks?.length || 0) > 3 && (
                            <span className="text-[10px] text-[#6B7280] font-semibold">
                              +{(area.landmarks?.length || 0) - 3}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-[#1F2937]">{storeCount} shops</td>
                      <td className="py-3.5 px-4">
                        <p className="font-bold text-[#1F2937]">{formatINR(area.baseDeliveryFeePaise)}</p>
                        <p className="text-[11px] text-[#6B7280]">Free ≥ {formatINR(area.minOrderFreeDeliveryPaise)}</p>
                      </td>
                      <td className="py-3.5 px-4">
                        <Badge variant={area.isActive ? 'success' : 'neutral'} size="sm" dot>
                          {area.isActive ? 'Serviceable' : 'Suspended'}
                        </Badge>
                      </td>
                      {canManage && (
                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <div className="inline-flex items-center gap-1.5">
                            <Button variant="ghost" size="sm" onClick={() => openVillageModal(area)}>
                              <Edit2 className="w-3.5 h-3.5" />
                            </Button>
                            <button
                              onClick={() => toggleServiceAreaStatus(area.id)}
                              className={`p-2 rounded-full cursor-pointer transition-colors ${
                                area.isActive
                                  ? 'bg-emerald-50 text-[#16A34A] hover:bg-emerald-100'
                                  : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                              }`}
                              title={area.isActive ? 'Suspend Area' : 'Activate Area'}
                            >
                              <Power className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Editable Inter-Village Matrix */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Navigation className="w-4 h-4 text-[#218838]" />
              <h3 className="text-sm font-bold text-[#1F2937]">Neighboring Inter-Village Matrix & Surcharges</h3>
            </div>
            <p className="text-xs text-[#6B7280] mt-0.5">
              Configure cross-village runner distances and flat surcharges when sellers deliver to neighboring villages.
            </p>
          </div>
          {canManage && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setRouteError('');
                setRouteModalOpen(true);
              }}
              leftIcon={<Plus className="w-3.5 h-3.5" />}
            >
              Add Neighbor Route
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
          {interVillageRoutes.map((route) => (
            <div
              key={route.id}
              className="p-3.5 bg-[#F8FAFC] rounded-xl border border-[#E5E7EB] flex items-center justify-between gap-2"
            >
              <div>
                <p className="font-bold text-[#1F2937]">
                  {route.fromVillageName} ↔ {route.toVillageName}
                </p>
                <p className="text-[11px] text-[#6B7280] mt-0.5">
                  {route.distanceKm} km • <strong>{formatINR(route.surchargePaise)}</strong> surcharge
                </p>
              </div>
              {canManage && (
                <button
                  onClick={() => {
                    deleteInterVillageRoute(route.id);
                    showToast(`Removed route ${route.fromVillageName} ↔ ${route.toVillageName}`);
                  }}
                  className="p-1.5 text-[#6B7280] hover:text-[#DC2626] rounded-lg cursor-pointer"
                  title="Remove route"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Add / Edit Village Modal */}
      <Modal
        isOpen={villageModalOpen}
        onClose={() => setVillageModalOpen(false)}
        title={editingVillage ? `Edit Village: ${editingVillage.name}` : 'Add Village to Marketplace'}
        size="md"
      >
        <form onSubmit={handleSaveVillage} className="space-y-4 text-left">
          {villageError && <div className="p-3 rounded-xl bg-[#FEE2E2] text-[#DC2626] text-xs font-semibold">{villageError}</div>}
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Village / Gram Panchayat"
              placeholder="e.g. Chandpur"
              value={vForm.name}
              onChange={(e) => setVForm({ ...vForm, name: e.target.value })}
              required
            />
            <Input
              label="Postal PIN Code"
              placeholder="e.g. 209806"
              value={vForm.postalCode}
              onChange={(e) => setVForm({ ...vForm, postalCode: e.target.value })}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="District"
              value={vForm.district}
              onChange={(e) => setVForm({ ...vForm, district: e.target.value })}
              required
            />
            <Input
              label="State"
              value={vForm.state}
              onChange={(e) => setVForm({ ...vForm, state: e.target.value })}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Base Delivery Fee (₹)"
              type="number"
              value={vForm.baseFeeRupees}
              onChange={(e) => setVForm({ ...vForm, baseFeeRupees: e.target.value })}
              required
            />
            <Input
              label="Free Delivery Threshold (₹)"
              type="number"
              value={vForm.minOrderRupees}
              onChange={(e) => setVForm({ ...vForm, minOrderRupees: e.target.value })}
              required
            />
          </div>
          <Input
            label="Delivery Landmarks / Hamlets (Comma-separated)"
            placeholder="e.g. Primary School, Shiv Mandir Chowk, Mandi Gate"
            value={vForm.landmarksCsv}
            onChange={(e) => setVForm({ ...vForm, landmarksCsv: e.target.value })}
          />
          <div className="pt-3 border-t border-[#E5E7EB] flex items-center justify-end gap-2.5">
            <Button variant="secondary" size="sm" type="button" onClick={() => setVillageModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit">
              {editingVillage ? 'Save Changes' : 'Register Village'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Add Neighbor Route Modal */}
      <Modal
        isOpen={routeModalOpen}
        onClose={() => setRouteModalOpen(false)}
        title="Add Inter-Village Neighbor Route"
        size="md"
      >
        <form onSubmit={handleAddRoute} className="space-y-4 text-left">
          {routeError && <div className="p-3 rounded-xl bg-[#FEE2E2] text-[#DC2626] text-xs font-semibold">{routeError}</div>}
          <div className="grid grid-cols-2 gap-3">
            <Select
              label="From Village"
              value={rForm.fromVillageId}
              options={serviceAreas.map((v) => ({ label: v.name, value: v.id }))}
              onChange={(e) => setRForm({ ...rForm, fromVillageId: e.target.value })}
            />
            <Select
              label="To Neighbor Village"
              value={rForm.toVillageId}
              options={serviceAreas.map((v) => ({ label: v.name, value: v.id }))}
              onChange={(e) => setRForm({ ...rForm, toVillageId: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Distance (km)"
              type="number"
              step="0.1"
              value={rForm.distanceKm}
              onChange={(e) => setRForm({ ...rForm, distanceKm: e.target.value })}
            />
            <Input
              label="Runner Surcharge (₹)"
              type="number"
              value={rForm.surchargeRs}
              onChange={(e) => setRForm({ ...rForm, surchargeRs: e.target.value })}
            />
          </div>
          <div className="pt-3 border-t border-[#E5E7EB] flex items-center justify-end gap-2.5">
            <Button variant="secondary" size="sm" type="button" onClick={() => setRouteModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit">
              Add Route
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
