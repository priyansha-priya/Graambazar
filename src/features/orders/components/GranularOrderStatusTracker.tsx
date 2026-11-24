import React, { useState } from 'react';
import { Order, OrderStatus } from '../../../types/order';
import { formatTimeOnly, formatTimeAgo } from '../../../utils/dates';
import { Badge } from '../../../components/ui/Badge';
import {
  Check,
  CheckCircle2,
  Clock,
  Truck,
  Store,
  MapPin,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  Phone,
  AlertTriangle,
  XCircle,
  PackageCheck,
  Sparkles,
} from 'lucide-react';

export interface GranularOrderStatusTrackerProps {
  order: Order;
  compact?: boolean;
  defaultExpanded?: boolean;
  className?: string;
  onTrackOrder?: (orderId: string) => void;
}

interface MilestoneDefinition {
  id: 'accepted' | 'preparing' | 'out_for_delivery' | 'completed';
  label: string;
  shortLabel: string;
  vernacularLabel: string; // Hindi context for rural users
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}

const MILESTONES: MilestoneDefinition[] = [
  {
    id: 'accepted',
    label: 'Accepted',
    shortLabel: 'Accepted',
    vernacularLabel: 'स्वीकृत (Confirmed)',
    description: 'Shopkeeper confirmed and accepted order',
    icon: Store,
  },
  {
    id: 'preparing',
    label: 'Preparing',
    shortLabel: 'Preparing',
    vernacularLabel: 'तैयारी (Packing)',
    description: 'Freshly cooking or packing items in store',
    icon: Clock,
  },
  {
    id: 'out_for_delivery',
    label: 'Out for Delivery',
    shortLabel: 'On the Way',
    vernacularLabel: 'रास्ते में (Dispatched)',
    description: 'Runner dispatched towards your village landmark',
    icon: Truck,
  },
  {
    id: 'completed',
    label: 'Delivered',
    shortLabel: 'Delivered',
    vernacularLabel: 'पहुंचा (Delivered)',
    description: 'Handed over and payment completed',
    icon: PackageCheck,
  },
];

type MilestoneState = 'completed' | 'active' | 'pending';

export const GranularOrderStatusTracker: React.FC<GranularOrderStatusTrackerProps> = ({
  order,
  compact = false,
  defaultExpanded = false,
  className = '',
  onTrackOrder,
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  const isCancelled = order.status === 'cancelled' || order.status === 'rejected';

  // Compute status milestone states and overall progress bar percentage
  const getMilestoneState = (milestoneId: MilestoneDefinition['id']): MilestoneState => {
    if (isCancelled) return 'pending';

    switch (milestoneId) {
      case 'accepted':
        if (order.status === 'placed') return 'active';
        return 'completed';

      case 'preparing':
        if (order.status === 'placed') return 'pending';
        if (order.status === 'accepted' || order.status === 'preparing') return 'active';
        return 'completed';

      case 'out_for_delivery':
        if (['placed', 'accepted', 'preparing'].includes(order.status)) return 'pending';
        if (['ready_for_delivery', 'ready_for_pickup', 'out_for_delivery'].includes(order.status))
          return 'active';
        return 'completed';

      case 'completed':
        if (order.status === 'completed') return 'completed';
        return 'pending';

      default:
        return 'pending';
    }
  };

  const getProgressPercentage = (): number => {
    if (isCancelled) return 0;
    switch (order.status) {
      case 'placed':
        return 12;
      case 'accepted':
        return 38;
      case 'preparing':
        return 50;
      case 'ready_for_delivery':
      case 'ready_for_pickup':
        return 72;
      case 'out_for_delivery':
        return 88;
      case 'completed':
        return 100;
      default:
        return 0;
    }
  };

  // Find historical event timestamp for a milestone if recorded
  const getMilestoneTimestamp = (milestoneId: MilestoneDefinition['id']): string | undefined => {
    if (!order.statusHistory || order.statusHistory.length === 0) return undefined;

    let targetStatuses: OrderStatus[] = [];
    if (milestoneId === 'accepted') targetStatuses = ['accepted'];
    else if (milestoneId === 'preparing') targetStatuses = ['preparing'];
    else if (milestoneId === 'out_for_delivery')
      targetStatuses = ['ready_for_delivery', 'ready_for_pickup', 'out_for_delivery'];
    else if (milestoneId === 'completed') targetStatuses = ['completed'];

    const event = order.statusHistory
      .slice()
      .reverse()
      .find((ev) => targetStatuses.includes(ev.toStatus));

    return event ? event.timestamp : undefined;
  };

  const progress = getProgressPercentage();

  // If order was cancelled or rejected, render clear cancellation alert
  if (isCancelled) {
    const cancelEvent = order.statusHistory
      ?.slice()
      .reverse()
      .find((e) => e.toStatus === 'cancelled' || e.toStatus === 'rejected');

    return (
      <div
        className={`bg-[#FEF2F2] border border-[#FECACA] rounded-xl p-3.5 text-left text-xs ${className}`}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-2.5">
            <XCircle className="w-4 h-4 text-[#DC2626] shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-[#991B1B]">
                Order {order.status === 'rejected' ? 'Rejected by Seller' : 'Cancelled'}
              </p>
              <p className="text-[#B91C1C] mt-0.5">
                {cancelEvent?.reason || 'Order was stopped and will not be fulfilled.'}
              </p>
              {cancelEvent?.timestamp && (
                <p className="text-[11px] text-[#DC2626]/80 mt-1">
                  Updated at {formatTimeOnly(cancelEvent.timestamp)}
                </p>
              )}
            </div>
          </div>
          <Badge variant="error" size="sm">
            TERMINATED
          </Badge>
        </div>
      </div>
    );
  }

  // Active / in-flight milestone summary
  const currentActiveMilestone = MILESTONES.find((m) => getMilestoneState(m.id) === 'active');

  return (
    <div
      className={`bg-[#F8FAFC] rounded-xl border border-[#E5E7EB] p-3.5 sm:p-4 text-left transition-all ${className}`}
    >
      {/* Top Status Header */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-[#1F2937] flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-[#218838]" />
            Live Milestones
          </span>
          <span className="text-xs text-[#6B7280]">
            · {progress === 100 ? 'Completed' : `${progress}% fulfilled`}
          </span>
        </div>

        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-[11px] font-semibold text-[#218838] hover:text-[#176B2C] flex items-center gap-1 transition-colors cursor-pointer"
        >
          {isExpanded ? (
            <>
              <span>Hide Details</span>
              <ChevronUp className="w-3 h-3" />
            </>
          ) : (
            <>
              <span>Timeline Details</span>
              <ChevronDown className="w-3 h-3" />
            </>
          )}
        </button>
      </div>

      {/* HORIZONTAL STEPPER PROGRESS BAR */}
      <div className="relative pt-1 pb-2">
        {/* Background Track Line */}
        <div className="absolute top-[18px] left-[6%] right-[6%] h-1.5 bg-[#E2E8F0] rounded-full z-0 overflow-hidden">
          <div
            className="h-full bg-[#218838] transition-all duration-700 ease-in-out rounded-full"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Milestone Node Points */}
        <div className="relative z-10 flex items-start justify-between">
          {MILESTONES.map((milestone, idx) => {
            const state = getMilestoneState(milestone.id);
            const rawTime = getMilestoneTimestamp(milestone.id);
            const formattedTime = rawTime ? formatTimeOnly(rawTime) : null;
            const Icon = milestone.icon;

            return (
              <div
                key={milestone.id}
                className="flex flex-col items-center text-center group cursor-default"
                style={{ width: '24%' }}
              >
                {/* Node Circle */}
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center transition-all shadow-xs ${
                    state === 'completed'
                      ? 'bg-[#218838] text-white ring-3 ring-[#E8F5E9]'
                      : state === 'active'
                      ? 'bg-white border-2 border-[#218838] text-[#218838] ring-3 ring-[#E8F5E9] animate-pulse'
                      : 'bg-[#F1F5F9] border border-[#CBD5E1] text-[#94A3B8]'
                  }`}
                  title={`${milestone.label}: ${state}`}
                >
                  {state === 'completed' ? (
                    <Check className="w-4 h-4 stroke-[2.5]" />
                  ) : (
                    <Icon className="w-3.5 h-3.5" />
                  )}
                </div>

                {/* Milestone Label */}
                <p
                  className={`mt-1.5 text-[11px] sm:text-xs font-bold leading-tight ${
                    state === 'completed'
                      ? 'text-[#1F2937]'
                      : state === 'active'
                      ? 'text-[#218838]'
                      : 'text-[#94A3B8]'
                  }`}
                >
                  {milestone.label}
                </p>

                {/* Micro Subtext / Time */}
                <span className="text-[10px] text-[#6B7280] font-mono mt-0.5 truncate max-w-full">
                  {formattedTime || (state === 'active' ? 'Now' : '—')}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* CONTEXTUAL LIVE ALERT CARD (When Order is in progress or out for delivery) */}
      {order.status !== 'completed' && (
        <div className="mt-3 p-2.5 sm:p-3 bg-white rounded-lg border border-[#E5E7EB] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#218838] opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#218838]" />
            </span>
            <span className="text-[#1F2937] font-medium">
              {order.status === 'placed' && 'Awaiting shopkeeper order confirmation...'}
              {order.status === 'accepted' && 'Shopkeeper confirmed order! Cooking/Packing will begin soon.'}
              {order.status === 'preparing' &&
                `Preparing items at store. Estimated delivery: ~${order.estimatedDeliveryMinutes || 25} mins.`}
              {['ready_for_delivery', 'ready_for_pickup'].includes(order.status) &&
                'Order packed and ready for delivery runner handover.'}
              {order.status === 'out_for_delivery' && (
                <>
                  Runner <strong>{order.assignedRunnerName || 'Shop Runner'}</strong> is on the way to{' '}
                  <span className="text-[#218838] font-bold">
                    {order.deliveryAddress?.landmark || 'Village Landmark'}
                  </span>
                </>
              )}
            </span>
          </div>

          {/* Quick Handover PIN / OTP helper when out for delivery */}
          {['ready_for_delivery', 'out_for_delivery'].includes(order.status) && (
            <div className="flex items-center gap-1.5 self-start sm:self-auto bg-[#E8F5E9] border border-[#86EFAC] px-2.5 py-1 rounded-full text-[11px] font-bold text-[#176B2C] whitespace-nowrap">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Handover OTP: {order.orderNumber.slice(-4) || '4821'}</span>
            </div>
          )}
        </div>
      )}

      {/* EXPANDED GRANULAR AUDIT TRAIL */}
      {isExpanded && (
        <div className="mt-3 pt-3 border-t border-[#E5E7EB] space-y-2 text-xs animate-fade-in">
          <p className="font-bold text-[#1F2937] text-[11px] uppercase tracking-wider mb-2">
            Detailed Milestone Log:
          </p>

          <div className="space-y-2.5 pl-1">
            {MILESTONES.map((m, idx) => {
              const state = getMilestoneState(m.id);
              const timestamp = getMilestoneTimestamp(m.id);
              const Icon = m.icon;

              return (
                <div key={m.id} className="flex items-start gap-2.5">
                  <div
                    className={`mt-0.5 w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${
                      state === 'completed'
                        ? 'bg-[#218838] text-white'
                        : state === 'active'
                        ? 'border-2 border-[#218838] bg-white text-[#218838]'
                        : 'bg-[#E2E8F0] text-[#94A3B8]'
                    }`}
                  >
                    {state === 'completed' ? (
                      <Check className="w-2.5 h-2.5 stroke-[3]" />
                    ) : (
                      <span className="w-1.5 h-1.5 rounded-full bg-current" />
                    )}
                  </div>

                  <div className="flex-1 flex flex-col sm:flex-row sm:items-center justify-between gap-0.5">
                    <div>
                      <span
                        className={`font-semibold ${
                          state === 'completed'
                            ? 'text-[#1F2937]'
                            : state === 'active'
                            ? 'text-[#218838]'
                            : 'text-[#94A3B8]'
                        }`}
                      >
                        {m.label} ({m.vernacularLabel})
                      </span>
                      <p className="text-[11px] text-[#6B7280]">{m.description}</p>
                    </div>

                    <div className="text-[11px] text-[#6B7280] font-mono shrink-0 sm:text-right">
                      {timestamp ? (
                        <>
                          <span>{formatTimeOnly(timestamp)}</span>
                          <span className="text-[#94A3B8] block text-[10px]">
                            {formatTimeAgo(timestamp)}
                          </span>
                        </>
                      ) : (
                        <span className="text-[#94A3B8]">
                          {state === 'active' ? 'In Progress' : 'Pending'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Action Links */}
          <div className="mt-3 pt-2.5 border-t border-[#E5E7EB] flex flex-wrap items-center justify-between gap-2">
            <div className="text-[11px] text-[#6B7280]">
              Seller Contact:{' '}
              <a
                href={`tel:${order.sellerPhone}`}
                className="font-bold text-[#218838] hover:underline"
              >
                +91 {order.sellerPhone}
              </a>
            </div>

            {onTrackOrder && (
              <button
                type="button"
                onClick={() => onTrackOrder(order.id)}
                className="text-xs font-bold text-[#218838] hover:text-[#176B2C] hover:underline cursor-pointer"
              >
                Open Full Live Tracker →
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
