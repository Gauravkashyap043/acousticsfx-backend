import { Request, Response } from 'express';
import { ObjectId } from 'mongodb';
import { getFooterLinkCollection } from '../models/FooterLink.js';
import type { FooterLink } from '../types/index.js';

const VALID_SECTIONS = ['services', 'resources'] as const;

function toPublic(doc: FooterLink) {
  const { _id, ...rest } = doc;
  return { ...rest, _id: _id?.toString() };
}

/** Public: GET /api/footer-links */
export async function listPublic(_req: Request, res: Response): Promise<void> {
  try {
    const items = await getFooterLinkCollection()
      .find({})
      .sort({ section: 1, order: 1, createdAt: -1 })
      .toArray();
    const services = items.filter((i) => i.section === 'services').map(toPublic);
    const resources = items.filter((i) => i.section === 'resources').map(toPublic);
    res.json({ services, resources });
  } catch (err) {
    console.error('listFooterLinks error:', err);
    res.status(500).json({ error: 'Failed to fetch footer links' });
  }
}

/** Admin: GET /api/admin/footer-links */
export async function listAdmin(_req: Request, res: Response): Promise<void> {
  try {
    const items = await getFooterLinkCollection()
      .find({})
      .sort({ section: 1, order: 1, createdAt: -1 })
      .toArray();
    res.json({ items: items.map((d) => ({ ...d, _id: d._id?.toString() })) });
  } catch (err) {
    console.error('listFooterLinksAdmin error:', err);
    res.status(500).json({ error: 'Failed to fetch footer links' });
  }
}

/** Admin: POST /api/admin/footer-links */
export async function create(req: Request, res: Response): Promise<void> {
  try {
    const { section, label, href, order } = req.body as Record<string, unknown>;
    if (!section || !VALID_SECTIONS.includes(section as any))
      { res.status(400).json({ error: 'section must be "services" or "resources"' }); return; }
    if (!label || typeof label !== 'string' || !label.trim())
      { res.status(400).json({ error: 'label is required' }); return; }

    const now = new Date();
    const doc: FooterLink = {
      section: section as FooterLink['section'],
      label: (label as string).trim(),
      href: typeof href === 'string' && href.trim() ? href.trim() : undefined,
      order: typeof order === 'number' ? order : 0,
      createdAt: now,
      updatedAt: now,
    };
    const result = await getFooterLinkCollection().insertOne(doc);
    const inserted = await getFooterLinkCollection().findOne({ _id: result.insertedId });
    res.status(201).json(toPublic(inserted!));
  } catch (err) {
    console.error('createFooterLink error:', err);
    res.status(500).json({ error: 'Failed to create footer link' });
  }
}

/** Admin: PUT /api/admin/footer-links/:id */
export async function update(req: Request, res: Response): Promise<void> {
  try {
    const id = req.params['id'] ?? '';
    if (!ObjectId.isValid(id)) { res.status(400).json({ error: 'Invalid id' }); return; }

    const { section, label, href, order } = req.body as Record<string, unknown>;
    if (!section || !VALID_SECTIONS.includes(section as any))
      { res.status(400).json({ error: 'section must be "services" or "resources"' }); return; }
    if (!label || typeof label !== 'string' || !label.trim())
      { res.status(400).json({ error: 'label is required' }); return; }

    const coll = getFooterLinkCollection();
    const result = await coll.updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          section: section as FooterLink['section'],
          label: (label as string).trim(),
          href: typeof href === 'string' && href.trim() ? href.trim() : undefined,
          order: typeof order === 'number' ? order : 0,
          updatedAt: new Date(),
        },
      }
    );
    if (result.matchedCount === 0) { res.status(404).json({ error: 'Not found' }); return; }
    const updated = await coll.findOne({ _id: new ObjectId(id) });
    res.json(toPublic(updated!));
  } catch (err) {
    console.error('updateFooterLink error:', err);
    res.status(500).json({ error: 'Failed to update footer link' });
  }
}

/** Admin: DELETE /api/admin/footer-links/:id */
export async function remove(req: Request, res: Response): Promise<void> {
  try {
    const id = req.params['id'] ?? '';
    if (!ObjectId.isValid(id)) { res.status(400).json({ error: 'Invalid id' }); return; }
    const result = await getFooterLinkCollection().deleteOne({ _id: new ObjectId(id) });
    if (result.deletedCount === 0) { res.status(404).json({ error: 'Not found' }); return; }
    res.status(204).send();
  } catch (err) {
    console.error('deleteFooterLink error:', err);
    res.status(500).json({ error: 'Failed to delete footer link' });
  }
}
