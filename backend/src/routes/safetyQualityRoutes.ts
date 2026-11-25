import type { Express, Request, Response } from 'express';
import {
  InspectionOutcomeKey,
  SafetyTrackKey,
  listSafetyProfiles,
  recordAdminSafetyInspection,
  recordSellerExamAttempt,
  setSellerRetrainingStatus,
  setSellerSafetySuspension,
  updateSellerTrainingModule,
  upsertSellerDailyChecklist,
} from '../db/safetyQualityQueries.ts';
import { AuthRequest, requireAdmin, requireAuth } from '../middleware/auth.ts';

const ALLOWED_OUTCOMES = new Set<string>(['PASSED', 'WARNING', 'RETRAINING_REQUIRED']);

export function registerSafetyQualityRoutes(app: Express): void {
  // Public storefront safety badge & certification summary (internal inspection remarks stripped)
  app.get('/api/catalog/safety-profiles', async (_req: Request, res: Response) => {
    try {
      const profiles = await listSafetyProfiles(false);
      res.json({ profiles });
    } catch (error) {
      console.error('Route Error GET /api/catalog/safety-profiles:', error);
      res.status(500).json({ error: 'Unable to load storefront safety profiles.' });
    }
  });

  // Full safety compliance profiles including inspections & remarks (authenticated sellers & admins)
  app.get('/api/safety/profiles', requireAuth, async (_req: AuthRequest, res: Response) => {
    try {
      const profiles = await listSafetyProfiles(true);
      res.json({ profiles });
    } catch (error) {
      console.error('Route Error GET /api/safety/profiles:', error);
      res.status(500).json({ error: 'Unable to load safety compliance profiles.' });
    }
  });

  // Seller training module toggle/complete
  app.patch(
    '/api/safety/sellers/:sellerCode/modules',
    requireAuth,
    async (req: AuthRequest, res: Response) => {
      try {
        const sellerCode = String(req.params.sellerCode || '').trim();
        const moduleId = String(req.body?.moduleId || '').trim();
        const action = req.body?.action === 'complete' ? 'complete' : 'toggle';
        const track =
          req.body?.track === 'FOOD' || req.body?.track === 'GROCERY'
            ? (req.body.track as SafetyTrackKey)
            : undefined;

        if (!sellerCode || !moduleId) {
          return res.status(400).json({ error: 'Seller code and moduleId are required.' });
        }

        const profile = await updateSellerTrainingModule({
          sellerCode,
          moduleId: moduleId.slice(0, 64),
          action,
          track,
        });
        res.json({ profile });
      } catch (error) {
        console.error('Route Error PATCH /api/safety/sellers/:sellerCode/modules:', error);
        res.status(500).json({ error: 'Unable to update training module progress.' });
      }
    }
  );

  // Seller daily hygiene checklist submission (idempotent upsert per seller + dateKey)
  app.post(
    '/api/safety/sellers/:sellerCode/checklists',
    requireAuth,
    async (req: AuthRequest, res: Response) => {
      try {
        const sellerCode = String(req.params.sellerCode || '').trim();
        const body = req.body ?? {};
        const dateKey = String(body.dateKey || '').trim();
        const checkedItemIds = Array.isArray(body.checkedItemIds)
          ? body.checkedItemIds.map((id: unknown) => String(id).trim()).filter(Boolean)
          : null;
        const scorePercent = Number(body.scorePercent);

        if (
          !sellerCode ||
          !/^\d{4}-\d{2}-\d{2}$/.test(dateKey) ||
          !checkedItemIds ||
          !Number.isFinite(scorePercent)
        ) {
          return res.status(400).json({ error: 'Invalid daily checklist submission payload.' });
        }

        const result = await upsertSellerDailyChecklist({
          id: typeof body.id === 'string' ? body.id : undefined,
          sellerCode,
          dateKey,
          track:
            body.track === 'FOOD' || body.track === 'GROCERY'
              ? (body.track as SafetyTrackKey)
              : undefined,
          checkedItemIds,
          scorePercent,
          completedCriticalCount: Number(body.completedCriticalCount) || 0,
          totalCriticalCount: Number(body.totalCriticalCount) || 0,
          notes: typeof body.notes === 'string' ? body.notes.slice(0, 500) : undefined,
        });

        res.status(201).json(result);
      } catch (error) {
        console.error('Route Error POST /api/safety/sellers/:sellerCode/checklists:', error);
        res.status(500).json({ error: 'Unable to save daily hygiene checklist.' });
      }
    }
  );

  // Seller hygiene certification exam attempt (transactional certificate issuance)
  app.post(
    '/api/safety/sellers/:sellerCode/exams',
    requireAuth,
    async (req: AuthRequest, res: Response) => {
      try {
        const sellerCode = String(req.params.sellerCode || '').trim();
        const body = req.body ?? {};
        const scorePercent = Number(body.scorePercent);
        const correctCount = Number(body.correctCount);
        const totalQuestions = Number(body.totalQuestions);

        if (
          !sellerCode ||
          !Number.isFinite(scorePercent) ||
          !Number.isFinite(correctCount) ||
          !Number.isFinite(totalQuestions) ||
          totalQuestions <= 0
        ) {
          return res.status(400).json({ error: 'Invalid safety exam attempt payload.' });
        }

        const weakTopics = Array.isArray(body.weakTopics)
          ? body.weakTopics.map((t: unknown) => String(t).slice(0, 120))
          : [];
        const answers =
          body.answers && typeof body.answers === 'object' && !Array.isArray(body.answers)
            ? (body.answers as Record<string, number>)
            : {};

        const result = await recordSellerExamAttempt({
          id: typeof body.id === 'string' ? body.id : undefined,
          sellerCode,
          track:
            body.track === 'FOOD' || body.track === 'GROCERY'
              ? (body.track as SafetyTrackKey)
              : undefined,
          scorePercent,
          correctCount,
          totalQuestions,
          passed: Boolean(body.passed),
          timeTakenSeconds: Number(body.timeTakenSeconds) || 0,
          weakTopics,
          answers,
        });

        res.status(201).json(result);
      } catch (error) {
        console.error('Route Error POST /api/safety/sellers/:sellerCode/exams:', error);
        res.status(500).json({ error: 'Unable to record safety exam attempt.' });
      }
    }
  );

  // Admin Quality & Safety spot inspection audit (requireAdmin)
  app.post(
    '/api/admin/safety/sellers/:sellerCode/inspections',
    requireAdmin,
    async (req: AuthRequest, res: Response) => {
      try {
        const sellerCode = String(req.params.sellerCode || '').trim();
        const body = req.body ?? {};
        const inspectorName = String(body.inspectorName || '').trim();
        const scorePercent = Number(body.scorePercent);
        const outcome = String(body.outcome || '').trim();
        const remarks = String(body.remarks || '').trim();

        if (
          !sellerCode ||
          !inspectorName ||
          !Number.isFinite(scorePercent) ||
          !ALLOWED_OUTCOMES.has(outcome) ||
          !remarks
        ) {
          return res.status(400).json({ error: 'Invalid admin inspection audit payload.' });
        }

        const findings = Array.isArray(body.findings)
          ? body.findings.map((f: unknown) => String(f).trim().slice(0, 200)).filter(Boolean)
          : [];

        const result = await recordAdminSafetyInspection({
          id: typeof body.id === 'string' ? body.id : undefined,
          sellerCode,
          inspectorName: inspectorName.slice(0, 120),
          scorePercent,
          outcome: outcome as InspectionOutcomeKey,
          remarks: remarks.slice(0, 600),
          findings,
        });

        res.status(201).json(result);
      } catch (error) {
        console.error(
          'Route Error POST /api/admin/safety/sellers/:sellerCode/inspections:',
          error
        );
        res.status(500).json({ error: 'Unable to record inspection audit.' });
      }
    }
  );

  // Admin assign/clear retraining flag (requireAdmin)
  app.patch(
    '/api/admin/safety/sellers/:sellerCode/retraining',
    requireAdmin,
    async (req: AuthRequest, res: Response) => {
      try {
        const sellerCode = String(req.params.sellerCode || '').trim();
        const required = req.body?.required;
        const reason =
          typeof req.body?.reason === 'string' ? req.body.reason.slice(0, 400) : undefined;

        if (!sellerCode || typeof required !== 'boolean') {
          return res
            .status(400)
            .json({ error: 'Seller code and boolean required flag are needed.' });
        }

        const profile = await setSellerRetrainingStatus({
          sellerCode,
          required,
          reason,
        });
        res.json({ profile });
      } catch (error) {
        console.error(
          'Route Error PATCH /api/admin/safety/sellers/:sellerCode/retraining:',
          error
        );
        res.status(500).json({ error: 'Unable to update retraining status.' });
      }
    }
  );

  // Admin suspend/restore seller for safety compliance (requireAdmin)
  app.patch(
    '/api/admin/safety/sellers/:sellerCode/suspension',
    requireAdmin,
    async (req: AuthRequest, res: Response) => {
      try {
        const sellerCode = String(req.params.sellerCode || '').trim();
        const suspended = req.body?.suspended;
        const reason =
          typeof req.body?.reason === 'string' ? req.body.reason.slice(0, 400) : undefined;

        if (!sellerCode || typeof suspended !== 'boolean') {
          return res
            .status(400)
            .json({ error: 'Seller code and boolean suspended flag are needed.' });
        }

        const profile = await setSellerSafetySuspension({
          sellerCode,
          suspended,
          reason,
        });
        res.json({ profile });
      } catch (error) {
        console.error(
          'Route Error PATCH /api/admin/safety/sellers/:sellerCode/suspension:',
          error
        );
        res.status(500).json({ error: 'Unable to update safety suspension status.' });
      }
    }
  );
}
