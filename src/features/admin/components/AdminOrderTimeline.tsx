/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  Check,
  Clock,
  Package,
  Store,
  Truck,
  PackageCheck,
  XCircle,
  RotateCcw,
  RefreshCw,
  AlertTriangle,
  ShoppingBag,
} from 'lucide-react';
import { Order, OrderEvent, OrderStatus } from '../../../types/order';
import { Badge } from '../../../components/ui/Badge';
import { formatDateTime, formatTimeAgo } from '../../../utils/dates';

interface TimelineNode {
  id: string;
  label: string;
  description: string;
  state: 'completed' | 'active' | 'pending' | 'error' | 'warning';
  timestamp?: string;
  actorRole?: string;
  note?: string;
  icon: React.ComponentType<{ className?: string }>;
}

export interface AdminOrderTimelineProps {
  order: Order;
}

const findLatestEvent = (
  history: OrderEvent[] | undefined,
  statuses: OrderStatus[]
): OrderEvent | undefined => {
  if (!history || history.length === 0) return undefined;
  return history
    .slice()
    .reverse()
    .find((ev) => statuses.includes(ev.toStatus));
};

export const AdminOrderTimeline: React.FC<AdminOrderTimelineProps> = ({ order }) => {
  const history = order.statusHistory || [];
  const isPickup = order.fulfilmentMode === 'PICKUP';

  const placedEv = findLatestEvent(history, ['placed', 'pending']);
  const confirmedEv = findLatestEvent(history, ['accepted']);
  const preparingEv = findLatestEvent(history, ['preparing']);
  const readyEv = findLatestEvent(history, ['ready_for_pickup', 'ready_for_delivery']);
  const outEv = findLatestEvent(history, ['out_for_delivery']);
  const deliveredEv = findLatestEvent(history, ['completed']);
  const failedEv = findLatestEvent(history, ['delivery_failed']);
  const cancelledEv = findLatestEvent(history, ['cancelled', 'rejected']);
  const returnedEv = findLatestEvent(history, ['returned']);
  const refundedEv = findLatestEvent(history, ['refunded']);

  const statusRank: Record<OrderStatus, number> = {
    placed: 1,
    pending: 1,
    accepted: 2,
    preparing: 3,
    ready_for_pickup: 4,
    ready_for_delivery: 4,
    out_for_delivery: 5,
    completed: 6,
    returned: 7,
    refunded: 8,
    delivery_failed: 5,
    cancelled: 0,
    rejected: 0,
  };

  const isTerminatedEarly = order.status === 'cancelled' || order.status === 'rejected';
  const currentRank = statusRank[order.status] ?? 1;

  const resolveStepState = (
    stepRank: number,
    eventExists: boolean
  ): 'completed' | 'active' | 'pending' => {
    if (isTerminatedEarly) {
      return eventExists ? 'completed' : 'pending';
    }
    if (order.status === 'delivery_failed') {
      if (eventExists || stepRank < 5) return 'completed';
      return 'pending';
    }
    if (currentRank > stepRank || (order.status === 'completed' && stepRank === 6)) {
      return 'completed';
    }
    if (currentRank === stepRank) {
      return 'active';
    }
    return 'pending';
  };

  const nodes: TimelineNode[] = [
    {
      id: 'placed',
      label: 'Order Placed',
      description: 'Customer submitted order via GramBazaar checkout',
      state: resolveStepState(1, true),
      timestamp: placedEv?.timestamp || order.createdAt,
      actorRole: placedEv?.actorRole || 'CUSTOMER',
      note: placedEv?.reason,
      icon: ShoppingBag,
    },
    {
      id: 'confirmed',
      label: 'Confirmed',
      description: 'Merchant accepted order and verified item availability',
      state: resolveStepState(2, Boolean(confirmedEv)),
      timestamp: confirmedEv?.timestamp,
      actorRole: confirmedEv?.actorRole,
      note: confirmedEv?.reason,
      icon: Store,
    },
    {
      id: 'preparing',
      label: 'Preparing',
      description: 'Items being freshly prepared or packed at store',
      state: resolveStepState(3, Boolean(preparingEv)),
      timestamp: preparingEv?.timestamp,
      actorRole: preparingEv?.actorRole,
      note: preparingEv?.reason,
      icon: Package,
    },
    {
      id: 'ready',
      label: isPickup ? 'Ready for Pickup' : 'Ready for Delivery',
      description: isPickup
        ? 'Packed and waiting at store counter for customer pickup'
        : 'Packed and ready for village runner dispatch',
      state: resolveStepState(4, Boolean(readyEv)),
      timestamp: readyEv?.timestamp,
      actorRole: readyEv?.actorRole,
      note: readyEv?.reason,
      icon: Clock,
    },
  ];

  if (!isPickup) {
    nodes.push({
      id: 'out_for_delivery',
      label: 'Out for Delivery',
      description: order.assignedRunnerName
        ? `Dispatched with ${order.assignedRunnerName}`
        : 'Dispatched towards village delivery landmark',
      state: resolveStepState(5, Boolean(outEv)),
      timestamp: outEv?.timestamp,
      actorRole: outEv?.actorRole,
      note: outEv?.reason,
      icon: Truck,
    });
  }

  // Only keep standard "Delivered" step if not terminated before delivery, OR if delivery actually happened
  if (!isTerminatedEarly || deliveredEv) {
    nodes.push({
      id: 'delivered',
      label: isPickup ? 'Picked Up / Delivered' : 'Delivered',
      description: 'Order handed over to customer successfully',
      state: resolveStepState(6, Boolean(deliveredEv)),
      timestamp: deliveredEv?.timestamp,
      actorRole: deliveredEv?.actorRole,
      note: deliveredEv?.reason,
      icon: PackageCheck,
    });
  }

  // Filter out unreached future standard steps when order was cancelled or failed early
  const filteredNodes = isTerminatedEarly
    ? nodes.filter((n) => n.state === 'completed')
    : order.status === 'delivery_failed'
    ? nodes.filter((n) => n.id !== 'delivered')
    : nodes;

  if (order.status === 'delivery_failed' || failedEv) {
    filteredNodes.push({
      id: 'delivery_failed',
      label: 'Delivery Failed',
      description: 'Delivery attempt unsuccessful — requires admin follow-up',
      state: 'error',
      timestamp: failedEv?.timestamp || order.updatedAt,
      actorRole: failedEv?.actorRole || 'SELLER',
      note: failedEv?.reason,
      icon: AlertTriangle,
    });
  }

  if (isTerminatedEarly || order.cancellation) {
    filteredNodes.push({
      id: 'cancelled',
      label: order.status === 'rejected' ? 'Order Rejected' : 'Order Cancelled',
      description: order.cancellation
        ? `Cancelled by ${order.cancellation.cancelledBy}`
        : 'Order terminated prior to completion',
      state: 'error',
      timestamp: order.cancellation?.cancelledAt || cancelledEv?.timestamp || order.updatedAt,
      actorRole: order.cancellation?.cancelledBy || cancelledEv?.actorRole || 'ADMIN',
      note: order.cancellation?.reason || cancelledEv?.reason,
      icon: XCircle,
    });
  }

  if (order.status === 'returned' || order.returnInfo || returnedEv) {
    filteredNodes.push({
      id: 'returned',
      label: 'Order Returned',
      description: order.returnInfo
        ? `Return ${order.returnInfo.returnId} • ${order.returnInfo.status.replace(/_/g, ' ')}`
        : 'Items returned by customer',
      state: order.status === 'returned' ? 'warning' : 'completed',
      timestamp: order.returnInfo?.updatedAt || returnedEv?.timestamp || order.updatedAt,
      actorRole: returnedEv?.actorRole || 'ADMIN',
      note: order.returnInfo?.reason || returnedEv?.reason,
      icon: RotateCcw,
    });
  }

  if (order.status === 'refunded' || order.refundInfo || refundedEv) {
    const rStatus = order.refundInfo?.status;
    filteredNodes.push({
      id: 'refunded',
      label:
        rStatus === 'COMPLETED' || order.status === 'refunded'
          ? 'Refund Completed'
          : rStatus === 'FAILED'
          ? 'Refund Failed'
          : rStatus === 'PROCESSING'
          ? 'Refund Processing'
          : 'Refund Pending',
      description: order.refundInfo
        ? `${order.refundInfo.refundId} • ₹${(order.refundInfo.amountPaise / 100).toFixed(2)} via ${order.refundInfo.method.replace(/_/g, ' ')}`
        : 'Refund recorded on order',
      state:
        rStatus === 'COMPLETED' || order.status === 'refunded'
          ? 'completed'
          : rStatus === 'FAILED'
          ? 'error'
          : 'warning',
      timestamp:
        order.refundInfo?.completedAt ||
        order.refundInfo?.initiatedAt ||
        refundedEv?.timestamp ||
        order.updatedAt,
      actorRole: refundedEv?.actorRole || 'ADMIN',
      note:
        rStatus === 'FAILED'
          ? order.refundInfo?.failureReason || order.refundInfo?.reason
          : order.refundInfo?.reason || refundedEv?.reason,
      icon: RefreshCw,
    });
  }

  return (
    <div className="bg-white border border-[#E5E7EB] rounded-2xl p-4 sm:p-5 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[#E5E7EB]">
        <div>
          <h4 className="text-xs font-bold text-[#1F2937] uppercase tracking-wider">
            Order Fulfillment & Post-Order Timeline
          </h4>
          <p className="text-[11px] text-[#6B7280] mt-0.5">
            Chronological milestones derived from live order history & operational actions
          </p>
        </div>
        <Badge variant="neutral" size="sm">
          {filteredNodes.length} Milestone{filteredNodes.length !== 1 ? 's' : ''}
        </Badge>
      </div>

      <div className="relative pl-1">
        {filteredNodes.map((node, idx) => {
          const Icon = node.icon;
          const isLast = idx === filteredNodes.length - 1;

          const circleClasses =
            node.state === 'completed'
              ? 'bg-[#218838] text-white ring-4 ring-[#E8F5E9]'
              : node.state === 'active'
              ? 'bg-white border-2 border-[#218838] text-[#218838] ring-4 ring-[#E8F5E9]'
              : node.state === 'error'
              ? 'bg-[#DC2626] text-white ring-4 ring-[#FEE2E2]'
              : node.state === 'warning'
              ? 'bg-[#F59E0B] text-white ring-4 ring-[#FEF3C7]'
              : 'bg-[#F1F5F9] border border-[#CBD5E1] text-[#94A3B8]';

          const lineClasses =
            node.state === 'completed'
              ? 'bg-[#218838]/40'
              : node.state === 'error'
              ? 'bg-[#FCA5A5]'
              : node.state === 'warning'
              ? 'bg-[#FCD34D]'
              : 'bg-[#E5E7EB]';

          return (
            <div key={node.id} className="relative flex items-start gap-3.5 pb-5 last:pb-0">
              {!isLast && (
                <span
                  aria-hidden="true"
                  className={`absolute left-[15px] top-8 bottom-0 w-0.5 ${lineClasses}`}
                />
              )}

              <div
                className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-colors ${circleClasses}`}
              >
                {node.state === 'completed' && node.id !== 'returned' && node.id !== 'refunded' ? (
                  <Check className="w-4 h-4 stroke-[2.5]" />
                ) : (
                  <Icon className="w-4 h-4" />
                )}
              </div>

              <div className="flex-1 min-w-0 pt-0.5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p
                      className={`text-xs font-bold ${
                        node.state === 'pending'
                          ? 'text-[#94A3B8]'
                          : node.state === 'error'
                          ? 'text-[#991B1B]'
                          : node.state === 'warning'
                          ? 'text-[#92400E]'
                          : 'text-[#1F2937]'
                      }`}
                    >
                      {node.label}
                    </p>
                    {node.state === 'active' && (
                      <Badge variant="primary" size="sm" dot pulsing>
                        Current Stage
                      </Badge>
                    )}
                    {node.actorRole && node.state !== 'pending' && (
                      <span className="text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded bg-[#F1F5F9] text-[#475569]">
                        {node.actorRole}
                      </span>
                    )}
                  </div>

                  <div className="text-[11px] font-mono text-[#6B7280] shrink-0">
                    {node.timestamp ? (
                      <span title={formatDateTime(node.timestamp)}>
                        {formatDateTime(node.timestamp)}{' '}
                        <span className="text-[#94A3B8]">({formatTimeAgo(node.timestamp)})</span>
                      </span>
                    ) : (
                      <span className="text-[#94A3B8]">Pending</span>
                    )}
                  </div>
                </div>

                <p className="text-[11px] text-[#6B7280] mt-0.5">{node.description}</p>
                {node.note && (
                  <p className="text-[11px] text-[#475569] bg-[#F8FAFC] border border-[#E5E7EB] rounded-lg px-2.5 py-1.5 mt-1.5">
                    {node.note}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
