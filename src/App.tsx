/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState } from 'react';
import {
  Utensils,
  ShoppingBag,
  Store,
  Clock,
  Search,
  CheckCircle2,
  MapPin,
  ChevronDown,
  Truck,
  Sparkles,
  ArrowRight,
  Compass,
  ClipboardList,
  Power,
  Layers,
  LayoutDashboard,
  BookOpen,
  Shield,
  Menu,
  ShieldCheck,
  Building,
  Bell,
  LayoutList,
  LayoutGrid,
  X,
} from 'lucide-react';

// Contexts & Constants
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { VillageProvider, useVillage } from './contexts/VillageContext';
import { CartProvider, useCart } from './contexts/CartContext';
import { OrderProvider, useOrders } from './contexts/OrderContext';
import { SellerProvider, useSeller } from './contexts/SellerContext';
import { UdhariProvider, useUdhari } from './contexts/UdhariContext';
import { AdminProvider, useAdmin } from './contexts/AdminContext';
import { SafetyProvider } from './contexts/SafetyContext';
import { FOOD_CATEGORIES, GROCERY_CATEGORIES } from './constants/categories';
import { MOCK_SELLERS, MOCK_FOOD_PRODUCTS, MOCK_GROCERY_PRODUCTS } from './constants/mockData';
import { Seller } from './types/merchant';
import { FoodProduct, GroceryProduct } from './types/product';
import bannerFoodDeliveryImg from './assets/images/banner_food_delivery_1795505804062.jpg';
import bannerGroceryKiranaImg from './assets/images/banner_grocery_kirana_1795505803528.jpg';

// Design System & Layout Components
import { Button } from './components/ui/Button';
import { Badge } from './components/ui/Badge';
import { Tabs } from './components/ui/Tabs';
import { Breadcrumbs } from './components/layout/Breadcrumbs';
import { CustomerDrawer } from './components/layout/CustomerDrawer';
import { SellerSidebar, SellerViewType } from './components/layout/SellerSidebar';
import { AdminSidebar, AdminViewType, MASTER_VIEW_KEYS } from './components/layout/AdminSidebar';
import { AllSectionsMenuModal } from './components/layout/AllSectionsMenuModal';

// Customer Feature Views
import { StoreCard } from './features/customer/components/StoreCard';
import { StorefrontView } from './features/customer/components/StorefrontView';
import { VillageSelectorModal } from './features/customer/components/VillageSelectorModal';
import { CartView } from './features/cart/CartView';
import { CheckoutView } from './features/checkout/CheckoutView';
import { OrderTrackingView } from './features/orders/OrderTrackingView';
import { OrderHistoryView } from './features/orders/OrderHistoryView';
import { CustomerUdharView } from './features/udhari/CustomerUdharView';

// Seller Feature Views
import { SellerDashboardView } from './features/seller/SellerDashboardView';
import { SellerOrdersTerminal } from './features/seller/SellerOrdersTerminal';
import { SellerDispatchView } from './features/seller/SellerDispatchView';
import { SellerUdhariView } from './features/udhari/SellerUdhariView';
import { SellerCatalogView } from './features/seller/SellerCatalogView';
import { SellerSettingsView } from './features/seller/SellerSettingsView';
import { SellerAnalyticsView } from './features/seller/SellerAnalyticsView';
import { SellerSafetyQualityView } from './features/seller/SellerSafetyQualityView';

// Admin Feature Views
import { AdminDashboardView } from './features/admin/AdminDashboardView';
import { AdminSellerApplicationsView } from './features/admin/AdminSellerApplicationsView';
import { AdminSellerDirectoryView } from './features/admin/AdminSellerDirectoryView';
import { AdminServiceAreasView } from './features/admin/AdminServiceAreasView';
import { AdminFeeRulesView } from './features/admin/AdminFeeRulesView';
import { AdminOrdersView } from './features/admin/AdminOrdersView';
import { AdminSupportView } from './features/admin/AdminSupportView';
import { AdminAuditLogsView } from './features/admin/AdminAuditLogsView';
import { AdminVerticalsView } from './features/admin/AdminVerticalsView';
import { AdminProductsView } from './features/admin/AdminProductsView';
import { AdminOffersView } from './features/admin/AdminOffersView';
import { AdminUdhariView } from './features/admin/AdminUdhariView';
import { AdminRolesView } from './features/admin/AdminRolesView';
import { AdminSettingsView } from './features/admin/AdminSettingsView';
import { AdminCustomersView } from './features/admin/AdminCustomersView';
import { AdminPayoutsView } from './features/admin/AdminPayoutsView';
import { AdminAnalyticsView } from './features/admin/AdminAnalyticsView';
import { AdminCmsBannersView } from './features/admin/AdminCmsBannersView';
import { AdminReviewsView } from './features/admin/AdminReviewsView';
import { AdminBroadcastsView } from './features/admin/AdminBroadcastsView';
import { AdminTaxPoliciesView } from './features/admin/AdminTaxPoliciesView';
import { AdminDeliveryFleetView } from './features/admin/AdminDeliveryFleetView';
import { AdminSafetyQualityView } from './features/admin/AdminSafetyQualityView';
import { AdminHeaderTools } from './features/admin/components/AdminHeaderTools';

// Centralized Masters Views
import { CategorySubcategoryMasterView } from './features/admin/masters/CategorySubcategoryMasterView';
import { BrandMasterView } from './features/admin/masters/BrandMasterView';
import { UnitMeasurementMasterView } from './features/admin/masters/UnitMeasurementMasterView';
import { ProductAttributeMasterView } from './features/admin/masters/ProductAttributeMasterView';
import { ProductVariantSizeMasterView } from './features/admin/masters/ProductVariantSizeMasterView';
import { AddonsCustomizationMasterView } from './features/admin/masters/AddonsCustomizationMasterView';
import { PackagingMasterView } from './features/admin/masters/PackagingMasterView';
import { AvailabilityStockConfigMasterView } from './features/admin/masters/AvailabilityStockConfigMasterView';

// Authentication UI Suite (Design / UI Layer)
import { AuthExperience } from './features/auth/AuthExperience';
import { AccountDropdown } from './features/auth/components/AccountDropdown';
import { LogoutConfirmModal } from './features/auth/components/LogoutConfirmModal';
import { AuthAccountSummary, AuthScreenType } from './features/auth/types';

import { formatINR } from './utils/currency';

const ADMIN_VIEW_LABELS: Record<AdminViewType, string> = {
  DASHBOARD: 'Overview & Metrics',
  ANALYTICS: 'Reports & Business Analytics',
  VERTICALS: 'Multi-Vertical Engine',
  MASTER_CATEGORIES: 'Category & Subcategory Master',
  MASTER_BRANDS: 'Brand Master',
  MASTER_UNITS: 'Unit & Measurement Master',
  MASTER_ATTRIBUTES: 'Product Attribute Master',
  MASTER_VARIANTS: 'Product Variant & Size Master',
  MASTER_ADDONS: 'Add-ons & Customization Master',
  MASTER_PACKAGING: 'Packaging Master',
  MASTER_AVAILABILITY: 'Availability & Stock Configuration',
  PRODUCTS: 'Products & Inventory',
  APPLICATIONS: 'Seller KYC & Review',
  SELLERS: 'Master Seller Directory',
  SAFETY_QUALITY: 'Safety, Quality & Assessments',
  CUSTOMERS: 'Customers Directory',
  SERVICE_AREAS: 'Villages & Inter-Village Routes',
  ORDERS: 'Marketplace Orders',
  DELIVERY_FLEET: 'Delivery Partners & Fleet',
  OFFERS: 'Offers & Coupons',
  CMS_BANNERS: 'Home Banners, Featured Shops & CMS',
  REVIEWS: 'Reviews & Ratings Moderation',
  BROADCASTS: 'Notifications & Village Broadcasts',
  PAYOUTS: 'Payments, Refunds & Seller Payouts',
  FEE_RULES: 'Fee Rules & Shadow Pilot',
  POLICIES_TAX: 'Tax / GST & Cancellation Policies',
  UDHARI: 'Udhari Credit Oversight',
  SUPPORT: 'Disputes & Customer Support',
  ROLES: 'Admin Users & Roles',
  SETTINGS: 'Platform Settings',
  AUDIT_LOGS: 'Immutable Audit Trail',
};

type UserPortalRole = 'CUSTOMER' | 'SELLER' | 'ADMIN';
type CustomerView = 'MARKETPLACE' | 'CART' | 'CHECKOUT' | 'ORDER_TRACKING' | 'ORDER_HISTORY' | 'MY_UDHAR';

function MainMarketplaceApp() {
  const { firebaseUser, dbProfile, signOutUser } = useAuth();
  const { activeVillage, selectedLandmark, getDeliveryRelationship } = useVillage();
  const { items: cartItems, seller: cartSeller, addItem, forceAddItem, itemSubtotalPaise } = useCart();
  const {
    activeOrders,
    orders,
    sellerNotifications,
    latestIncomingNotification,
    dismissLatestNotification,
    markNotificationRead,
    markSellerNotificationsRead,
  } = useOrders();
  const { activeSeller, setActiveSellerId } = useSeller();
  const { getCustomerLedgersGrouped } = useUdhari();
  const {
    currentAdmin,
    pendingApplicationsCount,
    openSupportCasesCount,
    hasPermission,
    products: adminProducts,
    categories: adminCategories,
    units: adminUnits,
  } = useAdmin();

  // Merge Seller-created Master products into Customer Storefront lists live
  const dynamicFoodProducts: FoodProduct[] = [
    ...adminProducts
      .filter((p) => p.vertical === 'FOOD' && p.isActive && p.moderationStatus === 'APPROVED')
      .map((p): FoodProduct => {
        const cat = adminCategories.find((c) => c.id === p.categoryId);
        const unit = adminUnits.find((u) => u.id === p.unitId);
        return {
          id: p.id,
          sellerId: p.sellerId,
          sellerName: p.sellerName,
          categoryId: p.categoryId,
          categoryName: cat?.name || 'Specials',
          name: p.name,
          description: p.description,
          catalogueType: 'FOOD',
          pricePaise: p.pricePaise,
          unitBasis: unit?.symbol || 'plate',
          isActive: p.isActive,
          isAvailable: p.isAvailable,
          createdAt: p.createdAt,
          dietType: p.dietType || 'VEG',
          preparationTimeMinutes: p.prepTimeMinutes || 20,
          portionOptions:
            p.variants.length > 0
              ? p.variants.map((v) => ({
                  id: v.id,
                  label: v.label,
                  priceDeltaPaise: Math.max(0, v.pricePaise - p.pricePaise),
                }))
              : undefined,
        };
      }),
    ...MOCK_FOOD_PRODUCTS,
  ];

  const dynamicGroceryProducts: GroceryProduct[] = [
    ...adminProducts
      .filter((p) => p.vertical === 'GROCERY' && p.isActive && p.moderationStatus === 'APPROVED')
      .map((p): GroceryProduct => {
        const cat = adminCategories.find((c) => c.id === p.categoryId);
        const unit = adminUnits.find((u) => u.id === p.unitId);
        return {
          id: p.id,
          sellerId: p.sellerId,
          sellerName: p.sellerName,
          categoryId: p.categoryId,
          categoryName: cat?.name || 'Groceries',
          name: p.name,
          description: p.description,
          catalogueType: 'GROCERY',
          pricePaise: p.pricePaise,
          unitBasis: unit?.symbol || 'kg',
          isActive: p.isActive,
          isAvailable: p.isAvailable,
          createdAt: p.createdAt,
          quantityMode: p.variants.length > 0 ? 'PREDEFINED_OPTIONS' : 'FIXED_PACK',
          predefinedOptions:
            p.variants.length > 0
              ? p.variants.map((v) => ({
                  label: v.label,
                  quantityValue: 1,
                  unit: unit?.symbol || 'pack',
                  pricePaise: v.pricePaise,
                }))
              : undefined,
          minQuantity: 1,
          quantityStep: 1,
          quantityPrecision: 0,
          trackStock: true,
          stockQuantity: p.stockQuantity ?? 25,
          variableWeight: unit?.family === 'WEIGHT',
        };
      }),
    ...MOCK_GROCERY_PRODUCTS,
  ];

  // Master Portal Mode (Customer vs Seller vs Admin)
  const [activePortalRole, setActivePortalRole] = useState<UserPortalRole>('CUSTOMER');

  // Authentication UI View & Logout Modal State (UI-only)
  const [authScreen, setAuthScreen] = useState<AuthScreenType | null>(null);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  // Side Drawer, All Sections Menu & Mobile Sidebar States
  const [isAllSectionsOpen, setIsAllSectionsOpen] = useState(false);
  const [isCustomerDrawerOpen, setIsCustomerDrawerOpen] = useState(false);
  const [isSellerMobileOpen, setIsSellerMobileOpen] = useState(false);
  const [isAdminMobileOpen, setIsAdminMobileOpen] = useState(false);

  // Customer sub-navigation
  const [customerView, setCustomerView] = useState<CustomerView>('MARKETPLACE');
  const [activeTab, setActiveTab] = useState<'FOOD' | 'GROCERY'>('FOOD');
  const [shopViewMode, setShopViewMode] = useState<'list' | 'grid'>('list');
  const [coverageFilter, setCoverageFilter] = useState<'ALL' | 'LOCAL' | 'NEARBY'>('ALL');
  const [isVillageModalOpen, setIsVillageModalOpen] = useState(false);
  const [selectedSeller, setSelectedSeller] = useState<Seller | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('food_all');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTrackingOrderId, setActiveTrackingOrderId] = useState<string | null>(null);

  // Seller sub-navigation & notification dropdown
  const [sellerView, setSellerView] = useState<SellerViewType>('DASHBOARD');
  const [isSellerNotifOpen, setIsSellerNotifOpen] = useState(false);

  // Admin sub-navigation
  const [adminView, setAdminView] = useState<AdminViewType>('DASHBOARD');

  // If active admin switches to a role without view access to the current module, fall back to DASHBOARD
  useEffect(() => {
    if (activePortalRole === 'ADMIN' && !hasPermission(adminView, 'view')) {
      setAdminView('DASHBOARD');
    }
  }, [activePortalRole, adminView, currentAdmin.id, hasPermission]);

  // Cross-seller conflict prompt modal state
  const [conflictModalData, setConflictModalData] = useState<{
    item: Parameters<typeof addItem>[0];
    seller: Seller;
    conflictSeller: Seller;
  } | null>(null);

  // Notification toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleAddToCart = (itemToAdd: Parameters<typeof addItem>[0]) => {
    if (!selectedSeller) return;

    const result = addItem(itemToAdd, selectedSeller);
    if (!result.success && result.conflictSeller) {
      setConflictModalData({
        item: itemToAdd,
        seller: selectedSeller,
        conflictSeller: result.conflictSeller,
      });
      return;
    }

    showToast(`Added ${itemToAdd.productName} (${itemToAdd.unitLabel}) to cart!`);
  };

  const handleResolveConflict = (clearAndAdd: boolean) => {
    if (clearAndAdd && conflictModalData) {
      forceAddItem(conflictModalData.item, conflictModalData.seller);
      showToast(`Cart cleared and started with ${conflictModalData.seller.publicName}!`);
    }
    setConflictModalData(null);
  };

  // Evaluate location serviceability for shops in the active vertical (Food OR Grocery)
  // Sorted: Local village -> Nearby serviceable -> Other villages
  const coverageOrder: Record<string, number> = {
    LOCAL: 0,
    NEIGHBOR: 1,
    OUTSIDE_RANGE: 2,
  };

  const foodShopsTotal = MOCK_SELLERS.filter((s) => s.primaryVertical === 'FOOD').length;
  const groceryShopsTotal = MOCK_SELLERS.filter((s) => s.primaryVertical === 'GROCERY').length;

  const verticalFilteredShops = MOCK_SELLERS.filter(
    (seller) => seller.primaryVertical === activeTab
  )
    .map((seller) => ({
      seller,
      coverage: getDeliveryRelationship(seller),
    }))
    .sort(
      (a, b) =>
        (coverageOrder[a.coverage.coverageType] ?? 3) -
        (coverageOrder[b.coverage.coverageType] ?? 3)
    );

  // Split counts for quick coverage pills
  const localVillageStores = verticalFilteredShops.filter(
    ({ coverage }) => coverage.coverageType === 'LOCAL'
  );

  const neighboringVillageStores = verticalFilteredShops.filter(
    ({ coverage }) => coverage.coverageType === 'NEIGHBOR'
  );

  const coverageFilteredShops =
    coverageFilter === 'LOCAL'
      ? localVillageStores
      : coverageFilter === 'NEARBY'
      ? neighboringVillageStores
      : verticalFilteredShops;

  // Category chips strictly matched to active vertical (Food vs Grocery)
  const currentCategories = activeTab === 'FOOD' ? FOOD_CATEGORIES : GROCERY_CATEGORIES;

  // Apply category + search filter cleanly across active vertical's shops
  const filteredShops = coverageFilteredShops.filter(({ seller }) => {
    if (
      selectedCategory !== 'ALL' &&
      selectedCategory !== 'food_all' &&
      selectedCategory !== 'grocery_all'
    ) {
      const hasMatchingItem =
        activeTab === 'FOOD'
          ? MOCK_FOOD_PRODUCTS.some(
              (p) => p.sellerId === seller.id && p.categoryId === selectedCategory
            )
          : MOCK_GROCERY_PRODUCTS.some(
              (p) => p.sellerId === seller.id && p.categoryId === selectedCategory
            );
      if (!hasMatchingItem) return false;
    }

    // Search query filter (matches name, description, village, or shop type)
    const q = searchQuery.trim().toLowerCase();
    if (!q) return true;
    return (
      seller.publicName.toLowerCase().includes(q) ||
      (seller.description?.toLowerCase().includes(q) ?? false) ||
      seller.villageName.toLowerCase().includes(q) ||
      seller.sellerType.toLowerCase().includes(q)
    );
  });

  const handleSwitchVertical = (nextVertical: 'FOOD' | 'GROCERY') => {
    setActiveTab(nextVertical);
    setSelectedCategory(nextVertical === 'FOOD' ? 'food_all' : 'grocery_all');
    setCoverageFilter('ALL');
  };
  const sellerPendingCount = orders.filter(
    (o) =>
      o.sellerId === activeSeller.id &&
      ['placed', 'pending', 'accepted', 'preparing'].includes(o.status)
  ).length;

  const incomingOrdersCount = orders.filter(
    (o) => o.status === 'placed' || o.status === 'pending'
  ).length;

  const unreadSellerNotifs = sellerNotifications.filter((n) => !n.read);
  const sellerHeaderBadgeCount = Math.max(sellerPendingCount, incomingOrdersCount);

  const handleOpenSellerOrderTerminal = (sellerId: string, notifId?: string) => {
    setActiveSellerId(sellerId);
    setActivePortalRole('SELLER');
    setSellerView('TERMINAL');
    setIsSellerNotifOpen(false);
    dismissLatestNotification();
    if (notifId) {
      markNotificationRead(notifId);
    }
  };

  const customerLedgers = getCustomerLedgersGrouped('user_cust_1');
  const totalCustomerUdharOwed = customerLedgers.reduce(
    (acc, curr) => acc + curr.profile.outstandingBalancePaise,
    0
  );

  const getInitials = (fullName: string) =>
    fullName
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() || '')
      .join('') || 'GB';

  const activeAccountSummary: AuthAccountSummary =
    activePortalRole === 'ADMIN'
      ? {
          name: currentAdmin.name,
          identifier: currentAdmin.email,
          roleLabel: currentAdmin.role.replace(/_/g, ' '),
          locationLabel: 'Multi-Village HQ',
          initials: getInitials(currentAdmin.name),
          portal: 'ADMIN',
        }
      : activePortalRole === 'SELLER'
      ? {
          name: activeSeller.publicName,
          identifier: activeSeller.contactPhone,
          roleLabel: 'Seller Partner',
          locationLabel: activeSeller.villageName || activeVillage.name,
          initials: getInitials(activeSeller.publicName),
          portal: 'SELLER',
        }
      : {
          name: dbProfile?.displayName || firebaseUser?.displayName || 'Ramesh Kumar',
          identifier: firebaseUser?.email || '+91 98765 43210',
          roleLabel: 'Customer',
          locationLabel: activeVillage.name,
          initials: getInitials(
            dbProfile?.displayName || firebaseUser?.displayName || 'Ramesh Kumar'
          ),
          portal: 'CUSTOMER',
        };

  if (authScreen !== null) {
    return (
      <AuthExperience
        activeScreen={authScreen}
        onChangeScreen={setAuthScreen}
        onReturnToMarketplace={() => setAuthScreen(null)}
        onAuthComplete={(message) => {
          setAuthScreen(null);
          showToast(message);
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#1F2937]">
      {/* Universal Top Header */}
      <header className="sticky top-0 z-40 bg-white border-b border-[#E5E7EB] shadow-xs">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 h-16 flex items-center justify-between gap-2 sm:gap-4">
          {/* Left Brand & Mobile Side Menu Toggle */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            {/* Contextual Side Menu Toggle Button */}
            {activePortalRole === 'CUSTOMER' ? (
              <button
                onClick={() => setIsCustomerDrawerOpen(true)}
                className="w-9 h-9 rounded-xl hover:bg-[#F1F5F9] text-[#1F2937] flex items-center justify-center transition-colors cursor-pointer border border-[#E5E7EB]"
                title="Open Side Menu"
              >
                <Menu className="w-5 h-5" />
              </button>
            ) : activePortalRole === 'SELLER' ? (
              <button
                onClick={() => setIsSellerMobileOpen(true)}
                className="md:hidden w-9 h-9 rounded-xl hover:bg-[#F1F5F9] text-[#1F2937] flex items-center justify-center transition-colors cursor-pointer border border-[#E5E7EB]"
                title="Open Seller Menu"
              >
                <Menu className="w-5 h-5" />
              </button>
            ) : (
              <button
                onClick={() => setIsAdminMobileOpen(true)}
                className="md:hidden w-9 h-9 rounded-xl hover:bg-[#F1F5F9] text-[#1F2937] flex items-center justify-center transition-colors cursor-pointer border border-[#E5E7EB]"
                title="Open Admin Menu"
              >
                <Menu className="w-5 h-5" />
              </button>
            )}

            {/* Logo */}
            <button
              onClick={() => {
                if (activePortalRole === 'CUSTOMER') {
                  setSelectedSeller(null);
                  setCustomerView('MARKETPLACE');
                } else if (activePortalRole === 'SELLER') {
                  setSellerView('DASHBOARD');
                } else {
                  setAdminView('DASHBOARD');
                }
              }}
              className="flex items-center gap-2.5 cursor-pointer text-left"
            >
              <div className="w-9 h-9 rounded-full bg-[#218838] text-white flex items-center justify-center font-black text-base shadow-xs">
                GB
              </div>
              <div className="hidden xs:block">
                <span className="font-extrabold text-base sm:text-lg text-[#1F2937] tracking-tight">
                  GramBazaar
                </span>
              </div>
            </button>

            {/* Universal All Sections Menu Trigger */}
            <button
              type="button"
              onClick={() => setIsAllSectionsOpen(true)}
              className="flex items-center gap-1.5 h-9 px-2.5 sm:px-3 rounded-full bg-[#F8FAFC] hover:bg-[#E8F5E9] text-[#1F2937] hover:text-[#176B2C] border border-[#E5E7EB] hover:border-[#218838]/40 text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0"
              title="Open All Sections Menu"
            >
              <LayoutGrid className="w-3.5 h-3.5 text-[#218838] shrink-0" />
              <span className="hidden sm:inline">All Sections</span>
            </button>
          </div>

          {/* MASTER ROLE SWITCHER PILL (Customer vs Seller Portal vs Super Admin) */}
          <div className="inline-flex items-center p-1 bg-[#F1F5F9] rounded-full border border-[#CBD5E1] shadow-xs">
            <button
              onClick={() => setActivePortalRole('CUSTOMER')}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                activePortalRole === 'CUSTOMER'
                  ? 'bg-[#218838] text-white shadow-xs'
                  : 'text-[#475569] hover:text-[#1F2937]'
              }`}
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Customer</span>
            </button>

            <button
              onClick={() => setActivePortalRole('SELLER')}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                activePortalRole === 'SELLER'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-[#475569] hover:text-[#1F2937]'
              }`}
            >
              <Store className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Seller</span>
              {sellerHeaderBadgeCount > 0 && (
                <span
                  className={`min-w-4 h-4 px-1 rounded-full bg-[#DC2626] text-white text-[10px] font-bold flex items-center justify-center ${
                    incomingOrdersCount > 0 ? 'animate-pulse' : ''
                  }`}
                >
                  {sellerHeaderBadgeCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActivePortalRole('ADMIN')}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                activePortalRole === 'ADMIN'
                  ? 'bg-indigo-950 text-white shadow-xs'
                  : 'text-[#475569] hover:text-[#1F2937]'
              }`}
            >
              <Shield className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">Admin</span>
              {pendingApplicationsCount > 0 && (
                <span className="w-4 h-4 rounded-full bg-[#DC2626] text-white text-[10px] font-bold flex items-center justify-center">
                  {pendingApplicationsCount}
                </span>
              )}
            </button>
          </div>

          {/* Contextual Header Actions + Account Dropdown */}
          <div className="flex items-center gap-1.5 sm:gap-2.5">
            {activePortalRole === 'CUSTOMER' ? (
              <>
                {/* Dynamic Location Badge */}
                <button
                  onClick={() => setIsVillageModalOpen(true)}
                  className="hidden md:flex items-center gap-1.5 px-3 py-1.5 bg-[#F1F5F9] hover:bg-[#E2E8F0] border border-[#E5E7EB] rounded-full text-xs font-semibold text-[#1F2937] transition-all cursor-pointer select-none"
                >
                  <MapPin className="w-3.5 h-3.5 text-[#218838]" />
                  <span className="font-bold truncate max-w-[90px]">{activeVillage.name}</span>
                  <ChevronDown className="w-3 h-3 text-[#6B7280]" />
                </button>

                {/* My Udhar Button */}
                <button
                  onClick={() => {
                    setSelectedSeller(null);
                    setCustomerView('MY_UDHAR');
                  }}
                  className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full text-xs font-semibold border transition-all cursor-pointer ${
                    customerView === 'MY_UDHAR'
                      ? 'bg-[#218838] text-white border-[#218838]'
                      : 'bg-white text-[#475569] border-[#E5E7EB] hover:bg-[#F8FAFC]'
                  }`}
                  title="Mera Udhar Khata"
                >
                  <BookOpen className="w-3.5 h-3.5 text-[#D97706]" />
                  <span className="hidden lg:inline">My Udhar</span>
                  {totalCustomerUdharOwed > 0 && (
                    <span className="text-[10px] font-bold text-[#DC2626] bg-[#FEE2E2] px-1.5 py-0.2 rounded-full">
                      {formatINR(totalCustomerUdharOwed)}
                    </span>
                  )}
                </button>

                {/* My Orders Button */}
                <button
                  onClick={() => {
                    setSelectedSeller(null);
                    setCustomerView('ORDER_HISTORY');
                  }}
                  className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full text-xs font-semibold border transition-all cursor-pointer ${
                    customerView === 'ORDER_HISTORY'
                      ? 'bg-[#218838] text-white border-[#218838]'
                      : 'bg-white text-[#475569] border-[#E5E7EB] hover:bg-[#F8FAFC]'
                  }`}
                  title="My Orders"
                >
                  <ClipboardList className="w-3.5 h-3.5" />
                  <span className="hidden lg:inline">Orders</span>
                  {activeOrders.length > 0 && (
                    <span className="w-4 h-4 rounded-full bg-[#F59E0B] text-white text-[10px] font-bold flex items-center justify-center">
                      {activeOrders.length}
                    </span>
                  )}
                </button>

                {/* Cart Button */}
                <button
                  onClick={() => {
                    setSelectedSeller(null);
                    setCustomerView('CART');
                  }}
                  className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer border ${
                    cartItems.length > 0
                      ? 'bg-[#E8F5E9] text-[#176B2C] border-[#A7F3D0]'
                      : 'bg-white text-[#6B7280] border-[#E5E7EB]'
                  }`}
                  title="Shopping Cart"
                >
                  <ShoppingBag className="w-3.5 h-3.5 text-[#218838]" />
                  <span>{cartItems.length}</span>
                </button>
              </>
            ) : activePortalRole === 'SELLER' ? (
              /* Seller Portal Header Controls */
              <>
                <span className="hidden lg:inline-block text-xs font-bold text-[#1F2937] max-w-[180px] truncate">
                  {activeSeller.publicName}
                </span>

                {/* Seller Order Notification Bell + Dropdown */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setIsSellerNotifOpen((prev) => !prev)}
                    className={`relative w-9 h-9 rounded-full border flex items-center justify-center transition-colors cursor-pointer ${
                      unreadSellerNotifs.length > 0
                        ? 'bg-[#FEF3C7] border-[#F59E0B] text-[#B45309]'
                        : 'bg-white border-[#E5E7EB] text-[#475569] hover:bg-[#F8FAFC]'
                    }`}
                    title="Incoming Seller Order Notifications"
                    aria-label="Seller order notifications"
                  >
                    <Bell
                      className={`w-4 h-4 ${
                        unreadSellerNotifs.length > 0 ? 'animate-bounce' : ''
                      }`}
                    />
                    {unreadSellerNotifs.length > 0 && (
                      <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 rounded-full bg-[#DC2626] text-white text-[10px] font-extrabold flex items-center justify-center">
                        {unreadSellerNotifs.length}
                      </span>
                    )}
                  </button>

                  {isSellerNotifOpen && (
                    <>
                      <div
                        className="fixed inset-0 z-40"
                        onClick={() => setIsSellerNotifOpen(false)}
                      />
                      <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl border border-[#E5E7EB] shadow-2xl z-50 overflow-hidden text-left">
                        <div className="px-4 py-3 bg-[#F8FAFC] border-b border-[#E5E7EB] flex items-center justify-between">
                          <div>
                            <p className="text-xs font-extrabold text-[#1F2937]">
                              Seller Order Notifications
                            </p>
                            <p className="text-[11px] text-[#6B7280]">
                              {unreadSellerNotifs.length} pending acceptance
                            </p>
                          </div>
                          {unreadSellerNotifs.length > 0 && (
                            <button
                              type="button"
                              onClick={() => markSellerNotificationsRead(activeSeller.id)}
                              className="text-[11px] font-bold text-[#218838] hover:underline cursor-pointer"
                            >
                              Mark shop read
                            </button>
                          )}
                        </div>

                        <div className="max-h-80 overflow-y-auto divide-y divide-[#F1F5F9]">
                          {sellerNotifications.length === 0 ? (
                            <div className="p-6 text-center text-xs text-[#6B7280]">
                              No order notifications yet.
                            </div>
                          ) : (
                            sellerNotifications.slice(0, 8).map((notif) => (
                              <div
                                key={notif.id}
                                className={`p-3.5 transition-colors ${
                                  notif.read ? 'bg-white' : 'bg-[#FFFBEB]'
                                }`}
                              >
                                <div className="flex items-start justify-between gap-2">
                                  <div className="min-w-0">
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                      {!notif.read && (
                                        <span className="w-2 h-2 rounded-full bg-[#DC2626] shrink-0" />
                                      )}
                                      <span className="font-mono text-[11px] font-bold text-[#1F2937]">
                                        {notif.orderNumber}
                                      </span>
                                      <Badge
                                        variant={notif.read ? 'neutral' : 'warning'}
                                        size="sm"
                                      >
                                        {notif.paymentMethod}
                                      </Badge>
                                    </div>
                                    <p className="text-xs font-bold text-[#1F2937] mt-1 truncate">
                                      {notif.sellerName}
                                    </p>
                                    <p className="text-[11px] text-[#6B7280] mt-0.5">
                                      {notif.customerName} • {notif.itemsCount}{' '}
                                      {notif.itemsCount === 1 ? 'item' : 'items'} •{' '}
                                      <strong className="text-[#176B2C]">
                                        {formatINR(notif.totalPaise)}
                                      </strong>
                                    </p>
                                  </div>
                                  <Button
                                    variant="primary"
                                    size="sm"
                                    onClick={() =>
                                      handleOpenSellerOrderTerminal(notif.sellerId, notif.id)
                                    }
                                  >
                                    Accept
                                  </Button>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    </>
                  )}
                </div>

                <button
                  onClick={() => setSellerView('TERMINAL')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all cursor-pointer ${
                    sellerView === 'TERMINAL'
                      ? 'bg-[#218838] text-white border-[#218838]'
                      : 'bg-white text-[#475569] border-[#E5E7EB]'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Live Queue</span>
                  {sellerPendingCount > 0 && (
                    <span className="w-4 h-4 rounded-full bg-[#DC2626] text-white text-[10px] font-bold flex items-center justify-center">
                      {sellerPendingCount}
                    </span>
                  )}
                </button>
              </>
            ) : (
              /* Super Admin Portal Header Controls */
              <AdminHeaderTools onSelectView={setAdminView} />
            )}

            {/* Unified User Profile & Account Dropdown */}
            <AccountDropdown
              account={activeAccountSummary}
              onOpenAuthScreen={(screen) => setAuthScreen(screen)}
              onRequestLogout={() => setIsLogoutModalOpen(true)}
            />
          </div>
        </div>
      </header>

      {/* Main Body Shell with Sidebars */}
      <div className="flex">
        {/* Persistent Collapsible Sidebar for Admin */}
        {activePortalRole === 'ADMIN' && (
          <AdminSidebar
            currentView={adminView}
            onSelectView={setAdminView}
            onOpenAllSections={() => setIsAllSectionsOpen(true)}
            isMobileOpen={isAdminMobileOpen}
            onMobileClose={() => setIsAdminMobileOpen(false)}
          />
        )}

        {/* Persistent Collapsible Sidebar for Seller */}
        {activePortalRole === 'SELLER' && (
          <SellerSidebar
            currentView={sellerView}
            onSelectView={setSellerView}
            onOpenAllSections={() => setIsAllSectionsOpen(true)}
            isMobileOpen={isSellerMobileOpen}
            onMobileClose={() => setIsSellerMobileOpen(false)}
          />
        )}

        {/* Primary Content View Area */}
        <main
          className={`flex-1 min-w-0 mx-auto px-4 sm:px-6 pt-6 pb-28 ${
            activePortalRole === 'ADMIN' ? 'max-w-[1600px]' : 'max-w-7xl'
          }`}
        >
          {activePortalRole === 'ADMIN' ? (
            /* SUPER ADMIN GOVERNANCE SUITE VIEWS */
            <div className="space-y-4">
              <Breadcrumbs
                items={
                  MASTER_VIEW_KEYS.includes(adminView)
                    ? [
                        { label: 'Admin Suite', onClick: () => setAdminView('DASHBOARD') },
                        {
                          label: 'Masters',
                          onClick: () => setAdminView('MASTER_CATEGORIES'),
                        },
                        { label: ADMIN_VIEW_LABELS[adminView] },
                      ]
                    : [
                        { label: 'Admin Suite', onClick: () => setAdminView('DASHBOARD') },
                        { label: ADMIN_VIEW_LABELS[adminView] },
                      ]
                }
              />

              {adminView === 'DASHBOARD' && (
                <AdminDashboardView onNavigate={setAdminView} />
              )}
              {adminView === 'ANALYTICS' && <AdminAnalyticsView />}
              {adminView === 'VERTICALS' && <AdminVerticalsView />}
              {adminView === 'MASTER_CATEGORIES' && <CategorySubcategoryMasterView />}
              {adminView === 'MASTER_BRANDS' && <BrandMasterView />}
              {adminView === 'MASTER_UNITS' && <UnitMeasurementMasterView />}
              {adminView === 'MASTER_ATTRIBUTES' && <ProductAttributeMasterView />}
              {adminView === 'MASTER_VARIANTS' && <ProductVariantSizeMasterView />}
              {adminView === 'MASTER_ADDONS' && <AddonsCustomizationMasterView />}
              {adminView === 'MASTER_PACKAGING' && <PackagingMasterView />}
              {adminView === 'MASTER_AVAILABILITY' && <AvailabilityStockConfigMasterView />}
              {adminView === 'PRODUCTS' && <AdminProductsView />}
              {adminView === 'APPLICATIONS' && <AdminSellerApplicationsView />}
              {adminView === 'SELLERS' && <AdminSellerDirectoryView />}
              {adminView === 'SAFETY_QUALITY' && <AdminSafetyQualityView />}
              {adminView === 'CUSTOMERS' && <AdminCustomersView />}
              {adminView === 'SERVICE_AREAS' && <AdminServiceAreasView />}
              {adminView === 'ORDERS' && <AdminOrdersView />}
              {adminView === 'DELIVERY_FLEET' && <AdminDeliveryFleetView />}
              {adminView === 'OFFERS' && <AdminOffersView />}
              {adminView === 'CMS_BANNERS' && <AdminCmsBannersView />}
              {adminView === 'REVIEWS' && <AdminReviewsView />}
              {adminView === 'BROADCASTS' && <AdminBroadcastsView />}
              {adminView === 'PAYOUTS' && <AdminPayoutsView />}
              {adminView === 'FEE_RULES' && <AdminFeeRulesView />}
              {adminView === 'POLICIES_TAX' && <AdminTaxPoliciesView />}
              {adminView === 'UDHARI' && <AdminUdhariView />}
              {adminView === 'SUPPORT' && <AdminSupportView />}
              {adminView === 'ROLES' && <AdminRolesView />}
              {adminView === 'SETTINGS' && <AdminSettingsView />}
              {adminView === 'AUDIT_LOGS' && <AdminAuditLogsView />}
            </div>
          ) : activePortalRole === 'SELLER' ? (
            /* SELLER MANAGEMENT PORTAL VIEWS */
            <div className="space-y-4">
              <Breadcrumbs
                items={[
                  { label: activeSeller.publicName, onClick: () => setSellerView('DASHBOARD') },
                  {
                    label:
                      sellerView === 'DASHBOARD'
                        ? 'Store Dashboard'
                        : sellerView === 'ANALYTICS'
                        ? 'Store Analytics'
                        : sellerView === 'TERMINAL'
                        ? 'Live Orders Queue'
                        : sellerView === 'DISPATCH'
                        ? 'Delivery Fleet & Dispatch'
                        : sellerView === 'CATALOG'
                        ? 'Menu & Products'
                        : sellerView === 'MASTERS'
                        ? 'Product Masters (8)'
                        : sellerView === 'INVENTORY'
                        ? 'Inventory & Stock'
                        : sellerView === 'UDHARI'
                        ? 'Customer Udhari Khata'
                        : sellerView === 'SAFETY_QUALITY'
                        ? 'Safety, Quality & Exam'
                        : 'Store Settings',
                  },
                ]}
              />

              {sellerView === 'DASHBOARD' && (
                <SellerDashboardView
                  onOpenTerminal={() => setSellerView('TERMINAL')}
                  onOpenDispatch={() => setSellerView('DISPATCH')}
                  onOpenAnalytics={() => setSellerView('ANALYTICS')}
                />
              )}
              {sellerView === 'ANALYTICS' && <SellerAnalyticsView />}
              {sellerView === 'TERMINAL' && <SellerOrdersTerminal />}
              {sellerView === 'DISPATCH' && <SellerDispatchView />}
              {sellerView === 'CATALOG' && <SellerCatalogView initialTab="CATALOG" />}
              {sellerView === 'MASTERS' && <SellerCatalogView initialTab="MASTERS" />}
              {sellerView === 'INVENTORY' && <SellerCatalogView initialTab="INVENTORY" />}
              {sellerView === 'UDHARI' && <SellerUdhariView />}
              {sellerView === 'SAFETY_QUALITY' && <SellerSafetyQualityView />}
              {sellerView === 'SETTINGS' && <SellerSettingsView />}
            </div>
          ) : (
            /* CUSTOMER MARKETPLACE VIEWS */
            customerView === 'CART' ? (
              <CartView
                onBackToShopping={() => setCustomerView('MARKETPLACE')}
                onProceedToCheckout={() => setCustomerView('CHECKOUT')}
              />
            ) : customerView === 'CHECKOUT' ? (
              <CheckoutView
                onBackToCart={() => setCustomerView('CART')}
                onOrderSuccess={(orderId) => {
                  setActiveTrackingOrderId(orderId);
                  setCustomerView('ORDER_TRACKING');
                  showToast('Order confirmed successfully!');
                }}
              />
            ) : customerView === 'ORDER_TRACKING' && activeTrackingOrderId ? (
              <OrderTrackingView
                orderId={activeTrackingOrderId}
                onBackToOrders={() => setCustomerView('ORDER_HISTORY')}
                onBackToHome={() => {
                  setCustomerView('MARKETPLACE');
                  setSelectedSeller(null);
                }}
                onOpenSellerTerminal={(sellerId) => handleOpenSellerOrderTerminal(sellerId)}
              />
            ) : customerView === 'ORDER_HISTORY' ? (
              <OrderHistoryView
                onBackToHome={() => {
                  setCustomerView('MARKETPLACE');
                  setSelectedSeller(null);
                }}
                onTrackOrder={(orderId) => {
                  setActiveTrackingOrderId(orderId);
                  setCustomerView('ORDER_TRACKING');
                }}
              />
            ) : customerView === 'MY_UDHAR' ? (
              <CustomerUdharView
                onBackToShopping={() => {
                  setCustomerView('MARKETPLACE');
                  setSelectedSeller(null);
                }}
              />
            ) : selectedSeller ? (
              <StorefrontView
                seller={selectedSeller}
                foodItems={dynamicFoodProducts}
                groceryItems={dynamicGroceryProducts}
                onBack={() => setSelectedSeller(null)}
                onAddToCart={handleAddToCart}
              />
            ) : (
              /* MARKETPLACE DISCOVERY VIEW */
              <div className="space-y-4 animate-fade-in text-left">
                {/* 1. VERY TOP: FOOD | GROCERY SWITCH BAR + COMPACT VILLAGE PICKER */}
                <div className="bg-white rounded-2xl border border-[#E5E7EB] p-2.5 sm:p-3 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  {/* Sliding Food | Grocery Switch Bar */}
                  <div
                    role="tablist"
                    aria-label="Switch between Food and Grocery"
                    className="relative grid grid-cols-2 p-1 rounded-full bg-[#F1F5F9] border border-[#E5E7EB] w-full sm:w-[340px] shrink-0 select-none"
                  >
                    {/* Sliding active pill indicator */}
                    <div
                      aria-hidden="true"
                      className={`absolute top-1 bottom-1 left-1 w-[calc(50%-4px)] rounded-full shadow-sm transition-all duration-200 ease-out ${
                        activeTab === 'GROCERY'
                          ? 'translate-x-full bg-[#218838]'
                          : 'translate-x-0 bg-[#D97706]'
                      }`}
                    />

                    <button
                      type="button"
                      role="tab"
                      aria-selected={activeTab === 'FOOD'}
                      onClick={() => handleSwitchVertical('FOOD')}
                      className={`relative z-10 flex items-center justify-center gap-2 py-2 px-3 rounded-full text-xs sm:text-sm font-bold transition-colors cursor-pointer ${
                        activeTab === 'FOOD'
                          ? 'text-white'
                          : 'text-[#6B7280] hover:text-[#1F2937]'
                      }`}
                    >
                      <Utensils className="w-3.5 h-3.5 shrink-0" />
                      <span>Food</span>
                      <span
                        className={`text-[11px] px-1.5 py-0.5 rounded-full font-bold leading-none ${
                          activeTab === 'FOOD'
                            ? 'bg-white/20 text-white'
                            : 'bg-[#E2E8F0] text-[#475569]'
                        }`}
                      >
                        {foodShopsTotal}
                      </span>
                    </button>

                    <button
                      type="button"
                      role="tab"
                      aria-selected={activeTab === 'GROCERY'}
                      onClick={() => handleSwitchVertical('GROCERY')}
                      className={`relative z-10 flex items-center justify-center gap-2 py-2 px-3 rounded-full text-xs sm:text-sm font-bold transition-colors cursor-pointer ${
                        activeTab === 'GROCERY'
                          ? 'text-white'
                          : 'text-[#6B7280] hover:text-[#1F2937]'
                      }`}
                    >
                      <ShoppingBag className="w-3.5 h-3.5 shrink-0" />
                      <span>Grocery</span>
                      <span
                        className={`text-[11px] px-1.5 py-0.5 rounded-full font-bold leading-none ${
                          activeTab === 'GROCERY'
                            ? 'bg-white/20 text-white'
                            : 'bg-[#E2E8F0] text-[#475569]'
                        }`}
                      >
                        {groceryShopsTotal}
                      </span>
                    </button>
                  </div>

                  {/* Active Village Location Trigger */}
                  <button
                    type="button"
                    onClick={() => setIsVillageModalOpen(true)}
                    className="flex items-center justify-between sm:justify-end gap-2 px-3 py-2 rounded-xl bg-[#F8FAFC] hover:bg-[#E8F5E9] border border-[#E5E7EB] hover:border-[#218838]/40 transition-colors cursor-pointer text-left"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <MapPin className="w-4 h-4 text-[#218838] shrink-0" />
                      <div className="min-w-0">
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-[#6B7280] leading-none">
                          Delivering To
                        </p>
                        <p className="text-xs font-bold text-[#1F2937] truncate mt-0.5">
                          {activeVillage.name} • {selectedLandmark}
                        </p>
                      </div>
                    </div>
                    <span className="text-[11px] font-bold text-[#218838] shrink-0 pl-1">
                      Change
                    </span>
                  </button>
                </div>

                {/* 2. DYNAMIC VERTICAL HERO BANNER (Changes per Food vs Grocery Switch) */}
                <div
                  key={activeTab}
                  className="relative rounded-2xl overflow-hidden shadow-sm border border-[#E5E7EB] min-h-[156px] sm:min-h-[184px] flex items-center animate-fade-in"
                >
                  <img
                    src={activeTab === 'FOOD' ? bannerFoodDeliveryImg : bannerGroceryKiranaImg}
                    alt={
                      activeTab === 'FOOD'
                        ? 'Village Food Delivery Banner'
                        : 'Village Grocery and Kirana Banner'
                    }
                    referrerPolicy="no-referrer"
                    className="absolute inset-0 w-full h-full object-cover object-right"
                  />

                  {/* Scrim overlay tailored to active vertical */}
                  <div
                    aria-hidden="true"
                    className={`absolute inset-0 ${
                      activeTab === 'FOOD'
                        ? 'bg-gradient-to-r from-[#261206]/95 via-[#331808]/80 to-[#261206]/20'
                        : 'bg-gradient-to-r from-[#0D3518]/95 via-[#134D22]/80 to-[#0D3518]/20'
                    }`}
                  />

                  {/* Banner Copy Content */}
                  <div className="relative z-10 p-4 sm:p-6 max-w-xl text-white space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`inline-flex items-center gap-1 text-[10px] sm:text-[11px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full ${
                          activeTab === 'FOOD'
                            ? 'bg-[#F59E0B] text-[#1F2937]'
                            : 'bg-[#218838] text-white'
                        }`}
                      >
                        {activeTab === 'FOOD' ? (
                          <>
                            <Utensils className="w-3 h-3" />
                            Food & Dhaba Delivery
                          </>
                        ) : (
                          <>
                            <ShoppingBag className="w-3 h-3" />
                            Grocery & Kirana Mart
                          </>
                        )}
                      </span>
                      <span className="text-[11px] text-white/85 font-medium">
                        {activeVillage.name} & Nearby Villages
                      </span>
                    </div>

                    <h2 className="text-lg sm:text-2xl font-extrabold leading-tight tracking-tight">
                      {activeTab === 'FOOD'
                        ? 'Garam Garam Thali, Dhaba Khana & Snacks'
                        : 'Shuddh Chakki Atta, Dal, Oil & Rozana Kirana'}
                    </h2>

                    <p className="text-xs sm:text-sm text-white/85 leading-snug max-w-md">
                      {activeTab === 'FOOD'
                        ? `Order fresh tandoori roti, shahi thali, samosa, jalebi & kulhad chai from ${foodShopsTotal} trusted village kitchens.`
                        : `Order daily household groceries, grains, spices & mustard oil at village rates from ${groceryShopsTotal} trusted kirana stores.`}
                    </p>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 pt-1 text-[11px] font-semibold text-white/90">
                      <span className="inline-flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-[#F59E0B]" />
                        {activeTab === 'FOOD' ? '20–30 Min Hot Delivery' : '30–45 Min Doorstep'}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#4ADE80]" />
                        {activeTab === 'FOOD' ? '100% Pure Veg Kitchens' : 'Local Weight Options'}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Truck className="w-3.5 h-3.5 text-[#93C5FD]" />
                        {activeTab === 'FOOD' ? 'COD & UPI Accepted' : 'COD, UPI & Udhari'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 3. COMPACT SEARCH & CATEGORY CHIPS STRIP */}
                <div className="bg-white rounded-2xl border border-[#E5E7EB] p-3 shadow-xs flex flex-col md:flex-row md:items-center gap-2.5">
                  <div className="relative md:w-72 shrink-0">
                    <Search className="w-4 h-4 text-[#6B7280] absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder={
                        activeTab === 'FOOD'
                          ? 'Search dhaba, sweets, snacks, village...'
                          : 'Search kirana, super store, grocery, village...'
                      }
                      className="w-full h-9 pl-9 pr-4 bg-[#F8FAFC] border border-[#E5E7EB] rounded-full text-xs text-[#1F2937] outline-none focus:border-[#218838]"
                    />
                  </div>

                  {/* Horizontal Category Chips */}
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 md:pb-0">
                    {currentCategories.map((cat) => (
                      <button
                        key={cat.id}
                        onClick={() => setSelectedCategory(cat.id)}
                        className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                          selectedCategory === cat.id
                            ? 'bg-[#218838] text-white'
                            : 'bg-[#F1F5F9] text-[#475569] hover:bg-[#E2E8F0]'
                        }`}
                      >
                        {cat.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* COMPLETE SHOPS LIST SECTION (Compact List View Default) */}
                <div>
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-sm sm:text-base font-bold text-[#1F2937]">
                        {activeTab === 'FOOD' ? 'Food & Dhaba Shops' : 'Grocery & Kirana Shops'}
                      </h3>
                      <Badge variant="primary" size="sm">
                        {filteredShops.length} of {verticalFilteredShops.length} Shops
                      </Badge>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      {/* Quick Location Coverage Filter */}
                      <div className="inline-flex items-center bg-[#F1F5F9] p-0.5 rounded-full border border-[#E5E7EB] text-[11px] font-semibold">
                        <button
                          onClick={() => setCoverageFilter('ALL')}
                          className={`px-2.5 py-1 rounded-full transition-colors cursor-pointer ${
                            coverageFilter === 'ALL'
                              ? 'bg-white text-[#1F2937] shadow-2xs'
                              : 'text-[#6B7280] hover:text-[#1F2937]'
                          }`}
                        >
                          All ({verticalFilteredShops.length})
                        </button>
                        <button
                          onClick={() => setCoverageFilter('LOCAL')}
                          className={`px-2.5 py-1 rounded-full transition-colors cursor-pointer ${
                            coverageFilter === 'LOCAL'
                              ? 'bg-white text-[#218838] shadow-2xs'
                              : 'text-[#6B7280] hover:text-[#1F2937]'
                          }`}
                        >
                          In {activeVillage.name} ({localVillageStores.length})
                        </button>
                        <button
                          onClick={() => setCoverageFilter('NEARBY')}
                          className={`px-2.5 py-1 rounded-full transition-colors cursor-pointer ${
                            coverageFilter === 'NEARBY'
                              ? 'bg-white text-[#2563EB] shadow-2xs'
                              : 'text-[#6B7280] hover:text-[#1F2937]'
                          }`}
                        >
                          Nearby ({neighboringVillageStores.length})
                        </button>
                      </div>

                      {/* List / Grid View Switcher (List View default to save space) */}
                      <div
                        className="inline-flex items-center bg-[#F1F5F9] p-0.5 rounded-lg border border-[#E5E7EB]"
                        role="group"
                        aria-label="Shop view layout"
                      >
                        <button
                          type="button"
                          title="Compact List View"
                          onClick={() => setShopViewMode('list')}
                          className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                            shopViewMode === 'list'
                              ? 'bg-white text-[#218838] shadow-2xs'
                              : 'text-[#6B7280] hover:text-[#1F2937]'
                          }`}
                        >
                          <LayoutList className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          title="Grid View"
                          onClick={() => setShopViewMode('grid')}
                          className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                            shopViewMode === 'grid'
                              ? 'bg-white text-[#218838] shadow-2xs'
                              : 'text-[#6B7280] hover:text-[#1F2937]'
                          }`}
                        >
                          <LayoutGrid className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {filteredShops.length > 0 ? (
                    shopViewMode === 'list' ? (
                      <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-xs overflow-hidden divide-y divide-[#E5E7EB]">
                        {filteredShops.map(({ seller, coverage }) => (
                          <StoreCard
                            key={seller.id}
                            seller={seller}
                            deliveryRelationship={coverage}
                            variant="list"
                            onClick={() => setSelectedSeller(seller)}
                          />
                        ))}
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredShops.map(({ seller, coverage }) => (
                          <StoreCard
                            key={seller.id}
                            seller={seller}
                            deliveryRelationship={coverage}
                            variant="grid"
                            onClick={() => setSelectedSeller(seller)}
                          />
                        ))}
                      </div>
                    )
                  ) : (
                    <div className="p-8 text-center bg-white rounded-2xl border border-[#E5E7EB] space-y-2">
                      <p className="text-sm font-medium text-[#1F2937]">
                        No shops match your current filter.
                      </p>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => {
                          setCoverageFilter('ALL');
                          setSelectedCategory(activeTab === 'FOOD' ? 'food_all' : 'grocery_all');
                          setSearchQuery('');
                        }}
                      >
                        Show All {verticalFilteredShops.length}{' '}
                        {activeTab === 'FOOD' ? 'Food' : 'Grocery'} Shops
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            )
          )}
        </main>
      </div>

      {/* Customer Side Navigation Drawer */}
      <CustomerDrawer
        isOpen={isCustomerDrawerOpen}
        onClose={() => setIsCustomerDrawerOpen(false)}
        onNavigate={(view, category) => {
          setSelectedSeller(null);
          setCustomerView(view);
          if (category) {
            handleSwitchVertical(category);
          }
        }}
        onTrackOrder={(orderId) => {
          setSelectedSeller(null);
          setActiveTrackingOrderId(orderId);
          setCustomerView('ORDER_TRACKING');
        }}
        onOpenVillageModal={() => setIsVillageModalOpen(true)}
        onOpenAllSections={() => setIsAllSectionsOpen(true)}
        onSwitchToSeller={(view) => {
          setActivePortalRole('SELLER');
          setSellerView(view);
        }}
        onSwitchToAdmin={() => {
          setActivePortalRole('ADMIN');
          setAdminView('DASHBOARD');
        }}
      />

      {/* Universal All Sections Directory Menu */}
      <AllSectionsMenuModal
        isOpen={isAllSectionsOpen}
        onClose={() => setIsAllSectionsOpen(false)}
        activePortalRole={activePortalRole}
        customerView={customerView}
        customerVertical={activeTab}
        sellerView={sellerView}
        adminView={adminView}
        onNavigateCustomer={(view, vertical) => {
          setActivePortalRole('CUSTOMER');
          setSelectedSeller(null);
          setCustomerView(view);
          if (vertical) {
            handleSwitchVertical(vertical);
          }
        }}
        onTrackLatestOrder={() => {
          setActivePortalRole('CUSTOMER');
          setSelectedSeller(null);
          const targetOrder = activeOrders[0] || orders[0];
          if (targetOrder) {
            setActiveTrackingOrderId(targetOrder.id);
            setCustomerView('ORDER_TRACKING');
          } else {
            setCustomerView('ORDER_HISTORY');
          }
        }}
        onOpenVillageModal={() => {
          setActivePortalRole('CUSTOMER');
          setIsVillageModalOpen(true);
        }}
        onNavigateSeller={(view) => {
          setActivePortalRole('SELLER');
          setSellerView(view);
        }}
        onNavigateAdmin={(view) => {
          setActivePortalRole('ADMIN');
          setAdminView(view);
        }}
        onOpenAuthScreen={(screen) => {
          setAuthScreen(screen);
        }}
      />

      {/* Floating Bottom Cart Bar */}
      {cartItems.length > 0 &&
        activePortalRole === 'CUSTOMER' &&
        customerView === 'MARKETPLACE' && (
          <div className="fixed bottom-4 inset-x-4 max-w-2xl mx-auto z-40 bg-[#1F2937] text-white p-3.5 sm:p-4 rounded-2xl shadow-2xl flex items-center justify-between border border-slate-700 animate-slide-up">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#218838] flex items-center justify-center font-bold tabular-nums">
                {cartItems.reduce((sum, item) => sum + item.quantity, 0)}
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-300">
                  Order from {cartSeller?.publicName || 'Local Shop'}
                </p>
                <p className="text-sm font-bold text-white">
                  {formatINR(itemSubtotalPaise)}{' '}
                  <span className="text-[11px] font-normal text-slate-400">
                    plus delivery
                  </span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="primary"
                size="sm"
                rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                onClick={() => setCustomerView('CART')}
              >
                View Cart & Checkout
              </Button>
            </div>
          </div>
        )}

      {/* Cross-Seller Conflict Warning Modal */}
      {conflictModalData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-hidden">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full max-h-[90dvh] overflow-y-auto overscroll-contain modal-scroll shadow-2xl text-left border border-[#E5E7EB]">
            <h3 className="text-base font-bold text-[#1F2937] mb-2">
              Cart Mein Doosri Dukaan Ke Items Hain
            </h3>
            <p className="text-xs text-[#6B7280] leading-relaxed mb-4">
              Aapke cart mein <strong>{conflictModalData.conflictSeller.publicName}</strong> ke items hain. Ek samay mein ek hi dukaan se delivery ki ja sakti hai.
              <br /><br />
              Kya aap cart ko khali karke <strong>{conflictModalData.seller.publicName}</strong> se naya order shuru karna chahte hain?
            </p>

            <div className="flex items-center justify-end gap-3">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => handleResolveConflict(false)}
              >
                Keep Existing Cart
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => handleResolveConflict(true)}
              >
                Clear & Add New
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Multi-Village Selector Modal */}
      <VillageSelectorModal
        isOpen={isVillageModalOpen}
        onClose={() => setIsVillageModalOpen(false)}
      />

      {/* Logout Confirmation Modal */}
      <LogoutConfirmModal
        isOpen={isLogoutModalOpen}
        account={activeAccountSummary}
        onCancel={() => setIsLogoutModalOpen(false)}
        onConfirmLogout={() => {
          void signOutUser();
          setIsLogoutModalOpen(false);
          setAuthScreen('LOGIN');
          showToast('Signed out of GramBazaar.');
        }}
      />

      {/* Live Seller Order Notification Pop-up Card (Triggered immediately on Customer Order) */}
      {latestIncomingNotification && (
        <div className="fixed top-20 right-4 left-4 sm:left-auto sm:w-[400px] z-50 bg-white rounded-2xl border-2 border-[#F59E0B] shadow-2xl overflow-hidden animate-slide-up text-left">
          <div className="px-4 py-2.5 bg-[#FFFBEB] border-b border-[#FDE68A] flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <span className="w-7 h-7 rounded-full bg-[#F59E0B] text-white flex items-center justify-center shrink-0 animate-pulse">
                <Bell className="w-3.5 h-3.5" />
              </span>
              <div className="min-w-0">
                <p className="text-[10px] font-extrabold uppercase tracking-wider text-[#B45309]">
                  Live Seller Notification Sent
                </p>
                <p className="text-xs font-extrabold text-[#1F2937] truncate">
                  {latestIncomingNotification.sellerName}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={dismissLatestNotification}
              className="w-6 h-6 rounded-full hover:bg-[#FEF3C7] text-[#92400E] flex items-center justify-center cursor-pointer shrink-0"
              aria-label="Dismiss notification"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="p-4 space-y-3">
            <div className="flex items-center justify-between gap-2 text-xs">
              <div>
                <p className="font-mono font-bold text-[#1F2937]">
                  {latestIncomingNotification.orderNumber}
                </p>
                <p className="text-[#6B7280] mt-0.5">
                  Customer: <strong className="text-[#1F2937]">{latestIncomingNotification.customerName}</strong> •{' '}
                  {latestIncomingNotification.itemsCount}{' '}
                  {latestIncomingNotification.itemsCount === 1 ? 'item' : 'items'}
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-sm font-extrabold text-[#176B2C]">
                  {formatINR(latestIncomingNotification.totalPaise)}
                </p>
                <Badge variant="primary" size="sm">
                  {latestIncomingNotification.paymentMethod}
                </Badge>
              </div>
            </div>

            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#FEF2F2] border border-[#FECACA] text-[11px] font-semibold text-[#991B1B]">
              <Clock className="w-3.5 h-3.5 text-[#DC2626] shrink-0" />
              <span>
                Accept countdown timer (5:00 min) started on Seller Kitchen &amp; Packing Terminal.
              </span>
            </div>

            <div className="flex items-center justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={dismissLatestNotification}>
                Stay Here
              </Button>
              <Button
                variant="primary"
                size="sm"
                rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                onClick={() =>
                  handleOpenSellerOrderTerminal(
                    latestIncomingNotification.sellerId,
                    latestIncomingNotification.id
                  )
                }
              >
                Open Seller Terminal
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Notification Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 bg-[#1F2937] text-white text-xs font-semibold rounded-full shadow-2xl animate-fade-in border border-slate-700">
          <CheckCircle2 className="w-4 h-4 text-[#86EFAC]" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <VillageProvider>
        <SellerProvider>
          <SafetyProvider>
            <UdhariProvider>
              <CartProvider>
                <OrderProvider>
                  <AdminProvider>
                    <MainMarketplaceApp />
                  </AdminProvider>
                </OrderProvider>
              </CartProvider>
            </UdhariProvider>
          </SafetyProvider>
        </SellerProvider>
      </VillageProvider>
    </AuthProvider>
  );
}
