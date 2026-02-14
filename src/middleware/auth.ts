import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import type { JwtPayload } from '../types/index.js';
import { can } from '../lib/permissions.js';

/**
 * Verifies Bearer JWT and sets req.admin (id, email, role).
 * Responds 401 if missing or invalid token.
 */
export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as JwtPayload;
    req.admin = {
      id: decoded.sub,
      email: decoded.email,
      role: decoded.role,
    };
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}

/**
 * Must be used after requireAuth. Responds 403 if req.admin.role cannot perform the permission.
 */
export function requirePermission(permission: string) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const role = req.admin?.role;
    if (!can(role, permission)) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }
    next();
  };
}
