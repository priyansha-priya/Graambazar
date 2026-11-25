import type { Express, Response } from 'express';
import {
  createAdminCategory,
  createAdminProduct,
  createAdminSeller,
  deleteAdminCategory,
  deleteAdminProduct,
  listAdminCategories,
  listAdminProducts,
  listAdminSellers,
  moderateAdminProduct,
  requestAdminSellerKycChanges,
  toggleAdminCategoryStatus,
  toggleAdminProductAvailability,
  updateAdminCategory,
  updateAdminProduct,
  updateAdminProductInventory,
  updateAdminSellerConfig,
  updateAdminSellerKycDocument,
  updateAdminSellerStatus,
} from '../db/adminQueries.ts';
import {
  appendAdminAuditLog,
  clearAdminAuditLogs,
  createAdminDeliveryPartner,
  createAdminInterVillageRoute,
  createAdminServiceArea,
  deleteAdminDeliveryPartner,
  deleteAdminInterVillageRoute,
  listAdminApplications,
  listAdminAuditLogs,
  listAdminDeliveryPartners,
  listAdminInterVillageRoutes,
  listAdminServiceAreas,
  listAllAdminOrders,
  reviewAdminApplication,
  toggleAdminApplicationDoc,
  toggleAdminServiceAreaStatus,
  updateAdminDeliveryPartner,
  updateAdminInterVillageRoute,
  updateAdminServiceArea,
} from '../db/adminOpsQueries.ts';
import { AuthRequest, requireAdmin } from '../middleware/auth.ts';
import type {
  ApplicationStatus,
  DeliveryPartnerRecord,
  ProductModerationStatus,
  SellerAccountStatus,
  SellerDocumentStatus,
} from '../types/admin.ts';

const ALLOWED_PRODUCT_MODERATION_STATUSES = new Set<ProductModerationStatus>([
  'PENDING_REVIEW',
  'APPROVED',
  'REJECTED',
  'CHANGES_REQUESTED',
]);

const ALLOWED_SELLER_STATUSES = new Set<SellerAccountStatus>([
  'PENDING_APPROVAL',
  'KYC_PENDING',
  'KYC_UNDER_REVIEW',
  'APPROVED',
  'ACTIVE',
  'INACTIVE',
  'PAUSED',
  'SUSPENDED',
  'REJECTED',
]);

const ALLOWED_KYC_DOC_STATUSES = new Set<SellerDocumentStatus>([
  'PENDING',
  'APPROVED',
  'REJECTED',
  'CHANGES_REQUESTED',
]);

const ALLOWED_APPLICATION_STATUSES = new Set<ApplicationStatus>([
  'PENDING_REVIEW',
  'APPROVED',
  'REJECTED',
  'CHANGES_REQUESTED',
]);

const ALLOWED_VEHICLE_TYPES = new Set<DeliveryPartnerRecord['vehicleType']>([
  'CYCLE',
  'BIKE',
  'E_RICKSHAW',
]);

const ALLOWED_PARTNER_STATUSES = new Set<DeliveryPartnerRecord['status']>([
  'AVAILABLE',
  'ON_DELIVERY',
  'OFFLINE',
  'SUSPENDED',
]);

export function registerAdminOpsRoutes(app: Express): void {
  // --- Admin Categories ---
  app.get('/api/admin/categories', requireAdmin, async (_req: AuthRequest, res: Response) => {
    try {
      const categories = await listAdminCategories();
      res.json({ categories });
    } catch (error) {
      console.error('Route Error GET /api/admin/categories:', error);
      res.status(500).json({ error: 'Unable to load categories.' });
    }
  });

  app.post('/api/admin/categories', requireAdmin, async (req: AuthRequest, res: Response) => {
    try {
      const body = req.body ?? {};
      const name = String(body.name || '').trim();
      const vertical = String(body.vertical || '').trim();
      if (!name || name.length > 140 || !vertical || vertical.length > 60) {
        return res.status(400).json({ error: 'Valid category name and vertical are required.' });
      }
      const created = await createAdminCategory({
        id: typeof body.id === 'string' ? body.id.trim().slice(0, 80) : undefined,
        name: name.slice(0, 140),
        hindiName: typeof body.hindiName === 'string' ? body.hindiName.slice(0, 140) : '',
        vertical: vertical.slice(0, 60),
        parentId: typeof body.parentId === 'string' && body.parentId.trim() ? body.parentId.trim().slice(0, 80) : undefined,
        icon: typeof body.icon === 'string' && body.icon.trim() ? body.icon.trim().slice(0, 40) : 'Layers',
        isActive: typeof body.isActive === 'boolean' ? body.isActive : true,
        sortOrder: Number.isFinite(Number(body.sortOrder)) ? Number(body.sortOrder) : 0,
        attributeIds: Array.isArray(body.attributeIds) ? body.attributeIds.map((x: unknown) => String(x)).slice(0, 50) : [],
        allowedUnitIds: Array.isArray(body.allowedUnitIds) ? body.allowedUnitIds.map((x: unknown) => String(x)).slice(0, 50) : [],
      });
      res.status(201).json({ category: created });
    } catch (error) {
      console.error('Route Error POST /api/admin/categories:', error);
      res.status(500).json({ error: 'Unable to create category.' });
    }
  });

  app.patch('/api/admin/categories/:id', requireAdmin, async (req: AuthRequest, res: Response) => {
    try {
      const categoryId = String(req.params.id || '').trim();
      if (!categoryId || categoryId.length > 80) {
        return res.status(400).json({ error: 'Invalid category identifier.' });
      }
      const body = req.body ?? {};
      const patch: Record<string, unknown> = {};
      if (typeof body.name === 'string') patch.name = body.name.slice(0, 140);
      if (typeof body.hindiName === 'string') patch.hindiName = body.hindiName.slice(0, 140);
      if (typeof body.vertical === 'string') patch.vertical = body.vertical.slice(0, 60);
      if (typeof body.parentId === 'string' || body.parentId === null) patch.parentId = body.parentId ? String(body.parentId).slice(0, 80) : '';
      if (typeof body.icon === 'string') patch.icon = body.icon.slice(0, 40);
      if (typeof body.isActive === 'boolean') patch.isActive = body.isActive;
      if (Number.isFinite(Number(body.sortOrder)) && body.sortOrder !== undefined) patch.sortOrder = Number(body.sortOrder);
      if (Array.isArray(body.attributeIds)) patch.attributeIds = body.attributeIds.map((x: unknown) => String(x)).slice(0, 50);
      if (Array.isArray(body.allowedUnitIds)) patch.allowedUnitIds = body.allowedUnitIds.map((x: unknown) => String(x)).slice(0, 50);

      const updated = await updateAdminCategory(categoryId, patch);
      if (!updated) {
        return res.status(404).json({ error: 'Category not found.' });
      }
      res.json({ category: updated });
    } catch (error) {
      console.error('Route Error PATCH /api/admin/categories/:id:', error);
      res.status(500).json({ error: 'Unable to update category.' });
    }
  });

  app.patch('/api/admin/categories/:id/toggle', requireAdmin, async (req: AuthRequest, res: Response) => {
    try {
      const categoryId = String(req.params.id || '').trim();
      if (!categoryId || categoryId.length > 80) {
        return res.status(400).json({ error: 'Invalid category identifier.' });
      }
      const updated = await toggleAdminCategoryStatus(categoryId);
      if (!updated) {
        return res.status(404).json({ error: 'Category not found.' });
      }
      res.json({ category: updated });
    } catch (error) {
      console.error('Route Error PATCH /api/admin/categories/:id/toggle:', error);
      res.status(500).json({ error: 'Unable to toggle category status.' });
    }
  });

  app.delete('/api/admin/categories/:id', requireAdmin, async (req: AuthRequest, res: Response) => {
    try {
      const categoryId = String(req.params.id || '').trim();
      if (!categoryId || categoryId.length > 80) {
        return res.status(400).json({ error: 'Invalid category identifier.' });
      }
      const deleted = await deleteAdminCategory(categoryId);
      if (!deleted) {
        return res.status(404).json({ error: 'Category not found.' });
      }
      res.json({ deleted: true, id: categoryId });
    } catch (error) {
      console.error('Route Error DELETE /api/admin/categories/:id:', error);
      res.status(500).json({ error: 'Unable to delete category.' });
    }
  });

  // --- Admin Products ---
  app.get('/api/admin/products', requireAdmin, async (_req: AuthRequest, res: Response) => {
    try {
      const products = await listAdminProducts();
      res.json({ products });
    } catch (error) {
      console.error('Route Error GET /api/admin/products:', error);
      res.status(500).json({ error: 'Unable to load products.' });
    }
  });

  app.post('/api/admin/products', requireAdmin, async (req: AuthRequest, res: Response) => {
    try {
      const body = req.body ?? {};
      const name = String(body.name || '').trim();
      const vertical = String(body.vertical || '').trim();
      const categoryId = String(body.categoryId || '').trim();
      const sellerId = String(body.sellerId || '').trim();
      const sellerName = String(body.sellerName || '').trim();

      if (!name || !vertical || !categoryId || !sellerId || !sellerName) {
        return res.status(400).json({ error: 'Missing required product fields.' });
      }

      const created = await createAdminProduct({
        id: typeof body.id === 'string' ? body.id.trim().slice(0, 80) : undefined,
        sku: typeof body.sku === 'string' && body.sku.trim() ? body.sku.trim().slice(0, 80) : `GB-${Date.now()}`,
        name: name.slice(0, 180),
        hindiName: typeof body.hindiName === 'string' ? body.hindiName.slice(0, 180) : undefined,
        description: typeof body.description === 'string' ? body.description.slice(0, 1000) : undefined,
        vertical: vertical.slice(0, 60),
        categoryId: categoryId.slice(0, 80),
        subcategoryId: typeof body.subcategoryId === 'string' ? body.subcategoryId.slice(0, 80) : undefined,
        brandId: typeof body.brandId === 'string' ? body.brandId.slice(0, 80) : undefined,
        sellerId: sellerId.slice(0, 80),
        sellerName: sellerName.slice(0, 160),
        unitId: typeof body.unitId === 'string' && body.unitId.trim() ? body.unitId.trim().slice(0, 60) : 'unit_piece',
        inventoryMode: body.inventoryMode || 'QUANTITY_STOCK',
        mrpPaise: Math.max(0, Number(body.mrpPaise) || 0),
        pricePaise: Math.max(0, Number(body.pricePaise) || 0),
        stockQuantity: body.stockQuantity !== undefined ? Number(body.stockQuantity) : undefined,
        lowStockThreshold: body.lowStockThreshold !== undefined ? Number(body.lowStockThreshold) : undefined,
        prepTimeMinutes: body.prepTimeMinutes !== undefined ? Number(body.prepTimeMinutes) : undefined,
        leadTimeDays: body.leadTimeDays !== undefined ? Number(body.leadTimeDays) : undefined,
        dietType: body.dietType,
        attributes: body.attributes && typeof body.attributes === 'object' ? body.attributes : {},
        variants: Array.isArray(body.variants) ? body.variants : [],
        optionGroupIds: Array.isArray(body.optionGroupIds) ? body.optionGroupIds : [],
        moderationStatus: ALLOWED_PRODUCT_MODERATION_STATUSES.has(body.moderationStatus)
          ? body.moderationStatus
          : 'PENDING_REVIEW',
        moderationNotes: typeof body.moderationNotes === 'string' ? body.moderationNotes.slice(0, 500) : undefined,
        isActive: typeof body.isActive === 'boolean' ? body.isActive : true,
        isAvailable: typeof body.isAvailable === 'boolean' ? body.isAvailable : true,
      });

      res.status(201).json({ product: created });
    } catch (error) {
      console.error('Route Error POST /api/admin/products:', error);
      res.status(500).json({ error: 'Unable to create product.' });
    }
  });

  app.patch('/api/admin/products/:id', requireAdmin, async (req: AuthRequest, res: Response) => {
    try {
      const productId = String(req.params.id || '').trim();
      if (!productId || productId.length > 80) {
        return res.status(400).json({ error: 'Invalid product identifier.' });
      }
      const body = req.body ?? {};
      const patch: Record<string, unknown> = {};
      if (typeof body.sku === 'string') patch.sku = body.sku.slice(0, 80);
      if (typeof body.name === 'string') patch.name = body.name.slice(0, 180);
      if (typeof body.hindiName === 'string') patch.hindiName = body.hindiName.slice(0, 180);
      if (typeof body.description === 'string') patch.description = body.description.slice(0, 1000);
      if (typeof body.vertical === 'string') patch.vertical = body.vertical.slice(0, 60);
      if (typeof body.categoryId === 'string') patch.categoryId = body.categoryId.slice(0, 80);
      if (typeof body.subcategoryId === 'string') patch.subcategoryId = body.subcategoryId.slice(0, 80);
      if (typeof body.brandId === 'string') patch.brandId = body.brandId.slice(0, 80);
      if (typeof body.sellerId === 'string') patch.sellerId = body.sellerId.slice(0, 80);
      if (typeof body.sellerName === 'string') patch.sellerName = body.sellerName.slice(0, 160);
      if (typeof body.unitId === 'string') patch.unitId = body.unitId.slice(0, 60);
      if (typeof body.inventoryMode === 'string') patch.inventoryMode = body.inventoryMode;
      if (Number.isFinite(Number(body.mrpPaise)) && body.mrpPaise !== undefined) patch.mrpPaise = Math.max(0, Number(body.mrpPaise));
      if (Number.isFinite(Number(body.pricePaise)) && body.pricePaise !== undefined) patch.pricePaise = Math.max(0, Number(body.pricePaise));
      if (Number.isFinite(Number(body.stockQuantity)) && body.stockQuantity !== undefined) patch.stockQuantity = Math.max(0, Number(body.stockQuantity));
      if (Number.isFinite(Number(body.lowStockThreshold)) && body.lowStockThreshold !== undefined) patch.lowStockThreshold = Math.max(0, Number(body.lowStockThreshold));
      if (Number.isFinite(Number(body.prepTimeMinutes)) && body.prepTimeMinutes !== undefined) patch.prepTimeMinutes = Number(body.prepTimeMinutes);
      if (Number.isFinite(Number(body.leadTimeDays)) && body.leadTimeDays !== undefined) patch.leadTimeDays = Number(body.leadTimeDays);
      if (typeof body.dietType === 'string') patch.dietType = body.dietType;
      if (body.attributes && typeof body.attributes === 'object') patch.attributes = body.attributes;
      if (Array.isArray(body.variants)) patch.variants = body.variants;
      if (Array.isArray(body.optionGroupIds)) patch.optionGroupIds = body.optionGroupIds;
      if (ALLOWED_PRODUCT_MODERATION_STATUSES.has(body.moderationStatus)) patch.moderationStatus = body.moderationStatus;
      if (typeof body.moderationNotes === 'string') patch.moderationNotes = body.moderationNotes.slice(0, 500);
      if (typeof body.isActive === 'boolean') patch.isActive = body.isActive;
      if (typeof body.isAvailable === 'boolean') patch.isAvailable = body.isAvailable;

      const updated = await updateAdminProduct(productId, patch);
      if (!updated) {
        return res.status(404).json({ error: 'Product not found.' });
      }
      res.json({ product: updated });
    } catch (error) {
      console.error('Route Error PATCH /api/admin/products/:id:', error);
      res.status(500).json({ error: 'Unable to update product.' });
    }
  });

  app.patch('/api/admin/products/:id/moderate', requireAdmin, async (req: AuthRequest, res: Response) => {
    try {
      const productId = String(req.params.id || '').trim();
      const status = String(req.body?.status || '').trim() as ProductModerationStatus;
      const notes = typeof req.body?.notes === 'string' ? req.body.notes.slice(0, 500) : '';
      if (!productId || !ALLOWED_PRODUCT_MODERATION_STATUSES.has(status)) {
        return res.status(400).json({ error: 'Invalid product moderation request.' });
      }
      const updated = await moderateAdminProduct(productId, status, notes);
      if (!updated) {
        return res.status(404).json({ error: 'Product not found.' });
      }
      res.json({ product: updated });
    } catch (error) {
      console.error('Route Error PATCH /api/admin/products/:id/moderate:', error);
      res.status(500).json({ error: 'Unable to moderate product.' });
    }
  });

  app.patch('/api/admin/products/:id/inventory', requireAdmin, async (req: AuthRequest, res: Response) => {
    try {
      const productId = String(req.params.id || '').trim();
      const stockQuantity = Number(req.body?.stockQuantity);
      const variantStocks =
        req.body?.variantStocks && typeof req.body.variantStocks === 'object'
          ? (req.body.variantStocks as Record<string, number>)
          : undefined;
      if (!productId || !Number.isFinite(stockQuantity) || stockQuantity < 0) {
        return res.status(400).json({ error: 'Valid non-negative stock quantity is required.' });
      }
      const updated = await updateAdminProductInventory(productId, stockQuantity, variantStocks);
      if (!updated) {
        return res.status(404).json({ error: 'Product not found.' });
      }
      res.json({ product: updated });
    } catch (error) {
      console.error('Route Error PATCH /api/admin/products/:id/inventory:', error);
      res.status(500).json({ error: 'Unable to update product inventory.' });
    }
  });

  app.patch('/api/admin/products/:id/toggle-availability', requireAdmin, async (req: AuthRequest, res: Response) => {
    try {
      const productId = String(req.params.id || '').trim();
      if (!productId || productId.length > 80) {
        return res.status(400).json({ error: 'Invalid product identifier.' });
      }
      const updated = await toggleAdminProductAvailability(productId);
      if (!updated) {
        return res.status(404).json({ error: 'Product not found.' });
      }
      res.json({ product: updated });
    } catch (error) {
      console.error('Route Error PATCH /api/admin/products/:id/toggle-availability:', error);
      res.status(500).json({ error: 'Unable to toggle product availability.' });
    }
  });

  app.delete('/api/admin/products/:id', requireAdmin, async (req: AuthRequest, res: Response) => {
    try {
      const productId = String(req.params.id || '').trim();
      if (!productId || productId.length > 80) {
        return res.status(400).json({ error: 'Invalid product identifier.' });
      }
      const deleted = await deleteAdminProduct(productId);
      if (!deleted) {
        return res.status(404).json({ error: 'Product not found.' });
      }
      res.json({ deleted: true, id: productId });
    } catch (error) {
      console.error('Route Error DELETE /api/admin/products/:id:', error);
      res.status(500).json({ error: 'Unable to delete product.' });
    }
  });

  // --- Admin Sellers ---
  app.get('/api/admin/sellers', requireAdmin, async (_req: AuthRequest, res: Response) => {
    try {
      const sellers = await listAdminSellers(true);
      res.json({ sellers });
    } catch (error) {
      console.error('Route Error GET /api/admin/sellers:', error);
      res.status(500).json({ error: 'Unable to load sellers.' });
    }
  });

  app.post('/api/admin/sellers', requireAdmin, async (req: AuthRequest, res: Response) => {
    try {
      const body = req.body ?? {};
      const name = String(body.name || '').trim();
      const ownerName = String(body.ownerName || '').trim();
      const phone = String(body.phone || '').trim();
      const vertical = String(body.vertical || '').trim();
      if (!name || !ownerName || !phone || !vertical) {
        return res.status(400).json({ error: 'Missing required seller details.' });
      }
      const created = await createAdminSeller(body);
      res.status(201).json({ seller: created });
    } catch (error) {
      console.error('Route Error POST /api/admin/sellers:', error);
      res.status(500).json({ error: 'Unable to create seller.' });
    }
  });

  app.patch('/api/admin/sellers/:id/status', requireAdmin, async (req: AuthRequest, res: Response) => {
    try {
      const sellerCode = String(req.params.id || '').trim();
      const status = String(req.body?.status || '').trim() as SellerAccountStatus;
      const reason = typeof req.body?.reason === 'string' ? req.body.reason.slice(0, 400) : '';
      const actorName =
        typeof req.body?.actorName === 'string' && req.body.actorName.trim()
          ? req.body.actorName.trim().slice(0, 120)
          : req.dbUser?.displayName || req.user?.name || req.user?.email || 'Admin';

      if (!sellerCode || !ALLOWED_SELLER_STATUSES.has(status)) {
        return res.status(400).json({ error: 'Invalid seller status update request.' });
      }
      const updated = await updateAdminSellerStatus({
        sellerCode,
        status,
        reason,
        actorName,
      });
      if (!updated) {
        return res.status(404).json({ error: 'Seller not found.' });
      }
      res.json({ seller: updated });
    } catch (error) {
      console.error('Route Error PATCH /api/admin/sellers/:id/status:', error);
      res.status(500).json({ error: 'Unable to update seller status.' });
    }
  });

  app.patch('/api/admin/sellers/:id/config', requireAdmin, async (req: AuthRequest, res: Response) => {
    try {
      const sellerCode = String(req.params.id || '').trim();
      const rawPatch = req.body?.patch && typeof req.body.patch === 'object' ? req.body.patch : req.body ?? {};
      const actorName =
        typeof req.body?.actorName === 'string' && req.body.actorName.trim()
          ? req.body.actorName.trim().slice(0, 120)
          : req.dbUser?.displayName || req.user?.name || req.user?.email || 'Admin';

      if (!sellerCode || sellerCode.length > 80) {
        return res.status(400).json({ error: 'Invalid seller identifier.' });
      }
      const patch: Record<string, unknown> = {};
      if (typeof rawPatch.name === 'string') patch.name = rawPatch.name.slice(0, 160);
      if (typeof rawPatch.ownerName === 'string') patch.ownerName = rawPatch.ownerName.slice(0, 140);
      if (typeof rawPatch.businessType === 'string') patch.businessType = rawPatch.businessType.slice(0, 60);
      if (typeof rawPatch.vertical === 'string') patch.vertical = rawPatch.vertical.slice(0, 60);
      if (typeof rawPatch.phone === 'string') patch.phone = rawPatch.phone.slice(0, 40);
      if (typeof rawPatch.email === 'string') patch.email = rawPatch.email.slice(0, 160);
      if (typeof rawPatch.shopAddress === 'string') patch.shopAddress = rawPatch.shopAddress.slice(0, 300);
      if (typeof rawPatch.openingHours === 'string') patch.openingHours = rawPatch.openingHours.slice(0, 100);
      if (Number.isFinite(Number(rawPatch.commissionRateBps)) && rawPatch.commissionRateBps !== undefined) {
        patch.commissionRateBps = Math.max(0, Math.min(5000, Number(rawPatch.commissionRateBps)));
      }
      if (Array.isArray(rawPatch.serviceableVillageIds)) patch.serviceableVillageIds = rawPatch.serviceableVillageIds.map((x: unknown) => String(x)).slice(0, 50);
      if (Array.isArray(rawPatch.supportedVerticals)) patch.supportedVerticals = rawPatch.supportedVerticals.map((x: unknown) => String(x)).slice(0, 20);
      if (Array.isArray(rawPatch.fulfilmentModes)) patch.fulfilmentModes = rawPatch.fulfilmentModes.map((x: unknown) => String(x)).slice(0, 5);
      if (typeof rawPatch.fssaiVerified === 'boolean') patch.fssaiVerified = rawPatch.fssaiVerified;
      if (typeof rawPatch.bankAccountHolder === 'string') patch.bankAccountHolder = rawPatch.bankAccountHolder.slice(0, 160);
      if (typeof rawPatch.ifscCode === 'string') patch.ifscCode = rawPatch.ifscCode.slice(0, 30);

      const updated = await updateAdminSellerConfig({
        sellerCode,
        patch,
        actorName,
      });
      if (!updated) {
        return res.status(404).json({ error: 'Seller not found.' });
      }
      res.json({ seller: updated });
    } catch (error) {
      console.error('Route Error PATCH /api/admin/sellers/:id/config:', error);
      res.status(500).json({ error: 'Unable to update seller configuration.' });
    }
  });

  app.patch(
    '/api/admin/sellers/:id/kyc-documents/:docId',
    requireAdmin,
    async (req: AuthRequest, res: Response) => {
      try {
        const sellerCode = String(req.params.id || '').trim();
        const docId = String(req.params.docId || '').trim();
        const status = String(req.body?.status || '').trim() as SellerDocumentStatus;
        const note = typeof req.body?.note === 'string' ? req.body.note.slice(0, 400) : undefined;
        const actorName =
          typeof req.body?.actorName === 'string' && req.body.actorName.trim()
            ? req.body.actorName.trim().slice(0, 120)
            : req.dbUser?.displayName || req.user?.name || req.user?.email || 'Admin';

        if (!sellerCode || !docId || !ALLOWED_KYC_DOC_STATUSES.has(status)) {
          return res.status(400).json({ error: 'Invalid KYC document update request.' });
        }
        const updated = await updateAdminSellerKycDocument({
          sellerCode,
          docId,
          status,
          note,
          actorName,
        });
        if (!updated) {
          return res.status(404).json({ error: 'Seller or KYC document not found.' });
        }
        res.json({ seller: updated });
      } catch (error) {
        console.error('Route Error PATCH /api/admin/sellers/:id/kyc-documents/:docId:', error);
        res.status(500).json({ error: 'Unable to update KYC document.' });
      }
    }
  );

  app.post(
    '/api/admin/sellers/:id/kyc-changes',
    requireAdmin,
    async (req: AuthRequest, res: Response) => {
      try {
        const sellerCode = String(req.params.id || '').trim();
        const reason = String(req.body?.reason || '').trim().slice(0, 500);
        const actorName =
          typeof req.body?.actorName === 'string' && req.body.actorName.trim()
            ? req.body.actorName.trim().slice(0, 120)
            : req.dbUser?.displayName || req.user?.name || req.user?.email || 'Admin';

        if (!sellerCode || !reason) {
          return res.status(400).json({ error: 'Seller identifier and reason are required.' });
        }
        const updated = await requestAdminSellerKycChanges({
          sellerCode,
          reason,
          actorName,
        });
        if (!updated) {
          return res.status(404).json({ error: 'Seller not found.' });
        }
        res.json({ seller: updated });
      } catch (error) {
        console.error('Route Error POST /api/admin/sellers/:id/kyc-changes:', error);
        res.status(500).json({ error: 'Unable to submit KYC change request.' });
      }
    }
  );

  // --- Admin Seller Applications & Onboarding Queue ---
  app.get('/api/admin/applications', requireAdmin, async (_req: AuthRequest, res: Response) => {
    try {
      const applications = await listAdminApplications();
      res.json({ applications });
    } catch (error) {
      console.error('Route Error GET /api/admin/applications:', error);
      res.status(500).json({ error: 'Unable to load seller applications.' });
    }
  });

  app.patch(
    '/api/admin/applications/:id/review',
    requireAdmin,
    async (req: AuthRequest, res: Response) => {
      try {
        const externalId = String(req.params.id || '').trim();
        const status = String(req.body?.status || '').trim() as ApplicationStatus;
        const notes = typeof req.body?.notes === 'string' ? req.body.notes.slice(0, 500) : '';
        const reviewedBy =
          typeof req.body?.reviewedBy === 'string' && req.body.reviewedBy.trim()
            ? req.body.reviewedBy.trim().slice(0, 120)
            : req.dbUser?.displayName || req.user?.name || req.user?.email || 'Admin';

        if (!externalId || !ALLOWED_APPLICATION_STATUSES.has(status)) {
          return res.status(400).json({ error: 'Invalid application review request.' });
        }
        const result = await reviewAdminApplication({
          externalId,
          status,
          notes,
          reviewedBy,
        });
        if (!result) {
          return res.status(404).json({ error: 'Application not found.' });
        }
        res.json(result);
      } catch (error) {
        console.error('Route Error PATCH /api/admin/applications/:id/review:', error);
        res.status(500).json({ error: 'Unable to review seller application.' });
      }
    }
  );

  app.patch(
    '/api/admin/applications/:id/docs/:docCode/toggle',
    requireAdmin,
    async (req: AuthRequest, res: Response) => {
      try {
        const externalId = String(req.params.id || '').trim();
        const docCode = String(req.params.docCode || '').trim().slice(0, 40);
        if (!externalId || !docCode) {
          return res.status(400).json({ error: 'Invalid document toggle request.' });
        }
        const updated = await toggleAdminApplicationDoc(externalId, docCode);
        if (!updated) {
          return res.status(404).json({ error: 'Application not found.' });
        }
        res.json({ application: updated });
      } catch (error) {
        console.error('Route Error PATCH /api/admin/applications/:id/docs/:docCode/toggle:', error);
        res.status(500).json({ error: 'Unable to update application document verification.' });
      }
    }
  );

  // --- Admin Service Areas ---
  app.get('/api/admin/service-areas', requireAdmin, async (_req: AuthRequest, res: Response) => {
    try {
      const serviceAreas = await listAdminServiceAreas();
      res.json({ serviceAreas });
    } catch (error) {
      console.error('Route Error GET /api/admin/service-areas:', error);
      res.status(500).json({ error: 'Unable to load service areas.' });
    }
  });

  app.post('/api/admin/service-areas', requireAdmin, async (req: AuthRequest, res: Response) => {
    try {
      const body = req.body ?? {};
      const name = String(body.name || '').trim();
      const postalCode = String(body.postalCode || '').trim();
      const district = String(body.district || '').trim();
      const state = String(body.state || '').trim();
      if (!name || !postalCode || !district || !state) {
        return res.status(400).json({ error: 'Village name, postal code, district, and state are required.' });
      }
      const created = await createAdminServiceArea({
        id: typeof body.id === 'string' ? body.id.trim().slice(0, 80) : undefined,
        name: name.slice(0, 120),
        postalCode: postalCode.slice(0, 20),
        district: district.slice(0, 80),
        state: state.slice(0, 80),
        isActive: typeof body.isActive === 'boolean' ? body.isActive : true,
        baseDeliveryFeePaise: Math.max(0, Number(body.baseDeliveryFeePaise) || 1500),
        minOrderFreeDeliveryPaise: Math.max(0, Number(body.minOrderFreeDeliveryPaise) || 40000),
        landmarks: Array.isArray(body.landmarks)
          ? body.landmarks.map((x: unknown) => String(x).trim()).filter(Boolean).slice(0, 50)
          : undefined,
      });
      res.status(201).json({ serviceArea: created });
    } catch (error) {
      console.error('Route Error POST /api/admin/service-areas:', error);
      res.status(500).json({ error: 'Unable to create service area.' });
    }
  });

  app.patch('/api/admin/service-areas/:id', requireAdmin, async (req: AuthRequest, res: Response) => {
    try {
      const areaId = String(req.params.id || '').trim();
      if (!areaId || areaId.length > 80) {
        return res.status(400).json({ error: 'Invalid service area identifier.' });
      }
      const body = req.body ?? {};
      const patch: Record<string, unknown> = {};
      if (typeof body.name === 'string') patch.name = body.name.slice(0, 120);
      if (typeof body.postalCode === 'string') patch.postalCode = body.postalCode.slice(0, 20);
      if (typeof body.district === 'string') patch.district = body.district.slice(0, 80);
      if (typeof body.state === 'string') patch.state = body.state.slice(0, 80);
      if (typeof body.isActive === 'boolean') patch.isActive = body.isActive;
      if (Number.isFinite(Number(body.baseDeliveryFeePaise)) && body.baseDeliveryFeePaise !== undefined) {
        patch.baseDeliveryFeePaise = Math.max(0, Number(body.baseDeliveryFeePaise));
      }
      if (Number.isFinite(Number(body.minOrderFreeDeliveryPaise)) && body.minOrderFreeDeliveryPaise !== undefined) {
        patch.minOrderFreeDeliveryPaise = Math.max(0, Number(body.minOrderFreeDeliveryPaise));
      }
      if (Array.isArray(body.landmarks)) {
        patch.landmarks = body.landmarks.map((x: unknown) => String(x).trim()).filter(Boolean).slice(0, 50);
      }

      const updated = await updateAdminServiceArea(areaId, patch);
      if (!updated) {
        return res.status(404).json({ error: 'Service area not found.' });
      }
      res.json({ serviceArea: updated });
    } catch (error) {
      console.error('Route Error PATCH /api/admin/service-areas/:id:', error);
      res.status(500).json({ error: 'Unable to update service area.' });
    }
  });

  app.patch('/api/admin/service-areas/:id/toggle', requireAdmin, async (req: AuthRequest, res: Response) => {
    try {
      const areaId = String(req.params.id || '').trim();
      if (!areaId || areaId.length > 80) {
        return res.status(400).json({ error: 'Invalid service area identifier.' });
      }
      const updated = await toggleAdminServiceAreaStatus(areaId);
      if (!updated) {
        return res.status(404).json({ error: 'Service area not found.' });
      }
      res.json({ serviceArea: updated });
    } catch (error) {
      console.error('Route Error PATCH /api/admin/service-areas/:id/toggle:', error);
      res.status(500).json({ error: 'Unable to toggle service area status.' });
    }
  });

  // --- Admin Inter-Village Routes ---
  app.get('/api/admin/routes', requireAdmin, async (_req: AuthRequest, res: Response) => {
    try {
      const routes = await listAdminInterVillageRoutes();
      res.json({ routes });
    } catch (error) {
      console.error('Route Error GET /api/admin/routes:', error);
      res.status(500).json({ error: 'Unable to load inter-village routes.' });
    }
  });

  app.post('/api/admin/routes', requireAdmin, async (req: AuthRequest, res: Response) => {
    try {
      const body = req.body ?? {};
      const fromVillageId = String(body.fromVillageId || '').trim();
      const fromVillageName = String(body.fromVillageName || '').trim();
      const toVillageId = String(body.toVillageId || '').trim();
      const toVillageName = String(body.toVillageName || '').trim();
      if (!fromVillageId || !fromVillageName || !toVillageId || !toVillageName) {
        return res.status(400).json({ error: 'Origin and destination village details are required.' });
      }
      const created = await createAdminInterVillageRoute({
        id: typeof body.id === 'string' ? body.id.trim().slice(0, 80) : undefined,
        fromVillageId: fromVillageId.slice(0, 80),
        fromVillageName: fromVillageName.slice(0, 120),
        toVillageId: toVillageId.slice(0, 80),
        toVillageName: toVillageName.slice(0, 120),
        distanceKm: Math.max(0.1, Number(body.distanceKm) || 1),
        surchargePaise: Math.max(0, Number(body.surchargePaise) || 0),
        isActive: typeof body.isActive === 'boolean' ? body.isActive : true,
      });
      res.status(201).json({ route: created });
    } catch (error) {
      console.error('Route Error POST /api/admin/routes:', error);
      res.status(500).json({ error: 'Unable to create inter-village route.' });
    }
  });

  app.patch('/api/admin/routes/:id', requireAdmin, async (req: AuthRequest, res: Response) => {
    try {
      const routeId = String(req.params.id || '').trim();
      if (!routeId || routeId.length > 80) {
        return res.status(400).json({ error: 'Invalid route identifier.' });
      }
      const body = req.body ?? {};
      const patch: Record<string, unknown> = {};
      if (typeof body.fromVillageId === 'string') patch.fromVillageId = body.fromVillageId.slice(0, 80);
      if (typeof body.fromVillageName === 'string') patch.fromVillageName = body.fromVillageName.slice(0, 120);
      if (typeof body.toVillageId === 'string') patch.toVillageId = body.toVillageId.slice(0, 80);
      if (typeof body.toVillageName === 'string') patch.toVillageName = body.toVillageName.slice(0, 120);
      if (Number.isFinite(Number(body.distanceKm)) && body.distanceKm !== undefined) {
        patch.distanceKm = Math.max(0.1, Number(body.distanceKm));
      }
      if (Number.isFinite(Number(body.surchargePaise)) && body.surchargePaise !== undefined) {
        patch.surchargePaise = Math.max(0, Number(body.surchargePaise));
      }
      if (typeof body.isActive === 'boolean') patch.isActive = body.isActive;

      const updated = await updateAdminInterVillageRoute(routeId, patch);
      if (!updated) {
        return res.status(404).json({ error: 'Route not found.' });
      }
      res.json({ route: updated });
    } catch (error) {
      console.error('Route Error PATCH /api/admin/routes/:id:', error);
      res.status(500).json({ error: 'Unable to update route.' });
    }
  });

  app.delete('/api/admin/routes/:id', requireAdmin, async (req: AuthRequest, res: Response) => {
    try {
      const routeId = String(req.params.id || '').trim();
      if (!routeId || routeId.length > 80) {
        return res.status(400).json({ error: 'Invalid route identifier.' });
      }
      const deleted = await deleteAdminInterVillageRoute(routeId);
      if (!deleted) {
        return res.status(404).json({ error: 'Route not found.' });
      }
      res.json({ deleted: true, id: routeId });
    } catch (error) {
      console.error('Route Error DELETE /api/admin/routes/:id:', error);
      res.status(500).json({ error: 'Unable to delete route.' });
    }
  });

  // --- Admin Delivery Partners Fleet ---
  app.get('/api/admin/delivery-partners', requireAdmin, async (_req: AuthRequest, res: Response) => {
    try {
      const deliveryPartners = await listAdminDeliveryPartners();
      res.json({ deliveryPartners });
    } catch (error) {
      console.error('Route Error GET /api/admin/delivery-partners:', error);
      res.status(500).json({ error: 'Unable to load delivery partners.' });
    }
  });

  app.post('/api/admin/delivery-partners', requireAdmin, async (req: AuthRequest, res: Response) => {
    try {
      const body = req.body ?? {};
      const name = String(body.name || '').trim();
      const phone = String(body.phone || '').trim();
      const villageId = String(body.villageId || '').trim();
      const villageName = String(body.villageName || '').trim();
      const vehicleType = String(body.vehicleType || 'BIKE').trim() as DeliveryPartnerRecord['vehicleType'];
      const status = String(body.status || 'AVAILABLE').trim() as DeliveryPartnerRecord['status'];

      if (!name || !phone || !villageId || !villageName || !ALLOWED_VEHICLE_TYPES.has(vehicleType) || !ALLOWED_PARTNER_STATUSES.has(status)) {
        return res.status(400).json({ error: 'Valid delivery partner details are required.' });
      }

      const created = await createAdminDeliveryPartner({
        id: typeof body.id === 'string' ? body.id.trim().slice(0, 80) : undefined,
        name: name.slice(0, 120),
        phone: phone.slice(0, 30),
        villageId: villageId.slice(0, 80),
        villageName: villageName.slice(0, 120),
        vehicleType,
        vehicleNumber: typeof body.vehicleNumber === 'string' ? body.vehicleNumber.slice(0, 40) : undefined,
        kycVerified: Boolean(body.kycVerified),
        status,
      });
      res.status(201).json({ deliveryPartner: created });
    } catch (error) {
      console.error('Route Error POST /api/admin/delivery-partners:', error);
      res.status(500).json({ error: 'Unable to register delivery partner.' });
    }
  });

  app.patch('/api/admin/delivery-partners/:id', requireAdmin, async (req: AuthRequest, res: Response) => {
    try {
      const partnerId = String(req.params.id || '').trim();
      if (!partnerId || partnerId.length > 80) {
        return res.status(400).json({ error: 'Invalid delivery partner identifier.' });
      }
      const body = req.body ?? {};
      const patch: Record<string, unknown> = {};
      if (typeof body.name === 'string') patch.name = body.name.slice(0, 120);
      if (typeof body.phone === 'string') patch.phone = body.phone.slice(0, 30);
      if (typeof body.villageId === 'string') patch.villageId = body.villageId.slice(0, 80);
      if (typeof body.villageName === 'string') patch.villageName = body.villageName.slice(0, 120);
      if (ALLOWED_VEHICLE_TYPES.has(body.vehicleType)) patch.vehicleType = body.vehicleType;
      if (typeof body.vehicleNumber === 'string') patch.vehicleNumber = body.vehicleNumber.slice(0, 40);
      if (typeof body.kycVerified === 'boolean') patch.kycVerified = body.kycVerified;
      if (ALLOWED_PARTNER_STATUSES.has(body.status)) patch.status = body.status;
      if (Number.isFinite(Number(body.completedDeliveries)) && body.completedDeliveries !== undefined) {
        patch.completedDeliveries = Math.max(0, Number(body.completedDeliveries));
      }
      if (Number.isFinite(Number(body.rating)) && body.rating !== undefined) {
        patch.rating = Math.max(0, Math.min(5, Number(body.rating)));
      }

      const updated = await updateAdminDeliveryPartner(partnerId, patch);
      if (!updated) {
        return res.status(404).json({ error: 'Delivery partner not found.' });
      }
      res.json({ deliveryPartner: updated });
    } catch (error) {
      console.error('Route Error PATCH /api/admin/delivery-partners/:id:', error);
      res.status(500).json({ error: 'Unable to update delivery partner.' });
    }
  });

  app.delete('/api/admin/delivery-partners/:id', requireAdmin, async (req: AuthRequest, res: Response) => {
    try {
      const partnerId = String(req.params.id || '').trim();
      if (!partnerId || partnerId.length > 80) {
        return res.status(400).json({ error: 'Invalid delivery partner identifier.' });
      }
      const deleted = await deleteAdminDeliveryPartner(partnerId);
      if (!deleted) {
        return res.status(404).json({ error: 'Delivery partner not found.' });
      }
      res.json({ deleted: true, id: partnerId });
    } catch (error) {
      console.error('Route Error DELETE /api/admin/delivery-partners/:id:', error);
      res.status(500).json({ error: 'Unable to delete delivery partner.' });
    }
  });

  // --- Admin Audit Logs ---
  app.get('/api/admin/audit-logs', requireAdmin, async (_req: AuthRequest, res: Response) => {
    try {
      const auditLogs = await listAdminAuditLogs(200);
      res.json({ auditLogs });
    } catch (error) {
      console.error('Route Error GET /api/admin/audit-logs:', error);
      res.status(500).json({ error: 'Unable to load audit logs.' });
    }
  });

  app.post('/api/admin/audit-logs', requireAdmin, async (req: AuthRequest, res: Response) => {
    try {
      const body = req.body ?? {};
      const actionType = String(body.actionType || '').trim();
      const targetEntity = String(body.targetEntity || '').trim();
      const targetId = String(body.targetId || '').trim();
      const details = String(body.details || '').trim();
      if (!actionType || !targetEntity || !targetId || !details) {
        return res.status(400).json({ error: 'Missing required audit log fields.' });
      }
      const created = await appendAdminAuditLog({
        id: typeof body.id === 'string' ? body.id.trim().slice(0, 80) : undefined,
        actor:
          req.dbUser?.displayName || req.user?.name || req.user?.email || String(body.actor || 'Admin'),
        actorRole: req.dbUser?.role || 'SUPER_ADMIN',
        actionType,
        targetEntity,
        targetId,
        ipAddress: req.ip || 'server',
        details,
        reason: typeof body.reason === 'string' ? body.reason : undefined,
        metadata: body.metadata && typeof body.metadata === 'object' ? body.metadata : undefined,
      });
      res.status(201).json({ auditLog: created });
    } catch (error) {
      console.error('Route Error POST /api/admin/audit-logs:', error);
      res.status(500).json({ error: 'Unable to record audit event.' });
    }
  });

  app.delete('/api/admin/audit-logs', requireAdmin, async (req: AuthRequest, res: Response) => {
    try {
      if (req.dbUser?.role !== 'SUPER_ADMIN') {
        return res.status(403).json({ error: 'Only Super Admin can purge audit logs.' });
      }
      const freshLog = await clearAdminAuditLogs({
        actor: req.dbUser?.displayName || req.user?.name || req.user?.email || 'Super Admin',
        actorRole: 'SUPER_ADMIN',
        ipAddress: req.ip || 'server',
      });
      res.json({ auditLog: freshLog });
    } catch (error) {
      console.error('Route Error DELETE /api/admin/audit-logs:', error);
      res.status(500).json({ error: 'Unable to purge audit logs.' });
    }
  });

  // --- Admin Global Orders Directory ---
  app.get('/api/admin/orders', requireAdmin, async (_req: AuthRequest, res: Response) => {
    try {
      const ordersList = await listAllAdminOrders();
      res.json({ orders: ordersList });
    } catch (error) {
      console.error('Route Error GET /api/admin/orders:', error);
      res.status(500).json({ error: 'Unable to load platform orders.' });
    }
  });
}
