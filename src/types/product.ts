/**
 * Product & Universal Catalog Domain Types
 * Strict separation of Food vs Grocery attributes with extensible polymorphism.
 */

export type CatalogueType = 'FOOD' | 'GROCERY';

export type QuantityMode = 'FIXED_PACK' | 'PREDEFINED_OPTIONS' | 'CUSTOM_QUANTITY';

export interface BaseProduct {
  id: string;
  sellerId: string;
  sellerName: string;
  categoryId: string;
  categoryName: string;
  name: string;
  description?: string;
  catalogueType: CatalogueType;
  pricePaise: number; // Stored in integer paise (e.g. 12000 for ₹120.00)
  unitBasis: string;  // e.g. 'plate', 'piece', 'kg', 'g', 'pav'
  isActive: boolean;
  isAvailable: boolean;
  imageUrl?: string;
  createdAt: string;
}

export interface FoodProduct extends BaseProduct {
  catalogueType: 'FOOD';
  dietType: 'VEG' | 'NON_VEG' | 'EGG';
  preparationTimeMinutes: number;
  portionOptions?: {
    id: string;
    label: string; // e.g. 'Half Plate', 'Full Plate'
    priceDeltaPaise: number;
  }[];
  addons?: {
    id: string;
    name: string;
    priceDeltaPaise: number;
  }[];
}

export interface LocalUnitDefinition {
  label: string; // e.g. 'pav'
  definitionNote: string; // e.g. '1 pav hamare yahan 250g hota hai'
  conversionGrams: number;
}

export interface GroceryProduct extends BaseProduct {
  catalogueType: 'GROCERY';
  sku?: string;
  brandName?: string;
  mrpPaise?: number;
  quantityMode: QuantityMode;
  predefinedOptions?: {
    label: string; // e.g. '250 g', '500 g', '1 kg'
    quantityValue: number;
    unit: string;
    pricePaise: number;
  }[];
  sellerLocalUnit?: LocalUnitDefinition;
  minQuantity: number;
  quantityStep: number;
  quantityPrecision: number;
  trackStock: boolean;
  stockQuantity?: number;
  lowStockThreshold?: number;
  shelfLocation?: string;
  expiryDate?: string;
  supplierName?: string;
  variableWeight: boolean;
}

export type Product = FoodProduct | GroceryProduct;
