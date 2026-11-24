/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Settings,
  Store,
  MapPin,
  Clock,
  QrCode,
  Truck,
  CheckCircle,
  ShieldCheck,
  Save,
} from 'lucide-react';
import { useSeller } from '../../contexts/SellerContext';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Input } from '../../components/ui/Input';

export const SellerSettingsView: React.FC = () => {
  const { activeSeller } = useSeller();
  const [storeName, setStoreName] = useState(activeSeller.publicName);
  const [phone, setPhone] = useState(activeSeller.contactPhone || '+91 98765 43210');
  const [upiId, setUpiId] = useState('chaudhary.dhaba@upi');
  const [deliveryRadiusKm, setDeliveryRadiusKm] = useState(activeSeller.deliveryRadiusKm.toString());
  const [savedToast, setSavedToast] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedToast(true);
    setTimeout(() => setSavedToast(false), 3000);
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

        {savedToast && (
          <div className="p-2.5 px-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold rounded-xl flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-[#16A34A]" />
            <span>Settings saved successfully!</span>
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
              value={deliveryRadiusKm}
              onChange={(e) => setDeliveryRadiusKm(e.target.value)}
              helperText="How far your in-house runners can deliver"
              required
            />
          </div>

          <div className="pt-3 border-t border-[#E5E7EB] flex items-center justify-end">
            <Button variant="primary" size="sm" type="submit" leftIcon={<Save className="w-3.5 h-3.5" />}>
              Save Store Profile
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
