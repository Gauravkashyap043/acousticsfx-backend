import type { Collection } from 'mongodb';
import type { Testimonial as TestimonialType } from '../types/index.js';
import { getDb } from '../config/db.js';

const COLLECTION = 'testimonials';

export function getTestimonialCollection(): Collection<TestimonialType> {
  return getDb().collection<TestimonialType>(COLLECTION);
}
