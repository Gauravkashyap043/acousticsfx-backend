/**
 * Idempotent FAQ seed: skips if any already exist.
 * Run: npx tsx src/scripts/seedFaqs.ts  (or npm run seed:faqs)
 */
import { connectDb, disconnectDb } from '../config/db.js';
import { getFaqCollection } from '../models/Faq.js';
import type { Faq } from '../types/index.js';

const DEFAULT_FAQS: Omit<Faq, '_id' | 'createdAt' | 'updatedAt'>[] = [
  {
    question: 'What kind of clients do you work with?',
    answer:
      'We work with architects, interior designers, corporate offices, hospitality projects, educational institutions, and healthcare facilities. Our acoustic solutions are tailored to meet the unique requirements of each space and client.',
    order: 1,
    isPublished: true,
  },
  {
    question: 'What services do you offer?',
    answer:
      'We offer a comprehensive range of acoustic solutions including acoustic panels, ceiling baffles, wall treatments, flooring solutions, and custom acoustic design consultation. Our team handles everything from initial assessment to final installation.',
    order: 2,
    isPublished: true,
  },
  {
    question: 'How do you price your projects?',
    answer:
      'Pricing depends on the scope, materials, and complexity of the project. We provide detailed quotes after an initial site assessment or consultation. Contact us for a free estimate tailored to your specific needs.',
    order: 3,
    isPublished: true,
  },
  {
    question: 'What is your typical project timeline?',
    answer:
      'Timelines vary based on project size and complexity. Standard installations take 2–4 weeks from order confirmation. Custom solutions may require 4–8 weeks including design, fabrication, and installation.',
    order: 4,
    isPublished: true,
  },
  {
    question: 'Can we collaborate remotely?',
    answer:
      'Absolutely. We support remote consultations via video call and can work from architectural drawings, photos, and measurements. Our team can guide you through product selection and provide detailed installation instructions.',
    order: 5,
    isPublished: true,
  },
  {
    question: 'Do you accept one-off architect tasks or only full projects?',
    answer:
      'We welcome both. Whether you need a single acoustic panel for a conference room or a full building-wide acoustic treatment, we are happy to help with projects of any scale.',
    order: 6,
    isPublished: true,
  },
  {
    question: 'How many concepts or revisions are included?',
    answer:
      'Our standard consultation includes up to 3 design concepts with 2 rounds of revisions. Additional iterations can be accommodated based on project requirements.',
    order: 7,
    isPublished: true,
  },
];

async function seed(): Promise<void> {
  await connectDb();

  const coll = getFaqCollection();
  const existing = await coll.countDocuments();

  if (existing > 0) {
    console.log(`FAQ seed skipped: ${existing} already exist.`);
    await disconnectDb();
    process.exit(0);
    return;
  }

  const now = new Date();
  const docs: Faq[] = DEFAULT_FAQS.map((f) => ({
    ...f,
    createdAt: now,
    updatedAt: now,
  }));

  const result = await coll.insertMany(docs);
  console.log(`FAQ seed done. Inserted: ${result.insertedCount}`);
  await disconnectDb();
  process.exit(0);
}

seed().catch((err) => {
  console.error('FAQ seed failed:', err);
  process.exit(1);
});
