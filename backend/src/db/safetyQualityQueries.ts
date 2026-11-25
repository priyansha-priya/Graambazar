import { desc, eq } from 'drizzle-orm';
import { db } from './index.ts';
import {
  sellerSafetyChecklists,
  sellerSafetyExamAttempts,
  sellerSafetyInspections,
  sellerSafetyProfiles,
  sellers,
} from './schema.ts';

export type SafetyTrackKey = 'FOOD' | 'GROCERY';
export type InspectionOutcomeKey = 'PASSED' | 'WARNING' | 'RETRAINING_REQUIRED';

export interface DailyChecklistSubmissionDTO {
  id: string;
  sellerId: string;
  dateKey: string;
  track: SafetyTrackKey;
  checkedItemIds: string[];
  scorePercent: number;
  completedCriticalCount: number;
  totalCriticalCount: number;
  submittedAt: string;
  notes?: string;
}

export interface SafetyExamAttemptDTO {
  id: string;
  sellerId: string;
  track: SafetyTrackKey;
  submittedAt: string;
  scorePercent: number;
  correctCount: number;
  totalQuestions: number;
  passed: boolean;
  timeTakenSeconds: number;
  weakTopics: string[];
  answers: Record<string, number>;
}

export interface AdminInspectionAuditDTO {
  id: string;
  sellerId: string;
  inspectorName: string;
  inspectedAt: string;
  scorePercent: number;
  outcome: InspectionOutcomeKey;
  remarks: string;
  findings: string[];
}

export interface SellerSafetyProfileDTO {
  sellerId: string;
  track: SafetyTrackKey;
  completedModuleIds: string[];
  checklistSubmissions: DailyChecklistSubmissionDTO[];
  examAttempts: SafetyExamAttemptDTO[];
  inspections: AdminInspectionAuditDTO[];
  retrainingRequired: boolean;
  retrainingReason?: string;
  suspendedForSafety: boolean;
  certificateNumber?: string;
  certifiedAt?: string;
  certificateValidUntil?: string;
}

const FOOD_MODULE_IDS = [
  'fm_1',
  'fm_2',
  'fm_3',
  'fm_4',
  'fm_5',
  'fm_6',
  'fm_7',
  'fm_8',
  'fm_9',
  'fm_10',
  'fm_11',
];

const GROCERY_MODULE_IDS = [
  'gm_1',
  'gm_2',
  'gm_3',
  'gm_4',
  'gm_5',
  'gm_6',
  'gm_7',
  'gm_8',
  'gm_9',
  'gm_10',
  'gm_11',
];

const FOOD_CHECKLIST_IDS = [
  'fc_1',
  'fc_2',
  'fc_3',
  'fc_4',
  'fc_5',
  'fc_6',
  'fc_7',
  'fc_8',
  'fc_9',
  'fc_10',
];

const GROCERY_CHECKLIST_IDS = [
  'gc_1',
  'gc_2',
  'gc_3',
  'gc_4',
  'gc_5',
  'gc_6',
  'gc_7',
  'gc_8',
  'gc_9',
  'gc_10',
];

function safeJsonParse<T>(raw: string | null | undefined, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function getDateKey(daysOffset = 0): string {
  const dt = new Date(Date.now() + daysOffset * 86400_000);
  const y = dt.getUTCFullYear();
  const m = String(dt.getUTCMonth() + 1).padStart(2, '0');
  const d = String(dt.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function getDaysOffsetIso(daysOffset: number): string {
  return new Date(Date.now() + daysOffset * 86400_000).toISOString();
}

let safetySeedPromise: Promise<void> | null = null;

export async function ensureSafetySeeded(): Promise<void> {
  if (!safetySeedPromise) {
    safetySeedPromise = (async () => {
      const existing = await db
        .select({ id: sellerSafetyProfiles.id })
        .from(sellerSafetyProfiles)
        .limit(1);

      if (existing.length > 0) return;

      const sellerRows = await db.select().from(sellers);
      const todayKey = getDateKey(0);
      const yesterdayKey = getDateKey(-1);

      const profilesToInsert: Array<typeof sellerSafetyProfiles.$inferInsert> = [];
      const checklistsToInsert: Array<typeof sellerSafetyChecklists.$inferInsert> = [];
      const examsToInsert: Array<typeof sellerSafetyExamAttempts.$inferInsert> = [];
      const inspectionsToInsert: Array<typeof sellerSafetyInspections.$inferInsert> = [];

      sellerRows.forEach((seller, index) => {
        const track: SafetyTrackKey =
          seller.primaryVertical === 'FOOD' ? 'FOOD' : 'GROCERY';
        const modIds = track === 'FOOD' ? FOOD_MODULE_IDS : GROCERY_MODULE_IDS;
        const chkIds = track === 'FOOD' ? FOOD_CHECKLIST_IDS : GROCERY_CHECKLIST_IDS;

        if (seller.code === 'seller_gupta_kirana') {
          profilesToInsert.push({
            sellerCode: seller.code,
            track,
            completedModuleIdsJson: JSON.stringify(modIds.slice(0, 9)),
            retrainingRequired: false,
            suspendedForSafety: false,
            certificateNumber: 'GB-GROC-2026-1042',
            certifiedAt: getDaysOffsetIso(-6),
            certificateValidUntil: getDaysOffsetIso(359),
          });
          checklistsToInsert.push({
            externalId: `chk_seed_${seller.code}_1`,
            sellerCode: seller.code,
            dateKey: yesterdayKey,
            track,
            checkedItemIdsJson: JSON.stringify(chkIds.slice(0, 9)),
            scorePercent: 94,
            completedCriticalCount: 5,
            totalCriticalCount: 5,
            notes:
              'FEFO rotation verified on biscuits, mustard oil & dairy fridge checked at 4°C.',
            submittedAtIso: getDaysOffsetIso(-1),
          });
          examsToInsert.push({
            externalId: `exam_seed_${seller.code}_1`,
            sellerCode: seller.code,
            track,
            scorePercent: 90,
            correctCount: 9,
            totalQuestions: 10,
            passed: true,
            timeTakenSeconds: 318,
            weakTopicsJson: JSON.stringify(['Damaged Product Identification']),
            answersJson: JSON.stringify({}),
            submittedAtIso: getDaysOffsetIso(-6),
          });
          inspectionsToInsert.push({
            externalId: `insp_seed_${seller.code}_1`,
            sellerCode: seller.code,
            inspectorName: 'Vikram Singh (Block Quality Officer)',
            scorePercent: 92,
            outcome: 'PASSED',
            remarks:
              'Clean dry pallets for atta/rice sacks, separate phenyl & soap rack verified.',
            findingsJson: JSON.stringify([
              'Digital weighing scale accurately zero-tared',
              'Loose dal and spice bins tightly lidded',
            ]),
            inspectedAtIso: getDaysOffsetIso(-12),
          });
          return;
        }

        if (seller.code === 'seller_sharma_dhaba') {
          profilesToInsert.push({
            sellerCode: seller.code,
            track,
            completedModuleIdsJson: JSON.stringify(modIds),
            retrainingRequired: false,
            suspendedForSafety: false,
            certificateNumber: 'GB-FOOD-2026-2001',
            certifiedAt: getDaysOffsetIso(-10),
            certificateValidUntil: getDaysOffsetIso(355),
          });
          checklistsToInsert.push({
            externalId: `chk_seed_${seller.code}_today`,
            sellerCode: seller.code,
            dateKey: todayKey,
            track,
            checkedItemIdsJson: JSON.stringify(chkIds),
            scorePercent: 100,
            completedCriticalCount: 6,
            totalCriticalCount: 6,
            notes:
              'Morning hygiene audit complete, fresh paneer verified, potable water drum sanitized.',
            submittedAtIso: new Date(Date.now() - 2 * 3600_000).toISOString(),
          });
          examsToInsert.push({
            externalId: `exam_seed_${seller.code}_1`,
            sellerCode: seller.code,
            track,
            scorePercent: 90,
            correctCount: 9,
            totalQuestions: 10,
            passed: true,
            timeTakenSeconds: 285,
            weakTopicsJson: JSON.stringify(['Waste & Pest Prevention']),
            answersJson: JSON.stringify({}),
            submittedAtIso: getDaysOffsetIso(-10),
          });
          inspectionsToInsert.push({
            externalId: `insp_seed_${seller.code}_1`,
            sellerCode: seller.code,
            inspectorName: 'Dr. Meera Joshi (Food Safety Inspector)',
            scorePercent: 96,
            outcome: 'PASSED',
            remarks:
              'Exemplary rural kitchen cleanliness, covered thali prep counter, RO cooking water.',
            findingsJson: JSON.stringify([
              'Separate raw vegetable and cooked food prep slabs',
              'Tamper-sealed spill-proof packaging containers stocked',
            ]),
            inspectedAtIso: getDaysOffsetIso(-9),
          });
          return;
        }

        const bucket = index % 4;
        if (bucket === 0) {
          profilesToInsert.push({
            sellerCode: seller.code,
            track,
            completedModuleIdsJson: JSON.stringify(modIds),
            retrainingRequired: false,
            suspendedForSafety: false,
            certificateNumber: `GB-${track === 'FOOD' ? 'FOOD' : 'GROC'}-2026-${2100 + index}`,
            certifiedAt: getDaysOffsetIso(-(14 + index)),
            certificateValidUntil: getDaysOffsetIso(350 - index),
          });
          checklistsToInsert.push({
            externalId: `chk_seed_${seller.code}`,
            sellerCode: seller.code,
            dateKey: todayKey,
            track,
            checkedItemIdsJson: JSON.stringify(chkIds),
            scorePercent: 100,
            completedCriticalCount: 5,
            totalCriticalCount: 5,
            notes: 'All critical safety checks passed.',
            submittedAtIso: getDaysOffsetIso(0),
          });
          examsToInsert.push({
            externalId: `exam_seed_${seller.code}`,
            sellerCode: seller.code,
            track,
            scorePercent: 100,
            correctCount: 10,
            totalQuestions: 10,
            passed: true,
            timeTakenSeconds: 260 + index * 9,
            weakTopicsJson: JSON.stringify([]),
            answersJson: JSON.stringify({}),
            submittedAtIso: getDaysOffsetIso(-(14 + index)),
          });
          inspectionsToInsert.push({
            externalId: `insp_seed_${seller.code}`,
            sellerCode: seller.code,
            inspectorName: 'Vikram Singh (Block Quality Officer)',
            scorePercent: 94,
            outcome: 'PASSED',
            remarks: 'High hygiene & storage compliance observed during spot visit.',
            findingsJson: JSON.stringify(['Verified clean storage & proper packaging']),
            inspectedAtIso: getDaysOffsetIso(-18),
          });
        } else if (bucket === 1) {
          profilesToInsert.push({
            sellerCode: seller.code,
            track,
            completedModuleIdsJson: JSON.stringify(modIds.slice(0, 8)),
            retrainingRequired: false,
            suspendedForSafety: false,
            certificateNumber: `GB-${track === 'FOOD' ? 'FOOD' : 'GROC'}-2026-${2200 + index}`,
            certifiedAt: getDaysOffsetIso(-(8 + index)),
            certificateValidUntil: getDaysOffsetIso(340),
          });
          checklistsToInsert.push({
            externalId: `chk_seed_${seller.code}`,
            sellerCode: seller.code,
            dateKey: yesterdayKey,
            track,
            checkedItemIdsJson: JSON.stringify(chkIds.slice(0, 8)),
            scorePercent: 84,
            completedCriticalCount: 4,
            totalCriticalCount: 5,
            submittedAtIso: getDaysOffsetIso(-1),
          });
          examsToInsert.push({
            externalId: `exam_seed_${seller.code}`,
            sellerCode: seller.code,
            track,
            scorePercent: 80,
            correctCount: 8,
            totalQuestions: 10,
            passed: true,
            timeTakenSeconds: 340,
            weakTopicsJson: JSON.stringify(['Temperature Control']),
            answersJson: JSON.stringify({}),
            submittedAtIso: getDaysOffsetIso(-(8 + index)),
          });
        } else if (bucket === 2) {
          profilesToInsert.push({
            sellerCode: seller.code,
            track,
            completedModuleIdsJson: JSON.stringify(modIds.slice(0, 5)),
            retrainingRequired: false,
            suspendedForSafety: false,
          });
          checklistsToInsert.push({
            externalId: `chk_seed_${seller.code}`,
            sellerCode: seller.code,
            dateKey: yesterdayKey,
            track,
            checkedItemIdsJson: JSON.stringify(chkIds.slice(0, 6)),
            scorePercent: 65,
            completedCriticalCount: 3,
            totalCriticalCount: 5,
            submittedAtIso: getDaysOffsetIso(-1),
          });
        } else {
          profilesToInsert.push({
            sellerCode: seller.code,
            track,
            completedModuleIdsJson: JSON.stringify(modIds.slice(0, 4)),
            retrainingRequired: true,
            retrainingReason:
              'Complete mandatory hygiene refresher modules and score >= 80% on certification exam.',
            suspendedForSafety: false,
          });
          examsToInsert.push({
            externalId: `exam_seed_${seller.code}`,
            sellerCode: seller.code,
            track,
            scorePercent: 60,
            correctCount: 6,
            totalQuestions: 10,
            passed: false,
            timeTakenSeconds: 410,
            weakTopicsJson: JSON.stringify(['Cross-Contamination', 'Expiry & FEFO']),
            answersJson: JSON.stringify({}),
            submittedAtIso: getDaysOffsetIso(-4),
          });
          inspectionsToInsert.push({
            externalId: `insp_seed_${seller.code}`,
            sellerCode: seller.code,
            inspectorName: 'Dr. Meera Joshi (Food Safety Inspector)',
            scorePercent: 62,
            outcome: 'RETRAINING_REQUIRED',
            remarks: 'Follow-up retraining assigned after spot hygiene audit.',
            findingsJson: JSON.stringify(['Labeling & storage separation improvements needed']),
            inspectedAtIso: getDaysOffsetIso(-3),
          });
        }
      });

      if (profilesToInsert.length > 0) {
        await db
          .insert(sellerSafetyProfiles)
          .values(profilesToInsert)
          .onConflictDoNothing();
      }
      if (checklistsToInsert.length > 0) {
        await db
          .insert(sellerSafetyChecklists)
          .values(checklistsToInsert)
          .onConflictDoNothing();
      }
      if (examsToInsert.length > 0) {
        await db
          .insert(sellerSafetyExamAttempts)
          .values(examsToInsert)
          .onConflictDoNothing();
      }
      if (inspectionsToInsert.length > 0) {
        await db
          .insert(sellerSafetyInspections)
          .values(inspectionsToInsert)
          .onConflictDoNothing();
      }
    })().catch((err) => {
      safetySeedPromise = null;
      throw err;
    });
  }
  await safetySeedPromise;
}

async function resolveDefaultTrack(sellerCode: string, explicitTrack?: string): Promise<SafetyTrackKey> {
  if (explicitTrack === 'FOOD' || explicitTrack === 'GROCERY') return explicitTrack;
  const [seller] = await db
    .select({ primaryVertical: sellers.primaryVertical })
    .from(sellers)
    .where(eq(sellers.code, sellerCode))
    .limit(1);
  return seller?.primaryVertical === 'FOOD' ? 'FOOD' : 'GROCERY';
}

async function ensureProfileRow(sellerCode: string, explicitTrack?: string) {
  const [existing] = await db
    .select()
    .from(sellerSafetyProfiles)
    .where(eq(sellerSafetyProfiles.sellerCode, sellerCode))
    .limit(1);
  if (existing) return existing;

  const track = await resolveDefaultTrack(sellerCode, explicitTrack);
  const [inserted] = await db
    .insert(sellerSafetyProfiles)
    .values({
      sellerCode,
      track,
      completedModuleIdsJson: '[]',
      retrainingRequired: false,
      suspendedForSafety: false,
    })
    .onConflictDoNothing()
    .returning();

  if (inserted) return inserted;

  const [fetched] = await db
    .select()
    .from(sellerSafetyProfiles)
    .where(eq(sellerSafetyProfiles.sellerCode, sellerCode))
    .limit(1);
  return fetched;
}

export async function listSafetyProfiles(
  includeInternalInspections: boolean
): Promise<Record<string, SellerSafetyProfileDTO>> {
  await ensureSafetySeeded();

  const [profileRows, checklistRows, examRows, inspectionRows] = await Promise.all([
    db.select().from(sellerSafetyProfiles),
    db
      .select()
      .from(sellerSafetyChecklists)
      .orderBy(desc(sellerSafetyChecklists.submittedAtIso), desc(sellerSafetyChecklists.id)),
    db
      .select()
      .from(sellerSafetyExamAttempts)
      .orderBy(desc(sellerSafetyExamAttempts.submittedAtIso), desc(sellerSafetyExamAttempts.id)),
    includeInternalInspections
      ? db
          .select()
          .from(sellerSafetyInspections)
          .orderBy(
            desc(sellerSafetyInspections.inspectedAtIso),
            desc(sellerSafetyInspections.id)
          )
      : Promise.resolve([]),
  ]);

  const checklistsBySeller = new Map<string, DailyChecklistSubmissionDTO[]>();
  for (const row of checklistRows) {
    const list = checklistsBySeller.get(row.sellerCode) || [];
    list.push({
      id: row.externalId,
      sellerId: row.sellerCode,
      dateKey: row.dateKey,
      track: row.track === 'FOOD' ? 'FOOD' : 'GROCERY',
      checkedItemIds: safeJsonParse<string[]>(row.checkedItemIdsJson, []),
      scorePercent: row.scorePercent,
      completedCriticalCount: row.completedCriticalCount,
      totalCriticalCount: row.totalCriticalCount,
      submittedAt: row.submittedAtIso,
      notes: includeInternalInspections ? (row.notes ?? undefined) : undefined,
    });
    checklistsBySeller.set(row.sellerCode, list);
  }

  const examsBySeller = new Map<string, SafetyExamAttemptDTO[]>();
  for (const row of examRows) {
    const list = examsBySeller.get(row.sellerCode) || [];
    list.push({
      id: row.externalId,
      sellerId: row.sellerCode,
      track: row.track === 'FOOD' ? 'FOOD' : 'GROCERY',
      submittedAt: row.submittedAtIso,
      scorePercent: row.scorePercent,
      correctCount: row.correctCount,
      totalQuestions: row.totalQuestions,
      passed: Boolean(row.passed),
      timeTakenSeconds: row.timeTakenSeconds,
      weakTopics: safeJsonParse<string[]>(row.weakTopicsJson, []),
      answers: includeInternalInspections
        ? safeJsonParse<Record<string, number>>(row.answersJson, {})
        : {},
    });
    examsBySeller.set(row.sellerCode, list);
  }

  const inspectionsBySeller = new Map<string, AdminInspectionAuditDTO[]>();
  for (const row of inspectionRows) {
    const list = inspectionsBySeller.get(row.sellerCode) || [];
    list.push({
      id: row.externalId,
      sellerId: row.sellerCode,
      inspectorName: row.inspectorName,
      inspectedAt: row.inspectedAtIso,
      scorePercent: row.scorePercent,
      outcome:
        row.outcome === 'WARNING' || row.outcome === 'RETRAINING_REQUIRED'
          ? row.outcome
          : 'PASSED',
      remarks: row.remarks,
      findings: safeJsonParse<string[]>(row.findingsJson, []),
    });
    inspectionsBySeller.set(row.sellerCode, list);
  }

  const result: Record<string, SellerSafetyProfileDTO> = {};
  for (const row of profileRows) {
    result[row.sellerCode] = {
      sellerId: row.sellerCode,
      track: row.track === 'FOOD' ? 'FOOD' : 'GROCERY',
      completedModuleIds: safeJsonParse<string[]>(row.completedModuleIdsJson, []),
      checklistSubmissions: checklistsBySeller.get(row.sellerCode) || [],
      examAttempts: examsBySeller.get(row.sellerCode) || [],
      inspections: includeInternalInspections
        ? inspectionsBySeller.get(row.sellerCode) || []
        : [],
      retrainingRequired: Boolean(row.retrainingRequired),
      retrainingReason: includeInternalInspections
        ? (row.retrainingReason ?? undefined)
        : undefined,
      suspendedForSafety: Boolean(row.suspendedForSafety),
      certificateNumber: row.certificateNumber ?? undefined,
      certifiedAt: row.certifiedAt ?? undefined,
      certificateValidUntil: row.certificateValidUntil ?? undefined,
    };
  }

  return result;
}

export async function getSafetyProfileBySellerCode(
  sellerCode: string
): Promise<SellerSafetyProfileDTO> {
  await ensureSafetySeeded();
  await ensureProfileRow(sellerCode);
  const all = await listSafetyProfiles(true);
  return all[sellerCode];
}

export async function updateSellerTrainingModule(input: {
  sellerCode: string;
  moduleId: string;
  action: 'toggle' | 'complete';
  track?: SafetyTrackKey;
}): Promise<SellerSafetyProfileDTO> {
  await ensureSafetySeeded();
  const profile = await ensureProfileRow(input.sellerCode, input.track);
  const currentIds = safeJsonParse<string[]>(profile.completedModuleIdsJson, []);
  const exists = currentIds.includes(input.moduleId);

  let nextIds = currentIds;
  if (input.action === 'complete') {
    if (!exists) nextIds = [...currentIds, input.moduleId];
  } else {
    nextIds = exists
      ? currentIds.filter((id) => id !== input.moduleId)
      : [...currentIds, input.moduleId];
  }

  await db
    .update(sellerSafetyProfiles)
    .set({
      completedModuleIdsJson: JSON.stringify(nextIds),
      updatedAt: new Date(),
    })
    .where(eq(sellerSafetyProfiles.id, profile.id));

  return getSafetyProfileBySellerCode(input.sellerCode);
}

export async function upsertSellerDailyChecklist(input: {
  id?: string;
  sellerCode: string;
  dateKey: string;
  track?: SafetyTrackKey;
  checkedItemIds: string[];
  scorePercent: number;
  completedCriticalCount: number;
  totalCriticalCount: number;
  notes?: string;
}): Promise<{ profile: SellerSafetyProfileDTO; submission: DailyChecklistSubmissionDTO }> {
  await ensureSafetySeeded();
  const profile = await ensureProfileRow(input.sellerCode, input.track);
  const track: SafetyTrackKey =
    input.track || (profile.track === 'FOOD' ? 'FOOD' : 'GROCERY');
  const externalId = input.id?.trim() || `chk_${Date.now()}`;
  const submittedAtIso = new Date().toISOString();

  await db
    .insert(sellerSafetyChecklists)
    .values({
      externalId,
      sellerCode: input.sellerCode,
      dateKey: input.dateKey,
      track,
      checkedItemIdsJson: JSON.stringify(input.checkedItemIds),
      scorePercent: Math.max(0, Math.min(100, Math.round(input.scorePercent))),
      completedCriticalCount: Math.max(0, Math.round(input.completedCriticalCount)),
      totalCriticalCount: Math.max(0, Math.round(input.totalCriticalCount)),
      notes: input.notes?.trim() || null,
      submittedAtIso,
    })
    .onConflictDoUpdate({
      target: [sellerSafetyChecklists.sellerCode, sellerSafetyChecklists.dateKey],
      set: {
        checkedItemIdsJson: JSON.stringify(input.checkedItemIds),
        scorePercent: Math.max(0, Math.min(100, Math.round(input.scorePercent))),
        completedCriticalCount: Math.max(0, Math.round(input.completedCriticalCount)),
        totalCriticalCount: Math.max(0, Math.round(input.totalCriticalCount)),
        notes: input.notes?.trim() || null,
        submittedAtIso,
      },
    });

  const updatedProfile = await getSafetyProfileBySellerCode(input.sellerCode);
  const submission =
    updatedProfile.checklistSubmissions.find((s) => s.dateKey === input.dateKey) || {
      id: externalId,
      sellerId: input.sellerCode,
      dateKey: input.dateKey,
      track,
      checkedItemIds: input.checkedItemIds,
      scorePercent: Math.max(0, Math.min(100, Math.round(input.scorePercent))),
      completedCriticalCount: Math.max(0, Math.round(input.completedCriticalCount)),
      totalCriticalCount: Math.max(0, Math.round(input.totalCriticalCount)),
      submittedAt: submittedAtIso,
      notes: input.notes?.trim() || undefined,
    };

  return { profile: updatedProfile, submission };
}

export async function recordSellerExamAttempt(input: {
  id?: string;
  sellerCode: string;
  track?: SafetyTrackKey;
  scorePercent: number;
  correctCount: number;
  totalQuestions: number;
  passed: boolean;
  timeTakenSeconds: number;
  weakTopics: string[];
  answers: Record<string, number>;
}): Promise<{ profile: SellerSafetyProfileDTO; attempt: SafetyExamAttemptDTO }> {
  await ensureSafetySeeded();
  const profile = await ensureProfileRow(input.sellerCode, input.track);
  const track: SafetyTrackKey =
    input.track || (profile.track === 'FOOD' ? 'FOOD' : 'GROCERY');
  const externalId = input.id?.trim() || `exam_${Date.now()}`;
  const submittedAtIso = new Date().toISOString();

  await db.transaction(async (tx) => {
    await tx.insert(sellerSafetyExamAttempts).values({
      externalId,
      sellerCode: input.sellerCode,
      track,
      scorePercent: Math.max(0, Math.min(100, Math.round(input.scorePercent))),
      correctCount: Math.max(0, Math.round(input.correctCount)),
      totalQuestions: Math.max(0, Math.round(input.totalQuestions)),
      passed: Boolean(input.passed),
      timeTakenSeconds: Math.max(0, Math.round(input.timeTakenSeconds)),
      weakTopicsJson: JSON.stringify(input.weakTopics),
      answersJson: JSON.stringify(input.answers),
      submittedAtIso,
    });

    if (input.passed) {
      const certPrefix = track === 'FOOD' ? 'GB-FOOD-2026' : 'GB-GROC-2026';
      const certNum =
        profile.certificateNumber ||
        `${certPrefix}-${Math.floor(3000 + Math.random() * 6000)}`;

      await tx
        .update(sellerSafetyProfiles)
        .set({
          retrainingRequired: false,
          retrainingReason: null,
          certificateNumber: certNum,
          certifiedAt: submittedAtIso,
          certificateValidUntil: getDaysOffsetIso(365),
          updatedAt: new Date(),
        })
        .where(eq(sellerSafetyProfiles.id, profile.id));
    }
  });

  const updatedProfile = await getSafetyProfileBySellerCode(input.sellerCode);
  const attempt =
    updatedProfile.examAttempts.find((a) => a.id === externalId) || {
      id: externalId,
      sellerId: input.sellerCode,
      track,
      submittedAt: submittedAtIso,
      scorePercent: Math.max(0, Math.min(100, Math.round(input.scorePercent))),
      correctCount: Math.max(0, Math.round(input.correctCount)),
      totalQuestions: Math.max(0, Math.round(input.totalQuestions)),
      passed: Boolean(input.passed),
      timeTakenSeconds: Math.max(0, Math.round(input.timeTakenSeconds)),
      weakTopics: input.weakTopics,
      answers: input.answers,
    };

  return { profile: updatedProfile, attempt };
}

export async function recordAdminSafetyInspection(input: {
  id?: string;
  sellerCode: string;
  inspectorName: string;
  scorePercent: number;
  outcome: InspectionOutcomeKey;
  remarks: string;
  findings: string[];
}): Promise<{ profile: SellerSafetyProfileDTO; audit: AdminInspectionAuditDTO }> {
  await ensureSafetySeeded();
  const profile = await ensureProfileRow(input.sellerCode);
  const externalId = input.id?.trim() || `insp_${Date.now()}`;
  const inspectedAtIso = new Date().toISOString();

  await db.transaction(async (tx) => {
    await tx.insert(sellerSafetyInspections).values({
      externalId,
      sellerCode: input.sellerCode,
      inspectorName: input.inspectorName.trim(),
      scorePercent: Math.max(0, Math.min(100, Math.round(input.scorePercent))),
      outcome: input.outcome,
      remarks: input.remarks.trim(),
      findingsJson: JSON.stringify(input.findings),
      inspectedAtIso,
    });

    const needsRetraining = input.outcome === 'RETRAINING_REQUIRED';
    const nextRetrainingRequired = needsRetraining
      ? true
      : input.outcome === 'PASSED'
      ? false
      : profile.retrainingRequired;
    const nextRetrainingReason = needsRetraining
      ? input.remarks.trim()
      : input.outcome === 'PASSED'
      ? null
      : profile.retrainingReason;

    await tx
      .update(sellerSafetyProfiles)
      .set({
        retrainingRequired: nextRetrainingRequired,
        retrainingReason: nextRetrainingReason,
        updatedAt: new Date(),
      })
      .where(eq(sellerSafetyProfiles.id, profile.id));
  });

  const updatedProfile = await getSafetyProfileBySellerCode(input.sellerCode);
  const audit =
    updatedProfile.inspections.find((i) => i.id === externalId) || {
      id: externalId,
      sellerId: input.sellerCode,
      inspectorName: input.inspectorName.trim(),
      inspectedAt: inspectedAtIso,
      scorePercent: Math.max(0, Math.min(100, Math.round(input.scorePercent))),
      outcome: input.outcome,
      remarks: input.remarks.trim(),
      findings: input.findings,
    };

  return { profile: updatedProfile, audit };
}

export async function setSellerRetrainingStatus(input: {
  sellerCode: string;
  required: boolean;
  reason?: string;
}): Promise<SellerSafetyProfileDTO> {
  await ensureSafetySeeded();
  const profile = await ensureProfileRow(input.sellerCode);

  await db
    .update(sellerSafetyProfiles)
    .set({
      retrainingRequired: Boolean(input.required),
      retrainingReason: input.required ? input.reason?.trim() || 'Retraining required.' : null,
      updatedAt: new Date(),
    })
    .where(eq(sellerSafetyProfiles.id, profile.id));

  return getSafetyProfileBySellerCode(input.sellerCode);
}

export async function setSellerSafetySuspension(input: {
  sellerCode: string;
  suspended: boolean;
  reason?: string;
}): Promise<SellerSafetyProfileDTO> {
  await ensureSafetySeeded();
  const profile = await ensureProfileRow(input.sellerCode);

  await db
    .update(sellerSafetyProfiles)
    .set({
      suspendedForSafety: Boolean(input.suspended),
      retrainingRequired: input.suspended ? true : profile.retrainingRequired,
      retrainingReason: input.suspended
        ? input.reason?.trim() ||
          'Store paused by Quality & Safety Admin pending hygiene compliance review.'
        : profile.retrainingReason,
      updatedAt: new Date(),
    })
    .where(eq(sellerSafetyProfiles.id, profile.id));

  return getSafetyProfileBySellerCode(input.sellerCode);
}
