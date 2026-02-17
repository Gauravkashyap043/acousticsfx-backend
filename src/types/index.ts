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
  /** HTML body for detail page */
  content?: string;
  heroImage: string;
  authorId?: string;
  authorName: string;
  authorEmail?: string;
  authorImage?: string;
  metaDescription?: string;
  tags?: string[];
  isPublished?: boolean;
  views?: number;
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

/** Testimonial (customer quote for home page) */
export interface Testimonial {
  _id?: ObjectId;
  company: string;
  companyLogo: string;
  text: string;
  name: string;
  role: string;
  avatar: string;
  order?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

/** Product category (e.g. Acoustic Solutions, Flooring, Noise) – used for /products/:categorySlug */
export interface ProductCategory {
  _id?: ObjectId;
  slug: string;
  name: string;
  description?: string;
  image?: string;
  order?: number;
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

/** Product (acoustic panels, etc.) – belongs to a category via categorySlug */
export interface Product {
  _id?: ObjectId;
  slug: string;
  title: string;
  description: string;
  image: string;
  heroImage?: string;
  subProducts: SubProduct[];
  /** Category slug (e.g. "acoustic") for filtering and URL structure */
  categorySlug?: string;
  order?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

/** Contact form submission from the public site */
export interface ContactSubmission {
  _id?: ObjectId;
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
  createdAt: Date;
}

/** Newsletter signup from the public site */
export interface NewsletterSubscription {
  _id?: ObjectId;
  email: string;
  createdAt: Date;
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

/** Client logo shown on the "Our Valuable Clients" section */
export interface ClientLogo {
  _id?: ObjectId;
  name: string;
  logo: string;
  order?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

declare global {
  namespace Express {
    interface Request {
      admin?: { id: string; email: string; role?: AdminRole };
    }
  }
}
