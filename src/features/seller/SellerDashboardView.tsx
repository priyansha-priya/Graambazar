import React, { useEffect } from 'react';
import { useSeller } from '../../contexts/SellerContext';
import { useOrders } from '../../contexts/OrderContext';
import { formatINR } from '../../utils/currency';
import { KPICard } from '../../components/data-display/KPICard';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import {
  ShoppingBag,
  IndianRupee,
  Clock,
  Store,
  Power,
  Play,
  ArrowRight,
  Truck,
  AlertTriangle,
  BarChart3,
} from 'lucide-react';

export interface SellerDashboardViewProps {
  onOpenTerminal: () => void;
  onOpenDispatch: () => void;
  onOpenAnalytics?: () => void;
}

export const SellerDashboardView: React.FC<SellerDashboardViewProps> = ({
  onOpenTerminal,
  onOpenDispatch,
  onOpenAnalytics,
}) => {
  const { activeSeller, allSellers, setActiveSellerId, toggleShopOpenState, runners } = useSeller();
  const { orders, refreshSellerOrders } = useOrders();

  useEffect(() => {
    void refreshSellerOrders(activeSeller.id);
  }, [activeSeller.id]);

  const sellerOrders = orders.filter((o) => o.sellerId === activeSeller.id);
  const pendingOrders = sellerOrders.filter((o) => ['placed', 'accepted', 'preparing'].includes(o.status));
  const activeDispatches = sellerOrders.filter((o) => o.status === 'out_for_delivery');
  const completedOrders = sellerOrders.filter((o) => o.status === 'completed');

  const todayGrossSalesPaise = completedOrders.reduce((acc, curr) => acc + curr.totalPaise, 0);
  const codPendingCollectionPaise = activeDispatches
    .filter((o) => o.paymentMethod === 'COD')
    .reduce((acc, curr) => acc + curr.totalPaise, 0);

  return (
    <div className="space-y-6 text-left animate-fade-in">
      {/* Top Store Control Header */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className="text-xs uppercase font-bold tracking-wider text-[#6B7280]">
              Merchant Command Console
            </span>
            <Badge variant={activeSeller.isPaused ? 'error' : 'success'} dot>
              {activeSeller.isPaused ? 'SHOP TEMPORARILY PAUSED' : 'LIVE & ACCEPTING ORDERS'}
            </Badge>
          </div>

          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-[#1F2937]">
              {activeSeller.publicName}
            </h1>

            {/* Seller Switcher for Testing/Demo */}
            <select
              value={activeSeller.id}
              onChange={(e) => setActiveSellerId(e.target.value)}
              className="text-xs font-semibold px-2.5 py-1 bg-[#F1F5F9] border border-[#CBD5E1] rounded-lg outline-none text-[#1F2937]"
            >
              {allSellers.map((s) => (
                <option key={s.id} value={s.id}>
                  Switch Store: {s.publicName} ({s.villageName})
                </option>
              ))}
            </select>
          </div>

          <p className="text-xs text-[#6B7280] mt-0.5">
            Village: <strong>{activeSeller.villageName}</strong> • {activeSeller.addressLine}
          </p>
        </div>

        {/* Master Open / Pause Switch */}
        <div className="flex items-center gap-3">
          <button
            onClick={toggleShopOpenState}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer shadow-xs ${
              activeSeller.isPaused
                ? 'bg-[#DC2626] text-white hover:bg-[#B91C1C]'
                : 'bg-[#218838] text-white hover:bg-[#176B2C]'
            }`}
          >
            <Power className="w-4 h-4" />
            <span>{activeSeller.isPaused ? 'Click to Resume Store' : 'Shop is Live (Click to Pause)'}</span>
          </button>
        </div>
      </div>

      {/* Operational KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Orders Needing Action"
          value={`${pendingOrders.length} Orders`}
          icon={<Clock className="w-5 h-5" />}
          badgeText={pendingOrders.length > 0 ? 'Urgent' : 'All Clear'}
          trend={{ value: 'Real-time sync', isPositive: pendingOrders.length === 0 }}
          helperText="Incoming & in-kitchen queue"
        />

        <KPICard
          title="Gross Delivered Today"
          value={formatINR(todayGrossSalesPaise)}
          icon={<IndianRupee className="w-5 h-5" />}
          trend={{ value: `${completedOrders.length} completed`, isPositive: true }}
          helperText="Revenue from delivered orders"
        />

        <KPICard
          title="COD Cash to Collect"
          value={formatINR(codPendingCollectionPaise)}
          icon={<Truck className="w-5 h-5" />}
          badgeText="In Transit"
          helperText={`${activeDispatches.length} orders out for delivery`}
        />

        <KPICard
          title="In-House Delivery Staff"
          value={`${runners.length} Runners`}
          icon={<Store className="w-5 h-5" />}
          helperText="Village runners active"
        />
      </div>

      {/* Quick Launchpad to Live Terminal */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-2xl p-6 shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-[#16A34A] animate-ping" />
            <span className="text-xs font-bold uppercase tracking-wider text-green-400">
              Kitchen Display & POS Terminal
            </span>
          </div>
          <h2 className="text-lg font-bold">
            Live Order Kitchen Display & Packing Hub
          </h2>
          <p className="text-xs text-slate-300 mt-0.5">
            Accept new orders with estimated prep timers, print tickets, and dispatch in-house runners.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {onOpenAnalytics && (
            <Button
              variant="outline"
              size="md"
              className="text-white border-slate-600 hover:bg-slate-700 hover:text-white"
              leftIcon={<BarChart3 className="w-4 h-4" />}
              onClick={onOpenAnalytics}
            >
              Store Analytics
            </Button>
          )}

          <Button
            variant="secondary"
            size="md"
            leftIcon={<Truck className="w-4 h-4" />}
            onClick={onOpenDispatch}
          >
            Manage Runners ({runners.length})
          </Button>

          <Button
            variant="primary"
            size="md"
            rightIcon={<ArrowRight className="w-4 h-4" />}
            onClick={onOpenTerminal}
          >
            Open Order Terminal ({pendingOrders.length})
          </Button>
        </div>
      </div>
    </div>
  );
};
