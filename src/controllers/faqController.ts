import { Request, Response } from 'express';
import { ObjectId } from 'mongodb';
import { getFaqCollection } from '../models/Faq.js';
import type { Faq } from '../types/index.js';

function validateBody(
  body: Record<string, unknown>
): Omit<Faq, '_id' | 'createdAt' | 'updatedAt'> | { error: string } {
  const question = typeof body.question === 'string' && body.question.trim() ? body.question.trim() : null;
  if (!question) return { error: 'question is required' };
  const answer = typeof body.answer === 'string' && body.answer.trim() ? body.answer.trim() : null;
  if (!answer) return { error: 'answer is required' };
  const order = typeof body.order === 'number' ? body.order : 0;
  const isPublished = typeof body.isPublished === 'boolean' ? body.isPublished : true;
  return { question, answer, order, isPublished };
}

function toPublic(f: Faq) {
  const { _id, ...rest } = f;
  return { ...rest, _id: _id?.toString() };
}

/** Public: GET /api/faqs */
export async function listPublic(_req: Request, res: Response): Promise<void> {
  try {
    const items = await getFaqCollection()
      .find({ isPublished: { $ne: false } })
      .sort({ order: 1, createdAt: -1 })
      .toArray();
    res.json({ faqs: items.map(toPublic) });
  } catch (err) {
    console.error('listFaqs error:', err);
    res.status(500).json({ error: 'Failed to fetch FAQs' });
  }
}

/** Admin: GET /api/admin/faqs */
export async function listAdmin(_req: Request, res: Response): Promise<void> {
  try {
    const items = await getFaqCollection()
      .find({})
      .sort({ order: 1, createdAt: -1 })
      .toArray();
    res.json({ items: items.map((f) => ({ ...f, _id: f._id?.toString() })) });
  } catch (err) {
    console.error('listFaqsAdmin error:', err);
    res.status(500).json({ error: 'Failed to fetch FAQs' });
  }
}

/** Admin: POST /api/admin/faqs */
export async function create(req: Request, res: Response): Promise<void> {
  try {
    const parsed = validateBody(req.body as Record<string, unknown>);
    if ('error' in parsed) { res.status(400).json({ error: parsed.error }); return; }
    const now = new Date();
    const doc: Faq = { ...parsed, createdAt: now, updatedAt: now };
    const result = await getFaqCollection().insertOne(doc);
    const inserted = await getFaqCollection().findOne({ _id: result.insertedId });
    res.status(201).json(toPublic(inserted!));
  } catch (err) {
    console.error('createFaq error:', err);
    res.status(500).json({ error: 'Failed to create FAQ' });
  }
}

/** Admin: PUT /api/admin/faqs/:id */
export async function update(req: Request, res: Response): Promise<void> {
  try {
    const id = typeof req.params['id'] === 'string' ? req.params['id'] : '';
    if (!id || !ObjectId.isValid(id)) { res.status(400).json({ error: 'Invalid id' }); return; }
    const parsed = validateBody(req.body as Record<string, unknown>);
    if ('error' in parsed) { res.status(400).json({ error: parsed.error }); return; }
    const coll = getFaqCollection();
    const result = await coll.updateOne(
      { _id: new ObjectId(id) },
      { $set: { ...parsed, updatedAt: new Date() } }
    );
    if (result.matchedCount === 0) { res.status(404).json({ error: 'Not found' }); return; }
    const updated = await coll.findOne({ _id: new ObjectId(id) });
    res.json(toPublic(updated!));
  } catch (err) {
    console.error('updateFaq error:', err);
    res.status(500).json({ error: 'Failed to update FAQ' });
  }
}

/** Admin: DELETE /api/admin/faqs/:id */
export async function remove(req: Request, res: Response): Promise<void> {
  try {
    const id = typeof req.params['id'] === 'string' ? req.params['id'] : '';
    if (!id || !ObjectId.isValid(id)) { res.status(400).json({ error: 'Invalid id' }); return; }
    const result = await getFaqCollection().deleteOne({ _id: new ObjectId(id) });
    if (result.deletedCount === 0) { res.status(404).json({ error: 'Not found' }); return; }
    res.status(204).send();
  } catch (err) {
    console.error('deleteFaq error:', err);
    res.status(500).json({ error: 'Failed to delete FAQ' });
  }
}
