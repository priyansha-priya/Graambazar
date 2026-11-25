import './config/env.ts';
import { createBackendApp } from './app.ts';
import { closeDatabasePool } from './db/index.ts';

const PORT = Number(process.env.PORT) || 4000;
const app = createBackendApp();

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`GramBazaar standalone backend running on http://0.0.0.0:${PORT}`);
});

const shutdown = async (signal: string) => {
  console.log(`Received ${signal}, shutting down GramBazaar backend cleanly...`);
  server.close(async () => {
    try {
      await closeDatabasePool();
    } finally {
      process.exit(0);
    }
  });
};

process.on('SIGINT', () => void shutdown('SIGINT'));
process.on('SIGTERM', () => void shutdown('SIGTERM'));
