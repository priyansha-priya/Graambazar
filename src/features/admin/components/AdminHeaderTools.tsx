import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  Bell,
  Headphones,
  Package,
  Search,
  Star,
  Store,
  UserCheck,
  Users,
  Wallet,
  X,
} from 'lucide-react';
import { useAdmin } from '../../../contexts/AdminContext';
import { useOrders } from '../../../contexts/OrderContext';
import { AdminViewType } from '../../../components/layout/AdminSidebar';

interface AdminHeaderToolsProps {
  onSelectView: (view: AdminViewType) => void;
}

interface QuickResult {
  id: string;
  category: string;
  title: string;
  subtitle: string;
  targetView: AdminViewType;
}

export const AdminHeaderTools: React.FC<AdminHeaderToolsProps> = ({ onSelectView }) => {
  const {
    sellers,
    customers,
    products,
    serviceAreas,
    pendingApplicationsCount,
    pendingProductsCount,
    openSupportCasesCount,
    pendingPayoutsCount,
    flaggedReviewsCount,
    hasPermission,
  } = useAdmin();
  const { orders } = useOrders();

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [isBellOpen, setIsBellOpen] = useState(false);
  const bellRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      } else if (e.key === 'Escape') {
        setIsSearchOpen(false);
        setIsBellOpen(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  useEffect(() => {
    if (!isBellOpen) return;
    const onClickOutside = (e: MouseEvent) => {
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) {
        setIsBellOpen(false);
      }
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, [isBellOpen]);

  const alerts = [
    {
      id: 'kyc',
      count: pendingApplicationsCount,
      title: `${pendingApplicationsCount} Seller KYC Application(s) Pending`,
      subtitle: 'Review documents & approve new local shops',
      view: 'APPLICATIONS' as AdminViewType,
      icon: <UserCheck className="w-4 h-4 text-[#DC2626]" />,
    },
    {
      id: 'products',
      count: pendingProductsCount,
      title: `${pendingProductsCount} Product SKU(s) Awaiting Moderation`,
      subtitle: 'Verify pricing, attributes & catalog quality',
      view: 'PRODUCTS' as AdminViewType,
      icon: <Package className="w-4 h-4 text-[#D97706]" />,
    },
    {
      id: 'support',
      count: openSupportCasesCount,
      title: `${openSupportCasesCount} Open Support Dispute(s)`,
      subtitle: 'Resolve buyer complaints & refund requests',
      view: 'SUPPORT' as AdminViewType,
      icon: <Headphones className="w-4 h-4 text-[#D97706]" />,
    },
    {
      id: 'payouts',
      count: pendingPayoutsCount,
      title: `${pendingPayoutsCount} Seller Payout Batch(es) Due`,
      subtitle: 'Verify settlements and record bank UTRs',
      view: 'PAYOUTS' as AdminViewType,
      icon: <Wallet className="w-4 h-4 text-[#2563EB]" />,
    },
    {
      id: 'reviews',
      count: flaggedReviewsCount,
      title: `${flaggedReviewsCount} Flagged Customer Review(s)`,
      subtitle: 'Moderate spam or low-rating quality alerts',
      view: 'REVIEWS' as AdminViewType,
      icon: <Star className="w-4 h-4 text-[#D97706]" />,
    },
  ].filter((a) => a.count > 0 && hasPermission(a.view, 'view'));

  const totalAlerts = alerts.reduce((sum, a) => sum + a.count, 0);

  const searchResults = useMemo<QuickResult[]>(() => {
    const q = query.trim().toLowerCase();
    const results: QuickResult[] = [];

    if (!q) {
      const quickJumps: QuickResult[] = [
        { id: 'nav_customers', category: 'Quick Jump', title: 'Customers Management', subtitle: `${customers.length} registered village buyers`, targetView: 'CUSTOMERS' },
        { id: 'nav_payouts', category: 'Quick Jump', title: 'Payments & Seller Payouts', subtitle: `${pendingPayoutsCount} pending settlement batches`, targetView: 'PAYOUTS' },
        { id: 'nav_analytics', category: 'Quick Jump', title: 'Reports & Analytics', subtitle: 'GMV trends, payment mix & village growth', targetView: 'ANALYTICS' },
        { id: 'nav_banners', category: 'Quick Jump', title: 'Home Banners & CMS', subtitle: 'Manage hero promos, featured shops & policies', targetView: 'CMS_BANNERS' },
      ];
      return quickJumps.filter((r) => hasPermission(r.targetView, 'view'));
    }

    sellers.forEach((s) => {
      if (s.name.toLowerCase().includes(q) || s.villageName.toLowerCase().includes(q) || s.phone.includes(q)) {
        results.push({
          id: `sel_${s.id}`,
          category: 'Seller',
          title: s.name,
          subtitle: `${s.villageName} • ${s.status}`,
          targetView: 'SELLERS',
        });
      }
    });

    customers.forEach((c) => {
      if (c.name.toLowerCase().includes(q) || c.phone.includes(q) || c.villageName.toLowerCase().includes(q)) {
        results.push({
          id: `cust_${c.id}`,
          category: 'Customer',
          title: c.name,
          subtitle: `${c.phone} • ${c.villageName}`,
          targetView: 'CUSTOMERS',
        });
      }
    });

    orders.forEach((o) => {
      if (o.id.toLowerCase().includes(q) || o.sellerName.toLowerCase().includes(q)) {
        results.push({
          id: `ord_${o.id}`,
          category: 'Order',
          title: o.id,
          subtitle: `${o.sellerName} • ${o.status}`,
          targetView: 'ORDERS',
        });
      }
    });

    products.forEach((p) => {
      if (p.name.toLowerCase().includes(q) || p.sellerName.toLowerCase().includes(q)) {
        results.push({
          id: `prod_${p.id}`,
          category: 'Product',
          title: p.name,
          subtitle: `${p.sellerName} • ${p.vertical}`,
          targetView: 'PRODUCTS',
        });
      }
    });

    serviceAreas.forEach((v) => {
      if (v.name.toLowerCase().includes(q) || v.postalCode.includes(q)) {
        results.push({
          id: `vil_${v.id}`,
          category: 'Village',
          title: v.name,
          subtitle: `PIN ${v.postalCode} • ${v.district}`,
          targetView: 'SERVICE_AREAS',
        });
      }
    });

    return results.filter((r) => hasPermission(r.targetView, 'view')).slice(0, 10);
  }, [query, sellers, customers, orders, products, serviceAreas, pendingPayoutsCount, hasPermission]);

  return (
    <>
      {/* Global Quick Search Trigger */}
      <button
        type="button"
        onClick={() => setIsSearchOpen(true)}
        className="flex items-center gap-2 px-2.5 sm:px-3 py-1.5 rounded-full text-xs font-medium bg-[#F8FAFC] hover:bg-[#F1F5F9] text-[#475569] border border-[#E5E7EB] transition-colors cursor-pointer"
        title="Global Admin Search (Ctrl+K)"
      >
        <Search className="w-3.5 h-3.5 text-[#218838]" />
        <span className="hidden lg:inline">Quick Search...</span>
        <kbd className="hidden xl:inline-block px-1.5 py-0.5 text-[10px] font-semibold bg-white border border-[#E5E7EB] rounded text-[#6B7280]">
          ⌘K
        </kbd>
      </button>

      {/* Unified Notification Bell Dropdown */}
      <div ref={bellRef} className="relative">
        <button
          type="button"
          onClick={() => setIsBellOpen((prev) => !prev)}
          aria-label="Admin notifications"
          className="relative w-9 h-9 rounded-full bg-white hover:bg-[#F8FAFC] border border-[#E5E7EB] flex items-center justify-center text-[#475569] transition-colors cursor-pointer"
        >
          <Bell className="w-4 h-4" />
          {totalAlerts > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-[#DC2626] text-white text-[10px] font-bold flex items-center justify-center">
              {totalAlerts}
            </span>
          )}
        </button>

        {isBellOpen && (
          <div className="absolute right-0 mt-2 w-80 bg-white border border-[#E5E7EB] rounded-2xl shadow-xl overflow-hidden z-50 animate-fade-in text-left">
            <div className="px-4 py-3 bg-[#F8FAFC] border-b border-[#E5E7EB] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-[#D97706]" />
                <span className="text-xs font-bold text-[#1F2937]">Admin Action Queue</span>
              </div>
              <span className="text-[11px] font-semibold text-[#6B7280]">{totalAlerts} pending</span>
            </div>

            <div className="p-2 max-h-80 overflow-y-auto divide-y divide-[#F1F5F9]">
              {alerts.length === 0 ? (
                <p className="p-4 text-xs text-center text-[#6B7280]">
                  All clear — no pending operational alerts.
                </p>
              ) : (
                alerts.map((alert) => (
                  <button
                    key={alert.id}
                    type="button"
                    onClick={() => {
                      setIsBellOpen(false);
                      onSelectView(alert.view);
                    }}
                    className="w-full flex items-start gap-3 p-2.5 rounded-xl hover:bg-[#F8FAFC] transition-colors cursor-pointer text-left"
                  >
                    <div className="w-8 h-8 rounded-lg bg-[#F8FAFC] border border-[#E5E7EB] flex items-center justify-center shrink-0">
                      {alert.icon}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-[#1F2937]">{alert.title}</p>
                      <p className="text-[11px] text-[#6B7280]">{alert.subtitle}</p>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-[#9CA3AF] mt-1 shrink-0" />
                  </button>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* Global Search Modal */}
      {isSearchOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 px-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white rounded-2xl border border-[#E5E7EB] shadow-2xl overflow-hidden animate-fade-in text-left">
            <div className="flex items-center gap-2.5 px-4 py-3 border-b border-[#E5E7EB]">
              <Search className="w-4 h-4 text-[#218838] shrink-0" />
              <input
                type="text"
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search sellers, customers, order IDs, products, or villages..."
                className="flex-1 text-sm text-[#1F2937] placeholder-[#9CA3AF] outline-none bg-transparent"
              />
              <button
                type="button"
                onClick={() => setIsSearchOpen(false)}
                className="p-1 text-[#6B7280] hover:text-[#1F2937] rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="max-h-80 overflow-y-auto p-2 space-y-1">
              {searchResults.length === 0 ? (
                <p className="p-6 text-xs text-center text-[#6B7280]">
                  No matching sellers, customers, orders, or products found for &ldquo;{query}&rdquo;.
                </p>
              ) : (
                searchResults.map((res) => (
                  <button
                    key={res.id}
                    type="button"
                    onClick={() => {
                      setIsSearchOpen(false);
                      setQuery('');
                      onSelectView(res.targetView);
                    }}
                    className="w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl hover:bg-[#F8FAFC] transition-colors cursor-pointer text-left"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="w-7 h-7 rounded-lg bg-[#E8F5E9] text-[#176B2C] flex items-center justify-center shrink-0">
                        {res.category === 'Seller' ? (
                          <Store className="w-3.5 h-3.5" />
                        ) : res.category === 'Customer' ? (
                          <Users className="w-3.5 h-3.5" />
                        ) : (
                          <Search className="w-3.5 h-3.5" />
                        )}
                      </span>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-[#1F2937] truncate">{res.title}</p>
                        <p className="text-[11px] text-[#6B7280] truncate">{res.subtitle}</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-[#6B7280] shrink-0">
                      {res.category}
                    </span>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
