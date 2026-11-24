import React from 'react';
import { useSeller } from '../../contexts/SellerContext';
import { useOrders } from '../../contexts/OrderContext';
import { formatINR } from '../../utils/currency';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Truck, Phone, MapPin, UserCheck, CheckCircle2 } from 'lucide-react';

export const SellerDispatchView: React.FC = () => {
  const { activeSeller, runners } = useSeller();
  const { orders, transitionOrder } = useOrders();

  // Active out-for-delivery orders for this seller
  const activeDispatches = orders.filter(
    (o) => o.sellerId === activeSeller.id && o.status === 'out_for_delivery'
  );

  return (
    <div className="space-y-6 text-left animate-fade-in">
      <div>
        <h2 className="text-xl font-bold text-[#1F2937]">
          In-House Runner & Delivery Dispatch Hub
        </h2>
        <p className="text-xs text-[#6B7280]">
          Manage shop delivery boys, active runs, and customer landmark handovers.
        </p>
      </div>

      {/* Staff Runner Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {runners.map((runner) => (
          <div
            key={runner.id}
            className="bg-white rounded-2xl border border-[#E5E7EB] p-4 shadow-xs flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#E8F5E9] text-[#218838] flex items-center justify-center font-bold">
                <Truck className="w-5 h-5" />
              </div>
              <div>
                <p className="font-bold text-sm text-[#1F2937]">{runner.name}</p>
                <p className="text-[11px] text-[#6B7280]">{runner.role}</p>
                <span className="text-[10px] font-semibold text-[#218838]">
                  +91 {runner.phone}
                </span>
              </div>
            </div>

            <Badge variant={runner.activeOrdersCount > 0 ? 'warning' : 'success'} size="sm">
              {runner.activeOrdersCount} Active Run{runner.activeOrdersCount !== 1 ? 's' : ''}
            </Badge>
          </div>
        ))}
      </div>

      {/* Active Runs Table / Cards */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-sm uppercase tracking-wider text-[#1F2937]">
            Active Out-For-Delivery Orders ({activeDispatches.length})
          </h3>
          <Badge variant="primary">Village Fleet</Badge>
        </div>

        {activeDispatches.length === 0 ? (
          <p className="text-xs text-[#6B7280] py-8 text-center">
            No runners currently out on delivery.
          </p>
        ) : (
          <div className="space-y-3">
            {activeDispatches.map((order) => (
              <div
                key={order.id}
                className="p-4 bg-[#F8FAFC] border border-[#E5E7EB] rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-[#1F2937]">
                      {order.orderNumber}
                    </span>
                    <Badge variant="info" size="sm">
                      {order.paymentMethod}
                    </Badge>
                    <span className="font-bold text-[#218838]">
                      Amount: {formatINR(order.totalPaise)}
                    </span>
                  </div>

                  <p className="text-[#475569]">
                    Customer: <strong>{order.customerName}</strong> (+91 {order.customerPhone})
                  </p>

                  {order.deliveryAddress && (
                    <div className="flex items-center gap-1.5 text-[#176B2C] font-medium">
                      <MapPin className="w-3.5 h-3.5 text-[#218838] shrink-0" />
                      <span>
                        Landmark: <strong>{order.deliveryAddress.landmark}</strong>, {order.deliveryAddress.addressLine1} ({order.deliveryAddress.villageName})
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <a
                    href={`tel:${order.customerPhone}`}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-[#E5E7EB] text-[#1F2937] hover:bg-[#F1F5F9] font-semibold text-xs"
                  >
                    <Phone className="w-3.5 h-3.5 text-[#218838]" />
                    <span>Call Customer</span>
                  </a>

                  <Button
                    variant="primary"
                    size="sm"
                    leftIcon={<CheckCircle2 className="w-3.5 h-3.5" />}
                    onClick={() => transitionOrder(order.id, 'completed', 'Delivered by shop runner')}
                  >
                    Mark Handed Over & Paid
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
