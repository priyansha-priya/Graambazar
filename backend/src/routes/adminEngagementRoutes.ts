import type { Express, Request, Response } from 'express';
import {
  createAdminBroadcast,
  createAdminCmsBanner,
  deleteAdminBroadcast,
  deleteAdminCmsBanner,
  deleteAdminReview,
  getAdminEngagementBundle,
  getAdminPlatformSettings,
  getPublicStorefrontContentBundle,
  listAdminBroadcasts,
  listAdminCmsBanners,
  listAdminCmsPolicies,
  listAdminCustomers,
  listAdminFeaturedSellerIds,
  listAdminReviews,
  listAdminSupportCases,
  moderateAdminReview,
  toggleAdminCmsBannerStatus,
  toggleAdminCustomerBlock,
  toggleAdminFeaturedSeller,
  updateAdminCmsBanner,
  updateAdminCmsPolicy,
  updateAdminCustomerNotes,
  updateAdminPlatformSettings,
  updateAdminSupportCaseStatus,
} from '../db/adminEngagementQueries.ts';
import { AuthRequest, requireAdmin } from '../middleware/auth.ts';
import type {
  BroadcastMessageRecord,
  CmsBannerRecord,
  CustomerReviewRecord,
  SupportCaseRecord,
} from '../types/admin.ts';

const ALLOWED_SUPPORT_STATUSES = new Set<SupportCaseRecord['status']>([
  'OPEN',
  'INVESTIGATING',
  'REFUND_APPROVED',
  'RESOLVED',
  'CLOSED',
]);

const ALLOWED_BANNER_PLACEMENTS = new Set<CmsBannerRecord['placement']>([
  'HERO_CAROUSEL',
  'MID_PROMO',
  'FESTIVAL_STRIP',
]);

const ALLOWED_REVIEW_STATUSES = new Set<CustomerReviewRecord['status']>([
  'PUBLISHED',
  'FLAGGED',
  'HIDDEN',
]);

const ALLOWED_BROADCAST_CHANNELS = new Set<BroadcastMessageRecord['channel']>([
  'APP_PUSH',
  'WHATSAPP',
  'SMS',
  'ALL',
]);

const ALLOWED_BROADCAST_AUDIENCES = new Set<BroadcastMessageRecord['audience']>([
  'ALL_CUSTOMERS',
  'ALL_SELLERS',
  'VILLAGE_CUSTOMERS',
  'VILLAGE_SELLERS',
]);

const ALLOWED_BROADCAST_PRIORITIES = new Set<BroadcastMessageRecord['priority']>([
  'NORMAL',
  'FESTIVE',
  'URGENT_ALERT',
]);

const ALLOWED_BROADCAST_STATUSES = new Set<BroadcastMessageRecord['status']>([
  'SENT',
  'SCHEDULED',
  'DRAFT',
]);

function getActorName(req: AuthRequest): string {
  return req.dbUser?.displayName || req.user?.name || req.user?.email || 'Admin';
}

export function registerAdminEngagementRoutes(app: Express): void {
  // =========================================================================
  // PUBLIC STOREFRONT CONTENT (Banners, Featured Stores, Policies, Settings, Published Reviews)
  // =========================================================================
  app.get('/api/catalog/storefront-content', async (_req: Request, res: Response) => {
    try {
      const bundle = await getPublicStorefrontContentBundle();
      res.json(bundle);
    } catch (error) {
      console.error('Route Error GET /api/catalog/storefront-content:', error);
      res.status(500).json({ error: 'Unable to load storefront content.' });
    }
  });

  // =========================================================================
  // ADMIN ENGAGEMENT & CMS BUNDLE (Single Round-Trip Hydration)
  // =========================================================================
  app.get('/api/admin/engagement/summary', requireAdmin, async (_req: AuthRequest, res: Response) => {
    try {
      const bundle = await getAdminEngagementBundle();
      res.json(bundle);
    } catch (error) {
      console.error('Route Error GET /api/admin/engagement/summary:', error);
      res.status(500).json({ error: 'Unable to load admin engagement data.' });
    }
  });

  // =========================================================================
  // SUPPORT CASES & DISPUTES
  // =========================================================================
  app.get('/api/admin/support-cases', requireAdmin, async (_req: AuthRequest, res: Response) => {
    try {
      const supportCases = await listAdminSupportCases();
      res.json({ supportCases });
    } catch (error) {
      console.error('Route Error GET /api/admin/support-cases:', error);
      res.status(500).json({ error: 'Unable to load support cases.' });
    }
  });

  app.patch('/api/admin/support-cases/:id', requireAdmin, async (req: AuthRequest, res: Response) => {
    try {
      const id = String(req.params.id || '').trim();
      const status = String(req.body?.status || '').trim() as SupportCaseRecord['status'];
      const resolutionNotes = String(req.body?.resolutionNotes || '').trim().slice(0, 600);
      const rawRefund = req.body?.approvedRefundPaise;
      const approvedRefundPaise =
        rawRefund !== undefined && rawRefund !== null && Number.isFinite(Number(rawRefund))
          ? Math.max(0, Math.round(Number(rawRefund)))
          : undefined;

      if (!id || !ALLOWED_SUPPORT_STATUSES.has(status)) {
        return res.status(400).json({ error: 'Valid support case status is required.' });
      }

      const updated = await updateAdminSupportCaseStatus({
        externalId: id,
        status,
        resolutionNotes,
        approvedRefundPaise,
      });
      if (!updated) return res.status(404).json({ error: 'Support case not found.' });
      res.json({ supportCase: updated });
    } catch (error) {
      console.error('Route Error PATCH /api/admin/support-cases/:id:', error);
      res.status(500).json({ error: 'Unable to update support case.' });
    }
  });

  // =========================================================================
  // CUSTOMER DIRECTORY & MODERATION
  // =========================================================================
  app.get('/api/admin/customers', requireAdmin, async (_req: AuthRequest, res: Response) => {
    try {
      const customers = await listAdminCustomers();
      res.json({ customers });
    } catch (error) {
      console.error('Route Error GET /api/admin/customers:', error);
      res.status(500).json({ error: 'Unable to load customers.' });
    }
  });

  app.patch(
    '/api/admin/customers/:id/status',
    requireAdmin,
    async (req: AuthRequest, res: Response) => {
      try {
        const id = String(req.params.id || '').trim();
        if (typeof req.body?.block !== 'boolean') {
          return res.status(400).json({ error: 'Boolean block flag is required.' });
        }
        const reason =
          typeof req.body?.reason === 'string' ? req.body.reason.trim().slice(0, 400) : undefined;
        const updated = await toggleAdminCustomerBlock({
          externalId: id,
          block: req.body.block,
          reason,
        });
        if (!updated) return res.status(404).json({ error: 'Customer not found.' });
        res.json({ customer: updated });
      } catch (error) {
        console.error('Route Error PATCH /api/admin/customers/:id/status:', error);
        res.status(500).json({ error: 'Unable to update customer status.' });
      }
    }
  );

  app.patch(
    '/api/admin/customers/:id/notes',
    requireAdmin,
    async (req: AuthRequest, res: Response) => {
      try {
        const id = String(req.params.id || '').trim();
        const notes = String(req.body?.notes ?? '').trim().slice(0, 600);
        const updated = await updateAdminCustomerNotes({ externalId: id, notes });
        if (!updated) return res.status(404).json({ error: 'Customer not found.' });
        res.json({ customer: updated });
      } catch (error) {
        console.error('Route Error PATCH /api/admin/customers/:id/notes:', error);
        res.status(500).json({ error: 'Unable to update customer notes.' });
      }
    }
  );

  // =========================================================================
  // GLOBAL PLATFORM SETTINGS
  // =========================================================================
  app.get('/api/admin/platform-settings', requireAdmin, async (_req: AuthRequest, res: Response) => {
    try {
      const platformSettings = await getAdminPlatformSettings();
      res.json({ platformSettings });
    } catch (error) {
      console.error('Route Error GET /api/admin/platform-settings:', error);
      res.status(500).json({ error: 'Unable to load platform settings.' });
    }
  });

  app.patch('/api/admin/platform-settings', requireAdmin, async (req: AuthRequest, res: Response) => {
    try {
      const body = req.body ?? {};
      const patch: Record<string, unknown> = {};
      if (typeof body.platformName === 'string') patch.platformName = body.platformName.slice(0, 120);
      if (typeof body.tagline === 'string') patch.tagline = body.tagline.slice(0, 200);
      if (typeof body.supportPhone === 'string') patch.supportPhone = body.supportPhone.slice(0, 40);
      if (typeof body.whatsappSupport === 'string') {
        patch.whatsappSupport = body.whatsappSupport.slice(0, 40);
      }
      if (typeof body.defaultDeliveryEnabled === 'boolean') {
        patch.defaultDeliveryEnabled = body.defaultDeliveryEnabled;
      }
      if (typeof body.defaultPickupEnabled === 'boolean') {
        patch.defaultPickupEnabled = body.defaultPickupEnabled;
      }
      if (typeof body.allowMultiVerticalSellers === 'boolean') {
        patch.allowMultiVerticalSellers = body.allowMultiVerticalSellers;
      }
      if (body.autoCancelUnacceptedMins !== undefined && Number.isFinite(Number(body.autoCancelUnacceptedMins))) {
        patch.autoCancelUnacceptedMins = Number(body.autoCancelUnacceptedMins);
      }
      if (body.foodPrepSlaMins !== undefined && Number.isFinite(Number(body.foodPrepSlaMins))) {
        patch.foodPrepSlaMins = Number(body.foodPrepSlaMins);
      }
      if (typeof body.maintenanceMode === 'boolean') {
        patch.maintenanceMode = body.maintenanceMode;
      }
      if (typeof body.maintenanceMessage === 'string') {
        patch.maintenanceMessage = body.maintenanceMessage.slice(0, 500);
      }

      const platformSettings = await updateAdminPlatformSettings(patch);
      res.json({ platformSettings });
    } catch (error) {
      console.error('Route Error PATCH /api/admin/platform-settings:', error);
      res.status(500).json({ error: 'Unable to update platform settings.' });
    }
  });

  // =========================================================================
  // CMS BANNERS
  // =========================================================================
  app.get('/api/admin/cms/banners', requireAdmin, async (_req: AuthRequest, res: Response) => {
    try {
      const cmsBanners = await listAdminCmsBanners(false);
      res.json({ cmsBanners });
    } catch (error) {
      console.error('Route Error GET /api/admin/cms/banners:', error);
      res.status(500).json({ error: 'Unable to load CMS banners.' });
    }
  });

  app.post('/api/admin/cms/banners', requireAdmin, async (req: AuthRequest, res: Response) => {
    try {
      const body = req.body ?? {};
      const title = String(body.title || '').trim();
      const placement = String(body.placement || 'HERO_CAROUSEL').trim() as CmsBannerRecord['placement'];
      if (!title || !ALLOWED_BANNER_PLACEMENTS.has(placement)) {
        return res.status(400).json({ error: 'Valid banner title and placement are required.' });
      }
      const banner = await createAdminCmsBanner({
        id: typeof body.id === 'string' ? body.id.trim().slice(0, 80) : undefined,
        title: title.slice(0, 180),
        subtitle: String(body.subtitle || '').trim().slice(0, 320),
        placement,
        targetVertical: String(body.targetVertical || 'ALL').trim().slice(0, 60),
        targetVillage: String(body.targetVillage || 'ALL').trim().slice(0, 80),
        ctaLabel: String(body.ctaLabel || 'Explore').trim().slice(0, 60),
        accentColor: String(body.accentColor || '#218838').trim().slice(0, 30),
        validFrom: String(body.validFrom || new Date().toISOString().split('T')[0]).slice(0, 30),
        validUntil: String(body.validUntil || '2026-12-31').slice(0, 30),
        priority: Number.isFinite(Number(body.priority)) ? Number(body.priority) : 1,
        isActive: typeof body.isActive === 'boolean' ? body.isActive : true,
      });
      res.status(201).json({ banner });
    } catch (error) {
      console.error('Route Error POST /api/admin/cms/banners:', error);
      res.status(500).json({ error: 'Unable to create CMS banner.' });
    }
  });

  app.patch('/api/admin/cms/banners/:id', requireAdmin, async (req: AuthRequest, res: Response) => {
    try {
      const id = String(req.params.id || '').trim();
      const body = req.body ?? {};
      const patch: Record<string, unknown> = {};
      if (typeof body.title === 'string') patch.title = body.title.slice(0, 180);
      if (typeof body.subtitle === 'string') patch.subtitle = body.subtitle.slice(0, 320);
      if (ALLOWED_BANNER_PLACEMENTS.has(body.placement)) patch.placement = body.placement;
      if (typeof body.targetVertical === 'string') patch.targetVertical = body.targetVertical.slice(0, 60);
      if (typeof body.targetVillage === 'string') patch.targetVillage = body.targetVillage.slice(0, 80);
      if (typeof body.ctaLabel === 'string') patch.ctaLabel = body.ctaLabel.slice(0, 60);
      if (typeof body.accentColor === 'string') patch.accentColor = body.accentColor.slice(0, 30);
      if (typeof body.validFrom === 'string') patch.validFrom = body.validFrom.slice(0, 30);
      if (typeof body.validUntil === 'string') patch.validUntil = body.validUntil.slice(0, 30);
      if (body.priority !== undefined && Number.isFinite(Number(body.priority))) {
        patch.priority = Number(body.priority);
      }
      if (typeof body.isActive === 'boolean') patch.isActive = body.isActive;

      const banner = await updateAdminCmsBanner(id, patch);
      if (!banner) return res.status(404).json({ error: 'CMS banner not found.' });
      res.json({ banner });
    } catch (error) {
      console.error('Route Error PATCH /api/admin/cms/banners/:id:', error);
      res.status(500).json({ error: 'Unable to update CMS banner.' });
    }
  });

  app.patch(
    '/api/admin/cms/banners/:id/toggle',
    requireAdmin,
    async (req: AuthRequest, res: Response) => {
      try {
        const id = String(req.params.id || '').trim();
        const banner = await toggleAdminCmsBannerStatus(id);
        if (!banner) return res.status(404).json({ error: 'CMS banner not found.' });
        res.json({ banner });
      } catch (error) {
        console.error('Route Error PATCH /api/admin/cms/banners/:id/toggle:', error);
        res.status(500).json({ error: 'Unable to toggle CMS banner.' });
      }
    }
  );

  app.delete('/api/admin/cms/banners/:id', requireAdmin, async (req: AuthRequest, res: Response) => {
    try {
      const id = String(req.params.id || '').trim();
      const deleted = await deleteAdminCmsBanner(id);
      if (!deleted) return res.status(404).json({ error: 'CMS banner not found.' });
      res.json({ deleted: true, id });
    } catch (error) {
      console.error('Route Error DELETE /api/admin/cms/banners/:id:', error);
      res.status(500).json({ error: 'Unable to delete CMS banner.' });
    }
  });

  // =========================================================================
  // FEATURED SELLERS
  // =========================================================================
  app.get('/api/admin/cms/featured-sellers', requireAdmin, async (_req: AuthRequest, res: Response) => {
    try {
      const featuredSellerIds = await listAdminFeaturedSellerIds();
      res.json({ featuredSellerIds });
    } catch (error) {
      console.error('Route Error GET /api/admin/cms/featured-sellers:', error);
      res.status(500).json({ error: 'Unable to load featured sellers.' });
    }
  });

  app.post(
    '/api/admin/cms/featured-sellers/:sellerId/toggle',
    requireAdmin,
    async (req: AuthRequest, res: Response) => {
      try {
        const sellerId = String(req.params.sellerId || '').trim();
        if (!sellerId || sellerId.length > 80) {
          return res.status(400).json({ error: 'Valid seller ID is required.' });
        }
        const result = await toggleAdminFeaturedSeller(sellerId);
        res.json(result);
      } catch (error) {
        console.error('Route Error POST /api/admin/cms/featured-sellers/:sellerId/toggle:', error);
        res.status(500).json({ error: 'Unable to toggle featured seller.' });
      }
    }
  );

  // =========================================================================
  // CMS POLICY PAGES
  // =========================================================================
  app.get('/api/admin/cms/policies', requireAdmin, async (_req: AuthRequest, res: Response) => {
    try {
      const cmsPolicies = await listAdminCmsPolicies();
      res.json({ cmsPolicies });
    } catch (error) {
      console.error('Route Error GET /api/admin/cms/policies:', error);
      res.status(500).json({ error: 'Unable to load CMS policies.' });
    }
  });

  app.patch('/api/admin/cms/policies/:id', requireAdmin, async (req: AuthRequest, res: Response) => {
    try {
      const id = String(req.params.id || '').trim();
      const version = String(req.body?.version || '').trim().slice(0, 40);
      const summary = String(req.body?.summary || '').trim().slice(0, 400);
      const content = String(req.body?.content || '').trim().slice(0, 12000);
      if (!version || !content) {
        return res.status(400).json({ error: 'Policy version and content are required.' });
      }
      const policy = await updateAdminCmsPolicy({
        externalId: id,
        version,
        summary,
        content,
        updatedBy: getActorName(req),
      });
      if (!policy) return res.status(404).json({ error: 'Policy page not found.' });
      res.json({ policy });
    } catch (error) {
      console.error('Route Error PATCH /api/admin/cms/policies/:id:', error);
      res.status(500).json({ error: 'Unable to update policy page.' });
    }
  });

  // =========================================================================
  // CUSTOMER REVIEWS MODERATION
  // =========================================================================
  app.get('/api/admin/reviews', requireAdmin, async (_req: AuthRequest, res: Response) => {
    try {
      const reviews = await listAdminReviews(false);
      res.json({ reviews });
    } catch (error) {
      console.error('Route Error GET /api/admin/reviews:', error);
      res.status(500).json({ error: 'Unable to load reviews.' });
    }
  });

  app.patch(
    '/api/admin/reviews/:id/moderate',
    requireAdmin,
    async (req: AuthRequest, res: Response) => {
      try {
        const id = String(req.params.id || '').trim();
        const status = String(req.body?.status || '').trim() as CustomerReviewRecord['status'];
        const notes =
          typeof req.body?.notes === 'string' ? req.body.notes.trim().slice(0, 400) : undefined;
        if (!ALLOWED_REVIEW_STATUSES.has(status)) {
          return res.status(400).json({ error: 'Valid review moderation status is required.' });
        }
        const review = await moderateAdminReview({ externalId: id, status, notes });
        if (!review) return res.status(404).json({ error: 'Review not found.' });
        res.json({ review });
      } catch (error) {
        console.error('Route Error PATCH /api/admin/reviews/:id/moderate:', error);
        res.status(500).json({ error: 'Unable to moderate review.' });
      }
    }
  );

  app.delete('/api/admin/reviews/:id', requireAdmin, async (req: AuthRequest, res: Response) => {
    try {
      const id = String(req.params.id || '').trim();
      const deleted = await deleteAdminReview(id);
      if (!deleted) return res.status(404).json({ error: 'Review not found.' });
      res.json({ deleted: true, id });
    } catch (error) {
      console.error('Route Error DELETE /api/admin/reviews/:id:', error);
      res.status(500).json({ error: 'Unable to delete review.' });
    }
  });

  // =========================================================================
  // BROADCAST MESSAGES
  // =========================================================================
  app.get('/api/admin/broadcasts', requireAdmin, async (_req: AuthRequest, res: Response) => {
    try {
      const broadcasts = await listAdminBroadcasts();
      res.json({ broadcasts });
    } catch (error) {
      console.error('Route Error GET /api/admin/broadcasts:', error);
      res.status(500).json({ error: 'Unable to load broadcasts.' });
    }
  });

  app.post('/api/admin/broadcasts', requireAdmin, async (req: AuthRequest, res: Response) => {
    try {
      const body = req.body ?? {};
      const title = String(body.title || '').trim();
      const message = String(body.message || '').trim();
      const channel = String(body.channel || 'APP_PUSH').trim() as BroadcastMessageRecord['channel'];
      const audience = String(
        body.audience || 'ALL_CUSTOMERS'
      ).trim() as BroadcastMessageRecord['audience'];
      const priority = String(body.priority || 'NORMAL').trim() as BroadcastMessageRecord['priority'];
      const status = String(body.status || 'SENT').trim() as BroadcastMessageRecord['status'];

      if (
        !title ||
        !message ||
        !ALLOWED_BROADCAST_CHANNELS.has(channel) ||
        !ALLOWED_BROADCAST_AUDIENCES.has(audience) ||
        !ALLOWED_BROADCAST_PRIORITIES.has(priority) ||
        !ALLOWED_BROADCAST_STATUSES.has(status)
      ) {
        return res.status(400).json({ error: 'Valid broadcast title, message, channel, audience, and status are required.' });
      }

      const broadcast = await createAdminBroadcast({
        id: typeof body.id === 'string' ? body.id.trim().slice(0, 80) : undefined,
        title: title.slice(0, 180),
        message: message.slice(0, 1000),
        channel,
        audience,
        targetVillage: String(body.targetVillage || 'ALL').trim().slice(0, 80),
        priority,
        estimatedReach: Number.isFinite(Number(body.estimatedReach))
          ? Number(body.estimatedReach)
          : 0,
        status,
        scheduledFor:
          typeof body.scheduledFor === 'string' ? body.scheduledFor.slice(0, 40) : undefined,
        createdBy: getActorName(req),
      });
      res.status(201).json({ broadcast });
    } catch (error) {
      console.error('Route Error POST /api/admin/broadcasts:', error);
      res.status(500).json({ error: 'Unable to create broadcast.' });
    }
  });

  app.delete('/api/admin/broadcasts/:id', requireAdmin, async (req: AuthRequest, res: Response) => {
    try {
      const id = String(req.params.id || '').trim();
      const deleted = await deleteAdminBroadcast(id);
      if (!deleted) return res.status(404).json({ error: 'Broadcast not found.' });
      res.json({ deleted: true, id });
    } catch (error) {
      console.error('Route Error DELETE /api/admin/broadcasts/:id:', error);
      res.status(500).json({ error: 'Unable to delete broadcast.' });
    }
  });
}
