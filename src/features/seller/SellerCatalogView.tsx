/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useMemo, useState } from 'react';
import {
  Search,
  Power,
  CheckCircle,
  Clock,
  Plus,
  Database,
  Layers,
  Tag,
  Scale,
  Sliders,
  Boxes,
  ListPlus,
  PackageCheck,
  Store,
  Edit3,
  Package,
} from 'lucide-react';
import { useSeller } from '../../contexts/SellerContext';
import { useAdmin } from '../../contexts/AdminContext';
import { MOCK_FOOD_PRODUCTS, MOCK_GROCERY_PRODUCTS } from '../../constants/mockData';
import { FoodProduct, GroceryProduct } from '../../types/product';
import { UniversalProductRecord, VariantSizeMasterRecord } from '../../types/admin';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { formatINR } from '../../utils/currency';
import { SellerAddProductModal } from './components/SellerAddProductModal';
import {
  BulkInventoryUpdateModal,
  BulkInventoryUpdatePayload,
  computeBulkNextPricePaise,
  computeBulkNextStock,
} from './components/BulkInventoryUpdateModal';

export interface SellerCatalogViewProps {
  initialTab?: 'CATALOG' | 'MASTERS' | 'INVENTORY';
}

type CatalogTab = 'CATALOG' | 'MASTERS' | 'INVENTORY';
type MasterSectionKey =
  | 'CATEGORIES'
  | 'BRANDS'
  | 'UNITS'
  | 'VARIANTS'
  | 'ATTRIBUTES'
  | 'ADDONS'
  | 'PACKAGING'
  | 'AVAILABILITY';

interface DisplaySellerItem {
  id: string;
  name: string;
  hindiName?: string;
  categoryName: string;
  brandName?: string;
  catalogueType: 'FOOD' | 'GROCERY';
  dietType?: 'VEG' | 'NON_VEG' | 'EGG';
  pricePaise: number;
  mrpPaise?: number;
  unitLabel: string;
  prepMinutes?: number;
  stockQuantity?: number;
  lowStockThreshold?: number;
  isAvailable: boolean;
  source: 'MASTER_PRODUCT' | 'BASE_CATALOG';
  universalRecord?: UniversalProductRecord;
}

export const SellerCatalogView: React.FC<SellerCatalogViewProps> = ({
  initialTab = 'CATALOG',
}) => {
  const { activeSeller, allSellers, setActiveSellerId } = useSeller();
  const {
    categories,
    brands,
    units,
    attributes,
    variantMasters,
    optionGroups,
    packagingMasters,
    availabilityConfigs,
    products: adminProducts,
    updateProduct,
    toggleProductAvailability,
    updateProductInventory,
  } = useAdmin();

  const vertical = activeSeller.primaryVertical === 'FOOD' ? 'FOOD' : 'GROCERY';
  const isFood = vertical === 'FOOD';

  const [activeTab, setActiveTab] = useState<CatalogTab>(initialTab);
  const [activeMasterSection, setActiveMasterSection] =
    useState<MasterSectionKey>('CATEGORIES');
  const [searchQuery, setSearchQuery] = useState('');
  const [inventoryStatusFilter, setInventoryStatusFilter] = useState<
    'ALL' | 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK'
  >('ALL');
  const [availabilityOverrides, setAvailabilityOverrides] = useState<Record<string, boolean>>({});
  const [stockOverrides, setStockOverrides] = useState<Record<string, number>>({});
  const [priceOverrides, setPriceOverrides] = useState<Record<string, number>>({});
  const [selectedInventoryIds, setSelectedInventoryIds] = useState<string[]>([]);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  // Add / Edit Product Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<UniversalProductRecord | null>(null);
  const [preselectedCategoryId, setPreselectedCategoryId] = useState<string | undefined>(undefined);
  const [preselectedTemplate, setPreselectedTemplate] =
    useState<VariantSizeMasterRecord | null>(null);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  useEffect(() => {
    setSelectedInventoryIds([]);
  }, [activeSeller.id]);

  const showToast = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 3500);
  };

  // Filtered active Masters for this seller's vertical
  const verticalCategories = useMemo(
    () => categories.filter((c) => c.isActive && c.vertical === vertical),
    [categories, vertical]
  );
  const verticalBrands = useMemo(
    () =>
      brands.filter(
        (b) => b.isActive && (b.verticals.includes(vertical) || b.verticals.includes('ALL'))
      ),
    [brands, vertical]
  );
  const verticalUnits = useMemo(
    () =>
      units.filter(
        (u) => u.isActive && (u.verticals.includes(vertical) || u.verticals.includes('ALL'))
      ),
    [units, vertical]
  );
  const verticalAttributes = useMemo(
    () =>
      attributes.filter(
        (a) => a.isActive && (a.verticals.includes(vertical) || a.verticals.includes('ALL'))
      ),
    [attributes, vertical]
  );
  const verticalVariants = useMemo(
    () => variantMasters.filter((v) => v.isActive && v.vertical === vertical),
    [variantMasters, vertical]
  );
  const verticalOptionGroups = useMemo(
    () =>
      optionGroups.filter(
        (g) => g.isActive && (g.verticals.includes(vertical) || g.verticals.includes('ALL'))
      ),
    [optionGroups, vertical]
  );
  const verticalPackaging = useMemo(
    () =>
      packagingMasters.filter(
        (p) => p.isActive && (p.verticals.includes(vertical) || p.verticals.includes('ALL'))
      ),
    [packagingMasters, vertical]
  );
  const verticalAvailability = useMemo(
    () => availabilityConfigs.filter((a) => a.isActive && a.vertical === vertical),
    [availabilityConfigs, vertical]
  );

  // Unified Seller Product List (Master-created UniversalProductRecords + base seller catalog)
  const mergedItems = useMemo<DisplaySellerItem[]>(() => {
    const sellerAdminItems: DisplaySellerItem[] = adminProducts
      .filter((p) => p.sellerId === activeSeller.id)
      .map((p) => {
        const cat = categories.find((c) => c.id === p.categoryId);
        const brand = brands.find((b) => b.id === p.brandId);
        const unit = units.find((u) => u.id === p.unitId);
        return {
          id: p.id,
          name: p.name,
          hindiName: p.hindiName,
          categoryName: cat?.name || p.categoryId,
          brandName: brand?.name,
          catalogueType: p.vertical === 'FOOD' ? 'FOOD' : 'GROCERY',
          dietType: p.dietType,
          pricePaise: p.pricePaise,
          mrpPaise: p.mrpPaise,
          unitLabel: unit ? `${unit.name} (${unit.symbol})` : p.unitId,
          prepMinutes: p.prepTimeMinutes,
          stockQuantity: p.stockQuantity,
          lowStockThreshold: p.lowStockThreshold,
          isAvailable: p.isAvailable,
          source: 'MASTER_PRODUCT',
          universalRecord: p,
        };
      });

    const basePool = isFood
      ? MOCK_FOOD_PRODUCTS.filter((p) => p.sellerId === activeSeller.id)
      : MOCK_GROCERY_PRODUCTS.filter((p) => p.sellerId === activeSeller.id);

    const existingNames = new Set(sellerAdminItems.map((i) => i.name.toLowerCase()));

    const baseItems: DisplaySellerItem[] = basePool
      .filter((p) => !existingNames.has(p.name.toLowerCase()))
      .map((p) => {
        const isFoodProd = p.catalogueType === 'FOOD';
        const groc = p as GroceryProduct;
        const food = p as FoodProduct;
        return {
          id: p.id,
          name: p.name,
          categoryName: p.categoryName,
          catalogueType: p.catalogueType,
          dietType: isFoodProd ? food.dietType : undefined,
          pricePaise: priceOverrides[p.id] ?? p.pricePaise,
          unitLabel: p.unitBasis,
          prepMinutes: isFoodProd ? food.preparationTimeMinutes : undefined,
          stockQuantity:
            stockOverrides[p.id] ?? (isFoodProd ? 30 : groc.stockQuantity ?? 25),
          lowStockThreshold: 5,
          isAvailable: availabilityOverrides[p.id] ?? p.isAvailable,
          source: 'BASE_CATALOG',
        };
      });

    return [...sellerAdminItems, ...baseItems];
  }, [
    adminProducts,
    activeSeller.id,
    categories,
    brands,
    units,
    isFood,
    availabilityOverrides,
    stockOverrides,
    priceOverrides,
  ]);

  const filteredItems = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return mergedItems;
    return mergedItems.filter(
      (item) =>
        item.name.toLowerCase().includes(q) ||
        item.categoryName.toLowerCase().includes(q) ||
        (item.brandName?.toLowerCase().includes(q) ?? false)
    );
  }, [mergedItems, searchQuery]);

  const handleToggleItemAvailability = (item: DisplaySellerItem) => {
    if (item.source === 'MASTER_PRODUCT') {
      toggleProductAvailability(item.id);
    } else {
      setAvailabilityOverrides((prev) => ({
        ...prev,
        [item.id]: !item.isAvailable,
      }));
    }
    showToast(`${item.name} marked ${item.isAvailable ? 'Sold Out' : 'Available'} live.`);
  };

  const handleSetExactStock = (item: DisplaySellerItem, rawQty: number) => {
    const nextQty = Math.max(0, Math.floor(Number.isFinite(rawQty) ? rawQty : 0));
    if (item.source === 'MASTER_PRODUCT') {
      updateProductInventory(item.id, nextQty);
    } else {
      setStockOverrides((prev) => ({ ...prev, [item.id]: nextQty }));
    }
  };

  const handleAdjustStock = (item: DisplaySellerItem, delta: number) => {
    handleSetExactStock(item, (item.stockQuantity ?? 0) + delta);
  };

  const inventoryItems = useMemo(() => {
    return filteredItems.filter((item) => {
      const qty = item.stockQuantity ?? 0;
      const threshold = item.lowStockThreshold ?? 5;
      if (inventoryStatusFilter === 'OUT_OF_STOCK') return qty === 0 || !item.isAvailable;
      if (inventoryStatusFilter === 'LOW_STOCK') return qty > 0 && qty <= threshold;
      if (inventoryStatusFilter === 'IN_STOCK') return qty > threshold && item.isAvailable;
      return true;
    });
  }, [filteredItems, inventoryStatusFilter]);

  const totalInventoryValuePaise = useMemo(
    () =>
      mergedItems.reduce(
        (sum, item) => sum + (item.stockQuantity ?? 0) * item.pricePaise,
        0
      ),
    [mergedItems]
  );

  // Multi-select helpers for Bulk Inventory Update
  const visibleInventoryIds = useMemo(
    () => inventoryItems.map((item) => item.id),
    [inventoryItems]
  );

  const selectedInventoryItems = useMemo(
    () =>
      mergedItems
        .filter((item) => selectedInventoryIds.includes(item.id))
        .map((item) => ({
          id: item.id,
          name: item.name,
          categoryName: item.categoryName,
          pricePaise: item.pricePaise,
          stockQuantity: item.stockQuantity ?? 0,
          isAvailable: item.isAvailable,
        })),
    [mergedItems, selectedInventoryIds]
  );

  const allVisibleSelected =
    visibleInventoryIds.length > 0 &&
    visibleInventoryIds.every((id) => selectedInventoryIds.includes(id));

  const handleToggleSelectAllVisible = () => {
    if (allVisibleSelected) {
      setSelectedInventoryIds((prev) =>
        prev.filter((id) => !visibleInventoryIds.includes(id))
      );
    } else {
      setSelectedInventoryIds((prev) =>
        Array.from(new Set([...prev, ...visibleInventoryIds]))
      );
    }
  };

  const handleToggleSelectRow = (id: string) => {
    setSelectedInventoryIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleApplyBulkUpdate = (payload: BulkInventoryUpdatePayload) => {
    const targetItems = mergedItems.filter((item) =>
      selectedInventoryIds.includes(item.id)
    );
    if (targetItems.length === 0) return;

    const nextPriceOverrides: Record<string, number> = {};
    const nextStockOverrides: Record<string, number> = {};
    const nextAvailOverrides: Record<string, boolean> = {};

    targetItems.forEach((item) => {
      const currentStock = item.stockQuantity ?? 0;
      const nextPricePaise = payload.applyPrice
        ? computeBulkNextPricePaise(item.pricePaise, payload.priceMode, payload.priceValue)
        : item.pricePaise;
      const nextStock = payload.applyStock
        ? computeBulkNextStock(currentStock, payload.stockMode, payload.stockValue)
        : currentStock;
      const nextAvailable =
        payload.availabilityAction === 'UNCHANGED'
          ? item.isAvailable
          : payload.availabilityAction === 'AVAILABLE';

      if (item.source === 'MASTER_PRODUCT') {
        const patch: Partial<UniversalProductRecord> = {};
        if (payload.applyPrice) {
          patch.pricePaise = nextPricePaise;
          if (item.mrpPaise && nextPricePaise > item.mrpPaise) {
            patch.mrpPaise = nextPricePaise;
          }
        }
        if (payload.applyStock) {
          patch.stockQuantity = nextStock;
        }
        if (payload.availabilityAction !== 'UNCHANGED') {
          patch.isAvailable = nextAvailable;
        }
        updateProduct(item.id, patch);
      } else {
        if (payload.applyPrice) nextPriceOverrides[item.id] = nextPricePaise;
        if (payload.applyStock) nextStockOverrides[item.id] = nextStock;
        if (payload.availabilityAction !== 'UNCHANGED') {
          nextAvailOverrides[item.id] = nextAvailable;
        }
      }
    });

    if (Object.keys(nextPriceOverrides).length > 0) {
      setPriceOverrides((prev) => ({ ...prev, ...nextPriceOverrides }));
    }
    if (Object.keys(nextStockOverrides).length > 0) {
      setStockOverrides((prev) => ({ ...prev, ...nextStockOverrides }));
    }
    if (Object.keys(nextAvailOverrides).length > 0) {
      setAvailabilityOverrides((prev) => ({ ...prev, ...nextAvailOverrides }));
    }

    const updatedDimensions: string[] = [];
    if (payload.applyPrice) updatedDimensions.push('price');
    if (payload.availabilityAction !== 'UNCHANGED') updatedDimensions.push('availability');
    if (payload.applyStock) updatedDimensions.push('stock');

    setSelectedInventoryIds([]);
    showToast(
      `Bulk updated ${updatedDimensions.join(', ')} for ${targetItems.length} ${
        targetItems.length === 1 ? 'item' : 'items'
      }.`
    );
  };

  const openAddProductModal = (opts?: {
    categoryId?: string;
    template?: VariantSizeMasterRecord;
    edit?: UniversalProductRecord;
  }) => {
    setEditingProduct(opts?.edit ?? null);
    setPreselectedCategoryId(opts?.categoryId);
    setPreselectedTemplate(opts?.template ?? null);
    setIsAddModalOpen(true);
  };

  const activeAvailableCount = mergedItems.filter((i) => i.isAvailable).length;
  const masterLinkedCount = mergedItems.filter((i) => i.source === 'MASTER_PRODUCT').length;
  const lowStockCount = mergedItems.filter(
    (i) => (i.stockQuantity ?? 10) <= (i.lowStockThreshold ?? 5)
  ).length;

  return (
    <div className="space-y-5 animate-fade-in text-left">
      {/* Header Bar */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs text-[#6B7280]">
            <span className="font-semibold text-[#176B2C]">
              {isFood ? 'Food Menu & Kitchen Masters' : 'Kirana Catalog & Product Masters'}
            </span>
            <span aria-hidden="true">·</span>
            <span className="tabular-nums">{mergedItems.length} listings</span>
          </div>
          <h1 className="text-xl font-extrabold text-[#1F2937] tracking-tight">
            Store Catalog, Product Masters &amp; Stock
          </h1>
          <p className="text-xs text-[#6B7280]">
            Add products directly using centralized Category, Brand, Unit (Pav/Kg), Variant, Attribute, Add-on, and Packaging Masters.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          {/* Quick Seller Switcher */}
          <div className="flex items-center gap-2 bg-[#F8FAFC] border border-[#E5E7EB] rounded-full px-3 h-10">
            <Store className="w-4 h-4 text-[#218838] shrink-0" />
            <select
              aria-label="Switch seller shop"
              value={activeSeller.id}
              onChange={(e) => setActiveSellerId(e.target.value)}
              className="bg-transparent text-xs font-bold text-[#1F2937] outline-none pr-1 max-w-[190px] cursor-pointer"
            >
              {allSellers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.publicName} ({s.primaryVertical === 'FOOD' ? 'Food' : 'Grocery'})
                </option>
              ))}
            </select>
          </div>

          <Button
            variant="primary"
            size="md"
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={() => openAddProductModal()}
          >
            Add Product
          </Button>
        </div>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-4">
          <p className="text-xs font-semibold text-[#6B7280]">Total Store Products</p>
          <p className="text-2xl font-extrabold text-[#1F2937] mt-1 tabular-nums">
            {mergedItems.length}
          </p>
          <p className="text-[11px] text-[#16A34A] mt-0.5 tabular-nums">
            {activeAvailableCount} live for customer orders
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-4">
          <p className="text-xs font-semibold text-[#6B7280]">Master-Linked Listings</p>
          <p className="text-2xl font-extrabold text-[#176B2C] mt-1 tabular-nums">
            {masterLinkedCount}
          </p>
          <p className="text-[11px] text-[#6B7280] mt-0.5">
            Synced with Admin Masters &amp; Storefront
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-4">
          <p className="text-xs font-semibold text-[#6B7280]">Active Vertical Masters</p>
          <p className="text-2xl font-extrabold text-[#1F2937] mt-1 tabular-nums">
            8 Masters
          </p>
          <p className="text-[11px] text-[#6B7280] mt-0.5 tabular-nums">
            {verticalCategories.length} cats · {verticalUnits.length} units · {verticalBrands.length} brands
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-4">
          <p className="text-xs font-semibold text-[#6B7280]">Low Stock Alerts</p>
          <p
            className={`text-2xl font-extrabold mt-1 tabular-nums ${
              lowStockCount > 0 ? 'text-[#D97706]' : 'text-[#1F2937]'
            }`}
          >
            {lowStockCount}
          </p>
          <p className="text-[11px] text-[#6B7280] mt-0.5">Items at or below alert threshold</p>
        </div>
      </div>

      {/* Toast Feedback */}
      {toast && (
        <div className="p-3 bg-[#E8F5E9] border border-[#218838]/30 text-[#176B2C] text-xs font-semibold rounded-xl flex items-center justify-between gap-2">
          <span className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-[#16A34A]" />
            <span>{toast}</span>
          </span>
          <button
            type="button"
            onClick={() => setToast(null)}
            className="font-bold hover:underline cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Workspace Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white rounded-2xl border border-[#E5E7EB] p-3">
        <div className="flex flex-wrap items-center gap-1.5">
          {(
            [
              { key: 'CATALOG', label: `My Products (${mergedItems.length})`, icon: <Package className="w-4 h-4" /> },
              { key: 'INVENTORY', label: `Inventory & Stock`, icon: <Scale className="w-4 h-4" /> },
              { key: 'MASTERS', label: 'Product Masters (8)', icon: <Database className="w-4 h-4" /> },
            ] as const
          ).map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setActiveTab(t.key)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-colors cursor-pointer whitespace-nowrap ${
                activeTab === t.key
                  ? 'bg-[#218838] text-white'
                  : 'text-[#475569] hover:bg-[#F8FAFC] hover:text-[#1F2937]'
              }`}
            >
              {t.icon}
              <span>{t.label}</span>
            </button>
          ))}
        </div>

        {activeTab !== 'MASTERS' && (
          <div className="relative min-w-[240px] flex-1 sm:flex-initial">
            <Search className="w-4 h-4 text-[#6B7280] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search item, category, brand..."
              className="w-full h-9 pl-10 pr-4 bg-[#F8FAFC] border border-[#E5E7EB] rounded-full text-xs text-[#1F2937] outline-none focus:border-[#218838]"
            />
          </div>
        )}
      </div>

      {/* ====================================================================
       * TAB 1: MY PRODUCTS CATALOG TABLE
       * ================================================================== */}
      {activeTab === 'CATALOG' && (
        <div className="bg-white rounded-2xl border border-[#E5E7EB] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead className="bg-[#F8FAFC] text-[#6B7280] uppercase tracking-wider font-semibold border-b border-[#E5E7EB]">
                <tr>
                  <th className="py-3.5 px-4">Item Name &amp; Category</th>
                  <th className="py-3.5 px-4">Classification / Brand</th>
                  <th className="py-3.5 px-4 text-right">Price</th>
                  <th className="py-3.5 px-4">Unit / Prep</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1F5F9]">
                {filteredItems.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-10 text-center text-[#6B7280]">
                      No matching products found. Click <strong>Add Product</strong> to create one using GramBazaar Masters.
                    </td>
                  </tr>
                ) : (
                  filteredItems.map((item) => (
                    <tr key={item.id} className="hover:bg-[#F8FAFC] transition-colors">
                      <td className="py-3 px-4">
                        <p className="font-bold text-[#1F2937]">
                          {item.name}
                          {item.hindiName ? (
                            <span className="font-normal text-[#6B7280] ml-1.5">
                              ({item.hindiName})
                            </span>
                          ) : null}
                        </p>
                        <p className="text-[11px] text-[#6B7280]">
                          {item.categoryName}
                          {item.source === 'MASTER_PRODUCT' ? ' · Master Synced' : ''}
                        </p>
                      </td>

                      <td className="py-3 px-4">
                        {item.catalogueType === 'FOOD' ? (
                          <span
                            className={`text-[11px] font-bold ${
                              item.dietType === 'NON_VEG'
                                ? 'text-[#DC2626]'
                                : item.dietType === 'EGG'
                                ? 'text-[#D97706]'
                                : 'text-[#16A34A]'
                            }`}
                          >
                            {item.dietType === 'NON_VEG'
                              ? 'Non-Veg'
                              : item.dietType === 'EGG'
                              ? 'Egg'
                              : 'Pure Veg'}
                          </span>
                        ) : (
                          <span className="text-[11px] font-semibold text-[#475569]">
                            {item.brandName || 'Kirana Staple'}
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-right tabular-nums">
                        <span className="font-extrabold text-[#1F2937]">
                          {formatINR(item.pricePaise)}
                        </span>
                        {item.mrpPaise && item.mrpPaise > item.pricePaise && (
                          <span className="block text-[10px] text-[#9CA3AF] line-through">
                            {formatINR(item.mrpPaise)}
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-[#475569]">
                        {item.catalogueType === 'FOOD' ? (
                          <span className="inline-flex items-center gap-1 tabular-nums">
                            <Clock className="w-3 h-3 text-[#6B7280]" />
                            {item.prepMinutes ?? 20} mins · {item.unitLabel}
                          </span>
                        ) : (
                          <span>Per {item.unitLabel}</span>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        <Badge variant={item.isAvailable ? 'primary' : 'error'} size="sm">
                          {item.isAvailable ? 'Available' : 'Sold Out'}
                        </Badge>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          {item.universalRecord && (
                            <button
                              type="button"
                              onClick={() => openAddProductModal({ edit: item.universalRecord })}
                              className="p-2 rounded-lg border border-[#E5E7EB] text-[#475569] hover:text-[#218838] hover:border-[#218838] cursor-pointer"
                              title="Edit Product Details"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleToggleItemAvailability(item)}
                            className={`p-2 rounded-lg cursor-pointer transition-colors ${
                              item.isAvailable
                                ? 'bg-[#E8F5E9] text-[#16A34A] hover:bg-[#DCFCE7]'
                                : 'bg-[#FEE2E2] text-[#DC2626] hover:bg-[#FECACA]'
                            }`}
                            title={item.isAvailable ? 'Mark Sold Out' : 'Mark Available'}
                          >
                            <Power className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ====================================================================
       * TAB 2: SELLER PRODUCT MASTERS EXPLORER (All 8 Centralized Masters)
       * ================================================================== */}
      {activeTab === 'MASTERS' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* Left Master Directory Nav */}
          <div className="lg:col-span-4 bg-white rounded-2xl border border-[#E5E7EB] overflow-hidden">
            <div className="p-4 border-b border-[#E5E7EB]">
              <h2 className="text-sm font-bold text-[#1F2937]">
                Product Masters ({isFood ? 'Food' : 'Grocery'})
              </h2>
              <p className="text-[11px] text-[#6B7280] mt-0.5">
                Standardized master values synced from GramBazaar Admin for fast error-free product listing.
              </p>
            </div>
            <div className="divide-y divide-[#F1F5F9]">
              {(
                [
                  { key: 'CATEGORIES', label: 'Category & Subcategory', count: verticalCategories.length, icon: <Layers className="w-4 h-4" /> },
                  { key: 'BRANDS', label: 'Brand Master', count: verticalBrands.length, icon: <Tag className="w-4 h-4" /> },
                  { key: 'UNITS', label: 'Unit & Measurement (Pav/Kg)', count: verticalUnits.length, icon: <Scale className="w-4 h-4" /> },
                  { key: 'VARIANTS', label: 'Variant & Size Templates', count: verticalVariants.length, icon: <Boxes className="w-4 h-4" /> },
                  { key: 'ATTRIBUTES', label: 'Product Attributes', count: verticalAttributes.length, icon: <Sliders className="w-4 h-4" /> },
                  { key: 'ADDONS', label: 'Add-ons & Customizations', count: verticalOptionGroups.length, icon: <ListPlus className="w-4 h-4" /> },
                  { key: 'PACKAGING', label: 'Packaging Master', count: verticalPackaging.length, icon: <PackageCheck className="w-4 h-4" /> },
                  { key: 'AVAILABILITY', label: 'Availability & Stock Rules', count: verticalAvailability.length, icon: <Clock className="w-4 h-4" /> },
                ] as const
              ).map((m) => (
                <button
                  key={m.key}
                  type="button"
                  onClick={() => setActiveMasterSection(m.key)}
                  className={`w-full px-4 py-3 flex items-center justify-between text-xs font-semibold transition-colors cursor-pointer ${
                    activeMasterSection === m.key
                      ? 'bg-[#E8F5E9] text-[#176B2C] font-bold'
                      : 'text-[#374151] hover:bg-[#F8FAFC]'
                  }`}
                >
                  <span className="flex items-center gap-2.5">
                    {m.icon}
                    <span>{m.label}</span>
                  </span>
                  <span className="tabular-nums font-bold text-[11px]">{m.count}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Right Master Detail List */}
          <div className="lg:col-span-8 bg-white rounded-2xl border border-[#E5E7EB] p-5 space-y-4">
            {activeMasterSection === 'CATEGORIES' && (
              <>
                <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-3">
                  <div>
                    <h3 className="text-base font-bold text-[#1F2937]">
                      Category &amp; Subcategory Master
                    </h3>
                    <p className="text-xs text-[#6B7280]">
                      Click &ldquo;Add Product&rdquo; on any category to pre-fill the form immediately.
                    </p>
                  </div>
                </div>
                <div className="divide-y divide-[#F1F5F9]">
                  {verticalCategories
                    .filter((c) => !c.parentId)
                    .map((cat) => {
                      const subs = verticalCategories.filter((s) => s.parentId === cat.id);
                      return (
                        <div
                          key={cat.id}
                          className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                        >
                          <div>
                            <p className="text-xs font-bold text-[#1F2937]">
                              {cat.name}{' '}
                              <span className="font-normal text-[#6B7280]">({cat.hindiName})</span>
                            </p>
                            {subs.length > 0 && (
                              <p className="text-[11px] text-[#6B7280] mt-0.5">
                                Subcategories: {subs.map((s) => s.name).join(', ')}
                              </p>
                            )}
                          </div>
                          <Button
                            variant="secondary"
                            size="sm"
                            leftIcon={<Plus className="w-3.5 h-3.5" />}
                            onClick={() => openAddProductModal({ categoryId: cat.id })}
                          >
                            Add in Category
                          </Button>
                        </div>
                      );
                    })}
                </div>
              </>
            )}

            {activeMasterSection === 'BRANDS' && (
              <>
                <h3 className="text-base font-bold text-[#1F2937] border-b border-[#E5E7EB] pb-3">
                  Verified Brand Master
                </h3>
                <div className="divide-y divide-[#F1F5F9]">
                  {verticalBrands.map((b) => (
                    <div key={b.id} className="py-3 flex items-center justify-between gap-3 text-xs">
                      <div>
                        <p className="font-bold text-[#1F2937]">
                          {b.name} {b.isVerified ? '· Verified' : ''}
                        </p>
                        <p className="text-[11px] text-[#6B7280]">
                          {b.manufacturer || b.description || 'Approved Marketplace Brand'}
                        </p>
                      </div>
                      <span className="font-mono text-[11px] text-[#6B7280]">{b.code || b.id}</span>
                    </div>
                  ))}
                </div>
              </>
            )}

            {activeMasterSection === 'UNITS' && (
              <>
                <h3 className="text-base font-bold text-[#1F2937] border-b border-[#E5E7EB] pb-3">
                  Unit &amp; Measurement Master (Standard &amp; Rural Local Units)
                </h3>
                <div className="divide-y divide-[#F1F5F9]">
                  {verticalUnits.map((u) => (
                    <div key={u.id} className="py-3 flex items-center justify-between gap-3 text-xs">
                      <div>
                        <p className="font-bold text-[#1F2937]">
                          {u.name} ({u.symbol}) · {u.hindiName}
                        </p>
                        <p className="text-[11px] text-[#6B7280]">
                          Family: {u.family}
                          {u.conversionFactor && u.baseUnit
                            ? ` · Conversion: 1 ${u.symbol} = ${u.conversionFactor} ${u.baseUnit}`
                            : ''}
                        </p>
                      </div>
                      <span className="text-[11px] font-semibold text-[#176B2C]">
                        {u.allowSellerLocalOverride ? 'Local Unit Supported' : 'Standard'}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            )}

            {activeMasterSection === 'VARIANTS' && (
              <>
                <h3 className="text-base font-bold text-[#1F2937] border-b border-[#E5E7EB] pb-3">
                  Variant &amp; Size Templates (1-Click Product Creation)
                </h3>
                <div className="divide-y divide-[#F1F5F9]">
                  {verticalVariants.map((v) => (
                    <div
                      key={v.id}
                      className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                    >
                      <div>
                        <p className="font-bold text-[#1F2937]">
                          {v.name} — <span className="text-[#176B2C]">{v.sizeLabel}</span>
                        </p>
                        <p className="text-[11px] text-[#6B7280] tabular-nums">
                          SKU: {v.sku} · MRP {formatINR(v.mrpPaise)} · Selling{' '}
                          {formatINR(v.sellingPricePaise)}
                        </p>
                      </div>
                      <Button
                        variant="primary"
                        size="sm"
                        leftIcon={<Plus className="w-3.5 h-3.5" />}
                        onClick={() => openAddProductModal({ template: v })}
                      >
                        Use Template
                      </Button>
                    </div>
                  ))}
                </div>
              </>
            )}

            {activeMasterSection === 'ATTRIBUTES' && (
              <>
                <h3 className="text-base font-bold text-[#1F2937] border-b border-[#E5E7EB] pb-3">
                  Product Attribute Master
                </h3>
                <div className="divide-y divide-[#F1F5F9]">
                  {verticalAttributes.map((a) => (
                    <div key={a.id} className="py-3 text-xs space-y-0.5">
                      <p className="font-bold text-[#1F2937]">
                        {a.name} ({a.hindiName}) ·{' '}
                        <span className="font-mono text-[11px] text-[#6B7280]">{a.dataType}</span>
                      </p>
                      {a.options && a.options.length > 0 && (
                        <p className="text-[11px] text-[#6B7280]">
                          Allowed values: {a.options.join(', ')}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </>
            )}

            {activeMasterSection === 'ADDONS' && (
              <>
                <h3 className="text-base font-bold text-[#1F2937] border-b border-[#E5E7EB] pb-3">
                  Add-ons &amp; Customization Master
                </h3>
                <div className="divide-y divide-[#F1F5F9]">
                  {verticalOptionGroups.map((g) => (
                    <div key={g.id} className="py-3 text-xs space-y-1">
                      <p className="font-bold text-[#1F2937]">
                        {g.name} ({g.hindiName}) · {g.selectionType} Select
                      </p>
                      <p className="text-[11px] text-[#6B7280]">
                        Options:{' '}
                        {g.options
                          .map((o) => `${o.label} (+${formatINR(o.priceDeltaPaise)})`)
                          .join(' · ')}
                      </p>
                    </div>
                  ))}
                </div>
              </>
            )}

            {activeMasterSection === 'PACKAGING' && (
              <>
                <h3 className="text-base font-bold text-[#1F2937] border-b border-[#E5E7EB] pb-3">
                  Packaging Master
                </h3>
                <div className="divide-y divide-[#F1F5F9]">
                  {verticalPackaging.map((p) => (
                    <div key={p.id} className="py-3 flex items-center justify-between gap-3 text-xs">
                      <div>
                        <p className="font-bold text-[#1F2937]">
                          {p.name} ({p.capacityLabel})
                        </p>
                        <p className="text-[11px] text-[#6B7280]">
                          {p.isFoodGrade ? 'Food-Grade' : 'Standard'}
                          {p.isLeakProof ? ' · Leak-Proof' : ''}
                          {p.isEcoFriendly ? ' · Eco-Friendly' : ''}
                        </p>
                      </div>
                      <span className="font-extrabold text-[#176B2C] tabular-nums">
                        {formatINR(p.feePaise)}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            )}

            {activeMasterSection === 'AVAILABILITY' && (
              <>
                <h3 className="text-base font-bold text-[#1F2937] border-b border-[#E5E7EB] pb-3">
                  Availability &amp; Stock Configuration Master
                </h3>
                <div className="divide-y divide-[#F1F5F9]">
                  {verticalAvailability.map((a) => (
                    <div key={a.id} className="py-3 text-xs space-y-0.5">
                      <p className="font-bold text-[#1F2937]">
                        {a.name} ·{' '}
                        <span className="text-[#176B2C]">{a.workflowMode.replace(/_/g, ' ')}</span>
                      </p>
                      <p className="text-[11px] text-[#6B7280] tabular-nums">
                        Slots: {a.serviceSlots.join(', ')} · Low stock alert: {a.lowStockThreshold} ·
                        Max/order: {a.maxQtyPerOrder}
                      </p>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ====================================================================
       * TAB 3: INVENTORY & STOCK MANAGEMENT
       * ================================================================== */}
      {activeTab === 'INVENTORY' && (
        <div className="space-y-4">
          {/* Inventory Filter Bar + Stock Valuation */}
          <div className="bg-white rounded-2xl border border-[#E5E7EB] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-1.5">
              {(
                [
                  { key: 'ALL', label: `All (${filteredItems.length})` },
                  {
                    key: 'IN_STOCK',
                    label: `In Stock (${
                      filteredItems.filter(
                        (i) => (i.stockQuantity ?? 0) > (i.lowStockThreshold ?? 5) && i.isAvailable
                      ).length
                    })`,
                  },
                  {
                    key: 'LOW_STOCK',
                    label: `Low Stock (${
                      filteredItems.filter(
                        (i) => (i.stockQuantity ?? 0) > 0 && (i.stockQuantity ?? 0) <= (i.lowStockThreshold ?? 5)
                      ).length
                    })`,
                  },
                  {
                    key: 'OUT_OF_STOCK',
                    label: `Out of Stock (${
                      filteredItems.filter((i) => (i.stockQuantity ?? 0) === 0 || !i.isAvailable)
                        .length
                    })`,
                  },
                ] as const
              ).map((pill) => (
                <button
                  key={pill.key}
                  type="button"
                  onClick={() => setInventoryStatusFilter(pill.key)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                    inventoryStatusFilter === pill.key
                      ? 'bg-[#218838] text-white'
                      : 'bg-[#F1F5F9] text-[#475569] hover:text-[#1F2937]'
                  }`}
                >
                  {pill.label}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="text-xs text-[#6B7280] tabular-nums">
                Total Stock Value:{' '}
                <strong className="text-sm font-extrabold text-[#176B2C]">
                  {formatINR(totalInventoryValuePaise)}
                </strong>
              </div>
              <Button
                variant="secondary"
                size="sm"
                leftIcon={<Edit3 className="w-3.5 h-3.5" />}
                onClick={() => {
                  if (selectedInventoryIds.length === 0) {
                    setSelectedInventoryIds(visibleInventoryIds);
                  }
                  setIsBulkModalOpen(true);
                }}
                disabled={visibleInventoryIds.length === 0}
              >
                Bulk Update
              </Button>
            </div>
          </div>

          {/* Contextual Multi-Select Bulk Action Bar */}
          {selectedInventoryIds.length > 0 && (
            <div className="bg-[#E8F5E9] border border-[#218838]/30 rounded-2xl px-4 py-3 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 text-xs">
                <span className="font-extrabold text-[#176B2C] tabular-nums">
                  {selectedInventoryIds.length}{' '}
                  {selectedInventoryIds.length === 1 ? 'item' : 'items'} selected
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedInventoryIds([])}
                  className="text-[11px] font-semibold text-[#475569] hover:text-[#1F2937] hover:underline cursor-pointer"
                >
                  Clear selection
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() =>
                    handleApplyBulkUpdate({
                      applyPrice: false,
                      priceMode: 'FIXED',
                      priceValue: 0,
                      availabilityAction: 'AVAILABLE',
                      applyStock: false,
                      stockMode: 'ADD_STOCK',
                      stockValue: 0,
                    })
                  }
                >
                  Mark Available
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() =>
                    handleApplyBulkUpdate({
                      applyPrice: false,
                      priceMode: 'FIXED',
                      priceValue: 0,
                      availabilityAction: 'SOLD_OUT',
                      applyStock: false,
                      stockMode: 'ADD_STOCK',
                      stockValue: 0,
                    })
                  }
                >
                  Mark Sold Out
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  leftIcon={<Edit3 className="w-3.5 h-3.5" />}
                  onClick={() => setIsBulkModalOpen(true)}
                >
                  Bulk Edit Price / Stock / Status
                </Button>
              </div>
            </div>
          )}

          <div className="bg-white rounded-2xl border border-[#E5E7EB] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead className="bg-[#F8FAFC] text-[#6B7280] uppercase tracking-wider font-semibold border-b border-[#E5E7EB]">
                  <tr>
                    <th className="py-3.5 pl-4 pr-2 w-10">
                      <input
                        type="checkbox"
                        aria-label="Select all visible inventory items"
                        checked={allVisibleSelected}
                        onChange={handleToggleSelectAllVisible}
                        className="w-4 h-4 accent-[#218838] rounded cursor-pointer"
                      />
                    </th>
                    <th className="py-3.5 px-3">Product &amp; Category</th>
                    <th className="py-3.5 px-3 text-right">Unit Price</th>
                    <th className="py-3.5 px-3">Stock Status</th>
                    <th className="py-3.5 px-3 text-right">Stock Value</th>
                    <th className="py-3.5 px-3 text-right">Current Qty</th>
                    <th className="py-3.5 px-4 text-right">Update Stock</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F1F5F9]">
                  {inventoryItems.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-10 text-center text-[#6B7280]">
                        No items match this inventory filter.
                      </td>
                    </tr>
                  ) : (
                    inventoryItems.map((item) => {
                      const qty = item.stockQuantity ?? 0;
                      const threshold = item.lowStockThreshold ?? 5;
                      const isOut = qty === 0 || !item.isAvailable;
                      const isLow = !isOut && qty <= threshold;
                      const isSelected = selectedInventoryIds.includes(item.id);

                      return (
                        <tr
                          key={item.id}
                          className={`transition-colors ${
                            isSelected ? 'bg-[#E8F5E9]/45' : 'hover:bg-[#F8FAFC]'
                          }`}
                        >
                          <td className="py-3 pl-4 pr-2">
                            <input
                              type="checkbox"
                              aria-label={`Select ${item.name}`}
                              checked={isSelected}
                              onChange={() => handleToggleSelectRow(item.id)}
                              className="w-4 h-4 accent-[#218838] rounded cursor-pointer"
                            />
                          </td>

                          <td className="py-3 px-3">
                            <p className="font-bold text-[#1F2937]">{item.name}</p>
                            <p className="text-[11px] text-[#6B7280]">
                              {item.categoryName} · {item.unitLabel} · Alert ≤ {threshold}
                            </p>
                          </td>

                          <td className="py-3 px-3 text-right font-bold text-[#1F2937] tabular-nums">
                            {formatINR(item.pricePaise)}
                          </td>

                          <td className="py-3 px-3">
                            <Badge
                              variant={isOut ? 'error' : isLow ? 'warning' : 'success'}
                              size="sm"
                            >
                              {!item.isAvailable
                                ? 'Sold Out'
                                : isOut
                                ? 'Out of Stock'
                                : isLow
                                ? 'Low Stock'
                                : 'In Stock'}
                            </Badge>
                          </td>

                          <td className="py-3 px-3 text-right font-semibold text-[#1F2937] tabular-nums">
                            {formatINR(qty * item.pricePaise)}
                          </td>

                          <td className="py-3 px-3 text-right tabular-nums">
                            <input
                              type="number"
                              min={0}
                              aria-label={`Stock quantity for ${item.name}`}
                              value={qty}
                              onChange={(e) => handleSetExactStock(item, Number(e.target.value))}
                              className="w-20 h-8 px-2 text-right font-extrabold text-[#1F2937] bg-[#F8FAFC] border border-[#E5E7EB] rounded-lg outline-none focus:border-[#218838] tabular-nums"
                            />
                          </td>

                          <td className="py-3 px-4 text-right">
                            <div className="inline-flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleAdjustStock(item, -1)}
                                className="px-2 py-1 rounded-lg border border-[#E5E7EB] hover:bg-[#FEE2E2] text-xs font-bold text-[#1F2937] cursor-pointer tabular-nums"
                              >
                                -1
                              </button>
                              <button
                                type="button"
                                onClick={() => handleAdjustStock(item, 5)}
                                className="px-2 py-1 rounded-lg border border-[#E5E7EB] hover:bg-[#E8F5E9] text-xs font-bold text-[#176B2C] cursor-pointer tabular-nums"
                              >
                                +5
                              </button>
                              <button
                                type="button"
                                onClick={() => handleAdjustStock(item, 10)}
                                className="px-2 py-1 rounded-lg bg-[#E8F5E9] text-xs font-bold text-[#176B2C] hover:bg-[#DCFCE7] cursor-pointer tabular-nums"
                              >
                                +10
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Inventory Update Modal */}
      <BulkInventoryUpdateModal
        isOpen={isBulkModalOpen}
        onClose={() => setIsBulkModalOpen(false)}
        selectedItems={selectedInventoryItems}
        onApply={handleApplyBulkUpdate}
      />

      {/* Master-Driven Add / Edit Product Modal */}
      <SellerAddProductModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setEditingProduct(null);
          setPreselectedCategoryId(undefined);
          setPreselectedTemplate(null);
        }}
        seller={activeSeller}
        editingProduct={editingProduct}
        preselectedCategoryId={preselectedCategoryId}
        preselectedTemplate={preselectedTemplate}
        onSaved={(productName, isEdit) => {
          showToast(
            isEdit
              ? `Updated "${productName}" across Seller Catalog & Admin Masters.`
              : `Published "${productName}" using centralized Masters — live on ${activeSeller.publicName} storefront!`
          );
          setActiveTab('CATALOG');
        }}
      />
    </div>
  );
};
