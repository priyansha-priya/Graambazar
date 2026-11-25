/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import {
  QrCode,
  CheckCircle,
  ShieldCheck,
  Save,
  AlertCircle,
} from 'lucide-react';
import { useSeller } from '../../contexts/SellerContext';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Input } from '../../components/ui/Input';

export const SellerSettingsView: React.FC = () => {
  const { activeSeller, updateSellerProfile } = useSeller();
  const [storeName, setStoreName] = useState(activeSeller.publicName);
  const [phone, setPhone] = useState(activeSeller.contactPhone || '+91 98765 43210');
  const [upiId, setUpiId] = useState(
    activeSeller.upiId || `${activeSeller.id.replace(/^seller_/, '').replace(/_/g, '.')}@upi`
  );
  const [deliveryRadiusKm, setDeliveryRadiusKm] = useState(
    activeSeller.deliveryRadiusKm.toString()
  );
  const [openingHours, setOpeningHours] = useState(
    activeSeller.openingHoursText ||
      `${activeSeller.operatingHours.openingTime} - ${activeSeller.operatingHours.closingTime}`
  );
  const [minOrderInr, setMinOrderInr] = useState(
    Math.round(activeSeller.minimumOrderPaise / 100).toString()
  );
  const [packagingFeeInr, setPackagingFeeInr] = useState(
    Math.round(activeSeller.packagingFeePaise / 100).toString()
  );
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null
  );

  // Sync form whenever seller changes or PostgreSQL profile hydrates
  useEffect(() => {
    setStoreName(activeSeller.publicName);
    setPhone(activeSeller.contactPhone || '+91 98765 43210');
    setUpiId(
      activeSeller.upiId || `${activeSeller.id.replace(/^seller_/, '').replace(/_/g, '.')}@upi`
    );
    setDeliveryRadiusKm(activeSeller.deliveryRadiusKm.toString());
    setOpeningHours(
      activeSeller.openingHoursText ||
        `${activeSeller.operatingHours.openingTime} - ${activeSeller.operatingHours.closingTime}`
    );
    setMinOrderInr(Math.round(activeSeller.minimumOrderPaise / 100).toString());
    setPackagingFeeInr(Math.round(activeSeller.packagingFeePaise / 100).toString());
  }, [activeSeller]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setFeedback(null);

    const res = await updateSellerProfile({
      publicName: storeName.trim(),
      contactPhone: phone.trim(),
      upiId: upiId.trim(),
      deliveryRadiusKm: Math.max(1, Number(deliveryRadiusKm) || 5),
      openingHours: openingHours.trim(),
      minimumOrderPaise: Math.max(0, Math.round((Number(minOrderInr) || 0) * 100)),
      packagingFeePaise: Math.max(0, Math.round((Number(packagingFeeInr) || 0) * 100)),
    });

    setIsSaving(false);
    setFeedback({
      type: res.success ? 'success' : 'error',
      text: res.message,
    });
    if (res.success) {
      window.setTimeout(() => setFeedback(null), 3500);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in text-left">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-xl font-black text-[#1F2937]">Store Profile & Operational Settings</h1>
            <Badge variant="primary">{activeSeller.primaryVertical}</Badge>
          </div>
          <p className="text-xs text-[#6B7280]">
            Configure shop coordinates, direct customer UPI payment handles, and in-house delivery parameters.
          </p>
        </div>

        {feedback && (
          <div
            className={`p-2.5 px-3 text-xs font-semibold rounded-xl flex items-center gap-2 border ${
              feedback.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-red-50 border-red-200 text-red-800'
            }`}
          >
            {feedback.type === 'success' ? (
              <CheckCircle className="w-4 h-4 text-[#16A34A]" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-600" />
            )}
            <span>{feedback.text}</span>
          </div>
        )}
      </div>

      <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Form Fields */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-[#E5E7EB] p-5 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-[#1F2937]">Store Identity & Contact</h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Store Public Name"
              value={storeName}
              onChange={(e) => setStoreName(e.target.value)}
              required
            />
            <Input
              label="Store Phone / WhatsApp"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Direct Seller UPI ID (for QR Payments)"
              value={upiId}
              onChange={(e) => setUpiId(e.target.value)}
              helperText="Payments from rural customers go directly to your bank account"
              required
            />
            <Input
              label="Max Delivery Distance (km)"
              type="number"
              min={1}
              max={50}
              value={deliveryRadiusKm}
              onChange={(e) => setDeliveryRadiusKm(e.target.value)}
              helperText="How far your in-house runners can deliver"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input
              label="Opening Hours"
              value={openingHours}
              onChange={(e) => setOpeningHours(e.target.value)}
              placeholder="08:00 AM - 09:30 PM"
              required
            />
            <Input
              label="Minimum Order (₹)"
              type="number"
              min={0}
              value={minOrderInr}
              onChange={(e) => setMinOrderInr(e.target.value)}
              required
            />
            <Input
              label="Packaging Fee (₹)"
              type="number"
              min={0}
              value={packagingFeeInr}
              onChange={(e) => setPackagingFeeInr(e.target.value)}
              required
            />
          </div>

          <div className="pt-3 border-t border-[#E5E7EB] flex items-center justify-end">
            <Button
              variant="primary"
              size="sm"
              type="submit"
              disabled={isSaving}
              leftIcon={<Save className="w-3.5 h-3.5" />}
            >
              {isSaving ? 'Saving...' : 'Save Store Profile'}
            </Button>
          </div>
        </div>

        {/* Right Col: Trust & QR Preview */}
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-[#1F2937]">UPI Payment QR Code</h3>
          <div className="p-4 bg-[#F8FAFC] rounded-xl border border-[#E5E7EB] flex flex-col items-center justify-center text-center space-y-2">
            <div className="w-32 h-32 bg-white p-2 rounded-xl border border-[#E5E7EB] shadow-xs flex items-center justify-center">
              <QrCode className="w-24 h-24 text-[#1F2937]" />
            </div>
            <p className="text-xs font-mono font-bold text-[#1F2937]">{upiId}</p>
            <p className="text-[10px] text-[#6B7280]">
              Customers scan this at checkout or on delivery for zero-commission direct settlement.
            </p>
          </div>

          <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100 flex items-center gap-2.5 text-xs text-emerald-800">
            <ShieldCheck className="w-5 h-5 text-[#218838] shrink-0" />
            <span>FSSAI License Verified for Current Season</span>
          </div>
        </div>
      </form>
    </div>
  );
};
