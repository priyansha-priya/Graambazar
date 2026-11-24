/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useState } from 'react';
import { Eye, Search, ShoppingBag, Truck, Store } from 'lucide-react';
import { Order } from '../../../../types/order';
import { Badge } from '../../../../components/ui/Badge';
import { Button } from '../../../../components/ui/Button';
import { Pagination } from '../../../../components/data-display/Pagination';
import { EmptyState } from '../../../../components/feedback/EmptyState';
import { formatINR } from '../../../../utils/currency';
import { formatDateTime } from '../../../../utils/dates';
import {
  ORDER_STATUS_META,
  PAYMENT_STATUS_META,
} from '../orderManagementHelpers';
import { SellerDatePreset, matchesSellerDateRange } from './seller360Helpers';

const PAGE_SIZE = 5;

export interface Seller360TabOrdersProps {
  orders: Order[];
  onInspectOrder: (order: Order) => void;
}

export const Seller360TabOrders: React.FC<Seller360TabOrdersProps> = ({
  orders,
  onInspectOrder,
}) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [datePreset, setDatePreset] = useState<SellerDatePreset>('ALL');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return orders.filter((o) => {
      if (statusFilter !== 'ALL' && o.status !== statusFilter) return false;
      if (!matchesSellerDateRange(o.createdAt, datePreset, customFrom, customTo)) return false;
      if (q) {
        const itemsTxt = o.items.map((i) => i.productName).join(' ');
        const hay = `${o.orderNumber} ${o.id} ${o.customerName} ${o.customerPhone} ${itemsTxt}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [orders, search, statusFilter, datePreset, customFrom, customTo]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paginated = useMemo(
    () => filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE),
    [filtered, safePage]
  );

  const getFulfillmentStatus = (o: Order) => {
    if (o.status === 'completed') return o.fulfilmentMode === 'DELIVERY' ? 'Delivered' : 'Picked Up';
    if (o.status === 'out_for_delivery') return 'Out for Delivery';
    if (o.status === 'ready_for_pickup') return 'Ready at Store';
    if (o.status === 'preparing' || o.status === 'accepted') return 'In Kitchen / Packing';
    if (o.status.includes('cancelled') || o.status === 'rejected') return 'Cancelled';
    if (o.status === 'returned' || o.status === 'refunded') return 'Returned / Refunded';
    return 'Awaiting Seller';
  };

  return (
    <div className="space-y-4 text-left text-xs">
      {/* Filters */}
      <div className="bg-[#F8FAFC] p-3.5 rounded-2xl border border-[#E5E7EB] space-y-2.5">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
          <div className="sm:col-span-5 relative">
            <Search className="w-4 h-4 text-[#6B7280] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search Order ID, Customer, or Product..."
              className="w-full h-9 pl-9 pr-3 bg-white border border-[#E5E7EB] rounded-xl text-xs outline-none focus:border-[#218838]"
            />
          </div>
          <div className="sm:col-span-4">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="w-full h-9 px-3 bg-white border border-[#E5E7EB] rounded-xl text-xs text-[#1F2937] outline-none focus:border-[#218838]"
            >
              <option value="ALL">All Order Statuses</option>
              <option value="placed">New / Placed</option>
              <option value="accepted">Confirmed</option>
              <option value="preparing">Preparing</option>
              <option value="ready_for_pickup">Ready for Pickup</option>
              <option value="out_for_delivery">Out for Delivery</option>
              <option value="completed">Delivered / Completed</option>
              <option value="cancelled_by_customer">Cancelled by Customer</option>
              <option value="cancelled_by_seller">Cancelled by Seller</option>
              <option value="cancelled_by_admin">Cancelled by Admin</option>
              <option value="returned">Returned</option>
              <option value="refunded">Refunded</option>
            </select>
          </div>
          <div className="sm:col-span-3">
            <select
              value={datePreset}
              onChange={(e) => {
                setDatePreset(e.target.value as SellerDatePreset);
                setPage(1);
              }}
              className="w-full h-9 px-3 bg-white border border-[#E5E7EB] rounded-xl text-xs text-[#1F2937] outline-none focus:border-[#218838]"
            >
              <option value="ALL">All Dates</option>
              <option value="7D">Last 7 Days</option>
              <option value="30D">Last 30 Days</option>
              <option value="90D">Last 90 Days</option>
              <option value="CUSTOM">Custom Range</option>
            </select>
          </div>
        </div>

        {datePreset === 'CUSTOM' && (
          <div className="flex flex-wrap items-center gap-3 pt-1">
            <div className="flex items-center gap-1.5">
              <label className="text-[11px] font-semibold text-[#6B7280]">From</label>
              <input
                type="date"
                value={customFrom}
                onChange={(e) => {
                  setCustomFrom(e.target.value);
                  setPage(1);
                }}
                className="h-8 px-2 bg-white border border-[#E5E7EB] rounded-lg text-xs"
              />
            </div>
            <div className="flex items-center gap-1.5">
              <label className="text-[11px] font-semibold text-[#6B7280]">To</label>
              <input
                type="date"
                value={customTo}
                onChange={(e) => {
                  setCustomTo(e.target.value);
                  setPage(1);
                }}
                className="h-8 px-2 bg-white border border-[#E5E7EB] rounded-lg text-xs"
              />
            </div>
          </div>
        )}
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={<ShoppingBag className="w-6 h-6" />}
          title={orders.length === 0 ? 'No live orders linked to this seller' : 'No matching orders'}
          description={
            orders.length === 0
              ? 'Orders placed with this storefront in the active marketplace session will appear here.'
              : 'Adjust search, order status, or date filters to view matching orders.'
          }
          actionText={orders.length > 0 ? 'Reset Filters' : undefined}
          onAction={
            orders.length > 0
              ? () => {
                  setSearch('');
                  setStatusFilter('ALL');
                  setDatePreset('ALL');
                  setCustomFrom('');
                  setCustomTo('');
                  setPage(1);
                }
              : undefined
          }
        />
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden md:block bg-white rounded-2xl border border-[#E5E7EB] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-[#F8FAFC] text-[#6B7280] uppercase tracking-wider font-semibold border-b border-[#E5E7EB] text-[11px]">
                  <tr>
                    <th className="py-3 px-3.5">Order ID &amp; Date</th>
                    <th className="py-3 px-3.5">Customer</th>
                    <th className="py-3 px-3.5">Products</th>
                    <th className="py-3 px-3.5 text-right">Amount</th>
                    <th className="py-3 px-3.5">Payment</th>
                    <th className="py-3 px-3.5">Order Status</th>
                    <th className="py-3 px-3.5">Fulfillment</th>
                    <th className="py-3 px-3.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E7EB]">
                  {paginated.map((o) => {
                    const oMeta = ORDER_STATUS_META[o.status] || {
                      label: o.status,
                      variant: 'neutral' as const,
                    };
                    const pMeta = PAYMENT_STATUS_META[o.paymentStatus] || {
                      label: o.paymentStatus,
                      variant: 'neutral' as const,
                    };
                    return (
                      <tr
                        key={o.id}
                        onClick={() => onInspectOrder(o)}
                        className="hover:bg-[#F8FAFC]/80 cursor-pointer transition-colors"
                      >
                        <td className="py-3 px-3.5 whitespace-nowrap">
                          <p className="font-mono font-bold text-[#218838]">{o.orderNumber}</p>
                          <p className="text-[11px] text-[#6B7280]">{formatDateTime(o.createdAt)}</p>
                        </td>
                        <td className="py-3 px-3.5">
                          <p className="font-semibold text-[#1F2937]">{o.customerName}</p>
                          <p className="text-[11px] text-[#6B7280]">{o.customerPhone}</p>
                        </td>
                        <td className="py-3 px-3.5 max-w-[200px]">
                          <p className="text-[#1F2937] truncate">
                            {o.items.map((i) => `${i.productName} ×${i.requestedQuantity}`).join(', ')}
                          </p>
                          <p className="text-[11px] text-[#6B7280]">{o.items.length} item(s)</p>
                        </td>
                        <td className="py-3 px-3.5 text-right font-bold text-[#1F2937] whitespace-nowrap">
                          {formatINR(o.totalPaise)}
                        </td>
                        <td className="py-3 px-3.5 whitespace-nowrap">
                          <Badge variant={pMeta.variant} size="sm">
                            {pMeta.label}
                          </Badge>
                        </td>
                        <td className="py-3 px-3.5 whitespace-nowrap">
                          <Badge variant={oMeta.variant} size="sm" dot>
                            {oMeta.shortLabel || oMeta.label}
                          </Badge>
                        </td>
                        <td className="py-3 px-3.5 whitespace-nowrap">
                          <div className="flex items-center gap-1 font-semibold text-[#1F2937]">
                            {o.fulfilmentMode === 'DELIVERY' ? (
                              <Truck className="w-3.5 h-3.5 text-[#218838]" />
                            ) : (
                              <Store className="w-3.5 h-3.5 text-[#2563EB]" />
                            )}
                            <span>{o.fulfilmentMode === 'DELIVERY' ? 'Delivery' : 'Pickup'}</span>
                          </div>
                          <p className="text-[10px] text-[#6B7280]">{getFulfillmentStatus(o)}</p>
                        </td>
                        <td
                          className="py-3 px-3.5 text-right whitespace-nowrap"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onInspectOrder(o)}
                            leftIcon={<Eye className="w-3.5 h-3.5" />}
                          >
                            Order
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden space-y-2.5">
            {paginated.map((o) => {
              const oMeta = ORDER_STATUS_META[o.status] || {
                label: o.status,
                variant: 'neutral' as const,
              };
              const pMeta = PAYMENT_STATUS_META[o.paymentStatus] || {
                label: o.paymentStatus,
                variant: 'neutral' as const,
              };
              return (
                <div
                  key={o.id}
                  onClick={() => onInspectOrder(o)}
                  className="bg-white rounded-2xl border border-[#E5E7EB] p-3.5 space-y-2 cursor-pointer"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-mono font-bold text-[#218838]">{o.orderNumber}</p>
                      <p className="text-[11px] text-[#6B7280]">{formatDateTime(o.createdAt)}</p>
                    </div>
                    <p className="font-black text-sm text-[#1F2937]">{formatINR(o.totalPaise)}</p>
                  </div>
                  <p className="text-[#1F2937]">
                    <strong>{o.customerName}</strong> • {o.items.length} item(s) •{' '}
                    {o.fulfilmentMode === 'DELIVERY' ? 'Delivery' : 'Pickup'} ({getFulfillmentStatus(o)})
                  </p>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <Badge variant={oMeta.variant} size="sm" dot>
                      {oMeta.shortLabel || oMeta.label}
                    </Badge>
                    <Badge variant={pMeta.variant} size="sm">
                      {pMeta.label}
                    </Badge>
                  </div>
                </div>
              );
            })}
          </div>

          <Pagination
            currentPage={safePage}
            totalPages={totalPages}
            totalRecords={filtered.length}
            pageSize={PAGE_SIZE}
            onPageChange={setPage}
          />
        </>
      )}
    </div>
  );
};
