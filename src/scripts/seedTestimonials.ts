/**
 * Idempotent testimonial seed: skips if any testimonials already exist.
 * Run: npx tsx src/scripts/seedTestimonials.ts  (or npm run seed:testimonials)
 */
import { connectDb, disconnectDb } from '../config/db.js';
import { getTestimonialCollection } from '../models/Testimonial.js';
import type { Testimonial } from '../types/index.js';

const DEFAULT_TESTIMONIALS: Omit<Testimonial, '_id' | 'createdAt' | 'updatedAt'>[] = [
  {
    company: 'VMware',
    companyLogo: '/assets/about/vmware.svg.svg',
    text: 'AcousticsFX transformed our open-plan office into a productive space. The acoustic panels reduced noise by 60% while adding a sleek, modern aesthetic.',
    name: 'Rajesh Kumar',
    role: 'Facilities Director at VMware',
    avatar: '',
    order: 1,
  },
  {
    company: 'DocuSign',
    companyLogo: '/assets/about/Docusign-Testimonials-280-60-Baseline.svg.svg',
    text: 'We needed sound isolation for our recording studios without compromising the design. AcousticsFX delivered on both fronts — the results speak for themselves.',
    name: 'Priya Sharma',
    role: 'Head of Design at DocuSign',
    avatar: '',
    order: 2,
  },
  {
    company: 'Frog Design',
    companyLogo: '/assets/about/frog.svg.svg',
    text: 'Their team understood our vision from day one. The wood acoustic panels in our auditorium are both beautiful and incredibly effective at managing reverb.',
    name: 'Anil Mehta',
    role: 'Senior Architect at Frog Design',
    avatar: '',
    order: 3,
  },
  {
    company: 'Tata Consultancy',
    companyLogo: '',
    text: 'From consultation to installation, the process was seamless. Our conference rooms now have crystal-clear audio quality for hybrid meetings.',
    name: 'Sneha Patel',
    role: 'VP Operations at TCS',
    avatar: '',
    order: 4,
  },
  {
    company: 'WeWork India',
    companyLogo: '',
    text: 'We deployed AcousticsFX panels across 12 co-working floors. The noise reduction was immediate, and tenant satisfaction scores jumped significantly.',
    name: 'Vikram Singh',
    role: 'Regional Manager at WeWork India',
    avatar: '',
    order: 5,
  },
];

async function seed(): Promise<void> {
  await connectDb();

  const coll = getTestimonialCollection();
  const existing = await coll.countDocuments();

  if (existing > 0) {
    console.log(`Testimonials seed skipped: ${existing} testimonials already exist.`);
    await disconnectDb();
    process.exit(0);
    return;
  }

  const now = new Date();
  const docs: Testimonial[] = DEFAULT_TESTIMONIALS.map((t) => ({
    ...t,
    createdAt: now,
    updatedAt: now,
  }));

  const result = await coll.insertMany(docs);
  console.log(`Testimonials seed done. Inserted: ${result.insertedCount}`);
  await disconnectDb();
  process.exit(0);
}

seed().catch((err) => {
  console.error('Testimonials seed failed:', err);
  process.exit(1);
});
