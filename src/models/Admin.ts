import type { Collection } from 'mongodb';
import type { Admin } from '../types/index.js';
import { getDb } from '../config/db.js';

const COLLECTION = 'admins';

export function getAdminCollection(): Collection<Admin> {
  return getDb().collection<Admin>(COLLECTION);
}
