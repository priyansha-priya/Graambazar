/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type SellerSafetyTrack = 'FOOD' | 'GROCERY';

export type CertificationBadgeLevel =
  | 'GOLD_CERTIFIED'
  | 'VERIFIED_SAFE'
  | 'IN_PROGRESS'
  | 'ACTION_REQUIRED';

export interface SafetyTrainingModule {
  id: string;
  track: SellerSafetyTrack;
  moduleNumber: number;
  title: string;
  hindiTitle: string;
  durationMinutes: number;
  mandatory: boolean;
  summary: string;
  keyStandards: string[];
  doPractices: string[];
  dontPractices: string[];
  criticalControlPoint: string;
  villagePracticalTip: string;
}

export interface DailyChecklistItem {
  id: string;
  track: SellerSafetyTrack;
  section: string;
  title: string;
  hindiTitle: string;
  weight: number;
  critical: boolean;
}

export interface SafetyExamQuestion {
  id: string;
  track: SellerSafetyTrack;
  topic: string;
  question: string;
  hindiHint: string;
  options: [string, string, string, string];
  correctIndex: number;
  explanation: string;
}

export interface DailyChecklistSubmission {
  id: string;
  sellerId: string;
  dateKey: string; // YYYY-MM-DD
  track: SellerSafetyTrack;
  checkedItemIds: string[];
  scorePercent: number;
  completedCriticalCount: number;
  totalCriticalCount: number;
  submittedAt: string;
  notes?: string;
}

export interface SafetyExamAttempt {
  id: string;
  sellerId: string;
  track: SellerSafetyTrack;
  submittedAt: string;
  scorePercent: number;
  correctCount: number;
  totalQuestions: number;
  passed: boolean;
  timeTakenSeconds: number;
  weakTopics: string[];
  answers: Record<string, number>;
}

export type InspectionOutcome = 'PASSED' | 'RETRAINING_REQUIRED' | 'WARNING_ISSUED';

export interface AdminInspectionAudit {
  id: string;
  sellerId: string;
  inspectorName: string;
  inspectedAt: string;
  scorePercent: number;
  outcome: InspectionOutcome;
  remarks: string;
  findings: string[];
}

export interface SellerSafetyProfile {
  sellerId: string;
  track: SellerSafetyTrack;
  completedModuleIds: string[];
  checklistSubmissions: DailyChecklistSubmission[];
  examAttempts: SafetyExamAttempt[];
  inspections: AdminInspectionAudit[];
  retrainingRequired: boolean;
  retrainingReason?: string;
  suspendedForSafety: boolean;
  certificateNumber?: string;
  certifiedAt?: string;
  certificateValidUntil?: string;
}

export interface ComputedSellerSafetyMetrics {
  track: SellerSafetyTrack;
  completedModulesCount: number;
  totalModulesCount: number;
  trainingProgressPercent: number;
  latestChecklistScore: number | null;
  completedTodayChecklist: boolean;
  bestExamScore: number | null;
  hasPassedExam: boolean;
  latestInspectionScore: number | null;
  overallComplianceScore: number;
  badgeLevel: CertificationBadgeLevel;
  badgeLabel: string;
  isCertified: boolean;
}
