import React, { useState } from 'react';
import {
  Bike,
  CheckCircle2,
  Edit3,
  MapPin,
  Plus,
  ShieldCheck,
  Trash2,
  Truck,
} from 'lucide-react';
import { useAdmin } from '../../contexts/AdminContext';
import { DeliveryPartnerRecord } from '../../types/admin';
import { KPICard } from '../../components/data-display/KPICard';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { ConfirmDialog } from '../../components/feedback/ConfirmDialog';

export const AdminDeliveryFleetView: React.FC = () => {
  const {
    deliveryPartners,
    serviceAreas,
    addDeliveryPartner,
    updateDeliveryPartner,
    deleteDeliveryPartner,
    hasPermission,
  } = useAdmin();

  const canManage = hasPermission('DELIVERY_FLEET', 'manage');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<DeliveryPartnerRecord | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: '',
    phone: '',
    villageId: serviceAreas[0]?.id || 'vil_rampur',
    vehicleType: 'BIKE' as DeliveryPartnerRecord['vehicleType'],
    vehicleNumber: '',
    kycVerified: true,
    status: 'AVAILABLE' as DeliveryPartnerRecord['status'],
  });

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const openModal = (partner?: DeliveryPartnerRecord) => {
    if (partner) {
      setEditing(partner);
      setForm({
        name: partner.name,
        phone: partner.phone,
        villageId: partner.villageId,
        vehicleType: partner.vehicleType,
        vehicleNumber: partner.vehicleNumber || '',
        kycVerified: partner.kycVerified,
        status: partner.status,
      });
    } else {
      setEditing(null);
      setForm({
        name: '',
        phone: '',
        villageId: serviceAreas[0]?.id || 'vil_rampur',
        vehicleType: 'BIKE',
        vehicleNumber: '',
        kycVerified: true,
        status: 'AVAILABLE',
      });
    }
    setModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.phone.trim()) return;
    const village = serviceAreas.find((a) => a.id === form.villageId);
    const payload = {
      name: form.name.trim(),
      phone: form.phone.trim(),
      villageId: form.villageId,
      villageName: village?.name || 'Rampur Kalan',
      vehicleType: form.vehicleType,
      vehicleNumber: form.vehicleNumber.trim() || undefined,
      kycVerified: form.kycVerified,
      status: form.status,
    };
    if (editing) {
      updateDeliveryPartner(editing.id, payload);
      showToast(`Updated delivery partner ${payload.name}.`);
    } else {
      addDeliveryPartner(payload);
      showToast(`Registered delivery partner ${payload.name}.`);
    }
    setModalOpen(false);
  };

  const availableCount = deliveryPartners.filter((d) => d.status === 'AVAILABLE').length;
  const onDeliveryCount = deliveryPartners.filter((d) => d.status === 'ON_DELIVERY').length;
  const totalTrips = deliveryPartners.reduce((sum, d) => sum + d.completedDeliveries, 0);

  return (
    <div className="space-y-6 animate-fade-in text-left">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <h1 className="text-xl font-black text-[#1F2937]">Delivery Partners &amp; Fleet</h1>
            <Badge variant="primary">Hybrid Village Logistics</Badge>
          </div>
          <p className="text-xs text-[#6B7280]">
            Manage shared GramBazaar village riders alongside seller-managed delivery for inter-village &amp; peak-hour fulfillment.
          </p>
        </div>

        {canManage && (
          <Button
            variant="primary"
            size="sm"
            onClick={() => openModal()}
            leftIcon={<Plus className="w-3.5 h-3.5" />}
          >
            Add Delivery Partner
          </Button>
        )}
      </div>

      {toastMsg && (
        <div className="bg-[#E8F5E9] border border-[#218838]/30 text-[#176B2C] px-4 py-3 rounded-xl text-sm font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <KPICard
          title="Registered Riders"
          value={deliveryPartners.length}
          helperText="Shared village fleet roster"
          icon={<Bike className="w-5 h-5" />}
          iconBgClass="bg-[#E8F5E9] text-[#218838]"
        />
        <KPICard
          title="Online & Available"
          value={availableCount}
          helperText="Ready for instant dispatch"
          icon={<CheckCircle2 className="w-5 h-5" />}
          iconBgClass="bg-[#EFF6FF] text-[#2563EB]"
        />
        <KPICard
          title="Active On-Delivery"
          value={onDeliveryCount}
          helperText="En route to village landmarks"
          icon={<Truck className="w-5 h-5" />}
          iconBgClass="bg-[#FEF3C7] text-[#D97706]"
        />
        <KPICard
          title="Completed Deliveries"
          value={totalTrips}
          helperText="4.8 ★ avg rider rating"
          icon={<ShieldCheck className="w-5 h-5" />}
          iconBgClass="bg-[#F3E8FF] text-[#7C3AED]"
        />
      </div>

      {/* Fleet Table */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-[#F8FAFC] text-[#6B7280] uppercase font-semibold border-b border-[#E5E7EB]">
              <tr>
                <th className="py-3.5 px-4">Partner Details</th>
                <th className="py-3.5 px-4">Base Village</th>
                <th className="py-3.5 px-4">Vehicle</th>
                <th className="py-3.5 px-4">KYC</th>
                <th className="py-3.5 px-4">Trips &amp; Rating</th>
                <th className="py-3.5 px-4">Status</th>
                {canManage && <th className="py-3.5 px-4 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E7EB]">
              {deliveryPartners.map((d) => (
                <tr key={d.id} className="hover:bg-[#F8FAFC]/80">
                  <td className="py-3.5 px-4">
                    <p className="font-bold text-[#1F2937]">{d.name}</p>
                    <p className="text-[11px] text-[#6B7280]">{d.phone}</p>
                  </td>
                  <td className="py-3.5 px-4 font-semibold text-[#1F2937]">
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-[#218838]" />
                      {d.villageName}
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    <p className="font-semibold text-[#1F2937]">{d.vehicleType.replace('_', '-')}</p>
                    <p className="text-[11px] text-[#6B7280] font-mono">{d.vehicleNumber || 'Non-motorized'}</p>
                  </td>
                  <td className="py-3.5 px-4">
                    <Badge variant={d.kycVerified ? 'success' : 'warning'} size="sm">
                      {d.kycVerified ? 'Aadhaar Verified' : 'Pending KYC'}
                    </Badge>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="font-bold text-[#1F2937]">{d.completedDeliveries}</span> trips &middot; ★ {d.rating}
                  </td>
                  <td className="py-3.5 px-4">
                    <Badge
                      variant={
                        d.status === 'AVAILABLE'
                          ? 'success'
                          : d.status === 'ON_DELIVERY'
                          ? 'info'
                          : d.status === 'OFFLINE'
                          ? 'neutral'
                          : 'error'
                      }
                      size="sm"
                      dot
                    >
                      {d.status.replace('_', ' ')}
                    </Badge>
                  </td>
                  {canManage && (
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="inline-flex gap-1">
                        <Button variant="ghost" size="sm" onClick={() => openModal(d)}>
                          <Edit3 className="w-3.5 h-3.5" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => setDeleteId(d.id)}>
                          <Trash2 className="w-3.5 h-3.5 text-[#DC2626]" />
                        </Button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Edit Delivery Partner' : 'Register Village Delivery Partner'}
        size="md"
      >
        <form onSubmit={handleSave} className="space-y-4 text-left">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Full Name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Rajesh Verma"
              required
            />
            <Input
              label="Mobile Number"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder="+91 98388 XXXXX"
              required
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Select
              label="Assigned Village"
              value={form.villageId}
              onChange={(e) => setForm({ ...form, villageId: e.target.value })}
              options={serviceAreas.map((a) => ({ value: a.id, label: a.name }))}
            />
            <Select
              label="Vehicle Type"
              value={form.vehicleType}
              onChange={(e) => setForm({ ...form, vehicleType: e.target.value as DeliveryPartnerRecord['vehicleType'] })}
              options={[
                { value: 'BIKE', label: 'Two-Wheeler Bike' },
                { value: 'E_RICKSHAW', label: 'Village E-Rickshaw (Bulk)' },
                { value: 'CYCLE', label: 'Bicycle (Local Short Drop)' },
              ]}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Vehicle Number (Optional)"
              value={form.vehicleNumber}
              onChange={(e) => setForm({ ...form, vehicleNumber: e.target.value })}
              placeholder="UP-35-XX-0000"
            />
            <Select
              label="Operational Status"
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value as DeliveryPartnerRecord['status'] })}
              options={[
                { value: 'AVAILABLE', label: 'Available' },
                { value: 'ON_DELIVERY', label: 'On Delivery' },
                { value: 'OFFLINE', label: 'Offline' },
                { value: 'SUSPENDED', label: 'Suspended' },
              ]}
            />
          </div>
          <label className="flex items-center justify-between p-3 rounded-xl bg-[#F8FAFC] border border-[#E5E7EB] text-xs cursor-pointer">
            <span className="font-semibold text-[#1F2937]">Aadhaar &amp; Local Address KYC Verified</span>
            <input
              type="checkbox"
              checked={form.kycVerified}
              onChange={(e) => setForm({ ...form, kycVerified: e.target.checked })}
              className="w-4 h-4 accent-[#218838]"
            />
          </label>
          <div className="flex justify-end gap-2 pt-2 border-t border-[#E5E7EB]">
            <Button variant="secondary" size="sm" type="button" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit">
              {editing ? 'Update Partner' : 'Register Partner'}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={Boolean(deleteId)}
        onClose={() => setDeleteId(null)}
        onConfirm={() => {
          if (deleteId) {
            deleteDeliveryPartner(deleteId);
            showToast('Removed delivery partner from fleet.');
          }
          setDeleteId(null);
        }}
        title="Remove Delivery Partner?"
        message="This removes the rider from the active GramBazaar village fleet directory."
        confirmText="Remove"
        isDestructive
      />
    </div>
  );
};
