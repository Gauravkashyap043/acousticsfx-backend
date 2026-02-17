import { Request, Response } from 'express';
import { ObjectId } from 'mongodb';
import { getTrustedPartnerCollection } from '../models/TrustedPartner.js';
import type { TrustedPartner } from '../types/index.js';

function validateBody(
  body: Record<string, unknown>
): Omit<TrustedPartner, '_id' | 'createdAt' | 'updatedAt'> | { error: string } {
  const name = typeof body.name === 'string' && body.name.trim() ? body.name.trim() : null;
  if (!name) return { error: 'name is required' };
  const logo = typeof body.logo === 'string' && body.logo.trim() ? body.logo.trim() : null;
  if (!logo) return { error: 'logo is required' };
  const order = typeof body.order === 'number' ? body.order : 0;
  return { name, logo, order };
}

function toPublic(p: TrustedPartner) {
  const { _id, ...rest } = p;
  return { ...rest, _id: _id?.toString() };
}

/** Public: GET /api/trusted-partners */
export async function listPublic(_req: Request, res: Response): Promise<void> {
  try {
    const items = await getTrustedPartnerCollection()
      .find({})
      .sort({ order: 1, createdAt: -1 })
      .toArray();
    res.json({ partners: items.map(toPublic) });
  } catch (err) {
    console.error('listTrustedPartners error:', err);
    res.status(500).json({ error: 'Failed to fetch trusted partners' });
  }
}

/** Admin: GET /api/admin/trusted-partners */
export async function listAdmin(_req: Request, res: Response): Promise<void> {
  try {
    const items = await getTrustedPartnerCollection()
      .find({})
      .sort({ order: 1, createdAt: -1 })
      .toArray();
    res.json({ items: items.map((p) => ({ ...p, _id: p._id?.toString() })) });
  } catch (err) {
    console.error('listTrustedPartnersAdmin error:', err);
    res.status(500).json({ error: 'Failed to fetch trusted partners' });
  }
}

/** Admin: POST /api/admin/trusted-partners */
export async function create(req: Request, res: Response): Promise<void> {
  try {
    const parsed = validateBody(req.body as Record<string, unknown>);
    if ('error' in parsed) { res.status(400).json({ error: parsed.error }); return; }
    const now = new Date();
    const doc: TrustedPartner = { ...parsed, createdAt: now, updatedAt: now };
    const result = await getTrustedPartnerCollection().insertOne(doc);
    const inserted = await getTrustedPartnerCollection().findOne({ _id: result.insertedId });
    res.status(201).json(toPublic(inserted!));
  } catch (err) {
    console.error('createTrustedPartner error:', err);
    res.status(500).json({ error: 'Failed to create trusted partner' });
  }
}

/** Admin: PUT /api/admin/trusted-partners/:id */
export async function update(req: Request, res: Response): Promise<void> {
  try {
    const id = typeof req.params['id'] === 'string' ? req.params['id'] : '';
    if (!id || !ObjectId.isValid(id)) { res.status(400).json({ error: 'Invalid id' }); return; }
    const parsed = validateBody(req.body as Record<string, unknown>);
    if ('error' in parsed) { res.status(400).json({ error: parsed.error }); return; }
    const coll = getTrustedPartnerCollection();
    const result = await coll.updateOne(
      { _id: new ObjectId(id) },
      { $set: { ...parsed, updatedAt: new Date() } }
    );
    if (result.matchedCount === 0) { res.status(404).json({ error: 'Not found' }); return; }
    const updated = await coll.findOne({ _id: new ObjectId(id) });
    res.json(toPublic(updated!));
  } catch (err) {
    console.error('updateTrustedPartner error:', err);
    res.status(500).json({ error: 'Failed to update trusted partner' });
  }
}

/** Admin: DELETE /api/admin/trusted-partners/:id */
export async function remove(req: Request, res: Response): Promise<void> {
  try {
    const id = typeof req.params['id'] === 'string' ? req.params['id'] : '';
    if (!id || !ObjectId.isValid(id)) { res.status(400).json({ error: 'Invalid id' }); return; }
    const result = await getTrustedPartnerCollection().deleteOne({ _id: new ObjectId(id) });
    if (result.deletedCount === 0) { res.status(404).json({ error: 'Not found' }); return; }
    res.status(204).send();
  } catch (err) {
    console.error('deleteTrustedPartner error:', err);
    res.status(500).json({ error: 'Failed to delete trusted partner' });
  }
}
