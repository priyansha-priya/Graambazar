import React, { useState } from 'react';
import {
  Bell,
  CheckCircle2,
  Megaphone,
  Send,
  Trash2,
  Users,
} from 'lucide-react';
import { useAdmin } from '../../contexts/AdminContext';
import { BroadcastMessageRecord } from '../../types/admin';
import { KPICard } from '../../components/data-display/KPICard';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { ConfirmDialog } from '../../components/feedback/ConfirmDialog';

export const AdminBroadcastsView: React.FC = () => {
  const { broadcasts, serviceAreas, sendBroadcast, deleteBroadcast, hasPermission } = useAdmin();
  const canManage = hasPermission('BROADCASTS', 'manage');

  const [composeOpen, setComposeOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: '',
    message: '',
    channel: 'WHATSAPP' as BroadcastMessageRecord['channel'],
    audience: 'ALL_CUSTOMERS' as BroadcastMessageRecord['audience'],
    targetVillage: 'ALL',
    priority: 'NORMAL' as BroadcastMessageRecord['priority'],
    status: 'SENT' as 'SENT' | 'SCHEDULED',
    scheduledFor: '',
  });

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3200);
  };

  const estimateReach = () => {
    if (form.audience === 'ALL_CUSTOMERS') return 1280;
    if (form.audience === 'ALL_SELLERS') return 42;
    if (form.audience === 'VILLAGE_CUSTOMERS') return 460;
    return 16;
  };

  const handleDispatch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.message.trim()) return;
    sendBroadcast({
      title: form.title.trim(),
      message: form.message.trim(),
      channel: form.channel,
      audience: form.audience,
      targetVillage: form.audience.startsWith('VILLAGE') ? form.targetVillage : 'ALL',
      priority: form.priority,
      estimatedReach: estimateReach(),
      status: form.status,
      scheduledFor: form.status === 'SCHEDULED' ? form.scheduledFor : undefined,
    });
    showToast(
      form.status === 'SENT'
        ? `Broadcast "${form.title.trim()}" sent via ${form.channel}.`
        : `Broadcast "${form.title.trim()}" scheduled.`
    );
    setComposeOpen(false);
    setForm({
      title: '',
      message: '',
      channel: 'WHATSAPP',
      audience: 'ALL_CUSTOMERS',
      targetVillage: 'ALL',
      priority: 'NORMAL',
      status: 'SENT',
      scheduledFor: '',
    });
  };

  const totalDelivered = broadcasts.reduce((sum, b) => sum + b.deliveredCount, 0);

  return (
    <div className="space-y-6 animate-fade-in text-left">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <h1 className="text-xl font-black text-[#1F2937]">Notifications &amp; Village Broadcasts</h1>
            <Badge variant="primary">WhatsApp · SMS · App Push</Badge>
          </div>
          <p className="text-xs text-[#6B7280]">
            Send village launch announcements, festive offers, weather/delivery alerts, and seller reminders.
          </p>
        </div>

        {canManage && (
          <Button
            variant="primary"
            size="sm"
            onClick={() => setComposeOpen(true)}
            leftIcon={<Send className="w-3.5 h-3.5" />}
          >
            Compose Broadcast
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
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KPICard
          title="Total Campaigns"
          value={broadcasts.length}
          helperText="Sent & scheduled broadcasts"
          icon={<Megaphone className="w-5 h-5" />}
          iconBgClass="bg-[#E8F5E9] text-[#218838]"
        />
        <KPICard
          title="Messages Delivered"
          value={totalDelivered.toLocaleString('en-IN')}
          helperText="97.2% avg delivery rate"
          icon={<Users className="w-5 h-5" />}
          iconBgClass="bg-[#EFF6FF] text-[#2563EB]"
        />
        <KPICard
          title="Scheduled Upcoming"
          value={broadcasts.filter((b) => b.status === 'SCHEDULED').length}
          helperText="Queued for village dispatch"
          icon={<Bell className="w-5 h-5" />}
          iconBgClass="bg-[#FEF3C7] text-[#D97706]"
        />
      </div>

      {/* Broadcast History */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-[#F8FAFC] text-[#6B7280] uppercase font-semibold border-b border-[#E5E7EB]">
              <tr>
                <th className="py-3.5 px-4">Announcement</th>
                <th className="py-3.5 px-4">Channel &amp; Audience</th>
                <th className="py-3.5 px-4">Target Village</th>
                <th className="py-3.5 px-4">Reach / Delivered</th>
                <th className="py-3.5 px-4">Status</th>
                {canManage && <th className="py-3.5 px-4 text-right">Action</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E7EB]">
              {broadcasts.map((b) => (
                <tr key={b.id} className="hover:bg-[#F8FAFC]/80">
                  <td className="py-3.5 px-4 max-w-md">
                    <p className="font-bold text-[#1F2937]">{b.title}</p>
                    <p className="text-[11px] text-[#6B7280] mt-0.5 line-clamp-2">{b.message}</p>
                  </td>
                  <td className="py-3.5 px-4">
                    <p className="font-semibold text-[#1F2937]">{b.channel.replace('_', ' ')}</p>
                    <p className="text-[11px] text-[#6B7280]">{b.audience.replace(/_/g, ' ')}</p>
                  </td>
                  <td className="py-3.5 px-4 font-semibold text-[#1F2937]">{b.targetVillage}</td>
                  <td className="py-3.5 px-4">
                    <p className="font-bold text-[#1F2937]">
                      {b.deliveredCount} / {b.estimatedReach}
                    </p>
                    <p className="text-[11px] text-[#6B7280]">By {b.createdBy}</p>
                  </td>
                  <td className="py-3.5 px-4">
                    <Badge
                      variant={b.status === 'SENT' ? 'success' : 'warning'}
                      size="sm"
                      dot
                    >
                      {b.status}
                    </Badge>
                  </td>
                  {canManage && (
                    <td className="py-3.5 px-4 text-right">
                      <Button variant="ghost" size="sm" onClick={() => setDeleteId(b.id)}>
                        <Trash2 className="w-3.5 h-3.5 text-[#DC2626]" />
                      </Button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Compose Broadcast Modal */}
      <Modal
        isOpen={composeOpen}
        onClose={() => setComposeOpen(false)}
        title="Compose Village Broadcast"
        description="Send targeted announcements via WhatsApp, SMS, or App Notification."
        size="md"
      >
        <form onSubmit={handleDispatch} className="space-y-4 text-left">
          <Input
            label="Headline"
            placeholder="e.g. Heavy Rain Alert: Slight Delivery Delays in Rampur"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            required
          />
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-[#1F2937] block mb-1.5">
              Message Content *
            </label>
            <textarea
              rows={4}
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
              placeholder="Write clear Hindi / Hinglish / English notice for villagers or shopkeepers..."
              className="w-full p-3 text-xs border border-[#E5E7EB] rounded-xl focus:outline-none focus:border-[#218838]"
              required
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Select
              label="Channel"
              value={form.channel}
              onChange={(e) => setForm({ ...form, channel: e.target.value as BroadcastMessageRecord['channel'] })}
              options={[
                { value: 'WHATSAPP', label: 'WhatsApp Business' },
                { value: 'APP_PUSH', label: 'Mobile App Push' },
                { value: 'SMS', label: 'Local SMS Gateway' },
                { value: 'ALL', label: 'All Channels' },
              ]}
            />
            <Select
              label="Target Audience"
              value={form.audience}
              onChange={(e) => setForm({ ...form, audience: e.target.value as BroadcastMessageRecord['audience'] })}
              options={[
                { value: 'ALL_CUSTOMERS', label: 'All Customers' },
                { value: 'ALL_SELLERS', label: 'All Registered Sellers' },
                { value: 'VILLAGE_CUSTOMERS', label: 'Specific Village Customers' },
                { value: 'VILLAGE_SELLERS', label: 'Specific Village Sellers' },
              ]}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {form.audience.startsWith('VILLAGE') && (
              <Select
                label="Select Village"
                value={form.targetVillage}
                onChange={(e) => setForm({ ...form, targetVillage: e.target.value })}
                options={serviceAreas.map((a) => ({ value: a.name, label: a.name }))}
              />
            )}
            <Select
              label="Dispatch Timing"
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value as 'SENT' | 'SCHEDULED' })}
              options={[
                { value: 'SENT', label: 'Send Immediately' },
                { value: 'SCHEDULED', label: 'Schedule for Later' },
              ]}
            />
          </div>
          <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E5E7EB] text-xs flex items-center justify-between">
            <span className="text-[#6B7280]">Estimated Audience Reach</span>
            <span className="font-bold text-[#218838]">{estimateReach()} recipients</span>
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t border-[#E5E7EB]">
            <Button variant="secondary" size="sm" type="button" onClick={() => setComposeOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit" leftIcon={<Send className="w-3.5 h-3.5" />}>
              {form.status === 'SENT' ? 'Send Broadcast' : 'Schedule Broadcast'}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={Boolean(deleteId)}
        onClose={() => setDeleteId(null)}
        onConfirm={() => {
          if (deleteId) {
            deleteBroadcast(deleteId);
            showToast('Removed broadcast record.');
          }
          setDeleteId(null);
        }}
        title="Delete Broadcast Record?"
        message="This removes the announcement from your broadcast history log."
        confirmText="Delete"
        isDestructive
      />
    </div>
  );
};
