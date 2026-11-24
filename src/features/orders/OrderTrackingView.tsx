import React, { useEffect, useState } from 'react';
import { useOrders } from '../../contexts/OrderContext';
import { OrderStatus } from '../../types/order';
import { formatINR } from '../../utils/currency';
import { formatDateTime } from '../../utils/dates';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { ConfirmDialog } from '../../components/feedback/ConfirmDialog';
import {
  CheckCircle2,
  Clock,
  Phone,
  Truck,
  Store,
  ArrowLeft,
  XCircle,
  AlertTriangle,
  Play,
  Bell,
  ArrowRight,
} from 'lucide-react';

export interface OrderTrackingViewProps {
  orderId: string;
  onBackToOrders: () => void;
  onBackToHome: () => void;
  onOpenSellerTerminal?: (sellerId: string) => void;
}

export const OrderTrackingView: React.FC<OrderTrackingViewProps> = ({
  orderId,
  onBackToOrders,
  onBackToHome,
  onOpenSellerTerminal,
}) => {
  const { getOrderById, cancelOrder, transitionOrder } = useOrders();
  const order = getOrderById(orderId);

  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('Change of plan / ordered by mistake');
  const [nowMs, setNowMs] = useState<number>(() => Date.now());

  useEffect(() => {
    if (!order || (order.status !== 'placed' && order.status !== 'pending')) return;
    const timer = window.setInterval(() => setNowMs(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [order]);

  if (!order) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4 text-left">
        <Button
          variant="secondary"
          size="sm"
          leftIcon={<ArrowLeft className="w-3.5 h-3.5" />}
          onClick={onBackToOrders}
          className="mb-4"
        >
          Back to Orders
        </Button>
        <div className="p-8 bg-white rounded-2xl border border-[#E5E7EB] text-center">
          <p className="text-base font-bold text-[#1F2937]">Order Not Found</p>
          <p className="text-xs text-[#6B7280] mt-1 mb-4">
            Could not retrieve details for Order ID: {orderId}
          </p>
          <Button variant="primary" size="md" onClick={onBackToHome}>
            Return to Marketplace
          </Button>
        </div>
      </div>
    );
  }

  const isEligibleForSelfCancel = order.status === 'placed';

  const handleCancel = () => {
    cancelOrder(order.id, cancelReason);
    setIsCancelModalOpen(false);
  };

  // State machine steps
  const steps: { status: OrderStatus; label: string; description: string }[] = [
    {
      status: 'placed',
      label: 'Order Placed',
      description: 'Order sent to merchant for confirmation',
    },
    {
      status: 'accepted',
      label: 'Seller Accepted',
      description: `Shopkeeper confirmed order (Est. ${order.estimatedDeliveryMinutes || 25} mins)`,
    },
    {
      status: 'preparing',
      label: 'Preparing / Packing',
      description: 'Items being freshly cooked or packed at store',
    },
    {
      status: 'ready_for_delivery',
      label: 'Ready for Handover',
      description: 'Order packed and assigned to delivery runner',
    },
    {
      status: 'out_for_delivery',
      label: 'Out for Delivery',
      description: 'Seller runner is on the way to your village landmark',
    },
    {
      status: 'completed',
      label: 'Delivered & Completed',
      description: 'Order handed over and payment collected',
    },
  ];

  const statusOrder: OrderStatus[] = [
    'placed',
    'accepted',
    'preparing',
    'ready_for_delivery',
    'out_for_delivery',
    'completed',
  ];

  const currentStepIndex = statusOrder.indexOf(order.status);
  const isCancelled = order.status === 'cancelled' || order.status === 'rejected';

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 text-left animate-fade-in">
      {/* Top Navigation */}
      <div className="flex items-center justify-between mb-4">
        <Button
          variant="secondary"
          size="sm"
          leftIcon={<ArrowLeft className="w-3.5 h-3.5" />}
          onClick={onBackToOrders}
        >
          View All Orders
        </Button>

        <Button variant="ghost" size="sm" onClick={onBackToHome}>
          Marketplace Home
        </Button>
      </div>

      {/* Header Stamp */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 shadow-xs mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-mono text-sm font-bold text-[#1F2937]">
                {order.orderNumber}
              </span>
              {isCancelled ? (
                <Badge variant="error" dot>
                  {order.status.toUpperCase()}
                </Badge>
              ) : (
                <Badge variant="success" dot pulsing>
                  {order.status.replace('_', ' ').toUpperCase()}
                </Badge>
              )}
            </div>
            <h1 className="text-xl font-bold text-[#1F2937]">
              {order.sellerName}
            </h1>
            <p className="text-xs text-[#6B7280] mt-0.5">
              Placed on {formatDateTime(order.createdAt)}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={`tel:${order.sellerPhone}`}
              className="inline-flex items-center gap-2 h-10 px-4 rounded-full bg-[#E8F5E9] text-[#176B2C] hover:bg-[#A7F3D0] text-xs font-bold transition-colors"
            >
              <Phone className="w-4 h-4" />
              <span>Call Seller (+91 {order.sellerPhone})</span>
            </a>

            {isEligibleForSelfCancel && (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setIsCancelModalOpen(true)}
              >
                Cancel Order
              </Button>
            )}
          </div>
        </div>

        {/* LIVE SELLER NOTIFICATION & ACCEPT COUNTDOWN STATUS BANNER */}
        {(order.status === 'placed' || order.status === 'pending') && (() => {
          const deadlineMs = order.acceptDeadlineAt
            ? new Date(order.acceptDeadlineAt).getTime()
            : new Date(order.createdAt).getTime() + (order.acceptWindowSeconds ?? 300) * 1000;
          const remainingSec = Math.max(0, Math.ceil((deadlineMs - nowMs) / 1000));
          const mins = String(Math.floor(remainingSec / 60)).padStart(2, '0');
          const secs = String(remainingSec % 60).padStart(2, '0');

          return (
            <div className="mt-4 p-3.5 rounded-xl bg-[#FFFBEB] border border-[#FDE68A] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start gap-2.5 text-xs">
                <div className="w-8 h-8 rounded-full bg-[#F59E0B] text-white flex items-center justify-center shrink-0 animate-pulse">
                  <Bell className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-bold text-[#92400E]">
                    Notification sent to {order.sellerName} — Waiting for Seller Acceptance
                  </p>
                  <p className="text-[#B45309] mt-0.5 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    {remainingSec > 0 ? (
                      <span>
                        Seller accept window remaining:{' '}
                        <strong className="font-mono text-sm text-[#92400E]">
                          {mins}:{secs}
                        </strong>
                      </span>
                    ) : (
                      <strong className="text-[#DC2626]">
                        Accept SLA timer reached 00:00 — Seller notified for urgent response
                      </strong>
                    )}
                  </p>
                </div>
              </div>

              {onOpenSellerTerminal && (
                <Button
                  variant="primary"
                  size="sm"
                  leftIcon={<Store className="w-3.5 h-3.5" />}
                  rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                  onClick={() => onOpenSellerTerminal(order.sellerId)}
                >
                  Open {order.sellerName} Terminal
                </Button>
              )}
            </div>
          );
        })()}

        {/* DEVELOPER SIMULATION CONTROLLER BAR */}
        <div className="mt-5 pt-4 border-t border-[#E5E7EB] bg-[#F8FAFC] -mx-6 -mb-6 p-4 rounded-b-2xl flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-bold text-[#1F2937] flex items-center gap-1">
              <Play className="w-3.5 h-3.5 text-[#218838]" />
              Interactive State Simulator:
            </span>
            <span className="text-[#6B7280]">
              (Simulate seller advancing order lifecycle)
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {order.status === 'placed' && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => transitionOrder(order.id, 'accepted', 'Seller accepted order')}
              >
                Simulate: Accept Order
              </Button>
            )}
            {order.status === 'accepted' && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => transitionOrder(order.id, 'preparing', 'Kitchen started cooking')}
              >
                Simulate: Start Preparing
              </Button>
            )}
            {order.status === 'preparing' && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => transitionOrder(order.id, 'ready_for_delivery', 'Order packed at counter')}
              >
                Simulate: Mark Ready
              </Button>
            )}
            {order.status === 'ready_for_delivery' && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => transitionOrder(order.id, 'out_for_delivery', 'Runner departed with order')}
              >
                Simulate: Out for Delivery
              </Button>
            )}
            {order.status === 'out_for_delivery' && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => transitionOrder(order.id, 'completed', 'Order delivered & paid')}
              >
                Simulate: Mark Delivered
              </Button>
            )}
            {order.status === 'completed' && (
              <span className="font-bold text-[#16A34A] flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" /> Order Successfully Delivered & Paid!
              </span>
            )}
            {isCancelled && (
              <span className="font-bold text-[#DC2626] flex items-center gap-1">
                <XCircle className="w-4 h-4" /> Order Cancelled
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT: 7-Stage Visual State Timeline (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-[#E5E7EB] p-6 shadow-xs space-y-6">
          <h3 className="font-bold text-sm uppercase tracking-wider text-[#1F2937]">
            Live Order Progression
          </h3>

          {isCancelled ? (
            <div className="p-4 bg-[#FEE2E2] border border-[#FCA5A5] rounded-xl text-xs text-[#991B1B] space-y-1">
              <p className="font-bold flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-[#DC2626]" />
                <span>Order Cancelled</span>
              </p>
              <p>
                Reason:{' '}
                {order.statusHistory[order.statusHistory.length - 1]?.reason || 'Cancelled'}
              </p>
            </div>
          ) : (
            <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-[#E5E7EB]">
              {steps.map((step, idx) => {
                const isPassed = currentStepIndex >= idx;
                const isCurrent = currentStepIndex === idx;

                return (
                  <div key={step.status} className="relative flex items-start gap-4 text-xs">
                    {/* Step Icon circle */}
                    <div
                      className={`absolute -left-6 w-5 h-5 rounded-full flex items-center justify-center ring-4 ring-white ${
                        isPassed
                          ? 'bg-[#218838] text-white'
                          : 'bg-[#CBD5E1] text-white'
                      }`}
                    >
                      {isPassed ? (
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      ) : (
                        <span className="w-1.5 h-1.5 rounded-full bg-white" />
                      )}
                    </div>

                    <div className="pt-0.5">
                      <p
                        className={`font-bold text-sm ${
                          isCurrent
                            ? 'text-[#218838]'
                            : isPassed
                            ? 'text-[#1F2937]'
                            : 'text-[#9CA3AF]'
                        }`}
                      >
                        {step.label}
                      </p>
                      <p className="text-[#6B7280] mt-0.5">{step.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Delivery runner info */}
          {order.status === 'out_for_delivery' && (
            <div className="p-4 bg-[#E8F5E9] border border-[#A7F3D0] rounded-xl text-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-[#176B2C] flex items-center gap-1.5">
                  <Truck className="w-4 h-4 text-[#218838]" />
                  <span>
                    Assigned Shop Runner:{' '}
                    {order.assignedRunnerName || 'Ramesh (Shop Boy)'}
                  </span>
                </span>
                <a
                  href={`tel:${order.assignedRunnerPhone || order.sellerPhone}`}
                  className="font-bold text-[#218838] hover:underline"
                >
                  Call Runner ({order.assignedRunnerPhone || order.sellerPhone})
                </a>
              </div>
              <p className="text-[#475569]">
                Runner is approaching landmark:{' '}
                <strong>{order.deliveryAddress?.landmark || 'Your Village Address'}</strong>
              </p>
            </div>
          )}
        </div>

        {/* RIGHT: Immutable Receipt & Details (5 cols) */}
        <div className="lg:col-span-5 space-y-5">
          {/* Items & Payment snapshot */}
          <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 shadow-xs space-y-4">
            <h3 className="font-bold text-sm uppercase tracking-wider text-[#1F2937]">
              Immutable Receipt
            </h3>

            <div className="divide-y divide-[#E5E7EB] text-xs">
              {order.items.map((i) => (
                <div key={i.id} className="py-2.5 flex justify-between">
                  <div>
                    <span className="font-bold text-[#1F2937]">
                      {i.productName}
                    </span>
                    <span className="text-[#6B7280] block">
                      {i.requestedUnitLabel} x {i.requestedQuantity}
                    </span>
                  </div>
                  <span className="font-bold text-[#1F2937]">
                    {formatINR(i.lineTotalPaise)}
                  </span>
                </div>
              ))}
            </div>

            {/* Total breakdown */}
            <div className="pt-3 border-t border-[#E5E7EB] space-y-1.5 text-xs text-[#6B7280]">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="font-semibold text-[#1F2937]">{formatINR(order.itemSubtotalPaise)}</span>
              </div>
              <div className="flex justify-between">
                <span>Delivery Fee</span>
                <span className="font-semibold text-[#1F2937]">
                  {order.deliveryFeePaise === 0 ? 'FREE' : formatINR(order.deliveryFeePaise)}
                </span>
              </div>
              {order.packagingFeePaise > 0 && (
                <div className="flex justify-between">
                  <span>Packaging Fee</span>
                  <span className="font-semibold text-[#1F2937]">{formatINR(order.packagingFeePaise)}</span>
                </div>
              )}
              <div className="flex justify-between text-base font-bold text-[#1F2937] pt-2 border-t border-[#E5E7EB]">
                <span>Total Paid / Due</span>
                <span className="text-lg text-[#218838] font-extrabold">{formatINR(order.totalPaise)}</span>
              </div>
            </div>

            {/* Payment & Address details */}
            <div className="pt-3 border-t border-[#E5E7EB] text-xs space-y-2">
              <p>
                <strong className="text-[#1F2937]">Payment Mode:</strong>{' '}
                <Badge variant="primary" size="sm">
                  {order.paymentMethod}
                </Badge>
              </p>
              {order.deliveryAddress && (
                <div>
                  <strong className="text-[#1F2937] block mb-0.5">Delivery Landmark:</strong>
                  <p className="text-[#6B7280]">
                    {order.deliveryAddress.landmark}, {order.deliveryAddress.addressLine1},{' '}
                    {order.deliveryAddress.villageName}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Self-Cancel Confirmation Modal */}
      <ConfirmDialog
        isOpen={isCancelModalOpen}
        onClose={() => setIsCancelModalOpen(false)}
        onConfirm={handleCancel}
        isDestructive
        title="Cancel Order?"
        message="Since the shopkeeper has not yet accepted this order, you are eligible to cancel without fee. Are you sure?"
        confirmText="Confirm Cancellation"
        cancelText="Keep Order"
      />
    </div>
  );
};
