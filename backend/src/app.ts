import express, { Express, NextFunction, Request, Response } from 'express';
import './config/env.ts';
import { registerHealthRoutes } from './routes/healthRoutes.ts';
import { registerPublicCatalogRoutes } from './routes/publicCatalogRoutes.ts';
import { registerAdminOpsRoutes } from './routes/adminOpsRoutes.ts';
import { registerAdminMastersRoutes } from './routes/adminMastersRoutes.ts';
import { registerAdminFinanceRoutes } from './routes/adminFinanceRoutes.ts';
import { registerAdminEngagementRoutes } from './routes/adminEngagementRoutes.ts';
import { registerPhase5Routes } from './routes/phase5Routes.ts';
import { registerSafetyQualityRoutes } from './routes/safetyQualityRoutes.ts';
import { registerSellerPortalRoutes } from './routes/sellerPortalRoutes.ts';
import { registerAppRoutes } from './routes/appRoutes.ts';

export interface CreateBackendAppOptions {
  /**
   * When true (default), unknown /api/* paths return strict JSON 404
   * so they never fall through to Vite or SPA HTML responses.
   */
  enableApiNotFound?: boolean;
}

function parseAllowedOrigins(): Set<string> {
  const raw = process.env.CORS_ORIGIN || '';
  return new Set(
    raw
      .split(',')
      .map((origin) => origin.trim())
      .filter((origin) => origin.length > 0 && origin !== '*')
  );
}

export function createBackendApp(options: CreateBackendAppOptions = {}): Express {
  const { enableApiNotFound = true } = options;
  const app = express();
  const allowedOrigins = parseAllowedOrigins();

  app.disable('x-powered-by');
  app.use(express.json({ limit: '1mb' }));

  // Allowlist-only CORS for standalone deployments when CORS_ORIGIN is configured
  if (allowedOrigins.size > 0) {
    app.use('/api', (req: Request, res: Response, next: NextFunction) => {
      const origin = req.headers.origin;
      if (origin && allowedOrigins.has(origin)) {
        res.setHeader('Access-Control-Allow-Origin', origin);
        res.setHeader('Vary', 'Origin');
        res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PATCH,PUT,DELETE,OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Authorization,Content-Type');
      }
      if (req.method === 'OPTIONS') {
        return res.status(204).end();
      }
      next();
    });
  }

  // Register modular API route groups
  registerHealthRoutes(app);
  registerPublicCatalogRoutes(app);
  registerAdminOpsRoutes(app);
  registerAdminMastersRoutes(app);
  registerAdminFinanceRoutes(app);
  registerAdminEngagementRoutes(app);
  registerPhase5Routes(app);
  registerSafetyQualityRoutes(app);
  registerSellerPortalRoutes(app);
  registerAppRoutes(app);

  // Strict JSON 404 handler for any unmatched /api/* path
  if (enableApiNotFound) {
    app.use('/api', (_req: Request, res: Response) => {
      res.status(404).json({ error: 'API endpoint not found.' });
    });
  }

  return app;
}
