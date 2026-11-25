import type { Express, Request, Response } from 'express';
import { pool } from '../db/index.ts';

export function registerHealthRoutes(app: Express): void {
  app.get('/api/health', async (_req: Request, res: Response) => {
    const timestamp = new Date().toISOString();
    try {
      await pool.query('SELECT 1');
      res.status(200).json({
        status: 'ok',
        service: 'grambazaar-backend',
        database: 'connected',
        timestamp,
      });
    } catch (error) {
      console.error('Health check database probe failed:', error);
      res.status(503).json({
        status: 'degraded',
        service: 'grambazaar-backend',
        database: 'unavailable',
        timestamp,
      });
    }
  });
}
