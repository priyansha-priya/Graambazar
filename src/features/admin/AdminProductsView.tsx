/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useState } from 'react';
import {
  Package,
  Plus,
  Search,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Download,
  Edit3,
  Layers,
  Clock,
  Boxes,
  Sparkles,
  Trash2,
} from 'lucide-react';
import { useAdmin } from '../../contexts/AdminContext';
import {
  InventoryMode,
  ProductModerationStatus,
  ProductVariantRecord,
  UniversalProductRecord,
} from '../../types/admin';
import { formatPaiseToINR } from '../../utils/currency';
import { exportToCsv } from '../../utils/exportCsv';
import { Tabs } from '../../components/ui/Tabs';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Drawer } from '../../components/ui/Drawer';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Pagination } from '../../components/data-display/Pagination';
import { EmptyState } from '../../components/feedback/EmptyState';
import { VerticalBadge } from './components/VerticalBadge';

type ProductTab = 'CATALOG' | 'MODERATION' | 'INVENTORY';

const INVENTORY_MODE_LABELS: Record<InventoryMode, string> = {
  QUANTITY_STOCK: 'Quantity Stock',
  WEIGHT_STOCK: 'Weight / Bulk Stock',
  VARIANT_STOCK: 'Variant SKU Matrix',
  PREPARED_FOOD: 'Prepared Food (Kitchen)',
  MADE_TO_ORDER: 'Made to Order (Lead Days)',
};

const PAGE_SIZE = 8;

export const AdminProductsView: React.FC = () => {
  const {
    products,
    verticalConfigs,
    categories,
    attributes,
    units,
    optionGroups,
    brands,
    sellers,
    addProduct,
    updateProduct,
    moderateProduct,
    updateProductInventory,
    toggleProductAvailability,
    hasPermission,
  } = useAdmin();

  const canManage = hasPermission('PRODUCTS', 'manage');
  const canApprove = hasPermission('PRODUCTS', 'approve');

  const [activeTab, setActiveTab] = useState<ProductTab>('CATALOG');
  const [searchQuery, setSearchQuery] = useState('');
  const [verticalFilter, setVerticalFilter] = useState('ALL');
  const [sellerFilter, setSellerFilter] = useState('ALL');
  const [moderationFilter, setModerationFilter] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Add/Edit Product Drawer
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<UniversalProductRecord | null>(null);
  const [formError, setFormError] = useState('');
  const [form, setForm] = useState({
    name: '',
    hindiName: '',
    sku: '',
    description: '',
    vertical: 'FOOD',
    categoryId: '',
    brandId: '',
    sellerId: sellers[0]?.id || '',
    unitId: 'unit_piece',
    inventoryMode: 'PREPARED_FOOD' as InventoryMode,
    mrpRs: '',
    priceRs: '',
    stockQuantity: '20',
    lowStockThreshold: '5',
    prepTimeMinutes: '20',
    leadTimeDays: '3',
    dietType: 'VEG' as 'VEG' | 'NON_VEG' | 'EGG',
    attributes: {} as Record<string, string | number | boolean>,
    variants: [] as ProductVariantRecord[],
    optionGroupIds: [] as string[],
  });

  // Quick Variant Adder inside Drawer
  const [newVariantLabel, setNewVariantLabel] = useState('');
  const [newVariantPriceRs, setNewVariantPriceRs] = useState('');
  const [newVariantStock, setNewVariantStock] = useState('10');

  // Moderation Modal
  const [modModalProduct, setModModalProduct] = useState<UniversalProductRecord | null>(null);
  const [modNotes, setModNotes] = useState('');

  // Quick Inventory Stock Modal
  const [stockModalProduct, setStockModalProduct] = useState<UniversalProductRecord | null>(null);
  const [stockValue, setStockValue] = useState('0');
  const [variantStockMap, setVariantStockMap] = useState<Record<string, number>>({});

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const pendingProducts = useMemo(
    () => products.filter((p) => p.moderationStatus === 'PENDING_REVIEW' || p.moderationStatus === 'CHANGES_REQUESTED'),
    [products]
  );

  const lowStockCount = useMemo(
    () =>
      products.filter((p) => {
        if (p.inventoryMode === 'PREPARED_FOOD' || p.inventoryMode === 'MADE_TO_ORDER') return false;
        return (p.stockQuantity ?? 0) <= (p.lowStockThreshold ?? 5);
      }).length,
    [products]
  );

  const filteredProducts = useMemo(() => {
    const q = searchQuery.toLowerCase();
    const baseList = activeTab === 'MODERATION' ? pendingProducts : products;
    return baseList.filter((p) => {
      const matchV = verticalFilter === 'ALL' || p.vertical === verticalFilter;
      const matchS = sellerFilter === 'ALL' || p.sellerId === sellerFilter;
      const matchM = moderationFilter === 'ALL' || p.moderationStatus === moderationFilter;
      const matchQ =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        p.sellerName.toLowerCase().includes(q);
      return matchV && matchS && matchM && matchQ;
    });
  }, [products, pendingProducts, activeTab, verticalFilter, sellerFilter, moderationFilter, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / PAGE_SIZE));
  const paginatedProducts = filteredProducts.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  // Relevant attributes & categories for the selected vertical inside the drawer
  const verticalCategories = useMemo(
    () => categories.filter((c) => c.vertical === form.vertical && c.isActive),
    [categories, form.vertical]
  );

  const verticalAttributes = useMemo(
    () => attributes.filter((a) => a.isActive && (a.verticals.includes(form.vertical) || a.verticals.includes('ALL'))),
    [attributes, form.vertical]
  );

  const verticalOptionGroups = useMemo(
    () => optionGroups.filter((g) => g.isActive && (g.verticals.includes(form.vertical) || g.verticals.includes('ALL'))),
    [optionGroups, form.vertical]
  );

  const openProductDrawer = (prod?: UniversalProductRecord) => {
    setFormError('');
    setNewVariantLabel('');
    setNewVariantPriceRs('');
    setNewVariantStock('10');
    if (prod) {
      setEditingProduct(prod);
      setForm({
        name: prod.name,
        hindiName: prod.hindiName || '',
        sku: prod.sku,
        description: prod.description || '',
        vertical: prod.vertical,
        categoryId: prod.categoryId,
        brandId: prod.brandId || '',
        sellerId: prod.sellerId,
        unitId: prod.unitId,
        inventoryMode: prod.inventoryMode,
        mrpRs: String(prod.mrpPaise / 100),
        priceRs: String(prod.pricePaise / 100),
        stockQuantity: String(prod.stockQuantity ?? 0),
        lowStockThreshold: String(prod.lowStockThreshold ?? 5),
        prepTimeMinutes: String(prod.prepTimeMinutes ?? 20),
        leadTimeDays: String(prod.leadTimeDays ?? 3),
        dietType: prod.dietType || 'VEG',
        attributes: { ...prod.attributes },
        variants: [...prod.variants],
        optionGroupIds: [...prod.optionGroupIds],
      });
    } else {
      setEditingProduct(null);
      const defaultVertical = verticalFilter === 'ALL' ? 'FOOD' : verticalFilter;
      const firstCat = categories.find((c) => c.vertical === defaultVertical);
      setForm({
        name: '',
        hindiName: '',
        sku: `GB-${defaultVertical.slice(0, 4)}-${Date.now().toString().slice(-4)}`,
        description: '',
        vertical: defaultVertical,
        categoryId: firstCat?.id || '',
        brandId: '',
        sellerId: sellers[0]?.id || '',
        unitId: defaultVertical === 'GROCERY' ? 'unit_kg' : 'unit_piece',
        inventoryMode:
          defaultVertical === 'FOOD'
            ? 'PREPARED_FOOD'
            : defaultVertical === 'FURNITURE'
            ? 'MADE_TO_ORDER'
            : 'QUANTITY_STOCK',
        mrpRs: '',
        priceRs: '',
        stockQuantity: '25',
        lowStockThreshold: '5',
        prepTimeMinutes: '20',
        leadTimeDays: '4',
        dietType: 'VEG',
        attributes: {},
        variants: [],
        optionGroupIds: [],
      });
    }
    setDrawerOpen(true);
  };

  const handleAddVariant = () => {
    if (!newVariantLabel.trim()) return;
    const pricePaise = Math.round((parseFloat(newVariantPriceRs) || parseFloat(form.priceRs) || 0) * 100);
    const mrpPaise = Math.max(pricePaise, Math.round((parseFloat(form.mrpRs) || pricePaise / 100) * 100));
    const stockQuantity = Math.max(0, parseInt(newVariantStock, 10) || 0);
    const skuSuffix = newVariantLabel.trim().toUpperCase().replace(/[^A-Z0-9]+/g, '-').slice(0, 10);
    const variant: ProductVariantRecord = {
      id: `var_${Date.now()}_${form.variants.length}`,
      sku: `${form.sku || 'GB-SKU'}-${skuSuffix}`,
      label: newVariantLabel.trim(),
      attributes: { option: newVariantLabel.trim() },
      mrpPaise,
      pricePaise,
      stockQuantity,
      isAvailable: stockQuantity > 0,
    };
    setForm((prev) => ({
      ...prev,
      inventoryMode: 'VARIANT_STOCK',
      variants: [...prev.variants, variant],
    }));
    setNewVariantLabel('');
    setNewVariantPriceRs('');
    setNewVariantStock('10');
  };

  const handleSaveProduct = () => {
    if (!form.name.trim() || !form.sellerId) {
      setFormError('Product name and seller store are required.');
      return;
    }
    const pricePaise = Math.round((parseFloat(form.priceRs) || 0) * 100);
    const mrpPaise = Math.round((parseFloat(form.mrpRs) || parseFloat(form.priceRs) || 0) * 100);
    if (pricePaise <= 0) {
      setFormError('Selling price must be greater than ₹0.');
      return;
    }
    if (mrpPaise < pricePaise) {
      setFormError('MRP cannot be less than selling price.');
      return;
    }

    const sellerObj = sellers.find((s) => s.id === form.sellerId);
    const totalVariantStock = form.variants.reduce((acc, v) => acc + v.stockQuantity, 0);

    const payload = {
      sku: form.sku.trim() || `GB-${Date.now().toString().slice(-5)}`,
      name: form.name.trim(),
      hindiName: form.hindiName.trim() || undefined,
      description: form.description.trim() || undefined,
      vertical: form.vertical,
      categoryId: form.categoryId || verticalCategories[0]?.id || 'cat_food_thali',
      brandId: form.brandId || undefined,
      sellerId: form.sellerId,
      sellerName: sellerObj?.name || 'Marketplace Seller',
      unitId: form.unitId,
      inventoryMode: form.inventoryMode,
      mrpPaise,
      pricePaise,
      stockQuantity:
        form.inventoryMode === 'VARIANT_STOCK'
          ? totalVariantStock
          : form.inventoryMode === 'QUANTITY_STOCK' || form.inventoryMode === 'WEIGHT_STOCK'
          ? Math.max(0, parseInt(form.stockQuantity, 10) || 0)
          : undefined,
      lowStockThreshold: Math.max(1, parseInt(form.lowStockThreshold, 10) || 5),
      prepTimeMinutes: form.inventoryMode === 'PREPARED_FOOD' ? Math.max(5, parseInt(form.prepTimeMinutes, 10) || 20) : undefined,
      leadTimeDays: form.inventoryMode === 'MADE_TO_ORDER' ? Math.max(1, parseInt(form.leadTimeDays, 10) || 3) : undefined,
      dietType: form.vertical === 'FOOD' ? form.dietType : undefined,
      attributes: form.attributes,
      variants: form.variants,
      optionGroupIds: form.optionGroupIds,
      moderationStatus: editingProduct ? editingProduct.moderationStatus : ('APPROVED' as ProductModerationStatus),
      isActive: editingProduct ? editingProduct.isActive : true,
      isAvailable: editingProduct ? editingProduct.isAvailable : true,
    };

    if (editingProduct) {
      updateProduct(editingProduct.id, payload);
      showToast(`Updated product "${payload.name}"`);
    } else {
      addProduct(payload);
      showToast(`Created universal product "${payload.name}"`);
    }
    setDrawerOpen(false);
  };

  const openStockModal = (prod: UniversalProductRecord) => {
    setStockModalProduct(prod);
    setStockValue(String(prod.stockQuantity ?? 0));
    const vMap: Record<string, number> = {};
    prod.variants.forEach((v) => {
      vMap[v.id] = v.stockQuantity;
    });
    setVariantStockMap(vMap);
  };

  const handleSaveStock = () => {
    if (!stockModalProduct) return;
    updateProductInventory(
      stockModalProduct.id,
      Math.max(0, parseInt(stockValue, 10) || 0),
      stockModalProduct.inventoryMode === 'VARIANT_STOCK' ? variantStockMap : undefined
    );
    showToast(`Updated inventory for "${stockModalProduct.name}"`);
    setStockModalProduct(null);
  };

  const handleExportCsv = () => {
    exportToCsv(
      `grambazaar_universal_products_${new Date().toISOString().split('T')[0]}`,
      [
        { header: 'SKU', accessor: (p) => p.sku },
        { header: 'Name', accessor: (p) => p.name },
        { header: 'Vertical', accessor: (p) => p.vertical },
        { header: 'Seller', accessor: (p) => p.sellerName },
        { header: 'Inventory Mode', accessor: (p) => p.inventoryMode },
        { header: 'MRP (INR)', accessor: (p) => (p.mrpPaise / 100).toFixed(2) },
        { header: 'Price (INR)', accessor: (p) => (p.pricePaise / 100).toFixed(2) },
        { header: 'Stock', accessor: (p) => p.stockQuantity ?? 'N/A' },
        { header: 'Variants', accessor: (p) => p.variants.length },
        { header: 'Moderation', accessor: (p) => p.moderationStatus },
        { header: 'Available', accessor: (p) => (p.isAvailable ? 'Yes' : 'No') },
      ],
      filteredProducts
    );
  };

  const getModerationBadge = (status: ProductModerationStatus) => {
    if (status === 'APPROVED') return <Badge variant="success" dot>Approved</Badge>;
    if (status === 'PENDING_REVIEW') return <Badge variant="warning" dot>Pending Review</Badge>;
    if (status === 'CHANGES_REQUESTED') return <Badge variant="info" dot>Changes Requested</Badge>;
    return <Badge variant="error" dot>Rejected</Badge>;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#1F2937] flex items-center gap-2">
            <Package className="w-6 h-6 text-[#218838]" />
            Universal Product, Moderation & Inventory Master
          </h2>
          <p className="text-sm text-[#6B7280] mt-0.5">
            Manage multi-vertical seller listings, dynamic specifications, SKU variant matrices, moderation approvals, and live stock modes.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <Button variant="secondary" size="md" onClick={handleExportCsv} leftIcon={<Download className="w-4 h-4" />}>
            Export CSV
          </Button>
          {canManage && (
            <Button variant="primary" size="md" onClick={() => openProductDrawer()} leftIcon={<Plus className="w-4 h-4" />}>
              Add Universal Product
            </Button>
          )}
        </div>
      </div>

      {toastMsg && (
        <div className="bg-[#E8F5E9] border border-[#218838]/30 text-[#176B2C] px-4 py-3 rounded-xl text-sm font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Tabs & Filters */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] p-4 space-y-4 shadow-xs">
        <Tabs
          variant="underline"
          activeTab={activeTab}
          onChange={(id) => {
            setActiveTab(id as ProductTab);
            setCurrentPage(1);
          }}
          tabs={[
            { id: 'CATALOG', label: 'All Products Catalog', icon: <Package className="w-4 h-4" />, count: products.length },
            { id: 'MODERATION', label: 'Approval & Moderation Queue', icon: <AlertTriangle className="w-4 h-4" />, count: pendingProducts.length },
            { id: 'INVENTORY', label: 'Inventory & Availability Monitor', icon: <Boxes className="w-4 h-4" />, count: lowStockCount },
          ]}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-[#6B7280] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search name, SKU, seller..."
              className="w-full h-10 pl-10 pr-4 text-sm bg-[#F8FAFC] border border-[#E5E7EB] rounded-xl focus:outline-none focus:border-[#218838] focus:bg-white"
            />
          </div>
          <select
            value={verticalFilter}
            onChange={(e) => {
              setVerticalFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="h-10 px-3 text-sm bg-[#F8FAFC] border border-[#E5E7EB] rounded-xl focus:outline-none focus:border-[#218838] cursor-pointer"
          >
            <option value="ALL">All Verticals</option>
            {verticalConfigs.map((v) => (
              <option key={v.id} value={v.id}>{v.name}</option>
            ))}
          </select>
          <select
            value={sellerFilter}
            onChange={(e) => {
              setSellerFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="h-10 px-3 text-sm bg-[#F8FAFC] border border-[#E5E7EB] rounded-xl focus:outline-none focus:border-[#218838] cursor-pointer"
          >
            <option value="ALL">All Sellers</option>
            {sellers.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
          <select
            value={moderationFilter}
            onChange={(e) => {
              setModerationFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="h-10 px-3 text-sm bg-[#F8FAFC] border border-[#E5E7EB] rounded-xl focus:outline-none focus:border-[#218838] cursor-pointer"
          >
            <option value="ALL">All Approval States</option>
            <option value="APPROVED">Approved</option>
            <option value="PENDING_REVIEW">Pending Review</option>
            <option value="CHANGES_REQUESTED">Changes Requested</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </div>
      </div>

      {/* Product Table */}
      {paginatedProducts.length === 0 ? (
        <EmptyState
          icon={<Package className="w-7 h-7" />}
          title="No products match your filters"
          description="Try clearing search filters or add a new universal product listing across Food, Grocery, Hardware, Electronics, Clothing, Agriculture, or Furniture."
          actionText={canManage ? 'Add Universal Product' : undefined}
          onAction={canManage ? () => openProductDrawer() : undefined}
        />
      ) : (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-[#E5E7EB] overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#F8FAFC] border-b border-[#E5E7EB] text-xs font-bold uppercase tracking-wider text-[#6B7280]">
                    <th className="py-3.5 px-5">Product & SKU</th>
                    <th className="py-3.5 px-5">Vertical & Seller</th>
                    <th className="py-3.5 px-5">Pricing (MRP / Offer)</th>
                    <th className="py-3.5 px-5">Inventory Mode & Stock</th>
                    <th className="py-3.5 px-5">Moderation</th>
                    <th className="py-3.5 px-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E7EB] text-sm">
                  {paginatedProducts.map((prod) => {
                    const discountPct =
                      prod.mrpPaise > prod.pricePaise
                        ? Math.round(((prod.mrpPaise - prod.pricePaise) / prod.mrpPaise) * 100)
                        : 0;
                    const isLowStock =
                      (prod.inventoryMode === 'QUANTITY_STOCK' ||
                        prod.inventoryMode === 'WEIGHT_STOCK' ||
                        prod.inventoryMode === 'VARIANT_STOCK') &&
                      (prod.stockQuantity ?? 0) <= (prod.lowStockThreshold ?? 5);

                    return (
                      <tr key={prod.id} className="hover:bg-[#F8FAFC] transition-colors">
                        <td className="py-3.5 px-5">
                          <div className="flex items-start gap-2">
                            <div>
                              <p className="font-bold text-[#1F2937]">{prod.name}</p>
                              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                                <span className="font-mono text-[11px] text-[#6B7280]">{prod.sku}</span>
                                {prod.variants.length > 0 && (
                                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-[#EFF6FF] text-[#2563EB] px-1.5 py-0.5 rounded">
                                    <Layers className="w-3 h-3" /> {prod.variants.length} SKUs
                                  </span>
                                )}
                                {prod.optionGroupIds.length > 0 && (
                                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-[#FFFBEB] text-[#D97706] px-1.5 py-0.5 rounded">
                                    <Sparkles className="w-3 h-3" /> {prod.optionGroupIds.length} Add-on Groups
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-5">
                          <VerticalBadge vertical={prod.vertical} />
                          <p className="text-xs font-medium text-[#475569] mt-1">{prod.sellerName}</p>
                        </td>
                        <td className="py-3.5 px-5">
                          <div className="font-bold text-[#1F2937]">{formatPaiseToINR(prod.pricePaise)}</div>
                          {discountPct > 0 && (
                            <div className="text-xs text-[#6B7280] flex items-center gap-1.5">
                              <span className="line-through">{formatPaiseToINR(prod.mrpPaise)}</span>
                              <span className="text-[#16A34A] font-bold">{discountPct}% off</span>
                            </div>
                          )}
                        </td>
                        <td className="py-3.5 px-5">
                          <p className="text-xs font-semibold text-[#475569]">
                            {INVENTORY_MODE_LABELS[prod.inventoryMode]}
                          </p>
                          <div className="mt-1">
                            {prod.inventoryMode === 'PREPARED_FOOD' ? (
                              <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#16A34A]">
                                <Clock className="w-3.5 h-3.5" /> Prep: {prod.prepTimeMinutes || 20} mins
                              </span>
                            ) : prod.inventoryMode === 'MADE_TO_ORDER' ? (
                              <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#9A3412]">
                                <Clock className="w-3.5 h-3.5" /> Lead Time: {prod.leadTimeDays || 3} days
                              </span>
                            ) : (
                              <span
                                className={`text-xs font-bold ${
                                  isLowStock ? 'text-[#DC2626]' : 'text-[#1F2937]'
                                }`}
                              >
                                {prod.stockQuantity ?? 0} in stock
                                {isLowStock && ' (Low Stock)'}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-3.5 px-5">
                          <div className="flex flex-col gap-1 items-start">
                            {getModerationBadge(prod.moderationStatus)}
                            <button
                              type="button"
                              disabled={!canManage}
                              onClick={() => toggleProductAvailability(prod.id)}
                              className={`text-[11px] font-semibold cursor-pointer ${
                                prod.isAvailable ? 'text-[#16A34A]' : 'text-[#DC2626]'
                              }`}
                            >
                              {prod.isAvailable ? '● Live for Buyers' : '○ Marked Unavailable'}
                            </button>
                          </div>
                        </td>
                        <td className="py-3.5 px-5 text-right whitespace-nowrap">
                          <div className="inline-flex items-center gap-1.5">
                            {activeTab === 'INVENTORY' && canManage && prod.inventoryMode !== 'PREPARED_FOOD' && prod.inventoryMode !== 'MADE_TO_ORDER' && (
                              <Button variant="secondary" size="sm" onClick={() => openStockModal(prod)}>
                                Update Stock
                              </Button>
                            )}
                            {canApprove && (prod.moderationStatus === 'PENDING_REVIEW' || prod.moderationStatus === 'CHANGES_REQUESTED') && (
                              <Button
                                variant="primary"
                                size="sm"
                                onClick={() => {
                                  setModModalProduct(prod);
                                  setModNotes(prod.moderationNotes || '');
                                }}
                              >
                                Review
                              </Button>
                            )}
                            {canManage && (
                              <Button variant="ghost" size="sm" onClick={() => openProductDrawer(prod)}>
                                <Edit3 className="w-3.5 h-3.5" />
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalRecords={filteredProducts.length}
            pageSize={PAGE_SIZE}
            onPageChange={setCurrentPage}
          />
        </div>
      )}

      {/* ADD / EDIT UNIVERSAL PRODUCT DRAWER */}
      <Drawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title={editingProduct ? 'Edit Universal Product' : 'Add Universal Product'}
        subtitle="Dynamic vertical attributes, variant SKUs, option groups, and fulfillment inventory mode"
        width="max-w-2xl"
        footer={
          <>
            <Button variant="secondary" onClick={() => setDrawerOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleSaveProduct}>
              {editingProduct ? 'Save Changes' : 'Create Product'}
            </Button>
          </>
        }
      >
        <div className="space-y-6">
          {formError && (
            <div className="p-3 rounded-xl bg-[#FEE2E2] text-[#DC2626] text-xs font-semibold">{formError}</div>
          )}

          {/* Core Identity */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#6B7280] border-b border-[#E5E7EB] pb-1.5">
              1. Core Listing Details
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Select
                label="Marketplace Vertical"
                required
                value={form.vertical}
                options={verticalConfigs.map((v) => ({ label: v.name, value: v.id }))}
                onChange={(e) => {
                  const v = e.target.value;
                  const firstCat = categories.find((c) => c.vertical === v);
                  setForm({
                    ...form,
                    vertical: v,
                    categoryId: firstCat?.id || '',
                    inventoryMode:
                      v === 'FOOD'
                        ? 'PREPARED_FOOD'
                        : v === 'FURNITURE'
                        ? 'MADE_TO_ORDER'
                        : form.inventoryMode,
                  });
                }}
              />
              <Select
                label="Category"
                required
                value={form.categoryId}
                options={
                  verticalCategories.length > 0
                    ? verticalCategories.map((c) => ({ label: c.name, value: c.id }))
                    : [{ label: 'Uncategorized', value: '' }]
                }
                onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Product Name"
                required
                placeholder="e.g., Khadi Cotton Kurta / Paneer Pizza"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
              <Input
                label="Hindi Name"
                placeholder="e.g., खादी कॉटन कुर्ता"
                value={form.hindiName}
                onChange={(e) => setForm({ ...form, hindiName: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Input
                label="Base SKU"
                value={form.sku}
                onChange={(e) => setForm({ ...form, sku: e.target.value })}
              />
              <Select
                label="Seller Store"
                required
                value={form.sellerId}
                options={sellers.map((s) => ({ label: `${s.name} (${s.villageName})`, value: s.id }))}
                onChange={(e) => setForm({ ...form, sellerId: e.target.value })}
              />
              <Select
                label="Brand (Optional)"
                value={form.brandId}
                placeholder="Unbranded / Local"
                options={brands.map((b) => ({ label: b.name, value: b.id }))}
                onChange={(e) => setForm({ ...form, brandId: e.target.value })}
              />
            </div>
          </div>

          {/* Pricing & Inventory Mode */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#6B7280] border-b border-[#E5E7EB] pb-1.5">
              2. Pricing, Units & Multi-Mode Inventory
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Input
                label="MRP (₹)"
                type="number"
                placeholder="e.g., 260"
                value={form.mrpRs}
                onChange={(e) => setForm({ ...form, mrpRs: e.target.value })}
              />
              <Input
                label="Selling Price (₹)"
                type="number"
                required
                placeholder="e.g., 235"
                value={form.priceRs}
                onChange={(e) => setForm({ ...form, priceRs: e.target.value })}
              />
              <Select
                label="Unit of Measure"
                value={form.unitId}
                options={units.filter((u) => u.isActive).map((u) => ({ label: `${u.name} (${u.symbol})`, value: u.id }))}
                onChange={(e) => setForm({ ...form, unitId: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Select
                label="Inventory Mode"
                value={form.inventoryMode}
                options={(Object.keys(INVENTORY_MODE_LABELS) as InventoryMode[]).map((k) => ({
                  label: INVENTORY_MODE_LABELS[k],
                  value: k,
                }))}
                onChange={(e) => setForm({ ...form, inventoryMode: e.target.value as InventoryMode })}
              />

              {form.inventoryMode === 'PREPARED_FOOD' && (
                <>
                  <Input
                    label="Kitchen Prep Time (mins)"
                    type="number"
                    value={form.prepTimeMinutes}
                    onChange={(e) => setForm({ ...form, prepTimeMinutes: e.target.value })}
                  />
                  <Select
                    label="Dietary Tag"
                    value={form.dietType}
                    options={[
                      { label: 'Pure Veg', value: 'VEG' },
                      { label: 'Egg', value: 'EGG' },
                      { label: 'Non-Veg', value: 'NON_VEG' },
                    ]}
                    onChange={(e) => setForm({ ...form, dietType: e.target.value as 'VEG' | 'NON_VEG' | 'EGG' })}
                  />
                </>
              )}

              {form.inventoryMode === 'MADE_TO_ORDER' && (
                <Input
                  label="Production Lead Time (Days)"
                  type="number"
                  value={form.leadTimeDays}
                  onChange={(e) => setForm({ ...form, leadTimeDays: e.target.value })}
                />
              )}

              {(form.inventoryMode === 'QUANTITY_STOCK' || form.inventoryMode === 'WEIGHT_STOCK') && (
                <>
                  <Input
                    label="Available Stock"
                    type="number"
                    value={form.stockQuantity}
                    onChange={(e) => setForm({ ...form, stockQuantity: e.target.value })}
                  />
                  <Input
                    label="Low Stock Alert Threshold"
                    type="number"
                    value={form.lowStockThreshold}
                    onChange={(e) => setForm({ ...form, lowStockThreshold: e.target.value })}
                  />
                </>
              )}
            </div>
          </div>

          {/* Dynamic Vertical Attributes */}
          {verticalAttributes.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#6B7280] border-b border-[#E5E7EB] pb-1.5">
                3. Dynamic {form.vertical} Specifications
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {verticalAttributes.map((attr) => (
                  <div key={attr.id}>
                    {attr.dataType === 'SELECT' && attr.options ? (
                      <Select
                        label={attr.name}
                        required={attr.isRequired}
                        placeholder={`Select ${attr.name}`}
                        value={String(form.attributes[attr.slug] || '')}
                        options={attr.options.map((o) => ({ label: o, value: o }))}
                        onChange={(e) =>
                          setForm({ ...form, attributes: { ...form.attributes, [attr.slug]: e.target.value } })
                        }
                      />
                    ) : (
                      <Input
                        label={`${attr.name}${attr.unitSuffix ? ` (${attr.unitSuffix})` : ''}`}
                        required={attr.isRequired}
                        type={attr.dataType === 'NUMBER' ? 'number' : 'text'}
                        placeholder={attr.dataType === 'DIMENSIONS' ? 'e.g., 24 × 22 × 36' : `Enter ${attr.name}`}
                        value={String(form.attributes[attr.slug] || '')}
                        onChange={(e) =>
                          setForm({ ...form, attributes: { ...form.attributes, [attr.slug]: e.target.value } })
                        }
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Variant SKU Builder */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#6B7280] border-b border-[#E5E7EB] pb-1.5">
              4. Variant SKU Matrix (Optional — Sizes, Colours, Pack Weights)
            </h4>
            <div className="p-3.5 rounded-xl bg-[#F8FAFC] border border-[#E5E7EB] space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                <input
                  type="text"
                  placeholder="Variant (e.g., L / White)"
                  value={newVariantLabel}
                  onChange={(e) => setNewVariantLabel(e.target.value)}
                  className="sm:col-span-2 h-10 px-3 text-sm bg-white border border-[#E5E7EB] rounded-xl focus:outline-none focus:border-[#218838]"
                />
                <input
                  type="number"
                  placeholder="Price ₹"
                  value={newVariantPriceRs}
                  onChange={(e) => setNewVariantPriceRs(e.target.value)}
                  className="h-10 px-3 text-sm bg-white border border-[#E5E7EB] rounded-xl focus:outline-none focus:border-[#218838]"
                />
                <input
                  type="number"
                  placeholder="Stock"
                  value={newVariantStock}
                  onChange={(e) => setNewVariantStock(e.target.value)}
                  className="h-10 px-3 text-sm bg-white border border-[#E5E7EB] rounded-xl focus:outline-none focus:border-[#218838]"
                />
              </div>
              <Button variant="secondary" size="sm" onClick={handleAddVariant} leftIcon={<Plus className="w-3.5 h-3.5" />}>
                Add SKU Variant
              </Button>
              {form.variants.length > 0 && (
                <div className="space-y-1.5 pt-1">
                  {form.variants.map((v) => (
                    <div key={v.id} className="flex items-center justify-between px-3 py-2 bg-white border border-[#E5E7EB] rounded-lg text-xs">
                      <div>
                        <span className="font-bold text-[#1F2937]">{v.label}</span>
                        <span className="ml-2 font-mono text-[#6B7280]">{v.sku}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-semibold text-[#1F2937]">{formatPaiseToINR(v.pricePaise)}</span>
                        <span className="text-[#6B7280]">Stock: {v.stockQuantity}</span>
                        <button
                          type="button"
                          onClick={() =>
                            setForm((prev) => ({
                              ...prev,
                              variants: prev.variants.filter((x) => x.id !== v.id),
                            }))
                          }
                          className="text-[#DC2626] cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Attached Option Groups */}
          {verticalOptionGroups.length > 0 && (
            <div className="space-y-2.5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#6B7280] border-b border-[#E5E7EB] pb-1.5">
                5. Attach Customization Option Groups
              </h4>
              <div className="flex flex-wrap gap-2">
                {verticalOptionGroups.map((og) => {
                  const selected = form.optionGroupIds.includes(og.id);
                  return (
                    <button
                      key={og.id}
                      type="button"
                      onClick={() =>
                        setForm((prev) => ({
                          ...prev,
                          optionGroupIds: selected
                            ? prev.optionGroupIds.filter((id) => id !== og.id)
                            : [...prev.optionGroupIds, og.id],
                        }))
                      }
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold border cursor-pointer ${
                        selected
                          ? 'bg-[#218838] text-white border-[#218838]'
                          : 'bg-white text-[#475569] border-[#E5E7EB] hover:bg-[#F8FAFC]'
                      }`}
                    >
                      {og.name} ({og.options.length})
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </Drawer>

      {/* PRODUCT MODERATION MODAL */}
      <Modal
        isOpen={Boolean(modModalProduct)}
        onClose={() => setModModalProduct(null)}
        title="Product Listing Moderation"
        description={modModalProduct ? `${modModalProduct.name} • ${modModalProduct.sellerName}` : undefined}
        size="md"
        footer={
          <>
            <Button variant="secondary" onClick={() => setModModalProduct(null)}>Cancel</Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (!modModalProduct) return;
                moderateProduct(modModalProduct.id, 'REJECTED', modNotes || 'Rejected by catalog moderator');
                showToast(`Rejected "${modModalProduct.name}"`);
                setModModalProduct(null);
              }}
              leftIcon={<XCircle className="w-4 h-4" />}
            >
              Reject
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                if (!modModalProduct) return;
                moderateProduct(modModalProduct.id, 'CHANGES_REQUESTED', modNotes || 'Please update specs/pricing');
                showToast(`Requested changes on "${modModalProduct.name}"`);
                setModModalProduct(null);
              }}
            >
              Request Changes
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                if (!modModalProduct) return;
                moderateProduct(modModalProduct.id, 'APPROVED', modNotes || 'Verified pricing, specs & unit accuracy');
                showToast(`Approved "${modModalProduct.name}"`);
                setModModalProduct(null);
              }}
              leftIcon={<CheckCircle2 className="w-4 h-4" />}
            >
              Approve
            </Button>
          </>
        }
      >
        {modModalProduct && (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E5E7EB] space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <VerticalBadge vertical={modModalProduct.vertical} />
                <span className="font-mono text-[#6B7280]">{modModalProduct.sku}</span>
              </div>
              <p className="text-sm font-bold text-[#1F2937]">{modModalProduct.name}</p>
              <p className="text-[#475569]">
                Price: <strong>{formatPaiseToINR(modModalProduct.pricePaise)}</strong> (MRP {formatPaiseToINR(modModalProduct.mrpPaise)})
              </p>
              <p className="text-[#475569]">Mode: {INVENTORY_MODE_LABELS[modModalProduct.inventoryMode]}</p>
            </div>

            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-[#1F2937] block mb-1.5">
                Moderation Notes (Logged in Audit Trail)
              </label>
              <textarea
                rows={3}
                value={modNotes}
                onChange={(e) => setModNotes(e.target.value)}
                placeholder="Add approval note or correction checklist for seller..."
                className="w-full p-3 text-sm border border-[#E5E7EB] rounded-xl focus:outline-none focus:border-[#218838]"
              />
            </div>
          </div>
        )}
      </Modal>

      {/* INVENTORY ADJUSTMENT MODAL */}
      <Modal
        isOpen={Boolean(stockModalProduct)}
        onClose={() => setStockModalProduct(null)}
        title="Adjust Stock & Variant Inventory"
        description={stockModalProduct?.name}
        size="md"
        footer={
          <>
            <Button variant="secondary" onClick={() => setStockModalProduct(null)}>Cancel</Button>
            <Button variant="primary" onClick={handleSaveStock}>Update Stock</Button>
          </>
        }
      >
        {stockModalProduct && (
          <div className="space-y-4">
            {stockModalProduct.inventoryMode === 'VARIANT_STOCK' && stockModalProduct.variants.length > 0 ? (
              <div className="space-y-3">
                <p className="text-xs text-[#6B7280]">Update available units per variant SKU:</p>
                {stockModalProduct.variants.map((v) => (
                  <div key={v.id} className="flex items-center justify-between gap-4 p-3 rounded-xl bg-[#F8FAFC] border border-[#E5E7EB]">
                    <div>
                      <p className="text-sm font-bold text-[#1F2937]">{v.label}</p>
                      <p className="text-xs font-mono text-[#6B7280]">{v.sku}</p>
                    </div>
                    <input
                      type="number"
                      min={0}
                      value={variantStockMap[v.id] ?? v.stockQuantity}
                      onChange={(e) =>
                        setVariantStockMap({ ...variantStockMap, [v.id]: Math.max(0, parseInt(e.target.value, 10) || 0) })
                      }
                      className="w-24 h-10 px-3 text-sm font-bold text-right bg-white border border-[#E5E7EB] rounded-xl focus:outline-none focus:border-[#218838]"
                    />
                  </div>
                ))}
              </div>
            ) : (
              <Input
                label="Available Stock Quantity"
                type="number"
                value={stockValue}
                onChange={(e) => setStockValue(e.target.value)}
              />
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};
