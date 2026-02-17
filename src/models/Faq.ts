import type { Collection } from 'mongodb';
import type { Faq } from '../types/index.js';
import { getDb } from '../config/db.js';

const COLLECTION = 'faqs';

export function getFaqCollection(): Collection<Faq> {
  return getDb().collection<Faq>(COLLECTION);
}
