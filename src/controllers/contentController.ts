import { Request, Response } from 'express';
import { getContentCollection } from '../models/Content.js';

const MAX_KEYS = 100;
const KEY_REGEX = /^[a-zA-Z0-9._-]+$/;

/**
 * Public read: GET /api/content?keys=key1,key2
 * Returns { [key: string]: { value: string, type?: string } } for requested keys.
 * Keys not found are omitted. Empty or missing keys query returns {}.
 */
export async function getByKeys(req: Request, res: Response): Promise<void> {
  try {
    const raw = (req.query.keys as string) ?? '';
    const keys = raw
      .split(',')
      .map((k) => k.trim())
      .filter((k) => k.length > 0 && KEY_REGEX.test(k))
      .slice(0, MAX_KEYS);

    if (keys.length === 0) {
      res.json({});
      return;
    }

    const coll = getContentCollection();
    const docs = await coll.find({ key: { $in: keys } }).toArray();

    const result: Record<string, { value: string; type?: string }> = {};
    for (const d of docs) {
      result[d.key] = {
        value: d.value,
        ...(d.type && { type: d.type }),
      };
    }
    res.json(result);
  } catch (err) {
    console.error('Content getByKeys error:', err);
    res.status(500).json({ error: 'Failed to fetch content' });
  }
}
