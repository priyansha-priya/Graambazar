/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useMemo, useState } from 'react';
import {
  Plus,
  Trash2,
  Layers,
  Tag,
  Scale,
  Sliders,
  Boxes,
  ListPlus,
  PackageCheck,
  Clock,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { useAdmin } from '../../../contexts/AdminContext';
import { Seller } from '../../../types/merchant';
import {
  InventoryMode,
  ProductVariantRecord,
  UniversalProductRecord,
  VariantSizeMasterRecord,
} from '../../../types/admin';
import { formatINR } from '../../../utils/currency';
import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';

export interface SellerAddProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  seller: Seller;
  editingProduct?: UniversalProductRecord | null;
  preselectedCategoryId?: string;
  preselectedTemplate?: VariantSizeMasterRecord | null;
  onSaved: (productName: string, isEdit: boolean) => void;
}

export const SellerAddProductModal: React.FC<SellerAddProductModalProps> = ({
  isOpen,
  onClose,
  seller,
  editingProduct = null,
  preselectedCategoryId,
  preselectedTemplate = null,
  onSaved,
}) => {
  const {
    categories,
    brands,
    units,
    attributes,
    variantMasters,
    optionGroups,
    packagingMasters,
    availabilityConfigs,
    sellerCreateProduct,
    sellerUpdateProduct,
  } = useAdmin();

  const vertical = seller.primaryVertical === 'FOOD' ? 'FOOD' : 'GROCERY';
  const isFood = vertical === 'FOOD';

  // Filter all 8 centralized Masters strictly to this seller's vertical & active status
  const activeParentCategories = useMemo(
    () =>
      categories.filter(
        (c) => c.isActive && c.vertical === vertical && !c.parentId
      ),
    [categories, vertical]
  );

  const activeBrands = useMemo(
    () =>
      brands.filter(
        (b) => b.isActive && (b.verticals.includes(vertical) || b.verticals.includes('ALL'))
      ),
    [brands, vertical]
  );

  const activeUnits = useMemo(
    () =>
      units.filter(
        (u) => u.isActive && (u.verticals.includes(vertical) || u.verticals.includes('ALL'))
      ),
    [units, vertical]
  );

  const activeVariantTemplates = useMemo(
    () => variantMasters.filter((v) => v.isActive && v.vertical === vertical),
    [variantMasters, vertical]
  );

  const activeOptionGroups = useMemo(
    () =>
      optionGroups.filter(
        (g) => g.isActive && (g.verticals.includes(vertical) || g.verticals.includes('ALL'))
      ),
    [optionGroups, vertical]
  );

  const activePackagingList = useMemo(
    () =>
      packagingMasters.filter(
        (p) => p.isActive && (p.verticals.includes(vertical) || p.verticals.includes('ALL'))
      ),
    [packagingMasters, vertical]
  );

  const activeAvailabilityList = useMemo(
    () => availabilityConfigs.filter((a) => a.isActive && a.vertical === vertical),
    [availabilityConfigs, vertical]
  );

  // Form State
  const [name, setName] = useState('');
  const [hindiName, setHindiName] = useState('');
  const [description, setDescription] = useState('');
  const [sku, setSku] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [subcategoryId, setSubcategoryId] = useState('');
  const [brandId, setBrandId] = useState('');
  const [unitId, setUnitId] = useState('');
  const [dietType, setDietType] = useState<'VEG' | 'NON_VEG' | 'EGG'>('VEG');
  const [mrpRupees, setMrpRupees] = useState('120');
  const [priceRupees, setPriceRupees] = useState('110');
  const [stockQuantity, setStockQuantity] = useState('25');
  const [lowStockThreshold, setLowStockThreshold] = useState('5');
  const [prepTimeMinutes, setPrepTimeMinutes] = useState('20');
  const [packagingId, setPackagingId] = useState('');
  const [availabilityConfigId, setAvailabilityConfigId] = useState('');
  const [selectedOptionGroupIds, setSelectedOptionGroupIds] = useState<string[]>([]);
  const [attributeValues, setAttributeValues] = useState<
    Record<string, string | number | boolean>
  >({});
  const [variants, setVariants] = useState<ProductVariantRecord[]>([]);
  const [newVariantLabel, setNewVariantLabel] = useState('');
  const [newVariantMrp, setNewVariantMrp] = useState('');
  const [newVariantPrice, setNewVariantPrice] = useState('');
  const [newVariantStock, setNewVariantStock] = useState('15');
  const [formError, setFormError] = useState<string | null>(null);

  // Subcategories dynamically filtered by selected parent Category Master
  const activeSubcategories = useMemo(
    () => categories.filter((c) => c.isActive && c.parentId === categoryId),
    [categories, categoryId]
  );

  // Attributes dynamically filtered by vertical & selected category
  const applicableAttributes = useMemo(
    () =>
      attributes.filter(
        (attr) =>
          attr.isActive &&
          (attr.verticals.includes(vertical) || attr.verticals.includes('ALL')) &&
          (!attr.categoryIds ||
            attr.categoryIds.length === 0 ||
            !categoryId ||
            attr.categoryIds.includes(categoryId))
      ),
    [attributes, vertical, categoryId]
  );

  // Hydrate form when modal opens or switches between Add / Edit / Template
  useEffect(() => {
    if (!isOpen) return;
    setFormError(null);

    if (editingProduct) {
      setName(editingProduct.name);
      setHindiName(editingProduct.hindiName || '');
      setDescription(editingProduct.description || '');
      setSku(editingProduct.sku);
      setCategoryId(editingProduct.categoryId);
      setSubcategoryId(editingProduct.subcategoryId || '');
      setBrandId(editingProduct.brandId || '');
      setUnitId(editingProduct.unitId);
      setDietType(editingProduct.dietType || 'VEG');
      setMrpRupees(String(Math.round(editingProduct.mrpPaise / 100)));
      setPriceRupees(String(Math.round(editingProduct.pricePaise / 100)));
      setStockQuantity(String(editingProduct.stockQuantity ?? 20));
      setLowStockThreshold(String(editingProduct.lowStockThreshold ?? 5));
      setPrepTimeMinutes(String(editingProduct.prepTimeMinutes ?? 20));
      setSelectedOptionGroupIds(editingProduct.optionGroupIds || []);
      setAttributeValues(editingProduct.attributes || {});
      setVariants(editingProduct.variants || []);
      setPackagingId(
        typeof editingProduct.attributes?.packagingMasterId === 'string'
          ? editingProduct.attributes.packagingMasterId
          : activePackagingList[0]?.id || ''
      );
      setAvailabilityConfigId(
        typeof editingProduct.attributes?.availabilityConfigId === 'string'
          ? editingProduct.attributes.availabilityConfigId
          : activeAvailabilityList[0]?.id || ''
      );
      return;
    }

    const defaultCatId =
      preselectedTemplate?.categoryId ||
      preselectedCategoryId ||
      activeParentCategories[0]?.id ||
      '';
    const defaultUnitId =
      preselectedTemplate?.unitId || activeUnits[0]?.id || '';
    const defaultPkg = activePackagingList[0]?.id || '';
    const defaultAvail = activeAvailabilityList[0];

    setName(preselectedTemplate ? preselectedTemplate.name : '');
    setHindiName('');
    setDescription('');
    setSku(
      preselectedTemplate
        ? `${preselectedTemplate.sku}-${Math.floor(10 + Math.random() * 89)}`
        : `${vertical.slice(0, 4)}-${Math.floor(1000 + Math.random() * 9000)}`
    );
    setCategoryId(defaultCatId);
    setSubcategoryId('');
    setBrandId('');
    setUnitId(defaultUnitId);
    setDietType('VEG');
    setMrpRupees(
      preselectedTemplate ? String(Math.round(preselectedTemplate.mrpPaise / 100)) : isFood ? '140' : '95'
    );
    setPriceRupees(
      preselectedTemplate
        ? String(Math.round(preselectedTemplate.sellingPricePaise / 100))
        : isFood
        ? '130'
        : '88'
    );
    setStockQuantity(
      preselectedTemplate ? String(preselectedTemplate.stockQuantity) : isFood ? '40' : '30'
    );
    setLowStockThreshold(
      String(preselectedTemplate?.lowStockThreshold ?? defaultAvail?.lowStockThreshold ?? 5)
    );
    setPrepTimeMinutes(String(defaultAvail?.prepTimeMinutes ?? 20));
    setPackagingId(defaultPkg);
    setAvailabilityConfigId(defaultAvail?.id || '');
    setSelectedOptionGroupIds([]);
    setAttributeValues({});
    setVariants(
      preselectedTemplate
        ? [
            {
              id: `var_${Date.now()}`,
              sku: preselectedTemplate.sku,
              label: preselectedTemplate.sizeLabel,
              attributes: preselectedTemplate.attributes || { Size: preselectedTemplate.sizeLabel },
              mrpPaise: preselectedTemplate.mrpPaise,
              pricePaise: preselectedTemplate.sellingPricePaise,
              stockQuantity: preselectedTemplate.stockQuantity,
              isAvailable: true,
            },
          ]
        : []
    );
  }, [
    isOpen,
    editingProduct,
    preselectedCategoryId,
    preselectedTemplate,
    vertical,
    activeParentCategories,
    activeUnits,
    activePackagingList,
    activeAvailabilityList,
    isFood,
  ]);

  const handleApplyVariantTemplate = (tpl: VariantSizeMasterRecord) => {
    setName((prev) => prev || tpl.name);
    setCategoryId(tpl.categoryId || categoryId);
    setUnitId(tpl.unitId || unitId);
    setMrpRupees(String(Math.round(tpl.mrpPaise / 100)));
    setPriceRupees(String(Math.round(tpl.sellingPricePaise / 100)));
    setLowStockThreshold(String(tpl.lowStockThreshold));
    if (!variants.some((v) => v.label.toLowerCase() === tpl.sizeLabel.toLowerCase())) {
      setVariants((prev) => [
        ...prev,
        {
          id: `var_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
          sku: `${tpl.sku}-${prev.length + 1}`,
          label: tpl.sizeLabel,
          attributes: tpl.attributes || { Size: tpl.sizeLabel },
          mrpPaise: tpl.mrpPaise,
          pricePaise: tpl.sellingPricePaise,
          stockQuantity: tpl.stockQuantity,
          isAvailable: true,
        },
      ]);
    }
  };

  const handleApplyAvailabilityMaster = (cfgId: string) => {
    setAvailabilityConfigId(cfgId);
    const cfg = activeAvailabilityList.find((a) => a.id === cfgId);
    if (!cfg) return;
    setLowStockThreshold(String(cfg.lowStockThreshold));
    if (cfg.prepTimeMinutes) {
      setPrepTimeMinutes(String(cfg.prepTimeMinutes));
    }
    if (cfg.dailyBatchLimit) {
      setStockQuantity(String(cfg.dailyBatchLimit));
    }
  };

  const handleAddCustomVariant = () => {
    const label = newVariantLabel.trim();
    const vPrice = Number(newVariantPrice);
    const vMrp = Number(newVariantMrp) || vPrice;
    if (!label || !Number.isFinite(vPrice) || vPrice <= 0) return;

    setVariants((prev) => [
      ...prev,
      {
        id: `var_${Date.now()}_${prev.length}`,
        sku: `${sku || 'SKU'}-V${prev.length + 1}`,
        label,
        attributes: { Size: label },
        mrpPaise: Math.round(Math.max(vMrp, vPrice) * 100),
        pricePaise: Math.round(vPrice * 100),
        stockQuantity: Math.max(0, Number(newVariantStock) || 10),
        isAvailable: true,
      },
    ]);
    setNewVariantLabel('');
    setNewVariantMrp('');
    setNewVariantPrice('');
    setNewVariantStock('15');
  };

  const handleToggleOptionGroup = (groupId: string) => {
    setSelectedOptionGroupIds((prev) =>
      prev.includes(groupId) ? prev.filter((id) => id !== groupId) : [...prev, groupId]
    );
  };

  const mrpNum = Number(mrpRupees) || 0;
  const priceNum = Number(priceRupees) || 0;
  const discountPercent =
    mrpNum > priceNum && mrpNum > 0
      ? Math.round(((mrpNum - priceNum) / mrpNum) * 100)
      : 0;

  const selectedPackaging = activePackagingList.find((p) => p.id === packagingId);
  const selectedAvailability = activeAvailabilityList.find((a) => a.id === availabilityConfigId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setFormError('Please enter a product name.');
      return;
    }
    if (!categoryId) {
      setFormError('Please select a Category from the Category Master.');
      return;
    }
    if (!unitId) {
      setFormError('Please select a Unit from the Unit Master.');
      return;
    }
    if (priceNum <= 0) {
      setFormError('Selling price must be greater than ₹0.');
      return;
    }
    if (mrpNum > 0 && priceNum > mrpNum) {
      setFormError('Selling price cannot exceed printed MRP.');
      return;
    }

    const mrpPaise = Math.round((mrpNum > 0 ? mrpNum : priceNum) * 100);
    const pricePaise = Math.round(priceNum * 100);
    const selectedUnit = activeUnits.find((u) => u.id === unitId);

    const inventoryMode: InventoryMode = isFood
      ? 'PREPARED_FOOD'
      : variants.length > 0
      ? 'VARIANT_STOCK'
      : selectedUnit?.family === 'WEIGHT'
      ? 'WEIGHT_STOCK'
      : 'QUANTITY_STOCK';

    const mergedAttributes: Record<string, string | number | boolean> = {
      ...attributeValues,
    };
    if (packagingId && selectedPackaging) {
      mergedAttributes.packagingMasterId = packagingId;
      mergedAttributes.packagingName = selectedPackaging.name;
    }
    if (availabilityConfigId && selectedAvailability) {
      mergedAttributes.availabilityConfigId = availabilityConfigId;
      mergedAttributes.availabilityRule = selectedAvailability.name;
    }

    const payload: Omit<UniversalProductRecord, 'id' | 'createdAt' | 'updatedAt'> = {
      sku: sku.trim() || `${vertical.slice(0, 4)}-${Date.now().toString().slice(-4)}`,
      name: name.trim(),
      hindiName: hindiName.trim() || undefined,
      description: description.trim() || undefined,
      vertical,
      categoryId,
      subcategoryId: subcategoryId || undefined,
      brandId: brandId || undefined,
      sellerId: seller.id,
      sellerName: seller.publicName,
      unitId,
      inventoryMode,
      mrpPaise,
      pricePaise,
      stockQuantity: Math.max(0, Number(stockQuantity) || 0),
      lowStockThreshold: Math.max(1, Number(lowStockThreshold) || 5),
      prepTimeMinutes: isFood ? Math.max(5, Number(prepTimeMinutes) || 15) : undefined,
      dietType: isFood ? dietType : undefined,
      attributes: mergedAttributes,
      variants,
      optionGroupIds: selectedOptionGroupIds,
      moderationStatus: editingProduct ? editingProduct.moderationStatus : 'PENDING_REVIEW',
      moderationNotes: editingProduct
        ? editingProduct.moderationNotes
        : 'Submitted by verified seller using centralized GramBazaar Masters.',
      isActive: true,
      isAvailable: true,
    };

    if (editingProduct) {
      sellerUpdateProduct(seller.id, editingProduct.id, payload);
      onSaved(payload.name, true);
    } else {
      sellerCreateProduct(seller.id, payload);
      onSaved(payload.name, false);
    }
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        editingProduct
          ? `Edit Product — ${editingProduct.name}`
          : `Add New ${isFood ? 'Food Dish' : 'Grocery Product'} Using Masters`
      }
      size="xl"
      footer={
        <div className="flex flex-wrap items-center justify-between gap-3 w-full">
          <p className="text-[11px] text-[#6B7280]">
            Synced live with Seller Catalog, Admin Masters &amp; Customer Storefront ({seller.publicName})
          </p>
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              leftIcon={<CheckCircle2 className="w-4 h-4" />}
              onClick={handleSubmit}
            >
              {editingProduct ? 'Save Changes' : 'Publish Product'}
            </Button>
          </div>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-6 text-left">
        {formError && (
          <div className="p-3 rounded-xl bg-[#FEF2F2] border border-[#FECACA] text-xs font-semibold text-[#B91C1C]">
            {formError}
          </div>
        )}

        {/* QUICK-FILL FROM VARIANT / SIZE MASTER TEMPLATES */}
        {!editingProduct && activeVariantTemplates.length > 0 && (
          <div className="p-3.5 rounded-xl bg-[#F8FAFC] border border-[#E5E7EB] space-y-2">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-bold text-[#1F2937] flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#218838]" />
                <span>Quick-Fill from Variant &amp; Size Master Templates</span>
              </p>
              <span className="text-[11px] text-[#6B7280]">Optional 1-click preset</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {activeVariantTemplates.slice(0, 6).map((tpl) => (
                <button
                  key={tpl.id}
                  type="button"
                  onClick={() => handleApplyVariantTemplate(tpl)}
                  className="px-2.5 py-1.5 rounded-lg bg-white border border-[#E5E7EB] hover:border-[#218838] hover:bg-[#E8F5E9] text-[11px] font-semibold text-[#1F2937] transition-colors cursor-pointer"
                >
                  + {tpl.name} ({tpl.sizeLabel} · {formatINR(tpl.sellingPricePaise)})
                </button>
              ))}
            </div>
          </div>
        )}

        {/* SECTION 1: BASIC DETAILS + CATEGORY, SUBCATEGORY & BRAND MASTERS */}
        <div className="space-y-3.5">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#176B2C] flex items-center gap-1.5 border-b border-[#E5E7EB] pb-1.5">
            <Layers className="w-3.5 h-3.5" />
            <span>1. Product Identity, Category &amp; Brand Master</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-bold text-[#1F2937] mb-1">
                Product Name <span className="text-[#DC2626]">*</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={
                  isFood
                    ? 'e.g. Special Paneer Butter Masala'
                    : 'e.g. Aashirvaad Shudh Chakki Atta'
                }
                className="w-full h-10 px-3.5 bg-[#F8FAFC] border border-[#E5E7EB] rounded-xl text-xs text-[#1F2937] outline-none focus:border-[#218838]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#1F2937] mb-1">
                Hindi / Local Name (हिंदी नाम)
              </label>
              <input
                type="text"
                value={hindiName}
                onChange={(e) => setHindiName(e.target.value)}
                placeholder={
                  isFood ? 'उदा. पनीर बटर मसाला' : 'उदा. आशीर्वाद शुद्ध चक्की आटा'
                }
                className="w-full h-10 px-3.5 bg-[#F8FAFC] border border-[#E5E7EB] rounded-xl text-xs text-[#1F2937] outline-none focus:border-[#218838]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#1F2937] mb-1">
                Category Master <span className="text-[#DC2626]">*</span>
              </label>
              <select
                value={categoryId}
                onChange={(e) => {
                  setCategoryId(e.target.value);
                  setSubcategoryId('');
                }}
                className="w-full h-10 px-3 bg-[#F8FAFC] border border-[#E5E7EB] rounded-xl text-xs font-semibold text-[#1F2937] outline-none focus:border-[#218838]"
              >
                <option value="">Select Category...</option>
                {activeParentCategories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name} ({cat.hindiName})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#1F2937] mb-1">
                Subcategory Master
              </label>
              <select
                value={subcategoryId}
                onChange={(e) => setSubcategoryId(e.target.value)}
                disabled={activeSubcategories.length === 0}
                className="w-full h-10 px-3 bg-[#F8FAFC] border border-[#E5E7EB] rounded-xl text-xs font-semibold text-[#1F2937] outline-none focus:border-[#218838] disabled:opacity-60"
              >
                <option value="">
                  {activeSubcategories.length === 0
                    ? 'No subcategories configured'
                    : 'Select Subcategory (Optional)'}
                </option>
                {activeSubcategories.map((sub) => (
                  <option key={sub.id} value={sub.id}>
                    {sub.name} ({sub.hindiName})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#1F2937] mb-1 flex items-center gap-1">
                <Tag className="w-3 h-3 text-[#218838]" />
                <span>Brand Master</span>
              </label>
              <select
                value={brandId}
                onChange={(e) => setBrandId(e.target.value)}
                className="w-full h-10 px-3 bg-[#F8FAFC] border border-[#E5E7EB] rounded-xl text-xs font-semibold text-[#1F2937] outline-none focus:border-[#218838]"
              >
                <option value="">Unbranded / Local House Brand</option>
                {activeBrands.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name} {b.isVerified ? '✓ Verified' : ''}
                  </option>
                ))}
              </select>
            </div>

            {isFood ? (
              <div>
                <label className="block text-xs font-bold text-[#1F2937] mb-1">
                  Diet Classification
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['VEG', 'EGG', 'NON_VEG'] as const).map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setDietType(d)}
                      className={`h-10 rounded-xl border text-xs font-bold transition-colors cursor-pointer ${
                        dietType === d
                          ? d === 'VEG'
                            ? 'bg-[#E8F5E9] border-[#218838] text-[#176B2C]'
                            : d === 'EGG'
                            ? 'bg-[#FEF3C7] border-[#D97706] text-[#92400E]'
                            : 'bg-[#FEE2E2] border-[#DC2626] text-[#991B1B]'
                          : 'bg-white border-[#E5E7EB] text-[#6B7280]'
                      }`}
                    >
                      {d === 'VEG' ? 'Pure Veg' : d === 'EGG' ? 'Egg' : 'Non-Veg'}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div>
                <label className="block text-xs font-bold text-[#1F2937] mb-1">
                  SKU / Barcode Code
                </label>
                <input
                  type="text"
                  value={sku}
                  onChange={(e) => setSku(e.target.value)}
                  className="w-full h-10 px-3.5 bg-[#F8FAFC] border border-[#E5E7EB] rounded-xl font-mono text-xs text-[#1F2937] outline-none focus:border-[#218838]"
                />
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-[#1F2937] mb-1">
              Short Description (Customer Storefront Copy)
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={
                isFood
                  ? 'e.g. Fresh cottage cheese simmered in creamy tomato gravy, served hot'
                  : 'e.g. 100% MP Sharbati whole wheat flour, freshly packed & sealed'
              }
              className="w-full h-10 px-3.5 bg-[#F8FAFC] border border-[#E5E7EB] rounded-xl text-xs text-[#1F2937] outline-none focus:border-[#218838]"
            />
          </div>
        </div>

        {/* SECTION 2: UNIT MASTER, PRICING & AVAILABILITY/STOCK MASTER */}
        <div className="space-y-3.5">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#176B2C] flex items-center gap-1.5 border-b border-[#E5E7EB] pb-1.5">
            <Scale className="w-3.5 h-3.5" />
            <span>2. Unit &amp; Measurement Master, Pricing &amp; Stock Configuration</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-[#1F2937] mb-1">
                Unit &amp; Measurement Master <span className="text-[#DC2626]">*</span>
              </label>
              <select
                value={unitId}
                onChange={(e) => setUnitId(e.target.value)}
                className="w-full h-10 px-3 bg-[#F8FAFC] border border-[#E5E7EB] rounded-xl text-xs font-semibold text-[#1F2937] outline-none focus:border-[#218838]"
              >
                <option value="">Select Unit...</option>
                {activeUnits.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.symbol} · {u.hindiName})
                    {u.conversionFactor && u.baseUnit
                      ? ` — 1 ${u.symbol} = ${u.conversionFactor}${u.baseUnit}`
                      : ''}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#1F2937] mb-1">
                MRP (₹)
              </label>
              <input
                type="number"
                min={1}
                value={mrpRupees}
                onChange={(e) => setMrpRupees(e.target.value)}
                className="w-full h-10 px-3 bg-[#F8FAFC] border border-[#E5E7EB] rounded-xl text-xs font-bold text-[#1F2937] outline-none focus:border-[#218838] tabular-nums"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#1F2937] mb-1">
                Selling Price (₹) <span className="text-[#DC2626]">*</span>
              </label>
              <input
                type="number"
                min={1}
                required
                value={priceRupees}
                onChange={(e) => setPriceRupees(e.target.value)}
                className="w-full h-10 px-3 bg-[#F8FAFC] border border-[#E5E7EB] rounded-xl text-xs font-bold text-[#176B2C] outline-none focus:border-[#218838] tabular-nums"
              />
              {discountPercent > 0 && (
                <p className="text-[10px] font-bold text-[#16A34A] mt-0.5 tabular-nums">
                  Customer saves {discountPercent}% off MRP
                </p>
              )}
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-[#1F2937] mb-1 flex items-center gap-1">
                <Clock className="w-3 h-3 text-[#218838]" />
                <span>Availability &amp; Stock Config Master</span>
              </label>
              <select
                value={availabilityConfigId}
                onChange={(e) => handleApplyAvailabilityMaster(e.target.value)}
                className="w-full h-10 px-3 bg-[#F8FAFC] border border-[#E5E7EB] rounded-xl text-xs font-semibold text-[#1F2937] outline-none focus:border-[#218838]"
              >
                <option value="">Standard Seller Stock Rule</option>
                {activeAvailabilityList.map((cfg) => (
                  <option key={cfg.id} value={cfg.id}>
                    {cfg.name} ({cfg.workflowMode.replace(/_/g, ' ')})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#1F2937] mb-1">
                {isFood ? 'Prep Time (mins)' : 'Opening Stock Qty'}
              </label>
              <input
                type="number"
                min={0}
                value={isFood ? prepTimeMinutes : stockQuantity}
                onChange={(e) =>
                  isFood ? setPrepTimeMinutes(e.target.value) : setStockQuantity(e.target.value)
                }
                className="w-full h-10 px-3 bg-[#F8FAFC] border border-[#E5E7EB] rounded-xl text-xs font-bold text-[#1F2937] outline-none focus:border-[#218838] tabular-nums"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#1F2937] mb-1">
                Low Stock Alert At
              </label>
              <input
                type="number"
                min={1}
                value={lowStockThreshold}
                onChange={(e) => setLowStockThreshold(e.target.value)}
                className="w-full h-10 px-3 bg-[#F8FAFC] border border-[#E5E7EB] rounded-xl text-xs font-bold text-[#1F2937] outline-none focus:border-[#218838] tabular-nums"
              />
            </div>
          </div>
        </div>

        {/* SECTION 3: PACK / PORTION VARIANTS (VARIANT & SIZE MASTER) */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#176B2C] flex items-center gap-1.5 border-b border-[#E5E7EB] pb-1.5">
            <Boxes className="w-3.5 h-3.5" />
            <span>3. Pack Sizes &amp; Portions (Variant &amp; Size Master)</span>
          </h3>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            <input
              type="text"
              value={newVariantLabel}
              onChange={(e) => setNewVariantLabel(e.target.value)}
              placeholder={isFood ? 'e.g. Half Plate' : 'e.g. 500g Pack'}
              className="col-span-2 sm:col-span-2 h-9 px-3 bg-[#F8FAFC] border border-[#E5E7EB] rounded-lg text-xs text-[#1F2937] outline-none focus:border-[#218838]"
            />
            <input
              type="number"
              value={newVariantMrp}
              onChange={(e) => setNewVariantMrp(e.target.value)}
              placeholder="MRP ₹"
              className="h-9 px-3 bg-[#F8FAFC] border border-[#E5E7EB] rounded-lg text-xs text-[#1F2937] outline-none focus:border-[#218838] tabular-nums"
            />
            <input
              type="number"
              value={newVariantPrice}
              onChange={(e) => setNewVariantPrice(e.target.value)}
              placeholder="Price ₹"
              className="h-9 px-3 bg-[#F8FAFC] border border-[#E5E7EB] rounded-lg text-xs text-[#1F2937] outline-none focus:border-[#218838] tabular-nums"
            />
            <Button
              type="button"
              variant="secondary"
              size="sm"
              leftIcon={<Plus className="w-3.5 h-3.5" />}
              onClick={handleAddCustomVariant}
            >
              Add Size
            </Button>
          </div>

          {variants.length > 0 && (
            <div className="divide-y divide-[#F1F5F9] border border-[#E5E7EB] rounded-xl overflow-hidden">
              {variants.map((v) => (
                <div
                  key={v.id}
                  className="px-3.5 py-2.5 bg-white flex items-center justify-between gap-2 text-xs"
                >
                  <div>
                    <span className="font-bold text-[#1F2937]">{v.label}</span>
                    <span className="text-[#6B7280] ml-2 font-mono text-[11px]">{v.sku}</span>
                  </div>
                  <div className="flex items-center gap-3 tabular-nums">
                    <span className="text-[#6B7280] line-through">{formatINR(v.mrpPaise)}</span>
                    <span className="font-extrabold text-[#176B2C]">{formatINR(v.pricePaise)}</span>
                    <button
                      type="button"
                      onClick={() => setVariants((prev) => prev.filter((item) => item.id !== v.id))}
                      className="text-[#DC2626] hover:bg-[#FEE2E2] p-1 rounded cursor-pointer"
                      aria-label={`Remove ${v.label}`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* SECTION 4: DYNAMIC PRODUCT ATTRIBUTES MASTER */}
        {applicableAttributes.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#176B2C] flex items-center gap-1.5 border-b border-[#E5E7EB] pb-1.5">
              <Sliders className="w-3.5 h-3.5" />
              <span>4. Product Specifications (Attribute Master)</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {applicableAttributes.map((attr) => {
                const currentVal = attributeValues[attr.slug];
                return (
                  <div key={attr.id}>
                    <label className="block text-xs font-semibold text-[#1F2937] mb-1">
                      {attr.name}{' '}
                      <span className="text-[10px] text-[#6B7280] font-normal">
                        ({attr.hindiName})
                      </span>
                    </label>

                    {attr.dataType === 'SELECT' || attr.dataType === 'MULTI_SELECT' ? (
                      <select
                        value={typeof currentVal === 'string' ? currentVal : ''}
                        onChange={(e) =>
                          setAttributeValues((prev) => ({
                            ...prev,
                            [attr.slug]: e.target.value,
                          }))
                        }
                        className="w-full h-9 px-3 bg-[#F8FAFC] border border-[#E5E7EB] rounded-lg text-xs text-[#1F2937] outline-none focus:border-[#218838]"
                      >
                        <option value="">Select {attr.name}...</option>
                        {(attr.options || []).map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    ) : attr.dataType === 'BOOLEAN' ? (
                      <label className="flex items-center gap-2 h-9 px-3 bg-[#F8FAFC] border border-[#E5E7EB] rounded-lg text-xs cursor-pointer">
                        <input
                          type="checkbox"
                          checked={Boolean(currentVal)}
                          onChange={(e) =>
                            setAttributeValues((prev) => ({
                              ...prev,
                              [attr.slug]: e.target.checked,
                            }))
                          }
                          className="accent-[#218838] w-4 h-4"
                        />
                        <span className="text-[#1F2937] font-medium">Yes / Enabled</span>
                      </label>
                    ) : (
                      <input
                        type={attr.dataType === 'NUMBER' ? 'number' : 'text'}
                        value={
                          typeof currentVal === 'string' || typeof currentVal === 'number'
                            ? String(currentVal)
                            : ''
                        }
                        onChange={(e) =>
                          setAttributeValues((prev) => ({
                            ...prev,
                            [attr.slug]:
                              attr.dataType === 'NUMBER'
                                ? Number(e.target.value)
                                : e.target.value,
                          }))
                        }
                        placeholder={attr.unitSuffix ? `Value (${attr.unitSuffix})` : `Enter ${attr.name}`}
                        className="w-full h-9 px-3 bg-[#F8FAFC] border border-[#E5E7EB] rounded-lg text-xs text-[#1F2937] outline-none focus:border-[#218838]"
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* SECTION 5: ADD-ONS MASTER & PACKAGING MASTER */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-1">
          {/* Packaging Master */}
          <div className="space-y-2.5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#176B2C] flex items-center gap-1.5 border-b border-[#E5E7EB] pb-1.5">
              <PackageCheck className="w-3.5 h-3.5" />
              <span>5. Packaging Master</span>
            </h3>
            <select
              value={packagingId}
              onChange={(e) => setPackagingId(e.target.value)}
              className="w-full h-10 px-3 bg-[#F8FAFC] border border-[#E5E7EB] rounded-xl text-xs font-semibold text-[#1F2937] outline-none focus:border-[#218838]"
            >
              <option value="">Standard Shop Packaging (₹0)</option>
              {activePackagingList.map((pkg) => (
                <option key={pkg.id} value={pkg.id}>
                  {pkg.name} ({pkg.capacityLabel} · {formatINR(pkg.feePaise)})
                </option>
              ))}
            </select>
            {selectedPackaging && (
              <p className="text-[11px] text-[#6B7280]">
                {selectedPackaging.isFoodGrade ? 'Food-Grade · ' : ''}
                {selectedPackaging.isLeakProof ? 'Leak-Proof · ' : ''}
                {selectedPackaging.isEcoFriendly ? 'Eco-Friendly · ' : ''}
                Fee: <strong className="text-[#1F2937]">{formatINR(selectedPackaging.feePaise)}</strong>
              </p>
            )}
          </div>

          {/* Add-ons & Customizations Master */}
          <div className="space-y-2.5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#176B2C] flex items-center gap-1.5 border-b border-[#E5E7EB] pb-1.5">
              <ListPlus className="w-3.5 h-3.5" />
              <span>6. Add-ons &amp; Customization Master</span>
            </h3>
            {activeOptionGroups.length === 0 ? (
              <p className="text-xs text-[#6B7280]">No add-on groups configured for this vertical.</p>
            ) : (
              <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                {activeOptionGroups.map((grp) => {
                  const checked = selectedOptionGroupIds.includes(grp.id);
                  return (
                    <label
                      key={grp.id}
                      className={`flex items-start gap-2.5 p-2.5 rounded-xl border text-xs cursor-pointer transition-colors ${
                        checked
                          ? 'bg-[#E8F5E9] border-[#218838]/40'
                          : 'bg-[#F8FAFC] border-[#E5E7EB]'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => handleToggleOptionGroup(grp.id)}
                        className="mt-0.5 accent-[#218838] w-4 h-4 shrink-0"
                      />
                      <div className="min-w-0">
                        <p className="font-bold text-[#1F2937]">
                          {grp.name}{' '}
                          <span className="font-normal text-[#6B7280]">({grp.hindiName})</span>
                        </p>
                        <p className="text-[10px] text-[#6B7280] truncate">
                          {grp.options.map((o) => o.label).join(', ')}
                        </p>
                      </div>
                    </label>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </form>
    </Modal>
  );
};
