import React, { useEffect, useMemo, useState } from 'react';
import { useSeller } from '../../contexts/SellerContext';
import { useOrders } from '../../contexts/OrderContext';
import { Order } from '../../types/order';
import { MOCK_FOOD_PRODUCTS, MOCK_GROCERY_PRODUCTS } from '../../constants/mockData';
import { formatINR } from '../../utils/currency';
import { formatTimeAgo, formatDateTime } from '../../utils/dates';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import {
  Bell,
  BellOff,
  Clock,
  MapPin,
  Phone,
  CheckCircle2,
  Truck,
  Store,
  AlertTriangle,
  Package,
  Timer,
  PlusCircle,
  Sparkles,
  Check,
} from 'lucide-react';

const DEFAULT_ACCEPT_SECONDS = 300; // 5 minutes

function formatCountdownMMSS(seconds: number): string {
  const safe = Math.max(0, Math.floor(seconds));
  const mins = Math.floor(safe / 60);
  const secs = safe % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export const SellerOrdersTerminal: React.FC = () => {
  const {
    activeSeller,
    allSellers,
    setActiveSellerId,
    runners,
    isBuzzerEnabled,
    toggleBuzzer,
    assignRunnerToOrder,
  } = useSeller();
  const {
    orders,
    createOrder,
    transitionOrder,
    extendAcceptWindow,
    markSellerNotificationsRead,
  } = useOrders();

  // Live 1-second clock tick for Accept Countdown Timers
  const [nowMs, setNowMs] = useState<number>(() => Date.now());

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNowMs(Date.now());
    }, 1000);
    return () => window.clearInterval(timer);
  }, []);

  // Active status queue tab
  const [activeQueueTab, setActiveQueueTab] = useState<
    'ALL' | 'NEW' | 'PREPARING' | 'READY' | 'DISPATCH' | 'COMPLETED' | 'CANCELLED'
  >('NEW');

  // Rejection modal state
  const [rejectingOrder, setRejectingOrder] = useState<Order | null>(null);
  const [rejectionReason, setRejectionReason] = useState<string>('Item Out of Stock');
  const [rejectionNotes, setRejectionNotes] = useState<string>('');

  // Runner assignment & prep/packing time state
  const [selectedRunners, setSelectedRunners] = useState<Record<string, string>>({});
  const [prepTimes, setPrepTimes] = useState<Record<string, number>>({});
  const [terminalToast, setTerminalToast] = useState<string | null>(null);

  const showTerminalToast = (msg: string) => {
    setTerminalToast(msg);
    window.setTimeout(() => setTerminalToast(null), 3500);
  };

  // Count incoming orders per shop for quick seller switcher dropdown
  const incomingCountBySeller = useMemo(() => {
    const map: Record<string, number> = {};
    orders.forEach((o) => {
      if (o.status === 'placed' || o.status === 'pending') {
        map[o.sellerId] = (map[o.sellerId] || 0) + 1;
      }
    });
    return map;
  }, [orders]);

  // Filter orders for active seller
  const sellerOrders = useMemo(
    () =>
      orders
        .filter((o) => o.sellerId === activeSeller.id)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [orders, activeSeller.id]
  );

  const incomingOrders = sellerOrders.filter((o) => o.status === 'placed' || o.status === 'pending');

  // Mark notifications for this seller read once viewed on NEW tab
  useEffect(() => {
    if (activeQueueTab === 'NEW' && incomingOrders.length > 0) {
      markSellerNotificationsRead(activeSeller.id);
    }
  }, [activeSeller.id, activeQueueTab, incomingOrders.length]);

  const isGroceryShop = activeSeller.primaryVertical === 'GROCERY';

  const getOrdersByQueue = () => {
    switch (activeQueueTab) {
      case 'NEW':
        return incomingOrders;
      case 'PREPARING':
        return sellerOrders.filter((o) => ['accepted', 'preparing'].includes(o.status));
      case 'READY':
        return sellerOrders.filter((o) =>
          ['ready_for_delivery', 'ready_for_pickup'].includes(o.status)
        );
      case 'DISPATCH':
        return sellerOrders.filter((o) => o.status === 'out_for_delivery');
      case 'COMPLETED':
        return sellerOrders.filter((o) => o.status === 'completed');
      case 'CANCELLED':
        return sellerOrders.filter((o) =>
          ['cancelled', 'rejected', 'delivery_failed'].includes(o.status)
        );
      default:
        return sellerOrders;
    }
  };

  const displayedOrders = getOrdersByQueue();

  const handleAcceptOrder = (order: Order) => {
    const chosenPrep = prepTimes[order.id] || (isGroceryShop ? 20 : 25);
    transitionOrder(
      order.id,
      'accepted',
      `Seller accepted order — estimated ${isGroceryShop ? 'packing' : 'prep'} time ${chosenPrep} mins`,
      'SELLER',
      { estimatedDeliveryMinutes: chosenPrep }
    );
    setActiveQueueTab('PREPARING');
    showTerminalToast(
      `Order ${order.orderNumber} accepted (${chosenPrep}m ${isGroceryShop ? 'packing' : 'prep'})! Moved to ${
        isGroceryShop ? 'Packing Queue' : 'Kitchen Queue'
      }.`
    );
  };

  const handleConfirmRejection = () => {
    if (!rejectingOrder) return;
    const finalReason = rejectionNotes ? `${rejectionReason}: ${rejectionNotes}` : rejectionReason;
    transitionOrder(rejectingOrder.id, 'rejected', finalReason, 'SELLER');
    showTerminalToast(`Order ${rejectingOrder.orderNumber} rejected and customer notified.`);
    setRejectingOrder(null);
    setRejectionNotes('');
  };

  const handleStartPreparing = (order: Order) => {
    transitionOrder(
      order.id,
      'preparing',
      isGroceryShop
        ? 'Staff started weighing & packing grocery items'
        : 'Kitchen started cooking dishes',
      'SELLER'
    );
    showTerminalToast(
      `Order ${order.orderNumber}: ${isGroceryShop ? 'Packing started' : 'Cooking started'}!`
    );
  };

  const handleMarkReady = (order: Order) => {
    const nextStatus =
      order.fulfilmentMode === 'PICKUP' ? 'ready_for_pickup' : 'ready_for_delivery';
    transitionOrder(
      order.id,
      nextStatus,
      order.fulfilmentMode === 'PICKUP'
        ? 'Packed and ready for customer pickup at shop counter'
        : 'Packed, sealed and ready for village delivery dispatch',
      'SELLER'
    );
    setActiveQueueTab('READY');
    showTerminalToast(`Order ${order.orderNumber} is Ready for Handover!`);
  };

  const handleDispatchOrder = (order: Order) => {
    if (order.fulfilmentMode === 'PICKUP') {
      transitionOrder(
        order.id,
        'completed',
        'Customer picked up order at shop counter & payment settled',
        'SELLER'
      );
      setActiveQueueTab('COMPLETED');
      showTerminalToast(`Pickup order ${order.orderNumber} handed over & completed!`);
      return;
    }

    const runnerId = selectedRunners[order.id] || runners[0].id;
    const runner = runners.find((r) => r.id === runnerId) || runners[0];
    assignRunnerToOrder(order.id, runner.id);
    transitionOrder(
      order.id,
      'out_for_delivery',
      `Dispatched with ${runner.name} (${runner.phone})`,
      'SELLER',
      {
        assignedRunnerName: runner.name,
        assignedRunnerPhone: runner.phone,
      }
    );
    setActiveQueueTab('DISPATCH');
    showTerminalToast(`Order ${order.orderNumber} dispatched with ${runner.name}!`);
  };

  const handleMarkDelivered = (order: Order) => {
    transitionOrder(
      order.id,
      'completed',
      order.paymentMethod === 'COD'
        ? `Order delivered & COD ₹${(order.totalPaise / 100).toFixed(0)} collected`
        : 'Order delivered & verified with customer',
      'SELLER'
    );
    setActiveQueueTab('COMPLETED');
    showTerminalToast(`Order ${order.orderNumber} marked Delivered!`);
  };

  // Demo helper: simulate a real incoming customer order for activeSeller with 5:00 accept timer
  const handleSimulateIncomingOrder = () => {
    const sellerCatalog = isGroceryShop
      ? MOCK_GROCERY_PRODUCTS.filter((p) => p.sellerId === activeSeller.id)
      : MOCK_FOOD_PRODUCTS.filter((p) => p.sellerId === activeSeller.id);

    const sampleItems = sellerCatalog.slice(0, 2);
    const orderItems =
      sampleItems.length > 0
        ? sampleItems.map((prod, idx) => ({
            id: `sim_item_${Date.now()}_${idx}`,
            productId: prod.id,
            productName: prod.name,
            catalogueType: prod.catalogueType,
            unitPricePaise: prod.pricePaise,
            requestedQuantity: idx === 0 ? 2 : 1,
            requestedUnitLabel: `1 ${prod.unitBasis}`,
            lineTotalPaise: prod.pricePaise * (idx === 0 ? 2 : 1),
          }))
        : [
            {
              id: `sim_item_${Date.now()}_0`,
              productId: 'groc_1',
              productName: 'Chakki Fresh Wheat Atta (5 kg Pack)',
              catalogueType: 'GROCERY',
              unitPricePaise: 19500,
              requestedQuantity: 1,
              requestedUnitLabel: '5 kg Pack',
              lineTotalPaise: 19500,
            },
          ];

    const subtotal = orderItems.reduce((sum, i) => sum + i.lineTotalPaise, 0);
    const deliveryFee = activeSeller.deliveryFeePaise || 1500;
    const packagingFee = activeSeller.packagingFeePaise || 0;

    const created = createOrder({
      customerId: 'user_cust_1',
      customerName: 'Ramesh Patel',
      customerPhone: '9876543210',
      sellerId: activeSeller.id,
      sellerName: activeSeller.publicName,
      sellerPhone: activeSeller.contactPhone,
      villageId: activeSeller.villageId,
      fulfilmentMode: 'DELIVERY',
      deliveryAddress: {
        id: `addr_sim_${Date.now()}`,
        userId: 'user_cust_1',
        recipientName: 'Ramesh Patel',
        recipientPhone: '9876543210',
        villageId: activeSeller.villageId,
        villageName: activeSeller.villageName,
        addressLine1: `House No. 18, Main Basti`,
        landmark: `Near Panchayat Bhavan, ${activeSeller.villageName}`,
        addressLabel: 'Home',
        isDefault: true,
        createdAt: new Date().toISOString(),
      },
      deliveryNote: isGroceryShop
        ? 'Samaan achhe se pack kar dena, ghar ke bahar call karein.'
        : 'Garam garam bhejna, thoda kam teekha rakhna.',
      items: orderItems,
      paymentMethod: 'COD',
      paymentStatus: 'pending',
      itemSubtotalPaise: subtotal,
      deliveryFeePaise: deliveryFee,
      packagingFeePaise: packagingFee,
      platformFeePaise: 0,
      totalPaise: subtotal + deliveryFee + packagingFee,
      estimatedDeliveryMinutes: isGroceryShop ? 30 : 25,
    });

    setActiveQueueTab('NEW');
    showTerminalToast(
      `New incoming order ${created.orderNumber} arrived! 5:00 min accept timer started.`
    );
  };

  // Compute remaining acceptance time for an incoming order
  const getAcceptTimerInfo = (order: Order) => {
    const windowSecs = order.acceptWindowSeconds || DEFAULT_ACCEPT_SECONDS;
    const deadlineMs = order.acceptDeadlineAt
      ? new Date(order.acceptDeadlineAt).getTime()
      : new Date(order.createdAt).getTime() + windowSecs * 1000;
    const remainingSecs = Math.max(0, Math.floor((deadlineMs - nowMs) / 1000));
    const progressPct = Math.max(0, Math.min(100, (remainingSecs / windowSecs) * 100));
    const isExpired = remainingSecs <= 0;
    const isUrgent = remainingSecs > 0 && remainingSecs <= 60;
    const isWarning = remainingSecs > 60 && remainingSecs <= 120;

    return {
      remainingSecs,
      formatted: formatCountdownMMSS(remainingSecs),
      progressPct,
      isExpired,
      isUrgent,
      isWarning,
    };
  };

  const getStepIndex = (status: Order['status']): number => {
    if (status === 'placed' || status === 'pending') return 0;
    if (status === 'accepted' || status === 'preparing') return 1;
    if (status === 'ready_for_delivery' || status === 'ready_for_pickup') return 2;
    if (status === 'out_for_delivery') return 3;
    if (status === 'completed') return 4;
    return -1;
  };

  return (
    <div className="space-y-5 text-left animate-fade-in">
      {/* Inline Terminal Toast */}
      {terminalToast && (
        <div className="p-3 rounded-xl bg-[#1F2937] text-white text-xs font-semibold flex items-center justify-between gap-3 shadow-md animate-fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#4ADE80] shrink-0" />
            <span>{terminalToast}</span>
          </div>
          <button
            type="button"
            onClick={() => setTerminalToast(null)}
            className="text-slate-300 hover:text-white text-[11px] font-bold cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Top Terminal Header Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-4 bg-white rounded-2xl border border-[#E5E7EB] shadow-xs">
        <div className="flex items-center gap-3 min-w-0">
          {activeSeller.bannerUrl ? (
            <img
              src={activeSeller.bannerUrl}
              alt={activeSeller.publicName}
              referrerPolicy="no-referrer"
              className="w-12 h-12 rounded-xl object-cover border border-[#E5E7EB] shrink-0"
            />
          ) : (
            <div className="w-12 h-12 rounded-xl bg-[#E8F5E9] text-[#218838] flex items-center justify-center shrink-0">
              <Store className="w-5 h-5" />
            </div>
          )}

          <div className="min-w-0">
            <h2 className="text-base sm:text-lg font-extrabold text-[#1F2937] truncate">
              {activeSeller.publicName} — Kitchen & Packing Terminal
            </h2>
            <p className="text-xs text-[#6B7280] truncate">
              Village: <strong className="text-[#1F2937]">{activeSeller.villageName}</strong> •{' '}
              {activeSeller.addressLine}
            </p>
          </div>
        </div>

        {/* Right Controls: Quick Shop Switcher, Sound Toggle, Simulate Demo Order */}
        <div className="flex flex-wrap items-center gap-2">
          <select
            aria-label="Switch active shop terminal"
            value={activeSeller.id}
            onChange={(e) => {
              setActiveSellerId(e.target.value);
              setActiveQueueTab('NEW');
            }}
            className="h-9 px-3 bg-[#F8FAFC] border border-[#E5E7EB] rounded-full text-xs font-bold text-[#1F2937] outline-none focus:border-[#218838] max-w-[230px]"
          >
            {allSellers.map((s) => {
              const pendingCnt = incomingCountBySeller[s.id] || 0;
              return (
                <option key={s.id} value={s.id}>
                  {s.publicName} {pendingCnt > 0 ? `(${pendingCnt} NEW)` : ''}
                </option>
              );
            })}
          </select>

          <button
            type="button"
            onClick={toggleBuzzer}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors cursor-pointer ${
              isBuzzerEnabled
                ? 'bg-[#DCFCE7] text-[#166534] border-[#86EFAC]'
                : 'bg-[#F1F5F9] text-[#64748B] border-[#E5E7EB]'
            }`}
          >
            {isBuzzerEnabled ? (
              <Bell className="w-3.5 h-3.5 text-[#218838]" />
            ) : (
              <BellOff className="w-3.5 h-3.5 text-[#64748B]" />
            )}
            <span>{isBuzzerEnabled ? 'Alert Sound: ON' : 'Muted'}</span>
          </button>

          <Button
            variant="outline"
            size="sm"
            leftIcon={<PlusCircle className="w-3.5 h-3.5" />}
            onClick={handleSimulateIncomingOrder}
          >
            Test Incoming Order
          </Button>
        </div>
      </div>

      {/* Live Incoming Order Urgent Banner */}
      {incomingOrders.length > 0 && (
        <div className="p-3.5 sm:p-4 rounded-2xl bg-amber-50 border border-amber-300 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-start sm:items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-amber-500 text-white flex items-center justify-center shrink-0 animate-pulse">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs sm:text-sm font-extrabold text-[#92400E]">
                {incomingOrders.length} New Incoming Order{incomingOrders.length > 1 ? 's' : ''} Waiting for Acceptance!
              </p>
              <p className="text-[11px] text-[#B45309]">
                Seller has a 5-minute acceptance window. Choose packing/prep time and click <strong>Accept Order</strong> before the timer runs out.
              </p>
            </div>
          </div>

          {activeQueueTab !== 'NEW' && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => setActiveQueueTab('NEW')}
            >
              View Incoming ({incomingOrders.length})
            </Button>
          )}
        </div>
      )}

      {/* Queue Filter Tabs with Counts */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {[
          {
            id: 'NEW',
            label: 'Incoming / New',
            count: incomingOrders.length,
            urgent: true,
          },
          {
            id: 'PREPARING',
            label: isGroceryShop ? 'Packing Queue' : 'In Kitchen / Preparing',
            count: sellerOrders.filter((o) => ['accepted', 'preparing'].includes(o.status)).length,
          },
          {
            id: 'READY',
            label: 'Ready for Handover',
            count: sellerOrders.filter((o) =>
              ['ready_for_delivery', 'ready_for_pickup'].includes(o.status)
            ).length,
          },
          {
            id: 'DISPATCH',
            label: 'Out for Delivery',
            count: sellerOrders.filter((o) => o.status === 'out_for_delivery').length,
          },
          {
            id: 'COMPLETED',
            label: 'Delivered Today',
            count: sellerOrders.filter((o) => o.status === 'completed').length,
          },
          {
            id: 'CANCELLED',
            label: 'Rejected / Cancelled',
            count: sellerOrders.filter((o) =>
              ['cancelled', 'rejected', 'delivery_failed'].includes(o.status)
            ).length,
          },
          { id: 'ALL', label: 'All Orders', count: sellerOrders.length },
        ].map((tab) => {
          const isActive = activeQueueTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveQueueTab(tab.id as typeof activeQueueTab)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer border ${
                isActive
                  ? 'bg-[#218838] text-white border-[#218838] shadow-xs'
                  : 'bg-white text-[#475569] border-[#E5E7EB] hover:bg-[#F8FAFC]'
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold leading-none ${
                  isActive
                    ? 'bg-white/20 text-white'
                    : tab.urgent && tab.count > 0
                    ? 'bg-[#FEE2E2] text-[#DC2626] animate-pulse'
                    : 'bg-[#F1F5F9] text-[#6B7280]'
                }`}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Orders Queue Grid */}
      {displayedOrders.length === 0 ? (
        <div className="p-10 text-center bg-white rounded-2xl border border-[#E5E7EB] space-y-3">
          <CheckCircle2 className="w-10 h-10 text-[#218838] mx-auto" />
          <div>
            <p className="text-base font-bold text-[#1F2937]">Queue is Clear</p>
            <p className="text-xs text-[#6B7280] mt-1">
              No orders in this status category for <strong>{activeSeller.publicName}</strong> right now.
            </p>
          </div>
          {activeQueueTab === 'NEW' && (
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<Sparkles className="w-3.5 h-3.5" />}
              onClick={handleSimulateIncomingOrder}
            >
              Simulate Live Incoming Order
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {displayedOrders.map((order) => {
            const isNew = order.status === 'placed' || order.status === 'pending';
            const isPreparing = ['accepted', 'preparing'].includes(order.status);
            const isReady = ['ready_for_delivery', 'ready_for_pickup'].includes(order.status);
            const isDispatch = order.status === 'out_for_delivery';
            const isDone = order.status === 'completed';
            const isCancelled = ['cancelled', 'rejected', 'delivery_failed'].includes(order.status);

            const timerInfo = isNew ? getAcceptTimerInfo(order) : null;
            const stepIndex = getStepIndex(order.status);
            const defaultPrep = isGroceryShop ? 20 : 25;
            const chosenPrep = prepTimes[order.id] || defaultPrep;

            return (
              <div
                key={order.id}
                className={`bg-white rounded-2xl border p-4 sm:p-5 shadow-xs flex flex-col justify-between transition-all ${
                  isNew
                    ? timerInfo?.isExpired || timerInfo?.isUrgent
                      ? 'border-red-400 ring-2 ring-red-100'
                      : 'border-amber-300 ring-2 ring-amber-100'
                    : 'border-[#E5E7EB]'
                }`}
              >
                <div>
                  {/* Card Header: Order ID, Elapsed Time, Status */}
                  <div className="flex items-start justify-between gap-2 pb-3 border-b border-[#E5E7EB]">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-sm font-extrabold text-[#1F2937]">
                          {order.orderNumber}
                        </span>
                        <Badge
                          variant={
                            isNew
                              ? 'warning'
                              : isDone
                              ? 'success'
                              : isCancelled
                              ? 'error'
                              : 'info'
                          }
                          size="sm"
                          dot
                          pulsing={isNew}
                        >
                          {order.status.replace(/_/g, ' ').toUpperCase()}
                        </Badge>
                      </div>
                      <span className="text-[11px] text-[#6B7280] block mt-0.5">
                        Placed: {formatTimeAgo(order.createdAt)} ({formatDateTime(order.createdAt)})
                      </span>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-base font-extrabold text-[#1F2937] block tabular-nums">
                        {formatINR(order.totalPaise)}
                      </span>
                      <span className="text-[10px] font-semibold text-[#16A34A] bg-[#DCFCE7] px-2 py-0.5 rounded-full inline-block">
                        {order.paymentMethod} • {order.fulfilmentMode}
                      </span>
                    </div>
                  </div>

                  {/* LIVE ACCEPT COUNTDOWN TIMER BOX (Stage 1 Incoming Orders) */}
                  {isNew && timerInfo && (
                    <div
                      className={`mt-3 p-3 rounded-xl border ${
                        timerInfo.isExpired
                          ? 'bg-red-50 border-red-300'
                          : timerInfo.isUrgent
                          ? 'bg-red-50 border-red-200'
                          : timerInfo.isWarning
                          ? 'bg-amber-50 border-amber-200'
                          : 'bg-[#E8F5E9] border-[#A7F3D0]'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          {timerInfo.isExpired ? (
                            <AlertTriangle className="w-4 h-4 text-[#DC2626] shrink-0" />
                          ) : (
                            <Timer
                              className={`w-4 h-4 shrink-0 ${
                                timerInfo.isUrgent
                                  ? 'text-[#DC2626] animate-pulse'
                                  : timerInfo.isWarning
                                  ? 'text-[#D97706]'
                                  : 'text-[#218838]'
                              }`}
                            />
                          )}
                          <div>
                            <p
                              className={`text-xs font-extrabold ${
                                timerInfo.isExpired || timerInfo.isUrgent
                                  ? 'text-[#DC2626]'
                                  : timerInfo.isWarning
                                  ? 'text-[#92400E]'
                                  : 'text-[#176B2C]'
                              }`}
                            >
                              {timerInfo.isExpired
                                ? 'Accept Time Expired!'
                                : 'Accept Window Active'}
                            </p>
                            <p className="text-[10px] text-[#475569]">
                              {timerInfo.isExpired
                                ? 'Respond immediately or extend timer by 2 mins'
                                : 'Confirm order before countdown hits 00:00'}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span
                            className={`font-mono text-base font-black tabular-nums px-2.5 py-1 rounded-lg ${
                              timerInfo.isExpired || timerInfo.isUrgent
                                ? 'bg-[#DC2626] text-white'
                                : timerInfo.isWarning
                                ? 'bg-[#D97706] text-white'
                                : 'bg-[#218838] text-white'
                            }`}
                          >
                            {timerInfo.formatted}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              extendAcceptWindow(order.id, 2);
                              showTerminalToast(
                                `Extended accept timer by +2 mins for ${order.orderNumber}`
                              );
                            }}
                            className="px-2 py-1 rounded-lg bg-white border border-[#E5E7EB] hover:border-[#218838] text-[10px] font-bold text-[#1F2937] cursor-pointer"
                            title="Add 2 extra minutes to accept"
                          >
                            +2m
                          </button>
                        </div>
                      </div>

                      {/* Shrinking countdown bar */}
                      <div className="mt-2 h-1.5 w-full rounded-full bg-white/80 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-1000 ${
                            timerInfo.isExpired || timerInfo.isUrgent
                              ? 'bg-[#DC2626]'
                              : timerInfo.isWarning
                              ? 'bg-[#D97706]'
                              : 'bg-[#16A34A]'
                          }`}
                          style={{ width: `${timerInfo.progressPct}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Compact 5-Step Workflow Progress Bar (Active/Completed Orders) */}
                  {!isCancelled && (
                    <div className="mt-3 pt-1 flex items-center justify-between gap-1 text-[10px]">
                      {[
                        'Accept',
                        isGroceryShop ? 'Packing' : 'Kitchen',
                        'Ready',
                        order.fulfilmentMode === 'PICKUP' ? 'Counter' : 'Dispatch',
                        'Done',
                      ].map((stepLabel, idx) => {
                        const completed = idx < stepIndex || isDone;
                        const active = idx === stepIndex && !isDone;
                        return (
                          <div key={stepLabel} className="flex-1 flex flex-col items-center gap-1">
                            <div
                              className={`w-full h-1.5 rounded-full ${
                                completed
                                  ? 'bg-[#218838]'
                                  : active
                                  ? 'bg-[#F59E0B]'
                                  : 'bg-[#E5E7EB]'
                              }`}
                            />
                            <span
                              className={`font-semibold truncate ${
                                completed
                                  ? 'text-[#176B2C]'
                                  : active
                                  ? 'text-[#D97706]'
                                  : 'text-[#9CA3AF]'
                              }`}
                            >
                              {completed && <Check className="w-2.5 h-2.5 inline mr-0.5" />}
                              {stepLabel}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Customer Information & Village Landmark */}
                  <div className="py-3 border-b border-[#E5E7EB] text-xs space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-[#1F2937]">
                        Customer: {order.customerName}
                      </span>
                      <a
                        href={`tel:${order.customerPhone}`}
                        className="flex items-center gap-1 text-[#218838] font-semibold hover:underline"
                      >
                        <Phone className="w-3.5 h-3.5" />
                        <span>+91 {order.customerPhone}</span>
                      </a>
                    </div>

                    {order.deliveryAddress ? (
                      <div className="flex items-start gap-1.5 text-xs text-[#176B2C] bg-[#E8F5E9] p-2 rounded-xl">
                        <MapPin className="w-4 h-4 shrink-0 text-[#218838] mt-0.5" />
                        <div>
                          <strong className="block">
                            Landmark: {order.deliveryAddress.landmark}
                          </strong>
                          <span className="text-[11px] text-[#475569]">
                            {order.deliveryAddress.addressLine1}, {order.deliveryAddress.villageName}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="p-2 bg-[#F1F5F9] rounded-xl text-[#475569]">
                        <strong>Self Store Pickup</strong> — Customer will collect at counter.
                      </div>
                    )}

                    {order.deliveryNote && (
                      <p className="text-[11px] text-[#92400E] bg-amber-50 p-2 rounded-lg italic">
                        Customer Instruction: &ldquo;{order.deliveryNote}&rdquo;
                      </p>
                    )}
                  </div>

                  {/* Itemized Snapshot */}
                  <div className="py-3 space-y-2 text-xs">
                    <span className="font-semibold uppercase tracking-wider text-[#6B7280] flex items-center gap-1.5 text-[11px]">
                      <Package className="w-3.5 h-3.5 text-[#218838]" />
                      Items to {isGroceryShop ? 'Weigh & Pack' : 'Prepare'} ({order.items.length})
                    </span>

                    <div className="divide-y divide-[#E5E7EB] border border-[#E5E7EB] rounded-xl overflow-hidden bg-[#F8FAFC]">
                      {order.items.map((i) => (
                        <div
                          key={i.id}
                          className="p-2.5 flex justify-between items-center gap-2 bg-white"
                        >
                          <div className="min-w-0">
                            <span className="font-bold text-[#1F2937] block truncate">
                              {i.productName}
                            </span>
                            <span className="text-[11px] text-[#6B7280]">
                              Pack: <strong className="text-[#1F2937]">{i.requestedUnitLabel}</strong>{' '}
                              × <strong>{i.requestedQuantity}</strong>
                            </span>
                            {i.customerNote && (
                              <span className="text-[10px] text-[#D97706] block mt-0.5">
                                Note: {i.customerNote}
                              </span>
                            )}
                          </div>
                          <span className="font-bold text-[#1F2937] shrink-0 tabular-nums">
                            {formatINR(i.lineTotalPaise)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Card Action Footer */}
                <div className="pt-3 border-t border-[#E5E7EB] space-y-3">
                  {/* STAGE 1: NEW / PLACED -> CHOOSE TIME + ACCEPT OR REJECT */}
                  {isNew && (
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between gap-2 text-xs flex-wrap">
                        <span className="text-[#6B7280] font-semibold inline-flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-[#218838]" />
                          Est. {isGroceryShop ? 'Packing' : 'Prep'} Time:
                        </span>
                        <div className="flex items-center gap-1.5">
                          {[15, 20, 30, 45].map((mins) => (
                            <button
                              key={mins}
                              type="button"
                              onClick={() => setPrepTimes((p) => ({ ...p, [order.id]: mins }))}
                              className={`px-2.5 py-1 rounded-lg text-xs font-bold cursor-pointer border transition-colors ${
                                chosenPrep === mins
                                  ? 'bg-[#218838] text-white border-[#218838]'
                                  : 'bg-white text-[#475569] border-[#E5E7EB] hover:border-[#218838]/50'
                              }`}
                            >
                              {mins}m
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          variant="destructive"
                          size="md"
                          onClick={() => setRejectingOrder(order)}
                        >
                          Reject Order
                        </Button>
                        <Button
                          variant="primary"
                          size="md"
                          onClick={() => handleAcceptOrder(order)}
                        >
                          Accept Order ({chosenPrep}m)
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* STAGE 2: ACCEPTED / PREPARING -> START PACKING / MARK READY */}
                  {isPreparing && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-[11px] text-[#475569] bg-[#F8FAFC] px-3 py-1.5 rounded-lg border border-[#E5E7EB]">
                        <span>Promised ETA</span>
                        <strong className="text-[#1F2937]">
                          {order.estimatedDeliveryMinutes || 25} mins
                        </strong>
                      </div>
                      {order.status === 'accepted' ? (
                        <Button
                          variant="primary"
                          size="md"
                          fullWidth
                          onClick={() => handleStartPreparing(order)}
                        >
                          {isGroceryShop ? 'Start Packing Items' : 'Start Cooking / Preparing'}
                        </Button>
                      ) : (
                        <Button
                          variant="primary"
                          size="md"
                          fullWidth
                          onClick={() => handleMarkReady(order)}
                        >
                          {order.fulfilmentMode === 'PICKUP'
                            ? 'Mark Packed & Ready at Counter'
                            : 'Mark Packed & Ready for Dispatch'}
                        </Button>
                      )}
                    </div>
                  )}

                  {/* STAGE 3: READY -> ASSIGN RUNNER & DISPATCH (OR COMPLETE PICKUP) */}
                  {isReady && (
                    <div className="space-y-2.5 text-xs">
                      {order.fulfilmentMode === 'DELIVERY' ? (
                        <>
                          <div>
                            <label className="text-[11px] font-semibold uppercase tracking-wider text-[#6B7280] block mb-1">
                              Assign In-House Delivery Runner:
                            </label>
                            <select
                              value={selectedRunners[order.id] || runners[0].id}
                              onChange={(e) =>
                                setSelectedRunners((prev) => ({
                                  ...prev,
                                  [order.id]: e.target.value,
                                }))
                              }
                              className="w-full h-10 px-3 bg-[#F8FAFC] border border-[#E5E7EB] rounded-xl text-xs font-semibold text-[#1F2937] outline-none focus:border-[#218838]"
                            >
                              {runners.map((r) => (
                                <option key={r.id} value={r.id}>
                                  {r.name} ({r.role}) • {r.activeOrdersCount} active
                                </option>
                              ))}
                            </select>
                          </div>

                          <Button
                            variant="primary"
                            size="md"
                            fullWidth
                            leftIcon={<Truck className="w-4 h-4" />}
                            onClick={() => handleDispatchOrder(order)}
                          >
                            Dispatch Order for Delivery
                          </Button>
                        </>
                      ) : (
                        <Button
                          variant="primary"
                          size="md"
                          fullWidth
                          leftIcon={<CheckCircle2 className="w-4 h-4" />}
                          onClick={() => handleDispatchOrder(order)}
                        >
                          Hand Over at Counter & Complete
                        </Button>
                      )}
                    </div>
                  )}

                  {/* STAGE 4: DISPATCHED -> MARK DELIVERED */}
                  {isDispatch && (
                    <div className="space-y-2">
                      <div className="p-2.5 bg-[#E8F5E9] rounded-xl text-xs text-[#166534] flex items-center justify-between gap-2 flex-wrap">
                        <span>
                          Runner: <strong>{order.assignedRunnerName || 'Shop Delivery Boy'}</strong>
                        </span>
                        <strong>
                          {order.paymentMethod === 'COD'
                            ? `Collect ${formatINR(order.totalPaise)}`
                            : 'Prepaid / UPI'}
                        </strong>
                      </div>
                      <Button
                        variant="primary"
                        size="md"
                        fullWidth
                        leftIcon={<CheckCircle2 className="w-4 h-4" />}
                        onClick={() => handleMarkDelivered(order)}
                      >
                        Mark Delivered & Payment Received
                      </Button>
                    </div>
                  )}

                  {/* STAGE 5: COMPLETED */}
                  {isDone && (
                    <div className="p-2.5 bg-[#DCFCE7] rounded-xl text-center text-xs font-bold text-[#166534]">
                      Order Successfully Completed & Delivered
                    </div>
                  )}

                  {/* REJECTED / CANCELLED */}
                  {isCancelled && (
                    <div className="p-2.5 bg-red-50 border border-red-200 rounded-xl text-xs text-[#DC2626]">
                      <strong>{order.status === 'rejected' ? 'Rejected' : 'Cancelled'}:</strong>{' '}
                      {order.cancellation?.reason ||
                        order.statusHistory[order.statusHistory.length - 1]?.reason ||
                        'Order closed'}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Mandatory Rejection Reason Modal */}
      {rejectingOrder && (
        <Modal
          isOpen={true}
          onClose={() => setRejectingOrder(null)}
          title={`Reject Order ${rejectingOrder.orderNumber}?`}
          description="A mandatory reason is required and will be communicated to the customer."
          footer={
            <>
              <Button variant="secondary" size="md" onClick={() => setRejectingOrder(null)}>
                Back to Orders
              </Button>
              <Button variant="destructive" size="md" onClick={handleConfirmRejection}>
                Confirm Rejection
              </Button>
            </>
          }
        >
          <div className="space-y-4 text-left text-xs">
            <div>
              <label className="font-semibold uppercase tracking-wider text-[#1F2937] block mb-1.5">
                Select Rejection Reason
              </label>
              <select
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="w-full h-11 px-3 bg-white border border-[#E5E7EB] rounded-xl text-xs font-semibold text-[#1F2937] outline-none"
              >
                <option value="Item Out of Stock">Item Out of Stock / Samagri Khatam Hai</option>
                <option value="Kitchen Overloaded">Kitchen Overloaded / Bohat Zyada Bheed Hai</option>
                <option value="Store Closing Soon">Store Closing Soon / Dukaan Band Ho Rahi Hai</option>
                <option value="Delivery Runner Unavailable">
                  Delivery Runner Unavailable / Ladka Nahi Hai
                </option>
                <option value="Outside Service Radius">
                  Outside Service Radius / Gaon Bahut Door Hai
                </option>
              </select>
            </div>

            <div>
              <label className="font-semibold uppercase tracking-wider text-[#1F2937] block mb-1.5">
                Additional Note to Customer (Optional)
              </label>
              <input
                type="text"
                value={rejectionNotes}
                onChange={(e) => setRejectionNotes(e.target.value)}
                placeholder="e.g. Sham 5 baje fresh batch aayega tab order karein..."
                className="w-full h-10 px-3.5 border border-[#E5E7EB] rounded-xl text-xs text-[#1F2937] outline-none"
              />
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
