/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useMemo, useState } from 'react';
import {
  X,
  ZoomIn,
  ZoomOut,
  RotateCw,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  FileText,
  ShieldCheck,
  CreditCard,
  Building,
  Copy,
  Check,
  Sprout,
  Briefcase,
} from 'lucide-react';
import { KycDocCode, SellerApplication } from '../../../types/admin';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';

export type KycDocType = KycDocCode;

interface DocumentPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  application: SellerApplication | null;
  initialDocType?: KycDocType;
  requiredDocs?: KycDocCode[];
  onToggleVerified?: (applicationId: string, docCode: KycDocCode) => void;
}

export const DocumentPreviewModal: React.FC<DocumentPreviewModalProps> = ({
  isOpen,
  onClose,
  application,
  initialDocType = 'AADHAAR',
  requiredDocs,
  onToggleVerified,
}) => {
  const [activeDoc, setActiveDoc] = useState<KycDocType>(initialDocType);
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [rotation, setRotation] = useState<number>(0);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    setActiveDoc(initialDocType);
    setZoomLevel(100);
    setRotation(0);
  }, [initialDocType, application?.id, isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  const docTabs = useMemo(() => {
    if (!application) return [];
    const codes: KycDocCode[] = requiredDocs?.length
      ? requiredDocs
      : application.vertical === 'FOOD'
      ? ['FSSAI', 'AADHAAR', 'PAN', 'STORE_PHOTO']
      : application.vertical === 'AGRICULTURE'
      ? ['AGRI_LICENSE', 'AADHAAR', 'PAN', 'STORE_PHOTO']
      : ['GST_TRADE', 'AADHAAR', 'PAN', 'STORE_PHOTO'];

    const map: Record<KycDocCode, { label: string; icon: React.ReactNode; docNumber: string }> = {
      FSSAI: {
        label: 'FSSAI License',
        icon: <ShieldCheck className="w-4 h-4" />,
        docNumber: application.fssaiNumber || 'Pending Upload',
      },
      AGRI_LICENSE: {
        label: 'Agri Input License',
        icon: <Sprout className="w-4 h-4" />,
        docNumber: application.agriLicenseNumber || 'Pending Upload',
      },
      GST_TRADE: {
        label: 'GST / Trade License',
        icon: <Briefcase className="w-4 h-4" />,
        docNumber: application.gstOrTradeNumber || 'Shop Act Registered',
      },
      AADHAAR: {
        label: 'Aadhaar Card',
        icon: <FileText className="w-4 h-4" />,
        docNumber: application.aadhaarMasked || 'XXXX-XXXX-0000',
      },
      PAN: {
        label: 'PAN Card',
        icon: <CreditCard className="w-4 h-4" />,
        docNumber: application.panNumber || 'Not Provided',
      },
      STORE_PHOTO: {
        label: 'Storefront Photo',
        icon: <Building className="w-4 h-4" />,
        docNumber: `${application.villageName.toUpperCase()}-GEO-AUDIT`,
      },
    };

    return codes.map((code) => ({ id: code, ...map[code] }));
  }, [application, requiredDocs]);

  if (!isOpen || !application) return null;

  const currentTab = docTabs.find((t) => t.id === activeDoc) || docTabs[0];
  const isCurrentVerified = Boolean(application.verifiedDocs?.[currentTab.id]);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/80 backdrop-blur-xs animate-fade-in text-left"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="bg-white w-full max-w-5xl h-[92vh] max-h-[850px] rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-slate-700"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Bar */}
        <div className="bg-slate-900 text-white px-5 py-3.5 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#218838] flex items-center justify-center text-white">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm text-white">
                  KYC Lightbox: {application.businessName}
                </h3>
                <Badge variant="primary" size="sm">
                  {application.vertical}
                </Badge>
              </div>
              <p className="text-[11px] text-slate-400">
                Applicant: {application.applicantName} • Village: {application.villageName}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            title="Close modal (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection Row & Controls */}
        <div className="bg-[#F8FAFC] px-5 py-2.5 border-b border-[#E5E7EB] flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {docTabs.map((tab) => {
              const isSelected = currentTab.id === tab.id;
              const isVerified = Boolean(application.verifiedDocs?.[tab.id]);
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveDoc(tab.id);
                    setZoomLevel(100);
                    setRotation(0);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
                    isSelected
                      ? 'bg-[#218838] text-white shadow-xs'
                      : 'bg-white text-[#475569] border border-[#E5E7EB] hover:bg-slate-100'
                  }`}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                  <span
                    className={`w-2 h-2 rounded-full ${isVerified ? 'bg-emerald-400' : 'bg-amber-400'}`}
                    title={isVerified ? 'Verified' : 'Pending'}
                  />
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-1.5 bg-white border border-[#E5E7EB] px-2 py-1 rounded-xl shadow-2xs">
            <button
              onClick={() => setZoomLevel((p) => Math.max(p - 20, 60))}
              className="p-1.5 rounded-lg text-[#6B7280] hover:text-[#1F2937] hover:bg-slate-100 cursor-pointer"
              title="Zoom out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="text-xs font-mono font-bold text-[#1F2937] min-w-[42px] text-center">
              {zoomLevel}%
            </span>
            <button
              onClick={() => setZoomLevel((p) => Math.min(p + 20, 200))}
              className="p-1.5 rounded-lg text-[#6B7280] hover:text-[#1F2937] hover:bg-slate-100 cursor-pointer"
              title="Zoom in"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <div className="h-4 w-px bg-[#E5E7EB] mx-1" />
            <button
              onClick={() => setRotation((p) => (p + 90) % 360)}
              className="p-1.5 rounded-lg text-[#6B7280] hover:text-[#1F2937] hover:bg-slate-100 cursor-pointer"
              title="Rotate 90 degrees"
            >
              <RotateCw className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                setZoomLevel(100);
                setRotation(0);
              }}
              className="p-1.5 rounded-lg text-[#6B7280] hover:text-[#1F2937] hover:bg-slate-100 cursor-pointer"
              title="Reset view"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Document Viewing Canvas */}
        <div className="flex-1 bg-slate-200/80 overflow-auto p-4 sm:p-8 flex items-center justify-center relative select-none">
          <div
            style={{
              transform: `scale(${zoomLevel / 100}) rotate(${rotation}deg)`,
              transition: 'transform 0.15s ease-out',
            }}
            className="origin-center shadow-2xl rounded-lg overflow-hidden bg-white max-w-2xl w-full border border-slate-300"
          >
            {currentTab.id === 'FSSAI' && (
              <div className="p-8 bg-[#FFFFFA] border-8 border-double border-emerald-900/30 text-[#1F2937] space-y-5 font-serif">
                <div className="text-center border-b-2 border-emerald-800/20 pb-4 space-y-1">
                  <div className="inline-block px-3 py-1 bg-emerald-800 text-white rounded font-sans text-[11px] font-bold tracking-widest uppercase mb-1">
                    Food Safety and Standards Authority of India
                  </div>
                  <h4 className="text-xl font-bold text-emerald-950">
                    Registration Certificate under FSS Act, 2006
                  </h4>
                </div>
                <div className="grid grid-cols-2 gap-4 text-xs font-sans">
                  <div className="p-3 bg-emerald-50/60 rounded border border-emerald-200">
                    <span className="text-[10px] text-emerald-800 font-semibold block uppercase">FSSAI License No:</span>
                    <span className="font-mono font-black text-sm">{application.fssaiNumber || 'Not Provided'}</span>
                  </div>
                  <div className="p-3 bg-emerald-50/60 rounded border border-emerald-200">
                    <span className="text-[10px] text-emerald-800 font-semibold block uppercase">Premises:</span>
                    <span className="font-semibold">Village {application.villageName}, UP</span>
                  </div>
                </div>
                <div className="space-y-2 text-xs font-sans">
                  <p><strong>FBO Name:</strong> {application.businessName}</p>
                  <p><strong>Authorized Person:</strong> {application.applicantName}</p>
                  <p><strong>Contact:</strong> {application.phone}</p>
                </div>
              </div>
            )}

            {(currentTab.id === 'AGRI_LICENSE' || currentTab.id === 'GST_TRADE') && (
              <div className="p-8 bg-[#F8FAFC] border-4 border-emerald-900/20 text-[#1F2937] space-y-5">
                <div className="border-b border-[#E5E7EB] pb-4">
                  <Badge variant="primary" size="sm">
                    {currentTab.id === 'AGRI_LICENSE' ? 'Department of Agriculture' : 'Trade & Commercial Registration'}
                  </Badge>
                  <h4 className="text-lg font-black mt-2">{currentTab.label}</h4>
                  <p className="text-xs text-[#6B7280] mt-0.5">
                    Registered Business: <strong>{application.businessName}</strong>
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div className="p-3 bg-white rounded-xl border border-[#E5E7EB]">
                    <span className="text-[10px] uppercase text-[#6B7280] block">Certificate / Registration ID</span>
                    <span className="font-mono font-bold text-sm">{currentTab.docNumber}</span>
                  </div>
                  <div className="p-3 bg-white rounded-xl border border-[#E5E7EB]">
                    <span className="text-[10px] uppercase text-[#6B7280] block">Proprietor & Village</span>
                    <span className="font-bold">{application.applicantName} ({application.villageName})</span>
                  </div>
                </div>
              </div>
            )}

            {currentTab.id === 'AADHAAR' && (
              <div className="p-8 bg-gradient-to-b from-orange-50/60 via-white to-emerald-50/60 text-[#1F2937] space-y-5">
                <div className="flex items-center justify-between border-b-2 border-red-700/50 pb-3">
                  <span className="text-xs font-bold">भारत सरकार • Government of India</span>
                  <span className="text-xs font-bold text-red-800">UIDAI Masked KYC</span>
                </div>
                <div className="space-y-1.5 text-xs">
                  <p><strong>Name:</strong> {application.applicantName}</p>
                  <p><strong>Village:</strong> {application.villageName}, District Unnao, UP</p>
                  <p><strong>Phone:</strong> {application.phone}</p>
                </div>
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-center">
                  <p className="text-base font-mono font-black tracking-widest text-red-900">
                    {application.aadhaarMasked || 'XXXX-XXXX-0000'}
                  </p>
                </div>
              </div>
            )}

            {currentTab.id === 'PAN' && (
              <div className="p-8 bg-sky-50/60 text-[#1F2937] space-y-4">
                <div className="flex items-center justify-between border-b border-sky-300 pb-2 text-xs font-bold text-sky-950">
                  <span>INCOME TAX DEPARTMENT</span>
                  <span>GOVT. OF INDIA</span>
                </div>
                <div className="space-y-2 text-xs">
                  <div>
                    <span className="text-[10px] text-[#6B7280] uppercase">Permanent Account Number</span>
                    <p className="font-mono font-black text-base tracking-wider">{application.panNumber || 'Not Provided'}</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#6B7280] uppercase">Cardholder Name</span>
                    <p className="font-bold">{application.applicantName.toUpperCase()}</p>
                  </div>
                </div>
              </div>
            )}

            {currentTab.id === 'STORE_PHOTO' && (
              <div className="p-6 bg-slate-900 text-white space-y-4">
                <div className="flex items-center justify-between text-xs text-slate-300 border-b border-slate-700 pb-2">
                  <span>Physical Field Audit / Storefront Facade</span>
                  <span className="font-mono text-emerald-400">Village: {application.villageName}</span>
                </div>
                <div className="rounded-lg border border-slate-700 bg-slate-800 h-56 flex flex-col items-center justify-center p-6 text-center">
                  <Building className="w-14 h-14 text-slate-500 mb-2" />
                  <p className="font-bold text-lg">{application.businessName}</p>
                  <p className="text-xs text-slate-400">
                    {application.businessType?.replace(/_/g, ' ') || application.vertical} • {application.villageName}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="bg-white px-5 py-3 border-t border-[#E5E7EB] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3 flex-wrap">
            <div>
              <span className="text-[#6B7280]">Document Reference:</span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="font-mono font-bold text-[#1F2937]">{currentTab.docNumber}</span>
                <button
                  onClick={() => handleCopy(currentTab.docNumber, currentTab.id)}
                  className="p-1 text-[#6B7280] hover:text-[#218838] cursor-pointer"
                  title="Copy document number"
                >
                  {copiedId === currentTab.id ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <div className="h-6 w-px bg-[#E5E7EB]" />

            <div>
              <span className="text-[#6B7280]">Verification Status:</span>
              <div className="mt-0.5">
                {isCurrentVerified ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    <CheckCircle2 className="w-3 h-3 text-[#16A34A]" /> Verified & Saved
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                    <AlertTriangle className="w-3 h-3 text-amber-500" /> Pending Verification
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onToggleVerified && (
              <Button
                variant={isCurrentVerified ? 'secondary' : 'primary'}
                size="sm"
                onClick={() => onToggleVerified(application.id, currentTab.id)}
                leftIcon={<CheckCircle2 className="w-3.5 h-3.5" />}
              >
                {isCurrentVerified ? 'Mark Pending' : 'Verify Document'}
              </Button>
            )}
            <Button variant="secondary" size="sm" onClick={onClose}>
              Done
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
