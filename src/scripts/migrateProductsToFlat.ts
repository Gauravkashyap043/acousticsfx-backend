/**
 * One-time migration: nested products (with subProducts[]) → flat product documents.
 * Run: npx tsx src/scripts/migrateProductsToFlat.ts
 *
 * - Each former sub-product becomes its own product (slug = sub.slug, or parent-sub if collision).
 * - Products with no sub-products become a single flat document (same slug).
 * - Drops subProducts, panelsSectionTitle, panelsSectionDescription from stored documents.
 */
import { connectDb, disconnectDb } from '../config/db.js';
import { getProductCollection } from '../models/Product.js';
import type { Product } from '../types/index.js';

type LegacyProduct = Product & {
  subProducts?: Array<Record<string, unknown>>;
  panelsSectionTitle?: string;
  panelsSectionDescription?: string;
};

function stripLegacy(p: Record<string, unknown>): void {
  delete p.subProducts;
  delete p.panelsSectionTitle;
  delete p.panelsSectionDescription;
}

async function migrate(): Promise<void> {
  await connectDb();
  const coll = getProductCollection();
  const raw = await coll.find({}).toArray();
  if (raw.length === 0) {
    console.log('No products to migrate.');
    await disconnectDb();
    process.exit(0);
    return;
  }

  const hasNested = raw.some((d) => Array.isArray((d as LegacyProduct).subProducts));
  if (!hasNested) {
    console.log('No nested subProducts found; normalizing legacy keys only.');
    for (const doc of raw) {
      const o = doc as unknown as Record<string, unknown>;
      if ('subProducts' in o || 'panelsSectionTitle' in o) {
        stripLegacy(o);
        await coll.replaceOne({ _id: doc._id }, o as unknown as Product);
      }
    }
    await disconnectDb();
    process.exit(0);
    return;
  }

  const newDocs: Product[] = [];
  const usedSlugs = new Set<string>();

  function uniqueSlug(base: string): string {
    let s = base;
    let n = 0;
    while (usedSlugs.has(s)) {
      n += 1;
      s = `${base}-${n}`;
    }
    usedSlugs.add(s);
    return s;
  }

  for (const doc of raw as LegacyProduct[]) {
    const subs = doc.subProducts;
    const parent = doc as unknown as Record<string, unknown>;
    stripLegacy(parent);

    if (subs && subs.length > 0) {
      for (const sub of subs) {
        const subSlug = typeof sub.slug === 'string' ? sub.slug : 'item';
        const slug = uniqueSlug(subSlug);
        const flat: Product = {
          slug,
          title: typeof sub.title === 'string' ? sub.title : slug,
          description: typeof sub.description === 'string' ? sub.description : '',
          image: typeof sub.image === 'string' ? sub.image : (typeof doc.image === 'string' ? doc.image : ''),
          heroImage: doc.heroImage,
          showTrademark: sub.showTrademark === true || doc.showTrademark === true,
          categorySlug: doc.categorySlug,
          order: doc.order ?? 0,
          shortDescription: doc.shortDescription,
          metaTitle: doc.metaTitle,
          metaDescription: doc.metaDescription,
          specSectionTitle: sub.specSectionTitle as string | undefined,
          specDescription: sub.specDescription as string | undefined,
          specs: sub.specs as Product['specs'],
          gallerySlides: sub.gallerySlides as Product['gallerySlides'],
          galleryImages: sub.galleryImages as Product['galleryImages'],
          profilesSection: sub.profilesSection as Product['profilesSection'],
          substratesSection: sub.substratesSection as Product['substratesSection'],
          aboutTabs: sub.aboutTabs as Product['aboutTabs'],
          certificationsSectionTitle: sub.certificationsSectionTitle as string | undefined,
          certificationsSectionDescription: sub.certificationsSectionDescription as string | undefined,
          certifications: sub.certifications as Product['certifications'],
          finishesSection: sub.finishesSection as Product['finishesSection'],
          createdAt: doc.createdAt ?? new Date(),
          updatedAt: new Date(),
        };
        newDocs.push(flat);
      }
    } else {
      const flat: Product = {
        slug: doc.slug,
        title: doc.title,
        description: doc.description,
        image: doc.image,
        heroImage: doc.heroImage,
        showTrademark: doc.showTrademark === true,
        categorySlug: doc.categorySlug,
        order: doc.order ?? 0,
        shortDescription: doc.shortDescription,
        metaTitle: doc.metaTitle,
        metaDescription: doc.metaDescription,
        createdAt: doc.createdAt ?? new Date(),
        updatedAt: new Date(),
      };
      usedSlugs.add(flat.slug);
      newDocs.push(flat);
    }
  }

  await coll.deleteMany({});
  if (newDocs.length) {
    await coll.insertMany(newDocs);
  }
  console.log(`Migrated to ${newDocs.length} flat product document(s).`);
  await disconnectDb();
  process.exit(0);
}

migrate().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
