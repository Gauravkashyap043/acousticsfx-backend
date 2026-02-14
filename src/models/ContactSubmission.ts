import type { Collection } from 'mongodb';
import type { ContactSubmission } from '../types/index.js';
import { getDb } from '../config/db.js';

const COLLECTION = 'contact_submissions';

export function getContactSubmissionCollection(): Collection<ContactSubmission> {
  return getDb().collection<ContactSubmission>(COLLECTION);
}
