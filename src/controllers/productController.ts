import { Request, Response } from 'express';
import { ObjectId } from 'mongodb';
import { getProductCollection } from '../models/Product.js';
import { getCategoryCollection } from '../models/Category.js';
import type {
  Product,
  SubProduct,
  ProductCategory,
  SubProductGridIntro,
  SubProductGridImage,
  SubProductSpec,
  SubProductGallerySlide,
} from '../types/index.js';

const SLUG_REGEX = /^[a-zA-Z0-9-]+$/;

function validateSlug(s: unknown): string | null {
  if (typeof s !== 'string' || !s.trim()) return null;
  return SLUG_REGEX.test(s) ? s.trim() : null;
}

function validateGridIntro(raw: unknown): SubProductGridIntro | undefined {
  if (!raw || typeof raw !== 'object') return undefined;
  const o = raw as Record<string, unknown>;
  const title = typeof o.title === 'string' ? o.title.trim() : undefined;
  const subtitle = typeof o.subtitle === 'string' ? o.subtitle.trim() : undefined;
  const body = typeof o.body === 'string' ? o.body.trim() : undefined;
  if (!title && !subtitle && !body) return undefined;
  return { title, subtitle, body };
}

function validateGridImage(raw: unknown): SubProductGridImage | null {
  if (!raw || typeof raw !== 'object') return null;
  const o = raw as Record<string, unknown>;
  const url = typeof o.url === 'string' && o.url.trim() ? o.url.trim() : '';
  if (!url) return null;
  const alt = typeof o.alt === 'string' ? o.alt.trim() : undefined;
  return { url, alt };
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

function validateSubProduct(raw: unknown): SubProduct | { error: string } {
  if (!raw || typeof raw !== 'object') return { error: 'subProduct must be an object' };
  const o = raw as Record<string, unknown>;
  const slug = validateSlug(o.slug);
  if (!slug) return { error: 'subProduct.slug is required and must be alphanumeric with hyphens' };
  const title = typeof o.title === 'string' && o.title.trim() ? o.title.trim() : null;
  if (!title) return { error: 'subProduct.title is required' };
  const description = typeof o.description === 'string' ? o.description.trim() : '';
  const image = typeof o.image === 'string' && o.image.trim() ? o.image.trim() : '';
  const sub: SubProduct = { slug, title, description, image };

  const gridIntro = validateGridIntro(o.gridIntro);
  if (gridIntro) sub.gridIntro = gridIntro;

  if (Array.isArray(o.gridImages)) {
    const gridImages: SubProductGridImage[] = [];
    for (const item of o.gridImages) {
      const img = validateGridImage(item);
      if (img) gridImages.push(img);
    }
    if (gridImages.length) sub.gridImages = gridImages;
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
  return { slug, title, description, image, heroImage, subProducts, order, categorySlug, panelsSectionTitle, panelsSectionDescription };
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
      panelsSectionTitle: p.panelsSectionTitle,
      panelsSectionDescription: p.panelsSectionDescription,
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
      panelsSectionTitle: p.panelsSectionTitle,
      panelsSectionDescription: p.panelsSectionDescription,
    }));
    res.json({
      category: {
        slug: category.slug,
        name: category.name,
        description: category.description,
        image: category.image,
        order: category.order ?? 0,
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
      panelsSectionTitle: product.panelsSectionTitle,
      panelsSectionDescription: product.panelsSectionDescription,
    });
  } catch (err) {
    console.error('getProductBySlug error:', err);
    res.status(500).json({ error: 'Failed to fetch product' });
  }
}

/** Public: GET /api/products/slug/:productSlug/sub-products/:subProductSlug – sub-product details. */
export async function getSubProductBySlug(req: Request, res: Response): Promise<void> {
  try {
    const productSlug = validateSlug(req.params['productSlug']);
    const subProductSlug = validateSlug(req.params['subProductSlug']);
    if (!productSlug || !subProductSlug) {
      res.status(400).json({ error: 'Invalid product or sub-product slug' });
      return;
    }
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
      },
      subProduct: {
        slug: sub.slug,
        title: sub.title,
        description: sub.description,
        image: sub.image,
        gridIntro: sub.gridIntro,
        gridImages: sub.gridImages,
        specDescription: sub.specDescription,
        specs: sub.specs,
        gallerySlides: sub.gallerySlides,
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
