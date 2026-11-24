/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Settings,
  Save,
  RotateCcw,
  CheckCircle2,
  ShieldAlert,
  Phone,
  Truck,
  Store,
  AlertTriangle,
} from 'lucide-react';
import { useAdmin } from '../../contexts/AdminContext';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { ConfirmDialog } from '../../components/feedback/ConfirmDialog';
import { VerticalBadge } from './components/VerticalBadge';

export const AdminSettingsView: React.FC = () => {
  const {
    platformSettings,
    updatePlatformSettings,
    verticalConfigs,
    resetAdminData,
    hasPermission,
  } = useAdmin();

  const canManage = hasPermission('SETTINGS', 'manage');
  const [form, setForm] = useState(platformSettings);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  const handleSave = () => {
    updatePlatformSettings(form);
    showToast('Platform settings saved and logged to audit trail.');
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#1F2937] flex items-center gap-2">
            <Settings className="w-6 h-6 text-[#218838]" />
            Platform Settings & Global Policies
          </h2>
          <p className="text-sm text-[#6B7280] mt-0.5">
            Configure GramBazaar marketplace identity, support helplines, fulfillment SLAs, and maintenance controls.
          </p>
        </div>

        {canManage && (
          <div className="flex items-center gap-2.5">
            <Button
              variant="secondary"
              size="md"
              onClick={() => setResetConfirmOpen(true)}
              leftIcon={<RotateCcw className="w-4 h-4" />}
            >
              Reset Demo Data
            </Button>
            <Button variant="primary" size="md" onClick={handleSave} leftIcon={<Save className="w-4 h-4" />}>
              Save Settings
            </Button>
          </div>
        )}
      </div>

      {toastMsg && (
        <div className="bg-[#E8F5E9] border border-[#218838]/30 text-[#176B2C] px-4 py-3 rounded-xl text-sm font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Marketplace Identity & Helplines */}
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 space-y-4 shadow-xs">
          <h3 className="text-base font-bold text-[#1F2937] flex items-center gap-2 border-b border-[#F1F5F9] pb-3">
            <Phone className="w-4 h-4 text-[#218838]" />
            Marketplace Branding & Support Desk
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Platform Name"
              disabled={!canManage}
              value={form.platformName}
              onChange={(e) => setForm({ ...form, platformName: e.target.value })}
            />
            <Input
              label="Tagline"
              disabled={!canManage}
              value={form.tagline}
              onChange={(e) => setForm({ ...form, tagline: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Customer Helpline Phone"
              disabled={!canManage}
              value={form.supportPhone}
              onChange={(e) => setForm({ ...form, supportPhone: e.target.value })}
            />
            <Input
              label="WhatsApp Support Number"
              disabled={!canManage}
              value={form.whatsappSupport}
              onChange={(e) => setForm({ ...form, whatsappSupport: e.target.value })}
            />
          </div>
        </div>

        {/* Fulfillment & SLA Controls */}
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 space-y-4 shadow-xs">
          <h3 className="text-base font-bold text-[#1F2937] flex items-center gap-2 border-b border-[#F1F5F9] pb-3">
            <Truck className="w-4 h-4 text-[#218838]" />
            Fulfillment Defaults & Operational SLAs
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Auto-Cancel Unaccepted Orders (mins)"
              type="number"
              disabled={!canManage}
              value={String(form.autoCancelUnacceptedMins)}
              onChange={(e) =>
                setForm({ ...form, autoCancelUnacceptedMins: Math.max(5, parseInt(e.target.value, 10) || 15) })
              }
            />
            <Input
              label="Food Prep SLA Alert Threshold (mins)"
              type="number"
              disabled={!canManage}
              value={String(form.foodPrepSlaMins)}
              onChange={(e) =>
                setForm({ ...form, foodPrepSlaMins: Math.max(10, parseInt(e.target.value, 10) || 35) })
              }
            />
          </div>
          <div className="space-y-2.5 pt-1">
            <label className="flex items-center justify-between p-3 rounded-xl bg-[#F8FAFC] border border-[#E5E7EB] cursor-pointer">
              <div>
                <p className="text-sm font-semibold text-[#1F2937]">Seller-Managed Home Delivery</p>
                <p className="text-xs text-[#6B7280]">Enable home delivery option by default for newly approved stores</p>
              </div>
              <input
                type="checkbox"
                disabled={!canManage}
                checked={form.defaultDeliveryEnabled}
                onChange={(e) => setForm({ ...form, defaultDeliveryEnabled: e.target.checked })}
                className="w-4 h-4 accent-[#218838]"
              />
            </label>
            <label className="flex items-center justify-between p-3 rounded-xl bg-[#F8FAFC] border border-[#E5E7EB] cursor-pointer">
              <div>
                <p className="text-sm font-semibold text-[#1F2937]">Store Pickup Mode</p>
                <p className="text-xs text-[#6B7280]">Allow buyers to pick up orders directly from local shop counters</p>
              </div>
              <input
                type="checkbox"
                disabled={!canManage}
                checked={form.defaultPickupEnabled}
                onChange={(e) => setForm({ ...form, defaultPickupEnabled: e.target.checked })}
                className="w-4 h-4 accent-[#218838]"
              />
            </label>
            <label className="flex items-center justify-between p-3 rounded-xl bg-[#F8FAFC] border border-[#E5E7EB] cursor-pointer">
              <div>
                <p className="text-sm font-semibold text-[#1F2937]">Multi-Vertical Seller Support</p>
                <p className="text-xs text-[#6B7280]">Allow a single village shop to list across multiple verticals (e.g. Hardware + Electronics)</p>
              </div>
              <input
                type="checkbox"
                disabled={!canManage}
                checked={form.allowMultiVerticalSellers}
                onChange={(e) => setForm({ ...form, allowMultiVerticalSellers: e.target.checked })}
                className="w-4 h-4 accent-[#218838]"
              />
            </label>
          </div>
        </div>

        {/* Vertical KYC Policy Matrix (Read Summary) */}
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 space-y-4 shadow-xs">
          <h3 className="text-base font-bold text-[#1F2937] flex items-center gap-2 border-b border-[#F1F5F9] pb-3">
            <Store className="w-4 h-4 text-[#218838]" />
            Active Vertical Compliance & KYC Rules
          </h3>
          <div className="space-y-2.5">
            {verticalConfigs.map((v) => (
              <div
                key={v.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-xl bg-[#F8FAFC] border border-[#E5E7EB]"
              >
                <div className="flex items-center gap-2">
                  <VerticalBadge vertical={v.id} />
                  <span className="text-xs font-semibold text-[#475569]">{v.fulfillmentWorkflow}</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {v.requiredKycDocs.map((doc) => (
                    <Badge key={doc} variant="neutral" size="sm">
                      {doc}
                    </Badge>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Maintenance & Emergency Controls */}
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 space-y-4 shadow-xs">
          <h3 className="text-base font-bold text-[#1F2937] flex items-center gap-2 border-b border-[#F1F5F9] pb-3">
            <ShieldAlert className="w-4 h-4 text-[#D97706]" />
            Maintenance Mode & System Safety
          </h3>
          <label className="flex items-center justify-between p-4 rounded-xl bg-[#FFFBEB] border border-[#FDE68A] cursor-pointer">
            <div className="flex items-start gap-2.5">
              <AlertTriangle className="w-5 h-5 text-[#D97706] shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-[#92400E]">Enable Marketplace Maintenance Banner</p>
                <p className="text-xs text-[#B45309] mt-0.5">
                  Temporarily pauses new buyer checkout while keeping Admin Panel accessible.
                </p>
              </div>
            </div>
            <input
              type="checkbox"
              disabled={!canManage}
              checked={form.maintenanceMode}
              onChange={(e) => setForm({ ...form, maintenanceMode: e.target.checked })}
              className="w-5 h-5 accent-[#D97706]"
            />
          </label>
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-[#1F2937] block mb-1.5">
              Maintenance Notice Message
            </label>
            <textarea
              rows={3}
              disabled={!canManage}
              value={form.maintenanceMessage}
              onChange={(e) => setForm({ ...form, maintenanceMessage: e.target.value })}
              className="w-full p-3 text-sm border border-[#E5E7EB] rounded-xl focus:outline-none focus:border-[#218838] disabled:bg-[#F8FAFC]"
            />
          </div>
        </div>
      </div>

      <ConfirmDialog
        isOpen={resetConfirmOpen}
        onClose={() => setResetConfirmOpen(false)}
        onConfirm={() => {
          resetAdminData();
          setResetConfirmOpen(false);
          showToast('All Admin master data has been restored to default seed state.');
        }}
        title="Reset All Admin Demo Data?"
        message="This will clear local changes across all 13 Admin Masters and restore the initial multi-vertical marketplace seed dataset."
        confirmText="Reset Data"
        isDestructive
      />
    </div>
  );
};
