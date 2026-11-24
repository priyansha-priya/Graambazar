import React, { useState } from 'react';
import { useOrders } from '../../contexts/OrderContext';
import { formatINR } from '../../utils/currency';
import { formatDateTime } from '../../utils/dates';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { EmptyState } from '../../components/feedback/EmptyState';
import { GranularOrderStatusTracker } from './components/GranularOrderStatusTracker';
import {
  ShoppingBag,
  ArrowRight,
  ArrowLeft,
  Search,
  Store,
  MapPin,
  Calendar,
  CreditCard,
  ChevronRight,
} from 'lucide-react';

export interface OrderHistoryViewProps {
  onBackToHome: () => void;
  onTrackOrder: (orderId: string) => void;
}

export const OrderHistoryView: React.FC<OrderHistoryViewProps> = ({
  onBackToHome,
  onTrackOrder,
}) => {
  const { orders, activeOrders, pastOrders } = useOrders();
  const [filterTab, setFilterTab] = useState<'ALL' | 'ACTIVE' | 'PAST'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredByTab =
    filterTab === 'ACTIVE'
      ? activeOrders
      : filterTab === 'PAST'
      ? pastOrders
      : orders;

  const displayedOrders = filteredByTab.filter((order) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      order.orderNumber.toLowerCase().includes(q) ||
      order.sellerName.toLowerCase().includes(q) ||
      order.items.some((i) => i.productName.toLowerCase().includes(q))
    );
  });

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 text-left animate-fade-in">
      {/* Top Navigation & Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <Button
          variant="secondary"
          size="sm"
          leftIcon={<ArrowLeft className="w-3.5 h-3.5" />}
          onClick={onBackToHome}
        >
          Back to Village Stores
        </Button>

        <div className="text-right sm:text-left">
          <h1 className="text-xl font-bold text-[#1F2937]">My Orders (Order History)</h1>
          <p className="text-xs text-[#6B7280]">
            Track delivery progress, milestones, and itemized receipts
          </p>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setFilterTab('ALL')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-colors cursor-pointer ${
              filterTab === 'ALL'
                ? 'bg-[#218838] text-white shadow-xs'
                : 'bg-[#F1F5F9] text-[#6B7280] hover:text-[#1F2937]'
            }`}
          >
            All Orders ({orders.length})
          </button>

          <button
            onClick={() => setFilterTab('ACTIVE')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-colors cursor-pointer ${
              filterTab === 'ACTIVE'
                ? 'bg-[#218838] text-white shadow-xs'
                : 'bg-[#F1F5F9] text-[#6B7280] hover:text-[#1F2937]'
            }`}
          >
            Active / In Progress ({activeOrders.length})
          </button>

          <button
            onClick={() => setFilterTab('PAST')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-colors cursor-pointer ${
              filterTab === 'PAST'
                ? 'bg-[#218838] text-white shadow-xs'
                : 'bg-[#F1F5F9] text-[#6B7280] hover:text-[#1F2937]'
            }`}
          >
            Past / Completed ({pastOrders.length})
          </button>
        </div>

        {/* Quick Search Input */}
        <div className="relative min-w-[220px]">
          <Search className="w-3.5 h-3.5 text-[#9CA3AF] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search order #, store, item..."
            className="w-full pl-8 pr-3 py-1.5 text-xs rounded-full border border-[#E5E7EB] bg-white focus:outline-none focus:border-[#218838] focus:ring-1 focus:ring-[#218838]"
          />
        </div>
      </div>

      {/* Orders List */}
      {displayedOrders.length === 0 ? (
        <EmptyState
          icon={<ShoppingBag className="w-8 h-8 text-[#9CA3AF]" />}
          title={searchQuery ? 'No Matching Orders' : 'No Orders in this View'}
          description={
            searchQuery
              ? `No orders found matching "${searchQuery}". Try a different search.`
              : 'You have no orders in this category yet. Explore your local village stores and place an order!'
          }
          actionText="Explore Village Stores"
          onAction={onBackToHome}
        />
      ) : (
        <div className="space-y-5">
          {displayedOrders.map((order) => {
            const isCompleted = order.status === 'completed';
            const isCancelled = order.status === 'cancelled' || order.status === 'rejected';

            return (
              <div
                key={order.id}
                className="bg-white rounded-2xl border border-[#E5E7EB] hover:border-[#218838]/40 p-5 shadow-xs transition-all space-y-4"
              >
                {/* Order Top Bar: Number, Status Badge, Timestamp, & Actions */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#F1F5F9]">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs font-bold text-[#1F2937] bg-[#F1F5F9] px-2 py-0.5 rounded-md">
                      {order.orderNumber}
                    </span>

                    {isCompleted ? (
                      <Badge variant="success" dot size="sm">
                        DELIVERED
                      </Badge>
                    ) : isCancelled ? (
                      <Badge variant="error" dot size="sm">
                        {order.status.toUpperCase()}
                      </Badge>
                    ) : (
                      <Badge variant="warning" dot pulsing size="sm">
                        {order.status.replace(/_/g, ' ').toUpperCase()}
                      </Badge>
                    )}

                    <span className="text-[11px] text-[#6B7280] flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-[#9CA3AF]" />
                      {formatDateTime(order.createdAt)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="primary"
                      size="sm"
                      rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                      onClick={() => onTrackOrder(order.id)}
                    >
                      Track Order & Map
                    </Button>
                  </div>
                </div>

                {/* Merchant & Items Details Row */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="space-y-1">
                    <h3 className="font-bold text-base text-[#1F2937] flex items-center gap-1.5">
                      <Store className="w-4 h-4 text-[#218838]" />
                      <span>{order.sellerName}</span>
                    </h3>

                    <p className="text-xs text-[#6B7280]">
                      {order.items
                        .map((i) => `${i.productName} (${i.requestedUnitLabel}) x${i.requestedQuantity}`)
                        .join(', ')}
                    </p>

                    {order.deliveryAddress?.landmark && (
                      <p className="text-[11px] text-[#6B7280] flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-[#218838]" />
                        <span>Deliver to: {order.deliveryAddress.landmark}</span>
                      </p>
                    )}
                  </div>

                  <div className="text-left sm:text-right shrink-0 space-y-0.5">
                    <p className="text-sm font-bold text-[#1F2937]">
                      Total: <span className="text-[#218838] font-extrabold">{formatINR(order.totalPaise)}</span>
                    </p>
                    <p className="text-[11px] text-[#6B7280] flex sm:justify-end items-center gap-1">
                      <CreditCard className="w-3 h-3" />
                      <span>{order.paymentMethod}</span>
                      <span className="text-[#9CA3AF]">·</span>
                      <span className={order.paymentStatus === 'collected' ? 'text-[#16A34A] font-semibold' : 'text-[#D97706]'}>
                        {order.paymentStatus.toUpperCase()}
                      </span>
                    </p>
                  </div>
                </div>

                {/* GRANULAR STATUS TRACKING COMPONENT */}
                <GranularOrderStatusTracker
                  order={order}
                  defaultExpanded={!isCompleted && !isCancelled}
                  onTrackOrder={onTrackOrder}
                />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
