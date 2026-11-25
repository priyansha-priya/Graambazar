import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import '../config/env.ts';
import * as schema from './schema.ts';

declare global {
  var _postgresPool: Pool | undefined;
}

export const createPool = () => {
  if (!global._postgresPool) {
    const portValue = process.env.SQL_PORT || process.env.PGPORT;
    const hasDiscreteConfig = Boolean(process.env.SQL_HOST || process.env.PGHOST);

    global._postgresPool = new Pool(
      hasDiscreteConfig
        ? {
            host: process.env.SQL_HOST || process.env.PGHOST,
            port: portValue ? Number(portValue) : undefined,
            user: process.env.SQL_USER || process.env.PGUSER,
            password: process.env.SQL_PASSWORD || process.env.PGPASSWORD,
            database: process.env.SQL_DB_NAME || process.env.PGDATABASE,
            max: 10,
            connectionTimeoutMillis: 15000,
          }
        : {
            connectionString: process.env.DATABASE_URL,
            max: 10,
            connectionTimeoutMillis: 15000,
          }
    );

    global._postgresPool.on('error', (err) => {
      console.error('Unexpected error on idle SQL pool client:', err);
    });
  }
  return global._postgresPool;
};

export const pool = createPool();

export const db = drizzle(pool, { schema });

export async function closeDatabasePool(): Promise<void> {
  if (global._postgresPool) {
    const activePool = global._postgresPool;
    global._postgresPool = undefined;
    await activePool.end();
  }
}
