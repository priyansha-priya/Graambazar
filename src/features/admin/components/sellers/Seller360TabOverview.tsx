/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import {
  Building2,
  Calendar,
  Clock,
  IndianRupee,
  Mail,
  MapPin,
  Package,
  Percent,
  Phone,
  Settings2,
  ShoppingBag,
  Star,
  Store,
  TrendingUp,
  User,
  Wallet,
  XCircle,
} from 'lucide-react';
import {
  MasterSellerRecord,
  SellerBusinessType,
  VerticalConfigRecord,
  VillageServiceAreaRecord,
} from '../../../../types/admin';
import { Badge } from '../../../../components/ui/Badge';
import { Button } from '../../../../components/ui/Button';
import { Input } from '../../../../components/ui/Input';
import { Select } from '../../../../components/ui/Select';
import { VerticalBadge } from '../VerticalBadge';
import { formatINR } from '../../../../utils/currency';
import {
  KYC_STATUS_META,
  SELLER_STATUS_META,
  SellerFinancialSummary,
  SellerOrderMetrics,
  getResolvedKycStatus,
} from './seller360Helpers';

const BUSINESS_TYPES: { label: string; value: SellerBusinessType }[] = [
  { label: 'Restaurant', value: 'RESTAURANT' },
  { label: 'Hotel', value: 'HOTEL' },
  { label: 'Village Dhaba', value: 'DHABA' },
  { label: 'Bakery / Sweets', value: 'BAKERY' },
  { label: 'Kirana Store', value: 'KIRANA' },
  { label: 'Hardware Store', value: 'HARDWARE_STORE' },
  { label: 'Electronics Dealer', value: 'ELECTRONICS_DEALER' },
  { label: 'Clothing Store', value: 'CLOTHING_STORE' },
  { label: 'Furniture Workshop', value: 'FURNITURE_SHOP' },
  { label: 'Krishi Seva Kendra', value: 'AGRI_KENDRA' },
  { label: 'Multi-Category Store', value: 'MULTI_CATEGORY' },
];

export interface Seller360TabOverviewProps {
  seller: MasterSellerRecord;
  productCount: number;
  financials: SellerFinancialSummary;
  orderMetrics: SellerOrderMetrics;
  verticalConfigs: VerticalConfigRecord[];
  serviceAreas: VillageServiceAreaRecord[];
  canManage: boolean;
  onSaveStoreConfig: (sellerId: string, patch: Partial<MasterSellerRecord>) => void;
}

export const Seller360TabOverview: React.FC<Seller360TabOverviewProps> = ({
  seller,
  productCount,
  financials,
  orderMetrics,
  verticalConfigs,
  serviceAreas,
  canManage,
  onSaveStoreConfig,
}) => {
  const [showConfigEditor, setShowConfigEditor] = useState(false);
  const [editConfig, setEditConfig] = useState({
    businessType: (seller.businessType || 'MULTI_CATEGORY') as SellerBusinessType,
    supportedVerticals: seller.supportedVerticals?.length ? [...seller.supportedVerticals] : [seller.vertical],
    serviceableVillageIds: seller.serviceableVillageIds?.length
      ? [...seller.serviceableVillageIds]
      : [seller.villageId],
    fulfilmentModes: (seller.fulfilmentModes?.length
      ? [...seller.fulfilmentModes]
      : ['DELIVERY', 'PICKUP']) as ('DELIVERY' | 'PICKUP')[],
    openingHours: seller.openingHours || '09:00 AM - 09:00 PM',
    commissionPercent: (seller.commissionRateBps / 100).toFixed(1),
  });

  useEffect(() => {
    setEditConfig({
      businessType: (seller.businessType || 'MULTI_CATEGORY') as SellerBusinessType,
      supportedVerticals: seller.supportedVerticals?.length ? [...seller.supportedVerticals] : [seller.vertical],
      serviceableVillageIds: seller.serviceableVillageIds?.length
        ? [...seller.serviceableVillageIds]
        : [seller.villageId],
      fulfilmentModes: (seller.fulfilmentModes?.length
        ? [...seller.fulfilmentModes]
        : ['DELIVERY', 'PICKUP']) as ('DELIVERY' | 'PICKUP')[],
      openingHours: seller.openingHours || '09:00 AM - 09:00 PM',
      commissionPercent: (seller.commissionRateBps / 100).toFixed(1),
    });
    setShowConfigEditor(false);
  }, [seller.id]);

  const statusMeta = SELLER_STATUS_META[seller.status] || {
    label: seller.status,
    variant: 'neutral' as const,
  };
  const kycMeta = KYC_STATUS_META[getResolvedKycStatus(seller)];
  const verticals = seller.supportedVerticals?.length ? seller.supportedVerticals : [seller.vertical];

  const toggleItem = <T extends string>(arr: T[], val: T): T[] =>
    arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val];

  const handleSave = () => {
    const primaryVertical = editConfig.supportedVerticals[0] || seller.vertical;
    onSaveStoreConfig(seller.id, {
      businessType: editConfig.businessType,
      vertical: primaryVertical,
      supportedVerticals: editConfig.supportedVerticals.length
        ? editConfig.supportedVerticals
        : [primaryVertical],
      serviceableVillageIds: editConfig.serviceableVillageIds.length
        ? editConfig.serviceableVillageIds
        : [seller.villageId],
      fulfilmentModes: editConfig.fulfilmentModes.length ? editConfig.fulfilmentModes : ['PICKUP'],
      openingHours: editConfig.openingHours,
      commissionRateBps: Math.round((parseFloat(editConfig.commissionPercent) || 4) * 100),
    });
    setShowConfigEditor(false);
  };

  return (
    <div className="space-y-5 text-left text-xs">
      {/* Compliance / Suspension / Rejection Callout if applicable */}
      {seller.status === 'SUSPENDED' && seller.suspensionReason && (
        <div className="p-3.5 rounded-2xl bg-[#FEF2F2] border border-[#FECACA] text-[#991B1B] space-y-1">
          <p className="font-bold">Storefront Currently Suspended</p>
          <p className="text-[#B91C1C]">{seller.suspensionReason}</p>
        </div>
      )}
      {seller.status === 'REJECTED' && seller.rejectionReason && (
        <div className="p-3.5 rounded-2xl bg-[#FEF2F2] border border-[#FECACA] text-[#991B1B] space-y-1">
          <p className="font-bold">Onboarding Rejected</p>
          <p className="text-[#B91C1C]">{seller.rejectionReason}</p>
        </div>
      )}
      {seller.kycChangeRequestNotes && getResolvedKycStatus(seller) === 'CHANGES_REQUESTED' && (
        <div className="p-3.5 rounded-2xl bg-[#FEF3C7]/60 border border-[#FCD34D] text-[#92400E] space-y-1">
          <p className="font-bold">KYC Document Changes Requested</p>
          <p>{seller.kycChangeRequestNotes}</p>
        </div>
      )}

      {/* Prominent Seller Business Summary Card (Section 6) */}
      <div className="bg-[#F8FAFC] rounded-2xl border border-[#E5E7EB] p-4 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[#E5E7EB]">
          <div className="flex items-center gap-2">
            <Store className="w-4 h-4 text-[#218838]" />
            <h3 className="text-sm font-black text-[#1F2937]">Seller Business Summary</h3>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <Badge variant={statusMeta.variant} size="sm" dot>
              {statusMeta.label}
            </Badge>
            <Badge variant={kycMeta.variant} size="sm" dot>
              {kycMeta.label}
            </Badge>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
          {/* Shop & Vertical Info */}
          <div className="bg-white rounded-xl border border-[#E5E7EB] p-3.5 space-y-2">
            <p className="text-[11px] font-bold uppercase tracking-wider text-[#6B7280]">
              Shop &amp; Vertical
            </p>
            <p className="font-bold text-sm text-[#1F2937]">{seller.name}</p>
            <p className="text-[#475569]">
              Type:{' '}
              <strong className="text-[#1F2937]">
                {(seller.businessType || 'MULTI_CATEGORY').replace(/_/g, ' ')}
              </strong>
            </p>
            <div className="flex flex-wrap gap-1 pt-0.5">
              {verticals.map((v) => (
                <VerticalBadge key={v} vertical={v} />
              ))}
            </div>
            <p className="text-[11px] text-[#6B7280] flex items-center gap-1 pt-1">
              <MapPin className="w-3.5 h-3.5 text-[#218838] shrink-0" />
              {seller.villageName}, {seller.district || 'Unnao'} ({seller.pinCode || '209801'})
            </p>
          </div>

          {/* Sales & Order Performance */}
          <div className="bg-white rounded-xl border border-[#E5E7EB] p-3.5 space-y-2">
            <p className="text-[11px] font-bold uppercase tracking-wider text-[#6B7280]">
              Sales &amp; Order Performance
            </p>
            <div className="flex justify-between">
              <span className="text-[#6B7280]">Total Sales (GMV)</span>
              <span className="font-black text-[#1F2937]">{formatINR(financials.totalSalesGmvPaise)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#6B7280]">Total Orders</span>
              <span className="font-bold text-[#1F2937]">{orderMetrics.displayTotalOrders}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#6B7280]">Avg Order Value</span>
              <span className="font-semibold text-[#1F2937]">
                {orderMetrics.averageOrderValuePaise > 0
                  ? formatINR(orderMetrics.averageOrderValuePaise)
                  : '—'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#6B7280]">Cancellation Rate</span>
              <span className="font-semibold text-[#1F2937]">
                {orderMetrics.cancellationRatePct !== null
                  ? `${orderMetrics.cancellationRatePct}%`
                  : 'N/A (No live orders)'}
              </span>
            </div>
          </div>

          {/* Financial Summary */}
          <div className="bg-white rounded-xl border border-[#E5E7EB] p-3.5 space-y-2">
            <p className="text-[11px] font-bold uppercase tracking-wider text-[#6B7280]">
              Financial Snapshot
            </p>
            <div className="flex justify-between">
              <span className="text-[#6B7280]">Commission Rate</span>
              <span className="font-bold text-[#2563EB]">
                {(seller.commissionRateBps / 100).toFixed(1)}%
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#6B7280]">Total Commission</span>
              <span className="font-bold text-[#1F2937]">
                {formatINR(financials.totalCommissionPaise)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#6B7280]">Total Settled</span>
              <span className="font-bold text-[#218838]">
                {formatINR(financials.totalSettledPaise)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#6B7280]">Pending Settlement</span>
              <span className="font-black text-[#D97706]">
                {formatINR(financials.pendingSettlementPaise + financials.processingSettlementPaise)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Section (7 Consistent Metric Cards) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        <div className="bg-white rounded-xl border border-[#E5E7EB] p-3.5">
          <div className="flex items-center justify-between text-[#6B7280]">
            <span className="text-[11px] font-semibold">Average Rating</span>
            <Star className="w-4 h-4 text-[#F59E0B]" />
          </div>
          <p className="text-lg font-black text-[#1F2937] mt-1.5">
            {seller.rating > 0 ? `★ ${seller.rating.toFixed(1)}` : 'New'}
          </p>
        </div>

        <div className="bg-white rounded-xl border border-[#E5E7EB] p-3.5">
          <div className="flex items-center justify-between text-[#6B7280]">
            <span className="text-[11px] font-semibold">Total Orders</span>
            <ShoppingBag className="w-4 h-4 text-[#218838]" />
          </div>
          <p className="text-lg font-black text-[#1F2937] mt-1.5">
            {orderMetrics.displayTotalOrders}
          </p>
        </div>

        <div className="bg-white rounded-xl border border-[#E5E7EB] p-3.5">
          <div className="flex items-center justify-between text-[#6B7280]">
            <span className="text-[11px] font-semibold">Total Sales (GMV)</span>
            <TrendingUp className="w-4 h-4 text-[#218838]" />
          </div>
          <p className="text-lg font-black text-[#1F2937] mt-1.5">
            {formatINR(financials.totalSalesGmvPaise)}
          </p>
        </div>

        <div className="bg-white rounded-xl border border-[#E5E7EB] p-3.5">
          <div className="flex items-center justify-between text-[#6B7280]">
            <span className="text-[11px] font-semibold">Total Products</span>
            <Package className="w-4 h-4 text-[#2563EB]" />
          </div>
          <p className="text-lg font-black text-[#1F2937] mt-1.5">{productCount}</p>
        </div>

        <div className="bg-white rounded-xl border border-[#E5E7EB] p-3.5">
          <div className="flex items-center justify-between text-[#6B7280]">
            <span className="text-[11px] font-semibold">Pending Settlement</span>
            <Wallet className="w-4 h-4 text-[#D97706]" />
          </div>
          <p className="text-lg font-black text-[#D97706] mt-1.5">
            {formatINR(financials.pendingSettlementPaise + financials.processingSettlementPaise)}
          </p>
        </div>

        <div className="bg-white rounded-xl border border-[#E5E7EB] p-3.5">
          <div className="flex items-center justify-between text-[#6B7280]">
            <span className="text-[11px] font-semibold">Total Commission</span>
            <IndianRupee className="w-4 h-4 text-[#2563EB]" />
          </div>
          <p className="text-lg font-black text-[#2563EB] mt-1.5">
            {formatINR(financials.totalCommissionPaise)}
          </p>
        </div>

        <div className="bg-white rounded-xl border border-[#E5E7EB] p-3.5">
          <div className="flex items-center justify-between text-[#6B7280]">
            <span className="text-[11px] font-semibold">Cancellation Rate</span>
            <XCircle className="w-4 h-4 text-[#DC2626]" />
          </div>
          <p className="text-lg font-black text-[#1F2937] mt-1.5">
            {orderMetrics.cancellationRatePct !== null ? `${orderMetrics.cancellationRatePct}%` : '—'}
          </p>
        </div>

        <div className="bg-white rounded-xl border border-[#E5E7EB] p-3.5">
          <div className="flex items-center justify-between text-[#6B7280]">
            <span className="text-[11px] font-semibold">Commission Slab</span>
            <Percent className="w-4 h-4 text-[#475569]" />
          </div>
          <p className="text-lg font-black text-[#1F2937] mt-1.5">
            {(seller.commissionRateBps / 100).toFixed(1)}%
          </p>
        </div>
      </div>

      {/* Complete Seller & Address Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-4 space-y-3">
          <h4 className="font-bold text-[#1F2937] flex items-center gap-1.5 pb-2 border-b border-[#E5E7EB]">
            <User className="w-4 h-4 text-[#218838]" /> Owner &amp; Business Profile
          </h4>
          <dl className="grid grid-cols-2 gap-y-2.5 gap-x-3">
            <div>
              <dt className="text-[11px] text-[#6B7280]">Seller ID</dt>
              <dd className="font-mono font-bold text-[#1F2937]">{seller.id}</dd>
            </div>
            <div>
              <dt className="text-[11px] text-[#6B7280]">Owner Name</dt>
              <dd className="font-bold text-[#1F2937]">{seller.ownerName}</dd>
            </div>
            <div>
              <dt className="text-[11px] text-[#6B7280]">Mobile Number</dt>
              <dd className="font-semibold text-[#1F2937] flex items-center gap-1">
                <Phone className="w-3 h-3 text-[#6B7280]" /> {seller.phone}
              </dd>
            </div>
            <div>
              <dt className="text-[11px] text-[#6B7280]">Email</dt>
              <dd className="font-semibold text-[#1F2937] truncate flex items-center gap-1">
                <Mail className="w-3 h-3 text-[#6B7280] shrink-0" />
                <span className="truncate">{seller.email || 'Not provided'}</span>
              </dd>
            </div>
            <div>
              <dt className="text-[11px] text-[#6B7280]">Business Type</dt>
              <dd className="font-semibold text-[#1F2937]">
                {(seller.businessType || 'MULTI_CATEGORY').replace(/_/g, ' ')}
              </dd>
            </div>
            <div>
              <dt className="text-[11px] text-[#6B7280]">Registration Date</dt>
              <dd className="font-semibold text-[#1F2937] flex items-center gap-1">
                <Calendar className="w-3 h-3 text-[#6B7280]" /> {seller.joinedAt}
              </dd>
            </div>
            <div className="col-span-2">
              <dt className="text-[11px] text-[#6B7280]">Opening Hours &amp; Fulfillment</dt>
              <dd className="font-semibold text-[#1F2937] flex items-center gap-2 flex-wrap mt-0.5">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3 text-[#6B7280]" /> {seller.openingHours || '09:00 AM - 09:00 PM'}
                </span>
                {(seller.fulfilmentModes || ['DELIVERY', 'PICKUP']).map((m) => (
                  <Badge key={m} variant="neutral" size="sm">
                    {m}
                  </Badge>
                ))}
              </dd>
            </div>
          </dl>
        </div>

        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-4 space-y-3">
          <h4 className="font-bold text-[#1F2937] flex items-center gap-1.5 pb-2 border-b border-[#E5E7EB]">
            <Building2 className="w-4 h-4 text-[#218838]" /> Shop Address &amp; Payout Account
          </h4>
          <dl className="grid grid-cols-2 gap-y-2.5 gap-x-3">
            <div className="col-span-2">
              <dt className="text-[11px] text-[#6B7280]">Shop Address</dt>
              <dd className="font-semibold text-[#1F2937]">
                {seller.shopAddress || `Main Market, ${seller.villageName}`}
              </dd>
            </div>
            <div>
              <dt className="text-[11px] text-[#6B7280]">Village</dt>
              <dd className="font-bold text-[#1F2937]">{seller.villageName}</dd>
            </div>
            <div>
              <dt className="text-[11px] text-[#6B7280]">District</dt>
              <dd className="font-semibold text-[#1F2937]">{seller.district || 'Unnao'}</dd>
            </div>
            <div>
              <dt className="text-[11px] text-[#6B7280]">State</dt>
              <dd className="font-semibold text-[#1F2937]">{seller.state || 'Uttar Pradesh'}</dd>
            </div>
            <div>
              <dt className="text-[11px] text-[#6B7280]">PIN Code</dt>
              <dd className="font-mono font-semibold text-[#1F2937]">{seller.pinCode || '209801'}</dd>
            </div>
            <div className="col-span-2 pt-2 border-t border-[#E5E7EB]">
              <dt className="text-[11px] text-[#6B7280]">Bank Account (Masked)</dt>
              <dd className="font-semibold text-[#1F2937] mt-0.5">
                {seller.bankAccountHolder || seller.ownerName} •{' '}
                <span className="font-mono">{seller.bankAccountNumberMasked || 'XXXXXX0000'}</span> •{' '}
                <span className="font-mono text-[#6B7280]">{seller.ifscCode || 'IFSC Pending'}</span>
              </dd>
            </div>
          </dl>
        </div>
      </div>

      {/* Preserved Store Configuration Section */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] p-4 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h4 className="font-bold text-[#1F2937] flex items-center gap-1.5">
              <Settings2 className="w-4 h-4 text-[#218838]" /> Store Operations &amp; Serviceability Configuration
            </h4>
            <p className="text-[11px] text-[#6B7280]">
              Serves {seller.serviceableVillageIds?.length || 1} village(s) • Commission {(seller.commissionRateBps / 100).toFixed(1)}%
            </p>
          </div>
          {canManage && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setShowConfigEditor((v) => !v)}
            >
              {showConfigEditor ? 'Cancel Edit' : 'Edit Store Config'}
            </Button>
          )}
        </div>

        {showConfigEditor && canManage && (
          <div className="space-y-4 pt-3 border-t border-[#E5E7EB]">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Select
                label="Business Type"
                value={editConfig.businessType}
                options={BUSINESS_TYPES}
                onChange={(e) =>
                  setEditConfig({ ...editConfig, businessType: e.target.value as SellerBusinessType })
                }
              />
              <Input
                label="Commission Rate (%)"
                type="number"
                step="0.5"
                value={editConfig.commissionPercent}
                onChange={(e) => setEditConfig({ ...editConfig, commissionPercent: e.target.value })}
              />
              <Input
                label="Opening Hours"
                value={editConfig.openingHours}
                onChange={(e) => setEditConfig({ ...editConfig, openingHours: e.target.value })}
              />
            </div>

            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-[#6B7280] mb-1.5">
                Supported Verticals
              </p>
              <div className="flex flex-wrap gap-1.5">
                {verticalConfigs.map((v) => {
                  const active = editConfig.supportedVerticals.includes(v.id);
                  return (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() =>
                        setEditConfig({
                          ...editConfig,
                          supportedVerticals: toggleItem(editConfig.supportedVerticals, v.id),
                        })
                      }
                      className={`px-3 py-1 rounded-full text-xs font-semibold border cursor-pointer ${
                        active
                          ? 'bg-[#218838] text-white border-[#218838]'
                          : 'bg-white text-[#475569] border-[#E5E7EB]'
                      }`}
                    >
                      {v.name}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-[#6B7280] mb-1.5">
                Serviceable Delivery Villages
              </p>
              <div className="flex flex-wrap gap-1.5">
                {serviceAreas.map((v) => {
                  const active = editConfig.serviceableVillageIds.includes(v.id);
                  return (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() =>
                        setEditConfig({
                          ...editConfig,
                          serviceableVillageIds: toggleItem(editConfig.serviceableVillageIds, v.id),
                        })
                      }
                      className={`px-3 py-1 rounded-full text-xs font-semibold border cursor-pointer ${
                        active
                          ? 'bg-[#218838] text-white border-[#218838]'
                          : 'bg-white text-[#475569] border-[#E5E7EB]'
                      }`}
                    >
                      {v.name}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center justify-between flex-wrap gap-3 pt-2 border-t border-[#E5E7EB]">
              <div className="flex gap-2">
                {(['DELIVERY', 'PICKUP'] as const).map((mode) => {
                  const active = editConfig.fulfilmentModes.includes(mode);
                  return (
                    <button
                      key={mode}
                      type="button"
                      onClick={() =>
                        setEditConfig({
                          ...editConfig,
                          fulfilmentModes: toggleItem(editConfig.fulfilmentModes, mode),
                        })
                      }
                      className={`px-3.5 py-1.5 rounded-full text-xs font-semibold border cursor-pointer ${
                        active
                          ? 'bg-[#218838] text-white border-[#218838]'
                          : 'bg-white text-[#475569] border-[#E5E7EB]'
                      }`}
                    >
                      {mode === 'DELIVERY' ? 'Home Delivery' : 'Store Pickup'}
                    </button>
                  );
                })}
              </div>
              <Button variant="primary" size="sm" onClick={handleSave}>
                Save Store Configuration
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
