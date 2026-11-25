import { asc, desc, eq } from 'drizzle-orm';
import { db } from './index.ts';
import {
  adminAuditLogs,
  adminDeliveryPartners,
  adminInterVillageRoutes,
  adminSellerApplications,
  adminServiceAreas,
  orderItems,
  orders,
  orderStatusHistory,
  sellers,
} from './schema.ts';
import { createAdminSeller } from './adminQueries.ts';
import type {
  AdminRole,
  ApplicationStatus,
  AuditLogRecord,
  DeliveryPartnerRecord,
  InterVillageRouteRecord,
  MasterSellerRecord,
  SellerApplication,
  SellerBusinessType,
  VillageServiceAreaRecord,
} from '../types/admin.ts';

function safeJsonParse<T>(raw: string | null | undefined, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function maskBankAccount(raw: string): string {
  const clean = raw.replace(/\s+/g, '');
  if (clean.length <= 4) return `XXXXXX${clean}`;
  return `XXXXXX${clean.slice(-4)}`;
}

// =========================================================================
// BASELINE SEED DATA (Persisted once into PostgreSQL if tables are empty)
// =========================================================================
const SEED_APPLICATIONS: SellerApplication[] = [
  {
    id: 'app_001',
    applicantName: 'Radheshyam Sharma',
    businessName: 'Sharma Sweets & Dairy',
    businessType: 'RESTAURANT',
    phone: '+91 98765 11223',
    villageId: 'v-rampur',
    villageName: 'Rampur',
    vertical: 'FOOD',
    supportedVerticals: ['FOOD', 'GROCERY'],
    fssaiNumber: '12723001000982',
    fssaiDocumentName: 'fssai_cert_sharma_sweets.pdf',
    aadhaarMasked: 'XXXX-XXXX-4821',
    panNumber: 'ABCPS4821K',
    verifiedDocs: { FSSAI: true, AADHAAR: true, PAN: false, STORE_PHOTO: false },
    bankAccountHolder: 'Radheshyam Sharma',
    bankAccountNumber: 'XXXXXX1038',
    ifscCode: 'HDFC0001234',
    appliedAt: '2026-11-01T08:30:00Z',
    status: 'PENDING_REVIEW',
  },
  {
    id: 'app_002',
    applicantName: 'Manoj Patel',
    businessName: 'Kisan Krishi Seva Kendra',
    businessType: 'AGRI_KENDRA',
    phone: '+91 94250 88312',
    villageId: 'v-madhopur',
    villageName: 'Madhopur',
    vertical: 'AGRICULTURE',
    supportedVerticals: ['AGRICULTURE', 'HARDWARE'],
    agriLicenseNumber: 'UP-UNN-AGRI-2025-8841',
    aadhaarMasked: 'XXXX-XXXX-7740',
    panNumber: 'BDEPP7740M',
    verifiedDocs: { AGRI_LICENSE: false, AADHAAR: true, PAN: true, STORE_PHOTO: true },
    bankAccountHolder: 'Manoj Patel & Sons',
    bankAccountNumber: 'XXXXXX0192',
    ifscCode: 'SBIN0004567',
    appliedAt: '2026-11-01T10:15:00Z',
    status: 'PENDING_REVIEW',
  },
  {
    id: 'app_004',
    applicantName: 'Rakesh Vishwakarma',
    businessName: 'Vishwakarma Timber & Furniture House',
    businessType: 'FURNITURE_SHOP',
    phone: '+91 97123 66781',
    villageId: 'v-rampur',
    villageName: 'Rampur',
    vertical: 'FURNITURE',
    supportedVerticals: ['FURNITURE', 'HARDWARE'],
    gstOrTradeNumber: '09AAFCV4421E1Z4',
    aadhaarMasked: 'XXXX-XXXX-9102',
    panNumber: 'AAFCV4421E',
    verifiedDocs: { AADHAAR: true, PAN: false, STORE_PHOTO: true },
    bankAccountHolder: 'Rakesh Vishwakarma',
    bankAccountNumber: 'XXXXXX6201',
    ifscCode: 'BARB0RAMPUR',
    appliedAt: '2026-11-02T06:45:00Z',
    status: 'PENDING_REVIEW',
  },
  {
    id: 'app_003',
    applicantName: 'Sunita Devi',
    businessName: 'Annapurna Rasoi Dhabe',
    businessType: 'DHABA',
    phone: '+91 98261 44556',
    villageId: 'v-shivpur',
    villageName: 'Shivpur',
    vertical: 'FOOD',
    supportedVerticals: ['FOOD'],
    fssaiNumber: '12724002000123',
    fssaiDocumentName: 'fssai_cert_annapurna.pdf',
    aadhaarMasked: 'XXXX-XXXX-3319',
    panNumber: 'AFGPD3319R',
    verifiedDocs: { FSSAI: true, AADHAAR: true, PAN: true, STORE_PHOTO: true },
    bankAccountHolder: 'Sunita Devi',
    bankAccountNumber: 'XXXXXX5019',
    ifscCode: 'PUNB0007890',
    appliedAt: '2026-10-30T14:20:00Z',
    status: 'APPROVED',
    reviewNotes: 'Verified FSSAI certificate and physically verified shop front at Shivpur Bus Stand.',
    reviewedBy: 'Vikram Singh',
    reviewedAt: '2026-10-31T11:00:00Z',
  },
];

const SEED_SERVICE_AREAS: VillageServiceAreaRecord[] = [
  { id: 'v-rampur', name: 'Rampur', postalCode: '209801', district: 'Unnao', state: 'Uttar Pradesh', isActive: true, activeSellersCount: 3, baseDeliveryFeePaise: 1500, minOrderFreeDeliveryPaise: 40000, landmarksCount: 4, landmarks: ['Rampur Primary School', 'Shiv Mandir Chowk', 'Panchayat Bhawan', 'Main Mandi Gate'] },
  { id: 'v-madhopur', name: 'Madhopur', postalCode: '209802', district: 'Unnao', state: 'Uttar Pradesh', isActive: true, activeSellersCount: 2, baseDeliveryFeePaise: 1500, minOrderFreeDeliveryPaise: 40000, landmarksCount: 4, landmarks: ['Madhopur Bus Stand', 'Krishi Mandi', 'Canal Bridge', 'Health Sub-Centre'] },
  { id: 'v-shivpur', name: 'Shivpur', postalCode: '209803', district: 'Unnao', state: 'Uttar Pradesh', isActive: true, activeSellersCount: 2, baseDeliveryFeePaise: 1500, minOrderFreeDeliveryPaise: 40000, landmarksCount: 3, landmarks: ['Shivpur Chauraha', 'Hanuman Mandir', 'Government Tubewell'] },
  { id: 'v-kalyanpur', name: 'Kalyanpur', postalCode: '209804', district: 'Unnao', state: 'Uttar Pradesh', isActive: true, activeSellersCount: 1, baseDeliveryFeePaise: 2000, minOrderFreeDeliveryPaise: 50000, landmarksCount: 3, landmarks: ['Kalyanpur Haat', 'Post Office', 'Peepal Tree Crossing'] },
  { id: 'v-haridaspur', name: 'Haridaspur', postalCode: '209805', district: 'Unnao', state: 'Uttar Pradesh', isActive: true, activeSellersCount: 1, baseDeliveryFeePaise: 2000, minOrderFreeDeliveryPaise: 50000, landmarksCount: 3, landmarks: ['Haridaspur Talab', 'Primary School', 'Dairy Cooperative'] },
  { id: 'v-chandpur', name: 'Chandpur', postalCode: '209806', district: 'Unnao', state: 'Uttar Pradesh', isActive: true, activeSellersCount: 0, baseDeliveryFeePaise: 2500, minOrderFreeDeliveryPaise: 60000, landmarksCount: 2, landmarks: ['Chandpur Entry Gate', 'Gram Sabha Chaupal'] },
];

const SEED_ROUTES: InterVillageRouteRecord[] = [
  { id: 'rt_01', fromVillageId: 'v-rampur', fromVillageName: 'Rampur', toVillageId: 'v-madhopur', toVillageName: 'Madhopur', distanceKm: 3.2, surchargePaise: 1500, isActive: true },
  { id: 'rt_02', fromVillageId: 'v-rampur', fromVillageName: 'Rampur', toVillageId: 'v-shivpur', toVillageName: 'Shivpur', distanceKm: 4.5, surchargePaise: 2000, isActive: true },
  { id: 'rt_03', fromVillageId: 'v-madhopur', fromVillageName: 'Madhopur', toVillageId: 'v-kalyanpur', toVillageName: 'Kalyanpur', distanceKm: 5.0, surchargePaise: 2500, isActive: true },
  { id: 'rt_04', fromVillageId: 'v-shivpur', fromVillageName: 'Shivpur', toVillageId: 'v-haridaspur', toVillageName: 'Haridaspur', distanceKm: 3.8, surchargePaise: 2000, isActive: true },
];

const SEED_DELIVERY_PARTNERS: DeliveryPartnerRecord[] = [
  { id: 'rid_01', name: 'Suresh Nishad', phone: '+91 98388 12001', villageId: 'v-rampur', villageName: 'Rampur', vehicleType: 'BIKE', vehicleNumber: 'UP-35-AT-4421', kycVerified: true, status: 'AVAILABLE', completedDeliveries: 184, rating: 4.9, joinedAt: '2026-08-10' },
  { id: 'rid_02', name: 'Manoj Chauhan', phone: '+91 97952 44109', villageId: 'v-madhopur', villageName: 'Madhopur', vehicleType: 'E_RICKSHAW', vehicleNumber: 'UP-35-ER-1190', kycVerified: true, status: 'ON_DELIVERY', completedDeliveries: 132, rating: 4.8, joinedAt: '2026-09-02' },
  { id: 'rid_03', name: 'Vikas Maurya', phone: '+91 94530 77812', villageId: 'v-rampur', villageName: 'Rampur', vehicleType: 'CYCLE', kycVerified: true, status: 'OFFLINE', completedDeliveries: 67, rating: 4.7, joinedAt: '2026-10-05' },
];

const SEED_AUDIT_LOGS: AuditLogRecord[] = [
  {
    id: 'aud_001',
    actor: 'Vikram Singh',
    actorRole: 'SUPER_ADMIN',
    actionType: 'MERCHANT_APPROVED',
    targetEntity: 'SellerApplication',
    targetId: 'app_003',
    timestamp: '2026-10-31T11:00:00Z',
    ipAddress: '192.168.1.104',
    details: 'Approved Annapurna Rasoi Dhabe after FSSAI registration verification.',
    reason: 'Verified FSSAI certificate 12724002000123 matching trade name.',
  },
  {
    id: 'aud_002',
    actor: 'Vikram Singh',
    actorRole: 'SUPER_ADMIN',
    actionType: 'SERVICE_AREA_EXPANDED',
    targetEntity: 'Village',
    targetId: 'v-chandpur',
    timestamp: '2026-10-25T14:10:00Z',
    ipAddress: '192.168.1.104',
    details: 'Configured new village boundary Chandpur (PIN 209806) with neighbor matrix.',
    reason: 'Gram Panchayat request for pilot integration.',
  },
  {
    id: 'aud_003',
    actor: 'System Automation',
    actorRole: 'SYSTEM',
    actionType: 'FEE_RULE_SHADOW_ACTIVE',
    targetEntity: 'FeeRule',
    targetId: 'fee_01',
    timestamp: '2026-10-01T00:00:00Z',
    ipAddress: '127.0.0.1',
    details: 'Enabled pilot shadow fee calculation for food delivery (500 bps).',
  },
];

let opsSeedPromise: Promise<void> | null = null;

export async function seedAdminOpsIfEmpty(): Promise<void> {
  if (!opsSeedPromise) {
    opsSeedPromise = (async () => {
      try {
        const [existingApps, existingAreas, existingRoutes, existingPartners, existingLogs] =
          await Promise.all([
            db.select({ id: adminSellerApplications.id }).from(adminSellerApplications).limit(1),
            db.select({ id: adminServiceAreas.id }).from(adminServiceAreas).limit(1),
            db.select({ id: adminInterVillageRoutes.id }).from(adminInterVillageRoutes).limit(1),
            db.select({ id: adminDeliveryPartners.id }).from(adminDeliveryPartners).limit(1),
            db.select({ id: adminAuditLogs.id }).from(adminAuditLogs).limit(1),
          ]);

        if (existingApps.length === 0) {
          await db
            .insert(adminSellerApplications)
            .values(
              SEED_APPLICATIONS.map((a) => ({
                externalId: a.id,
                applicantName: a.applicantName,
                businessName: a.businessName,
                businessType: a.businessType || 'MULTI_CATEGORY',
                phone: a.phone,
                villageId: a.villageId,
                villageName: a.villageName,
                vertical: a.vertical,
                supportedVerticalsJson: JSON.stringify(a.supportedVerticals ?? [a.vertical]),
                fssaiNumber: a.fssaiNumber ?? null,
                fssaiDocumentName: a.fssaiDocumentName ?? null,
                gstOrTradeNumber: a.gstOrTradeNumber ?? null,
                agriLicenseNumber: a.agriLicenseNumber ?? null,
                aadhaarMasked: a.aadhaarMasked ?? null,
                panNumber: a.panNumber ?? null,
                verifiedDocsJson: JSON.stringify(a.verifiedDocs ?? {}),
                bankAccountHolder: a.bankAccountHolder,
                bankAccountNumberMasked: maskBankAccount(a.bankAccountNumber),
                ifscCode: a.ifscCode,
                appliedAt: a.appliedAt,
                status: a.status,
                reviewNotes: a.reviewNotes ?? null,
                reviewedBy: a.reviewedBy ?? null,
                reviewedAt: a.reviewedAt ?? null,
              }))
            )
            .onConflictDoNothing();
        }

        if (existingAreas.length === 0) {
          await db
            .insert(adminServiceAreas)
            .values(
              SEED_SERVICE_AREAS.map((s) => ({
                externalId: s.id,
                name: s.name,
                postalCode: s.postalCode,
                district: s.district,
                state: s.state,
                isActive: s.isActive,
                activeSellersCount: s.activeSellersCount,
                baseDeliveryFeePaise: s.baseDeliveryFeePaise,
                minOrderFreeDeliveryPaise: s.minOrderFreeDeliveryPaise,
                landmarksJson: JSON.stringify(s.landmarks ?? []),
              }))
            )
            .onConflictDoNothing();
        }

        if (existingRoutes.length === 0) {
          await db
            .insert(adminInterVillageRoutes)
            .values(
              SEED_ROUTES.map((r) => ({
                externalId: r.id,
                fromVillageId: r.fromVillageId,
                fromVillageName: r.fromVillageName,
                toVillageId: r.toVillageId,
                toVillageName: r.toVillageName,
                distanceKm: r.distanceKm.toFixed(2),
                surchargePaise: r.surchargePaise,
                isActive: r.isActive,
              }))
            )
            .onConflictDoNothing();
        }

        if (existingPartners.length === 0) {
          await db
            .insert(adminDeliveryPartners)
            .values(
              SEED_DELIVERY_PARTNERS.map((p) => ({
                externalId: p.id,
                name: p.name,
                phone: p.phone,
                villageId: p.villageId,
                villageName: p.villageName,
                vehicleType: p.vehicleType,
                vehicleNumber: p.vehicleNumber ?? null,
                kycVerified: p.kycVerified,
                status: p.status,
                completedDeliveries: p.completedDeliveries,
                rating: p.rating.toFixed(2),
                joinedAt: p.joinedAt,
              }))
            )
            .onConflictDoNothing();
        }

        if (existingLogs.length === 0) {
          await db
            .insert(adminAuditLogs)
            .values(
              SEED_AUDIT_LOGS.map((l) => ({
                externalId: l.id,
                actor: l.actor,
                actorRole: l.actorRole,
                actionType: l.actionType,
                targetEntity: l.targetEntity,
                targetId: l.targetId,
                ipAddress: l.ipAddress,
                details: l.details,
                reason: l.reason ?? null,
                metadataJson: l.metadata ? JSON.stringify(l.metadata) : null,
                createdAt: new Date(l.timestamp),
              }))
            )
            .onConflictDoNothing();
        }
      } catch (error) {
        opsSeedPromise = null;
        console.error('Database Error in seedAdminOpsIfEmpty:', error);
        throw new Error('Failed to initialize admin operations data.', { cause: error });
      }
    })();
  }
  return opsSeedPromise;
}

// =========================================================================
// MAPPERS
// =========================================================================
function mapApplicationRow(row: typeof adminSellerApplications.$inferSelect): SellerApplication {
  return {
    id: row.externalId,
    applicantName: row.applicantName,
    businessName: row.businessName,
    businessType: (row.businessType as SellerBusinessType) || 'MULTI_CATEGORY',
    phone: row.phone,
    villageId: row.villageId,
    villageName: row.villageName,
    vertical: row.vertical,
    supportedVerticals: safeJsonParse<string[]>(row.supportedVerticalsJson, [row.vertical]),
    fssaiNumber: row.fssaiNumber ?? undefined,
    fssaiDocumentName: row.fssaiDocumentName ?? undefined,
    gstOrTradeNumber: row.gstOrTradeNumber ?? undefined,
    agriLicenseNumber: row.agriLicenseNumber ?? undefined,
    aadhaarMasked: row.aadhaarMasked ?? undefined,
    panNumber: row.panNumber ?? undefined,
    verifiedDocs: safeJsonParse<Record<string, boolean>>(row.verifiedDocsJson, {}),
    bankAccountHolder: row.bankAccountHolder,
    bankAccountNumber: row.bankAccountNumberMasked,
    ifscCode: row.ifscCode,
    appliedAt: row.appliedAt,
    status: row.status as ApplicationStatus,
    reviewNotes: row.reviewNotes ?? undefined,
    reviewedBy: row.reviewedBy ?? undefined,
    reviewedAt: row.reviewedAt ?? undefined,
  };
}

function mapServiceAreaRow(row: typeof adminServiceAreas.$inferSelect): VillageServiceAreaRecord {
  const landmarks = safeJsonParse<string[]>(row.landmarksJson, []);
  return {
    id: row.externalId,
    name: row.name,
    postalCode: row.postalCode,
    district: row.district,
    state: row.state,
    isActive: row.isActive,
    activeSellersCount: row.activeSellersCount,
    baseDeliveryFeePaise: row.baseDeliveryFeePaise,
    minOrderFreeDeliveryPaise: row.minOrderFreeDeliveryPaise,
    landmarksCount: landmarks.length,
    landmarks,
  };
}

function mapRouteRow(row: typeof adminInterVillageRoutes.$inferSelect): InterVillageRouteRecord {
  return {
    id: row.externalId,
    fromVillageId: row.fromVillageId,
    fromVillageName: row.fromVillageName,
    toVillageId: row.toVillageId,
    toVillageName: row.toVillageName,
    distanceKm: Number(row.distanceKm) || 0,
    surchargePaise: row.surchargePaise,
    isActive: row.isActive,
  };
}

function mapDeliveryPartnerRow(
  row: typeof adminDeliveryPartners.$inferSelect
): DeliveryPartnerRecord {
  return {
    id: row.externalId,
    name: row.name,
    phone: row.phone,
    villageId: row.villageId,
    villageName: row.villageName,
    vehicleType: row.vehicleType as DeliveryPartnerRecord['vehicleType'],
    vehicleNumber: row.vehicleNumber ?? undefined,
    kycVerified: row.kycVerified,
    status: row.status as DeliveryPartnerRecord['status'],
    completedDeliveries: row.completedDeliveries,
    rating: Number(row.rating) || 5.0,
    joinedAt: row.joinedAt,
  };
}

function mapAuditLogRow(row: typeof adminAuditLogs.$inferSelect): AuditLogRecord {
  return {
    id: row.externalId,
    actor: row.actor,
    actorRole: row.actorRole as AdminRole | 'SELLER' | 'SYSTEM',
    actionType: row.actionType,
    targetEntity: row.targetEntity,
    targetId: row.targetId,
    timestamp: row.createdAt.toISOString(),
    ipAddress: row.ipAddress,
    details: row.details,
    reason: row.reason ?? undefined,
    metadata: row.metadataJson
      ? safeJsonParse<Record<string, unknown>>(row.metadataJson, {})
      : undefined,
  };
}

// =========================================================================
// 1. SELLER APPLICATIONS CRUD
// =========================================================================
export async function listAdminApplications(): Promise<SellerApplication[]> {
  await seedAdminOpsIfEmpty();
  const rows = await db
    .select()
    .from(adminSellerApplications)
    .orderBy(desc(adminSellerApplications.createdAt), desc(adminSellerApplications.id));
  return rows.map(mapApplicationRow);
}

export async function toggleAdminApplicationDoc(
  externalId: string,
  docCode: string
): Promise<SellerApplication | null> {
  await seedAdminOpsIfEmpty();
  const [existing] = await db
    .select()
    .from(adminSellerApplications)
    .where(eq(adminSellerApplications.externalId, externalId))
    .limit(1);
  if (!existing) return null;

  const docs = safeJsonParse<Record<string, boolean>>(existing.verifiedDocsJson, {});
  const updatedDocs = { ...docs, [docCode]: !docs[docCode] };

  const [updated] = await db
    .update(adminSellerApplications)
    .set({
      verifiedDocsJson: JSON.stringify(updatedDocs),
      updatedAt: new Date(),
    })
    .where(eq(adminSellerApplications.id, existing.id))
    .returning();

  return mapApplicationRow(updated);
}

export async function reviewAdminApplication(params: {
  externalId: string;
  status: ApplicationStatus;
  notes: string;
  reviewedBy: string;
}): Promise<{ application: SellerApplication; createdSeller?: MasterSellerRecord } | null> {
  await seedAdminOpsIfEmpty();
  const [existing] = await db
    .select()
    .from(adminSellerApplications)
    .where(eq(adminSellerApplications.externalId, params.externalId))
    .limit(1);
  if (!existing) return null;

  const nowIso = new Date().toISOString();
  const [updated] = await db
    .update(adminSellerApplications)
    .set({
      status: params.status,
      reviewNotes: params.notes,
      reviewedBy: params.reviewedBy,
      reviewedAt: nowIso,
      updatedAt: new Date(),
    })
    .where(eq(adminSellerApplications.id, existing.id))
    .returning();

  const mappedApp = mapApplicationRow(updated);
  let createdSeller: MasterSellerRecord | undefined;

  if (params.status === 'APPROVED' && existing.status !== 'APPROVED') {
    const newSellerPayload: MasterSellerRecord = {
      id: `sel_${Date.now().toString().slice(-5)}`,
      name: mappedApp.businessName,
      ownerName: mappedApp.applicantName,
      businessType: mappedApp.businessType || 'MULTI_CATEGORY',
      phone: mappedApp.phone,
      villageId: mappedApp.villageId,
      villageName: mappedApp.villageName,
      district: 'Unnao',
      state: 'Uttar Pradesh',
      serviceableVillageIds: [mappedApp.villageId],
      vertical: mappedApp.vertical,
      supportedVerticals: mappedApp.supportedVerticals?.length
        ? mappedApp.supportedVerticals
        : [mappedApp.vertical],
      fulfilmentModes: ['DELIVERY', 'PICKUP'],
      openingHours: '09:00 AM - 09:00 PM',
      status: 'ACTIVE',
      kycStatus: 'APPROVED',
      rating: 5.0,
      totalOrders: 0,
      gmvPaise: 0,
      commissionRateBps: mappedApp.vertical === 'FOOD' ? 500 : 400,
      bankAccountHolder: mappedApp.bankAccountHolder,
      bankAccountNumberMasked: maskBankAccount(mappedApp.bankAccountNumber),
      ifscCode: mappedApp.ifscCode,
      fssaiVerified: Boolean(mappedApp.fssaiNumber),
      joinedAt: nowIso.split('T')[0],
      activityHistory: [
        {
          id: `act_${Date.now()}_reg`,
          type: 'REGISTRATION',
          title: 'Seller Onboarded',
          description: `Approved from application ${mappedApp.id} and activated.`,
          actor: params.reviewedBy,
          timestamp: nowIso,
          reason: params.notes,
        },
      ],
    };
    createdSeller = await createAdminSeller(newSellerPayload);
  }

  return { application: mappedApp, createdSeller };
}

// =========================================================================
// 2. SERVICE AREAS CRUD
// =========================================================================
export async function listAdminServiceAreas(): Promise<VillageServiceAreaRecord[]> {
  await seedAdminOpsIfEmpty();
  const rows = await db
    .select()
    .from(adminServiceAreas)
    .orderBy(asc(adminServiceAreas.id));
  return rows.map(mapServiceAreaRow);
}

export async function createAdminServiceArea(
  input: Omit<VillageServiceAreaRecord, 'id' | 'activeSellersCount' | 'landmarksCount'> & {
    id?: string;
  }
): Promise<VillageServiceAreaRecord> {
  await seedAdminOpsIfEmpty();
  const slug = input.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const externalId = input.id?.trim() || `v-${slug || 'area'}-${Date.now().toString().slice(-3)}`;
  const landmarks = input.landmarks?.length ? input.landmarks : ['Main Chowk', 'Primary School'];

  const [created] = await db
    .insert(adminServiceAreas)
    .values({
      externalId,
      name: input.name.trim(),
      postalCode: input.postalCode.trim(),
      district: input.district.trim(),
      state: input.state.trim(),
      isActive: input.isActive ?? true,
      activeSellersCount: 0,
      baseDeliveryFeePaise: Math.max(0, Number(input.baseDeliveryFeePaise) || 1500),
      minOrderFreeDeliveryPaise: Math.max(0, Number(input.minOrderFreeDeliveryPaise) || 40000),
      landmarksJson: JSON.stringify(landmarks),
    })
    .returning();

  return mapServiceAreaRow(created);
}

export async function updateAdminServiceArea(
  externalId: string,
  patch: Partial<VillageServiceAreaRecord>
): Promise<VillageServiceAreaRecord | null> {
  await seedAdminOpsIfEmpty();
  const [existing] = await db
    .select()
    .from(adminServiceAreas)
    .where(eq(adminServiceAreas.externalId, externalId))
    .limit(1);
  if (!existing) return null;

  const [updated] = await db
    .update(adminServiceAreas)
    .set({
      name: patch.name !== undefined ? patch.name.trim() : existing.name,
      postalCode: patch.postalCode !== undefined ? patch.postalCode.trim() : existing.postalCode,
      district: patch.district !== undefined ? patch.district.trim() : existing.district,
      state: patch.state !== undefined ? patch.state.trim() : existing.state,
      isActive: patch.isActive !== undefined ? patch.isActive : existing.isActive,
      baseDeliveryFeePaise:
        patch.baseDeliveryFeePaise !== undefined && Number.isFinite(patch.baseDeliveryFeePaise)
          ? Math.max(0, Math.round(patch.baseDeliveryFeePaise))
          : existing.baseDeliveryFeePaise,
      minOrderFreeDeliveryPaise:
        patch.minOrderFreeDeliveryPaise !== undefined &&
        Number.isFinite(patch.minOrderFreeDeliveryPaise)
          ? Math.max(0, Math.round(patch.minOrderFreeDeliveryPaise))
          : existing.minOrderFreeDeliveryPaise,
      landmarksJson:
        patch.landmarks !== undefined ? JSON.stringify(patch.landmarks) : existing.landmarksJson,
      updatedAt: new Date(),
    })
    .where(eq(adminServiceAreas.id, existing.id))
    .returning();

  return mapServiceAreaRow(updated);
}

export async function toggleAdminServiceAreaStatus(
  externalId: string
): Promise<VillageServiceAreaRecord | null> {
  await seedAdminOpsIfEmpty();
  const [existing] = await db
    .select()
    .from(adminServiceAreas)
    .where(eq(adminServiceAreas.externalId, externalId))
    .limit(1);
  if (!existing) return null;

  const [updated] = await db
    .update(adminServiceAreas)
    .set({
      isActive: !existing.isActive,
      updatedAt: new Date(),
    })
    .where(eq(adminServiceAreas.id, existing.id))
    .returning();

  return mapServiceAreaRow(updated);
}

// =========================================================================
// 3. INTER-VILLAGE ROUTES CRUD
// =========================================================================
export async function listAdminInterVillageRoutes(): Promise<InterVillageRouteRecord[]> {
  await seedAdminOpsIfEmpty();
  const rows = await db
    .select()
    .from(adminInterVillageRoutes)
    .orderBy(asc(adminInterVillageRoutes.id));
  return rows.map(mapRouteRow);
}

export async function createAdminInterVillageRoute(
  input: Omit<InterVillageRouteRecord, 'id'> & { id?: string }
): Promise<InterVillageRouteRecord> {
  await seedAdminOpsIfEmpty();
  const externalId = input.id?.trim() || `rt_${Date.now()}`;
  const [created] = await db
    .insert(adminInterVillageRoutes)
    .values({
      externalId,
      fromVillageId: input.fromVillageId.trim(),
      fromVillageName: input.fromVillageName.trim(),
      toVillageId: input.toVillageId.trim(),
      toVillageName: input.toVillageName.trim(),
      distanceKm: Math.max(0.1, Number(input.distanceKm) || 1).toFixed(2),
      surchargePaise: Math.max(0, Math.round(Number(input.surchargePaise) || 0)),
      isActive: input.isActive ?? true,
    })
    .returning();

  return mapRouteRow(created);
}

export async function updateAdminInterVillageRoute(
  externalId: string,
  patch: Partial<InterVillageRouteRecord>
): Promise<InterVillageRouteRecord | null> {
  await seedAdminOpsIfEmpty();
  const [existing] = await db
    .select()
    .from(adminInterVillageRoutes)
    .where(eq(adminInterVillageRoutes.externalId, externalId))
    .limit(1);
  if (!existing) return null;

  const [updated] = await db
    .update(adminInterVillageRoutes)
    .set({
      fromVillageId: patch.fromVillageId !== undefined ? patch.fromVillageId : existing.fromVillageId,
      fromVillageName:
        patch.fromVillageName !== undefined ? patch.fromVillageName : existing.fromVillageName,
      toVillageId: patch.toVillageId !== undefined ? patch.toVillageId : existing.toVillageId,
      toVillageName: patch.toVillageName !== undefined ? patch.toVillageName : existing.toVillageName,
      distanceKm:
        patch.distanceKm !== undefined && Number.isFinite(patch.distanceKm)
          ? Math.max(0.1, patch.distanceKm).toFixed(2)
          : existing.distanceKm,
      surchargePaise:
        patch.surchargePaise !== undefined && Number.isFinite(patch.surchargePaise)
          ? Math.max(0, Math.round(patch.surchargePaise))
          : existing.surchargePaise,
      isActive: patch.isActive !== undefined ? patch.isActive : existing.isActive,
      updatedAt: new Date(),
    })
    .where(eq(adminInterVillageRoutes.id, existing.id))
    .returning();

  return mapRouteRow(updated);
}

export async function deleteAdminInterVillageRoute(externalId: string): Promise<boolean> {
  const deleted = await db
    .delete(adminInterVillageRoutes)
    .where(eq(adminInterVillageRoutes.externalId, externalId))
    .returning({ id: adminInterVillageRoutes.id });
  return deleted.length > 0;
}

// =========================================================================
// 4. DELIVERY PARTNERS FLEET CRUD
// =========================================================================
export async function listAdminDeliveryPartners(): Promise<DeliveryPartnerRecord[]> {
  await seedAdminOpsIfEmpty();
  const rows = await db
    .select()
    .from(adminDeliveryPartners)
    .orderBy(desc(adminDeliveryPartners.createdAt), desc(adminDeliveryPartners.id));
  return rows.map(mapDeliveryPartnerRow);
}

export async function createAdminDeliveryPartner(
  input: Omit<DeliveryPartnerRecord, 'id' | 'completedDeliveries' | 'rating' | 'joinedAt'> & {
    id?: string;
  }
): Promise<DeliveryPartnerRecord> {
  await seedAdminOpsIfEmpty();
  const externalId = input.id?.trim() || `rid_${Date.now()}`;
  const [created] = await db
    .insert(adminDeliveryPartners)
    .values({
      externalId,
      name: input.name.trim(),
      phone: input.phone.trim(),
      villageId: input.villageId.trim(),
      villageName: input.villageName.trim(),
      vehicleType: input.vehicleType || 'BIKE',
      vehicleNumber: input.vehicleNumber?.trim() || null,
      kycVerified: Boolean(input.kycVerified),
      status: input.status || 'AVAILABLE',
      completedDeliveries: 0,
      rating: '5.00',
      joinedAt: new Date().toISOString().split('T')[0],
    })
    .returning();

  return mapDeliveryPartnerRow(created);
}

export async function updateAdminDeliveryPartner(
  externalId: string,
  patch: Partial<DeliveryPartnerRecord>
): Promise<DeliveryPartnerRecord | null> {
  await seedAdminOpsIfEmpty();
  const [existing] = await db
    .select()
    .from(adminDeliveryPartners)
    .where(eq(adminDeliveryPartners.externalId, externalId))
    .limit(1);
  if (!existing) return null;

  const [updated] = await db
    .update(adminDeliveryPartners)
    .set({
      name: patch.name !== undefined ? patch.name.trim() : existing.name,
      phone: patch.phone !== undefined ? patch.phone.trim() : existing.phone,
      villageId: patch.villageId !== undefined ? patch.villageId.trim() : existing.villageId,
      villageName: patch.villageName !== undefined ? patch.villageName.trim() : existing.villageName,
      vehicleType: patch.vehicleType !== undefined ? patch.vehicleType : existing.vehicleType,
      vehicleNumber:
        patch.vehicleNumber !== undefined ? patch.vehicleNumber || null : existing.vehicleNumber,
      kycVerified: patch.kycVerified !== undefined ? patch.kycVerified : existing.kycVerified,
      status: patch.status !== undefined ? patch.status : existing.status,
      completedDeliveries:
        patch.completedDeliveries !== undefined && Number.isFinite(patch.completedDeliveries)
          ? Math.max(0, Math.round(patch.completedDeliveries))
          : existing.completedDeliveries,
      rating:
        patch.rating !== undefined && Number.isFinite(patch.rating)
          ? Math.max(0, Math.min(5, patch.rating)).toFixed(2)
          : existing.rating,
      updatedAt: new Date(),
    })
    .where(eq(adminDeliveryPartners.id, existing.id))
    .returning();

  return mapDeliveryPartnerRow(updated);
}

export async function deleteAdminDeliveryPartner(externalId: string): Promise<boolean> {
  const deleted = await db
    .delete(adminDeliveryPartners)
    .where(eq(adminDeliveryPartners.externalId, externalId))
    .returning({ id: adminDeliveryPartners.id });
  return deleted.length > 0;
}

// =========================================================================
// 5. AUDIT LOGS (Append + List + Admin Purge)
// =========================================================================
export async function listAdminAuditLogs(limit = 200): Promise<AuditLogRecord[]> {
  await seedAdminOpsIfEmpty();
  const rows = await db
    .select()
    .from(adminAuditLogs)
    .orderBy(desc(adminAuditLogs.createdAt), desc(adminAuditLogs.id))
    .limit(Math.min(500, Math.max(1, limit)));
  return rows.map(mapAuditLogRow);
}

export async function appendAdminAuditLog(input: {
  id?: string;
  actor: string;
  actorRole: string;
  actionType: string;
  targetEntity: string;
  targetId: string;
  ipAddress: string;
  details: string;
  reason?: string;
  metadata?: Record<string, unknown>;
}): Promise<AuditLogRecord> {
  await seedAdminOpsIfEmpty();
  const externalId =
    input.id?.trim() || `aud_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  const [created] = await db
    .insert(adminAuditLogs)
    .values({
      externalId,
      actor: input.actor.slice(0, 120),
      actorRole: input.actorRole.slice(0, 40),
      actionType: input.actionType.slice(0, 80),
      targetEntity: input.targetEntity.slice(0, 80),
      targetId: input.targetId.slice(0, 100),
      ipAddress: input.ipAddress.slice(0, 64),
      details: input.details.slice(0, 500),
      reason: input.reason ? input.reason.slice(0, 400) : null,
      metadataJson: input.metadata ? JSON.stringify(input.metadata) : null,
    })
    .returning();

  return mapAuditLogRow(created);
}

export async function clearAdminAuditLogs(params: {
  actor: string;
  actorRole: string;
  ipAddress: string;
}): Promise<AuditLogRecord> {
  return await db.transaction(async (tx) => {
    await tx.delete(adminAuditLogs);
    const [fresh] = await tx
      .insert(adminAuditLogs)
      .values({
        externalId: `aud_${Date.now()}`,
        actor: params.actor.slice(0, 120),
        actorRole: params.actorRole.slice(0, 40),
        actionType: 'AUDIT_LOGS_PURGED',
        targetEntity: 'AuditLog',
        targetId: 'all',
        ipAddress: params.ipAddress.slice(0, 64),
        details: 'Audit trail purged and archived by Super Admin authorization.',
        reason: 'Administrative purge',
      })
      .returning();
    return mapAuditLogRow(fresh);
  });
}

// =========================================================================
// 6. ADMIN GLOBAL ORDERS READ
// =========================================================================
export async function listAllAdminOrders() {
  const [allOrders, allSellers] = await Promise.all([
    db.select().from(orders).orderBy(desc(orders.createdAt)).limit(200),
    db.select({ id: sellers.id, code: sellers.code, publicName: sellers.publicName }).from(sellers),
  ]);
  const sellerMap = new Map(allSellers.map((s) => [s.id, s]));

  const results = [];
  for (const ord of allOrders) {
    const [items, history] = await Promise.all([
      db.select().from(orderItems).where(eq(orderItems.orderId, ord.id)),
      db
        .select()
        .from(orderStatusHistory)
        .where(eq(orderStatusHistory.orderId, ord.id))
        .orderBy(asc(orderStatusHistory.createdAt)),
    ]);
    const seller = sellerMap.get(ord.sellerId);
    results.push({
      id: ord.orderNumber,
      orderNumber: ord.orderNumber,
      customerUid: ord.customerUid,
      customerName: ord.customerName,
      customerPhone: ord.customerPhone,
      sellerId: seller?.code || String(ord.sellerId),
      sellerName: seller?.publicName || 'GramBazaar Store',
      villageId: ord.villageCode,
      fulfilmentMode: ord.fulfilmentMode,
      deliveryAddress: safeJsonParse<Record<string, unknown> | undefined>(
        ord.deliveryAddressJson,
        undefined
      ),
      deliveryNote: ord.deliveryNote ?? undefined,
      status: ord.status,
      paymentMethod: ord.paymentMethod,
      paymentStatus: ord.paymentStatus,
      itemSubtotalPaise: Math.round(Number(ord.itemSubtotal) * 100),
      deliveryFeePaise: Math.round(Number(ord.deliveryFee) * 100),
      packagingFeePaise: Math.round(Number(ord.packagingFee) * 100),
      platformFeePaise: Math.round(Number(ord.platformFee) * 100),
      totalPaise: Math.round(Number(ord.totalAmount) * 100),
      items: items.map((item) => ({
        id: String(item.id),
        productName: item.productNameSnapshot,
        catalogueType: item.verticalSnapshot,
        sku: item.skuSnapshot ?? undefined,
        unitPricePaise: Math.round(Number(item.unitPriceSnapshot) * 100),
        requestedQuantity: Number(item.requestedQuantity),
        requestedUnitLabel: item.requestedUnitLabel,
        lineTotalPaise: Math.round(Number(item.lineTotal) * 100),
        customerNote: item.customerNote ?? undefined,
      })),
      statusHistory: history.map((h) => ({
        fromStatus: h.fromStatus ?? undefined,
        toStatus: h.toStatus,
        actorRole: h.actorRole,
        reason: h.reason ?? undefined,
        timestamp: h.createdAt.toISOString(),
      })),
      cancellation: safeJsonParse<Record<string, unknown> | undefined>(
        ord.cancellationJson,
        undefined
      ),
      returnInfo: safeJsonParse<Record<string, unknown> | undefined>(
        ord.returnInfoJson,
        undefined
      ),
      refundInfo: safeJsonParse<Record<string, unknown> | undefined>(
        ord.refundInfoJson,
        undefined
      ),
      createdAt: ord.createdAt.toISOString(),
      updatedAt: ord.updatedAt.toISOString(),
    });
  }
  return results;
}
