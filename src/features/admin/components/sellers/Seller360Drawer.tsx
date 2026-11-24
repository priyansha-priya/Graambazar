/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  Ban,
  BarChart3,
  CheckCircle2,
  FileCheck2,
  LayoutGrid,
  MessageSquare,
  Package,
  PauseCircle,
  Play,
  RefreshCcw,
  ShoppingBag,
  Wallet,
  XCircle,
} from 'lucide-react';
import {
  MasterSellerRecord,
  SellerDocumentStatus,
  SellerPayoutRecord,
} from '../../../../types/admin';
import { Order } from '../../../../types/order';
import { useAdmin } from '../../../../contexts/AdminContext';
import { useOrders } from '../../../../contexts/OrderContext';
import { Drawer } from '../../../../components/ui/Drawer';
import { Badge } from '../../../../components/ui/Badge';
import { Button } from '../../../../components/ui/Button';
import { Tabs } from '../../../../components/ui/Tabs';
import { AdminOrderDetailDrawer } from '../AdminOrderDetailDrawer';
import { SettlementDetailDrawer } from '../finance/FinanceDetailDrawers';
import {
  KYC_STATUS_META,
  SELLER_STATUS_META,
  buildSellerTimeline,
  computeSellerFinancialSummary,
  computeSellerOrderMetrics,
  getResolvedKycStatus,
  getSellerOrders,
  getSellerPayouts,
  getSellerProducts,
  getSellerRefunds,
  getSellerReviews,
  getSellerSupportCases,
} from './seller360Helpers';
import { SellerGovernanceActionType } from './SellerActionModals';
import { Seller360TabOverview } from './Seller360TabOverview';
import { Seller360TabKyc } from './Seller360TabKyc';
import { Seller360TabProducts } from './Seller360TabProducts';
import { Seller360TabOrders } from './Seller360TabOrders';
import { Seller360TabFinance } from './Seller360TabFinance';
import { Seller360TabAnalytics } from './Seller360TabAnalytics';
import {
  Seller360TabReviews,
  Seller360TabTimeline,
} from './Seller360TabReviewsAndTimeline';

type Seller360TabKey =
  | 'OVERVIEW'
  | 'KYC'
  | 'PRODUCTS'
  | 'ORDERS'
  | 'FINANCE'
  | 'ANALYTICS'
  | 'REVIEWS'
  | 'TIMELINE';

export interface Seller360DrawerProps {
  seller: MasterSellerRecord | null;
  isOpen: boolean;
  onClose: () => void;
  onTriggerGovernanceAction: (
    seller: MasterSellerRecord,
    action: SellerGovernanceActionType
  ) => void;
  onShowFeedback: (msg: string) => void;
}

export const Seller360Drawer: React.FC<Seller360DrawerProps> = ({
  seller,
  isOpen,
  onClose,
  onTriggerGovernanceAction,
  onShowFeedback,
}) => {
  const {
    products,
    categories,
    payouts,
    refundLedger,
    reviews,
    supportCases,
    auditLogs,
    verticalConfigs,
    serviceAreas,
    currentAdmin,
    hasPermission,
    updateSellerConfig,
    updateSellerKycDocument,
    toggleProductAvailability,
    moderateProduct,
    moderateReview,
  } = useAdmin();

  const {
    orders,
    transitionOrder,
    adminCancelOrder,
    recordOrderReturn,
    processOrderRefund,
  } = useOrders();

  const [activeTab, setActiveTab] = useState<Seller360TabKey>('OVERVIEW');
  const [inspectingOrderId, setInspectingOrderId] = useState<string | null>(null);
  const [inspectingSettlementId, setInspectingSettlementId] = useState<string | null>(null);

  useEffect(() => {
    setActiveTab('OVERVIEW');
    setInspectingOrderId(null);
    setInspectingSettlementId(null);
  }, [seller?.id]);

  const canManageSellers = hasPermission('SELLERS', 'manage');
  const canApproveSellers = hasPermission('SELLERS', 'approve') || hasPermission('APPLICATIONS', 'approve');
  const canManageProducts = hasPermission('PRODUCTS', 'manage');
  const canApproveProducts = hasPermission('PRODUCTS', 'approve');
  const canModerateReviews = hasPermission('REVIEWS', 'manage');
  const canManageOrders = hasPermission('ORDERS', 'manage');

  const sellerProducts = useMemo(
    () => (seller ? getSellerProducts(seller, products) : []),
    [seller, products]
  );

  const sellerOrders = useMemo(
    () => (seller ? getSellerOrders(seller, orders) : []),
    [seller, orders]
  );

  const sellerPayouts = useMemo(
    () => (seller ? getSellerPayouts(seller, payouts) : []),
    [seller, payouts]
  );

  const sellerRefunds = useMemo(() => {
    if (!seller) return [];
    const orderIdSet = new Set(sellerOrders.map((o) => o.orderNumber));
    return getSellerRefunds(seller, refundLedger, orderIdSet);
  }, [seller, refundLedger, sellerOrders]);

  const sellerReviews = useMemo(
    () => (seller ? getSellerReviews(seller, reviews) : []),
    [seller, reviews]
  );

  const sellerSupportCases = useMemo(
    () => (seller ? getSellerSupportCases(seller, supportCases) : []),
    [seller, supportCases]
  );

  const financials = useMemo(
    () =>
      seller
        ? computeSellerFinancialSummary(seller, sellerPayouts, sellerRefunds)
        : null,
    [seller, sellerPayouts, sellerRefunds]
  );

  const orderMetrics = useMemo(
    () => (seller ? computeSellerOrderMetrics(seller, sellerOrders) : null),
    [seller, sellerOrders]
  );

  const timelineEvents = useMemo(
    () =>
      seller
        ? buildSellerTimeline(seller, sellerProducts, sellerOrders, sellerPayouts, auditLogs)
        : [],
    [seller, sellerProducts, sellerOrders, sellerPayouts, auditLogs]
  );

  const inspectingOrder: Order | null = useMemo(
    () => (inspectingOrderId ? orders.find((o) => o.id === inspectingOrderId) || null : null),
    [orders, inspectingOrderId]
  );

  const inspectingSettlement: SellerPayoutRecord | null = useMemo(
    () =>
      inspectingSettlementId
        ? payouts.find((p) => p.id === inspectingSettlementId) || null
        : null,
    [payouts, inspectingSettlementId]
  );

  if (!seller || !financials || !orderMetrics) return null;

  const statusMeta = SELLER_STATUS_META[seller.status] || {
    label: seller.status,
    variant: 'neutral' as const,
  };
  const kycMeta = KYC_STATUS_META[getResolvedKycStatus(seller)];

  const isOnboardingStage =
    seller.status === 'PENDING_APPROVAL' ||
    seller.status === 'KYC_PENDING' ||
    seller.status === 'KYC_UNDER_REVIEW';

  return (
    <>
      <Drawer
        isOpen={isOpen}
        onClose={onClose}
        title={`Seller 360°: ${seller.name}`}
        subtitle={`${seller.ownerName} • ${seller.id} • ${seller.villageName}`}
        width="max-w-5xl"
        footer={
          <div className="w-full flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-1.5">
              {/* Status-differentiated governance actions */}
              {canApproveSellers && (isOnboardingStage || seller.status === 'REJECTED') && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => onTriggerGovernanceAction(seller, 'APPROVE')}
                  leftIcon={<CheckCircle2 className="w-3.5 h-3.5" />}
                >
                  Approve Seller
                </Button>
              )}
              {canApproveSellers && isOnboardingStage && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onTriggerGovernanceAction(seller, 'REQUEST_KYC_CHANGES')}
                    leftIcon={<RefreshCcw className="w-3.5 h-3.5" />}
                  >
                    Request KYC Changes
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => onTriggerGovernanceAction(seller, 'REJECT')}
                    leftIcon={<XCircle className="w-3.5 h-3.5" />}
                  >
                    Reject Seller
                  </Button>
                </>
              )}
              {canManageSellers &&
                (seller.status === 'APPROVED' ||
                  seller.status === 'INACTIVE' ||
                  seller.status === 'PAUSED') && (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => onTriggerGovernanceAction(seller, 'ACTIVATE')}
                    leftIcon={<Play className="w-3.5 h-3.5" />}
                  >
                    Activate Seller
                  </Button>
                )}
              {canManageSellers && seller.status === 'ACTIVE' && (
                <>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => onTriggerGovernanceAction(seller, 'DEACTIVATE')}
                    leftIcon={<PauseCircle className="w-3.5 h-3.5" />}
                  >
                    Deactivate
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => onTriggerGovernanceAction(seller, 'SUSPEND')}
                    leftIcon={<Ban className="w-3.5 h-3.5" />}
                  >
                    Suspend Seller
                  </Button>
                </>
              )}
              {canManageSellers && seller.status === 'SUSPENDED' && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => onTriggerGovernanceAction(seller, 'UNSUSPEND')}
                  leftIcon={<Play className="w-3.5 h-3.5" />}
                >
                  Unsuspend Seller
                </Button>
              )}
            </div>

            <Button variant="secondary" size="sm" onClick={onClose}>
              Close Profile
            </Button>
          </div>
        }
      >
        <div className="space-y-5 text-left">
          {/* Top Seller Identity Strip */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-[#F8FAFC] border border-[#E5E7EB]">
            <div className="flex items-center gap-3.5">
              <div
                className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-base shrink-0 ${
                  seller.logoBgClass || 'bg-[#E8F5E9] text-[#218838]'
                }`}
              >
                {seller.logoInitials ||
                  seller.name
                    .split(' ')
                    .map((w) => w[0])
                    .slice(0, 2)
                    .join('')
                    .toUpperCase()}
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-base font-black text-[#1F2937]">{seller.name}</h2>
                  <span className="font-mono text-[11px] font-semibold px-2 py-0.5 rounded bg-white border border-[#E5E7EB] text-[#475569]">
                    {seller.id}
                  </span>
                </div>
                <p className="text-xs text-[#6B7280] mt-0.5">
                  Owner: <strong className="text-[#1F2937]">{seller.ownerName}</strong> •{' '}
                  {seller.phone} • {seller.villageName}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              <Badge variant={statusMeta.variant} size="md" dot>
                {statusMeta.label}
              </Badge>
              <Badge variant={kycMeta.variant} size="md" dot>
                {kycMeta.label}
              </Badge>
            </div>
          </div>

          {/* 8 Organized Seller 360° Tabs */}
          <Tabs
            variant="underline"
            activeTab={activeTab}
            onChange={(id) => setActiveTab(id as Seller360TabKey)}
            tabs={[
              { id: 'OVERVIEW', label: 'Overview', icon: <LayoutGrid className="w-3.5 h-3.5" /> },
              {
                id: 'KYC',
                label: 'KYC & Docs',
                icon: <FileCheck2 className="w-3.5 h-3.5" />,
                count: (seller.kycDocuments || []).length,
              },
              {
                id: 'PRODUCTS',
                label: 'Products',
                icon: <Package className="w-3.5 h-3.5" />,
                count: sellerProducts.length,
              },
              {
                id: 'ORDERS',
                label: 'Orders',
                icon: <ShoppingBag className="w-3.5 h-3.5" />,
                count: sellerOrders.length,
              },
              {
                id: 'FINANCE',
                label: 'Payments & Settlements',
                icon: <Wallet className="w-3.5 h-3.5" />,
                count: sellerPayouts.length,
              },
              {
                id: 'ANALYTICS',
                label: 'Performance',
                icon: <BarChart3 className="w-3.5 h-3.5" />,
              },
              {
                id: 'REVIEWS',
                label: 'Reviews & Disputes',
                icon: <MessageSquare className="w-3.5 h-3.5" />,
                count: sellerReviews.length + sellerSupportCases.length,
              },
              {
                id: 'TIMELINE',
                label: 'Timeline',
                icon: <Activity className="w-3.5 h-3.5" />,
                count: timelineEvents.length,
              },
            ]}
          />

          {/* Active Tab Content */}
          {activeTab === 'OVERVIEW' && (
            <Seller360TabOverview
              seller={seller}
              productCount={sellerProducts.length}
              financials={financials}
              orderMetrics={orderMetrics}
              verticalConfigs={verticalConfigs}
              serviceAreas={serviceAreas}
              canManage={canManageSellers}
              onSaveStoreConfig={(sellerId, patch) => {
                const res = updateSellerConfig(sellerId, patch);
                if (res.success) onShowFeedback(res.message);
              }}
            />
          )}

          {activeTab === 'KYC' && (
            <Seller360TabKyc
              seller={seller}
              canApprove={canApproveSellers}
              onUpdateDocument={(sellerId, docId, status: SellerDocumentStatus, note) => {
                const res = updateSellerKycDocument(sellerId, docId, status, note);
                if (res.success) onShowFeedback(res.message);
              }}
            />
          )}

          {activeTab === 'PRODUCTS' && (
            <Seller360TabProducts
              products={sellerProducts}
              categories={categories}
              canManageProducts={canManageProducts}
              canApproveProducts={canApproveProducts}
              onToggleAvailability={(productId) => {
                toggleProductAvailability(productId);
                onShowFeedback('Updated product availability status.');
              }}
              onModerateProduct={(productId, status, notes) => {
                moderateProduct(productId, status, notes);
                onShowFeedback(`Product moderation updated to ${status.replace(/_/g, ' ')}.`);
              }}
            />
          )}

          {activeTab === 'ORDERS' && (
            <Seller360TabOrders
              orders={sellerOrders}
              onInspectOrder={(order) => setInspectingOrderId(order.id)}
            />
          )}

          {activeTab === 'FINANCE' && (
            <Seller360TabFinance
              financials={financials}
              payouts={sellerPayouts}
              onInspectSettlement={(payout) => setInspectingSettlementId(payout.id)}
            />
          )}

          {activeTab === 'ANALYTICS' && (
            <Seller360TabAnalytics
              sellerOrders={sellerOrders}
              sellerPayouts={sellerPayouts}
              sellerProducts={sellerProducts}
              sellerReviews={sellerReviews}
              categories={categories}
            />
          )}

          {activeTab === 'REVIEWS' && (
            <Seller360TabReviews
              reviews={sellerReviews}
              supportCases={sellerSupportCases}
              canModerateReviews={canModerateReviews}
              onModerateReview={(reviewId, status, notes) => {
                moderateReview(reviewId, status, notes);
                onShowFeedback(`Review updated to ${status}.`);
              }}
            />
          )}

          {activeTab === 'TIMELINE' && <Seller360TabTimeline events={timelineEvents} />}
        </div>
      </Drawer>

      {/* Reused Order Management Detail Drawer (no modifications to Order Management) */}
      <AdminOrderDetailDrawer
        order={inspectingOrder}
        isOpen={Boolean(inspectingOrder)}
        onClose={() => setInspectingOrderId(null)}
        adminName={currentAdmin.name}
        onStatusChange={
          canManageOrders
            ? (orderId, nextStatus, reason) => {
                transitionOrder(orderId, nextStatus, reason, currentAdmin.name);
                onShowFeedback(`Updated order status to ${nextStatus.replace(/_/g, ' ')}.`);
              }
            : undefined
        }
        onCancelOrder={
          canManageOrders
            ? (orderId, payload) => {
                adminCancelOrder(orderId, payload);
                onShowFeedback('Order cancelled and logged.');
              }
            : undefined
        }
        onRecordReturn={
          canManageOrders
            ? (orderId, payload) => {
                recordOrderReturn(orderId, payload);
                onShowFeedback('Order return recorded.');
              }
            : undefined
        }
        onProcessRefund={
          canManageOrders
            ? (orderId, payload) => {
                processOrderRefund(orderId, payload);
                onShowFeedback('Order refund recorded.');
              }
            : undefined
        }
      />

      {/* Reused Payments & Finance Settlement Detail Drawer (Read-Only — No Transfers Initiated) */}
      <SettlementDetailDrawer
        payout={inspectingSettlement}
        isOpen={Boolean(inspectingSettlement)}
        onClose={() => setInspectingSettlementId(null)}
        canManage={false}
        canApprove={false}
        onRequestProcessing={() => {}}
        onRequestSettle={() => {}}
      />
    </>
  );
};
