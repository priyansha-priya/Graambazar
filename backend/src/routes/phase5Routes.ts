import type { Express, Request, Response } from 'express';
import {
  ALL_ADMIN_MODULES,
  ALLOWED_ADMIN_ROLES,
  AdminModuleKey,
  AdminRoleKey,
  PermissionActionKey,
  createAdminTeamUser,
  getAdminRbacBundle,
  updateAdminRolePermission,
  updateAdminTeamUser,
} from '../db/adminRbacQueries.ts';
import {
  RepaymentMethodKey,
  createUdhariDispute,
  enableSellerUdhari,
  getUdhariBundle,
  listSellerAvailabilityStatuses,
  postTransactionalCreditSale,
  recordTransactionalRepayment,
  resolveUdhariDispute,
  updateCustomerCreditStatus,
  updateSellerAvailabilityStatus,
  upsertCustomerCreditProfile,
  validateOfferCoupon,
} from '../db/udhariSellerQueries.ts';
import { AuthRequest, requireAdmin, requireAuth } from '../middleware/auth.ts';

const ALLOWED_MODULE_SET = new Set<string>(ALL_ADMIN_MODULES);
const ALLOWED_ACTION_SET = new Set<string>(['view', 'manage', 'approve', 'export']);
const ALLOWED_REPAYMENT_METHODS = new Set<string>([
  'CASH',
  'UPI_DIRECT',
  'BANK_TRANSFER',
  'OTHER_OFFLINE',
]);
const ALLOWED_DISPUTE_REASONS = new Set<string>([
  'WRONG_AMOUNT',
  'PAYMENT_NOT_RECORDED',
  'ORDER_CANCELLED',
  'OTHER',
]);

export function registerPhase5Routes(app: Express): void {
  // =========================================================================
  // Step 1: Server-Side Admin RBAC & Team Accounts (Protected by requireAdmin)
  // =========================================================================

  app.get('/api/admin/rbac/summary', requireAdmin, async (_req: AuthRequest, res: Response) => {
    try {
      const bundle = await getAdminRbacBundle();
      res.json(bundle);
    } catch (error) {
      console.error('Route Error GET /api/admin/rbac/summary:', error);
      res.status(500).json({ error: 'Unable to load admin RBAC configuration.' });
    }
  });

  app.post('/api/admin/rbac/users', requireAdmin, async (req: AuthRequest, res: Response) => {
    try {
      const body = req.body ?? {};
      const name = String(body.name || '').trim();
      const email = String(body.email || '').trim().toLowerCase();
      const phone = String(body.phone || '').trim();
      const role = String(body.role || 'ADMIN_OPS').trim() as AdminRoleKey;

      if (!name || !email || !email.includes('@') || !phone) {
        return res.status(400).json({ error: 'Valid name, email, and phone are required.' });
      }
      if (!ALLOWED_ADMIN_ROLES.includes(role)) {
        return res.status(400).json({ error: 'Invalid admin role.' });
      }

      const assignedVillages = Array.isArray(body.assignedVillages)
        ? body.assignedVillages.map((v: unknown) => String(v).trim()).filter(Boolean)
        : ['ALL'];

      const adminUser = await createAdminTeamUser({
        id: typeof body.id === 'string' ? body.id : undefined,
        name: name.slice(0, 120),
        email: email.slice(0, 160),
        phone: phone.slice(0, 40),
        role,
        status: body.status === 'SUSPENDED' ? 'SUSPENDED' : 'ACTIVE',
        assignedVillages,
      });

      res.status(201).json({ adminUser });
    } catch (error: unknown) {
      const pgCode = (error as { code?: string })?.code;
      if (pgCode === '23505') {
        return res.status(409).json({ error: 'An admin account with this email already exists.' });
      }
      console.error('Route Error POST /api/admin/rbac/users:', error);
      res.status(500).json({ error: 'Unable to create admin team account.' });
    }
  });

  app.patch('/api/admin/rbac/users/:id', requireAdmin, async (req: AuthRequest, res: Response) => {
    try {
      const externalId = String(req.params.id || '').trim();
      if (!externalId) {
        return res.status(400).json({ error: 'Admin user ID is required.' });
      }

      const body = req.body ?? {};
      if (body.role !== undefined && !ALLOWED_ADMIN_ROLES.includes(body.role)) {
        return res.status(400).json({ error: 'Invalid admin role.' });
      }
      if (body.status !== undefined && body.status !== 'ACTIVE' && body.status !== 'SUSPENDED') {
        return res.status(400).json({ error: 'Invalid admin status.' });
      }

      const updated = await updateAdminTeamUser(externalId, {
        name: typeof body.name === 'string' ? body.name.slice(0, 120) : undefined,
        email: typeof body.email === 'string' ? body.email.slice(0, 160) : undefined,
        phone: typeof body.phone === 'string' ? body.phone.slice(0, 40) : undefined,
        role: body.role,
        status: body.status,
        assignedVillages: Array.isArray(body.assignedVillages)
          ? body.assignedVillages.map((v: unknown) => String(v).trim()).filter(Boolean)
          : undefined,
        lastActiveAt:
          typeof body.lastActiveAt === 'string' ? body.lastActiveAt.slice(0, 64) : undefined,
      });

      if (!updated) {
        return res.status(404).json({ error: 'Admin team user not found.' });
      }

      res.json({ adminUser: updated });
    } catch (error) {
      console.error('Route Error PATCH /api/admin/rbac/users/:id:', error);
      res.status(500).json({ error: 'Unable to update admin team user.' });
    }
  });

  app.patch(
    '/api/admin/rbac/permissions',
    requireAdmin,
    async (req: AuthRequest, res: Response) => {
      try {
        const body = req.body ?? {};
        const role = String(body.role || '').trim() as AdminRoleKey;
        const moduleKey = String(body.module || '').trim() as AdminModuleKey;
        const actionKey = String(body.key || '').trim() as PermissionActionKey;

        if (!ALLOWED_ADMIN_ROLES.includes(role)) {
          return res.status(400).json({ error: 'Invalid admin role.' });
        }
        if (role === 'SUPER_ADMIN') {
          return res.status(400).json({ error: 'Super Admin permissions cannot be downgraded.' });
        }
        if (!ALLOWED_MODULE_SET.has(moduleKey)) {
          return res.status(400).json({ error: 'Invalid admin module key.' });
        }
        if (!ALLOWED_ACTION_SET.has(actionKey) || typeof body.value !== 'boolean') {
          return res.status(400).json({ error: 'Invalid permission action or value.' });
        }

        const rolePermissions = await updateAdminRolePermission({
          role,
          module: moduleKey,
          key: actionKey,
          value: body.value,
        });

        res.json({ rolePermissions });
      } catch (error) {
        console.error('Route Error PATCH /api/admin/rbac/permissions:', error);
        res.status(500).json({ error: 'Unable to update role permissions.' });
      }
    }
  );

  // =========================================================================
  // Step 2: Full Udhari Khata Persistence & Transactional Ledger (requireAuth)
  // =========================================================================

  app.get('/api/udhari/summary', requireAuth, async (_req: AuthRequest, res: Response) => {
    try {
      const bundle = await getUdhariBundle();
      res.json(bundle);
    } catch (error) {
      console.error('Route Error GET /api/udhari/summary:', error);
      res.status(500).json({ error: 'Unable to load Udhari Khata data.' });
    }
  });

  app.patch(
    '/api/udhari/sellers/:sellerCode/enable',
    requireAuth,
    async (req: AuthRequest, res: Response) => {
      try {
        const sellerCode = String(req.params.sellerCode || '').trim();
        if (!sellerCode) {
          return res.status(400).json({ error: 'Seller code is required.' });
        }
        const setting = await enableSellerUdhari(sellerCode);
        res.json({ setting });
      } catch (error) {
        console.error('Route Error PATCH /api/udhari/sellers/:sellerCode/enable:', error);
        res.status(500).json({ error: 'Unable to enable Udhari for seller.' });
      }
    }
  );

  app.put('/api/udhari/profiles', requireAuth, async (req: AuthRequest, res: Response) => {
    try {
      const body = req.body ?? {};
      const sellerCode = String(body.sellerId || body.sellerCode || '').trim();
      const customerId = String(body.customerId || '').trim();
      const limitPaise = Number(body.limitPaise);

      if (
        !sellerCode ||
        !customerId ||
        !Number.isFinite(limitPaise) ||
        limitPaise < 0
      ) {
        return res.status(400).json({ error: 'Invalid customer credit limit payload.' });
      }

      const profile = await upsertCustomerCreditProfile({
        sellerCode,
        customerId,
        limitPaise: Math.round(limitPaise),
        internalNote:
          typeof body.internalNote === 'string' ? body.internalNote.slice(0, 300) : undefined,
        customerName:
          typeof body.customerName === 'string' ? body.customerName.slice(0, 120) : undefined,
        customerPhone:
          typeof body.customerPhone === 'string' ? body.customerPhone.slice(0, 30) : undefined,
        villageName:
          typeof body.villageName === 'string' ? body.villageName.slice(0, 80) : undefined,
      });

      if (!profile) {
        return res.status(404).json({ error: 'Seller not found.' });
      }

      res.json({ profile });
    } catch (error) {
      console.error('Route Error PUT /api/udhari/profiles:', error);
      res.status(500).json({ error: 'Unable to update customer credit limit.' });
    }
  });

  app.patch(
    '/api/udhari/profiles/status',
    requireAuth,
    async (req: AuthRequest, res: Response) => {
      try {
        const body = req.body ?? {};
        const sellerCode = String(body.sellerId || body.sellerCode || '').trim();
        const customerId = String(body.customerId || '').trim();
        const status = String(body.status || '').trim();

        if (
          !sellerCode ||
          !customerId ||
          (status !== 'ACTIVE' && status !== 'DISABLED' && status !== 'BLOCKED')
        ) {
          return res.status(400).json({ error: 'Invalid credit status payload.' });
        }

        const profile = await updateCustomerCreditStatus({
          sellerCode,
          customerId,
          status,
        });

        if (!profile) {
          return res.status(404).json({ error: 'Customer credit profile not found.' });
        }

        res.json({ profile });
      } catch (error) {
        console.error('Route Error PATCH /api/udhari/profiles/status:', error);
        res.status(500).json({ error: 'Unable to update customer credit status.' });
      }
    }
  );

  app.post('/api/udhari/credit-sales', requireAuth, async (req: AuthRequest, res: Response) => {
    try {
      const body = req.body ?? {};
      const sellerCode = String(body.sellerId || body.sellerCode || '').trim();
      const customerId = String(body.customerId || '').trim();
      const orderId = String(body.orderId || '').trim();
      const amountPaise = Number(body.amountPaise);
      const dueDays = body.dueDays !== undefined ? Number(body.dueDays) : undefined;

      if (
        !sellerCode ||
        !customerId ||
        !orderId ||
        !Number.isFinite(amountPaise) ||
        amountPaise <= 0
      ) {
        return res.status(400).json({ error: 'Invalid credit sale payload.' });
      }

      const result = await postTransactionalCreditSale({
        sellerCode,
        customerId,
        orderId: orderId.slice(0, 64),
        amountPaise: Math.round(amountPaise),
        dueDays: dueDays && Number.isFinite(dueDays) ? Math.round(dueDays) : undefined,
        recordedBy:
          typeof body.recordedBy === 'string' && body.recordedBy.trim()
            ? body.recordedBy.slice(0, 120)
            : req.user?.email || req.user?.uid || 'Order Checkout Engine',
      });

      if (!result.success) {
        return res.status(result.statusCode).json({ error: result.message });
      }

      res.status(201).json(result);
    } catch (error) {
      console.error('Route Error POST /api/udhari/credit-sales:', error);
      res.status(500).json({ error: 'Unable to post credit sale.' });
    }
  });

  app.post('/api/udhari/repayments', requireAuth, async (req: AuthRequest, res: Response) => {
    try {
      const body = req.body ?? {};
      const sellerCode = String(body.sellerId || body.sellerCode || '').trim();
      const customerId = String(body.customerId || '').trim();
      const amountPaise = Number(body.amountPaise);
      const method = String(body.method || 'CASH').trim() as RepaymentMethodKey;

      if (
        !sellerCode ||
        !customerId ||
        !Number.isFinite(amountPaise) ||
        amountPaise <= 0 ||
        !ALLOWED_REPAYMENT_METHODS.has(method)
      ) {
        return res.status(400).json({ error: 'Invalid repayment payload.' });
      }

      const result = await recordTransactionalRepayment({
        sellerCode,
        customerId,
        amountPaise: Math.round(amountPaise),
        method,
        referenceNumber:
          typeof body.referenceNumber === 'string'
            ? body.referenceNumber.slice(0, 80)
            : undefined,
        note: typeof body.note === 'string' ? body.note.slice(0, 240) : undefined,
        recordedBy:
          typeof body.recordedBy === 'string' && body.recordedBy.trim()
            ? body.recordedBy.slice(0, 120)
            : req.user?.email || req.user?.uid || 'Seller',
      });

      if (!result.success) {
        return res.status(result.statusCode).json({ error: result.message });
      }

      res.status(201).json(result);
    } catch (error) {
      console.error('Route Error POST /api/udhari/repayments:', error);
      res.status(500).json({ error: 'Unable to record repayment.' });
    }
  });

  app.post('/api/udhari/disputes', requireAuth, async (req: AuthRequest, res: Response) => {
    try {
      const body = req.body ?? {};
      const sellerCode = String(body.sellerId || body.sellerCode || '').trim();
      const customerId = String(body.customerId || '').trim();
      const ledgerEntryId = String(body.ledgerEntryId || '').trim();
      const reasonCode = String(body.reasonCode || '').trim();
      const description = String(body.description || '').trim();

      if (
        !sellerCode ||
        !customerId ||
        !ledgerEntryId ||
        !ALLOWED_DISPUTE_REASONS.has(reasonCode) ||
        !description
      ) {
        return res.status(400).json({ error: 'Invalid Udhari dispute payload.' });
      }

      const dispute = await createUdhariDispute({
        id: typeof body.id === 'string' ? body.id : undefined,
        sellerCode,
        customerId,
        ledgerEntryId,
        reasonCode: reasonCode as
          | 'WRONG_AMOUNT'
          | 'PAYMENT_NOT_RECORDED'
          | 'ORDER_CANCELLED'
          | 'OTHER',
        description: description.slice(0, 500),
      });

      res.status(201).json({ dispute });
    } catch (error) {
      console.error('Route Error POST /api/udhari/disputes:', error);
      res.status(500).json({ error: 'Unable to submit Udhari dispute.' });
    }
  });

  app.patch(
    '/api/udhari/disputes/:id/resolve',
    requireAuth,
    async (req: AuthRequest, res: Response) => {
      try {
        const disputeId = String(req.params.id || '').trim();
        const resolutionNote = String(req.body?.resolutionNote || '').trim();
        if (!disputeId || !resolutionNote) {
          return res.status(400).json({ error: 'Dispute ID and resolution note are required.' });
        }

        const dispute = await resolveUdhariDispute({
          disputeId,
          resolutionNote: resolutionNote.slice(0, 500),
        });

        if (!dispute) {
          return res.status(404).json({ error: 'Udhari dispute not found.' });
        }

        res.json({ dispute });
      } catch (error) {
        console.error('Route Error PATCH /api/udhari/disputes/:id/resolve:', error);
        res.status(500).json({ error: 'Unable to resolve Udhari dispute.' });
      }
    }
  );

  // =========================================================================
  // Step 3: Seller Availability Status (Public read, Authenticated write)
  // =========================================================================

  app.get('/api/catalog/seller-statuses', async (_req: Request, res: Response) => {
    try {
      const statuses = await listSellerAvailabilityStatuses();
      res.json({ statuses });
    } catch (error) {
      console.error('Route Error GET /api/catalog/seller-statuses:', error);
      res.status(500).json({ error: 'Unable to load seller availability statuses.' });
    }
  });

  app.patch(
    '/api/seller/:sellerCode/status',
    requireAuth,
    async (req: AuthRequest, res: Response) => {
      try {
        const sellerCode = String(req.params.sellerCode || '').trim();
        const isPaused = req.body?.isPaused;
        if (!sellerCode || typeof isPaused !== 'boolean') {
          return res
            .status(400)
            .json({ error: 'Seller code and boolean isPaused flag are required.' });
        }

        const status = await updateSellerAvailabilityStatus({
          sellerCode,
          isPaused,
        });

        if (!status) {
          return res.status(404).json({ error: 'Seller not found.' });
        }

        res.json({ status });
      } catch (error) {
        console.error('Route Error PATCH /api/seller/:sellerCode/status:', error);
        res.status(500).json({ error: 'Unable to update seller open/paused status.' });
      }
    }
  );

  // =========================================================================
  // Step 4: Reusable Server-Side Coupon Validation Endpoint (Public read-only)
  // =========================================================================

  app.post('/api/offers/validate', async (req: Request, res: Response) => {
    try {
      const body = req.body ?? {};
      const code = String(body.code || '').trim();
      const orderSubtotalPaise = Number(body.orderSubtotalPaise);

      if (!code) {
        return res.status(400).json({
          valid: false,
          reason: 'Coupon code is required.',
          discountPaise: 0,
          freeDelivery: false,
        });
      }
      if (!Number.isFinite(orderSubtotalPaise) || orderSubtotalPaise < 0) {
        return res.status(400).json({
          valid: false,
          reason: 'Order subtotal must be a non-negative number in paise.',
          discountPaise: 0,
          freeDelivery: false,
        });
      }

      const result = await validateOfferCoupon({
        code,
        orderSubtotalPaise,
        vertical: typeof body.vertical === 'string' ? body.vertical : undefined,
        villageId: typeof body.villageId === 'string' ? body.villageId : undefined,
      });

      res.json(result);
    } catch (error) {
      console.error('Route Error POST /api/offers/validate:', error);
      res.status(500).json({ error: 'Unable to validate coupon right now.' });
    }
  });
}
