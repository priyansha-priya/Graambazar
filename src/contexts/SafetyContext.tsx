/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { MOCK_SELLERS } from '../constants/mockData';
import {
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
import { useAuth } from './AuthContext';

function getTodayDateKey(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function getDaysFromNowIso(daysAhead: number): string {
  return new Date(Date.now() + daysAhead * 86400_000).toISOString();
}

function resolveSellerTrack(sellerId: string): SellerSafetyTrack {
  const found = MOCK_SELLERS.find((s) => s.id === sellerId);
  return found?.primaryVertical === 'FOOD' ? 'FOOD' : 'GROCERY';
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
  const { authUser, getAuthHeaders } = useAuth();
  const [profiles, setProfiles] = useState<Record<string, SellerSafetyProfile>>({});

  const safetyRequest = useCallback(
    async <T,>(url: string, init: RequestInit): Promise<T | null> => {
      try {
        const headers = await getAuthHeaders();
        if (!headers) return null;
        const res = await fetch(url, {
          ...init,
          headers: {
            ...headers,
            ...(init.headers || {}),
          },
        });
        if (!res.ok) return null;
        return (await res.json()) as T;
      } catch (error) {
        console.error(`Safety API request failed (${url}):`, error);
        return null;
      }
    },
    [getAuthHeaders]
  );

  const hydrateSafetyProfiles = useCallback(async () => {
    try {
      if (authUser) {
        const headers = await getAuthHeaders();
        if (headers) {
          const authRes = await fetch('/api/safety/profiles', { headers });
          if (authRes.ok) {
            const data = (await authRes.json()) as {
              profiles?: Record<string, SellerSafetyProfile>;
            };
            if (data.profiles) {
              setProfiles(data.profiles);
              return;
            }
          }
        }
      }

      const publicRes = await fetch('/api/catalog/safety-profiles');
      if (publicRes.ok) {
        const data = (await publicRes.json()) as {
          profiles?: Record<string, SellerSafetyProfile>;
        };
        if (data.profiles) {
          setProfiles(data.profiles);
        }
      }
    } catch (error) {
      console.error('Failed to hydrate safety profiles from PostgreSQL:', error);
    }
  }, [authUser, getAuthHeaders]);

  useEffect(() => {
    void hydrateSafetyProfiles();
  }, [hydrateSafetyProfiles]);

  const getSellerProfile = useCallback(
    (sellerId: string): SellerSafetyProfile => {
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
    },
    [profiles]
  );

  const getSellerMetrics = useCallback(
    (sellerId: string): ComputedSellerSafetyMetrics => {
      return computeSellerSafetyMetrics(getSellerProfile(sellerId));
    },
    [getSellerProfile]
  );

  const toggleModuleCompletion = useCallback(
    (sellerId: string, moduleId: string) => {
      const track = resolveSellerTrack(sellerId);
      setProfiles((prev) => {
        const current = prev[sellerId] ?? {
          sellerId,
          track,
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

      void safetyRequest<{ profile?: SellerSafetyProfile }>(
        `/api/safety/sellers/${encodeURIComponent(sellerId)}/modules`,
        {
          method: 'PATCH',
          body: JSON.stringify({ moduleId, action: 'toggle', track }),
        }
      ).then((res) => {
        if (res?.profile) {
          setProfiles((prev) => ({ ...prev, [sellerId]: res.profile! }));
        } else {
          void hydrateSafetyProfiles();
        }
      });
    },
    [safetyRequest, hydrateSafetyProfiles]
  );

  const markModuleCompleted = useCallback(
    (sellerId: string, moduleId: string) => {
      const track = resolveSellerTrack(sellerId);
      setProfiles((prev) => {
        const current = prev[sellerId] ?? {
          sellerId,
          track,
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

      void safetyRequest<{ profile?: SellerSafetyProfile }>(
        `/api/safety/sellers/${encodeURIComponent(sellerId)}/modules`,
        {
          method: 'PATCH',
          body: JSON.stringify({ moduleId, action: 'complete', track }),
        }
      ).then((res) => {
        if (res?.profile) {
          setProfiles((prev) => ({ ...prev, [sellerId]: res.profile! }));
        } else {
          void hydrateSafetyProfiles();
        }
      });
    },
    [safetyRequest, hydrateSafetyProfiles]
  );

  const submitDailyChecklist = useCallback(
    (
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
        const otherDays = existing.checklistSubmissions.filter((s) => s.dateKey !== todayKey);
        return {
          ...prev,
          [sellerId]: {
            ...existing,
            checklistSubmissions: [submission, ...otherDays],
          },
        };
      });

      void safetyRequest<{ profile?: SellerSafetyProfile }>(
        `/api/safety/sellers/${encodeURIComponent(sellerId)}/checklists`,
        {
          method: 'POST',
          body: JSON.stringify(submission),
        }
      ).then((res) => {
        if (res?.profile) {
          setProfiles((prev) => ({ ...prev, [sellerId]: res.profile! }));
        } else {
          void hydrateSafetyProfiles();
        }
      });

      return submission;
    },
    [getSellerProfile, safetyRequest, hydrateSafetyProfiles]
  );

  const submitExamAttempt = useCallback(
    (
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

      void safetyRequest<{ profile?: SellerSafetyProfile }>(
        `/api/safety/sellers/${encodeURIComponent(sellerId)}/exams`,
        {
          method: 'POST',
          body: JSON.stringify(attempt),
        }
      ).then((res) => {
        if (res?.profile) {
          setProfiles((prev) => ({ ...prev, [sellerId]: res.profile! }));
        } else {
          void hydrateSafetyProfiles();
        }
      });

      return attempt;
    },
    [getSellerProfile, safetyRequest, hydrateSafetyProfiles]
  );

  const recordAdminInspection = useCallback(
    (
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
            retrainingRequired: needsRetraining
              ? true
              : outcome === 'PASSED'
              ? false
              : existing.retrainingRequired,
            retrainingReason: needsRetraining
              ? remarks
              : outcome === 'PASSED'
              ? undefined
              : existing.retrainingReason,
          },
        };
      });

      void safetyRequest<{ profile?: SellerSafetyProfile }>(
        `/api/admin/safety/sellers/${encodeURIComponent(sellerId)}/inspections`,
        {
          method: 'POST',
          body: JSON.stringify({
            id: audit.id,
            inspectorName,
            scorePercent,
            outcome,
            remarks,
            findings,
          }),
        }
      ).then((res) => {
        if (res?.profile) {
          setProfiles((prev) => ({ ...prev, [sellerId]: res.profile! }));
        } else {
          void hydrateSafetyProfiles();
        }
      });

      return audit;
    },
    [getSellerProfile, safetyRequest, hydrateSafetyProfiles]
  );

  const assignRetraining = useCallback(
    (sellerId: string, reason: string) => {
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

      void safetyRequest<{ profile?: SellerSafetyProfile }>(
        `/api/admin/safety/sellers/${encodeURIComponent(sellerId)}/retraining`,
        {
          method: 'PATCH',
          body: JSON.stringify({ required: true, reason }),
        }
      ).then((res) => {
        if (res?.profile) {
          setProfiles((prev) => ({ ...prev, [sellerId]: res.profile! }));
        } else {
          void hydrateSafetyProfiles();
        }
      });
    },
    [getSellerProfile, safetyRequest, hydrateSafetyProfiles]
  );

  const clearRetraining = useCallback(
    (sellerId: string) => {
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

      void safetyRequest<{ profile?: SellerSafetyProfile }>(
        `/api/admin/safety/sellers/${encodeURIComponent(sellerId)}/retraining`,
        {
          method: 'PATCH',
          body: JSON.stringify({ required: false }),
        }
      ).then((res) => {
        if (res?.profile) {
          setProfiles((prev) => ({ ...prev, [sellerId]: res.profile! }));
        } else {
          void hydrateSafetyProfiles();
        }
      });
    },
    [getSellerProfile, safetyRequest, hydrateSafetyProfiles]
  );

  const toggleSafetySuspension = useCallback(
    (sellerId: string, suspend: boolean, reason?: string) => {
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

      void safetyRequest<{ profile?: SellerSafetyProfile }>(
        `/api/admin/safety/sellers/${encodeURIComponent(sellerId)}/suspension`,
        {
          method: 'PATCH',
          body: JSON.stringify({ suspended: suspend, reason }),
        }
      ).then((res) => {
        if (res?.profile) {
          setProfiles((prev) => ({ ...prev, [sellerId]: res.profile! }));
        } else {
          void hydrateSafetyProfiles();
        }
      });
    },
    [getSellerProfile, safetyRequest, hydrateSafetyProfiles]
  );

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
    [
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
    ]
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
