/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  ShieldCheck,
  Users,
  Plus,
  UserCheck,
  CheckCircle2,
  Edit3,
  Lock,
  KeyRound,
} from 'lucide-react';
import { useAdmin } from '../../contexts/AdminContext';
import { AdminModuleKey, AdminRole, AdminUser } from '../../types/admin';
import { Tabs } from '../../components/ui/Tabs';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';

const ROLE_LABELS: Record<AdminRole, string> = {
  SUPER_ADMIN: 'Super Admin',
  ADMIN_OPS: 'Operations Admin',
  ADMIN_FINANCE: 'Finance & Settlement Admin',
  ADMIN_SUPPORT: 'Support & Disputes Admin',
};

const MODULE_LABELS: { key: AdminModuleKey; label: string }[] = [
  { key: 'DASHBOARD', label: 'Dashboard & Overview' },
  { key: 'ANALYTICS', label: 'Reports & Business Analytics' },
  { key: 'VERTICALS', label: 'Vertical Master' },
  { key: 'MASTER_CATEGORIES', label: 'Masters → Category & Subcategory' },
  { key: 'MASTER_BRANDS', label: 'Masters → Brand' },
  { key: 'MASTER_UNITS', label: 'Masters → Unit & Measurement' },
  { key: 'MASTER_ATTRIBUTES', label: 'Masters → Product Attributes' },
  { key: 'MASTER_VARIANTS', label: 'Masters → Variants & Sizes' },
  { key: 'MASTER_ADDONS', label: 'Masters → Add-ons & Customization' },
  { key: 'MASTER_PACKAGING', label: 'Masters → Packaging' },
  { key: 'MASTER_AVAILABILITY', label: 'Masters → Availability & Stock Config' },
  { key: 'PRODUCTS', label: 'Universal Products & Moderation' },
  { key: 'APPLICATIONS', label: 'Seller Applications & KYC' },
  { key: 'SELLERS', label: 'Seller Directory & Stores' },
  { key: 'SAFETY_QUALITY', label: 'Seller Safety, Quality & Assessments' },
  { key: 'CUSTOMERS', label: 'Customers Directory & Controls' },
  { key: 'SERVICE_AREAS', label: 'Villages & Neighbor Matrix' },
  { key: 'ORDERS', label: 'Order Management' },
  { key: 'DELIVERY_FLEET', label: 'Delivery Partners & Fleet' },
  { key: 'OFFERS', label: 'Offers & Coupons' },
  { key: 'CMS_BANNERS', label: 'Home Banners, Featured Shops & CMS' },
  { key: 'REVIEWS', label: 'Reviews & Ratings Moderation' },
  { key: 'BROADCASTS', label: 'Notifications & Village Broadcasts' },
  { key: 'PAYOUTS', label: 'Payments, Refunds & Seller Payouts' },
  { key: 'FEE_RULES', label: 'Commission & Fee Rules' },
  { key: 'POLICIES_TAX', label: 'Tax / GST & Cancellation Policies' },
  { key: 'UDHARI', label: 'Udhari Oversight' },
  { key: 'SUPPORT', label: 'Support & Disputes' },
  { key: 'ROLES', label: 'Admin Users & Roles' },
  { key: 'SETTINGS', label: 'Platform Settings' },
  { key: 'AUDIT_LOGS', label: 'Audit Logs' },
];

export const AdminRolesView: React.FC = () => {
  const {
    adminUsers,
    currentAdmin,
    switchActiveAdmin,
    addAdminUser,
    updateAdminUser,
    rolePermissions,
    updateRolePermission,
    serviceAreas,
  } = useAdmin();

  const [activeTab, setActiveTab] = useState<'USERS' | 'MATRIX'>('USERS');
  const [selectedRole, setSelectedRole] = useState<AdminRole>('ADMIN_OPS');
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [formError, setFormError] = useState('');
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'ADMIN_OPS' as AdminRole,
    status: 'ACTIVE' as 'ACTIVE' | 'SUSPENDED',
    assignedVillages: ['ALL'] as string[],
  });

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const openModal = (user?: AdminUser) => {
    setFormError('');
    if (user) {
      setEditingUser(user);
      setForm({
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        status: user.status || 'ACTIVE',
        assignedVillages: user.assignedVillages || ['ALL'],
      });
    } else {
      setEditingUser(null);
      setForm({
        name: '',
        email: '',
        phone: '',
        role: 'ADMIN_OPS',
        status: 'ACTIVE',
        assignedVillages: ['ALL'],
      });
    }
    setModalOpen(true);
  };

  const handleSave = () => {
    if (!form.name.trim() || !form.email.trim() || !form.phone.trim()) {
      setFormError('Full name, email, and phone number are required.');
      return;
    }
    if (editingUser) {
      updateAdminUser(editingUser.id, {
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        role: form.role,
        status: form.status,
        assignedVillages: form.assignedVillages,
      });
      showToast(`Updated admin profile for ${form.name}`);
    } else {
      addAdminUser({
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        role: form.role,
        status: form.status,
        assignedVillages: form.assignedVillages,
      });
      showToast(`Added admin account for ${form.name}`);
    }
    setModalOpen(false);
  };

  const getRoleBadgeVariant = (role: AdminRole) => {
    if (role === 'SUPER_ADMIN') return 'success';
    if (role === 'ADMIN_OPS') return 'info';
    if (role === 'ADMIN_FINANCE') return 'warning';
    return 'neutral';
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#1F2937] flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-[#218838]" />
            Admin Users & Role Permissions (RBAC)
          </h2>
          <p className="text-sm text-[#6B7280] mt-0.5">
            Manage platform operator accounts, village scopes, and module-level View / Manage / Approve / Export privileges.
          </p>
        </div>

        <Button variant="primary" size="md" onClick={() => openModal()} leftIcon={<Plus className="w-4 h-4" />}>
          Add Admin User
        </Button>
      </div>

      {toastMsg && (
        <div className="bg-[#E8F5E9] border border-[#218838]/30 text-[#176B2C] px-4 py-3 rounded-xl text-sm font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Active Operator Banner */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#E8F5E9] text-[#176B2C] font-bold flex items-center justify-center text-sm">
            {currentAdmin.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
          </div>
          <div>
            <p className="text-xs text-[#6B7280] font-medium">Currently Logged In As</p>
            <p className="text-sm font-bold text-[#1F2937]">
              {currentAdmin.name}{' '}
              <span className="ml-1.5">
                <Badge variant={getRoleBadgeVariant(currentAdmin.role)} size="sm">
                  {ROLE_LABELS[currentAdmin.role]}
                </Badge>
              </span>
            </p>
          </div>
        </div>
        <p className="text-xs text-[#6B7280] max-w-md">
          Tip: Click <strong>Impersonate / Switch</strong> on any active admin below to test live RBAC sidebar filtering and action controls.
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-[#E5E7EB] p-4 shadow-xs">
        <Tabs
          variant="underline"
          activeTab={activeTab}
          onChange={(id) => setActiveTab(id as 'USERS' | 'MATRIX')}
          tabs={[
            { id: 'USERS', label: 'Admin Profiles', icon: <Users className="w-4 h-4" />, count: adminUsers.length },
            { id: 'MATRIX', label: 'Role Permission Matrix', icon: <KeyRound className="w-4 h-4" /> },
          ]}
        />
      </div>

      {activeTab === 'USERS' && (
        <div className="bg-white rounded-2xl border border-[#E5E7EB] overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#F8FAFC] border-b border-[#E5E7EB] text-xs font-bold uppercase tracking-wider text-[#6B7280]">
                  <th className="py-3.5 px-5">Admin Profile</th>
                  <th className="py-3.5 px-5">Assigned Role</th>
                  <th className="py-3.5 px-5">Village Scope</th>
                  <th className="py-3.5 px-5">Status</th>
                  <th className="py-3.5 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E7EB] text-sm">
                {adminUsers.map((user) => {
                  const isCurrent = user.id === currentAdmin.id;
                  const scopeLabel =
                    !user.assignedVillages || user.assignedVillages.includes('ALL')
                      ? 'All Villages'
                      : user.assignedVillages
                          .map((vid) => serviceAreas.find((v) => v.id === vid)?.name || vid)
                          .join(', ');
                  return (
                    <tr key={user.id} className="hover:bg-[#F8FAFC] transition-colors">
                      <td className="py-3.5 px-5">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-[#F1F5F9] text-[#1F2937] font-bold flex items-center justify-center text-xs">
                            {user.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-bold text-[#1F2937] flex items-center gap-2">
                              {user.name}
                              {isCurrent && <Badge variant="success" size="sm">Active Session</Badge>}
                            </p>
                            <p className="text-xs text-[#6B7280]">{user.email} • {user.phone}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-5">
                        <Badge variant={getRoleBadgeVariant(user.role)}>{ROLE_LABELS[user.role]}</Badge>
                      </td>
                      <td className="py-3.5 px-5 text-xs font-medium text-[#475569]">{scopeLabel}</td>
                      <td className="py-3.5 px-5">
                        <Badge variant={(user.status || 'ACTIVE') === 'ACTIVE' ? 'success' : 'error'} dot>
                          {user.status || 'ACTIVE'}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-5 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5">
                          {!isCurrent && (user.status || 'ACTIVE') === 'ACTIVE' && (
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => {
                                switchActiveAdmin(user.id);
                                showToast(`Switched active admin session to ${user.name} (${ROLE_LABELS[user.role]})`);
                              }}
                              leftIcon={<UserCheck className="w-3.5 h-3.5" />}
                            >
                              Switch Session
                            </Button>
                          )}
                          <Button variant="ghost" size="sm" onClick={() => openModal(user)}>
                            <Edit3 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'MATRIX' && (
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 space-y-5 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex flex-wrap gap-2">
              {(['SUPER_ADMIN', 'ADMIN_OPS', 'ADMIN_FINANCE', 'ADMIN_SUPPORT'] as AdminRole[]).map((role) => (
                <button
                  key={role}
                  type="button"
                  onClick={() => setSelectedRole(role)}
                  className={`px-4 py-2 rounded-full text-xs font-bold transition-colors cursor-pointer ${
                    selectedRole === role
                      ? 'bg-[#218838] text-white shadow-xs'
                      : 'bg-[#F1F5F9] text-[#475569] hover:bg-[#E2E8F0]'
                  }`}
                >
                  {ROLE_LABELS[role]}
                </button>
              ))}
            </div>
            {selectedRole === 'SUPER_ADMIN' && (
              <span className="text-xs font-semibold text-[#176B2C] bg-[#E8F5E9] px-3 py-1.5 rounded-full inline-flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5" /> Super Admin has immutable full access
              </span>
            )}
          </div>

          <div className="overflow-x-auto border border-[#E5E7EB] rounded-xl">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#F8FAFC] border-b border-[#E5E7EB] text-xs font-bold uppercase tracking-wider text-[#6B7280]">
                  <th className="py-3 px-4">Admin Module</th>
                  <th className="py-3 px-4 text-center">View</th>
                  <th className="py-3 px-4 text-center">Create / Edit</th>
                  <th className="py-3 px-4 text-center">Approve / Refund</th>
                  <th className="py-3 px-4 text-center">Export CSV</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E7EB] text-sm">
                {MODULE_LABELS.map((mod) => {
                  const perms = rolePermissions[selectedRole][mod.key];
                  const isSuper = selectedRole === 'SUPER_ADMIN';
                  return (
                    <tr key={mod.key} className="hover:bg-[#F8FAFC]">
                      <td className="py-3 px-4 font-semibold text-[#1F2937]">{mod.label}</td>
                      {(['view', 'manage', 'approve', 'export'] as const).map((permKey) => (
                        <td key={permKey} className="py-3 px-4 text-center">
                          <input
                            type="checkbox"
                            disabled={isSuper}
                            checked={Boolean(perms?.[permKey])}
                            onChange={(e) => updateRolePermission(selectedRole, mod.key, permKey, e.target.checked)}
                            className="w-4 h-4 accent-[#218838] cursor-pointer disabled:cursor-not-allowed"
                          />
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ADD / EDIT ADMIN MODAL */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingUser ? 'Edit Admin Profile' : 'Create Admin Account'}
        size="md"
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleSave}>Save Account</Button>
          </>
        }
      >
        <div className="space-y-4">
          {formError && <div className="p-3 rounded-xl bg-[#FEE2E2] text-[#DC2626] text-xs font-semibold">{formError}</div>}
          <Input
            label="Full Name"
            required
            placeholder="e.g., Meena Verma"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Work Email"
              required
              type="email"
              placeholder="name@grambazaar.local"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
            <Input
              label="Phone Number"
              required
              placeholder="+91 98111 22244"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Role"
              value={form.role}
              options={(Object.keys(ROLE_LABELS) as AdminRole[]).map((r) => ({
                label: ROLE_LABELS[r],
                value: r,
              }))}
              onChange={(e) => setForm({ ...form, role: e.target.value as AdminRole })}
            />
            <Select
              label="Account Status"
              value={form.status}
              options={[
                { label: 'Active', value: 'ACTIVE' },
                { label: 'Suspended', value: 'SUSPENDED' },
              ]}
              onChange={(e) => setForm({ ...form, status: e.target.value as 'ACTIVE' | 'SUSPENDED' })}
            />
          </div>
        </div>
      </Modal>
    </div>
  );
};
