import { asc, count, desc, eq } from 'drizzle-orm';
import { db } from './index.ts';
import {
  adminBroadcasts,
  adminCmsBanners,
  adminCmsPolicies,
  adminCustomers,
  adminFeaturedSellers,
  adminPlatformSettings,
  adminReviews,
  adminSupportCases,
} from './schema.ts';
import type {
  AdminCustomerRecord,
  BroadcastMessageRecord,
  CmsBannerRecord,
  CmsPolicyPageRecord,
  CustomerReviewRecord,
  PlatformSettingsRecord,
  SupportCaseRecord,
  SupportIssueType,
} from '../types/admin.ts';

// ---------------------------------------------------------------------------
// Initial Seed Records (idempotently inserted when tables are empty)
// ---------------------------------------------------------------------------

const SEED_SUPPORT_CASES: SupportCaseRecord[] = [
  {
    id: 'case_101',
    orderId: 'ORD-RAM-0881',
    vertical: 'FOOD',
    customerName: 'Suresh Kumar',
    customerPhone: '+91 98222 33441',
    sellerId: 'sel_01',
    sellerName: 'Chaudhary Dhaba & Sweets',
    issueType: 'MISSING_ITEM',
    status: 'OPEN',
    amountPaise: 12000,
    description: 'Ordered 2 Paneer Butter Masala and 4 Rotis. Received only 1 Paneer Butter Masala.',
    createdAt: '2026-11-02T07:15:00Z',
    updatedAt: '2026-11-02T07:15:00Z',
  },
  {
    id: 'case_102',
    orderId: 'ORD-RAM-0879',
    vertical: 'GROCERY',
    customerName: 'Anita Verma',
    customerPhone: '+91 98333 44552',
    sellerId: 'sel_02',
    sellerName: 'Gupta Kirana & General Store',
    issueType: 'DAMAGED_IN_TRANSIT',
    status: 'INVESTIGATING',
    amountPaise: 18000,
    description: 'Mustard oil bottle seal was broken during runner transit.',
    resolutionNotes: 'Spoke with shopkeeper Mohan Gupta; agreed to issue runner replacement.',
    createdAt: '2026-11-01T15:30:00Z',
    updatedAt: '2026-11-01T17:00:00Z',
  },
  {
    id: 'case_103',
    orderId: 'ORD-RAM-0864',
    vertical: 'APPAREL',
    customerName: 'Deepak Mishra',
    customerPhone: '+91 99182 55109',
    sellerId: 'sel_06',
    sellerName: 'Shree Ram Vastra Bhandar',
    issueType: 'WRONG_VARIANT',
    status: 'OPEN',
    amountPaise: 64900,
    description: 'Ordered Size L White Khadi Kurta but received Size M.',
    createdAt: '2026-11-02T08:10:00Z',
    updatedAt: '2026-11-02T08:10:00Z',
  },
];

const SEED_CUSTOMERS: AdminCustomerRecord[] = [
  {
    id: 'cust_001',
    name: 'Ramesh Kumar',
    phone: '+91 98765 43210',
    email: 'ramesh.rampur@example.com',
    villageId: 'vil_rampur',
    villageName: 'Rampur Kalan',
    landmark: 'Near Gram Panchayat Bhawan',
    totalOrders: 28,
    totalSpendPaise: 1425000,
    udhariBalancePaise: 45000,
    status: 'ACTIVE',
    joinedAt: '2026-08-14',
    lastOrderAt: '2026-11-22',
    adminNotes: 'Regular weekly grocery & family dinner customer.',
  },
  {
    id: 'cust_002',
    name: 'Sunita Devi',
    phone: '+91 98390 11224',
    email: 'sunita.devi@example.com',
    villageId: 'vil_rampur',
    villageName: 'Rampur Kalan',
    landmark: 'Primary School Road, Ward 4',
    totalOrders: 19,
    totalSpendPaise: 968000,
    udhariBalancePaise: 0,
    status: 'ACTIVE',
    joinedAt: '2026-08-29',
    lastOrderAt: '2026-11-21',
  },
  {
    id: 'cust_003',
    name: 'Arvind Patel',
    phone: '+91 97921 66441',
    email: 'arvind.patel@example.com',
    villageId: 'vil_devgarh',
    villageName: 'Devgarh',
    landmark: 'Hanuman Mandir Chauraha',
    totalOrders: 34,
    totalSpendPaise: 2180000,
    udhariBalancePaise: 120000,
    status: 'ACTIVE',
    joinedAt: '2026-07-19',
    lastOrderAt: '2026-11-22',
    adminNotes: 'Bulk kirana buyer for joint family.',
  },
  {
    id: 'cust_004',
    name: 'Kavita Sharma',
    phone: '+91 99184 55320',
    email: 'kavita.sharma@example.com',
    villageId: 'vil_devgarh',
    villageName: 'Devgarh',
    landmark: 'Sub-Health Center Colony',
    totalOrders: 12,
    totalSpendPaise: 540000,
    udhariBalancePaise: 0,
    status: 'ACTIVE',
    joinedAt: '2026-09-12',
    lastOrderAt: '2026-11-18',
  },
  {
    id: 'cust_005',
    name: 'Deepak Yadav',
    phone: '+91 94510 88219',
    email: 'deepak.y@example.com',
    villageId: 'vil_rampur',
    villageName: 'Rampur Kalan',
    landmark: 'Bus Stand Behind Petrol Pump',
    totalOrders: 5,
    totalSpendPaise: 185000,
    udhariBalancePaise: 0,
    status: 'BLOCKED',
    blockReason: '3 consecutive refused COD orders with unreachable phone.',
    joinedAt: '2026-10-02',
    lastOrderAt: '2026-11-09',
  },
  {
    id: 'cust_006',
    name: 'Priya Mishra',
    phone: '+91 98891 44512',
    email: 'priya.mishra@example.com',
    villageId: 'vil_chandpur',
    villageName: 'Chandpur',
    landmark: 'Canal Bridge Market',
    totalOrders: 9,
    totalSpendPaise: 412000,
    udhariBalancePaise: 25000,
    status: 'ACTIVE',
    joinedAt: '2026-10-15',
    lastOrderAt: '2026-11-20',
  },
];

const SEED_PLATFORM_SETTINGS: PlatformSettingsRecord = {
  platformName: 'GramBazaar',
  tagline: 'Apne Gaon Ka Apna Universal Bazaar',
  supportPhone: '+91 1800-120-4455',
  whatsappSupport: '+91 98111 22200',
  defaultDeliveryEnabled: true,
  defaultPickupEnabled: true,
  allowMultiVerticalSellers: true,
  autoCancelUnacceptedMins: 15,
  foodPrepSlaMins: 35,
  maintenanceMode: false,
  maintenanceMessage:
    'GramBazaar is undergoing scheduled village catalogue maintenance. We will be back shortly.',
};

const SEED_CMS_BANNERS: CmsBannerRecord[] = [
  {
    id: 'bnr_01',
    title: 'Fresh Morning Sabzi & Kirana by 8 AM',
    subtitle: 'Free local delivery on grocery baskets above ₹299 in Rampur Kalan & Devgarh.',
    placement: 'HERO_CAROUSEL',
    targetVertical: 'GROCERY',
    targetVillage: 'ALL',
    ctaLabel: 'Shop Groceries',
    accentColor: '#218838',
    validFrom: '2026-11-01',
    validUntil: '2026-12-31',
    priority: 1,
    isActive: true,
  },
  {
    id: 'bnr_02',
    title: 'Garma-Garam Village Thali & Family Combos',
    subtitle: 'Order authentic home-style meals from FSSAI-verified local kitchens.',
    placement: 'HERO_CAROUSEL',
    targetVertical: 'FOOD',
    targetVillage: 'ALL',
    ctaLabel: 'Explore Kitchens',
    accentColor: '#D97706',
    validFrom: '2026-11-01',
    validUntil: '2026-12-15',
    priority: 2,
    isActive: true,
  },
  {
    id: 'bnr_03',
    title: 'Winter Harvest Festival — Extra ₹40 Off',
    subtitle: 'Use code GAON40 on fresh grains, mustard oil, and jaggery.',
    placement: 'FESTIVAL_STRIP',
    targetVertical: 'ALL',
    targetVillage: 'Rampur Kalan',
    ctaLabel: 'Apply GAON40',
    accentColor: '#176B2C',
    validFrom: '2026-11-15',
    validUntil: '2026-11-30',
    priority: 3,
    isActive: true,
  },
];

const SEED_FEATURED_SELLERS = ['sel_1', 'sel_2'];

const SEED_CMS_POLICIES: CmsPolicyPageRecord[] = [
  {
    id: 'pol_terms',
    slug: 'terms',
    title: 'Terms & Conditions',
    version: 'v1.4',
    summary: 'Marketplace usage rules for buyers, local stores, and delivery fulfillment.',
    content:
      'GramBazaar connects village households with verified local shops and restaurants. Product pricing, preparation, and doorstep delivery are fulfilled directly by participating merchants under GramBazaar service standards.',
    updatedAt: '2026-11-10',
    updatedBy: 'Vikram Singh',
  },
  {
    id: 'pol_privacy',
    slug: 'privacy',
    title: 'Privacy Policy',
    version: 'v1.2',
    summary: 'How customer mobile numbers, village landmarks, and order records are safeguarded.',
    content:
      'We collect only essential details (name, phone number, village landmark, and order history) to fulfill local deliveries and support seller-segregated Udhari khata records. Customer data is never sold to third-party brokers.',
    updatedAt: '2026-11-04',
    updatedBy: 'Vikram Singh',
  },
  {
    id: 'pol_refund',
    slug: 'refund',
    title: 'Cancellation & Refund Policy',
    version: 'v1.3',
    summary: 'Refund timelines for missing items, damaged groceries, and cancelled food orders.',
    content:
      'Orders cancelled before seller acceptance receive 100% instant refund. Missing or damaged items reported within 2 hours of delivery qualify for verified UPI refund or store credit after support mediation.',
    updatedAt: '2026-11-18',
    updatedBy: 'Meena Verma',
  },
  {
    id: 'pol_seller',
    slug: 'seller-policy',
    title: 'Seller Onboarding & Settlement Policy',
    version: 'v1.1',
    summary: 'KYC verification requirements, FSSAI food rules, and weekly settlement cycles.',
    content:
      'Food merchants must hold valid FSSAI registration. Weekly settlements are processed every Friday for captured UPI orders minus applicable live commission or approved customer refunds.',
    updatedAt: '2026-11-12',
    updatedBy: 'Vikram Singh',
  },
];

const SEED_REVIEWS: CustomerReviewRecord[] = [
  {
    id: 'rev_01',
    orderId: 'GB-ORD-1042',
    customerName: 'Ramesh Kumar',
    sellerId: 'sel_1',
    sellerName: 'Maa Annapurna Bhojanalay',
    vertical: 'FOOD',
    villageName: 'Rampur Kalan',
    rating: 5,
    comment: 'Dal tadka aur garma-garam roti bilkul ghar jaisi thi, 25 minute me pahunch gayi.',
    status: 'PUBLISHED',
    createdAt: '2026-11-22T14:10:00Z',
  },
  {
    id: 'rev_02',
    orderId: 'GB-ORD-1038',
    customerName: 'Sunita Devi',
    sellerId: 'sel_2',
    sellerName: 'Sharma Kirana & General Store',
    vertical: 'GROCERY',
    villageName: 'Rampur Kalan',
    rating: 4,
    comment: 'Sabhi kirana items fresh aur sahi weight me mile. Delivery bhi timely thi.',
    status: 'PUBLISHED',
    createdAt: '2026-11-21T11:20:00Z',
  },
  {
    id: 'rev_03',
    orderId: 'GB-ORD-1031',
    customerName: 'Deepak Yadav',
    sellerId: 'sel_3',
    sellerName: 'Devgarh Royal Dhaba',
    vertical: 'FOOD',
    villageName: 'Devgarh',
    rating: 1,
    comment: 'Spam competitor promotional link posted in review text — abusive language.',
    status: 'FLAGGED',
    flagReason: 'Auto-flagged for abusive / spam promotional content',
    createdAt: '2026-11-20T18:45:00Z',
  },
  {
    id: 'rev_04',
    orderId: 'GB-ORD-1029',
    customerName: 'Arvind Patel',
    sellerId: 'sel_4',
    sellerName: 'Kisan Agro & Daily Mart',
    vertical: 'GROCERY',
    villageName: 'Devgarh',
    rating: 2,
    comment: 'Mustard oil bottle cap was slightly loose during delivery, shopkeeper replaced it later.',
    status: 'FLAGGED',
    flagReason: 'Low rating alert (<= 2 stars) for merchant quality review',
    createdAt: '2026-11-19T16:30:00Z',
  },
];

const SEED_BROADCASTS: BroadcastMessageRecord[] = [
  {
    id: 'brd_01',
    title: 'Chandpur Village Launch Announcement',
    message:
      'GramBazaar ab Chandpur me bhi shuru ho gaya hai! Apne pasandida kirana aur dhaba se ghar baithe order karein.',
    channel: 'WHATSAPP',
    audience: 'VILLAGE_CUSTOMERS',
    targetVillage: 'Chandpur',
    priority: 'FESTIVE',
    estimatedReach: 420,
    deliveredCount: 408,
    status: 'SENT',
    sentAt: '2026-11-20T09:00:00Z',
    createdBy: 'Vikram Singh',
  },
  {
    id: 'brd_02',
    title: 'Seller Reminder: Update Winter Menu & Stock',
    message:
      'Sabhi dukaan partners se anurodh hai ki subah 8 baje se pehle fresh sabzi aur seasonal snacks ka stock update karein.',
    channel: 'ALL',
    audience: 'ALL_SELLERS',
    targetVillage: 'ALL',
    priority: 'NORMAL',
    estimatedReach: 38,
    deliveredCount: 38,
    status: 'SENT',
    sentAt: '2026-11-21T07:30:00Z',
    createdBy: 'Meena Verma',
  },
  {
    id: 'brd_03',
    title: 'Weekend Free Delivery Above ₹249',
    message:
      'Saturday-Sunday Rampur Kalan aur Devgarh me ₹249 ke upar sabhi grocery orders par FREE delivery!',
    channel: 'APP_PUSH',
    audience: 'ALL_CUSTOMERS',
    targetVillage: 'ALL',
    priority: 'FESTIVE',
    estimatedReach: 1280,
    deliveredCount: 0,
    status: 'SCHEDULED',
    scheduledFor: '2026-11-28T08:00:00Z',
    sentAt: '2026-11-22T10:15:00Z',
    createdBy: 'Vikram Singh',
  },
];

// ---------------------------------------------------------------------------
// Idempotent Seeder
// ---------------------------------------------------------------------------

let engagementSeedPromise: Promise<void> | null = null;

export async function seedAdminEngagementIfEmpty(): Promise<void> {
  if (!engagementSeedPromise) {
    engagementSeedPromise = (async () => {
      const [
        supportCount,
        customerCount,
        settingsCount,
        bannerCount,
        featuredCount,
        policyCount,
        reviewCount,
        broadcastCount,
      ] = await Promise.all([
        db.select({ value: count() }).from(adminSupportCases),
        db.select({ value: count() }).from(adminCustomers),
        db.select({ value: count() }).from(adminPlatformSettings),
        db.select({ value: count() }).from(adminCmsBanners),
        db.select({ value: count() }).from(adminFeaturedSellers),
        db.select({ value: count() }).from(adminCmsPolicies),
        db.select({ value: count() }).from(adminReviews),
        db.select({ value: count() }).from(adminBroadcasts),
      ]);

      if ((supportCount[0]?.value ?? 0) === 0) {
        await db
          .insert(adminSupportCases)
          .values(
            SEED_SUPPORT_CASES.map((c) => ({
              externalId: c.id,
              orderId: c.orderId,
              vertical: c.vertical ?? null,
              customerName: c.customerName,
              customerPhone: c.customerPhone,
              sellerId: c.sellerId,
              sellerName: c.sellerName,
              issueType: c.issueType,
              status: c.status,
              amountPaise: c.amountPaise,
              approvedRefundPaise: c.approvedRefundPaise ?? null,
              description: c.description,
              resolutionNotes: c.resolutionNotes ?? null,
              createdAtIso: c.createdAt,
              updatedAtIso: c.updatedAt,
            }))
          )
          .onConflictDoNothing();
      }

      if ((customerCount[0]?.value ?? 0) === 0) {
        await db
          .insert(adminCustomers)
          .values(
            SEED_CUSTOMERS.map((c) => ({
              externalId: c.id,
              name: c.name,
              phone: c.phone,
              email: c.email,
              villageId: c.villageId,
              villageName: c.villageName,
              landmark: c.landmark,
              totalOrders: c.totalOrders,
              totalSpendPaise: c.totalSpendPaise,
              udhariBalancePaise: c.udhariBalancePaise,
              status: c.status,
              blockReason: c.blockReason ?? null,
              joinedAt: c.joinedAt,
              lastOrderAt: c.lastOrderAt,
              adminNotes: c.adminNotes ?? null,
            }))
          )
          .onConflictDoNothing();
      }

      if ((settingsCount[0]?.value ?? 0) === 0) {
        await db
          .insert(adminPlatformSettings)
          .values({
            settingsKey: 'global',
            ...SEED_PLATFORM_SETTINGS,
          })
          .onConflictDoNothing();
      }

      if ((bannerCount[0]?.value ?? 0) === 0) {
        await db
          .insert(adminCmsBanners)
          .values(
            SEED_CMS_BANNERS.map((b) => ({
              externalId: b.id,
              title: b.title,
              subtitle: b.subtitle,
              placement: b.placement,
              targetVertical: b.targetVertical,
              targetVillage: b.targetVillage,
              ctaLabel: b.ctaLabel,
              accentColor: b.accentColor,
              validFrom: b.validFrom,
              validUntil: b.validUntil,
              priority: b.priority,
              isActive: b.isActive,
            }))
          )
          .onConflictDoNothing();
      }

      if ((featuredCount[0]?.value ?? 0) === 0) {
        await db
          .insert(adminFeaturedSellers)
          .values(
            SEED_FEATURED_SELLERS.map((sellerExternalId, idx) => ({
              sellerExternalId,
              sortOrder: idx + 1,
            }))
          )
          .onConflictDoNothing();
      }

      if ((policyCount[0]?.value ?? 0) === 0) {
        await db
          .insert(adminCmsPolicies)
          .values(
            SEED_CMS_POLICIES.map((p) => ({
              externalId: p.id,
              slug: p.slug,
              title: p.title,
              version: p.version,
              summary: p.summary,
              content: p.content,
              updatedAtDate: p.updatedAt,
              updatedBy: p.updatedBy,
            }))
          )
          .onConflictDoNothing();
      }

      if ((reviewCount[0]?.value ?? 0) === 0) {
        await db
          .insert(adminReviews)
          .values(
            SEED_REVIEWS.map((r) => ({
              externalId: r.id,
              orderId: r.orderId,
              customerName: r.customerName,
              sellerId: r.sellerId,
              sellerName: r.sellerName,
              vertical: r.vertical,
              villageName: r.villageName,
              rating: r.rating,
              comment: r.comment,
              status: r.status,
              flagReason: r.flagReason ?? null,
              moderationNotes: r.moderationNotes ?? null,
              createdAtIso: r.createdAt,
            }))
          )
          .onConflictDoNothing();
      }

      if ((broadcastCount[0]?.value ?? 0) === 0) {
        await db
          .insert(adminBroadcasts)
          .values(
            SEED_BROADCASTS.map((b) => ({
              externalId: b.id,
              title: b.title,
              message: b.message,
              channel: b.channel,
              audience: b.audience,
              targetVillage: b.targetVillage,
              priority: b.priority,
              estimatedReach: b.estimatedReach,
              deliveredCount: b.deliveredCount,
              status: b.status,
              scheduledFor: b.scheduledFor ?? null,
              sentAtIso: b.sentAt,
              createdBy: b.createdBy,
            }))
          )
          .onConflictDoNothing();
      }
    })().catch((err) => {
      engagementSeedPromise = null;
      throw err;
    });
  }
  await engagementSeedPromise;
}

// ---------------------------------------------------------------------------
// Row Mappers
// ---------------------------------------------------------------------------

function mapSupportCaseRow(row: typeof adminSupportCases.$inferSelect): SupportCaseRecord {
  return {
    id: row.externalId,
    orderId: row.orderId,
    vertical: row.vertical ?? undefined,
    customerName: row.customerName,
    customerPhone: row.customerPhone,
    sellerId: row.sellerId,
    sellerName: row.sellerName,
    issueType: row.issueType as SupportIssueType,
    status: row.status as SupportCaseRecord['status'],
    amountPaise: row.amountPaise,
    approvedRefundPaise: row.approvedRefundPaise ?? undefined,
    description: row.description,
    resolutionNotes: row.resolutionNotes ?? undefined,
    createdAt: row.createdAtIso,
    updatedAt: row.updatedAtIso,
  };
}

function mapCustomerRow(row: typeof adminCustomers.$inferSelect): AdminCustomerRecord {
  return {
    id: row.externalId,
    name: row.name,
    phone: row.phone,
    email: row.email,
    villageId: row.villageId,
    villageName: row.villageName,
    landmark: row.landmark,
    totalOrders: row.totalOrders,
    totalSpendPaise: row.totalSpendPaise,
    udhariBalancePaise: row.udhariBalancePaise,
    status: row.status === 'BLOCKED' ? 'BLOCKED' : 'ACTIVE',
    blockReason: row.blockReason ?? undefined,
    joinedAt: row.joinedAt,
    lastOrderAt: row.lastOrderAt,
    adminNotes: row.adminNotes ?? undefined,
  };
}

function mapSettingsRow(row: typeof adminPlatformSettings.$inferSelect): PlatformSettingsRecord {
  return {
    platformName: row.platformName,
    tagline: row.tagline,
    supportPhone: row.supportPhone,
    whatsappSupport: row.whatsappSupport,
    defaultDeliveryEnabled: row.defaultDeliveryEnabled,
    defaultPickupEnabled: row.defaultPickupEnabled,
    allowMultiVerticalSellers: row.allowMultiVerticalSellers,
    autoCancelUnacceptedMins: row.autoCancelUnacceptedMins,
    foodPrepSlaMins: row.foodPrepSlaMins,
    maintenanceMode: row.maintenanceMode,
    maintenanceMessage: row.maintenanceMessage,
  };
}

function mapBannerRow(row: typeof adminCmsBanners.$inferSelect): CmsBannerRecord {
  return {
    id: row.externalId,
    title: row.title,
    subtitle: row.subtitle,
    placement: row.placement as CmsBannerRecord['placement'],
    targetVertical: row.targetVertical,
    targetVillage: row.targetVillage,
    ctaLabel: row.ctaLabel,
    accentColor: row.accentColor,
    validFrom: row.validFrom,
    validUntil: row.validUntil,
    priority: row.priority,
    isActive: row.isActive,
  };
}

function mapPolicyRow(row: typeof adminCmsPolicies.$inferSelect): CmsPolicyPageRecord {
  return {
    id: row.externalId,
    slug: row.slug as CmsPolicyPageRecord['slug'],
    title: row.title,
    version: row.version,
    summary: row.summary,
    content: row.content,
    updatedAt: row.updatedAtDate,
    updatedBy: row.updatedBy,
  };
}

function mapReviewRow(row: typeof adminReviews.$inferSelect): CustomerReviewRecord {
  return {
    id: row.externalId,
    orderId: row.orderId,
    customerName: row.customerName,
    sellerId: row.sellerId,
    sellerName: row.sellerName,
    vertical: row.vertical,
    villageName: row.villageName,
    rating: row.rating,
    comment: row.comment,
    status: row.status as CustomerReviewRecord['status'],
    flagReason: row.flagReason ?? undefined,
    moderationNotes: row.moderationNotes ?? undefined,
    createdAt: row.createdAtIso,
  };
}

function mapBroadcastRow(row: typeof adminBroadcasts.$inferSelect): BroadcastMessageRecord {
  return {
    id: row.externalId,
    title: row.title,
    message: row.message,
    channel: row.channel as BroadcastMessageRecord['channel'],
    audience: row.audience as BroadcastMessageRecord['audience'],
    targetVillage: row.targetVillage,
    priority: row.priority as BroadcastMessageRecord['priority'],
    estimatedReach: row.estimatedReach,
    deliveredCount: row.deliveredCount,
    status: row.status as BroadcastMessageRecord['status'],
    scheduledFor: row.scheduledFor ?? undefined,
    sentAt: row.sentAtIso,
    createdBy: row.createdBy,
  };
}

// ---------------------------------------------------------------------------
// Support Cases
// ---------------------------------------------------------------------------

export async function listAdminSupportCases(): Promise<SupportCaseRecord[]> {
  await seedAdminEngagementIfEmpty();
  const rows = await db
    .select()
    .from(adminSupportCases)
    .orderBy(desc(adminSupportCases.id));
  return rows.map(mapSupportCaseRow);
}

export async function updateAdminSupportCaseStatus(params: {
  externalId: string;
  status: SupportCaseRecord['status'];
  resolutionNotes: string;
  approvedRefundPaise?: number;
}): Promise<SupportCaseRecord | null> {
  await seedAdminEngagementIfEmpty();
  const [existing] = await db
    .select()
    .from(adminSupportCases)
    .where(eq(adminSupportCases.externalId, params.externalId));
  if (!existing) return null;

  const nowIso = new Date().toISOString();
  const [updated] = await db
    .update(adminSupportCases)
    .set({
      status: params.status,
      resolutionNotes: params.resolutionNotes,
      approvedRefundPaise:
        params.approvedRefundPaise !== undefined
          ? Math.max(0, Math.round(params.approvedRefundPaise))
          : existing.approvedRefundPaise,
      updatedAtIso: nowIso,
      updatedAt: new Date(),
    })
    .where(eq(adminSupportCases.externalId, params.externalId))
    .returning();
  return updated ? mapSupportCaseRow(updated) : null;
}

// ---------------------------------------------------------------------------
// Customers
// ---------------------------------------------------------------------------

export async function listAdminCustomers(): Promise<AdminCustomerRecord[]> {
  await seedAdminEngagementIfEmpty();
  const rows = await db
    .select()
    .from(adminCustomers)
    .orderBy(asc(adminCustomers.id));
  return rows.map(mapCustomerRow);
}

export async function toggleAdminCustomerBlock(params: {
  externalId: string;
  block: boolean;
  reason?: string;
}): Promise<AdminCustomerRecord | null> {
  await seedAdminEngagementIfEmpty();
  const [updated] = await db
    .update(adminCustomers)
    .set({
      status: params.block ? 'BLOCKED' : 'ACTIVE',
      blockReason: params.block ? params.reason || 'Blocked by Admin' : null,
      updatedAt: new Date(),
    })
    .where(eq(adminCustomers.externalId, params.externalId))
    .returning();
  return updated ? mapCustomerRow(updated) : null;
}

export async function updateAdminCustomerNotes(params: {
  externalId: string;
  notes: string;
}): Promise<AdminCustomerRecord | null> {
  await seedAdminEngagementIfEmpty();
  const [updated] = await db
    .update(adminCustomers)
    .set({
      adminNotes: params.notes,
      updatedAt: new Date(),
    })
    .where(eq(adminCustomers.externalId, params.externalId))
    .returning();
  return updated ? mapCustomerRow(updated) : null;
}

// ---------------------------------------------------------------------------
// Platform Settings
// ---------------------------------------------------------------------------

export async function getAdminPlatformSettings(): Promise<PlatformSettingsRecord> {
  await seedAdminEngagementIfEmpty();
  const [row] = await db
    .select()
    .from(adminPlatformSettings)
    .where(eq(adminPlatformSettings.settingsKey, 'global'));
  if (!row) return SEED_PLATFORM_SETTINGS;
  return mapSettingsRow(row);
}

export async function updateAdminPlatformSettings(
  patch: Partial<PlatformSettingsRecord>
): Promise<PlatformSettingsRecord> {
  await seedAdminEngagementIfEmpty();
  const updatePayload: Partial<typeof adminPlatformSettings.$inferInsert> = {
    updatedAt: new Date(),
  };
  if (typeof patch.platformName === 'string') updatePayload.platformName = patch.platformName.trim();
  if (typeof patch.tagline === 'string') updatePayload.tagline = patch.tagline.trim();
  if (typeof patch.supportPhone === 'string') updatePayload.supportPhone = patch.supportPhone.trim();
  if (typeof patch.whatsappSupport === 'string') {
    updatePayload.whatsappSupport = patch.whatsappSupport.trim();
  }
  if (typeof patch.defaultDeliveryEnabled === 'boolean') {
    updatePayload.defaultDeliveryEnabled = patch.defaultDeliveryEnabled;
  }
  if (typeof patch.defaultPickupEnabled === 'boolean') {
    updatePayload.defaultPickupEnabled = patch.defaultPickupEnabled;
  }
  if (typeof patch.allowMultiVerticalSellers === 'boolean') {
    updatePayload.allowMultiVerticalSellers = patch.allowMultiVerticalSellers;
  }
  if (patch.autoCancelUnacceptedMins !== undefined) {
    updatePayload.autoCancelUnacceptedMins = Math.max(
      1,
      Math.min(240, Math.round(Number(patch.autoCancelUnacceptedMins) || 15))
    );
  }
  if (patch.foodPrepSlaMins !== undefined) {
    updatePayload.foodPrepSlaMins = Math.max(
      5,
      Math.min(240, Math.round(Number(patch.foodPrepSlaMins) || 35))
    );
  }
  if (typeof patch.maintenanceMode === 'boolean') {
    updatePayload.maintenanceMode = patch.maintenanceMode;
  }
  if (typeof patch.maintenanceMessage === 'string') {
    updatePayload.maintenanceMessage = patch.maintenanceMessage.trim();
  }

  const [updated] = await db
    .update(adminPlatformSettings)
    .set(updatePayload)
    .where(eq(adminPlatformSettings.settingsKey, 'global'))
    .returning();
  return updated ? mapSettingsRow(updated) : SEED_PLATFORM_SETTINGS;
}

// ---------------------------------------------------------------------------
// CMS Banners
// ---------------------------------------------------------------------------

export async function listAdminCmsBanners(activeOnly = false): Promise<CmsBannerRecord[]> {
  await seedAdminEngagementIfEmpty();
  const rows = activeOnly
    ? await db
        .select()
        .from(adminCmsBanners)
        .where(eq(adminCmsBanners.isActive, true))
        .orderBy(asc(adminCmsBanners.priority), desc(adminCmsBanners.id))
    : await db
        .select()
        .from(adminCmsBanners)
        .orderBy(asc(adminCmsBanners.priority), desc(adminCmsBanners.id));
  return rows.map(mapBannerRow);
}

export async function createAdminCmsBanner(
  input: Omit<CmsBannerRecord, 'id'> & { id?: string }
): Promise<CmsBannerRecord> {
  await seedAdminEngagementIfEmpty();
  const externalId = input.id?.trim() || `bnr_${Date.now()}`;
  const [created] = await db
    .insert(adminCmsBanners)
    .values({
      externalId,
      title: input.title.trim(),
      subtitle: input.subtitle.trim(),
      placement: input.placement,
      targetVertical: input.targetVertical || 'ALL',
      targetVillage: input.targetVillage || 'ALL',
      ctaLabel: input.ctaLabel.trim() || 'Explore',
      accentColor: input.accentColor.trim() || '#218838',
      validFrom: input.validFrom,
      validUntil: input.validUntil,
      priority: Math.max(1, Math.min(999, Math.round(Number(input.priority) || 1))),
      isActive: input.isActive !== false,
    })
    .returning();
  return mapBannerRow(created);
}

export async function updateAdminCmsBanner(
  externalId: string,
  patch: Partial<CmsBannerRecord>
): Promise<CmsBannerRecord | null> {
  await seedAdminEngagementIfEmpty();
  const updatePayload: Partial<typeof adminCmsBanners.$inferInsert> = {
    updatedAt: new Date(),
  };
  if (typeof patch.title === 'string') updatePayload.title = patch.title.trim();
  if (typeof patch.subtitle === 'string') updatePayload.subtitle = patch.subtitle.trim();
  if (typeof patch.placement === 'string') updatePayload.placement = patch.placement;
  if (typeof patch.targetVertical === 'string') updatePayload.targetVertical = patch.targetVertical;
  if (typeof patch.targetVillage === 'string') updatePayload.targetVillage = patch.targetVillage;
  if (typeof patch.ctaLabel === 'string') updatePayload.ctaLabel = patch.ctaLabel.trim();
  if (typeof patch.accentColor === 'string') updatePayload.accentColor = patch.accentColor.trim();
  if (typeof patch.validFrom === 'string') updatePayload.validFrom = patch.validFrom;
  if (typeof patch.validUntil === 'string') updatePayload.validUntil = patch.validUntil;
  if (patch.priority !== undefined) {
    updatePayload.priority = Math.max(1, Math.min(999, Math.round(Number(patch.priority) || 1)));
  }
  if (typeof patch.isActive === 'boolean') updatePayload.isActive = patch.isActive;

  const [updated] = await db
    .update(adminCmsBanners)
    .set(updatePayload)
    .where(eq(adminCmsBanners.externalId, externalId))
    .returning();
  return updated ? mapBannerRow(updated) : null;
}

export async function toggleAdminCmsBannerStatus(
  externalId: string
): Promise<CmsBannerRecord | null> {
  await seedAdminEngagementIfEmpty();
  const [existing] = await db
    .select()
    .from(adminCmsBanners)
    .where(eq(adminCmsBanners.externalId, externalId));
  if (!existing) return null;
  const [updated] = await db
    .update(adminCmsBanners)
    .set({ isActive: !existing.isActive, updatedAt: new Date() })
    .where(eq(adminCmsBanners.externalId, externalId))
    .returning();
  return updated ? mapBannerRow(updated) : null;
}

export async function deleteAdminCmsBanner(externalId: string): Promise<boolean> {
  await seedAdminEngagementIfEmpty();
  const deleted = await db
    .delete(adminCmsBanners)
    .where(eq(adminCmsBanners.externalId, externalId))
    .returning({ id: adminCmsBanners.id });
  return deleted.length > 0;
}

// ---------------------------------------------------------------------------
// Featured Sellers
// ---------------------------------------------------------------------------

export async function listAdminFeaturedSellerIds(): Promise<string[]> {
  await seedAdminEngagementIfEmpty();
  const rows = await db
    .select()
    .from(adminFeaturedSellers)
    .orderBy(asc(adminFeaturedSellers.sortOrder), asc(adminFeaturedSellers.id));
  return rows.map((r) => r.sellerExternalId);
}

export async function toggleAdminFeaturedSeller(sellerExternalId: string): Promise<{
  isFeatured: boolean;
  featuredSellerIds: string[];
}> {
  await seedAdminEngagementIfEmpty();
  const [existing] = await db
    .select()
    .from(adminFeaturedSellers)
    .where(eq(adminFeaturedSellers.sellerExternalId, sellerExternalId));

  let isFeatured: boolean;
  if (existing) {
    await db
      .delete(adminFeaturedSellers)
      .where(eq(adminFeaturedSellers.sellerExternalId, sellerExternalId));
    isFeatured = false;
  } else {
    const current = await db.select({ value: count() }).from(adminFeaturedSellers);
    await db
      .insert(adminFeaturedSellers)
      .values({
        sellerExternalId,
        sortOrder: (current[0]?.value ?? 0) + 1,
      })
      .onConflictDoNothing();
    isFeatured = true;
  }

  const featuredSellerIds = await listAdminFeaturedSellerIds();
  return { isFeatured, featuredSellerIds };
}

// ---------------------------------------------------------------------------
// CMS Policy Pages
// ---------------------------------------------------------------------------

export async function listAdminCmsPolicies(): Promise<CmsPolicyPageRecord[]> {
  await seedAdminEngagementIfEmpty();
  const rows = await db
    .select()
    .from(adminCmsPolicies)
    .orderBy(asc(adminCmsPolicies.id));
  return rows.map(mapPolicyRow);
}

export async function updateAdminCmsPolicy(params: {
  externalId: string;
  version: string;
  summary: string;
  content: string;
  updatedBy: string;
}): Promise<CmsPolicyPageRecord | null> {
  await seedAdminEngagementIfEmpty();
  const [updated] = await db
    .update(adminCmsPolicies)
    .set({
      version: params.version.trim(),
      summary: params.summary.trim(),
      content: params.content.trim(),
      updatedAtDate: new Date().toISOString().split('T')[0],
      updatedBy: params.updatedBy,
      updatedAt: new Date(),
    })
    .where(eq(adminCmsPolicies.externalId, params.externalId))
    .returning();
  return updated ? mapPolicyRow(updated) : null;
}

// ---------------------------------------------------------------------------
// Customer Reviews
// ---------------------------------------------------------------------------

export async function listAdminReviews(publishedOnly = false): Promise<CustomerReviewRecord[]> {
  await seedAdminEngagementIfEmpty();
  const rows = publishedOnly
    ? await db
        .select()
        .from(adminReviews)
        .where(eq(adminReviews.status, 'PUBLISHED'))
        .orderBy(desc(adminReviews.id))
    : await db
        .select()
        .from(adminReviews)
        .orderBy(desc(adminReviews.id));
  return rows.map(mapReviewRow);
}

export async function moderateAdminReview(params: {
  externalId: string;
  status: CustomerReviewRecord['status'];
  notes?: string;
}): Promise<CustomerReviewRecord | null> {
  await seedAdminEngagementIfEmpty();
  const [existing] = await db
    .select()
    .from(adminReviews)
    .where(eq(adminReviews.externalId, params.externalId));
  if (!existing) return null;

  const [updated] = await db
    .update(adminReviews)
    .set({
      status: params.status,
      moderationNotes:
        params.notes !== undefined ? params.notes.trim() : existing.moderationNotes,
      updatedAt: new Date(),
    })
    .where(eq(adminReviews.externalId, params.externalId))
    .returning();
  return updated ? mapReviewRow(updated) : null;
}

export async function deleteAdminReview(externalId: string): Promise<boolean> {
  await seedAdminEngagementIfEmpty();
  const deleted = await db
    .delete(adminReviews)
    .where(eq(adminReviews.externalId, externalId))
    .returning({ id: adminReviews.id });
  return deleted.length > 0;
}

// ---------------------------------------------------------------------------
// Broadcast Messages
// ---------------------------------------------------------------------------

export async function listAdminBroadcasts(): Promise<BroadcastMessageRecord[]> {
  await seedAdminEngagementIfEmpty();
  const rows = await db
    .select()
    .from(adminBroadcasts)
    .orderBy(desc(adminBroadcasts.id));
  return rows.map(mapBroadcastRow);
}

export async function createAdminBroadcast(
  input: Omit<BroadcastMessageRecord, 'id' | 'sentAt' | 'createdBy' | 'deliveredCount'> & {
    id?: string;
    createdBy: string;
  }
): Promise<BroadcastMessageRecord> {
  await seedAdminEngagementIfEmpty();
  const externalId = input.id?.trim() || `brd_${Date.now()}`;
  const estimatedReach = Math.max(0, Math.round(Number(input.estimatedReach) || 0));
  const deliveredCount =
    input.status === 'SENT' ? Math.max(1, Math.round(estimatedReach * 0.97)) : 0;
  const sentAtIso = new Date().toISOString();

  const [created] = await db
    .insert(adminBroadcasts)
    .values({
      externalId,
      title: input.title.trim(),
      message: input.message.trim(),
      channel: input.channel,
      audience: input.audience,
      targetVillage: input.targetVillage || 'ALL',
      priority: input.priority,
      estimatedReach,
      deliveredCount,
      status: input.status,
      scheduledFor: input.scheduledFor ?? null,
      sentAtIso,
      createdBy: input.createdBy,
    })
    .returning();
  return mapBroadcastRow(created);
}

export async function deleteAdminBroadcast(externalId: string): Promise<boolean> {
  await seedAdminEngagementIfEmpty();
  const deleted = await db
    .delete(adminBroadcasts)
    .where(eq(adminBroadcasts.externalId, externalId))
    .returning({ id: adminBroadcasts.id });
  return deleted.length > 0;
}

// ---------------------------------------------------------------------------
// Single-Round-Trip Bundles
// ---------------------------------------------------------------------------

export async function getPublicStorefrontContentBundle() {
  await seedAdminEngagementIfEmpty();
  const [platformSettings, cmsBanners, featuredSellerIds, cmsPolicies, reviews] =
    await Promise.all([
      getAdminPlatformSettings(),
      listAdminCmsBanners(true),
      listAdminFeaturedSellerIds(),
      listAdminCmsPolicies(),
      listAdminReviews(true),
    ]);
  return {
    platformSettings,
    cmsBanners,
    featuredSellerIds,
    cmsPolicies,
    reviews,
  };
}

export async function getAdminEngagementBundle() {
  await seedAdminEngagementIfEmpty();
  const [
    supportCases,
    customers,
    platformSettings,
    cmsBanners,
    featuredSellerIds,
    cmsPolicies,
    reviews,
    broadcasts,
  ] = await Promise.all([
    listAdminSupportCases(),
    listAdminCustomers(),
    getAdminPlatformSettings(),
    listAdminCmsBanners(false),
    listAdminFeaturedSellerIds(),
    listAdminCmsPolicies(),
    listAdminReviews(false),
    listAdminBroadcasts(),
  ]);
  return {
    supportCases,
    customers,
    platformSettings,
    cmsBanners,
    featuredSellerIds,
    cmsPolicies,
    reviews,
    broadcasts,
  };
}
