import { Request, Response } from 'express';
import { ObjectId } from 'mongodb';
import { getProductCollection } from '../models/Product.js';
import type { Product, SubProduct } from '../types/index.js';

const SLUG_REGEX = /^[a-zA-Z0-9-]+$/;

function validateSlug(s: unknown): string | null {
  if (typeof s !== 'string' || !s.trim()) return null;
  return SLUG_REGEX.test(s) ? s.trim() : null;
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
  return { slug, title, description, image };
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
  return { slug, title, description, image, heroImage, subProducts, order };
}

/** Public: GET /api/products – all products with subProducts, ordered by order then slug. No _id in response. */
export async function listProducts(req: Request, res: Response): Promise<void> {
  try {
    const coll = getProductCollection();
    const products = await coll.find({}).sort({ order: 1, slug: 1 }).toArray();
    const normalized = products.map((p) => ({
      slug: p.slug,
      title: p.title,
      description: p.description,
      image: p.image,
      heroImage: p.heroImage,
      subProducts: p.subProducts ?? [],
    }));
    res.json({ products: normalized });
  } catch (err) {
    console.error('listProducts error:', err);
    res.status(500).json({ error: 'Failed to fetch products' });
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
        order: p.order ?? 0,
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
    const doc: Product = {
      ...parsed,
      createdAt: now,
      updatedAt: now,
    };
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
      order: inserted?.order ?? 0,
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
          order: parsed.order,
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
      order: updated?.order ?? 0,
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
