import React, { useState } from 'react';
import {
  CheckCircle2,
  Edit3,
  FileText,
  Image as ImageIcon,
  Plus,
  Star,
  Trash2,
} from 'lucide-react';
import { useAdmin } from '../../contexts/AdminContext';
import { CmsBannerRecord, CmsPolicyPageRecord } from '../../types/admin';
import { Tabs } from '../../components/ui/Tabs';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { ConfirmDialog } from '../../components/feedback/ConfirmDialog';
import { VerticalBadge } from './components/VerticalBadge';

export const AdminCmsBannersView: React.FC = () => {
  const {
    cmsBanners,
    addCmsBanner,
    updateCmsBanner,
    toggleCmsBannerStatus,
    deleteCmsBanner,
    sellers,
    featuredSellerIds,
    toggleFeaturedSeller,
    cmsPolicies,
    updateCmsPolicy,
    verticalConfigs,
    serviceAreas,
    hasPermission,
  } = useAdmin();

  const canManage = hasPermission('CMS_BANNERS', 'manage');
  const [activeTab, setActiveTab] = useState<'BANNERS' | 'FEATURED' | 'POLICIES'>('BANNERS');
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Banner modal state
  const [bannerModalOpen, setBannerModalOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<CmsBannerRecord | null>(null);
  const [deleteBannerId, setDeleteBannerId] = useState<string | null>(null);
  const [bannerForm, setBannerForm] = useState({
    title: '',
    subtitle: '',
    placement: 'HERO_CAROUSEL' as CmsBannerRecord['placement'],
    targetVertical: 'ALL',
    targetVillage: 'ALL',
    ctaLabel: 'Explore Now',
    accentColor: '#218838',
    validFrom: new Date().toISOString().split('T')[0],
    validUntil: '2026-12-31',
    priority: '1',
    isActive: true,
  });

  // Policy modal state
  const [editingPolicy, setEditingPolicy] = useState<CmsPolicyPageRecord | null>(null);
  const [policyDraft, setPolicyDraft] = useState({ version: '', summary: '', content: '' });

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const openBannerModal = (banner?: CmsBannerRecord) => {
    if (banner) {
      setEditingBanner(banner);
      setBannerForm({
        title: banner.title,
        subtitle: banner.subtitle,
        placement: banner.placement,
        targetVertical: banner.targetVertical,
        targetVillage: banner.targetVillage,
        ctaLabel: banner.ctaLabel,
        accentColor: banner.accentColor,
        validFrom: banner.validFrom,
        validUntil: banner.validUntil,
        priority: String(banner.priority),
        isActive: banner.isActive,
      });
    } else {
      setEditingBanner(null);
      setBannerForm({
        title: '',
        subtitle: '',
        placement: 'HERO_CAROUSEL',
        targetVertical: 'ALL',
        targetVillage: 'ALL',
        ctaLabel: 'Explore Now',
        accentColor: '#218838',
        validFrom: new Date().toISOString().split('T')[0],
        validUntil: '2026-12-31',
        priority: String(cmsBanners.length + 1),
        isActive: true,
      });
    }
    setBannerModalOpen(true);
  };

  const handleSaveBanner = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bannerForm.title.trim()) return;
    const payload = {
      title: bannerForm.title.trim(),
      subtitle: bannerForm.subtitle.trim(),
      placement: bannerForm.placement,
      targetVertical: bannerForm.targetVertical,
      targetVillage: bannerForm.targetVillage,
      ctaLabel: bannerForm.ctaLabel.trim() || 'Shop Now',
      accentColor: bannerForm.accentColor,
      validFrom: bannerForm.validFrom,
      validUntil: bannerForm.validUntil,
      priority: Math.max(1, parseInt(bannerForm.priority, 10) || 1),
      isActive: bannerForm.isActive,
    };
    if (editingBanner) {
      updateCmsBanner(editingBanner.id, payload);
      showToast(`Updated banner "${payload.title}".`);
    } else {
      addCmsBanner(payload);
      showToast(`Published banner "${payload.title}".`);
    }
    setBannerModalOpen(false);
  };

  const openPolicyModal = (policy: CmsPolicyPageRecord) => {
    setEditingPolicy(policy);
    setPolicyDraft({
      version: policy.version,
      summary: policy.summary,
      content: policy.content,
    });
  };

  const handleSavePolicy = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPolicy) return;
    updateCmsPolicy(editingPolicy.id, policyDraft);
    showToast(`Updated ${editingPolicy.title} (${policyDraft.version}).`);
    setEditingPolicy(null);
  };

  return (
    <div className="space-y-6 animate-fade-in text-left">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <h1 className="text-xl font-black text-[#1F2937]">Home Banners, Featured Shops &amp; CMS</h1>
            <Badge variant="primary">Storefront Merchandising</Badge>
          </div>
          <p className="text-xs text-[#6B7280]">
            Manage customer home banners, village festival strips, featured store spotlights, and legal policy pages.
          </p>
        </div>

        {canManage && activeTab === 'BANNERS' && (
          <Button
            variant="primary"
            size="sm"
            onClick={() => openBannerModal()}
            leftIcon={<Plus className="w-3.5 h-3.5" />}
          >
            Add Banner
          </Button>
        )}
      </div>

      {toastMsg && (
        <div className="bg-[#E8F5E9] border border-[#218838]/30 text-[#176B2C] px-4 py-3 rounded-xl text-sm font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

      <Tabs
        activeTab={activeTab}
        onChange={(id) => setActiveTab(id as 'BANNERS' | 'FEATURED' | 'POLICIES')}
        tabs={[
          { id: 'BANNERS', label: 'Promotional Banners', count: cmsBanners.length },
          { id: 'FEATURED', label: 'Featured Stores', count: featuredSellerIds.length },
          { id: 'POLICIES', label: 'Legal & Policy Pages', count: cmsPolicies.length },
        ]}
      />

      {/* Tab 1: Banners */}
      {activeTab === 'BANNERS' && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {cmsBanners.map((b) => (
            <div
              key={b.id}
              className="bg-white rounded-2xl border border-[#E5E7EB] overflow-hidden shadow-xs flex flex-col justify-between"
            >
              <div>
                <div
                  className="p-4 text-white space-y-1.5"
                  style={{ backgroundColor: b.accentColor || '#218838' }}
                >
                  <div className="flex items-center justify-between gap-2 text-[10px] font-bold uppercase tracking-wider opacity-90">
                    <span>{b.placement.replace(/_/g, ' ')}</span>
                    <span>Priority #{b.priority}</span>
                  </div>
                  <h3 className="text-sm font-extrabold leading-snug">{b.title}</h3>
                  <p className="text-xs text-white/85 leading-relaxed">{b.subtitle}</p>
                </div>

                <div className="p-4 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[#6B7280]">Target</span>
                    <span className="font-semibold text-[#1F2937]">
                      {b.targetVertical} &middot; {b.targetVillage}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[#6B7280]">Schedule</span>
                    <span className="font-medium text-[#475569]">
                      {b.validFrom} to {b.validUntil}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[#6B7280]">Status</span>
                    <Badge variant={b.isActive ? 'success' : 'neutral'} size="sm" dot>
                      {b.isActive ? 'Live' : 'Inactive'}
                    </Badge>
                  </div>
                </div>
              </div>

              {canManage && (
                <div className="px-4 py-3 bg-[#F8FAFC] border-t border-[#E5E7EB] flex items-center justify-between">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      toggleCmsBannerStatus(b.id);
                      showToast(`Toggled "${b.title}" visibility.`);
                    }}
                  >
                    {b.isActive ? 'Pause' : 'Publish'}
                  </Button>
                  <div className="inline-flex gap-1">
                    <Button variant="ghost" size="sm" onClick={() => openBannerModal(b)}>
                      <Edit3 className="w-3.5 h-3.5" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => setDeleteBannerId(b.id)}>
                      <Trash2 className="w-3.5 h-3.5 text-[#DC2626]" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Tab 2: Featured Shops */}
      {activeTab === 'FEATURED' && (
        <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-[#F8FAFC] text-[#6B7280] uppercase font-semibold border-b border-[#E5E7EB]">
                <tr>
                  <th className="py-3.5 px-4">Shop Name</th>
                  <th className="py-3.5 px-4">Village</th>
                  <th className="py-3.5 px-4">Vertical</th>
                  <th className="py-3.5 px-4">Rating</th>
                  <th className="py-3.5 px-4">Homepage Spotlight</th>
                  {canManage && <th className="py-3.5 px-4 text-right">Action</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E7EB]">
                {sellers.map((s) => {
                  const isFeatured = featuredSellerIds.includes(s.id);
                  return (
                    <tr key={s.id} className="hover:bg-[#F8FAFC]/80">
                      <td className="py-3.5 px-4 font-bold text-[#1F2937]">{s.name}</td>
                      <td className="py-3.5 px-4">{s.villageName}</td>
                      <td className="py-3.5 px-4">
                        <VerticalBadge vertical={s.vertical} />
                      </td>
                      <td className="py-3.5 px-4 font-bold text-[#1F2937]">★ {s.rating}</td>
                      <td className="py-3.5 px-4">
                        <Badge variant={isFeatured ? 'success' : 'neutral'} size="sm">
                          {isFeatured ? 'Featured on Home' : 'Standard Listing'}
                        </Badge>
                      </td>
                      {canManage && (
                        <td className="py-3.5 px-4 text-right">
                          <Button
                            variant={isFeatured ? 'secondary' : 'primary'}
                            size="sm"
                            leftIcon={<Star className="w-3.5 h-3.5" />}
                            onClick={() => {
                              toggleFeaturedSeller(s.id);
                              showToast(
                                isFeatured
                                  ? `Removed ${s.name} from Featured Stores.`
                                  : `Pinned ${s.name} to Homepage Featured Stores.`
                              );
                            }}
                          >
                            {isFeatured ? 'Unpin' : 'Feature Shop'}
                          </Button>
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

      {/* Tab 3: Legal & Policy Pages */}
      {activeTab === 'POLICIES' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {cmsPolicies.map((pol) => (
            <div
              key={pol.id}
              className="bg-white rounded-2xl border border-[#E5E7EB] p-5 shadow-xs space-y-3 flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-sm font-bold text-[#1F2937] flex items-center gap-2">
                    <FileText className="w-4 h-4 text-[#218838]" />
                    {pol.title}
                  </h3>
                  <Badge variant="neutral" size="sm">{pol.version}</Badge>
                </div>
                <p className="text-xs font-medium text-[#475569]">{pol.summary}</p>
                <p className="text-xs text-[#6B7280] leading-relaxed bg-[#F8FAFC] p-3 rounded-xl border border-[#E5E7EB]">
                  {pol.content}
                </p>
              </div>

              <div className="pt-2 flex items-center justify-between text-[11px] text-[#6B7280]">
                <span>
                  Updated {pol.updatedAt} by {pol.updatedBy}
                </span>
                {canManage && (
                  <Button
                    variant="secondary"
                    size="sm"
                    leftIcon={<Edit3 className="w-3.5 h-3.5" />}
                    onClick={() => openPolicyModal(pol)}
                  >
                    Edit Page
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Banner Modal */}
      <Modal
        isOpen={bannerModalOpen}
        onClose={() => setBannerModalOpen(false)}
        title={editingBanner ? 'Edit Promotional Banner' : 'Create Homepage Banner'}
        size="md"
      >
        <form onSubmit={handleSaveBanner} className="space-y-4 text-left">
          <Input
            label="Banner Headline"
            value={bannerForm.title}
            onChange={(e) => setBannerForm({ ...bannerForm, title: e.target.value })}
            placeholder="e.g. Fresh Winter Produce Festival"
            required
          />
          <Input
            label="Subtitle / Offer Copy"
            value={bannerForm.subtitle}
            onChange={(e) => setBannerForm({ ...bannerForm, subtitle: e.target.value })}
            placeholder="Short description shown on customer home banner"
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Select
              label="Placement"
              value={bannerForm.placement}
              onChange={(e) =>
                setBannerForm({ ...bannerForm, placement: e.target.value as CmsBannerRecord['placement'] })
              }
              options={[
                { value: 'HERO_CAROUSEL', label: 'Hero Carousel' },
                { value: 'MID_PROMO', label: 'Mid-Page Promo Banner' },
                { value: 'FESTIVAL_STRIP', label: 'Festival Announcement Strip' },
              ]}
            />
            <Select
              label="Target Vertical"
              value={bannerForm.targetVertical}
              onChange={(e) => setBannerForm({ ...bannerForm, targetVertical: e.target.value })}
              options={[
                { value: 'ALL', label: 'All Verticals' },
                ...verticalConfigs.map((v) => ({ value: v.id, label: v.name })),
              ]}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Select
              label="Target Village"
              value={bannerForm.targetVillage}
              onChange={(e) => setBannerForm({ ...bannerForm, targetVillage: e.target.value })}
              options={[
                { value: 'ALL', label: 'All Villages' },
                ...serviceAreas.map((a) => ({ value: a.name, label: a.name })),
              ]}
            />
            <Input
              label="CTA Button Label"
              value={bannerForm.ctaLabel}
              onChange={(e) => setBannerForm({ ...bannerForm, ctaLabel: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <Input
              label="Valid From"
              type="date"
              value={bannerForm.validFrom}
              onChange={(e) => setBannerForm({ ...bannerForm, validFrom: e.target.value })}
            />
            <Input
              label="Valid Until"
              type="date"
              value={bannerForm.validUntil}
              onChange={(e) => setBannerForm({ ...bannerForm, validUntil: e.target.value })}
            />
            <Input
              label="Priority"
              type="number"
              min="1"
              value={bannerForm.priority}
              onChange={(e) => setBannerForm({ ...bannerForm, priority: e.target.value })}
            />
          </div>
          <div className="flex justify-end gap-2 pt-3 border-t border-[#E5E7EB]">
            <Button variant="secondary" size="sm" type="button" onClick={() => setBannerModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit" leftIcon={<ImageIcon className="w-3.5 h-3.5" />}>
              {editingBanner ? 'Save Changes' : 'Publish Banner'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Policy Edit Modal */}
      <Modal
        isOpen={Boolean(editingPolicy)}
        onClose={() => setEditingPolicy(null)}
        title={editingPolicy ? `Edit ${editingPolicy.title}` : 'Edit Policy'}
        size="lg"
      >
        <form onSubmit={handleSavePolicy} className="space-y-4 text-left">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Input
              label="Version"
              value={policyDraft.version}
              onChange={(e) => setPolicyDraft({ ...policyDraft, version: e.target.value })}
              required
            />
            <div className="sm:col-span-2">
              <Input
                label="Short Summary"
                value={policyDraft.summary}
                onChange={(e) => setPolicyDraft({ ...policyDraft, summary: e.target.value })}
                required
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-[#1F2937] block mb-1.5">
              Policy Body Content
            </label>
            <textarea
              rows={6}
              value={policyDraft.content}
              onChange={(e) => setPolicyDraft({ ...policyDraft, content: e.target.value })}
              className="w-full p-3 text-xs border border-[#E5E7EB] rounded-xl focus:outline-none focus:border-[#218838]"
              required
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" size="sm" type="button" onClick={() => setEditingPolicy(null)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit">
              Publish Revision
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={Boolean(deleteBannerId)}
        onClose={() => setDeleteBannerId(null)}
        onConfirm={() => {
          if (deleteBannerId) {
            deleteCmsBanner(deleteBannerId);
            showToast('Deleted banner.');
          }
          setDeleteBannerId(null);
        }}
        title="Delete Promotional Banner?"
        message="This banner will immediately be removed from the customer storefront schedule."
        confirmText="Delete Banner"
        isDestructive
      />
    </div>
  );
};
