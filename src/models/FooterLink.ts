import type { Collection } from 'mongodb';
import type { FooterLink } from '../types/index.js';
import { getDb } from '../config/db.js';

const COLLECTION = 'footer_links';

export function getFooterLinkCollection(): Collection<FooterLink> {
  return getDb().collection<FooterLink>(COLLECTION);
}
