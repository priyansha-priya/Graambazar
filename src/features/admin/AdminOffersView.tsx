/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useState } from 'react';
import {
  Tag,
  Plus,
  Search,
  CheckCircle2,
  Edit3,
  Trash2,
  Percent,
  IndianRupee,
  Truck,
} from 'lucide-react';
import { useAdmin } from '../../contexts/AdminContext';
import { OfferCouponRecord } from '../../types/admin';
import { formatPaiseToINR } from '../../utils/currency';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { EmptyState } from '../../components/feedback/EmptyState';
import { ConfirmDialog } from '../../components/feedback/ConfirmDialog';
import { VerticalBadge } from './components/VerticalBadge';

export const AdminOffersView: React.FC = () => {
  const {
    offers,
    verticalConfigs,
    serviceAreas,
    addOffer,
    updateOffer,
    toggleOfferStatus,
    deleteOffer,
    hasPermission,
  } = useAdmin();

  const canManage = hasPermission('OFFERS', 'manage');
  const [searchQuery, setSearchQuery] = useState('');
  const [verticalFilter, setVerticalFilter] = useState('ALL');
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingOffer, setEditingOffer] = useState<OfferCouponRecord | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<OfferCouponRecord | null>(null);
  const [formError, setFormError] = useState('');
  const [form, setForm] = useState({
    code: '',
    title: '',
    discountType: 'FLAT' as 'FLAT' | 'PERCENTAGE' | 'FREE_DELIVERY',
    discountInput: '50',
    minOrderRs: '250',
    maxDiscountRs: '150',
    vertical: 'ALL',
    villageId: 'ALL',
    fundedBy: 'PLATFORM' as 'PLATFORM' | 'SELLER',
    validFrom: '2026-11-01',
    validUntil: '2026-12-31',
    usageLimit: '300',
  });

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const filteredOffers = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return offers.filter((o) => {
      const matchV = verticalFilter === 'ALL' || o.vertical === verticalFilter || o.vertical === 'ALL';
      const matchQ = !q || o.code.toLowerCase().includes(q) || o.title.toLowerCase().includes(q);
      return matchV && matchQ;
    });
  }, [offers, searchQuery, verticalFilter]);

  const openModal = (offer?: OfferCouponRecord) => {
    setFormError('');
    if (offer) {
      setEditingOffer(offer);
      setForm({
        code: offer.code,
        title: offer.title,
        discountType: offer.discountType,
        discountInput:
          offer.discountType === 'FLAT'
            ? String(offer.discountValue / 100)
            : String(offer.discountValue),
        minOrderRs: String(offer.minOrderPaise / 100),
        maxDiscountRs: offer.maxDiscountPaise ? String(offer.maxDiscountPaise / 100) : '',
        vertical: offer.vertical,
        villageId: offer.villageId,
        fundedBy: offer.fundedBy,
        validFrom: offer.validFrom,
        validUntil: offer.validUntil,
        usageLimit: String(offer.usageLimit),
      });
    } else {
      setEditingOffer(null);
      setForm({
        code: '',
        title: '',
        discountType: 'FLAT',
        discountInput: '50',
        minOrderRs: '250',
        maxDiscountRs: '150',
        vertical: 'ALL',
        villageId: 'ALL',
        fundedBy: 'PLATFORM',
        validFrom: new Date().toISOString().split('T')[0],
        validUntil: '2026-12-31',
        usageLimit: '250',
      });
    }
    setModalOpen(true);
  };

  const handleSave = () => {
    if (!form.code.trim() || !form.title.trim()) {
      setFormError('Coupon code and title are required.');
      return;
    }
    const val = parseFloat(form.discountInput) || 0;
    if (form.discountType !== 'FREE_DELIVERY' && val <= 0) {
      setFormError('Discount value must be greater than zero.');
      return;
    }
    if (form.discountType === 'PERCENTAGE' && val > 80) {
      setFormError('Percentage discount cannot exceed 80%.');
      return;
    }

    const payload = {
      code: form.code.trim().toUpperCase().replace(/\s+/g, ''),
      title: form.title.trim(),
      discountType: form.discountType,
      discountValue:
        form.discountType === 'FLAT'
          ? Math.round(val * 100)
          : form.discountType === 'PERCENTAGE'
          ? Math.round(val)
          : 0,
      minOrderPaise: Math.round((parseFloat(form.minOrderRs) || 0) * 100),
      maxDiscountPaise:
        form.discountType === 'PERCENTAGE' && form.maxDiscountRs
          ? Math.round(parseFloat(form.maxDiscountRs) * 100)
          : undefined,
      vertical: form.vertical,
      villageId: form.villageId,
      fundedBy: form.fundedBy,
      validFrom: form.validFrom,
      validUntil: form.validUntil,
      usageLimit: Math.max(1, parseInt(form.usageLimit, 10) || 100),
      isActive: editingOffer ? editingOffer.isActive : true,
    };

    if (editingOffer) {
      updateOffer(editingOffer.id, payload);
      showToast(`Updated coupon ${payload.code}`);
    } else {
      addOffer(payload);
      showToast(`Created coupon ${payload.code}`);
    }
    setModalOpen(false);
  };

  const getVillageLabel = (villageId: string) =>
    villageId === 'ALL'
      ? 'All Villages'
      : serviceAreas.find((v) => v.id === villageId)?.name || villageId;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#1F2937] flex items-center gap-2">
            <Tag className="w-6 h-6 text-[#218838]" />
            Offers, Coupons & Promotions Master
          </h2>
          <p className="text-sm text-[#6B7280] mt-0.5">
            Create village-scoped or vertical-scoped promotional codes with platform or seller funding controls.
          </p>
        </div>

        {canManage && (
          <Button variant="primary" size="md" onClick={() => openModal()} leftIcon={<Plus className="w-4 h-4" />}>
            Create Coupon
          </Button>
        )}
      </div>

      {toastMsg && (
        <div className="bg-[#E8F5E9] border border-[#218838]/30 text-[#176B2C] px-4 py-3 rounded-xl text-sm font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Search & Filter */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] p-4 flex flex-col sm:flex-row gap-3 shadow-xs">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-[#6B7280] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search coupon code or campaign title..."
            className="w-full h-10 pl-10 pr-4 text-sm bg-[#F8FAFC] border border-[#E5E7EB] rounded-xl focus:outline-none focus:border-[#218838] focus:bg-white"
          />
        </div>
        <select
          value={verticalFilter}
          onChange={(e) => setVerticalFilter(e.target.value)}
          className="h-10 px-3 text-sm bg-[#F8FAFC] border border-[#E5E7EB] rounded-xl focus:outline-none focus:border-[#218838] cursor-pointer sm:w-56"
        >
          <option value="ALL">All Verticals</option>
          {verticalConfigs.map((v) => (
            <option key={v.id} value={v.id}>{v.name}</option>
          ))}
        </select>
      </div>

      {/* Offers Table */}
      {filteredOffers.length === 0 ? (
        <EmptyState
          icon={<Tag className="w-7 h-7" />}
          title="No coupons found"
          description="Launch flat discounts, percentage sales, or free delivery promos for target villages."
          actionText={canManage ? 'Create Coupon' : undefined}
          onAction={canManage ? () => openModal() : undefined}
        />
      ) : (
        <div className="bg-white rounded-2xl border border-[#E5E7EB] overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#F8FAFC] border-b border-[#E5E7EB] text-xs font-bold uppercase tracking-wider text-[#6B7280]">
                  <th className="py-3.5 px-5">Code & Campaign</th>
                  <th className="py-3.5 px-5">Benefit & Min Order</th>
                  <th className="py-3.5 px-5">Scope (Vertical / Village)</th>
                  <th className="py-3.5 px-5">Funding & Usage</th>
                  <th className="py-3.5 px-5">Validity & Status</th>
                  {canManage && <th className="py-3.5 px-5 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E7EB] text-sm">
                {filteredOffers.map((offer) => (
                  <tr key={offer.id} className="hover:bg-[#F8FAFC] transition-colors">
                    <td className="py-3.5 px-5">
                      <span className="font-mono font-bold text-xs px-2.5 py-1 rounded-lg bg-[#E8F5E9] text-[#176B2C] border border-[#218838]/20">
                        {offer.code}
                      </span>
                      <p className="font-semibold text-[#1F2937] mt-1.5">{offer.title}</p>
                    </td>
                    <td className="py-3.5 px-5">
                      <div className="flex items-center gap-1.5 font-bold text-[#1F2937]">
                        {offer.discountType === 'FLAT' && (
                          <>
                            <IndianRupee className="w-3.5 h-3.5 text-[#218838]" />
                            {formatPaiseToINR(offer.discountValue)} Flat Off
                          </>
                        )}
                        {offer.discountType === 'PERCENTAGE' && (
                          <>
                            <Percent className="w-3.5 h-3.5 text-[#218838]" />
                            {offer.discountValue}% Off
                            {offer.maxDiscountPaise && (
                              <span className="text-xs font-normal text-[#6B7280]">
                                (Up to {formatPaiseToINR(offer.maxDiscountPaise)})
                              </span>
                            )}
                          </>
                        )}
                        {offer.discountType === 'FREE_DELIVERY' && (
                          <>
                            <Truck className="w-3.5 h-3.5 text-[#218838]" /> Free Delivery
                          </>
                        )}
                      </div>
                      <p className="text-xs text-[#6B7280] mt-0.5">
                        Min order: {formatPaiseToINR(offer.minOrderPaise)}
                      </p>
                    </td>
                    <td className="py-3.5 px-5">
                      <VerticalBadge vertical={offer.vertical} />
                      <p className="text-xs text-[#475569] mt-1">{getVillageLabel(offer.villageId)}</p>
                    </td>
                    <td className="py-3.5 px-5">
                      <Badge variant={offer.fundedBy === 'PLATFORM' ? 'info' : 'warning'} size="sm">
                        {offer.fundedBy === 'PLATFORM' ? 'Platform Funded' : 'Seller Funded'}
                      </Badge>
                      <p className="text-xs text-[#6B7280] mt-1">
                        Used: <strong>{offer.usedCount}</strong> / {offer.usageLimit}
                      </p>
                    </td>
                    <td className="py-3.5 px-5">
                      <Badge variant={offer.isActive ? 'success' : 'neutral'} dot>
                        {offer.isActive ? 'Active' : 'Paused'}
                      </Badge>
                      <p className="text-[11px] text-[#6B7280] mt-1">
                        {offer.validFrom} → {offer.validUntil}
                      </p>
                    </td>
                    {canManage && (
                      <td className="py-3.5 px-5 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5">
                          <Button variant="ghost" size="sm" onClick={() => openModal(offer)}>
                            <Edit3 className="w-3.5 h-3.5" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => toggleOfferStatus(offer.id)}>
                            {offer.isActive ? 'Pause' : 'Activate'}
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => setDeleteTarget(offer)}>
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
      )}

      {/* CREATE / EDIT COUPON MODAL */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingOffer ? 'Edit Promotional Coupon' : 'Create Promotional Coupon'}
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleSave}>Save Coupon</Button>
          </>
        }
      >
        <div className="space-y-4">
          {formError && <div className="p-3 rounded-xl bg-[#FEE2E2] text-[#DC2626] text-xs font-semibold">{formError}</div>}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Coupon Code"
              required
              placeholder="e.g., GRAM50, FESTIVE10"
              value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
            />
            <Input
              label="Campaign Title"
              required
              placeholder="e.g., Welcome ₹50 Off"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Select
              label="Discount Type"
              value={form.discountType}
              options={[
                { label: 'Flat ₹ Discount', value: 'FLAT' },
                { label: 'Percentage % Off', value: 'PERCENTAGE' },
                { label: 'Free Delivery', value: 'FREE_DELIVERY' },
              ]}
              onChange={(e) => setForm({ ...form, discountType: e.target.value as 'FLAT' | 'PERCENTAGE' | 'FREE_DELIVERY' })}
            />
            {form.discountType !== 'FREE_DELIVERY' && (
              <Input
                label={form.discountType === 'FLAT' ? 'Discount Amount (₹)' : 'Discount (%)'}
                type="number"
                value={form.discountInput}
                onChange={(e) => setForm({ ...form, discountInput: e.target.value })}
              />
            )}
            <Input
              label="Minimum Order (₹)"
              type="number"
              value={form.minOrderRs}
              onChange={(e) => setForm({ ...form, minOrderRs: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Select
              label="Vertical Scope"
              value={form.vertical}
              options={[
                { label: 'All Verticals', value: 'ALL' },
                ...verticalConfigs.map((v) => ({ label: v.name, value: v.id })),
              ]}
              onChange={(e) => setForm({ ...form, vertical: e.target.value })}
            />
            <Select
              label="Village Scope"
              value={form.villageId}
              options={[
                { label: 'All Villages', value: 'ALL' },
                ...serviceAreas.map((v) => ({ label: v.name, value: v.id })),
              ]}
              onChange={(e) => setForm({ ...form, villageId: e.target.value })}
            />
            <Select
              label="Funded By"
              value={form.fundedBy}
              options={[
                { label: 'Platform Marketing Budget', value: 'PLATFORM' },
                { label: 'Seller Sponsored', value: 'SELLER' },
              ]}
              onChange={(e) => setForm({ ...form, fundedBy: e.target.value as 'PLATFORM' | 'SELLER' })}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input
              label="Valid From"
              type="date"
              value={form.validFrom}
              onChange={(e) => setForm({ ...form, validFrom: e.target.value })}
            />
            <Input
              label="Valid Until"
              type="date"
              value={form.validUntil}
              onChange={(e) => setForm({ ...form, validUntil: e.target.value })}
            />
            <Input
              label="Total Usage Limit"
              type="number"
              value={form.usageLimit}
              onChange={(e) => setForm({ ...form, usageLimit: e.target.value })}
            />
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) {
            deleteOffer(deleteTarget.id);
            showToast(`Deleted coupon ${deleteTarget.code}`);
          }
          setDeleteTarget(null);
        }}
        title="Delete Coupon?"
        message={`Permanently remove coupon "${deleteTarget?.code}"?`}
        confirmText="Delete Coupon"
        isDestructive
      />
    </div>
  );
};
