import type { Express, Request, Response } from 'express';
import {
  createAdminProduct,
  toggleAdminProductAvailability,
  updateAdminProduct,
  updateAdminProductInventory,
} from '../db/adminQueries.ts';
import {
  RunnerRoleKey,
  assignRunnerToSellerOrder,
  createSellerRunner,
  deleteSellerRunner,
  getSellerAnalytics,
  getSellerStoreProfile,
  listPublicSellerProfiles,
  listSellerOrders,
  listSellerRunners,
  transitionSellerOrderStatus,
  updateSellerRunner,
  updateSellerStoreProfile,
  verifySellerOwnsProduct,
} from '../db/sellerPortalQueries.ts';
import { AuthRequest, requireAuth } from '../middleware/auth.ts';

const ALLOWED_RUNNER_ROLES = new Set<string>([
  'Shop Runner',
  'Delivery Staff',
  'Family Helper',
]);

const ALLOWED_SELLER_ORDER_STATUSES = new Set<string>([
  'accepted',
  'preparing',
  'ready_for_pickup',
  'ready_for_delivery',
  'out_for_delivery',
  'completed',
  'rejected',
  'cancelled',
]);

export function registerSellerPortalRoutes(app: Express): void {
  // Public storefront seller operational profiles (no sensitive bank/KYC fields)
  app.get('/api/catalog/seller-profiles', async (_req: Request, res: Response) => {
    try {
      const profiles = await listPublicSellerProfiles();
      res.json({ profiles });
    } catch (error) {
      console.error('Route Error GET /api/catalog/seller-profiles:', error);
      res.status(500).json({ error: 'Unable to load seller profiles.' });
    }
  });

  // =========================================================================
  // 1. Seller Store Profile & Operational Settings
  // =========================================================================

  app.get(
    '/api/seller/:sellerCode/profile',
    requireAuth,
    async (req: AuthRequest, res: Response) => {
      try {
        const sellerCode = String(req.params.sellerCode || '').trim();
        if (!sellerCode) {
          return res.status(400).json({ error: 'Seller code is required.' });
        }
        const profile = await getSellerStoreProfile(sellerCode);
        if (!profile) {
          return res.status(404).json({ error: 'Seller store not found.' });
        }
        res.json({ profile });
      } catch (error) {
        console.error('Route Error GET /api/seller/:sellerCode/profile:', error);
        res.status(500).json({ error: 'Unable to load store profile.' });
      }
    }
  );

  app.patch(
    '/api/seller/:sellerCode/profile',
    requireAuth,
    async (req: AuthRequest, res: Response) => {
      try {
        const sellerCode = String(req.params.sellerCode || '').trim();
        const body = req.body ?? {};
        if (!sellerCode) {
          return res.status(400).json({ error: 'Seller code is required.' });
        }

        const patch: Parameters<typeof updateSellerStoreProfile>[1] = {};
        if (typeof body.publicName === 'string' && body.publicName.trim()) {
          patch.publicName = body.publicName.trim().slice(0, 140);
        }
        if (typeof body.contactPhone === 'string' && body.contactPhone.trim()) {
          patch.contactPhone = body.contactPhone.trim().slice(0, 32);
        }
        if (typeof body.upiId === 'string' && body.upiId.trim()) {
          patch.upiId = body.upiId.trim().slice(0, 100);
        }
        if (body.deliveryRadiusKm !== undefined) {
          const radius = Number(body.deliveryRadiusKm);
          if (!Number.isFinite(radius) || radius < 1 || radius > 50) {
            return res
              .status(400)
              .json({ error: 'Delivery radius must be between 1 and 50 km.' });
          }
          patch.deliveryRadiusKm = radius;
        }
        if (typeof body.openingHours === 'string' && body.openingHours.trim()) {
          patch.openingHours = body.openingHours.trim().slice(0, 80);
        }
        if (body.minimumOrderPaise !== undefined) {
          const minOrder = Number(body.minimumOrderPaise);
          if (!Number.isFinite(minOrder) || minOrder < 0) {
            return res.status(400).json({ error: 'Minimum order amount must be non-negative.' });
          }
          patch.minimumOrderPaise = minOrder;
        }
        if (body.packagingFeePaise !== undefined) {
          const pkgFee = Number(body.packagingFeePaise);
          if (!Number.isFinite(pkgFee) || pkgFee < 0) {
            return res.status(400).json({ error: 'Packaging fee must be non-negative.' });
          }
          patch.packagingFeePaise = pkgFee;
        }
        if (body.deliveryFeePaise !== undefined) {
          const delFee = Number(body.deliveryFeePaise);
          if (!Number.isFinite(delFee) || delFee < 0) {
            return res.status(400).json({ error: 'Delivery fee must be non-negative.' });
          }
          patch.deliveryFeePaise = delFee;
        }

        const profile = await updateSellerStoreProfile(sellerCode, patch);
        if (!profile) {
          return res.status(404).json({ error: 'Seller store not found.' });
        }

        res.json({ profile });
      } catch (error) {
        console.error('Route Error PATCH /api/seller/:sellerCode/profile:', error);
        res.status(500).json({ error: 'Unable to update store profile.' });
      }
    }
  );

  // =========================================================================
  // 2. Seller In-House Runners & Dispatch Assignment
  // =========================================================================

  app.get(
    '/api/seller/:sellerCode/runners',
    requireAuth,
    async (req: AuthRequest, res: Response) => {
      try {
        const sellerCode = String(req.params.sellerCode || '').trim();
        if (!sellerCode) {
          return res.status(400).json({ error: 'Seller code is required.' });
        }
        const runners = await listSellerRunners(sellerCode);
        res.json({ runners });
      } catch (error) {
        console.error('Route Error GET /api/seller/:sellerCode/runners:', error);
        res.status(500).json({ error: 'Unable to load delivery runners.' });
      }
    }
  );

  app.post(
    '/api/seller/:sellerCode/runners',
    requireAuth,
    async (req: AuthRequest, res: Response) => {
      try {
        const sellerCode = String(req.params.sellerCode || '').trim();
        const body = req.body ?? {};
        const name = String(body.name || '').trim();
        const phone = String(body.phone || '').trim();
        const role = String(body.role || 'Shop Runner').trim();

        if (!sellerCode || !name || !phone || !ALLOWED_RUNNER_ROLES.has(role)) {
          return res.status(400).json({ error: 'Valid runner name, phone, and role are required.' });
        }

        const runner = await createSellerRunner({
          sellerCode,
          name: name.slice(0, 100),
          phone: phone.slice(0, 24),
          role: role as RunnerRoleKey,
        });
        res.status(201).json({ runner });
      } catch (error) {
        console.error('Route Error POST /api/seller/:sellerCode/runners:', error);
        res.status(500).json({ error: 'Unable to add delivery runner.' });
      }
    }
  );

  app.patch(
    '/api/seller/:sellerCode/runners/:runnerId',
    requireAuth,
    async (req: AuthRequest, res: Response) => {
      try {
        const sellerCode = String(req.params.sellerCode || '').trim();
        const runnerId = String(req.params.runnerId || '').trim();
        const body = req.body ?? {};

        if (!sellerCode || !runnerId) {
          return res.status(400).json({ error: 'Seller code and runner ID are required.' });
        }
        if (body.role !== undefined && !ALLOWED_RUNNER_ROLES.has(body.role)) {
          return res.status(400).json({ error: 'Invalid runner role.' });
        }

        const runner = await updateSellerRunner({
          sellerCode,
          runnerId,
          patch: {
            name: typeof body.name === 'string' ? body.name.slice(0, 100) : undefined,
            phone: typeof body.phone === 'string' ? body.phone.slice(0, 24) : undefined,
            role: body.role as RunnerRoleKey | undefined,
            isAvailable: typeof body.isAvailable === 'boolean' ? body.isAvailable : undefined,
          },
        });

        if (!runner) {
          return res.status(404).json({ error: 'Delivery runner not found.' });
        }
        res.json({ runner });
      } catch (error) {
        console.error('Route Error PATCH /api/seller/:sellerCode/runners/:runnerId:', error);
        res.status(500).json({ error: 'Unable to update delivery runner.' });
      }
    }
  );

  app.delete(
    '/api/seller/:sellerCode/runners/:runnerId',
    requireAuth,
    async (req: AuthRequest, res: Response) => {
      try {
        const sellerCode = String(req.params.sellerCode || '').trim();
        const runnerId = String(req.params.runnerId || '').trim();
        if (!sellerCode || !runnerId) {
          return res.status(400).json({ error: 'Seller code and runner ID are required.' });
        }
        const deleted = await deleteSellerRunner({ sellerCode, runnerId });
        if (!deleted) {
          return res.status(404).json({ error: 'Delivery runner not found.' });
        }
        res.json({ deleted: true });
      } catch (error) {
        console.error('Route Error DELETE /api/seller/:sellerCode/runners/:runnerId:', error);
        res.status(500).json({ error: 'Unable to remove delivery runner.' });
      }
    }
  );

  app.post(
    '/api/seller/:sellerCode/orders/:orderNumber/assign-runner',
    requireAuth,
    async (req: AuthRequest, res: Response) => {
      try {
        const sellerCode = String(req.params.sellerCode || '').trim();
        const orderNumber = String(req.params.orderNumber || '').trim();
        const runnerId = String(req.body?.runnerId || '').trim();

        if (!sellerCode || !orderNumber || !runnerId) {
          return res
            .status(400)
            .json({ error: 'Seller code, order number, and runnerId are required.' });
        }

        const result = await assignRunnerToSellerOrder({
          sellerCode,
          orderNumber,
          runnerId,
        });

        if (!result) {
          return res.status(404).json({ error: 'Runner not found for this seller.' });
        }

        res.json(result);
      } catch (error) {
        console.error(
          'Route Error POST /api/seller/:sellerCode/orders/:orderNumber/assign-runner:',
          error
        );
        res.status(500).json({ error: 'Unable to assign runner to order.' });
      }
    }
  );

  // =========================================================================
  // 3. Seller Orders Queue & Fulfillment Transitions
  // =========================================================================

  app.get(
    '/api/seller/:sellerCode/orders',
    requireAuth,
    async (req: AuthRequest, res: Response) => {
      try {
        const sellerCode = String(req.params.sellerCode || '').trim();
        if (!sellerCode) {
          return res.status(400).json({ error: 'Seller code is required.' });
        }
        const ordersList = await listSellerOrders(sellerCode);
        res.json({ orders: ordersList });
      } catch (error) {
        console.error('Route Error GET /api/seller/:sellerCode/orders:', error);
        res.status(500).json({ error: 'Unable to load seller orders.' });
      }
    }
  );

  app.patch(
    '/api/seller/:sellerCode/orders/:orderNumber/status',
    requireAuth,
    async (req: AuthRequest, res: Response) => {
      try {
        const sellerCode = String(req.params.sellerCode || '').trim();
        const orderNumber = String(req.params.orderNumber || '').trim();
        const status = String(req.body?.status || '').trim();
        const reason =
          typeof req.body?.reason === 'string' ? req.body.reason.slice(0, 250) : undefined;

        if (!sellerCode || !orderNumber || !ALLOWED_SELLER_ORDER_STATUSES.has(status)) {
          return res.status(400).json({ error: 'Invalid seller order status transition.' });
        }

        const updated = await transitionSellerOrderStatus({
          sellerCode,
          orderNumber,
          nextStatus: status,
          reason,
        });

        if (!updated) {
          return res.status(404).json({ error: 'Order not found for this seller.' });
        }

        res.json({ order: updated });
      } catch (error) {
        console.error(
          'Route Error PATCH /api/seller/:sellerCode/orders/:orderNumber/status:',
          error
        );
        res.status(500).json({ error: 'Unable to update seller order status.' });
      }
    }
  );

  // =========================================================================
  // 4. Seller Self-Service Product CRUD (No Admin Role Required)
  // =========================================================================

  app.post(
    '/api/seller/:sellerCode/products',
    requireAuth,
    async (req: AuthRequest, res: Response) => {
      try {
        const sellerCode = String(req.params.sellerCode || '').trim();
        const body = req.body ?? {};
        const name = String(body.name || '').trim();
        const vertical = String(body.vertical || '').trim();
        const categoryId = String(body.categoryId || '').trim();

        const store = await getSellerStoreProfile(sellerCode);
        if (!store) {
          return res.status(404).json({ error: 'Seller store not found.' });
        }
        if (!name || !vertical || !categoryId) {
          return res.status(400).json({ error: 'Product name, vertical, and categoryId are required.' });
        }

        // Seller submissions always enter PENDING_REVIEW moderation and are bound to sellerCode
        const created = await createAdminProduct({
          id: typeof body.id === 'string' ? body.id.trim().slice(0, 80) : undefined,
          sku:
            typeof body.sku === 'string' && body.sku.trim()
              ? body.sku.trim().slice(0, 80)
              : `GB-${Date.now()}`,
          name: name.slice(0, 180),
          hindiName: typeof body.hindiName === 'string' ? body.hindiName.slice(0, 180) : undefined,
          description:
            typeof body.description === 'string' ? body.description.slice(0, 1000) : undefined,
          vertical: vertical.slice(0, 60),
          categoryId: categoryId.slice(0, 80),
          subcategoryId:
            typeof body.subcategoryId === 'string' ? body.subcategoryId.slice(0, 80) : undefined,
          brandId: typeof body.brandId === 'string' ? body.brandId.slice(0, 80) : undefined,
          sellerId: sellerCode,
          sellerName: store.publicName,
          unitId:
            typeof body.unitId === 'string' && body.unitId.trim()
              ? body.unitId.trim().slice(0, 60)
              : 'unit_piece',
          inventoryMode: body.inventoryMode || 'QUANTITY_STOCK',
          mrpPaise: Math.max(0, Number(body.mrpPaise) || 0),
          pricePaise: Math.max(0, Number(body.pricePaise) || 0),
          stockQuantity:
            body.stockQuantity !== undefined ? Math.max(0, Number(body.stockQuantity)) : undefined,
          lowStockThreshold:
            body.lowStockThreshold !== undefined
              ? Math.max(0, Number(body.lowStockThreshold))
              : undefined,
          prepTimeMinutes:
            body.prepTimeMinutes !== undefined ? Number(body.prepTimeMinutes) : undefined,
          leadTimeDays: body.leadTimeDays !== undefined ? Number(body.leadTimeDays) : undefined,
          dietType: body.dietType,
          attributes: body.attributes && typeof body.attributes === 'object' ? body.attributes : {},
          variants: Array.isArray(body.variants) ? body.variants : [],
          optionGroupIds: Array.isArray(body.optionGroupIds) ? body.optionGroupIds : [],
          moderationStatus: 'PENDING_REVIEW',
          isActive: true,
          isAvailable: typeof body.isAvailable === 'boolean' ? body.isAvailable : true,
        });

        res.status(201).json({ product: created });
      } catch (error) {
        console.error('Route Error POST /api/seller/:sellerCode/products:', error);
        res.status(500).json({ error: 'Unable to submit seller product.' });
      }
    }
  );

  app.patch(
    '/api/seller/:sellerCode/products/:id',
    requireAuth,
    async (req: AuthRequest, res: Response) => {
      try {
        const sellerCode = String(req.params.sellerCode || '').trim();
        const productId = String(req.params.id || '').trim();
        if (!sellerCode || !productId) {
          return res.status(400).json({ error: 'Seller code and product ID are required.' });
        }

        const owns = await verifySellerOwnsProduct(sellerCode, productId);
        if (!owns) {
          return res.status(403).json({ error: 'You can only edit products belonging to your store.' });
        }

        const body = req.body ?? {};
        const patch: Record<string, unknown> = {};
        if (typeof body.sku === 'string') patch.sku = body.sku.slice(0, 80);
        if (typeof body.name === 'string') patch.name = body.name.slice(0, 180);
        if (typeof body.hindiName === 'string') patch.hindiName = body.hindiName.slice(0, 180);
        if (typeof body.description === 'string') patch.description = body.description.slice(0, 1000);
        if (typeof body.categoryId === 'string') patch.categoryId = body.categoryId.slice(0, 80);
        if (typeof body.subcategoryId === 'string') patch.subcategoryId = body.subcategoryId.slice(0, 80);
        if (typeof body.brandId === 'string') patch.brandId = body.brandId.slice(0, 80);
        if (typeof body.unitId === 'string') patch.unitId = body.unitId.slice(0, 60);
        if (typeof body.inventoryMode === 'string') patch.inventoryMode = body.inventoryMode;
        if (body.mrpPaise !== undefined && Number.isFinite(Number(body.mrpPaise))) {
          patch.mrpPaise = Math.max(0, Number(body.mrpPaise));
        }
        if (body.pricePaise !== undefined && Number.isFinite(Number(body.pricePaise))) {
          patch.pricePaise = Math.max(0, Number(body.pricePaise));
        }
        if (body.stockQuantity !== undefined && Number.isFinite(Number(body.stockQuantity))) {
          patch.stockQuantity = Math.max(0, Number(body.stockQuantity));
        }
        if (body.lowStockThreshold !== undefined && Number.isFinite(Number(body.lowStockThreshold))) {
          patch.lowStockThreshold = Math.max(0, Number(body.lowStockThreshold));
        }
        if (body.prepTimeMinutes !== undefined && Number.isFinite(Number(body.prepTimeMinutes))) {
          patch.prepTimeMinutes = Number(body.prepTimeMinutes);
        }
        if (typeof body.dietType === 'string') patch.dietType = body.dietType;
        if (body.attributes && typeof body.attributes === 'object') patch.attributes = body.attributes;
        if (Array.isArray(body.variants)) patch.variants = body.variants;
        if (Array.isArray(body.optionGroupIds)) patch.optionGroupIds = body.optionGroupIds;
        if (typeof body.isAvailable === 'boolean') patch.isAvailable = body.isAvailable;

        const updated = await updateAdminProduct(productId, patch);
        if (!updated) {
          return res.status(404).json({ error: 'Product not found.' });
        }
        res.json({ product: updated });
      } catch (error) {
        console.error('Route Error PATCH /api/seller/:sellerCode/products/:id:', error);
        res.status(500).json({ error: 'Unable to update seller product.' });
      }
    }
  );

  app.patch(
    '/api/seller/:sellerCode/products/:id/inventory',
    requireAuth,
    async (req: AuthRequest, res: Response) => {
      try {
        const sellerCode = String(req.params.sellerCode || '').trim();
        const productId = String(req.params.id || '').trim();
        const stockQuantity = Number(req.body?.stockQuantity);
        const variantStocks =
          req.body?.variantStocks && typeof req.body.variantStocks === 'object'
            ? (req.body.variantStocks as Record<string, number>)
            : undefined;

        if (!sellerCode || !productId || !Number.isFinite(stockQuantity) || stockQuantity < 0) {
          return res.status(400).json({ error: 'Valid non-negative stock quantity is required.' });
        }

        const owns = await verifySellerOwnsProduct(sellerCode, productId);
        if (!owns) {
          return res
            .status(403)
            .json({ error: 'You can only update inventory for your own store products.' });
        }

        const updated = await updateAdminProductInventory(productId, stockQuantity, variantStocks);
        if (!updated) {
          return res.status(404).json({ error: 'Product not found.' });
        }
        res.json({ product: updated });
      } catch (error) {
        console.error('Route Error PATCH /api/seller/:sellerCode/products/:id/inventory:', error);
        res.status(500).json({ error: 'Unable to update product inventory.' });
      }
    }
  );

  app.patch(
    '/api/seller/:sellerCode/products/:id/availability',
    requireAuth,
    async (req: AuthRequest, res: Response) => {
      try {
        const sellerCode = String(req.params.sellerCode || '').trim();
        const productId = String(req.params.id || '').trim();
        if (!sellerCode || !productId) {
          return res.status(400).json({ error: 'Seller code and product ID are required.' });
        }

        const owns = await verifySellerOwnsProduct(sellerCode, productId);
        if (!owns) {
          return res
            .status(403)
            .json({ error: 'You can only toggle availability for your own store products.' });
        }

        const updated = await toggleAdminProductAvailability(productId);
        if (!updated) {
          return res.status(404).json({ error: 'Product not found.' });
        }
        res.json({ product: updated });
      } catch (error) {
        console.error(
          'Route Error PATCH /api/seller/:sellerCode/products/:id/availability:',
          error
        );
        res.status(500).json({ error: 'Unable to toggle product availability.' });
      }
    }
  );

  // =========================================================================
  // 5. Seller Live Analytics Aggregation
  // =========================================================================

  app.get(
    '/api/seller/:sellerCode/analytics',
    requireAuth,
    async (req: AuthRequest, res: Response) => {
      try {
        const sellerCode = String(req.params.sellerCode || '').trim();
        const days = Number(req.query.days) || 7;
        if (!sellerCode) {
          return res.status(400).json({ error: 'Seller code is required.' });
        }

        const analytics = await getSellerAnalytics(sellerCode, days);
        if (!analytics) {
          return res.status(404).json({ error: 'Seller store not found.' });
        }

        res.json({ analytics });
      } catch (error) {
        console.error('Route Error GET /api/seller/:sellerCode/analytics:', error);
        res.status(500).json({ error: 'Unable to compute seller analytics.' });
      }
    }
  );
}
