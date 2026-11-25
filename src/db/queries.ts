import { and, desc, eq, inArray } from 'drizzle-orm';
import { db } from './index.ts';
import {
  inventoryStockMovements,
  orderItems,
  orders,
  orderStatusHistory,
  sellerInventoryItems,
  sellers,
  udhariCreditProfiles,
  udhariLedgerEntries,
  users,
  villages,
} from './schema.ts';

const BASELINE_VILLAGES = [
  {
    code: 'rampur',
    name: 'Rampur',
    hindiName: 'रामपुर',
    district: 'Unnao',
    state: 'Uttar Pradesh',
    baseDeliveryFee: '15.00',
    isActive: true,
  },
  {
    code: 'madhopur',
    name: 'Madhopur',
    hindiName: 'माधोपुर',
    district: 'Unnao',
    state: 'Uttar Pradesh',
    baseDeliveryFee: '20.00',
    isActive: true,
  },
  {
    code: 'shivpur',
    name: 'Shivpur',
    hindiName: 'शिवपुर',
    district: 'Unnao',
    state: 'Uttar Pradesh',
    baseDeliveryFee: '20.00',
    isActive: true,
  },
  {
    code: 'keshavpur',
    name: 'Keshavpur',
    hindiName: 'केशवपुर',
    district: 'Unnao',
    state: 'Uttar Pradesh',
    baseDeliveryFee: '15.00',
    isActive: true,
  },
  {
    code: 'sitapur',
    name: 'Sitapur',
    hindiName: 'सीतापुर',
    district: 'Unnao',
    state: 'Uttar Pradesh',
    baseDeliveryFee: '25.00',
    isActive: true,
  },
];

const BASELINE_SELLERS = [
  {
    code: 'seller_gupta_kirana',
    publicName: 'Gupta Kirana & General Store',
    businessType: 'KIRANA',
    primaryVertical: 'GROCERY',
    contactPhone: '9876543211',
    villageCode: 'rampur',
    shopAddress: 'Main Bazaar Road, Near Hanuman Mandir, Rampur',
    minimumOrderAmount: '100.00',
    packagingFee: '0.00',
    deliveryFee: '15.00',
    upiId: 'guptakirana@upi',
    udhariEnabled: true,
    ratingAvg: '4.80',
  },
  {
    code: 'seller_sharma_dhaba',
    publicName: 'Sharma Shuddh Shakahari Dhaba',
    businessType: 'DHABA',
    primaryVertical: 'FOOD',
    contactPhone: '9876543210',
    villageCode: 'rampur',
    shopAddress: 'Panchayat Bhawan Chauraha, Rampur',
    minimumOrderAmount: '80.00',
    packagingFee: '15.00',
    deliveryFee: '20.00',
    upiId: 'sharmadhaba@upi',
    udhariEnabled: false,
    ratingAvg: '4.70',
  },
  {
    code: 'seller_chaudhary_sweets',
    publicName: 'Chaudhary Mishthan Bhandar',
    businessType: 'RESTAURANT',
    primaryVertical: 'FOOD',
    contactPhone: '9876543212',
    villageCode: 'rampur',
    shopAddress: 'Purani Mandi Chowk, Rampur',
    minimumOrderAmount: '100.00',
    packagingFee: '15.00',
    deliveryFee: '15.00',
    upiId: 'chaudharysweets@upi',
    udhariEnabled: false,
    ratingAvg: '4.60',
  },
  {
    code: 'seller_kisan_dairy',
    publicName: 'Kisan Fresh Dairy & Agro',
    businessType: 'DAIRY_STORE',
    primaryVertical: 'GROCERY',
    contactPhone: '9876543215',
    villageCode: 'keshavpur',
    shopAddress: 'Primary Health Center Road, Keshavpur',
    minimumOrderAmount: '80.00',
    packagingFee: '5.00',
    deliveryFee: '15.00',
    upiId: 'kisandairy@upi',
    udhariEnabled: true,
    ratingAvg: '4.75',
  },
];

const GUPTA_KIRANA_INVENTORY = [
  {
    externalId: 'groc_1',
    sku: 'KIR-ATTA-001',
    name: 'Chakki Fresh Wheat Atta (MP Sharbati)',
    categoryName: 'Atta & Flours',
    brandName: 'MP Sharbati Chakki',
    unitLabel: 'kg',
    mrpAmount: '44.00',
    sellingPrice: '40.00',
    stockQuantity: '64.000',
    lowStockThreshold: '15.000',
    shelfLocation: 'Rack A1 · Grain Floor',
    expiryDate: '2027-02-28',
    supplierName: 'Unnao Grain Mandi',
    isAvailable: true,
  },
  {
    externalId: 'groc_2',
    sku: 'KIR-DAL-002',
    name: 'Desi Kala Chana (Brown Chickpeas)',
    categoryName: 'Dal & Pulses',
    brandName: 'Desi Mandi Grade A',
    unitLabel: 'kg',
    mrpAmount: '68.00',
    sellingPrice: '60.00',
    stockQuantity: '45.000',
    lowStockThreshold: '10.000',
    shelfLocation: 'Rack A2 · Pulses Bin',
    expiryDate: '2027-05-15',
    supplierName: 'Unnao Grain Mandi',
    isAvailable: true,
  },
  {
    externalId: 'groc_3',
    sku: 'KIR-DAL-003',
    name: 'Desi Arhar / Toor Dal (Polished-Free)',
    categoryName: 'Dal & Pulses',
    brandName: 'Tata Sampann / Local',
    unitLabel: 'kg',
    mrpAmount: '152.00',
    sellingPrice: '140.00',
    stockQuantity: '5.000',
    lowStockThreshold: '10.000',
    shelfLocation: 'Rack B1 · Pulses Bin',
    expiryDate: '2027-04-30',
    supplierName: 'Kanpur Dal Mill',
    isAvailable: true,
  },
  {
    externalId: 'groc_4',
    sku: 'KIR-OIL-004',
    name: 'Kachi Ghani Mustard Oil (1 Litre Bottle)',
    categoryName: 'Oil & Desi Ghee',
    brandName: 'Fortune Kachi Ghani',
    unitLabel: 'bottle',
    mrpAmount: '160.00',
    sellingPrice: '145.00',
    stockQuantity: '4.000',
    lowStockThreshold: '10.000',
    shelfLocation: 'Rack B2 · Cooking Oils',
    expiryDate: '2027-06-20',
    supplierName: 'Shree Ganesh Oil Agency',
    isAvailable: true,
  },
  {
    externalId: 'groc_7',
    sku: 'KIR-SPC-005',
    name: 'Tata Iodized Salt & Whole Jeera Combo',
    categoryName: 'Spices & Salt',
    brandName: 'Tata Salt',
    unitLabel: 'pack',
    mrpAmount: '85.00',
    sellingPrice: '78.00',
    stockQuantity: '55.000',
    lowStockThreshold: '12.000',
    shelfLocation: 'Rack C1 · Salt & Spices',
    expiryDate: '2028-01-10',
    supplierName: 'Kanpur Kirana Distributors',
    isAvailable: true,
  },
  {
    externalId: 'groc_gk_6',
    sku: 'KIR-RICE-006',
    name: 'India Gate Rozana Basmati Rice (1 kg)',
    categoryName: 'Atta & Flours',
    brandName: 'India Gate',
    unitLabel: 'kg',
    mrpAmount: '105.00',
    sellingPrice: '92.00',
    stockQuantity: '42.000',
    lowStockThreshold: '12.000',
    shelfLocation: 'Rack A1 · Grain Floor',
    expiryDate: '2027-11-30',
    supplierName: 'Unnao Grain Mandi',
    isAvailable: true,
  },
  {
    externalId: 'groc_gk_7',
    sku: 'KIR-SUG-007',
    name: 'Sulfur-Free Crystal White Sugar (Chini)',
    categoryName: 'Dairy & Daily Needs',
    brandName: 'Madhur / Loose Kirana',
    unitLabel: 'kg',
    mrpAmount: '50.00',
    sellingPrice: '46.00',
    stockQuantity: '50.000',
    lowStockThreshold: '15.000',
    shelfLocation: 'Rack A3 · Daily Staples',
    expiryDate: '2028-03-31',
    supplierName: 'Unnao Sugar Wholesale',
    isAvailable: true,
  },
  {
    externalId: 'groc_gk_8',
    sku: 'KIR-OIL-008',
    name: 'Fortune Sunlite Refined Soyabean Oil (1L Pouch)',
    categoryName: 'Oil & Desi Ghee',
    brandName: 'Fortune',
    unitLabel: 'pouch',
    mrpAmount: '145.00',
    sellingPrice: '132.00',
    stockQuantity: '6.000',
    lowStockThreshold: '12.000',
    shelfLocation: 'Rack B2 · Cooking Oils',
    expiryDate: '2027-05-10',
    supplierName: 'Shree Ganesh Oil Agency',
    isAvailable: true,
  },
  {
    externalId: 'groc_gk_9',
    sku: 'KIR-BSN-009',
    name: 'Rajdhani Pure Chana Besan (500g Pack)',
    categoryName: 'Atta & Flours',
    brandName: 'Rajdhani',
    unitLabel: 'pack',
    mrpAmount: '62.00',
    sellingPrice: '56.00',
    stockQuantity: '28.000',
    lowStockThreshold: '8.000',
    shelfLocation: 'Rack A2 · Flours & Besan',
    expiryDate: '2027-03-20',
    supplierName: 'Kanpur Kirana Distributors',
    isAvailable: true,
  },
  {
    externalId: 'groc_gk_10',
    sku: 'KIR-SPC-010',
    name: 'Everest Haldi (Turmeric) Powder (200g)',
    categoryName: 'Spices & Salt',
    brandName: 'Everest',
    unitLabel: 'pack',
    mrpAmount: '65.00',
    sellingPrice: '58.00',
    stockQuantity: '32.000',
    lowStockThreshold: '8.000',
    shelfLocation: 'Rack C2 · Spice Wall',
    expiryDate: '2027-09-15',
    supplierName: 'Kanpur Masala Depot',
    isAvailable: true,
  },
  {
    externalId: 'groc_gk_11',
    sku: 'KIR-SPC-011',
    name: 'MDH Deggi Mirch & Garam Masala Combo',
    categoryName: 'Spices & Salt',
    brandName: 'MDH',
    unitLabel: 'pack',
    mrpAmount: '102.00',
    sellingPrice: '94.00',
    stockQuantity: '3.000',
    lowStockThreshold: '8.000',
    shelfLocation: 'Rack C2 · Spice Wall',
    expiryDate: '2027-07-01',
    supplierName: 'Kanpur Masala Depot',
    isAvailable: true,
  },
  {
    externalId: 'groc_gk_12',
    sku: 'KIR-TEA-012',
    name: 'Tata Tea Agni Strong Leaf Pack (250g)',
    categoryName: 'Dairy & Daily Needs',
    brandName: 'Tata Tea Agni',
    unitLabel: 'pack',
    mrpAmount: '78.00',
    sellingPrice: '72.00',
    stockQuantity: '24.000',
    lowStockThreshold: '8.000',
    shelfLocation: 'Rack D1 · Tea & Beverages',
    expiryDate: '2027-10-12',
    supplierName: 'Kanpur Kirana Distributors',
    isAvailable: true,
  },
  {
    externalId: 'groc_gk_13',
    sku: 'KIR-GHE-013',
    name: 'Shuddh Desi Cow Ghee (500 ml Jar)',
    categoryName: 'Oil & Desi Ghee',
    brandName: 'Amul / Desi Dairy',
    unitLabel: 'jar',
    mrpAmount: '410.00',
    sellingPrice: '375.00',
    stockQuantity: '2.000',
    lowStockThreshold: '6.000',
    shelfLocation: 'Rack B3 · Ghee Shelf',
    expiryDate: '2027-04-15',
    supplierName: 'Unnao Dairy Co-op',
    isAvailable: true,
  },
  {
    externalId: 'groc_gk_14',
    sku: 'KIR-SNK-014',
    name: 'Parle-G Gold Biscuits Family Pack (400g)',
    categoryName: 'Dairy & Daily Needs',
    brandName: 'Parle',
    unitLabel: 'pack',
    mrpAmount: '35.00',
    sellingPrice: '30.00',
    stockQuantity: '38.000',
    lowStockThreshold: '10.000',
    shelfLocation: 'Counter Front · Fast Moving',
    expiryDate: '2027-02-18',
    supplierName: 'Kanpur FMCG Agency',
    isAvailable: true,
  },
  {
    externalId: 'groc_gk_15',
    sku: 'KIR-HOM-015',
    name: 'Surf Excel Easy Wash Detergent (1 kg)',
    categoryName: 'Dairy & Daily Needs',
    brandName: 'Surf Excel',
    unitLabel: 'pack',
    mrpAmount: '142.00',
    sellingPrice: '132.00',
    stockQuantity: '22.000',
    lowStockThreshold: '6.000',
    shelfLocation: 'Rack E1 · Home Care',
    expiryDate: '2028-06-30',
    supplierName: 'HUL Rural Stockist',
    isAvailable: true,
  },
  {
    externalId: 'groc_gk_16',
    sku: 'KIR-HOM-016',
    name: 'Lifebuoy Total 10 Bath Soap (4×125g Pack)',
    categoryName: 'Dairy & Daily Needs',
    brandName: 'Lifebuoy',
    unitLabel: 'pack',
    mrpAmount: '140.00',
    sellingPrice: '128.00',
    stockQuantity: '4.000',
    lowStockThreshold: '8.000',
    shelfLocation: 'Rack E2 · Personal Care',
    expiryDate: '2028-05-01',
    supplierName: 'HUL Rural Stockist',
    isAvailable: true,
  },
  {
    externalId: 'groc_gk_17',
    sku: 'KIR-POH-017',
    name: 'Thick Indori Poha (Flattened Rice 1 kg)',
    categoryName: 'Atta & Flours',
    brandName: 'Indori Gold',
    unitLabel: 'kg',
    mrpAmount: '64.00',
    sellingPrice: '58.00',
    stockQuantity: '26.000',
    lowStockThreshold: '8.000',
    shelfLocation: 'Rack A3 · Breakfast Staples',
    expiryDate: '2027-04-20',
    supplierName: 'Unnao Grain Mandi',
    isAvailable: true,
  },
  {
    externalId: 'groc_gk_18',
    sku: 'KIR-SNK-018',
    name: 'Maggi 2-Minute Masala Noodles (4-Pack 280g)',
    categoryName: 'Dairy & Daily Needs',
    brandName: 'Maggi',
    unitLabel: 'pack',
    mrpAmount: '60.00',
    sellingPrice: '56.00',
    stockQuantity: '0.000',
    lowStockThreshold: '10.000',
    shelfLocation: 'Counter Front · Fast Moving',
    expiryDate: '2027-03-10',
    supplierName: 'Kanpur FMCG Agency',
    isAvailable: false,
  },
  {
    externalId: 'groc_gk_19',
    sku: 'KIR-DAL-019',
    name: 'Moong Dhuli Dal (Yellow Split Lentils)',
    categoryName: 'Dal & Pulses',
    brandName: 'Desi Mandi Grade A',
    unitLabel: 'kg',
    mrpAmount: '138.00',
    sellingPrice: '126.00',
    stockQuantity: '0.000',
    lowStockThreshold: '8.000',
    shelfLocation: 'Rack B1 · Pulses Bin',
    expiryDate: '2027-05-25',
    supplierName: 'Kanpur Dal Mill',
    isAvailable: false,
  },
  {
    externalId: 'groc_gk_20',
    sku: 'KIR-HOM-020',
    name: 'Colgate Strong Teeth Toothpaste (200g)',
    categoryName: 'Dairy & Daily Needs',
    brandName: 'Colgate',
    unitLabel: 'tube',
    mrpAmount: '130.00',
    sellingPrice: '118.00',
    stockQuantity: '0.000',
    lowStockThreshold: '6.000',
    shelfLocation: 'Rack E2 · Personal Care',
    expiryDate: '2028-04-01',
    supplierName: 'Kanpur FMCG Agency',
    isAvailable: false,
  },
];

let baselineSeedPromise: Promise<void> | null = null;

export async function seedBaselineCatalogIfEmpty(): Promise<void> {
  if (!baselineSeedPromise) {
    baselineSeedPromise = (async () => {
      try {
        const existingVillages = await db.select().from(villages).limit(1);
        if (existingVillages.length === 0) {
          await db.insert(villages).values(BASELINE_VILLAGES).onConflictDoNothing();
        }

        const allVillages = await db.select().from(villages);
        const villageByCode = new Map(allVillages.map((v) => [v.code, v.id]));

        const existingSellers = await db.select().from(sellers).limit(1);
        if (existingSellers.length === 0) {
          const sellerRows = BASELINE_SELLERS.map((s) => {
            const villageId = villageByCode.get(s.villageCode) ?? allVillages[0]?.id;
            return {
              code: s.code,
              publicName: s.publicName,
              businessType: s.businessType,
              primaryVertical: s.primaryVertical,
              contactPhone: s.contactPhone,
              villageId,
              shopAddress: s.shopAddress,
              minimumOrderAmount: s.minimumOrderAmount,
              packagingFee: s.packagingFee,
              deliveryFee: s.deliveryFee,
              upiId: s.upiId,
              udhariEnabled: s.udhariEnabled,
              ratingAvg: s.ratingAvg,
            };
          });
          await db.insert(sellers).values(sellerRows).onConflictDoNothing();
        }

        const [guptaSeller] = await db
          .select()
          .from(sellers)
          .where(eq(sellers.code, 'seller_gupta_kirana'))
          .limit(1);

        if (guptaSeller) {
          const existingInventory = await db
            .select()
            .from(sellerInventoryItems)
            .where(eq(sellerInventoryItems.sellerId, guptaSeller.id))
            .limit(1);

          if (existingInventory.length === 0) {
            await db
              .insert(sellerInventoryItems)
              .values(
                GUPTA_KIRANA_INVENTORY.map((item) => ({
                  ...item,
                  sellerId: guptaSeller.id,
                  vertical: 'GROCERY',
                }))
              )
              .onConflictDoNothing();
          }
        }
      } catch (error) {
        baselineSeedPromise = null;
        console.error('Database Error in seedBaselineCatalogIfEmpty:', error);
        throw new Error('Failed to initialize marketplace catalog.', { cause: error });
      }
    })();
  }
  return baselineSeedPromise;
}

const INITIAL_ADMIN_EMAIL = (
  process.env.INITIAL_ADMIN_EMAIL || 'priyansha.priya1995@gmail.com'
).toLowerCase();

export async function getOrCreateUser(uid: string, email: string, displayName?: string) {
  try {
    const normalizedEmail = email.trim().toLowerCase();
    const isInitialAdmin = normalizedEmail === INITIAL_ADMIN_EMAIL;

    const [record] = await db
      .insert(users)
      .values({
        uid,
        email,
        displayName: displayName ?? null,
        role: isInitialAdmin ? 'SUPER_ADMIN' : 'CUSTOMER',
      })
      .onConflictDoUpdate({
        target: users.uid,
        set: {
          email,
          displayName: displayName ?? null,
          ...(isInitialAdmin ? { role: 'SUPER_ADMIN' } : {}),
          updatedAt: new Date(),
        },
      })
      .returning();

    return record;
  } catch (error) {
    console.error('Database Error in getOrCreateUser:', error);
    throw new Error('Failed to synchronize user account.', { cause: error });
  }
}

export async function getVillages() {
  try {
    await seedBaselineCatalogIfEmpty();
    return await db.select().from(villages).orderBy(villages.name);
  } catch (error) {
    console.error('Database Error in getVillages:', error);
    throw new Error('Failed to fetch villages.', { cause: error });
  }
}

export async function getSellers() {
  try {
    await seedBaselineCatalogIfEmpty();
    return await db.select().from(sellers).orderBy(sellers.publicName);
  } catch (error) {
    console.error('Database Error in getSellers:', error);
    throw new Error('Failed to fetch sellers.', { cause: error });
  }
}

export async function getSellerInventory(sellerCode: string) {
  try {
    await seedBaselineCatalogIfEmpty();
    const [seller] = await db
      .select()
      .from(sellers)
      .where(eq(sellers.code, sellerCode))
      .limit(1);

    if (!seller) {
      return [];
    }

    const rows = await db
      .select()
      .from(sellerInventoryItems)
      .where(eq(sellerInventoryItems.sellerId, seller.id))
      .orderBy(sellerInventoryItems.id);

    return rows.map((row) => ({
      id: row.id,
      externalId: row.externalId,
      sellerCode: seller.code,
      sku: row.sku,
      name: row.name,
      categoryName: row.categoryName,
      brandName: row.brandName,
      vertical: row.vertical,
      unitLabel: row.unitLabel,
      mrpPaise: Math.round(Number(row.mrpAmount) * 100),
      pricePaise: Math.round(Number(row.sellingPrice) * 100),
      stockQuantity: Number(row.stockQuantity),
      lowStockThreshold: Number(row.lowStockThreshold),
      shelfLocation: row.shelfLocation,
      expiryDate: row.expiryDate,
      supplierName: row.supplierName,
      isAvailable: row.isAvailable,
      updatedAt: row.updatedAt,
    }));
  } catch (error) {
    console.error('Database Error in getSellerInventory:', error);
    throw new Error('Failed to fetch seller inventory.', { cause: error });
  }
}

export interface UpdateInventoryStockInput {
  externalId: string;
  nextQty?: number;
  isAvailable?: boolean;
  pricePaise?: number;
  actorUid: string;
  reason?: string;
}

export async function updateSellerInventoryStock(input: UpdateInventoryStockInput) {
  try {
    return await db.transaction(async (tx) => {
      const [existing] = await tx
        .select()
        .from(sellerInventoryItems)
        .where(eq(sellerInventoryItems.externalId, input.externalId))
        .limit(1);

      if (!existing) {
        return null;
      }

      const prevQty = Number(existing.stockQuantity);
      const finalQty =
        typeof input.nextQty === 'number' && Number.isFinite(input.nextQty)
          ? Math.max(0, input.nextQty)
          : prevQty;
      const finalAvailable =
        typeof input.isAvailable === 'boolean' ? input.isAvailable : finalQty > 0;
      const finalPrice =
        typeof input.pricePaise === 'number' && Number.isFinite(input.pricePaise) && input.pricePaise > 0
          ? (input.pricePaise / 100).toFixed(2)
          : existing.sellingPrice;

      const [updated] = await tx
        .update(sellerInventoryItems)
        .set({
          stockQuantity: finalQty.toFixed(3),
          isAvailable: finalAvailable,
          sellingPrice: finalPrice,
          updatedAt: new Date(),
        })
        .where(eq(sellerInventoryItems.id, existing.id))
        .returning();

      const delta = finalQty - prevQty;
      if (delta !== 0) {
        await tx.insert(inventoryStockMovements).values({
          listingId: existing.id,
          sellerId: existing.sellerId,
          movementType: delta > 0 ? 'RESTOCK' : 'MANUAL_ADJUSTMENT',
          quantityDelta: delta.toFixed(3),
          quantityBefore: prevQty.toFixed(3),
          quantityAfter: finalQty.toFixed(3),
          reason: input.reason ?? 'Seller inventory update',
          actorUid: input.actorUid,
        });
      }

      return {
        id: updated.id,
        externalId: updated.externalId,
        pricePaise: Math.round(Number(updated.sellingPrice) * 100),
        stockQuantity: Number(updated.stockQuantity),
        isAvailable: updated.isAvailable,
        updatedAt: updated.updatedAt,
      };
    });
  } catch (error) {
    console.error('Database Error in updateSellerInventoryStock:', error);
    throw new Error('Failed to update inventory item.', { cause: error });
  }
}

export interface BulkInventoryItemPatch {
  externalId: string;
  pricePaise?: number;
  stockQuantity?: number;
  isAvailable?: boolean;
}

export async function bulkUpdateSellerInventory(
  updates: BulkInventoryItemPatch[],
  actorUid: string
) {
  try {
    if (updates.length === 0) return [];
    const ids = updates.map((u) => u.externalId);
    const updateMap = new Map(updates.map((u) => [u.externalId, u]));

    return await db.transaction(async (tx) => {
      const existingRows = await tx
        .select()
        .from(sellerInventoryItems)
        .where(inArray(sellerInventoryItems.externalId, ids));

      const results: Array<{
        externalId: string;
        pricePaise: number;
        stockQuantity: number;
        isAvailable: boolean;
      }> = [];

      for (const row of existingRows) {
        const patch = updateMap.get(row.externalId);
        if (!patch) continue;

        const prevQty = Number(row.stockQuantity);
        const nextQty =
          typeof patch.stockQuantity === 'number' && Number.isFinite(patch.stockQuantity)
            ? Math.max(0, patch.stockQuantity)
            : prevQty;
        const nextPrice =
          typeof patch.pricePaise === 'number' && Number.isFinite(patch.pricePaise) && patch.pricePaise > 0
            ? (patch.pricePaise / 100).toFixed(2)
            : row.sellingPrice;
        const nextAvail =
          typeof patch.isAvailable === 'boolean' ? patch.isAvailable : row.isAvailable;

        const [updated] = await tx
          .update(sellerInventoryItems)
          .set({
            sellingPrice: nextPrice,
            stockQuantity: nextQty.toFixed(3),
            isAvailable: nextAvail,
            updatedAt: new Date(),
          })
          .where(eq(sellerInventoryItems.id, row.id))
          .returning();

        const delta = nextQty - prevQty;
        if (delta !== 0) {
          await tx.insert(inventoryStockMovements).values({
            listingId: row.id,
            sellerId: row.sellerId,
            movementType: delta > 0 ? 'BULK_RESTOCK' : 'BULK_ADJUSTMENT',
            quantityDelta: delta.toFixed(3),
            quantityBefore: prevQty.toFixed(3),
            quantityAfter: nextQty.toFixed(3),
            reason: 'Bulk inventory update',
            actorUid,
          });
        }

        results.push({
          externalId: updated.externalId,
          pricePaise: Math.round(Number(updated.sellingPrice) * 100),
          stockQuantity: Number(updated.stockQuantity),
          isAvailable: updated.isAvailable,
        });
      }

      return results;
    });
  } catch (error) {
    console.error('Database Error in bulkUpdateSellerInventory:', error);
    throw new Error('Failed to apply bulk inventory update.', { cause: error });
  }
}

export async function getOrdersForUser(uid: string) {
  try {
    await seedBaselineCatalogIfEmpty();
    const userOrders = await db
      .select()
      .from(orders)
      .where(eq(orders.customerUid, uid))
      .orderBy(desc(orders.createdAt));

    if (userOrders.length === 0) return [];

    const orderIds = userOrders.map((o) => o.id);
    const sellerIds = Array.from(new Set(userOrders.map((o) => o.sellerId)));

    const [itemsRows, historyRows, sellerRows] = await Promise.all([
      db.select().from(orderItems).where(inArray(orderItems.orderId, orderIds)),
      db
        .select()
        .from(orderStatusHistory)
        .where(inArray(orderStatusHistory.orderId, orderIds))
        .orderBy(orderStatusHistory.createdAt),
      db.select().from(sellers).where(inArray(sellers.id, sellerIds)),
    ]);

    const sellerById = new Map(sellerRows.map((s) => [s.id, s]));

    return userOrders.map((o) => {
      const seller = sellerById.get(o.sellerId);
      return {
        id: `db_ord_${o.id}`,
        orderNumber: o.orderNumber,
        customerId: o.customerUid,
        customerName: o.customerName,
        customerPhone: o.customerPhone,
        sellerId: seller?.code ?? 'seller_gupta_kirana',
        sellerName: seller?.publicName ?? 'Local Seller',
        sellerPhone: seller?.contactPhone ?? '',
        villageId: o.villageCode,
        fulfilmentMode: o.fulfilmentMode,
        deliveryAddress: o.deliveryAddressJson ? JSON.parse(o.deliveryAddressJson) : undefined,
        deliveryNote: o.deliveryNote ?? undefined,
        status: o.status,
        paymentMethod: o.paymentMethod,
        paymentStatus: o.paymentStatus,
        itemSubtotalPaise: Math.round(Number(o.itemSubtotal) * 100),
        deliveryFeePaise: Math.round(Number(o.deliveryFee) * 100),
        packagingFeePaise: Math.round(Number(o.packagingFee) * 100),
        platformFeePaise: Math.round(Number(o.platformFee) * 100),
        totalPaise: Math.round(Number(o.totalAmount) * 100),
        items: itemsRows
          .filter((i) => i.orderId === o.id)
          .map((i) => ({
            id: `db_item_${i.id}`,
            productId: i.skuSnapshot ?? `listing_${i.listingId ?? i.id}`,
            productName: i.productNameSnapshot,
            catalogueType: i.verticalSnapshot === 'FOOD' ? 'FOOD' : 'GROCERY',
            sku: i.skuSnapshot ?? undefined,
            unitPricePaise: Math.round(Number(i.unitPriceSnapshot) * 100),
            requestedQuantity: Number(i.requestedQuantity),
            requestedUnitLabel: i.requestedUnitLabel,
            lineTotalPaise: Math.round(Number(i.lineTotal) * 100),
            customerNote: i.customerNote ?? undefined,
          })),
        statusHistory: historyRows
          .filter((h) => h.orderId === o.id)
          .map((h) => ({
            id: `db_ev_${h.id}`,
            orderId: `db_ord_${o.id}`,
            fromStatus: h.fromStatus ?? h.toStatus,
            toStatus: h.toStatus,
            actorRole: h.actorRole,
            reason: h.reason ?? undefined,
            timestamp: h.createdAt.toISOString(),
          })),
        createdAt: o.createdAt.toISOString(),
        updatedAt: o.updatedAt.toISOString(),
      };
    });
  } catch (error) {
    console.error('Database Error in getOrdersForUser:', error);
    throw new Error('Failed to fetch orders.', { cause: error });
  }
}

export interface CreateOrderInput {
  orderNumber: string;
  customerUid: string;
  customerName: string;
  customerPhone: string;
  sellerCode: string;
  villageCode: string;
  fulfilmentMode: string;
  deliveryAddress?: unknown;
  deliveryNote?: string;
  paymentMethod: string;
  paymentStatus: string;
  itemSubtotalPaise: number;
  deliveryFeePaise: number;
  packagingFeePaise: number;
  platformFeePaise: number;
  totalPaise: number;
  items: Array<{
    productId?: string;
    productName: string;
    catalogueType: string;
    sku?: string;
    unitPricePaise: number;
    requestedQuantity: number;
    requestedUnitLabel: string;
    lineTotalPaise: number;
    customerNote?: string;
  }>;
}

export async function createOrderWithItems(input: CreateOrderInput) {
  try {
    await seedBaselineCatalogIfEmpty();

    return await db.transaction(async (tx) => {
      let [seller] = await tx
        .select()
        .from(sellers)
        .where(eq(sellers.code, input.sellerCode))
        .limit(1);

      if (!seller) {
        [seller] = await tx.select().from(sellers).limit(1);
      }

      if (!seller) {
        throw new Error('No seller available to attach order.');
      }

      const [created] = await tx
        .insert(orders)
        .values({
          orderNumber: input.orderNumber,
          customerUid: input.customerUid,
          customerName: input.customerName,
          customerPhone: input.customerPhone,
          sellerId: seller.id,
          villageCode: input.villageCode,
          fulfilmentMode: input.fulfilmentMode,
          deliveryAddressJson: input.deliveryAddress
            ? JSON.stringify(input.deliveryAddress)
            : null,
          deliveryNote: input.deliveryNote ?? null,
          status: 'placed',
          paymentMethod: input.paymentMethod,
          paymentStatus: input.paymentStatus,
          itemSubtotal: (input.itemSubtotalPaise / 100).toFixed(2),
          deliveryFee: (input.deliveryFeePaise / 100).toFixed(2),
          packagingFee: (input.packagingFeePaise / 100).toFixed(2),
          platformFee: (input.platformFeePaise / 100).toFixed(2),
          totalAmount: (input.totalPaise / 100).toFixed(2),
        })
        .returning();

      if (input.items.length > 0) {
        const externalIds = input.items
          .map((i) => i.productId)
          .filter((id): id is string => Boolean(id));

        const matchedListings =
          externalIds.length > 0
            ? await tx
                .select()
                .from(sellerInventoryItems)
                .where(inArray(sellerInventoryItems.externalId, externalIds))
            : [];

        const listingByExtId = new Map(matchedListings.map((l) => [l.externalId, l.id]));

        await tx.insert(orderItems).values(
          input.items.map((item) => ({
            orderId: created.id,
            listingId: item.productId ? listingByExtId.get(item.productId) ?? null : null,
            productNameSnapshot: item.productName,
            verticalSnapshot: item.catalogueType || 'GROCERY',
            skuSnapshot: item.sku ?? item.productId ?? null,
            unitPriceSnapshot: (item.unitPricePaise / 100).toFixed(2),
            requestedQuantity: Number(item.requestedQuantity).toFixed(3),
            requestedUnitLabel: item.requestedUnitLabel,
            lineTotal: (item.lineTotalPaise / 100).toFixed(2),
            customerNote: item.customerNote ?? null,
          }))
        );
      }

      await tx.insert(orderStatusHistory).values({
        orderId: created.id,
        fromStatus: 'placed',
        toStatus: 'placed',
        actorRole: 'CUSTOMER',
        reason: 'Order placed via GramBazaar checkout',
      });

      return created;
    });
  } catch (error) {
    console.error('Database Error in createOrderWithItems:', error);
    throw new Error('Failed to persist order.', { cause: error });
  }
}

export async function transitionOrderStatus(params: {
  orderNumber: string;
  nextStatus: string;
  actorRole: string;
  actorUid: string;
  reason?: string;
}) {
  try {
    return await db.transaction(async (tx) => {
      const [existing] = await tx
        .select()
        .from(orders)
        .where(
          and(
            eq(orders.orderNumber, params.orderNumber),
            eq(orders.customerUid, params.actorUid)
          )
        )
        .limit(1);

      if (!existing) {
        return null;
      }

      const [updated] = await tx
        .update(orders)
        .set({
          status: params.nextStatus,
          paymentStatus:
            params.nextStatus === 'completed' && existing.paymentMethod === 'COD'
              ? 'collected'
              : existing.paymentStatus,
          updatedAt: new Date(),
        })
        .where(eq(orders.id, existing.id))
        .returning();

      await tx.insert(orderStatusHistory).values({
        orderId: existing.id,
        fromStatus: existing.status,
        toStatus: params.nextStatus,
        actorRole: params.actorRole,
        reason: params.reason ?? `Status updated to ${params.nextStatus}`,
      });

      return updated;
    });
  } catch (error) {
    console.error('Database Error in transitionOrderStatus:', error);
    throw new Error('Failed to update order status.', { cause: error });
  }
}

export async function getUdhariProfiles(sellerCode: string) {
  try {
    await seedBaselineCatalogIfEmpty();
    const [seller] = await db
      .select()
      .from(sellers)
      .where(eq(sellers.code, sellerCode))
      .limit(1);

    if (!seller) return [];

    return await db
      .select()
      .from(udhariCreditProfiles)
      .where(eq(udhariCreditProfiles.sellerId, seller.id))
      .orderBy(desc(udhariCreditProfiles.updatedAt));
  } catch (error) {
    console.error('Database Error in getUdhariProfiles:', error);
    throw new Error('Failed to fetch udhari credit profiles.', { cause: error });
  }
}

export async function recordUdhariRepayment(params: {
  profileId: number;
  amountInr: number;
  recordedBy: string;
  reason?: string;
}) {
  try {
    return await db.transaction(async (tx) => {
      const [profile] = await tx
        .select()
        .from(udhariCreditProfiles)
        .where(eq(udhariCreditProfiles.id, params.profileId))
        .limit(1);

      if (!profile) return null;

      const currentBal = Number(profile.outstandingBalance);
      const nextBal = Math.max(0, currentBal - params.amountInr);
      const now = new Date();

      const [updatedProfile] = await tx
        .update(udhariCreditProfiles)
        .set({
          outstandingBalance: nextBal.toFixed(2),
          lastPaymentAt: now,
          updatedAt: now,
        })
        .where(eq(udhariCreditProfiles.id, profile.id))
        .returning();

      await tx.insert(udhariLedgerEntries).values({
        ledgerReference: `UDH-${Date.now()}-${profile.id}`,
        profileId: profile.id,
        sellerId: profile.sellerId,
        entryType: 'REPAYMENT',
        direction: 'CREDIT',
        amount: params.amountInr.toFixed(2),
        runningBalance: nextBal.toFixed(2),
        status: 'POSTED',
        reason: params.reason ?? 'Customer Udhari repayment recorded',
        recordedBy: params.recordedBy,
      });

      return updatedProfile;
    });
  } catch (error) {
    console.error('Database Error in recordUdhariRepayment:', error);
    throw new Error('Failed to record udhari repayment.', { cause: error });
  }
}
