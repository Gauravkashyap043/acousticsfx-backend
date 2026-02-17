import type { Collection } from 'mongodb';
import type { Location } from '../types/index.js';
import { getDb } from '../config/db.js';

const COLLECTION = 'locations';

export function getLocationCollection(): Collection<Location> {
  return getDb().collection<Location>(COLLECTION);
}
