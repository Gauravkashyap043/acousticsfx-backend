import type { ObjectId } from 'mongodb';

/** Admin role; maps to permissions in lib/permissions.ts */
export type AdminRole = 'super_admin' | 'admin' | 'editor';

export interface Admin {
  _id?: ObjectId;
  email: string;
  passwordHash: string;
  role?: AdminRole;
  createdAt: Date;
}

export interface JwtPayload {
  sub: string;
  email: string;
  role?: AdminRole;
  iat?: number;
  exp?: number;
}

/** Site content entry: key-value with optional type and audit fields */
export type ContentType = 'text' | 'image';

export interface Content {
  _id?: ObjectId;
  key: string;
  value: string;
  type?: ContentType;
  updatedAt?: Date;
  updatedBy?: string;
}

declare global {
  namespace Express {
    interface Request {
      admin?: { id: string; email: string; role?: AdminRole };
    }
  }
}
