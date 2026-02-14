import type { ObjectId } from 'mongodb';

/** Admin role; maps to permissions in lib/permissions.ts */
export type AdminRole = 'super_admin' | 'admin' | 'editor';

export interface Admin {
  _id?: ObjectId;
  email: string;
  passwordHash: string;
  role?: AdminRole;
  /** Per-admin tab visibility (only for non–super_admin). Super_admin always sees all. */
  visibleTabs?: string[];
  createdAt: Date;
}

/** Password reset: stored hashed; raw token sent in email only. */
export interface PasswordResetToken {
  _id?: ObjectId;
  adminId: ObjectId;
  tokenHash: string;
  expiresAt: Date;
  createdAt: Date;
}

export interface JwtPayload {
  sub: string;
  email: string;
  role?: AdminRole;
  iat?: number;
  exp?: number;
}

/** Blog post */
export interface Blog {
  _id?: ObjectId;
  slug: string;
  title: string;
  excerpt?: string;
  heroImage: string;
  authorName: string;
  authorImage?: string;
  tags?: string[];
  publishedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

/** Case study */
export interface CaseStudy {
  _id?: ObjectId;
  slug: string;
  title: string;
  description: string;
  image: string;
  order?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

/** Event */
export interface Event {
  _id?: ObjectId;
  slug: string;
  title: string;
  description: string;
  image: string;
  eventDate?: string;
  location?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

/** Sub-product under a product */
export interface SubProduct {
  slug: string;
  title: string;
  description: string;
  image: string;
}

/** Product (acoustic panels, etc.) */
export interface Product {
  _id?: ObjectId;
  slug: string;
  title: string;
  description: string;
  image: string;
  heroImage?: string;
  subProducts: SubProduct[];
  order?: number;
  createdAt?: Date;
  updatedAt?: Date;
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
