import { Request, Response } from 'express';
import { ObjectId } from 'mongodb';
import { getTestimonialCollection } from '../models/Testimonial.js';
import type { Testimonial } from '../types/index.js';

function validateBody(
  body: Record<string, unknown>
): Omit<Testimonial, '_id' | 'createdAt' | 'updatedAt'> | { error: string } {
  const company = typeof body.company === 'string' && body.company.trim() ? body.company.trim() : null;
  if (!company) return { error: 'company is required' };
  const companyLogo = typeof body.companyLogo === 'string' ? body.companyLogo.trim() : '';
  const text = typeof body.text === 'string' && body.text.trim() ? body.text.trim() : null;
  if (!text) return { error: 'text is required' };
  const name = typeof body.name === 'string' && body.name.trim() ? body.name.trim() : null;
  if (!name) return { error: 'name is required' };
  const role = typeof body.role === 'string' ? body.role.trim() : '';
  const avatar = typeof body.avatar === 'string' ? body.avatar.trim() : '';
  const order = typeof body.order === 'number' ? body.order : 0;
  return { company, companyLogo, text, name, role, avatar, order };
}

function toPublic(t: Testimonial) {
  const { _id, ...rest } = t;
  return { ...rest, _id: _id?.toString() };
}

/** Public: GET /api/testimonials */
export async function listTestimonials(req: Request, res: Response): Promise<void> {
  try {
    const coll = getTestimonialCollection();
    const items = await coll.find({}).sort({ order: 1, createdAt: -1 }).toArray();
    res.json({ testimonials: items.map(toPublic) });
  } catch (err) {
    console.error('listTestimonials error:', err);
    res.status(500).json({ error: 'Failed to fetch testimonials' });
  }
}

/** Admin: GET /api/admin/testimonials */
export async function listTestimonialsAdmin(req: Request, res: Response): Promise<void> {
  try {
    const coll = getTestimonialCollection();
    const items = await coll.find({}).sort({ order: 1, createdAt: -1 }).toArray();
    res.json({ items: items.map((t) => ({ ...t, _id: t._id?.toString() })) });
  } catch (err) {
    console.error('listTestimonialsAdmin error:', err);
    res.status(500).json({ error: 'Failed to fetch testimonials' });
  }
}

/** Admin: POST /api/admin/testimonials */
export async function createTestimonial(req: Request, res: Response): Promise<void> {
  try {
    const parsed = validateBody(req.body as Record<string, unknown>);
    if ('error' in parsed) {
      res.status(400).json({ error: parsed.error });
      return;
    }
    const now = new Date();
    const doc: Testimonial = { ...parsed, createdAt: now, updatedAt: now };
    const result = await getTestimonialCollection().insertOne(doc);
    const inserted = await getTestimonialCollection().findOne({ _id: result.insertedId });
    res.status(201).json(toPublic(inserted!));
  } catch (err) {
    console.error('createTestimonial error:', err);
    res.status(500).json({ error: 'Failed to create testimonial' });
  }
}

/** Admin: PUT /api/admin/testimonials/:id */
export async function updateTestimonial(req: Request, res: Response): Promise<void> {
  try {
    const id = typeof req.params['id'] === 'string' ? req.params['id'] : '';
    if (!id || !ObjectId.isValid(id)) {
      res.status(400).json({ error: 'Invalid id' });
      return;
    }
    const parsed = validateBody(req.body as Record<string, unknown>);
    if ('error' in parsed) {
      res.status(400).json({ error: parsed.error });
      return;
    }
    const coll = getTestimonialCollection();
    const result = await coll.updateOne(
      { _id: new ObjectId(id) },
      { $set: { ...parsed, updatedAt: new Date() } }
    );
    if (result.matchedCount === 0) {
      res.status(404).json({ error: 'Testimonial not found' });
      return;
    }
    const updated = await coll.findOne({ _id: new ObjectId(id) });
    res.json(toPublic(updated!));
  } catch (err) {
    console.error('updateTestimonial error:', err);
    res.status(500).json({ error: 'Failed to update testimonial' });
  }
}

/** Admin: DELETE /api/admin/testimonials/:id */
export async function deleteTestimonial(req: Request, res: Response): Promise<void> {
  try {
    const id = typeof req.params['id'] === 'string' ? req.params['id'] : '';
    if (!id || !ObjectId.isValid(id)) {
      res.status(400).json({ error: 'Invalid id' });
      return;
    }
    const result = await getTestimonialCollection().deleteOne({ _id: new ObjectId(id) });
    if (result.deletedCount === 0) {
      res.status(404).json({ error: 'Testimonial not found' });
      return;
    }
    res.status(204).send();
  } catch (err) {
    console.error('deleteTestimonial error:', err);
    res.status(500).json({ error: 'Failed to delete testimonial' });
  }
}
