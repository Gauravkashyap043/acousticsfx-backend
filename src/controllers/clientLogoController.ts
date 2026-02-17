import { Request, Response } from 'express';
import { ObjectId } from 'mongodb';
import { getClientLogoCollection } from '../models/ClientLogo.js';
import type { ClientLogo } from '../types/index.js';

function validateBody(
  body: Record<string, unknown>
): Omit<ClientLogo, '_id' | 'createdAt' | 'updatedAt'> | { error: string } {
  const name = typeof body.name === 'string' && body.name.trim() ? body.name.trim() : null;
  if (!name) return { error: 'name is required' };
  const logo = typeof body.logo === 'string' && body.logo.trim() ? body.logo.trim() : null;
  if (!logo) return { error: 'logo is required' };
  const order = typeof body.order === 'number' ? body.order : 0;
  return { name, logo, order };
}

function toPublic(c: ClientLogo) {
  const { _id, ...rest } = c;
  return { ...rest, _id: _id?.toString() };
}

/** Public: GET /api/clients */
export async function listClients(_req: Request, res: Response): Promise<void> {
  try {
    const coll = getClientLogoCollection();
    const items = await coll.find({}).sort({ order: 1, createdAt: -1 }).toArray();
    res.json({ clients: items.map(toPublic) });
  } catch (err) {
    console.error('listClients error:', err);
    res.status(500).json({ error: 'Failed to fetch clients' });
  }
}

/** Admin: GET /api/admin/clients */
export async function listClientsAdmin(_req: Request, res: Response): Promise<void> {
  try {
    const coll = getClientLogoCollection();
    const items = await coll.find({}).sort({ order: 1, createdAt: -1 }).toArray();
    res.json({ items: items.map((c) => ({ ...c, _id: c._id?.toString() })) });
  } catch (err) {
    console.error('listClientsAdmin error:', err);
    res.status(500).json({ error: 'Failed to fetch clients' });
  }
}

/** Admin: POST /api/admin/clients */
export async function createClient(req: Request, res: Response): Promise<void> {
  try {
    const parsed = validateBody(req.body as Record<string, unknown>);
    if ('error' in parsed) {
      res.status(400).json({ error: parsed.error });
      return;
    }
    const now = new Date();
    const doc: ClientLogo = { ...parsed, createdAt: now, updatedAt: now };
    const result = await getClientLogoCollection().insertOne(doc);
    const inserted = await getClientLogoCollection().findOne({ _id: result.insertedId });
    res.status(201).json(toPublic(inserted!));
  } catch (err) {
    console.error('createClient error:', err);
    res.status(500).json({ error: 'Failed to create client' });
  }
}

/** Admin: PUT /api/admin/clients/:id */
export async function updateClient(req: Request, res: Response): Promise<void> {
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
    const coll = getClientLogoCollection();
    const result = await coll.updateOne(
      { _id: new ObjectId(id) },
      { $set: { ...parsed, updatedAt: new Date() } }
    );
    if (result.matchedCount === 0) {
      res.status(404).json({ error: 'Client not found' });
      return;
    }
    const updated = await coll.findOne({ _id: new ObjectId(id) });
    res.json(toPublic(updated!));
  } catch (err) {
    console.error('updateClient error:', err);
    res.status(500).json({ error: 'Failed to update client' });
  }
}

/** Admin: DELETE /api/admin/clients/:id */
export async function deleteClient(req: Request, res: Response): Promise<void> {
  try {
    const id = typeof req.params['id'] === 'string' ? req.params['id'] : '';
    if (!id || !ObjectId.isValid(id)) {
      res.status(400).json({ error: 'Invalid id' });
      return;
    }
    const result = await getClientLogoCollection().deleteOne({ _id: new ObjectId(id) });
    if (result.deletedCount === 0) {
      res.status(404).json({ error: 'Client not found' });
      return;
    }
    res.status(204).send();
  } catch (err) {
    console.error('deleteClient error:', err);
    res.status(500).json({ error: 'Failed to delete client' });
  }
}
