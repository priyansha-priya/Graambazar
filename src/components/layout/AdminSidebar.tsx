/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { lockBodyScroll } from '../../utils/scrollLock';
import {
  LayoutDashboard,
  UserCheck,
  Store,
  Layers,
  MapPin,
  Percent,
  ClipboardList,
  History,
  Grid3X3,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ShieldCheck,
  Building2,
  Headphones,
  Sliders,
  Package,
  Tag,
  BookOpen,
  Users,
  Settings,
  Database,
  Award,
  Scale,
  Boxes,
  ListPlus,
  PackageCheck,
  Clock,
  BarChart3,
  UserRound,
  Wallet,
  Image as ImageIcon,
  Star,
  Megaphone,
  Receipt,
  Bike,
  LayoutGrid,
} from 'lucide-react';
import { useAdmin } from '../../contexts/AdminContext';
import { useSafety } from '../../contexts/SafetyContext';
import { MOCK_SELLERS } from '../../constants/mockData';
import { AdminModuleKey, AdminRole } from '../../types/admin';

export type AdminViewType = AdminModuleKey;

export const MASTER_VIEW_KEYS: AdminViewType[] = [
  'MASTER_CATEGORIES',
  'MASTER_BRANDS',
  'MASTER_UNITS',
  'MASTER_ATTRIBUTES',
  'MASTER_VARIANTS',
  'MASTER_ADDONS',
  'MASTER_PACKAGING',
  'MASTER_AVAILABILITY',
];

interface AdminSidebarProps {
  currentView: AdminViewType;
  onSelectView: (view: AdminViewType) => void;
  onOpenAllSections?: () => void;
  isMobileOpen?: boolean;
  onMobileClose?: () => void;
}

interface MenuItem {
  id: AdminViewType;
  label: string;
  hindiLabel?: string;
  icon: React.ReactNode;
  badge?: number;
  badgeVariant?: 'danger' | 'warning' | 'primary';
}

interface MenuGroup {
  groupName: string;
  items: MenuItem[];
  hasMastersSubmenu?: boolean;
}

const ROLE_DISPLAY_LABELS: Record<AdminRole, string> = {
  SUPER_ADMIN: 'Super Admin',
  ADMIN_OPS: 'Operations Admin',
  ADMIN_FINANCE: 'Finance Admin',
  ADMIN_SUPPORT: 'Support Admin',
};

const getInitials = (name: string): string => {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'AD';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
};

export const AdminSidebar: React.FC<AdminSidebarProps> = ({
  currentView,
  onSelectView,
  onOpenAllSections,
  isMobileOpen = false,
  onMobileClose,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMastersOpen, setIsMastersOpen] = useState(true);
  const {
    currentAdmin,
    pendingApplicationsCount,
    pendingProductsCount,
    openSupportCasesCount,
    pendingPayoutsCount,
    flaggedReviewsCount,
    hasPermission,
  } = useAdmin();
  const { getSellerMetrics } = useSafety();

  const safetyActionCount = MOCK_SELLERS.filter(
    (s) => getSellerMetrics(s.id).badgeLevel === 'ACTION_REQUIRED'
  ).length;

  const isAnyMasterActive = MASTER_VIEW_KEYS.includes(currentView);

  useEffect(() => {
    if (!isMobileOpen) return;
    return lockBodyScroll();
  }, [isMobileOpen]);

  // Auto-open Masters accordion whenever a master screen is navigated to
  useEffect(() => {
    if (isAnyMasterActive) {
      setIsMastersOpen(true);
    }
  }, [isAnyMasterActive]);

  const rawMasterSubItems: MenuItem[] = [
    {
      id: 'MASTER_CATEGORIES',
      label: 'Category & Subcategory',
      icon: <Layers className="w-3.5 h-3.5 shrink-0" />,
    },
    {
      id: 'MASTER_BRANDS',
      label: 'Brand',
      icon: <Award className="w-3.5 h-3.5 shrink-0" />,
    },
    {
      id: 'MASTER_UNITS',
      label: 'Unit & Measurement',
      icon: <Scale className="w-3.5 h-3.5 shrink-0" />,
    },
    {
      id: 'MASTER_ATTRIBUTES',
      label: 'Product Attributes',
      icon: <Sliders className="w-3.5 h-3.5 shrink-0" />,
    },
    {
      id: 'MASTER_VARIANTS',
      label: 'Variants & Sizes',
      icon: <Boxes className="w-3.5 h-3.5 shrink-0" />,
    },
    {
      id: 'MASTER_ADDONS',
      label: 'Add-ons & Customization',
      icon: <ListPlus className="w-3.5 h-3.5 shrink-0" />,
    },
    {
      id: 'MASTER_PACKAGING',
      label: 'Packaging',
      icon: <PackageCheck className="w-3.5 h-3.5 shrink-0" />,
    },
    {
      id: 'MASTER_AVAILABILITY',
      label: 'Availability & Stock Configuration',
      icon: <Clock className="w-3.5 h-3.5 shrink-0" />,
    },
  ];

  const masterSubItems: MenuItem[] = rawMasterSubItems.filter((item) =>
    hasPermission(item.id, 'view')
  );

  const rawMenuGroups: MenuGroup[] = [
    {
      groupName: 'Platform Overview',
      items: [
        {
          id: 'DASHBOARD',
          label: 'Overview & Metrics',
          hindiLabel: 'डैशबोर्ड और रिपोर्ट',
          icon: <LayoutDashboard className="w-4 h-4 shrink-0" />,
        },
        {
          id: 'ANALYTICS',
          label: 'Reports & Analytics',
          hindiLabel: 'विस्तृत रिपोर्ट और ग्राफ',
          icon: <BarChart3 className="w-4 h-4 shrink-0" />,
        },
      ],
    },
    {
      groupName: 'Catalog & Configuration',
      hasMastersSubmenu: true,
      items: [
        {
          id: 'VERTICALS',
          label: 'Multi-Vertical Engine',
          hindiLabel: 'मल्टी-वर्टिकल मास्टर',
          icon: <Grid3X3 className="w-4 h-4 shrink-0" />,
        },
        {
          id: 'PRODUCTS',
          label: 'Products & Inventory',
          hindiLabel: 'प्रोडक्ट और इन्वेंटरी स्टॉक',
          icon: <Package className="w-4 h-4 shrink-0" />,
          badge: pendingProductsCount,
          badgeVariant: 'warning',
        },
      ],
    },
    {
      groupName: 'Users & Merchant Governance',
      items: [
        {
          id: 'APPLICATIONS',
          label: 'Seller KYC & Review',
          hindiLabel: 'दुकानदार आवेदन (KYC)',
          icon: <UserCheck className="w-4 h-4 shrink-0" />,
          badge: pendingApplicationsCount,
          badgeVariant: 'danger',
        },
        {
          id: 'SELLERS',
          label: 'Master Seller Directory',
          hindiLabel: 'सभी पंजीकृत दुकानें',
          icon: <Store className="w-4 h-4 shrink-0" />,
        },
        {
          id: 'SAFETY_QUALITY',
          label: 'Safety, Quality & Audits',
          hindiLabel: 'सुरक्षा, गुणवत्ता व परीक्षा',
          icon: <ShieldCheck className="w-4 h-4 shrink-0" />,
          badge: safetyActionCount,
          badgeVariant: 'warning',
        },
        {
          id: 'CUSTOMERS',
          label: 'Customers Directory',
          hindiLabel: 'ग्राहक प्रबंधन',
          icon: <UserRound className="w-4 h-4 shrink-0" />,
        },
      ],
    },
    {
      groupName: 'Logistics & Operations',
      items: [
        {
          id: 'SERVICE_AREAS',
          label: 'Villages & Routes',
          hindiLabel: 'गाँव और डिलीवरी सीमा',
          icon: <MapPin className="w-4 h-4 shrink-0" />,
        },
        {
          id: 'ORDERS',
          label: 'Marketplace Orders',
          hindiLabel: 'लाइव आर्डर निगरानी',
          icon: <ClipboardList className="w-4 h-4 shrink-0" />,
        },
        {
          id: 'DELIVERY_FLEET',
          label: 'Delivery Partners & Fleet',
          hindiLabel: 'डिलीवरी पार्टनर्स',
          icon: <Bike className="w-4 h-4 shrink-0" />,
        },
        {
          id: 'SUPPORT',
          label: 'Disputes & Support',
          hindiLabel: 'शिकायतें और रिफंड',
          icon: <Headphones className="w-4 h-4 shrink-0" />,
          badge: openSupportCasesCount,
          badgeVariant: 'warning',
        },
      ],
    },
    {
      groupName: 'Growth, CMS & Engagement',
      items: [
        {
          id: 'OFFERS',
          label: 'Offers & Coupons',
          hindiLabel: 'ऑफर्स और कूपन',
          icon: <Tag className="w-4 h-4 shrink-0" />,
        },
        {
          id: 'CMS_BANNERS',
          label: 'Home Banners & CMS',
          hindiLabel: 'बैनर और पॉलिसी पेज',
          icon: <ImageIcon className="w-4 h-4 shrink-0" />,
        },
        {
          id: 'REVIEWS',
          label: 'Reviews & Ratings',
          hindiLabel: 'रिव्यू मॉडरेशन',
          icon: <Star className="w-4 h-4 shrink-0" />,
          badge: flaggedReviewsCount,
          badgeVariant: 'warning',
        },
        {
          id: 'BROADCASTS',
          label: 'Notifications & Broadcasts',
          hindiLabel: 'गाँव अलर्ट और संदेश',
          icon: <Megaphone className="w-4 h-4 shrink-0" />,
        },
      ],
    },
    {
      groupName: 'Finance, Tax & Credit',
      items: [
        {
          id: 'PAYOUTS',
          label: 'Payments & Seller Payouts',
          hindiLabel: 'भुगतान और सेटलमेंट',
          icon: <Wallet className="w-4 h-4 shrink-0" />,
          badge: pendingPayoutsCount,
          badgeVariant: 'warning',
        },
        {
          id: 'FEE_RULES',
          label: 'Fee Rules & Shadow Pilot',
          hindiLabel: 'कमीशन और फीस नियम',
          icon: <Percent className="w-4 h-4 shrink-0" />,
        },
        {
          id: 'POLICIES_TAX',
          label: 'Tax / GST & Cancel Rules',
          hindiLabel: 'टैक्स और कैंसलेशन नियम',
          icon: <Receipt className="w-4 h-4 shrink-0" />,
        },
        {
          id: 'UDHARI',
          label: 'Udhari Credit Oversight',
          hindiLabel: 'उधारी खाता निगरानी',
          icon: <BookOpen className="w-4 h-4 shrink-0" />,
        },
      ],
    },
    {
      groupName: 'Access & System Governance',
      items: [
        {
          id: 'ROLES',
          label: 'Admin Users & Roles',
          hindiLabel: 'एडमिन भूमिकाएं (RBAC)',
          icon: <Users className="w-4 h-4 shrink-0" />,
        },
        {
          id: 'SETTINGS',
          label: 'Platform Settings',
          hindiLabel: 'प्लेटफॉर्म सेटिंग्स',
          icon: <Settings className="w-4 h-4 shrink-0" />,
        },
        {
          id: 'AUDIT_LOGS',
          label: 'Immutable Audit Trail',
          hindiLabel: 'सुरक्षा ऑडिट लॉग',
          icon: <History className="w-4 h-4 shrink-0" />,
        },
      ],
    },
  ];

  // Filter items based on active admin's RBAC view permissions and hide empty groups
  const menuGroups = rawMenuGroups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => hasPermission(item.id, 'view')),
    }))
    .filter(
      (group) =>
        group.items.length > 0 || (group.hasMastersSubmenu && masterSubItems.length > 0)
    );

  const roleLabel = ROLE_DISPLAY_LABELS[currentAdmin.role] || currentAdmin.role;
  const initials = getInitials(currentAdmin.name);

  const handleMastersHeaderClick = () => {
    if (isCollapsed) {
      setIsCollapsed(false);
      setIsMastersOpen(true);
      if (!isAnyMasterActive && masterSubItems.length > 0) {
        onSelectView(masterSubItems[0].id);
      }
      return;
    }
    setIsMastersOpen((prev) => !prev);
  };

  const sidebarContent = (
    <div className="flex flex-col h-full bg-[#111827] text-slate-300 border-r border-slate-800">
      {/* Sidebar Header */}
      <div className="h-16 px-4 flex items-center justify-between border-b border-slate-800/80 shrink-0">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#218838] to-[#16A34A] text-white flex items-center justify-center font-black text-sm shadow-md shrink-0">
            <Building2 className="w-5 h-5" />
          </div>
          {!isCollapsed && (
            <div className="truncate text-left">
              <h2 className="font-extrabold text-white text-sm tracking-tight truncate">
                GramBazaar Admin
              </h2>
              <span className="text-[10px] font-semibold text-emerald-400 uppercase tracking-wider block">
                Universal Marketplace
              </span>
            </div>
          )}
        </div>

        {/* Desktop Collapse Toggle */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="hidden md:flex w-7 h-7 rounded-lg bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 items-center justify-center transition-colors cursor-pointer"
          title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Navigation Menu List */}
      <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain modal-scroll px-3 py-4 space-y-5">
        {menuGroups.map((group, groupIdx) => (
          <div key={groupIdx} className="space-y-1">
            {!isCollapsed ? (
              <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 text-left">
                {group.groupName}
              </p>
            ) : (
              <div className="h-2 border-t border-slate-800 my-2" />
            )}

            <div className="space-y-0.5">
              {/* Centralized Collapsible Masters Menu */}
              {group.hasMastersSubmenu && masterSubItems.length > 0 && (
                <div className="space-y-1">
                  <button
                    type="button"
                    onClick={handleMastersHeaderClick}
                    aria-expanded={!isCollapsed && isMastersOpen}
                    title={isCollapsed ? 'Masters (8 Submenus)' : undefined}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer text-left ${
                      isAnyMasterActive
                        ? 'bg-slate-800 text-white ring-1 ring-[#218838]/60 font-bold'
                        : 'text-slate-200 hover:text-white hover:bg-slate-800/80'
                    } ${isCollapsed ? 'justify-center px-2' : ''}`}
                  >
                    <span className={isAnyMasterActive ? 'text-emerald-400' : 'text-slate-400'}>
                      <Database className="w-4 h-4 shrink-0" />
                    </span>

                    {!isCollapsed && (
                      <>
                        <span className="flex-1 truncate">Masters</span>
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-slate-700/80 text-slate-300">
                          {masterSubItems.length}
                        </span>
                        <ChevronDown
                          className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
                            isMastersOpen ? 'rotate-180' : ''
                          }`}
                        />
                      </>
                    )}
                  </button>

                  {!isCollapsed && isMastersOpen && (
                    <div className="ml-3 pl-3 border-l border-slate-800 space-y-0.5 py-0.5">
                      {masterSubItems.map((sub) => {
                        const isActive = currentView === sub.id;
                        return (
                          <button
                            key={sub.id}
                            type="button"
                            onClick={() => {
                              onSelectView(sub.id);
                              if (onMobileClose) onMobileClose();
                            }}
                            className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-[11.5px] font-medium transition-all cursor-pointer text-left ${
                              isActive
                                ? 'bg-[#218838] text-white shadow-sm font-bold'
                                : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
                            }`}
                          >
                            <span className={isActive ? 'text-white' : 'text-slate-500'}>
                              {sub.icon}
                            </span>
                            <span className="flex-1 truncate">{sub.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Standard Group Menu Items */}
              {group.items.map((item) => {
                const isActive = currentView === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
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
                      </div>
                    )}

                    {/* Notification or Counter Badge */}
                    {item.badge !== undefined && item.badge > 0 && (
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0 ${
                          item.badgeVariant === 'danger'
                            ? 'bg-rose-500 text-white'
                            : item.badgeVariant === 'warning'
                            ? 'bg-amber-500 text-slate-900'
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
          </div>
        ))}
      </div>

      {/* Admin User Profile Bottom Card & All Sections Shortcut */}
      <div className="p-3 border-t border-slate-800 bg-slate-900/60 space-y-2.5 shrink-0">
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

        <div className={`flex items-center gap-3 ${isCollapsed ? 'justify-center' : 'px-2'}`}>
          <div
            className="w-8 h-8 rounded-full bg-slate-700 text-white flex items-center justify-center font-bold text-xs ring-2 ring-emerald-500/40 shrink-0"
            title={`${currentAdmin.name} (${roleLabel})`}
          >
            {initials}
          </div>
          {!isCollapsed && (
            <div className="flex-1 truncate text-left">
              <p className="text-xs font-bold text-white truncate">{currentAdmin.name}</p>
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-3 h-3 text-emerald-400 shrink-0" />
                <span className="text-[10px] text-slate-400 truncate">{roleLabel}</span>
              </div>
            </div>
          )}
        </div>
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
        <div className="sticky top-16 h-[calc(100dvh-4rem)]">
          {sidebarContent}
        </div>
      </aside>

      {/* Mobile Drawer Overlay */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex overflow-hidden">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
            onClick={onMobileClose}
          />
          <div className="relative w-72 max-w-[85vw] h-full max-h-[100dvh] overflow-hidden shadow-2xl z-10 animate-slide-right">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
