/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  ChevronRight,
  Clock,
  CreditCard,
  Download,
  Eye,
  Filter,
  IndianRupee,
  Info,
  Package,
  RefreshCcw,
  RotateCcw,
  Search,
  TrendingUp,
  Wallet,
  XCircle,
} from 'lucide-react';
import { useAdmin } from '../../contexts/AdminContext';
import { useOrders } from '../../contexts/OrderContext';
import {
  PaymentTransactionRecord,
  RefundLedgerRecord,
  SellerPayoutRecord,
} from '../../types/admin';
import { KPICard } from '../../components/data-display/KPICard';
import { Pagination } from '../../components/data-display/Pagination';
import { EmptyState } from '../../components/feedback/EmptyState';
import { Tabs } from '../../components/ui/Tabs';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { formatINR } from '../../utils/currency';
import { formatDateTime } from '../../utils/dates';
import { exportToCsv } from '../../utils/exportCsv';
import {
  FinanceDatePreset,
  PAYOUT_STATUS_META,
  PAYMENT_METHOD_META,
  REFUND_CHANNEL_LABELS,
  REFUND_STATUS_META,
  TXN_STATUS_META,
  computeFinanceOverview,
  computeSellerBreakdown,
  matchesFinanceDateRange,
} from './components/finance/financeHelpers';
import {
  MarkProcessingModal,
  RefundDecisionModal,
  SettlePayoutModal,
} from './components/finance/FinanceActionModals';
import {
  RefundDetailDrawer,
  RelatedOrderSnapshotModal,
  SettlementDetailDrawer,
  TransactionDetailDrawer,
} from './components/finance/FinanceDetailDrawers';
import { FinanceRevenueSummaryTab } from './components/finance/FinanceRevenueSummaryTab';

type FinanceTabKey = 'PAYOUTS' | 'TRANSACTIONS' | 'FAILED_PAYMENTS' | 'REFUNDS' | 'REVENUE';

const PAGE_SIZE = 6;

const DATE_PRESET_OPTIONS: { value: FinanceDatePreset; label: string }[] = [
  { value: 'ALL', label: 'All Dates' },
  { value: '7D', label: 'Last 7 Days' },
  { value: '30D', label: 'Last 30 Days' },
  { value: '90D', label: 'Last 90 Days' },
  { value: 'CUSTOM', label: 'Custom Range' },
];

export const AdminPayoutsView: React.FC = () => {
  const {
    payouts,
    paymentTransactions,
    refundLedger,
    settleSellerPayout,
    markPayoutProcessing,
    updateRefundStatus,
    hasPermission,
  } = useAdmin();

  const { orders } = useOrders();

  const canManage = hasPermission('PAYOUTS', 'manage');
  const canApprove = hasPermission('PAYOUTS', 'approve');
  const canExport = hasPermission('PAYOUTS', 'export');

  const [activeTab, setActiveTab] = useState<FinanceTabKey>('PAYOUTS');
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // ── Filter States: Seller Settlements ──────────────────────────────────
  const [payoutSearch, setPayoutSearch] = useState('');
  const [payoutStatusFilter, setPayoutStatusFilter] = useState<'ALL' | SellerPayoutRecord['status']>('ALL');
  const [payoutSellerFilter, setPayoutSellerFilter] = useState('ALL');
  const [payoutVillageFilter, setPayoutVillageFilter] = useState('ALL');
  const [payoutDatePreset, setPayoutDatePreset] = useState<FinanceDatePreset>('ALL');
  const [payoutCustomFrom, setPayoutCustomFrom] = useState('');
  const [payoutCustomTo, setPayoutCustomTo] = useState('');
  const [payoutPage, setPayoutPage] = useState(1);

  // ── Filter States: Customer Payment Transactions ───────────────────────
  const [txnSearch, setTxnSearch] = useState('');
  const [txnOrderIdFilter, setTxnOrderIdFilter] = useState('');
  const [txnStatusFilter, setTxnStatusFilter] = useState<'ALL' | 'SUCCESSFUL' | 'PENDING' | 'FAILED' | 'REFUNDED'>('ALL');
  const [txnMethodFilter, setTxnMethodFilter] = useState<'ALL' | PaymentTransactionRecord['method']>('ALL');
  const [txnVillageFilter, setTxnVillageFilter] = useState('ALL');
  const [txnDatePreset, setTxnDatePreset] = useState<FinanceDatePreset>('ALL');
  const [txnCustomFrom, setTxnCustomFrom] = useState('');
  const [txnCustomTo, setTxnCustomTo] = useState('');
  const [txnPage, setTxnPage] = useState(1);

  // ── Filter States: Dedicated Failed Payments ───────────────────────────
  const [failedSearch, setFailedSearch] = useState('');
  const [failedMethodFilter, setFailedMethodFilter] = useState<'ALL' | PaymentTransactionRecord['method']>('ALL');
  const [failedVillageFilter, setFailedVillageFilter] = useState('ALL');
  const [failedDatePreset, setFailedDatePreset] = useState<FinanceDatePreset>('ALL');
  const [failedCustomFrom, setFailedCustomFrom] = useState('');
  const [failedCustomTo, setFailedCustomTo] = useState('');
  const [failedPage, setFailedPage] = useState(1);

  // ── Filter States: Refunds Queue ───────────────────────────────────────
  const [refundSearch, setRefundSearch] = useState('');
  const [refundStatusFilter, setRefundStatusFilter] = useState<'ALL' | RefundLedgerRecord['status']>('ALL');
  const [refundMethodFilter, setRefundMethodFilter] = useState<'ALL' | RefundLedgerRecord['refundChannel']>('ALL');
  const [refundDatePreset, setRefundDatePreset] = useState<FinanceDatePreset>('ALL');
  const [refundCustomFrom, setRefundCustomFrom] = useState('');
  const [refundCustomTo, setRefundCustomTo] = useState('');
  const [refundPage, setRefundPage] = useState(1);

  // ── Filter States: Platform Revenue & Earnings ─────────────────────────
  const [revDatePreset, setRevDatePreset] = useState<FinanceDatePreset>('ALL');
  const [revCustomFrom, setRevCustomFrom] = useState('');
  const [revCustomTo, setRevCustomTo] = useState('');

  // ── Drawer & Confirmation Modal Selection (ID-based so state stays live) ─
  const [selectedTxnId, setSelectedTxnId] = useState<string | null>(null);
  const [selectedPayoutId, setSelectedPayoutId] = useState<string | null>(null);
  const [selectedRefundId, setSelectedRefundId] = useState<string | null>(null);
  const [relatedOrderModalRef, setRelatedOrderModalRef] = useState<{
    orderId: string;
    txnId?: string;
  } | null>(null);

  const [settlingPayoutId, setSettlingPayoutId] = useState<string | null>(null);
  const [processingPayoutId, setProcessingPayoutId] = useState<string | null>(null);
  const [refundDecision, setRefundDecision] = useState<{
    refundId: string;
    mode: 'APPROVE' | 'REJECT';
  } | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  // ── Overview KPI Metrics (double-count-free & GMV-separated) ───────────
  const overviewMetrics = useMemo(
    () => computeFinanceOverview(payouts, paymentTransactions, refundLedger),
    [payouts, paymentTransactions, refundLedger]
  );

  // ── Unique Filter Option Lists ─────────────────────────────────────────
  const payoutSellers = useMemo(() => {
    const map = new Map<string, string>();
    payouts.forEach((p) => map.set(p.sellerId, p.sellerName));
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [payouts]);

  const payoutVillages = useMemo(
    () => Array.from(new Set(payouts.map((p) => p.villageName))).sort(),
    [payouts]
  );

  const txnVillages = useMemo(
    () => Array.from(new Set(paymentTransactions.map((t) => t.villageName))).sort(),
    [paymentTransactions]
  );

  const failedTransactionsAll = useMemo(
    () => paymentTransactions.filter((t) => t.status === 'FAILED'),
    [paymentTransactions]
  );

  // ── Filtered Lists ─────────────────────────────────────────────────────
  const filteredPayouts = useMemo(() => {
    const q = payoutSearch.trim().toLowerCase();
    return payouts.filter((p) => {
      if (payoutStatusFilter !== 'ALL' && p.status !== payoutStatusFilter) return false;
      if (payoutSellerFilter !== 'ALL' && p.sellerId !== payoutSellerFilter) return false;
      if (payoutVillageFilter !== 'ALL' && p.villageName !== payoutVillageFilter) return false;
      if (
        !matchesFinanceDateRange(
          p.settledAt || p.settlementDate,
          payoutDatePreset,
          payoutCustomFrom,
          payoutCustomTo
        )
      ) {
        return false;
      }
      if (q) {
        const hay = `${p.id} ${p.sellerName} ${p.sellerId} ${p.utrNumber || ''} ${p.villageName} ${p.periodLabel}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [
    payouts,
    payoutSearch,
    payoutStatusFilter,
    payoutSellerFilter,
    payoutVillageFilter,
    payoutDatePreset,
    payoutCustomFrom,
    payoutCustomTo,
  ]);

  const filteredTransactions = useMemo(() => {
    const q = txnSearch.trim().toLowerCase();
    const oidQ = txnOrderIdFilter.trim().toLowerCase();
    return paymentTransactions.filter((t) => {
      const meta = TXN_STATUS_META[t.status];
      if (txnStatusFilter !== 'ALL' && meta.filterGroup !== txnStatusFilter) return false;
      if (txnMethodFilter !== 'ALL' && t.method !== txnMethodFilter) return false;
      if (txnVillageFilter !== 'ALL' && t.villageName !== txnVillageFilter) return false;
      if (!matchesFinanceDateRange(t.createdAt, txnDatePreset, txnCustomFrom, txnCustomTo)) {
        return false;
      }
      if (oidQ && !t.orderId.toLowerCase().includes(oidQ)) return false;
      if (q) {
        const hay = `${t.id} ${t.orderId} ${t.customerName} ${t.customerPhone || ''} ${t.sellerName} ${t.gatewayRef}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [
    paymentTransactions,
    txnSearch,
    txnOrderIdFilter,
    txnStatusFilter,
    txnMethodFilter,
    txnVillageFilter,
    txnDatePreset,
    txnCustomFrom,
    txnCustomTo,
  ]);

  const filteredFailedPayments = useMemo(() => {
    const q = failedSearch.trim().toLowerCase();
    return failedTransactionsAll.filter((t) => {
      if (failedMethodFilter !== 'ALL' && t.method !== failedMethodFilter) return false;
      if (failedVillageFilter !== 'ALL' && t.villageName !== failedVillageFilter) return false;
      if (!matchesFinanceDateRange(t.createdAt, failedDatePreset, failedCustomFrom, failedCustomTo)) {
        return false;
      }
      if (q) {
        const hay = `${t.id} ${t.orderId} ${t.customerName} ${t.customerPhone || ''} ${t.sellerName} ${t.failureReason || ''} ${t.gatewayRef}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [
    failedTransactionsAll,
    failedSearch,
    failedMethodFilter,
    failedVillageFilter,
    failedDatePreset,
    failedCustomFrom,
    failedCustomTo,
  ]);

  const filteredRefunds = useMemo(() => {
    const q = refundSearch.trim().toLowerCase();
    return refundLedger.filter((r) => {
      if (refundStatusFilter !== 'ALL' && r.status !== refundStatusFilter) return false;
      if (refundMethodFilter !== 'ALL' && r.refundChannel !== refundMethodFilter) return false;
      if (!matchesFinanceDateRange(r.requestedAt, refundDatePreset, refundCustomFrom, refundCustomTo)) {
        return false;
      }
      if (q) {
        const hay = `${r.id} ${r.orderId} ${r.customerName} ${r.customerPhone || ''} ${r.sellerName} ${r.reason}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [
    refundLedger,
    refundSearch,
    refundStatusFilter,
    refundMethodFilter,
    refundDatePreset,
    refundCustomFrom,
    refundCustomTo,
  ]);

  // ── Pagination Slicing ─────────────────────────────────────────────────
  const payoutTotalPages = Math.max(1, Math.ceil(filteredPayouts.length / PAGE_SIZE));
  const safePayoutPage = Math.min(payoutPage, payoutTotalPages);
  const paginatedPayouts = useMemo(
    () => filteredPayouts.slice((safePayoutPage - 1) * PAGE_SIZE, safePayoutPage * PAGE_SIZE),
    [filteredPayouts, safePayoutPage]
  );

  const txnTotalPages = Math.max(1, Math.ceil(filteredTransactions.length / PAGE_SIZE));
  const safeTxnPage = Math.min(txnPage, txnTotalPages);
  const paginatedTxns = useMemo(
    () => filteredTransactions.slice((safeTxnPage - 1) * PAGE_SIZE, safeTxnPage * PAGE_SIZE),
    [filteredTransactions, safeTxnPage]
  );

  const failedTotalPages = Math.max(1, Math.ceil(filteredFailedPayments.length / PAGE_SIZE));
  const safeFailedPage = Math.min(failedPage, failedTotalPages);
  const paginatedFailed = useMemo(
    () => filteredFailedPayments.slice((safeFailedPage - 1) * PAGE_SIZE, safeFailedPage * PAGE_SIZE),
    [filteredFailedPayments, safeFailedPage]
  );

  const refundTotalPages = Math.max(1, Math.ceil(filteredRefunds.length / PAGE_SIZE));
  const safeRefundPage = Math.min(refundPage, refundTotalPages);
  const paginatedRefunds = useMemo(
    () => filteredRefunds.slice((safeRefundPage - 1) * PAGE_SIZE, safeRefundPage * PAGE_SIZE),
    [filteredRefunds, safeRefundPage]
  );

  // ── Active Drawer / Modal Entities ─────────────────────────────────────
  const selectedTxn = useMemo(
    () => paymentTransactions.find((t) => t.id === selectedTxnId) || null,
    [paymentTransactions, selectedTxnId]
  );
  const selectedPayout = useMemo(
    () => payouts.find((p) => p.id === selectedPayoutId) || null,
    [payouts, selectedPayoutId]
  );
  const selectedRefund = useMemo(
    () => refundLedger.find((r) => r.id === selectedRefundId) || null,
    [refundLedger, selectedRefundId]
  );
  const settlingPayout = useMemo(
    () => payouts.find((p) => p.id === settlingPayoutId) || null,
    [payouts, settlingPayoutId]
  );
  const processingPayout = useMemo(
    () => payouts.find((p) => p.id === processingPayoutId) || null,
    [payouts, processingPayoutId]
  );
  const activeDecisionRefund = useMemo(
    () => (refundDecision ? refundLedger.find((r) => r.id === refundDecision.refundId) || null : null),
    [refundLedger, refundDecision]
  );

  const findRelatedOrder = (orderId: string | undefined) => {
    if (!orderId) return undefined;
    return orders.find((o) => o.orderNumber === orderId || o.id === orderId);
  };

  // ── Filter Reset Helpers ───────────────────────────────────────────────
  const hasPayoutFilters =
    Boolean(payoutSearch.trim()) ||
    payoutStatusFilter !== 'ALL' ||
    payoutSellerFilter !== 'ALL' ||
    payoutVillageFilter !== 'ALL' ||
    payoutDatePreset !== 'ALL';

  const resetPayoutFilters = () => {
    setPayoutSearch('');
    setPayoutStatusFilter('ALL');
    setPayoutSellerFilter('ALL');
    setPayoutVillageFilter('ALL');
    setPayoutDatePreset('ALL');
    setPayoutCustomFrom('');
    setPayoutCustomTo('');
    setPayoutPage(1);
  };

  const hasTxnFilters =
    Boolean(txnSearch.trim()) ||
    Boolean(txnOrderIdFilter.trim()) ||
    txnStatusFilter !== 'ALL' ||
    txnMethodFilter !== 'ALL' ||
    txnVillageFilter !== 'ALL' ||
    txnDatePreset !== 'ALL';

  const resetTxnFilters = () => {
    setTxnSearch('');
    setTxnOrderIdFilter('');
    setTxnStatusFilter('ALL');
    setTxnMethodFilter('ALL');
    setTxnVillageFilter('ALL');
    setTxnDatePreset('ALL');
    setTxnCustomFrom('');
    setTxnCustomTo('');
    setTxnPage(1);
  };

  const hasFailedFilters =
    Boolean(failedSearch.trim()) ||
    failedMethodFilter !== 'ALL' ||
    failedVillageFilter !== 'ALL' ||
    failedDatePreset !== 'ALL';

  const resetFailedFilters = () => {
    setFailedSearch('');
    setFailedMethodFilter('ALL');
    setFailedVillageFilter('ALL');
    setFailedDatePreset('ALL');
    setFailedCustomFrom('');
    setFailedCustomTo('');
    setFailedPage(1);
  };

  const hasRefundFilters =
    Boolean(refundSearch.trim()) ||
    refundStatusFilter !== 'ALL' ||
    refundMethodFilter !== 'ALL' ||
    refundDatePreset !== 'ALL';

  const resetRefundFilters = () => {
    setRefundSearch('');
    setRefundStatusFilter('ALL');
    setRefundMethodFilter('ALL');
    setRefundDatePreset('ALL');
    setRefundCustomFrom('');
    setRefundCustomTo('');
    setRefundPage(1);
  };

  // ── Context-Aware CSV Export (Respects Active Tab & Active Filters) ────
  const handleExportRevenueCsv = () => {
    const scopedPayouts = payouts.filter((p) =>
      matchesFinanceDateRange(p.settledAt || p.settlementDate, revDatePreset, revCustomFrom, revCustomTo)
    );
    const sellerRows = computeSellerBreakdown(scopedPayouts);
    exportToCsv(
      `grambazaar_platform_revenue_${new Date().toISOString().split('T')[0]}`,
      [
        { header: 'Seller ID', accessor: (r) => r.key },
        { header: 'Seller Name', accessor: (r) => r.label },
        { header: 'Village / Vertical', accessor: (r) => r.sublabel || '' },
        { header: 'Orders', accessor: (r) => r.ordersCount },
        { header: 'GMV (INR)', accessor: (r) => (r.gmvPaise / 100).toFixed(2) },
        { header: 'Commission Earned (INR)', accessor: (r) => (r.commissionPaise / 100).toFixed(2) },
        { header: 'Platform Fees & Other (INR)', accessor: (r) => (r.platformFeePaise / 100).toFixed(2) },
        { header: 'Refund Deductions (INR)', accessor: (r) => (r.refundsPaise / 100).toFixed(2) },
        { header: 'Seller Payable (INR)', accessor: (r) => (r.sellerPayablePaise / 100).toFixed(2) },
        { header: 'Platform Revenue (INR)', accessor: (r) => (r.netPlatformRevenuePaise / 100).toFixed(2) },
      ],
      sellerRows
    );
    showToast(`Exported Platform Revenue Summary (${sellerRows.length} sellers).`);
  };

  const handleExportActiveTabCsv = () => {
    const dateStamp = new Date().toISOString().split('T')[0];

    if (activeTab === 'PAYOUTS') {
      exportToCsv(
        `grambazaar_seller_settlements_${dateStamp}`,
        [
          { header: 'Settlement ID', accessor: (p) => p.id },
          { header: 'Seller Name', accessor: (p) => p.sellerName },
          { header: 'Seller ID', accessor: (p) => p.sellerId },
          { header: 'Village', accessor: (p) => p.villageName },
          { header: 'Period', accessor: (p) => p.periodLabel },
          { header: 'Orders', accessor: (p) => p.ordersCount },
          { header: 'Gross Sales (INR)', accessor: (p) => (p.grossAmountPaise / 100).toFixed(2) },
          { header: 'Commission (INR)', accessor: (p) => (p.commissionPaise / 100).toFixed(2) },
          { header: 'Other Deductions (INR)', accessor: (p) => ((p.otherDeductionsPaise || 0) / 100).toFixed(2) },
          { header: 'Refunds / Adj (INR)', accessor: (p) => (p.refundDeductionsPaise / 100).toFixed(2) },
          { header: 'Net Settlement (INR)', accessor: (p) => (p.netPayablePaise / 100).toFixed(2) },
          { header: 'Status', accessor: (p) => PAYOUT_STATUS_META[p.status].label },
          { header: 'Date', accessor: (p) => p.settledAt || p.settlementDate || '' },
          { header: 'UTR / Ref', accessor: (p) => p.utrNumber || '' },
        ],
        filteredPayouts
      );
      showToast(`Exported ${filteredPayouts.length} filtered Seller Settlement record(s).`);
    } else if (activeTab === 'TRANSACTIONS') {
      exportToCsv(
        `grambazaar_customer_transactions_${dateStamp}`,
        [
          { header: 'Transaction ID', accessor: (t) => t.id },
          { header: 'Order ID', accessor: (t) => t.orderId },
          { header: 'Customer', accessor: (t) => t.customerName },
          { header: 'Mobile', accessor: (t) => t.customerPhone || '' },
          { header: 'Seller', accessor: (t) => t.sellerName },
          { header: 'Village', accessor: (t) => t.villageName },
          { header: 'Method', accessor: (t) => t.method },
          { header: 'Amount (INR)', accessor: (t) => (t.amountPaise / 100).toFixed(2) },
          { header: 'Gateway Ref', accessor: (t) => t.gatewayRef },
          { header: 'Status', accessor: (t) => TXN_STATUS_META[t.status].label },
          { header: 'Date', accessor: (t) => t.createdAt },
        ],
        filteredTransactions
      );
      showToast(`Exported ${filteredTransactions.length} filtered Customer Transaction(s).`);
    } else if (activeTab === 'FAILED_PAYMENTS') {
      exportToCsv(
        `grambazaar_failed_payments_${dateStamp}`,
        [
          { header: 'Transaction ID', accessor: (t) => t.id },
          { header: 'Order ID', accessor: (t) => t.orderId },
          { header: 'Customer', accessor: (t) => t.customerName },
          { header: 'Mobile', accessor: (t) => t.customerPhone || '' },
          { header: 'Seller', accessor: (t) => t.sellerName },
          { header: 'Village', accessor: (t) => t.villageName },
          { header: 'Method', accessor: (t) => t.method },
          { header: 'Amount (INR)', accessor: (t) => (t.amountPaise / 100).toFixed(2) },
          { header: 'Failure Reason', accessor: (t) => t.failureReason || 'Payment failed' },
          { header: 'Gateway Ref', accessor: (t) => t.gatewayRef },
          { header: 'Date', accessor: (t) => t.createdAt },
        ],
        filteredFailedPayments
      );
      showToast(`Exported ${filteredFailedPayments.length} Failed Payment record(s).`);
    } else if (activeTab === 'REFUNDS') {
      exportToCsv(
        `grambazaar_refunds_${dateStamp}`,
        [
          { header: 'Refund ID', accessor: (r) => r.id },
          { header: 'Order ID', accessor: (r) => r.orderId },
          { header: 'Customer', accessor: (r) => r.customerName },
          { header: 'Seller', accessor: (r) => r.sellerName },
          { header: 'Original Amount (INR)', accessor: (r) => ((r.originalAmountPaise || r.amountPaise) / 100).toFixed(2) },
          { header: 'Refund Amount (INR)', accessor: (r) => (r.amountPaise / 100).toFixed(2) },
          { header: 'Reason', accessor: (r) => r.reason },
          { header: 'Refund Method', accessor: (r) => REFUND_CHANNEL_LABELS[r.refundChannel] },
          { header: 'Status', accessor: (r) => REFUND_STATUS_META[r.status].label },
          { header: 'Requested At', accessor: (r) => r.requestedAt },
        ],
        filteredRefunds
      );
      showToast(`Exported ${filteredRefunds.length} filtered Refund record(s).`);
    } else {
      handleExportRevenueCsv();
    }
  };

  const exportButtonLabel: Record<FinanceTabKey, string> = {
    PAYOUTS: 'Export Settlements CSV',
    TRANSACTIONS: 'Export Transactions CSV',
    FAILED_PAYMENTS: 'Export Failed Payments CSV',
    REFUNDS: 'Export Refunds CSV',
    REVENUE: 'Export Revenue CSV',
  };

  // ── Render ─────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 animate-fade-in text-left">
      {/* Breadcrumb & Page Header */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 shadow-xs space-y-3">
        <nav
          aria-label="Breadcrumb"
          className="flex items-center gap-1.5 text-[11px] font-medium text-[#6B7280] flex-wrap"
        >
          <span>Admin Panel</span>
          <ChevronRight className="w-3 h-3" />
          <span>Finance &amp; Growth</span>
          <ChevronRight className="w-3 h-3" />
          <span className="font-semibold text-[#1F2937]">Payments &amp; Finance</span>
        </nav>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-black text-[#1F2937]">
                Payments, Settlements &amp; Finance
              </h1>
              <Badge variant="primary">Finance &amp; Settlements</Badge>
              <Badge variant="neutral" size="sm">
                Simulated Frontend Ledger
              </Badge>
            </div>
            <p className="text-xs text-[#6B7280] mt-1">
              Reconcile customer UPI/COD/Udhari transactions, investigate failed payments, manage seller settlements with UTR proofs, process refunds, and track net platform earnings.
            </p>
          </div>

          {canExport && (
            <Button
              variant="secondary"
              size="sm"
              onClick={handleExportActiveTabCsv}
              leftIcon={<Download className="w-3.5 h-3.5" />}
            >
              {exportButtonLabel[activeTab]}
            </Button>
          )}
        </div>
      </div>

      {/* Feedback Toast */}
      {toastMsg && (
        <div className="bg-[#E8F5E9] border border-[#218838]/30 text-[#176B2C] px-4 py-3 rounded-xl text-sm font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Finance Dashboard Overview — 10 Metrics clearly split between Payment Flows & Platform Earnings */}
      <section className="space-y-3.5" aria-label="Finance Dashboard Overview">
        {/* Group 1: Payment & Refund Flows (6 Metrics) */}
        <div className="space-y-2">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#6B7280]">
              Customer Payment &amp; Refund Flows
            </h2>
            <span className="text-[11px] text-[#6B7280] flex items-center gap-1">
              <Info className="w-3.5 h-3.5 text-[#2563EB]" />
              Metrics calculated from local mock/frontend ledger state
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6 gap-3.5">
            <KPICard
              title="Total Txn Amount"
              value={formatINR(overviewMetrics.totalTransactionAmountPaise)}
              helperText={`${overviewMetrics.totalValidTransactionCount} valid txns (excl. failed)`}
              icon={<CreditCard className="w-5 h-5" />}
              iconBgClass="bg-[#EFF6FF] text-[#2563EB]"
              className="p-4"
            />
            <KPICard
              title="Successful Payments"
              value={formatINR(overviewMetrics.successfulPaymentsPaise)}
              helperText={`${overviewMetrics.successfulPaymentsCount} captured payment(s)`}
              icon={<CheckCircle2 className="w-5 h-5" />}
              iconBgClass="bg-[#E8F5E9] text-[#218838]"
              className="p-4"
            />
            <KPICard
              title="Pending Payments"
              value={formatINR(overviewMetrics.pendingPaymentsPaise)}
              helperText={`${overviewMetrics.pendingPaymentsCount} COD / awaiting capture`}
              icon={<Clock className="w-5 h-5" />}
              iconBgClass="bg-[#FEF3C7] text-[#D97706]"
              className="p-4"
            />
            <KPICard
              title="Failed Payments"
              value={formatINR(overviewMetrics.failedPaymentsPaise)}
              helperText={`${overviewMetrics.failedPaymentsCount} failed attempt(s)`}
              icon={<AlertTriangle className="w-5 h-5" />}
              iconBgClass="bg-[#FEE2E2] text-[#DC2626]"
              className="p-4"
            />
            <KPICard
              title="Total Refund Amount"
              value={formatINR(overviewMetrics.totalRefundAmountPaise)}
              helperText={`${overviewMetrics.totalActiveRefundsCount} committed refund(s)`}
              icon={<RefreshCcw className="w-5 h-5" />}
              iconBgClass="bg-[#FEE2E2] text-[#DC2626]"
              className="p-4"
            />
            <KPICard
              title="Pending Refunds"
              value={formatINR(overviewMetrics.pendingRefundsPaise)}
              helperText={`${overviewMetrics.pendingRefundsCount} awaiting review`}
              icon={<RotateCcw className="w-5 h-5" />}
              iconBgClass="bg-[#FEF3C7] text-[#D97706]"
              className="p-4"
            />
          </div>
        </div>

        {/* Group 2: Seller Settlements & Platform Earnings (4 Metrics — Strictly Separate from GMV) */}
        <div className="space-y-2">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#6B7280]">
              Seller Settlements &amp; Platform Earnings (Distinct from GMV)
            </h2>
            <span className="text-[11px] font-semibold text-[#176B2C]">
              GMV Tracked: {formatINR(overviewMetrics.gmvPaise)} (Seller Sales, Not Platform Revenue)
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <KPICard
              title="Total Seller Settlements"
              value={formatINR(overviewMetrics.totalSettledPayoutsPaise)}
              helperText={`${overviewMetrics.settledPayoutsCount} settled batch(es) with UTR`}
              icon={<CheckCircle2 className="w-5 h-5" />}
              iconBgClass="bg-[#E8F5E9] text-[#218838]"
            />
            <KPICard
              title="Pending Seller Settlements"
              value={formatINR(overviewMetrics.pendingSellerSettlementsPaise)}
              helperText={`${overviewMetrics.pendingSellerSettlementsCount} batch(es) awaiting payout${
                overviewMetrics.failedSettlementsCount > 0
                  ? ` (${overviewMetrics.failedSettlementsCount} failed)`
                  : ''
              }`}
              icon={<Wallet className="w-5 h-5" />}
              iconBgClass="bg-[#FEF3C7] text-[#D97706]"
            />
            <KPICard
              title="Platform Revenue"
              value={formatINR(overviewMetrics.platformRevenuePaise)}
              helperText={`Commission (${formatINR(overviewMetrics.totalCommissionPaise)}) + Fees (${formatINR(
                overviewMetrics.platformFeesPaise + overviewMetrics.otherPlatformIncomePaise
              )})`}
              icon={<IndianRupee className="w-5 h-5" />}
              iconBgClass="bg-[#EFF6FF] text-[#2563EB]"
            />
            <KPICard
              title="Net Platform Earnings"
              value={formatINR(overviewMetrics.netPlatformEarningsPaise)}
              helperText={`After est. refund comm. reversal (-${formatINR(
                overviewMetrics.estimatedCommissionReversalPaise
              )})`}
              icon={<TrendingUp className="w-5 h-5" />}
              iconBgClass="bg-[#E8F5E9] text-[#176B2C]"
            />
          </div>
        </div>
      </section>

      {/* Main Module Navigation Tabs */}
      <Tabs
        variant="underline"
        activeTab={activeTab}
        onChange={(id) => setActiveTab(id as FinanceTabKey)}
        tabs={[
          {
            id: 'PAYOUTS',
            label: 'Seller Settlements',
            icon: <Wallet className="w-4 h-4" />,
            count: payouts.length,
          },
          {
            id: 'TRANSACTIONS',
            label: 'Customer Transactions',
            icon: <CreditCard className="w-4 h-4" />,
            count: paymentTransactions.length,
          },
          {
            id: 'FAILED_PAYMENTS',
            label: 'Failed Payments',
            icon: <AlertTriangle className="w-4 h-4" />,
            count: failedTransactionsAll.length,
          },
          {
            id: 'REFUNDS',
            label: 'Refunds Queue',
            icon: <RefreshCcw className="w-4 h-4" />,
            count: refundLedger.length,
          },
          {
            id: 'REVENUE',
            label: 'Platform Revenue & Earnings',
            icon: <BarChart3 className="w-4 h-4" />,
          },
        ]}
      />

      {/* ====================================================================
          TAB 1: SELLER SETTLEMENTS
         ==================================================================== */}
      {activeTab === 'PAYOUTS' && (
        <div className="space-y-4">
          {/* Filters Toolbar */}
          <div className="bg-white rounded-2xl border border-[#E5E7EB] p-4 shadow-xs space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-12 gap-3">
              <div className="xl:col-span-4 relative">
                <Search className="w-4 h-4 text-[#6B7280] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={payoutSearch}
                  onChange={(e) => {
                    setPayoutSearch(e.target.value);
                    setPayoutPage(1);
                  }}
                  placeholder="Search Seller Name, Seller ID, Settlement ID, or UTR..."
                  className="w-full h-10 pl-9 pr-3 text-xs bg-[#F8FAFC] border border-[#E5E7EB] rounded-xl outline-none focus:border-[#218838] focus:bg-white"
                />
              </div>

              <div className="xl:col-span-2">
                <select
                  aria-label="Filter settlements by status"
                  value={payoutStatusFilter}
                  onChange={(e) => {
                    setPayoutStatusFilter(e.target.value as 'ALL' | SellerPayoutRecord['status']);
                    setPayoutPage(1);
                  }}
                  className="w-full h-10 px-3 text-xs bg-[#F8FAFC] border border-[#E5E7EB] rounded-xl outline-none focus:border-[#218838] text-[#1F2937]"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="PENDING">Pending</option>
                  <option value="PROCESSING">Processing</option>
                  <option value="SETTLED">Settled</option>
                  <option value="FAILED">Failed</option>
                </select>
              </div>

              <div className="xl:col-span-2">
                <select
                  aria-label="Filter settlements by seller"
                  value={payoutSellerFilter}
                  onChange={(e) => {
                    setPayoutSellerFilter(e.target.value);
                    setPayoutPage(1);
                  }}
                  className="w-full h-10 px-3 text-xs bg-[#F8FAFC] border border-[#E5E7EB] rounded-xl outline-none focus:border-[#218838] text-[#1F2937]"
                >
                  <option value="ALL">All Sellers</option>
                  {payoutSellers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="xl:col-span-2">
                <select
                  aria-label="Filter settlements by village"
                  value={payoutVillageFilter}
                  onChange={(e) => {
                    setPayoutVillageFilter(e.target.value);
                    setPayoutPage(1);
                  }}
                  className="w-full h-10 px-3 text-xs bg-[#F8FAFC] border border-[#E5E7EB] rounded-xl outline-none focus:border-[#218838] text-[#1F2937]"
                >
                  <option value="ALL">All Villages</option>
                  {payoutVillages.map((v) => (
                    <option key={v} value={v}>
                      {v}
                    </option>
                  ))}
                </select>
              </div>

              <div className="xl:col-span-2">
                <select
                  aria-label="Filter settlements by date range"
                  value={payoutDatePreset}
                  onChange={(e) => {
                    setPayoutDatePreset(e.target.value as FinanceDatePreset);
                    setPayoutPage(1);
                  }}
                  className="w-full h-10 px-3 text-xs bg-[#F8FAFC] border border-[#E5E7EB] rounded-xl outline-none focus:border-[#218838] text-[#1F2937]"
                >
                  {DATE_PRESET_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {payoutDatePreset === 'CUSTOM' && (
              <div className="flex flex-wrap items-center gap-3 p-3 rounded-xl bg-[#F8FAFC] border border-[#E5E7EB] text-xs">
                <div className="flex items-center gap-2">
                  <label className="text-[11px] font-semibold text-[#6B7280]">From</label>
                  <input
                    type="date"
                    value={payoutCustomFrom}
                    onChange={(e) => {
                      setPayoutCustomFrom(e.target.value);
                      setPayoutPage(1);
                    }}
                    className="h-8 px-2.5 bg-white border border-[#E5E7EB] rounded-lg text-xs"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-[11px] font-semibold text-[#6B7280]">To</label>
                  <input
                    type="date"
                    value={payoutCustomTo}
                    onChange={(e) => {
                      setPayoutCustomTo(e.target.value);
                      setPayoutPage(1);
                    }}
                    className="h-8 px-2.5 bg-white border border-[#E5E7EB] rounded-lg text-xs"
                  />
                </div>
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[#6B7280]">
              <span className="flex items-center gap-1.5">
                <Filter className="w-3.5 h-3.5 text-[#218838]" />
                Showing <strong className="text-[#1F2937]">{filteredPayouts.length}</strong> of{' '}
                {payouts.length} settlement batches
              </span>
              {hasPayoutFilters && (
                <button
                  type="button"
                  onClick={resetPayoutFilters}
                  className="text-xs font-semibold text-[#218838] hover:underline cursor-pointer"
                >
                  Clear all filters
                </button>
              )}
            </div>
          </div>

          {filteredPayouts.length === 0 ? (
            <EmptyState
              icon={<Wallet className="w-6 h-6" />}
              title="No seller settlements match your filters"
              description="Try adjusting the seller, status, village, or date filters to view settlement batches."
              actionText={hasPayoutFilters ? 'Reset Filters' : undefined}
              onAction={hasPayoutFilters ? resetPayoutFilters : undefined}
            />
          ) : (
            <>
              {/* Desktop 12-Column Settlements Table */}
              <div className="hidden lg:block bg-white rounded-2xl border border-[#E5E7EB] shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-[#F8FAFC] text-[#6B7280] uppercase tracking-wider font-semibold border-b border-[#E5E7EB] text-[11px]">
                      <tr>
                        <th className="py-3.5 px-3">Settlement ID</th>
                        <th className="py-3.5 px-3">Seller Name</th>
                        <th className="py-3.5 px-3">Seller ID</th>
                        <th className="py-3.5 px-3 text-right">Orders</th>
                        <th className="py-3.5 px-3 text-right">Gross Sales</th>
                        <th className="py-3.5 px-3 text-right">Commission</th>
                        <th className="py-3.5 px-3 text-right">Other Ded.</th>
                        <th className="py-3.5 px-3 text-right">Refund / Adj</th>
                        <th className="py-3.5 px-3 text-right">Net Settlement</th>
                        <th className="py-3.5 px-3">Status</th>
                        <th className="py-3.5 px-3">Date</th>
                        <th className="py-3.5 px-3">UTR</th>
                        <th className="py-3.5 px-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E5E7EB]">
                      {paginatedPayouts.map((p) => {
                        const meta = PAYOUT_STATUS_META[p.status];
                        const displayDate = p.settledAt || p.settlementDate;
                        return (
                          <tr
                            key={p.id}
                            className="hover:bg-[#F8FAFC]/80 transition-colors"
                          >
                            <td className="py-3 px-3 font-mono font-bold text-[#1F2937] whitespace-nowrap">
                              <button
                                type="button"
                                onClick={() => setSelectedPayoutId(p.id)}
                                className="hover:text-[#218838] hover:underline cursor-pointer"
                              >
                                {p.id}
                              </button>
                            </td>
                            <td className="py-3 px-3">
                              <p className="font-bold text-[#1F2937] whitespace-nowrap">{p.sellerName}</p>
                              <p className="text-[11px] text-[#6B7280] whitespace-nowrap">
                                {p.villageName} • {p.periodLabel}
                              </p>
                            </td>
                            <td className="py-3 px-3 font-mono text-[11px] text-[#475569] whitespace-nowrap">
                              {p.sellerId}
                            </td>
                            <td className="py-3 px-3 text-right font-semibold text-[#1F2937]">
                              {p.ordersCount}
                            </td>
                            <td className="py-3 px-3 text-right font-semibold text-[#1F2937] whitespace-nowrap">
                              {formatINR(p.grossAmountPaise)}
                            </td>
                            <td className="py-3 px-3 text-right text-[#475569] whitespace-nowrap">
                              -{formatINR(p.commissionPaise)}
                            </td>
                            <td className="py-3 px-3 text-right text-[#475569] whitespace-nowrap">
                              {(p.otherDeductionsPaise || 0) > 0
                                ? `-${formatINR(p.otherDeductionsPaise || 0)}`
                                : '₹0'}
                            </td>
                            <td className="py-3 px-3 text-right whitespace-nowrap">
                              {p.refundDeductionsPaise > 0 ? (
                                <span className="text-[#DC2626] font-semibold">
                                  -{formatINR(p.refundDeductionsPaise)}
                                </span>
                              ) : (
                                <span className="text-[#6B7280]">₹0</span>
                              )}
                            </td>
                            <td className="py-3 px-3 text-right font-black text-[#176B2C] whitespace-nowrap">
                              {formatINR(p.netPayablePaise)}
                            </td>
                            <td className="py-3 px-3 whitespace-nowrap">
                              <Badge variant={meta.variant} size="sm" dot>
                                {meta.label}
                              </Badge>
                            </td>
                            <td className="py-3 px-3 text-[11px] text-[#475569] whitespace-nowrap">
                              {displayDate ? formatDateTime(displayDate).split(',')[0] : p.periodLabel}
                            </td>
                            <td className="py-3 px-3 font-mono text-[11px] text-[#475569] whitespace-nowrap">
                              {p.utrNumber || '—'}
                            </td>
                            <td className="py-3 px-3 text-right whitespace-nowrap">
                              <div className="inline-flex items-center gap-1.5">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setSelectedPayoutId(p.id)}
                                  leftIcon={<Eye className="w-3.5 h-3.5" />}
                                >
                                  Details
                                </Button>
                                {canManage && p.status === 'PENDING' && (
                                  <Button
                                    variant="secondary"
                                    size="sm"
                                    onClick={() => setProcessingPayoutId(p.id)}
                                  >
                                    Processing
                                  </Button>
                                )}
                                {canManage && canApprove && p.status !== 'SETTLED' && (
                                  <Button
                                    variant="primary"
                                    size="sm"
                                    onClick={() => setSettlingPayoutId(p.id)}
                                  >
                                    Mark Settled
                                  </Button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Mobile / Tablet Card Layout */}
              <div className="lg:hidden space-y-3">
                {paginatedPayouts.map((p) => {
                  const meta = PAYOUT_STATUS_META[p.status];
                  return (
                    <div
                      key={p.id}
                      className="bg-white rounded-2xl border border-[#E5E7EB] p-4 shadow-xs space-y-3 text-xs"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono font-bold text-[#1F2937]">{p.id}</span>
                            <Badge variant={meta.variant} size="sm" dot>
                              {meta.label}
                            </Badge>
                          </div>
                          <p className="font-bold text-sm text-[#1F2937] mt-1">{p.sellerName}</p>
                          <p className="text-[11px] text-[#6B7280]">
                            {p.sellerId} • {p.villageName} • {p.periodLabel} ({p.ordersCount} orders)
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] text-[#6B7280]">Net Payable</p>
                          <p className="text-base font-black text-[#176B2C]">
                            {formatINR(p.netPayablePaise)}
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-3 rounded-xl bg-[#F8FAFC] border border-[#E5E7EB]">
                        <div>
                          <p className="text-[10px] text-[#6B7280]">Gross Sales</p>
                          <p className="font-semibold text-[#1F2937]">{formatINR(p.grossAmountPaise)}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-[#6B7280]">Commission</p>
                          <p className="font-semibold text-[#DC2626]">-{formatINR(p.commissionPaise)}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-[#6B7280]">Refunds / Other</p>
                          <p className="font-semibold text-[#DC2626]">
                            -{formatINR(p.refundDeductionsPaise + (p.otherDeductionsPaise || 0))}
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] text-[#6B7280]">UTR</p>
                          <p className="font-mono font-semibold text-[#1F2937] truncate">
                            {p.utrNumber || 'Not Recorded'}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center justify-end gap-2 pt-1">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => setSelectedPayoutId(p.id)}
                          leftIcon={<Eye className="w-3.5 h-3.5" />}
                        >
                          View Details
                        </Button>
                        {canManage && p.status === 'PENDING' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setProcessingPayoutId(p.id)}
                          >
                            Mark Processing
                          </Button>
                        )}
                        {canManage && canApprove && p.status !== 'SETTLED' && (
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => setSettlingPayoutId(p.id)}
                          >
                            Mark Settled
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              <Pagination
                currentPage={safePayoutPage}
                totalPages={payoutTotalPages}
                totalRecords={filteredPayouts.length}
                pageSize={PAGE_SIZE}
                onPageChange={setPayoutPage}
              />
            </>
          )}
        </div>
      )}

      {/* ====================================================================
          TAB 2: CUSTOMER PAYMENT TRANSACTIONS
         ==================================================================== */}
      {activeTab === 'TRANSACTIONS' && (
        <div className="space-y-4">
          {/* Search & Filters */}
          <div className="bg-white rounded-2xl border border-[#E5E7EB] p-4 shadow-xs space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-12 gap-3">
              <div className="xl:col-span-4 relative">
                <Search className="w-4 h-4 text-[#6B7280] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={txnSearch}
                  onChange={(e) => {
                    setTxnSearch(e.target.value);
                    setTxnPage(1);
                  }}
                  placeholder="Search Txn ID, Order ID, Customer Name, or Mobile..."
                  className="w-full h-10 pl-9 pr-3 text-xs bg-[#F8FAFC] border border-[#E5E7EB] rounded-xl outline-none focus:border-[#218838] focus:bg-white"
                />
              </div>

              <div className="xl:col-span-2">
                <input
                  type="text"
                  value={txnOrderIdFilter}
                  onChange={(e) => {
                    setTxnOrderIdFilter(e.target.value);
                    setTxnPage(1);
                  }}
                  placeholder="Filter Order ID..."
                  className="w-full h-10 px-3 text-xs bg-[#F8FAFC] border border-[#E5E7EB] rounded-xl outline-none focus:border-[#218838] focus:bg-white"
                />
              </div>

              <div className="xl:col-span-2">
                <select
                  aria-label="Filter transactions by status"
                  value={txnStatusFilter}
                  onChange={(e) => {
                    setTxnStatusFilter(
                      e.target.value as 'ALL' | 'SUCCESSFUL' | 'PENDING' | 'FAILED' | 'REFUNDED'
                    );
                    setTxnPage(1);
                  }}
                  className="w-full h-10 px-3 text-xs bg-[#F8FAFC] border border-[#E5E7EB] rounded-xl outline-none focus:border-[#218838] text-[#1F2937]"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="SUCCESSFUL">Successful</option>
                  <option value="PENDING">Pending (COD)</option>
                  <option value="FAILED">Failed</option>
                  <option value="REFUNDED">Refunded</option>
                </select>
              </div>

              <div className="xl:col-span-2">
                <select
                  aria-label="Filter transactions by method"
                  value={txnMethodFilter}
                  onChange={(e) => {
                    setTxnMethodFilter(e.target.value as 'ALL' | PaymentTransactionRecord['method']);
                    setTxnPage(1);
                  }}
                  className="w-full h-10 px-3 text-xs bg-[#F8FAFC] border border-[#E5E7EB] rounded-xl outline-none focus:border-[#218838] text-[#1F2937]"
                >
                  <option value="ALL">All Methods</option>
                  <option value="UPI">UPI</option>
                  <option value="COD">Cash / COD</option>
                  <option value="UDHARI">Udhari Credit</option>
                </select>
              </div>

              <div className="xl:col-span-2">
                <select
                  aria-label="Filter transactions by village"
                  value={txnVillageFilter}
                  onChange={(e) => {
                    setTxnVillageFilter(e.target.value);
                    setTxnPage(1);
                  }}
                  className="w-full h-10 px-3 text-xs bg-[#F8FAFC] border border-[#E5E7EB] rounded-xl outline-none focus:border-[#218838] text-[#1F2937]"
                >
                  <option value="ALL">All Villages</option>
                  {txnVillages.map((v) => (
                    <option key={v} value={v}>
                      {v}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[11px] font-semibold text-[#6B7280]">Date Range:</span>
                {DATE_PRESET_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => {
                      setTxnDatePreset(opt.value);
                      setTxnPage(1);
                    }}
                    className={`px-2.5 py-1 rounded-full text-[11px] font-semibold transition-colors cursor-pointer ${
                      txnDatePreset === opt.value
                        ? 'bg-[#218838] text-white'
                        : 'bg-[#F8FAFC] text-[#475569] border border-[#E5E7EB] hover:bg-slate-100'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-3 text-xs text-[#6B7280]">
                <span>
                  <strong className="text-[#1F2937]">{filteredTransactions.length}</strong> of{' '}
                  {paymentTransactions.length} transactions
                </span>
                {hasTxnFilters && (
                  <button
                    type="button"
                    onClick={resetTxnFilters}
                    className="font-semibold text-[#218838] hover:underline cursor-pointer"
                  >
                    Clear filters
                  </button>
                )}
              </div>
            </div>

            {txnDatePreset === 'CUSTOM' && (
              <div className="flex flex-wrap items-center gap-3 p-3 rounded-xl bg-[#F8FAFC] border border-[#E5E7EB] text-xs">
                <div className="flex items-center gap-2">
                  <label className="text-[11px] font-semibold text-[#6B7280]">From</label>
                  <input
                    type="date"
                    value={txnCustomFrom}
                    onChange={(e) => {
                      setTxnCustomFrom(e.target.value);
                      setTxnPage(1);
                    }}
                    className="h-8 px-2.5 bg-white border border-[#E5E7EB] rounded-lg text-xs"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-[11px] font-semibold text-[#6B7280]">To</label>
                  <input
                    type="date"
                    value={txnCustomTo}
                    onChange={(e) => {
                      setTxnCustomTo(e.target.value);
                      setTxnPage(1);
                    }}
                    className="h-8 px-2.5 bg-white border border-[#E5E7EB] rounded-lg text-xs"
                  />
                </div>
              </div>
            )}
          </div>

          {filteredTransactions.length === 0 ? (
            <EmptyState
              icon={<CreditCard className="w-6 h-6" />}
              title="No payment transactions found"
              description="No customer transactions match your active search or filter criteria."
              actionText={hasTxnFilters ? 'Clear Filters' : undefined}
              onAction={hasTxnFilters ? resetTxnFilters : undefined}
            />
          ) : (
            <>
              {/* Desktop Transactions Table */}
              <div className="hidden md:block bg-white rounded-2xl border border-[#E5E7EB] shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-[#F8FAFC] text-[#6B7280] uppercase tracking-wider font-semibold border-b border-[#E5E7EB] text-[11px]">
                      <tr>
                        <th className="py-3.5 px-4">Txn ID &amp; Order</th>
                        <th className="py-3.5 px-4">Customer &amp; Mobile</th>
                        <th className="py-3.5 px-4">Seller &amp; Village</th>
                        <th className="py-3.5 px-4">Method</th>
                        <th className="py-3.5 px-4">Gateway / Ref</th>
                        <th className="py-3.5 px-4 text-right">Amount</th>
                        <th className="py-3.5 px-4">Date &amp; Time</th>
                        <th className="py-3.5 px-4">Status</th>
                        <th className="py-3.5 px-4 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E5E7EB]">
                      {paginatedTxns.map((t) => {
                        const statusMeta = TXN_STATUS_META[t.status];
                        const methodMeta = PAYMENT_METHOD_META[t.method];
                        return (
                          <tr
                            key={t.id}
                            onClick={() => setSelectedTxnId(t.id)}
                            className="hover:bg-[#F8FAFC]/80 transition-colors cursor-pointer"
                          >
                            <td className="py-3.5 px-4 whitespace-nowrap">
                              <p className="font-mono font-bold text-[#1F2937]">{t.id}</p>
                              <p className="font-mono text-[11px] text-[#218838]">{t.orderId}</p>
                            </td>
                            <td className="py-3.5 px-4">
                              <p className="font-semibold text-[#1F2937]">{t.customerName}</p>
                              <p className="text-[11px] text-[#6B7280]">{t.customerPhone || '—'}</p>
                            </td>
                            <td className="py-3.5 px-4">
                              <p className="font-semibold text-[#1F2937]">{t.sellerName}</p>
                              <p className="text-[11px] text-[#6B7280]">{t.villageName}</p>
                            </td>
                            <td className="py-3.5 px-4 whitespace-nowrap">
                              <Badge variant={methodMeta.variant} size="sm">
                                {methodMeta.label}
                              </Badge>
                            </td>
                            <td className="py-3.5 px-4 font-mono text-[11px] text-[#475569] whitespace-nowrap">
                              {t.gatewayRef}
                            </td>
                            <td className="py-3.5 px-4 text-right font-bold text-[#1F2937] whitespace-nowrap">
                              {formatINR(t.amountPaise)}
                            </td>
                            <td className="py-3.5 px-4 text-[11px] text-[#475569] whitespace-nowrap">
                              {formatDateTime(t.createdAt)}
                            </td>
                            <td className="py-3.5 px-4 whitespace-nowrap">
                              <Badge variant={statusMeta.variant} size="sm" dot>
                                {statusMeta.label}
                              </Badge>
                            </td>
                            <td
                              className="py-3.5 px-4 text-right whitespace-nowrap"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setSelectedTxnId(t.id)}
                                leftIcon={<Eye className="w-3.5 h-3.5" />}
                              >
                                Details
                              </Button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Mobile Transactions Cards */}
              <div className="md:hidden space-y-3">
                {paginatedTxns.map((t) => {
                  const statusMeta = TXN_STATUS_META[t.status];
                  const methodMeta = PAYMENT_METHOD_META[t.method];
                  return (
                    <div
                      key={t.id}
                      onClick={() => setSelectedTxnId(t.id)}
                      className="bg-white rounded-2xl border border-[#E5E7EB] p-4 shadow-xs space-y-2.5 text-xs cursor-pointer"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-mono font-bold text-[#1F2937]">{t.id}</p>
                          <p className="font-mono text-[11px] text-[#218838]">{t.orderId}</p>
                        </div>
                        <p className="text-base font-black text-[#1F2937]">
                          {formatINR(t.amountPaise)}
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-1.5">
                        <Badge variant={statusMeta.variant} size="sm" dot>
                          {statusMeta.label}
                        </Badge>
                        <Badge variant={methodMeta.variant} size="sm">
                          {methodMeta.label}
                        </Badge>
                      </div>
                      <div className="text-[#475569] space-y-0.5">
                        <p>
                          <strong className="text-[#1F2937]">{t.customerName}</strong>{' '}
                          {t.customerPhone ? `(${t.customerPhone})` : ''}
                        </p>
                        <p className="text-[11px] text-[#6B7280]">
                          {t.sellerName} • {t.villageName} • {formatDateTime(t.createdAt)}
                        </p>
                      </div>
                      <div className="flex justify-end pt-1">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedTxnId(t.id);
                          }}
                          leftIcon={<Eye className="w-3.5 h-3.5" />}
                        >
                          View Details
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>

              <Pagination
                currentPage={safeTxnPage}
                totalPages={txnTotalPages}
                totalRecords={filteredTransactions.length}
                pageSize={PAGE_SIZE}
                onPageChange={setTxnPage}
              />
            </>
          )}
        </div>
      )}

      {/* ====================================================================
          TAB 3: DEDICATED FAILED PAYMENTS
         ==================================================================== */}
      {activeTab === 'FAILED_PAYMENTS' && (
        <div className="space-y-4">
          {/* Operational Guidance Banner */}
          <div className="p-3.5 rounded-2xl bg-[#FEF2F2] border border-[#FECACA] flex items-start gap-2.5 text-xs text-[#991B1B]">
            <AlertTriangle className="w-4 h-4 text-[#DC2626] shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Failed Payment Investigation Queue</p>
              <p className="text-[#B91C1C] mt-0.5">
                Inspect declined UPI/COD/Udhari attempts and gateway failure reasons below. Live payment retries require payment gateway backend webhooks and are intentionally not simulated here.
              </p>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-2xl border border-[#E5E7EB] p-4 shadow-xs space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-12 gap-3">
              <div className="xl:col-span-5 relative">
                <Search className="w-4 h-4 text-[#6B7280] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={failedSearch}
                  onChange={(e) => {
                    setFailedSearch(e.target.value);
                    setFailedPage(1);
                  }}
                  placeholder="Search Txn ID, Order ID, Customer, Mobile, or Failure Reason..."
                  className="w-full h-10 pl-9 pr-3 text-xs bg-[#F8FAFC] border border-[#E5E7EB] rounded-xl outline-none focus:border-[#218838] focus:bg-white"
                />
              </div>

              <div className="xl:col-span-2">
                <select
                  aria-label="Filter failed payments by method"
                  value={failedMethodFilter}
                  onChange={(e) => {
                    setFailedMethodFilter(e.target.value as 'ALL' | PaymentTransactionRecord['method']);
                    setFailedPage(1);
                  }}
                  className="w-full h-10 px-3 text-xs bg-[#F8FAFC] border border-[#E5E7EB] rounded-xl outline-none focus:border-[#218838] text-[#1F2937]"
                >
                  <option value="ALL">All Methods</option>
                  <option value="UPI">UPI</option>
                  <option value="COD">Cash / COD</option>
                  <option value="UDHARI">Udhari Credit</option>
                </select>
              </div>

              <div className="xl:col-span-2">
                <select
                  aria-label="Filter failed payments by village"
                  value={failedVillageFilter}
                  onChange={(e) => {
                    setFailedVillageFilter(e.target.value);
                    setFailedPage(1);
                  }}
                  className="w-full h-10 px-3 text-xs bg-[#F8FAFC] border border-[#E5E7EB] rounded-xl outline-none focus:border-[#218838] text-[#1F2937]"
                >
                  <option value="ALL">All Villages</option>
                  {txnVillages.map((v) => (
                    <option key={v} value={v}>
                      {v}
                    </option>
                  ))}
                </select>
              </div>

              <div className="xl:col-span-3">
                <select
                  aria-label="Filter failed payments by date range"
                  value={failedDatePreset}
                  onChange={(e) => {
                    setFailedDatePreset(e.target.value as FinanceDatePreset);
                    setFailedPage(1);
                  }}
                  className="w-full h-10 px-3 text-xs bg-[#F8FAFC] border border-[#E5E7EB] rounded-xl outline-none focus:border-[#218838] text-[#1F2937]"
                >
                  {DATE_PRESET_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {failedDatePreset === 'CUSTOM' && (
              <div className="flex flex-wrap items-center gap-3 p-3 rounded-xl bg-[#F8FAFC] border border-[#E5E7EB] text-xs">
                <div className="flex items-center gap-2">
                  <label className="text-[11px] font-semibold text-[#6B7280]">From</label>
                  <input
                    type="date"
                    value={failedCustomFrom}
                    onChange={(e) => {
                      setFailedCustomFrom(e.target.value);
                      setFailedPage(1);
                    }}
                    className="h-8 px-2.5 bg-white border border-[#E5E7EB] rounded-lg text-xs"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-[11px] font-semibold text-[#6B7280]">To</label>
                  <input
                    type="date"
                    value={failedCustomTo}
                    onChange={(e) => {
                      setFailedCustomTo(e.target.value);
                      setFailedPage(1);
                    }}
                    className="h-8 px-2.5 bg-white border border-[#E5E7EB] rounded-lg text-xs"
                  />
                </div>
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[#6B7280]">
              <span>
                Showing <strong className="text-[#DC2626]">{filteredFailedPayments.length}</strong> failed payment(s)
              </span>
              {hasFailedFilters && (
                <button
                  type="button"
                  onClick={resetFailedFilters}
                  className="font-semibold text-[#218838] hover:underline cursor-pointer"
                >
                  Clear filters
                </button>
              )}
            </div>
          </div>

          {filteredFailedPayments.length === 0 ? (
            <EmptyState
              icon={<CheckCircle2 className="w-6 h-6" />}
              title="No failed payments found"
              description={
                hasFailedFilters
                  ? 'No failed transactions match your active filter criteria.'
                  : 'All payment transactions are currently healthy with zero failures.'
              }
              actionText={hasFailedFilters ? 'Reset Filters' : undefined}
              onAction={hasFailedFilters ? resetFailedFilters : undefined}
            />
          ) : (
            <>
              {/* Desktop Failed Payments Table */}
              <div className="hidden md:block bg-white rounded-2xl border border-[#E5E7EB] shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-[#FEF2F2]/60 text-[#991B1B] uppercase tracking-wider font-semibold border-b border-[#FECACA] text-[11px]">
                      <tr>
                        <th className="py-3.5 px-4">Txn &amp; Order ID</th>
                        <th className="py-3.5 px-4">Customer</th>
                        <th className="py-3.5 px-4">Seller &amp; Village</th>
                        <th className="py-3.5 px-4">Method &amp; Amount</th>
                        <th className="py-3.5 px-4">Failure Reason</th>
                        <th className="py-3.5 px-4">Date &amp; Time</th>
                        <th className="py-3.5 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E5E7EB]">
                      {paginatedFailed.map((t) => {
                        const methodMeta = PAYMENT_METHOD_META[t.method];
                        return (
                          <tr key={t.id} className="hover:bg-[#FEF2F2]/30 transition-colors">
                            <td className="py-3.5 px-4 whitespace-nowrap">
                              <p className="font-mono font-bold text-[#1F2937]">{t.id}</p>
                              <p className="font-mono text-[11px] text-[#DC2626]">{t.orderId}</p>
                            </td>
                            <td className="py-3.5 px-4">
                              <p className="font-semibold text-[#1F2937]">{t.customerName}</p>
                              <p className="text-[11px] text-[#6B7280]">{t.customerPhone || '—'}</p>
                            </td>
                            <td className="py-3.5 px-4">
                              <p className="font-semibold text-[#1F2937]">{t.sellerName}</p>
                              <p className="text-[11px] text-[#6B7280]">{t.villageName}</p>
                            </td>
                            <td className="py-3.5 px-4 whitespace-nowrap">
                              <p className="font-black text-[#1F2937]">{formatINR(t.amountPaise)}</p>
                              <Badge variant={methodMeta.variant} size="sm" className="mt-1">
                                {methodMeta.label}
                              </Badge>
                            </td>
                            <td className="py-3.5 px-4 max-w-[260px]">
                              <div className="p-2 rounded-lg bg-[#FEF2F2] border border-[#FECACA] text-[#991B1B] font-medium leading-snug">
                                {t.failureReason || 'Gateway authorization declined'}
                              </div>
                            </td>
                            <td className="py-3.5 px-4 text-[11px] text-[#475569] whitespace-nowrap">
                              {formatDateTime(t.createdAt)}
                            </td>
                            <td className="py-3.5 px-4 text-right whitespace-nowrap">
                              <div className="inline-flex items-center gap-1.5">
                                <Button
                                  variant="secondary"
                                  size="sm"
                                  onClick={() => setSelectedTxnId(t.id)}
                                  leftIcon={<Eye className="w-3.5 h-3.5" />}
                                >
                                  View Details
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() =>
                                    setRelatedOrderModalRef({ orderId: t.orderId, txnId: t.id })
                                  }
                                  leftIcon={<Package className="w-3.5 h-3.5" />}
                                >
                                  View Order
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

              {/* Mobile Failed Payments Cards */}
              <div className="md:hidden space-y-3">
                {paginatedFailed.map((t) => {
                  const methodMeta = PAYMENT_METHOD_META[t.method];
                  return (
                    <div
                      key={t.id}
                      className="bg-white rounded-2xl border border-[#FECACA] p-4 shadow-xs space-y-3 text-xs"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-mono font-bold text-[#1F2937]">{t.id}</p>
                          <p className="font-mono text-[11px] text-[#DC2626]">{t.orderId}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-base font-black text-[#1F2937]">
                            {formatINR(t.amountPaise)}
                          </p>
                          <Badge variant={methodMeta.variant} size="sm">
                            {methodMeta.label}
                          </Badge>
                        </div>
                      </div>
                      <div className="p-2.5 rounded-xl bg-[#FEF2F2] border border-[#FECACA] text-[#991B1B] font-medium">
                        {t.failureReason || 'Gateway authorization declined'}
                      </div>
                      <p className="text-[11px] text-[#6B7280]">
                        <strong className="text-[#1F2937]">{t.customerName}</strong> • {t.sellerName} ({t.villageName}) • {formatDateTime(t.createdAt)}
                      </p>
                      <div className="flex flex-wrap justify-end gap-2">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => setSelectedTxnId(t.id)}
                          leftIcon={<Eye className="w-3.5 h-3.5" />}
                        >
                          View Details
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            setRelatedOrderModalRef({ orderId: t.orderId, txnId: t.id })
                          }
                          leftIcon={<Package className="w-3.5 h-3.5" />}
                        >
                          View Related Order
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>

              <Pagination
                currentPage={safeFailedPage}
                totalPages={failedTotalPages}
                totalRecords={filteredFailedPayments.length}
                pageSize={PAGE_SIZE}
                onPageChange={setFailedPage}
              />
            </>
          )}
        </div>
      )}

      {/* ====================================================================
          TAB 4: REFUNDS QUEUE
         ==================================================================== */}
      {activeTab === 'REFUNDS' && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="bg-white rounded-2xl border border-[#E5E7EB] p-4 shadow-xs space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-12 gap-3">
              <div className="xl:col-span-5 relative">
                <Search className="w-4 h-4 text-[#6B7280] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={refundSearch}
                  onChange={(e) => {
                    setRefundSearch(e.target.value);
                    setRefundPage(1);
                  }}
                  placeholder="Search Refund ID, Order ID, Customer, or Seller..."
                  className="w-full h-10 pl-9 pr-3 text-xs bg-[#F8FAFC] border border-[#E5E7EB] rounded-xl outline-none focus:border-[#218838] focus:bg-white"
                />
              </div>

              <div className="xl:col-span-2">
                <select
                  aria-label="Filter refunds by status"
                  value={refundStatusFilter}
                  onChange={(e) => {
                    setRefundStatusFilter(e.target.value as 'ALL' | RefundLedgerRecord['status']);
                    setRefundPage(1);
                  }}
                  className="w-full h-10 px-3 text-xs bg-[#F8FAFC] border border-[#E5E7EB] rounded-xl outline-none focus:border-[#218838] text-[#1F2937]"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="INITIATED">Pending</option>
                  <option value="PROCESSING">Processing</option>
                  <option value="PROCESSED">Completed</option>
                  <option value="FAILED">Failed</option>
                  <option value="REJECTED">Rejected</option>
                </select>
              </div>

              <div className="xl:col-span-3">
                <select
                  aria-label="Filter refunds by refund method"
                  value={refundMethodFilter}
                  onChange={(e) => {
                    setRefundMethodFilter(
                      e.target.value as 'ALL' | RefundLedgerRecord['refundChannel']
                    );
                    setRefundPage(1);
                  }}
                  className="w-full h-10 px-3 text-xs bg-[#F8FAFC] border border-[#E5E7EB] rounded-xl outline-none focus:border-[#218838] text-[#1F2937]"
                >
                  <option value="ALL">All Refund Methods</option>
                  <option value="ORIGINAL_UPI">Original UPI Account</option>
                  <option value="STORE_CREDIT">Store Credit</option>
                  <option value="CASH_ADJUSTMENT">Cash Adjustment</option>
                </select>
              </div>

              <div className="xl:col-span-2">
                <select
                  aria-label="Filter refunds by date range"
                  value={refundDatePreset}
                  onChange={(e) => {
                    setRefundDatePreset(e.target.value as FinanceDatePreset);
                    setRefundPage(1);
                  }}
                  className="w-full h-10 px-3 text-xs bg-[#F8FAFC] border border-[#E5E7EB] rounded-xl outline-none focus:border-[#218838] text-[#1F2937]"
                >
                  {DATE_PRESET_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {refundDatePreset === 'CUSTOM' && (
              <div className="flex flex-wrap items-center gap-3 p-3 rounded-xl bg-[#F8FAFC] border border-[#E5E7EB] text-xs">
                <div className="flex items-center gap-2">
                  <label className="text-[11px] font-semibold text-[#6B7280]">From</label>
                  <input
                    type="date"
                    value={refundCustomFrom}
                    onChange={(e) => {
                      setRefundCustomFrom(e.target.value);
                      setRefundPage(1);
                    }}
                    className="h-8 px-2.5 bg-white border border-[#E5E7EB] rounded-lg text-xs"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-[11px] font-semibold text-[#6B7280]">To</label>
                  <input
                    type="date"
                    value={refundCustomTo}
                    onChange={(e) => {
                      setRefundCustomTo(e.target.value);
                      setRefundPage(1);
                    }}
                    className="h-8 px-2.5 bg-white border border-[#E5E7EB] rounded-lg text-xs"
                  />
                </div>
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[#6B7280]">
              <span>
                Showing <strong className="text-[#1F2937]">{filteredRefunds.length}</strong> of{' '}
                {refundLedger.length} refund request(s)
              </span>
              {hasRefundFilters && (
                <button
                  type="button"
                  onClick={resetRefundFilters}
                  className="font-semibold text-[#218838] hover:underline cursor-pointer"
                >
                  Clear filters
                </button>
              )}
            </div>
          </div>

          {filteredRefunds.length === 0 ? (
            <EmptyState
              icon={<RefreshCcw className="w-6 h-6" />}
              title="No refund records match your filters"
              description="Adjust status, refund method, or date filters to inspect refund requests."
              actionText={hasRefundFilters ? 'Reset Filters' : undefined}
              onAction={hasRefundFilters ? resetRefundFilters : undefined}
            />
          ) : (
            <>
              {/* Desktop Refunds Table */}
              <div className="hidden lg:block bg-white rounded-2xl border border-[#E5E7EB] shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-[#F8FAFC] text-[#6B7280] uppercase tracking-wider font-semibold border-b border-[#E5E7EB] text-[11px]">
                      <tr>
                        <th className="py-3.5 px-3">Refund &amp; Order ID</th>
                        <th className="py-3.5 px-3">Customer</th>
                        <th className="py-3.5 px-3">Seller</th>
                        <th className="py-3.5 px-3 text-right">Orig. Amount</th>
                        <th className="py-3.5 px-3 text-right">Refund Amt</th>
                        <th className="py-3.5 px-3">Reason</th>
                        <th className="py-3.5 px-3">Refund Method</th>
                        <th className="py-3.5 px-3">Status</th>
                        <th className="py-3.5 px-3">Requested</th>
                        <th className="py-3.5 px-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E5E7EB]">
                      {paginatedRefunds.map((r) => {
                        const meta = REFUND_STATUS_META[r.status];
                        const isActionable = r.status === 'INITIATED' || r.status === 'PROCESSING';
                        return (
                          <tr key={r.id} className="hover:bg-[#F8FAFC]/80 transition-colors">
                            <td className="py-3.5 px-3 whitespace-nowrap">
                              <button
                                type="button"
                                onClick={() => setSelectedRefundId(r.id)}
                                className="font-mono font-bold text-[#1F2937] hover:text-[#218838] hover:underline cursor-pointer"
                              >
                                {r.id}
                              </button>
                              <p className="font-mono text-[11px] text-[#6B7280]">{r.orderId}</p>
                            </td>
                            <td className="py-3.5 px-3">
                              <p className="font-semibold text-[#1F2937]">{r.customerName}</p>
                              <p className="text-[11px] text-[#6B7280]">{r.villageName || r.customerPhone || '—'}</p>
                            </td>
                            <td className="py-3.5 px-3 font-medium text-[#1F2937]">
                              {r.sellerName}
                            </td>
                            <td className="py-3.5 px-3 text-right font-semibold text-[#475569] whitespace-nowrap">
                              {formatINR(r.originalAmountPaise || r.amountPaise)}
                            </td>
                            <td className="py-3.5 px-3 text-right font-black text-[#DC2626] whitespace-nowrap">
                              {formatINR(r.amountPaise)}
                            </td>
                            <td className="py-3.5 px-3 text-[#475569] max-w-[200px]">
                              <p className="line-clamp-2">{r.reason}</p>
                            </td>
                            <td className="py-3.5 px-3 font-semibold text-[#1F2937] whitespace-nowrap">
                              {REFUND_CHANNEL_LABELS[r.refundChannel]}
                            </td>
                            <td className="py-3.5 px-3 whitespace-nowrap">
                              <Badge variant={meta.variant} size="sm" dot>
                                {meta.label}
                              </Badge>
                            </td>
                            <td className="py-3.5 px-3 text-[11px] text-[#475569] whitespace-nowrap">
                              {formatDateTime(r.requestedAt)}
                            </td>
                            <td className="py-3.5 px-3 text-right whitespace-nowrap">
                              <div className="inline-flex items-center gap-1.5">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setSelectedRefundId(r.id)}
                                  leftIcon={<Eye className="w-3.5 h-3.5" />}
                                >
                                  Details
                                </Button>
                                {canApprove && isActionable && (
                                  <>
                                    <Button
                                      variant="primary"
                                      size="sm"
                                      onClick={() =>
                                        setRefundDecision({ refundId: r.id, mode: 'APPROVE' })
                                      }
                                    >
                                      Approve
                                    </Button>
                                    <Button
                                      variant="destructive"
                                      size="sm"
                                      onClick={() =>
                                        setRefundDecision({ refundId: r.id, mode: 'REJECT' })
                                      }
                                    >
                                      Reject
                                    </Button>
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Mobile / Tablet Refunds Cards */}
              <div className="lg:hidden space-y-3">
                {paginatedRefunds.map((r) => {
                  const meta = REFUND_STATUS_META[r.status];
                  const isActionable = r.status === 'INITIATED' || r.status === 'PROCESSING';
                  return (
                    <div
                      key={r.id}
                      className="bg-white rounded-2xl border border-[#E5E7EB] p-4 shadow-xs space-y-3 text-xs"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono font-bold text-[#1F2937]">{r.id}</span>
                            <Badge variant={meta.variant} size="sm" dot>
                              {meta.label}
                            </Badge>
                          </div>
                          <p className="font-mono text-[11px] text-[#6B7280] mt-0.5">{r.orderId}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] text-[#6B7280]">Refund Amount</p>
                          <p className="text-base font-black text-[#DC2626]">
                            {formatINR(r.amountPaise)}
                          </p>
                          <p className="text-[10px] text-[#6B7280]">
                            Orig: {formatINR(r.originalAmountPaise || r.amountPaise)}
                          </p>
                        </div>
                      </div>
                      <p className="text-[#475569]">{r.reason}</p>
                      <div className="text-[11px] text-[#6B7280] space-y-0.5">
                        <p>
                          <strong className="text-[#1F2937]">{r.customerName}</strong> • {r.sellerName}
                        </p>
                        <p>
                          Method: <strong className="text-[#1F2937]">{REFUND_CHANNEL_LABELS[r.refundChannel]}</strong> • {formatDateTime(r.requestedAt)}
                        </p>
                      </div>
                      <div className="flex flex-wrap justify-end gap-2 pt-1">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => setSelectedRefundId(r.id)}
                          leftIcon={<Eye className="w-3.5 h-3.5" />}
                        >
                          View Details
                        </Button>
                        {canApprove && isActionable && (
                          <>
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={() =>
                                setRefundDecision({ refundId: r.id, mode: 'APPROVE' })
                              }
                            >
                              Approve
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() =>
                                setRefundDecision({ refundId: r.id, mode: 'REJECT' })
                              }
                              leftIcon={<XCircle className="w-3.5 h-3.5" />}
                            >
                              Reject
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              <Pagination
                currentPage={safeRefundPage}
                totalPages={refundTotalPages}
                totalRecords={filteredRefunds.length}
                pageSize={PAGE_SIZE}
                onPageChange={setRefundPage}
              />
            </>
          )}
        </div>
      )}

      {/* ====================================================================
          TAB 5: PLATFORM REVENUE & EARNINGS SUMMARY
         ==================================================================== */}
      {activeTab === 'REVENUE' && (
        <FinanceRevenueSummaryTab
          payouts={payouts}
          transactions={paymentTransactions}
          refunds={refundLedger}
          datePreset={revDatePreset}
          customFrom={revCustomFrom}
          customTo={revCustomTo}
          onDatePresetChange={setRevDatePreset}
          onCustomFromChange={setRevCustomFrom}
          onCustomToChange={setRevCustomTo}
          canExport={canExport}
          onExportRevenueCsv={handleExportRevenueCsv}
        />
      )}

      {/* ====================================================================
          DETAIL DRAWERS & CONFIRMATION MODALS
         ==================================================================== */}
      <TransactionDetailDrawer
        transaction={selectedTxn}
        relatedOrder={findRelatedOrder(selectedTxn?.orderId)}
        relatedRefund={
          selectedTxn
            ? refundLedger.find(
                (r) => r.id === selectedTxn.refundId || r.orderId === selectedTxn.orderId
              )
            : undefined
        }
        isOpen={Boolean(selectedTxn)}
        onClose={() => setSelectedTxnId(null)}
        onViewRelatedOrder={(orderId) =>
          setRelatedOrderModalRef({ orderId, txnId: selectedTxn?.id })
        }
      />

      <SettlementDetailDrawer
        payout={selectedPayout}
        isOpen={Boolean(selectedPayout)}
        onClose={() => setSelectedPayoutId(null)}
        canManage={canManage}
        canApprove={canApprove}
        onRequestProcessing={(p) => setProcessingPayoutId(p.id)}
        onRequestSettle={(p) => setSettlingPayoutId(p.id)}
      />

      <RefundDetailDrawer
        refund={selectedRefund}
        relatedOrder={findRelatedOrder(selectedRefund?.orderId)}
        relatedTransaction={
          selectedRefund
            ? paymentTransactions.find(
                (t) =>
                  t.id === selectedRefund.originalTransactionId ||
                  t.orderId === selectedRefund.orderId
              )
            : undefined
        }
        isOpen={Boolean(selectedRefund)}
        onClose={() => setSelectedRefundId(null)}
        canApprove={canApprove}
        onApprove={(r) => setRefundDecision({ refundId: r.id, mode: 'APPROVE' })}
        onReject={(r) => setRefundDecision({ refundId: r.id, mode: 'REJECT' })}
      />

      <RelatedOrderSnapshotModal
        orderId={relatedOrderModalRef?.orderId || null}
        order={findRelatedOrder(relatedOrderModalRef?.orderId)}
        transaction={
          relatedOrderModalRef?.txnId
            ? paymentTransactions.find((t) => t.id === relatedOrderModalRef.txnId)
            : undefined
        }
        isOpen={Boolean(relatedOrderModalRef)}
        onClose={() => setRelatedOrderModalRef(null)}
      />

      <SettlePayoutModal
        payout={settlingPayout}
        isOpen={Boolean(settlingPayout)}
        onClose={() => setSettlingPayoutId(null)}
        onConfirmSettle={(payoutId, payload) => {
          const target = payouts.find((p) => p.id === payoutId);
          settleSellerPayout(payoutId, payload);
          showToast(
            `Recorded UTR ${payload.utrNumber} and settled ${
              target ? `${formatINR(target.netPayablePaise)} to ${target.sellerName}` : payoutId
            }.`
          );
        }}
      />

      <MarkProcessingModal
        payout={processingPayout}
        isOpen={Boolean(processingPayout)}
        onClose={() => setProcessingPayoutId(null)}
        onConfirmProcessing={(payoutId) => {
          const target = payouts.find((p) => p.id === payoutId);
          markPayoutProcessing(payoutId);
          showToast(
            `Moved ${target ? target.sellerName : payoutId} settlement batch to Processing.`
          );
        }}
      />

      <RefundDecisionModal
        refund={activeDecisionRefund}
        mode={refundDecision?.mode || null}
        isOpen={Boolean(refundDecision && activeDecisionRefund)}
        onClose={() => setRefundDecision(null)}
        onConfirmDecision={(refundId, status, reason) => {
          updateRefundStatus(refundId, status, reason);
          showToast(
            status === 'PROCESSED'
              ? `Approved and marked refund ${refundId} as Completed.`
              : `Rejected refund request ${refundId} with audit reason.`
          );
        }}
      />
    </div>
  );
};
