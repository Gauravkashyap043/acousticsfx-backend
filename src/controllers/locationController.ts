import { Request, Response } from 'express';
import { ObjectId } from 'mongodb';
import { getLocationCollection } from '../models/Location.js';
import type { Location } from '../types/index.js';

function toPublic(doc: Location) {
  const { _id, ...rest } = doc;
  return { ...rest, _id: _id?.toString() };
}

/** Public: GET /api/locations */
export async function listPublic(_req: Request, res: Response): Promise<void> {
  try {
    const items = await getLocationCollection()
      .find({})
      .sort({ order: 1, createdAt: -1 })
      .toArray();
    res.json({ locations: items.map(toPublic) });
  } catch (err) {
    console.error('listLocations error:', err);
    res.status(500).json({ error: 'Failed to fetch locations' });
  }
}

/** Admin: GET /api/admin/locations */
export async function listAdmin(_req: Request, res: Response): Promise<void> {
  try {
    const items = await getLocationCollection()
      .find({})
      .sort({ order: 1, createdAt: -1 })
      .toArray();
    res.json({ items: items.map((d) => ({ ...d, _id: d._id?.toString() })) });
  } catch (err) {
    console.error('listLocationsAdmin error:', err);
    res.status(500).json({ error: 'Failed to fetch locations' });
  }
}

/** Admin: POST /api/admin/locations */
export async function create(req: Request, res: Response): Promise<void> {
  try {
    const { title, highlight, items, order } = req.body as Record<string, unknown>;
    if (!title || typeof title !== 'string' || !title.trim())
      { res.status(400).json({ error: 'title is required' }); return; }
    if (!Array.isArray(items) || items.length === 0)
      { res.status(400).json({ error: 'items array is required' }); return; }

    const now = new Date();
    const doc: Location = {
      title: (title as string).trim(),
      highlight: !!highlight,
      items: (items as { label: string; value: string }[]).map((i) => ({
        label: String(i.label ?? '').trim(),
        value: String(i.value ?? '').trim(),
      })),
      order: typeof order === 'number' ? order : 0,
      createdAt: now,
      updatedAt: now,
    };
    const result = await getLocationCollection().insertOne(doc);
    const inserted = await getLocationCollection().findOne({ _id: result.insertedId });
    res.status(201).json(toPublic(inserted!));
  } catch (err) {
    console.error('createLocation error:', err);
    res.status(500).json({ error: 'Failed to create location' });
  }
}

/** Admin: PUT /api/admin/locations/:id */
export async function update(req: Request, res: Response): Promise<void> {
  try {
    const id = req.params['id'] ?? '';
    if (!ObjectId.isValid(id)) { res.status(400).json({ error: 'Invalid id' }); return; }

    const { title, highlight, items, order } = req.body as Record<string, unknown>;
    if (!title || typeof title !== 'string' || !title.trim())
      { res.status(400).json({ error: 'title is required' }); return; }
    if (!Array.isArray(items) || items.length === 0)
      { res.status(400).json({ error: 'items array is required' }); return; }

    const coll = getLocationCollection();
    const result = await coll.updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          title: (title as string).trim(),
          highlight: !!highlight,
          items: (items as { label: string; value: string }[]).map((i) => ({
            label: String(i.label ?? '').trim(),
            value: String(i.value ?? '').trim(),
          })),
          order: typeof order === 'number' ? order : 0,
          updatedAt: new Date(),
        },
      }
    );
    if (result.matchedCount === 0) { res.status(404).json({ error: 'Not found' }); return; }
    const updated = await coll.findOne({ _id: new ObjectId(id) });
    res.json(toPublic(updated!));
  } catch (err) {
    console.error('updateLocation error:', err);
    res.status(500).json({ error: 'Failed to update location' });
  }
}

/** Admin: DELETE /api/admin/locations/:id */
export async function remove(req: Request, res: Response): Promise<void> {
  try {
    const id = req.params['id'] ?? '';
    if (!ObjectId.isValid(id)) { res.status(400).json({ error: 'Invalid id' }); return; }
    const result = await getLocationCollection().deleteOne({ _id: new ObjectId(id) });
    if (result.deletedCount === 0) { res.status(404).json({ error: 'Not found' }); return; }
    res.status(204).send();
  } catch (err) {
    console.error('deleteLocation error:', err);
    res.status(500).json({ error: 'Failed to delete location' });
  }
}
