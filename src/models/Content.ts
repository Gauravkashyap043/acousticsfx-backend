import type { Collection } from 'mongodb';
import type { Content } from '../types/index.js';
import { getDb } from '../config/db.js';

const COLLECTION = 'content';

/** Returns the content collection. Keys are unique (use upsert by key). */
export function getContentCollection(): Collection<Content> {
  return getDb().collection<Content>(COLLECTION);
}
