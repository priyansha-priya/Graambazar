import type { Express, Request, Response } from 'express';
import {
  adminCancelDbOrder,
  createAdminCancellationRule,
  createAdminFeeRule,
  createAdminOffer,
  createAdminTaxSlab,
  deleteAdminCancellationRule,
  deleteAdminOffer,
  deleteAdminTaxSlab,
  getAdminFinanceBundle,
  listAdminCancellationRules,
  listAdminFeeRules,
  listAdminOffers,
  listAdminPaymentTransactions,
  listAdminPayouts,
  listAdminRefunds,
  listAdminTaxSlabs,
  markAdminPayoutProcessing,
  processDbOrderRefund,
  recordDbOrderReturn,
  settleAdminPayout,
  toggleAdminCancellationRuleStatus,
  toggleAdminFeeRuleShadow,
  toggleAdminFeeRuleStatus,
  toggleAdminOfferStatus,
  toggleAdminTaxSlabStatus,
  updateAdminCancellationRule,
  updateAdminFeeRule,
  updateAdminOffer,
  updateAdminRefundStatus,
  updateAdminTaxSlab,
} from '../db/adminFinanceQueries.ts';
import { AuthRequest, requireAdmin } from '../middleware/auth.ts';
import type {
  CancellationPolicyRuleRecord,
  OfferCouponRecord,
  RefundLedgerRecord,
  SellerPayoutRecord,
} from '../types/admin.ts';

const ALLOWED_DISCOUNT_TYPES = new Set<OfferCouponRecord['discountType']>([
  'FLAT',
  'PERCENTAGE',
  'FREE_DELIVERY',
]);
const ALLOWED_FUNDED_BY = new Set<OfferCouponRecord['fundedBy']>(['PLATFORM', 'SELLER']);
const ALLOWED_CANCEL_ACTORS = new Set<CancellationPolicyRuleRecord['actor']>([
  'CUSTOMER',
  'SELLER',
  'DELIVERY_FAILED',
]);
const ALLOWED_PAYOUT_MODES = new Set<SellerPayoutRecord['paymentMode']>([
  'UPI',
  'NEFT_IMPS',
  'CASH_SETTLEMENT',
]);
const ALLOWED_REFUND_LEDGER_STATUSES = new Set<RefundLedgerRecord['status']>([
  'INITIATED',
  'PROCESSING',
  'PROCESSED',
  'FAILED',
  'REJECTED',
]);
const ALLOWED_ORDER_CANCEL_ACTORS = new Set<'CUSTOMER' | 'SELLER' | 'ADMIN'>([
  'CUSTOMER',
  'SELLER',
  'ADMIN',
]);
const ALLOWED_RETURN_STATUSES = new Set<
  'REQUESTED' | 'APPROVED' | 'PICKED_UP' | 'RECEIVED' | 'REJECTED'
>(['REQUESTED', 'APPROVED', 'PICKED_UP', 'RECEIVED', 'REJECTED']);
const ALLOWED_ORDER_REFUND_STATUSES = new Set<'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED'>([
  'PENDING',
  'PROCESSING',
  'COMPLETED',
  'FAILED',
]);
const ALLOWED_ORDER_REFUND_METHODS = new Set<
  'ORIGINAL_UPI' | 'BANK_TRANSFER' | 'UDHAR_REVERSAL' | 'CASH_SETTLEMENT' | 'STORE_CREDIT'
>(['ORIGINAL_UPI', 'BANK_TRANSFER', 'UDHAR_REVERSAL', 'CASH_SETTLEMENT', 'STORE_CREDIT']);

function getActorName(req: AuthRequest): string {
  return req.dbUser?.displayName || req.user?.name || req.user?.email || 'Admin';
}

function isPgUniqueViolation(error: unknown): boolean {
  return Boolean(
    error &&
      typeof error === 'object' &&
      'code' in error &&
      (error as { code?: string }).code === '23505'
  );
}

export function registerAdminFinanceRoutes(app: Express): void {
  // =========================================================================
  // PUBLIC READ ROUTES (Active Coupons, Tax Slabs, Cancellation Policies)
  // =========================================================================
  app.get('/api/catalog/offers', async (_req: Request, res: Response) => {
    try {
      const offers = await listAdminOffers(true);
      res.json({ offers });
    } catch (error) {
      console.error('Route Error GET /api/catalog/offers:', error);
      res.status(500).json({ error: 'Unable to load active offers right now.' });
    }
  });

  app.get('/api/catalog/tax-slabs', async (_req: Request, res: Response) => {
    try {
      const taxSlabs = await listAdminTaxSlabs();
      res.json({ taxSlabs });
    } catch (error) {
      console.error('Route Error GET /api/catalog/tax-slabs:', error);
      res.status(500).json({ error: 'Unable to load tax slabs right now.' });
    }
  });

  app.get('/api/catalog/cancellation-rules', async (_req: Request, res: Response) => {
    try {
      const cancellationRules = await listAdminCancellationRules();
      res.json({ cancellationRules });
    } catch (error) {
      console.error('Route Error GET /api/catalog/cancellation-rules:', error);
      res.status(500).json({ error: 'Unable to load cancellation rules right now.' });
    }
  });

  // =========================================================================
  // ADMIN FINANCE BUNDLE (Single Round-Trip Hydration)
  // =========================================================================
  app.get('/api/admin/finance/summary', requireAdmin, async (_req: AuthRequest, res: Response) => {
    try {
      const bundle = await getAdminFinanceBundle();
      res.json(bundle);
    } catch (error) {
      console.error('Route Error GET /api/admin/finance/summary:', error);
      res.status(500).json({ error: 'Unable to load finance data.' });
    }
  });

  // =========================================================================
  // FEE & COMMISSION RULES
  // =========================================================================
  app.get('/api/admin/fee-rules', requireAdmin, async (_req: AuthRequest, res: Response) => {
    try {
      const feeRules = await listAdminFeeRules();
      res.json({ feeRules });
    } catch (error) {
      console.error('Route Error GET /api/admin/fee-rules:', error);
      res.status(500).json({ error: 'Unable to load fee rules.' });
    }
  });

  app.post('/api/admin/fee-rules', requireAdmin, async (req: AuthRequest, res: Response) => {
    try {
      const body = req.body ?? {};
      const name = String(body.name || '').trim();
      const vertical = String(body.vertical || 'ALL').trim();
      const effectiveFrom = String(body.effectiveFrom || new Date().toISOString().split('T')[0]).trim();
      if (!name || name.length > 160) {
        return res.status(400).json({ error: 'Valid fee rule name is required.' });
      }
      const created = await createAdminFeeRule({
        id: typeof body.id === 'string' ? body.id.trim().slice(0, 80) : undefined,
        name: name.slice(0, 160),
        vertical: vertical.slice(0, 60),
        commissionBps: Number.isFinite(Number(body.commissionBps)) ? Number(body.commissionBps) : 0,
        platformFeePaise: Number.isFinite(Number(body.platformFeePaise))
          ? Number(body.platformFeePaise)
          : 0,
        effectiveFrom: effectiveFrom.slice(0, 30),
        isPilotShadowMode: typeof body.isPilotShadowMode === 'boolean' ? body.isPilotShadowMode : true,
      });
      res.status(201).json({ feeRule: created });
    } catch (error) {
      console.error('Route Error POST /api/admin/fee-rules:', error);
      res.status(500).json({ error: 'Unable to create fee rule.' });
    }
  });

  app.patch('/api/admin/fee-rules/:id', requireAdmin, async (req: AuthRequest, res: Response) => {
    try {
      const id = String(req.params.id || '').trim();
      if (!id || id.length > 80) {
        return res.status(400).json({ error: 'Invalid fee rule identifier.' });
      }
      const body = req.body ?? {};
      const patch: Record<string, unknown> = {};
      if (typeof body.name === 'string') patch.name = body.name.slice(0, 160);
      if (typeof body.vertical === 'string') patch.vertical = body.vertical.slice(0, 60);
      if (Number.isFinite(Number(body.commissionBps)) && body.commissionBps !== undefined) {
        patch.commissionBps = Number(body.commissionBps);
      }
      if (Number.isFinite(Number(body.platformFeePaise)) && body.platformFeePaise !== undefined) {
        patch.platformFeePaise = Number(body.platformFeePaise);
      }
      if (typeof body.effectiveFrom === 'string') patch.effectiveFrom = body.effectiveFrom.slice(0, 30);
      if (typeof body.isPilotShadowMode === 'boolean') patch.isPilotShadowMode = body.isPilotShadowMode;
      if (body.status === 'ACTIVE' || body.status === 'DEPRECATED') patch.status = body.status;

      const updated = await updateAdminFeeRule(id, patch);
      if (!updated) return res.status(404).json({ error: 'Fee rule not found.' });
      res.json({ feeRule: updated });
    } catch (error) {
      console.error('Route Error PATCH /api/admin/fee-rules/:id:', error);
      res.status(500).json({ error: 'Unable to update fee rule.' });
    }
  });

  app.patch(
    '/api/admin/fee-rules/:id/toggle-shadow',
    requireAdmin,
    async (req: AuthRequest, res: Response) => {
      try {
        const id = String(req.params.id || '').trim();
        const updated = await toggleAdminFeeRuleShadow(id);
        if (!updated) return res.status(404).json({ error: 'Fee rule not found.' });
        res.json({ feeRule: updated });
      } catch (error) {
        console.error('Route Error PATCH /api/admin/fee-rules/:id/toggle-shadow:', error);
        res.status(500).json({ error: 'Unable to toggle shadow mode.' });
      }
    }
  );

  app.patch(
    '/api/admin/fee-rules/:id/toggle-status',
    requireAdmin,
    async (req: AuthRequest, res: Response) => {
      try {
        const id = String(req.params.id || '').trim();
        const updated = await toggleAdminFeeRuleStatus(id);
        if (!updated) return res.status(404).json({ error: 'Fee rule not found.' });
        res.json({ feeRule: updated });
      } catch (error) {
        console.error('Route Error PATCH /api/admin/fee-rules/:id/toggle-status:', error);
        res.status(500).json({ error: 'Unable to toggle fee rule status.' });
      }
    }
  );

  // =========================================================================
  // OFFERS & COUPONS
  // =========================================================================
  app.get('/api/admin/offers', requireAdmin, async (_req: AuthRequest, res: Response) => {
    try {
      const offers = await listAdminOffers(false);
      res.json({ offers });
    } catch (error) {
      console.error('Route Error GET /api/admin/offers:', error);
      res.status(500).json({ error: 'Unable to load offers.' });
    }
  });

  app.post('/api/admin/offers', requireAdmin, async (req: AuthRequest, res: Response) => {
    try {
      const body = req.body ?? {};
      const code = String(body.code || '').trim().toUpperCase();
      const title = String(body.title || '').trim();
      const discountType = String(body.discountType || 'FLAT').trim() as OfferCouponRecord['discountType'];
      const fundedBy = String(body.fundedBy || 'PLATFORM').trim() as OfferCouponRecord['fundedBy'];
      if (
        !code ||
        code.length > 40 ||
        !title ||
        !ALLOWED_DISCOUNT_TYPES.has(discountType) ||
        !ALLOWED_FUNDED_BY.has(fundedBy)
      ) {
        return res.status(400).json({ error: 'Valid coupon code, title, and discount type are required.' });
      }
      const created = await createAdminOffer({
        id: typeof body.id === 'string' ? body.id.trim().slice(0, 80) : undefined,
        code,
        title: title.slice(0, 180),
        discountType,
        discountValue: Number.isFinite(Number(body.discountValue)) ? Number(body.discountValue) : 0,
        minOrderPaise: Number.isFinite(Number(body.minOrderPaise)) ? Number(body.minOrderPaise) : 0,
        maxDiscountPaise:
          body.maxDiscountPaise !== undefined && Number.isFinite(Number(body.maxDiscountPaise))
            ? Number(body.maxDiscountPaise)
            : undefined,
        vertical: String(body.vertical || 'ALL').trim().slice(0, 60),
        villageId: String(body.villageId || 'ALL').trim().slice(0, 80),
        fundedBy,
        validFrom: String(body.validFrom || new Date().toISOString().split('T')[0]).slice(0, 30),
        validUntil: String(body.validUntil || '2026-12-31').slice(0, 30),
        usageLimit: Number.isFinite(Number(body.usageLimit)) ? Number(body.usageLimit) : 100,
        isActive: typeof body.isActive === 'boolean' ? body.isActive : true,
      });
      res.status(201).json({ offer: created });
    } catch (error) {
      if (isPgUniqueViolation(error)) {
        return res.status(409).json({ error: 'A coupon with this code already exists.' });
      }
      console.error('Route Error POST /api/admin/offers:', error);
      res.status(500).json({ error: 'Unable to create offer.' });
    }
  });

  app.patch('/api/admin/offers/:id', requireAdmin, async (req: AuthRequest, res: Response) => {
    try {
      const id = String(req.params.id || '').trim();
      const body = req.body ?? {};
      const patch: Record<string, unknown> = {};
      if (typeof body.code === 'string') patch.code = body.code.trim().toUpperCase().slice(0, 40);
      if (typeof body.title === 'string') patch.title = body.title.slice(0, 180);
      if (ALLOWED_DISCOUNT_TYPES.has(body.discountType)) patch.discountType = body.discountType;
      if (Number.isFinite(Number(body.discountValue)) && body.discountValue !== undefined) {
        patch.discountValue = Number(body.discountValue);
      }
      if (Number.isFinite(Number(body.minOrderPaise)) && body.minOrderPaise !== undefined) {
        patch.minOrderPaise = Number(body.minOrderPaise);
      }
      if (body.maxDiscountPaise !== undefined) {
        patch.maxDiscountPaise = Number.isFinite(Number(body.maxDiscountPaise))
          ? Number(body.maxDiscountPaise)
          : undefined;
      }
      if (typeof body.vertical === 'string') patch.vertical = body.vertical.slice(0, 60);
      if (typeof body.villageId === 'string') patch.villageId = body.villageId.slice(0, 80);
      if (ALLOWED_FUNDED_BY.has(body.fundedBy)) patch.fundedBy = body.fundedBy;
      if (typeof body.validFrom === 'string') patch.validFrom = body.validFrom.slice(0, 30);
      if (typeof body.validUntil === 'string') patch.validUntil = body.validUntil.slice(0, 30);
      if (Number.isFinite(Number(body.usageLimit)) && body.usageLimit !== undefined) {
        patch.usageLimit = Number(body.usageLimit);
      }
      if (typeof body.isActive === 'boolean') patch.isActive = body.isActive;

      const updated = await updateAdminOffer(id, patch);
      if (!updated) return res.status(404).json({ error: 'Offer not found.' });
      res.json({ offer: updated });
    } catch (error) {
      if (isPgUniqueViolation(error)) {
        return res.status(409).json({ error: 'Coupon code already in use.' });
      }
      console.error('Route Error PATCH /api/admin/offers/:id:', error);
      res.status(500).json({ error: 'Unable to update offer.' });
    }
  });

  app.patch('/api/admin/offers/:id/toggle', requireAdmin, async (req: AuthRequest, res: Response) => {
    try {
      const id = String(req.params.id || '').trim();
      const updated = await toggleAdminOfferStatus(id);
      if (!updated) return res.status(404).json({ error: 'Offer not found.' });
      res.json({ offer: updated });
    } catch (error) {
      console.error('Route Error PATCH /api/admin/offers/:id/toggle:', error);
      res.status(500).json({ error: 'Unable to toggle offer status.' });
    }
  });

  app.delete('/api/admin/offers/:id', requireAdmin, async (req: AuthRequest, res: Response) => {
    try {
      const id = String(req.params.id || '').trim();
      const deleted = await deleteAdminOffer(id);
      if (!deleted) return res.status(404).json({ error: 'Offer not found.' });
      res.json({ deleted: true, id });
    } catch (error) {
      console.error('Route Error DELETE /api/admin/offers/:id:', error);
      res.status(500).json({ error: 'Unable to delete offer.' });
    }
  });

  // =========================================================================
  // TAX / GST SLABS
  // =========================================================================
  app.get('/api/admin/tax-slabs', requireAdmin, async (_req: AuthRequest, res: Response) => {
    try {
      const taxSlabs = await listAdminTaxSlabs();
      res.json({ taxSlabs });
    } catch (error) {
      console.error('Route Error GET /api/admin/tax-slabs:', error);
      res.status(500).json({ error: 'Unable to load tax slabs.' });
    }
  });

  app.post('/api/admin/tax-slabs', requireAdmin, async (req: AuthRequest, res: Response) => {
    try {
      const body = req.body ?? {};
      const name = String(body.name || '').trim();
      if (!name) return res.status(400).json({ error: 'Tax slab name is required.' });
      const created = await createAdminTaxSlab({
        id: typeof body.id === 'string' ? body.id.trim().slice(0, 80) : undefined,
        name: name.slice(0, 160),
        vertical: String(body.vertical || 'ALL').trim().slice(0, 60),
        gstPercent: Number.isFinite(Number(body.gstPercent)) ? Number(body.gstPercent) : 0,
        hsnPrefix: String(body.hsnPrefix || '').trim().slice(0, 60),
        isInclusive: typeof body.isInclusive === 'boolean' ? body.isInclusive : true,
        description: String(body.description || '').trim().slice(0, 400),
        isActive: typeof body.isActive === 'boolean' ? body.isActive : true,
      });
      res.status(201).json({ taxSlab: created });
    } catch (error) {
      console.error('Route Error POST /api/admin/tax-slabs:', error);
      res.status(500).json({ error: 'Unable to create tax slab.' });
    }
  });

  app.patch('/api/admin/tax-slabs/:id', requireAdmin, async (req: AuthRequest, res: Response) => {
    try {
      const id = String(req.params.id || '').trim();
      const body = req.body ?? {};
      const patch: Record<string, unknown> = {};
      if (typeof body.name === 'string') patch.name = body.name.slice(0, 160);
      if (typeof body.vertical === 'string') patch.vertical = body.vertical.slice(0, 60);
      if (Number.isFinite(Number(body.gstPercent)) && body.gstPercent !== undefined) {
        patch.gstPercent = Number(body.gstPercent);
      }
      if (typeof body.hsnPrefix === 'string') patch.hsnPrefix = body.hsnPrefix.slice(0, 60);
      if (typeof body.isInclusive === 'boolean') patch.isInclusive = body.isInclusive;
      if (typeof body.description === 'string') patch.description = body.description.slice(0, 400);
      if (typeof body.isActive === 'boolean') patch.isActive = body.isActive;

      const updated = await updateAdminTaxSlab(id, patch);
      if (!updated) return res.status(404).json({ error: 'Tax slab not found.' });
      res.json({ taxSlab: updated });
    } catch (error) {
      console.error('Route Error PATCH /api/admin/tax-slabs/:id:', error);
      res.status(500).json({ error: 'Unable to update tax slab.' });
    }
  });

  app.patch('/api/admin/tax-slabs/:id/toggle', requireAdmin, async (req: AuthRequest, res: Response) => {
    try {
      const id = String(req.params.id || '').trim();
      const updated = await toggleAdminTaxSlabStatus(id);
      if (!updated) return res.status(404).json({ error: 'Tax slab not found.' });
      res.json({ taxSlab: updated });
    } catch (error) {
      console.error('Route Error PATCH /api/admin/tax-slabs/:id/toggle:', error);
      res.status(500).json({ error: 'Unable to toggle tax slab.' });
    }
  });

  app.delete('/api/admin/tax-slabs/:id', requireAdmin, async (req: AuthRequest, res: Response) => {
    try {
      const id = String(req.params.id || '').trim();
      const deleted = await deleteAdminTaxSlab(id);
      if (!deleted) return res.status(404).json({ error: 'Tax slab not found.' });
      res.json({ deleted: true, id });
    } catch (error) {
      console.error('Route Error DELETE /api/admin/tax-slabs/:id:', error);
      res.status(500).json({ error: 'Unable to delete tax slab.' });
    }
  });

  // =========================================================================
  // CANCELLATION POLICY RULES
  // =========================================================================
  app.get('/api/admin/cancellation-rules', requireAdmin, async (_req: AuthRequest, res: Response) => {
    try {
      const cancellationRules = await listAdminCancellationRules();
      res.json({ cancellationRules });
    } catch (error) {
      console.error('Route Error GET /api/admin/cancellation-rules:', error);
      res.status(500).json({ error: 'Unable to load cancellation rules.' });
    }
  });

  app.post('/api/admin/cancellation-rules', requireAdmin, async (req: AuthRequest, res: Response) => {
    try {
      const body = req.body ?? {};
      const actor = String(body.actor || 'CUSTOMER').trim() as CancellationPolicyRuleRecord['actor'];
      const code = String(body.code || '').trim().toUpperCase();
      const label = String(body.label || '').trim();
      if (!ALLOWED_CANCEL_ACTORS.has(actor) || !code || !label) {
        return res.status(400).json({ error: 'Valid actor, rule code, and label are required.' });
      }
      const created = await createAdminCancellationRule({
        id: typeof body.id === 'string' ? body.id.trim().slice(0, 80) : undefined,
        actor,
        code: code.slice(0, 60),
        label: label.slice(0, 240),
        freeCancelWindowMins: Number.isFinite(Number(body.freeCancelWindowMins))
          ? Number(body.freeCancelWindowMins)
          : 0,
        penaltyPercent: Number.isFinite(Number(body.penaltyPercent))
          ? Number(body.penaltyPercent)
          : 0,
        autoRefundEligible: Boolean(body.autoRefundEligible),
        isActive: typeof body.isActive === 'boolean' ? body.isActive : true,
      });
      res.status(201).json({ cancellationRule: created });
    } catch (error) {
      if (isPgUniqueViolation(error)) {
        return res.status(409).json({ error: 'A cancellation rule with this code already exists.' });
      }
      console.error('Route Error POST /api/admin/cancellation-rules:', error);
      res.status(500).json({ error: 'Unable to create cancellation rule.' });
    }
  });

  app.patch(
    '/api/admin/cancellation-rules/:id',
    requireAdmin,
    async (req: AuthRequest, res: Response) => {
      try {
        const id = String(req.params.id || '').trim();
        const body = req.body ?? {};
        const patch: Record<string, unknown> = {};
        if (ALLOWED_CANCEL_ACTORS.has(body.actor)) patch.actor = body.actor;
        if (typeof body.code === 'string') patch.code = body.code.trim().toUpperCase().slice(0, 60);
        if (typeof body.label === 'string') patch.label = body.label.slice(0, 240);
        if (
          Number.isFinite(Number(body.freeCancelWindowMins)) &&
          body.freeCancelWindowMins !== undefined
        ) {
          patch.freeCancelWindowMins = Number(body.freeCancelWindowMins);
        }
        if (Number.isFinite(Number(body.penaltyPercent)) && body.penaltyPercent !== undefined) {
          patch.penaltyPercent = Number(body.penaltyPercent);
        }
        if (typeof body.autoRefundEligible === 'boolean') {
          patch.autoRefundEligible = body.autoRefundEligible;
        }
        if (typeof body.isActive === 'boolean') patch.isActive = body.isActive;

        const updated = await updateAdminCancellationRule(id, patch);
        if (!updated) return res.status(404).json({ error: 'Cancellation rule not found.' });
        res.json({ cancellationRule: updated });
      } catch (error) {
        if (isPgUniqueViolation(error)) {
          return res.status(409).json({ error: 'Rule code already exists.' });
        }
        console.error('Route Error PATCH /api/admin/cancellation-rules/:id:', error);
        res.status(500).json({ error: 'Unable to update cancellation rule.' });
      }
    }
  );

  app.patch(
    '/api/admin/cancellation-rules/:id/toggle',
    requireAdmin,
    async (req: AuthRequest, res: Response) => {
      try {
        const id = String(req.params.id || '').trim();
        const updated = await toggleAdminCancellationRuleStatus(id);
        if (!updated) return res.status(404).json({ error: 'Cancellation rule not found.' });
        res.json({ cancellationRule: updated });
      } catch (error) {
        console.error('Route Error PATCH /api/admin/cancellation-rules/:id/toggle:', error);
        res.status(500).json({ error: 'Unable to toggle cancellation rule.' });
      }
    }
  );

  app.delete(
    '/api/admin/cancellation-rules/:id',
    requireAdmin,
    async (req: AuthRequest, res: Response) => {
      try {
        const id = String(req.params.id || '').trim();
        const deleted = await deleteAdminCancellationRule(id);
        if (!deleted) return res.status(404).json({ error: 'Cancellation rule not found.' });
        res.json({ deleted: true, id });
      } catch (error) {
        console.error('Route Error DELETE /api/admin/cancellation-rules/:id:', error);
        res.status(500).json({ error: 'Unable to delete cancellation rule.' });
      }
    }
  );

  // =========================================================================
  // SELLER PAYOUTS, PAYMENT TRANSACTIONS & REFUND LEDGER
  // =========================================================================
  app.get('/api/admin/payouts', requireAdmin, async (_req: AuthRequest, res: Response) => {
    try {
      const payouts = await listAdminPayouts();
      res.json({ payouts });
    } catch (error) {
      console.error('Route Error GET /api/admin/payouts:', error);
      res.status(500).json({ error: 'Unable to load seller payouts.' });
    }
  });

  app.patch(
    '/api/admin/payouts/:id/processing',
    requireAdmin,
    async (req: AuthRequest, res: Response) => {
      try {
        const id = String(req.params.id || '').trim();
        const updated = await markAdminPayoutProcessing({
          externalId: id,
          actorName: getActorName(req),
        });
        if (!updated) return res.status(404).json({ error: 'Payout batch not found.' });
        res.json({ payout: updated });
      } catch (error) {
        console.error('Route Error PATCH /api/admin/payouts/:id/processing:', error);
        res.status(500).json({ error: 'Unable to move payout to processing.' });
      }
    }
  );

  app.post(
    '/api/admin/payouts/:id/settle',
    requireAdmin,
    async (req: AuthRequest, res: Response) => {
      try {
        const id = String(req.params.id || '').trim();
        const paymentMode = String(req.body?.paymentMode || '').trim() as SellerPayoutRecord['paymentMode'];
        const utrNumber = String(req.body?.utrNumber || '').trim();
        const notes = typeof req.body?.notes === 'string' ? req.body.notes.slice(0, 400) : undefined;
        if (!ALLOWED_PAYOUT_MODES.has(paymentMode) || !utrNumber || utrNumber.length > 80) {
          return res.status(400).json({ error: 'Valid payment mode and UTR/reference number are required.' });
        }
        const updated = await settleAdminPayout({
          externalId: id,
          paymentMode,
          utrNumber,
          notes,
          actorName: getActorName(req),
        });
        if (!updated) return res.status(404).json({ error: 'Payout batch not found.' });
        res.json({ payout: updated });
      } catch (error) {
        console.error('Route Error POST /api/admin/payouts/:id/settle:', error);
        res.status(500).json({ error: 'Unable to settle seller payout.' });
      }
    }
  );

  app.get(
    '/api/admin/payment-transactions',
    requireAdmin,
    async (_req: AuthRequest, res: Response) => {
      try {
        const paymentTransactions = await listAdminPaymentTransactions();
        res.json({ paymentTransactions });
      } catch (error) {
        console.error('Route Error GET /api/admin/payment-transactions:', error);
        res.status(500).json({ error: 'Unable to load payment transactions.' });
      }
    }
  );

  app.get('/api/admin/refunds', requireAdmin, async (_req: AuthRequest, res: Response) => {
    try {
      const refundLedger = await listAdminRefunds();
      res.json({ refundLedger });
    } catch (error) {
      console.error('Route Error GET /api/admin/refunds:', error);
      res.status(500).json({ error: 'Unable to load refund ledger.' });
    }
  });

  app.patch(
    '/api/admin/refunds/:id/status',
    requireAdmin,
    async (req: AuthRequest, res: Response) => {
      try {
        const id = String(req.params.id || '').trim();
        const status = String(req.body?.status || '').trim() as RefundLedgerRecord['status'];
        const reason = typeof req.body?.reason === 'string' ? req.body.reason.slice(0, 400) : undefined;
        if (!ALLOWED_REFUND_LEDGER_STATUSES.has(status)) {
          return res.status(400).json({ error: 'Invalid refund status.' });
        }
        const updated = await updateAdminRefundStatus({
          externalId: id,
          status,
          reason,
          actorName: getActorName(req),
        });
        if (!updated) return res.status(404).json({ error: 'Refund record not found.' });
        res.json({ refund: updated });
      } catch (error) {
        console.error('Route Error PATCH /api/admin/refunds/:id/status:', error);
        res.status(500).json({ error: 'Unable to update refund status.' });
      }
    }
  );

  // =========================================================================
  // ORDER LIFECYCLE ACTIONS (Cancel / Return / Refund -> PostgreSQL)
  // =========================================================================
  app.post(
    '/api/admin/orders/:orderNumber/cancel',
    requireAdmin,
    async (req: AuthRequest, res: Response) => {
      try {
        const orderNumber = String(req.params.orderNumber || '').trim();
        const cancelledBy = String(req.body?.cancelledBy || 'ADMIN').trim() as
          | 'CUSTOMER'
          | 'SELLER'
          | 'ADMIN';
        const reason = String(req.body?.reason || '').trim().slice(0, 300);
        const refundEligible = Boolean(req.body?.refundEligible);
        const notes = typeof req.body?.notes === 'string' ? req.body.notes.slice(0, 400) : undefined;

        if (!orderNumber || !ALLOWED_ORDER_CANCEL_ACTORS.has(cancelledBy) || !reason) {
          return res.status(400).json({ error: 'Order number, actor, and cancellation reason are required.' });
        }

        const updated = await adminCancelDbOrder({
          orderNumber,
          cancelledBy,
          reason,
          refundEligible,
          notes,
        });
        if (!updated) return res.status(404).json({ error: 'Order not found.' });
        res.json({ order: updated });
      } catch (error) {
        console.error('Route Error POST /api/admin/orders/:orderNumber/cancel:', error);
        res.status(500).json({ error: 'Unable to cancel order.' });
      }
    }
  );

  app.post(
    '/api/admin/orders/:orderNumber/return',
    requireAdmin,
    async (req: AuthRequest, res: Response) => {
      try {
        const orderNumber = String(req.params.orderNumber || '').trim();
        const status = String(req.body?.status || '').trim() as
          | 'REQUESTED'
          | 'APPROVED'
          | 'PICKED_UP'
          | 'RECEIVED'
          | 'REJECTED';
        const reason = String(req.body?.reason || '').trim().slice(0, 300);
        const rawItems = Array.isArray(req.body?.returnedItems) ? req.body.returnedItems : [];
        const notes = typeof req.body?.notes === 'string' ? req.body.notes.slice(0, 400) : undefined;

        if (!orderNumber || !ALLOWED_RETURN_STATUSES.has(status) || !reason) {
          return res.status(400).json({ error: 'Valid return status and reason are required.' });
        }

        const returnedItems = rawItems
          .filter((item: unknown): item is Record<string, unknown> => Boolean(item && typeof item === 'object'))
          .slice(0, 100)
          .map((item: Record<string, unknown>) => ({
            orderItemId: String(item.orderItemId || '').slice(0, 80),
            productName: String(item.productName || 'Item').slice(0, 160),
            variantLabel:
              typeof item.variantLabel === 'string' ? item.variantLabel.slice(0, 80) : undefined,
            quantity: Math.max(0.001, Number(item.quantity) || 1),
            unitLabel: String(item.unitLabel || 'unit').slice(0, 40),
            refundValuePaise: Math.max(0, Math.round(Number(item.refundValuePaise) || 0)),
            conditionNote:
              typeof item.conditionNote === 'string' ? item.conditionNote.slice(0, 200) : undefined,
          }));

        const updated = await recordDbOrderReturn({
          orderNumber,
          status,
          reason,
          returnedItems,
          notes,
        });
        if (!updated) return res.status(404).json({ error: 'Order not found.' });
        res.json({ order: updated });
      } catch (error) {
        console.error('Route Error POST /api/admin/orders/:orderNumber/return:', error);
        res.status(500).json({ error: 'Unable to record order return.' });
      }
    }
  );

  app.post(
    '/api/admin/orders/:orderNumber/refund',
    requireAdmin,
    async (req: AuthRequest, res: Response) => {
      try {
        const orderNumber = String(req.params.orderNumber || '').trim();
        const amountPaise = Math.round(Number(req.body?.amountPaise));
        const status = String(req.body?.status || '').trim() as
          | 'PENDING'
          | 'PROCESSING'
          | 'COMPLETED'
          | 'FAILED';
        const method = String(req.body?.method || '').trim() as
          | 'ORIGINAL_UPI'
          | 'BANK_TRANSFER'
          | 'UDHAR_REVERSAL'
          | 'CASH_SETTLEMENT'
          | 'STORE_CREDIT';
        const reason = String(req.body?.reason || '').trim().slice(0, 300);
        const referenceId =
          typeof req.body?.referenceId === 'string' ? req.body.referenceId.slice(0, 80) : undefined;
        const failureReason =
          typeof req.body?.failureReason === 'string'
            ? req.body.failureReason.slice(0, 300)
            : undefined;

        if (
          !orderNumber ||
          !Number.isFinite(amountPaise) ||
          amountPaise <= 0 ||
          !ALLOWED_ORDER_REFUND_STATUSES.has(status) ||
          !ALLOWED_ORDER_REFUND_METHODS.has(method) ||
          !reason
        ) {
          return res.status(400).json({ error: 'Valid refund amount, status, method, and reason are required.' });
        }

        const updated = await processDbOrderRefund({
          orderNumber,
          amountPaise,
          status,
          method,
          reason,
          referenceId,
          initiatedBy: getActorName(req),
          failureReason,
        });
        if (!updated) return res.status(404).json({ error: 'Order not found.' });
        res.json({ order: updated });
      } catch (error) {
        console.error('Route Error POST /api/admin/orders/:orderNumber/refund:', error);
        res.status(500).json({ error: 'Unable to process order refund.' });
      }
    }
  );
}
