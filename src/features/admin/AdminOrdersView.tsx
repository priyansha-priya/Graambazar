/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useState } from 'react';
import {
  Search,
  Eye,
  Download,
  AlertTriangle,
  ClipboardList,
  RotateCcw,
  RefreshCw,
  CheckCircle2,
  Calendar,
  ChevronRight,
  Truck,
  Store,
  XCircle,
  Clock,
} from 'lucide-react';
import {
  useOrders,
  AdminCancelOrderPayload,
  RecordOrderReturnPayload,
  ProcessOrderRefundPayload,
} from '../../contexts/OrderContext';
import { useAdmin } from '../../contexts/AdminContext';
import { Order, OrderStatus, PaymentMethod, PaymentStatus } from '../../types/order';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { EmptyState } from '../../components/feedback/EmptyState';
import { Pagination } from '../../components/data-display/Pagination';
import { VerticalBadge } from './components/VerticalBadge';
import { AdminOrderDetailDrawer } from './components/AdminOrderDetailDrawer';
import {
  OrderStatusWorkflowDropdown,
  OrderStatusFilterDropdown,
} from './components/OrderStatusWorkflowDropdown';
import {
  AdminCancelOrderModal,
  RecordReturnModal,
  ProcessRefundModal,
} from './components/AdminOrderActionModals';
import {
  ORDER_STATUS_META,
  WORKFLOW_STATUS_OPTIONS,
  WorkflowStatusKey,
  PAYMENT_STATUS_META,
  REFUND_STATUS_META,
  RETURN_STATUS_META,
  computeOrderFinancials,
  getOrderPrimaryVertical,
  mapOrderStatusToWorkflowKey,
  mapWorkflowKeyToOrderStatus,
  matchesWorkflowFilter,
} from './components/orderManagementHelpers';
import { formatINR } from '../../utils/currency';
import { exportToCsv } from '../../utils/exportCsv';

type DateRangeFilter = 'ALL' | 'TODAY' | 'LAST_7_DAYS' | 'LAST_30_DAYS' | 'CUSTOM';

const PAGE_SIZE = 8;

export const AdminOrdersView: React.FC = () => {
  const {
    orders,
    transitionOrder,
    adminCancelOrder,
    recordOrderReturn,
    processOrderRefund,
  } = useOrders();
  const {
    logAuditEvent,
    serviceAreas,
    verticalConfigs,
    platformSettings,
    hasPermission,
    currentAdmin,
  } = useAdmin();

  const canManage = hasPermission('ORDERS', 'manage');
  const canExport = hasPermission('ORDERS', 'export');

  // Filter & Pagination State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | WorkflowStatusKey>('ALL');
  const [villageFilter, setVillageFilter] = useState<string>('ALL');
  const [paymentFilter, setPaymentFilter] = useState<'ALL' | PaymentMethod>('ALL');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<'ALL' | PaymentStatus>('ALL');
  const [fulfilmentFilter, setFulfilmentFilter] = useState<'ALL' | 'DELIVERY' | 'PICKUP'>('ALL');
  const [verticalFilter, setVerticalFilter] = useState<string>('ALL');
  const [dateRange, setDateRange] = useState<DateRangeFilter>('ALL');
  const [customFromDate, setCustomFromDate] = useState('');
  const [customToDate, setCustomToDate] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // Selected Order for Detail Drawer (resolved live from context)
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const selectedOrder = useMemo(
    () => (selectedOrderId ? orders.find((o) => o.id === selectedOrderId) || null : null),
    [orders, selectedOrderId]
  );

  // Inline Workflow Confirmation Modal Targets (when admin selects Cancelled / Returned / Refunded in row dropdown)
  const [cancelModalOrderId, setCancelModalOrderId] = useState<string | null>(null);
  const [returnModalOrderId, setReturnModalOrderId] = useState<string | null>(null);
  const [refundModalOrderId, setRefundModalOrderId] = useState<string | null>(null);

  const cancelModalOrder = useMemo(
    () => (cancelModalOrderId ? orders.find((o) => o.id === cancelModalOrderId) || null : null),
    [orders, cancelModalOrderId]
  );
  const returnModalOrder = useMemo(
    () => (returnModalOrderId ? orders.find((o) => o.id === returnModalOrderId) || null : null),
    [orders, returnModalOrderId]
  );
  const refundModalOrder = useMemo(
    () => (refundModalOrderId ? orders.find((o) => o.id === refundModalOrderId) || null : null),
    [orders, refundModalOrderId]
  );

  // Toast feedback state
  const [toast, setToast] = useState<{ type: 'success' | 'info'; message: string } | null>(null);
  const showToast = (message: string, type: 'success' | 'info' = 'success') => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  const isFoodPrepSlaBreached = (order: Order): boolean => {
    const isFood = order.items.some((it) => it.catalogueType.toUpperCase() === 'FOOD');
    if (!isFood) return false;
    if (order.status !== 'placed' && order.status !== 'pending' && order.status !== 'preparing') {
      return false;
    }
    const elapsedMins = (Date.now() - new Date(order.createdAt).getTime()) / 60000;
    return elapsedMins > (platformSettings.foodPrepSlaMins || 35);
  };

  // Admin Order Handlers
  const handleStatusOverride = (orderId: string, nextStatus: OrderStatus, reason?: string) => {
    if (!canManage) return;
    transitionOrder(orderId, nextStatus, reason, 'ADMIN');
    logAuditEvent(
      'ORDER_STATUS_OVERRIDE',
      'Order',
      orderId,
      `Admin changed status to ${ORDER_STATUS_META[nextStatus]?.label || nextStatus}`,
      reason || 'Admin console status workflow update'
    );
    showToast(`Order status updated to ${ORDER_STATUS_META[nextStatus]?.label || nextStatus}.`);
  };

  const handleInlineWorkflowChange = (order: Order, nextKey: WorkflowStatusKey) => {
    if (!canManage) return;
    if (nextKey === 'cancelled') {
      setCancelModalOrderId(order.id);
      return;
    }
    if (nextKey === 'returned') {
      setReturnModalOrderId(order.id);
      return;
    }
    if (nextKey === 'refunded') {
      setRefundModalOrderId(order.id);
      return;
    }
    const targetStatus = mapWorkflowKeyToOrderStatus(nextKey, order.fulfilmentMode);
    handleStatusOverride(
      order.id,
      targetStatus,
      `Admin workflow transition to ${ORDER_STATUS_META[targetStatus].label}`
    );
  };

  const handleAdminCancelOrder = (orderId: string, payload: AdminCancelOrderPayload) => {
    if (!canManage) return;
    adminCancelOrder(orderId, payload);
    logAuditEvent(
      'ORDER_CANCELLED',
      'Order',
      orderId,
      `Order cancelled by ${payload.cancelledBy} (Refund eligible: ${payload.refundEligible ? 'Yes' : 'No'})`,
      payload.reason
    );
    showToast('Order cancelled and logged to audit trail.');
  };

  const handleRecordReturn = (orderId: string, payload: RecordOrderReturnPayload) => {
    if (!canManage) return;
    recordOrderReturn(orderId, payload);
    logAuditEvent(
      'ORDER_RETURN_UPDATED',
      'Order',
      orderId,
      `Return marked ${payload.status} for ${payload.returnedItems.length} item(s)`,
      payload.reason
    );
    showToast(`Return record saved (${RETURN_STATUS_META[payload.status].label}).`);
  };

  const handleProcessRefund = (orderId: string, payload: ProcessOrderRefundPayload) => {
    if (!canManage) return;
    processOrderRefund(orderId, payload);
    logAuditEvent(
      'ORDER_REFUND_PROCESSED',
      'Order',
      orderId,
      `Refund ${payload.status} for ${formatINR(payload.amountPaise)} via ${payload.method}`,
      payload.reason
    );
    showToast(
      `Refund ${REFUND_STATUS_META[payload.status].label} (${formatINR(payload.amountPaise)}) recorded.`
    );
  };

  const villageOptions = useMemo(() => {
    const names = new Set<string>();
    serviceAreas.forEach((a) => names.add(a.name));
    orders.forEach((o) => {
      if (o.deliveryAddress?.villageName) names.add(o.deliveryAddress.villageName);
    });
    return Array.from(names).sort();
  }, [serviceAreas, orders]);

  // Workflow status counts for dropdown, chips & KPI strip
  const workflowCounts = useMemo(() => {
    const counts: Record<string, number> = { ALL: orders.length };
    orders.forEach((o) => {
      const key = mapOrderStatusToWorkflowKey(o.status);
      counts[key] = (counts[key] || 0) + 1;
    });
    return counts;
  }, [orders]);

  const activeInFlightCount = useMemo(
    () =>
      orders.filter((o) =>
        [
          'placed',
          'pending',
          'accepted',
          'preparing',
          'ready_for_pickup',
          'ready_for_delivery',
          'out_for_delivery',
        ].includes(o.status)
      ).length,
    [orders]
  );

  const slaBreachCount = useMemo(
    () => orders.filter((o) => isFoodPrepSlaBreached(o)).length,
    [orders, platformSettings.foodPrepSlaMins]
  );

  // Filtered Orders
  const filteredOrders = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const now = Date.now();
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    return orders.filter((o) => {
      const landmark = o.deliveryAddress?.landmark || '';
      const phone = o.deliveryAddress?.recipientPhone || o.customerPhone || '';
      const orderVillage = o.deliveryAddress?.villageName || 'Rampur';
      const orderVertical = getOrderPrimaryVertical(o);

      const matchesSearch =
        !q ||
        o.id.toLowerCase().includes(q) ||
        o.orderNumber.toLowerCase().includes(q) ||
        o.sellerName.toLowerCase().includes(q) ||
        o.customerName.toLowerCase().includes(q) ||
        landmark.toLowerCase().includes(q) ||
        phone.toLowerCase().includes(q);

      const matchesStatus = matchesWorkflowFilter(o.status, statusFilter);
      const matchesVillage = villageFilter === 'ALL' || orderVillage === villageFilter;
      const matchesPayment = paymentFilter === 'ALL' || o.paymentMethod === paymentFilter;
      const matchesPaymentStatus =
        paymentStatusFilter === 'ALL' || o.paymentStatus === paymentStatusFilter;
      const matchesFulfilment =
        fulfilmentFilter === 'ALL' || o.fulfilmentMode === fulfilmentFilter;
      const matchesVertical =
        verticalFilter === 'ALL' ||
        orderVertical === verticalFilter ||
        o.items.some((it) => it.catalogueType.toUpperCase() === verticalFilter);

      const createdTs = new Date(o.createdAt).getTime();
      let matchesDate = true;
      if (dateRange === 'TODAY') {
        matchesDate = createdTs >= startOfToday.getTime();
      } else if (dateRange === 'LAST_7_DAYS') {
        matchesDate = createdTs >= now - 7 * 24 * 60 * 60 * 1000;
      } else if (dateRange === 'LAST_30_DAYS') {
        matchesDate = createdTs >= now - 30 * 24 * 60 * 60 * 1000;
      } else if (dateRange === 'CUSTOM') {
        if (customFromDate) {
          const fromTs = new Date(`${customFromDate}T00:00:00`).getTime();
          if (createdTs < fromTs) matchesDate = false;
        }
        if (customToDate) {
          const toTs = new Date(`${customToDate}T23:59:59.999`).getTime();
          if (createdTs > toTs) matchesDate = false;
        }
      }

      return (
        matchesSearch &&
        matchesStatus &&
        matchesVillage &&
        matchesPayment &&
        matchesPaymentStatus &&
        matchesFulfilment &&
        matchesVertical &&
        matchesDate
      );
    });
  }, [
    orders,
    searchQuery,
    statusFilter,
    villageFilter,
    paymentFilter,
    paymentStatusFilter,
    fulfilmentFilter,
    verticalFilter,
    dateRange,
    customFromDate,
    customToDate,
  ]);

  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / PAGE_SIZE));
  const safeCurrentPage = Math.min(currentPage, totalPages);

  const paginatedOrders = useMemo(() => {
    const start = (safeCurrentPage - 1) * PAGE_SIZE;
    return filteredOrders.slice(start, start + PAGE_SIZE);
  }, [filteredOrders, safeCurrentPage]);

  const hasActiveFilters =
    searchQuery.trim() !== '' ||
    statusFilter !== 'ALL' ||
    villageFilter !== 'ALL' ||
    paymentFilter !== 'ALL' ||
    paymentStatusFilter !== 'ALL' ||
    fulfilmentFilter !== 'ALL' ||
    verticalFilter !== 'ALL' ||
    dateRange !== 'ALL';

  const resetFilters = () => {
    setSearchQuery('');
    setStatusFilter('ALL');
    setVillageFilter('ALL');
    setPaymentFilter('ALL');
    setPaymentStatusFilter('ALL');
    setFulfilmentFilter('ALL');
    setVerticalFilter('ALL');
    setDateRange('ALL');
    setCustomFromDate('');
    setCustomToDate('');
    setCurrentPage(1);
  };

  const handleExportOrdersCsv = () => {
    exportToCsv(
      `grambazaar_orders_${new Date().toISOString().split('T')[0]}`,
      [
        { header: 'Order Number', accessor: (o) => o.orderNumber },
        { header: 'Order ID', accessor: (o) => o.id },
        { header: 'Date & Time', accessor: (o) => new Date(o.createdAt).toLocaleString() },
        { header: 'Vertical', accessor: (o) => getOrderPrimaryVertical(o) },
        { header: 'Customer Name', accessor: (o) => o.customerName },
        {
          header: 'Customer Phone',
          accessor: (o) => o.deliveryAddress?.recipientPhone || o.customerPhone,
        },
        { header: 'Merchant Store', accessor: (o) => o.sellerName },
        { header: 'Fulfilment Type', accessor: (o) => o.fulfilmentMode },
        {
          header: 'Village',
          accessor: (o) => o.deliveryAddress?.villageName || 'Store Pickup',
        },
        { header: 'Payment Method', accessor: (o) => o.paymentMethod },
        { header: 'Payment Status', accessor: (o) => o.paymentStatus },
        {
          header: 'Total Discount (INR)',
          accessor: (o) => (computeOrderFinancials(o).totalDiscountPaise / 100).toFixed(2),
        },
        {
          header: 'Tax (INR)',
          accessor: (o) => (computeOrderFinancials(o).taxPaise / 100).toFixed(2),
        },
        { header: 'Total Paid (INR)', accessor: (o) => (o.totalPaise / 100).toFixed(2) },
        {
          header: 'Refund Amount (INR)',
          accessor: (o) => ((o.refundInfo?.amountPaise || 0) / 100).toFixed(2),
        },
        { header: 'Return Status', accessor: (o) => o.returnInfo?.status || 'NONE' },
        { header: 'Refund Status', accessor: (o) => o.refundInfo?.status || 'NONE' },
        { header: 'Order Status', accessor: (o) => ORDER_STATUS_META[o.status]?.label || o.status },
      ],
      filteredOrders
    );
  };

  return (
    <div className="space-y-5 animate-fade-in text-left">
      {/* Breadcrumb + Header */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 shadow-xs space-y-4">
        <div className="flex items-center gap-1.5 text-xs text-[#6B7280] font-medium">
          <span>Admin Panel</span>
          <ChevronRight className="w-3.5 h-3.5" />
          <span>Operations</span>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-[#1F2937] font-semibold">Order Management</span>
        </div>

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h1 className="text-xl font-black text-[#1F2937]">Order Management & Oversight</h1>
              <Badge variant="primary">{orders.length} Total</Badge>
              {(workflowCounts.returned || 0) > 0 && (
                <Badge variant="warning" size="sm">
                  {workflowCounts.returned} Returned
                </Badge>
              )}
              {(workflowCounts.refunded || 0) > 0 && (
                <Badge variant="info" size="sm">
                  {workflowCounts.refunded} Refunded
                </Badge>
              )}
              {slaBreachCount > 0 && (
                <Badge variant="error" size="sm">
                  <span className="inline-flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    {slaBreachCount} SLA Alert{slaBreachCount > 1 ? 's' : ''}
                  </span>
                </Badge>
              )}
            </div>
            <p className="text-xs text-[#6B7280]">
              Track full order lifecycles, food prep SLAs ({platformSettings.foodPrepSlaMins}m), inline status workflows, cancellations, returns, and customer refunds.
            </p>
          </div>

          {/* Search & Export */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <div className="relative min-w-[240px] sm:w-72">
              <Search className="w-4 h-4 text-[#6B7280] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Search Order ID, customer, shop, phone..."
                className="w-full h-10 pl-10 pr-4 bg-[#F8FAFC] border border-[#E5E7EB] rounded-full text-xs text-[#1F2937] outline-none focus:border-[#218838] focus:bg-white"
              />
            </div>
            {canExport && (
              <Button
                variant="secondary"
                size="sm"
                onClick={handleExportOrdersCsv}
                disabled={filteredOrders.length === 0}
                leftIcon={<Download className="w-3.5 h-3.5" />}
              >
                Export CSV
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Feedback Toast */}
      {toast && (
        <div
          role="status"
          className="bg-[#E8F5E9] border border-[#A7F3D0] text-[#176B2C] px-4 py-3 rounded-xl text-xs font-semibold flex items-center justify-between gap-2 shadow-2xs"
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#218838] shrink-0" />
            <span>{toast.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setToast(null)}
            className="text-[#176B2C]/70 hover:text-[#176B2C] text-xs font-bold cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Quick Operational KPI Strip (Clickable Quick Filters) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          {
            label: 'All Orders',
            value: orders.length,
            icon: ClipboardList,
            accent: 'text-[#1F2937] bg-[#F1F5F9]',
            targetStatus: 'ALL' as const,
          },
          {
            label: 'Active In-Flight',
            value: activeInFlightCount,
            icon: Clock,
            accent: 'text-[#4F46E5] bg-[#EEF2FF]',
            targetStatus: 'new' as const,
          },
          {
            label: 'Delivered',
            value: workflowCounts.delivered || 0,
            icon: CheckCircle2,
            accent: 'text-[#16A34A] bg-[#DCFCE7]',
            targetStatus: 'delivered' as const,
          },
          {
            label: 'Returned Orders',
            value: workflowCounts.returned || 0,
            icon: RotateCcw,
            accent: 'text-[#E11D48] bg-[#FFE4E6]',
            targetStatus: 'returned' as const,
          },
          {
            label: 'Refunded Orders',
            value: workflowCounts.refunded || 0,
            icon: RefreshCw,
            accent: 'text-[#218838] bg-[#E8F5E9]',
            targetStatus: 'refunded' as const,
          },
          {
            label: 'Cancelled',
            value: workflowCounts.cancelled || 0,
            icon: XCircle,
            accent: 'text-[#DC2626] bg-[#FEE2E2]',
            targetStatus: 'cancelled' as const,
          },
        ].map((card) => {
          const Icon = card.icon;
          const isSelected = statusFilter === card.targetStatus;
          return (
            <button
              key={card.label}
              type="button"
              onClick={() => {
                setStatusFilter(card.targetStatus);
                setCurrentPage(1);
              }}
              className={`bg-white rounded-xl border p-3.5 text-left transition-all cursor-pointer hover:border-[#218838] ${
                isSelected ? 'border-[#218838] ring-2 ring-[#E8F5E9]' : 'border-[#E5E7EB]'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-semibold text-[#6B7280]">{card.label}</span>
                <span className={`w-7 h-7 rounded-lg flex items-center justify-center ${card.accent}`}>
                  <Icon className="w-3.5 h-3.5" />
                </span>
              </div>
              <p className="text-xl font-black text-[#1F2937] mt-1.5">{card.value}</p>
            </button>
          );
        })}
      </div>

      {/* Multi-Dimensional Filter Bar */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] p-4 shadow-xs space-y-3.5">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-3">
          {/* Status Workflow Dropdown Filter */}
          <div>
            <label className="block text-[11px] font-bold text-[#6B7280] mb-1">
              Status Workflow
            </label>
            <OrderStatusFilterDropdown
              value={statusFilter}
              counts={workflowCounts}
              totalCount={orders.length}
              onChange={(next) => {
                setStatusFilter(next);
                setCurrentPage(1);
              }}
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-[#6B7280] mb-1">Vertical</label>
            <select
              value={verticalFilter}
              onChange={(e) => {
                setVerticalFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full h-9 px-3 bg-[#F8FAFC] border border-[#E5E7EB] rounded-xl text-xs font-semibold text-[#1F2937] outline-none focus:border-[#218838]"
            >
              <option value="ALL">All Verticals</option>
              {verticalConfigs.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-[#6B7280] mb-1">
              Village Territory
            </label>
            <select
              value={villageFilter}
              onChange={(e) => {
                setVillageFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full h-9 px-3 bg-[#F8FAFC] border border-[#E5E7EB] rounded-xl text-xs font-semibold text-[#1F2937] outline-none focus:border-[#218838]"
            >
              <option value="ALL">All Villages</option>
              {villageOptions.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-[#6B7280] mb-1">
              Payment Method
            </label>
            <select
              value={paymentFilter}
              onChange={(e) => {
                setPaymentFilter(e.target.value as 'ALL' | PaymentMethod);
                setCurrentPage(1);
              }}
              className="w-full h-9 px-3 bg-[#F8FAFC] border border-[#E5E7EB] rounded-xl text-xs font-semibold text-[#1F2937] outline-none focus:border-[#218838]"
            >
              <option value="ALL">All Methods</option>
              <option value="COD">Cash on Delivery (COD)</option>
              <option value="SELLER_UPI">Seller UPI</option>
              <option value="UDHAR">Village Udhari Credit</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-[#6B7280] mb-1">
              Payment Status
            </label>
            <select
              value={paymentStatusFilter}
              onChange={(e) => {
                setPaymentStatusFilter(e.target.value as 'ALL' | PaymentStatus);
                setCurrentPage(1);
              }}
              className="w-full h-9 px-3 bg-[#F8FAFC] border border-[#E5E7EB] rounded-xl text-xs font-semibold text-[#1F2937] outline-none focus:border-[#218838]"
            >
              <option value="ALL">All Payment Statuses</option>
              <option value="pending">Pending</option>
              <option value="collected">Paid / Collected</option>
              <option value="settled">Settled</option>
              <option value="refunded">Refunded</option>
              <option value="partially_refunded">Partially Refunded</option>
              <option value="reversed">Reversed / Void</option>
              <option value="failed">Payment Failed</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-[#6B7280] mb-1">
              Fulfillment Type
            </label>
            <select
              value={fulfilmentFilter}
              onChange={(e) => {
                setFulfilmentFilter(e.target.value as 'ALL' | 'DELIVERY' | 'PICKUP');
                setCurrentPage(1);
              }}
              className="w-full h-9 px-3 bg-[#F8FAFC] border border-[#E5E7EB] rounded-xl text-xs font-semibold text-[#1F2937] outline-none focus:border-[#218838]"
            >
              <option value="ALL">All Modes</option>
              <option value="DELIVERY">Doorstep Delivery</option>
              <option value="PICKUP">Self-Pickup</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-[#6B7280] mb-1">Date Filter</label>
            <select
              value={dateRange}
              onChange={(e) => {
                setDateRange(e.target.value as DateRangeFilter);
                setCurrentPage(1);
              }}
              className="w-full h-9 px-3 bg-[#F8FAFC] border border-[#E5E7EB] rounded-xl text-xs font-semibold text-[#1F2937] outline-none focus:border-[#218838]"
            >
              <option value="ALL">All Dates</option>
              <option value="TODAY">Today</option>
              <option value="LAST_7_DAYS">Last 7 Days</option>
              <option value="LAST_30_DAYS">Last 30 Days</option>
              <option value="CUSTOM">Custom Range</option>
            </select>
          </div>
        </div>

        {/* Custom Date Range Pickers */}
        {dateRange === 'CUSTOM' && (
          <div className="flex flex-wrap items-center gap-3 p-3 rounded-xl bg-[#F8FAFC] border border-[#E5E7EB] text-xs">
            <div className="flex items-center gap-1.5 font-semibold text-[#475569]">
              <Calendar className="w-3.5 h-3.5 text-[#218838]" />
              <span>Date Range:</span>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-[11px] text-[#6B7280]">From</label>
              <input
                type="date"
                value={customFromDate}
                onChange={(e) => {
                  setCustomFromDate(e.target.value);
                  setCurrentPage(1);
                }}
                className="h-8 px-2.5 bg-white border border-[#E5E7EB] rounded-lg text-xs text-[#1F2937]"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-[11px] text-[#6B7280]">To</label>
              <input
                type="date"
                value={customToDate}
                onChange={(e) => {
                  setCustomToDate(e.target.value);
                  setCurrentPage(1);
                }}
                className="h-8 px-2.5 bg-white border border-[#E5E7EB] rounded-lg text-xs text-[#1F2937]"
              />
            </div>
          </div>
        )}

        {/* Status-Specific Colored Workflow Filter Chips */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2.5 border-t border-[#E5E7EB]">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            <button
              type="button"
              onClick={() => {
                setStatusFilter('ALL');
                setCurrentPage(1);
              }}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap cursor-pointer transition-colors ${
                statusFilter === 'ALL'
                  ? 'bg-[#218838] text-white'
                  : 'bg-[#F8FAFC] text-[#475569] border border-[#E5E7EB] hover:bg-slate-100'
              }`}
            >
              <span>All Orders</span>
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                  statusFilter === 'ALL' ? 'bg-white/20 text-white' : 'bg-[#E2E8F0] text-[#475569]'
                }`}
              >
                {orders.length}
              </span>
            </button>

            {WORKFLOW_STATUS_OPTIONS.map((opt) => {
              const count = workflowCounts[opt.key] || 0;
              const isSelected = statusFilter === opt.key;
              return (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => {
                    setStatusFilter(opt.key);
                    setCurrentPage(1);
                  }}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap cursor-pointer border transition-all ${
                    isSelected
                      ? `${opt.bgClass} ${opt.textClass} ${opt.borderClass} ring-2 ring-offset-1 ring-[#218838]/30`
                      : 'bg-[#F8FAFC] text-[#475569] border-[#E5E7EB] hover:bg-slate-100'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full shrink-0 ${opt.dotClass}`} />
                  <span>{opt.label}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                      isSelected ? 'bg-white/70 text-[#1F2937]' : 'bg-[#E2E8F0] text-[#475569]'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={resetFilters}
              leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
            >
              Reset
            </Button>
          )}
        </div>
      </div>

      {/* Orders Listing (Desktop Table + Mobile Responsive Cards) */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-xs">
        {paginatedOrders.length > 0 ? (
          <>
            {/* Desktop / Tablet Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-[#F8FAFC] text-[#6B7280] uppercase tracking-wider font-semibold border-b border-[#E5E7EB]">
                  <tr>
                    <th className="py-3.5 px-4 first:rounded-tl-2xl">Order & Placed Time</th>
                    <th className="py-3.5 px-4">Customer & Village</th>
                    <th className="py-3.5 px-4">Vertical & Shop</th>
                    <th className="py-3.5 px-4">Total & Refunds</th>
                    <th className="py-3.5 px-4">Payment</th>
                    <th className="py-3.5 px-4">Status Workflow</th>
                    <th className="py-3.5 px-4 text-right last:rounded-tr-2xl">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E7EB]">
                  {paginatedOrders.map((order, rowIdx) => {
                    const primaryVertical = getOrderPrimaryVertical(order);
                    const slaBreached = isFoodPrepSlaBreached(order);
                    const payStatusMeta = PAYMENT_STATUS_META[order.paymentStatus];
                    const fin = computeOrderFinancials(order);
                    const openUpward =
                      paginatedOrders.length > 3 && rowIdx >= paginatedOrders.length - 3;

                    return (
                      <tr
                        key={order.id}
                        tabIndex={0}
                        role="button"
                        aria-label={`Inspect order ${order.orderNumber} from ${order.sellerName}`}
                        onClick={() => setSelectedOrderId(order.id)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            setSelectedOrderId(order.id);
                          }
                        }}
                        className="cursor-pointer hover:bg-emerald-50/30 focus:bg-emerald-50/40 focus:outline-none transition-colors group"
                      >
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <p className="font-mono font-bold text-[#1F2937] group-hover:text-[#218838] transition-colors">
                            {order.orderNumber}
                          </p>
                          <p className="text-[11px] text-[#6B7280]">
                            {new Date(order.createdAt).toLocaleDateString('en-IN', {
                              day: '2-digit',
                              month: 'short',
                            })}{' '}
                            •{' '}
                            {new Date(order.createdAt).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                          <p className="text-[10px] text-[#94A3B8]">
                            {fin.totalQuantity} item{fin.totalQuantity !== 1 ? 's' : ''}
                          </p>
                        </td>

                        <td className="py-3.5 px-4">
                          <p className="font-bold text-[#1F2937]">{order.customerName}</p>
                          <p className="text-[11px] text-[#6B7280]">
                            {order.deliveryAddress?.villageName || 'Store Pickup'} •{' '}
                            {order.deliveryAddress?.recipientPhone || order.customerPhone}
                          </p>
                          {order.deliveryAddress?.landmark && (
                            <p className="text-[10px] text-[#94A3B8] truncate max-w-[180px]">
                              {order.deliveryAddress.landmark}
                            </p>
                          )}
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-1.5 mb-0.5">
                            <VerticalBadge vertical={primaryVertical} />
                            <span className="font-bold text-[#1F2937] truncate max-w-[170px]">
                              {order.sellerName}
                            </span>
                          </div>
                          <p className="text-[11px] text-[#6B7280] inline-flex items-center gap-1">
                            {order.fulfilmentMode === 'DELIVERY' ? (
                              <>
                                <Truck className="w-3 h-3" /> Doorstep Delivery
                              </>
                            ) : (
                              <>
                                <Store className="w-3 h-3" /> Self-Pickup
                              </>
                            )}
                          </p>
                        </td>

                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <p className="font-bold text-[#1F2937]">{formatINR(order.totalPaise)}</p>
                          {fin.totalDiscountPaise > 0 && (
                            <p className="text-[10px] font-semibold text-[#16A34A]">
                              Saved {formatINR(fin.totalDiscountPaise)}
                            </p>
                          )}
                          {order.refundInfo && (
                            <p className="text-[10px] font-semibold text-[#D97706]">
                              Refund: {formatINR(order.refundInfo.amountPaise)} (
                              {REFUND_STATUS_META[order.refundInfo.status].label})
                            </p>
                          )}
                        </td>

                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <div className="flex flex-col items-start gap-1">
                            <Badge
                              variant={
                                order.paymentMethod === 'UDHAR'
                                  ? 'warning'
                                  : order.paymentMethod === 'SELLER_UPI'
                                  ? 'info'
                                  : 'neutral'
                              }
                              size="sm"
                            >
                              {order.paymentMethod === 'SELLER_UPI' ? 'UPI' : order.paymentMethod}
                            </Badge>
                            <Badge variant={payStatusMeta.variant} size="sm">
                              {payStatusMeta.label}
                            </Badge>
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <OrderStatusWorkflowDropdown
                              currentStatus={order.status}
                              fulfilmentMode={order.fulfilmentMode}
                              disabled={!canManage}
                              openUpward={openUpward}
                              onSelectWorkflowStatus={(nextKey) =>
                                handleInlineWorkflowChange(order, nextKey)
                              }
                            />
                            {slaBreached && (
                              <span
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#FEE2E2] text-[#991B1B] border border-[#FCA5A5] text-[10px] font-bold"
                                title={`Food preparation exceeded ${platformSettings.foodPrepSlaMins} minute SLA`}
                              >
                                <AlertTriangle className="w-3 h-3" />
                                SLA
                              </span>
                            )}
                          </div>
                          {order.returnInfo && order.status !== 'refunded' && (
                            <p className="text-[10px] text-[#9F1239] font-medium mt-1">
                              {RETURN_STATUS_META[order.returnInfo.status].label}
                            </p>
                          )}
                        </td>

                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedOrderId(order.id);
                            }}
                            leftIcon={<Eye className="w-3.5 h-3.5" />}
                          >
                            Inspect
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Card Layout (<md) */}
            <div className="md:hidden divide-y divide-[#E5E7EB]">
              {paginatedOrders.map((order, idx) => {
                const primaryVertical = getOrderPrimaryVertical(order);
                const payStatusMeta = PAYMENT_STATUS_META[order.paymentStatus];
                const openUpward = paginatedOrders.length > 2 && idx >= paginatedOrders.length - 2;

                return (
                  <div
                    key={order.id}
                    onClick={() => setSelectedOrderId(order.id)}
                    className="p-4 space-y-2.5 hover:bg-[#F8FAFC] transition-colors cursor-pointer"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-mono font-bold text-sm text-[#1F2937]">
                          {order.orderNumber}
                        </p>
                        <p className="text-[11px] text-[#6B7280]">
                          {order.customerName} • {order.deliveryAddress?.villageName || 'Pickup'}
                        </p>
                      </div>
                      <OrderStatusWorkflowDropdown
                        currentStatus={order.status}
                        fulfilmentMode={order.fulfilmentMode}
                        disabled={!canManage}
                        openUpward={openUpward}
                        onSelectWorkflowStatus={(nextKey) =>
                          handleInlineWorkflowChange(order, nextKey)
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <VerticalBadge vertical={primaryVertical} />
                        <span className="font-semibold text-[#1F2937] truncate">
                          {order.sellerName}
                        </span>
                      </div>
                      <span className="font-black text-[#218838] shrink-0">
                        {formatINR(order.totalPaise)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-2 pt-1.5 border-t border-[#E5E7EB]">
                      <div className="flex items-center gap-1.5">
                        <Badge variant="neutral" size="sm">
                          {order.paymentMethod === 'SELLER_UPI' ? 'UPI' : order.paymentMethod}
                        </Badge>
                        <Badge variant={payStatusMeta.variant} size="sm">
                          {payStatusMeta.label}
                        </Badge>
                      </div>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedOrderId(order.id);
                        }}
                        leftIcon={<Eye className="w-3.5 h-3.5" />}
                      >
                        Inspect
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          <div className="p-8">
            <EmptyState
              icon={<ClipboardList className="w-6 h-6" />}
              title="No matching orders found"
              description="Try adjusting your search query or clearing active status, payment, village, or date filters."
              actionText={hasActiveFilters ? 'Reset All Filters' : undefined}
              onAction={hasActiveFilters ? resetFilters : undefined}
            />
          </div>
        )}
      </div>

      {/* Pagination */}
      {filteredOrders.length > 0 && (
        <Pagination
          currentPage={safeCurrentPage}
          totalPages={totalPages}
          totalRecords={filteredOrders.length}
          pageSize={PAGE_SIZE}
          onPageChange={setCurrentPage}
        />
      )}

      {/* Detailed Order Management Drawer */}
      <AdminOrderDetailDrawer
        order={selectedOrder}
        isOpen={Boolean(selectedOrder)}
        onClose={() => setSelectedOrderId(null)}
        adminName={currentAdmin?.name || 'Super Admin'}
        onStatusChange={canManage ? handleStatusOverride : undefined}
        onCancelOrder={canManage ? handleAdminCancelOrder : undefined}
        onRecordReturn={canManage ? handleRecordReturn : undefined}
        onProcessRefund={canManage ? handleProcessRefund : undefined}
      />

      {/* Inline Workflow Confirmation Modals (Triggered when selecting Cancelled / Returned / Refunded) */}
      <AdminCancelOrderModal
        order={cancelModalOrder}
        isOpen={Boolean(cancelModalOrder)}
        onClose={() => setCancelModalOrderId(null)}
        onConfirmCancel={handleAdminCancelOrder}
      />

      <RecordReturnModal
        order={returnModalOrder}
        isOpen={Boolean(returnModalOrder)}
        onClose={() => setReturnModalOrderId(null)}
        onConfirmReturn={handleRecordReturn}
      />

      <ProcessRefundModal
        order={refundModalOrder}
        isOpen={Boolean(refundModalOrder)}
        onClose={() => setRefundModalOrderId(null)}
        adminName={currentAdmin?.name || 'Super Admin'}
        onConfirmRefund={handleProcessRefund}
      />
    </div>
  );
};
