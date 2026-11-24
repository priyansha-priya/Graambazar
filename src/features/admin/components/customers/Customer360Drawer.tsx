/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  Ban,
  BookOpen,
  Calendar,
  CheckCircle2,
  Clock,
  CreditCard,
  Eye,
  Headphones,
  IndianRupee,
  Mail,
  MapPin,
  MessageSquare,
  Phone,
  Receipt,
  RotateCcw,
  Search,
  ShieldCheck,
  ShoppingBag,
  Star,
  User,
  UserCheck,
} from 'lucide-react';
import {
  AdminCustomerRecord,
  PaymentTransactionRecord,
  RefundLedgerRecord,
} from '../../../../types/admin';
import { Order, OrderStatus } from '../../../../types/order';
import { useAdmin } from '../../../../contexts/AdminContext';
import { useOrders } from '../../../../contexts/OrderContext';
import { useUdhari } from '../../../../contexts/UdhariContext';
import { Drawer } from '../../../../components/ui/Drawer';
import { Badge } from '../../../../components/ui/Badge';
import { Button } from '../../../../components/ui/Button';
import { Tabs } from '../../../../components/ui/Tabs';
import { Pagination } from '../../../../components/data-display/Pagination';
import { AdminOrderDetailDrawer } from '../AdminOrderDetailDrawer';
import {
  RefundDetailDrawer,
  TransactionDetailDrawer,
} from '../finance/FinanceDetailDrawers';
import {
  PAYMENT_METHOD_META,
  REFUND_CHANNEL_LABELS,
  REFUND_STATUS_META,
  TXN_STATUS_META,
} from '../finance/financeHelpers';
import { formatINR } from '../../../../utils/currency';
import {
  CustomerActivityType,
  CustomerUnifiedOrderRow,
  buildCustomerActivityTimeline,
  buildCustomerCompleteOrderHistory,
  computeCustomer360Summary,
  getCustomerInitials,
  getCustomerOrders,
  getCustomerRefunds,
  getCustomerReviews,
  getCustomerSupportCases,
  getCustomerTransactions,
  getCustomerUdhariData,
} from './customer360Helpers';

type Customer360TabKey = 'OVERVIEW' | 'ORDERS' | 'PAYMENTS_UDHARI' | 'REVIEWS_ACTIVITY';

const ORDERS_PAGE_SIZE = 6;

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

const formatDateTimeCompact = (iso?: string): string => {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export interface Customer360DrawerProps {
  customer: AdminCustomerRecord | null;
  isOpen: boolean;
  onClose: () => void;
  canManage: boolean;
  onRequestBlockToggle: (customer: AdminCustomerRecord) => void;
  onShowToast: (msg: string) => void;
}

export const Customer360Drawer: React.FC<Customer360DrawerProps> = ({
  customer,
  isOpen,
  onClose,
  canManage,
  onRequestBlockToggle,
  onShowToast,
}) => {
  const {
    currentAdmin,
    serviceAreas,
    paymentTransactions,
    refundLedger,
    reviews,
    supportCases,
    auditLogs,
    updateCustomerNotes,
    moderateReview,
  } = useAdmin();
  const {
    orders,
    transitionOrder,
    adminCancelOrder,
    recordOrderReturn,
    processOrderRefund,
  } = useOrders();
  const { platformProfiles, platformLedgerEntries } = useUdhari();

  const [activeTab, setActiveTab] = useState<Customer360TabKey>('OVERVIEW');
  const [notesDraft, setNotesDraft] = useState('');

  // Order history filters & pagination
  const [orderSearch, setOrderSearch] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState('ALL');
  const [ordersPage, setOrdersPage] = useState(1);

  // Nested reused detail drawers (zero duplicate order/transaction/refund systems)
  const [inspectingOrderId, setInspectingOrderId] = useState<string | null>(null);
  const [inspectingTxn, setInspectingTxn] = useState<PaymentTransactionRecord | null>(null);
  const [inspectingRefund, setInspectingRefund] = useState<RefundLedgerRecord | null>(null);

  useEffect(() => {
    if (customer && isOpen) {
      setNotesDraft(customer.adminNotes || '');
      setActiveTab('OVERVIEW');
      setOrderSearch('');
      setOrderStatusFilter('ALL');
      setOrdersPage(1);
    }
  }, [customer?.id, isOpen]);

  // Cross-module customer data resolvers
  const liveOrders = useMemo(
    () => (customer ? getCustomerOrders(customer, orders) : []),
    [customer, orders]
  );

  const customerTxns = useMemo(
    () => (customer ? getCustomerTransactions(customer, paymentTransactions) : []),
    [customer, paymentTransactions]
  );

  const liveOrderKeys = useMemo(() => {
    const set = new Set<string>();
    liveOrders.forEach((o) => {
      set.add(o.id);
      set.add(o.orderNumber);
    });
    return set;
  }, [liveOrders]);

  const customerRefunds = useMemo(
    () => (customer ? getCustomerRefunds(customer, refundLedger, liveOrderKeys) : []),
    [customer, refundLedger, liveOrderKeys]
  );

  const customerReviews = useMemo(
    () => (customer ? getCustomerReviews(customer, reviews) : []),
    [customer, reviews]
  );

  const customerCases = useMemo(
    () => (customer ? getCustomerSupportCases(customer, supportCases) : []),
    [customer, supportCases]
  );

  const udhariData = useMemo(
    () =>
      customer
        ? getCustomerUdhariData(customer, platformProfiles, platformLedgerEntries)
        : { profiles: [], ledgerEntries: [] },
    [customer, platformProfiles, platformLedgerEntries]
  );

  const completeOrders = useMemo(
    () => buildCustomerCompleteOrderHistory(liveOrders, customerTxns, customerRefunds),
    [liveOrders, customerTxns, customerRefunds]
  );

  const summary = useMemo(
    () =>
      customer
        ? computeCustomer360Summary({
            customer,
            liveOrders,
            completeOrders,
            refunds: customerRefunds,
            udhariProfiles: udhariData.profiles,
            serviceAreas,
          })
        : null,
    [customer, liveOrders, completeOrders, customerRefunds, udhariData.profiles, serviceAreas]
  );

  const activityTimeline = useMemo(
    () =>
      customer
        ? buildCustomerActivityTimeline({
            customer,
            completeOrders,
            transactions: customerTxns,
            refunds: customerRefunds,
            reviews: customerReviews,
            supportCases: customerCases,
            auditLogs,
          })
        : [],
    [
      customer,
      completeOrders,
      customerTxns,
      customerRefunds,
      customerReviews,
      customerCases,
      auditLogs,
    ]
  );

  // Filtered & paginated Order History
  const filteredOrders = useMemo(() => {
    const q = orderSearch.trim().toLowerCase();
    return completeOrders.filter((ord) => {
      const matchesQ =
        !q ||
        ord.orderNumber.toLowerCase().includes(q) ||
        ord.sellerName.toLowerCase().includes(q) ||
        ord.productsSummary.toLowerCase().includes(q) ||
        ord.paymentMethodLabel.toLowerCase().includes(q);
      const matchesStatus =
        orderStatusFilter === 'ALL' || ord.orderStatusKey === orderStatusFilter;
      return matchesQ && matchesStatus;
    });
  }, [completeOrders, orderSearch, orderStatusFilter]);

  useEffect(() => {
    setOrdersPage(1);
  }, [orderSearch, orderStatusFilter]);

  const totalOrderPages = Math.max(1, Math.ceil(filteredOrders.length / ORDERS_PAGE_SIZE));
  const paginatedOrders = useMemo(() => {
    const start = (ordersPage - 1) * ORDERS_PAGE_SIZE;
    return filteredOrders.slice(start, start + ORDERS_PAGE_SIZE);
  }, [filteredOrders, ordersPage]);

  const inspectingOrder: Order | null = useMemo(
    () => (inspectingOrderId ? orders.find((o) => o.id === inspectingOrderId) || null : null),
    [orders, inspectingOrderId]
  );

  if (!customer || !summary) return null;

  const handleOpenUnifiedOrder = (row: CustomerUnifiedOrderRow) => {
    if (row.liveOrder) {
      setInspectingOrderId(row.liveOrder.id);
      return;
    }
    if (row.transaction) {
      setInspectingTxn(row.transaction);
      return;
    }
    if (row.refund) {
      setInspectingRefund(row.refund);
    }
  };

  const tabItems = [
    {
      id: 'OVERVIEW',
      label: 'Overview',
      icon: <User className="w-3.5 h-3.5" />,
    },
    {
      id: 'ORDERS',
      label: 'Order History',
      icon: <ShoppingBag className="w-3.5 h-3.5" />,
      count: completeOrders.length,
    },
    {
      id: 'PAYMENTS_UDHARI',
      label: 'Payments & Udhari',
      icon: <CreditCard className="w-3.5 h-3.5" />,
      count: customerTxns.length + customerRefunds.length,
    },
    {
      id: 'REVIEWS_ACTIVITY',
      label: 'Reviews & Activity',
      icon: <Activity className="w-3.5 h-3.5" />,
      count: customerReviews.length + customerCases.length,
    },
  ];

  const activityTone: Record<
    CustomerActivityType,
    { icon: React.ComponentType<{ className?: string }>; bg: string }
  > = {
    REGISTERED: { icon: UserCheck, bg: 'bg-[#E8F5E9] text-[#218838]' },
    ORDER: { icon: ShoppingBag, bg: 'bg-blue-50 text-[#2563EB]' },
    PAYMENT: { icon: CreditCard, bg: 'bg-emerald-50 text-[#16A34A]' },
    REFUND: { icon: RotateCcw, bg: 'bg-amber-50 text-[#D97706]' },
    REVIEW: { icon: Star, bg: 'bg-amber-50 text-[#F59E0B]' },
    SUPPORT: { icon: Headphones, bg: 'bg-red-50 text-[#DC2626]' },
    ADMIN: { icon: ShieldCheck, bg: 'bg-slate-100 text-[#475569]' },
  };

  return (
    <>
      <Drawer
        isOpen={isOpen}
        onClose={onClose}
        title={`${customer.name} • Customer 360°`}
        subtitle={`${customer.id} • ${customer.phone} • ${customer.villageName}`}
        width="max-w-4xl"
        footer={
          <div className="w-full flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <Badge
                variant={customer.status === 'ACTIVE' ? 'success' : 'error'}
                size="sm"
                dot
              >
                {customer.status === 'ACTIVE' ? 'Active Account' : 'Blocked Account'}
              </Badge>
              <span className="text-[11px] text-[#6B7280] hidden sm:inline">
                Registered {formatShortDate(customer.joinedAt)}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {canManage && (
                <Button
                  variant={customer.status === 'ACTIVE' ? 'destructive' : 'primary'}
                  size="sm"
                  onClick={() => onRequestBlockToggle(customer)}
                  leftIcon={
                    customer.status === 'ACTIVE' ? (
                      <Ban className="w-3.5 h-3.5" />
                    ) : (
                      <UserCheck className="w-3.5 h-3.5" />
                    )
                  }
                >
                  {customer.status === 'ACTIVE' ? 'Block Customer' : 'Unblock Customer'}
                </Button>
              )}
              <Button variant="secondary" size="sm" onClick={onClose}>
                Close
              </Button>
            </div>
          </div>
        }
      >
        <div className="space-y-5 text-left">
          {/* Top Customer Identity Header */}
          <div className="p-4 rounded-2xl bg-[#F8FAFC] border border-[#E5E7EB] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="w-14 h-14 rounded-2xl bg-[#E8F5E9] border border-[#218838]/25 text-[#218838] flex items-center justify-center text-lg font-black shrink-0">
                {getCustomerInitials(customer.name)}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-base font-black text-[#1F2937] truncate">
                    {customer.name}
                  </h3>
                  <Badge
                    variant={customer.status === 'ACTIVE' ? 'success' : 'error'}
                    size="sm"
                    dot
                  >
                    {customer.status}
                  </Badge>
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-white border border-[#E5E7EB] text-[#475569]">
                    {customer.id}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#6B7280] mt-1">
                  <span className="inline-flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5 text-[#218838]" />
                    {customer.phone}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Mail className="w-3.5 h-3.5 text-[#6B7280]" />
                    {customer.email}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-[#218838]" />
                    {customer.villageName}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex sm:flex-col items-end justify-between gap-1 shrink-0 text-right border-t sm:border-t-0 pt-2 sm:pt-0 border-[#E5E7EB]">
              <span className="text-[11px] text-[#6B7280]">Lifetime Spend</span>
              <span className="text-xl font-black text-[#218838] tabular-nums">
                {formatINR(summary.totalSpendingPaise)}
              </span>
            </div>
          </div>

          {/* Customer 360° Tabs */}
          <Tabs
            tabs={tabItems}
            activeTab={activeTab}
            onChange={(key) => setActiveTab(key as Customer360TabKey)}
            variant="underline"
          />

          {/* ================================================================
           * TAB 1 — OVERVIEW
           * ============================================================== */}
          {activeTab === 'OVERVIEW' && (
            <div className="space-y-5">
              {/* 6 Key Business Metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="p-3.5 rounded-xl bg-white border border-[#E5E7EB]">
                  <p className="text-[11px] font-semibold text-[#6B7280] flex items-center gap-1.5">
                    <ShoppingBag className="w-3.5 h-3.5 text-[#2563EB]" />
                    Total Orders
                  </p>
                  <p className="text-xl font-black text-[#1F2937] mt-1 tabular-nums">
                    {summary.totalOrders}
                  </p>
                  <p className="text-[10px] text-[#6B7280] mt-0.5">
                    {summary.trackedOrdersCount} detailed record(s) linked
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-white border border-[#E5E7EB]">
                  <p className="text-[11px] font-semibold text-[#6B7280] flex items-center gap-1.5">
                    <IndianRupee className="w-3.5 h-3.5 text-[#218838]" />
                    Total Spending
                  </p>
                  <p className="text-xl font-black text-[#218838] mt-1 tabular-nums">
                    {formatINR(summary.totalSpendingPaise)}
                  </p>
                  <p className="text-[10px] text-[#6B7280] mt-0.5">Verified buyer spend</p>
                </div>

                <div className="p-3.5 rounded-xl bg-white border border-[#E5E7EB]">
                  <p className="text-[11px] font-semibold text-[#6B7280] flex items-center gap-1.5">
                    <Receipt className="w-3.5 h-3.5 text-[#475569]" />
                    Average Order Value
                  </p>
                  <p className="text-xl font-black text-[#1F2937] mt-1 tabular-nums">
                    {formatINR(summary.averageOrderValuePaise)}
                  </p>
                  <p className="text-[10px] text-[#6B7280] mt-0.5">Spend / Total Orders</p>
                </div>

                <div className="p-3.5 rounded-xl bg-white border border-[#E5E7EB]">
                  <p className="text-[11px] font-semibold text-[#6B7280] flex items-center gap-1.5">
                    <RotateCcw className="w-3.5 h-3.5 text-[#DC2626]" />
                    Total Refunds
                  </p>
                  <p className="text-xl font-black text-[#1F2937] mt-1 tabular-nums">
                    {formatINR(summary.totalRefundsPaise)}
                  </p>
                  <p className="text-[10px] text-[#6B7280] mt-0.5">
                    {summary.refundCount} committed refund(s)
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-white border border-[#E5E7EB]">
                  <p className="text-[11px] font-semibold text-[#6B7280] flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-[#D97706]" />
                    Udhari Balance
                  </p>
                  <p
                    className={`text-xl font-black mt-1 tabular-nums ${
                      summary.udhariBalancePaise > 0 ? 'text-[#D97706]' : 'text-[#1F2937]'
                    }`}
                  >
                    {formatINR(summary.udhariBalancePaise)}
                  </p>
                  <p className="text-[10px] text-[#6B7280] mt-0.5">
                    {summary.activeKhataCount > 0
                      ? `${summary.activeKhataCount} active shop khata(s)`
                      : 'Village credit balance'}
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-white border border-[#E5E7EB]">
                  <p className="text-[11px] font-semibold text-[#6B7280] flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-[#218838]" />
                    Last Order Date
                  </p>
                  <p className="text-base font-black text-[#1F2937] mt-1.5">
                    {formatShortDate(summary.lastOrderDate)}
                  </p>
                  <p className="text-[10px] text-[#6B7280] mt-0.5">
                    Joined {formatShortDate(customer.joinedAt)}
                  </p>
                </div>
              </div>

              {/* Blocked Account Banner */}
              {customer.status === 'BLOCKED' && customer.blockReason && (
                <div className="p-4 rounded-xl bg-[#FEF2F2] border border-[#FECACA] flex items-start gap-3 text-xs text-[#991B1B]">
                  <AlertTriangle className="w-4 h-4 text-[#DC2626] shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold">Account Blocked Reason</p>
                    <p className="mt-0.5">{customer.blockReason}</p>
                  </div>
                </div>
              )}

              {/* Customer Contact, Registration & Complete Address Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E5E7EB] space-y-2.5 text-xs">
                  <h4 className="font-bold text-[#1F2937] uppercase tracking-wider text-[11px]">
                    Account &amp; Contact Information
                  </h4>
                  <div className="flex justify-between gap-2">
                    <span className="text-[#6B7280]">Customer Name</span>
                    <span className="font-semibold text-[#1F2937]">{customer.name}</span>
                  </div>
                  <div className="flex justify-between gap-2">
                    <span className="text-[#6B7280]">Customer ID</span>
                    <span className="font-mono font-semibold text-[#1F2937]">{customer.id}</span>
                  </div>
                  <div className="flex justify-between gap-2">
                    <span className="text-[#6B7280]">Mobile Number</span>
                    <span className="font-semibold text-[#1F2937]">{customer.phone}</span>
                  </div>
                  <div className="flex justify-between gap-2">
                    <span className="text-[#6B7280]">Email</span>
                    <span className="font-semibold text-[#1F2937] truncate max-w-[200px]">
                      {customer.email}
                    </span>
                  </div>
                  <div className="flex justify-between gap-2">
                    <span className="text-[#6B7280]">Registration Date</span>
                    <span className="font-semibold text-[#1F2937]">
                      {formatShortDate(customer.joinedAt)}
                    </span>
                  </div>
                  <div className="flex justify-between gap-2">
                    <span className="text-[#6B7280]">Account Status</span>
                    <Badge
                      variant={customer.status === 'ACTIVE' ? 'success' : 'error'}
                      size="sm"
                      dot
                    >
                      {customer.status}
                    </Badge>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E5E7EB] space-y-2.5 text-xs">
                  <h4 className="font-bold text-[#1F2937] uppercase tracking-wider text-[11px]">
                    Location &amp; Udhari Overview
                  </h4>
                  <div className="flex justify-between gap-2">
                    <span className="text-[#6B7280]">Village</span>
                    <span className="font-semibold text-[#1F2937]">{customer.villageName}</span>
                  </div>
                  <div>
                    <span className="text-[#6B7280] block">Complete Address</span>
                    <p className="font-semibold text-[#1F2937] mt-0.5 leading-relaxed">
                      {summary.completeAddress}
                    </p>
                  </div>
                  <div className="pt-2 border-t border-[#E5E7EB] space-y-1.5">
                    <div className="flex justify-between gap-2">
                      <span className="text-[#6B7280]">Udhari Outstanding</span>
                      <span
                        className={`font-bold ${
                          summary.udhariBalancePaise > 0 ? 'text-[#D97706]' : 'text-[#1F2937]'
                        }`}
                      >
                        {formatINR(summary.udhariBalancePaise)}
                      </span>
                    </div>
                    {summary.udhariCreditLimitPaise > 0 && (
                      <>
                        <div className="flex justify-between gap-2">
                          <span className="text-[#6B7280]">Combined Credit Limit</span>
                          <span className="font-semibold text-[#1F2937]">
                            {formatINR(summary.udhariCreditLimitPaise)}
                          </span>
                        </div>
                        <div className="flex justify-between gap-2">
                          <span className="text-[#6B7280]">Available Credit</span>
                          <span className="font-semibold text-[#16A34A]">
                            {formatINR(summary.udhariAvailablePaise)}
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Preserved Internal Admin Notes */}
              <div className="space-y-2 pt-2 border-t border-[#E5E7EB]">
                <label className="text-xs font-semibold uppercase tracking-wider text-[#1F2937] block">
                  Internal Admin Notes
                </label>
                <textarea
                  rows={3}
                  disabled={!canManage}
                  value={notesDraft}
                  onChange={(e) => setNotesDraft(e.target.value)}
                  placeholder="Add delivery instructions, trust remarks, or COD history..."
                  className="w-full p-3 text-xs border border-[#E5E7EB] rounded-xl focus:outline-none focus:border-[#218838] bg-white"
                />
                {canManage && (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => {
                      updateCustomerNotes(customer.id, notesDraft.trim());
                      onShowToast('Saved customer profile notes.');
                    }}
                  >
                    Save Notes
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* ================================================================
           * TAB 2 — COMPLETE ORDER HISTORY
           * ============================================================== */}
          {activeTab === 'ORDERS' && (
            <div className="space-y-4">
              {/* Filter Bar */}
              <div className="flex flex-col sm:flex-row gap-2.5">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-[#6B7280] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={orderSearch}
                    onChange={(e) => setOrderSearch(e.target.value)}
                    placeholder="Search Order ID, seller/shop, product..."
                    className="w-full h-9 pl-9 pr-3 text-xs bg-[#F8FAFC] border border-[#E5E7EB] rounded-xl outline-none focus:border-[#218838] focus:bg-white"
                  />
                </div>
                <select
                  aria-label="Filter customer orders by status"
                  value={orderStatusFilter}
                  onChange={(e) => setOrderStatusFilter(e.target.value)}
                  className="h-9 px-3 text-xs font-semibold text-[#1F2937] bg-[#F8FAFC] border border-[#E5E7EB] rounded-xl outline-none focus:border-[#218838] cursor-pointer"
                >
                  <option value="ALL">All Order Statuses</option>
                  <option value="completed">Delivered / Completed</option>
                  <option value="placed">Placed / New</option>
                  <option value="pending">Pending</option>
                  <option value="preparing">Preparing</option>
                  <option value="out_for_delivery">Out for Delivery</option>
                  <option value="cancelled">Cancelled / Failed</option>
                  <option value="returned">Returned</option>
                  <option value="refunded">Refunded</option>
                </select>
              </div>

              <div className="text-[11px] text-[#6B7280] flex items-center justify-between flex-wrap gap-2">
                <span>
                  Showing <strong className="text-[#1F2937]">{filteredOrders.length}</strong> detailed order record(s) (Historical lifetime total: <strong className="text-[#1F2937]">{summary.totalOrders}</strong>)
                </span>
                <span>Click any row to inspect full order or transaction details</span>
              </div>

              {filteredOrders.length === 0 ? (
                <div className="p-8 text-center rounded-xl bg-[#F8FAFC] border border-dashed border-[#E5E7EB] text-xs text-[#6B7280]">
                  No matching order records found for this customer.
                </div>
              ) : (
                <>
                  {/* Desktop Table */}
                  <div className="hidden md:block border border-[#E5E7EB] rounded-xl overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs text-left">
                        <thead className="bg-[#F8FAFC] text-[#6B7280] uppercase tracking-wider font-semibold border-b border-[#E5E7EB]">
                          <tr>
                            <th className="py-3 px-3">Order ID</th>
                            <th className="py-3 px-3">Order Date</th>
                            <th className="py-3 px-3">Seller / Shop</th>
                            <th className="py-3 px-3">Products</th>
                            <th className="py-3 px-3 text-right">Amount</th>
                            <th className="py-3 px-3">Payment</th>
                            <th className="py-3 px-3">Order Status</th>
                            <th className="py-3 px-3 text-right">View</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#E5E7EB]">
                          {paginatedOrders.map((ord) => (
                            <tr
                              key={ord.key}
                              onClick={() => handleOpenUnifiedOrder(ord)}
                              className="hover:bg-[#F8FAFC] transition-colors cursor-pointer group"
                            >
                              <td className="py-3 px-3 whitespace-nowrap">
                                <p className="font-mono font-bold text-[#1F2937] group-hover:text-[#218838]">
                                  {ord.orderNumber}
                                </p>
                                <span className="text-[10px] text-[#6B7280]">
                                  {ord.source === 'LIVE_ORDER'
                                    ? 'Live Order'
                                    : ord.source === 'PAYMENT_LEDGER'
                                    ? 'Payment Ledger'
                                    : 'Refund Ledger'}
                                </span>
                              </td>
                              <td className="py-3 px-3 text-[#475569] whitespace-nowrap">
                                {formatDateTimeCompact(ord.orderDate)}
                              </td>
                              <td className="py-3 px-3 font-medium text-[#1F2937] max-w-[150px] truncate">
                                {ord.sellerName}
                              </td>
                              <td className="py-3 px-3 max-w-[180px]">
                                <p className="text-[#1F2937] truncate">{ord.productsSummary}</p>
                                {ord.itemCount !== null && (
                                  <p className="text-[10px] text-[#6B7280]">
                                    {ord.itemCount} item unit(s)
                                  </p>
                                )}
                              </td>
                              <td className="py-3 px-3 text-right font-bold text-[#1F2937] tabular-nums whitespace-nowrap">
                                {formatINR(ord.amountPaise)}
                              </td>
                              <td className="py-3 px-3 whitespace-nowrap">
                                <p className="text-[11px] font-semibold text-[#475569]">
                                  {ord.paymentMethodLabel}
                                </p>
                                <Badge variant={ord.paymentStatusVariant} size="sm">
                                  {ord.paymentStatusLabel}
                                </Badge>
                              </td>
                              <td className="py-3 px-3 whitespace-nowrap">
                                <Badge variant={ord.orderStatusVariant} size="sm" dot>
                                  {ord.orderStatusLabel}
                                </Badge>
                              </td>
                              <td className="py-3 px-3 text-right whitespace-nowrap">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleOpenUnifiedOrder(ord);
                                  }}
                                  leftIcon={<Eye className="w-3.5 h-3.5" />}
                                >
                                  Details
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Mobile Order Cards */}
                  <div className="md:hidden space-y-2.5">
                    {paginatedOrders.map((ord) => (
                      <button
                        key={ord.key}
                        type="button"
                        onClick={() => handleOpenUnifiedOrder(ord)}
                        className="w-full text-left p-3.5 rounded-xl bg-[#F8FAFC] border border-[#E5E7EB] hover:border-[#218838]/60 space-y-2 cursor-pointer"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-mono text-xs font-bold text-[#1F2937]">
                            {ord.orderNumber}
                          </span>
                          <span className="text-xs font-black text-[#1F2937]">
                            {formatINR(ord.amountPaise)}
                          </span>
                        </div>
                        <p className="text-xs font-semibold text-[#1F2937]">{ord.sellerName}</p>
                        <p className="text-[11px] text-[#6B7280]">{ord.productsSummary}</p>
                        <div className="flex items-center justify-between gap-2 flex-wrap pt-1.5 border-t border-[#E5E7EB]">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <Badge variant={ord.orderStatusVariant} size="sm" dot>
                              {ord.orderStatusLabel}
                            </Badge>
                            <Badge variant={ord.paymentStatusVariant} size="sm">
                              {ord.paymentMethodLabel} • {ord.paymentStatusLabel}
                            </Badge>
                          </div>
                          <span className="text-[10px] text-[#6B7280]">
                            {formatShortDate(ord.orderDate)}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>

                  {totalOrderPages > 1 && (
                    <Pagination
                      currentPage={ordersPage}
                      totalPages={totalOrderPages}
                      totalRecords={filteredOrders.length}
                      pageSize={ORDERS_PAGE_SIZE}
                      onPageChange={setOrdersPage}
                    />
                  )}
                </>
              )}
            </div>
          )}

          {/* ================================================================
           * TAB 3 — PAYMENTS, REFUNDS & UDHARI
           * ============================================================== */}
          {activeTab === 'PAYMENTS_UDHARI' && (
            <div className="space-y-5">
              {/* Udhari / Village Credit Overview */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#1F2937] flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-[#D97706]" />
                    Udhari / Village Credit Khatas
                  </h4>
                  <span className="text-xs font-bold text-[#D97706]">
                    Total Due: {formatINR(summary.udhariBalancePaise)}
                  </span>
                </div>

                {udhariData.profiles.length === 0 ? (
                  <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E5E7EB] text-xs text-[#6B7280]">
                    {summary.udhariBalancePaise > 0
                      ? `Customer carries ${formatINR(summary.udhariBalancePaise)} Udhari balance across local village shops.`
                      : 'No active Udhari credit khata recorded for this customer.'}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {udhariData.profiles.map((prof) => (
                      <div
                        key={prof.id}
                        className="p-3.5 rounded-xl bg-[#F8FAFC] border border-[#E5E7EB] space-y-2 text-xs"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-bold text-[#1F2937]">{prof.sellerId}</span>
                          <Badge
                            variant={prof.status === 'ACTIVE' ? 'success' : 'neutral'}
                            size="sm"
                          >
                            {prof.status}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-3 gap-2 pt-1">
                          <div>
                            <p className="text-[10px] text-[#6B7280]">Limit</p>
                            <p className="font-bold text-[#1F2937]">
                              {formatINR(prof.creditLimitPaise)}
                            </p>
                          </div>
                          <div>
                            <p className="text-[10px] text-[#6B7280]">Due</p>
                            <p className="font-bold text-[#D97706]">
                              {formatINR(prof.outstandingBalancePaise)}
                            </p>
                          </div>
                          <div>
                            <p className="text-[10px] text-[#6B7280]">Available</p>
                            <p className="font-bold text-[#16A34A]">
                              {formatINR(prof.availableCreditPaise)}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Payment Transactions */}
              <div className="space-y-2.5 pt-2 border-t border-[#E5E7EB]">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#1F2937] flex items-center gap-1.5">
                  <CreditCard className="w-3.5 h-3.5 text-[#2563EB]" />
                  Payment Transactions ({customerTxns.length})
                </h4>
                {customerTxns.length === 0 ? (
                  <div className="p-4 rounded-xl bg-[#F8FAFC] border border-dashed border-[#E5E7EB] text-xs text-[#6B7280]">
                    No payment ledger transactions linked to this customer yet.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {customerTxns.map((txn) => {
                      const stMeta = TXN_STATUS_META[txn.status];
                      const mMeta = PAYMENT_METHOD_META[txn.method];
                      return (
                        <button
                          key={txn.id}
                          type="button"
                          onClick={() => setInspectingTxn(txn)}
                          className="w-full text-left p-3 rounded-xl bg-[#F8FAFC] hover:bg-white border border-[#E5E7EB] hover:border-[#218838]/60 transition-colors flex items-center justify-between gap-3 cursor-pointer text-xs"
                        >
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-mono font-bold text-[#1F2937]">
                                {txn.orderId}
                              </span>
                              <Badge variant={mMeta.variant} size="sm">
                                {mMeta.label}
                              </Badge>
                              <Badge variant={stMeta.variant} size="sm" dot>
                                {stMeta.label}
                              </Badge>
                            </div>
                            <p className="text-[11px] text-[#6B7280] mt-0.5 truncate">
                              {txn.sellerName} • Ref: {txn.gatewayRef}
                            </p>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="font-black text-[#1F2937] tabular-nums">
                              {formatINR(txn.amountPaise)}
                            </p>
                            <p className="text-[10px] text-[#6B7280]">
                              {formatShortDate(txn.createdAt)}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Refund History */}
              <div className="space-y-2.5 pt-2 border-t border-[#E5E7EB]">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#1F2937] flex items-center gap-1.5">
                  <RotateCcw className="w-3.5 h-3.5 text-[#DC2626]" />
                  Refund History ({customerRefunds.length})
                </h4>
                {customerRefunds.length === 0 ? (
                  <div className="p-4 rounded-xl bg-[#F8FAFC] border border-dashed border-[#E5E7EB] text-xs text-[#6B7280]">
                    No refunds requested or processed for this customer.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {customerRefunds.map((ref) => {
                      const rMeta = REFUND_STATUS_META[ref.status];
                      return (
                        <button
                          key={ref.id}
                          type="button"
                          onClick={() => setInspectingRefund(ref)}
                          className="w-full text-left p-3 rounded-xl bg-[#F8FAFC] hover:bg-white border border-[#E5E7EB] hover:border-[#218838]/60 transition-colors flex items-center justify-between gap-3 cursor-pointer text-xs"
                        >
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-mono font-bold text-[#1F2937]">
                                {ref.orderId}
                              </span>
                              <Badge variant={rMeta.variant} size="sm" dot>
                                {rMeta.label}
                              </Badge>
                              <span className="text-[10px] text-[#6B7280]">
                                {REFUND_CHANNEL_LABELS[ref.refundChannel]}
                              </span>
                            </div>
                            <p className="text-[11px] text-[#475569] mt-0.5 truncate">
                              {ref.reason}
                            </p>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="font-black text-[#DC2626] tabular-nums">
                              {formatINR(ref.amountPaise)}
                            </p>
                            <p className="text-[10px] text-[#6B7280]">
                              {formatShortDate(ref.processedAt || ref.requestedAt)}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ================================================================
           * TAB 4 — REVIEWS, SUPPORT CASES & ACTIVITY TIMELINE
           * ============================================================== */}
          {activeTab === 'REVIEWS_ACTIVITY' && (
            <div className="space-y-5">
              {/* Reviews */}
              <div className="space-y-2.5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#1F2937] flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5 text-[#218838]" />
                  Customer Reviews ({customerReviews.length})
                </h4>
                {customerReviews.length === 0 ? (
                  <div className="p-4 rounded-xl bg-[#F8FAFC] border border-dashed border-[#E5E7EB] text-xs text-[#6B7280]">
                    No reviews submitted by this customer yet.
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {customerReviews.map((rev) => (
                      <div
                        key={rev.id}
                        className="p-3.5 rounded-xl bg-[#F8FAFC] border border-[#E5E7EB] space-y-2 text-xs"
                      >
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-[#1F2937]">{rev.sellerName}</span>
                            <span className="inline-flex items-center gap-0.5 font-bold text-[#1F2937] bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full text-[11px]">
                              <Star className="w-3 h-3 fill-[#F59E0B] text-[#F59E0B]" />
                              {rev.rating}
                            </span>
                            <Badge
                              variant={
                                rev.status === 'PUBLISHED'
                                  ? 'success'
                                  : rev.status === 'FLAGGED'
                                  ? 'warning'
                                  : 'neutral'
                              }
                              size="sm"
                            >
                              {rev.status}
                            </Badge>
                          </div>
                          <span className="text-[10px] text-[#6B7280]">
                            {formatShortDate(rev.createdAt)}
                          </span>
                        </div>
                        <p className="text-[#475569] leading-relaxed">{rev.comment}</p>
                        {canManage && (
                          <div className="flex items-center gap-1.5 pt-1">
                            {rev.status !== 'PUBLISHED' && (
                              <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => {
                                  moderateReview(rev.id, 'PUBLISHED', 'Approved from Customer 360°');
                                  onShowToast('Review published.');
                                }}
                              >
                                Approve
                              </Button>
                            )}
                            {rev.status !== 'HIDDEN' && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  moderateReview(rev.id, 'HIDDEN', 'Hidden from Customer 360°');
                                  onShowToast('Review hidden.');
                                }}
                              >
                                Hide
                              </Button>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Support Cases / Disputes */}
              <div className="space-y-2.5 pt-2 border-t border-[#E5E7EB]">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#1F2937] flex items-center gap-1.5">
                  <Headphones className="w-3.5 h-3.5 text-[#DC2626]" />
                  Support Cases &amp; Disputes ({customerCases.length})
                </h4>
                {customerCases.length === 0 ? (
                  <div className="p-4 rounded-xl bg-[#F8FAFC] border border-dashed border-[#E5E7EB] text-xs text-[#6B7280]">
                    No support cases or disputes raised by this customer.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {customerCases.map((sc) => (
                      <div
                        key={sc.id}
                        className="p-3.5 rounded-xl bg-[#F8FAFC] border border-[#E5E7EB] space-y-1.5 text-xs"
                      >
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-[#1F2937]">{sc.id}</span>
                            <span className="text-[#6B7280]">Order {sc.orderId}</span>
                            <Badge
                              variant={
                                sc.status === 'OPEN' || sc.status === 'INVESTIGATING'
                                  ? 'warning'
                                  : 'success'
                              }
                              size="sm"
                            >
                              {sc.status}
                            </Badge>
                          </div>
                          <span className="font-bold text-[#1F2937]">
                            {formatINR(sc.amountPaise)}
                          </span>
                        </div>
                        <p className="text-[#475569]">{sc.description}</p>
                        <p className="text-[10px] text-[#6B7280]">
                          {sc.sellerName} • {formatShortDate(sc.createdAt)}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Chronological Customer Activity Timeline */}
              <div className="space-y-2.5 pt-2 border-t border-[#E5E7EB]">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#1F2937] flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-[#475569]" />
                  Customer Activity Timeline ({activityTimeline.length})
                </h4>
                {activityTimeline.length === 0 ? (
                  <div className="p-4 rounded-xl bg-[#F8FAFC] border border-dashed border-[#E5E7EB] text-xs text-[#6B7280]">
                    No recorded activity events yet.
                  </div>
                ) : (
                  <div className="divide-y divide-[#F1F5F9] border border-[#E5E7EB] rounded-xl overflow-hidden">
                    {activityTimeline.slice(0, 15).map((ev) => {
                      const style = activityTone[ev.type];
                      const Icon = style.icon;
                      return (
                        <div
                          key={ev.id}
                          className="p-3 bg-white flex items-start justify-between gap-3 text-xs"
                        >
                          <div className="flex items-start gap-2.5 min-w-0">
                            <div
                              className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${style.bg}`}
                            >
                              <Icon className="w-3.5 h-3.5" />
                            </div>
                            <div className="min-w-0">
                              <p className="font-bold text-[#1F2937]">{ev.title}</p>
                              <p className="text-[11px] text-[#6B7280] mt-0.5">
                                {ev.description}
                              </p>
                            </div>
                          </div>
                          <span className="text-[10px] text-[#6B7280] whitespace-nowrap shrink-0">
                            {formatShortDate(ev.timestamp)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </Drawer>

      {/* Reused Existing Order Detail Drawer */}
      <AdminOrderDetailDrawer
        order={inspectingOrder}
        isOpen={Boolean(inspectingOrder)}
        onClose={() => setInspectingOrderId(null)}
        adminName={currentAdmin.name}
        onStatusChange={(orderId: string, nextStatus: OrderStatus, reason?: string) => {
          transitionOrder(orderId, nextStatus, reason, 'ADMIN');
          onShowToast(`Order updated to ${nextStatus.replace(/_/g, ' ')}.`);
        }}
        onCancelOrder={(orderId, payload) => {
          adminCancelOrder(orderId, payload);
          onShowToast('Order cancellation recorded.');
        }}
        onRecordReturn={(orderId, payload) => {
          recordOrderReturn(orderId, payload);
          onShowToast('Order return details recorded.');
        }}
        onProcessRefund={(orderId, payload) => {
          processOrderRefund(orderId, payload);
          onShowToast('Order refund processed.');
        }}
      />

      {/* Reused Existing Transaction Detail Drawer */}
      <TransactionDetailDrawer
        transaction={inspectingTxn}
        relatedOrder={
          inspectingTxn
            ? orders.find(
                (o) =>
                  o.orderNumber === inspectingTxn.orderId || o.id === inspectingTxn.orderId
              )
            : undefined
        }
        relatedRefund={
          inspectingTxn
            ? refundLedger.find((r) => r.orderId === inspectingTxn.orderId)
            : undefined
        }
        isOpen={Boolean(inspectingTxn)}
        onClose={() => setInspectingTxn(null)}
        onViewRelatedOrder={(orderId) => {
          const found = orders.find((o) => o.orderNumber === orderId || o.id === orderId);
          if (found) {
            setInspectingTxn(null);
            setInspectingOrderId(found.id);
          }
        }}
      />

      {/* Reused Existing Refund Detail Drawer (Read-Only Inspection) */}
      <RefundDetailDrawer
        refund={inspectingRefund}
        relatedOrder={
          inspectingRefund
            ? orders.find(
                (o) =>
                  o.orderNumber === inspectingRefund.orderId ||
                  o.id === inspectingRefund.orderId
              )
            : undefined
        }
        relatedTransaction={
          inspectingRefund
            ? paymentTransactions.find((t) => t.orderId === inspectingRefund.orderId)
            : undefined
        }
        isOpen={Boolean(inspectingRefund)}
        onClose={() => setInspectingRefund(null)}
        canApprove={false}
        onApprove={() => {}}
        onReject={() => {}}
      />
    </>
  );
};
