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
  /** Optional short tagline shown under category name */
  tagline?: string;
  /** SEO meta title (falls back to name if empty) */
  metaTitle?: string;
  /** SEO meta description */
  metaDescription?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

/** Grid intro block (title, subtitle, body) for sub-product page */
export interface SubProductGridIntro {
  title?: string;
  subtitle?: string;
  body?: string;
}

/** Single image in grid section */
export interface SubProductGridImage {
  url: string;
  alt?: string;
}

/** Single spec row (label / value) */
export interface SubProductSpec {
  label: string;
  value: string;
}

/** Gallery slide (large + small image) */
export interface SubProductGallerySlide {
  large: string;
  small: string;
}

/** Gallery image (single image; UI derives large/small layout) */
export interface SubProductGalleryImage {
  url: string;
  alt?: string;
}

/** Single profile option in the \"Product Profiles\" section */
export interface SubProductProfile {
  /** Identifier used in UI (e.g. \"1-5x8x8\") */
  id?: string;
  /** Display name of the profile (e.g. \"1.5/8x8\") */
  name: string;
  /** Optional size text (e.g. \"30 x 30 cm\") */
  size?: string;
  /** Optional description or notes */
  description?: string;
  /** Image URL used for the preview / swatch */
  image?: string;
}

/** Group of profiles plus heading text */
export interface SubProductProfilesSection {
  title?: string;
  description?: string;
  profiles?: SubProductProfile[];
}

/** Single substrate option shown in the \"Substrates\" slider */
export interface SubProductSubstrateItem {
  name: string;
  /** Thicknesses or size text, e.g. \"12, 16, 18mm\" */
  thickness?: string;
  description?: string;
  image?: string;
}

/** Substrates section (title, copy, list of substrate items) */
export interface SubProductSubstratesSection {
  title?: string;
  description?: string;
  items?: SubProductSubstrateItem[];
}

/** One tab in the \"About the product\" area (e.g. Advantages, Key Features) */
export interface SubProductAboutTab {
  /** Stable key for the tab (e.g. \"advantages\") */
  key: string;
  /** Label shown in the tab header */
  title: string;
  /** Bullet rows shown inside the tab */
  rows: string[];
}

/** Single certification logo row */
export interface SubProductCertification {
  name: string;
  image: string;
  description?: string;
}

/** Single finish / shade swatch */
export interface SubProductFinishShade {
  name: string;
  description?: string;
  image: string;
}

/** Finishes & shades section (title, copy, list of swatches) */
export interface SubProductFinishesSection {
  title?: string;
  description?: string;
  items?: SubProductFinishShade[];
}

/** Sub-product under a product */
export interface SubProduct {
  /** Stable id for admin references (stored as string ObjectId) */
  id?: string;
  slug: string;
  title: string;
  description: string;
  image: string;
  /** Optional intro block for grid section (title, subtitle, body) */
  gridIntro?: SubProductGridIntro;
  /** Images for grid section (e.g. 3: right small, left small, right big) */
  gridImages?: SubProductGridImage[];
  /** Long description in spec section */
  specDescription?: string;
  /** Spec rows (label / value) */
  specs?: SubProductSpec[];
  /** Gallery slides (each has large + small image) */
  gallerySlides?: SubProductGallerySlide[];
  /** Gallery images (preferred). Use this; UI derives large/small layout. */
  galleryImages?: SubProductGalleryImage[];
  /** Product profiles section (3D preview + profile options) */
  profilesSection?: SubProductProfilesSection;
  /** Substrates carousel */
  substratesSection?: SubProductSubstratesSection;
  /** Tabs under \"About the product\" */
  aboutTabs?: SubProductAboutTab[];
  /** Certifications row */
  certifications?: SubProductCertification[];
  /** Finishes & shades slider */
  finishesSection?: SubProductFinishesSection;
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
  /** Optional heading for the "Our Acoustic Panels" section on the product page */
  panelsSectionTitle?: string;
  /** Optional body copy for the panels section */
  panelsSectionDescription?: string;
  /** Short teaser for cards (falls back to description excerpt if empty) */
  shortDescription?: string;
  /** SEO meta title (falls back to title if empty) */
  metaTitle?: string;
  /** SEO meta description */
  metaDescription?: string;
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

/** Footer link item (services / resources columns) */
export interface FooterLink {
  _id?: ObjectId;
  section: 'services' | 'resources';
  label: string;
  href?: string;
  order?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

/** Office location card on the contact page */
export interface Location {
  _id?: ObjectId;
  title: string;
  highlight?: boolean;
  items: { label: string; value: string }[];
  order?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

/** Trusted partner logo shown on the contact page "Trusted By" section */
export interface TrustedPartner {
  _id?: ObjectId;
  name: string;
  logo: string;
  order?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

/** FAQ item shown on home and contact pages */
export interface Faq {
  _id?: ObjectId;
  question: string;
  answer: string;
  order?: number;
  isPublished?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
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
