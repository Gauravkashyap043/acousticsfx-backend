import type { Collection } from 'mongodb';
import type { ClientLogo } from '../types/index.js';
import { getDb } from '../config/db.js';

const COLLECTION = 'client_logos';

export function getClientLogoCollection(): Collection<ClientLogo> {
  return getDb().collection<ClientLogo>(COLLECTION);
}
