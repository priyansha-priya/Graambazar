import { asc, desc, eq } from 'drizzle-orm';
import { db } from './index.ts';
import {
  adminCancellationRules,
  adminFeeRules,
  adminOffers,
  adminPaymentTransactions,
  adminRefundLedger,
  adminSellerPayouts,
  adminTaxSlabs,
  orders,
  orderStatusHistory,
  sellers,
} from './schema.ts';
import type {
  CancellationPolicyRuleRecord,
  FeeRuleRecord,
  FinanceHistoryEntry,
  OfferCouponRecord,
  PaymentTransactionRecord,
  RefundLedgerRecord,
  SellerPayoutRecord,
  TaxSlabRecord,
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
// IDEMPOTENT BASELINE SEED DATA (GramBazaar Finance & Policies)
// =========================================================================
const SEED_FEE_RULES: FeeRuleRecord[] = [
  {
    id: 'fee_01',
    name: 'Standard Food Delivery Pilot Rule',
    vertical: 'FOOD',
    commissionBps: 500,
    platformFeePaise: 200,
    effectiveFrom: '2026-10-01',
    isPilotShadowMode: true,
    status: 'ACTIVE',
  },
  {
    id: 'fee_02',
    name: 'Standard Grocery Pilot Rule',
    vertical: 'GROCERY',
    commissionBps: 300,
    platformFeePaise: 200,
    effectiveFrom: '2026-10-01',
    isPilotShadowMode: true,
    status: 'ACTIVE',
  },
  {
    id: 'fee_03',
    name: 'Agri Inputs & Seeds Rule',
    vertical: 'AGRICULTURE',
    commissionBps: 250,
    platformFeePaise: 500,
    effectiveFrom: '2026-11-01',
    isPilotShadowMode: true,
    status: 'ACTIVE',
  },
  {
    id: 'fee_04',
    name: 'Hardware & Electronics Rule',
    vertical: 'HARDWARE',
    commissionBps: 400,
    platformFeePaise: 500,
    effectiveFrom: '2026-11-01',
    isPilotShadowMode: true,
    status: 'ACTIVE',
  },
];

const SEED_OFFERS: OfferCouponRecord[] = [
  {
    id: 'off_01',
    code: 'GRAM50',
    title: 'Welcome ₹50 Off on First Village Order',
    discountType: 'FLAT',
    discountValue: 5000,
    minOrderPaise: 25000,
    vertical: 'ALL',
    villageId: 'ALL',
    fundedBy: 'PLATFORM',
    validFrom: '2026-10-01',
    validUntil: '2026-12-31',
    usageLimit: 500,
    usedCount: 124,
    isActive: true,
  },
  {
    id: 'off_02',
    code: 'RAMPURFREE',
    title: 'Free Delivery in Rampur & Madhopur',
    discountType: 'FREE_DELIVERY',
    discountValue: 0,
    minOrderPaise: 19900,
    vertical: 'FOOD',
    villageId: 'v-rampur',
    fundedBy: 'PLATFORM',
    validFrom: '2026-10-15',
    validUntil: '2026-11-30',
    usageLimit: 300,
    usedCount: 89,
    isActive: true,
  },
  {
    id: 'off_03',
    code: 'KISAN10',
    title: '10% Off on Rabi Seeds & Fertilizer',
    discountType: 'PERCENTAGE',
    discountValue: 10,
    minOrderPaise: 100000,
    maxDiscountPaise: 25000,
    vertical: 'AGRICULTURE',
    villageId: 'ALL',
    fundedBy: 'SELLER',
    validFrom: '2026-10-20',
    validUntil: '2026-12-15',
    usageLimit: 150,
    usedCount: 31,
    isActive: true,
  },
];

const SEED_TAX_SLABS: TaxSlabRecord[] = [
  {
    id: 'tax_01',
    name: 'Essential Unpackaged Groceries & Produce',
    vertical: 'GROCERY',
    gstPercent: 0,
    hsnPrefix: '0701 / 1001',
    isInclusive: true,
    description: 'Fresh vegetables, fruits, loose wheat, rice, and milk exempt from GST.',
    isActive: true,
  },
  {
    id: 'tax_02',
    name: 'Restaurant & Local Kitchen Food (Non-AC)',
    vertical: 'FOOD',
    gstPercent: 5,
    hsnPrefix: '996331',
    isInclusive: true,
    description: 'Standard 5% GST slab for prepared restaurant and dhaba meals without ITC.',
    isActive: true,
  },
  {
    id: 'tax_03',
    name: 'Packaged Branded Staples & Beverages',
    vertical: 'GROCERY',
    gstPercent: 5,
    hsnPrefix: '1101 / 1514',
    isInclusive: true,
    description: 'Branded packaged flour, mustard oil, tea, and spices.',
    isActive: true,
  },
  {
    id: 'tax_04',
    name: 'Hardware, Electricals & General Merchandise',
    vertical: 'HARDWARE',
    gstPercent: 18,
    hsnPrefix: '8205 / 8536',
    isInclusive: false,
    description: 'Standard 18% GST for tools, switches, pipes, and future electronics verticals.',
    isActive: true,
  },
];

const SEED_CANCELLATION_RULES: CancellationPolicyRuleRecord[] = [
  {
    id: 'can_01',
    actor: 'CUSTOMER',
    code: 'BEFORE_ACCEPTANCE',
    label: 'Customer cancels before seller accepts order',
    freeCancelWindowMins: 5,
    penaltyPercent: 0,
    autoRefundEligible: true,
    isActive: true,
  },
  {
    id: 'can_02',
    actor: 'CUSTOMER',
    code: 'AFTER_FOOD_PREP',
    label: 'Customer cancels after restaurant starts cooking',
    freeCancelWindowMins: 0,
    penaltyPercent: 50,
    autoRefundEligible: false,
    isActive: true,
  },
  {
    id: 'can_03',
    actor: 'SELLER',
    code: 'ITEM_OUT_OF_STOCK',
    label: 'Seller cancels due to sudden item unavailability',
    freeCancelWindowMins: 0,
    penaltyPercent: 0,
    autoRefundEligible: true,
    isActive: true,
  },
  {
    id: 'can_04',
    actor: 'DELIVERY_FAILED',
    code: 'CUSTOMER_UNREACHABLE',
    label: 'Delivery failed after 3 phone call attempts at village landmark',
    freeCancelWindowMins: 15,
    penaltyPercent: 25,
    autoRefundEligible: false,
    isActive: true,
  },
];

const SEED_PAYOUTS: SellerPayoutRecord[] = [
  {
    id: 'pay_2026_1101',
    sellerId: 'sel_1',
    sellerName: 'Maa Annapurna Bhojanalay',
    villageName: 'Rampur Kalan',
    vertical: 'FOOD',
    periodLabel: '16 Nov – 22 Nov 2026',
    ordersCount: 48,
    grossAmountPaise: 1845000,
    commissionPaise: 92250,
    refundDeductionsPaise: 24000,
    otherDeductionsPaise: 0,
    platformFeePaise: 14400,
    netPayablePaise: 1728750,
    paymentMode: 'NEFT_IMPS',
    status: 'PENDING',
    settlementDate: '2026-11-22T18:00:00Z',
    includedOrderIds: ['GB-ORD-1042', 'GB-ORD-1045', 'GB-ORD-1048', 'GB-ORD-1051'],
    notes: 'Weekly Friday settlement batch ready for finance sign-off.',
    history: [
      {
        status: 'PENDING',
        note: 'Weekly settlement batch auto-generated from 48 delivered orders.',
        timestamp: '2026-11-22T18:00:00Z',
        actor: 'Finance System',
      },
    ],
  },
  {
    id: 'pay_2026_1102',
    sellerId: 'sel_2',
    sellerName: 'Sharma Kirana & General Store',
    villageName: 'Rampur Kalan',
    vertical: 'GROCERY',
    periodLabel: '16 Nov – 22 Nov 2026',
    ordersCount: 64,
    grossAmountPaise: 2690000,
    commissionPaise: 53800,
    refundDeductionsPaise: 0,
    otherDeductionsPaise: 0,
    platformFeePaise: 19200,
    netPayablePaise: 2636200,
    paymentMode: 'UPI',
    status: 'PROCESSING',
    settlementDate: '2026-11-22T16:30:00Z',
    includedOrderIds: ['GB-ORD-1043', 'GB-ORD-1046', 'GB-ORD-1050'],
    notes: 'Shadow pilot active — verify net UPI pool before release.',
    history: [
      {
        status: 'PENDING',
        note: 'Batch generated for 64 kirana orders.',
        timestamp: '2026-11-22T14:00:00Z',
        actor: 'Finance System',
      },
      {
        status: 'PROCESSING',
        note: 'Moved to UPI payout queue by Finance Lead.',
        timestamp: '2026-11-22T16:30:00Z',
        actor: 'Finance Admin',
      },
    ],
  },
  {
    id: 'pay_2026_1106',
    sellerId: 'sel_4',
    sellerName: 'Kisan Agro & Daily Mart',
    villageName: 'Devgarh',
    vertical: 'GROCERY',
    periodLabel: '16 Nov – 22 Nov 2026',
    ordersCount: 31,
    grossAmountPaise: 1460000,
    commissionPaise: 29200,
    refundDeductionsPaise: 14500,
    otherDeductionsPaise: 1500,
    platformFeePaise: 9300,
    netPayablePaise: 1414800,
    paymentMode: 'NEFT_IMPS',
    status: 'PENDING',
    settlementDate: '2026-11-22T17:15:00Z',
    includedOrderIds: ['GB-ORD-1049', 'GB-ORD-1052', 'GB-ORD-1054'],
    notes: 'Includes ₹15.00 packaging adjustment and 1 partial refund deduction.',
    history: [
      {
        status: 'PENDING',
        note: 'Batch compiled for Devgarh grocery cycle.',
        timestamp: '2026-11-22T17:15:00Z',
        actor: 'Finance System',
      },
    ],
  },
  {
    id: 'pay_2026_1105',
    sellerId: 'sel_5',
    sellerName: 'Chandpur Sweet & Namkeen House',
    villageName: 'Chandpur',
    vertical: 'FOOD',
    periodLabel: '09 Nov – 15 Nov 2026',
    ordersCount: 24,
    grossAmountPaise: 980000,
    commissionPaise: 49000,
    refundDeductionsPaise: 12000,
    otherDeductionsPaise: 2500,
    platformFeePaise: 7200,
    netPayablePaise: 916500,
    paymentMode: 'NEFT_IMPS',
    status: 'FAILED',
    settlementDate: '2026-11-17T11:45:00Z',
    includedOrderIds: ['GB-ORD-1029', 'GB-ORD-1031', 'GB-ORD-1035'],
    notes: 'NEFT transfer bounced — beneficiary IFSC mismatch reported by bank.',
    history: [
      {
        status: 'PENDING',
        note: 'Batch prepared for weekly cycle.',
        timestamp: '2026-11-16T09:00:00Z',
        actor: 'Finance System',
      },
      {
        status: 'PROCESSING',
        note: 'Queued for bank NEFT disbursement.',
        timestamp: '2026-11-16T15:30:00Z',
        actor: 'Finance Admin',
      },
      {
        status: 'FAILED',
        note: 'Bank rejected NEFT due to IFSC code mismatch; seller notified to update KYC bank details.',
        timestamp: '2026-11-17T11:45:00Z',
        actor: 'Settlement Reconciliation',
      },
    ],
  },
  {
    id: 'pay_2026_1103',
    sellerId: 'sel_3',
    sellerName: 'Devgarh Royal Dhaba',
    villageName: 'Devgarh',
    vertical: 'FOOD',
    periodLabel: '09 Nov – 15 Nov 2026',
    ordersCount: 39,
    grossAmountPaise: 1520000,
    commissionPaise: 76000,
    refundDeductionsPaise: 18000,
    otherDeductionsPaise: 0,
    platformFeePaise: 11700,
    netPayablePaise: 1426000,
    paymentMode: 'NEFT_IMPS',
    utrNumber: 'UTR632019482711',
    status: 'SETTLED',
    settlementDate: '2026-11-16T14:20:00Z',
    settledAt: '2026-11-16T14:20:00Z',
    includedOrderIds: ['GB-ORD-1036', 'GB-ORD-1038', 'GB-ORD-1039'],
    notes: 'Settled to SBI Devgarh branch account.',
    history: [
      {
        status: 'PENDING',
        note: 'Weekly settlement batch generated.',
        timestamp: '2026-11-15T20:00:00Z',
        actor: 'Finance System',
      },
      {
        status: 'SETTLED',
        note: 'Disbursed via NEFT_IMPS (UTR632019482711).',
        timestamp: '2026-11-16T14:20:00Z',
        actor: 'Super Admin',
      },
    ],
  },
  {
    id: 'pay_2026_1104',
    sellerId: 'sel_4',
    sellerName: 'Kisan Agro & Daily Mart',
    villageName: 'Devgarh',
    vertical: 'GROCERY',
    periodLabel: '09 Nov – 15 Nov 2026',
    ordersCount: 27,
    grossAmountPaise: 1190000,
    commissionPaise: 23800,
    refundDeductionsPaise: 0,
    otherDeductionsPaise: 0,
    platformFeePaise: 8100,
    netPayablePaise: 1166200,
    paymentMode: 'UPI',
    utrNumber: 'UPI432198014422',
    status: 'SETTLED',
    settlementDate: '2026-11-16T15:05:00Z',
    settledAt: '2026-11-16T15:05:00Z',
    includedOrderIds: ['GB-ORD-1032', 'GB-ORD-1034', 'GB-ORD-1037'],
    notes: 'Direct UPI settlement verified.',
    history: [
      {
        status: 'SETTLED',
        note: 'Settled via Merchant UPI (UPI432198014422).',
        timestamp: '2026-11-16T15:05:00Z',
        actor: 'Super Admin',
      },
    ],
  },
];

const SEED_PAYMENT_TRANSACTIONS: PaymentTransactionRecord[] = [
  {
    id: 'txn_9001',
    orderId: 'GB-ORD-1042',
    customerName: 'Ramesh Kumar',
    customerPhone: '9876543210',
    sellerId: 'sel_1',
    sellerName: 'Maa Annapurna Bhojanalay',
    villageName: 'Rampur Kalan',
    vertical: 'FOOD',
    amountPaise: 42000,
    method: 'UPI',
    gatewayRef: 'RZP_UPI_99281722',
    status: 'CAPTURED',
    platformFeePaise: 500,
    createdAt: '2026-11-22T12:40:00Z',
  },
  {
    id: 'txn_9002',
    orderId: 'GB-ORD-1043',
    customerName: 'Sunita Devi',
    customerPhone: '9839011224',
    sellerId: 'sel_2',
    sellerName: 'Sharma Kirana & General Store',
    villageName: 'Rampur Kalan',
    vertical: 'GROCERY',
    amountPaise: 68500,
    method: 'COD',
    gatewayRef: 'COD_COLLECT_RMP',
    status: 'PENDING_COD',
    platformFeePaise: 0,
    createdAt: '2026-11-22T13:15:00Z',
  },
  {
    id: 'txn_9003',
    orderId: 'GB-ORD-1044',
    customerName: 'Arvind Patel',
    customerPhone: '9792166441',
    sellerId: 'sel_3',
    sellerName: 'Devgarh Royal Dhaba',
    villageName: 'Devgarh',
    vertical: 'FOOD',
    amountPaise: 54000,
    method: 'UDHARI',
    gatewayRef: 'KHATA_DEV_003',
    status: 'CAPTURED',
    platformFeePaise: 0,
    createdAt: '2026-11-22T14:02:00Z',
  },
  {
    id: 'txn_9005',
    orderId: 'GB-ORD-1047',
    customerName: 'Priya Mishra',
    customerPhone: '9889144512',
    sellerId: 'sel_5',
    sellerName: 'Chandpur Sweet & Namkeen House',
    villageName: 'Chandpur',
    vertical: 'FOOD',
    amountPaise: 38500,
    method: 'UPI',
    gatewayRef: 'RZP_UPI_99289011',
    status: 'FAILED',
    failureReason: 'UPI collect request timed out (Customer did not approve within 5 minutes)',
    createdAt: '2026-11-22T15:20:00Z',
  },
  {
    id: 'txn_9004',
    orderId: 'GB-ORD-1039',
    customerName: 'Kavita Sharma',
    customerPhone: '9918455320',
    sellerId: 'sel_3',
    sellerName: 'Devgarh Royal Dhaba',
    villageName: 'Devgarh',
    vertical: 'FOOD',
    amountPaise: 24000,
    method: 'UPI',
    gatewayRef: 'RZP_UPI_99271004',
    status: 'REFUNDED',
    refundId: 'ref_501',
    refundAmountPaise: 24000,
    createdAt: '2026-11-21T19:10:00Z',
  },
  {
    id: 'txn_9008',
    orderId: 'GB-2026-0029',
    customerName: 'Manoj Tiwari',
    customerPhone: '9911223344',
    sellerId: 'seller_gupta_kirana',
    sellerName: 'Gupta Kirana & General Store',
    villageName: 'Sitapur',
    vertical: 'GROCERY',
    amountPaise: 59500,
    method: 'UPI',
    gatewayRef: 'UPI432811229001',
    status: 'CAPTURED',
    refundId: 'ref_503',
    refundAmountPaise: 34000,
    platformFeePaise: 500,
    createdAt: '2026-11-20T11:20:00Z',
  },
];

const SEED_REFUNDS: RefundLedgerRecord[] = [
  {
    id: 'ref_501',
    orderId: 'GB-ORD-1039',
    originalTransactionId: 'txn_9004',
    originalPaymentMethod: 'UPI',
    originalAmountPaise: 24000,
    supportCaseId: 'SUP-901',
    customerName: 'Kavita Sharma',
    customerPhone: '9918455320',
    villageName: 'Devgarh',
    sellerName: 'Devgarh Royal Dhaba',
    amountPaise: 24000,
    reason: 'Missing Paneer Butter Masala item in dinner delivery',
    refundChannel: 'ORIGINAL_UPI',
    status: 'PROCESSED',
    requestedAt: '2026-11-21T20:05:00Z',
    processedAt: '2026-11-22T09:15:00Z',
    history: [
      {
        status: 'INITIATED',
        note: 'Refund request opened via Support Case SUP-901.',
        timestamp: '2026-11-21T20:05:00Z',
        actor: 'Support Desk',
      },
      {
        status: 'PROCESSED',
        note: 'Approved and settled to Original UPI account.',
        timestamp: '2026-11-22T09:15:00Z',
        actor: 'Super Admin',
      },
    ],
  },
  {
    id: 'ref_502',
    orderId: 'GB-ORD-1041',
    originalTransactionId: 'txn_9009',
    originalPaymentMethod: 'UPI',
    originalAmountPaise: 42000,
    supportCaseId: 'SUP-904',
    customerName: 'Ramesh Kumar',
    customerPhone: '9876543210',
    villageName: 'Rampur Kalan',
    sellerName: 'Sharma Kirana & General Store',
    amountPaise: 14500,
    reason: 'Torn 2kg Aata packet replaced partially with credit',
    refundChannel: 'STORE_CREDIT',
    status: 'INITIATED',
    requestedAt: '2026-11-22T11:30:00Z',
    history: [
      {
        status: 'INITIATED',
        note: 'Partial refund requested after photo proof verification.',
        timestamp: '2026-11-22T11:30:00Z',
        actor: 'Support Desk',
      },
    ],
  },
  {
    id: 'ref_503',
    orderId: 'GB-2026-0029',
    originalTransactionId: 'txn_9008',
    originalPaymentMethod: 'UPI',
    originalAmountPaise: 59500,
    supportCaseId: 'SUP-907',
    customerName: 'Manoj Tiwari',
    customerPhone: '9911223344',
    villageName: 'Sitapur',
    sellerName: 'Gupta Kirana & General Store',
    amountPaise: 34000,
    reason: 'Partial return refund for damaged 2L Mustard Oil bottle',
    refundChannel: 'ORIGINAL_UPI',
    status: 'INITIATED',
    requestedAt: '2026-11-22T14:10:00Z',
    history: [
      {
        status: 'INITIATED',
        note: 'Linked to returned order GB-2026-0029 (RET-2026-0118).',
        timestamp: '2026-11-22T14:10:00Z',
        actor: 'Ops Admin',
      },
    ],
  },
  {
    id: 'ref_504',
    orderId: 'GB-2026-0027',
    originalTransactionId: 'txn_9006',
    originalPaymentMethod: 'UPI',
    originalAmountPaise: 33925,
    customerName: 'Rajesh Patel',
    customerPhone: '9829012345',
    villageName: 'Madhavpur',
    sellerName: 'Sharma Shuddh Shakahari Dhaba',
    amountPaise: 33925,
    reason: 'Customer pre-prep cancellation on prepaid UPI order',
    refundChannel: 'ORIGINAL_UPI',
    status: 'PROCESSING',
    requestedAt: '2026-11-22T08:45:00Z',
    history: [
      {
        status: 'INITIATED',
        note: 'Prepaid cancellation auto-queued refund.',
        timestamp: '2026-11-22T08:45:00Z',
        actor: 'Order Ops',
      },
      {
        status: 'PROCESSING',
        note: 'Queued for UPI reversal settlement batch.',
        timestamp: '2026-11-22T10:15:00Z',
        actor: 'Finance Admin',
      },
    ],
  },
];

let financeSeedPromise: Promise<void> | null = null;

export async function seedAdminFinanceIfEmpty(): Promise<void> {
  if (!financeSeedPromise) {
    financeSeedPromise = (async () => {
      const [
        existingFees,
        existingOffers,
        existingTax,
        existingCancel,
        existingPayouts,
        existingTxns,
        existingRefunds,
      ] = await Promise.all([
        db.select({ id: adminFeeRules.id }).from(adminFeeRules).limit(1),
        db.select({ id: adminOffers.id }).from(adminOffers).limit(1),
        db.select({ id: adminTaxSlabs.id }).from(adminTaxSlabs).limit(1),
        db.select({ id: adminCancellationRules.id }).from(adminCancellationRules).limit(1),
        db.select({ id: adminSellerPayouts.id }).from(adminSellerPayouts).limit(1),
        db.select({ id: adminPaymentTransactions.id }).from(adminPaymentTransactions).limit(1),
        db.select({ id: adminRefundLedger.id }).from(adminRefundLedger).limit(1),
      ]);

      if (existingFees.length === 0) {
        await db
          .insert(adminFeeRules)
          .values(
            SEED_FEE_RULES.map((r) => ({
              externalId: r.id,
              name: r.name,
              vertical: r.vertical,
              commissionBps: r.commissionBps,
              platformFeePaise: r.platformFeePaise,
              effectiveFrom: r.effectiveFrom,
              isPilotShadowMode: r.isPilotShadowMode,
              status: r.status,
            }))
          )
          .onConflictDoNothing();
      }

      if (existingOffers.length === 0) {
        await db
          .insert(adminOffers)
          .values(
            SEED_OFFERS.map((o) => ({
              externalId: o.id,
              code: o.code,
              title: o.title,
              discountType: o.discountType,
              discountValue: o.discountValue,
              minOrderPaise: o.minOrderPaise,
              maxDiscountPaise: o.maxDiscountPaise ?? null,
              vertical: o.vertical,
              villageId: o.villageId,
              fundedBy: o.fundedBy,
              validFrom: o.validFrom,
              validUntil: o.validUntil,
              usageLimit: o.usageLimit,
              usedCount: o.usedCount,
              isActive: o.isActive,
            }))
          )
          .onConflictDoNothing();
      }

      if (existingTax.length === 0) {
        await db
          .insert(adminTaxSlabs)
          .values(
            SEED_TAX_SLABS.map((t) => ({
              externalId: t.id,
              name: t.name,
              vertical: t.vertical,
              gstPercent: String(t.gstPercent),
              hsnPrefix: t.hsnPrefix,
              isInclusive: t.isInclusive,
              description: t.description,
              isActive: t.isActive,
            }))
          )
          .onConflictDoNothing();
      }

      if (existingCancel.length === 0) {
        await db
          .insert(adminCancellationRules)
          .values(
            SEED_CANCELLATION_RULES.map((c) => ({
              externalId: c.id,
              actor: c.actor,
              code: c.code,
              label: c.label,
              freeCancelWindowMins: c.freeCancelWindowMins,
              penaltyPercent: c.penaltyPercent,
              autoRefundEligible: c.autoRefundEligible,
              isActive: c.isActive,
            }))
          )
          .onConflictDoNothing();
      }

      if (existingPayouts.length === 0) {
        await db
          .insert(adminSellerPayouts)
          .values(
            SEED_PAYOUTS.map((p) => ({
              externalId: p.id,
              sellerId: p.sellerId,
              sellerName: p.sellerName,
              villageName: p.villageName,
              vertical: p.vertical ?? null,
              periodLabel: p.periodLabel,
              ordersCount: p.ordersCount,
              grossAmountPaise: p.grossAmountPaise,
              commissionPaise: p.commissionPaise,
              refundDeductionsPaise: p.refundDeductionsPaise,
              otherDeductionsPaise: p.otherDeductionsPaise ?? 0,
              platformFeePaise: p.platformFeePaise ?? 0,
              netPayablePaise: p.netPayablePaise,
              paymentMode: p.paymentMode,
              utrNumber: p.utrNumber ?? null,
              status: p.status,
              settlementDate: p.settlementDate ?? null,
              settledAt: p.settledAt ?? null,
              includedOrderIdsJson: JSON.stringify(p.includedOrderIds ?? []),
              notes: p.notes ?? null,
              historyJson: JSON.stringify(p.history ?? []),
            }))
          )
          .onConflictDoNothing();
      }

      if (existingTxns.length === 0) {
        await db
          .insert(adminPaymentTransactions)
          .values(
            SEED_PAYMENT_TRANSACTIONS.map((t) => ({
              externalId: t.id,
              orderId: t.orderId,
              customerName: t.customerName,
              customerPhone: t.customerPhone ?? null,
              sellerId: t.sellerId ?? null,
              sellerName: t.sellerName,
              villageName: t.villageName,
              vertical: t.vertical ?? null,
              amountPaise: t.amountPaise,
              method: t.method,
              gatewayRef: t.gatewayRef,
              status: t.status,
              failureReason: t.failureReason ?? null,
              refundId: t.refundId ?? null,
              refundAmountPaise: t.refundAmountPaise ?? null,
              platformFeePaise: t.platformFeePaise ?? null,
              recordedAt: t.createdAt,
            }))
          )
          .onConflictDoNothing();
      }

      if (existingRefunds.length === 0) {
        await db
          .insert(adminRefundLedger)
          .values(
            SEED_REFUNDS.map((r) => ({
              externalId: r.id,
              orderId: r.orderId,
              originalTransactionId: r.originalTransactionId ?? null,
              originalPaymentMethod: r.originalPaymentMethod ?? null,
              originalAmountPaise: r.originalAmountPaise ?? null,
              supportCaseId: r.supportCaseId ?? null,
              customerName: r.customerName,
              customerPhone: r.customerPhone ?? null,
              villageName: r.villageName ?? null,
              sellerName: r.sellerName,
              amountPaise: r.amountPaise,
              reason: r.reason,
              rejectionReason: r.rejectionReason ?? null,
              refundChannel: r.refundChannel,
              status: r.status,
              requestedAt: r.requestedAt,
              processedAt: r.processedAt ?? null,
              historyJson: JSON.stringify(r.history ?? []),
            }))
          )
          .onConflictDoNothing();
      }
    })().catch((err) => {
      financeSeedPromise = null;
      throw err;
    });
  }
  await financeSeedPromise;
}

// =========================================================================
// ROW MAPPERS
// =========================================================================
function mapFeeRuleRow(row: typeof adminFeeRules.$inferSelect): FeeRuleRecord {
  return {
    id: row.externalId,
    name: row.name,
    vertical: row.vertical,
    commissionBps: row.commissionBps,
    platformFeePaise: row.platformFeePaise,
    effectiveFrom: row.effectiveFrom,
    isPilotShadowMode: row.isPilotShadowMode,
    status: row.status as FeeRuleRecord['status'],
  };
}

function mapOfferRow(row: typeof adminOffers.$inferSelect): OfferCouponRecord {
  return {
    id: row.externalId,
    code: row.code,
    title: row.title,
    discountType: row.discountType as OfferCouponRecord['discountType'],
    discountValue: row.discountValue,
    minOrderPaise: row.minOrderPaise,
    maxDiscountPaise: row.maxDiscountPaise ?? undefined,
    vertical: row.vertical,
    villageId: row.villageId,
    fundedBy: row.fundedBy as OfferCouponRecord['fundedBy'],
    validFrom: row.validFrom,
    validUntil: row.validUntil,
    usageLimit: row.usageLimit,
    usedCount: row.usedCount,
    isActive: row.isActive,
  };
}

function mapTaxSlabRow(row: typeof adminTaxSlabs.$inferSelect): TaxSlabRecord {
  return {
    id: row.externalId,
    name: row.name,
    vertical: row.vertical,
    gstPercent: Number(row.gstPercent),
    hsnPrefix: row.hsnPrefix,
    isInclusive: row.isInclusive,
    description: row.description,
    isActive: row.isActive,
  };
}

function mapCancellationRuleRow(
  row: typeof adminCancellationRules.$inferSelect
): CancellationPolicyRuleRecord {
  return {
    id: row.externalId,
    actor: row.actor as CancellationPolicyRuleRecord['actor'],
    code: row.code,
    label: row.label,
    freeCancelWindowMins: row.freeCancelWindowMins,
    penaltyPercent: row.penaltyPercent,
    autoRefundEligible: row.autoRefundEligible,
    isActive: row.isActive,
  };
}

function mapPayoutRow(row: typeof adminSellerPayouts.$inferSelect): SellerPayoutRecord {
  return {
    id: row.externalId,
    sellerId: row.sellerId,
    sellerName: row.sellerName,
    villageName: row.villageName,
    vertical: row.vertical ?? undefined,
    periodLabel: row.periodLabel,
    ordersCount: row.ordersCount,
    grossAmountPaise: row.grossAmountPaise,
    commissionPaise: row.commissionPaise,
    refundDeductionsPaise: row.refundDeductionsPaise,
    otherDeductionsPaise: row.otherDeductionsPaise,
    platformFeePaise: row.platformFeePaise,
    netPayablePaise: row.netPayablePaise,
    paymentMode: row.paymentMode as SellerPayoutRecord['paymentMode'],
    utrNumber: row.utrNumber ?? undefined,
    status: row.status as SellerPayoutRecord['status'],
    settlementDate: row.settlementDate ?? undefined,
    settledAt: row.settledAt ?? undefined,
    includedOrderIds: safeJsonParse<string[]>(row.includedOrderIdsJson, []),
    notes: row.notes ?? undefined,
    history: safeJsonParse<FinanceHistoryEntry[]>(row.historyJson, []),
  };
}

function mapPaymentTransactionRow(
  row: typeof adminPaymentTransactions.$inferSelect
): PaymentTransactionRecord {
  return {
    id: row.externalId,
    orderId: row.orderId,
    customerName: row.customerName,
    customerPhone: row.customerPhone ?? undefined,
    sellerId: row.sellerId ?? undefined,
    sellerName: row.sellerName,
    villageName: row.villageName,
    vertical: row.vertical ?? undefined,
    amountPaise: row.amountPaise,
    method: row.method as PaymentTransactionRecord['method'],
    gatewayRef: row.gatewayRef,
    status: row.status as PaymentTransactionRecord['status'],
    failureReason: row.failureReason ?? undefined,
    refundId: row.refundId ?? undefined,
    refundAmountPaise: row.refundAmountPaise ?? undefined,
    platformFeePaise: row.platformFeePaise ?? undefined,
    createdAt: row.recordedAt,
  };
}

function mapRefundRow(row: typeof adminRefundLedger.$inferSelect): RefundLedgerRecord {
  return {
    id: row.externalId,
    orderId: row.orderId,
    originalTransactionId: row.originalTransactionId ?? undefined,
    originalPaymentMethod: (row.originalPaymentMethod ?? undefined) as
      | RefundLedgerRecord['originalPaymentMethod']
      | undefined,
    originalAmountPaise: row.originalAmountPaise ?? undefined,
    supportCaseId: row.supportCaseId ?? undefined,
    customerName: row.customerName,
    customerPhone: row.customerPhone ?? undefined,
    villageName: row.villageName ?? undefined,
    sellerName: row.sellerName,
    amountPaise: row.amountPaise,
    reason: row.reason,
    rejectionReason: row.rejectionReason ?? undefined,
    refundChannel: row.refundChannel as RefundLedgerRecord['refundChannel'],
    status: row.status as RefundLedgerRecord['status'],
    requestedAt: row.requestedAt,
    processedAt: row.processedAt ?? undefined,
    history: safeJsonParse<FinanceHistoryEntry[]>(row.historyJson, []),
  };
}

// =========================================================================
// 1. FEE & COMMISSION RULES CRUD
// =========================================================================
export async function listAdminFeeRules(): Promise<FeeRuleRecord[]> {
  await seedAdminFinanceIfEmpty();
  const rows = await db.select().from(adminFeeRules).orderBy(desc(adminFeeRules.id));
  return rows.map(mapFeeRuleRow);
}

export async function createAdminFeeRule(
  input: Omit<FeeRuleRecord, 'id' | 'status'> & { id?: string }
): Promise<FeeRuleRecord> {
  await seedAdminFinanceIfEmpty();
  const externalId = input.id?.trim() || `fee_${Date.now()}`;
  const [created] = await db
    .insert(adminFeeRules)
    .values({
      externalId,
      name: input.name.trim(),
      vertical: input.vertical.trim(),
      commissionBps: Math.max(0, Math.min(5000, Math.round(input.commissionBps))),
      platformFeePaise: Math.max(0, Math.round(input.platformFeePaise)),
      effectiveFrom: input.effectiveFrom.trim(),
      isPilotShadowMode: Boolean(input.isPilotShadowMode),
      status: 'ACTIVE',
    })
    .returning();
  return mapFeeRuleRow(created);
}

export async function updateAdminFeeRule(
  externalId: string,
  patch: Partial<FeeRuleRecord>
): Promise<FeeRuleRecord | null> {
  await seedAdminFinanceIfEmpty();
  const [existing] = await db
    .select()
    .from(adminFeeRules)
    .where(eq(adminFeeRules.externalId, externalId))
    .limit(1);
  if (!existing) return null;

  const [updated] = await db
    .update(adminFeeRules)
    .set({
      name: patch.name !== undefined ? patch.name.trim() : existing.name,
      vertical: patch.vertical !== undefined ? patch.vertical.trim() : existing.vertical,
      commissionBps:
        patch.commissionBps !== undefined && Number.isFinite(patch.commissionBps)
          ? Math.max(0, Math.min(5000, Math.round(patch.commissionBps)))
          : existing.commissionBps,
      platformFeePaise:
        patch.platformFeePaise !== undefined && Number.isFinite(patch.platformFeePaise)
          ? Math.max(0, Math.round(patch.platformFeePaise))
          : existing.platformFeePaise,
      effectiveFrom:
        patch.effectiveFrom !== undefined ? patch.effectiveFrom.trim() : existing.effectiveFrom,
      isPilotShadowMode:
        patch.isPilotShadowMode !== undefined
          ? patch.isPilotShadowMode
          : existing.isPilotShadowMode,
      status: patch.status !== undefined ? patch.status : existing.status,
      updatedAt: new Date(),
    })
    .where(eq(adminFeeRules.id, existing.id))
    .returning();
  return mapFeeRuleRow(updated);
}

export async function toggleAdminFeeRuleShadow(externalId: string): Promise<FeeRuleRecord | null> {
  await seedAdminFinanceIfEmpty();
  const [existing] = await db
    .select()
    .from(adminFeeRules)
    .where(eq(adminFeeRules.externalId, externalId))
    .limit(1);
  if (!existing) return null;

  const [updated] = await db
    .update(adminFeeRules)
    .set({ isPilotShadowMode: !existing.isPilotShadowMode, updatedAt: new Date() })
    .where(eq(adminFeeRules.id, existing.id))
    .returning();
  return mapFeeRuleRow(updated);
}

export async function toggleAdminFeeRuleStatus(externalId: string): Promise<FeeRuleRecord | null> {
  await seedAdminFinanceIfEmpty();
  const [existing] = await db
    .select()
    .from(adminFeeRules)
    .where(eq(adminFeeRules.externalId, externalId))
    .limit(1);
  if (!existing) return null;

  const nextStatus = existing.status === 'ACTIVE' ? 'DEPRECATED' : 'ACTIVE';
  const [updated] = await db
    .update(adminFeeRules)
    .set({ status: nextStatus, updatedAt: new Date() })
    .where(eq(adminFeeRules.id, existing.id))
    .returning();
  return mapFeeRuleRow(updated);
}

// =========================================================================
// 2. OFFERS & COUPONS CRUD
// =========================================================================
export async function listAdminOffers(activeOnly = false): Promise<OfferCouponRecord[]> {
  await seedAdminFinanceIfEmpty();
  const rows = activeOnly
    ? await db
        .select()
        .from(adminOffers)
        .where(eq(adminOffers.isActive, true))
        .orderBy(desc(adminOffers.id))
    : await db.select().from(adminOffers).orderBy(desc(adminOffers.id));
  return rows.map(mapOfferRow);
}

export async function createAdminOffer(
  input: Omit<OfferCouponRecord, 'id' | 'usedCount'> & { id?: string }
): Promise<OfferCouponRecord> {
  await seedAdminFinanceIfEmpty();
  const externalId = input.id?.trim() || `off_${Date.now()}`;
  const [created] = await db
    .insert(adminOffers)
    .values({
      externalId,
      code: input.code.trim().toUpperCase(),
      title: input.title.trim(),
      discountType: input.discountType,
      discountValue: Math.max(0, Math.round(input.discountValue)),
      minOrderPaise: Math.max(0, Math.round(input.minOrderPaise)),
      maxDiscountPaise:
        input.maxDiscountPaise !== undefined && Number.isFinite(input.maxDiscountPaise)
          ? Math.max(0, Math.round(input.maxDiscountPaise))
          : null,
      vertical: input.vertical.trim() || 'ALL',
      villageId: input.villageId.trim() || 'ALL',
      fundedBy: input.fundedBy,
      validFrom: input.validFrom.trim(),
      validUntil: input.validUntil.trim(),
      usageLimit: Math.max(1, Math.round(input.usageLimit || 100)),
      usedCount: 0,
      isActive: input.isActive ?? true,
    })
    .returning();
  return mapOfferRow(created);
}

export async function updateAdminOffer(
  externalId: string,
  patch: Partial<OfferCouponRecord>
): Promise<OfferCouponRecord | null> {
  await seedAdminFinanceIfEmpty();
  const [existing] = await db
    .select()
    .from(adminOffers)
    .where(eq(adminOffers.externalId, externalId))
    .limit(1);
  if (!existing) return null;

  const [updated] = await db
    .update(adminOffers)
    .set({
      code: patch.code !== undefined ? patch.code.trim().toUpperCase() : existing.code,
      title: patch.title !== undefined ? patch.title.trim() : existing.title,
      discountType: patch.discountType !== undefined ? patch.discountType : existing.discountType,
      discountValue:
        patch.discountValue !== undefined && Number.isFinite(patch.discountValue)
          ? Math.max(0, Math.round(patch.discountValue))
          : existing.discountValue,
      minOrderPaise:
        patch.minOrderPaise !== undefined && Number.isFinite(patch.minOrderPaise)
          ? Math.max(0, Math.round(patch.minOrderPaise))
          : existing.minOrderPaise,
      maxDiscountPaise:
        patch.maxDiscountPaise !== undefined
          ? Number.isFinite(patch.maxDiscountPaise)
            ? Math.max(0, Math.round(patch.maxDiscountPaise))
            : null
          : existing.maxDiscountPaise,
      vertical: patch.vertical !== undefined ? patch.vertical.trim() : existing.vertical,
      villageId: patch.villageId !== undefined ? patch.villageId.trim() : existing.villageId,
      fundedBy: patch.fundedBy !== undefined ? patch.fundedBy : existing.fundedBy,
      validFrom: patch.validFrom !== undefined ? patch.validFrom.trim() : existing.validFrom,
      validUntil: patch.validUntil !== undefined ? patch.validUntil.trim() : existing.validUntil,
      usageLimit:
        patch.usageLimit !== undefined && Number.isFinite(patch.usageLimit)
          ? Math.max(1, Math.round(patch.usageLimit))
          : existing.usageLimit,
      isActive: patch.isActive !== undefined ? patch.isActive : existing.isActive,
      updatedAt: new Date(),
    })
    .where(eq(adminOffers.id, existing.id))
    .returning();
  return mapOfferRow(updated);
}

export async function toggleAdminOfferStatus(externalId: string): Promise<OfferCouponRecord | null> {
  await seedAdminFinanceIfEmpty();
  const [existing] = await db
    .select()
    .from(adminOffers)
    .where(eq(adminOffers.externalId, externalId))
    .limit(1);
  if (!existing) return null;

  const [updated] = await db
    .update(adminOffers)
    .set({ isActive: !existing.isActive, updatedAt: new Date() })
    .where(eq(adminOffers.id, existing.id))
    .returning();
  return mapOfferRow(updated);
}

export async function deleteAdminOffer(externalId: string): Promise<boolean> {
  await seedAdminFinanceIfEmpty();
  const deleted = await db
    .delete(adminOffers)
    .where(eq(adminOffers.externalId, externalId))
    .returning({ id: adminOffers.id });
  return deleted.length > 0;
}

// =========================================================================
// 3. TAX SLABS CRUD
// =========================================================================
export async function listAdminTaxSlabs(): Promise<TaxSlabRecord[]> {
  await seedAdminFinanceIfEmpty();
  const rows = await db.select().from(adminTaxSlabs).orderBy(asc(adminTaxSlabs.id));
  return rows.map(mapTaxSlabRow);
}

export async function createAdminTaxSlab(
  input: Omit<TaxSlabRecord, 'id'> & { id?: string }
): Promise<TaxSlabRecord> {
  await seedAdminFinanceIfEmpty();
  const externalId = input.id?.trim() || `tax_${Date.now()}`;
  const [created] = await db
    .insert(adminTaxSlabs)
    .values({
      externalId,
      name: input.name.trim(),
      vertical: input.vertical.trim() || 'ALL',
      gstPercent: String(Math.max(0, Math.min(50, Number(input.gstPercent) || 0))),
      hsnPrefix: input.hsnPrefix.trim(),
      isInclusive: Boolean(input.isInclusive),
      description: input.description.trim(),
      isActive: input.isActive ?? true,
    })
    .returning();
  return mapTaxSlabRow(created);
}

export async function updateAdminTaxSlab(
  externalId: string,
  patch: Partial<TaxSlabRecord>
): Promise<TaxSlabRecord | null> {
  await seedAdminFinanceIfEmpty();
  const [existing] = await db
    .select()
    .from(adminTaxSlabs)
    .where(eq(adminTaxSlabs.externalId, externalId))
    .limit(1);
  if (!existing) return null;

  const [updated] = await db
    .update(adminTaxSlabs)
    .set({
      name: patch.name !== undefined ? patch.name.trim() : existing.name,
      vertical: patch.vertical !== undefined ? patch.vertical.trim() : existing.vertical,
      gstPercent:
        patch.gstPercent !== undefined && Number.isFinite(patch.gstPercent)
          ? String(Math.max(0, Math.min(50, patch.gstPercent)))
          : existing.gstPercent,
      hsnPrefix: patch.hsnPrefix !== undefined ? patch.hsnPrefix.trim() : existing.hsnPrefix,
      isInclusive: patch.isInclusive !== undefined ? patch.isInclusive : existing.isInclusive,
      description: patch.description !== undefined ? patch.description.trim() : existing.description,
      isActive: patch.isActive !== undefined ? patch.isActive : existing.isActive,
      updatedAt: new Date(),
    })
    .where(eq(adminTaxSlabs.id, existing.id))
    .returning();
  return mapTaxSlabRow(updated);
}

export async function toggleAdminTaxSlabStatus(externalId: string): Promise<TaxSlabRecord | null> {
  await seedAdminFinanceIfEmpty();
  const [existing] = await db
    .select()
    .from(adminTaxSlabs)
    .where(eq(adminTaxSlabs.externalId, externalId))
    .limit(1);
  if (!existing) return null;

  const [updated] = await db
    .update(adminTaxSlabs)
    .set({ isActive: !existing.isActive, updatedAt: new Date() })
    .where(eq(adminTaxSlabs.id, existing.id))
    .returning();
  return mapTaxSlabRow(updated);
}

export async function deleteAdminTaxSlab(externalId: string): Promise<boolean> {
  await seedAdminFinanceIfEmpty();
  const deleted = await db
    .delete(adminTaxSlabs)
    .where(eq(adminTaxSlabs.externalId, externalId))
    .returning({ id: adminTaxSlabs.id });
  return deleted.length > 0;
}

// =========================================================================
// 4. CANCELLATION POLICY RULES CRUD
// =========================================================================
export async function listAdminCancellationRules(): Promise<CancellationPolicyRuleRecord[]> {
  await seedAdminFinanceIfEmpty();
  const rows = await db
    .select()
    .from(adminCancellationRules)
    .orderBy(asc(adminCancellationRules.id));
  return rows.map(mapCancellationRuleRow);
}

export async function createAdminCancellationRule(
  input: Omit<CancellationPolicyRuleRecord, 'id'> & { id?: string }
): Promise<CancellationPolicyRuleRecord> {
  await seedAdminFinanceIfEmpty();
  const externalId = input.id?.trim() || `can_${Date.now()}`;
  const [created] = await db
    .insert(adminCancellationRules)
    .values({
      externalId,
      actor: input.actor,
      code: input.code.trim().toUpperCase(),
      label: input.label.trim(),
      freeCancelWindowMins: Math.max(0, Math.round(input.freeCancelWindowMins || 0)),
      penaltyPercent: Math.max(0, Math.min(100, Math.round(input.penaltyPercent || 0))),
      autoRefundEligible: Boolean(input.autoRefundEligible),
      isActive: input.isActive ?? true,
    })
    .returning();
  return mapCancellationRuleRow(created);
}

export async function updateAdminCancellationRule(
  externalId: string,
  patch: Partial<CancellationPolicyRuleRecord>
): Promise<CancellationPolicyRuleRecord | null> {
  await seedAdminFinanceIfEmpty();
  const [existing] = await db
    .select()
    .from(adminCancellationRules)
    .where(eq(adminCancellationRules.externalId, externalId))
    .limit(1);
  if (!existing) return null;

  const [updated] = await db
    .update(adminCancellationRules)
    .set({
      actor: patch.actor !== undefined ? patch.actor : existing.actor,
      code: patch.code !== undefined ? patch.code.trim().toUpperCase() : existing.code,
      label: patch.label !== undefined ? patch.label.trim() : existing.label,
      freeCancelWindowMins:
        patch.freeCancelWindowMins !== undefined && Number.isFinite(patch.freeCancelWindowMins)
          ? Math.max(0, Math.round(patch.freeCancelWindowMins))
          : existing.freeCancelWindowMins,
      penaltyPercent:
        patch.penaltyPercent !== undefined && Number.isFinite(patch.penaltyPercent)
          ? Math.max(0, Math.min(100, Math.round(patch.penaltyPercent)))
          : existing.penaltyPercent,
      autoRefundEligible:
        patch.autoRefundEligible !== undefined
          ? patch.autoRefundEligible
          : existing.autoRefundEligible,
      isActive: patch.isActive !== undefined ? patch.isActive : existing.isActive,
      updatedAt: new Date(),
    })
    .where(eq(adminCancellationRules.id, existing.id))
    .returning();
  return mapCancellationRuleRow(updated);
}

export async function toggleAdminCancellationRuleStatus(
  externalId: string
): Promise<CancellationPolicyRuleRecord | null> {
  await seedAdminFinanceIfEmpty();
  const [existing] = await db
    .select()
    .from(adminCancellationRules)
    .where(eq(adminCancellationRules.externalId, externalId))
    .limit(1);
  if (!existing) return null;

  const [updated] = await db
    .update(adminCancellationRules)
    .set({ isActive: !existing.isActive, updatedAt: new Date() })
    .where(eq(adminCancellationRules.id, existing.id))
    .returning();
  return mapCancellationRuleRow(updated);
}

export async function deleteAdminCancellationRule(externalId: string): Promise<boolean> {
  await seedAdminFinanceIfEmpty();
  const deleted = await db
    .delete(adminCancellationRules)
    .where(eq(adminCancellationRules.externalId, externalId))
    .returning({ id: adminCancellationRules.id });
  return deleted.length > 0;
}

// =========================================================================
// 5. SELLER PAYOUTS, PAYMENT TRANSACTIONS & REFUND LEDGER
// =========================================================================
export async function listAdminPayouts(): Promise<SellerPayoutRecord[]> {
  await seedAdminFinanceIfEmpty();
  const rows = await db
    .select()
    .from(adminSellerPayouts)
    .orderBy(asc(adminSellerPayouts.id));
  return rows.map(mapPayoutRow);
}

export async function markAdminPayoutProcessing(params: {
  externalId: string;
  actorName: string;
}): Promise<SellerPayoutRecord | null> {
  await seedAdminFinanceIfEmpty();
  return await db.transaction(async (tx) => {
    const [existing] = await tx
      .select()
      .from(adminSellerPayouts)
      .where(eq(adminSellerPayouts.externalId, params.externalId))
      .limit(1);
    if (!existing) return null;

    const history = safeJsonParse<FinanceHistoryEntry[]>(existing.historyJson, []);
    history.push({
      status: 'PROCESSING',
      note: 'Moved settlement batch to active bank/UPI processing queue.',
      timestamp: new Date().toISOString(),
      actor: params.actorName,
    });

    const [updated] = await tx
      .update(adminSellerPayouts)
      .set({
        status: 'PROCESSING',
        historyJson: JSON.stringify(history),
        updatedAt: new Date(),
      })
      .where(eq(adminSellerPayouts.id, existing.id))
      .returning();
    return mapPayoutRow(updated);
  });
}

export async function settleAdminPayout(params: {
  externalId: string;
  paymentMode: SellerPayoutRecord['paymentMode'];
  utrNumber: string;
  notes?: string;
  actorName: string;
}): Promise<SellerPayoutRecord | null> {
  await seedAdminFinanceIfEmpty();
  return await db.transaction(async (tx) => {
    const [existing] = await tx
      .select()
      .from(adminSellerPayouts)
      .where(eq(adminSellerPayouts.externalId, params.externalId))
      .limit(1);
    if (!existing) return null;

    const nowIso = new Date().toISOString();
    const history = safeJsonParse<FinanceHistoryEntry[]>(existing.historyJson, []);
    history.push({
      status: 'SETTLED',
      note: `Settled via ${params.paymentMode} (UTR: ${params.utrNumber})${
        params.notes ? ` — ${params.notes}` : ''
      }`,
      timestamp: nowIso,
      actor: params.actorName,
    });

    const [updated] = await tx
      .update(adminSellerPayouts)
      .set({
        status: 'SETTLED',
        paymentMode: params.paymentMode,
        utrNumber: params.utrNumber.trim(),
        notes: params.notes?.trim() || existing.notes,
        settledAt: nowIso,
        settlementDate: nowIso,
        historyJson: JSON.stringify(history),
        updatedAt: new Date(),
      })
      .where(eq(adminSellerPayouts.id, existing.id))
      .returning();
    return mapPayoutRow(updated);
  });
}

export async function listAdminPaymentTransactions(): Promise<PaymentTransactionRecord[]> {
  await seedAdminFinanceIfEmpty();
  const rows = await db
    .select()
    .from(adminPaymentTransactions)
    .orderBy(desc(adminPaymentTransactions.id));
  return rows.map(mapPaymentTransactionRow);
}

export async function listAdminRefunds(): Promise<RefundLedgerRecord[]> {
  await seedAdminFinanceIfEmpty();
  const rows = await db
    .select()
    .from(adminRefundLedger)
    .orderBy(desc(adminRefundLedger.id));
  return rows.map(mapRefundRow);
}

export async function updateAdminRefundStatus(params: {
  externalId: string;
  status: RefundLedgerRecord['status'];
  reason?: string;
  actorName: string;
}): Promise<RefundLedgerRecord | null> {
  await seedAdminFinanceIfEmpty();
  return await db.transaction(async (tx) => {
    const [existing] = await tx
      .select()
      .from(adminRefundLedger)
      .where(eq(adminRefundLedger.externalId, params.externalId))
      .limit(1);
    if (!existing) return null;

    const nowIso = new Date().toISOString();
    const history = safeJsonParse<FinanceHistoryEntry[]>(existing.historyJson, []);
    history.push({
      status: params.status,
      note:
        params.reason ||
        (params.status === 'PROCESSED'
          ? 'Approved and marked completed by Finance Admin.'
          : params.status === 'REJECTED'
          ? 'Refund request rejected.'
          : `Refund status updated to ${params.status}.`),
      timestamp: nowIso,
      actor: params.actorName,
    });

    const [updated] = await tx
      .update(adminRefundLedger)
      .set({
        status: params.status,
        rejectionReason:
          params.status === 'REJECTED'
            ? params.reason || existing.rejectionReason
            : existing.rejectionReason,
        processedAt:
          params.status === 'PROCESSED' || params.status === 'REJECTED'
            ? nowIso
            : existing.processedAt,
        historyJson: JSON.stringify(history),
        updatedAt: new Date(),
      })
      .where(eq(adminRefundLedger.id, existing.id))
      .returning();
    return mapRefundRow(updated);
  });
}

export async function getAdminFinanceBundle() {
  await seedAdminFinanceIfEmpty();
  const [
    feeRules,
    offers,
    taxSlabs,
    cancellationRules,
    payouts,
    paymentTransactions,
    refundLedger,
  ] = await Promise.all([
    listAdminFeeRules(),
    listAdminOffers(false),
    listAdminTaxSlabs(),
    listAdminCancellationRules(),
    listAdminPayouts(),
    listAdminPaymentTransactions(),
    listAdminRefunds(),
  ]);

  return {
    feeRules,
    offers,
    taxSlabs,
    cancellationRules,
    payouts,
    paymentTransactions,
    refundLedger,
  };
}

// =========================================================================
// 6. ORDER LIFECYCLE ACTIONS (Cancel / Return / Refund -> PostgreSQL)
// =========================================================================
export async function adminCancelDbOrder(params: {
  orderNumber: string;
  cancelledBy: 'CUSTOMER' | 'SELLER' | 'ADMIN';
  reason: string;
  refundEligible: boolean;
  notes?: string;
}) {
  return await db.transaction(async (tx) => {
    const [existing] = await tx
      .select()
      .from(orders)
      .where(eq(orders.orderNumber, params.orderNumber))
      .limit(1);
    if (!existing) return null;

    const nowIso = new Date().toISOString();
    const cancellation = {
      cancelledBy: params.cancelledBy,
      reason: params.reason,
      cancelledAt: nowIso,
      refundEligible: params.refundEligible,
      notes: params.notes,
    };
    const nextPaymentStatus =
      !params.refundEligible && existing.paymentStatus === 'pending'
        ? 'reversed'
        : existing.paymentStatus;

    const [updated] = await tx
      .update(orders)
      .set({
        status: 'cancelled',
        paymentStatus: nextPaymentStatus,
        cancellationJson: JSON.stringify(cancellation),
        updatedAt: new Date(),
      })
      .where(eq(orders.id, existing.id))
      .returning();

    await tx.insert(orderStatusHistory).values({
      orderId: existing.id,
      fromStatus: existing.status,
      toStatus: 'cancelled',
      actorRole: params.cancelledBy,
      reason: params.reason,
    });

    return {
      orderNumber: updated.orderNumber,
      status: updated.status,
      paymentStatus: updated.paymentStatus,
      cancellation,
    };
  });
}

export async function recordDbOrderReturn(params: {
  orderNumber: string;
  status: 'REQUESTED' | 'APPROVED' | 'PICKED_UP' | 'RECEIVED' | 'REJECTED';
  reason: string;
  returnedItems: Array<{
    orderItemId: string;
    productName: string;
    variantLabel?: string;
    quantity: number;
    unitLabel: string;
    refundValuePaise: number;
    conditionNote?: string;
  }>;
  notes?: string;
}) {
  return await db.transaction(async (tx) => {
    const [existing] = await tx
      .select()
      .from(orders)
      .where(eq(orders.orderNumber, params.orderNumber))
      .limit(1);
    if (!existing) return null;

    const nowIso = new Date().toISOString();
    const prevReturn = safeJsonParse<Record<string, unknown> | null>(existing.returnInfoJson, null);
    const nextStatus = params.status === 'REJECTED' ? existing.status : 'returned';

    const returnInfo = {
      returnId:
        (typeof prevReturn?.returnId === 'string' && prevReturn.returnId) ||
        `RET-2026-${String(Date.now()).slice(-4)}`,
      status: params.status,
      reason: params.reason,
      requestedAt:
        (typeof prevReturn?.requestedAt === 'string' && prevReturn.requestedAt) || nowIso,
      updatedAt: nowIso,
      returnedItems: params.returnedItems,
      notes: params.notes,
    };

    const [updated] = await tx
      .update(orders)
      .set({
        status: nextStatus,
        returnInfoJson: JSON.stringify(returnInfo),
        updatedAt: new Date(),
      })
      .where(eq(orders.id, existing.id))
      .returning();

    await tx.insert(orderStatusHistory).values({
      orderId: existing.id,
      fromStatus: existing.status,
      toStatus: nextStatus,
      actorRole: 'ADMIN',
      reason: `Return ${params.status.toLowerCase().replace(/_/g, ' ')}: ${params.reason}`,
    });

    return {
      orderNumber: updated.orderNumber,
      status: updated.status,
      returnInfo,
    };
  });
}

export async function processDbOrderRefund(params: {
  orderNumber: string;
  amountPaise: number;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  method: 'ORIGINAL_UPI' | 'BANK_TRANSFER' | 'UDHAR_REVERSAL' | 'CASH_SETTLEMENT' | 'STORE_CREDIT';
  reason: string;
  referenceId?: string;
  initiatedBy: string;
  failureReason?: string;
}) {
  await seedAdminFinanceIfEmpty();

  return await db.transaction(async (tx) => {
    const [existing] = await tx
      .select()
      .from(orders)
      .where(eq(orders.orderNumber, params.orderNumber))
      .limit(1);
    if (!existing) return null;

    const [sellerRow] = await tx
      .select({ publicName: sellers.publicName })
      .from(sellers)
      .where(eq(sellers.id, existing.sellerId))
      .limit(1);

    const nowIso = new Date().toISOString();
    const prevRefund = safeJsonParse<Record<string, unknown> | null>(existing.refundInfoJson, null);
    const totalPaise = Math.round(Number(existing.totalAmount) * 100);
    const isCompleted = params.status === 'COMPLETED';
    const isFullRefund = params.amountPaise >= totalPaise;

    const nextOrderStatus = isCompleted ? 'refunded' : existing.status;
    const nextPaymentStatus = isCompleted
      ? isFullRefund
        ? 'refunded'
        : 'partially_refunded'
      : existing.paymentStatus;

    const refundId =
      (typeof prevRefund?.refundId === 'string' && prevRefund.refundId) ||
      `RFD-2026-${String(Date.now()).slice(-4)}`;
    const referenceId =
      params.referenceId?.trim() ||
      (typeof prevRefund?.referenceId === 'string' ? prevRefund.referenceId : undefined) ||
      (isCompleted ? `UTR-${String(Date.now()).slice(-8)}` : undefined);

    const refundInfo = {
      refundId,
      amountPaise: params.amountPaise,
      status: params.status,
      method: params.method,
      reason: params.reason,
      initiatedAt:
        (typeof prevRefund?.initiatedAt === 'string' && prevRefund.initiatedAt) || nowIso,
      completedAt: isCompleted
        ? nowIso
        : typeof prevRefund?.completedAt === 'string'
        ? prevRefund.completedAt
        : undefined,
      referenceId,
      initiatedBy: params.initiatedBy,
      failureReason: params.status === 'FAILED' ? params.failureReason : undefined,
    };

    const [updated] = await tx
      .update(orders)
      .set({
        status: nextOrderStatus,
        paymentStatus: nextPaymentStatus,
        refundInfoJson: JSON.stringify(refundInfo),
        updatedAt: new Date(),
      })
      .where(eq(orders.id, existing.id))
      .returning();

    await tx.insert(orderStatusHistory).values({
      orderId: existing.id,
      fromStatus: existing.status,
      toStatus: nextOrderStatus,
      actorRole: 'ADMIN',
      reason:
        params.status === 'FAILED'
          ? `Refund ${refundId} failed: ${params.failureReason || params.reason}`
          : `Refund ${refundId} marked ${params.status} (₹${(params.amountPaise / 100).toFixed(
              2
            )} via ${params.method.replace(/_/g, ' ')}) — ${params.reason}`,
    });

    // Sync into admin_refund_ledger automatically
    const ledgerStatus: RefundLedgerRecord['status'] =
      params.status === 'COMPLETED'
        ? 'PROCESSED'
        : params.status === 'FAILED'
        ? 'FAILED'
        : params.status === 'PROCESSING'
        ? 'PROCESSING'
        : 'INITIATED';
    const ledgerChannel: RefundLedgerRecord['refundChannel'] =
      params.method === 'STORE_CREDIT'
        ? 'STORE_CREDIT'
        : params.method === 'CASH_SETTLEMENT' || params.method === 'UDHAR_REVERSAL'
        ? 'CASH_ADJUSTMENT'
        : 'ORIGINAL_UPI';

    const [existingLedger] = await tx
      .select()
      .from(adminRefundLedger)
      .where(eq(adminRefundLedger.externalId, refundId))
      .limit(1);

    if (existingLedger) {
      const history = safeJsonParse<FinanceHistoryEntry[]>(existingLedger.historyJson, []);
      history.push({
        status: ledgerStatus,
        note: params.reason,
        timestamp: nowIso,
        actor: params.initiatedBy,
      });
      await tx
        .update(adminRefundLedger)
        .set({
          amountPaise: params.amountPaise,
          status: ledgerStatus,
          refundChannel: ledgerChannel,
          processedAt: isCompleted ? nowIso : existingLedger.processedAt,
          historyJson: JSON.stringify(history),
          updatedAt: new Date(),
        })
        .where(eq(adminRefundLedger.id, existingLedger.id));
    } else {
      await tx.insert(adminRefundLedger).values({
        externalId: refundId,
        orderId: existing.orderNumber,
        originalPaymentMethod:
          existing.paymentMethod === 'SELLER_UPI'
            ? 'UPI'
            : existing.paymentMethod === 'UDHAR'
            ? 'UDHARI'
            : 'COD',
        originalAmountPaise: totalPaise,
        customerName: existing.customerName,
        customerPhone: existing.customerPhone,
        villageName: existing.villageCode,
        sellerName: sellerRow?.publicName || 'GramBazaar Store',
        amountPaise: params.amountPaise,
        reason: params.reason,
        refundChannel: ledgerChannel,
        status: ledgerStatus,
        requestedAt: nowIso,
        processedAt: isCompleted ? nowIso : null,
        historyJson: JSON.stringify([
          {
            status: ledgerStatus,
            note: params.reason,
            timestamp: nowIso,
            actor: params.initiatedBy,
          },
        ]),
      });
    }

    return {
      orderNumber: updated.orderNumber,
      status: updated.status,
      paymentStatus: updated.paymentStatus,
      refundInfo,
    };
  });
}
