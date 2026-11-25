import { and, desc, eq } from 'drizzle-orm';
import { db } from './index.ts';
import {
  adminOffers,
  sellers,
  udhariCreditProfiles,
  udhariDisputes,
  udhariLedgerEntries,
  udhariSellerSettings,
} from './schema.ts';
import { seedAdminFinanceIfEmpty } from './adminFinanceQueries.ts';

export type RepaymentMethodKey =
  | 'CASH'
  | 'UPI_DIRECT'
  | 'BANK_TRANSFER'
  | 'OTHER_OFFLINE';

export interface CustomerCreditProfileDTO {
  id: string;
  sellerId: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  villageName: string;
  status: 'ACTIVE' | 'DISABLED' | 'BLOCKED';
  creditLimitPaise: number;
  outstandingBalancePaise: number;
  availableCreditPaise: number;
  overdueAmountPaise: number;
  dueDays: number;
  lastPaymentDate?: string;
  internalNote?: string;
}

export interface CreditLedgerEntryDTO {
  id: string;
  ledgerReference: string;
  sellerId: string;
  customerId: string;
  orderId?: string;
  repaymentId?: string;
  entryType:
    | 'CREDIT_SALE'
    | 'REPAYMENT'
    | 'ORDER_CANCEL_REVERSAL'
    | 'RETURN_REVERSAL'
    | 'MANUAL_ADJUSTMENT'
    | 'WRITE_OFF';
  direction: 'INCREASES_OWED' | 'DECREASES_OWED';
  amountPaise: number;
  runningBalancePaise: number;
  dueDate?: string;
  isOverdue: boolean;
  status: 'POSTED' | 'VOIDED';
  reason?: string;
  recordedBy: string;
  postedAt: string;
}

export interface CreditDisputeDTO {
  id: string;
  sellerId: string;
  customerId: string;
  ledgerEntryId: string;
  reasonCode: 'WRONG_AMOUNT' | 'PAYMENT_NOT_RECORDED' | 'ORDER_CANCELLED' | 'OTHER';
  description: string;
  status: 'OPEN' | 'RESOLVED';
  resolutionNote?: string;
  openedAt: string;
  resolvedAt?: string;
}

export interface SellerAvailabilityStatusDTO {
  id: string;
  isOpenNow: boolean;
  isPaused: boolean;
}

export interface OfferValidationResultDTO {
  valid: boolean;
  reason?: string;
  discountPaise: number;
  freeDelivery: boolean;
  offer?: {
    id: string;
    code: string;
    title: string;
    discountType: 'PERCENT' | 'FLAT' | 'FREE_DELIVERY';
    discountValue: number;
    minOrderPaise: number;
    maxDiscountPaise?: number;
    vertical: string;
    villageId: string;
    fundedBy: string;
    validFrom: string;
    validUntil: string;
  };
}

function inrToPaise(val: string | number | null | undefined): number {
  const num = Number(val ?? 0);
  if (!Number.isFinite(num)) return 0;
  return Math.round(num * 100);
}

function paiseToInr(paise: number): string {
  const safe = Number.isFinite(paise) ? Math.round(paise) : 0;
  return (safe / 100).toFixed(2);
}

let udhariSeedPromise: Promise<void> | null = null;

export async function ensureUdhariSeeded(): Promise<void> {
  if (!udhariSeedPromise) {
    udhariSeedPromise = (async () => {
      // 1. Seed seller udhari settings if empty
      const existingSettings = await db
        .select({ id: udhariSellerSettings.id })
        .from(udhariSellerSettings)
        .limit(1);

      if (existingSettings.length === 0) {
        await db
          .insert(udhariSellerSettings)
          .values([
            {
              sellerCode: 'seller_gupta_kirana',
              enabled: true,
              acknowledgedAt: '2026-08-10T10:00:00Z',
            },
            {
              sellerCode: 'seller_sharma_dhaba',
              enabled: true,
              acknowledgedAt: '2026-08-15T10:00:00Z',
            },
          ])
          .onConflictDoNothing();
      }

      // 2. Seed baseline credit profiles & ledger entries if empty
      const existingProfiles = await db
        .select({ id: udhariCreditProfiles.id })
        .from(udhariCreditProfiles)
        .limit(1);

      if (existingProfiles.length === 0) {
        const sellerRows = await db.select().from(sellers);
        const sellerByCode = new Map(sellerRows.map((s) => [s.code, s.id]));
        const guptaId = sellerByCode.get('seller_gupta_kirana');
        const sharmaId = sellerByCode.get('seller_sharma_dhaba');

        if (guptaId && sharmaId) {
          await db
            .insert(udhariCreditProfiles)
            .values([
              {
                externalId: 'prof_1',
                sellerId: guptaId,
                customerUid: 'user_cust_1',
                customerName: 'Ramesh Patel',
                customerPhone: '9876543210',
                villageName: 'Rampur',
                status: 'ACTIVE',
                creditLimit: '2500.00',
                outstandingBalance: '850.00',
                overdueAmount: '0.00',
                dueDays: 15,
                lastPaymentAt: new Date('2026-10-15T11:00:00Z'),
                internalNote:
                  'Pados ke nivaasi, har mahine salary aane par hisaab chukate hain.',
              },
              {
                externalId: 'prof_2',
                sellerId: sharmaId,
                customerUid: 'user_cust_1',
                customerName: 'Ramesh Patel',
                customerPhone: '9876543210',
                villageName: 'Rampur',
                status: 'ACTIVE',
                creditLimit: '1500.00',
                outstandingBalance: '340.00',
                overdueAmount: '0.00',
                dueDays: 7,
                lastPaymentAt: new Date('2026-10-20T14:30:00Z'),
                internalNote: 'Regular customer for evening thali.',
              },
              {
                externalId: 'prof_3',
                sellerId: guptaId,
                customerUid: 'user_cust_2',
                customerName: 'Suresh Yadav',
                customerPhone: '9876543233',
                villageName: 'Rampur',
                status: 'ACTIVE',
                creditLimit: '3000.00',
                outstandingBalance: '2100.00',
                overdueAmount: '750.00',
                dueDays: 15,
                lastPaymentAt: new Date('2026-09-12T09:00:00Z'),
                internalNote: 'Reminder bhejna hai, pichle mahine ka baki hai.',
              },
            ])
            .onConflictDoNothing();
        }
      }

      const existingLedger = await db
        .select({ id: udhariLedgerEntries.id })
        .from(udhariLedgerEntries)
        .limit(1);

      if (existingLedger.length === 0) {
        const allProfiles = await db.select().from(udhariCreditProfiles);
        const prof1 = allProfiles.find((p) => p.externalId === 'prof_1');
        const prof2 = allProfiles.find((p) => p.externalId === 'prof_2');

        if (prof1 && prof2) {
          await db
            .insert(udhariLedgerEntries)
            .values([
              {
                externalId: 'led_1',
                ledgerReference: 'LED-2026-0012',
                profileId: prof1.id,
                sellerId: prof1.sellerId,
                customerUid: prof1.customerUid,
                orderNumberRef: 'GB-2026-0012',
                entryType: 'CREDIT_SALE',
                direction: 'INCREASES_OWED',
                amount: '1350.00',
                runningBalance: '1350.00',
                dueDateIso: '2026-10-25T00:00:00Z',
                isOverdue: false,
                status: 'POSTED',
                recordedBy: 'Gupta Kirana Counter',
                postedAt: new Date('2026-10-10T12:00:00Z'),
              },
              {
                externalId: 'led_2',
                ledgerReference: 'REC-2026-0045',
                profileId: prof1.id,
                sellerId: prof1.sellerId,
                customerUid: prof1.customerUid,
                repaymentRef: 'rep_1',
                entryType: 'REPAYMENT',
                direction: 'DECREASES_OWED',
                amount: '500.00',
                runningBalance: '850.00',
                isOverdue: false,
                status: 'POSTED',
                reason: 'Cash paid at shop counter',
                recordedBy: 'Gupta Kirana Owner',
                postedAt: new Date('2026-10-15T11:00:00Z'),
              },
              {
                externalId: 'led_3',
                ledgerReference: 'LED-2026-0038',
                profileId: prof2.id,
                sellerId: prof2.sellerId,
                customerUid: prof2.customerUid,
                orderNumberRef: 'GB-2026-0038',
                entryType: 'CREDIT_SALE',
                direction: 'INCREASES_OWED',
                amount: '340.00',
                runningBalance: '340.00',
                dueDateIso: '2026-11-04T00:00:00Z',
                isOverdue: false,
                status: 'POSTED',
                recordedBy: 'Sharma Dhaba Cashier',
                postedAt: new Date('2026-10-28T19:30:00Z'),
              },
            ])
            .onConflictDoNothing();
        }
      }
    })().catch((err) => {
      udhariSeedPromise = null;
      throw err;
    });
  }
  await udhariSeedPromise;
}

async function resolveSellerRowByCode(sellerCode: string) {
  const [seller] = await db
    .select()
    .from(sellers)
    .where(eq(sellers.code, sellerCode))
    .limit(1);
  return seller ?? null;
}

function mapProfileRow(
  row: typeof udhariCreditProfiles.$inferSelect,
  sellerCode: string
): CustomerCreditProfileDTO {
  const limitPaise = inrToPaise(row.creditLimit);
  const outstandingPaise = inrToPaise(row.outstandingBalance);
  const overduePaise = inrToPaise(row.overdueAmount);
  const status =
    row.status === 'DISABLED' || row.status === 'BLOCKED' ? row.status : 'ACTIVE';

  return {
    id: row.externalId || `prof_${row.id}`,
    sellerId: sellerCode,
    customerId: row.customerUid,
    customerName: row.customerName,
    customerPhone: row.customerPhone,
    villageName: row.villageName || 'Rampur',
    status,
    creditLimitPaise: limitPaise,
    outstandingBalancePaise: outstandingPaise,
    availableCreditPaise: Math.max(0, limitPaise - outstandingPaise),
    overdueAmountPaise: overduePaise,
    dueDays: row.dueDays ?? 15,
    lastPaymentDate: row.lastPaymentAt ? row.lastPaymentAt.toISOString() : undefined,
    internalNote: row.internalNote ?? undefined,
  };
}

function mapLedgerRow(
  row: typeof udhariLedgerEntries.$inferSelect,
  sellerCode: string,
  fallbackCustomerUid: string
): CreditLedgerEntryDTO {
  return {
    id: row.externalId || `led_${row.id}`,
    ledgerReference: row.ledgerReference,
    sellerId: sellerCode,
    customerId: row.customerUid || fallbackCustomerUid,
    orderId: row.orderNumberRef ?? undefined,
    repaymentId: row.repaymentRef ?? undefined,
    entryType: row.entryType as CreditLedgerEntryDTO['entryType'],
    direction:
      row.direction === 'DECREASES_OWED' ? 'DECREASES_OWED' : 'INCREASES_OWED',
    amountPaise: inrToPaise(row.amount),
    runningBalancePaise: inrToPaise(row.runningBalance),
    dueDate: row.dueDateIso ?? undefined,
    isOverdue: Boolean(row.isOverdue),
    status: row.status === 'VOIDED' ? 'VOIDED' : 'POSTED',
    reason: row.reason ?? undefined,
    recordedBy: row.recordedBy,
    postedAt: row.postedAt.toISOString(),
  };
}

function mapDisputeRow(row: typeof udhariDisputes.$inferSelect): CreditDisputeDTO {
  return {
    id: row.externalId,
    sellerId: row.sellerCode,
    customerId: row.customerId,
    ledgerEntryId: row.ledgerEntryId,
    reasonCode: row.reasonCode as CreditDisputeDTO['reasonCode'],
    description: row.description,
    status: row.status === 'RESOLVED' ? 'RESOLVED' : 'OPEN',
    resolutionNote: row.resolutionNote ?? undefined,
    openedAt: row.openedAtIso,
    resolvedAt: row.resolvedAtIso ?? undefined,
  };
}

export async function getUdhariBundle(): Promise<{
  sellerCreditSettings: Record<string, { enabled: boolean; acknowledgedAt?: string }>;
  profiles: CustomerCreditProfileDTO[];
  ledgerEntries: CreditLedgerEntryDTO[];
  disputes: CreditDisputeDTO[];
}> {
  await ensureUdhariSeeded();

  const [sellerRows, settingRows, profileRows, ledgerRows, disputeRows] =
    await Promise.all([
      db.select().from(sellers),
      db.select().from(udhariSellerSettings),
      db
        .select()
        .from(udhariCreditProfiles)
        .orderBy(desc(udhariCreditProfiles.updatedAt)),
      db
        .select()
        .from(udhariLedgerEntries)
        .orderBy(desc(udhariLedgerEntries.postedAt), desc(udhariLedgerEntries.id)),
      db
        .select()
        .from(udhariDisputes)
        .orderBy(desc(udhariDisputes.createdAt), desc(udhariDisputes.id)),
    ]);

  const sellerCodeById = new Map(sellerRows.map((s) => [s.id, s.code]));
  const profileCustomerById = new Map(
    profileRows.map((p) => [p.id, p.customerUid])
  );

  const sellerCreditSettings: Record<
    string,
    { enabled: boolean; acknowledgedAt?: string }
  > = {};
  for (const row of settingRows) {
    sellerCreditSettings[row.sellerCode] = {
      enabled: row.enabled,
      acknowledgedAt: row.acknowledgedAt ?? undefined,
    };
  }

  const profiles = profileRows.map((row) =>
    mapProfileRow(row, sellerCodeById.get(row.sellerId) || `seller_${row.sellerId}`)
  );

  const ledgerEntries = ledgerRows.map((row) =>
    mapLedgerRow(
      row,
      sellerCodeById.get(row.sellerId) || `seller_${row.sellerId}`,
      profileCustomerById.get(row.profileId) || ''
    )
  );

  const disputes = disputeRows.map(mapDisputeRow);

  return {
    sellerCreditSettings,
    profiles,
    ledgerEntries,
    disputes,
  };
}

export async function enableSellerUdhari(
  sellerCode: string
): Promise<{ sellerCode: string; enabled: boolean; acknowledgedAt: string }> {
  await ensureUdhariSeeded();
  const acknowledgedAt = new Date().toISOString();

  await db
    .insert(udhariSellerSettings)
    .values({
      sellerCode,
      enabled: true,
      acknowledgedAt,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: udhariSellerSettings.sellerCode,
      set: {
        enabled: true,
        acknowledgedAt,
        updatedAt: new Date(),
      },
    });

  await db
    .update(sellers)
    .set({ udhariEnabled: true, updatedAt: new Date() })
    .where(eq(sellers.code, sellerCode));

  return { sellerCode, enabled: true, acknowledgedAt };
}

export async function upsertCustomerCreditProfile(input: {
  sellerCode: string;
  customerId: string;
  limitPaise: number;
  internalNote?: string;
  customerName?: string;
  customerPhone?: string;
  villageName?: string;
}): Promise<CustomerCreditProfileDTO | null> {
  await ensureUdhariSeeded();
  const seller = await resolveSellerRowByCode(input.sellerCode);
  if (!seller) return null;

  const [existing] = await db
    .select()
    .from(udhariCreditProfiles)
    .where(
      and(
        eq(udhariCreditProfiles.sellerId, seller.id),
        eq(udhariCreditProfiles.customerUid, input.customerId)
      )
    )
    .limit(1);

  if (existing) {
    const [updated] = await db
      .update(udhariCreditProfiles)
      .set({
        creditLimit: paiseToInr(input.limitPaise),
        internalNote:
          input.internalNote !== undefined
            ? input.internalNote
            : existing.internalNote,
        updatedAt: new Date(),
      })
      .where(eq(udhariCreditProfiles.id, existing.id))
      .returning();

    return mapProfileRow(updated, seller.code);
  }

  const externalId = `prof_${Date.now()}`;
  const [inserted] = await db
    .insert(udhariCreditProfiles)
    .values({
      externalId,
      sellerId: seller.id,
      customerUid: input.customerId,
      customerName: input.customerName?.trim() || 'Customer',
      customerPhone: input.customerPhone?.trim() || '9876543210',
      villageName: input.villageName?.trim() || 'Rampur',
      status: 'ACTIVE',
      creditLimit: paiseToInr(input.limitPaise),
      outstandingBalance: '0.00',
      overdueAmount: '0.00',
      dueDays: 15,
      internalNote: input.internalNote ?? null,
      updatedAt: new Date(),
    })
    .returning();

  return mapProfileRow(inserted, seller.code);
}

export async function updateCustomerCreditStatus(input: {
  sellerCode: string;
  customerId: string;
  status: 'ACTIVE' | 'DISABLED' | 'BLOCKED';
}): Promise<CustomerCreditProfileDTO | null> {
  await ensureUdhariSeeded();
  const seller = await resolveSellerRowByCode(input.sellerCode);
  if (!seller) return null;

  const [existing] = await db
    .select()
    .from(udhariCreditProfiles)
    .where(
      and(
        eq(udhariCreditProfiles.sellerId, seller.id),
        eq(udhariCreditProfiles.customerUid, input.customerId)
      )
    )
    .limit(1);

  if (!existing) return null;

  const [updated] = await db
    .update(udhariCreditProfiles)
    .set({
      status: input.status,
      updatedAt: new Date(),
    })
    .where(eq(udhariCreditProfiles.id, existing.id))
    .returning();

  return mapProfileRow(updated, seller.code);
}

export async function postTransactionalCreditSale(input: {
  sellerCode: string;
  customerId: string;
  orderId: string;
  amountPaise: number;
  dueDays?: number;
  recordedBy: string;
}): Promise<
  | {
      success: true;
      message: string;
      ledgerReference: string;
      entry: CreditLedgerEntryDTO;
      profile: CustomerCreditProfileDTO;
    }
  | { success: false; message: string; statusCode: number }
> {
  await ensureUdhariSeeded();
  const seller = await resolveSellerRowByCode(input.sellerCode);
  if (!seller) {
    return { success: false, message: 'Seller not found.', statusCode: 404 };
  }

  return db.transaction(async (tx) => {
    const [profile] = await tx
      .select()
      .from(udhariCreditProfiles)
      .where(
        and(
          eq(udhariCreditProfiles.sellerId, seller.id),
          eq(udhariCreditProfiles.customerUid, input.customerId)
        )
      )
      .limit(1);

    if (!profile) {
      return {
        success: false as const,
        message: 'Customer has no credit account with this seller.',
        statusCode: 404,
      };
    }

    if (profile.status !== 'ACTIVE') {
      return {
        success: false as const,
        message: 'Credit is disabled for this customer.',
        statusCode: 400,
      };
    }

    const limitPaise = inrToPaise(profile.creditLimit);
    const currentOutstanding = inrToPaise(profile.outstandingBalance);
    const projectedOutstanding = currentOutstanding + input.amountPaise;

    if (projectedOutstanding > limitPaise) {
      return {
        success: false as const,
        message: 'Projected outstanding exceeds customer credit limit.',
        statusCode: 400,
      };
    }

    const dueDays = input.dueDays && input.dueDays > 0 ? input.dueDays : profile.dueDays || 15;
    const now = new Date();
    const dueDateIso = new Date(
      now.getTime() + dueDays * 24 * 60 * 60 * 1000
    ).toISOString();
    const ledgerRef = `LED-${now.getUTCFullYear()}-${Date.now().toString().slice(-6)}`;
    const externalId = `led_${Date.now()}`;

    const [insertedEntry] = await tx
      .insert(udhariLedgerEntries)
      .values({
        externalId,
        ledgerReference: ledgerRef,
        profileId: profile.id,
        sellerId: seller.id,
        customerUid: input.customerId,
        orderNumberRef: input.orderId,
        entryType: 'CREDIT_SALE',
        direction: 'INCREASES_OWED',
        amount: paiseToInr(input.amountPaise),
        runningBalance: paiseToInr(projectedOutstanding),
        dueDateIso,
        isOverdue: false,
        status: 'POSTED',
        recordedBy: input.recordedBy,
        postedAt: now,
      })
      .returning();

    const [updatedProfile] = await tx
      .update(udhariCreditProfiles)
      .set({
        outstandingBalance: paiseToInr(projectedOutstanding),
        updatedAt: now,
      })
      .where(eq(udhariCreditProfiles.id, profile.id))
      .returning();

    return {
      success: true as const,
      message: 'Credit sale posted to ledger',
      ledgerReference: ledgerRef,
      entry: mapLedgerRow(insertedEntry, seller.code, input.customerId),
      profile: mapProfileRow(updatedProfile, seller.code),
    };
  });
}

export async function recordTransactionalRepayment(input: {
  sellerCode: string;
  customerId: string;
  amountPaise: number;
  method: RepaymentMethodKey;
  referenceNumber?: string;
  note?: string;
  recordedBy: string;
}): Promise<
  | {
      success: true;
      message: string;
      receiptReference: string;
      entry: CreditLedgerEntryDTO;
      profile: CustomerCreditProfileDTO;
    }
  | { success: false; message: string; statusCode: number }
> {
  await ensureUdhariSeeded();
  const seller = await resolveSellerRowByCode(input.sellerCode);
  if (!seller) {
    return { success: false, message: 'Seller not found.', statusCode: 404 };
  }

  return db.transaction(async (tx) => {
    const [profile] = await tx
      .select()
      .from(udhariCreditProfiles)
      .where(
        and(
          eq(udhariCreditProfiles.sellerId, seller.id),
          eq(udhariCreditProfiles.customerUid, input.customerId)
        )
      )
      .limit(1);

    if (!profile) {
      return {
        success: false as const,
        message: 'Customer credit profile not found.',
        statusCode: 404,
      };
    }

    const currentOutstanding = inrToPaise(profile.outstandingBalance);
    if (input.amountPaise <= 0) {
      return {
        success: false as const,
        message: 'Repayment amount must be greater than zero.',
        statusCode: 400,
      };
    }

    if (input.amountPaise > currentOutstanding) {
      return {
        success: false as const,
        message: 'Repayment amount cannot exceed current outstanding balance.',
        statusCode: 400,
      };
    }

    const now = new Date();
    const newOutstanding = currentOutstanding - input.amountPaise;
    const currentOverdue = inrToPaise(profile.overdueAmount);
    const nextOverdue = Math.max(0, currentOverdue - input.amountPaise);
    const receiptRef = `REC-${now.getUTCFullYear()}-${Date.now().toString().slice(-6)}`;
    const externalId = `led_${Date.now()}`;
    const reason =
      input.note?.trim() ||
      `${input.method.replace('_', ' ')} repayment recorded by seller${
        input.referenceNumber ? ` (Ref: ${input.referenceNumber})` : ''
      }`;

    const [insertedEntry] = await tx
      .insert(udhariLedgerEntries)
      .values({
        externalId,
        ledgerReference: receiptRef,
        profileId: profile.id,
        sellerId: seller.id,
        customerUid: input.customerId,
        repaymentRef: input.referenceNumber || `rep_${Date.now()}`,
        entryType: 'REPAYMENT',
        direction: 'DECREASES_OWED',
        amount: paiseToInr(input.amountPaise),
        runningBalance: paiseToInr(newOutstanding),
        isOverdue: false,
        status: 'POSTED',
        reason,
        recordedBy: input.recordedBy,
        postedAt: now,
      })
      .returning();

    const [updatedProfile] = await tx
      .update(udhariCreditProfiles)
      .set({
        outstandingBalance: paiseToInr(newOutstanding),
        overdueAmount: paiseToInr(nextOverdue),
        lastPaymentAt: now,
        updatedAt: now,
      })
      .where(eq(udhariCreditProfiles.id, profile.id))
      .returning();

    return {
      success: true as const,
      message: 'Repayment successfully recorded and receipt issued.',
      receiptReference: receiptRef,
      entry: mapLedgerRow(insertedEntry, seller.code, input.customerId),
      profile: mapProfileRow(updatedProfile, seller.code),
    };
  });
}

export async function createUdhariDispute(input: {
  id?: string;
  sellerCode: string;
  customerId: string;
  ledgerEntryId: string;
  reasonCode: 'WRONG_AMOUNT' | 'PAYMENT_NOT_RECORDED' | 'ORDER_CANCELLED' | 'OTHER';
  description: string;
}): Promise<CreditDisputeDTO> {
  await ensureUdhariSeeded();
  const externalId = input.id?.trim() || `disp_${Date.now()}`;
  const nowIso = new Date().toISOString();

  const [inserted] = await db
    .insert(udhariDisputes)
    .values({
      externalId,
      sellerCode: input.sellerCode,
      customerId: input.customerId,
      ledgerEntryId: input.ledgerEntryId,
      reasonCode: input.reasonCode,
      description: input.description.trim(),
      status: 'OPEN',
      openedAtIso: nowIso,
      updatedAt: new Date(),
    })
    .returning();

  return mapDisputeRow(inserted);
}

export async function resolveUdhariDispute(input: {
  disputeId: string;
  resolutionNote: string;
}): Promise<CreditDisputeDTO | null> {
  await ensureUdhariSeeded();
  const [existing] = await db
    .select()
    .from(udhariDisputes)
    .where(eq(udhariDisputes.externalId, input.disputeId))
    .limit(1);

  if (!existing) return null;

  const [updated] = await db
    .update(udhariDisputes)
    .set({
      status: 'RESOLVED',
      resolutionNote: input.resolutionNote.trim(),
      resolvedAtIso: new Date().toISOString(),
      updatedAt: new Date(),
    })
    .where(eq(udhariDisputes.id, existing.id))
    .returning();

  return mapDisputeRow(updated);
}

// ---------------------------------------------------------------------------
// Step 3: Seller Availability Status Persistence (PostgreSQL `sellers` table)
// ---------------------------------------------------------------------------

export async function listSellerAvailabilityStatuses(): Promise<
  SellerAvailabilityStatusDTO[]
> {
  const rows = await db
    .select({
      code: sellers.code,
      isOpenNow: sellers.isOpenNow,
      isPaused: sellers.isPaused,
    })
    .from(sellers);

  return rows.map((row) => ({
    id: row.code,
    isOpenNow: Boolean(row.isOpenNow),
    isPaused: Boolean(row.isPaused),
  }));
}

export async function updateSellerAvailabilityStatus(input: {
  sellerCode: string;
  isPaused: boolean;
}): Promise<SellerAvailabilityStatusDTO | null> {
  const [existing] = await db
    .select()
    .from(sellers)
    .where(eq(sellers.code, input.sellerCode))
    .limit(1);

  if (!existing) return null;

  const nextPaused = Boolean(input.isPaused);
  const [updated] = await db
    .update(sellers)
    .set({
      isPaused: nextPaused,
      isOpenNow: !nextPaused,
      updatedAt: new Date(),
    })
    .where(eq(sellers.id, existing.id))
    .returning();

  return {
    id: updated.code,
    isOpenNow: Boolean(updated.isOpenNow),
    isPaused: Boolean(updated.isPaused),
  };
}

// ---------------------------------------------------------------------------
// Step 4: Server-Side Coupon Validation against PostgreSQL `admin_offers`
// ---------------------------------------------------------------------------

export async function validateOfferCoupon(input: {
  code: string;
  orderSubtotalPaise: number;
  vertical?: string;
  villageId?: string;
}): Promise<OfferValidationResultDTO> {
  await seedAdminFinanceIfEmpty();

  const normalizedCode = input.code.trim().toUpperCase();
  if (!normalizedCode) {
    return {
      valid: false,
      reason: 'Coupon code is required.',
      discountPaise: 0,
      freeDelivery: false,
    };
  }

  const [offer] = await db
    .select()
    .from(adminOffers)
    .where(eq(adminOffers.code, normalizedCode))
    .limit(1);

  if (!offer) {
    return {
      valid: false,
      reason: 'Coupon code not found.',
      discountPaise: 0,
      freeDelivery: false,
    };
  }

  if (!offer.isActive) {
    return {
      valid: false,
      reason: 'This coupon is currently inactive.',
      discountPaise: 0,
      freeDelivery: false,
    };
  }

  const today = new Date().toISOString().slice(0, 10);
  if (offer.validFrom && today < offer.validFrom.slice(0, 10)) {
    return {
      valid: false,
      reason: `This coupon becomes active on ${offer.validFrom}.`,
      discountPaise: 0,
      freeDelivery: false,
    };
  }
  if (offer.validUntil && today > offer.validUntil.slice(0, 10)) {
    return {
      valid: false,
      reason: 'This coupon has expired.',
      discountPaise: 0,
      freeDelivery: false,
    };
  }

  if (offer.usageLimit > 0 && offer.usedCount >= offer.usageLimit) {
    return {
      valid: false,
      reason: 'Coupon usage limit has been reached.',
      discountPaise: 0,
      freeDelivery: false,
    };
  }

  const requestedVertical = input.vertical?.trim().toUpperCase();
  if (
    offer.vertical !== 'ALL' &&
    requestedVertical &&
    offer.vertical.toUpperCase() !== requestedVertical
  ) {
    return {
      valid: false,
      reason: `This coupon is only valid for ${offer.vertical} orders.`,
      discountPaise: 0,
      freeDelivery: false,
    };
  }

  const requestedVillage = input.villageId?.trim().toLowerCase();
  if (
    offer.villageId !== 'ALL' &&
    requestedVillage &&
    offer.villageId.toLowerCase() !== requestedVillage
  ) {
    return {
      valid: false,
      reason: 'This coupon is not valid for your selected village.',
      discountPaise: 0,
      freeDelivery: false,
    };
  }

  const subtotal = Math.max(0, Math.round(input.orderSubtotalPaise));
  if (subtotal < offer.minOrderPaise) {
    const minInr = (offer.minOrderPaise / 100).toFixed(0);
    return {
      valid: false,
      reason: `Minimum order value of ₹${minInr} is required for ${offer.code}.`,
      discountPaise: 0,
      freeDelivery: false,
    };
  }

  let discountPaise = 0;
  let freeDelivery = false;

  if (offer.discountType === 'FREE_DELIVERY') {
    freeDelivery = true;
  } else if (offer.discountType === 'PERCENT') {
    const rawDiscount = Math.round((subtotal * offer.discountValue) / 100);
    discountPaise =
      offer.maxDiscountPaise && offer.maxDiscountPaise > 0
        ? Math.min(rawDiscount, offer.maxDiscountPaise)
        : rawDiscount;
  } else {
    // FLAT discountValue is stored in paise
    discountPaise = Math.min(subtotal, Math.max(0, offer.discountValue));
  }

  return {
    valid: true,
    discountPaise,
    freeDelivery,
    offer: {
      id: offer.externalId,
      code: offer.code,
      title: offer.title,
      discountType: offer.discountType as 'PERCENT' | 'FLAT' | 'FREE_DELIVERY',
      discountValue: offer.discountValue,
      minOrderPaise: offer.minOrderPaise,
      maxDiscountPaise: offer.maxDiscountPaise ?? undefined,
      vertical: offer.vertical,
      villageId: offer.villageId,
      fundedBy: offer.fundedBy,
      validFrom: offer.validFrom,
      validUntil: offer.validUntil,
    },
  };
}
