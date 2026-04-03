import { Request, Response } from 'express';
import { ObjectId } from 'mongodb';
import { getProductCollection } from '../models/Product.js';
import { getCategoryCollection } from '../models/Category.js';
import type {
  Product,
  ProductCategory,
  SubProductSpec,
  SubProductGallerySlide,
  SubProductGalleryImage,
  SubProductProfilesSection,
  SubProductSubstratesSection,
  SubProductAboutTab,
  SubProductCertification,
  SubProductFinishesSection,
  VisualizerTexture,
  VisualizerDimensions,
} from '../types/index.js';

const SLUG_REGEX = /^[a-zA-Z0-9-]+$/;

function validateSlug(s: unknown): string | null {
  if (typeof s !== 'string' || !s.trim()) return null;
  return SLUG_REGEX.test(s) ? s.trim() : null;
}

/** Escape string for safe use in RegExp (slug is [a-zA-Z0-9-] only; kept for clarity). */
function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * URL segments like "Acoustics" or "ACOUSTIC" that should map to the canonical DB slug.
 * Vercel/Linux uses case-sensitive paths; Mongo slug match is exact — this bridges common mistakes.
 */
const CATEGORY_SLUG_ALIASES: Record<string, string> = {
  acoustics: 'acoustic',
};

/** Resolve public category URL segment to a category document (canonical slug may differ). */
async function findCategoryBySlugParam(slugParam: string): Promise<ProductCategory | null> {
  const catColl = getCategoryCollection();
  const key = slugParam.toLowerCase();
  const preferred = CATEGORY_SLUG_ALIASES[key] ?? key;

  let doc = await catColl.findOne({ slug: preferred });
  if (doc) return doc as ProductCategory;

  doc = await catColl.findOne({ slug: slugParam });
  if (doc) return doc as ProductCategory;

  const re = new RegExp(`^${escapeRegex(slugParam)}$`, 'i');
  doc = await catColl.findOne({ slug: { $regex: re } });
  return doc ? (doc as ProductCategory) : null;
}

function validateSpec(raw: unknown): SubProductSpec | null {
  if (!raw || typeof raw !== 'object') return null;
  const o = raw as Record<string, unknown>;
  const label = typeof o.label === 'string' ? o.label.trim() : '';
  const value = typeof o.value === 'string' ? o.value.trim() : '';
  if (!label && !value) return null;
  return { label: label || '—', value: value || '—' };
}

function validateGallerySlide(raw: unknown): SubProductGallerySlide | null {
  if (!raw || typeof raw !== 'object') return null;
  const o = raw as Record<string, unknown>;
  const large = typeof o.large === 'string' && o.large.trim() ? o.large.trim() : '';
  const small = typeof o.small === 'string' && o.small.trim() ? o.small.trim() : '';
  if (!large || !small) return null;
  return { large, small };
}

function validateGalleryImage(raw: unknown): SubProductGalleryImage | null {
  if (!raw || typeof raw !== 'object') return null;
  const o = raw as Record<string, unknown>;
  const url = typeof o.url === 'string' && o.url.trim() ? o.url.trim() : '';
  if (!url) return null;
  const alt = typeof o.alt === 'string' ? o.alt.trim() || undefined : undefined;
  return { url, alt };
}

function validateProfilesSection(raw: unknown): SubProductProfilesSection | undefined {
  if (!raw || typeof raw !== 'object') return undefined;
  const o = raw as Record<string, unknown>;
  const title = typeof o.title === 'string' ? o.title.trim() || undefined : undefined;
  const description = typeof o.description === 'string' ? o.description.trim() || undefined : undefined;
  let profiles: SubProductProfilesSection['profiles'];
  if (Array.isArray(o.profiles)) {
    profiles = o.profiles
      .filter((p) => p && typeof p === 'object')
      .map((p) => {
        const po = p as Record<string, unknown>;
        const name = typeof po.name === 'string' ? po.name.trim() : '';
        if (!name) return null;
        return {
          id: typeof po.id === 'string' ? po.id.trim() || undefined : undefined,
          name,
          size: typeof po.size === 'string' ? po.size.trim() || undefined : undefined,
          description: typeof po.description === 'string' ? po.description.trim() || undefined : undefined,
          image: typeof po.image === 'string' ? po.image.trim() || undefined : undefined,
        };
      })
      .filter((p): p is NonNullable<typeof p> => !!p);
    if (!profiles.length) profiles = undefined;
  }
  if (!title && !description && !profiles) return undefined;
  return { title, description, profiles };
}

function validateSubstratesSection(raw: unknown): SubProductSubstratesSection | undefined {
  if (!raw || typeof raw !== 'object') return undefined;
  const o = raw as Record<string, unknown>;
  const title = typeof o.title === 'string' ? o.title.trim() || undefined : undefined;
  const description = typeof o.description === 'string' ? o.description.trim() || undefined : undefined;
  let items: SubProductSubstratesSection['items'];
  if (Array.isArray(o.items)) {
    items = o.items
      .filter((p) => p && typeof p === 'object')
      .map((p) => {
        const po = p as Record<string, unknown>;
        const name = typeof po.name === 'string' ? po.name.trim() : '';
        if (!name) return null;
        return {
          name,
          thickness: typeof po.thickness === 'string' ? po.thickness.trim() || undefined : undefined,
          description: typeof po.description === 'string' ? po.description.trim() || undefined : undefined,
          image: typeof po.image === 'string' ? po.image.trim() || undefined : undefined,
        };
      })
      .filter((p): p is NonNullable<typeof p> => !!p);
    if (!items.length) items = undefined;
  }
  if (!title && !description && !items) return undefined;
  return { title, description, items };
}

function validateAboutTabs(raw: unknown): SubProductAboutTab[] | undefined {
  if (!Array.isArray(raw)) return undefined;
  const tabs: SubProductAboutTab[] = [];
  for (const t of raw) {
    if (!t || typeof t !== 'object') continue;
    const o = t as Record<string, unknown>;
    const key = typeof o.key === 'string' ? o.key.trim() : '';
    const title = typeof o.title === 'string' ? o.title.trim() : '';
    const rowsRaw = Array.isArray(o.rows) ? o.rows : [];
    const rows = rowsRaw
      .filter((r) => typeof r === 'string' && r.trim())
      .map((r) => (r as string).trim());
    if (!key || !title || !rows.length) continue;
    tabs.push({ key, title, rows });
  }
  return tabs.length ? tabs : undefined;
}

function validateCertifications(raw: unknown): SubProductCertification[] | undefined {
  if (!Array.isArray(raw)) return undefined;
  const items: SubProductCertification[] = [];
  for (const c of raw) {
    if (!c || typeof c !== 'object') continue;
    const o = c as Record<string, unknown>;
    const name = typeof o.name === 'string' ? o.name.trim() : '';
    const image = typeof o.image === 'string' ? o.image.trim() : '';
    if (!name || !image) continue;
    const description = typeof o.description === 'string' ? o.description.trim() || undefined : undefined;
    items.push({ name, image, description });
  }
  return items.length ? items : undefined;
}

function validateFinishesSection(raw: unknown): SubProductFinishesSection | undefined {
  if (!raw || typeof raw !== 'object') return undefined;
  const o = raw as Record<string, unknown>;
  const title = typeof o.title === 'string' ? o.title.trim() || undefined : undefined;
  const description = typeof o.description === 'string' ? o.description.trim() || undefined : undefined;
  let items: SubProductFinishesSection['items'];
  if (Array.isArray(o.items)) {
    items = o.items
      .filter((p) => p && typeof p === 'object')
      .map((p) => {
        const po = p as Record<string, unknown>;
        const name = typeof po.name === 'string' ? po.name.trim() : '';
        const image = typeof po.image === 'string' ? po.image.trim() : '';
        if (!name || !image) return null;
        return {
          name,
          image,
          description: typeof po.description === 'string' ? po.description.trim() || undefined : undefined,
        };
      })
      .filter((p): p is NonNullable<typeof p> => !!p);
    if (!items.length) items = undefined;
  }
  if (!title && !description && !items) return undefined;
  return { title, description, items };
}

/** Common slug typo from older content */
function normalizeProductSlug(slug: string): string {
  return slug === 'linerlux' ? 'linearlux' : slug;
}

/** Optional detail sections (specs, gallery, profiles, …) from request body */
function applyRichProductFields(
  o: Record<string, unknown>,
  doc: Omit<Product, '_id' | 'createdAt' | 'updatedAt'>
): void {
  if ('specSectionTitle' in o) {
    const t = typeof o.specSectionTitle === 'string' ? o.specSectionTitle.trim() : '';
    doc.specSectionTitle = t || undefined;
  }

  const specDescription =
    typeof o.specDescription === 'string' && o.specDescription.trim()
      ? o.specDescription.trim()
      : undefined;
  if (specDescription) doc.specDescription = specDescription;

  if ('specs' in o && Array.isArray(o.specs)) {
    const specs: SubProductSpec[] = [];
    for (const item of o.specs) {
      const spec = validateSpec(item);
      if (spec) specs.push(spec);
    }
    doc.specs = specs;
  }

  if ('gallerySlides' in o && Array.isArray(o.gallerySlides)) {
    const gallerySlides: SubProductGallerySlide[] = [];
    for (const item of o.gallerySlides) {
      const slide = validateGallerySlide(item);
      if (slide) gallerySlides.push(slide);
    }
    doc.gallerySlides = gallerySlides;
  }

  if ('galleryImages' in o && Array.isArray(o.galleryImages)) {
    const galleryImages: SubProductGalleryImage[] = [];
    for (const item of o.galleryImages) {
      const img = validateGalleryImage(item);
      if (img) galleryImages.push(img);
    }
    doc.galleryImages = galleryImages;
  } else if (doc.gallerySlides && doc.gallerySlides.length > 0) {
    const derived: SubProductGalleryImage[] = [];
    for (const s of doc.gallerySlides) {
      if (s.large) derived.push({ url: s.large });
      if (s.small && s.small !== s.large) derived.push({ url: s.small });
    }
    if (derived.length) doc.galleryImages = derived;
  }

  if ('profilesSection' in o) {
    const profilesSection = validateProfilesSection(o.profilesSection);
    if (profilesSection) doc.profilesSection = profilesSection;
    else delete doc.profilesSection;
  }

  if ('substratesSection' in o) {
    const substratesSection = validateSubstratesSection(o.substratesSection);
    if (substratesSection) doc.substratesSection = substratesSection;
    else delete doc.substratesSection;
  }

  if ('aboutTabs' in o) {
    const aboutTabs = validateAboutTabs(o.aboutTabs);
    if (aboutTabs) doc.aboutTabs = aboutTabs;
    else delete doc.aboutTabs;
  }

  if ('certificationsSectionTitle' in o) {
    const t = typeof o.certificationsSectionTitle === 'string' ? o.certificationsSectionTitle.trim() : '';
    doc.certificationsSectionTitle = t || undefined;
  }
  if ('certificationsSectionDescription' in o) {
    const t =
      typeof o.certificationsSectionDescription === 'string'
        ? o.certificationsSectionDescription.trim()
        : '';
    doc.certificationsSectionDescription = t || undefined;
  }

  if ('certifications' in o && Array.isArray(o.certifications)) {
    const certifications = validateCertifications(o.certifications);
    doc.certifications = certifications && certifications.length > 0 ? certifications : [];
  }

  if ('finishesSection' in o) {
    const finishesSection = validateFinishesSection(o.finishesSection);
    if (finishesSection) doc.finishesSection = finishesSection;
    else delete doc.finishesSection;
  }

  if ('visualizerDimensions' in o && o.visualizerDimensions && typeof o.visualizerDimensions === 'object') {
    const vd = o.visualizerDimensions as Record<string, unknown>;
    doc.visualizerDimensions = {
      width: typeof vd.width === 'number' ? vd.width : 120,
      height: typeof vd.height === 'number' ? vd.height : 60,
      depth: typeof vd.depth === 'number' ? vd.depth : 4,
    };
  }

  if ('visualizerTextures' in o && Array.isArray(o.visualizerTextures)) {
    const textures: VisualizerTexture[] = [];
    for (const item of o.visualizerTextures) {
      if (item && typeof item === 'object') {
        const to = item as Record<string, unknown>;
        const name = typeof to.name === 'string' ? to.name.trim() : '';
        const image = typeof to.image === 'string' ? to.image.trim() : '';
        if (name && image) {
          textures.push({ name, image });
        }
      }
    }
    doc.visualizerTextures = textures;
  }
}

function validateProductDocument(
  body: Record<string, unknown>
): Omit<Product, '_id' | 'createdAt' | 'updatedAt'> | { error: string } {
  const slugRaw = validateSlug(body.slug);
  if (!slugRaw) return { error: 'slug is required and must be alphanumeric with hyphens' };
  const slug = normalizeProductSlug(slugRaw);
  const title = typeof body.title === 'string' && body.title.trim() ? body.title.trim() : null;
  if (!title) return { error: 'title is required' };
  const description = typeof body.description === 'string' ? body.description.trim() : '';
  const image = typeof body.image === 'string' && body.image.trim() ? body.image.trim() : '';
  if (!image) return { error: 'image is required' };
  const heroImage = typeof body.heroImage === 'string' && body.heroImage.trim() ? body.heroImage.trim() : undefined;
  const order = typeof body.order === 'number' ? body.order : 0;
  const categorySlug = validateSlug(body.categorySlug) ?? undefined;
  const shortDescription =
    typeof body.shortDescription === 'string' ? body.shortDescription.trim() || undefined : undefined;
  const metaTitle = typeof body.metaTitle === 'string' ? body.metaTitle.trim() || undefined : undefined;
  const metaDescription =
    typeof body.metaDescription === 'string' ? body.metaDescription.trim() || undefined : undefined;
  const showTrademark = body.showTrademark === true;

  const doc: Omit<Product, '_id' | 'createdAt' | 'updatedAt'> = {
    slug,
    title,
    description,
    image,
    heroImage,
    order,
    categorySlug,
    shortDescription,
    metaTitle,
    metaDescription,
    showTrademark,
  };

  applyRichProductFields(body, doc);
  return doc;
}

function productToPublicSummary(p: Product) {
  return {
    slug: p.slug,
    title: p.title,
    description: p.description,
    image: p.image,
    heroImage: p.heroImage,
    categorySlug: p.categorySlug,
    showTrademark: p.showTrademark === true,
    shortDescription: p.shortDescription,
    metaTitle: p.metaTitle,
    metaDescription: p.metaDescription,
  };
}

function productToPublicFull(p: Product) {
  return {
    ...productToPublicSummary(p),
    specSectionTitle: p.specSectionTitle,
    specDescription: p.specDescription,
    specs: p.specs,
    gallerySlides: p.gallerySlides,
    galleryImages: p.galleryImages,
    profilesSection: p.profilesSection,
    substratesSection: p.substratesSection,
    aboutTabs: p.aboutTabs,
    certificationsSectionTitle: p.certificationsSectionTitle,
    certificationsSectionDescription: p.certificationsSectionDescription,
    certifications: p.certifications,
    finishesSection: p.finishesSection,
    visualizerTextures: p.visualizerTextures,
    visualizerDimensions: p.visualizerDimensions,
  };
}

function productToAdminItem(p: Product) {
  return {
    _id: p._id?.toString(),
    order: p.order ?? 0,
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
    ...productToPublicFull(p),
  };
}

/** Public: GET /api/products – all products (optional ?category=acoustic). No _id in response. */
export async function listProducts(req: Request, res: Response): Promise<void> {
  try {
    const rawCategory = validateSlug(req.query['category'] as string) ?? undefined;
    const coll = getProductCollection();
    let filter: Record<string, string> = {};
    if (rawCategory) {
      const cat = await findCategoryBySlugParam(rawCategory);
      filter = { categorySlug: cat?.slug ?? rawCategory };
    }
    const products = await coll.find(filter).sort({ order: 1, slug: 1 }).toArray();
    const normalized = products.map((p) => productToPublicSummary(p));
    res.json({ products: normalized });
  } catch (err) {
    console.error('listProducts error:', err);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
}

/** Public: GET /api/products/categories – list all categories for nav / products overview. */
export async function listCategories(req: Request, res: Response): Promise<void> {
  try {
    const coll = getCategoryCollection();
    const categories = await coll.find({}).sort({ order: 1, slug: 1 }).toArray();
    const normalized = categories.map((c) => ({
      slug: c.slug,
      name: c.name,
      description: c.description,
      image: c.image,
      order: c.order ?? 0,
      tagline: c.tagline,
      metaTitle: c.metaTitle,
      metaDescription: c.metaDescription,
    }));
    res.json({ categories: normalized });
  } catch (err) {
    console.error('listCategories error:', err);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
}

/** Public: GET /api/products/categories/:categorySlug – category details + products in that category. */
export async function getCategoryBySlug(req: Request, res: Response): Promise<void> {
  try {
    const slug = validateSlug(req.params['categorySlug']);
    if (!slug) {
      res.status(400).json({ error: 'Invalid category slug' });
      return;
    }
    const productColl = getProductCollection();
    const category = await findCategoryBySlugParam(slug);
    if (!category) {
      res.status(404).json({ error: 'Category not found' });
      return;
    }
    const canonicalSlug = category.slug;
    const products = await productColl
      .find({ categorySlug: canonicalSlug })
      .sort({ order: 1, slug: 1 })
      .toArray();
    const normalizedProducts = products.map((p) => productToPublicSummary(p));
    res.json({
      category: {
        slug: category.slug,
        name: category.name,
        description: category.description,
        image: category.image,
        order: category.order ?? 0,
        tagline: category.tagline,
        metaTitle: category.metaTitle,
        metaDescription: category.metaDescription,
      },
      products: normalizedProducts,
    });
  } catch (err) {
    console.error('getCategoryBySlug error:', err);
    res.status(500).json({ error: 'Failed to fetch category' });
  }
}

/** Public: GET /api/products/slug/:productSlug – single product details by slug (for /products/:category/:productSlug). */
export async function getProductBySlug(req: Request, res: Response): Promise<void> {
  try {
    const slugRaw = validateSlug(req.params['productSlug']);
    if (!slugRaw) {
      res.status(400).json({ error: 'Invalid product slug' });
      return;
    }
    const slug = normalizeProductSlug(slugRaw);
    const coll = getProductCollection();
    const product = await coll.findOne({ slug });
    if (!product) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }
    res.json(productToPublicFull(product));
  } catch (err) {
    console.error('getProductBySlug error:', err);
    res.status(500).json({ error: 'Failed to fetch product' });
  }
}

/** Admin: GET /api/admin/products – list with _id for editing */
export async function listProductsAdmin(req: Request, res: Response): Promise<void> {
  try {
    const coll = getProductCollection();
    const products = await coll.find({}).sort({ order: 1, slug: 1 }).toArray();
    res.json({
      items: products.map((p) => productToAdminItem(p)),
    });
  } catch (err) {
    console.error('listProductsAdmin error:', err);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
}

/** Admin: POST /api/admin/products */
export async function createProduct(req: Request, res: Response): Promise<void> {
  try {
    const parsed = validateProductDocument(req.body as Record<string, unknown>);
    if ('error' in parsed) {
      res.status(400).json({ error: parsed.error });
      return;
    }
    const coll = getProductCollection();
    const existing = await coll.findOne({ slug: parsed.slug });
    if (existing) {
      res.status(400).json({ error: 'A product with this slug already exists' });
      return;
    }
    const now = new Date();
    const doc = {
      ...parsed,
      createdAt: now,
      updatedAt: now,
    } as Product;
    const result = await coll.insertOne(doc as Product);
    const inserted = await coll.findOne({ _id: result.insertedId });
    res.status(201).json(inserted ? productToAdminItem(inserted) : null);
  } catch (err) {
    console.error('createProduct error:', err);
    res.status(500).json({ error: 'Failed to create product' });
  }
}

/** Admin: PUT /api/admin/products/:id */
export async function updateProduct(req: Request, res: Response): Promise<void> {
  try {
    const id = typeof req.params['id'] === 'string' ? req.params['id'] : '';
    if (!id || !ObjectId.isValid(id)) {
      res.status(400).json({ error: 'Invalid product id' });
      return;
    }
    const parsed = validateProductDocument(req.body as Record<string, unknown>);
    if ('error' in parsed) {
      res.status(400).json({ error: parsed.error });
      return;
    }
    const coll = getProductCollection();
    const existing = await coll.findOne({ _id: new ObjectId(id) });
    if (!existing) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }
    if (parsed.slug !== existing.slug) {
      const slugTaken = await coll.findOne({ slug: parsed.slug });
      if (slugTaken) {
        res.status(400).json({ error: 'A product with this slug already exists' });
        return;
      }
    }
    const now = new Date();
    const next = {
      ...existing,
      ...parsed,
      _id: existing._id,
      createdAt: existing.createdAt,
      updatedAt: now,
    } as Product;
    delete (next as unknown as Record<string, unknown>).subProducts;
    delete (next as unknown as Record<string, unknown>).panelsSectionTitle;
    delete (next as unknown as Record<string, unknown>).panelsSectionDescription;
    await coll.replaceOne({ _id: new ObjectId(id) }, next);
    const updated = await coll.findOne({ _id: new ObjectId(id) });
    res.json(updated ? productToAdminItem(updated) : null);
  } catch (err) {
    console.error('updateProduct error:', err);
    res.status(500).json({ error: 'Failed to update product' });
  }
}

/** Admin: DELETE /api/admin/products/:id */
export async function deleteProduct(req: Request, res: Response): Promise<void> {
  try {
    const id = typeof req.params['id'] === 'string' ? req.params['id'] : '';
    if (!id || !ObjectId.isValid(id)) {
      res.status(400).json({ error: 'Invalid product id' });
      return;
    }
    const coll = getProductCollection();
    const result = await coll.deleteOne({ _id: new ObjectId(id) });
    if (result.deletedCount === 0) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }
    res.status(204).send();
  } catch (err) {
    console.error('deleteProduct error:', err);
    res.status(500).json({ error: 'Failed to delete product' });
  }
}
