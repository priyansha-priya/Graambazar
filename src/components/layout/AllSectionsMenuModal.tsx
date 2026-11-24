/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  X,
  Search,
  LayoutGrid,
  Utensils,
  ShoppingBag,
  ShoppingCart,
  CreditCard,
  ClipboardList,
  Navigation,
  BookOpen,
  MapPin,
  LayoutDashboard,
  BarChart3,
  Clock,
  Truck,
  UtensilsCrossed,
  Database,
  SlidersHorizontal,
  ShieldCheck,
  Settings,
  Grid3X3,
  Package,
  UserCheck,
  Store,
  UserRound,
  Bike,
  Headphones,
  Layers,
  Award,
  Scale,
  Sliders,
  Boxes,
  ListPlus,
  PackageCheck,
  Tag,
  Image as ImageIcon,
  Star,
  Megaphone,
  Wallet,
  Percent,
  Receipt,
  Users,
  History,
  LogIn,
  UserPlus,
  KeyRound,
  RotateCcw,
  ChevronRight,
  Lock,
} from 'lucide-react';
import { SellerViewType } from './SellerSidebar';
import { AdminViewType } from './AdminSidebar';
import { AuthScreenType } from '../../features/auth/types';
import { useAdmin } from '../../contexts/AdminContext';
import { useCart } from '../../contexts/CartContext';
import { useOrders } from '../../contexts/OrderContext';
import { useSeller } from '../../contexts/SellerContext';
import { useUdhari } from '../../contexts/UdhariContext';
import { useVillage } from '../../contexts/VillageContext';
import { MOCK_SELLERS } from '../../constants/mockData';
import { formatINR } from '../../utils/currency';

export type PortalRole = 'CUSTOMER' | 'SELLER' | 'ADMIN';
export type CustomerViewType =
  | 'MARKETPLACE'
  | 'CART'
  | 'CHECKOUT'
  | 'ORDER_TRACKING'
  | 'ORDER_HISTORY'
  | 'MY_UDHAR';

type SectionFilterTab = 'ALL' | 'CUSTOMER' | 'SELLER' | 'ADMIN' | 'MASTERS' | 'ACCOUNT';

interface SectionMenuItem {
  id: string;
  label: string;
  description: string;
  keywords: string;
  icon: React.ReactNode;
  metaText?: string;
  isActive: boolean;
  disabled?: boolean;
  disabledReason?: string;
  onSelect: () => void;
}

interface SectionGroup {
  id: string;
  category: Exclude<SectionFilterTab, 'ALL'>;
  title: string;
  subtitle: string;
  items: SectionMenuItem[];
}

interface AllSectionsMenuModalProps {
  isOpen: boolean;
  onClose: () => void;
  activePortalRole: PortalRole;
  customerView: CustomerViewType;
  customerVertical: 'FOOD' | 'GROCERY';
  sellerView: SellerViewType;
  adminView: AdminViewType;
  onNavigateCustomer: (
    view: CustomerViewType,
    vertical?: 'FOOD' | 'GROCERY'
  ) => void;
  onTrackLatestOrder: () => void;
  onOpenVillageModal: () => void;
  onNavigateSeller: (view: SellerViewType) => void;
  onNavigateAdmin: (view: AdminViewType) => void;
  onOpenAuthScreen: (screen: AuthScreenType) => void;
}

export const AllSectionsMenuModal: React.FC<AllSectionsMenuModalProps> = ({
  isOpen,
  onClose,
  activePortalRole,
  customerView,
  customerVertical,
  sellerView,
  adminView,
  onNavigateCustomer,
  onTrackLatestOrder,
  onOpenVillageModal,
  onNavigateSeller,
  onNavigateAdmin,
  onOpenAuthScreen,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<SectionFilterTab>('ALL');
  const searchInputRef = useRef<HTMLInputElement>(null);

  const { activeVillage } = useVillage();
  const { items: cartItems } = useCart();
  const { orders, activeOrders } = useOrders();
  const { activeSeller } = useSeller();
  const { getCustomerLedgersGrouped } = useUdhari();
  const {
    pendingApplicationsCount,
    pendingProductsCount,
    openSupportCasesCount,
    pendingPayoutsCount,
    flaggedReviewsCount,
    hasPermission,
  } = useAdmin();

  useEffect(() => {
    if (!isOpen) return;
    setSearchQuery('');
    const focusTimer = setTimeout(() => {
      searchInputRef.current?.focus();
    }, 50);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      clearTimeout(focusTimer);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  const foodShopsTotal = useMemo(
    () => MOCK_SELLERS.filter((s) => s.primaryVertical === 'FOOD').length,
    []
  );
  const groceryShopsTotal = useMemo(
    () => MOCK_SELLERS.filter((s) => s.primaryVertical === 'GROCERY').length,
    []
  );
  const sellerPendingCount = useMemo(
    () =>
      orders.filter(
        (o) =>
          o.sellerId === activeSeller.id &&
          ['placed', 'pending', 'accepted', 'preparing'].includes(o.status)
      ).length,
    [orders, activeSeller.id]
  );

  const customerLedgers = getCustomerLedgersGrouped('user_cust_1');
  const totalCustomerUdharOwed = customerLedgers.reduce(
    (acc, curr) => acc + curr.profile.outstandingBalancePaise,
    0
  );

  const runAndClose = (fn: () => void) => {
    fn();
    onClose();
  };

  const sectionGroups: SectionGroup[] = useMemo(() => {
    const makeAdminItem = (
      view: AdminViewType,
      label: string,
      description: string,
      keywords: string,
      icon: React.ReactNode,
      metaText?: string
    ): SectionMenuItem => {
      const allowed = hasPermission(view, 'view');
      return {
        id: `admin_${view}`,
        label,
        description,
        keywords,
        icon,
        metaText,
        isActive: activePortalRole === 'ADMIN' && adminView === view,
        disabled: !allowed,
        disabledReason: !allowed ? 'Restricted for role' : undefined,
        onSelect: () => {
          if (!allowed) return;
          runAndClose(() => onNavigateAdmin(view));
        },
      };
    };

    return [
      {
        id: 'customer_marketplace',
        category: 'CUSTOMER',
        title: 'Customer Marketplace',
        subtitle: 'Browse shops, place orders, track deliveries, and manage village udhar',
        items: [
          {
            id: 'cust_food',
            label: 'Food & Dhaba Delivery',
            description: 'Village kitchens, thalis, sweets & snacks',
            keywords: 'customer food dhaba restaurant hotel meals snacks thali',
            icon: <Utensils className="w-4 h-4 text-[#D97706]" />,
            metaText: `${foodShopsTotal} shops`,
            isActive:
              activePortalRole === 'CUSTOMER' &&
              customerView === 'MARKETPLACE' &&
              customerVertical === 'FOOD',
            onSelect: () => runAndClose(() => onNavigateCustomer('MARKETPLACE', 'FOOD')),
          },
          {
            id: 'cust_grocery',
            label: 'Grocery & Kirana Mart',
            description: 'Daily staples, atta, pulses, spices & oil',
            keywords: 'customer grocery kirana general store staples atta dal',
            icon: <ShoppingBag className="w-4 h-4 text-[#218838]" />,
            metaText: `${groceryShopsTotal} shops`,
            isActive:
              activePortalRole === 'CUSTOMER' &&
              customerView === 'MARKETPLACE' &&
              customerVertical === 'GROCERY',
            onSelect: () => runAndClose(() => onNavigateCustomer('MARKETPLACE', 'GROCERY')),
          },
          {
            id: 'cust_cart',
            label: 'Shopping Cart',
            description: 'Review selected items and adjust quantities',
            keywords: 'cart bag basket items checkout customer',
            icon: <ShoppingCart className="w-4 h-4 text-[#2563EB]" />,
            metaText: `${cartItems.length} ${cartItems.length === 1 ? 'item' : 'items'}`,
            isActive: activePortalRole === 'CUSTOMER' && customerView === 'CART',
            onSelect: () => runAndClose(() => onNavigateCustomer('CART')),
          },
          {
            id: 'cust_checkout',
            label: 'Checkout & Payment',
            description: 'Delivery landmark, COD, UPI & Udhari checkout',
            keywords: 'checkout pay payment cod upi place order',
            icon: <CreditCard className="w-4 h-4 text-[#176B2C]" />,
            isActive: activePortalRole === 'CUSTOMER' && customerView === 'CHECKOUT',
            onSelect: () => runAndClose(() => onNavigateCustomer('CHECKOUT')),
          },
          {
            id: 'cust_orders',
            label: 'My Orders & History',
            description: 'View active and past orders across all shops',
            keywords: 'orders order list history past purchases receipts',
            icon: <ClipboardList className="w-4 h-4 text-[#218838]" />,
            metaText: `${orders.length} total`,
            isActive: activePortalRole === 'CUSTOMER' && customerView === 'ORDER_HISTORY',
            onSelect: () => runAndClose(() => onNavigateCustomer('ORDER_HISTORY')),
          },
          {
            id: 'cust_tracking',
            label: 'Live Order Tracking',
            description: 'Real-time kitchen prep & runner delivery status',
            keywords: 'track tracking live status runner delivery eta',
            icon: <Navigation className="w-4 h-4 text-[#2563EB]" />,
            metaText: activeOrders.length > 0 ? `${activeOrders.length} active` : 'Latest',
            isActive: activePortalRole === 'CUSTOMER' && customerView === 'ORDER_TRACKING',
            onSelect: () => runAndClose(() => onTrackLatestOrder()),
          },
          {
            id: 'cust_udhar',
            label: 'Mera Udhar Khata',
            description: 'Check shop credit balances and settlement history',
            keywords: 'udhar udhari khata credit ledger due balance',
            icon: <BookOpen className="w-4 h-4 text-[#D97706]" />,
            metaText:
              totalCustomerUdharOwed > 0 ? formatINR(totalCustomerUdharOwed) : 'Clear',
            isActive: activePortalRole === 'CUSTOMER' && customerView === 'MY_UDHAR',
            onSelect: () => runAndClose(() => onNavigateCustomer('MY_UDHAR')),
          },
          {
            id: 'cust_village',
            label: 'Delivery Village & Landmark',
            description: `Currently delivering to ${activeVillage.name}`,
            keywords: 'village location area address landmark change village',
            icon: <MapPin className="w-4 h-4 text-[#218838]" />,
            metaText: activeVillage.name,
            isActive: false,
            onSelect: () => runAndClose(() => onOpenVillageModal()),
          },
        ],
      },
      {
        id: 'seller_portal',
        category: 'SELLER',
        title: 'Seller Portal',
        subtitle: `Managing ${activeSeller.publicName} — orders, catalog, bulk inventory, and compliance`,
        items: [
          {
            id: 'seller_dashboard',
            label: 'Store Dashboard',
            description: 'Daily sales KPIs, pending alerts & store overview',
            keywords: 'seller dashboard home summary kpi sales',
            icon: <LayoutDashboard className="w-4 h-4 text-[#218838]" />,
            isActive: activePortalRole === 'SELLER' && sellerView === 'DASHBOARD',
            onSelect: () => runAndClose(() => onNavigateSeller('DASHBOARD')),
          },
          {
            id: 'seller_analytics',
            label: 'Store Analytics',
            description: 'Revenue trends, top items & fulfillment speed',
            keywords: 'seller analytics reports charts performance revenue',
            icon: <BarChart3 className="w-4 h-4 text-[#2563EB]" />,
            isActive: activePortalRole === 'SELLER' && sellerView === 'ANALYTICS',
            onSelect: () => runAndClose(() => onNavigateSeller('ANALYTICS')),
          },
          {
            id: 'seller_terminal',
            label: 'Live Orders Queue & Terminal',
            description: 'Accept incoming orders with 5:00 countdown & pack',
            keywords: 'seller orders queue terminal kitchen packing accept timer',
            icon: <Clock className="w-4 h-4 text-[#DC2626]" />,
            metaText: sellerPendingCount > 0 ? `${sellerPendingCount} pending` : 'Clear',
            isActive: activePortalRole === 'SELLER' && sellerView === 'TERMINAL',
            onSelect: () => runAndClose(() => onNavigateSeller('TERMINAL')),
          },
          {
            id: 'seller_dispatch',
            label: 'In-House Delivery Fleet',
            description: 'Assign shop runners and track village dispatch',
            keywords: 'seller delivery fleet runner dispatch riders',
            icon: <Truck className="w-4 h-4 text-[#176B2C]" />,
            isActive: activePortalRole === 'SELLER' && sellerView === 'DISPATCH',
            onSelect: () => runAndClose(() => onNavigateSeller('DISPATCH')),
          },
          {
            id: 'seller_catalog',
            label: 'Menu & Products',
            description: 'Add new dishes/groceries and manage store catalog',
            keywords: 'seller menu products catalog add product items dishes',
            icon: <UtensilsCrossed className="w-4 h-4 text-[#D97706]" />,
            isActive: activePortalRole === 'SELLER' && sellerView === 'CATALOG',
            onSelect: () => runAndClose(() => onNavigateSeller('CATALOG')),
          },
          {
            id: 'seller_masters',
            label: 'Seller Product Masters (8)',
            description: 'Categories, brands, units, variants, add-ons & packing',
            keywords: 'seller masters category brand unit variant addon packaging',
            icon: <Database className="w-4 h-4 text-[#2563EB]" />,
            metaText: '8 masters',
            isActive: activePortalRole === 'SELLER' && sellerView === 'MASTERS',
            onSelect: () => runAndClose(() => onNavigateSeller('MASTERS')),
          },
          {
            id: 'seller_inventory',
            label: 'Inventory & Stock (Bulk Update)',
            description: 'Stock counts, availability toggles & bulk price/stock editor',
            keywords: 'seller inventory stock bulk update price quantity out of stock',
            icon: <SlidersHorizontal className="w-4 h-4 text-[#218838]" />,
            metaText: 'Bulk edit',
            isActive: activePortalRole === 'SELLER' && sellerView === 'INVENTORY',
            onSelect: () => runAndClose(() => onNavigateSeller('INVENTORY')),
          },
          {
            id: 'seller_udhari',
            label: 'Customer Udhari Khata',
            description: 'Approve village credit limits and record repayments',
            keywords: 'seller udhari khata credit ledger customers due',
            icon: <BookOpen className="w-4 h-4 text-[#D97706]" />,
            isActive: activePortalRole === 'SELLER' && sellerView === 'UDHARI',
            onSelect: () => runAndClose(() => onNavigateSeller('UDHARI')),
          },
          {
            id: 'seller_safety',
            label: 'Safety, Quality & Exam',
            description: 'Hygiene training, checklists & certification assessment',
            keywords: 'seller safety quality hygiene training exam certificate checklist',
            icon: <ShieldCheck className="w-4 h-4 text-[#16A34A]" />,
            isActive: activePortalRole === 'SELLER' && sellerView === 'SAFETY_QUALITY',
            onSelect: () => runAndClose(() => onNavigateSeller('SAFETY_QUALITY')),
          },
          {
            id: 'seller_settings',
            label: 'Store Settings & UPI QR',
            description: 'Operating hours, UPI ID, delivery radius & alerts',
            keywords: 'seller settings upi qr hours timings store profile',
            icon: <Settings className="w-4 h-4 text-[#6B7280]" />,
            isActive: activePortalRole === 'SELLER' && sellerView === 'SETTINGS',
            onSelect: () => runAndClose(() => onNavigateSeller('SETTINGS')),
          },
        ],
      },
      {
        id: 'admin_core',
        category: 'ADMIN',
        title: 'Admin — Overview, Merchants & Operations',
        subtitle: 'Platform governance, KYC onboarding, orders, fleet, and safety audits',
        items: [
          makeAdminItem(
            'DASHBOARD',
            'Overview & Metrics',
            'Marketplace GMV, active shops & operational alerts',
            'admin dashboard overview metrics kpi summary',
            <LayoutDashboard className="w-4 h-4 text-[#218838]" />
          ),
          makeAdminItem(
            'ANALYTICS',
            'Reports & Analytics',
            'Village-wise orders, vertical mix & growth charts',
            'admin analytics reports charts trends export',
            <BarChart3 className="w-4 h-4 text-[#2563EB]" />
          ),
          makeAdminItem(
            'VERTICALS',
            'Multi-Vertical Engine',
            'Configure Food, Grocery and new marketplace verticals',
            'admin verticals engine food grocery configuration',
            <Grid3X3 className="w-4 h-4 text-[#176B2C]" />
          ),
          makeAdminItem(
            'PRODUCTS',
            'Products & Inventory',
            'Global catalog moderation, pricing & stock oversight',
            'admin products inventory catalog moderation skus',
            <Package className="w-4 h-4 text-[#D97706]" />,
            pendingProductsCount > 0 ? `${pendingProductsCount} pending` : undefined
          ),
          makeAdminItem(
            'APPLICATIONS',
            'Seller KYC & Review',
            'Verify documents and approve new village merchants',
            'admin seller applications kyc onboarding approve',
            <UserCheck className="w-4 h-4 text-[#DC2626]" />,
            pendingApplicationsCount > 0 ? `${pendingApplicationsCount} pending` : undefined
          ),
          makeAdminItem(
            'SELLERS',
            'Master Seller Directory',
            'Manage all registered shops, statuses & commissions',
            'admin sellers directory shops merchants list',
            <Store className="w-4 h-4 text-[#218838]" />
          ),
          makeAdminItem(
            'SAFETY_QUALITY',
            'Safety, Quality & Audits',
            'Review seller exams, inspection scores & compliance',
            'admin safety quality audits exams certificates hygiene',
            <ShieldCheck className="w-4 h-4 text-[#16A34A]" />
          ),
          makeAdminItem(
            'CUSTOMERS',
            'Customers Directory',
            'Customer accounts, village mapping & order volume',
            'admin customers users directory buyers',
            <UserRound className="w-4 h-4 text-[#2563EB]" />
          ),
          makeAdminItem(
            'SERVICE_AREAS',
            'Villages & Routes',
            'Manage villages, pin codes & inter-village routes',
            'admin villages service areas routes delivery zones',
            <MapPin className="w-4 h-4 text-[#218838]" />
          ),
          makeAdminItem(
            'ORDERS',
            'Marketplace Orders',
            'Live order monitoring and status intervention',
            'admin orders marketplace live monitoring list',
            <ClipboardList className="w-4 h-4 text-[#176B2C]" />
          ),
          makeAdminItem(
            'DELIVERY_FLEET',
            'Delivery Partners & Fleet',
            'Track riders, village assignments & delivery SLAs',
            'admin delivery fleet partners riders logistics',
            <Bike className="w-4 h-4 text-[#2563EB]" />
          ),
          makeAdminItem(
            'SUPPORT',
            'Disputes & Support',
            'Handle buyer tickets, refunds & escalation cases',
            'admin support disputes tickets complaints refunds',
            <Headphones className="w-4 h-4 text-[#D97706]" />,
            openSupportCasesCount > 0 ? `${openSupportCasesCount} open` : undefined
          ),
        ],
      },
      {
        id: 'admin_masters',
        category: 'MASTERS',
        title: 'Product Masters (8)',
        subtitle: 'Centralized catalog taxonomy shared across Admin and Seller portals',
        items: [
          makeAdminItem(
            'MASTER_CATEGORIES',
            'Category & Subcategory Master',
            'Manage Food and Grocery department trees',
            'master categories subcategories tree catalog',
            <Layers className="w-4 h-4 text-[#218838]" />
          ),
          makeAdminItem(
            'MASTER_BRANDS',
            'Brand Master',
            'Verified national, regional & local village brands',
            'master brands manufacturers labels',
            <Award className="w-4 h-4 text-[#D97706]" />
          ),
          makeAdminItem(
            'MASTER_UNITS',
            'Unit & Measurement Master',
            'kg, g, pav, litre, plate, packet & piece standards',
            'master units measurement weight kg gram pav litre',
            <Scale className="w-4 h-4 text-[#2563EB]" />
          ),
          makeAdminItem(
            'MASTER_ATTRIBUTES',
            'Product Attribute Master',
            'Diet type, spice level, organic, shelf life & tags',
            'master attributes specs veg organic spice',
            <Sliders className="w-4 h-4 text-[#176B2C]" />
          ),
          makeAdminItem(
            'MASTER_VARIANTS',
            'Variant & Size Master',
            'Half/Full portions, 250g/500g/1kg pack templates',
            'master variants sizes portions packs half full',
            <Boxes className="w-4 h-4 text-[#218838]" />
          ),
          makeAdminItem(
            'MASTER_ADDONS',
            'Add-ons & Customization Master',
            'Extra roti, butter, raita & custom food toppings',
            'master addons customization extras toppings',
            <ListPlus className="w-4 h-4 text-[#D97706]" />
          ),
          makeAdminItem(
            'MASTER_PACKAGING',
            'Packaging Master',
            'Leak-proof food boxes, eco bags & packing fees',
            'master packaging containers boxes bags charges',
            <PackageCheck className="w-4 h-4 text-[#2563EB]" />
          ),
          makeAdminItem(
            'MASTER_AVAILABILITY',
            'Availability & Stock Config',
            'Meal time slots, low-stock thresholds & auto-pause',
            'master availability stock config thresholds slots',
            <Clock className="w-4 h-4 text-[#16A34A]" />
          ),
        ],
      },
      {
        id: 'admin_growth_finance',
        category: 'ADMIN',
        title: 'Admin — Growth, Finance & System',
        subtitle: 'Promotions, CMS banners, payouts, GST rules, RBAC roles, and audit logs',
        items: [
          makeAdminItem(
            'OFFERS',
            'Offers & Coupons',
            'Create village promo codes and discount campaigns',
            'admin offers coupons discounts promo codes',
            <Tag className="w-4 h-4 text-[#218838]" />
          ),
          makeAdminItem(
            'CMS_BANNERS',
            'Home Banners & CMS',
            'Hero banners, featured shops & policy pages',
            'admin cms banners home featured shops content',
            <ImageIcon className="w-4 h-4 text-[#2563EB]" />
          ),
          makeAdminItem(
            'REVIEWS',
            'Reviews & Ratings',
            'Moderate customer ratings and flagged feedback',
            'admin reviews ratings moderation feedback',
            <Star className="w-4 h-4 text-[#D97706]" />,
            flaggedReviewsCount > 0 ? `${flaggedReviewsCount} flagged` : undefined
          ),
          makeAdminItem(
            'BROADCASTS',
            'Notifications & Broadcasts',
            'Send village alerts, festival announcements & notices',
            'admin broadcasts notifications announcements alerts',
            <Megaphone className="w-4 h-4 text-[#218838]" />
          ),
          makeAdminItem(
            'PAYOUTS',
            'Payments & Seller Payouts',
            'Verify settlement batches, UTRs & customer refunds',
            'admin payouts payments settlements refunds utr',
            <Wallet className="w-4 h-4 text-[#176B2C]" />,
            pendingPayoutsCount > 0 ? `${pendingPayoutsCount} due` : undefined
          ),
          makeAdminItem(
            'FEE_RULES',
            'Fee Rules & Shadow Pilot',
            'Commission slabs, delivery charges & pilot fees',
            'admin fee rules commission charges shadow pilot',
            <Percent className="w-4 h-4 text-[#2563EB]" />
          ),
          makeAdminItem(
            'POLICIES_TAX',
            'Tax / GST & Cancel Rules',
            'Configure GST slabs and cancellation windows',
            'admin tax gst policies cancellation rules',
            <Receipt className="w-4 h-4 text-[#6B7280]" />
          ),
          makeAdminItem(
            'UDHARI',
            'Udhari Credit Oversight',
            'Platform-wide village credit exposure & overdue flags',
            'admin udhari credit oversight ledger risk',
            <BookOpen className="w-4 h-4 text-[#D97706]" />
          ),
          makeAdminItem(
            'ROLES',
            'Admin Users & Roles',
            'Role-based access control matrix & team invites',
            'admin roles users rbac permissions access',
            <Users className="w-4 h-4 text-[#176B2C]" />
          ),
          makeAdminItem(
            'SETTINGS',
            'Platform Settings',
            'Global marketplace defaults, branding & toggles',
            'admin settings platform configuration global',
            <Settings className="w-4 h-4 text-[#6B7280]" />
          ),
          makeAdminItem(
            'AUDIT_LOGS',
            'Immutable Audit Trail',
            'Chronological security and administrative action logs',
            'admin audit logs security trail history',
            <History className="w-4 h-4 text-[#1F2937]" />
          ),
        ],
      },
      {
        id: 'account_auth',
        category: 'ACCOUNT',
        title: 'Account & Authentication',
        subtitle: 'Sign-in, registration, and password recovery screens',
        items: [
          {
            id: 'auth_login',
            label: 'Sign In / Login',
            description: 'Customer, Seller & Admin login screen',
            keywords: 'auth login sign in account password otp',
            icon: <LogIn className="w-4 h-4 text-[#218838]" />,
            isActive: false,
            onSelect: () => runAndClose(() => onOpenAuthScreen('LOGIN')),
          },
          {
            id: 'auth_signup',
            label: 'Create Account / Sign Up',
            description: 'Register a new buyer or seller account',
            keywords: 'auth signup register create account join',
            icon: <UserPlus className="w-4 h-4 text-[#2563EB]" />,
            isActive: false,
            onSelect: () => runAndClose(() => onOpenAuthScreen('SIGNUP')),
          },
          {
            id: 'auth_forgot',
            label: 'Forgot Password',
            description: 'Request mobile OTP or email recovery link',
            keywords: 'auth forgot password recovery otp reset',
            icon: <KeyRound className="w-4 h-4 text-[#D97706]" />,
            isActive: false,
            onSelect: () => runAndClose(() => onOpenAuthScreen('FORGOT_PASSWORD')),
          },
          {
            id: 'auth_reset',
            label: 'Reset Password',
            description: 'Set a new account password securely',
            keywords: 'auth reset password update credentials',
            icon: <RotateCcw className="w-4 h-4 text-[#6B7280]" />,
            isActive: false,
            onSelect: () => runAndClose(() => onOpenAuthScreen('RESET_PASSWORD')),
          },
        ],
      },
    ];
  }, [
    activePortalRole,
    customerView,
    customerVertical,
    sellerView,
    adminView,
    foodShopsTotal,
    groceryShopsTotal,
    cartItems.length,
    orders.length,
    activeOrders.length,
    totalCustomerUdharOwed,
    activeVillage.name,
    activeSeller.publicName,
    sellerPendingCount,
    pendingProductsCount,
    pendingApplicationsCount,
    openSupportCasesCount,
    flaggedReviewsCount,
    pendingPayoutsCount,
    hasPermission,
    onNavigateCustomer,
    onTrackLatestOrder,
    onOpenVillageModal,
    onNavigateSeller,
    onNavigateAdmin,
    onOpenAuthScreen,
  ]);

  const totalSectionCount = useMemo(
    () => sectionGroups.reduce((sum, g) => sum + g.items.length, 0),
    [sectionGroups]
  );

  const filteredGroups = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return sectionGroups
      .filter((group) => activeFilter === 'ALL' || group.category === activeFilter)
      .map((group) => ({
        ...group,
        items: q
          ? group.items.filter(
              (item) =>
                item.label.toLowerCase().includes(q) ||
                item.description.toLowerCase().includes(q) ||
                item.keywords.toLowerCase().includes(q) ||
                group.title.toLowerCase().includes(q)
            )
          : group.items,
      }))
      .filter((group) => group.items.length > 0);
  }, [sectionGroups, activeFilter, searchQuery]);

  const matchedItemCount = useMemo(
    () => filteredGroups.reduce((sum, g) => sum + g.items.length, 0),
    [filteredGroups]
  );

  if (!isOpen) return null;

  const filterTabs: { key: SectionFilterTab; label: string; count: number }[] = [
    { key: 'ALL', label: 'All Sections', count: totalSectionCount },
    {
      key: 'CUSTOMER',
      label: 'Customer',
      count: sectionGroups
        .filter((g) => g.category === 'CUSTOMER')
        .reduce((s, g) => s + g.items.length, 0),
    },
    {
      key: 'SELLER',
      label: 'Seller',
      count: sectionGroups
        .filter((g) => g.category === 'SELLER')
        .reduce((s, g) => s + g.items.length, 0),
    },
    {
      key: 'ADMIN',
      label: 'Admin',
      count: sectionGroups
        .filter((g) => g.category === 'ADMIN')
        .reduce((s, g) => s + g.items.length, 0),
    },
    {
      key: 'MASTERS',
      label: 'Masters',
      count: sectionGroups
        .filter((g) => g.category === 'MASTERS')
        .reduce((s, g) => s + g.items.length, 0),
    },
    {
      key: 'ACCOUNT',
      label: 'Account',
      count: sectionGroups
        .filter((g) => g.category === 'ACCOUNT')
        .reduce((s, g) => s + g.items.length, 0),
    },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 lg:p-6"
      role="dialog"
      aria-modal="true"
      aria-label="All Sections Menu"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="relative z-10 w-full max-w-5xl max-h-[90vh] bg-white rounded-2xl border border-[#E5E7EB] shadow-2xl flex flex-col overflow-hidden text-left">
        {/* Top Header */}
        <div className="px-4 sm:px-6 py-4 border-b border-[#E5E7EB] bg-white flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-[#E8F5E9] text-[#218838] border border-[#218838]/20 flex items-center justify-center shrink-0">
              <LayoutGrid className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-base sm:text-lg font-bold text-[#1F2937] leading-tight truncate">
                All Sections Menu
              </h2>
              <p className="text-xs text-[#6B7280] mt-0.5 truncate">
                Jump directly to any screen across Customer, Seller, Admin &amp; Product Masters ({totalSectionCount} sections)
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close All Sections Menu"
            className="w-9 h-9 rounded-full border border-[#E5E7EB] bg-[#F8FAFC] hover:bg-[#F1F5F9] text-[#475569] hover:text-[#1F2937] flex items-center justify-center transition-colors cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search & Portal Filter Bar */}
        <div className="px-4 sm:px-6 py-3 bg-[#F8FAFC] border-b border-[#E5E7EB] space-y-3 shrink-0">
          <div className="relative">
            <Search className="w-4 h-4 text-[#6B7280] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search any section (e.g. inventory, orders, bulk update, masters, udhari, safety, payouts...)"
              className="w-full h-10 pl-10 pr-20 bg-white border border-[#E5E7EB] rounded-xl text-xs sm:text-sm text-[#1F2937] placeholder:text-[#6B7280] outline-none focus:border-[#218838] focus:ring-2 focus:ring-[#218838]/15"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-[#6B7280] hover:text-[#1F2937] cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>

          <div
            role="tablist"
            aria-label="Filter sections by portal"
            className="flex items-center gap-1.5 overflow-x-auto pb-0.5"
          >
            {filterTabs.map((tab) => {
              const isSelected = activeFilter === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  role="tab"
                  aria-selected={isSelected}
                  onClick={() => setActiveFilter(tab.key)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-[#218838] text-white'
                      : 'bg-white text-[#475569] border border-[#E5E7EB] hover:text-[#1F2937] hover:bg-[#F1F5F9]'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`tabular-nums text-[11px] ${
                      isSelected ? 'text-white/85' : 'text-[#6B7280]'
                    }`}
                  >
                    ({tab.count})
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Scrollable Sections Directory */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-7 bg-white">
          {filteredGroups.length === 0 ? (
            <div className="py-12 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-[#F8FAFC] border border-[#E5E7EB] text-[#6B7280] flex items-center justify-center mx-auto">
                <Search className="w-5 h-5" />
              </div>
              <p className="text-sm font-bold text-[#1F2937]">
                No sections match &ldquo;{searchQuery}&rdquo;
              </p>
              <p className="text-xs text-[#6B7280]">
                Try searching for Inventory, Orders, Food, Grocery, Masters, Safety, or Payouts.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setActiveFilter('ALL');
                }}
                className="inline-flex items-center justify-center px-4 py-2 rounded-full text-xs font-semibold bg-[#218838] text-white hover:bg-[#176B2C] transition-colors cursor-pointer"
              >
                Reset Search &amp; Filters
              </button>
            </div>
          ) : (
            filteredGroups.map((group) => (
              <section key={group.id} className="space-y-3">
                <div className="flex flex-wrap items-baseline justify-between gap-2 pb-2 border-b border-[#E5E7EB]">
                  <div>
                    <h3 className="text-sm font-bold text-[#1F2937]">{group.title}</h3>
                    <p className="text-xs text-[#6B7280] mt-0.5">{group.subtitle}</p>
                  </div>
                  <span className="text-xs font-semibold text-[#6B7280] tabular-nums">
                    {group.items.length} {group.items.length === 1 ? 'section' : 'sections'}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                  {group.items.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      disabled={item.disabled}
                      onClick={item.onSelect}
                      className={`group flex items-start gap-3 p-3 rounded-xl border text-left transition-colors ${
                        item.disabled
                          ? 'bg-[#F8FAFC] border-[#E5E7EB] opacity-60 cursor-not-allowed'
                          : item.isActive
                          ? 'bg-[#E8F5E9] border-[#218838] cursor-pointer'
                          : 'bg-white border-[#E5E7EB] hover:border-[#218838]/60 hover:bg-[#F8FAFC] cursor-pointer'
                      }`}
                    >
                      <div
                        className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 border ${
                          item.isActive
                            ? 'bg-white border-[#218838]/30'
                            : 'bg-[#F8FAFC] border-[#E5E7EB] group-hover:bg-white'
                        }`}
                      >
                        {item.disabled ? (
                          <Lock className="w-4 h-4 text-[#6B7280]" />
                        ) : (
                          item.icon
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span
                            className={`text-xs font-bold truncate ${
                              item.isActive ? 'text-[#176B2C]' : 'text-[#1F2937]'
                            }`}
                          >
                            {item.label}
                          </span>
                          {!item.disabled && (
                            <ChevronRight
                              className={`w-3.5 h-3.5 shrink-0 transition-transform group-hover:translate-x-0.5 ${
                                item.isActive ? 'text-[#218838]' : 'text-[#9CA3AF]'
                              }`}
                            />
                          )}
                        </div>

                        <p className="text-[11px] text-[#6B7280] line-clamp-1 mt-0.5">
                          {item.disabled ? item.disabledReason : item.description}
                        </p>

                        {(item.metaText || item.isActive) && !item.disabled && (
                          <div className="flex items-center gap-1.5 mt-1 text-[11px] tabular-nums">
                            {item.isActive && (
                              <span className="font-semibold text-[#176B2C]">Current view</span>
                            )}
                            {item.isActive && item.metaText && (
                              <span className="text-[#9CA3AF]" aria-hidden="true">
                                ·
                              </span>
                            )}
                            {item.metaText && (
                              <span className="font-semibold text-[#475569]">{item.metaText}</span>
                            )}
                          </div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </section>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-4 sm:px-6 py-3 border-t border-[#E5E7EB] bg-[#F8FAFC] flex flex-wrap items-center justify-between gap-2 text-xs text-[#6B7280] shrink-0">
          <span className="tabular-nums">
            Showing <strong className="text-[#1F2937]">{matchedItemCount}</strong> of{' '}
            <strong className="text-[#1F2937]">{totalSectionCount}</strong> sections
          </span>
          <span>Press Esc to close</span>
        </div>
      </div>
    </div>
  );
};
