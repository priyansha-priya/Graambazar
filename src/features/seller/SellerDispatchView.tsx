import React, { useEffect, useState } from 'react';
import { InHouseRunner, useSeller } from '../../contexts/SellerContext';
import { useOrders } from '../../contexts/OrderContext';
import { formatINR } from '../../utils/currency';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import {
  Truck,
  Phone,
  MapPin,
  CheckCircle2,
  UserPlus,
  Power,
  Trash2,
  X,
} from 'lucide-react';

export const SellerDispatchView: React.FC = () => {
  const {
    activeSeller,
    runners,
    addRunner,
    toggleRunnerAvailability,
    deleteRunner,
  } = useSeller();
  const { orders, transitionOrder, refreshSellerOrders } = useOrders();

  useEffect(() => {
    void refreshSellerOrders(activeSeller.id);
  }, [activeSeller.id]);

  const [showAddRunner, setShowAddRunner] = useState(false);
  const [runnerName, setRunnerName] = useState('');
  const [runnerPhone, setRunnerPhone] = useState('');
  const [runnerRole, setRunnerRole] = useState<InHouseRunner['role']>('Shop Runner');
  const [runnerFeedback, setRunnerFeedback] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  // Active out-for-delivery orders for this seller
  const activeDispatches = orders.filter(
    (o) => o.sellerId === activeSeller.id && o.status === 'out_for_delivery'
  );

  const handleAddRunner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!runnerName.trim() || !runnerPhone.trim()) return;
    setIsAdding(true);
    setRunnerFeedback(null);

    const res = await addRunner({
      name: runnerName.trim(),
      phone: runnerPhone.trim(),
      role: runnerRole,
    });
    setIsAdding(false);
    setRunnerFeedback(res.message);
    if (res.success) {
      setRunnerName('');
      setRunnerPhone('');
      setShowAddRunner(false);
      window.setTimeout(() => setRunnerFeedback(null), 3000);
    }
  };

  return (
    <div className="space-y-6 text-left animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-[#1F2937]">
            In-House Runner & Delivery Dispatch Hub
          </h2>
          <p className="text-xs text-[#6B7280]">
            Manage shop delivery boys, active runs, and customer landmark handovers.
          </p>
        </div>

        <Button
          variant={showAddRunner ? 'secondary' : 'primary'}
          size="sm"
          leftIcon={showAddRunner ? <X className="w-3.5 h-3.5" /> : <UserPlus className="w-3.5 h-3.5" />}
          onClick={() => setShowAddRunner((prev) => !prev)}
        >
          {showAddRunner ? 'Cancel' : 'Add Runner'}
        </Button>
      </div>

      {runnerFeedback && (
        <div className="px-4 py-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold">
          {runnerFeedback}
        </div>
      )}

      {showAddRunner && (
        <form
          onSubmit={handleAddRunner}
          className="bg-white rounded-2xl border border-[#E5E7EB] p-4 shadow-xs grid grid-cols-1 sm:grid-cols-4 gap-3 items-end"
        >
          <div>
            <label className="block text-[11px] font-semibold text-[#374151] mb-1">
              Runner Name
            </label>
            <input
              type="text"
              value={runnerName}
              onChange={(e) => setRunnerName(e.target.value)}
              placeholder="e.g. Raju Verma"
              className="w-full px-3 py-2 text-xs rounded-xl border border-[#D1D5DB] outline-none focus:border-[#218838]"
              required
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-[#374151] mb-1">
              Mobile Number
            </label>
            <input
              type="tel"
              value={runnerPhone}
              onChange={(e) => setRunnerPhone(e.target.value)}
              placeholder="9876543210"
              className="w-full px-3 py-2 text-xs rounded-xl border border-[#D1D5DB] outline-none focus:border-[#218838]"
              required
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-[#374151] mb-1">
              Staff Role
            </label>
            <select
              value={runnerRole}
              onChange={(e) => setRunnerRole(e.target.value as InHouseRunner['role'])}
              className="w-full px-3 py-2 text-xs rounded-xl border border-[#D1D5DB] outline-none focus:border-[#218838] bg-white"
            >
              <option value="Shop Runner">Shop Runner</option>
              <option value="Delivery Staff">Delivery Staff</option>
              <option value="Family Helper">Family Helper</option>
            </select>
          </div>
          <Button variant="primary" size="sm" type="submit" disabled={isAdding}>
            {isAdding ? 'Saving...' : 'Save Runner'}
          </Button>
        </form>
      )}

      {/* Staff Runner Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {runners.map((runner) => (
          <div
            key={runner.id}
            className="bg-white rounded-2xl border border-[#E5E7EB] p-4 shadow-xs flex flex-col justify-between gap-3"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                    runner.isAvailable
                      ? 'bg-[#E8F5E9] text-[#218838]'
                      : 'bg-slate-100 text-slate-400'
                  }`}
                >
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

            <div className="flex items-center justify-between pt-2 border-t border-[#F1F5F9]">
              <button
                type="button"
                onClick={() => toggleRunnerAvailability(runner.id)}
                className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                  runner.isAvailable
                    ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <Power className="w-3 h-3" />
                <span>{runner.isAvailable ? 'On Duty' : 'Off Duty'}</span>
              </button>

              {runner.activeOrdersCount === 0 && (
                <button
                  type="button"
                  onClick={() => deleteRunner(runner.id)}
                  className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg transition-colors cursor-pointer"
                  title="Remove runner"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
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
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono font-bold text-[#1F2937]">
                      {order.orderNumber}
                    </span>
                    <Badge variant="info" size="sm">
                      {order.paymentMethod}
                    </Badge>
                    <span className="font-bold text-[#218838]">
                      Amount: {formatINR(order.totalPaise)}
                    </span>
                    {order.assignedRunnerName && (
                      <Badge variant="primary" size="sm">
                        Runner: {order.assignedRunnerName}
                      </Badge>
                    )}
                  </div>

                  <p className="text-[#475569]">
                    Customer: <strong>{order.customerName}</strong> (+91 {order.customerPhone})
                  </p>

                  {order.deliveryAddress && (
                    <div className="flex items-center gap-1.5 text-[#176B2C] font-medium">
                      <MapPin className="w-3.5 h-3.5 text-[#218838] shrink-0" />
                      <span>
                        Landmark: <strong>{order.deliveryAddress.landmark}</strong>,{' '}
                        {order.deliveryAddress.addressLine1} ({order.deliveryAddress.villageName})
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
