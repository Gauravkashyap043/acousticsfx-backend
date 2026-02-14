import { MongoClient, type MongoClientOptions } from 'mongodb';
import { env } from './env.js';

const options: MongoClientOptions = {};

export const client = new MongoClient(env.MONGODB_URI, options);

export async function connectDb(): Promise<void> {
  await client.connect();
}

export async function disconnectDb(): Promise<void> {
  await client.close();
}

export function getDb() {
  return client.db();
}
