/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useMemo, useState } from 'react';
import {
  Ban,
  Building2,
  Calendar,
  CheckCircle,
  CheckCircle2,
  Clock,
  Download,
  Eye,
  FileWarning,
  Filter,
  MapPin,
  PauseCircle,
  Phone,
  Play,
  RefreshCcw,
  RotateCcw,
  Search,
  ShieldCheck,
  Star,
  Store,
  UserCheck,
  XCircle,
} from 'lucide-react';
import { useAdmin } from '../../contexts/AdminContext';
import { useOrders } from '../../contexts/OrderContext';
import { MasterSellerRecord } from '../../types/admin';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { EmptyState } from '../../components/feedback/EmptyState';
import { Pagination } from '../../components/data-display/Pagination';
import { Breadcrumbs } from '../../components/layout/Breadcrumbs';
import { VerticalBadge } from './components/VerticalBadge';
import { formatINR } from '../../utils/currency';
import { exportToCsv } from '../../utils/exportCsv';
import {
  KYC_STATUS_META,
  SELLER_STATUS_META,
  SellerDatePreset,
  computeSellerFinancialSummary,
  computeSellerOrderMetrics,
  getResolvedKycStatus,
  getSellerOrders,
  getSellerPayouts,
  getSellerRefunds,
  matchesSellerDateRange,
  sellerHasPendingDocuments,
} from './components/sellers/seller360Helpers';
import { Seller360Drawer } from './components/sellers/Seller360Drawer';
import {
  SellerGovernanceActionType,
  SellerGovernanceModal,
} from './components/sellers/SellerActionModals';

type StoreStatusFilterValue =
  | 'ALL'
  | 'ACTIVE'
  | 'INACTIVE_SUSPENDED'
  | 'PENDING_APPROVAL'
  | 'KYC_PENDING'
  | 'KYC_UNDER_REVIEW'
  | 'APPROVED'
  | 'INACTIVE'
  | 'SUSPENDED'
  | 'REJECTED';

type KycFilterValue =
  | 'ALL'
  | 'PENDING_ALL'
  | 'PENDING'
  | 'UNDER_REVIEW'
  | 'CHANGES_REQUESTED'
  | 'APPROVED'
  | 'REJECTED';

type PerformanceFilterValue = 'ALL' | 'TOP_RATED' | 'HIGH_GMV' | 'NEEDS_ATTENTION';

const PAGE_SIZE = 6;

const formatShortDate = (iso?: string): string => {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

export const AdminSellerDirectoryView: React.FC = () => {
  const {
    sellers,
    verticalConfigs,
    serviceAreas,
    payouts,
    refundLedger,
    updateSellerStatus,
    requestSellerKycChanges,
    hasPermission,
  } = useAdmin();
  const { orders } = useOrders();

  const canManage = hasPermission('SELLERS', 'manage');

  // Filter & pagination state
  const [searchQuery, setSearchQuery] = useState('');
  const [villageFilter, setVillageFilter] = useState<string>('ALL');
  const [verticalFilter, setVerticalFilter] = useState<string>('ALL');
  const [kycFilter, setKycFilter] = useState<KycFilterValue>('ALL');
  const [statusFilter, setStatusFilter] = useState<StoreStatusFilterValue>('ALL');
  const [datePreset, setDatePreset] = useState<SellerDatePreset>('ALL');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [performanceFilter, setPerformanceFilter] = useState<PerformanceFilterValue>('ALL');
  const [pendingDocsOnly, setPendingDocsOnly] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  // Active drawer, governance modal, and toast feedback
  const [selectedSellerId, setSelectedSellerId] = useState<string | null>(null);
  const [governanceTarget, setGovernanceTarget] = useState<{
    seller: MasterSellerRecord;
    action: SellerGovernanceActionType;
  } | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const showFeedback = (msg: string) => {
    setFeedback(msg);
    setTimeout(() => setFeedback(null), 4000);
  };

  const selectedSeller = useMemo(
    () => (selectedSellerId ? sellers.find((s) => s.id === selectedSellerId) || null : null),
    [sellers, selectedSellerId]
  );

  // Precompute financial & order summary per seller from live state
  const sellerMetricsMap = useMemo(() => {
    const map = new Map<
      string,
      {
        displayOrders: number;
        totalSalesPaise: number;
        pendingSettlementPaise: number;
        kycStatus: ReturnType<typeof getResolvedKycStatus>;
        hasPendingDocs: boolean;
        pendingDocsCount: number;
      }
    >();

    for (const seller of sellers) {
      const sOrders = getSellerOrders(seller, orders);
      const sOrderIds = new Set(sOrders.map((o) => o.id));
      const sPayouts = getSellerPayouts(seller, payouts);
      const sRefunds = getSellerRefunds(seller, refundLedger, sOrderIds);
      const fin = computeSellerFinancialSummary(seller, sPayouts, sRefunds);
      const ordMetrics = computeSellerOrderMetrics(seller, sOrders);
      const pendingDocsCount = (seller.kycDocuments || []).filter(
        (d) => d.status === 'PENDING' || d.status === 'CHANGES_REQUESTED'
      ).length;

      map.set(seller.id, {
        displayOrders: ordMetrics.displayTotalOrders,
        totalSalesPaise: fin.totalSalesGmvPaise,
        pendingSettlementPaise: fin.pendingSettlementPaise + fin.processingSettlementPaise,
        kycStatus: getResolvedKycStatus(seller),
        hasPendingDocs: sellerHasPendingDocuments(seller),
        pendingDocsCount,
      });
    }

    return map;
  }, [sellers, orders, payouts, refundLedger]);

  // Dashboard KPI counts
  const kpiStats = useMemo(() => {
    let active = 0;
    let inactiveOrSuspended = 0;
    let pendingKyc = 0;
    let approved = 0;
    let rejected = 0;
    let withPendingDocs = 0;
    let pendingApproval = 0;
    let kycPendingStatus = 0;
    let kycUnderReviewStatus = 0;
    let inactiveOnly = 0;
    let suspendedOnly = 0;

    for (const s of sellers) {
      const kyc = getResolvedKycStatus(s);
      if (s.status === 'ACTIVE') active += 1;
      if (s.status === 'INACTIVE' || s.status === 'PAUSED') {
        inactiveOnly += 1;
        inactiveOrSuspended += 1;
      }
      if (s.status === 'SUSPENDED') {
        suspendedOnly += 1;
        inactiveOrSuspended += 1;
      }
      if (s.status === 'PENDING_APPROVAL') pendingApproval += 1;
      if (s.status === 'KYC_PENDING') kycPendingStatus += 1;
      if (s.status === 'KYC_UNDER_REVIEW') kycUnderReviewStatus += 1;
      if (s.status === 'REJECTED') rejected += 1;

      if (kyc === 'PENDING' || kyc === 'UNDER_REVIEW' || kyc === 'CHANGES_REQUESTED') {
        pendingKyc += 1;
      }
      if (kyc === 'APPROVED' || s.status === 'APPROVED' || s.status === 'ACTIVE') {
        approved += 1;
      }
      if (sellerHasPendingDocuments(s)) {
        withPendingDocs += 1;
      }
    }

    return {
      total: sellers.length,
      active,
      inactiveOrSuspended,
      pendingKyc,
      approved,
      rejected,
      withPendingDocs,
      pendingApproval,
      kycPendingStatus,
      kycUnderReviewStatus,
      inactiveOnly,
      suspendedOnly,
    };
  }, [sellers]);

  const clearAllFilters = () => {
    setSearchQuery('');
    setVillageFilter('ALL');
    setVerticalFilter('ALL');
    setKycFilter('ALL');
    setStatusFilter('ALL');
    setDatePreset('ALL');
    setCustomFrom('');
    setCustomTo('');
    setPerformanceFilter('ALL');
    setPendingDocsOnly(false);
    setCurrentPage(1);
  };

  const applyKpiFilter = (
    target:
      | 'TOTAL'
      | 'ACTIVE'
      | 'INACTIVE_SUSPENDED'
      | 'PENDING_KYC'
      | 'APPROVED'
      | 'REJECTED'
      | 'PENDING_DOCS'
  ) => {
    // Reset status/KYC/doc filters before applying the selected dashboard segment
    setStatusFilter('ALL');
    setKycFilter('ALL');
    setPendingDocsOnly(false);
    setCurrentPage(1);

    if (target === 'ACTIVE') setStatusFilter('ACTIVE');
    if (target === 'INACTIVE_SUSPENDED') setStatusFilter('INACTIVE_SUSPENDED');
    if (target === 'PENDING_KYC') setKycFilter('PENDING_ALL');
    if (target === 'APPROVED') setKycFilter('APPROVED');
    if (target === 'REJECTED') setStatusFilter('REJECTED');
    if (target === 'PENDING_DOCS') setPendingDocsOnly(true);
  };

  const hasActiveFilters = Boolean(
    searchQuery.trim() ||
      villageFilter !== 'ALL' ||
      verticalFilter !== 'ALL' ||
      kycFilter !== 'ALL' ||
      statusFilter !== 'ALL' ||
      datePreset !== 'ALL' ||
      performanceFilter !== 'ALL' ||
      pendingDocsOnly
  );

  // Filtered sellers list
  const filteredSellers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return sellers.filter((s) => {
      const m = sellerMetricsMap.get(s.id);
      const kyc = m?.kycStatus || getResolvedKycStatus(s);
      const hasPendingDocs = m?.hasPendingDocs ?? sellerHasPendingDocuments(s);
      const totalSalesPaise = m?.totalSalesPaise ?? s.gmvPaise;
      const displayOrders = m?.displayOrders ?? s.totalOrders;

      if (q) {
        const matched =
          s.name.toLowerCase().includes(q) ||
          s.ownerName.toLowerCase().includes(q) ||
          s.phone.toLowerCase().includes(q) ||
          s.id.toLowerCase().includes(q) ||
          s.villageName.toLowerCase().includes(q);
        if (!matched) return false;
      }

      if (villageFilter !== 'ALL' && s.villageId !== villageFilter) return false;

      if (
        verticalFilter !== 'ALL' &&
        s.vertical !== verticalFilter &&
        !s.supportedVerticals?.includes(verticalFilter)
      ) {
        return false;
      }

      if (kycFilter !== 'ALL') {
        if (kycFilter === 'PENDING_ALL') {
          if (kyc !== 'PENDING' && kyc !== 'UNDER_REVIEW' && kyc !== 'CHANGES_REQUESTED') {
            return false;
          }
        } else if (kyc !== kycFilter) {
          return false;
        }
      }

      if (statusFilter !== 'ALL') {
        if (statusFilter === 'INACTIVE_SUSPENDED') {
          if (s.status !== 'INACTIVE' && s.status !== 'PAUSED' && s.status !== 'SUSPENDED') {
            return false;
          }
        } else if (statusFilter === 'INACTIVE') {
          if (s.status !== 'INACTIVE' && s.status !== 'PAUSED') return false;
        } else if (s.status !== statusFilter) {
          return false;
        }
      }

      if (pendingDocsOnly && !hasPendingDocs) return false;

      if (!matchesSellerDateRange(s.joinedAt, datePreset, customFrom, customTo)) {
        return false;
      }

      if (performanceFilter === 'TOP_RATED' && s.rating < 4.7) return false;
      if (performanceFilter === 'HIGH_GMV' && totalSalesPaise < 2_500_000) return false; // >= ₹25,000
      if (
        performanceFilter === 'NEEDS_ATTENTION' &&
        !(
          (s.rating > 0 && s.rating < 4.5) ||
          displayOrders < 15 ||
          s.status === 'SUSPENDED' ||
          hasPendingDocs
        )
      ) {
        return false;
      }

      return true;
    });
  }, [
    sellers,
    sellerMetricsMap,
    searchQuery,
    villageFilter,
    verticalFilter,
    kycFilter,
    statusFilter,
    pendingDocsOnly,
    datePreset,
    customFrom,
    customTo,
    performanceFilter,
  ]);

  // Reset pagination whenever filtered count shrinks or filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [
    searchQuery,
    villageFilter,
    verticalFilter,
    kycFilter,
    statusFilter,
    pendingDocsOnly,
    datePreset,
    customFrom,
    customTo,
    performanceFilter,
  ]);

  const totalPages = Math.max(1, Math.ceil(filteredSellers.length / PAGE_SIZE));
  const paginatedSellers = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredSellers.slice(start, start + PAGE_SIZE);
  }, [filteredSellers, currentPage]);

  // Governance modal submission
  const handleConfirmGovernance = (
    sellerId: string,
    action: SellerGovernanceActionType,
    reason: string
  ) => {
    let res: { success: boolean; message: string };
    switch (action) {
      case 'APPROVE':
        res = updateSellerStatus(sellerId, 'APPROVED', reason || 'Approved by Admin');
        break;
      case 'REJECT':
        res = updateSellerStatus(sellerId, 'REJECTED', reason);
        break;
      case 'REQUEST_KYC_CHANGES':
        res = requestSellerKycChanges(sellerId, reason);
        break;
      case 'ACTIVATE':
        res = updateSellerStatus(sellerId, 'ACTIVE', reason || 'Activated by Admin');
        break;
      case 'DEACTIVATE':
        res = updateSellerStatus(sellerId, 'INACTIVE', reason);
        break;
      case 'SUSPEND':
        res = updateSellerStatus(sellerId, 'SUSPENDED', reason);
        break;
      case 'UNSUSPEND':
        res = updateSellerStatus(sellerId, 'ACTIVE', reason);
        break;
    }
    if (res.success) {
      showFeedback(res.message);
      setGovernanceTarget(null);
    }
  };

  const openGovernanceModal = (
    seller: MasterSellerRecord,
    action: SellerGovernanceActionType
  ) => {
    setGovernanceTarget({ seller, action });
  };

  const handleExportSellersCsv = () => {
    exportToCsv(
      `grambazaar_sellers_360_${new Date().toISOString().split('T')[0]}`,
      [
        { header: 'Seller ID', accessor: (s) => s.id },
        { header: 'Shop / Seller Name', accessor: (s) => s.name },
        { header: 'Owner Name', accessor: (s) => s.ownerName },
        { header: 'Phone Number', accessor: (s) => s.phone },
        { header: 'Village / Location', accessor: (s) => s.villageName },
        {
          header: 'Business Category / Vertical',
          accessor: (s) => (s.supportedVerticals || [s.vertical]).join(' | '),
        },
        { header: 'Registration Date', accessor: (s) => formatShortDate(s.joinedAt) },
        {
          header: 'KYC Status',
          accessor: (s) => KYC_STATUS_META[getResolvedKycStatus(s)].label,
        },
        {
          header: 'Store Status',
          accessor: (s) => SELLER_STATUS_META[s.status]?.label || s.status,
        },
        {
          header: 'Total Orders',
          accessor: (s) => sellerMetricsMap.get(s.id)?.displayOrders ?? s.totalOrders,
        },
        {
          header: 'Total Sales (INR)',
          accessor: (s) =>
            ((sellerMetricsMap.get(s.id)?.totalSalesPaise ?? s.gmvPaise) / 100).toFixed(2),
        },
        {
          header: 'Pending Settlement (INR)',
          accessor: (s) =>
            ((sellerMetricsMap.get(s.id)?.pendingSettlementPaise ?? 0) / 100).toFixed(2),
        },
        { header: 'Rating', accessor: (s) => (s.rating > 0 ? s.rating.toFixed(1) : 'New') },
      ],
      filteredSellers
    );
  };

  // Determine the most relevant primary governance button for a row based on current status
  const renderPrimaryRowAction = (seller: MasterSellerRecord) => {
    if (!canManage) return null;

    if (
      seller.status === 'PENDING_APPROVAL' ||
      seller.status === 'KYC_PENDING' ||
      seller.status === 'KYC_UNDER_REVIEW'
    ) {
      return (
        <Button
          variant="primary"
          size="sm"
          onClick={() => openGovernanceModal(seller, 'APPROVE')}
          leftIcon={<CheckCircle2 className="w-3.5 h-3.5" />}
        >
          Approve
        </Button>
      );
    }

    if (seller.status === 'APPROVED' || seller.status === 'INACTIVE' || seller.status === 'PAUSED') {
      return (
        <Button
          variant="secondary"
          size="sm"
          onClick={() => openGovernanceModal(seller, 'ACTIVATE')}
          leftIcon={<Play className="w-3.5 h-3.5" />}
        >
          Activate
        </Button>
      );
    }

    if (seller.status === 'SUSPENDED') {
      return (
        <Button
          variant="secondary"
          size="sm"
          onClick={() => openGovernanceModal(seller, 'UNSUSPEND')}
          leftIcon={<RefreshCcw className="w-3.5 h-3.5" />}
        >
          Unsuspend
        </Button>
      );
    }

    if (seller.status === 'ACTIVE') {
      return (
        <Button
          variant="destructive"
          size="sm"
          onClick={() => openGovernanceModal(seller, 'SUSPEND')}
          leftIcon={<Ban className="w-3.5 h-3.5" />}
        >
          Suspend
        </Button>
      );
    }

    // REJECTED -> allow re-approval if re-evaluated
    return (
      <Button
        variant="secondary"
        size="sm"
        onClick={() => openGovernanceModal(seller, 'APPROVE')}
        leftIcon={<UserCheck className="w-3.5 h-3.5" />}
      >
        Re-Approve
      </Button>
    );
  };

  const kpiCards = [
    {
      key: 'TOTAL' as const,
      label: 'Total Sellers',
      value: kpiStats.total,
      sub: 'All registered merchants',
      icon: Store,
      iconBg: 'bg-[#E8F5E9] text-[#218838]',
      active:
        statusFilter === 'ALL' && kycFilter === 'ALL' && !pendingDocsOnly,
    },
    {
      key: 'ACTIVE' as const,
      label: 'Active Sellers',
      value: kpiStats.active,
      sub: 'Live & taking orders',
      icon: CheckCircle2,
      iconBg: 'bg-emerald-50 text-[#16A34A]',
      active: statusFilter === 'ACTIVE' && kycFilter === 'ALL' && !pendingDocsOnly,
    },
    {
      key: 'INACTIVE_SUSPENDED' as const,
      label: 'Inactive / Suspended',
      value: kpiStats.inactiveOrSuspended,
      sub: `${kpiStats.inactiveOnly} inactive • ${kpiStats.suspendedOnly} suspended`,
      icon: PauseCircle,
      iconBg: 'bg-slate-100 text-[#475569]',
      active: statusFilter === 'INACTIVE_SUSPENDED',
    },
    {
      key: 'PENDING_KYC' as const,
      label: 'Pending KYC',
      value: kpiStats.pendingKyc,
      sub: 'Awaiting verification',
      icon: Clock,
      iconBg: 'bg-amber-50 text-[#D97706]',
      active: kycFilter === 'PENDING_ALL',
    },
    {
      key: 'APPROVED' as const,
      label: 'Approved Sellers',
      value: kpiStats.approved,
      sub: 'KYC verified stores',
      icon: ShieldCheck,
      iconBg: 'bg-blue-50 text-[#2563EB]',
      active: kycFilter === 'APPROVED' && statusFilter === 'ALL',
    },
    {
      key: 'REJECTED' as const,
      label: 'Rejected Sellers',
      value: kpiStats.rejected,
      sub: 'Failed compliance review',
      icon: XCircle,
      iconBg: 'bg-red-50 text-[#DC2626]',
      active: statusFilter === 'REJECTED',
    },
    {
      key: 'PENDING_DOCS' as const,
      label: 'Pending Documents',
      value: kpiStats.withPendingDocs,
      sub: 'Docs needing review',
      icon: FileWarning,
      iconBg: 'bg-orange-50 text-[#D97706]',
      active: pendingDocsOnly,
    },
  ];

  const quickStatusSegments: {
    label: string;
    count: number;
    active: boolean;
    onClick: () => void;
  }[] = [
    {
      label: 'All Sellers',
      count: kpiStats.total,
      active: statusFilter === 'ALL' && kycFilter === 'ALL' && !pendingDocsOnly,
      onClick: () => applyKpiFilter('TOTAL'),
    },
    {
      label: 'Active',
      count: kpiStats.active,
      active: statusFilter === 'ACTIVE',
      onClick: () => {
        setKycFilter('ALL');
        setPendingDocsOnly(false);
        setStatusFilter('ACTIVE');
      },
    },
    {
      label: 'Pending Approval',
      count: kpiStats.pendingApproval,
      active: statusFilter === 'PENDING_APPROVAL',
      onClick: () => {
        setKycFilter('ALL');
        setPendingDocsOnly(false);
        setStatusFilter('PENDING_APPROVAL');
      },
    },
    {
      label: 'KYC Under Review',
      count: kpiStats.kycUnderReviewStatus,
      active: statusFilter === 'KYC_UNDER_REVIEW',
      onClick: () => {
        setKycFilter('ALL');
        setPendingDocsOnly(false);
        setStatusFilter('KYC_UNDER_REVIEW');
      },
    },
    {
      label: 'Inactive',
      count: kpiStats.inactiveOnly,
      active: statusFilter === 'INACTIVE',
      onClick: () => {
        setKycFilter('ALL');
        setPendingDocsOnly(false);
        setStatusFilter('INACTIVE');
      },
    },
    {
      label: 'Suspended',
      count: kpiStats.suspendedOnly,
      active: statusFilter === 'SUSPENDED',
      onClick: () => {
        setKycFilter('ALL');
        setPendingDocsOnly(false);
        setStatusFilter('SUSPENDED');
      },
    },
    {
      label: 'Rejected',
      count: kpiStats.rejected,
      active: statusFilter === 'REJECTED',
      onClick: () => {
        setKycFilter('ALL');
        setPendingDocsOnly(false);
        setStatusFilter('REJECTED');
      },
    },
    {
      label: 'Pending Docs',
      count: kpiStats.withPendingDocs,
      active: pendingDocsOnly,
      onClick: () => {
        setStatusFilter('ALL');
        setKycFilter('ALL');
        setPendingDocsOnly((prev) => !prev);
      },
    },
  ];

  return (
    <div className="space-y-5 animate-fade-in text-left">
      {/* Breadcrumb + Header */}
      <div className="space-y-2">
        <Breadcrumbs
          items={[
            { label: 'Admin Panel' },
            { label: 'Operations' },
            { label: 'Seller Management', active: true },
          ]}
        />

        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5 mb-1 flex-wrap">
              <h1 className="text-xl font-black text-[#1F2937]">
                Seller Management (Seller 360°)
              </h1>
              <Badge variant="primary" size="sm">
                {sellers.length} Registered Sellers
              </Badge>
              {kpiStats.withPendingDocs > 0 && (
                <Badge variant="warning" size="sm" dot>
                  {kpiStats.withPendingDocs} Pending Docs
                </Badge>
              )}
            </div>
            <p className="text-xs text-[#6B7280]">
              Monitor village merchants, verify KYC documents, inspect Seller 360° profiles, and govern store lifecycle statuses.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAllFilters}
                leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
              >
                Reset Filters
              </Button>
            )}
            <Button
              variant="secondary"
              size="sm"
              onClick={handleExportSellersCsv}
              leftIcon={<Download className="w-3.5 h-3.5" />}
            >
              Export CSV ({filteredSellers.length})
            </Button>
          </div>
        </div>
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold rounded-xl flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-[#16A34A] shrink-0" />
            <span>{feedback}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-emerald-700 hover:text-emerald-900 text-[11px] font-bold cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* SECTION 1 — Seller Management Dashboard (7 Clickable KPIs + Status Overview) */}
      <div className="space-y-3">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-7 gap-3">
          {kpiCards.map((card) => {
            const Icon = card.icon;
            return (
              <button
                key={card.key}
                type="button"
                onClick={() => applyKpiFilter(card.key)}
                className={`text-left bg-white rounded-2xl border p-4 shadow-xs transition-all cursor-pointer flex flex-col justify-between gap-2 hover:border-[#218838]/60 ${
                  card.active
                    ? 'border-[#218838] ring-2 ring-[#218838]/15 bg-[#E8F5E9]/20'
                    : 'border-[#E5E7EB]'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-bold text-[#6B7280] leading-tight">
                    {card.label}
                  </span>
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${card.iconBg}`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                </div>
                <div>
                  <p className="text-2xl font-black text-[#1F2937] leading-none">
                    {card.value}
                  </p>
                  <p className="text-[10px] text-[#6B7280] mt-1.5 truncate">{card.sub}</p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Actionable Status Overview Bar */}
        <div className="bg-white rounded-2xl border border-[#E5E7EB] px-4 py-3 shadow-xs flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#6B7280] mr-1 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5 text-[#218838]" />
              Quick Views:
            </span>
            {quickStatusSegments.map((seg) => (
              <button
                key={seg.label}
                type="button"
                onClick={seg.onClick}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors cursor-pointer ${
                  seg.active
                    ? 'bg-[#218838] text-white border-[#218838]'
                    : 'bg-[#F8FAFC] text-[#475569] border-[#E5E7EB] hover:border-[#218838]/50 hover:text-[#1F2937]'
                }`}
              >
                <span>{seg.label}</span>
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                    seg.active ? 'bg-white/20 text-white' : 'bg-white text-[#6B7280]'
                  }`}
                >
                  {seg.count}
                </span>
              </button>
            ))}
          </div>
          <span className="text-[11px] text-[#6B7280]">
            Showing <strong className="text-[#1F2937]">{filteredSellers.length}</strong> of{' '}
            <strong className="text-[#1F2937]">{sellers.length}</strong> sellers
          </span>
        </div>
      </div>

      {/* SECTION 2 — Filters & Search Panel */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] p-4 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-3">
          {/* Search */}
          <div className="relative sm:col-span-2 lg:col-span-2">
            <Search className="w-4 h-4 text-[#6B7280] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search shop name, owner, mobile, Seller ID..."
              className="w-full h-10 pl-10 pr-4 bg-[#F8FAFC] border border-[#E5E7EB] rounded-xl text-xs text-[#1F2937] outline-none focus:border-[#218838] focus:bg-white transition-colors"
            />
          </div>

          {/* Village Filter */}
          <select
            aria-label="Filter by village"
            value={villageFilter}
            onChange={(e) => setVillageFilter(e.target.value)}
            className="h-10 px-3 bg-[#F8FAFC] border border-[#E5E7EB] rounded-xl text-xs text-[#1F2937] outline-none focus:border-[#218838] cursor-pointer"
          >
            <option value="ALL">All Villages</option>
            {serviceAreas.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name}
              </option>
            ))}
          </select>

          {/* Vertical / Category Filter */}
          <select
            aria-label="Filter by business category or vertical"
            value={verticalFilter}
            onChange={(e) => setVerticalFilter(e.target.value)}
            className="h-10 px-3 bg-[#F8FAFC] border border-[#E5E7EB] rounded-xl text-xs text-[#1F2937] outline-none focus:border-[#218838] cursor-pointer"
          >
            <option value="ALL">All Verticals</option>
            {verticalConfigs.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name}
              </option>
            ))}
          </select>

          {/* KYC Status Filter */}
          <select
            aria-label="Filter by KYC status"
            value={kycFilter}
            onChange={(e) => setKycFilter(e.target.value as KycFilterValue)}
            className="h-10 px-3 bg-[#F8FAFC] border border-[#E5E7EB] rounded-xl text-xs text-[#1F2937] outline-none focus:border-[#218838] cursor-pointer"
          >
            <option value="ALL">All KYC Statuses</option>
            <option value="PENDING_ALL">All Pending KYC</option>
            <option value="PENDING">KYC Pending</option>
            <option value="UNDER_REVIEW">KYC Under Review</option>
            <option value="CHANGES_REQUESTED">Requires Changes</option>
            <option value="APPROVED">KYC Approved</option>
            <option value="REJECTED">KYC Rejected</option>
          </select>

          {/* Store Status Filter */}
          <select
            aria-label="Filter by store status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as StoreStatusFilterValue)}
            className="h-10 px-3 bg-[#F8FAFC] border border-[#E5E7EB] rounded-xl text-xs text-[#1F2937] outline-none focus:border-[#218838] cursor-pointer"
          >
            <option value="ALL">All Store Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE_SUSPENDED">Inactive / Suspended</option>
            <option value="PENDING_APPROVAL">Pending Approval</option>
            <option value="KYC_PENDING">KYC Pending</option>
            <option value="KYC_UNDER_REVIEW">KYC Under Review</option>
            <option value="APPROVED">Approved</option>
            <option value="INACTIVE">Inactive / Paused</option>
            <option value="SUSPENDED">Suspended</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </div>

        {/* Secondary filter row: Registration Date, Performance, Pending Docs Toggle */}
        <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-[#F1F5F9]">
          <div className="flex items-center gap-2">
            <Calendar className="w-3.5 h-3.5 text-[#6B7280] shrink-0" />
            <select
              aria-label="Filter by registration date"
              value={datePreset}
              onChange={(e) => setDatePreset(e.target.value as SellerDatePreset)}
              className="h-9 px-3 bg-[#F8FAFC] border border-[#E5E7EB] rounded-xl text-xs text-[#1F2937] outline-none focus:border-[#218838] cursor-pointer"
            >
              <option value="ALL">Registration: All Time</option>
              <option value="7D">Joined Last 7 Days</option>
              <option value="30D">Joined Last 30 Days</option>
              <option value="90D">Joined Last 90 Days</option>
              <option value="CUSTOM">Custom Date Range</option>
            </select>
          </div>

          {datePreset === 'CUSTOM' && (
            <div className="flex items-center gap-2 flex-wrap">
              <input
                type="date"
                aria-label="Registration start date"
                value={customFrom}
                onChange={(e) => setCustomFrom(e.target.value)}
                className="h-9 px-2.5 bg-[#F8FAFC] border border-[#E5E7EB] rounded-xl text-xs text-[#1F2937] outline-none focus:border-[#218838]"
              />
              <span className="text-xs text-[#6B7280]">to</span>
              <input
                type="date"
                aria-label="Registration end date"
                value={customTo}
                onChange={(e) => setCustomTo(e.target.value)}
                className="h-9 px-2.5 bg-[#F8FAFC] border border-[#E5E7EB] rounded-xl text-xs text-[#1F2937] outline-none focus:border-[#218838]"
              />
            </div>
          )}

          <select
            aria-label="Filter by seller performance"
            value={performanceFilter}
            onChange={(e) => setPerformanceFilter(e.target.value as PerformanceFilterValue)}
            className="h-9 px-3 bg-[#F8FAFC] border border-[#E5E7EB] rounded-xl text-xs text-[#1F2937] outline-none focus:border-[#218838] cursor-pointer"
          >
            <option value="ALL">Performance: All Sellers</option>
            <option value="TOP_RATED">Top Rated (4.7★+)</option>
            <option value="HIGH_GMV">High Sales (₹25,000+)</option>
            <option value="NEEDS_ATTENTION">Needs Attention</option>
          </select>

          <label className="inline-flex items-center gap-2 px-3 h-9 rounded-xl border border-[#E5E7EB] bg-[#F8FAFC] text-xs font-medium text-[#1F2937] cursor-pointer select-none hover:border-[#218838]/50">
            <input
              type="checkbox"
              checked={pendingDocsOnly}
              onChange={(e) => setPendingDocsOnly(e.target.checked)}
              className="w-3.5 h-3.5 accent-[#218838] rounded cursor-pointer"
            />
            <span>Pending Documents Only</span>
          </label>
        </div>
      </div>

      {/* SECTION 2 — Seller Directory Table (Desktop) & Card List (Mobile/Tablet) */}
      {filteredSellers.length === 0 ? (
        <EmptyState
          icon={<Store className="w-7 h-7" />}
          title="No sellers match your filters"
          description="Try broadening your search, KYC status, village, registration date, or performance filters."
          actionText="Reset All Filters"
          onAction={clearAllFilters}
        />
      ) : (
        <>
          {/* Desktop Table (xl and above) */}
          <div className="hidden xl:block bg-white rounded-2xl border border-[#E5E7EB] shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-[#F8FAFC] text-[#6B7280] uppercase tracking-wider font-semibold border-b border-[#E5E7EB]">
                  <tr>
                    <th className="py-3.5 px-4">Shop / Seller</th>
                    <th className="py-3.5 px-3">Owner</th>
                    <th className="py-3.5 px-3">Phone</th>
                    <th className="py-3.5 px-3">Village</th>
                    <th className="py-3.5 px-3">Vertical / Category</th>
                    <th className="py-3.5 px-3">Registered</th>
                    <th className="py-3.5 px-3">KYC Status</th>
                    <th className="py-3.5 px-3">Store Status</th>
                    <th className="py-3.5 px-3 text-right">Orders</th>
                    <th className="py-3.5 px-3 text-right">Total Sales</th>
                    <th className="py-3.5 px-3 text-right">Pending Payout</th>
                    <th className="py-3.5 px-3 text-center">Rating</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E7EB]">
                  {paginatedSellers.map((seller) => {
                    const m = sellerMetricsMap.get(seller.id);
                    const kycStatus = m?.kycStatus || getResolvedKycStatus(seller);
                    const kycMeta = KYC_STATUS_META[kycStatus];
                    const statusMeta = SELLER_STATUS_META[seller.status] || {
                      label: seller.status,
                      variant: 'neutral' as const,
                    };
                    const verts = seller.supportedVerticals?.length
                      ? seller.supportedVerticals
                      : [seller.vertical];
                    const pendingPayoutPaise = m?.pendingSettlementPaise ?? 0;
                    const pendingDocsCount = m?.pendingDocsCount ?? 0;

                    return (
                      <tr
                        key={seller.id}
                        onClick={() => setSelectedSellerId(seller.id)}
                        className="hover:bg-[#F8FAFC] transition-colors cursor-pointer group"
                      >
                        {/* Shop / Seller Name */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2.5">
                            <div
                              className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-black shrink-0 ${
                                seller.logoBgClass || 'bg-[#E8F5E9] text-[#218838]'
                              }`}
                            >
                              {seller.logoInitials ||
                                seller.name
                                  .split(' ')
                                  .map((w) => w[0])
                                  .join('')
                                  .slice(0, 2)
                                  .toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <p className="font-bold text-[#1F2937] group-hover:text-[#218838] transition-colors truncate max-w-[180px]">
                                {seller.name}
                              </p>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <span className="text-[10px] font-mono text-[#6B7280]">
                                  {seller.id}
                                </span>
                                {seller.businessType && (
                                  <span className="text-[10px] font-semibold uppercase px-1.5 py-0.2 rounded bg-[#F1F5F9] text-[#475569]">
                                    {seller.businessType.replace(/_/g, ' ')}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Owner Name */}
                        <td className="py-3.5 px-3 font-medium text-[#1F2937] whitespace-nowrap">
                          {seller.ownerName}
                        </td>

                        {/* Phone */}
                        <td className="py-3.5 px-3 text-[#475569] font-mono text-[11px] whitespace-nowrap">
                          {seller.phone}
                        </td>

                        {/* Village */}
                        <td className="py-3.5 px-3 whitespace-nowrap">
                          <p className="font-semibold text-[#1F2937]">{seller.villageName}</p>
                          <p className="text-[10px] text-[#6B7280]">
                            Serves {seller.serviceableVillageIds?.length || 1} area(s)
                          </p>
                        </td>

                        {/* Vertical / Category */}
                        <td className="py-3.5 px-3">
                          <div className="flex flex-wrap gap-1 max-w-[160px]">
                            {verts.slice(0, 2).map((v) => (
                              <VerticalBadge key={v} vertical={v} />
                            ))}
                            {verts.length > 2 && (
                              <Badge variant="neutral" size="sm">
                                +{verts.length - 2}
                              </Badge>
                            )}
                          </div>
                        </td>

                        {/* Registration Date */}
                        <td className="py-3.5 px-3 text-[#475569] whitespace-nowrap">
                          {formatShortDate(seller.joinedAt)}
                        </td>

                        {/* KYC Status */}
                        <td className="py-3.5 px-3 whitespace-nowrap">
                          <div className="flex flex-col items-start gap-1">
                            <Badge variant={kycMeta.variant} size="sm">
                              {kycMeta.label}
                            </Badge>
                            {pendingDocsCount > 0 && (
                              <span className="text-[10px] font-semibold text-[#D97706]">
                                {pendingDocsCount} doc{pendingDocsCount > 1 ? 's' : ''} pending
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Store Status */}
                        <td className="py-3.5 px-3 whitespace-nowrap">
                          <Badge variant={statusMeta.variant} size="sm" dot>
                            {statusMeta.label}
                          </Badge>
                        </td>

                        {/* Total Orders */}
                        <td className="py-3.5 px-3 text-right font-bold text-[#1F2937] tabular-nums">
                          {m?.displayOrders ?? seller.totalOrders}
                        </td>

                        {/* Total Sales */}
                        <td className="py-3.5 px-3 text-right font-bold text-[#1F2937] tabular-nums whitespace-nowrap">
                          {formatINR(m?.totalSalesPaise ?? seller.gmvPaise)}
                        </td>

                        {/* Pending Settlement */}
                        <td className="py-3.5 px-3 text-right tabular-nums whitespace-nowrap">
                          {pendingPayoutPaise > 0 ? (
                            <span className="font-bold text-[#D97706]">
                              {formatINR(pendingPayoutPaise)}
                            </span>
                          ) : (
                            <span className="text-[#6B7280] font-medium">₹0</span>
                          )}
                        </td>

                        {/* Rating */}
                        <td className="py-3.5 px-3 text-center whitespace-nowrap">
                          {seller.rating > 0 ? (
                            <span className="inline-flex items-center gap-1 font-bold text-[#1F2937] bg-amber-50 border border-amber-200/70 px-2 py-0.5 rounded-full text-[11px]">
                              <Star className="w-3 h-3 fill-[#F59E0B] text-[#F59E0B]" />
                              {seller.rating.toFixed(1)}
                            </span>
                          ) : (
                            <span className="text-[11px] text-[#6B7280] font-medium">New</span>
                          )}
                        </td>

                        {/* Actions */}
                        <td
                          className="py-3.5 px-4 text-right whitespace-nowrap"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="inline-flex items-center gap-1.5">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSelectedSellerId(seller.id)}
                              leftIcon={<Eye className="w-3.5 h-3.5" />}
                            >
                              360°
                            </Button>
                            {renderPrimaryRowAction(seller)}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile & Tablet Card Grid (< xl) */}
          <div className="xl:hidden grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {paginatedSellers.map((seller) => {
              const m = sellerMetricsMap.get(seller.id);
              const kycStatus = m?.kycStatus || getResolvedKycStatus(seller);
              const kycMeta = KYC_STATUS_META[kycStatus];
              const statusMeta = SELLER_STATUS_META[seller.status] || {
                label: seller.status,
                variant: 'neutral' as const,
              };
              const verts = seller.supportedVerticals?.length
                ? seller.supportedVerticals
                : [seller.vertical];
              const pendingPayoutPaise = m?.pendingSettlementPaise ?? 0;

              return (
                <div
                  key={seller.id}
                  onClick={() => setSelectedSellerId(seller.id)}
                  className="bg-white rounded-2xl border border-[#E5E7EB] p-4 shadow-xs space-y-3 cursor-pointer hover:border-[#218838]/60 transition-colors"
                >
                  {/* Card Top Identity */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center text-xs font-black shrink-0 ${
                          seller.logoBgClass || 'bg-[#E8F5E9] text-[#218838]'
                        }`}
                      >
                        {seller.logoInitials ||
                          seller.name
                            .split(' ')
                            .map((w) => w[0])
                            .join('')
                            .slice(0, 2)
                            .toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-sm font-bold text-[#1F2937] truncate">
                          {seller.name}
                        </h3>
                        <p className="text-xs text-[#6B7280] truncate">
                          {seller.ownerName} • <span className="font-mono">{seller.id}</span>
                        </p>
                      </div>
                    </div>
                    <Badge variant={statusMeta.variant} size="sm" dot>
                      {statusMeta.label}
                    </Badge>
                  </div>

                  {/* Contact, Village, Verticals, Registration */}
                  <div className="grid grid-cols-2 gap-2 text-[11px] text-[#475569] bg-[#F8FAFC] rounded-xl p-2.5 border border-[#F1F5F9]">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <Phone className="w-3.5 h-3.5 text-[#6B7280] shrink-0" />
                      <span className="truncate font-mono">{seller.phone}</span>
                    </div>
                    <div className="flex items-center gap-1.5 min-w-0">
                      <MapPin className="w-3.5 h-3.5 text-[#6B7280] shrink-0" />
                      <span className="truncate">{seller.villageName}</span>
                    </div>
                    <div className="flex items-center gap-1.5 min-w-0">
                      <Calendar className="w-3.5 h-3.5 text-[#6B7280] shrink-0" />
                      <span className="truncate">Joined {formatShortDate(seller.joinedAt)}</span>
                    </div>
                    <div className="flex items-center gap-1.5 min-w-0">
                      <Building2 className="w-3.5 h-3.5 text-[#6B7280] shrink-0" />
                      <span className="truncate">
                        {(seller.businessType || 'STORE').replace(/_/g, ' ')}
                      </span>
                    </div>
                  </div>

                  {/* Verticals & KYC Badge */}
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex flex-wrap gap-1">
                      {verts.map((v) => (
                        <VerticalBadge key={v} vertical={v} />
                      ))}
                    </div>
                    <Badge variant={kycMeta.variant} size="sm">
                      {kycMeta.label}
                    </Badge>
                  </div>

                  {/* Key Metrics */}
                  <div className="grid grid-cols-4 gap-2 pt-2 border-t border-[#F1F5F9] text-center">
                    <div>
                      <p className="text-[10px] text-[#6B7280]">Orders</p>
                      <p className="text-xs font-bold text-[#1F2937]">
                        {m?.displayOrders ?? seller.totalOrders}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-[#6B7280]">Sales</p>
                      <p className="text-xs font-bold text-[#1F2937]">
                        {formatINR(m?.totalSalesPaise ?? seller.gmvPaise)}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-[#6B7280]">Pending</p>
                      <p
                        className={`text-xs font-bold ${
                          pendingPayoutPaise > 0 ? 'text-[#D97706]' : 'text-[#6B7280]'
                        }`}
                      >
                        {formatINR(pendingPayoutPaise)}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-[#6B7280]">Rating</p>
                      <p className="text-xs font-bold text-[#1F2937]">
                        {seller.rating > 0 ? `★ ${seller.rating.toFixed(1)}` : 'New'}
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div
                    className="flex items-center justify-end gap-2 pt-2 border-t border-[#E5E7EB]"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedSellerId(seller.id)}
                      leftIcon={<Eye className="w-3.5 h-3.5" />}
                    >
                      View Seller 360°
                    </Button>
                    {renderPrimaryRowAction(seller)}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalRecords={filteredSellers.length}
            pageSize={PAGE_SIZE}
            onPageChange={setCurrentPage}
          />
        </>
      )}

      {/* SECTION 3 — Seller 360° Profile Drawer (8 Tabs) */}
      <Seller360Drawer
        seller={selectedSeller}
        isOpen={Boolean(selectedSeller)}
        onClose={() => setSelectedSellerId(null)}
        onTriggerGovernanceAction={openGovernanceModal}
        onShowFeedback={showFeedback}
      />

      {/* SECTION 4 — Seller Governance Confirmation Modal */}
      <SellerGovernanceModal
        seller={governanceTarget?.seller || null}
        action={governanceTarget?.action || null}
        isOpen={Boolean(governanceTarget)}
        onClose={() => setGovernanceTarget(null)}
        onConfirm={handleConfirmGovernance}
      />
    </div>
  );
};
