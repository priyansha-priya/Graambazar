import { Request, Response, NextFunction } from 'express';
import { DecodedIdToken } from 'firebase-admin/auth';
import { adminAuth } from '../lib/firebase-admin.ts';
import { getOrCreateUser } from '../db/queries.ts';

const ADMIN_ROLES = new Set(['SUPER_ADMIN', 'ADMIN_OPS', 'ADMIN_FINANCE', 'ADMIN_SUPPORT']);

export interface AuthRequest extends Request {
  user?: DecodedIdToken;
  dbUser?: {
    id: number;
    uid: string;
    email: string;
    displayName: string | null;
    role: string;
  };
}

export const requireAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: Missing bearer token' });
  }

  const token = authHeader.split('Bearer ')[1];
  try {
    const decodedToken = await adminAuth.verifyIdToken(token);
    req.user = decodedToken;

    if (decodedToken.uid) {
      const dbUser = await getOrCreateUser(
        decodedToken.uid,
        decodedToken.email || `${decodedToken.uid}@grambazaar.local`,
        decodedToken.name || undefined
      );
      req.dbUser = dbUser;
    }

    next();
  } catch (error) {
    console.error('Error verifying Firebase ID token:', error);
    return res.status(401).json({ error: 'Unauthorized: Invalid token' });
  }
};

export const requireAdmin = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  await requireAuth(req, res, () => {
    const role = req.dbUser?.role;
    if (!role || !ADMIN_ROLES.has(role)) {
      return res.status(403).json({ error: 'Forbidden: Admin access required' });
    }
    next();
  });
};
