/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useMemo, useState } from 'react';
import {
  Award,
  BookOpen,
  CheckCircle2,
  ClipboardCheck,
  Clock,
  FileCheck2,
  GraduationCap,
  Printer,
  ShieldAlert,
  ShieldCheck,
  Store,
  Utensils,
  ShoppingBag,
  ArrowRight,
  ArrowLeft,
  RotateCcw,
  AlertTriangle,
  Check,
  XCircle,
  Lightbulb,
} from 'lucide-react';
import { useSeller } from '../../contexts/SellerContext';
import { useSafety } from '../../contexts/SafetyContext';
import {
  PASSING_EXAM_SCORE_PERCENT,
  getChecklistItemsForTrack,
  getExamQuestionsForTrack,
  getTrainingModulesForTrack,
} from '../../constants/safetyData';
import { SafetyExamAttempt } from '../../types/safety';
import { formatDateTime } from '../../utils/dates';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';

type SafetyTab = 'OVERVIEW' | 'TRAINING' | 'CHECKLIST' | 'EXAM';

export const SellerSafetyQualityView: React.FC = () => {
  const { activeSeller, allSellers, setActiveSellerId } = useSeller();
  const {
    getSellerProfile,
    getSellerMetrics,
    toggleModuleCompletion,
    markModuleCompleted,
    submitDailyChecklist,
    submitExamAttempt,
  } = useSafety();

  const profile = getSellerProfile(activeSeller.id);
  const metrics = getSellerMetrics(activeSeller.id);
  const track = profile.track;
  const isFood = track === 'FOOD';

  const modules = useMemo(() => getTrainingModulesForTrack(track), [track]);
  const checklistItems = useMemo(() => getChecklistItemsForTrack(track), [track]);
  const examQuestions = useMemo(() => getExamQuestionsForTrack(track), [track]);

  const [activeTab, setActiveTab] = useState<SafetyTab>('OVERVIEW');
  const [selectedModuleId, setSelectedModuleId] = useState<string>(modules[0]?.id ?? '');
  const [checkedIds, setCheckedIds] = useState<string[]>([]);
  const [checklistNotes, setChecklistNotes] = useState<string>('');
  const [bannerMessage, setBannerMessage] = useState<string | null>(null);
  const [isCertificateOpen, setIsCertificateOpen] = useState(false);

  // Exam runner state
  const [examInProgress, setExamInProgress] = useState(false);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});
  const [examSecondsElapsed, setExamSecondsElapsed] = useState(0);
  const [lastSubmittedAttempt, setLastSubmittedAttempt] = useState<SafetyExamAttempt | null>(null);

  // Reset contextual selections whenever seller switches
  useEffect(() => {
    setSelectedModuleId(modules[0]?.id ?? '');
    const latestChecklist = profile.checklistSubmissions[0];
    setCheckedIds(latestChecklist ? latestChecklist.checkedItemIds : []);
    setChecklistNotes('');
    setExamInProgress(false);
    setSelectedAnswers({});
    setCurrentQuestionIdx(0);
    setExamSecondsElapsed(0);
    setLastSubmittedAttempt(profile.examAttempts[0] ?? null);
  }, [activeSeller.id, track]);

  // Exam timer
  useEffect(() => {
    if (!examInProgress) return;
    const interval = window.setInterval(() => {
      setExamSecondsElapsed((prev) => prev + 1);
    }, 1000);
    return () => window.clearInterval(interval);
  }, [examInProgress]);

  const showFeedback = (message: string) => {
    setBannerMessage(message);
    window.setTimeout(() => setBannerMessage(null), 4000);
  };

  const selectedModule =
    modules.find((m) => m.id === selectedModuleId) ?? modules[0];
  const selectedModuleIdx = modules.findIndex((m) => m.id === selectedModule?.id);
  const isSelectedModuleDone = selectedModule
    ? profile.completedModuleIds.includes(selectedModule.id)
    : false;

  // Group daily checklist by section
  const checklistSections = useMemo(() => {
    const groups: { section: string; items: typeof checklistItems }[] = [];
    checklistItems.forEach((item) => {
      const existing = groups.find((g) => g.section === item.section);
      if (existing) {
        existing.items.push(item);
      } else {
        groups.push({ section: item.section, items: [item] });
      }
    });
    return groups;
  }, [checklistItems]);

  const liveChecklistPreviewScore = useMemo(() => {
    const totalWeight = checklistItems.reduce((s, i) => s + i.weight, 0);
    const earned = checklistItems
      .filter((i) => checkedIds.includes(i.id))
      .reduce((s, i) => s + i.weight, 0);
    return totalWeight > 0 ? Math.round((earned / totalWeight) * 100) : 0;
  }, [checklistItems, checkedIds]);

  const handleToggleChecklistItem = (id: string) => {
    setCheckedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSubmitChecklist = () => {
    const result = submitDailyChecklist(activeSeller.id, checkedIds, checklistNotes);
    showFeedback(
      `Today's ${isFood ? 'Kitchen Hygiene' : 'Store Quality'} Checklist submitted — Score: ${result.scorePercent}% (${result.completedCriticalCount}/${result.totalCriticalCount} critical checks verified).`
    );
  };

  const handleStartExam = () => {
    setSelectedAnswers({});
    setCurrentQuestionIdx(0);
    setExamSecondsElapsed(0);
    setLastSubmittedAttempt(null);
    setExamInProgress(true);
  };

  const handleFinishExam = () => {
    const attempt = submitExamAttempt(activeSeller.id, selectedAnswers, examSecondsElapsed);
    setLastSubmittedAttempt(attempt);
    setExamInProgress(false);
    showFeedback(
      attempt.passed
        ? `Congratulations! You passed with ${attempt.scorePercent}% (${attempt.correctCount}/${attempt.totalQuestions}) and earned your GramBazaar Safety Certificate.`
        : `Assessment completed: ${attempt.scorePercent}%. Minimum ${PASSING_EXAM_SCORE_PERCENT}% is required to earn certification — review weak topics and retry.`
    );
  };

  const answeredCount = Object.keys(selectedAnswers).length;
  const formatElapsed = (sec: number) =>
    `${String(Math.floor(sec / 60)).padStart(2, '0')}:${String(sec % 60).padStart(2, '0')}`;

  const tierColors = {
    GOLD_CERTIFIED: 'bg-[#E8F5E9] text-[#176B2C] border-[#218838]/30',
    VERIFIED_SAFE: 'bg-[#DBEAFE] text-[#1D4ED8] border-[#2563EB]/25',
    IN_PROGRESS: 'bg-[#FEF3C7] text-[#B45309] border-[#D97706]/25',
    ACTION_REQUIRED: 'bg-[#FEE2E2] text-[#B91C1C] border-[#DC2626]/25',
  }[metrics.badgeLevel];

  return (
    <div className="space-y-5 text-left animate-fade-in">
      {/* Page Header & Active Seller Switcher */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2 text-xs text-[#6B7280]">
            <span className="font-semibold text-[#176B2C]">
              {isFood ? 'Food Seller Safety Track' : 'Grocery & Kirana Quality Track'}
            </span>
            <span aria-hidden="true">·</span>
            <span>{activeSeller.villageName}</span>
            <span aria-hidden="true">·</span>
            <span className="font-medium text-[#1F2937]">{metrics.badgeLabel}</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-[#1F2937] tracking-tight">
            Seller Safety, Quality &amp; Assessment Hub
          </h1>
          <p className="text-xs sm:text-sm text-[#6B7280]">
            {isFood
              ? 'Hygiene training, daily kitchen checklist, and food-safety certification for restaurants, dhabas & food vendors.'
              : 'Storage standards, FIFO/FEFO stock rotation, expiry audit checklist, and quality certification for kirana & grocery stores.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          {/* Quick Switch Between Food & Grocery Shops */}
          <div className="flex items-center gap-2 bg-[#F8FAFC] border border-[#E5E7EB] rounded-full px-3 h-10">
            <Store className="w-4 h-4 text-[#218838] shrink-0" />
            <select
              aria-label="Switch active shop"
              value={activeSeller.id}
              onChange={(e) => setActiveSellerId(e.target.value)}
              className="bg-transparent text-xs font-bold text-[#1F2937] outline-none pr-1 max-w-[200px] cursor-pointer"
            >
              {allSellers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.publicName} ({s.primaryVertical === 'FOOD' ? 'Food' : 'Grocery'})
                </option>
              ))}
            </select>
          </div>

          {metrics.isCertified && profile.certificateNumber && (
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Award className="w-4 h-4" />}
              onClick={() => setIsCertificateOpen(true)}
            >
              View Certificate
            </Button>
          )}
        </div>
      </div>

      {/* Feedback Banner */}
      {bannerMessage && (
        <div className="px-4 py-3 rounded-xl bg-[#E8F5E9] border border-[#218838]/30 text-xs font-semibold text-[#176B2C] flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-[#16A34A]" />
            <span>{bannerMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setBannerMessage(null)}
            className="text-[#176B2C] hover:underline font-bold cursor-pointer shrink-0"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Retraining / Safety Hold Alert */}
      {(profile.retrainingRequired || profile.suspendedForSafety) && (
        <div className="p-4 rounded-xl bg-[#FEF2F2] border border-[#FECACA] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-[#DC2626] shrink-0 mt-0.5" />
            <div className="text-xs space-y-0.5">
              <p className="font-bold text-[#991B1B]">
                {profile.suspendedForSafety
                  ? 'Store Temporarily Paused Pending Safety Compliance'
                  : 'Mandatory Retraining & Re-Assessment Required'}
              </p>
              <p className="text-[#7F1D1D]">
                {profile.retrainingReason ||
                  'Complete all mandatory training modules and pass the certification exam with at least 80%.'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setActiveTab('TRAINING')}
            >
              Resume Training
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                setActiveTab('EXAM');
                handleStartExam();
              }}
            >
              Take Exam Now
            </Button>
          </div>
        </div>
      )}

      {/* Segmented Workspace Navigation Tabs */}
      <div
        role="tablist"
        aria-label="Seller safety modules"
        className="flex flex-wrap items-center gap-1.5 p-1.5 bg-white rounded-xl border border-[#E5E7EB]"
      >
        {(
          [
            {
              key: 'OVERVIEW',
              label: 'Overview & Certification',
              icon: <ShieldCheck className="w-4 h-4 shrink-0" />,
            },
            {
              key: 'TRAINING',
              label: `Training Modules (${metrics.completedModulesCount}/${metrics.totalModulesCount})`,
              icon: <BookOpen className="w-4 h-4 shrink-0" />,
            },
            {
              key: 'CHECKLIST',
              label: `Daily Checklist ${metrics.completedTodayChecklist ? '· Done' : '· Due'}`,
              icon: <ClipboardCheck className="w-4 h-4 shrink-0" />,
            },
            {
              key: 'EXAM',
              label: `Certification Exam ${metrics.bestExamScore !== null ? `· ${metrics.bestExamScore}%` : ''}`,
              icon: <GraduationCap className="w-4 h-4 shrink-0" />,
            },
          ] as const
        ).map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                isActive
                  ? 'bg-[#218838] text-white'
                  : 'text-[#475569] hover:bg-[#F8FAFC] hover:text-[#1F2937]'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ====================================================================
       * TAB 1: OVERVIEW & CERTIFICATION ROADMAP
       * ================================================================== */}
      {activeTab === 'OVERVIEW' && (
        <div className="space-y-5">
          {/* 4 KPI Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl border border-[#E5E7EB] p-4 space-y-2">
              <div className="flex items-center justify-between text-xs text-[#6B7280]">
                <span className="font-semibold">Overall Compliance</span>
                <ShieldCheck className="w-4 h-4 text-[#218838]" />
              </div>
              <p className="text-2xl font-extrabold text-[#1F2937] tabular-nums">
                {metrics.overallComplianceScore}%
              </p>
              <div className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md border text-[11px] font-bold ${tierColors}`}>
                <span>{metrics.badgeLabel}</span>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-[#E5E7EB] p-4 space-y-2">
              <div className="flex items-center justify-between text-xs text-[#6B7280]">
                <span className="font-semibold">Training Progress</span>
                <BookOpen className="w-4 h-4 text-[#2563EB]" />
              </div>
              <p className="text-2xl font-extrabold text-[#1F2937] tabular-nums">
                {metrics.completedModulesCount} / {metrics.totalModulesCount}
              </p>
              <div className="w-full h-2 bg-[#F1F5F9] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#218838] rounded-full transition-all duration-300"
                  style={{ width: `${metrics.trainingProgressPercent}%` }}
                />
              </div>
              <p className="text-[11px] text-[#6B7280] tabular-nums">
                {metrics.trainingProgressPercent}% mandatory lessons completed
              </p>
            </div>

            <div className="bg-white rounded-2xl border border-[#E5E7EB] p-4 space-y-2">
              <div className="flex items-center justify-between text-xs text-[#6B7280]">
                <span className="font-semibold">Daily Hygiene Checklist</span>
                <ClipboardCheck className="w-4 h-4 text-[#D97706]" />
              </div>
              <p className="text-2xl font-extrabold text-[#1F2937] tabular-nums">
                {metrics.latestChecklistScore !== null ? `${metrics.latestChecklistScore}%` : 'Pending'}
              </p>
              <p className="text-[11px] text-[#6B7280]">
                {metrics.completedTodayChecklist
                  ? 'Submitted today · Ready for service'
                  : 'Today’s opening self-audit is due'}
              </p>
            </div>

            <div className="bg-white rounded-2xl border border-[#E5E7EB] p-4 space-y-2">
              <div className="flex items-center justify-between text-xs text-[#6B7280]">
                <span className="font-semibold">Certification Exam</span>
                <GraduationCap className="w-4 h-4 text-[#16A34A]" />
              </div>
              <p className="text-2xl font-extrabold text-[#1F2937] tabular-nums">
                {metrics.bestExamScore !== null ? `${metrics.bestExamScore}%` : 'Not Taken'}
              </p>
              <p className="text-[11px] text-[#6B7280]">
                {metrics.hasPassedExam
                  ? `Passed (Threshold ${PASSING_EXAM_SCORE_PERCENT}%)`
                  : `Pass mark: ${PASSING_EXAM_SCORE_PERCENT}% (${examQuestions.length} MCQs)`}
              </p>
            </div>
          </div>

          {/* 3-Step Certification Pathway + Recent Admin Inspections */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            <div className="lg:col-span-7 bg-white rounded-2xl border border-[#E5E7EB] p-5 space-y-4">
              <div>
                <h2 className="text-base font-bold text-[#1F2937]">
                  Certification &amp; Customer Trust Pathway
                </h2>
                <p className="text-xs text-[#6B7280] mt-0.5">
                  Complete all 3 pillars below to display the verified safety badge on your GramBazaar storefront.
                </p>
              </div>

              <div className="divide-y divide-[#E5E7EB]">
                {/* Step 1 */}
                <div className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-0.5">
                    <p className="text-sm font-bold text-[#1F2937]">
                      01. Complete {isFood ? 'Food Safety & Hygiene' : 'Grocery Quality & Storage'} Training
                    </p>
                    <p className="text-xs text-[#6B7280]">
                      {metrics.completedModulesCount} of {metrics.totalModulesCount} lessons completed ({metrics.trainingProgressPercent}%)
                    </p>
                  </div>
                  <Button
                    variant={metrics.trainingProgressPercent === 100 ? 'secondary' : 'primary'}
                    size="sm"
                    onClick={() => setActiveTab('TRAINING')}
                  >
                    {metrics.trainingProgressPercent === 100 ? 'Review Lessons' : 'Continue Learning'}
                  </Button>
                </div>

                {/* Step 2 */}
                <div className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-0.5">
                    <p className="text-sm font-bold text-[#1F2937]">
                      02. Submit Daily Pre-Opening Self-Audit Checklist
                    </p>
                    <p className="text-xs text-[#6B7280]">
                      {metrics.completedTodayChecklist
                        ? `Completed today with ${metrics.latestChecklistScore}% compliance score`
                        : 'Verify 10 daily critical hygiene, storage & expiry controls before accepting orders'}
                    </p>
                  </div>
                  <Button
                    variant={metrics.completedTodayChecklist ? 'secondary' : 'primary'}
                    size="sm"
                    onClick={() => setActiveTab('CHECKLIST')}
                  >
                    {metrics.completedTodayChecklist ? 'View Checklist' : 'Start Checklist'}
                  </Button>
                </div>

                {/* Step 3 */}
                <div className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-0.5">
                    <p className="text-sm font-bold text-[#1F2937]">
                      03. Pass Seller Safety Assessment Exam ({PASSING_EXAM_SCORE_PERCENT}%+ Required)
                    </p>
                    <p className="text-xs text-[#6B7280]">
                      {metrics.hasPassedExam
                        ? `Certified (${profile.certificateNumber || 'Active'}) · Best score ${metrics.bestExamScore}%`
                        : '10 scenario-based questions covering real village shop & delivery standards'}
                    </p>
                  </div>
                  <Button
                    variant={metrics.hasPassedExam ? 'secondary' : 'primary'}
                    size="sm"
                    onClick={() => setActiveTab('EXAM')}
                  >
                    {metrics.hasPassedExam ? 'Exam Results' : 'Start Exam'}
                  </Button>
                </div>
              </div>
            </div>

            {/* Right Column: Inspection Audits & Certificate Status */}
            <div className="lg:col-span-5 bg-white rounded-2xl border border-[#E5E7EB] p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-[#1F2937]">
                  Field Inspection &amp; Audit History
                </h2>
                <span className="text-xs font-semibold text-[#6B7280] tabular-nums">
                  {profile.inspections.length} records
                </span>
              </div>

              {profile.inspections.length === 0 ? (
                <div className="py-8 text-center space-y-2 border border-dashed border-[#E5E7EB] rounded-xl">
                  <FileCheck2 className="w-7 h-7 text-[#9CA3AF] mx-auto" />
                  <p className="text-xs font-bold text-[#1F2937]">No Spot Inspection Logged Yet</p>
                  <p className="text-[11px] text-[#6B7280] max-w-xs mx-auto">
                    Complete your training modules and exam to stay audit-ready for Block Quality Officer visits.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-[#E5E7EB]">
                  {profile.inspections.map((insp) => (
                    <div key={insp.id} className="py-3 first:pt-0 space-y-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold text-[#1F2937]">
                          {insp.inspectorName}
                        </span>
                        <span
                          className={`text-xs font-extrabold tabular-nums ${
                            insp.outcome === 'PASSED'
                              ? 'text-[#16A34A]'
                              : insp.outcome === 'WARNING_ISSUED'
                              ? 'text-[#D97706]'
                              : 'text-[#DC2626]'
                          }`}
                        >
                          {insp.scorePercent}% · {insp.outcome.replace(/_/g, ' ')}
                        </span>
                      </div>
                      <p className="text-xs text-[#475569] leading-relaxed">{insp.remarks}</p>
                      {insp.findings.length > 0 && (
                        <ul className="space-y-1 pt-1">
                          {insp.findings.map((f, i) => (
                            <li key={i} className="text-[11px] text-[#6B7280] flex items-start gap-1.5">
                              <span className="text-[#218838] font-bold">•</span>
                              <span>{f}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                      <p className="text-[11px] text-[#9CA3AF]">
                        Inspected on {formatDateTime(insp.inspectedAt)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================
       * TAB 2: SELLER TRAINING & LEARNING MODULE (11 Category Lessons)
       * ================================================================== */}
      {activeTab === 'TRAINING' && selectedModule && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* Left Module Curriculum List */}
          <div className="lg:col-span-4 bg-white rounded-2xl border border-[#E5E7EB] overflow-hidden">
            <div className="p-4 border-b border-[#E5E7EB] flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-[#1F2937]">
                  {isFood ? 'Food Seller Curriculum' : 'Grocery Seller Curriculum'}
                </h2>
                <p className="text-[11px] text-[#6B7280] tabular-nums mt-0.5">
                  {metrics.completedModulesCount} of {metrics.totalModulesCount} lessons completed
                </p>
              </div>
              <span className="text-xs font-extrabold text-[#176B2C] tabular-nums">
                {metrics.trainingProgressPercent}%
              </span>
            </div>

            <div className="divide-y divide-[#F1F5F9] max-h-[640px] overflow-y-auto">
              {modules.map((mod) => {
                const isDone = profile.completedModuleIds.includes(mod.id);
                const isSelected = mod.id === selectedModule.id;
                return (
                  <button
                    key={mod.id}
                    type="button"
                    onClick={() => setSelectedModuleId(mod.id)}
                    className={`w-full px-4 py-3 text-left flex items-start gap-3 transition-colors cursor-pointer ${
                      isSelected ? 'bg-[#E8F5E9]' : 'hover:bg-[#F8FAFC]'
                    }`}
                  >
                    <span
                      className={`mt-0.5 w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-[10px] font-bold ${
                        isDone
                          ? 'bg-[#16A34A] text-white'
                          : isSelected
                          ? 'bg-[#218838] text-white'
                          : 'bg-[#F1F5F9] text-[#6B7280]'
                      }`}
                    >
                      {isDone ? <Check className="w-3 h-3" /> : mod.moduleNumber}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p
                        className={`text-xs font-bold leading-snug ${
                          isSelected ? 'text-[#176B2C]' : 'text-[#1F2937]'
                        }`}
                      >
                        {mod.title}
                      </p>
                      <p className="text-[11px] text-[#6B7280] truncate mt-0.5">
                        {mod.hindiTitle}
                      </p>
                      <p className="text-[10px] text-[#9CA3AF] mt-1 tabular-nums">
                        {mod.durationMinutes} min · {isDone ? 'Completed' : 'Mandatory'}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right Lesson Content Reader */}
          <div className="lg:col-span-8 bg-white rounded-2xl border border-[#E5E7EB] p-5 sm:p-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-4 border-b border-[#E5E7EB]">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs text-[#6B7280]">
                  <span className="font-semibold text-[#176B2C]">
                    Module {String(selectedModule.moduleNumber).padStart(2, '0')} of {modules.length}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span>{selectedModule.durationMinutes} min read</span>
                  <span aria-hidden="true">·</span>
                  <span>{isSelectedModuleDone ? 'Completed' : 'Pending'}</span>
                </div>
                <h2 className="text-lg sm:text-xl font-extrabold text-[#1F2937]">
                  {selectedModule.title}
                </h2>
                <p className="text-sm font-medium text-[#475569]">{selectedModule.hindiTitle}</p>
              </div>

              <Button
                variant={isSelectedModuleDone ? 'secondary' : 'primary'}
                size="sm"
                leftIcon={<CheckCircle2 className="w-4 h-4" />}
                onClick={() => {
                  toggleModuleCompletion(activeSeller.id, selectedModule.id);
                  showFeedback(
                    isSelectedModuleDone
                      ? `Marked "${selectedModule.title}" as incomplete.`
                      : `Completed Lesson ${selectedModule.moduleNumber}: ${selectedModule.title}`
                  );
                }}
              >
                {isSelectedModuleDone ? 'Completed' : 'Mark Complete'}
              </Button>
            </div>

            <p className="text-sm text-[#374151] leading-relaxed">{selectedModule.summary}</p>

            {/* Core Standards */}
            <div className="space-y-2.5">
              <h3 className="text-sm font-bold text-[#1F2937]">
                Mandatory Marketplace Standards
              </h3>
              <ul className="space-y-2">
                {selectedModule.keyStandards.map((std, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2.5 text-xs sm:text-sm text-[#374151] leading-relaxed"
                  >
                    <CheckCircle2 className="w-4 h-4 text-[#218838] shrink-0 mt-0.5" />
                    <span>{std}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Do's vs Don'ts Comparison */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-[#E5E7EB]">
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-[#176B2C] flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-[#16A34A]" />
                  <span>Recommended Practices (Do)</span>
                </h4>
                <ul className="space-y-1.5">
                  {selectedModule.doPractices.map((d, i) => (
                    <li key={i} className="text-xs text-[#374151] leading-relaxed pl-5 relative">
                      <span className="absolute left-1.5 text-[#16A34A] font-bold">✓</span>
                      {d}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="space-y-2">
                <h4 className="text-xs font-bold text-[#B91C1C] flex items-center gap-1.5">
                  <XCircle className="w-4 h-4 text-[#DC2626]" />
                  <span>Strictly Avoid (Don&apos;t)</span>
                </h4>
                <ul className="space-y-1.5">
                  {selectedModule.dontPractices.map((d, i) => (
                    <li key={i} className="text-xs text-[#374151] leading-relaxed pl-5 relative">
                      <span className="absolute left-1.5 text-[#DC2626] font-bold">×</span>
                      {d}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Critical Control Point & Village Practical Tip */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-[#E5E7EB]">
              <div className="p-3.5 rounded-xl bg-[#FEF3C7]/60 border border-[#FDE68A] space-y-1">
                <p className="text-xs font-bold text-[#92400E] flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-[#D97706]" />
                  <span>Critical Control Point</span>
                </p>
                <p className="text-xs text-[#78350F] leading-relaxed">
                  {selectedModule.criticalControlPoint}
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-[#E8F5E9]/70 border border-[#BBF7D0] space-y-1">
                <p className="text-xs font-bold text-[#176B2C] flex items-center gap-1.5">
                  <Lightbulb className="w-3.5 h-3.5 text-[#218838]" />
                  <span>Village Shop Practical Tip</span>
                </p>
                <p className="text-xs text-[#14532D] leading-relaxed">
                  {selectedModule.villagePracticalTip}
                </p>
              </div>
            </div>

            {/* Bottom Prev / Complete & Next Controls */}
            <div className="pt-4 border-t border-[#E5E7EB] flex items-center justify-between gap-3">
              <Button
                variant="secondary"
                size="sm"
                leftIcon={<ArrowLeft className="w-3.5 h-3.5" />}
                disabled={selectedModuleIdx <= 0}
                onClick={() => {
                  if (selectedModuleIdx > 0) {
                    setSelectedModuleId(modules[selectedModuleIdx - 1].id);
                  }
                }}
              >
                Previous Lesson
              </Button>

              {selectedModuleIdx < modules.length - 1 ? (
                <Button
                  variant="primary"
                  size="sm"
                  rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                  onClick={() => {
                    markModuleCompleted(activeSeller.id, selectedModule.id);
                    setSelectedModuleId(modules[selectedModuleIdx + 1].id);
                  }}
                >
                  Complete &amp; Next Lesson
                </Button>
              ) : (
                <Button
                  variant="primary"
                  size="sm"
                  rightIcon={<GraduationCap className="w-4 h-4" />}
                  onClick={() => {
                    markModuleCompleted(activeSeller.id, selectedModule.id);
                    setActiveTab('EXAM');
                  }}
                >
                  Finish &amp; Go to Exam
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================
       * TAB 3: DAILY SAFETY SELF-AUDIT CHECKLIST
       * ================================================================== */}
      {activeTab === 'CHECKLIST' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          <div className="lg:col-span-8 bg-white rounded-2xl border border-[#E5E7EB] p-5 sm:p-6 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#E5E7EB]">
              <div>
                <h2 className="text-base sm:text-lg font-extrabold text-[#1F2937]">
                  Daily {isFood ? 'Food Hygiene & Kitchen' : 'Grocery Quality & Storage'} Checklist
                </h2>
                <p className="text-xs text-[#6B7280] mt-0.5">
                  Verify each control before starting daily village orders. Critical checks are required for certification.
                </p>
              </div>
              <div className="text-left sm:text-right shrink-0">
                <p className="text-xs text-[#6B7280]">Current Score</p>
                <p className="text-xl font-extrabold text-[#176B2C] tabular-nums">
                  {liveChecklistPreviewScore}%
                </p>
              </div>
            </div>

            <div className="space-y-5">
              {checklistSections.map((group) => (
                <div key={group.section} className="space-y-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#6B7280]">
                    {group.section}
                  </h3>
                  <div className="divide-y divide-[#F1F5F9] border border-[#E5E7EB] rounded-xl overflow-hidden">
                    {group.items.map((item) => {
                      const isChecked = checkedIds.includes(item.id);
                      return (
                        <label
                          key={item.id}
                          className={`flex items-start gap-3 p-3.5 cursor-pointer transition-colors ${
                            isChecked ? 'bg-[#E8F5E9]/45' : 'bg-white hover:bg-[#F8FAFC]'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => handleToggleChecklistItem(item.id)}
                            className="mt-1 w-4 h-4 accent-[#218838] rounded cursor-pointer shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs sm:text-sm font-semibold text-[#1F2937] leading-snug">
                              {item.title}
                            </p>
                            <p className="text-[11px] text-[#6B7280] mt-0.5">{item.hindiTitle}</p>
                          </div>
                          <div className="text-right shrink-0 text-[11px] tabular-nums">
                            {item.critical ? (
                              <span className="font-bold text-[#DC2626]">Critical</span>
                            ) : (
                              <span className="text-[#6B7280]">Standard</span>
                            )}
                            <span className="block text-[10px] text-[#9CA3AF]">
                              {item.weight} pts
                            </span>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* Inspector / Shopkeeper Notes & Submit */}
            <div className="pt-4 border-t border-[#E5E7EB] space-y-3">
              <div>
                <label className="block text-xs font-bold text-[#1F2937] mb-1.5">
                  Daily Audit Notes (Optional)
                </label>
                <textarea
                  rows={2}
                  value={checklistNotes}
                  onChange={(e) => setChecklistNotes(e.target.value)}
                  placeholder={
                    isFood
                      ? 'e.g. Fresh paneer received 7 AM, fridge checked at 4°C, new frying oil filled...'
                      : 'e.g. Expiry audit completed on dairy & snacks, mustard oil batch verified...'
                  }
                  className="w-full px-3.5 py-2.5 text-xs text-[#1F2937] bg-[#F8FAFC] border border-[#E5E7EB] rounded-xl outline-none focus:border-[#218838]"
                />
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() =>
                    setCheckedIds(
                      checkedIds.length === checklistItems.length
                        ? []
                        : checklistItems.map((i) => i.id)
                    )
                  }
                  className="text-xs font-bold text-[#218838] hover:underline cursor-pointer"
                >
                  {checkedIds.length === checklistItems.length
                    ? 'Clear All Checks'
                    : 'Select All Verified Checks'}
                </button>

                <Button
                  variant="primary"
                  size="md"
                  leftIcon={<ClipboardCheck className="w-4 h-4" />}
                  onClick={handleSubmitChecklist}
                >
                  Submit Today&apos;s Checklist ({liveChecklistPreviewScore}%)
                </Button>
              </div>
            </div>
          </div>

          {/* Right: Recent Checklist Submissions */}
          <div className="lg:col-span-4 bg-white rounded-2xl border border-[#E5E7EB] p-5 space-y-4">
            <h3 className="text-sm font-bold text-[#1F2937]">Recent Daily Submissions</h3>

            {profile.checklistSubmissions.length === 0 ? (
              <p className="text-xs text-[#6B7280] py-6 text-center border border-dashed border-[#E5E7EB] rounded-xl">
                No checklist submitted yet for {activeSeller.publicName}.
              </p>
            ) : (
              <div className="divide-y divide-[#E5E7EB]">
                {profile.checklistSubmissions.slice(0, 7).map((sub) => (
                  <div key={sub.id} className="py-3 first:pt-0 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-[#1F2937]">
                        {sub.dateKey}
                      </span>
                      <span
                        className={`text-xs font-extrabold tabular-nums ${
                          sub.scorePercent >= 85
                            ? 'text-[#16A34A]'
                            : sub.scorePercent >= 70
                            ? 'text-[#D97706]'
                            : 'text-[#DC2626]'
                        }`}
                      >
                        {sub.scorePercent}%
                      </span>
                    </div>
                    <p className="text-[11px] text-[#6B7280] tabular-nums">
                      Critical checks: {sub.completedCriticalCount}/{sub.totalCriticalCount} ·{' '}
                      {sub.checkedItemIds.length}/{checklistItems.length} verified
                    </p>
                    {sub.notes && (
                      <p className="text-[11px] text-[#475569] leading-snug">{sub.notes}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ====================================================================
       * TAB 4: CERTIFICATION EXAMINATION
       * ================================================================== */}
      {activeTab === 'EXAM' && (
        <div className="space-y-5">
          {!examInProgress ? (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
              {/* Exam Overview / Start Card */}
              <div className="lg:col-span-7 bg-white rounded-2xl border border-[#E5E7EB] p-6 space-y-5">
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-[#176B2C]">
                    {isFood ? 'Food Safety Certification Test' : 'Grocery Quality & Storage Test'}
                  </p>
                  <h2 className="text-xl font-extrabold text-[#1F2937]">
                    Official Seller Competency Examination
                  </h2>
                  <p className="text-xs sm:text-sm text-[#6B7280] leading-relaxed">
                    Answer {examQuestions.length} practical scenario questions tailored to{' '}
                    {isFood
                      ? 'village kitchens, dhabas, food handling, and delivery safety'
                      : 'kirana stores, expiry audits, FIFO/FEFO rotation, and contamination prevention'}
                    . Score at least <strong>{PASSING_EXAM_SCORE_PERCENT}%</strong> to earn your GramBazaar Certified Safe Seller badge.
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-3 py-3 border-y border-[#E5E7EB] text-center">
                  <div>
                    <p className="text-[11px] text-[#6B7280]">Questions</p>
                    <p className="text-base font-extrabold text-[#1F2937] tabular-nums">
                      {examQuestions.length} MCQs
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] text-[#6B7280]">Passing Mark</p>
                    <p className="text-base font-extrabold text-[#176B2C] tabular-nums">
                      {PASSING_EXAM_SCORE_PERCENT}%
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] text-[#6B7280]">Best Score</p>
                    <p className="text-base font-extrabold text-[#1F2937] tabular-nums">
                      {metrics.bestExamScore !== null ? `${metrics.bestExamScore}%` : '—'}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <Button
                    variant="primary"
                    size="md"
                    leftIcon={<GraduationCap className="w-4 h-4" />}
                    onClick={handleStartExam}
                  >
                    {profile.examAttempts.length > 0
                      ? 'Retake Certification Exam'
                      : 'Start Certification Exam'}
                  </Button>

                  {metrics.isCertified && profile.certificateNumber && (
                    <Button
                      variant="secondary"
                      size="md"
                      leftIcon={<Award className="w-4 h-4" />}
                      onClick={() => setIsCertificateOpen(true)}
                    >
                      Open Safety Certificate
                    </Button>
                  )}
                </div>

                {/* Detailed Review of Latest Submitted Attempt */}
                {lastSubmittedAttempt && (
                  <div className="pt-5 border-t border-[#E5E7EB] space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <h3 className="text-sm font-bold text-[#1F2937]">
                          Latest Result Review ({lastSubmittedAttempt.scorePercent}%)
                        </h3>
                        <p className="text-xs text-[#6B7280] tabular-nums">
                          {lastSubmittedAttempt.correctCount}/{lastSubmittedAttempt.totalQuestions} correct ·{' '}
                          {lastSubmittedAttempt.passed ? 'PASSED' : 'RETRY RECOMMENDED'} · Time:{' '}
                          {formatElapsed(lastSubmittedAttempt.timeTakenSeconds)}
                        </p>
                      </div>
                      {lastSubmittedAttempt.weakTopics.length > 0 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setActiveTab('TRAINING')}
                        >
                          Review Weak Topics
                        </Button>
                      )}
                    </div>

                    {Object.keys(lastSubmittedAttempt.answers).length > 0 && (
                      <div className="divide-y divide-[#F1F5F9] border border-[#E5E7EB] rounded-xl overflow-hidden">
                        {examQuestions.map((q, idx) => {
                          const picked = lastSubmittedAttempt.answers[q.id];
                          const isCorrect = picked === q.correctIndex;
                          return (
                            <div key={q.id} className="p-3.5 bg-white space-y-1">
                              <div className="flex items-start justify-between gap-2">
                                <p className="text-xs font-bold text-[#1F2937]">
                                  {idx + 1}. {q.question}
                                </p>
                                <span
                                  className={`text-[11px] font-bold shrink-0 ${
                                    isCorrect ? 'text-[#16A34A]' : 'text-[#DC2626]'
                                  }`}
                                >
                                  {isCorrect ? 'Correct' : 'Incorrect'}
                                </span>
                              </div>
                              <p className="text-[11px] text-[#176B2C]">
                                <strong>Correct Answer:</strong> {q.options[q.correctIndex]}
                              </p>
                              <p className="text-[11px] text-[#6B7280] leading-relaxed">
                                {q.explanation}
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Attempt History Sidebar */}
              <div className="lg:col-span-5 bg-white rounded-2xl border border-[#E5E7EB] p-5 space-y-4">
                <h3 className="text-sm font-bold text-[#1F2937]">Examination Attempt History</h3>
                {profile.examAttempts.length === 0 ? (
                  <p className="text-xs text-[#6B7280] py-6 text-center border border-dashed border-[#E5E7EB] rounded-xl">
                    No exam attempts recorded yet. Complete the training modules and start your assessment.
                  </p>
                ) : (
                  <div className="divide-y divide-[#E5E7EB]">
                    {profile.examAttempts.map((att, index) => (
                      <div key={att.id} className="py-3 first:pt-0 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-[#1F2937]">
                            Attempt #{profile.examAttempts.length - index}
                          </span>
                          <span
                            className={`text-xs font-extrabold tabular-nums ${
                              att.passed ? 'text-[#16A34A]' : 'text-[#DC2626]'
                            }`}
                          >
                            {att.scorePercent}% · {att.passed ? 'PASSED' : 'FAILED'}
                          </span>
                        </div>
                        <p className="text-[11px] text-[#6B7280] tabular-nums">
                          {att.correctCount}/{att.totalQuestions} correct · Duration{' '}
                          {formatElapsed(att.timeTakenSeconds)} · {formatDateTime(att.submittedAt)}
                        </p>
                        {att.weakTopics.length > 0 && (
                          <p className="text-[11px] text-[#D97706]">
                            Focus areas: {att.weakTopics.join(', ')}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* ACTIVE INTERACTIVE EXAM RUNNER */
            <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 sm:p-6 space-y-5 max-w-4xl">
              <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[#E5E7EB]">
                <div>
                  <p className="text-xs font-semibold text-[#176B2C]">
                    Question {currentQuestionIdx + 1} of {examQuestions.length} ·{' '}
                    {examQuestions[currentQuestionIdx].topic}
                  </p>
                  <p className="text-[11px] text-[#6B7280] mt-0.5 tabular-nums">
                    Answered: {answeredCount} / {examQuestions.length}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <span className="inline-flex items-center gap-1.5 text-xs font-mono font-bold text-[#1F2937] bg-[#F8FAFC] border border-[#E5E7EB] px-3 py-1.5 rounded-lg tabular-nums">
                    <Clock className="w-3.5 h-3.5 text-[#218838]" />
                    {formatElapsed(examSecondsElapsed)}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setExamInProgress(false)}
                  >
                    Exit Exam
                  </Button>
                </div>
              </div>

              {/* Question Number Jump Strip */}
              <div className="flex flex-wrap items-center gap-1.5">
                {examQuestions.map((q, idx) => {
                  const isAnswered = selectedAnswers[q.id] !== undefined;
                  const isCurrent = idx === currentQuestionIdx;
                  return (
                    <button
                      key={q.id}
                      type="button"
                      onClick={() => setCurrentQuestionIdx(idx)}
                      className={`w-8 h-8 rounded-lg text-xs font-bold tabular-nums transition-colors cursor-pointer ${
                        isCurrent
                          ? 'bg-[#218838] text-white'
                          : isAnswered
                          ? 'bg-[#E8F5E9] text-[#176B2C] border border-[#218838]/30'
                          : 'bg-[#F1F5F9] text-[#6B7280] hover:bg-[#E2E8F0]'
                      }`}
                    >
                      {idx + 1}
                    </button>
                  );
                })}
              </div>

              {/* Active Question Card */}
              {(() => {
                const q = examQuestions[currentQuestionIdx];
                return (
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <h3 className="text-base sm:text-lg font-bold text-[#1F2937] leading-snug">
                        {q.question}
                      </h3>
                      <p className="text-xs text-[#6B7280]">{q.hindiHint}</p>
                    </div>

                    <div className="space-y-2.5">
                      {q.options.map((opt, optIdx) => {
                        const isPicked = selectedAnswers[q.id] === optIdx;
                        return (
                          <button
                            key={optIdx}
                            type="button"
                            onClick={() =>
                              setSelectedAnswers((prev) => ({ ...prev, [q.id]: optIdx }))
                            }
                            className={`w-full p-3.5 rounded-xl border text-left text-xs sm:text-sm font-medium flex items-center gap-3 transition-colors cursor-pointer ${
                              isPicked
                                ? 'bg-[#E8F5E9] border-[#218838] text-[#176B2C] font-bold'
                                : 'bg-white border-[#E5E7EB] text-[#1F2937] hover:bg-[#F8FAFC]'
                            }`}
                          >
                            <span
                              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                                isPicked
                                  ? 'bg-[#218838] text-white'
                                  : 'bg-[#F1F5F9] text-[#475569]'
                              }`}
                            >
                              {String.fromCharCode(65 + optIdx)}
                            </span>
                            <span>{opt}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}

              {/* Exam Navigation Footer */}
              <div className="pt-4 border-t border-[#E5E7EB] flex flex-wrap items-center justify-between gap-3">
                <Button
                  variant="secondary"
                  size="sm"
                  leftIcon={<ArrowLeft className="w-3.5 h-3.5" />}
                  disabled={currentQuestionIdx === 0}
                  onClick={() => setCurrentQuestionIdx((p) => Math.max(0, p - 1))}
                >
                  Previous
                </Button>

                <div className="flex items-center gap-2">
                  {currentQuestionIdx < examQuestions.length - 1 ? (
                    <Button
                      variant="primary"
                      size="sm"
                      rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                      onClick={() =>
                        setCurrentQuestionIdx((p) => Math.min(examQuestions.length - 1, p + 1))
                      }
                    >
                      Next Question
                    </Button>
                  ) : (
                    <Button
                      variant="primary"
                      size="md"
                      leftIcon={<CheckCircle2 className="w-4 h-4" />}
                      disabled={answeredCount < examQuestions.length}
                      onClick={handleFinishExam}
                    >
                      Submit Assessment ({answeredCount}/{examQuestions.length})
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Printable Certificate Modal */}
      <Modal
        isOpen={isCertificateOpen}
        onClose={() => setIsCertificateOpen(false)}
        title="GramBazaar Certified Safe Seller"
        size="lg"
        footer={
          <div className="flex items-center justify-end gap-2">
            <Button variant="secondary" size="sm" onClick={() => setIsCertificateOpen(false)}>
              Close
            </Button>
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Printer className="w-4 h-4" />}
              onClick={() => window.print()}
            >
              Print Certificate
            </Button>
          </div>
        }
      >
        <div className="border-2 border-[#218838] rounded-2xl p-6 sm:p-8 bg-[#F8FAFC] text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-[#218838] text-white flex items-center justify-center mx-auto">
            {isFood ? <Utensils className="w-6 h-6" /> : <ShoppingBag className="w-6 h-6" />}
          </div>
          <div className="space-y-1">
            <p className="text-xs font-bold uppercase tracking-widest text-[#176B2C]">
              GramBazaar Village Marketplace · Quality Assurance Council
            </p>
            <h3 className="text-2xl font-extrabold text-[#1F2937]">
              Certificate of {isFood ? 'Food Safety & Hygiene' : 'Grocery Quality & Storage'} Compliance
            </h3>
          </div>
          <p className="text-xs text-[#6B7280]">This certifies that</p>
          <p className="text-xl font-extrabold text-[#176B2C]">{activeSeller.publicName}</p>
          <p className="text-xs text-[#475569] max-w-lg mx-auto leading-relaxed">
            located in <strong>{activeSeller.villageName}</strong>, has successfully completed the
            GramBazaar {isFood ? 'Food Seller Hygiene & Safe Handling' : 'Kirana & Grocery Quality, Expiry & FIFO/FEFO'} Assessment Program with an examination score of{' '}
            <strong className="tabular-nums">{metrics.bestExamScore ?? 80}%</strong> and overall compliance rating of{' '}
            <strong className="tabular-nums">{metrics.overallComplianceScore}%</strong>.
          </p>
          <div className="grid grid-cols-3 gap-4 pt-4 border-t border-[#E5E7EB] text-xs">
            <div>
              <p className="text-[#6B7280]">Certificate ID</p>
              <p className="font-mono font-bold text-[#1F2937] mt-0.5">
                {profile.certificateNumber || 'GB-SAFE-2026'}
              </p>
            </div>
            <div>
              <p className="text-[#6B7280]">Certification Tier</p>
              <p className="font-bold text-[#176B2C] mt-0.5">{metrics.badgeLabel}</p>
            </div>
            <div>
              <p className="text-[#6B7280]">Valid Until</p>
              <p className="font-bold text-[#1F2937] mt-0.5 tabular-nums">
                {profile.certificateValidUntil
                  ? new Date(profile.certificateValidUntil).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })
                  : '1 Year'}
              </p>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};
