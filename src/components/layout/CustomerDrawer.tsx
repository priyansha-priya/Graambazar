/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { lockBodyScroll } from '../../utils/scrollLock';
import {
  X,
  Home,
  Utensils,
  ShoppingBag,
  ClipboardList,
  BookOpen,
  MapPin,
  Phone,
  ShieldCheck,
  ChevronRight,
  Globe,
  Store,
  Calendar,
  History,
  Menu as MenuIcon,
  ArrowRight,
  CreditCard,
  LayoutGrid,
  Shield,
  SlidersHorizontal,
  Clock,
} from 'lucide-react';
import { useVillage } from '../../contexts/VillageContext';
import { useCart } from '../../contexts/CartContext';
import { useOrders } from '../../contexts/OrderContext';
import { useUdhari } from '../../contexts/UdhariContext';
import { formatINR } from '../../utils/currency';
import { formatDateTime } from '../../utils/dates';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';

interface CustomerDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (
    view: 'MARKETPLACE' | 'CART' | 'CHECKOUT' | 'ORDER_HISTORY' | 'MY_UDHAR',
    category?: 'FOOD' | 'GROCERY'
  ) => void;
  onTrackOrder: (orderId: string) => void;
  onOpenVillageModal: () => void;
  onOpenAllSections?: () => void;
  onSwitchToSeller?: (view: 'DASHBOARD' | 'TERMINAL' | 'INVENTORY') => void;
  onSwitchToAdmin?: () => void;
}

type DrawerTab = 'MENU' | 'ORDER_HISTORY';
type OrderListFilter = 'ALL' | 'ACTIVE' | 'PAST';

export const CustomerDrawer: React.FC<CustomerDrawerProps> = ({
  isOpen,
  onClose,
  onNavigate,
  onTrackOrder,
  onOpenVillageModal,
  onOpenAllSections,
  onSwitchToSeller,
  onSwitchToAdmin,
}) => {
  const { activeVillage, selectedLandmark } = useVillage();
  const { items: cartItems } = useCart();
  const { orders, activeOrders, pastOrders } = useOrders();
  const { getCustomerLedgersGrouped } = useUdhari();

  const [activeTab, setActiveTab] = useState<DrawerTab>('MENU');
  const [orderFilter, setOrderFilter] = useState<OrderListFilter>('ALL');

  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  // Lock body scroll and close drawer cleanly on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const unlockScroll = lockBodyScroll();
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCloseRef.current();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      unlockScroll();
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const sortedOrders = useMemo(() => {
    const source =
      orderFilter === 'ACTIVE'
        ? activeOrders
        : orderFilter === 'PAST'
        ? pastOrders
        : orders;

    return [...source].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [orders, activeOrders, pastOrders, orderFilter]);

  if (!isOpen) return null;

  const customerLedgers = getCustomerLedgersGrouped('user_cust_1');
  const totalCustomerUdharOwed = customerLedgers.reduce(
    (acc, curr) => acc + curr.profile.outstandingBalancePaise,
    0
  );

  const shopMenuItems = [
    {
      label: 'Home & Explore',
      hindiLabel: 'मुख्य पृष्ठ व दुकानें',
      icon: <Home className="w-4 h-4 text-[#218838]" />,
      action: () => onNavigate('MARKETPLACE'),
    },
    {
      label: 'Food Delivery',
      hindiLabel: 'होटल व ढाबा डिलीवरी',
      icon: <Utensils className="w-4 h-4 text-[#D97706]" />,
      action: () => onNavigate('MARKETPLACE', 'FOOD'),
    },
    {
      label: 'Grocery & Essentials',
      hindiLabel: 'किराना व दैनिक सामान',
      icon: <ShoppingBag className="w-4 h-4 text-[#218838]" />,
      action: () => onNavigate('MARKETPLACE', 'GROCERY'),
    },
  ];

  const accountOrderItems = [
    {
      label: 'My Cart',
      hindiLabel: 'मेरी खरीदारी की टोकरी',
      icon: <ShoppingBag className="w-4 h-4 text-[#2563EB]" />,
      badge: cartItems.length > 0 ? `${cartItems.length} items` : undefined,
      action: () => onNavigate('CART'),
    },
    {
      label: 'Checkout & Payment',
      hindiLabel: 'चेकआउट व भुगतान',
      icon: <CreditCard className="w-4 h-4 text-[#176B2C]" />,
      action: () => onNavigate('CHECKOUT'),
    },
    {
      label: 'My Orders & Live Tracking',
      hindiLabel: 'मेरे आर्डर व लाइव ट्रैकिंग',
      icon: <ClipboardList className="w-4 h-4 text-[#176B2C]" />,
      badge: activeOrders.length > 0 ? `${activeOrders.length} active` : undefined,
      badgeColor: 'bg-[#F59E0B] text-white',
      action: () => onNavigate('ORDER_HISTORY'),
    },
    {
      label: 'Mera Udhar Khata',
      hindiLabel: 'दुकानदार क्रेडिट बहीखाता',
      icon: <BookOpen className="w-4 h-4 text-[#D97706]" />,
      badge: totalCustomerUdharOwed > 0 ? formatINR(totalCustomerUdharOwed) : 'Clean',
      badgeColor:
        totalCustomerUdharOwed > 0
          ? 'bg-[#FEE2E2] text-[#DC2626] font-bold'
          : 'bg-[#E8F5E9] text-[#16A34A] font-bold',
      action: () => onNavigate('MY_UDHAR'),
    },
  ];

  const getOrderStatusBadge = (status: string) => {
    if (status === 'completed') {
      return (
        <Badge variant="success" dot size="sm">
          DELIVERED
        </Badge>
      );
    }
    if (status === 'cancelled' || status === 'rejected' || status === 'delivery_failed') {
      return (
        <Badge variant="error" dot size="sm">
          {status.replace(/_/g, ' ').toUpperCase()}
        </Badge>
      );
    }
    return (
      <Badge variant="warning" dot pulsing size="sm">
        {status.replace(/_/g, ' ').toUpperCase()}
      </Badge>
    );
  };

  const drawerMarkup = (
    <div className="fixed inset-0 z-50 flex overflow-hidden" role="dialog" aria-modal="true" aria-label="Customer Menu and Order History">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs animate-fade-in"
        onClick={onClose}
      />

      {/* Drawer Body */}
      <div className="relative w-[340px] sm:w-96 max-w-[90vw] h-full max-h-[100dvh] bg-white shadow-2xl flex flex-col overflow-hidden z-10 animate-slide-right text-left">
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-[#218838] to-[#176B2C] text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-xs flex items-center justify-center font-black text-lg">
              GB
            </div>
            <div>
              <h3 className="font-extrabold text-base tracking-tight leading-none">
                GramBazaar
              </h3>
              <p className="text-[11px] text-white/80 mt-1">Village Food &amp; Grocery</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close drawer"
            className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Current Active Village Ribbon */}
        <div className="px-4 py-2.5 bg-[#F8FAFC] border-b border-[#E5E7EB] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 overflow-hidden">
            <MapPin className="w-4 h-4 text-[#218838] shrink-0" />
            <div className="truncate">
              <p className="text-xs font-bold text-[#1F2937] truncate">{activeVillage.name}</p>
              <p className="text-[10px] text-[#6B7280] truncate">{selectedLandmark}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenVillageModal();
            }}
            className="text-[11px] font-bold text-[#218838] hover:underline shrink-0 cursor-pointer"
          >
            Change
          </button>
        </div>

        {/* Dedicated Drawer Tab Switcher: Menu | Order History */}
        <div
          role="tablist"
          aria-label="Customer drawer sections"
          className="px-3 py-2 bg-white border-b border-[#E5E7EB] shrink-0"
        >
          <div className="grid grid-cols-2 p-1 rounded-full bg-[#F1F5F9] border border-[#E5E7EB]">
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'MENU'}
              onClick={() => setActiveTab('MENU')}
              className={`flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-full text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'MENU'
                  ? 'bg-[#218838] text-white shadow-xs'
                  : 'text-[#6B7280] hover:text-[#1F2937]'
              }`}
            >
              <MenuIcon className="w-3.5 h-3.5 shrink-0" />
              <span>Menu</span>
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'ORDER_HISTORY'}
              onClick={() => setActiveTab('ORDER_HISTORY')}
              className={`flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-full text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'ORDER_HISTORY'
                  ? 'bg-[#218838] text-white shadow-xs'
                  : 'text-[#6B7280] hover:text-[#1F2937]'
              }`}
            >
              <History className="w-3.5 h-3.5 shrink-0" />
              <span>Order History</span>
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded-full font-extrabold leading-none ${
                  activeTab === 'ORDER_HISTORY'
                    ? 'bg-white/20 text-white'
                    : 'bg-[#E2E8F0] text-[#1F2937]'
                }`}
              >
                {orders.length}
              </span>
            </button>
          </div>
        </div>

        {/* Tab Panel Body */}
        {activeTab === 'MENU' ? (
          <div role="tabpanel" className="flex-1 min-h-0 overflow-y-auto overscroll-contain modal-scroll p-3 space-y-4">
            {/* Browse All Sections CTA */}
            {onOpenAllSections && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenAllSections();
                }}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-[#E8F5E9] hover:bg-[#DCFCE7] border border-[#218838]/30 transition-colors cursor-pointer text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#218838] text-white flex items-center justify-center shrink-0">
                    <LayoutGrid className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-[#176B2C]">All Sections Menu</p>
                    <p className="text-[10px] text-[#166534]">
                      Customer, Seller, Admin &amp; Product Masters
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-[#218838]" />
              </button>
            )}

            {/* Section 1: Marketplace */}
            <div className="space-y-1">
              <p className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-[#6B7280]">
                Shop &amp; Explore
              </p>
              {shopMenuItems.map((item, idx) => (
                <button
                  type="button"
                  key={idx}
                  onClick={() => {
                    item.action();
                    onClose();
                  }}
                  className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-[#F8FAFC] transition-colors cursor-pointer text-left group border border-transparent hover:border-[#E5E7EB]"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[#F8FAFC] group-hover:bg-white flex items-center justify-center border border-[#E5E7EB] transition-colors">
                      {item.icon}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-[#1F2937]">{item.label}</p>
                      <p className="text-[10px] text-[#6B7280]">{item.hindiLabel}</p>
                    </div>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-[#6B7280]" />
                </button>
              ))}
            </div>

            {/* Section 2: Cart, Orders & Credit */}
            <div className="space-y-1 pt-2 border-t border-[#E5E7EB]">
              <p className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-[#6B7280]">
                Cart, Orders &amp; Credit
              </p>
              {accountOrderItems.map((item, idx) => (
                <button
                  type="button"
                  key={idx}
                  onClick={() => {
                    item.action();
                    onClose();
                  }}
                  className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-[#F8FAFC] transition-colors cursor-pointer text-left group border border-transparent hover:border-[#E5E7EB]"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[#F8FAFC] group-hover:bg-white flex items-center justify-center border border-[#E5E7EB] transition-colors">
                      {item.icon}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-[#1F2937]">{item.label}</p>
                      <p className="text-[10px] text-[#6B7280]">{item.hindiLabel}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {item.badge && (
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-semibold tabular-nums ${
                          item.badgeColor || 'bg-[#E8F5E9] text-[#16A34A]'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                    <ChevronRight className="w-3.5 h-3.5 text-[#6B7280]" />
                  </div>
                </button>
              ))}
            </div>

            {/* Section 3: Seller & Admin Portals Quick Switch */}
            {(onSwitchToSeller || onSwitchToAdmin) && (
              <div className="space-y-1 pt-2 border-t border-[#E5E7EB]">
                <p className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-[#6B7280]">
                  Seller &amp; Admin Portals
                </p>
                {onSwitchToSeller && (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        onSwitchToSeller('DASHBOARD');
                        onClose();
                      }}
                      className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-[#F8FAFC] transition-colors cursor-pointer text-left border border-transparent hover:border-[#E5E7EB]"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-[#F8FAFC] flex items-center justify-center border border-[#E5E7EB]">
                          <Store className="w-4 h-4 text-[#1F2937]" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-[#1F2937]">Seller Dashboard</p>
                          <p className="text-[10px] text-[#6B7280]">Manage shop orders &amp; analytics</p>
                        </div>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-[#6B7280]" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        onSwitchToSeller('TERMINAL');
                        onClose();
                      }}
                      className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-[#F8FAFC] transition-colors cursor-pointer text-left border border-transparent hover:border-[#E5E7EB]"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-[#F8FAFC] flex items-center justify-center border border-[#E5E7EB]">
                          <Clock className="w-4 h-4 text-[#DC2626]" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-[#1F2937]">Seller Live Orders</p>
                          <p className="text-[10px] text-[#6B7280]">Kitchen &amp; packing terminal</p>
                        </div>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-[#6B7280]" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        onSwitchToSeller('INVENTORY');
                        onClose();
                      }}
                      className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-[#F8FAFC] transition-colors cursor-pointer text-left border border-transparent hover:border-[#E5E7EB]"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-[#F8FAFC] flex items-center justify-center border border-[#E5E7EB]">
                          <SlidersHorizontal className="w-4 h-4 text-[#218838]" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-[#1F2937]">Seller Inventory &amp; Stock</p>
                          <p className="text-[10px] text-[#6B7280]">Bulk price, stock &amp; status editor</p>
                        </div>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-[#6B7280]" />
                    </button>
                  </>
                )}
                {onSwitchToAdmin && (
                  <button
                    type="button"
                    onClick={() => {
                      onSwitchToAdmin();
                      onClose();
                    }}
                    className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-[#F8FAFC] transition-colors cursor-pointer text-left border border-transparent hover:border-[#E5E7EB]"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-[#F8FAFC] flex items-center justify-center border border-[#E5E7EB]">
                        <Shield className="w-4 h-4 text-[#218838]" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-[#1F2937]">Admin Governance Suite</p>
                        <p className="text-[10px] text-[#6B7280]">Masters, KYC, payouts &amp; audits</p>
                      </div>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-[#6B7280]" />
                  </button>
                )}
              </div>
            )}

            {/* Quick Help Section */}
            <div className="pt-3 border-t border-[#E5E7EB] space-y-1">
              <p className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-[#6B7280]">
                Support &amp; Trust
              </p>

              <div className="p-3 bg-[#F8FAFC] rounded-xl border border-[#E5E7EB] space-y-2">
                <div className="flex items-center gap-2 text-xs font-semibold text-[#1F2937]">
                  <ShieldCheck className="w-4 h-4 text-[#218838]" />
                  <span>Local Village Trust Guarantee</span>
                </div>
                <p className="text-[11px] text-[#6B7280] leading-relaxed">
                  Direct village delivery by shop&apos;s runners. Cash on Delivery and Direct UPI supported.
                </p>
                <div className="flex items-center gap-2 pt-1 text-[11px] text-[#218838] font-bold">
                  <Phone className="w-3.5 h-3.5" />
                  <span>Helpline: +91 98111 22233</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* DEDICATED ORDER HISTORY SCROLLABLE LIST VIEW */
          <div role="tabpanel" className="flex-1 flex flex-col min-h-0 bg-[#F8FAFC]">
            {/* Sub-filter Pills + Full Page Shortcut */}
            <div className="px-3 py-2.5 bg-white border-b border-[#E5E7EB] space-y-2 shrink-0">
              <div className="flex items-center justify-between gap-2">
                <p className="text-[11px] font-bold uppercase tracking-wider text-[#6B7280]">
                  Your Orders ({sortedOrders.length})
                </p>
                <button
                  type="button"
                  onClick={() => {
                    onNavigate('ORDER_HISTORY');
                    onClose();
                  }}
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-[#218838] hover:text-[#176B2C] hover:underline cursor-pointer"
                >
                  <span>Full Order Page</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>

              <div className="flex items-center gap-1.5">
                {(
                  [
                    { key: 'ALL', label: `All (${orders.length})` },
                    { key: 'ACTIVE', label: `Active (${activeOrders.length})` },
                    { key: 'PAST', label: `Past (${pastOrders.length})` },
                  ] as const
                ).map((pill) => (
                  <button
                    key={pill.key}
                    type="button"
                    onClick={() => setOrderFilter(pill.key)}
                    className={`px-2.5 py-1 rounded-full text-[11px] font-semibold transition-colors cursor-pointer ${
                      orderFilter === pill.key
                        ? 'bg-[#E8F5E9] text-[#176B2C] border border-[#218838]/30 font-bold'
                        : 'bg-[#F1F5F9] text-[#6B7280] hover:text-[#1F2937] border border-transparent'
                    }`}
                  >
                    {pill.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Scrollable Orders List */}
            <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain modal-scroll p-3 space-y-2.5">
              {sortedOrders.length === 0 ? (
                <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 text-center space-y-2.5 mt-4">
                  <div className="w-11 h-11 rounded-full bg-[#F1F5F9] text-[#6B7280] flex items-center justify-center mx-auto">
                    <ClipboardList className="w-5 h-5" />
                  </div>
                  <p className="text-sm font-bold text-[#1F2937]">
                    {orderFilter === 'PAST'
                      ? 'No Past Orders Yet'
                      : orderFilter === 'ACTIVE'
                      ? 'No Active Orders Right Now'
                      : 'No Orders Yet'}
                  </p>
                  <p className="text-xs text-[#6B7280] leading-relaxed">
                    Explore nearby village kitchens and kirana shops to place your order.
                  </p>
                  <div className="pt-1">
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => {
                        onNavigate('MARKETPLACE');
                        onClose();
                      }}
                    >
                      Explore Shops
                    </Button>
                  </div>
                </div>
              ) : (
                sortedOrders.map((order) => {
                  const totalUnits = order.items.reduce(
                    (sum, item) => sum + item.requestedQuantity,
                    0
                  );
                  const previewItems = order.items
                    .slice(0, 2)
                    .map((i) => `${i.productName} ×${i.requestedQuantity}`)
                    .join(', ');
                  const extraCount = order.items.length - 2;

                  return (
                    <button
                      key={order.id}
                      type="button"
                      onClick={() => {
                        onTrackOrder(order.id);
                        onClose();
                      }}
                      className="w-full bg-white rounded-xl border border-[#E5E7EB] hover:border-[#218838] hover:shadow-sm p-3 text-left transition-all cursor-pointer group space-y-2"
                    >
                      {/* Top Row: Order Number + Status Badge */}
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono text-[11px] font-bold text-[#1F2937] bg-[#F1F5F9] px-2 py-0.5 rounded-md">
                          {order.orderNumber}
                        </span>
                        {getOrderStatusBadge(order.status)}
                      </div>

                      {/* Middle Row: Shop Name & Items Preview */}
                      <div className="space-y-0.5">
                        <p className="text-xs font-bold text-[#1F2937] group-hover:text-[#176B2C] flex items-center gap-1.5 truncate">
                          <Store className="w-3.5 h-3.5 text-[#218838] shrink-0" />
                          <span className="truncate">{order.sellerName}</span>
                        </p>
                        <p className="text-[11px] text-[#6B7280] truncate">
                          {previewItems}
                          {extraCount > 0 ? ` +${extraCount} more` : ''} ({totalUnits}{' '}
                          {totalUnits === 1 ? 'item' : 'items'})
                        </p>
                      </div>

                      {/* Bottom Row: Date, Amount & Track Link */}
                      <div className="pt-2 border-t border-[#F1F5F9] flex items-center justify-between gap-2 text-[11px]">
                        <div className="min-w-0">
                          <p className="text-[#6B7280] flex items-center gap-1 truncate">
                            <Calendar className="w-3 h-3 shrink-0" />
                            <span className="truncate">{formatDateTime(order.createdAt)}</span>
                          </p>
                          <p className="text-[10px] text-[#6B7280] flex items-center gap-1 mt-0.5">
                            <CreditCard className="w-3 h-3 shrink-0" />
                            <span>{order.paymentMethod}</span>
                          </p>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className="text-xs font-extrabold text-[#176B2C] tabular-nums">
                            {formatINR(order.totalPaise)}
                          </span>
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-[#E8F5E9] text-[#218838] group-hover:bg-[#218838] group-hover:text-white transition-colors">
                            <ChevronRight className="w-3.5 h-3.5" />
                          </span>
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="px-4 py-3 border-t border-[#E5E7EB] bg-[#F8FAFC] text-[11px] text-[#6B7280] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-1.5">
            <Globe className="w-3.5 h-3.5 text-[#218838]" />
            <span className="font-semibold text-[#1F2937]">हिन्दी / English</span>
          </div>
          <span className="font-mono text-[10px]">GramBazaar</span>
        </div>
      </div>
    </div>
  );

  if (typeof document === 'undefined') return drawerMarkup;
  return createPortal(drawerMarkup, document.body);
};
