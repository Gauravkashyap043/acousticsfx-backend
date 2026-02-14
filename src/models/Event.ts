import type { Collection } from 'mongodb';
import type { Event as EventType } from '../types/index.js';
import { getDb } from '../config/db.js';

const COLLECTION = 'events';

export function getEventCollection(): Collection<EventType> {
  return getDb().collection<EventType>(COLLECTION);
}
