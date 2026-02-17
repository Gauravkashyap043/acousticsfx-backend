import type { Collection } from 'mongodb';
import type { TrustedPartner } from '../types/index.js';
import { getDb } from '../config/db.js';

const COLLECTION = 'trusted_partners';

export function getTrustedPartnerCollection(): Collection<TrustedPartner> {
  return getDb().collection<TrustedPartner>(COLLECTION);
}
