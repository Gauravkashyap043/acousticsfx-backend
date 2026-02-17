/**
 * Idempotent blog seed: skips if any blogs already exist.
 * Run: npx tsx src/scripts/seedBlogs.ts  (or npm run seed:blogs)
 */
import { connectDb, disconnectDb } from '../config/db.js';
import { getBlogCollection } from '../models/Blog.js';
import type { Blog } from '../types/index.js';

const DEFAULT_BLOGS: Omit<Blog, '_id' | 'createdAt' | 'updatedAt'>[] = [
  {
    slug: 'the-power-of-restraint-in-architecture',
    title: 'The Power of Restraint in Architecture',
    excerpt:
      'A look at how simplicity can sharpen communication, increase impact, and build longer-lasting brands.',
    content: '<p>A look at how simplicity can sharpen communication, increase impact, and build longer-lasting brands.</p>',
    heroImage: '/assets/home/Container2.png',
    authorName: 'AcousticsFX Team',
    tags: ['Insights'],
    isPublished: true,
    views: 0,
    publishedAt: new Date('2025-05-30'),
  },
  {
    slug: 'architecting-for-calm-ux-beyond-the-screen',
    title: 'Architecting for Calm: UX Beyond the Screen',
    excerpt:
      'An exploration of how subtle interaction, whitespace, and visual pacing shape user emotion.',
    content: '<p>An exploration of how subtle interaction, whitespace, and visual pacing shape user emotion.</p>',
    heroImage: '/assets/home/Container.png',
    authorName: 'AcousticsFX Team',
    tags: ['Digital Architect'],
    isPublished: true,
    views: 0,
    publishedAt: new Date('2025-05-23'),
  },
  {
    slug: 'building-a-timeless-identity',
    title: 'Building a Timeless Identity',
    excerpt:
      'A guide to creating brands that transcend trends, focusing on core values instead.',
    content: '<p>A guide to creating brands that transcend trends, focusing on core values instead.</p>',
    heroImage: '/assets/home/Container3.png',
    authorName: 'AcousticsFX Team',
    tags: ['Strategy'],
    isPublished: true,
    views: 0,
    publishedAt: new Date('2025-05-16'),
  },
];

async function seed(): Promise<void> {
  await connectDb();

  const coll = getBlogCollection();
  const existing = await coll.countDocuments();

  if (existing > 0) {
    console.log(`Blogs seed skipped: ${existing} blogs already exist.`);
    await disconnectDb();
    process.exit(0);
    return;
  }

  const now = new Date();
  const docs: Blog[] = DEFAULT_BLOGS.map((b) => ({
    ...b,
    createdAt: now,
    updatedAt: now,
  }));

  const result = await coll.insertMany(docs);
  console.log(`Blogs seed done. Inserted: ${result.insertedCount}`);
  await disconnectDb();
  process.exit(0);
}

seed().catch((err) => {
  console.error('Blogs seed failed:', err);
  process.exit(1);
});
