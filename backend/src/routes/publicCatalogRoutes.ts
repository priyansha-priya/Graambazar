import type { Express, Request, Response } from 'express';
import { getSellerInventory, getSellers, getVillages } from '../db/queries.ts';
import {
  listAdminCategories,
  listAdminProducts,
  listAdminSellers,
} from '../db/adminQueries.ts';
import {
  listAdminInterVillageRoutes,
  listAdminServiceAreas,
} from '../db/adminOpsQueries.ts';

export function registerPublicCatalogRoutes(app: Express): void {
  app.get('/api/catalog/villages', async (_req: Request, res: Response) => {
    try {
      const data = await getVillages();
      res.json({ villages: data });
    } catch (error) {
      console.error('Route Error GET /api/catalog/villages:', error);
      res.status(500).json({ error: 'Unable to load villages right now.' });
    }
  });

  app.get('/api/catalog/sellers', async (_req: Request, res: Response) => {
    try {
      const data = await getSellers();
      res.json({ sellers: data });
    } catch (error) {
      console.error('Route Error GET /api/catalog/sellers:', error);
      res.status(500).json({ error: 'Unable to load sellers right now.' });
    }
  });

  app.get('/api/catalog/inventory/:sellerCode', async (req: Request, res: Response) => {
    try {
      const sellerCode = String(req.params.sellerCode || '').trim();
      if (!sellerCode || sellerCode.length > 80) {
        return res.status(400).json({ error: 'Invalid seller identifier.' });
      }
      const items = await getSellerInventory(sellerCode);
      res.json({ items });
    } catch (error) {
      console.error('Route Error GET /api/catalog/inventory:', error);
      res.status(500).json({ error: 'Unable to load store inventory right now.' });
    }
  });

  app.get('/api/catalog/categories', async (_req: Request, res: Response) => {
    try {
      const categories = await listAdminCategories();
      res.json({ categories });
    } catch (error) {
      console.error('Route Error GET /api/catalog/categories:', error);
      res.status(500).json({ error: 'Unable to load categories right now.' });
    }
  });

  app.get('/api/catalog/products', async (_req: Request, res: Response) => {
    try {
      const products = await listAdminProducts();
      res.json({ products });
    } catch (error) {
      console.error('Route Error GET /api/catalog/products:', error);
      res.status(500).json({ error: 'Unable to load products right now.' });
    }
  });

  app.get('/api/catalog/admin-sellers', async (_req: Request, res: Response) => {
    try {
      const sellers = await listAdminSellers(false);
      res.json({ sellers });
    } catch (error) {
      console.error('Route Error GET /api/catalog/admin-sellers:', error);
      res.status(500).json({ error: 'Unable to load seller directory right now.' });
    }
  });

  app.get('/api/catalog/service-areas', async (_req: Request, res: Response) => {
    try {
      const serviceAreas = await listAdminServiceAreas();
      res.json({ serviceAreas });
    } catch (error) {
      console.error('Route Error GET /api/catalog/service-areas:', error);
      res.status(500).json({ error: 'Unable to load service areas right now.' });
    }
  });

  app.get('/api/catalog/routes', async (_req: Request, res: Response) => {
    try {
      const routes = await listAdminInterVillageRoutes();
      res.json({ routes });
    } catch (error) {
      console.error('Route Error GET /api/catalog/routes:', error);
      res.status(500).json({ error: 'Unable to load inter-village routes right now.' });
    }
  });
}
