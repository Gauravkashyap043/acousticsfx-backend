import type { Collection } from 'mongodb';
import type { NewsletterSubscription } from '../types/index.js';
import { getDb } from '../config/db.js';

const COLLECTION = 'newsletter_subscriptions';

export function getNewsletterSubscriptionCollection(): Collection<NewsletterSubscription> {
  return getDb().collection<NewsletterSubscription>(COLLECTION);
}
