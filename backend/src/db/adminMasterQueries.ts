import { asc, desc, eq } from 'drizzle-orm';
import { db } from './index.ts';
import {
  adminAttributes,
  adminAvailabilityConfigs,
  adminBrands,
  adminOptionGroups,
  adminPackagingMasters,
  adminUnits,
  adminVariantMasters,
  adminVerticals,
} from './schema.ts';
import type {
  AttributeDataType,
  AttributeMasterRecord,
  AvailabilityStockConfigRecord,
  AvailabilityWorkflowMode,
  BrandMasterRecord,
  KycDocCode,
  OptionGroupItem,
  OptionGroupMasterRecord,
  PackagingMasterRecord,
  PackagingMaterialType,
  UnitFamily,
  UnitMasterRecord,
  VariantSizeMasterRecord,
  VerticalConfigRecord,
  VerticalWorkflowType,
} from '../types/admin.ts';

function safeJsonParse<T>(raw: string | null | undefined, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

// =========================================================================
// INITIAL SEED DATA FOR ALL 8 CATALOG MASTERS
// =========================================================================

const SEED_VERTICALS: VerticalConfigRecord[] = [
  {
    id: 'FOOD',
    name: 'Food & Restaurants',
    hindiName: 'होटल, ढाबा और तैयार भोजन',
    icon: 'Utensils',
    isEnabled: true,
    sellerCount: 3,
    description:
      'Freshly prepared restaurant dishes, dhabas, mithai, veg/non-veg classification, and kitchen prep timers.',
    specialRules: [
      'Requires FSSAI license check',
      'Mandatory Veg/Non-Veg/Egg tag',
      'Kitchen prep timers (15-45m)',
    ],
    fulfillmentWorkflow: 'FOOD_KITCHEN',
    requiredKycDocs: ['FSSAI', 'AADHAAR', 'PAN', 'STORE_PHOTO'],
  },
  {
    id: 'GROCERY',
    name: 'Grocery & Daily Essentials',
    hindiName: 'किराना और दैनिक राशन',
    icon: 'ShoppingBag',
    isEnabled: true,
    sellerCount: 2,
    description:
      'Packaged and loose dry ration, atta, pulses, spices, edible oils, custom weights and village pav units.',
    specialRules: [
      'Metric & local pav (250g) unit pricing',
      'Weight & pack inventory tracking',
      'Seller-managed delivery or pickup',
    ],
    fulfillmentWorkflow: 'GROCERY_WEIGHT',
    requiredKycDocs: ['AADHAAR', 'PAN', 'STORE_PHOTO', 'GST_TRADE'],
  },
  {
    id: 'AGRICULTURE',
    name: 'Agriculture Products',
    hindiName: 'कृषि, बीज और खाद भंडार',
    icon: 'Sprout',
    isEnabled: true,
    sellerCount: 1,
    description:
      'Certified seeds, crop fertilizers, agricultural pesticides, animal fodder, and seasonal farm inputs.',
    specialRules: [
      'Department of Agriculture license check',
      'Bulk Bori (40kg/50kg) & Quintal unit support',
    ],
    fulfillmentWorkflow: 'PHYSICAL_RETAIL',
    requiredKycDocs: ['AGRI_LICENSE', 'AADHAAR', 'PAN', 'STORE_PHOTO'],
  },
  {
    id: 'HARDWARE',
    name: 'Hardware, Electric & Plumbing',
    hindiName: 'हार्डवेयर और बिजली का सामान',
    icon: 'Wrench',
    isEnabled: true,
    sellerCount: 1,
    description:
      'PVC pipes, motors, switches, agricultural machinery spares, paint, and home repair essentials.',
    specialRules: [
      'Gauge/diameter/length attributes',
      'Store pickup or vehicle-assisted delivery',
    ],
    fulfillmentWorkflow: 'PHYSICAL_RETAIL',
    requiredKycDocs: ['AADHAAR', 'PAN', 'GST_TRADE', 'STORE_PHOTO'],
  },
  {
    id: 'ELECTRONICS',
    name: 'Electronics & Appliances',
    hindiName: 'इलेक्ट्रॉनिक्स और उपकरण',
    icon: 'Smartphone',
    isEnabled: true,
    sellerCount: 1,
    description:
      'Ceiling fans, LED lights, mixers, mobile accessories, inverters, solar lamps, and small appliances.',
    specialRules: [
      'Brand warranty & wattage attributes',
      'Serial/invoice verification on delivery',
    ],
    fulfillmentWorkflow: 'PHYSICAL_RETAIL',
    requiredKycDocs: ['AADHAAR', 'PAN', 'GST_TRADE', 'STORE_PHOTO'],
  },
  {
    id: 'APPAREL',
    name: 'Clothing & Fashion',
    hindiName: 'कपड़े और परिधान',
    icon: 'Shirt',
    isEnabled: true,
    sellerCount: 1,
    description:
      'Kurtas, sarees, school uniforms, footwear, winterwear, and festive garments from local village stores.',
    specialRules: ['Size × Colour SKU variant matrix', '48-hour size exchange policy'],
    fulfillmentWorkflow: 'PHYSICAL_RETAIL',
    requiredKycDocs: ['AADHAAR', 'PAN', 'STORE_PHOTO'],
  },
  {
    id: 'FURNITURE',
    name: 'Home & Furniture',
    hindiName: 'फर्नीचर और घरेलू साज-सज्जा',
    icon: 'Armchair',
    isEnabled: false,
    sellerCount: 0,
    description:
      'Wooden cots (charpai), chairs, almirahs, tables, mattresses, and custom carpenter made-to-order pieces.',
    specialRules: [
      'Dimensions (L×W×H) & wood material specs',
      'Made-to-order lead-time days & scheduled transport',
    ],
    fulfillmentWorkflow: 'MADE_TO_ORDER',
    requiredKycDocs: ['AADHAAR', 'PAN', 'STORE_PHOTO'],
  },
];

const SEED_ATTRIBUTES: AttributeMasterRecord[] = [
  {
    id: 'attr_diet_type',
    name: 'Dietary Type',
    hindiName: 'शाकाहारी / मांसाहारी',
    slug: 'diet_type',
    dataType: 'SELECT',
    options: ['Pure Veg', 'Egg', 'Non-Veg'],
    isRequired: true,
    isFilterable: true,
    isVariantAxis: false,
    verticals: ['FOOD'],
    isActive: true,
  },
  {
    id: 'attr_spice_level',
    name: 'Spice Level',
    hindiName: 'तीखापन',
    slug: 'spice_level',
    dataType: 'SELECT',
    options: ['Mild', 'Medium', 'Spicy'],
    isRequired: false,
    isFilterable: true,
    isVariantAxis: false,
    verticals: ['FOOD'],
    isActive: true,
  },
  {
    id: 'attr_pack_weight',
    name: 'Pack Weight',
    hindiName: 'पैकेट वजन',
    slug: 'pack_weight',
    dataType: 'SELECT',
    options: ['250 g (1 Pav)', '500 g', '1 kg', '5 kg', '10 kg', '40 kg Bori'],
    isRequired: true,
    isFilterable: true,
    isVariantAxis: true,
    verticals: ['GROCERY', 'AGRICULTURE'],
    isActive: true,
  },
  {
    id: 'attr_size',
    name: 'Apparel Size',
    hindiName: 'साइज',
    slug: 'size',
    dataType: 'SELECT',
    options: ['S', 'M', 'L', 'XL', 'XXL'],
    isRequired: true,
    isFilterable: true,
    isVariantAxis: true,
    verticals: ['APPAREL'],
    isActive: true,
  },
  {
    id: 'attr_color',
    name: 'Colour',
    hindiName: 'रंग',
    slug: 'color',
    dataType: 'SELECT',
    options: ['White', 'Cream', 'Blue', 'Brown', 'Black', 'Red', 'Natural Teak'],
    isRequired: false,
    isFilterable: true,
    isVariantAxis: true,
    verticals: ['APPAREL', 'ELECTRONICS', 'FURNITURE'],
    isActive: true,
  },
  {
    id: 'attr_fabric',
    name: 'Fabric',
    hindiName: 'कपड़ा प्रकार',
    slug: 'fabric',
    dataType: 'SELECT',
    options: ['100% Cotton', 'Khadi', 'Silk Blend', 'Polyester'],
    isRequired: false,
    isFilterable: true,
    isVariantAxis: false,
    verticals: ['APPAREL'],
    isActive: true,
  },
  {
    id: 'attr_material',
    name: 'Material / Grade',
    hindiName: 'सामग्री',
    slug: 'material',
    dataType: 'SELECT',
    options: ['UPVC', 'CPVC', 'Galvanized Iron', 'Sheesham Wood', 'Teak Wood', 'Mild Steel'],
    isRequired: true,
    isFilterable: true,
    isVariantAxis: false,
    verticals: ['HARDWARE', 'FURNITURE'],
    isActive: true,
  },
  {
    id: 'attr_pipe_dia',
    name: 'Pipe Diameter',
    hindiName: 'पाइप व्यास',
    slug: 'pipe_diameter',
    dataType: 'SELECT',
    options: ['0.5 inch', '0.75 inch', '1 inch', '2 inch', '4 inch'],
    unitSuffix: 'inch',
    isRequired: false,
    isFilterable: true,
    isVariantAxis: true,
    verticals: ['HARDWARE'],
    isActive: true,
  },
  {
    id: 'attr_wattage',
    name: 'Power Rating',
    hindiName: 'वाट क्षमता',
    slug: 'wattage',
    dataType: 'NUMBER',
    unitSuffix: 'W',
    isRequired: true,
    isFilterable: true,
    isVariantAxis: false,
    verticals: ['ELECTRONICS', 'HARDWARE'],
    isActive: true,
  },
  {
    id: 'attr_warranty',
    name: 'Warranty Period',
    hindiName: 'वारंटी अवधि',
    slug: 'warranty',
    dataType: 'SELECT',
    options: ['No Warranty', '6 Months', '1 Year', '2 Years', '5 Years'],
    isRequired: false,
    isFilterable: true,
    isVariantAxis: false,
    verticals: ['ELECTRONICS', 'HARDWARE', 'FURNITURE'],
    isActive: true,
  },
  {
    id: 'attr_dimensions',
    name: 'Dimensions (L×W×H)',
    hindiName: 'आकार (लं×चौ×ऊं)',
    slug: 'dimensions',
    dataType: 'DIMENSIONS',
    unitSuffix: 'inches',
    isRequired: true,
    isFilterable: false,
    isVariantAxis: false,
    verticals: ['FURNITURE'],
    isActive: true,
  },
  {
    id: 'attr_crop_season',
    name: 'Crop Season',
    hindiName: 'फसल मौसम',
    slug: 'crop_season',
    dataType: 'SELECT',
    options: ['Rabi (Winter)', 'Kharif (Monsoon)', 'Zaid (Summer)', 'All Season'],
    isRequired: false,
    isFilterable: true,
    isVariantAxis: false,
    verticals: ['AGRICULTURE'],
    isActive: true,
  },
];

const SEED_UNITS: UnitMasterRecord[] = [
  {
    id: 'unit_kg',
    name: 'Kilogram',
    hindiName: 'किलोग्राम',
    symbol: 'kg',
    family: 'WEIGHT',
    baseUnit: 'g',
    conversionFactor: 1000,
    allowDecimal: true,
    allowSellerLocalOverride: false,
    verticals: ['GROCERY', 'AGRICULTURE', 'FOOD'],
    isActive: true,
  },
  {
    id: 'unit_gm',
    name: 'Gram',
    hindiName: 'ग्राम',
    symbol: 'g',
    family: 'WEIGHT',
    baseUnit: 'g',
    conversionFactor: 1,
    allowDecimal: false,
    allowSellerLocalOverride: false,
    verticals: ['GROCERY', 'FOOD'],
    isActive: true,
  },
  {
    id: 'unit_pav',
    name: 'Pav (Local Village Weight)',
    hindiName: 'पाव (250 ग्राम)',
    symbol: 'pav',
    family: 'WEIGHT',
    baseUnit: 'g',
    conversionFactor: 250,
    allowDecimal: false,
    allowSellerLocalOverride: true,
    verticals: ['GROCERY', 'FOOD'],
    isActive: true,
  },
  {
    id: 'unit_litre',
    name: 'Litre',
    hindiName: 'लीटर',
    symbol: 'L',
    family: 'VOLUME',
    baseUnit: 'ml',
    conversionFactor: 1000,
    allowDecimal: true,
    allowSellerLocalOverride: false,
    verticals: ['GROCERY', 'AGRICULTURE'],
    isActive: true,
  },
  {
    id: 'unit_ml',
    name: 'Millilitre',
    hindiName: 'मिलीलीटर',
    symbol: 'ml',
    family: 'VOLUME',
    baseUnit: 'ml',
    conversionFactor: 1,
    allowDecimal: false,
    allowSellerLocalOverride: false,
    verticals: ['GROCERY', 'FOOD'],
    isActive: true,
  },
  {
    id: 'unit_plate',
    name: 'Full Plate / Thali',
    hindiName: 'फुल प्लेट / थाली',
    symbol: 'plate',
    family: 'PORTION',
    allowDecimal: false,
    allowSellerLocalOverride: true,
    verticals: ['FOOD'],
    isActive: true,
  },
  {
    id: 'unit_half_plate',
    name: 'Half Plate',
    hindiName: 'हाफ प्लेट',
    symbol: 'half',
    family: 'PORTION',
    allowDecimal: false,
    allowSellerLocalOverride: true,
    verticals: ['FOOD'],
    isActive: true,
  },
  {
    id: 'unit_piece',
    name: 'Piece / Unit',
    hindiName: 'पीस / नग',
    symbol: 'pcs',
    family: 'COUNT',
    allowDecimal: false,
    allowSellerLocalOverride: false,
    verticals: ['ALL'],
    isActive: true,
  },
  {
    id: 'unit_ft',
    name: 'Foot (Length)',
    hindiName: 'फुट',
    symbol: 'ft',
    family: 'LENGTH',
    baseUnit: 'ft',
    conversionFactor: 1,
    allowDecimal: true,
    allowSellerLocalOverride: false,
    verticals: ['HARDWARE', 'FURNITURE'],
    isActive: true,
  },
  {
    id: 'unit_bori',
    name: 'Bori / Sack (40 kg)',
    hindiName: 'बोरी (40 किलो)',
    symbol: 'bori',
    family: 'BULK_PACK',
    baseUnit: 'kg',
    conversionFactor: 40,
    allowDecimal: false,
    allowSellerLocalOverride: true,
    verticals: ['AGRICULTURE', 'GROCERY'],
    isActive: true,
  },
];

const SEED_OPTION_GROUPS: OptionGroupMasterRecord[] = [
  {
    id: 'opt_pizza_size',
    name: 'Pizza Size',
    hindiName: 'पिज़्ज़ा साइज',
    verticals: ['FOOD'],
    selectionType: 'SINGLE',
    isRequired: true,
    minSelect: 1,
    maxSelect: 1,
    isActive: true,
    options: [
      { id: 'o_ps_1', label: 'Regular (7 inch)', priceDeltaPaise: 0, isDefault: true, isAvailable: true },
      { id: 'o_ps_2', label: 'Medium (10 inch)', priceDeltaPaise: 9000, isDefault: false, isAvailable: true },
      { id: 'o_ps_3', label: 'Large (12 inch)', priceDeltaPaise: 17000, isDefault: false, isAvailable: true },
    ],
  },
  {
    id: 'opt_pizza_crust',
    name: 'Pizza Crust',
    hindiName: 'पिज़्ज़ा बेस / क्रस्ट',
    verticals: ['FOOD'],
    selectionType: 'SINGLE',
    isRequired: true,
    minSelect: 1,
    maxSelect: 1,
    isActive: true,
    options: [
      { id: 'o_pc_1', label: 'Classic Hand Tossed', priceDeltaPaise: 0, isDefault: true, isAvailable: true },
      { id: 'o_pc_2', label: 'Cheese Burst', priceDeltaPaise: 6500, isDefault: false, isAvailable: true },
      { id: 'o_pc_3', label: 'Thin Wheat Crust', priceDeltaPaise: 3000, isDefault: false, isAvailable: true },
    ],
  },
  {
    id: 'opt_pizza_toppings',
    name: 'Extra Toppings & Add-ons',
    hindiName: 'एक्स्ट्रा टॉपिंग्स',
    verticals: ['FOOD'],
    selectionType: 'MULTIPLE',
    isRequired: false,
    minSelect: 0,
    maxSelect: 4,
    isActive: true,
    options: [
      { id: 'o_pt_1', label: 'Extra Mozzarella Cheese', priceDeltaPaise: 4000, isDefault: false, isAvailable: true },
      { id: 'o_pt_2', label: 'Roasted Paneer Cubes', priceDeltaPaise: 4500, isDefault: false, isAvailable: true },
      { id: 'o_pt_3', label: 'Sweet Corn & Jalapeno', priceDeltaPaise: 3000, isDefault: false, isAvailable: true },
      { id: 'o_pt_4', label: 'Butter Garlic Dip', priceDeltaPaise: 2500, isDefault: false, isAvailable: true },
    ],
  },
  {
    id: 'opt_thali_addons',
    name: 'Thali Extra Add-ons',
    hindiName: 'थाली अतिरिक्त विकल्प',
    verticals: ['FOOD'],
    selectionType: 'MULTIPLE',
    isRequired: false,
    minSelect: 0,
    maxSelect: 3,
    isActive: true,
    options: [
      { id: 'o_ta_1', label: 'Extra Butter Tandoori Roti (2 pcs)', priceDeltaPaise: 3000, isDefault: false, isAvailable: true },
      { id: 'o_ta_2', label: 'Sweet Lassi (Kulhad)', priceDeltaPaise: 4000, isDefault: false, isAvailable: true },
      { id: 'o_ta_3', label: 'Gulab Jamun (1 pc)', priceDeltaPaise: 2000, isDefault: false, isAvailable: true },
    ],
  },
  {
    id: 'opt_elec_install',
    name: 'Installation & Accessories',
    hindiName: 'इंस्टॉलेशन और फिटिंग',
    verticals: ['ELECTRONICS', 'HARDWARE'],
    selectionType: 'MULTIPLE',
    isRequired: false,
    minSelect: 0,
    maxSelect: 2,
    isActive: true,
    options: [
      { id: 'o_ei_1', label: 'Home Fitting by Technician', priceDeltaPaise: 15000, isDefault: false, isAvailable: true },
      { id: 'o_ei_2', label: 'Heavy Duty Regulator', priceDeltaPaise: 12000, isDefault: false, isAvailable: true },
    ],
  },
];

const SEED_BRANDS: BrandMasterRecord[] = [
  {
    id: 'brand_aashirvaad',
    code: 'BRD-AASH',
    name: 'Aashirvaad',
    manufacturer: 'ITC Foods Ltd.',
    verticals: ['GROCERY'],
    isVerified: true,
    description: 'Packaged whole wheat chakki atta, iodized salt, and authentic spices.',
    productCount: 14,
    isActive: true,
  },
  {
    id: 'brand_fortune',
    code: 'BRD-FORT',
    name: 'Fortune',
    manufacturer: 'Adani Wilmar Ltd.',
    verticals: ['GROCERY'],
    isVerified: true,
    description: 'Edible mustard/refined oils, besan, basmati rice, and soya chunks.',
    productCount: 9,
    isActive: true,
  },
  {
    id: 'brand_amul',
    code: 'BRD-AMUL',
    name: 'Amul',
    manufacturer: 'GCMMF Anand',
    verticals: ['GROCERY', 'FOOD'],
    isVerified: true,
    description: 'Fresh dairy milk, butter, paneer, ghee, and village cold-chain ice creams.',
    productCount: 16,
    isActive: true,
  },
  {
    id: 'brand_tata',
    code: 'BRD-TATA',
    name: 'Tata Sampann',
    manufacturer: 'Tata Consumer Products',
    verticals: ['GROCERY'],
    isVerified: true,
    description: 'Unpolished dals, whole spices, poha, and premium tea blends.',
    productCount: 12,
    isActive: true,
  },
  {
    id: 'brand_astral',
    code: 'BRD-ASTR',
    name: 'Astral Pipes',
    manufacturer: 'Astral Ltd.',
    verticals: ['HARDWARE'],
    isVerified: true,
    description: 'CPVC & UPVC plumbing and agricultural pipes.',
    productCount: 11,
    isActive: true,
  },
  {
    id: 'brand_crompton',
    code: 'BRD-CROM',
    name: 'Crompton',
    manufacturer: 'Crompton Greaves',
    verticals: ['ELECTRONICS', 'HARDWARE'],
    isVerified: true,
    description: 'Ceiling fans, LED lights, and domestic water pumps.',
    productCount: 8,
    isActive: true,
  },
  {
    id: 'brand_mahyco',
    code: 'BRD-MAHY',
    name: 'Mahyco Seeds',
    manufacturer: 'Maharashtra Hybrid Seeds',
    verticals: ['AGRICULTURE'],
    isVerified: true,
    description: 'Certified hybrid wheat, paddy, and vegetable seeds.',
    productCount: 6,
    isActive: true,
  },
  {
    id: 'brand_gram_local',
    code: 'BRD-GRML',
    name: 'GramBazaar Local Kitchens & Crafts',
    manufacturer: 'Village Verified Merchants',
    verticals: ['FOOD', 'GROCERY', 'APPAREL', 'FURNITURE'],
    isVerified: true,
    description: 'Verified local village kitchens, mithai halwais, millers, and handloom artisans.',
    productCount: 21,
    isActive: true,
  },
];

const SEED_VARIANT_MASTERS: VariantSizeMasterRecord[] = [
  {
    id: 'var_atta_1kg',
    sku: 'GB-GROC-ATTA-1KG',
    name: 'Aashirvaad Shudh Chakki Atta — 1 Kg',
    sizeLabel: '1 kg Pack',
    vertical: 'GROCERY',
    categoryId: 'cat_groc_atta',
    productId: 'prod_002',
    unitId: 'unit_kg',
    unitQuantity: 1,
    mrpPaise: 5800,
    sellingPricePaise: 5200,
    stockQuantity: 24,
    lowStockThreshold: 8,
    attributes: { pack_weight: '1 kg' },
    isActive: true,
  },
  {
    id: 'var_atta_5kg',
    sku: 'GB-GROC-ATTA-5KG',
    name: 'Aashirvaad Shudh Chakki Atta — 5 Kg Family Pack',
    sizeLabel: '5 kg Pack',
    vertical: 'GROCERY',
    categoryId: 'cat_groc_atta',
    productId: 'prod_002',
    unitId: 'unit_kg',
    unitQuantity: 5,
    mrpPaise: 26000,
    sellingPricePaise: 23500,
    stockQuantity: 12,
    lowStockThreshold: 5,
    attributes: { pack_weight: '5 kg' },
    isActive: true,
  },
  {
    id: 'var_atta_10kg',
    sku: 'GB-GROC-ATTA-10KG',
    name: 'Aashirvaad Shudh Chakki Atta — 10 Kg Saver',
    sizeLabel: '10 kg Pack',
    vertical: 'GROCERY',
    categoryId: 'cat_groc_atta',
    productId: 'prod_002',
    unitId: 'unit_kg',
    unitQuantity: 10,
    mrpPaise: 49500,
    sellingPricePaise: 45500,
    stockQuantity: 6,
    lowStockThreshold: 5,
    attributes: { pack_weight: '10 kg' },
    isActive: true,
  },
  {
    id: 'var_dal_pav',
    sku: 'GB-GROC-DAL-250G',
    name: 'Arhar / Toor Dal — 1 Pav (Loose Local Weight)',
    sizeLabel: '1 Pav (250 g)',
    vertical: 'GROCERY',
    categoryId: 'cat_groc_dal',
    unitId: 'unit_pav',
    unitQuantity: 1,
    mrpPaise: 4800,
    sellingPricePaise: 4400,
    stockQuantity: 45,
    lowStockThreshold: 10,
    attributes: { pack_weight: '250 g (1 Pav)' },
    isActive: true,
  },
  {
    id: 'var_oil_1l',
    sku: 'GB-GROC-OIL-1L',
    name: 'Fortune Kachi Ghani Mustard Oil — 1 Litre Pouch',
    sizeLabel: '1 L Pouch',
    vertical: 'GROCERY',
    categoryId: 'cat_groc_oil',
    unitId: 'unit_litre',
    unitQuantity: 1,
    mrpPaise: 17500,
    sellingPricePaise: 15800,
    stockQuantity: 18,
    lowStockThreshold: 6,
    attributes: { pack_weight: '1 L' },
    isActive: true,
  },
  {
    id: 'var_thali_full',
    sku: 'GB-FOOD-THALI-FULL',
    name: 'Special Shahi Veg Thali — Full Plate',
    sizeLabel: 'Full Plate',
    vertical: 'FOOD',
    categoryId: 'cat_food_thali',
    unitId: 'unit_plate',
    unitQuantity: 1,
    mrpPaise: 18000,
    sellingPricePaise: 16000,
    stockQuantity: 40,
    lowStockThreshold: 10,
    attributes: { diet_type: 'Pure Veg', spice_level: 'Medium' },
    isActive: true,
  },
  {
    id: 'var_thali_half',
    sku: 'GB-FOOD-THALI-HALF',
    name: 'Dal Tadka & Paneer Combo — Half Plate',
    sizeLabel: 'Half Plate',
    vertical: 'FOOD',
    categoryId: 'cat_food_thali',
    unitId: 'unit_half_plate',
    unitQuantity: 1,
    mrpPaise: 11000,
    sellingPricePaise: 9500,
    stockQuantity: 35,
    lowStockThreshold: 8,
    attributes: { diet_type: 'Pure Veg' },
    isActive: true,
  },
  {
    id: 'var_pizza_med',
    sku: 'GB-FOOD-PIZ-MED10',
    name: 'Farmhouse Paneer Tandoori Pizza — Medium 10"',
    sizeLabel: 'Medium (10 inch)',
    vertical: 'FOOD',
    categoryId: 'cat_food_pizza',
    productId: 'prod_001',
    unitId: 'unit_piece',
    unitQuantity: 1,
    mrpPaise: 32900,
    sellingPricePaise: 28900,
    stockQuantity: 25,
    lowStockThreshold: 5,
    attributes: { diet_type: 'Pure Veg', spice_level: 'Medium' },
    isActive: true,
  },
  {
    id: 'var_jalebi_pav',
    sku: 'GB-FOOD-JAL-250G',
    name: 'Desi Ghee Crispy Jalebi — 1 Pav Box',
    sizeLabel: '250 g (1 Pav)',
    vertical: 'FOOD',
    categoryId: 'cat_food_sweets',
    unitId: 'unit_pav',
    unitQuantity: 1,
    mrpPaise: 8500,
    sellingPricePaise: 7500,
    stockQuantity: 30,
    lowStockThreshold: 6,
    attributes: { diet_type: 'Pure Veg' },
    isActive: true,
  },
];

const SEED_PACKAGING_MASTERS: PackagingMasterRecord[] = [
  {
    id: 'pkg_thali_5cp',
    code: 'PKG-FD-THL5',
    name: '5-Compartment Leak-Proof Thali Box',
    hindiName: '5-खाने वाला लीक-प्रूफ थाली बॉक्स',
    materialType: 'FOOD_CONTAINER',
    capacityLabel: '1 Full Meal (750 ml)',
    unitId: 'unit_plate',
    feePaise: 1500,
    isFoodGrade: true,
    isEcoFriendly: true,
    isLeakProof: true,
    verticals: ['FOOD'],
    categoryIds: ['cat_food_thali'],
    productIds: [],
    isActive: true,
  },
  {
    id: 'pkg_pizza_10in',
    code: 'PKG-FD-PIZ10',
    name: 'Corrugated Thermal Pizza Box (10–12 inch)',
    hindiName: 'थर्मल पिज़्ज़ा बॉक्स',
    materialType: 'THERMAL_BOX',
    capacityLabel: 'Up to 12 inch Pizza',
    unitId: 'unit_piece',
    feePaise: 2000,
    isFoodGrade: true,
    isEcoFriendly: true,
    isLeakProof: false,
    verticals: ['FOOD'],
    categoryIds: ['cat_food_pizza'],
    productIds: ['prod_001'],
    isActive: true,
  },
  {
    id: 'pkg_curry_500ml',
    code: 'PKG-FD-CUR5',
    name: 'Microwave-Safe Gravy & Dal Container (500 ml)',
    hindiName: 'दाल-सब्जी कंटेनर (500 मिली)',
    materialType: 'FOOD_CONTAINER',
    capacityLabel: '500 ml',
    unitId: 'unit_ml',
    feePaise: 1000,
    isFoodGrade: true,
    isEcoFriendly: false,
    isLeakProof: true,
    verticals: ['FOOD'],
    categoryIds: ['cat_food_thali', 'cat_food_snacks'],
    productIds: [],
    isActive: true,
  },
  {
    id: 'pkg_sweet_box',
    code: 'PKG-FD-MTH1',
    name: 'Grease-Resistant Mithai & Jalebi Box (500g / 1kg)',
    hindiName: 'मिठाई पैकिंग डिब्बा',
    materialType: 'FOOD_CONTAINER',
    capacityLabel: '250 g – 1 kg',
    unitId: 'unit_kg',
    feePaise: 1200,
    isFoodGrade: true,
    isEcoFriendly: true,
    isLeakProof: true,
    verticals: ['FOOD'],
    categoryIds: ['cat_food_sweets'],
    productIds: [],
    isActive: true,
  },
  {
    id: 'pkg_groc_kraft',
    code: 'PKG-GR-KRF5',
    name: 'Heavy-Duty Eco Kraft Kirana Carry Bag',
    hindiName: 'इको पेपर किराना बैग (5 किलो तक)',
    materialType: 'ECO_BAG',
    capacityLabel: 'Up to 5 kg load',
    unitId: 'unit_kg',
    feePaise: 500,
    isFoodGrade: true,
    isEcoFriendly: true,
    isLeakProof: false,
    verticals: ['GROCERY'],
    categoryIds: ['cat_groc_atta', 'cat_groc_dal'],
    productIds: ['prod_002'],
    isActive: true,
  },
  {
    id: 'pkg_groc_zip',
    code: 'PKG-GR-ZIP1',
    name: 'Tamper-Sealed Loose Grain & Dal Zip Pouch',
    hindiName: 'सीलबंद अनाज/दाल पाउच',
    materialType: 'SEALED_POUCH',
    capacityLabel: '250 g – 2 kg',
    unitId: 'unit_pav',
    feePaise: 400,
    isFoodGrade: true,
    isEcoFriendly: false,
    isLeakProof: true,
    verticals: ['GROCERY'],
    categoryIds: ['cat_groc_dal', 'cat_groc_oil'],
    productIds: [],
    isActive: true,
  },
];

const SEED_AVAILABILITY_CONFIGS: AvailabilityStockConfigRecord[] = [
  {
    id: 'avail_food_lunch_dinner',
    code: 'AVL-FD-THALI',
    name: 'Dhaba Fresh Meals — Lunch & Dinner Prep Slots',
    vertical: 'FOOD',
    categoryId: 'cat_food_thali',
    workflowMode: 'DAILY_PREP_SLOTS',
    serviceSlots: ['Lunch (11:30 - 15:30)', 'Dinner (19:00 - 22:30)'],
    prepTimeMinutes: 25,
    dailyBatchLimit: 80,
    lowStockThreshold: 10,
    maxQtyPerOrder: 6,
    autoDisableOnZeroStock: true,
    allowPreOrder: true,
    isActive: true,
  },
  {
    id: 'avail_food_pizza',
    code: 'AVL-FD-PIZ',
    name: 'Stone-Baked Pizza — Made to Order Kitchen SLA',
    vertical: 'FOOD',
    categoryId: 'cat_food_pizza',
    productId: 'prod_001',
    workflowMode: 'MADE_TO_ORDER',
    serviceSlots: ['All-Day Kitchen (11:00 - 22:00)'],
    prepTimeMinutes: 20,
    dailyBatchLimit: 50,
    lowStockThreshold: 5,
    maxQtyPerOrder: 5,
    autoDisableOnZeroStock: false,
    allowPreOrder: false,
    isActive: true,
  },
  {
    id: 'avail_food_snacks',
    code: 'AVL-FD-SNK',
    name: 'Morning & Evening Hot Snacks / Samosa Batches',
    vertical: 'FOOD',
    categoryId: 'cat_food_snacks',
    workflowMode: 'DAILY_PREP_SLOTS',
    serviceSlots: ['Morning Nashta (07:00 - 11:00)', 'Evening Chai (16:00 - 20:00)'],
    prepTimeMinutes: 12,
    dailyBatchLimit: 120,
    lowStockThreshold: 15,
    maxQtyPerOrder: 12,
    autoDisableOnZeroStock: true,
    allowPreOrder: false,
    isActive: true,
  },
  {
    id: 'avail_groc_staples',
    code: 'AVL-GR-ATTA',
    name: 'Kirana Packaged Atta & Staples — Real-Time Stock',
    vertical: 'GROCERY',
    categoryId: 'cat_groc_atta',
    productId: 'prod_002',
    workflowMode: 'TRACKED_INVENTORY',
    serviceSlots: ['Store Hours (06:30 - 21:30)'],
    lowStockThreshold: 10,
    maxQtyPerOrder: 10,
    autoDisableOnZeroStock: true,
    allowPreOrder: false,
    restockLeadHours: 24,
    isActive: true,
  },
  {
    id: 'avail_groc_loose_dal',
    code: 'AVL-GR-DAL',
    name: 'Loose Pulses & Grains — Weight-Tracked Inventory',
    vertical: 'GROCERY',
    categoryId: 'cat_groc_dal',
    workflowMode: 'TRACKED_INVENTORY',
    serviceSlots: ['Store Hours (06:30 - 21:30)'],
    lowStockThreshold: 8,
    maxQtyPerOrder: 15,
    autoDisableOnZeroStock: true,
    allowPreOrder: false,
    restockLeadHours: 12,
    isActive: true,
  },
  {
    id: 'avail_groc_oils',
    code: 'AVL-GR-OIL',
    name: 'Edible Oils & Ghee — Low-Stock Auto-Alert Rule',
    vertical: 'GROCERY',
    categoryId: 'cat_groc_oil',
    workflowMode: 'TRACKED_INVENTORY',
    serviceSlots: ['Store Hours (07:00 - 21:00)'],
    lowStockThreshold: 6,
    maxQtyPerOrder: 6,
    autoDisableOnZeroStock: true,
    allowPreOrder: false,
    restockLeadHours: 24,
    isActive: true,
  },
];

// =========================================================================
// IDEMPOTENT SEEDER
// =========================================================================

let mastersSeedPromise: Promise<void> | null = null;

export async function seedAdminMastersIfEmpty(): Promise<void> {
  if (mastersSeedPromise) return mastersSeedPromise;
  mastersSeedPromise = (async () => {
    const [vRows, aRows, uRows, oRows, bRows, varRows, pkgRows, avlRows] = await Promise.all([
      db.select({ id: adminVerticals.id }).from(adminVerticals).limit(1),
      db.select({ id: adminAttributes.id }).from(adminAttributes).limit(1),
      db.select({ id: adminUnits.id }).from(adminUnits).limit(1),
      db.select({ id: adminOptionGroups.id }).from(adminOptionGroups).limit(1),
      db.select({ id: adminBrands.id }).from(adminBrands).limit(1),
      db.select({ id: adminVariantMasters.id }).from(adminVariantMasters).limit(1),
      db.select({ id: adminPackagingMasters.id }).from(adminPackagingMasters).limit(1),
      db.select({ id: adminAvailabilityConfigs.id }).from(adminAvailabilityConfigs).limit(1),
    ]);

    if (vRows.length === 0) {
      await db
        .insert(adminVerticals)
        .values(
          SEED_VERTICALS.map((v) => ({
            externalId: v.id,
            name: v.name,
            hindiName: v.hindiName,
            icon: v.icon,
            isEnabled: v.isEnabled,
            sellerCount: v.sellerCount,
            description: v.description,
            specialRulesJson: JSON.stringify(v.specialRules),
            fulfillmentWorkflow: v.fulfillmentWorkflow,
            requiredKycDocsJson: JSON.stringify(v.requiredKycDocs),
          }))
        )
        .onConflictDoNothing();
    }

    if (aRows.length === 0) {
      await db
        .insert(adminAttributes)
        .values(
          SEED_ATTRIBUTES.map((a) => ({
            externalId: a.id,
            name: a.name,
            hindiName: a.hindiName,
            slug: a.slug,
            dataType: a.dataType,
            optionsJson: JSON.stringify(a.options || []),
            unitSuffix: a.unitSuffix ?? null,
            isRequired: a.isRequired,
            isFilterable: a.isFilterable,
            isVariantAxis: a.isVariantAxis,
            verticalsJson: JSON.stringify(a.verticals),
            categoryIdsJson: JSON.stringify(a.categoryIds || []),
            isActive: a.isActive,
          }))
        )
        .onConflictDoNothing();
    }

    if (uRows.length === 0) {
      await db
        .insert(adminUnits)
        .values(
          SEED_UNITS.map((u) => ({
            externalId: u.id,
            name: u.name,
            hindiName: u.hindiName,
            symbol: u.symbol,
            family: u.family,
            baseUnit: u.baseUnit ?? null,
            conversionFactor:
              u.conversionFactor !== undefined ? String(u.conversionFactor) : null,
            allowDecimal: u.allowDecimal,
            allowSellerLocalOverride: u.allowSellerLocalOverride,
            verticalsJson: JSON.stringify(u.verticals),
            isActive: u.isActive,
          }))
        )
        .onConflictDoNothing();
    }

    if (oRows.length === 0) {
      await db
        .insert(adminOptionGroups)
        .values(
          SEED_OPTION_GROUPS.map((g) => ({
            externalId: g.id,
            name: g.name,
            hindiName: g.hindiName,
            verticalsJson: JSON.stringify(g.verticals),
            categoryIdsJson: JSON.stringify(g.categoryIds || []),
            selectionType: g.selectionType,
            isRequired: g.isRequired,
            minSelect: g.minSelect,
            maxSelect: g.maxSelect,
            optionsJson: JSON.stringify(g.options),
            isActive: g.isActive,
          }))
        )
        .onConflictDoNothing();
    }

    if (bRows.length === 0) {
      await db
        .insert(adminBrands)
        .values(
          SEED_BRANDS.map((b) => ({
            externalId: b.id,
            code: b.code ?? null,
            name: b.name,
            manufacturer: b.manufacturer ?? null,
            verticalsJson: JSON.stringify(b.verticals),
            isVerified: b.isVerified,
            description: b.description ?? null,
            productCount: b.productCount,
            isActive: b.isActive,
          }))
        )
        .onConflictDoNothing();
    }

    if (varRows.length === 0) {
      await db
        .insert(adminVariantMasters)
        .values(
          SEED_VARIANT_MASTERS.map((v) => ({
            externalId: v.id,
            sku: v.sku,
            name: v.name,
            sizeLabel: v.sizeLabel,
            vertical: v.vertical,
            categoryId: v.categoryId,
            productId: v.productId ?? null,
            unitId: v.unitId,
            unitQuantity: String(v.unitQuantity),
            mrpPaise: v.mrpPaise,
            sellingPricePaise: v.sellingPricePaise,
            stockQuantity: String(v.stockQuantity),
            lowStockThreshold: String(v.lowStockThreshold),
            attributesJson: JSON.stringify(v.attributes || {}),
            isActive: v.isActive,
          }))
        )
        .onConflictDoNothing();
    }

    if (pkgRows.length === 0) {
      await db
        .insert(adminPackagingMasters)
        .values(
          SEED_PACKAGING_MASTERS.map((p) => ({
            externalId: p.id,
            code: p.code,
            name: p.name,
            hindiName: p.hindiName ?? null,
            materialType: p.materialType,
            capacityLabel: p.capacityLabel,
            unitId: p.unitId ?? null,
            feePaise: p.feePaise,
            isFoodGrade: p.isFoodGrade,
            isEcoFriendly: p.isEcoFriendly,
            isLeakProof: p.isLeakProof,
            verticalsJson: JSON.stringify(p.verticals),
            categoryIdsJson: JSON.stringify(p.categoryIds),
            productIdsJson: JSON.stringify(p.productIds),
            isActive: p.isActive,
          }))
        )
        .onConflictDoNothing();
    }

    if (avlRows.length === 0) {
      await db
        .insert(adminAvailabilityConfigs)
        .values(
          SEED_AVAILABILITY_CONFIGS.map((c) => ({
            externalId: c.id,
            code: c.code,
            name: c.name,
            vertical: c.vertical,
            categoryId: c.categoryId,
            productId: c.productId ?? null,
            workflowMode: c.workflowMode,
            serviceSlotsJson: JSON.stringify(c.serviceSlots),
            prepTimeMinutes: c.prepTimeMinutes ?? null,
            dailyBatchLimit: c.dailyBatchLimit ?? null,
            lowStockThreshold: c.lowStockThreshold,
            maxQtyPerOrder: c.maxQtyPerOrder,
            autoDisableOnZeroStock: c.autoDisableOnZeroStock,
            allowPreOrder: c.allowPreOrder,
            restockLeadHours: c.restockLeadHours ?? null,
            isActive: c.isActive,
          }))
        )
        .onConflictDoNothing();
    }
  })().catch((err) => {
    mastersSeedPromise = null;
    throw err;
  });
  return mastersSeedPromise;
}

// =========================================================================
// MAPPERS
// =========================================================================

function mapVertical(row: typeof adminVerticals.$inferSelect): VerticalConfigRecord {
  return {
    id: row.externalId,
    name: row.name,
    hindiName: row.hindiName,
    icon: row.icon,
    isEnabled: row.isEnabled,
    sellerCount: row.sellerCount,
    description: row.description,
    specialRules: safeJsonParse<string[]>(row.specialRulesJson, []),
    fulfillmentWorkflow: row.fulfillmentWorkflow as VerticalWorkflowType,
    requiredKycDocs: safeJsonParse<KycDocCode[]>(row.requiredKycDocsJson, []),
  };
}

function mapAttribute(row: typeof adminAttributes.$inferSelect): AttributeMasterRecord {
  const options = safeJsonParse<string[]>(row.optionsJson, []);
  const categoryIds = safeJsonParse<string[]>(row.categoryIdsJson, []);
  return {
    id: row.externalId,
    name: row.name,
    hindiName: row.hindiName,
    slug: row.slug,
    dataType: row.dataType as AttributeDataType,
    options: options.length > 0 ? options : undefined,
    unitSuffix: row.unitSuffix ?? undefined,
    isRequired: row.isRequired,
    isFilterable: row.isFilterable,
    isVariantAxis: row.isVariantAxis,
    verticals: safeJsonParse<string[]>(row.verticalsJson, []),
    categoryIds: categoryIds.length > 0 ? categoryIds : undefined,
    isActive: row.isActive,
  };
}

function mapUnit(row: typeof adminUnits.$inferSelect): UnitMasterRecord {
  return {
    id: row.externalId,
    name: row.name,
    hindiName: row.hindiName,
    symbol: row.symbol,
    family: row.family as UnitFamily,
    baseUnit: row.baseUnit ?? undefined,
    conversionFactor:
      row.conversionFactor !== null && row.conversionFactor !== undefined
        ? Number(row.conversionFactor)
        : undefined,
    allowDecimal: row.allowDecimal,
    allowSellerLocalOverride: row.allowSellerLocalOverride,
    verticals: safeJsonParse<string[]>(row.verticalsJson, []),
    isActive: row.isActive,
  };
}

function mapOptionGroup(row: typeof adminOptionGroups.$inferSelect): OptionGroupMasterRecord {
  const categoryIds = safeJsonParse<string[]>(row.categoryIdsJson, []);
  return {
    id: row.externalId,
    name: row.name,
    hindiName: row.hindiName,
    verticals: safeJsonParse<string[]>(row.verticalsJson, []),
    categoryIds: categoryIds.length > 0 ? categoryIds : undefined,
    selectionType: row.selectionType === 'MULTIPLE' ? 'MULTIPLE' : 'SINGLE',
    isRequired: row.isRequired,
    minSelect: row.minSelect,
    maxSelect: row.maxSelect,
    options: safeJsonParse<OptionGroupItem[]>(row.optionsJson, []),
    isActive: row.isActive,
  };
}

function mapBrand(row: typeof adminBrands.$inferSelect): BrandMasterRecord {
  return {
    id: row.externalId,
    code: row.code ?? undefined,
    name: row.name,
    manufacturer: row.manufacturer ?? undefined,
    verticals: safeJsonParse<string[]>(row.verticalsJson, []),
    isVerified: row.isVerified,
    description: row.description ?? undefined,
    productCount: row.productCount,
    isActive: row.isActive,
  };
}

function mapVariantMaster(row: typeof adminVariantMasters.$inferSelect): VariantSizeMasterRecord {
  const attrs = safeJsonParse<Record<string, string>>(row.attributesJson, {});
  return {
    id: row.externalId,
    sku: row.sku,
    name: row.name,
    sizeLabel: row.sizeLabel,
    vertical: row.vertical,
    categoryId: row.categoryId,
    productId: row.productId ?? undefined,
    unitId: row.unitId,
    unitQuantity: Number(row.unitQuantity),
    mrpPaise: row.mrpPaise,
    sellingPricePaise: row.sellingPricePaise,
    stockQuantity: Number(row.stockQuantity),
    lowStockThreshold: Number(row.lowStockThreshold),
    attributes: Object.keys(attrs).length > 0 ? attrs : undefined,
    isActive: row.isActive,
  };
}

function mapPackagingMaster(row: typeof adminPackagingMasters.$inferSelect): PackagingMasterRecord {
  return {
    id: row.externalId,
    code: row.code,
    name: row.name,
    hindiName: row.hindiName ?? undefined,
    materialType: row.materialType as PackagingMaterialType,
    capacityLabel: row.capacityLabel,
    unitId: row.unitId ?? undefined,
    feePaise: row.feePaise,
    isFoodGrade: row.isFoodGrade,
    isEcoFriendly: row.isEcoFriendly,
    isLeakProof: row.isLeakProof,
    verticals: safeJsonParse<string[]>(row.verticalsJson, []),
    categoryIds: safeJsonParse<string[]>(row.categoryIdsJson, []),
    productIds: safeJsonParse<string[]>(row.productIdsJson, []),
    isActive: row.isActive,
  };
}

function mapAvailabilityConfig(
  row: typeof adminAvailabilityConfigs.$inferSelect
): AvailabilityStockConfigRecord {
  return {
    id: row.externalId,
    code: row.code,
    name: row.name,
    vertical: row.vertical,
    categoryId: row.categoryId,
    productId: row.productId ?? undefined,
    workflowMode: row.workflowMode as AvailabilityWorkflowMode,
    serviceSlots: safeJsonParse<string[]>(row.serviceSlotsJson, []),
    prepTimeMinutes: row.prepTimeMinutes ?? undefined,
    dailyBatchLimit: row.dailyBatchLimit ?? undefined,
    lowStockThreshold: row.lowStockThreshold,
    maxQtyPerOrder: row.maxQtyPerOrder,
    autoDisableOnZeroStock: row.autoDisableOnZeroStock,
    allowPreOrder: row.allowPreOrder,
    restockLeadHours: row.restockLeadHours ?? undefined,
    isActive: row.isActive,
  };
}

// =========================================================================
// 1. MULTI-VERTICALS MASTER CRUD
// =========================================================================

export async function listAdminVerticals(): Promise<VerticalConfigRecord[]> {
  await seedAdminMastersIfEmpty();
  const rows = await db.select().from(adminVerticals).orderBy(asc(adminVerticals.id));
  return rows.map(mapVertical);
}

export async function createAdminVertical(
  input: Omit<VerticalConfigRecord, 'sellerCount'>
): Promise<VerticalConfigRecord> {
  await seedAdminMastersIfEmpty();
  const [inserted] = await db
    .insert(adminVerticals)
    .values({
      externalId: input.id,
      name: input.name,
      hindiName: input.hindiName,
      icon: input.icon || 'Layers',
      isEnabled: input.isEnabled,
      sellerCount: 0,
      description: input.description,
      specialRulesJson: JSON.stringify(input.specialRules || []),
      fulfillmentWorkflow: input.fulfillmentWorkflow,
      requiredKycDocsJson: JSON.stringify(input.requiredKycDocs || []),
    })
    .returning();
  return mapVertical(inserted);
}

export async function updateAdminVertical(
  externalId: string,
  patch: Partial<VerticalConfigRecord>
): Promise<VerticalConfigRecord | null> {
  await seedAdminMastersIfEmpty();
  const updateFields: Record<string, unknown> = { updatedAt: new Date() };
  if (patch.name !== undefined) updateFields.name = patch.name;
  if (patch.hindiName !== undefined) updateFields.hindiName = patch.hindiName;
  if (patch.icon !== undefined) updateFields.icon = patch.icon;
  if (patch.isEnabled !== undefined) updateFields.isEnabled = patch.isEnabled;
  if (patch.sellerCount !== undefined) updateFields.sellerCount = patch.sellerCount;
  if (patch.description !== undefined) updateFields.description = patch.description;
  if (patch.specialRules !== undefined) {
    updateFields.specialRulesJson = JSON.stringify(patch.specialRules);
  }
  if (patch.fulfillmentWorkflow !== undefined) {
    updateFields.fulfillmentWorkflow = patch.fulfillmentWorkflow;
  }
  if (patch.requiredKycDocs !== undefined) {
    updateFields.requiredKycDocsJson = JSON.stringify(patch.requiredKycDocs);
  }

  const [updated] = await db
    .update(adminVerticals)
    .set(updateFields)
    .where(eq(adminVerticals.externalId, externalId))
    .returning();
  return updated ? mapVertical(updated) : null;
}

export async function toggleAdminVerticalEnabled(
  externalId: string
): Promise<VerticalConfigRecord | null> {
  await seedAdminMastersIfEmpty();
  const [existing] = await db
    .select()
    .from(adminVerticals)
    .where(eq(adminVerticals.externalId, externalId))
    .limit(1);
  if (!existing) return null;
  const [updated] = await db
    .update(adminVerticals)
    .set({ isEnabled: !existing.isEnabled, updatedAt: new Date() })
    .where(eq(adminVerticals.id, existing.id))
    .returning();
  return updated ? mapVertical(updated) : null;
}

// =========================================================================
// 2. ATTRIBUTES & SPECIFICATIONS MASTER CRUD
// =========================================================================

export async function listAdminAttributes(): Promise<AttributeMasterRecord[]> {
  await seedAdminMastersIfEmpty();
  const rows = await db.select().from(adminAttributes).orderBy(asc(adminAttributes.id));
  return rows.map(mapAttribute);
}

export async function createAdminAttribute(
  input: Omit<AttributeMasterRecord, 'id'> & { id?: string }
): Promise<AttributeMasterRecord> {
  await seedAdminMastersIfEmpty();
  const externalId = input.id?.trim() || `attr_${Date.now()}`;
  const [inserted] = await db
    .insert(adminAttributes)
    .values({
      externalId,
      name: input.name,
      hindiName: input.hindiName || '',
      slug: input.slug,
      dataType: input.dataType,
      optionsJson: JSON.stringify(input.options || []),
      unitSuffix: input.unitSuffix ?? null,
      isRequired: input.isRequired,
      isFilterable: input.isFilterable,
      isVariantAxis: input.isVariantAxis,
      verticalsJson: JSON.stringify(input.verticals || []),
      categoryIdsJson: JSON.stringify(input.categoryIds || []),
      isActive: input.isActive,
    })
    .returning();
  return mapAttribute(inserted);
}

export async function updateAdminAttribute(
  externalId: string,
  patch: Partial<AttributeMasterRecord>
): Promise<AttributeMasterRecord | null> {
  await seedAdminMastersIfEmpty();
  const updateFields: Record<string, unknown> = { updatedAt: new Date() };
  if (patch.name !== undefined) updateFields.name = patch.name;
  if (patch.hindiName !== undefined) updateFields.hindiName = patch.hindiName;
  if (patch.slug !== undefined) updateFields.slug = patch.slug;
  if (patch.dataType !== undefined) updateFields.dataType = patch.dataType;
  if (patch.options !== undefined) updateFields.optionsJson = JSON.stringify(patch.options);
  if (patch.unitSuffix !== undefined) updateFields.unitSuffix = patch.unitSuffix || null;
  if (patch.isRequired !== undefined) updateFields.isRequired = patch.isRequired;
  if (patch.isFilterable !== undefined) updateFields.isFilterable = patch.isFilterable;
  if (patch.isVariantAxis !== undefined) updateFields.isVariantAxis = patch.isVariantAxis;
  if (patch.verticals !== undefined) updateFields.verticalsJson = JSON.stringify(patch.verticals);
  if (patch.categoryIds !== undefined) {
    updateFields.categoryIdsJson = JSON.stringify(patch.categoryIds);
  }
  if (patch.isActive !== undefined) updateFields.isActive = patch.isActive;

  const [updated] = await db
    .update(adminAttributes)
    .set(updateFields)
    .where(eq(adminAttributes.externalId, externalId))
    .returning();
  return updated ? mapAttribute(updated) : null;
}

export async function toggleAdminAttributeStatus(
  externalId: string
): Promise<AttributeMasterRecord | null> {
  await seedAdminMastersIfEmpty();
  const [existing] = await db
    .select()
    .from(adminAttributes)
    .where(eq(adminAttributes.externalId, externalId))
    .limit(1);
  if (!existing) return null;
  const [updated] = await db
    .update(adminAttributes)
    .set({ isActive: !existing.isActive, updatedAt: new Date() })
    .where(eq(adminAttributes.id, existing.id))
    .returning();
  return updated ? mapAttribute(updated) : null;
}

export async function deleteAdminAttribute(externalId: string): Promise<boolean> {
  await seedAdminMastersIfEmpty();
  const deleted = await db
    .delete(adminAttributes)
    .where(eq(adminAttributes.externalId, externalId))
    .returning({ id: adminAttributes.id });
  return deleted.length > 0;
}

// =========================================================================
// 3. UNITS & MEASUREMENT MASTER CRUD
// =========================================================================

export async function listAdminUnits(): Promise<UnitMasterRecord[]> {
  await seedAdminMastersIfEmpty();
  const rows = await db.select().from(adminUnits).orderBy(asc(adminUnits.id));
  return rows.map(mapUnit);
}

export async function createAdminUnit(
  input: Omit<UnitMasterRecord, 'id'> & { id?: string }
): Promise<UnitMasterRecord> {
  await seedAdminMastersIfEmpty();
  const externalId = input.id?.trim() || `unit_${Date.now()}`;
  const [inserted] = await db
    .insert(adminUnits)
    .values({
      externalId,
      name: input.name,
      hindiName: input.hindiName || '',
      symbol: input.symbol,
      family: input.family,
      baseUnit: input.baseUnit ?? null,
      conversionFactor:
        input.conversionFactor !== undefined ? String(input.conversionFactor) : null,
      allowDecimal: input.allowDecimal,
      allowSellerLocalOverride: input.allowSellerLocalOverride,
      verticalsJson: JSON.stringify(input.verticals || []),
      isActive: input.isActive,
    })
    .returning();
  return mapUnit(inserted);
}

export async function updateAdminUnit(
  externalId: string,
  patch: Partial<UnitMasterRecord>
): Promise<UnitMasterRecord | null> {
  await seedAdminMastersIfEmpty();
  const updateFields: Record<string, unknown> = { updatedAt: new Date() };
  if (patch.name !== undefined) updateFields.name = patch.name;
  if (patch.hindiName !== undefined) updateFields.hindiName = patch.hindiName;
  if (patch.symbol !== undefined) updateFields.symbol = patch.symbol;
  if (patch.family !== undefined) updateFields.family = patch.family;
  if (patch.baseUnit !== undefined) updateFields.baseUnit = patch.baseUnit || null;
  if (patch.conversionFactor !== undefined) {
    updateFields.conversionFactor =
      patch.conversionFactor === null ? null : String(patch.conversionFactor);
  }
  if (patch.allowDecimal !== undefined) updateFields.allowDecimal = patch.allowDecimal;
  if (patch.allowSellerLocalOverride !== undefined) {
    updateFields.allowSellerLocalOverride = patch.allowSellerLocalOverride;
  }
  if (patch.verticals !== undefined) updateFields.verticalsJson = JSON.stringify(patch.verticals);
  if (patch.isActive !== undefined) updateFields.isActive = patch.isActive;

  const [updated] = await db
    .update(adminUnits)
    .set(updateFields)
    .where(eq(adminUnits.externalId, externalId))
    .returning();
  return updated ? mapUnit(updated) : null;
}

export async function toggleAdminUnitStatus(
  externalId: string
): Promise<UnitMasterRecord | null> {
  await seedAdminMastersIfEmpty();
  const [existing] = await db
    .select()
    .from(adminUnits)
    .where(eq(adminUnits.externalId, externalId))
    .limit(1);
  if (!existing) return null;
  const [updated] = await db
    .update(adminUnits)
    .set({ isActive: !existing.isActive, updatedAt: new Date() })
    .where(eq(adminUnits.id, existing.id))
    .returning();
  return updated ? mapUnit(updated) : null;
}

export async function deleteAdminUnit(externalId: string): Promise<boolean> {
  await seedAdminMastersIfEmpty();
  const deleted = await db
    .delete(adminUnits)
    .where(eq(adminUnits.externalId, externalId))
    .returning({ id: adminUnits.id });
  return deleted.length > 0;
}

// =========================================================================
// 4. OPTION GROUPS & CUSTOMIZATIONS MASTER CRUD
// =========================================================================

export async function listAdminOptionGroups(): Promise<OptionGroupMasterRecord[]> {
  await seedAdminMastersIfEmpty();
  const rows = await db.select().from(adminOptionGroups).orderBy(asc(adminOptionGroups.id));
  return rows.map(mapOptionGroup);
}

export async function createAdminOptionGroup(
  input: Omit<OptionGroupMasterRecord, 'id'> & { id?: string }
): Promise<OptionGroupMasterRecord> {
  await seedAdminMastersIfEmpty();
  const externalId = input.id?.trim() || `opt_${Date.now()}`;
  const [inserted] = await db
    .insert(adminOptionGroups)
    .values({
      externalId,
      name: input.name,
      hindiName: input.hindiName || '',
      verticalsJson: JSON.stringify(input.verticals || []),
      categoryIdsJson: JSON.stringify(input.categoryIds || []),
      selectionType: input.selectionType,
      isRequired: input.isRequired,
      minSelect: input.minSelect,
      maxSelect: input.maxSelect,
      optionsJson: JSON.stringify(input.options || []),
      isActive: input.isActive,
    })
    .returning();
  return mapOptionGroup(inserted);
}

export async function updateAdminOptionGroup(
  externalId: string,
  patch: Partial<OptionGroupMasterRecord>
): Promise<OptionGroupMasterRecord | null> {
  await seedAdminMastersIfEmpty();
  const updateFields: Record<string, unknown> = { updatedAt: new Date() };
  if (patch.name !== undefined) updateFields.name = patch.name;
  if (patch.hindiName !== undefined) updateFields.hindiName = patch.hindiName;
  if (patch.verticals !== undefined) updateFields.verticalsJson = JSON.stringify(patch.verticals);
  if (patch.categoryIds !== undefined) {
    updateFields.categoryIdsJson = JSON.stringify(patch.categoryIds);
  }
  if (patch.selectionType !== undefined) updateFields.selectionType = patch.selectionType;
  if (patch.isRequired !== undefined) updateFields.isRequired = patch.isRequired;
  if (patch.minSelect !== undefined) updateFields.minSelect = patch.minSelect;
  if (patch.maxSelect !== undefined) updateFields.maxSelect = patch.maxSelect;
  if (patch.options !== undefined) updateFields.optionsJson = JSON.stringify(patch.options);
  if (patch.isActive !== undefined) updateFields.isActive = patch.isActive;

  const [updated] = await db
    .update(adminOptionGroups)
    .set(updateFields)
    .where(eq(adminOptionGroups.externalId, externalId))
    .returning();
  return updated ? mapOptionGroup(updated) : null;
}

export async function duplicateAdminOptionGroup(
  sourceExternalId: string,
  newExternalId?: string
): Promise<OptionGroupMasterRecord | null> {
  await seedAdminMastersIfEmpty();
  const [srcRow] = await db
    .select()
    .from(adminOptionGroups)
    .where(eq(adminOptionGroups.externalId, sourceExternalId))
    .limit(1);
  if (!srcRow) return null;

  const src = mapOptionGroup(srcRow);
  const copyId = newExternalId?.trim() || `opt_${Date.now()}`;
  const copiedOptions: OptionGroupItem[] = src.options.map((o, idx) => ({
    ...o,
    id: `${copyId}_o_${idx}`,
  }));

  const [inserted] = await db
    .insert(adminOptionGroups)
    .values({
      externalId: copyId,
      name: `${src.name} (Copy)`,
      hindiName: src.hindiName,
      verticalsJson: JSON.stringify(src.verticals),
      categoryIdsJson: JSON.stringify(src.categoryIds || []),
      selectionType: src.selectionType,
      isRequired: src.isRequired,
      minSelect: src.minSelect,
      maxSelect: src.maxSelect,
      optionsJson: JSON.stringify(copiedOptions),
      isActive: src.isActive,
    })
    .returning();
  return mapOptionGroup(inserted);
}

export async function toggleAdminOptionGroupStatus(
  externalId: string
): Promise<OptionGroupMasterRecord | null> {
  await seedAdminMastersIfEmpty();
  const [existing] = await db
    .select()
    .from(adminOptionGroups)
    .where(eq(adminOptionGroups.externalId, externalId))
    .limit(1);
  if (!existing) return null;
  const [updated] = await db
    .update(adminOptionGroups)
    .set({ isActive: !existing.isActive, updatedAt: new Date() })
    .where(eq(adminOptionGroups.id, existing.id))
    .returning();
  return updated ? mapOptionGroup(updated) : null;
}

export async function deleteAdminOptionGroup(externalId: string): Promise<boolean> {
  await seedAdminMastersIfEmpty();
  const deleted = await db
    .delete(adminOptionGroups)
    .where(eq(adminOptionGroups.externalId, externalId))
    .returning({ id: adminOptionGroups.id });
  return deleted.length > 0;
}

// =========================================================================
// 5. BRAND MASTER CRUD
// =========================================================================

export async function listAdminBrands(): Promise<BrandMasterRecord[]> {
  await seedAdminMastersIfEmpty();
  const rows = await db.select().from(adminBrands).orderBy(asc(adminBrands.id));
  return rows.map(mapBrand);
}

export async function createAdminBrand(
  input: Omit<BrandMasterRecord, 'id' | 'productCount'> & { id?: string }
): Promise<BrandMasterRecord> {
  await seedAdminMastersIfEmpty();
  const externalId = input.id?.trim() || `brand_${Date.now()}`;
  const [inserted] = await db
    .insert(adminBrands)
    .values({
      externalId,
      code: input.code ?? null,
      name: input.name,
      manufacturer: input.manufacturer ?? null,
      verticalsJson: JSON.stringify(input.verticals || []),
      isVerified: input.isVerified,
      description: input.description ?? null,
      productCount: 0,
      isActive: input.isActive,
    })
    .returning();
  return mapBrand(inserted);
}

export async function updateAdminBrand(
  externalId: string,
  patch: Partial<BrandMasterRecord>
): Promise<BrandMasterRecord | null> {
  await seedAdminMastersIfEmpty();
  const updateFields: Record<string, unknown> = { updatedAt: new Date() };
  if (patch.code !== undefined) updateFields.code = patch.code || null;
  if (patch.name !== undefined) updateFields.name = patch.name;
  if (patch.manufacturer !== undefined) updateFields.manufacturer = patch.manufacturer || null;
  if (patch.verticals !== undefined) updateFields.verticalsJson = JSON.stringify(patch.verticals);
  if (patch.isVerified !== undefined) updateFields.isVerified = patch.isVerified;
  if (patch.description !== undefined) updateFields.description = patch.description || null;
  if (patch.productCount !== undefined) updateFields.productCount = patch.productCount;
  if (patch.isActive !== undefined) updateFields.isActive = patch.isActive;

  const [updated] = await db
    .update(adminBrands)
    .set(updateFields)
    .where(eq(adminBrands.externalId, externalId))
    .returning();
  return updated ? mapBrand(updated) : null;
}

export async function toggleAdminBrandVerified(
  externalId: string
): Promise<BrandMasterRecord | null> {
  await seedAdminMastersIfEmpty();
  const [existing] = await db
    .select()
    .from(adminBrands)
    .where(eq(adminBrands.externalId, externalId))
    .limit(1);
  if (!existing) return null;
  const [updated] = await db
    .update(adminBrands)
    .set({ isVerified: !existing.isVerified, updatedAt: new Date() })
    .where(eq(adminBrands.id, existing.id))
    .returning();
  return updated ? mapBrand(updated) : null;
}

export async function toggleAdminBrandStatus(
  externalId: string
): Promise<BrandMasterRecord | null> {
  await seedAdminMastersIfEmpty();
  const [existing] = await db
    .select()
    .from(adminBrands)
    .where(eq(adminBrands.externalId, externalId))
    .limit(1);
  if (!existing) return null;
  const [updated] = await db
    .update(adminBrands)
    .set({ isActive: !existing.isActive, updatedAt: new Date() })
    .where(eq(adminBrands.id, existing.id))
    .returning();
  return updated ? mapBrand(updated) : null;
}

export async function deleteAdminBrand(externalId: string): Promise<boolean> {
  await seedAdminMastersIfEmpty();
  const deleted = await db
    .delete(adminBrands)
    .where(eq(adminBrands.externalId, externalId))
    .returning({ id: adminBrands.id });
  return deleted.length > 0;
}

// =========================================================================
// 6. PRODUCT VARIANT & SIZE MASTER CRUD
// =========================================================================

export async function listAdminVariantMasters(): Promise<VariantSizeMasterRecord[]> {
  await seedAdminMastersIfEmpty();
  const rows = await db
    .select()
    .from(adminVariantMasters)
    .orderBy(desc(adminVariantMasters.id));
  return rows.map(mapVariantMaster);
}

export async function createAdminVariantMaster(
  input: Omit<VariantSizeMasterRecord, 'id'> & { id?: string }
): Promise<VariantSizeMasterRecord> {
  await seedAdminMastersIfEmpty();
  const externalId = input.id?.trim() || `var_${Date.now()}`;
  const [inserted] = await db
    .insert(adminVariantMasters)
    .values({
      externalId,
      sku: input.sku,
      name: input.name,
      sizeLabel: input.sizeLabel,
      vertical: input.vertical,
      categoryId: input.categoryId,
      productId: input.productId ?? null,
      unitId: input.unitId,
      unitQuantity: String(input.unitQuantity),
      mrpPaise: input.mrpPaise,
      sellingPricePaise: input.sellingPricePaise,
      stockQuantity: String(input.stockQuantity),
      lowStockThreshold: String(input.lowStockThreshold),
      attributesJson: JSON.stringify(input.attributes || {}),
      isActive: input.isActive,
    })
    .returning();
  return mapVariantMaster(inserted);
}

export async function updateAdminVariantMaster(
  externalId: string,
  patch: Partial<VariantSizeMasterRecord>
): Promise<VariantSizeMasterRecord | null> {
  await seedAdminMastersIfEmpty();
  const updateFields: Record<string, unknown> = { updatedAt: new Date() };
  if (patch.sku !== undefined) updateFields.sku = patch.sku;
  if (patch.name !== undefined) updateFields.name = patch.name;
  if (patch.sizeLabel !== undefined) updateFields.sizeLabel = patch.sizeLabel;
  if (patch.vertical !== undefined) updateFields.vertical = patch.vertical;
  if (patch.categoryId !== undefined) updateFields.categoryId = patch.categoryId;
  if (patch.productId !== undefined) updateFields.productId = patch.productId || null;
  if (patch.unitId !== undefined) updateFields.unitId = patch.unitId;
  if (patch.unitQuantity !== undefined) updateFields.unitQuantity = String(patch.unitQuantity);
  if (patch.mrpPaise !== undefined) updateFields.mrpPaise = patch.mrpPaise;
  if (patch.sellingPricePaise !== undefined) {
    updateFields.sellingPricePaise = patch.sellingPricePaise;
  }
  if (patch.stockQuantity !== undefined) updateFields.stockQuantity = String(patch.stockQuantity);
  if (patch.lowStockThreshold !== undefined) {
    updateFields.lowStockThreshold = String(patch.lowStockThreshold);
  }
  if (patch.attributes !== undefined) {
    updateFields.attributesJson = JSON.stringify(patch.attributes);
  }
  if (patch.isActive !== undefined) updateFields.isActive = patch.isActive;

  const [updated] = await db
    .update(adminVariantMasters)
    .set(updateFields)
    .where(eq(adminVariantMasters.externalId, externalId))
    .returning();
  return updated ? mapVariantMaster(updated) : null;
}

export async function toggleAdminVariantMasterStatus(
  externalId: string
): Promise<VariantSizeMasterRecord | null> {
  await seedAdminMastersIfEmpty();
  const [existing] = await db
    .select()
    .from(adminVariantMasters)
    .where(eq(adminVariantMasters.externalId, externalId))
    .limit(1);
  if (!existing) return null;
  const [updated] = await db
    .update(adminVariantMasters)
    .set({ isActive: !existing.isActive, updatedAt: new Date() })
    .where(eq(adminVariantMasters.id, existing.id))
    .returning();
  return updated ? mapVariantMaster(updated) : null;
}

export async function deleteAdminVariantMaster(externalId: string): Promise<boolean> {
  await seedAdminMastersIfEmpty();
  const deleted = await db
    .delete(adminVariantMasters)
    .where(eq(adminVariantMasters.externalId, externalId))
    .returning({ id: adminVariantMasters.id });
  return deleted.length > 0;
}

// =========================================================================
// 7. PACKAGING MASTER CRUD
// =========================================================================

export async function listAdminPackagingMasters(): Promise<PackagingMasterRecord[]> {
  await seedAdminMastersIfEmpty();
  const rows = await db
    .select()
    .from(adminPackagingMasters)
    .orderBy(asc(adminPackagingMasters.id));
  return rows.map(mapPackagingMaster);
}

export async function createAdminPackagingMaster(
  input: Omit<PackagingMasterRecord, 'id'> & { id?: string }
): Promise<PackagingMasterRecord> {
  await seedAdminMastersIfEmpty();
  const externalId = input.id?.trim() || `pkg_${Date.now()}`;
  const [inserted] = await db
    .insert(adminPackagingMasters)
    .values({
      externalId,
      code: input.code,
      name: input.name,
      hindiName: input.hindiName ?? null,
      materialType: input.materialType,
      capacityLabel: input.capacityLabel,
      unitId: input.unitId ?? null,
      feePaise: input.feePaise,
      isFoodGrade: input.isFoodGrade,
      isEcoFriendly: input.isEcoFriendly,
      isLeakProof: input.isLeakProof,
      verticalsJson: JSON.stringify(input.verticals || []),
      categoryIdsJson: JSON.stringify(input.categoryIds || []),
      productIdsJson: JSON.stringify(input.productIds || []),
      isActive: input.isActive,
    })
    .returning();
  return mapPackagingMaster(inserted);
}

export async function updateAdminPackagingMaster(
  externalId: string,
  patch: Partial<PackagingMasterRecord>
): Promise<PackagingMasterRecord | null> {
  await seedAdminMastersIfEmpty();
  const updateFields: Record<string, unknown> = { updatedAt: new Date() };
  if (patch.code !== undefined) updateFields.code = patch.code;
  if (patch.name !== undefined) updateFields.name = patch.name;
  if (patch.hindiName !== undefined) updateFields.hindiName = patch.hindiName || null;
  if (patch.materialType !== undefined) updateFields.materialType = patch.materialType;
  if (patch.capacityLabel !== undefined) updateFields.capacityLabel = patch.capacityLabel;
  if (patch.unitId !== undefined) updateFields.unitId = patch.unitId || null;
  if (patch.feePaise !== undefined) updateFields.feePaise = patch.feePaise;
  if (patch.isFoodGrade !== undefined) updateFields.isFoodGrade = patch.isFoodGrade;
  if (patch.isEcoFriendly !== undefined) updateFields.isEcoFriendly = patch.isEcoFriendly;
  if (patch.isLeakProof !== undefined) updateFields.isLeakProof = patch.isLeakProof;
  if (patch.verticals !== undefined) updateFields.verticalsJson = JSON.stringify(patch.verticals);
  if (patch.categoryIds !== undefined) {
    updateFields.categoryIdsJson = JSON.stringify(patch.categoryIds);
  }
  if (patch.productIds !== undefined) {
    updateFields.productIdsJson = JSON.stringify(patch.productIds);
  }
  if (patch.isActive !== undefined) updateFields.isActive = patch.isActive;

  const [updated] = await db
    .update(adminPackagingMasters)
    .set(updateFields)
    .where(eq(adminPackagingMasters.externalId, externalId))
    .returning();
  return updated ? mapPackagingMaster(updated) : null;
}

export async function toggleAdminPackagingMasterStatus(
  externalId: string
): Promise<PackagingMasterRecord | null> {
  await seedAdminMastersIfEmpty();
  const [existing] = await db
    .select()
    .from(adminPackagingMasters)
    .where(eq(adminPackagingMasters.externalId, externalId))
    .limit(1);
  if (!existing) return null;
  const [updated] = await db
    .update(adminPackagingMasters)
    .set({ isActive: !existing.isActive, updatedAt: new Date() })
    .where(eq(adminPackagingMasters.id, existing.id))
    .returning();
  return updated ? mapPackagingMaster(updated) : null;
}

export async function deleteAdminPackagingMaster(externalId: string): Promise<boolean> {
  await seedAdminMastersIfEmpty();
  const deleted = await db
    .delete(adminPackagingMasters)
    .where(eq(adminPackagingMasters.externalId, externalId))
    .returning({ id: adminPackagingMasters.id });
  return deleted.length > 0;
}

// =========================================================================
// 8. PRODUCT AVAILABILITY & STOCK CONFIGURATION MASTER CRUD
// =========================================================================

export async function listAdminAvailabilityConfigs(): Promise<AvailabilityStockConfigRecord[]> {
  await seedAdminMastersIfEmpty();
  const rows = await db
    .select()
    .from(adminAvailabilityConfigs)
    .orderBy(asc(adminAvailabilityConfigs.id));
  return rows.map(mapAvailabilityConfig);
}

export async function createAdminAvailabilityConfig(
  input: Omit<AvailabilityStockConfigRecord, 'id'> & { id?: string }
): Promise<AvailabilityStockConfigRecord> {
  await seedAdminMastersIfEmpty();
  const externalId = input.id?.trim() || `avail_${Date.now()}`;
  const [inserted] = await db
    .insert(adminAvailabilityConfigs)
    .values({
      externalId,
      code: input.code,
      name: input.name,
      vertical: input.vertical,
      categoryId: input.categoryId,
      productId: input.productId ?? null,
      workflowMode: input.workflowMode,
      serviceSlotsJson: JSON.stringify(input.serviceSlots || []),
      prepTimeMinutes: input.prepTimeMinutes ?? null,
      dailyBatchLimit: input.dailyBatchLimit ?? null,
      lowStockThreshold: input.lowStockThreshold,
      maxQtyPerOrder: input.maxQtyPerOrder,
      autoDisableOnZeroStock: input.autoDisableOnZeroStock,
      allowPreOrder: input.allowPreOrder,
      restockLeadHours: input.restockLeadHours ?? null,
      isActive: input.isActive,
    })
    .returning();
  return mapAvailabilityConfig(inserted);
}

export async function updateAdminAvailabilityConfig(
  externalId: string,
  patch: Partial<AvailabilityStockConfigRecord>
): Promise<AvailabilityStockConfigRecord | null> {
  await seedAdminMastersIfEmpty();
  const updateFields: Record<string, unknown> = { updatedAt: new Date() };
  if (patch.code !== undefined) updateFields.code = patch.code;
  if (patch.name !== undefined) updateFields.name = patch.name;
  if (patch.vertical !== undefined) updateFields.vertical = patch.vertical;
  if (patch.categoryId !== undefined) updateFields.categoryId = patch.categoryId;
  if (patch.productId !== undefined) updateFields.productId = patch.productId || null;
  if (patch.workflowMode !== undefined) updateFields.workflowMode = patch.workflowMode;
  if (patch.serviceSlots !== undefined) {
    updateFields.serviceSlotsJson = JSON.stringify(patch.serviceSlots);
  }
  if (patch.prepTimeMinutes !== undefined) {
    updateFields.prepTimeMinutes = patch.prepTimeMinutes ?? null;
  }
  if (patch.dailyBatchLimit !== undefined) {
    updateFields.dailyBatchLimit = patch.dailyBatchLimit ?? null;
  }
  if (patch.lowStockThreshold !== undefined) {
    updateFields.lowStockThreshold = patch.lowStockThreshold;
  }
  if (patch.maxQtyPerOrder !== undefined) updateFields.maxQtyPerOrder = patch.maxQtyPerOrder;
  if (patch.autoDisableOnZeroStock !== undefined) {
    updateFields.autoDisableOnZeroStock = patch.autoDisableOnZeroStock;
  }
  if (patch.allowPreOrder !== undefined) updateFields.allowPreOrder = patch.allowPreOrder;
  if (patch.restockLeadHours !== undefined) {
    updateFields.restockLeadHours = patch.restockLeadHours ?? null;
  }
  if (patch.isActive !== undefined) updateFields.isActive = patch.isActive;

  const [updated] = await db
    .update(adminAvailabilityConfigs)
    .set(updateFields)
    .where(eq(adminAvailabilityConfigs.externalId, externalId))
    .returning();
  return updated ? mapAvailabilityConfig(updated) : null;
}

export async function toggleAdminAvailabilityConfigStatus(
  externalId: string
): Promise<AvailabilityStockConfigRecord | null> {
  await seedAdminMastersIfEmpty();
  const [existing] = await db
    .select()
    .from(adminAvailabilityConfigs)
    .where(eq(adminAvailabilityConfigs.externalId, externalId))
    .limit(1);
  if (!existing) return null;
  const [updated] = await db
    .update(adminAvailabilityConfigs)
    .set({ isActive: !existing.isActive, updatedAt: new Date() })
    .where(eq(adminAvailabilityConfigs.id, existing.id))
    .returning();
  return updated ? mapAvailabilityConfig(updated) : null;
}

export async function deleteAdminAvailabilityConfig(externalId: string): Promise<boolean> {
  await seedAdminMastersIfEmpty();
  const deleted = await db
    .delete(adminAvailabilityConfigs)
    .where(eq(adminAvailabilityConfigs.externalId, externalId))
    .returning({ id: adminAvailabilityConfigs.id });
  return deleted.length > 0;
}

// =========================================================================
// UNIFIED READ FOR PUBLIC CATALOG / INITIAL HYDRATION (ZERO PII)
// =========================================================================

export async function listAllCatalogMasters() {
  await seedAdminMastersIfEmpty();
  const [
    verticals,
    attributes,
    units,
    optionGroups,
    brands,
    variantMasters,
    packagingMasters,
    availabilityConfigs,
  ] = await Promise.all([
    listAdminVerticals(),
    listAdminAttributes(),
    listAdminUnits(),
    listAdminOptionGroups(),
    listAdminBrands(),
    listAdminVariantMasters(),
    listAdminPackagingMasters(),
    listAdminAvailabilityConfigs(),
  ]);

  return {
    verticals,
    attributes,
    units,
    optionGroups,
    brands,
    variantMasters,
    packagingMasters,
    availabilityConfigs,
  };
}
