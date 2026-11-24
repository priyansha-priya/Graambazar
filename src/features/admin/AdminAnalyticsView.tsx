import React, { useMemo, useState } from 'react';
import {
  BarChart3,
  Clock,
  Download,
  IndianRupee,
  TrendingUp,
  XCircle,
} from 'lucide-react';
import { useAdmin } from '../../contexts/AdminContext';
import { KPICard } from '../../components/data-display/KPICard';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { formatINR } from '../../utils/currency';
import { exportToCsv } from '../../utils/exportCsv';

type RangeKey = '7D' | '30D' | '90D' | 'ALL';

const TREND_SERIES: Record<RangeKey, { label: string; gmvInr: number; orders: number }[]> = {
  '7D': [
    { label: 'Mon', gmvInr: 14800, orders: 42 },
    { label: 'Tue', gmvInr: 16200, orders: 47 },
    { label: 'Wed', gmvInr: 15400, orders: 45 },
    { label: 'Thu', gmvInr: 18900, orders: 54 },
    { label: 'Fri', gmvInr: 22100, orders: 63 },
    { label: 'Sat', gmvInr: 26800, orders: 76 },
    { label: 'Sun', gmvInr: 29400, orders: 84 },
  ],
  '30D': [
    { label: 'Wk 1', gmvInr: 92400, orders: 264 },
    { label: 'Wk 2', gmvInr: 108600, orders: 310 },
    { label: 'Wk 3', gmvInr: 121900, orders: 348 },
    { label: 'Wk 4', gmvInr: 143600, orders: 411 },
  ],
  '90D': [
    { label: 'Sep', gmvInr: 285000, orders: 810 },
    { label: 'Oct', gmvInr: 368000, orders: 1042 },
    { label: 'Nov', gmvInr: 466500, orders: 1333 },
  ],
  ALL: [
    { label: 'Jul', gmvInr: 142000, orders: 412 },
    { label: 'Aug', gmvInr: 215000, orders: 620 },
    { label: 'Sep', gmvInr: 285000, orders: 810 },
    { label: 'Oct', gmvInr: 368000, orders: 1042 },
    { label: 'Nov', gmvInr: 466500, orders: 1333 },
  ],
};

const CANCELLATION_REASONS = [
  { reason: 'Item out of stock at local shop', count: 14, share: 39 },
  { reason: 'Customer unreachable at landmark', count: 10, share: 28 },
  { reason: 'Kitchen prep delay (> 35 mins)', count: 7, share: 19 },
  { reason: 'Customer changed mind before prep', count: 5, share: 14 },
];

export const AdminAnalyticsView: React.FC = () => {
  const { sellers, serviceAreas, products, customers, hasPermission } = useAdmin();
  const canExport = hasPermission('ANALYTICS', 'export');

  const [range, setRange] = useState<RangeKey>('7D');
  const [villageFilter, setVillageFilter] = useState('ALL');

  const series = TREND_SERIES[range];
  const villageScale = villageFilter === 'ALL' ? 1 : 0.56;
  const scaledSeries = series.map((pt) => ({
    ...pt,
    gmvInr: Math.round(pt.gmvInr * villageScale),
    orders: Math.round(pt.orders * villageScale),
  }));

  const maxGmv = Math.max(...scaledSeries.map((s) => s.gmvInr), 1);
  const periodGmvPaise = scaledSeries.reduce((sum, s) => sum + s.gmvInr * 100, 0);
  const periodOrders = scaledSeries.reduce((sum, s) => sum + s.orders, 0);
  const avgOrderValuePaise = periodOrders > 0 ? Math.round(periodGmvPaise / periodOrders) : 0;

  const villageStats = useMemo(() => {
    return serviceAreas.map((area) => {
      const areaSellers = sellers.filter((s) => s.villageName === area.name);
      const areaCustomers = customers.filter((c) => c.villageName === area.name);
      const gmvPaise = areaSellers.reduce((sum, s) => sum + s.gmvPaise, 0);
      const ordersCount = areaSellers.reduce((sum, s) => sum + s.totalOrders, 0);
      return {
        name: area.name,
        isActive: area.isActive,
        sellers: areaSellers.length,
        customers: areaCustomers.length,
        orders: ordersCount,
        gmvPaise,
      };
    });
  }, [serviceAreas, sellers, customers]);

  const handleExportReport = () => {
    exportToCsv(
      `grambazaar_analytics_${range}_${new Date().toISOString().split('T')[0]}`,
      [
        { header: 'Period Bucket', accessor: (r) => r.label },
        { header: 'GMV (INR)', accessor: (r) => r.gmvInr },
        { header: 'Orders Count', accessor: (r) => r.orders },
        { header: 'Avg Order Value (INR)', accessor: (r) => (r.orders ? Math.round(r.gmvInr / r.orders) : 0) },
      ],
      scaledSeries
    );
  };

  return (
    <div className="space-y-6 animate-fade-in text-left">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <h1 className="text-xl font-black text-[#1F2937]">Reports &amp; Business Analytics</h1>
            <Badge variant="primary">Executive Insights</Badge>
          </div>
          <p className="text-xs text-[#6B7280]">
            Track GMV velocity, village expansion growth, payment mix (UPI / COD / Udhari), cancellations, and SLA compliance.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex bg-[#F1F5F9] p-1 rounded-full border border-[#E5E7EB]">
            {(['7D', '30D', '90D', 'ALL'] as RangeKey[]).map((key) => (
              <button
                key={key}
                onClick={() => setRange(key)}
                className={`px-3 py-1 rounded-full text-xs font-bold cursor-pointer transition-colors ${
                  range === key ? 'bg-[#218838] text-white' : 'text-[#475569] hover:text-[#1F2937]'
                }`}
              >
                {key}
              </button>
            ))}
          </div>

          <select
            value={villageFilter}
            onChange={(e) => setVillageFilter(e.target.value)}
            className="h-9 px-3 text-xs font-semibold text-[#1F2937] bg-white border border-[#E5E7EB] rounded-full"
          >
            <option value="ALL">All Villages</option>
            {serviceAreas.map((a) => (
              <option key={a.id} value={a.name}>
                {a.name}
              </option>
            ))}
          </select>

          {canExport && (
            <Button
              variant="secondary"
              size="sm"
              onClick={handleExportReport}
              leftIcon={<Download className="w-3.5 h-3.5" />}
            >
              Export CSV
            </Button>
          )}
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <KPICard
          title={`Period GMV (${range})`}
          value={formatINR(periodGmvPaise)}
          trend={{ value: '+22.4%', isPositive: true }}
          icon={<IndianRupee className="w-5 h-5" />}
          iconBgClass="bg-[#E8F5E9] text-[#218838]"
        />
        <KPICard
          title="Average Order Value"
          value={formatINR(avgOrderValuePaise)}
          helperText={`Across ${periodOrders.toLocaleString('en-IN')} orders`}
          icon={<TrendingUp className="w-5 h-5" />}
          iconBgClass="bg-[#EFF6FF] text-[#2563EB]"
        />
        <KPICard
          title="On-Time Delivery SLA"
          value="94.2%"
          helperText="Avg village delivery: 27 mins"
          icon={<Clock className="w-5 h-5" />}
          iconBgClass="bg-[#FEF3C7] text-[#D97706]"
        />
        <KPICard
          title="Cancellation Rate"
          value="2.8%"
          helperText="Down 0.6% vs prior cycle"
          icon={<XCircle className="w-5 h-5" />}
          iconBgClass="bg-[#FEE2E2] text-[#DC2626]"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* GMV & Orders Bar Chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-[#E5E7EB] p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-[#1F2937] flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-[#218838]" />
                GMV &amp; Order Trend ({range})
              </h3>
              <p className="text-xs text-[#6B7280]">Gross merchandise value and completed order volume</p>
            </div>
            <span className="text-xs font-semibold text-[#176B2C] bg-[#E8F5E9] px-2.5 py-1 rounded-full">
              {villageFilter === 'ALL' ? 'All Villages' : villageFilter}
            </span>
          </div>

          <div className="h-56 flex items-end justify-between gap-3 pt-6 px-2 border-b border-[#E5E7EB]">
            {scaledSeries.map((pt) => {
              const heightPct = Math.max(12, Math.round((pt.gmvInr / maxGmv) * 100));
              return (
                <div key={pt.label} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                  <span className="text-[10px] font-bold text-[#1F2937]">
                    ₹{(pt.gmvInr / 1000).toFixed(1)}k
                  </span>
                  <div className="w-full max-w-[46px] bg-[#E8F5E9] rounded-t-xl h-full flex items-end overflow-hidden">
                    <div
                      className="w-full bg-[#218838] hover:bg-[#176B2C] rounded-t-xl transition-all"
                      style={{ height: `${heightPct}%` }}
                      title={`${pt.label}: ₹${pt.gmvInr.toLocaleString('en-IN')} (${pt.orders} orders)`}
                    />
                  </div>
                  <div className="text-center pb-2">
                    <p className="text-xs font-bold text-[#1F2937]">{pt.label}</p>
                    <p className="text-[10px] text-[#6B7280]">{pt.orders} ord</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Payment Mix + Cancellations */}
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 shadow-xs space-y-5">
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-[#1F2937]">Payment Mode Split</h3>
            {[
              { label: 'Cash on Delivery (COD)', pct: 52, color: 'bg-[#218838]' },
              { label: 'UPI / QR Instant Pay', pct: 34, color: 'bg-[#2563EB]' },
              { label: 'Local Udhari Khata', pct: 14, color: 'bg-[#F59E0B]' },
            ].map((item) => (
              <div key={item.label} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="font-medium text-[#475569]">{item.label}</span>
                  <span className="font-bold text-[#1F2937]">{item.pct}%</span>
                </div>
                <div className="h-2 bg-[#F1F5F9] rounded-full overflow-hidden">
                  <div className={`h-2 rounded-full ${item.color}`} style={{ width: `${item.pct}%` }} />
                </div>
              </div>
            ))}
          </div>

          <div className="pt-4 border-t border-[#E5E7EB] space-y-2.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#6B7280]">
              Cancellation Reason Breakdown
            </h4>
            {CANCELLATION_REASONS.map((r) => (
              <div key={r.reason} className="flex items-center justify-between text-xs gap-2">
                <span className="text-[#475569] truncate">{r.reason}</span>
                <span className="font-bold text-[#1F2937] shrink-0">
                  {r.count} ({r.share}%)
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Village Comparison & Top SKUs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-[#1F2937]">Village-Wise Growth Comparison</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-[#F8FAFC] text-[#6B7280] uppercase font-semibold border-y border-[#E5E7EB]">
                <tr>
                  <th className="py-2.5 px-3">Village</th>
                  <th className="py-2.5 px-3">Shops</th>
                  <th className="py-2.5 px-3">Buyers</th>
                  <th className="py-2.5 px-3">Orders</th>
                  <th className="py-2.5 px-3 text-right">GMV</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E7EB]">
                {villageStats.map((v) => (
                  <tr key={v.name}>
                    <td className="py-3 px-3 font-bold text-[#1F2937]">{v.name}</td>
                    <td className="py-3 px-3">{v.sellers}</td>
                    <td className="py-3 px-3">{v.customers}</td>
                    <td className="py-3 px-3">{v.orders}</td>
                    <td className="py-3 px-3 text-right font-bold text-[#176B2C]">
                      {formatINR(v.gmvPaise)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-[#1F2937]">Top Listed Products Snapshot</h3>
          <div className="space-y-2.5">
            {products.slice(0, 5).map((p, idx) => (
              <div
                key={p.id}
                className="flex items-center justify-between p-3 rounded-xl bg-[#F8FAFC] border border-[#E5E7EB] text-xs"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="w-6 h-6 rounded-full bg-[#E8F5E9] text-[#176B2C] font-bold flex items-center justify-center shrink-0">
                    {idx + 1}
                  </span>
                  <div className="min-w-0">
                    <p className="font-bold text-[#1F2937] truncate">{p.name}</p>
                    <p className="text-[11px] text-[#6B7280] truncate">
                      {p.sellerName} &middot; {p.vertical}
                    </p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-bold text-[#1F2937]">{formatINR(p.pricePaise)}</p>
                  <Badge variant={p.isAvailable ? 'success' : 'neutral'} size="sm">
                    {p.isAvailable ? 'In Stock' : 'Paused'}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
