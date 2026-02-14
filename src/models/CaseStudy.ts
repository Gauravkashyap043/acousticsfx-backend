import type { Collection } from 'mongodb';
import type { CaseStudy as CaseStudyType } from '../types/index.js';
import { getDb } from '../config/db.js';

const COLLECTION = 'case_studies';

export function getCaseStudyCollection(): Collection<CaseStudyType> {
  return getDb().collection<CaseStudyType>(COLLECTION);
}
