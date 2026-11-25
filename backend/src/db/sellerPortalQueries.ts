import { and, desc, eq, inArray, sql } from 'drizzle-orm';
import { db } from './index.ts';
import {
  adminProducts,
  orderItems,
  orderStatusHistory,
  orders,
  sellerRunners,
  sellers,
} from './schema.ts';

export type RunnerRoleKey = 'Shop Runner' | 'Delivery Staff' | 'Family Helper';

export interface SellerStoreProfileDTO {
  id: string;
  publicName: string;
  contactPhone: string;
  upiId: string;
  deliveryRadiusKm: number;
  openingHours: string;
  isOpenNow: boolean;
  isPaused: boolean;
  minimumOrderPaise: number;
  packagingFeePaise: number;
  deliveryFeePaise: number;
  fssaiVerified: boolean;
  udhariEnabled: boolean;
  primaryVertical: string;
}

export interface SellerRunnerDTO {
  id: string;
  sellerId: string;
  name: string;
  phone: string;
  role: RunnerRoleKey;
  activeOrdersCount: number;
  isAvailable: boolean;
}

export interface SellerAnalyticsDTO {
  sellerId: string;
  days: number;
  summary: {
    totalOrders: number;
    completedOrders: number;
    pendingOrders: number;
    cancelledOrders: number;
    deliveredRevenuePaise: number;
    avgOrderValuePaise: number;
    codPendingPaise: number;
    uniqueCustomers: number;
  };
  paymentBreakdown: Record<string, { count: number; amountPaise: number }>;
  fulfilmentBreakdown: Record<string, number>;
  topProducts: Array<{
    name: string;
    unitsSold: number;
    revenuePaise: number;
  }>;
  dailySeries: Array<{
    dateKey: string;
    orders: number;
    revenuePaise: number;
  }>;
}

const DEFAULT_SEED_RUNNERS: Array<{
  suffix: string;
  name: string;
  phone: string;
  role: RunnerRoleKey;
  activeOrdersCount: number;
}> = [
  {
    suffix: 'run_1',
    name: 'Ramesh Patel',
    phone: '9876543220',
    role: 'Shop Runner',
    activeOrdersCount: 1,
  },
  {
    suffix: 'run_2',
    name: 'Mahesh Kumar',
    phone: '9876543221',
    role: 'Delivery Staff',
    activeOrdersCount: 0,
  },
  {
    suffix: 'run_3',
    name: 'Sonu Sharma',
    phone: '9876543222',
    role: 'Family Helper',
    activeOrdersCount: 0,
  },
];

const TERMINAL_STATUSES = new Set([
  'completed',
  'cancelled',
  'rejected',
  'returned',
  'refunded',
]);

function inrToPaise(val: string | number | null | undefined): number {
  const num = Number(val ?? 0);
  if (!Number.isFinite(num)) return 0;
  return Math.round(num * 100);
}

function paiseToInr(paise: number): string {
  const safe = Number.isFinite(paise) ? Math.max(0, Math.round(paise)) : 0;
  return (safe / 100).toFixed(2);
}

function safeJsonParse<T>(raw: string | null | undefined, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function mapSellerProfile(row: typeof sellers.$inferSelect): SellerStoreProfileDTO {
  const fallbackUpi = `${row.code.replace(/^seller_/, '').replace(/_/g, '.')}@upi`;
  return {
    id: row.code,
    publicName: row.publicName,
    contactPhone: row.contactPhone,
    upiId: row.upiId?.trim() || fallbackUpi,
    deliveryRadiusKm: row.deliveryRadiusKm ?? 5,
    openingHours: row.openingHours || '08:00 AM - 09:30 PM',
    isOpenNow: Boolean(row.isOpenNow),
    isPaused: Boolean(row.isPaused),
    minimumOrderPaise: inrToPaise(row.minimumOrderAmount),
    packagingFeePaise: inrToPaise(row.packagingFee),
    deliveryFeePaise: inrToPaise(row.deliveryFee),
    fssaiVerified: Boolean(row.fssaiVerified),
    udhariEnabled: Boolean(row.udhariEnabled),
    primaryVertical: row.primaryVertical,
  };
}

function mapRunnerRow(row: typeof sellerRunners.$inferSelect): SellerRunnerDTO {
  const role: RunnerRoleKey =
    row.role === 'Delivery Staff' || row.role === 'Family Helper'
      ? row.role
      : 'Shop Runner';
  return {
    id: row.externalId,
    sellerId: row.sellerCode,
    name: row.name,
    phone: row.phone,
    role,
    activeOrdersCount: row.activeOrdersCount,
    isAvailable: Boolean(row.isAvailable),
  };
}

export async function listPublicSellerProfiles(): Promise<SellerStoreProfileDTO[]> {
  const rows = await db.select().from(sellers);
  return rows.map(mapSellerProfile);
}

export async function getSellerStoreProfile(
  sellerCode: string
): Promise<SellerStoreProfileDTO | null> {
  const [row] = await db
    .select()
    .from(sellers)
    .where(eq(sellers.code, sellerCode))
    .limit(1);
  return row ? mapSellerProfile(row) : null;
}

export async function updateSellerStoreProfile(
  sellerCode: string,
  patch: Partial<{
    publicName: string;
    contactPhone: string;
    upiId: string;
    deliveryRadiusKm: number;
    openingHours: string;
    minimumOrderPaise: number;
    packagingFeePaise: number;
    deliveryFeePaise: number;
  }>
): Promise<SellerStoreProfileDTO | null> {
  const [existing] = await db
    .select()
    .from(sellers)
    .where(eq(sellers.code, sellerCode))
    .limit(1);

  if (!existing) return null;

  const [updated] = await db
    .update(sellers)
    .set({
      publicName:
        patch.publicName !== undefined ? patch.publicName.trim() : existing.publicName,
      contactPhone:
        patch.contactPhone !== undefined ? patch.contactPhone.trim() : existing.contactPhone,
      upiId: patch.upiId !== undefined ? patch.upiId.trim() : existing.upiId,
      deliveryRadiusKm:
        patch.deliveryRadiusKm !== undefined
          ? Math.max(1, Math.min(50, Math.round(patch.deliveryRadiusKm)))
          : existing.deliveryRadiusKm,
      openingHours:
        patch.openingHours !== undefined ? patch.openingHours.trim() : existing.openingHours,
      minimumOrderAmount:
        patch.minimumOrderPaise !== undefined
          ? paiseToInr(patch.minimumOrderPaise)
          : existing.minimumOrderAmount,
      packagingFee:
        patch.packagingFeePaise !== undefined
          ? paiseToInr(patch.packagingFeePaise)
          : existing.packagingFee,
      deliveryFee:
        patch.deliveryFeePaise !== undefined
          ? paiseToInr(patch.deliveryFeePaise)
          : existing.deliveryFee,
      updatedAt: new Date(),
    })
    .where(eq(sellers.id, existing.id))
    .returning();

  return mapSellerProfile(updated);
}

// ---------------------------------------------------------------------------
// In-House Runners & Dispatch Persistence
// ---------------------------------------------------------------------------

export async function ensureRunnersSeededForSeller(sellerCode: string): Promise<void> {
  const existing = await db
    .select({ id: sellerRunners.id })
    .from(sellerRunners)
    .where(eq(sellerRunners.sellerCode, sellerCode))
    .limit(1);

  if (existing.length > 0) return;

  await db
    .insert(sellerRunners)
    .values(
      DEFAULT_SEED_RUNNERS.map((r) => ({
        externalId: `${sellerCode}_${r.suffix}`,
        sellerCode,
        name: r.name,
        phone: r.phone,
        role: r.role,
        activeOrdersCount: r.activeOrdersCount,
        isAvailable: true,
      }))
    )
    .onConflictDoNothing();
}

export async function listSellerRunners(sellerCode: string): Promise<SellerRunnerDTO[]> {
  await ensureRunnersSeededForSeller(sellerCode);
  const rows = await db
    .select()
    .from(sellerRunners)
    .where(eq(sellerRunners.sellerCode, sellerCode))
    .orderBy(desc(sellerRunners.isAvailable), sellerRunners.id);
  return rows.map(mapRunnerRow);
}

export async function createSellerRunner(input: {
  sellerCode: string;
  name: string;
  phone: string;
  role: RunnerRoleKey;
}): Promise<SellerRunnerDTO> {
  await ensureRunnersSeededForSeller(input.sellerCode);
  const externalId = `${input.sellerCode}_run_${Date.now()}`;
  const [inserted] = await db
    .insert(sellerRunners)
    .values({
      externalId,
      sellerCode: input.sellerCode,
      name: input.name.trim(),
      phone: input.phone.trim(),
      role: input.role,
      activeOrdersCount: 0,
      isAvailable: true,
      updatedAt: new Date(),
    })
    .returning();
  return mapRunnerRow(inserted);
}

export async function updateSellerRunner(input: {
  sellerCode: string;
  runnerId: string;
  patch: Partial<{
    name: string;
    phone: string;
    role: RunnerRoleKey;
    isAvailable: boolean;
  }>;
}): Promise<SellerRunnerDTO | null> {
  const [existing] = await db
    .select()
    .from(sellerRunners)
    .where(
      and(
        eq(sellerRunners.sellerCode, input.sellerCode),
        eq(sellerRunners.externalId, input.runnerId)
      )
    )
    .limit(1);

  if (!existing) return null;

  const [updated] = await db
    .update(sellerRunners)
    .set({
      name: input.patch.name !== undefined ? input.patch.name.trim() : existing.name,
      phone: input.patch.phone !== undefined ? input.patch.phone.trim() : existing.phone,
      role: input.patch.role !== undefined ? input.patch.role : existing.role,
      isAvailable:
        typeof input.patch.isAvailable === 'boolean'
          ? input.patch.isAvailable
          : existing.isAvailable,
      updatedAt: new Date(),
    })
    .where(eq(sellerRunners.id, existing.id))
    .returning();

  return mapRunnerRow(updated);
}

export async function deleteSellerRunner(input: {
  sellerCode: string;
  runnerId: string;
}): Promise<boolean> {
  const deleted = await db
    .delete(sellerRunners)
    .where(
      and(
        eq(sellerRunners.sellerCode, input.sellerCode),
        eq(sellerRunners.externalId, input.runnerId)
      )
    )
    .returning({ id: sellerRunners.id });
  return deleted.length > 0;
}

export async function assignRunnerToSellerOrder(input: {
  sellerCode: string;
  orderNumber: string;
  runnerId: string;
}): Promise<{ runner: SellerRunnerDTO; orderUpdated: boolean } | null> {
  await ensureRunnersSeededForSeller(input.sellerCode);

  return db.transaction(async (tx) => {
    const [runner] = await tx
      .select()
      .from(sellerRunners)
      .where(
        and(
          eq(sellerRunners.sellerCode, input.sellerCode),
          eq(sellerRunners.externalId, input.runnerId)
        )
      )
      .limit(1);

    if (!runner) return null;

    const [updatedRunner] = await tx
      .update(sellerRunners)
      .set({
        activeOrdersCount: sql`${sellerRunners.activeOrdersCount} + 1`,
        updatedAt: new Date(),
      })
      .where(eq(sellerRunners.id, runner.id))
      .returning();

    let orderUpdated = false;
    const [sellerRow] = await tx
      .select({ id: sellers.id })
      .from(sellers)
      .where(eq(sellers.code, input.sellerCode))
      .limit(1);

    if (sellerRow) {
      const [orderRow] = await tx
        .select()
        .from(orders)
        .where(
          and(
            eq(orders.orderNumber, input.orderNumber),
            eq(orders.sellerId, sellerRow.id)
          )
        )
        .limit(1);

      if (orderRow) {
        await tx
          .update(orders)
          .set({
            assignedRunnerId: runner.externalId,
            assignedRunnerName: runner.name,
            updatedAt: new Date(),
          })
          .where(eq(orders.id, orderRow.id));

        await tx.insert(orderStatusHistory).values({
          orderId: orderRow.id,
          fromStatus: orderRow.status,
          toStatus: orderRow.status,
          actorRole: 'SELLER',
          reason: `Assigned in-house runner: ${runner.name} (${runner.role})`,
        });
        orderUpdated = true;
      }
    }

    return {
      runner: mapRunnerRow(updatedRunner),
      orderUpdated,
    };
  });
}

// ---------------------------------------------------------------------------
// Seller Orders Queue & Status Transitions
// ---------------------------------------------------------------------------

async function resolveSellerAndAliases(sellerCode: string): Promise<{
  sellerRow: typeof sellers.$inferSelect | null;
  allSellerCodes: string[];
}> {
  const [sellerRow] = await db
    .select()
    .from(sellers)
    .where(eq(sellers.code, sellerCode))
    .limit(1);

  if (!sellerRow) {
    return { sellerRow: null, allSellerCodes: [sellerCode] };
  }

  const aliases = safeJsonParse<string[]>(sellerRow.aliasIdsJson, []);
  const allSellerCodes = Array.from(new Set([sellerRow.code, ...aliases]));
  return { sellerRow, allSellerCodes };
}

export async function listSellerOrders(sellerCode: string) {
  const { sellerRow } = await resolveSellerAndAliases(sellerCode);
  if (!sellerRow) return [];

  const orderRows = await db
    .select()
    .from(orders)
    .where(eq(orders.sellerId, sellerRow.id))
    .orderBy(desc(orders.createdAt));

  if (orderRows.length === 0) return [];

  const orderIds = orderRows.map((o) => o.id);
  const [itemRows, historyRows] = await Promise.all([
    db.select().from(orderItems).where(inArray(orderItems.orderId, orderIds)),
    db
      .select()
      .from(orderStatusHistory)
      .where(inArray(orderStatusHistory.orderId, orderIds))
      .orderBy(orderStatusHistory.createdAt),
  ]);

  const itemsByOrder = new Map<number, typeof itemRows>();
  for (const item of itemRows) {
    const list = itemsByOrder.get(item.orderId) || [];
    list.push(item);
    itemsByOrder.set(item.orderId, list);
  }

  const historyByOrder = new Map<number, typeof historyRows>();
  for (const h of historyRows) {
    const list = historyByOrder.get(h.orderId) || [];
    list.push(h);
    historyByOrder.set(h.orderId, list);
  }

  return orderRows.map((ord) => ({
    id: `ord_db_${ord.id}`,
    orderNumber: ord.orderNumber,
    customerId: ord.customerUid,
    customerName: ord.customerName,
    customerPhone: ord.customerPhone,
    sellerId: sellerRow.code,
    sellerName: sellerRow.publicName,
    villageId: ord.villageCode,
    fulfilmentMode: ord.fulfilmentMode === 'PICKUP' ? 'PICKUP' : 'DELIVERY',
    deliveryAddress: safeJsonParse(ord.deliveryAddressJson, undefined),
    deliveryNote: ord.deliveryNote ?? undefined,
    items: (itemsByOrder.get(ord.id) || []).map((it) => ({
      productId: it.skuSnapshot || `item_${it.id}`,
      productName: it.productNameSnapshot,
      catalogueType: it.verticalSnapshot === 'FOOD' ? 'FOOD' : 'GROCERY',
      sku: it.skuSnapshot ?? undefined,
      unitPricePaise: inrToPaise(it.unitPriceSnapshot),
      requestedQuantity: Number(it.requestedQuantity),
      requestedUnitLabel: it.requestedUnitLabel,
      lineTotalPaise: inrToPaise(it.lineTotal),
      customerNote: it.customerNote ?? undefined,
    })),
    itemSubtotalPaise: inrToPaise(ord.itemSubtotal),
    deliveryFeePaise: inrToPaise(ord.deliveryFee),
    packagingFeePaise: inrToPaise(ord.packagingFee),
    platformFeePaise: inrToPaise(ord.platformFee),
    totalPaise: inrToPaise(ord.totalAmount),
    paymentMethod: ord.paymentMethod,
    paymentStatus: ord.paymentStatus,
    status: ord.status,
    assignedRunnerId: ord.assignedRunnerId ?? undefined,
    assignedRunnerName: ord.assignedRunnerName ?? undefined,
    cancellation: safeJsonParse(ord.cancellationJson, undefined),
    returnInfo: safeJsonParse(ord.returnInfoJson, undefined),
    refundInfo: safeJsonParse(ord.refundInfoJson, undefined),
    statusHistory: (historyByOrder.get(ord.id) || []).map((h) => ({
      id: `ev_db_${h.id}`,
      orderId: `ord_db_${ord.id}`,
      fromStatus: h.fromStatus || 'placed',
      toStatus: h.toStatus,
      actorRole: h.actorRole,
      reason: h.reason ?? undefined,
      timestamp: h.createdAt.toISOString(),
    })),
    createdAt: ord.createdAt.toISOString(),
    updatedAt: ord.updatedAt.toISOString(),
  }));
}

export async function transitionSellerOrderStatus(input: {
  sellerCode: string;
  orderNumber: string;
  nextStatus: string;
  reason?: string;
}): Promise<{ orderNumber: string; status: string } | null> {
  const { sellerRow } = await resolveSellerAndAliases(input.sellerCode);
  if (!sellerRow) return null;

  return db.transaction(async (tx) => {
    const [existing] = await tx
      .select()
      .from(orders)
      .where(
        and(
          eq(orders.orderNumber, input.orderNumber),
          eq(orders.sellerId, sellerRow.id)
        )
      )
      .limit(1);

    if (!existing) return null;

    const nextPaymentStatus =
      input.nextStatus === 'completed' && existing.paymentMethod === 'COD'
        ? 'paid'
        : existing.paymentStatus;

    await tx
      .update(orders)
      .set({
        status: input.nextStatus,
        paymentStatus: nextPaymentStatus,
        updatedAt: new Date(),
      })
      .where(eq(orders.id, existing.id));

    await tx.insert(orderStatusHistory).values({
      orderId: existing.id,
      fromStatus: existing.status,
      toStatus: input.nextStatus,
      actorRole: 'SELLER',
      reason: input.reason || `Seller updated order to ${input.nextStatus}`,
    });

    // Release runner active count when an assigned order finishes
    if (
      existing.assignedRunnerId &&
      TERMINAL_STATUSES.has(input.nextStatus) &&
      !TERMINAL_STATUSES.has(existing.status)
    ) {
      await tx
        .update(sellerRunners)
        .set({
          activeOrdersCount: sql`GREATEST(0, ${sellerRunners.activeOrdersCount} - 1)`,
          updatedAt: new Date(),
        })
        .where(eq(sellerRunners.externalId, existing.assignedRunnerId));
    }

    return { orderNumber: existing.orderNumber, status: input.nextStatus };
  });
}

// ---------------------------------------------------------------------------
// Seller Product Ownership Verification
// ---------------------------------------------------------------------------

export async function verifySellerOwnsProduct(
  sellerCode: string,
  productExternalId: string
): Promise<boolean> {
  const { allSellerCodes } = await resolveSellerAndAliases(sellerCode);
  const [prod] = await db
    .select({ sellerExternalId: adminProducts.sellerExternalId })
    .from(adminProducts)
    .where(eq(adminProducts.externalId, productExternalId))
    .limit(1);

  if (!prod) return false;
  return allSellerCodes.includes(prod.sellerExternalId);
}

// ---------------------------------------------------------------------------
// Seller Live Analytics Aggregation (PostgreSQL)
// ---------------------------------------------------------------------------

export async function getSellerAnalytics(
  sellerCode: string,
  days = 7
): Promise<SellerAnalyticsDTO | null> {
  const { sellerRow } = await resolveSellerAndAliases(sellerCode);
  if (!sellerRow) return null;

  const safeDays = days === 30 ? 30 : days === 14 ? 14 : 7;
  const cutoff = new Date(Date.now() - safeDays * 86400_000);

  const allSellerOrders = await db
    .select()
    .from(orders)
    .where(eq(orders.sellerId, sellerRow.id))
    .orderBy(desc(orders.createdAt));

  const windowOrders = allSellerOrders.filter((o) => o.createdAt >= cutoff);
  const orderIds = windowOrders.map((o) => o.id);
  const items =
    orderIds.length > 0
      ? await db.select().from(orderItems).where(inArray(orderItems.orderId, orderIds))
      : [];

  let completedOrders = 0;
  let pendingOrders = 0;
  let cancelledOrders = 0;
  let deliveredRevenuePaise = 0;
  let codPendingPaise = 0;
  const uniqueCustomers = new Set<string>();
  const paymentBreakdown: Record<string, { count: number; amountPaise: number }> = {};
  const fulfilmentBreakdown: Record<string, number> = { DELIVERY: 0, PICKUP: 0 };
  const dailyMap = new Map<string, { orders: number; revenuePaise: number }>();

  for (let i = safeDays - 1; i >= 0; i--) {
    const dt = new Date(Date.now() - i * 86400_000);
    const key = dt.toISOString().slice(0, 10);
    dailyMap.set(key, { orders: 0, revenuePaise: 0 });
  }

  for (const ord of windowOrders) {
    const totalPaise = inrToPaise(ord.totalAmount);
    uniqueCustomers.add(ord.customerUid || ord.customerPhone);

    const mode = ord.fulfilmentMode === 'PICKUP' ? 'PICKUP' : 'DELIVERY';
    fulfilmentBreakdown[mode] = (fulfilmentBreakdown[mode] || 0) + 1;

    const method = ord.paymentMethod || 'COD';
    if (!paymentBreakdown[method]) {
      paymentBreakdown[method] = { count: 0, amountPaise: 0 };
    }
    paymentBreakdown[method].count += 1;
    paymentBreakdown[method].amountPaise += totalPaise;

    if (ord.status === 'completed') {
      completedOrders += 1;
      deliveredRevenuePaise += totalPaise;
    } else if (ord.status === 'cancelled' || ord.status === 'rejected') {
      cancelledOrders += 1;
    } else {
      pendingOrders += 1;
      if (method === 'COD') codPendingPaise += totalPaise;
    }

    const dayKey = ord.createdAt.toISOString().slice(0, 10);
    const bucket = dailyMap.get(dayKey);
    if (bucket) {
      bucket.orders += 1;
      if (ord.status !== 'cancelled' && ord.status !== 'rejected') {
        bucket.revenuePaise += totalPaise;
      }
    }
  }

  const productMap = new Map<string, { name: string; unitsSold: number; revenuePaise: number }>();
  for (const it of items) {
    const key = it.productNameSnapshot;
    const entry = productMap.get(key) || { name: key, unitsSold: 0, revenuePaise: 0 };
    entry.unitsSold += Number(it.requestedQuantity) || 1;
    entry.revenuePaise += inrToPaise(it.lineTotal);
    productMap.set(key, entry);
  }

  const topProducts = Array.from(productMap.values())
    .sort((a, b) => b.revenuePaise - a.revenuePaise)
    .slice(0, 10);

  return {
    sellerId: sellerRow.code,
    days: safeDays,
    summary: {
      totalOrders: windowOrders.length,
      completedOrders,
      pendingOrders,
      cancelledOrders,
      deliveredRevenuePaise,
      avgOrderValuePaise:
        completedOrders > 0 ? Math.round(deliveredRevenuePaise / completedOrders) : 0,
      codPendingPaise,
      uniqueCustomers: uniqueCustomers.size,
    },
    paymentBreakdown,
    fulfilmentBreakdown,
    topProducts,
    dailySeries: Array.from(dailyMap.entries()).map(([dateKey, val]) => ({
      dateKey,
      orders: val.orders,
      revenuePaise: val.revenuePaise,
    })),
  };
}
