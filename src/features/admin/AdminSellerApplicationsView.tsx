/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useState } from 'react';
import {
  CheckCircle,
  FileText,
  Eye,
  Check,
  ShieldCheck,
  Search,
  UserCheck,
} from 'lucide-react';
import { useAdmin } from '../../contexts/AdminContext';
import { SellerApplication, ApplicationStatus, KycDocCode } from '../../types/admin';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Drawer } from '../../components/ui/Drawer';
import { EmptyState } from '../../components/feedback/EmptyState';
import { VerticalBadge } from './components/VerticalBadge';
import { DocumentPreviewModal, KycDocType } from './components/DocumentPreviewModal';

const DOC_LABELS: Record<KycDocCode, string> = {
  FSSAI: 'FSSAI License',
  AADHAAR: 'Aadhaar (Masked)',
  PAN: 'PAN Card',
  STORE_PHOTO: 'Storefront Photo',
  GST_TRADE: 'GST / Trade License',
  AGRI_LICENSE: 'Agri Input License',
};

export const AdminSellerApplicationsView: React.FC = () => {
  const {
    applications,
    verticalConfigs,
    reviewApplication,
    toggleApplicationDocVerified,
    hasPermission,
  } = useAdmin();

  const canApprove = hasPermission('APPLICATIONS', 'approve');
  const [statusFilter, setStatusFilter] = useState<'ALL' | ApplicationStatus>('ALL');
  const [verticalFilter, setVerticalFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAppId, setSelectedAppId] = useState<string | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [reviewError, setReviewError] = useState('');
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  // Lightbox state
  const [previewDocModalOpen, setPreviewDocModalOpen] = useState(false);
  const [previewInitialDoc, setPreviewInitialDoc] = useState<KycDocType>('AADHAAR');

  const selectedApp = useMemo(
    () => applications.find((a) => a.id === selectedAppId) || null,
    [applications, selectedAppId]
  );

  const getRequiredDocs = (app: SellerApplication): KycDocCode[] => {
    const vCfg = verticalConfigs.find((v) => v.id === app.vertical);
    if (vCfg?.requiredKycDocs?.length) return vCfg.requiredKycDocs;
    return app.vertical === 'FOOD'
      ? ['FSSAI', 'AADHAAR', 'PAN', 'STORE_PHOTO']
      : ['AADHAAR', 'PAN', 'STORE_PHOTO'];
  };

  const openDocPreview = (docType: KycDocType) => {
    setPreviewInitialDoc(docType);
    setPreviewDocModalOpen(true);
  };

  const filteredApps = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return applications.filter((app) => {
      const matchS = statusFilter === 'ALL' || app.status === statusFilter;
      const matchV =
        verticalFilter === 'ALL' ||
        app.vertical === verticalFilter ||
        Boolean(app.supportedVerticals?.includes(verticalFilter));
      const matchQ =
        !q ||
        app.businessName.toLowerCase().includes(q) ||
        app.applicantName.toLowerCase().includes(q) ||
        app.villageName.toLowerCase().includes(q) ||
        app.phone.includes(q);
      return matchS && matchV && matchQ;
    });
  }, [applications, statusFilter, verticalFilter, searchQuery]);

  const handleDecision = (status: ApplicationStatus) => {
    if (!selectedApp) return;
    if ((status === 'REJECTED' || status === 'CHANGES_REQUESTED') && !reviewNotes.trim()) {
      setReviewError('Please provide mandatory review notes explaining the rejection or required changes.');
      return;
    }

    const res = reviewApplication(
      selectedApp.id,
      status,
      reviewNotes.trim() || `Approved on ${new Date().toLocaleDateString()}`
    );

    if (res.success) {
      setFeedbackMsg(res.message);
      setSelectedAppId(null);
      setReviewNotes('');
      setReviewError('');
      setTimeout(() => setFeedbackMsg(null), 4000);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in text-left">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <h1 className="text-xl font-black text-[#1F2937]">Seller Applications & Vertical KYC Review</h1>
            <Badge variant="primary">Conditional KYC Engine</Badge>
          </div>
          <p className="text-xs text-[#6B7280]">
            Verify vertical-specific licenses (FSSAI for Food, Agri License for Seeds, GST/Trade for Retail) and bank payout credentials.
          </p>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto">
          {(['ALL', 'PENDING_REVIEW', 'APPROVED', 'CHANGES_REQUESTED', 'REJECTED'] as const).map(
            (status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap cursor-pointer transition-colors ${
                  statusFilter === status
                    ? 'bg-[#218838] text-white'
                    : 'bg-[#F1F5F9] text-[#475569] hover:bg-[#E2E8F0]'
                }`}
              >
                {status.replace('_', ' ')}
              </button>
            )
          )}
        </div>
      </div>

      {/* Search & Vertical Filter */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] p-4 flex flex-col sm:flex-row gap-3 shadow-xs">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-[#6B7280] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search business name, applicant, phone, or village..."
            className="w-full h-10 pl-10 pr-4 bg-[#F8FAFC] border border-[#E5E7EB] rounded-xl text-xs text-[#1F2937] outline-none focus:border-[#218838] focus:bg-white"
          />
        </div>
        <select
          value={verticalFilter}
          onChange={(e) => setVerticalFilter(e.target.value)}
          className="h-10 px-3 bg-[#F8FAFC] border border-[#E5E7EB] rounded-xl text-xs text-[#1F2937] outline-none focus:border-[#218838] cursor-pointer sm:w-56"
        >
          <option value="ALL">All Verticals</option>
          {verticalConfigs.map((v) => (
            <option key={v.id} value={v.id}>{v.name}</option>
          ))}
        </select>
      </div>

      {feedbackMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold rounded-xl flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-[#16A34A]" />
          <span>{feedbackMsg}</span>
        </div>
      )}

      {/* Applications Table */}
      {filteredApps.length === 0 ? (
        <EmptyState
          icon={<UserCheck className="w-7 h-7" />}
          title="No seller applications found"
          description="All matching seller onboarding applications have been processed or filtered out."
        />
      ) : (
        <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-[#F8FAFC] text-[#6B7280] uppercase tracking-wider font-semibold border-b border-[#E5E7EB]">
                <tr>
                  <th className="py-3.5 px-4">Business / Applicant</th>
                  <th className="py-3.5 px-4">Village</th>
                  <th className="py-3.5 px-4">Verticals & Type</th>
                  <th className="py-3.5 px-4">KYC Progress</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E7EB]">
                {filteredApps.map((app) => {
                  const reqDocs = getRequiredDocs(app);
                  const verifiedCount = reqDocs.filter((d) => app.verifiedDocs?.[d]).length;
                  const verts = app.supportedVerticals?.length ? app.supportedVerticals : [app.vertical];

                  return (
                    <tr key={app.id} className="hover:bg-[#F8FAFC]/80 transition-colors">
                      <td className="py-3.5 px-4">
                        <p className="font-bold text-[#1F2937]">{app.businessName}</p>
                        <p className="text-[11px] text-[#6B7280]">{app.applicantName} • {app.phone}</p>
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-[#1F2937]">{app.villageName}</td>
                      <td className="py-3.5 px-4">
                        <div className="flex flex-wrap gap-1">
                          {verts.map((v) => (
                            <VerticalBadge key={v} vertical={v} />
                          ))}
                        </div>
                        {app.businessType && (
                          <span className="text-[10px] text-[#6B7280] mt-1 block">
                            {app.businessType.replace(/_/g, ' ')}
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-semibold text-[#1F2937]">
                          {verifiedCount} / {reqDocs.length} Docs Verified
                        </span>
                        <div className="w-28 h-1.5 bg-[#E2E8F0] rounded-full mt-1 overflow-hidden">
                          <div
                            className="h-full bg-[#218838] rounded-full"
                            style={{ width: `${Math.round((verifiedCount / Math.max(1, reqDocs.length)) * 100)}%` }}
                          />
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <Badge
                          variant={
                            app.status === 'APPROVED'
                              ? 'success'
                              : app.status === 'PENDING_REVIEW'
                              ? 'warning'
                              : 'error'
                          }
                          size="sm"
                          dot
                        >
                          {app.status.replace('_', ' ')}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => {
                            setSelectedAppId(app.id);
                            setReviewNotes(app.reviewNotes || '');
                            setReviewError('');
                          }}
                          leftIcon={<Eye className="w-3.5 h-3.5" />}
                        >
                          Inspect KYC
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* KYC Inspection Drawer */}
      <Drawer
        isOpen={Boolean(selectedApp)}
        onClose={() => setSelectedAppId(null)}
        title={selectedApp ? `KYC Dossier: ${selectedApp.businessName}` : 'KYC Review'}
        width="max-w-lg"
      >
        {selectedApp && (
          <div className="space-y-6 text-left">
            <div className="p-4 bg-[#F8FAFC] rounded-xl border border-[#E5E7EB] flex items-center justify-between">
              <div>
                <p className="text-xs text-[#6B7280]">Application ID</p>
                <p className="text-sm font-mono font-bold text-[#1F2937]">{selectedApp.id}</p>
              </div>
              <Badge
                variant={
                  selectedApp.status === 'APPROVED'
                    ? 'success'
                    : selectedApp.status === 'PENDING_REVIEW'
                    ? 'warning'
                    : 'error'
                }
              >
                {selectedApp.status.replace('_', ' ')}
              </Badge>
            </div>

            {/* Merchant Identity */}
            <div className="space-y-2.5">
              <h4 className="text-xs font-bold text-[#6B7280] uppercase tracking-wider">
                1. Merchant Identity & Multi-Vertical Scope
              </h4>
              <div className="grid grid-cols-2 gap-3 text-xs bg-white p-3.5 rounded-xl border border-[#E5E7EB]">
                <div>
                  <span className="text-[#6B7280]">Owner:</span>
                  <p className="font-bold text-[#1F2937]">{selectedApp.applicantName}</p>
                </div>
                <div>
                  <span className="text-[#6B7280]">Phone:</span>
                  <p className="font-bold text-[#1F2937]">{selectedApp.phone}</p>
                </div>
                <div>
                  <span className="text-[#6B7280]">Village:</span>
                  <p className="font-bold text-[#1F2937]">{selectedApp.villageName}</p>
                </div>
                <div>
                  <span className="text-[#6B7280]">Business Type:</span>
                  <p className="font-bold text-[#1F2937]">
                    {(selectedApp.businessType || 'STORE').replace(/_/g, ' ')}
                  </p>
                </div>
                <div className="col-span-2">
                  <span className="text-[#6B7280] block mb-1">Requested Verticals:</span>
                  <div className="flex flex-wrap gap-1">
                    {(selectedApp.supportedVerticals || [selectedApp.vertical]).map((v) => (
                      <VerticalBadge key={v} vertical={v} />
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Conditional KYC Documents */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-[#6B7280] uppercase tracking-wider">
                  2. Required Compliance Documents ({selectedApp.vertical})
                </h4>
                <span className="text-[10px] text-[#218838] font-bold">
                  {getRequiredDocs(selectedApp).filter((d) => selectedApp.verifiedDocs?.[d]).length}/
                  {getRequiredDocs(selectedApp).length} Verified
                </span>
              </div>

              <div className="space-y-2">
                {getRequiredDocs(selectedApp).map((docCode) => {
                  const isVerified = Boolean(selectedApp.verifiedDocs?.[docCode]);
                  return (
                    <div
                      key={docCode}
                      className="p-3 bg-[#F8FAFC] rounded-xl border border-[#E5E7EB] flex items-center justify-between gap-2"
                    >
                      <div className="flex items-center gap-2.5">
                        {isVerified ? (
                          <ShieldCheck className="w-4 h-4 text-[#16A34A]" />
                        ) : (
                          <FileText className="w-4 h-4 text-[#D97706]" />
                        )}
                        <div>
                          <p className="text-xs font-bold text-[#1F2937]">{DOC_LABELS[docCode]}</p>
                          <p className="text-[11px] text-[#6B7280]">
                            {isVerified ? 'Verified & Logged' : 'Pending inspection'}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => openDocPreview(docCode)}
                        leftIcon={<Eye className="w-3.5 h-3.5" />}
                      >
                        Inspect
                      </Button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Bank Details */}
            <div className="space-y-2.5">
              <h4 className="text-xs font-bold text-[#6B7280] uppercase tracking-wider">
                3. Payout Bank Account Details
              </h4>
              <div className="grid grid-cols-2 gap-3 text-xs bg-white p-3.5 rounded-xl border border-[#E5E7EB]">
                <div>
                  <span className="text-[#6B7280]">Account Holder:</span>
                  <p className="font-bold text-[#1F2937]">{selectedApp.bankAccountHolder}</p>
                </div>
                <div>
                  <span className="text-[#6B7280]">IFSC Code:</span>
                  <p className="font-mono font-bold text-[#1F2937]">{selectedApp.ifscCode}</p>
                </div>
                <div className="col-span-2">
                  <span className="text-[#6B7280]">Account Number:</span>
                  <p className="font-mono font-bold text-[#1F2937]">{selectedApp.bankAccountNumber}</p>
                </div>
              </div>
            </div>

            {/* Review Notes */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-[#1F2937] block">
                Official Review Notes & Audit Remarks
              </label>
              {reviewError && (
                <div className="p-2.5 bg-[#FEE2E2] text-[#DC2626] text-xs font-semibold rounded-xl">
                  {reviewError}
                </div>
              )}
              <textarea
                value={reviewNotes}
                onChange={(e) => {
                  setReviewNotes(e.target.value);
                  setReviewError('');
                }}
                rows={3}
                placeholder="Enter audit remarks or required corrections..."
                className="w-full p-3 text-xs bg-[#F8FAFC] border border-[#E5E7EB] rounded-xl outline-none focus:border-[#218838]"
              />
            </div>

            {canApprove && (
              <div className="pt-4 border-t border-[#E5E7EB] flex flex-wrap items-center justify-end gap-2.5">
                <Button variant="secondary" size="sm" onClick={() => handleDecision('CHANGES_REQUESTED')}>
                  Request Changes
                </Button>
                <Button variant="destructive" size="sm" onClick={() => handleDecision('REJECTED')}>
                  Reject KYC
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => handleDecision('APPROVED')}
                  leftIcon={<Check className="w-3.5 h-3.5" />}
                >
                  Approve & Activate Shop
                </Button>
              </div>
            )}
          </div>
        )}
      </Drawer>

      <DocumentPreviewModal
        isOpen={previewDocModalOpen}
        onClose={() => setPreviewDocModalOpen(false)}
        application={selectedApp}
        initialDocType={previewInitialDoc}
        requiredDocs={selectedApp ? getRequiredDocs(selectedApp) : undefined}
        onToggleVerified={canApprove ? toggleApplicationDocVerified : undefined}
      />
    </div>
  );
};
