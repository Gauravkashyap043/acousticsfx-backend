import type { Collection } from 'mongodb';
import type { ProductCategory } from '../types/index.js';
import { getDb } from '../config/db.js';

const COLLECTION = 'product_categories';

export function getCategoryCollection(): Collection<ProductCategory> {
  return getDb().collection<ProductCategory>(COLLECTION);
}
