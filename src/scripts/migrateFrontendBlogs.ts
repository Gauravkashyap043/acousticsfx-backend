/**
 * Migrates frontend blog data (LatestBlogs fallbacks + any static content) into the backend.
 * Idempotent: skips insert when a blog with the same slug already exists.
 * Run: npm run migrate:blogs  (from acousticsfx-backend)
 */
import { connectDb, disconnectDb } from '../config/db.js';
import { getBlogCollection } from '../models/Blog.js';
import type { Blog } from '../types/index.js';

/** Same shape as frontend LatestBlogs FALLBACK_BLOGS */
const FRONTEND_BLOGS: {
  id: string;
  slug: string;
  tag: string;
  date: string;
  title: string;
  desc: string;
  image: string;
}[] = [
  {
    id: '1',
    slug: 'the-power-of-restraint-in-architecture',
    tag: 'Insights',
    date: 'May 30, 2025',
    title: 'The Power of Restraint in Architecture',
    desc: 'A look at how simplicity can sharpen communication.',
    image: '/assets/home/Container2.png',
  },
  {
    id: '2',
    slug: 'architecting-for-calm-ux-beyond-the-screen',
    tag: 'Digital Architect',
    date: 'May 23, 2025',
    title: 'Architecting for Calm: UX Beyond the Screen',
    desc: 'An exploration of how subtle interaction shapes user emotion.',
    image: '/assets/home/Container.png',
  },
  {
    id: '3',
    slug: 'building-a-timeless-identity',
    tag: 'Strategy',
    date: 'May 16, 2025',
    title: 'Building a Timeless Identity',
    desc: 'A guide to creating brands that transcend trends.',
    image: '/assets/home/Container3.png',
  },
];

function parseDate(s: string): Date {
  const d = new Date(s);
  return isNaN(d.getTime()) ? new Date() : d;
}

async function run(): Promise<void> {
  await connectDb();
  const coll = getBlogCollection();

  for (const b of FRONTEND_BLOGS) {
    const existing = await coll.findOne({ slug: b.slug });
    if (existing) {
      console.log('Skip (exists):', b.slug);
      continue;
    }
    const now = new Date();
    const publishedAt = parseDate(b.date);
    const doc: Blog = {
      slug: b.slug,
      title: b.title,
      excerpt: b.desc,
      content: `<p>${b.desc}</p><p>This article was migrated from the frontend. You can edit the full content in the admin.</p>`,
      heroImage: b.image,
      authorName: 'AcousticsFX',
      tags: [b.tag],
      publishedAt,
      createdAt: now,
      updatedAt: now,
    };
    await coll.insertOne(doc);
    console.log('Inserted:', b.slug);
  }

  await disconnectDb();
  console.log('Done.');
  process.exit(0);
}

run().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
