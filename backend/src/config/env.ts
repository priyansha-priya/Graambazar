import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let envLoaded = false;

/**
 * Loads environment variables in safe fallback order without overwriting
 * variables already injected by the hosting runtime (e.g. Cloud SQL env vars):
 *   1. backend/.env
 *   2. <repo-root>/.env.local
 *   3. <repo-root>/.env
 */
export function loadBackendEnv(): void {
  if (envLoaded) return;
  envLoaded = true;

  const backendRoot = path.resolve(__dirname, '../..');
  const repoRoot = path.resolve(backendRoot, '..');

  const candidates = [
    path.join(backendRoot, '.env'),
    path.join(repoRoot, '.env.local'),
    path.join(repoRoot, '.env'),
  ];

  for (const envPath of candidates) {
    if (fs.existsSync(envPath)) {
      dotenv.config({ path: envPath, override: false });
    }
  }
}

loadBackendEnv();
