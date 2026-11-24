/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  LayoutDashboard,
  Clock,
  Truck,
  BookOpen,
  UtensilsCrossed,
  SlidersHorizontal,
  Settings,
  ChevronLeft,
  ChevronRight,
  Store,
  Power,
  Volume2,
  VolumeX,
  BarChart3,
  ShieldCheck,
  Database,
  LayoutGrid,
} from 'lucide-react';
import { useSeller } from '../../contexts/SellerContext';
import { useOrders } from '../../contexts/OrderContext';
import { useSafety } from '../../contexts/SafetyContext';

export type SellerViewType =
  | 'DASHBOARD'
  | 'ANALYTICS'
  | 'TERMINAL'
  | 'DISPATCH'
  | 'CATALOG'
  | 'MASTERS'
  | 'INVENTORY'
  | 'UDHARI'
  | 'SAFETY_QUALITY'
  | 'SETTINGS';

interface SellerSidebarProps {
  currentView: SellerViewType;
  onSelectView: (view: SellerViewType) => void;
  onOpenAllSections?: () => void;
  isMobileOpen?: boolean;
  onMobileClose?: () => void;
}

interface SellerMenuItem {
  id: SellerViewType;
  label: string;
  hindiLabel: string;
  icon: React.ReactNode;
  badge?: number;
  badgeVariant?: 'danger' | 'warning' | 'primary';
}

interface SellerMenuGroup {
  groupName: string;
  items: SellerMenuItem[];
}

export const SellerSidebar: React.FC<SellerSidebarProps> = ({
  currentView,
  onSelectView,
  onOpenAllSections,
  isMobileOpen = false,
  onMobileClose,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { activeSeller, toggleShopOpenState, isBuzzerEnabled, toggleBuzzer } = useSeller();
  const { orders } = useOrders();
  const { getSellerMetrics } = useSafety();

  const isStoreOpen = activeSeller.isOpenNow && !activeSeller.isPaused;
  const safetyMetrics = getSellerMetrics(activeSeller.id);

  const pendingCount = orders.filter(
    (o) => o.sellerId === activeSeller.id && ['placed', 'accepted', 'preparing'].includes(o.status)
  ).length;

  const menuGroups: SellerMenuGroup[] = [
    {
      groupName: 'Overview & Insights',
      items: [
        {
          id: 'DASHBOARD',
          label: 'Store Dashboard',
          hindiLabel: 'दुकान डैशबोर्ड',
          icon: <LayoutDashboard className="w-4 h-4 shrink-0" />,
        },
        {
          id: 'ANALYTICS',
          label: 'Store Analytics',
          hindiLabel: 'दुकान एनालिटिक्स व रिपोर्ट',
          icon: <BarChart3 className="w-4 h-4 shrink-0" />,
        },
      ],
    },
    {
      groupName: 'Orders & Fulfillment',
      items: [
        {
          id: 'TERMINAL',
          label: 'Live Orders Queue',
          hindiLabel: 'लाइव आर्डर टर्मिनल',
          icon: <Clock className="w-4 h-4 shrink-0" />,
          badge: pendingCount,
          badgeVariant: 'danger',
        },
        {
          id: 'DISPATCH',
          label: 'In-House Delivery Fleet',
          hindiLabel: 'डिलीवरी रनर व डिस्पैच',
          icon: <Truck className="w-4 h-4 shrink-0" />,
        },
      ],
    },
    {
      groupName: 'Catalog & Inventory',
      items: [
        {
          id: 'CATALOG',
          label: 'Menu & Products',
          hindiLabel: 'मेन्यू व प्रोडक्ट जोड़ें',
          icon: <UtensilsCrossed className="w-4 h-4 shrink-0" />,
        },
        {
          id: 'MASTERS',
          label: 'Product Masters (8)',
          hindiLabel: 'कैटेगरी, ब्रांड, यूनिट व पैकिंग मास्टर',
          icon: <Database className="w-4 h-4 shrink-0" />,
        },
        {
          id: 'INVENTORY',
          label: 'Inventory & Stock',
          hindiLabel: 'इन्वेंटरी, स्टॉक व बल्क अपडेट',
          icon: <SlidersHorizontal className="w-4 h-4 shrink-0" />,
        },
      ],
    },
    {
      groupName: 'Finance & Compliance',
      items: [
        {
          id: 'UDHARI',
          label: 'Customer Udhari Khata',
          hindiLabel: 'उधार खाता (क्रेडिट बहीखाता)',
          icon: <BookOpen className="w-4 h-4 shrink-0" />,
        },
        {
          id: 'SAFETY_QUALITY',
          label: 'Safety, Quality & Exam',
          hindiLabel: 'सुरक्षा, गुणवत्ता व परीक्षा',
          icon: <ShieldCheck className="w-4 h-4 shrink-0" />,
          badge: safetyMetrics.badgeLevel === 'ACTION_REQUIRED' ? 1 : undefined,
          badgeVariant: 'danger',
        },
        {
          id: 'SETTINGS',
          label: 'Store Settings & UPI',
          hindiLabel: 'दुकान सेटिंग्स व UPI QR',
          icon: <Settings className="w-4 h-4 shrink-0" />,
        },
      ],
    },
  ];

  const sidebarContent = (
    <div className="flex flex-col h-full bg-slate-900 text-slate-300 border-r border-slate-800">
      {/* Sidebar Header */}
      <div className="h-16 px-4 flex items-center justify-between border-b border-slate-800 shrink-0">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="w-9 h-9 rounded-xl bg-[#218838] text-white flex items-center justify-center font-black text-sm shadow-md shrink-0">
            <Store className="w-5 h-5" />
          </div>
          {!isCollapsed && (
            <div className="truncate text-left">
              <h2 className="font-extrabold text-white text-xs truncate">
                {activeSeller.publicName}
              </h2>
              <span className="text-[10px] font-semibold text-[#86EFAC] block">
                {activeSeller.primaryVertical === 'FOOD' ? 'Restaurant & Dhaba' : 'Kirana & Essentials'}
              </span>
            </div>
          )}
        </div>

        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="hidden md:flex w-7 h-7 rounded-lg bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 items-center justify-center transition-colors cursor-pointer"
          title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Store Status Quick Toggle */}
      {!isCollapsed ? (
        <div className="p-3 bg-slate-950/50 border-b border-slate-800/80">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  isStoreOpen ? 'bg-[#16A34A] animate-pulse' : 'bg-red-500'
                }`}
              />
              <span className="text-xs font-bold text-white">
                {isStoreOpen ? 'Accepting Orders' : 'Store Paused'}
              </span>
            </div>
            <button
              onClick={toggleShopOpenState}
              className={`p-1.5 rounded-full transition-colors cursor-pointer ${
                isStoreOpen ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30' : 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
              }`}
              title={isStoreOpen ? 'Pause Store' : 'Open Store'}
            >
              <Power className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-800 text-[11px] text-slate-400">
            <span>Audio Buzzer</span>
            <button
              onClick={toggleBuzzer}
              className="flex items-center gap-1 text-xs text-slate-300 hover:text-white cursor-pointer"
            >
              {isBuzzerEnabled ? (
                <>
                  <Volume2 className="w-3.5 h-3.5 text-green-400" />
                  <span className="text-green-400 font-semibold">ON</span>
                </>
              ) : (
                <>
                  <VolumeX className="w-3.5 h-3.5 text-slate-500" />
                  <span className="text-slate-500">Muted</span>
                </>
              )}
            </button>
          </div>
        </div>
      ) : null}

      {/* Navigation Menu List (Grouped by Section) */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-4 scrollbar-thin scrollbar-thumb-slate-700">
        {menuGroups.map((group) => (
          <div key={group.groupName} className="space-y-1">
            {!isCollapsed ? (
              <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1 text-left">
                {group.groupName}
              </p>
            ) : (
              <div className="h-1 border-t border-slate-800 my-1.5" />
            )}

            {group.items.map((item) => {
              const isActive = currentView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onSelectView(item.id);
                    if (onMobileClose) onMobileClose();
                  }}
                  title={isCollapsed ? item.label : undefined}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer text-left relative ${
                    isActive
                      ? 'bg-[#218838] text-white shadow-md font-bold'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                  } ${isCollapsed ? 'justify-center px-2' : ''}`}
                >
                  <span className={`${isActive ? 'text-white' : 'text-slate-400'}`}>
                    {item.icon}
                  </span>

                  {!isCollapsed && (
                    <div className="flex-1 truncate">
                      <span className="block truncate">{item.label}</span>
                      <span
                        className={`text-[10px] block truncate font-normal ${
                          isActive ? 'text-white/80' : 'text-slate-400'
                        }`}
                      >
                        {item.hindiLabel}
                      </span>
                    </div>
                  )}

                  {item.badge !== undefined && item.badge > 0 && (
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0 tabular-nums ${
                        item.badgeVariant === 'danger'
                          ? 'bg-rose-500 text-white'
                          : 'bg-emerald-500 text-white'
                      } ${isCollapsed ? 'absolute -top-1 -right-1 ring-2 ring-slate-900' : ''}`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {/* Footer Info & All Sections Shortcut */}
      <div className="p-3 border-t border-slate-800 bg-slate-950/40 space-y-2 shrink-0">
        {onOpenAllSections && (
          <button
            type="button"
            onClick={() => {
              if (onMobileClose) onMobileClose();
              onOpenAllSections();
            }}
            title="All Sections Menu"
            className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-semibold transition-colors cursor-pointer ${
              isCollapsed ? 'justify-center px-2' : ''
            }`}
          >
            <LayoutGrid className="w-4 h-4 text-emerald-400 shrink-0" />
            {!isCollapsed && <span className="truncate">All Sections Menu</span>}
          </button>
        )}

        {!isCollapsed && (
          <div className="text-[11px] text-slate-400 text-left px-1">
            <p className="font-semibold text-slate-300">Seller-Managed Delivery</p>
            <p className="text-[10px] text-slate-400 mt-0.5">In-house runners &amp; Udhari at seller risk.</p>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside
        className={`hidden md:block transition-all duration-200 shrink-0 select-none ${
          isCollapsed ? 'w-18' : 'w-64'
        }`}
      >
        <div className="sticky top-16 h-[calc(100vh-4rem)]">
          {sidebarContent}
        </div>
      </aside>

      {/* Mobile Drawer Overlay */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
            onClick={onMobileClose}
          />
          <div className="relative w-72 max-w-[85vw] h-full shadow-2xl z-10 animate-slide-right">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
