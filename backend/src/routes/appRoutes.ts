import type { Express, Response } from 'express';
import {
  bulkUpdateSellerInventory,
  createOrderWithItems,
  getOrCreateUser,
  getOrdersForUser,
  getUdhariProfiles,
  recordUdhariRepayment,
  transitionOrderStatus,
  updateSellerInventoryStock,
} from '../db/queries.ts';
import { AuthRequest, requireAuth } from '../middleware/auth.ts';

const ALLOWED_ORDER_STATUSES = new Set([
  'placed',
  'pending',
  'accepted',
  'preparing',
  'ready_for_pickup',
  'ready_for_delivery',
  'out_for_delivery',
  'completed',
  'cancelled',
  'rejected',
  'delivery_failed',
  'returned',
  'refunded',
]);

export function registerAppRoutes(app: Express): void {
  app.get('/api/auth/me', requireAuth, async (req: AuthRequest, res: Response) => {
    try {
      const uid = req.user?.uid;
      if (!uid) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      const user = await getOrCreateUser(
        uid,
        req.user?.email || `${uid}@grambazaar.local`,
        req.user?.name || undefined
      );
      res.json({ user });
    } catch (error) {
      console.error('Route Error GET /api/auth/me:', error);
      res.status(500).json({ error: 'Unable to retrieve account profile.' });
    }
  });

  app.patch(
    '/api/inventory/:externalId/stock',
    requireAuth,
    async (req: AuthRequest, res: Response) => {
      try {
        const externalId = String(req.params.externalId || '').trim();
        const actorUid = req.user?.uid;
        if (!externalId || !actorUid) {
          return res.status(400).json({ error: 'Invalid inventory update request.' });
        }

        const { stockQuantity, isAvailable, pricePaise, reason } = req.body ?? {};
        if (
          stockQuantity !== undefined &&
          (typeof stockQuantity !== 'number' || !Number.isFinite(stockQuantity) || stockQuantity < 0)
        ) {
          return res.status(400).json({ error: 'Stock quantity must be a non-negative number.' });
        }
        if (
          pricePaise !== undefined &&
          (typeof pricePaise !== 'number' || !Number.isFinite(pricePaise) || pricePaise <= 0)
        ) {
          return res.status(400).json({ error: 'Price must be a positive number.' });
        }

        const updated = await updateSellerInventoryStock({
          externalId,
          nextQty: stockQuantity,
          isAvailable: typeof isAvailable === 'boolean' ? isAvailable : undefined,
          pricePaise,
          actorUid,
          reason: typeof reason === 'string' ? reason.slice(0, 200) : undefined,
        });

        if (!updated) {
          return res.status(404).json({ error: 'Inventory item not found.' });
        }

        res.json({ item: updated });
      } catch (error) {
        console.error('Route Error PATCH /api/inventory/:externalId/stock:', error);
        res.status(500).json({ error: 'Unable to update stock right now.' });
      }
    }
  );

  app.post('/api/inventory/bulk-update', requireAuth, async (req: AuthRequest, res: Response) => {
    try {
      const actorUid = req.user?.uid;
      const updates = Array.isArray(req.body?.updates) ? req.body.updates : null;

      if (!actorUid || !updates || updates.length === 0 || updates.length > 200) {
        return res.status(400).json({ error: 'Invalid bulk inventory update payload.' });
      }

      const sanitized = updates
        .filter((u: unknown): u is Record<string, unknown> => Boolean(u && typeof u === 'object'))
        .map((u: Record<string, unknown>) => ({
          externalId: String(u.externalId || '').trim(),
          pricePaise:
            typeof u.pricePaise === 'number' && Number.isFinite(u.pricePaise) && u.pricePaise > 0
              ? Math.round(u.pricePaise)
              : undefined,
          stockQuantity:
            typeof u.stockQuantity === 'number' &&
            Number.isFinite(u.stockQuantity) &&
            u.stockQuantity >= 0
              ? u.stockQuantity
              : undefined,
          isAvailable: typeof u.isAvailable === 'boolean' ? u.isAvailable : undefined,
        }))
        .filter((u: { externalId: string }) => u.externalId.length > 0);

      const results = await bulkUpdateSellerInventory(sanitized, actorUid);
      res.json({ items: results });
    } catch (error) {
      console.error('Route Error POST /api/inventory/bulk-update:', error);
      res.status(500).json({ error: 'Unable to apply bulk inventory update.' });
    }
  });

  app.get('/api/orders', requireAuth, async (req: AuthRequest, res: Response) => {
    try {
      const uid = req.user?.uid;
      if (!uid) return res.status(401).json({ error: 'Unauthorized' });

      const userOrders = await getOrdersForUser(uid);
      res.json({ orders: userOrders });
    } catch (error) {
      console.error('Route Error GET /api/orders:', error);
      res.status(500).json({ error: 'Unable to load orders right now.' });
    }
  });

  app.post('/api/orders', requireAuth, async (req: AuthRequest, res: Response) => {
    try {
      const uid = req.user?.uid;
      if (!uid) return res.status(401).json({ error: 'Unauthorized' });

      const body = req.body ?? {};
      const orderNumber = String(body.orderNumber || '').trim();
      const customerName = String(body.customerName || '').trim();
      const customerPhone = String(body.customerPhone || '').trim();
      const sellerCode = String(body.sellerId || body.sellerCode || '').trim();
      const villageCode = String(body.villageId || body.villageCode || 'rampur').trim();
      const items = Array.isArray(body.items) ? body.items : [];

      if (!orderNumber || !customerName || !sellerCode || items.length === 0) {
        return res.status(400).json({ error: 'Missing required order details.' });
      }

      const created = await createOrderWithItems({
        orderNumber,
        customerUid: uid,
        customerName: customerName.slice(0, 120),
        customerPhone: (customerPhone || '0000000000').slice(0, 30),
        sellerCode,
        villageCode,
        fulfilmentMode: body.fulfilmentMode === 'PICKUP' ? 'PICKUP' : 'DELIVERY',
        deliveryAddress: body.deliveryAddress,
        deliveryNote: typeof body.deliveryNote === 'string' ? body.deliveryNote.slice(0, 300) : undefined,
        paymentMethod: String(body.paymentMethod || 'COD').slice(0, 30),
        paymentStatus: String(body.paymentStatus || 'pending').slice(0, 30),
        itemSubtotalPaise: Math.max(0, Number(body.itemSubtotalPaise) || 0),
        deliveryFeePaise: Math.max(0, Number(body.deliveryFeePaise) || 0),
        packagingFeePaise: Math.max(0, Number(body.packagingFeePaise) || 0),
        platformFeePaise: Math.max(0, Number(body.platformFeePaise) || 0),
        totalPaise: Math.max(0, Number(body.totalPaise) || 0),
        items: items.map((item: Record<string, unknown>) => ({
          productId: typeof item.productId === 'string' ? item.productId : undefined,
          productName: String(item.productName || 'Item').slice(0, 160),
          catalogueType: item.catalogueType === 'FOOD' ? 'FOOD' : 'GROCERY',
          sku: typeof item.sku === 'string' ? item.sku.slice(0, 60) : undefined,
          unitPricePaise: Math.max(0, Number(item.unitPricePaise) || 0),
          requestedQuantity: Math.max(0.001, Number(item.requestedQuantity) || 1),
          requestedUnitLabel: String(item.requestedUnitLabel || 'unit').slice(0, 40),
          lineTotalPaise: Math.max(0, Number(item.lineTotalPaise) || 0),
          customerNote:
            typeof item.customerNote === 'string' ? item.customerNote.slice(0, 200) : undefined,
        })),
      });

      res.status(201).json({ order: created });
    } catch (error) {
      console.error('Route Error POST /api/orders:', error);
      res.status(500).json({ error: 'Unable to save order right now.' });
    }
  });

  app.patch(
    '/api/orders/:orderNumber/status',
    requireAuth,
    async (req: AuthRequest, res: Response) => {
      try {
        const uid = req.user?.uid;
        const orderNumber = String(req.params.orderNumber || '').trim();
        const nextStatus = String(req.body?.status || '').trim();
        const actorRole = String(req.body?.actorRole || 'CUSTOMER').trim();
        const reason = typeof req.body?.reason === 'string' ? req.body.reason.slice(0, 250) : undefined;

        if (!uid || !orderNumber || !ALLOWED_ORDER_STATUSES.has(nextStatus)) {
          return res.status(400).json({ error: 'Invalid order status transition request.' });
        }

        const updated = await transitionOrderStatus({
          orderNumber,
          nextStatus,
          actorRole,
          actorUid: uid,
          reason,
        });

        if (!updated) {
          return res.status(404).json({ error: 'Order not found.' });
        }

        res.json({ order: updated });
      } catch (error) {
        console.error('Route Error PATCH /api/orders/:orderNumber/status:', error);
        res.status(500).json({ error: 'Unable to update order status.' });
      }
    }
  );

  app.get('/api/udhari/:sellerCode', requireAuth, async (req: AuthRequest, res: Response) => {
    try {
      const sellerCode = String(req.params.sellerCode || '').trim();
      if (!sellerCode) {
        return res.status(400).json({ error: 'Seller code is required.' });
      }
      const profiles = await getUdhariProfiles(sellerCode);
      res.json({ profiles });
    } catch (error) {
      console.error('Route Error GET /api/udhari/:sellerCode:', error);
      res.status(500).json({ error: 'Unable to load udhari ledger.' });
    }
  });

  app.post(
    '/api/udhari/:profileId/repayments',
    requireAuth,
    async (req: AuthRequest, res: Response) => {
      try {
        const profileId = Number(req.params.profileId);
        const amountInr = Number(req.body?.amountInr);
        const recordedBy = req.user?.email || req.user?.uid || 'seller';
        const reason = typeof req.body?.reason === 'string' ? req.body.reason.slice(0, 200) : undefined;

        if (!Number.isInteger(profileId) || profileId <= 0 || !Number.isFinite(amountInr) || amountInr <= 0) {
          return res.status(400).json({ error: 'Invalid repayment payload.' });
        }

        const updated = await recordUdhariRepayment({
          profileId,
          amountInr,
          recordedBy,
          reason,
        });

        if (!updated) {
          return res.status(404).json({ error: 'Udhari credit profile not found.' });
        }

        res.json({ profile: updated });
      } catch (error) {
        console.error('Route Error POST /api/udhari/:profileId/repayments:', error);
        res.status(500).json({ error: 'Unable to record repayment.' });
      }
    }
  );
}
