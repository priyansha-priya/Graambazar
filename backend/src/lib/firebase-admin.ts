import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { initializeApp, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import '../config/env.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function resolveFirebaseProjectId(): string | undefined {
  if (process.env.FIREBASE_PROJECT_ID?.trim()) {
    return process.env.FIREBASE_PROJECT_ID.trim();
  }

  const backendRoot = path.resolve(__dirname, '../..');
  const repoRoot = path.resolve(backendRoot, '..');
  const configCandidates = [
    path.join(backendRoot, 'firebase-applet-config.json'),
    path.join(repoRoot, 'firebase-applet-config.json'),
  ];

  for (const configPath of configCandidates) {
    if (fs.existsSync(configPath)) {
      try {
        const parsed = JSON.parse(fs.readFileSync(configPath, 'utf8')) as {
          projectId?: string;
        };
        if (parsed.projectId?.trim()) {
          return parsed.projectId.trim();
        }
      } catch (error) {
        console.error(`Unable to parse Firebase config at ${configPath}:`, error);
      }
    }
  }

  return undefined;
}

if (!getApps().length) {
  const projectId = resolveFirebaseProjectId();
  initializeApp(projectId ? { projectId } : undefined);
}

export const adminAuth = getAuth();
