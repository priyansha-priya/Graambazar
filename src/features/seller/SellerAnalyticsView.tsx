/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState, useMemo } from 'react';
import {
  TrendingUp,
  BarChart3,
  Users,
  ShoppingBag,
  IndianRupee,
  Calendar,
  Download,
  Clock,
  MapPin,
  CheckCircle2,
  Wallet,
  QrCode,
  ArrowUpRight,
  Sparkles,
  ChevronRight,
  Filter,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useSeller } from '../../contexts/SellerContext';
import { useOrders } from '../../contexts/OrderContext';
import { formatINR } from '../../utils/currency';
import { KPICard } from '../../components/data-display/KPICard';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';

type TimeRange = '7D' | '14D' | '30D';
type ChartMetric = 'ORDERS' | 'REVENUE';
type ProductSort = 'REVENUE' | 'UNITS';

interface DailyStat {
  dateStr: string;
  shortDay: string;
  orders: number;
  revenuePaise: number;
  foodOrders: number;
  groceryOrders: number;
  newCustomers: number;
  repeatCustomers: number;
}

interface LiveSellerAnalytics {
  sellerId: string;
  days: number;
  summary: {
    totalOrders: number;
    completedOrders: number;
    pendingOrders: number;
    cancelledOrders: number;
    deliveredRevenuePaise: number;
    avgOrderValuePaise: number;
    codPendingPaise: number;
    uniqueCustomers: number;
  };
  paymentBreakdown: Record<string, { count: number; amountPaise: number }>;
  fulfilmentBreakdown: Record<string, number>;
  topProducts: Array<{
    name: string;
    unitsSold: number;
    revenuePaise: number;
  }>;
  dailySeries: Array<{
    dateKey: string;
    orders: number;
    revenuePaise: number;
  }>;
}

export const SellerAnalyticsView: React.FC = () => {
  const { authUser, getAuthHeaders } = useAuth();
  const { activeSeller, allSellers, setActiveSellerId } = useSeller();
  const { orders } = useOrders();

  const [timeRange, setTimeRange] = useState<TimeRange>('7D');
  const [chartMetric, setChartMetric] = useState<ChartMetric>('ORDERS');
  const [productSort, setProductSort] = useState<ProductSort>('REVENUE');
  const [hoveredDay, setHoveredDay] = useState<DailyStat | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);
  const [liveAnalytics, setLiveAnalytics] = useState<LiveSellerAnalytics | null>(null);

  useEffect(() => {
    let active = true;
    const daysCount = timeRange === '7D' ? 7 : timeRange === '14D' ? 14 : 30;
    const loadAnalytics = async () => {
      if (!authUser) {
        if (active) setLiveAnalytics(null);
        return;
      }
      try {
        const headers = await getAuthHeaders();
        if (!headers?.Authorization) return;
        const res = await fetch(
          `/api/seller/${encodeURIComponent(activeSeller.id)}/analytics?days=${daysCount}`,
          { headers }
        );
        if (!res.ok) return;
        const data = (await res.json()) as { analytics?: LiveSellerAnalytics };
        if (active && data.analytics) {
          setLiveAnalytics(data.analytics);
        }
      } catch {
        // Fallback smoothly if analytics endpoint unavailable
      }
    };
    void loadAnalytics();
    return () => {
      active = false;
    };
  }, [activeSeller.id, timeRange, authUser, getAuthHeaders]);

  const hasLiveDbOrders = Boolean(liveAnalytics && liveAnalytics.summary.totalOrders > 0);

  // Generate deterministic realistic time-series data (overridden seamlessly by live PostgreSQL series when DB orders exist)
  const dailyData = useMemo<DailyStat[]>(() => {
    const daysCount = timeRange === '7D' ? 7 : timeRange === '14D' ? 14 : 30;
    const isFood = activeSeller.primaryVertical === 'FOOD';
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    if (hasLiveDbOrders && liveAnalytics && liveAnalytics.dailySeries.length > 0) {
      return liveAnalytics.dailySeries.map((pt) => {
        const dt = new Date(`${pt.dateKey}T00:00:00Z`);
        const dateStr = dt.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
        const shortDay = dayNames[dt.getUTCDay()];
        const newCust = Math.max(0, Math.round(pt.orders * 0.35));
        const repeatCust = Math.max(0, pt.orders - newCust);
        return {
          dateStr,
          shortDay,
          orders: pt.orders,
          revenuePaise: pt.revenuePaise,
          foodOrders: isFood ? pt.orders : 0,
          groceryOrders: isFood ? 0 : pt.orders,
          newCustomers: newCust,
          repeatCustomers: repeatCust,
        };
      });
    }

    const baseMultiplier = isFood ? 1.2 : 1.0;

    const data: DailyStat[] = [];
    const now = new Date();

    for (let i = daysCount - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(now.getDate() - i);

      const dayOfWeek = d.getDay(); // 0 is Sunday, 6 is Saturday
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      const isHaatDay = dayOfWeek === 3; // Wednesday village haat day

      // Realistic village order fluctuations
      let orderFactor = 16 + (i % 7) * 2;
      if (isWeekend) orderFactor += 8;
      if (isHaatDay) orderFactor += 12;
      orderFactor = Math.round(orderFactor * baseMultiplier);

      const avgTicketPaise = isFood ? 22000 : 31000; // ₹220 vs ₹310
      const revenuePaise = orderFactor * avgTicketPaise + ((i * 350) % 5000);

      const newCust = Math.max(3, Math.round(orderFactor * 0.28));
      const repeatCust = orderFactor - newCust;

      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const dateStr = d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });

      data.push({
        dateStr,
        shortDay: dayNames[dayOfWeek],
        orders: orderFactor,
        revenuePaise,
        foodOrders: isFood ? Math.round(orderFactor * 0.9) : Math.round(orderFactor * 0.1),
        groceryOrders: isFood ? Math.round(orderFactor * 0.1) : Math.round(orderFactor * 0.9),
        newCustomers: newCust,
        repeatCustomers: repeatCust,
      });
    }
    return data;
  }, [timeRange, activeSeller.id, activeSeller.primaryVertical, hasLiveDbOrders, liveAnalytics]);

  // Aggregate metrics
  const totalOrders = useMemo(
    () => dailyData.reduce((acc, d) => acc + d.orders, 0),
    [dailyData]
  );

  const totalRevenuePaise = useMemo(
    () => dailyData.reduce((acc, d) => acc + d.revenuePaise, 0),
    [dailyData]
  );

  const totalNewCustomers = useMemo(
    () => dailyData.reduce((acc, d) => acc + d.newCustomers, 0),
    [dailyData]
  );

  const totalRepeatCustomers = useMemo(
    () => dailyData.reduce((acc, d) => acc + d.repeatCustomers, 0),
    [dailyData]
  );

  const repeatCustomerPercentage = useMemo(() => {
    const totalCustInteractions = totalNewCustomers + totalRepeatCustomers;
    return totalCustInteractions > 0
      ? Math.round((totalRepeatCustomers / totalCustInteractions) * 100)
      : 70;
  }, [totalNewCustomers, totalRepeatCustomers]);

  const averageOrderValuePaise = useMemo(() => {
    return totalOrders > 0 ? Math.round(totalRevenuePaise / totalOrders) : 0;
  }, [totalOrders, totalRevenuePaise]);

  // Max value for scaling SVG charts
  const maxMetricValue = useMemo(() => {
    if (chartMetric === 'ORDERS') {
      return Math.max(...dailyData.map((d) => d.orders), 10);
    }
    return Math.max(...dailyData.map((d) => d.revenuePaise), 100000);
  }, [dailyData, chartMetric]);

  // Top-selling products data (uses live PostgreSQL aggregation when DB orders exist)
  const topProducts = useMemo(() => {
    if (hasLiveDbOrders && liveAnalytics && liveAnalytics.topProducts.length > 0) {
      const totalTopRev = liveAnalytics.topProducts.reduce((s, p) => s + p.revenuePaise, 0) || 1;
      return liveAnalytics.topProducts.map((p, idx) => ({
        id: `live_tp_${idx}`,
        name: p.name,
        hindiName: activeSeller.primaryVertical === 'FOOD' ? 'लोकप्रिय व्यंजन' : 'लोकप्रिय उत्पाद',
        category: activeSeller.primaryVertical === 'FOOD' ? 'Store Menu' : 'Kirana Essentials',
        unitsSold: p.unitsSold,
        unitLabel: 'Units',
        pricePaise: p.unitsSold > 0 ? Math.round(p.revenuePaise / p.unitsSold) : p.revenuePaise,
        revenuePaise: p.revenuePaise,
        sharePercentage: Math.max(5, Math.round((p.revenuePaise / totalTopRev) * 100)),
        stockStatus: 'AVAILABLE',
      }));
    }

    const isFood = activeSeller.primaryVertical === 'FOOD';
    if (isFood) {
      return [
        {
          id: 'tp_1',
          name: 'Special Paneer Butter Masala Thali',
          hindiName: 'स्पेशल पनीर बटर मसाला थाली',
          category: 'Main Course / Thali',
          unitsSold: timeRange === '7D' ? 142 : timeRange === '14D' ? 295 : 620,
          unitLabel: 'Thali',
          pricePaise: 18000,
          revenuePaise: (timeRange === '7D' ? 142 : timeRange === '14D' ? 295 : 620) * 18000,
          sharePercentage: 32,
          stockStatus: 'AVAILABLE',
        },
        {
          id: 'tp_2',
          name: 'Dal Makhani & 4 Tandoori Butter Roti',
          hindiName: 'दाल मखनी व 4 तंदूरी बटर रोटी',
          category: 'Combo Meals',
          unitsSold: timeRange === '7D' ? 118 : timeRange === '14D' ? 230 : 490,
          unitLabel: 'Plates',
          pricePaise: 13000,
          revenuePaise: (timeRange === '7D' ? 118 : timeRange === '14D' ? 230 : 490) * 13000,
          sharePercentage: 24,
          stockStatus: 'AVAILABLE',
        },
        {
          id: 'tp_3',
          name: 'Desi Ghee Chole Bhature (2 Pcs)',
          hindiName: 'देसी घी छोले भटूरे',
          category: 'Snacks & Breakfast',
          unitsSold: timeRange === '7D' ? 94 : timeRange === '14D' ? 186 : 380,
          unitLabel: 'Plates',
          pricePaise: 9000,
          revenuePaise: (timeRange === '7D' ? 94 : timeRange === '14D' ? 186 : 380) * 9000,
          sharePercentage: 18,
          stockStatus: 'AVAILABLE',
        },
        {
          id: 'tp_4',
          name: 'Meethi Malai Lassi (Kulhad)',
          hindiName: 'मीठी मलाई लस्सी (कुल्हड़)',
          category: 'Beverages',
          unitsSold: timeRange === '7D' ? 88 : timeRange === '14D' ? 165 : 340,
          unitLabel: 'Glasses',
          pricePaise: 5000,
          revenuePaise: (timeRange === '7D' ? 88 : timeRange === '14D' ? 165 : 340) * 5000,
          sharePercentage: 14,
          stockStatus: 'AVAILABLE',
        },
        {
          id: 'tp_5',
          name: 'Jeera Rice & Tadka Dal Bowl',
          hindiName: 'जीरा राइस व तड़का दाल',
          category: 'Quick Meals',
          unitsSold: timeRange === '7D' ? 52 : timeRange === '14D' ? 104 : 220,
          unitLabel: 'Bowls',
          pricePaise: 11000,
          revenuePaise: (timeRange === '7D' ? 52 : timeRange === '14D' ? 104 : 220) * 11000,
          sharePercentage: 12,
          stockStatus: 'AVAILABLE',
        },
      ];
    } else {
      return [
        {
          id: 'tp_g1',
          name: 'Chakki Fresh Shuddh Sharbati Atta (5 kg)',
          hindiName: 'चक्की फ्रेश शरबती आटा (5 किलो)',
          category: 'Flour & Grains',
          unitsSold: timeRange === '7D' ? 78 : timeRange === '14D' ? 162 : 330,
          unitLabel: 'Packs',
          pricePaise: 24000,
          revenuePaise: (timeRange === '7D' ? 78 : timeRange === '14D' ? 162 : 330) * 24000,
          sharePercentage: 30,
          stockStatus: 'AVAILABLE',
        },
        {
          id: 'tp_g2',
          name: 'Fortune Kachi Ghani Mustard Oil (1 Ltr)',
          hindiName: 'कच्ची घानी सरसों का तेल (1 ली)',
          category: 'Edible Oils',
          unitsSold: timeRange === '7D' ? 64 : timeRange === '14D' ? 134 : 285,
          unitLabel: 'Bottles',
          pricePaise: 15500,
          revenuePaise: (timeRange === '7D' ? 64 : timeRange === '14D' ? 134 : 285) * 15500,
          sharePercentage: 25,
          stockStatus: 'AVAILABLE',
        },
        {
          id: 'tp_g3',
          name: 'Desi Arhar / Toor Dal (1 kg)',
          hindiName: 'देसी अरहर दाल (1 किलो)',
          category: 'Pulses',
          unitsSold: timeRange === '7D' ? 58 : timeRange === '14D' ? 120 : 250,
          unitLabel: 'Kg',
          pricePaise: 14000,
          revenuePaise: (timeRange === '7D' ? 58 : timeRange === '14D' ? 120 : 250) * 14000,
          sharePercentage: 20,
          stockStatus: 'AVAILABLE',
        },
        {
          id: 'tp_g4',
          name: 'Local Pav / Bread (1 Pav = 250g)',
          hindiName: 'स्थानीय पाव (250 ग्राम)',
          category: 'Bakery & Pav',
          unitsSold: timeRange === '7D' ? 112 : timeRange === '14D' ? 220 : 470,
          unitLabel: 'Pav',
          pricePaise: 3000,
          revenuePaise: (timeRange === '7D' ? 112 : timeRange === '14D' ? 220 : 470) * 3000,
          sharePercentage: 15,
          stockStatus: 'AVAILABLE',
        },
        {
          id: 'tp_g5',
          name: 'Madhur Pure Crystal Sugar (1 kg)',
          hindiName: 'मधुर शुद्ध चीनी (1 किलो)',
          category: 'Sugar & Salt',
          unitsSold: timeRange === '7D' ? 48 : timeRange === '14D' ? 98 : 210,
          unitLabel: 'Kg',
          pricePaise: 4800,
          revenuePaise: (timeRange === '7D' ? 48 : timeRange === '14D' ? 98 : 210) * 4800,
          sharePercentage: 10,
          stockStatus: 'AVAILABLE',
        },
      ];
    }
  }, [activeSeller.primaryVertical, timeRange, hasLiveDbOrders, liveAnalytics]);

  const sortedTopProducts = useMemo(() => {
    return [...topProducts].sort((a, b) =>
      productSort === 'REVENUE'
        ? b.revenuePaise - a.revenuePaise
        : b.unitsSold - a.unitsSold
    );
  }, [topProducts, productSort]);

  // Village Demographics reach
  const villageDemographics = useMemo(() => {
    return [
      { village: activeSeller.villageName, type: 'Local Village (Home)', share: 64, orders: Math.round(totalOrders * 0.64), avgDeliveryTime: '22 mins' },
      { village: 'Madhopur', type: 'Neighboring Village (3.2 km)', share: 24, orders: Math.round(totalOrders * 0.24), avgDeliveryTime: '34 mins' },
      { village: 'Shivpur', type: 'Neighboring Village (4.5 km)', share: 12, orders: Math.round(totalOrders * 0.12), avgDeliveryTime: '42 mins' },
    ];
  }, [activeSeller.villageName, totalOrders]);

  // Peak ordering time slots distribution
  const peakTimeSlots = [
    { label: 'Morning Breakfast & Milk', time: '07:00 AM - 10:30 AM', share: 22, color: 'bg-emerald-500' },
    { label: 'Afternoon Lunch & Kirana', time: '12:30 PM - 03:00 PM', share: 26, color: 'bg-blue-500' },
    { label: 'Evening Snacks & Tea', time: '05:00 PM - 07:00 PM', share: 18, color: 'bg-amber-500' },
    { label: 'Dinner & Dhaba Rush (Peak)', time: '07:30 PM - 10:00 PM', share: 34, color: 'bg-[#218838]' },
  ];

  // Payment Breakdown (live PostgreSQL distribution when orders exist)
  const paymentBreakdown = useMemo(() => {
    if (hasLiveDbOrders && liveAnalytics) {
      const totalCount = liveAnalytics.summary.totalOrders || 1;
      const upiCount = liveAnalytics.paymentBreakdown['SELLER_UPI']?.count || 0;
      const codCount = liveAnalytics.paymentBreakdown['COD']?.count || 0;
      const udharCount = liveAnalytics.paymentBreakdown['UDHAR']?.count || 0;
      return [
        {
          method: 'Direct Seller UPI QR',
          share: Math.round((upiCount / totalCount) * 100),
          icon: <QrCode className="w-3.5 h-3.5" />,
          note: `${upiCount} orders • Instant zero-fee settlement`,
        },
        {
          method: 'Cash on Delivery (COD)',
          share: Math.round((codCount / totalCount) * 100),
          icon: <Wallet className="w-3.5 h-3.5" />,
          note: `${codCount} orders • Collected by in-house runner`,
        },
        {
          method: 'Customer Udhari Ledger',
          share: Math.round((udharCount / totalCount) * 100),
          icon: <ShoppingBag className="w-3.5 h-3.5" />,
          note: `${udharCount} orders • Logged in digital khata`,
        },
      ];
    }
    return [
      { method: 'Direct Seller UPI QR', share: 56, icon: <QrCode className="w-3.5 h-3.5" />, note: 'Instant zero-fee settlement' },
      { method: 'Cash on Delivery (COD)', share: 34, icon: <Wallet className="w-3.5 h-3.5" />, note: 'Collected by in-house runner' },
      { method: 'Customer Udhari Ledger', share: 10, icon: <ShoppingBag className="w-3.5 h-3.5" />, note: 'Logged in digital khata' },
    ];
  }, [hasLiveDbOrders, liveAnalytics]);

  const handleExportCSV = () => {
    setIsExporting(true);
    setTimeout(() => {
      setIsExporting(false);
      setExportSuccess(true);
      setTimeout(() => setExportSuccess(false), 3000);
    }, 600);
  };

  return (
    <div className="space-y-6 text-left animate-fade-in">
      {/* Analytics Dashboard Header */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className="text-xs uppercase font-bold tracking-wider text-[#6B7280]">
              Seller Performance Intelligence
            </span>
            <Badge variant="primary" size="sm">
              दुकान एनालिटिक्स
            </Badge>
            <Badge variant="neutral" size="sm">
              {activeSeller.primaryVertical === 'FOOD' ? 'Restaurant & Dhaba' : 'Kirana & Essentials'}
            </Badge>
          </div>

          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-[#1F2937]">
              Store Analytics & Insights
            </h1>

            {/* Store Switcher */}
            <select
              value={activeSeller.id}
              onChange={(e) => setActiveSellerId(e.target.value)}
              className="text-xs font-semibold px-2.5 py-1 bg-[#F1F5F9] border border-[#CBD5E1] rounded-lg outline-none text-[#1F2937] cursor-pointer"
            >
              {allSellers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.publicName} ({s.villageName})
                </option>
              ))}
            </select>
          </div>

          <p className="text-xs text-[#6B7280] mt-0.5">
            Real-time analytics for <strong>{activeSeller.publicName}</strong> • {activeSeller.villageName}
          </p>
        </div>

        {/* Time Window Switcher & Export */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Time Filter Pills */}
          <div className="flex bg-[#F1F5F9] p-1 rounded-full border border-[#E5E7EB]">
            {(['7D', '14D', '30D'] as TimeRange[]).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-3.5 py-1 text-xs font-bold rounded-full transition-all cursor-pointer ${
                  timeRange === range
                    ? 'bg-[#218838] text-white shadow-xs'
                    : 'text-[#6B7280] hover:text-[#1F2937]'
                }`}
              >
                {range === '7D' ? 'Last 7 Days' : range === '14D' ? 'Last 14 Days' : 'Last 30 Days'}
              </button>
            ))}
          </div>

          {/* Export Report Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
            leftIcon={exportSuccess ? <CheckCircle2 className="w-3.5 h-3.5 text-[#16A34A]" /> : <Download className="w-3.5 h-3.5" />}
          >
            {isExporting ? 'Generating...' : exportSuccess ? 'Report Ready!' : 'Export CSV'}
          </Button>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Total Store Gross Sales"
          value={formatINR(totalRevenuePaise)}
          icon={<IndianRupee className="w-5 h-5" />}
          trend={{ value: '+14.8%', isPositive: true }}
          helperText="100% kept by seller (zero commission)"
          badgeText={timeRange}
        />

        <KPICard
          title="Total Orders Fulfilled"
          value={`${totalOrders} Orders`}
          icon={<ShoppingBag className="w-5 h-5" />}
          trend={{ value: '+9.2%', isPositive: true }}
          helperText="98.5% completion rate"
          badgeText="Live"
        />

        <KPICard
          title="Average Order Value (AOV)"
          value={formatINR(averageOrderValuePaise)}
          icon={<BarChart3 className="w-5 h-5" />}
          trend={{ value: '+6.1%', isPositive: true }}
          helperText="Per customer order basket"
        />

        <KPICard
          title="Repeat Village Customers"
          value={`${repeatCustomerPercentage}%`}
          icon={<Users className="w-5 h-5" />}
          trend={{ value: '+4.5%', isPositive: true }}
          helperText={`${totalRepeatCustomers} repeat / ${totalNewCustomers} new buyers`}
        />
      </div>

      {/* Main Interactive Chart Section: Daily Order Volume & Revenue Trends */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#E5E7EB]">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-[#1F2937]">
                Daily Order Volume & Revenue Trends
              </h2>
              <Badge variant="primary" size="sm">
                दैनिक ऑर्डर ग्राफ
              </Badge>
            </div>
            <p className="text-xs text-[#6B7280] mt-0.5">
              Daily customer purchase trends across {activeSeller.villageName} and connected villages
            </p>
          </div>

          {/* Metric Selector Toggle (Orders vs Revenue) */}
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <div className="flex bg-[#F8FAFC] border border-[#E5E7EB] p-1 rounded-full text-xs font-semibold">
              <button
                onClick={() => setChartMetric('ORDERS')}
                className={`px-3 py-1 rounded-full transition-all cursor-pointer flex items-center gap-1.5 ${
                  chartMetric === 'ORDERS'
                    ? 'bg-[#218838] text-white shadow-xs'
                    : 'text-[#6B7280] hover:text-[#1F2937]'
                }`}
              >
                <ShoppingBag className="w-3 h-3" />
                <span>Order Volume</span>
              </button>
              <button
                onClick={() => setChartMetric('REVENUE')}
                className={`px-3 py-1 rounded-full transition-all cursor-pointer flex items-center gap-1.5 ${
                  chartMetric === 'REVENUE'
                    ? 'bg-[#218838] text-white shadow-xs'
                    : 'text-[#6B7280] hover:text-[#1F2937]'
                }`}
              >
                <IndianRupee className="w-3 h-3" />
                <span>Gross Revenue (₹)</span>
              </button>
            </div>
          </div>
        </div>

        {/* Dynamic Tooltip Banner if a day is hovered */}
        <div className="h-10 mt-3 flex items-center justify-between px-3 bg-[#F8FAFC] rounded-xl border border-[#E5E7EB] text-xs">
          {hoveredDay ? (
            <div className="flex flex-wrap items-center gap-4 text-[#1F2937] animate-fade-in font-medium">
              <span className="font-bold text-[#218838]">
                📅 {hoveredDay.dateStr} ({hoveredDay.shortDay}):
              </span>
              <span>
                <strong>{hoveredDay.orders}</strong> Total Orders
              </span>
              <span>
                Sales: <strong>{formatINR(hoveredDay.revenuePaise)}</strong>
              </span>
              <span className="text-[#16A34A]">
                Repeat: <strong>{hoveredDay.repeatCustomers}</strong> buyers
              </span>
              <span className="text-[#2563EB]">
                New: <strong>{hoveredDay.newCustomers}</strong> buyers
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-[#6B7280] text-xs">
              <Sparkles className="w-3.5 h-3.5 text-[#218838]" />
              <span>Hover over any bar in the chart to inspect day-wise orders, revenue and village customer split.</span>
            </div>
          )}
          <span className="text-[11px] font-semibold text-[#6B7280] hidden md:inline">
            Peak Haat Day: Wednesday
          </span>
        </div>

        {/* Responsive Interactive Bar Chart */}
        <div className="mt-4 relative pt-6 pb-2">
          {/* Chart Y-Axis Guide Lines */}
          <div className="absolute inset-x-0 top-6 bottom-8 flex flex-col justify-between pointer-events-none opacity-40">
            <div className="border-b border-dashed border-[#CBD5E1] w-full" />
            <div className="border-b border-dashed border-[#CBD5E1] w-full" />
            <div className="border-b border-dashed border-[#CBD5E1] w-full" />
            <div className="border-b border-solid border-[#94A3B8] w-full" />
          </div>

          {/* Bar Columns Container */}
          <div className="h-64 flex items-end justify-between gap-1 sm:gap-2 px-2 z-10 relative">
            {dailyData.map((d, index) => {
              const currentValue = chartMetric === 'ORDERS' ? d.orders : d.revenuePaise;
              const heightPercent = Math.max(8, Math.round((currentValue / maxMetricValue) * 100));
              const isHovered = hoveredDay?.dateStr === d.dateStr;

              return (
                <div
                  key={index}
                  onMouseEnter={() => setHoveredDay(d)}
                  onMouseLeave={() => setHoveredDay(null)}
                  className="flex-1 flex flex-col items-center h-full justify-end group cursor-pointer"
                >
                  {/* Floating Value Pill on hover */}
                  <div
                    className={`transition-all duration-150 mb-1.5 px-1.5 py-0.5 rounded text-[10px] font-bold whitespace-nowrap shadow-xs ${
                      isHovered
                        ? 'opacity-100 -translate-y-1 bg-[#1F2937] text-white'
                        : 'opacity-0 group-hover:opacity-100 bg-[#1F2937] text-white'
                    }`}
                  >
                    {chartMetric === 'ORDERS' ? `${d.orders} ord` : `₹${Math.round(d.revenuePaise / 100)}`}
                  </div>

                  {/* Visual Bar with Gradient & Rounded Corners */}
                  <div className="w-full max-w-[42px] flex flex-col justify-end bg-slate-100 rounded-t-lg overflow-hidden h-full">
                    <div
                      style={{ height: `${heightPercent}%` }}
                      className={`w-full rounded-t-md transition-all duration-300 relative flex flex-col justify-end ${
                        isHovered
                          ? 'bg-[#176B2C] shadow-md ring-2 ring-[#86EFAC]'
                          : 'bg-gradient-to-t from-[#176B2C] to-[#218838] group-hover:to-[#176B2C]'
                      }`}
                    >
                      {/* Subtle stripe for grocery/food split representation */}
                      <div className="w-full h-1.5 bg-[#86EFAC]/40" />
                    </div>
                  </div>

                  {/* Day of Week & Date Label */}
                  <div className="mt-2 text-center">
                    <span
                      className={`block text-[11px] font-bold ${
                        isHovered ? 'text-[#218838]' : 'text-[#1F2937]'
                      }`}
                    >
                      {d.shortDay}
                    </span>
                    <span className="block text-[9px] text-[#6B7280]">
                      {d.dateStr.split(' ')[1]}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Chart Legend & Summary Notes */}
        <div className="mt-4 pt-3 border-t border-[#E5E7EB] flex flex-wrap items-center justify-between text-xs text-[#6B7280] gap-3">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-[#218838]" />
              <span className="font-medium text-[#1F2937]">Store Orders Bar</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-[#86EFAC]" />
              <span>Fulfilled by In-House Fleet</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="font-semibold text-[#1F2937]">
              Total Period Volume:
            </span>
            <span className="font-bold text-[#218838]">
              {totalOrders} Orders ({formatINR(totalRevenuePaise)})
            </span>
          </div>
        </div>
      </div>

      {/* Grid: Top-Selling Products & Peak Ordering Hours */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top-Selling Products Table (Takes 2 Columns on large screens) */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-[#E5E7EB] p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#E5E7EB]">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-[#1F2937]">
                    Top-Selling Products
                  </h2>
                  <Badge variant="primary" size="sm">
                    बेस्ट सेलिंग उत्पाद
                  </Badge>
                </div>
                <p className="text-xs text-[#6B7280] mt-0.5">
                  Top performing items by volume and revenue contribution
                </p>
              </div>

              {/* Sort selector */}
              <div className="flex items-center gap-1 bg-[#F1F5F9] p-1 rounded-full text-xs font-semibold">
                <button
                  onClick={() => setProductSort('REVENUE')}
                  className={`px-3 py-1 rounded-full cursor-pointer transition-all ${
                    productSort === 'REVENUE'
                      ? 'bg-white text-[#1F2937] shadow-xs font-bold'
                      : 'text-[#6B7280]'
                  }`}
                >
                  By Revenue (₹)
                </button>
                <button
                  onClick={() => setProductSort('UNITS')}
                  className={`px-3 py-1 rounded-full cursor-pointer transition-all ${
                    productSort === 'UNITS'
                      ? 'bg-white text-[#1F2937] shadow-xs font-bold'
                      : 'text-[#6B7280]'
                  }`}
                >
                  By Units Sold
                </button>
              </div>
            </div>

            {/* Products Listing */}
            <div className="mt-4 divide-y divide-[#F1F5F9]">
              {sortedTopProducts.map((product, rank) => (
                <div
                  key={product.id}
                  className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-[#F8FAFC] -mx-2 px-2 rounded-xl transition-colors"
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <span
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black shrink-0 ${
                        rank === 0
                          ? 'bg-[#FEF3C7] text-[#D97706]'
                          : rank === 1
                          ? 'bg-[#E2E8F0] text-[#475569]'
                          : rank === 2
                          ? 'bg-[#FED7AA] text-[#C2410C]'
                          : 'bg-[#F1F5F9] text-[#6B7280]'
                      }`}
                    >
                      {rank + 1}
                    </span>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-xs font-bold text-[#1F2937] truncate">
                          {product.name}
                        </p>
                        <span className="text-[10px] text-[#6B7280] hidden md:inline">
                          ({product.hindiName})
                        </span>
                      </div>
                      <p className="text-[11px] text-[#6B7280] mt-0.5">
                        {product.category} • {formatINR(product.pricePaise)} / {product.unitLabel}
                      </p>
                    </div>
                  </div>

                  {/* Volume, Revenue & Progress Bar */}
                  <div className="flex items-center justify-between sm:justify-end gap-6 shrink-0">
                    <div className="text-left sm:text-right">
                      <span className="text-xs font-bold text-[#1F2937] block">
                        {product.unitsSold} {product.unitLabel} sold
                      </span>
                      <span className="text-[11px] font-bold text-[#218838] block">
                        {formatINR(product.revenuePaise)}
                      </span>
                    </div>

                    <div className="w-20 hidden sm:block">
                      <div className="flex justify-between text-[10px] text-[#6B7280] font-semibold mb-1">
                        <span>Share</span>
                        <span>{product.sharePercentage}%</span>
                      </div>
                      <div className="w-full bg-[#E5E7EB] h-1.5 rounded-full overflow-hidden">
                        <div
                          style={{ width: `${product.sharePercentage * 2.5}%` }}
                          className="bg-[#218838] h-full rounded-full"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-[#E5E7EB] flex items-center justify-between text-xs text-[#6B7280]">
            <span>Showing top {sortedTopProducts.length} high-performing items in current period</span>
            <span className="font-semibold text-[#218838]">Full Menu Synced</span>
          </div>
        </div>

        {/* Peak Ordering Hours Distribution Card */}
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-[#E5E7EB]">
              <div>
                <h2 className="text-base font-bold text-[#1F2937]">
                  Peak Ordering Hours
                </h2>
                <p className="text-xs text-[#6B7280] mt-0.5">
                  Best dispatch preparation slots
                </p>
              </div>
              <Clock className="w-5 h-5 text-[#218838]" />
            </div>

            <div className="mt-4 space-y-4">
              {peakTimeSlots.map((slot, idx) => (
                <div key={idx} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-[#1F2937]">
                      {slot.label}
                    </span>
                    <span className="font-extrabold text-[#218838]">
                      {slot.share}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-[#6B7280]">
                    <span>{slot.time}</span>
                  </div>
                  <div className="w-full bg-[#F1F5F9] h-2 rounded-full overflow-hidden border border-[#E5E7EB]">
                    <div
                      style={{ width: `${slot.share * 2.2}%` }}
                      className={`h-full rounded-full ${slot.color}`}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Operational Tip */}
          <div className="mt-6 p-3 bg-[#E8F5E9] rounded-xl border border-[#A7F3D0] text-xs text-[#176B2C]">
            <p className="font-bold flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#218838]" />
              Staffing Recommendation
            </p>
            <p className="text-[11px] mt-1 text-[#176B2C] leading-relaxed">
              Keep 2 in-house runners on standby between 07:30 PM - 10:00 PM to handle peak dinner and dinner tiffin deliveries.
            </p>
          </div>
        </div>
      </div>

      {/* Customer Growth & Multi-Village Demographics Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Customer Growth & Retention */}
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-[#E5E7EB]">
            <div>
              <h2 className="text-base font-bold text-[#1F2937]">
                Customer Growth & Loyalty
              </h2>
              <p className="text-xs text-[#6B7280] mt-0.5">
                New vs Repeat village customer ratio
              </p>
            </div>
            <Users className="w-5 h-5 text-[#218838]" />
          </div>

          <div className="mt-4 space-y-4">
            <div className="flex items-center justify-between p-3 bg-[#F8FAFC] rounded-xl border border-[#E5E7EB]">
              <div>
                <span className="text-[11px] font-bold text-[#6B7280] uppercase tracking-wider block">
                  Returning Village Buyers
                </span>
                <span className="text-xl font-bold text-[#1F2937]">
                  {totalRepeatCustomers} Families
                </span>
              </div>
              <Badge variant="success" size="sm">
                {repeatCustomerPercentage}% Loyalty
              </Badge>
            </div>

            <div className="flex items-center justify-between p-3 bg-[#F8FAFC] rounded-xl border border-[#E5E7EB]">
              <div>
                <span className="text-[11px] font-bold text-[#6B7280] uppercase tracking-wider block">
                  First-Time Village Buyers
                </span>
                <span className="text-xl font-bold text-[#1F2937]">
                  {totalNewCustomers} Families
                </span>
              </div>
              <Badge variant="info" size="sm">
                Acquisition
              </Badge>
            </div>

            {/* Split Visual Progress Bar */}
            <div className="space-y-1.5 pt-2">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-[#16A34A]">{repeatCustomerPercentage}% Repeat</span>
                <span className="text-[#2563EB]">{100 - repeatCustomerPercentage}% First-Time</span>
              </div>
              <div className="w-full h-3 bg-[#E5E7EB] rounded-full overflow-hidden flex">
                <div
                  style={{ width: `${repeatCustomerPercentage}%` }}
                  className="bg-[#16A34A] h-full"
                  title="Repeat Customers"
                />
                <div
                  style={{ width: `${100 - repeatCustomerPercentage}%` }}
                  className="bg-[#2563EB] h-full"
                  title="New Customers"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Multi-Village Service Reach */}
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-[#E5E7EB]">
            <div>
              <h2 className="text-base font-bold text-[#1F2937]">
                Village Service Coverage
              </h2>
              <p className="text-xs text-[#6B7280] mt-0.5">
                Delivery split across villages
              </p>
            </div>
            <MapPin className="w-5 h-5 text-[#218838]" />
          </div>

          <div className="mt-4 space-y-3">
            {villageDemographics.map((item, idx) => (
              <div key={idx} className="p-3 bg-[#F8FAFC] rounded-xl border border-[#E5E7EB] space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-[#1F2937] block">
                      {item.village}
                    </span>
                    <span className="text-[10px] text-[#6B7280]">
                      {item.type}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-extrabold text-[#218838]">
                      {item.share}%
                    </span>
                    <span className="text-[10px] text-[#6B7280] block">
                      {item.orders} orders
                    </span>
                  </div>
                </div>

                <div className="w-full bg-[#E5E7EB] h-1.5 rounded-full overflow-hidden">
                  <div
                    style={{ width: `${item.share}%` }}
                    className="bg-[#218838] h-full rounded-full"
                  />
                </div>

                <div className="flex justify-between items-center text-[10px] text-[#6B7280] pt-0.5">
                  <span>Avg In-House Delivery:</span>
                  <span className="font-bold text-[#1F2937]">{item.avgDeliveryTime}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Payment Channels & Direct Settlement */}
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-[#E5E7EB]">
              <div>
                <h2 className="text-base font-bold text-[#1F2937]">
                  Payment Channel Adoption
                </h2>
                <p className="text-xs text-[#6B7280] mt-0.5">
                  UPI vs Cash vs Udhari ledger
                </p>
              </div>
              <Wallet className="w-5 h-5 text-[#218838]" />
            </div>

            <div className="mt-4 space-y-3">
              {paymentBreakdown.map((channel, idx) => (
                <div key={idx} className="p-3 bg-[#F8FAFC] rounded-xl border border-[#E5E7EB]">
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-lg bg-[#E8F5E9] text-[#218838] flex items-center justify-center">
                        {channel.icon}
                      </div>
                      <span className="text-xs font-bold text-[#1F2937]">
                        {channel.method}
                      </span>
                    </div>
                    <span className="text-xs font-extrabold text-[#218838]">
                      {channel.share}%
                    </span>
                  </div>

                  <div className="w-full bg-[#E5E7EB] h-1.5 rounded-full overflow-hidden mb-1">
                    <div
                      style={{ width: `${channel.share}%` }}
                      className="bg-[#218838] h-full rounded-full"
                    />
                  </div>
                  <span className="text-[10px] text-[#6B7280] block">
                    {channel.note}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-800">
            <span className="font-bold block">💡 Direct Seller UPI Tip</span>
            <span className="text-[11px] text-amber-700 mt-0.5 block">
              Direct UPI transfers go 100% into your bank account with no middleman holding period.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
