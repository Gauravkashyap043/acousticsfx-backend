import type { Collection } from 'mongodb';
import type { Product as ProductType } from '../types/index.js';
import { getDb } from '../config/db.js';

const COLLECTION = 'products';

export function getProductCollection(): Collection<ProductType> {
  return getDb().collection<ProductType>(COLLECTION);
}
