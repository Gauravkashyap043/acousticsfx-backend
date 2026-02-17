import { MongoClient, type Db } from 'mongodb';
import { env } from './env.js';

let client: MongoClient | null = null;
let db: Db | null = null;

export async function connectDb(): Promise<void> {
  if (client) return;
  client = new MongoClient(env.MONGODB_URI);
  await client.connect();
  db = client.db();
}

export async function disconnectDb(): Promise<void> {
  if (client) {
    await client.close();
    client = null;
    db = null;
  }
}

export function getDb(): Db {
  if (!db) throw new Error('Database not connected. Call connectDb() first.');
  return db;
}
