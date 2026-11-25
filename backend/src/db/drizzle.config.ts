import { defineConfig } from 'drizzle-kit';
import '../config/env.ts';

const hasDiscreteConfig = Boolean(process.env.SQL_HOST || process.env.PGHOST);

export default defineConfig({
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: hasDiscreteConfig
    ? {
        host: process.env.SQL_HOST || process.env.PGHOST || '127.0.0.1',
        port: Number(process.env.SQL_PORT || process.env.PGPORT || 5432),
        user: process.env.SQL_USER || process.env.PGUSER || 'postgres',
        password: process.env.SQL_PASSWORD || process.env.PGPASSWORD || '',
        database: process.env.SQL_DB_NAME || process.env.PGDATABASE || 'grambazaar',
      }
    : {
        url: process.env.DATABASE_URL || '',
      },
});
