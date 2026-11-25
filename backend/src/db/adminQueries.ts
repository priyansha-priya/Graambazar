import { asc, desc, eq, or } from 'drizzle-orm';
import { db } from './index.ts';
import { adminCategories, adminProducts, sellers, villages } from './schema.ts';
import {
  ADMIN_SEED_CATEGORIES,
  ADMIN_SEED_PRODUCTS,
  ADMIN_SEED_SELLERS,
  ADMIN_SEED_VILLAGES,
} from './adminSeed.ts';
import type {
  CategoryRecord,
  InventoryMode,
  MasterSellerRecord,
  ProductModerationStatus,
  ProductVariantRecord,
  SellerAccountStatus,
  SellerActivityEvent,
  SellerBusinessType,
  SellerDocumentStatus,
  SellerKycDocumentRecord,
  SellerKycStatus,
  UniversalProductRecord,
} from '../types/admin.ts';

function safeJsonParse<T>(raw: string | null | undefined, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

let adminSeedPromise: Promise<void> | null = null;

export async function seedAdminCatalogIfEmpty(): Promise<void> {
  if (!adminSeedPromise) {
    adminSeedPromise = (async () => {
      try {
        // Ensure admin villages exist (idempotent)
        await db.insert(villages).values(ADMIN_SEED_VILLAGES).onConflictDoNothing();

        const allVillages = await db.select().from(villages);
        const villageByCode = new Map(allVillages.map((v) => [v.code, v.id]));
        const fallbackVillageId = allVillages[0]?.id;

        // Seed Admin Categories if table is empty
        const existingCategories = await db.select({ id: adminCategories.id }).from(adminCategories).limit(1);
        if (existingCategories.length === 0) {
          await db
            .insert(adminCategories)
            .values(
              ADMIN_SEED_CATEGORIES.map((c) => ({
                externalId: c.id,
                name: c.name,
                hindiName: c.hindiName,
                vertical: c.vertical,
                parentExternalId: c.parentId ?? null,
                icon: c.icon,
                itemCount: c.itemCount,
                isActive: c.isActive,
                sortOrder: c.sortOrder,
                attributeIdsJson: JSON.stringify(c.attributeIds ?? []),
                allowedUnitIdsJson: JSON.stringify(c.allowedUnitIds ?? []),
              }))
            )
            .onConflictDoNothing();
        }

        // Seed Admin Master Sellers (sel_01..sel_10) if not yet seeded
        const existingAdminSeller = await db
          .select({ id: sellers.id })
          .from(sellers)
          .where(eq(sellers.code, 'sel_01'))
          .limit(1);

        if (existingAdminSeller.length === 0 && fallbackVillageId) {
          await db
            .insert(sellers)
            .values(
              ADMIN_SEED_SELLERS.map((s) => ({
                code: s.id,
                ownerName: s.ownerName,
                publicName: s.name,
                businessType: s.businessType || 'MULTI_CATEGORY',
                primaryVertical: s.vertical,
                contactPhone: s.phone,
                email: s.email ?? null,
                logoInitials: s.logoInitials ?? null,
                logoBgClass: s.logoBgClass ?? null,
                villageId:
                  villageByCode.get(s.villageId) ??
                  villageByCode.get(s.villageId.replace(/^v-/, '')) ??
                  fallbackVillageId,
                shopAddress: s.shopAddress || s.villageName,
                district: s.district || 'Unnao',
                state: s.state || 'Uttar Pradesh',
                pinCode: s.pinCode ?? null,
                serviceableVillageIdsJson: JSON.stringify(s.serviceableVillageIds ?? [s.villageId]),
                supportedVerticalsJson: JSON.stringify(s.supportedVerticals ?? [s.vertical]),
                fulfilmentModesJson: JSON.stringify(s.fulfilmentModes ?? ['DELIVERY', 'PICKUP']),
                openingHours: s.openingHours ?? '08:00 AM - 09:30 PM',
                status: s.status,
                kycStatus: s.kycStatus ?? 'APPROVED',
                isOpenNow: s.status === 'ACTIVE',
                isPaused: s.status === 'PAUSED' || s.status === 'INACTIVE',
                ratingAvg: s.rating.toFixed(2),
                totalOrders: s.totalOrders,
                gmvAmount: (s.gmvPaise / 100).toFixed(2),
                commissionRateBps: s.commissionRateBps,
                suspensionReason: s.suspensionReason ?? null,
                rejectionReason: s.rejectionReason ?? null,
                kycChangeRequestNotes: s.kycChangeRequestNotes ?? null,
                bankAccountHolder: s.bankAccountHolder ?? null,
                bankAccountNumberMasked: s.bankAccountNumberMasked ?? null,
                ifscCode: s.ifscCode ?? null,
                aliasIdsJson: JSON.stringify(s.aliasIds ?? []),
                fssaiVerified: s.fssaiVerified,
                joinedAt: s.joinedAt,
                kycDocumentsJson: JSON.stringify(s.kycDocuments ?? []),
                activityHistoryJson: JSON.stringify(s.activityHistory ?? []),
              }))
            )
            .onConflictDoNothing();
        }

        // Seed Admin Universal Products if table is empty
        const existingProducts = await db
          .select({ id: adminProducts.id })
          .from(adminProducts)
          .limit(1);

        if (existingProducts.length === 0) {
          const allSellers = await db.select({ id: sellers.id, code: sellers.code }).from(sellers);
          const sellerIdByCode = new Map(allSellers.map((s) => [s.code, s.id]));

          await db
            .insert(adminProducts)
            .values(
              ADMIN_SEED_PRODUCTS.map((p) => ({
                externalId: p.id,
                sku: p.sku,
                name: p.name,
                hindiName: p.hindiName ?? null,
                description: p.description ?? null,
                vertical: p.vertical,
                categoryExternalId: p.categoryId,
                subcategoryExternalId: p.subcategoryId ?? null,
                brandId: p.brandId ?? null,
                sellerId: sellerIdByCode.get(p.sellerId) ?? null,
                sellerExternalId: p.sellerId,
                sellerName: p.sellerName,
                unitId: p.unitId,
                inventoryMode: p.inventoryMode,
                mrpAmount: (p.mrpPaise / 100).toFixed(2),
                sellingPrice: (p.pricePaise / 100).toFixed(2),
                stockQuantity:
                  p.stockQuantity !== undefined ? Number(p.stockQuantity).toFixed(3) : null,
                lowStockThreshold:
                  p.lowStockThreshold !== undefined ? Number(p.lowStockThreshold).toFixed(3) : null,
                prepTimeMinutes: p.prepTimeMinutes ?? null,
                leadTimeDays: p.leadTimeDays ?? null,
                dietType: p.dietType ?? null,
                attributesJson: JSON.stringify(p.attributes ?? {}),
                variantsJson: JSON.stringify(p.variants ?? []),
                optionGroupIdsJson: JSON.stringify(p.optionGroupIds ?? []),
                moderationStatus: p.moderationStatus,
                moderationNotes: p.moderationNotes ?? null,
                isActive: p.isActive,
                isAvailable: p.isAvailable,
              }))
            )
            .onConflictDoNothing();
        }
      } catch (error) {
        adminSeedPromise = null;
        console.error('Database Error in seedAdminCatalogIfEmpty:', error);
        throw new Error('Failed to initialize admin catalog data.', { cause: error });
      }
    })();
  }
  return adminSeedPromise;
}

// =========================================================================
// MAPPERS
// =========================================================================
function mapCategoryRow(row: typeof adminCategories.$inferSelect): CategoryRecord {
  return {
    id: row.externalId,
    name: row.name,
    hindiName: row.hindiName,
    vertical: row.vertical,
    parentId: row.parentExternalId ?? undefined,
    icon: row.icon,
    itemCount: row.itemCount,
    isActive: row.isActive,
    sortOrder: row.sortOrder,
    attributeIds: safeJsonParse<string[]>(row.attributeIdsJson, []),
    allowedUnitIds: safeJsonParse<string[]>(row.allowedUnitIdsJson, []),
  };
}

function mapProductRow(row: typeof adminProducts.$inferSelect): UniversalProductRecord {
  return {
    id: row.externalId,
    sku: row.sku,
    name: row.name,
    hindiName: row.hindiName ?? undefined,
    description: row.description ?? undefined,
    vertical: row.vertical,
    categoryId: row.categoryExternalId,
    subcategoryId: row.subcategoryExternalId ?? undefined,
    brandId: row.brandId ?? undefined,
    sellerId: row.sellerExternalId,
    sellerName: row.sellerName,
    unitId: row.unitId,
    inventoryMode: row.inventoryMode as InventoryMode,
    mrpPaise: Math.round(Number(row.mrpAmount) * 100),
    pricePaise: Math.round(Number(row.sellingPrice) * 100),
    stockQuantity: row.stockQuantity !== null ? Number(row.stockQuantity) : undefined,
    lowStockThreshold: row.lowStockThreshold !== null ? Number(row.lowStockThreshold) : undefined,
    prepTimeMinutes: row.prepTimeMinutes ?? undefined,
    leadTimeDays: row.leadTimeDays ?? undefined,
    dietType: (row.dietType as 'VEG' | 'NON_VEG' | 'EGG' | null) ?? undefined,
    attributes: safeJsonParse<Record<string, string | number | boolean>>(row.attributesJson, {}),
    variants: safeJsonParse<ProductVariantRecord[]>(row.variantsJson, []),
    optionGroupIds: safeJsonParse<string[]>(row.optionGroupIdsJson, []),
    moderationStatus: row.moderationStatus as ProductModerationStatus,
    moderationNotes: row.moderationNotes ?? undefined,
    isActive: row.isActive,
    isAvailable: row.isAvailable,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function mapSellerRow(
  row: typeof sellers.$inferSelect,
  villageMap: Map<number, typeof villages.$inferSelect>,
  includePrivateDetails: boolean
): MasterSellerRecord {
  const village = villageMap.get(row.villageId);
  const villageCode = village?.code || 'v-rampur';
  const normalizedVillageId = villageCode.startsWith('v-') ? villageCode : `v-${villageCode}`;

  const base: MasterSellerRecord = {
    id: row.code,
    name: row.publicName,
    ownerName: row.ownerName || row.publicName,
    businessType: (row.businessType as SellerBusinessType) || 'MULTI_CATEGORY',
    phone: includePrivateDetails ? row.contactPhone : row.contactPhone,
    email: includePrivateDetails ? row.email ?? undefined : undefined,
    logoInitials:
      row.logoInitials ||
      row.publicName
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((p) => p[0]?.toUpperCase() || '')
        .join('') ||
      'GB',
    logoBgClass: row.logoBgClass || 'bg-emerald-100 text-emerald-800',
    shopAddress: row.shopAddress,
    villageId: normalizedVillageId,
    villageName: village?.name || 'Rampur',
    district: row.district || village?.district || 'Unnao',
    state: row.state || village?.state || 'Uttar Pradesh',
    pinCode: row.pinCode ?? undefined,
    serviceableVillageIds: safeJsonParse<string[]>(row.serviceableVillageIdsJson, [
      normalizedVillageId,
    ]),
    vertical: row.primaryVertical,
    supportedVerticals: safeJsonParse<string[]>(row.supportedVerticalsJson, [
      row.primaryVertical,
    ]),
    fulfilmentModes: safeJsonParse<('DELIVERY' | 'PICKUP')[]>(row.fulfilmentModesJson, [
      'DELIVERY',
      'PICKUP',
    ]),
    openingHours: row.openingHours ?? '08:00 AM - 09:30 PM',
    status: (row.status as SellerAccountStatus) || 'ACTIVE',
    kycStatus: (row.kycStatus as SellerKycStatus) || 'APPROVED',
    rating: Number(row.ratingAvg) || 0,
    totalOrders: row.totalOrders,
    gmvPaise: Math.round(Number(row.gmvAmount) * 100),
    commissionRateBps: row.commissionRateBps,
    suspensionReason: row.suspensionReason ?? undefined,
    rejectionReason: row.rejectionReason ?? undefined,
    kycChangeRequestNotes: row.kycChangeRequestNotes ?? undefined,
    aliasIds: safeJsonParse<string[]>(row.aliasIdsJson, []),
    fssaiVerified: row.fssaiVerified,
    joinedAt: row.joinedAt || row.createdAt.toISOString().split('T')[0],
  };

  if (includePrivateDetails) {
    base.bankAccountHolder = row.bankAccountHolder ?? undefined;
    base.bankAccountNumberMasked = row.bankAccountNumberMasked ?? undefined;
    base.ifscCode = row.ifscCode ?? undefined;
    base.kycDocuments = safeJsonParse<SellerKycDocumentRecord[]>(row.kycDocumentsJson, []);
    base.activityHistory = safeJsonParse<SellerActivityEvent[]>(row.activityHistoryJson, []);
  }

  return base;
}

// =========================================================================
// CATEGORIES CRUD
// =========================================================================
export async function listAdminCategories(): Promise<CategoryRecord[]> {
  try {
    await seedAdminCatalogIfEmpty();
    const rows = await db
      .select()
      .from(adminCategories)
      .orderBy(asc(adminCategories.sortOrder), asc(adminCategories.id));
    return rows.map(mapCategoryRow);
  } catch (error) {
    console.error('Database Error in listAdminCategories:', error);
    throw new Error('Failed to fetch categories.', { cause: error });
  }
}

export async function createAdminCategory(
  input: Omit<CategoryRecord, 'id' | 'itemCount'> & { id?: string }
): Promise<CategoryRecord> {
  try {
    await seedAdminCatalogIfEmpty();
    const externalId = input.id?.trim() || `cat_${Date.now()}`;
    const [created] = await db
      .insert(adminCategories)
      .values({
        externalId,
        name: input.name.trim(),
        hindiName: (input.hindiName || '').trim(),
        vertical: input.vertical.trim().toUpperCase(),
        parentExternalId: input.parentId || null,
        icon: input.icon || 'Layers',
        itemCount: 0,
        isActive: input.isActive ?? true,
        sortOrder: Number.isFinite(input.sortOrder) ? input.sortOrder : 0,
        attributeIdsJson: JSON.stringify(input.attributeIds ?? []),
        allowedUnitIdsJson: JSON.stringify(input.allowedUnitIds ?? []),
      })
      .returning();

    return mapCategoryRow(created);
  } catch (error) {
    console.error('Database Error in createAdminCategory:', error);
    throw new Error('Failed to create category.', { cause: error });
  }
}

export async function updateAdminCategory(
  externalId: string,
  patch: Partial<CategoryRecord>
): Promise<CategoryRecord | null> {
  try {
    const [existing] = await db
      .select()
      .from(adminCategories)
      .where(eq(adminCategories.externalId, externalId))
      .limit(1);
    if (!existing) return null;

    const [updated] = await db
      .update(adminCategories)
      .set({
        name: patch.name !== undefined ? patch.name.trim() : existing.name,
        hindiName: patch.hindiName !== undefined ? patch.hindiName.trim() : existing.hindiName,
        vertical:
          patch.vertical !== undefined ? patch.vertical.trim().toUpperCase() : existing.vertical,
        parentExternalId:
          patch.parentId !== undefined ? patch.parentId || null : existing.parentExternalId,
        icon: patch.icon !== undefined ? patch.icon : existing.icon,
        itemCount:
          patch.itemCount !== undefined && Number.isFinite(patch.itemCount)
            ? patch.itemCount
            : existing.itemCount,
        isActive: patch.isActive !== undefined ? patch.isActive : existing.isActive,
        sortOrder:
          patch.sortOrder !== undefined && Number.isFinite(patch.sortOrder)
            ? patch.sortOrder
            : existing.sortOrder,
        attributeIdsJson:
          patch.attributeIds !== undefined
            ? JSON.stringify(patch.attributeIds)
            : existing.attributeIdsJson,
        allowedUnitIdsJson:
          patch.allowedUnitIds !== undefined
            ? JSON.stringify(patch.allowedUnitIds)
            : existing.allowedUnitIdsJson,
        updatedAt: new Date(),
      })
      .where(eq(adminCategories.id, existing.id))
      .returning();

    return mapCategoryRow(updated);
  } catch (error) {
    console.error('Database Error in updateAdminCategory:', error);
    throw new Error('Failed to update category.', { cause: error });
  }
}

export async function toggleAdminCategoryStatus(
  externalId: string
): Promise<CategoryRecord | null> {
  try {
    const [existing] = await db
      .select()
      .from(adminCategories)
      .where(eq(adminCategories.externalId, externalId))
      .limit(1);
    if (!existing) return null;

    const [updated] = await db
      .update(adminCategories)
      .set({
        isActive: !existing.isActive,
        updatedAt: new Date(),
      })
      .where(eq(adminCategories.id, existing.id))
      .returning();

    return mapCategoryRow(updated);
  } catch (error) {
    console.error('Database Error in toggleAdminCategoryStatus:', error);
    throw new Error('Failed to toggle category status.', { cause: error });
  }
}

export async function deleteAdminCategory(externalId: string): Promise<boolean> {
  try {
    return await db.transaction(async (tx) => {
      const deleted = await tx
        .delete(adminCategories)
        .where(
          or(
            eq(adminCategories.externalId, externalId),
            eq(adminCategories.parentExternalId, externalId)
          )
        )
        .returning({ id: adminCategories.id });
      return deleted.length > 0;
    });
  } catch (error) {
    console.error('Database Error in deleteAdminCategory:', error);
    throw new Error('Failed to delete category.', { cause: error });
  }
}

// =========================================================================
// PRODUCTS CRUD
// =========================================================================
export async function listAdminProducts(): Promise<UniversalProductRecord[]> {
  try {
    await seedAdminCatalogIfEmpty();
    const rows = await db
      .select()
      .from(adminProducts)
      .orderBy(desc(adminProducts.createdAt), desc(adminProducts.id));
    return rows.map(mapProductRow);
  } catch (error) {
    console.error('Database Error in listAdminProducts:', error);
    throw new Error('Failed to fetch products.', { cause: error });
  }
}

export async function createAdminProduct(
  input: Omit<UniversalProductRecord, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }
): Promise<UniversalProductRecord> {
  try {
    await seedAdminCatalogIfEmpty();
    const externalId = input.id?.trim() || `prod_${Date.now()}`;
    const sku = input.sku?.trim() || `GB-${Date.now()}`;

    const [matchedSeller] = await db
      .select({ id: sellers.id })
      .from(sellers)
      .where(eq(sellers.code, input.sellerId))
      .limit(1);

    const [created] = await db
      .insert(adminProducts)
      .values({
        externalId,
        sku,
        name: input.name.trim(),
        hindiName: input.hindiName?.trim() || null,
        description: input.description?.trim() || null,
        vertical: input.vertical.trim().toUpperCase(),
        categoryExternalId: input.categoryId,
        subcategoryExternalId: input.subcategoryId || null,
        brandId: input.brandId || null,
        sellerId: matchedSeller?.id ?? null,
        sellerExternalId: input.sellerId,
        sellerName: input.sellerName,
        unitId: input.unitId || 'unit_piece',
        inventoryMode: input.inventoryMode || 'QUANTITY_STOCK',
        mrpAmount: (Math.max(0, Number(input.mrpPaise) || 0) / 100).toFixed(2),
        sellingPrice: (Math.max(0, Number(input.pricePaise) || 0) / 100).toFixed(2),
        stockQuantity:
          input.stockQuantity !== undefined && Number.isFinite(input.stockQuantity)
            ? Math.max(0, input.stockQuantity).toFixed(3)
            : null,
        lowStockThreshold:
          input.lowStockThreshold !== undefined && Number.isFinite(input.lowStockThreshold)
            ? Math.max(0, input.lowStockThreshold).toFixed(3)
            : null,
        prepTimeMinutes: input.prepTimeMinutes ?? null,
        leadTimeDays: input.leadTimeDays ?? null,
        dietType: input.dietType ?? null,
        attributesJson: JSON.stringify(input.attributes ?? {}),
        variantsJson: JSON.stringify(input.variants ?? []),
        optionGroupIdsJson: JSON.stringify(input.optionGroupIds ?? []),
        moderationStatus: input.moderationStatus || 'PENDING_REVIEW',
        moderationNotes: input.moderationNotes ?? null,
        isActive: input.isActive ?? true,
        isAvailable: input.isAvailable ?? true,
      })
      .returning();

    return mapProductRow(created);
  } catch (error) {
    console.error('Database Error in createAdminProduct:', error);
    throw new Error('Failed to create product.', { cause: error });
  }
}

export async function updateAdminProduct(
  externalId: string,
  patch: Partial<UniversalProductRecord>
): Promise<UniversalProductRecord | null> {
  try {
    const [existing] = await db
      .select()
      .from(adminProducts)
      .where(eq(adminProducts.externalId, externalId))
      .limit(1);
    if (!existing) return null;

    let nextSellerId = existing.sellerId;
    if (patch.sellerId && patch.sellerId !== existing.sellerExternalId) {
      const [matchedSeller] = await db
        .select({ id: sellers.id })
        .from(sellers)
        .where(eq(sellers.code, patch.sellerId))
        .limit(1);
      nextSellerId = matchedSeller?.id ?? null;
    }

    const [updated] = await db
      .update(adminProducts)
      .set({
        sku: patch.sku !== undefined ? patch.sku.trim() : existing.sku,
        name: patch.name !== undefined ? patch.name.trim() : existing.name,
        hindiName: patch.hindiName !== undefined ? patch.hindiName || null : existing.hindiName,
        description:
          patch.description !== undefined ? patch.description || null : existing.description,
        vertical:
          patch.vertical !== undefined ? patch.vertical.trim().toUpperCase() : existing.vertical,
        categoryExternalId:
          patch.categoryId !== undefined ? patch.categoryId : existing.categoryExternalId,
        subcategoryExternalId:
          patch.subcategoryId !== undefined
            ? patch.subcategoryId || null
            : existing.subcategoryExternalId,
        brandId: patch.brandId !== undefined ? patch.brandId || null : existing.brandId,
        sellerId: nextSellerId,
        sellerExternalId:
          patch.sellerId !== undefined ? patch.sellerId : existing.sellerExternalId,
        sellerName: patch.sellerName !== undefined ? patch.sellerName : existing.sellerName,
        unitId: patch.unitId !== undefined ? patch.unitId : existing.unitId,
        inventoryMode:
          patch.inventoryMode !== undefined ? patch.inventoryMode : existing.inventoryMode,
        mrpAmount:
          patch.mrpPaise !== undefined && Number.isFinite(patch.mrpPaise)
            ? (Math.max(0, patch.mrpPaise) / 100).toFixed(2)
            : existing.mrpAmount,
        sellingPrice:
          patch.pricePaise !== undefined && Number.isFinite(patch.pricePaise)
            ? (Math.max(0, patch.pricePaise) / 100).toFixed(2)
            : existing.sellingPrice,
        stockQuantity:
          patch.stockQuantity !== undefined && Number.isFinite(patch.stockQuantity)
            ? Math.max(0, patch.stockQuantity).toFixed(3)
            : existing.stockQuantity,
        lowStockThreshold:
          patch.lowStockThreshold !== undefined && Number.isFinite(patch.lowStockThreshold)
            ? Math.max(0, patch.lowStockThreshold).toFixed(3)
            : existing.lowStockThreshold,
        prepTimeMinutes:
          patch.prepTimeMinutes !== undefined ? patch.prepTimeMinutes : existing.prepTimeMinutes,
        leadTimeDays:
          patch.leadTimeDays !== undefined ? patch.leadTimeDays : existing.leadTimeDays,
        dietType: patch.dietType !== undefined ? patch.dietType || null : existing.dietType,
        attributesJson:
          patch.attributes !== undefined
            ? JSON.stringify(patch.attributes)
            : existing.attributesJson,
        variantsJson:
          patch.variants !== undefined ? JSON.stringify(patch.variants) : existing.variantsJson,
        optionGroupIdsJson:
          patch.optionGroupIds !== undefined
            ? JSON.stringify(patch.optionGroupIds)
            : existing.optionGroupIdsJson,
        moderationStatus:
          patch.moderationStatus !== undefined ? patch.moderationStatus : existing.moderationStatus,
        moderationNotes:
          patch.moderationNotes !== undefined
            ? patch.moderationNotes || null
            : existing.moderationNotes,
        isActive: patch.isActive !== undefined ? patch.isActive : existing.isActive,
        isAvailable: patch.isAvailable !== undefined ? patch.isAvailable : existing.isAvailable,
        updatedAt: new Date(),
      })
      .where(eq(adminProducts.id, existing.id))
      .returning();

    return mapProductRow(updated);
  } catch (error) {
    console.error('Database Error in updateAdminProduct:', error);
    throw new Error('Failed to update product.', { cause: error });
  }
}

export async function moderateAdminProduct(
  externalId: string,
  status: ProductModerationStatus,
  notes: string
): Promise<UniversalProductRecord | null> {
  try {
    const [existing] = await db
      .select()
      .from(adminProducts)
      .where(eq(adminProducts.externalId, externalId))
      .limit(1);
    if (!existing) return null;

    const [updated] = await db
      .update(adminProducts)
      .set({
        moderationStatus: status,
        moderationNotes: notes,
        isAvailable: status === 'APPROVED' ? true : existing.isAvailable,
        updatedAt: new Date(),
      })
      .where(eq(adminProducts.id, existing.id))
      .returning();

    return mapProductRow(updated);
  } catch (error) {
    console.error('Database Error in moderateAdminProduct:', error);
    throw new Error('Failed to moderate product.', { cause: error });
  }
}

export async function updateAdminProductInventory(
  externalId: string,
  stockQuantity: number,
  variantStocks?: Record<string, number>
): Promise<UniversalProductRecord | null> {
  try {
    const [existing] = await db
      .select()
      .from(adminProducts)
      .where(eq(adminProducts.externalId, externalId))
      .limit(1);
    if (!existing) return null;

    const existingVariants = safeJsonParse<ProductVariantRecord[]>(existing.variantsJson, []);
    const updatedVariants = variantStocks
      ? existingVariants.map((v) =>
          variantStocks[v.id] !== undefined
            ? {
                ...v,
                stockQuantity: Math.max(0, variantStocks[v.id]),
                isAvailable: variantStocks[v.id] > 0,
              }
            : v
        )
      : existingVariants;

    const totalStock =
      existing.inventoryMode === 'VARIANT_STOCK' && updatedVariants.length > 0
        ? updatedVariants.reduce((sum, v) => sum + v.stockQuantity, 0)
        : Math.max(0, stockQuantity);

    const nextAvailable =
      totalStock > 0 ||
      existing.inventoryMode === 'PREPARED_FOOD' ||
      existing.inventoryMode === 'MADE_TO_ORDER';

    const [updated] = await db
      .update(adminProducts)
      .set({
        stockQuantity: totalStock.toFixed(3),
        variantsJson: JSON.stringify(updatedVariants),
        isAvailable: nextAvailable,
        updatedAt: new Date(),
      })
      .where(eq(adminProducts.id, existing.id))
      .returning();

    return mapProductRow(updated);
  } catch (error) {
    console.error('Database Error in updateAdminProductInventory:', error);
    throw new Error('Failed to update product inventory.', { cause: error });
  }
}

export async function toggleAdminProductAvailability(
  externalId: string
): Promise<UniversalProductRecord | null> {
  try {
    const [existing] = await db
      .select()
      .from(adminProducts)
      .where(eq(adminProducts.externalId, externalId))
      .limit(1);
    if (!existing) return null;

    const [updated] = await db
      .update(adminProducts)
      .set({
        isAvailable: !existing.isAvailable,
        updatedAt: new Date(),
      })
      .where(eq(adminProducts.id, existing.id))
      .returning();

    return mapProductRow(updated);
  } catch (error) {
    console.error('Database Error in toggleAdminProductAvailability:', error);
    throw new Error('Failed to toggle product availability.', { cause: error });
  }
}

export async function deleteAdminProduct(externalId: string): Promise<boolean> {
  try {
    const deleted = await db
      .delete(adminProducts)
      .where(eq(adminProducts.externalId, externalId))
      .returning({ id: adminProducts.id });
    return deleted.length > 0;
  } catch (error) {
    console.error('Database Error in deleteAdminProduct:', error);
    throw new Error('Failed to delete product.', { cause: error });
  }
}

// =========================================================================
// SELLERS CRUD
// =========================================================================
export async function listAdminSellers(
  includePrivateDetails: boolean
): Promise<MasterSellerRecord[]> {
  try {
    await seedAdminCatalogIfEmpty();
    const [sellerRows, villageRows] = await Promise.all([
      db.select().from(sellers).orderBy(asc(sellers.id)),
      db.select().from(villages),
    ]);
    const villageMap = new Map(villageRows.map((v) => [v.id, v]));

    // Prioritize Admin Master Directory records (`sel_*`) alongside any onboarded sellers
    const adminManaged = sellerRows.filter((s) => !s.code.startsWith('seller_'));
    const targetRows = adminManaged.length > 0 ? adminManaged : sellerRows;

    return targetRows.map((row) => mapSellerRow(row, villageMap, includePrivateDetails));
  } catch (error) {
    console.error('Database Error in listAdminSellers:', error);
    throw new Error('Failed to fetch sellers.', { cause: error });
  }
}

export async function createAdminSeller(
  input: MasterSellerRecord
): Promise<MasterSellerRecord> {
  try {
    await seedAdminCatalogIfEmpty();
    const villageRows = await db.select().from(villages);
    const villageMap = new Map(villageRows.map((v) => [v.id, v]));
    const villageByCode = new Map(villageRows.map((v) => [v.code, v.id]));
    const matchedVillageId =
      villageByCode.get(input.villageId) ??
      villageByCode.get(input.villageId.replace(/^v-/, '')) ??
      villageRows[0]?.id;

    if (!matchedVillageId) {
      throw new Error('No village found for seller onboarding.');
    }

    const code = input.id?.trim() || `sel_${Date.now().toString().slice(-5)}`;
    const [created] = await db
      .insert(sellers)
      .values({
        code,
        ownerName: input.ownerName,
        publicName: input.name,
        businessType: input.businessType || 'MULTI_CATEGORY',
        primaryVertical: input.vertical,
        contactPhone: input.phone,
        email: input.email ?? null,
        logoInitials: input.logoInitials ?? null,
        logoBgClass: input.logoBgClass ?? null,
        villageId: matchedVillageId,
        shopAddress: input.shopAddress || input.villageName,
        district: input.district || 'Unnao',
        state: input.state || 'Uttar Pradesh',
        pinCode: input.pinCode ?? null,
        serviceableVillageIdsJson: JSON.stringify(
          input.serviceableVillageIds ?? [input.villageId]
        ),
        supportedVerticalsJson: JSON.stringify(input.supportedVerticals ?? [input.vertical]),
        fulfilmentModesJson: JSON.stringify(input.fulfilmentModes ?? ['DELIVERY', 'PICKUP']),
        openingHours: input.openingHours ?? '09:00 AM - 09:00 PM',
        status: input.status || 'ACTIVE',
        kycStatus: input.kycStatus || 'APPROVED',
        isOpenNow: (input.status || 'ACTIVE') === 'ACTIVE',
        isPaused: input.status === 'PAUSED' || input.status === 'INACTIVE',
        ratingAvg: (input.rating ?? 5).toFixed(2),
        totalOrders: input.totalOrders ?? 0,
        gmvAmount: ((input.gmvPaise ?? 0) / 100).toFixed(2),
        commissionRateBps: input.commissionRateBps ?? 400,
        bankAccountHolder: input.bankAccountHolder ?? null,
        bankAccountNumberMasked: input.bankAccountNumberMasked ?? null,
        ifscCode: input.ifscCode ?? null,
        aliasIdsJson: JSON.stringify(input.aliasIds ?? []),
        fssaiVerified: Boolean(input.fssaiVerified),
        joinedAt: input.joinedAt || new Date().toISOString().split('T')[0],
        kycDocumentsJson: JSON.stringify(input.kycDocuments ?? []),
        activityHistoryJson: JSON.stringify(input.activityHistory ?? []),
      })
      .returning();

    return mapSellerRow(created, villageMap, true);
  } catch (error) {
    console.error('Database Error in createAdminSeller:', error);
    throw new Error('Failed to create seller.', { cause: error });
  }
}

export async function updateAdminSellerStatus(params: {
  sellerCode: string;
  status: SellerAccountStatus;
  reason: string;
  actorName: string;
}): Promise<MasterSellerRecord | null> {
  try {
    const [existing] = await db
      .select()
      .from(sellers)
      .where(eq(sellers.code, params.sellerCode))
      .limit(1);
    if (!existing) return null;

    const nowIso = new Date().toISOString();
    const prevStatus = existing.status as SellerAccountStatus;
    let nextKycStatus = existing.kycStatus as SellerKycStatus;
    let eventType: SellerActivityEvent['type'] = 'ADMIN_ACTION';
    let eventTitle = `Status changed to ${params.status.replace(/_/g, ' ')}`;

    if (params.status === 'APPROVED') {
      nextKycStatus = 'APPROVED';
      eventType = 'KYC_APPROVED';
      eventTitle = 'Seller Approved';
    } else if (params.status === 'REJECTED') {
      nextKycStatus = 'REJECTED';
      eventType = 'KYC_REJECTED';
      eventTitle = 'Seller Rejected';
    } else if (params.status === 'ACTIVE') {
      eventType = prevStatus === 'SUSPENDED' ? 'STORE_UNSUSPENDED' : 'STORE_ACTIVATED';
      eventTitle =
        prevStatus === 'SUSPENDED' ? 'Seller Unsuspended & Activated' : 'Store Activated';
      if (!nextKycStatus || nextKycStatus === 'PENDING' || nextKycStatus === 'UNDER_REVIEW') {
        nextKycStatus = 'APPROVED';
      }
    } else if (params.status === 'INACTIVE' || params.status === 'PAUSED') {
      eventType = 'STORE_DEACTIVATED';
      eventTitle = 'Store Deactivated';
    } else if (params.status === 'SUSPENDED') {
      eventType = 'STORE_SUSPENDED';
      eventTitle = 'Store Suspended';
    } else if (params.status === 'KYC_PENDING') {
      nextKycStatus = 'CHANGES_REQUESTED';
      eventType = 'KYC_CHANGES_REQUESTED';
      eventTitle = 'KYC Changes Requested';
    }

    const newActivity: SellerActivityEvent = {
      id: `act_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      type: eventType,
      title: eventTitle,
      description: `Status updated from ${prevStatus.replace(/_/g, ' ')} to ${params.status.replace(/_/g, ' ')}.${params.reason ? ` Note: ${params.reason}` : ''}`,
      actor: params.actorName,
      timestamp: nowIso,
      reason: params.reason || undefined,
    };

    const currentHistory = safeJsonParse<SellerActivityEvent[]>(existing.activityHistoryJson, []);

    const [updated] = await db
      .update(sellers)
      .set({
        status: params.status,
        kycStatus: nextKycStatus,
        isOpenNow: params.status === 'ACTIVE',
        isPaused: params.status === 'PAUSED' || params.status === 'INACTIVE',
        suspensionReason:
          params.status === 'SUSPENDED'
            ? params.reason
            : params.status === 'ACTIVE'
            ? null
            : existing.suspensionReason,
        rejectionReason:
          params.status === 'REJECTED'
            ? params.reason
            : params.status === 'APPROVED' || params.status === 'ACTIVE'
            ? null
            : existing.rejectionReason,
        kycChangeRequestNotes:
          params.status === 'KYC_PENDING'
            ? params.reason
            : params.status === 'APPROVED'
            ? null
            : existing.kycChangeRequestNotes,
        activityHistoryJson: JSON.stringify([newActivity, ...currentHistory]),
        updatedAt: new Date(),
      })
      .where(eq(sellers.id, existing.id))
      .returning();

    const villageRows = await db.select().from(villages);
    const villageMap = new Map(villageRows.map((v) => [v.id, v]));
    return mapSellerRow(updated, villageMap, true);
  } catch (error) {
    console.error('Database Error in updateAdminSellerStatus:', error);
    throw new Error('Failed to update seller status.', { cause: error });
  }
}

export async function updateAdminSellerConfig(params: {
  sellerCode: string;
  patch: Partial<MasterSellerRecord>;
  actorName: string;
}): Promise<MasterSellerRecord | null> {
  try {
    const [existing] = await db
      .select()
      .from(sellers)
      .where(eq(sellers.code, params.sellerCode))
      .limit(1);
    if (!existing) return null;

    const patch = params.patch;
    const nowIso = new Date().toISOString();
    const currentHistory = safeJsonParse<SellerActivityEvent[]>(existing.activityHistoryJson, []);
    const newActivity: SellerActivityEvent = {
      id: `act_${Date.now()}_cfg`,
      type: 'ADMIN_ACTION',
      title: 'Store Configuration Updated',
      description: 'Updated store configuration settings (commission, hours, verticals, or serviceability).',
      actor: params.actorName,
      timestamp: nowIso,
    };

    const [updated] = await db
      .update(sellers)
      .set({
        publicName: patch.name !== undefined ? patch.name.trim() : existing.publicName,
        ownerName: patch.ownerName !== undefined ? patch.ownerName.trim() : existing.ownerName,
        businessType: patch.businessType !== undefined ? patch.businessType : existing.businessType,
        primaryVertical:
          patch.vertical !== undefined ? patch.vertical : existing.primaryVertical,
        contactPhone: patch.phone !== undefined ? patch.phone.trim() : existing.contactPhone,
        email: patch.email !== undefined ? patch.email || null : existing.email,
        shopAddress:
          patch.shopAddress !== undefined ? patch.shopAddress : existing.shopAddress,
        openingHours:
          patch.openingHours !== undefined ? patch.openingHours : existing.openingHours,
        commissionRateBps:
          patch.commissionRateBps !== undefined && Number.isFinite(patch.commissionRateBps)
            ? patch.commissionRateBps
            : existing.commissionRateBps,
        serviceableVillageIdsJson:
          patch.serviceableVillageIds !== undefined
            ? JSON.stringify(patch.serviceableVillageIds)
            : existing.serviceableVillageIdsJson,
        supportedVerticalsJson:
          patch.supportedVerticals !== undefined
            ? JSON.stringify(patch.supportedVerticals)
            : existing.supportedVerticalsJson,
        fulfilmentModesJson:
          patch.fulfilmentModes !== undefined
            ? JSON.stringify(patch.fulfilmentModes)
            : existing.fulfilmentModesJson,
        fssaiVerified:
          patch.fssaiVerified !== undefined ? patch.fssaiVerified : existing.fssaiVerified,
        bankAccountHolder:
          patch.bankAccountHolder !== undefined
            ? patch.bankAccountHolder || null
            : existing.bankAccountHolder,
        ifscCode: patch.ifscCode !== undefined ? patch.ifscCode || null : existing.ifscCode,
        activityHistoryJson: JSON.stringify([newActivity, ...currentHistory]),
        updatedAt: new Date(),
      })
      .where(eq(sellers.id, existing.id))
      .returning();

    const villageRows = await db.select().from(villages);
    const villageMap = new Map(villageRows.map((v) => [v.id, v]));
    return mapSellerRow(updated, villageMap, true);
  } catch (error) {
    console.error('Database Error in updateAdminSellerConfig:', error);
    throw new Error('Failed to update seller configuration.', { cause: error });
  }
}

export async function updateAdminSellerKycDocument(params: {
  sellerCode: string;
  docId: string;
  status: SellerDocumentStatus;
  note?: string;
  actorName: string;
}): Promise<MasterSellerRecord | null> {
  try {
    const [existing] = await db
      .select()
      .from(sellers)
      .where(eq(sellers.code, params.sellerCode))
      .limit(1);
    if (!existing) return null;

    const docs = safeJsonParse<SellerKycDocumentRecord[]>(existing.kycDocumentsJson, []);
    const targetDoc = docs.find((d) => d.id === params.docId);
    if (!targetDoc) return null;

    const nowIso = new Date().toISOString();
    const finalNote =
      params.note?.trim() ||
      (params.status === 'APPROVED'
        ? `${targetDoc.label} verified and approved.`
        : params.status === 'REJECTED'
        ? `${targetDoc.label} rejected during compliance review.`
        : `Requested re-upload / changes for ${targetDoc.label}.`);

    const updatedDocs: SellerKycDocumentRecord[] = docs.map((d) =>
      d.id === params.docId
        ? {
            ...d,
            status: params.status,
            rejectionReason:
              params.status === 'REJECTED' || params.status === 'CHANGES_REQUESTED'
                ? finalNote
                : undefined,
            history: [
              ...d.history,
              {
                status: params.status,
                actor: params.actorName,
                timestamp: nowIso,
                note: finalNote,
              },
            ],
          }
        : d
    );

    const hasRejected = updatedDocs.some((d) => d.status === 'REJECTED');
    const hasChangesReq = updatedDocs.some((d) => d.status === 'CHANGES_REQUESTED');
    const allApproved =
      updatedDocs.length > 0 && updatedDocs.every((d) => d.status === 'APPROVED');

    const derivedKycStatus: SellerKycStatus = allApproved
      ? 'APPROVED'
      : hasRejected
      ? 'REJECTED'
      : hasChangesReq
      ? 'CHANGES_REQUESTED'
      : 'UNDER_REVIEW';

    const fssaiDoc = updatedDocs.find((d) => d.code === 'FSSAI');
    const currentHistory = safeJsonParse<SellerActivityEvent[]>(existing.activityHistoryJson, []);

    const newActivity: SellerActivityEvent = {
      id: `act_${Date.now()}_doc`,
      type:
        params.status === 'APPROVED'
          ? 'DOC_UPDATED'
          : params.status === 'REJECTED'
          ? 'KYC_REJECTED'
          : 'KYC_CHANGES_REQUESTED',
      title: `${targetDoc.label}: ${params.status.replace(/_/g, ' ')}`,
      description: finalNote,
      actor: params.actorName,
      timestamp: nowIso,
      reason: params.status !== 'APPROVED' ? finalNote : undefined,
    };

    const [updated] = await db
      .update(sellers)
      .set({
        kycDocumentsJson: JSON.stringify(updatedDocs),
        kycStatus: derivedKycStatus,
        fssaiVerified: fssaiDoc ? fssaiDoc.status === 'APPROVED' : existing.fssaiVerified,
        activityHistoryJson: JSON.stringify([newActivity, ...currentHistory]),
        updatedAt: new Date(),
      })
      .where(eq(sellers.id, existing.id))
      .returning();

    const villageRows = await db.select().from(villages);
    const villageMap = new Map(villageRows.map((v) => [v.id, v]));
    return mapSellerRow(updated, villageMap, true);
  } catch (error) {
    console.error('Database Error in updateAdminSellerKycDocument:', error);
    throw new Error('Failed to update seller KYC document.', { cause: error });
  }
}

export async function requestAdminSellerKycChanges(params: {
  sellerCode: string;
  reason: string;
  actorName: string;
}): Promise<MasterSellerRecord | null> {
  try {
    const [existing] = await db
      .select()
      .from(sellers)
      .where(eq(sellers.code, params.sellerCode))
      .limit(1);
    if (!existing) return null;

    const nowIso = new Date().toISOString();
    const currentHistory = safeJsonParse<SellerActivityEvent[]>(existing.activityHistoryJson, []);
    const newActivity: SellerActivityEvent = {
      id: `act_${Date.now()}_kyc_chg`,
      type: 'KYC_CHANGES_REQUESTED',
      title: 'KYC Changes Requested',
      description: params.reason,
      actor: params.actorName,
      timestamp: nowIso,
      reason: params.reason,
    };

    const nextStatus =
      existing.status === 'PENDING_APPROVAL' || existing.status === 'KYC_UNDER_REVIEW'
        ? 'KYC_PENDING'
        : existing.status;

    const [updated] = await db
      .update(sellers)
      .set({
        kycStatus: 'CHANGES_REQUESTED',
        status: nextStatus,
        kycChangeRequestNotes: params.reason,
        activityHistoryJson: JSON.stringify([newActivity, ...currentHistory]),
        updatedAt: new Date(),
      })
      .where(eq(sellers.id, existing.id))
      .returning();

    const villageRows = await db.select().from(villages);
    const villageMap = new Map(villageRows.map((v) => [v.id, v]));
    return mapSellerRow(updated, villageMap, true);
  } catch (error) {
    console.error('Database Error in requestAdminSellerKycChanges:', error);
    throw new Error('Failed to request seller KYC changes.', { cause: error });
  }
}
