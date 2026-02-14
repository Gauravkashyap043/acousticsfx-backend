import type { Collection } from 'mongodb';
import type { Blog as BlogType } from '../types/index.js';
import { getDb } from '../config/db.js';

const COLLECTION = 'blogs';

export function getBlogCollection(): Collection<BlogType> {
  return getDb().collection<BlogType>(COLLECTION);
}
