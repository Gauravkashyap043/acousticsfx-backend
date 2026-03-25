import { Request, Response } from 'express';
import { ObjectId } from 'mongodb';
import { getProductCollection } from '../models/Product.js';
import { getCategoryCollection } from '../models/Category.js';
import type {
  Product,
  SubProduct,
  ProductCategory,
  SubProductSpec,
  SubProductGallerySlide,
  SubProductGalleryImage,
  SubProductProfilesSection,
  SubProductSubstratesSection,
  SubProductAboutTab,
  SubProductCertification,
  SubProductFinishesSection,
} from '../types/index.js';

const SLUG_REGEX = /^[a-zA-Z0-9-]+$/;

function validateSlug(s: unknown): string | null {
  if (typeof s !== 'string' || !s.trim()) return null;
  return SLUG_REGEX.test(s) ? s.trim() : null;
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

function validateSubProduct(raw: unknown): SubProduct | { error: string } {
  if (!raw || typeof raw !== 'object') return { error: 'subProduct must be an object' };
  const o = raw as Record<string, unknown>;
  const idRaw = typeof o.id === 'string' ? o.id.trim() : '';
  const slug = validateSlug(o.slug);
  if (!slug) return { error: 'subProduct.slug is required and must be alphanumeric with hyphens' };
  const title = typeof o.title === 'string' && o.title.trim() ? o.title.trim() : null;
  if (!title) return { error: 'subProduct.title is required' };
  const description = typeof o.description === 'string' ? o.description.trim() : '';
  const image = typeof o.image === 'string' && o.image.trim() ? o.image.trim() : '';
  const sub: SubProduct = {
    ...(idRaw && ObjectId.isValid(idRaw) ? { id: idRaw } : {}),
    slug,
    title,
    description,
    image,
  };

  if ('showTrademark' in o) {
    sub.showTrademark = o.showTrademark === true;
  }

  if ('specSectionTitle' in o) {
    const t = typeof o.specSectionTitle === 'string' ? o.specSectionTitle.trim() : '';
    sub.specSectionTitle = t || undefined;
  }

  const specDescription =
    typeof o.specDescription === 'string' && o.specDescription.trim()
      ? o.specDescription.trim()
      : undefined;
  if (specDescription) sub.specDescription = specDescription;

  if (Array.isArray(o.specs)) {
    const specs: SubProductSpec[] = [];
    for (const item of o.specs) {
      const spec = validateSpec(item);
      if (spec) specs.push(spec);
    }
    if (specs.length) sub.specs = specs;
  }

  if (Array.isArray(o.gallerySlides)) {
    const gallerySlides: SubProductGallerySlide[] = [];
    for (const item of o.gallerySlides) {
      const slide = validateGallerySlide(item);
      if (slide) gallerySlides.push(slide);
    }
    if (gallerySlides.length) sub.gallerySlides = gallerySlides;
  }

  if (Array.isArray(o.galleryImages)) {
    const galleryImages: SubProductGalleryImage[] = [];
    for (const item of o.galleryImages) {
      const img = validateGalleryImage(item);
      if (img) galleryImages.push(img);
    }
    if (galleryImages.length) sub.galleryImages = galleryImages;
  } else if (sub.gallerySlides && sub.gallerySlides.length > 0) {
    // Back-compat: derive galleryImages from gallerySlides if only slides were provided.
    const derived: SubProductGalleryImage[] = [];
    for (const s of sub.gallerySlides) {
      if (s.large) derived.push({ url: s.large });
      if (s.small && s.small !== s.large) derived.push({ url: s.small });
    }
    if (derived.length) sub.galleryImages = derived;
  }

  const profilesSection = validateProfilesSection(o.profilesSection);
  if (profilesSection) sub.profilesSection = profilesSection;

  const substratesSection = validateSubstratesSection(o.substratesSection);
  if (substratesSection) sub.substratesSection = substratesSection;

  const aboutTabs = validateAboutTabs(o.aboutTabs);
  if (aboutTabs) sub.aboutTabs = aboutTabs;

  if ('certificationsSectionTitle' in o) {
    const t = typeof o.certificationsSectionTitle === 'string' ? o.certificationsSectionTitle.trim() : '';
    sub.certificationsSectionTitle = t || undefined;
  }
  if ('certificationsSectionDescription' in o) {
    const t =
      typeof o.certificationsSectionDescription === 'string'
        ? o.certificationsSectionDescription.trim()
        : '';
    sub.certificationsSectionDescription = t || undefined;
  }

  if ('certifications' in o) {
    const certifications = validateCertifications(o.certifications);
    sub.certifications = certifications && certifications.length ? certifications : undefined;
  }

  const finishesSection = validateFinishesSection(o.finishesSection);
  if (finishesSection) sub.finishesSection = finishesSection;

  return sub;
}

function validateProductBody(
  body: Record<string, unknown>
): Omit<Product, '_id' | 'createdAt' | 'updatedAt'> | { error: string } {
  const slug = validateSlug(body.slug);
  if (!slug) return { error: 'slug is required and must be alphanumeric with hyphens' };
  const title = typeof body.title === 'string' && body.title.trim() ? body.title.trim() : null;
  if (!title) return { error: 'title is required' };
  const description = typeof body.description === 'string' ? body.description.trim() : '';
  const image = typeof body.image === 'string' ? body.image.trim() : '';
  const heroImage = typeof body.heroImage === 'string' ? body.heroImage.trim() : undefined;
  let subProducts: SubProduct[] = [];
  if (Array.isArray(body.subProducts)) {
    for (let i = 0; i < body.subProducts.length; i++) {
      const result = validateSubProduct(body.subProducts[i]);
      if ('error' in result) return { error: `subProducts[${i}]: ${result.error}` };
      subProducts.push(result);
    }
  }
  const order = typeof body.order === 'number' ? body.order : 0;
  const categorySlug = validateSlug(body.categorySlug) ?? undefined;
  const panelsSectionTitle = typeof body.panelsSectionTitle === 'string' ? body.panelsSectionTitle.trim() : undefined;
  const panelsSectionDescription = typeof body.panelsSectionDescription === 'string' ? body.panelsSectionDescription.trim() : undefined;
  const shortDescription = typeof body.shortDescription === 'string' ? body.shortDescription.trim() || undefined : undefined;
  const metaTitle = typeof body.metaTitle === 'string' ? body.metaTitle.trim() || undefined : undefined;
  const metaDescription = typeof body.metaDescription === 'string' ? body.metaDescription.trim() || undefined : undefined;
  const showTrademark = body.showTrademark === true;
  return {
    slug,
    title,
    description,
    image,
    heroImage,
    subProducts,
    order,
    categorySlug,
    panelsSectionTitle,
    panelsSectionDescription,
    shortDescription,
    metaTitle,
    metaDescription,
    showTrademark,
  };
}

/** Public: GET /api/products – all products (optional ?category=acoustic). No _id in response. */
export async function listProducts(req: Request, res: Response): Promise<void> {
  try {
    const categorySlug = validateSlug(req.query['category'] as string) ?? undefined;
    const coll = getProductCollection();
    const filter = categorySlug ? { categorySlug } : {};
    const products = await coll.find(filter).sort({ order: 1, slug: 1 }).toArray();
    const normalized = products.map((p) => ({
      slug: p.slug,
      title: p.title,
      description: p.description,
      image: p.image,
      heroImage: p.heroImage,
      subProducts: p.subProducts ?? [],
      categorySlug: p.categorySlug,
      showTrademark: p.showTrademark === true,
      panelsSectionTitle: p.panelsSectionTitle,
      panelsSectionDescription: p.panelsSectionDescription,
      shortDescription: p.shortDescription,
      metaTitle: p.metaTitle,
      metaDescription: p.metaDescription,
    }));
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
    const catColl = getCategoryCollection();
    const productColl = getProductCollection();
    const category = await catColl.findOne({ slug });
    if (!category) {
      res.status(404).json({ error: 'Category not found' });
      return;
    }
    const products = await productColl
      .find({ categorySlug: slug })
      .sort({ order: 1, slug: 1 })
      .toArray();
    const normalizedProducts = products.map((p) => ({
      slug: p.slug,
      title: p.title,
      description: p.description,
      image: p.image,
      heroImage: p.heroImage,
      subProducts: p.subProducts ?? [],
      showTrademark: p.showTrademark === true,
      panelsSectionTitle: p.panelsSectionTitle,
      panelsSectionDescription: p.panelsSectionDescription,
      shortDescription: p.shortDescription,
      metaTitle: p.metaTitle,
      metaDescription: p.metaDescription,
    }));
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
    const slug = validateSlug(req.params['productSlug']);
    if (!slug) {
      res.status(400).json({ error: 'Invalid product slug' });
      return;
    }
    const coll = getProductCollection();
    const product = await coll.findOne({ slug });
    if (!product) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }
    res.json({
      slug: product.slug,
      title: product.title,
      description: product.description,
      image: product.image,
      heroImage: product.heroImage,
      subProducts: product.subProducts ?? [],
      categorySlug: product.categorySlug,
      showTrademark: product.showTrademark === true,
      panelsSectionTitle: product.panelsSectionTitle,
      panelsSectionDescription: product.panelsSectionDescription,
      shortDescription: product.shortDescription,
      metaTitle: product.metaTitle,
      metaDescription: product.metaDescription,
    });
  } catch (err) {
    console.error('getProductBySlug error:', err);
    res.status(500).json({ error: 'Failed to fetch product' });
  }
}

/** Sub-product slug alias (e.g. common typo linerlux → linearlux) */
function normalizeSubProductSlug(slug: string): string {
  return slug === 'linerlux' ? 'linearlux' : slug;
}

/** Public: GET /api/products/slug/:productSlug/sub-products/:subProductSlug – sub-product details. */
export async function getSubProductBySlug(req: Request, res: Response): Promise<void> {
  try {
    const productSlug = validateSlug(req.params['productSlug']);
    const subProductSlugRaw = validateSlug(req.params['subProductSlug']);
    if (!productSlug || !subProductSlugRaw) {
      res.status(400).json({ error: 'Invalid product or sub-product slug' });
      return;
    }
    const subProductSlug = normalizeSubProductSlug(subProductSlugRaw);
    const coll = getProductCollection();
    const product = await coll.findOne({ slug: productSlug });
    if (!product) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }
    const subProducts = product.subProducts ?? [];
    const sub = subProducts.find((s) => s.slug === subProductSlug);
    if (!sub) {
      res.status(404).json({ error: 'Sub-product not found' });
      return;
    }
    res.json({
      product: {
        slug: product.slug,
        title: product.title,
        categorySlug: product.categorySlug,
        showTrademark: product.showTrademark === true,
      },
      subProduct: {
        id: sub.id,
        slug: sub.slug,
        title: sub.title,
        description: sub.description,
        image: sub.image,
        showTrademark: sub.showTrademark === true,
        specSectionTitle: sub.specSectionTitle,
        specDescription: sub.specDescription,
        specs: sub.specs,
        galleryImages: sub.galleryImages,
        profilesSection: sub.profilesSection,
        substratesSection: sub.substratesSection,
        aboutTabs: sub.aboutTabs,
        certificationsSectionTitle: sub.certificationsSectionTitle,
        certificationsSectionDescription: sub.certificationsSectionDescription,
        certifications: sub.certifications,
        finishesSection: sub.finishesSection,
      },
    });
  } catch (err) {
    console.error('getSubProductBySlug error:', err);
    res.status(500).json({ error: 'Failed to fetch sub-product' });
  }
}

/** Admin: GET /api/admin/products – list with _id for editing */
export async function listProductsAdmin(req: Request, res: Response): Promise<void> {
  try {
    const coll = getProductCollection();
    const products = await coll.find({}).sort({ order: 1, slug: 1 }).toArray();
    res.json({
      items: products.map((p) => ({
        _id: p._id?.toString(),
        slug: p.slug,
        title: p.title,
        description: p.description,
        image: p.image,
        heroImage: p.heroImage,
        subProducts: p.subProducts ?? [],
        categorySlug: p.categorySlug,
        order: p.order ?? 0,
        panelsSectionTitle: p.panelsSectionTitle,
        panelsSectionDescription: p.panelsSectionDescription,
        shortDescription: p.shortDescription,
        metaTitle: p.metaTitle,
        metaDescription: p.metaDescription,
        showTrademark: p.showTrademark === true,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
      })),
    });
  } catch (err) {
    console.error('listProductsAdmin error:', err);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
}

/** Admin: POST /api/admin/products */
export async function createProduct(req: Request, res: Response): Promise<void> {
  try {
    const parsed = validateProductBody(req.body as Record<string, unknown>);
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
    res.status(201).json({
      _id: inserted?._id?.toString(),
      slug: inserted?.slug,
      title: inserted?.title,
      description: inserted?.description,
      image: inserted?.image,
      heroImage: inserted?.heroImage,
      subProducts: inserted?.subProducts ?? [],
      categorySlug: inserted?.categorySlug,
      order: inserted?.order ?? 0,
      panelsSectionTitle: inserted?.panelsSectionTitle,
      panelsSectionDescription: inserted?.panelsSectionDescription,
      shortDescription: inserted?.shortDescription,
      metaTitle: inserted?.metaTitle,
      metaDescription: inserted?.metaDescription,
      showTrademark: inserted?.showTrademark === true,
      createdAt: inserted?.createdAt,
      updatedAt: inserted?.updatedAt,
    });
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
    const parsed = validateProductBody(req.body as Record<string, unknown>);
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
    await coll.updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          slug: parsed.slug,
          title: parsed.title,
          description: parsed.description,
          image: parsed.image,
          heroImage: parsed.heroImage,
          subProducts: parsed.subProducts,
          categorySlug: parsed.categorySlug,
          order: parsed.order,
          panelsSectionTitle: parsed.panelsSectionTitle,
          panelsSectionDescription: parsed.panelsSectionDescription,
          shortDescription: parsed.shortDescription,
          metaTitle: parsed.metaTitle,
          metaDescription: parsed.metaDescription,
          showTrademark: parsed.showTrademark,
          updatedAt: now,
        },
      }
    );
    const updated = await coll.findOne({ _id: new ObjectId(id) });
    res.json({
      _id: updated?._id?.toString(),
      slug: updated?.slug,
      title: updated?.title,
      description: updated?.description,
      image: updated?.image,
      heroImage: updated?.heroImage,
      subProducts: updated?.subProducts ?? [],
      categorySlug: updated?.categorySlug,
      order: updated?.order ?? 0,
      panelsSectionTitle: updated?.panelsSectionTitle,
      panelsSectionDescription: updated?.panelsSectionDescription,
      shortDescription: updated?.shortDescription,
      metaTitle: updated?.metaTitle,
      metaDescription: updated?.metaDescription,
      showTrademark: updated?.showTrademark === true,
      createdAt: updated?.createdAt,
      updatedAt: updated?.updatedAt,
    });
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

/** Admin: GET /api/admin/sub-products – list all sub-products (flattened from products) */
export async function listSubProductsAdmin(req: Request, res: Response): Promise<void> {
  try {
    const coll = getProductCollection();
    const products = await coll.find({}).sort({ order: 1, slug: 1 }).toArray();
    const items: Array<{
      productId: string;
      productSlug: string;
      productTitle: string;
      categorySlug?: string;
      subProduct: SubProduct;
    }> = [];
    for (const p of products) {
      const subProducts = p.subProducts ?? [];
      for (const sub of subProducts) {
        items.push({
          productId: p._id?.toString() ?? '',
          productSlug: p.slug,
          productTitle: p.title,
          categorySlug: p.categorySlug,
          subProduct: sub,
        });
      }
    }
    res.json({ items });
  } catch (err) {
    console.error('listSubProductsAdmin error:', err);
    res.status(500).json({ error: 'Failed to fetch sub-products' });
  }
}

/** Admin: POST /api/admin/products/:id/sub-products – add sub-product to a product */
export async function createSubProduct(req: Request, res: Response): Promise<void> {
  try {
    const productId = typeof req.params['id'] === 'string' ? req.params['id'] : '';
    if (!productId || !ObjectId.isValid(productId)) {
      res.status(400).json({ error: 'Invalid product id' });
      return;
    }
    const parsed = validateSubProduct(req.body as Record<string, unknown>);
    if ('error' in parsed) {
      res.status(400).json({ error: parsed.error });
      return;
    }
    const coll = getProductCollection();
    const product = await coll.findOne({ _id: new ObjectId(productId) });
    if (!product) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }
    const subProducts = product.subProducts ?? [];
    const existing = subProducts.find((s) => s.slug === parsed.slug);
    if (existing) {
      res.status(400).json({ error: 'A sub-product with this slug already exists in this product' });
      return;
    }
    const withId: SubProduct = {
      ...parsed,
      id: new ObjectId().toString(),
    };
    delete (withId as unknown as Record<string, unknown>).gridIntro;
    delete (withId as unknown as Record<string, unknown>).gridImages;
    const updated = [...subProducts, withId];
    await coll.updateOne(
      { _id: new ObjectId(productId) },
      { $set: { subProducts: updated, updatedAt: new Date() } }
    );
    res.status(201).json({ productId, subProduct: withId });
  } catch (err) {
    console.error('createSubProduct error:', err);
    res.status(500).json({ error: 'Failed to create sub-product' });
  }
}

/** Admin: PUT /api/admin/products/:productId/sub-products/:currentSlug – update sub-product */
export async function updateSubProduct(req: Request, res: Response): Promise<void> {
  try {
    const productId = typeof req.params['productId'] === 'string' ? req.params['productId'] : '';
    const currentSlug = validateSlug(req.params['currentSlug']);
    if (!productId || !ObjectId.isValid(productId) || !currentSlug) {
      res.status(400).json({ error: 'Invalid product id or sub-product slug' });
      return;
    }
    const parsed = validateSubProduct(req.body as Record<string, unknown>);
    if ('error' in parsed) {
      res.status(400).json({ error: parsed.error });
      return;
    }
    const coll = getProductCollection();
    const product = await coll.findOne({ _id: new ObjectId(productId) });
    if (!product) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }
    const subProducts = [...(product.subProducts ?? [])];
    const idx = subProducts.findIndex((s) => s.slug === currentSlug);
    if (idx < 0) {
      res.status(404).json({ error: 'Sub-product not found' });
      return;
    }
    if (parsed.slug !== currentSlug) {
      const slugTaken = subProducts.some((s, i) => i !== idx && s.slug === parsed.slug);
      if (slugTaken) {
        res.status(400).json({ error: 'A sub-product with this slug already exists in this product' });
        return;
      }
    }
    const existingSub = subProducts[idx];
    const merged: SubProduct = {
      ...existingSub,
      ...parsed,
      id: existingSub?.id ?? new ObjectId().toString(),
    };
    delete (merged as unknown as Record<string, unknown>).gridIntro;
    delete (merged as unknown as Record<string, unknown>).gridImages;
    subProducts[idx] = merged;
    await coll.updateOne(
      { _id: new ObjectId(productId) },
      { $set: { subProducts, updatedAt: new Date() } }
    );
    res.json({ productId, subProduct: subProducts[idx] });
  } catch (err) {
    console.error('updateSubProduct error:', err);
    res.status(500).json({ error: 'Failed to update sub-product' });
  }
}

/** Admin: DELETE /api/admin/products/:productId/sub-products/:slug */
export async function deleteSubProduct(req: Request, res: Response): Promise<void> {
  try {
    const productId = typeof req.params['productId'] === 'string' ? req.params['productId'] : '';
    const slug = validateSlug(req.params['slug']);
    if (!productId || !ObjectId.isValid(productId) || !slug) {
      res.status(400).json({ error: 'Invalid product id or sub-product slug' });
      return;
    }
    const coll = getProductCollection();
    const product = await coll.findOne({ _id: new ObjectId(productId) });
    if (!product) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }
    const subProducts = (product.subProducts ?? []).filter((s) => s.slug !== slug);
    if (subProducts.length === (product.subProducts ?? []).length) {
      res.status(404).json({ error: 'Sub-product not found' });
      return;
    }
    await coll.updateOne(
      { _id: new ObjectId(productId) },
      { $set: { subProducts, updatedAt: new Date() } }
    );
    res.status(204).send();
  } catch (err) {
    console.error('deleteSubProduct error:', err);
    res.status(500).json({ error: 'Failed to delete sub-product' });
  }
}
