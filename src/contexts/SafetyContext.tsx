/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { MOCK_SELLERS } from '../constants/mockData';
import {
  FOOD_DAILY_CHECKLIST,
  FOOD_EXAM_QUESTIONS,
  FOOD_TRAINING_MODULES,
  GROCERY_DAILY_CHECKLIST,
  GROCERY_EXAM_QUESTIONS,
  GROCERY_TRAINING_MODULES,
  PASSING_EXAM_SCORE_PERCENT,
  getChecklistItemsForTrack,
  getExamQuestionsForTrack,
  getTrainingModulesForTrack,
} from '../constants/safetyData';
import {
  AdminInspectionAudit,
  CertificationBadgeLevel,
  ComputedSellerSafetyMetrics,
  DailyChecklistSubmission,
  InspectionOutcome,
  SafetyExamAttempt,
  SellerSafetyProfile,
  SellerSafetyTrack,
} from '../types/safety';

const STORAGE_KEY = 'grambazaar_seller_safety_profiles_v1';

function getTodayDateKey(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function getDaysAgoIso(daysAgo: number): string {
  return new Date(Date.now() - daysAgo * 86400_000).toISOString();
}

function getDaysFromNowIso(daysAhead: number): string {
  return new Date(Date.now() + daysAhead * 86400_000).toISOString();
}

function resolveSellerTrack(sellerId: string): SellerSafetyTrack {
  const found = MOCK_SELLERS.find((s) => s.id === sellerId);
  return found?.primaryVertical === 'FOOD' ? 'FOOD' : 'GROCERY';
}

function buildSeedProfiles(): Record<string, SellerSafetyProfile> {
  const todayKey = getTodayDateKey();
  const yesterdayDate = new Date(Date.now() - 86400_000);
  const yesterdayKey = `${yesterdayDate.getFullYear()}-${String(
    yesterdayDate.getMonth() + 1
  ).padStart(2, '0')}-${String(yesterdayDate.getDate()).padStart(2, '0')}`;

  const profiles: Record<string, SellerSafetyProfile> = {};

  MOCK_SELLERS.forEach((seller, index) => {
    const track: SellerSafetyTrack = seller.primaryVertical === 'FOOD' ? 'FOOD' : 'GROCERY';
    const modules = track === 'FOOD' ? FOOD_TRAINING_MODULES : GROCERY_TRAINING_MODULES;
    const checklist = track === 'FOOD' ? FOOD_DAILY_CHECKLIST : GROCERY_DAILY_CHECKLIST;
    const exam = track === 'FOOD' ? FOOD_EXAM_QUESTIONS : GROCERY_EXAM_QUESTIONS;

    // Make Gupta Kirana & General Store and Sharma Family Dhaba rich realistic showcase states
    if (seller.id === 'seller_gupta_kirana') {
      // 9 of 11 modules completed, passed exam (90%), yesterday's checklist done (today ready to submit!)
      const completedIds = modules.slice(0, 9).map((m) => m.id);
      const checkedIds = checklist.slice(0, 9).map((c) => c.id);
      const ans: Record<string, number> = {};
      exam.forEach((q, qi) => {
        ans[q.id] = qi === 5 ? (q.correctIndex + 1) % 4 : q.correctIndex;
      });
      profiles[seller.id] = {
        sellerId: seller.id,
        track,
        completedModuleIds: completedIds,
        checklistSubmissions: [
          {
            id: `chk_seed_${seller.id}_1`,
            sellerId: seller.id,
            dateKey: yesterdayKey,
            track,
            checkedItemIds: checkedIds,
            scorePercent: 94,
            completedCriticalCount: checklist.filter((c) => c.critical).length,
            totalCriticalCount: checklist.filter((c) => c.critical).length,
            submittedAt: getDaysAgoIso(1),
            notes: 'FEFO rotation verified on biscuits, mustard oil & dairy fridge checked at 4°C.',
          },
        ],
        examAttempts: [
          {
            id: `exam_seed_${seller.id}_1`,
            sellerId: seller.id,
            track,
            submittedAt: getDaysAgoIso(6),
            scorePercent: 90,
            correctCount: 9,
            totalQuestions: 10,
            passed: true,
            timeTakenSeconds: 318,
            weakTopics: ['Damaged Product Identification'],
            answers: ans,
          },
        ],
        inspections: [
          {
            id: `insp_seed_${seller.id}_1`,
            sellerId: seller.id,
            inspectorName: 'Vikram Singh (Block Quality Officer)',
            inspectedAt: getDaysAgoIso(12),
            scorePercent: 92,
            outcome: 'PASSED',
            remarks: 'Clean dry pallets for atta/rice sacks, separate phenyl & soap rack verified.',
            findings: [
              'Digital weighing scale accurately zero-tared',
              'Loose dal and spice bins tightly lidded',
            ],
          },
        ],
        retrainingRequired: false,
        suspendedForSafety: false,
        certificateNumber: 'GB-GROC-2026-1042',
        certifiedAt: getDaysAgoIso(6),
        certificateValidUntil: getDaysFromNowIso(359),
      };
      return;
    }

    if (seller.id === 'seller_sharma_dhaba') {
      // Gold Certified Food Seller (11/11 modules, 100% today checklist, 90% exam)
      const allModuleIds = modules.map((m) => m.id);
      const allChecklistIds = checklist.map((c) => c.id);
      const ans: Record<string, number> = {};
      exam.forEach((q, qi) => {
        ans[q.id] = qi === 7 ? (q.correctIndex + 1) % 4 : q.correctIndex;
      });
      profiles[seller.id] = {
        sellerId: seller.id,
        track,
        completedModuleIds: allModuleIds,
        checklistSubmissions: [
          {
            id: `chk_seed_${seller.id}_today`,
            sellerId: seller.id,
            dateKey: todayKey,
            track,
            checkedItemIds: allChecklistIds,
            scorePercent: 100,
            completedCriticalCount: checklist.filter((c) => c.critical).length,
            totalCriticalCount: checklist.filter((c) => c.critical).length,
            submittedAt: new Date(Date.now() - 2 * 3600_000).toISOString(),
            notes: 'Morning hygiene audit complete, fresh paneer verified, potable water drum sanitized.',
          },
        ],
        examAttempts: [
          {
            id: `exam_seed_${seller.id}_1`,
            sellerId: seller.id,
            track,
            submittedAt: getDaysAgoIso(10),
            scorePercent: 90,
            correctCount: 9,
            totalQuestions: 10,
            passed: true,
            timeTakenSeconds: 285,
            weakTopics: ['Waste & Pest Prevention'],
            answers: ans,
          },
        ],
        inspections: [
          {
            id: `insp_seed_${seller.id}_1`,
            sellerId: seller.id,
            inspectorName: 'Dr. Meera Joshi (Food Safety Inspector)',
            inspectedAt: getDaysAgoIso(9),
            scorePercent: 96,
            outcome: 'PASSED',
            remarks: 'Exemplary rural kitchen cleanliness, covered thali prep counter, RO cooking water.',
            findings: [
              'Separate raw vegetable and cooked food prep slabs',
              'Tamper-sealed spill-proof packaging containers stocked',
            ],
          },
        ],
        retrainingRequired: false,
        suspendedForSafety: false,
        certificateNumber: 'GB-FOOD-2026-2001',
        certifiedAt: getDaysAgoIso(10),
        certificateValidUntil: getDaysFromNowIso(355),
      };
      return;
    }

    // Distribute realistic tiers across the remaining 14 sellers
    const tierBucket = index % 4;
    if (tierBucket === 0) {
      // Gold Certified
      const allModuleIds = modules.map((m) => m.id);
      const checkedIds = checklist.map((c) => c.id);
      profiles[seller.id] = {
        sellerId: seller.id,
        track,
        completedModuleIds: allModuleIds,
        checklistSubmissions: [
          {
            id: `chk_seed_${seller.id}`,
            sellerId: seller.id,
            dateKey: todayKey,
            track,
            checkedItemIds: checkedIds,
            scorePercent: 100,
            completedCriticalCount: checklist.filter((c) => c.critical).length,
            totalCriticalCount: checklist.filter((c) => c.critical).length,
            submittedAt: getDaysAgoIso(0),
            notes: 'All critical safety checks passed.',
          },
        ],
        examAttempts: [
          {
            id: `exam_seed_${seller.id}`,
            sellerId: seller.id,
            track,
            submittedAt: getDaysAgoIso(14 + index),
            scorePercent: 100,
            correctCount: 10,
            totalQuestions: 10,
            passed: true,
            timeTakenSeconds: 260 + index * 9,
            weakTopics: [],
            answers: {},
          },
        ],
        inspections: [
          {
            id: `insp_seed_${seller.id}`,
            sellerId: seller.id,
            inspectorName: 'Vikram Singh (Block Quality Officer)',
            inspectedAt: getDaysAgoIso(18),
            scorePercent: 94,
            outcome: 'PASSED',
            remarks: 'High hygiene & storage compliance observed during spot visit.',
            findings: ['Verified clean storage & proper packaging'],
          },
        ],
        retrainingRequired: false,
        suspendedForSafety: false,
        certificateNumber: `GB-${track === 'FOOD' ? 'FOOD' : 'GROC'}-2026-${2100 + index}`,
        certifiedAt: getDaysAgoIso(14 + index),
        certificateValidUntil: getDaysFromNowIso(350 - index),
      };
    } else if (tierBucket === 1) {
      // Verified Safe (80% exam, 8/11 modules)
      profiles[seller.id] = {
        sellerId: seller.id,
        track,
        completedModuleIds: modules.slice(0, 8).map((m) => m.id),
        checklistSubmissions: [
          {
            id: `chk_seed_${seller.id}`,
            sellerId: seller.id,
            dateKey: yesterdayKey,
            track,
            checkedItemIds: checklist.slice(0, 8).map((c) => c.id),
            scorePercent: 84,
            completedCriticalCount: checklist.slice(0, 8).filter((c) => c.critical).length,
            totalCriticalCount: checklist.filter((c) => c.critical).length,
            submittedAt: getDaysAgoIso(1),
          },
        ],
        examAttempts: [
          {
            id: `exam_seed_${seller.id}`,
            sellerId: seller.id,
            track,
            submittedAt: getDaysAgoIso(8 + index),
            scorePercent: 80,
            correctCount: 8,
            totalQuestions: 10,
            passed: true,
            timeTakenSeconds: 340,
            weakTopics: [exam[3].topic, exam[7].topic],
            answers: {},
          },
        ],
        inspections: [],
        retrainingRequired: false,
        suspendedForSafety: false,
        certificateNumber: `GB-${track === 'FOOD' ? 'FOOD' : 'GROC'}-2026-${2200 + index}`,
        certifiedAt: getDaysAgoIso(8 + index),
        certificateValidUntil: getDaysFromNowIso(357 - index),
      };
    } else if (tierBucket === 2) {
      // In Progress (5/11 modules, not yet taken exam)
      profiles[seller.id] = {
        sellerId: seller.id,
        track,
        completedModuleIds: modules.slice(0, 5).map((m) => m.id),
        checklistSubmissions: [
          {
            id: `chk_seed_${seller.id}`,
            sellerId: seller.id,
            dateKey: yesterdayKey,
            track,
            checkedItemIds: checklist.slice(0, 7).map((c) => c.id),
            scorePercent: 72,
            completedCriticalCount: checklist.slice(0, 7).filter((c) => c.critical).length,
            totalCriticalCount: checklist.filter((c) => c.critical).length,
            submittedAt: getDaysAgoIso(1),
          },
        ],
        examAttempts: [],
        inspections: [],
        retrainingRequired: false,
        suspendedForSafety: false,
      };
    } else {
      // Action Required / Retraining Flagged (failed exam once at 60%, inspection noted improvement)
      profiles[seller.id] = {
        sellerId: seller.id,
        track,
        completedModuleIds: modules.slice(0, 4).map((m) => m.id),
        checklistSubmissions: [],
        examAttempts: [
          {
            id: `exam_seed_${seller.id}`,
            sellerId: seller.id,
            track,
            submittedAt: getDaysAgoIso(4),
            scorePercent: 60,
            correctCount: 6,
            totalQuestions: 10,
            passed: false,
            timeTakenSeconds: 390,
            weakTopics: [exam[1].topic, exam[2].topic, exam[5].topic],
            answers: {},
          },
        ],
        inspections: [
          {
            id: `insp_seed_${seller.id}`,
            sellerId: seller.id,
            inspectorName: 'Dr. Meera Joshi (Food Safety Inspector)',
            inspectedAt: getDaysAgoIso(3),
            scorePercent: 58,
            outcome: 'RETRAINING_REQUIRED',
            remarks:
              track === 'FOOD'
                ? 'Requires handwash soap station replenishment and covered waste bin upgrade.'
                : 'Requires separating soap/detergent rack from loose grain sacks and FEFO expiry audit.',
            findings:
              track === 'FOOD'
                ? ['Uncovered chutney bowls noticed', 'Complete Hygiene & Packaging modules before retake']
                : ['Detergent cartons near atta sacks', '2 near-expiry snack packs found on front shelf'],
          },
        ],
        retrainingRequired: true,
        retrainingReason:
          track === 'FOOD'
            ? 'Score below 80% & spot inspection flagged uncovered prep bowls — complete training & re-attempt exam.'
            : 'Score below 80% & spot inspection flagged chemical/food shelf proximity — complete training & re-attempt exam.',
        suspendedForSafety: false,
      };
    }
  });

  return profiles;
}

export function computeSellerSafetyMetrics(profile: SellerSafetyProfile): ComputedSellerSafetyMetrics {
  const modules = getTrainingModulesForTrack(profile.track);
  const totalModulesCount = modules.length;
  const completedModulesCount = profile.completedModuleIds.filter((id) =>
    modules.some((m) => m.id === id)
  ).length;
  const trainingProgressPercent =
    totalModulesCount > 0 ? Math.round((completedModulesCount / totalModulesCount) * 100) : 0;

  const todayKey = getTodayDateKey();
  const sortedChecklists = [...profile.checklistSubmissions].sort(
    (a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
  );
  const latestChecklist = sortedChecklists[0] ?? null;
  const latestChecklistScore = latestChecklist ? latestChecklist.scorePercent : null;
  const completedTodayChecklist = profile.checklistSubmissions.some((c) => c.dateKey === todayKey);

  const bestExamScore =
    profile.examAttempts.length > 0
      ? Math.max(...profile.examAttempts.map((a) => a.scorePercent))
      : null;
  const hasPassedExam = profile.examAttempts.some((a) => a.passed);

  const sortedInspections = [...profile.inspections].sort(
    (a, b) => new Date(b.inspectedAt).getTime() - new Date(a.inspectedAt).getTime()
  );
  const latestInspectionScore = sortedInspections[0]?.scorePercent ?? null;

  // Weighted compliance score: 30% training + 30% checklist + 40% exam (or inspection fallback)
  const checklistComponent = latestChecklistScore ?? 0;
  const examComponent = bestExamScore ?? 0;
  const rawScore = Math.round(
    trainingProgressPercent * 0.3 + checklistComponent * 0.3 + examComponent * 0.4
  );
  const overallComplianceScore =
    latestInspectionScore !== null
      ? Math.round(rawScore * 0.8 + latestInspectionScore * 0.2)
      : rawScore;

  let badgeLevel: CertificationBadgeLevel = 'IN_PROGRESS';
  let badgeLabel = 'Training In Progress';

  if (profile.suspendedForSafety || profile.retrainingRequired) {
    badgeLevel = 'ACTION_REQUIRED';
    badgeLabel = profile.suspendedForSafety ? 'Paused for Safety' : 'Retraining Required';
  } else if (
    hasPassedExam &&
    trainingProgressPercent === 100 &&
    (latestChecklistScore ?? 0) >= 85 &&
    overallComplianceScore >= 90
  ) {
    badgeLevel = 'GOLD_CERTIFIED';
    badgeLabel = profile.track === 'FOOD' ? 'Gold Hygiene Certified' : 'Gold Quality Certified';
  } else if (hasPassedExam && overallComplianceScore >= 75) {
    badgeLevel = 'VERIFIED_SAFE';
    badgeLabel = profile.track === 'FOOD' ? 'Hygiene Verified' : 'Quality Verified';
  }

  const isCertified = badgeLevel === 'GOLD_CERTIFIED' || badgeLevel === 'VERIFIED_SAFE';

  return {
    track: profile.track,
    completedModulesCount,
    totalModulesCount,
    trainingProgressPercent,
    latestChecklistScore,
    completedTodayChecklist,
    bestExamScore,
    hasPassedExam,
    latestInspectionScore,
    overallComplianceScore,
    badgeLevel,
    badgeLabel,
    isCertified,
  };
}

interface SafetyContextValue {
  profiles: Record<string, SellerSafetyProfile>;
  getSellerProfile: (sellerId: string) => SellerSafetyProfile;
  getSellerMetrics: (sellerId: string) => ComputedSellerSafetyMetrics;
  toggleModuleCompletion: (sellerId: string, moduleId: string) => void;
  markModuleCompleted: (sellerId: string, moduleId: string) => void;
  submitDailyChecklist: (
    sellerId: string,
    checkedItemIds: string[],
    notes?: string
  ) => DailyChecklistSubmission;
  submitExamAttempt: (
    sellerId: string,
    answers: Record<string, number>,
    timeTakenSeconds: number
  ) => SafetyExamAttempt;
  recordAdminInspection: (
    sellerId: string,
    inspectorName: string,
    scorePercent: number,
    outcome: InspectionOutcome,
    remarks: string,
    findings: string[]
  ) => AdminInspectionAudit;
  assignRetraining: (sellerId: string, reason: string) => void;
  clearRetraining: (sellerId: string) => void;
  toggleSafetySuspension: (sellerId: string, suspend: boolean, reason?: string) => void;
}

const SafetyContext = createContext<SafetyContextValue | undefined>(undefined);

export const SafetyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [profiles, setProfiles] = useState<Record<string, SellerSafetyProfile>>(() => {
    const seeds = buildSeedProfiles();
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as Record<string, SellerSafetyProfile>;
        return { ...seeds, ...parsed };
      }
    } catch {
      // Fallback to fresh seed profiles
    }
    return seeds;
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(profiles));
    } catch {
      // Ignore storage quota errors
    }
  }, [profiles]);

  const getSellerProfile = (sellerId: string): SellerSafetyProfile => {
    if (profiles[sellerId]) return profiles[sellerId];
    return {
      sellerId,
      track: resolveSellerTrack(sellerId),
      completedModuleIds: [],
      checklistSubmissions: [],
      examAttempts: [],
      inspections: [],
      retrainingRequired: false,
      suspendedForSafety: false,
    };
  };

  const getSellerMetrics = (sellerId: string): ComputedSellerSafetyMetrics => {
    return computeSellerSafetyMetrics(getSellerProfile(sellerId));
  };

  const toggleModuleCompletion = (sellerId: string, moduleId: string) => {
    setProfiles((prev) => {
      const current = prev[sellerId] ?? {
        sellerId,
        track: resolveSellerTrack(sellerId),
        completedModuleIds: [],
        checklistSubmissions: [],
        examAttempts: [],
        inspections: [],
        retrainingRequired: false,
        suspendedForSafety: false,
      };
      const exists = current.completedModuleIds.includes(moduleId);
      const nextModules = exists
        ? current.completedModuleIds.filter((id) => id !== moduleId)
        : [...current.completedModuleIds, moduleId];
      return {
        ...prev,
        [sellerId]: {
          ...current,
          completedModuleIds: nextModules,
        },
      };
    });
  };

  const markModuleCompleted = (sellerId: string, moduleId: string) => {
    setProfiles((prev) => {
      const current = prev[sellerId] ?? {
        sellerId,
        track: resolveSellerTrack(sellerId),
        completedModuleIds: [],
        checklistSubmissions: [],
        examAttempts: [],
        inspections: [],
        retrainingRequired: false,
        suspendedForSafety: false,
      };
      if (current.completedModuleIds.includes(moduleId)) return prev;
      return {
        ...prev,
        [sellerId]: {
          ...current,
          completedModuleIds: [...current.completedModuleIds, moduleId],
        },
      };
    });
  };

  const submitDailyChecklist = (
    sellerId: string,
    checkedItemIds: string[],
    notes?: string
  ): DailyChecklistSubmission => {
    const current = getSellerProfile(sellerId);
    const items = getChecklistItemsForTrack(current.track);
    const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);
    const earnedWeight = items
      .filter((item) => checkedItemIds.includes(item.id))
      .reduce((sum, item) => sum + item.weight, 0);
    const scorePercent = totalWeight > 0 ? Math.round((earnedWeight / totalWeight) * 100) : 0;
    const criticalItems = items.filter((i) => i.critical);
    const completedCriticalCount = criticalItems.filter((i) =>
      checkedItemIds.includes(i.id)
    ).length;

    const todayKey = getTodayDateKey();
    const submission: DailyChecklistSubmission = {
      id: `chk_${Date.now()}`,
      sellerId,
      dateKey: todayKey,
      track: current.track,
      checkedItemIds,
      scorePercent,
      completedCriticalCount,
      totalCriticalCount: criticalItems.length,
      submittedAt: new Date().toISOString(),
      notes: notes?.trim() || undefined,
    };

    setProfiles((prev) => {
      const existing = prev[sellerId] ?? current;
      // Replace today's checklist if re-submitted on the same day, keep older days
      const otherDays = existing.checklistSubmissions.filter((s) => s.dateKey !== todayKey);
      return {
        ...prev,
        [sellerId]: {
          ...existing,
          checklistSubmissions: [submission, ...otherDays],
        },
      };
    });

    return submission;
  };

  const submitExamAttempt = (
    sellerId: string,
    answers: Record<string, number>,
    timeTakenSeconds: number
  ): SafetyExamAttempt => {
    const current = getSellerProfile(sellerId);
    const questions = getExamQuestionsForTrack(current.track);
    let correctCount = 0;
    const weakTopicsSet = new Set<string>();

    questions.forEach((q) => {
      if (answers[q.id] === q.correctIndex) {
        correctCount += 1;
      } else {
        weakTopicsSet.add(q.topic);
      }
    });

    const scorePercent =
      questions.length > 0 ? Math.round((correctCount / questions.length) * 100) : 0;
    const passed = scorePercent >= PASSING_EXAM_SCORE_PERCENT;
    const nowIso = new Date().toISOString();

    const attempt: SafetyExamAttempt = {
      id: `exam_${Date.now()}`,
      sellerId,
      track: current.track,
      submittedAt: nowIso,
      scorePercent,
      correctCount,
      totalQuestions: questions.length,
      passed,
      timeTakenSeconds,
      weakTopics: Array.from(weakTopicsSet),
      answers,
    };

    setProfiles((prev) => {
      const existing = prev[sellerId] ?? current;
      const certPrefix = existing.track === 'FOOD' ? 'GB-FOOD-2026' : 'GB-GROC-2026';
      const nextCertNum =
        passed && !existing.certificateNumber
          ? `${certPrefix}-${Math.floor(3000 + Math.random() * 6000)}`
          : existing.certificateNumber;

      return {
        ...prev,
        [sellerId]: {
          ...existing,
          examAttempts: [attempt, ...existing.examAttempts],
          retrainingRequired: passed ? false : existing.retrainingRequired,
          retrainingReason: passed ? undefined : existing.retrainingReason,
          certificateNumber: nextCertNum,
          certifiedAt: passed ? nowIso : existing.certifiedAt,
          certificateValidUntil: passed ? getDaysFromNowIso(365) : existing.certificateValidUntil,
        },
      };
    });

    return attempt;
  };

  const recordAdminInspection = (
    sellerId: string,
    inspectorName: string,
    scorePercent: number,
    outcome: InspectionOutcome,
    remarks: string,
    findings: string[]
  ): AdminInspectionAudit => {
    const audit: AdminInspectionAudit = {
      id: `insp_${Date.now()}`,
      sellerId,
      inspectorName,
      inspectedAt: new Date().toISOString(),
      scorePercent,
      outcome,
      remarks,
      findings,
    };

    setProfiles((prev) => {
      const existing = prev[sellerId] ?? getSellerProfile(sellerId);
      const needsRetraining = outcome === 'RETRAINING_REQUIRED';
      return {
        ...prev,
        [sellerId]: {
          ...existing,
          inspections: [audit, ...existing.inspections],
          retrainingRequired: needsRetraining ? true : outcome === 'PASSED' ? false : existing.retrainingRequired,
          retrainingReason: needsRetraining
            ? remarks
            : outcome === 'PASSED'
            ? undefined
            : existing.retrainingReason,
        },
      };
    });

    return audit;
  };

  const assignRetraining = (sellerId: string, reason: string) => {
    setProfiles((prev) => {
      const existing = prev[sellerId] ?? getSellerProfile(sellerId);
      return {
        ...prev,
        [sellerId]: {
          ...existing,
          retrainingRequired: true,
          retrainingReason: reason,
        },
      };
    });
  };

  const clearRetraining = (sellerId: string) => {
    setProfiles((prev) => {
      const existing = prev[sellerId] ?? getSellerProfile(sellerId);
      return {
        ...prev,
        [sellerId]: {
          ...existing,
          retrainingRequired: false,
          retrainingReason: undefined,
        },
      };
    });
  };

  const toggleSafetySuspension = (sellerId: string, suspend: boolean, reason?: string) => {
    setProfiles((prev) => {
      const existing = prev[sellerId] ?? getSellerProfile(sellerId);
      return {
        ...prev,
        [sellerId]: {
          ...existing,
          suspendedForSafety: suspend,
          retrainingRequired: suspend ? true : existing.retrainingRequired,
          retrainingReason: suspend
            ? reason || 'Store paused by Quality & Safety Admin pending hygiene compliance review.'
            : existing.retrainingReason,
        },
      };
    });
  };

  const value = useMemo<SafetyContextValue>(
    () => ({
      profiles,
      getSellerProfile,
      getSellerMetrics,
      toggleModuleCompletion,
      markModuleCompleted,
      submitDailyChecklist,
      submitExamAttempt,
      recordAdminInspection,
      assignRetraining,
      clearRetraining,
      toggleSafetySuspension,
    }),
    [profiles]
  );

  return <SafetyContext.Provider value={value}>{children}</SafetyContext.Provider>;
};

export const useSafety = (): SafetyContextValue => {
  const ctx = useContext(SafetyContext);
  if (!ctx) {
    throw new Error('useSafety must be used within a SafetyProvider');
  }
  return ctx;
};
