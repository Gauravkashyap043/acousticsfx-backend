/**
 * Idempotent products + sub-products seed.
 * Run (from acousticsfx-backend): npx tsx src/scripts/seedProducts.ts
 *
 * This inserts a demo Acoustic product and a Linearlux sub-product
 * with all the rich sections used on the product detail page.
 */
import { connectDb, disconnectDb } from '../config/db.js';
import { getProductCollection } from '../models/Product.js';
import type { Product } from '../types/index.js';

const DEFAULT_PRODUCTS: Omit<Product, '_id' | 'createdAt' | 'updatedAt'>[] = [
  {
    slug: 'wood-acoustic-panel',
    title: 'Wood Acoustic Panel',
    description:
      'High-performance wood acoustic panels designed to combine warm aesthetics with precise sound control for auditoriums, lecture halls, conference rooms and public spaces.',
    image: '/assets/product/product-card-1.png',
    heroImage: '/assets/product/product-hero.png',
    categorySlug: 'acoustic',
    order: 0,
    shortDescription:
      'Linear grooved wood acoustic panels with multiple profile options and premium finishes.',
    panelsSectionTitle: 'OUR ACOUSTIC PANELS',
    panelsSectionDescription:
      'Discover our range of acoustic panels engineered to balance technical performance with architectural elegance.',
    subProducts: [
      {
        slug: 'linearlux',
        title: 'Linearlux',
        description:
          'Linearlux panels transform sound into an experience. With precision grooves and natural textures, they bring warmth and clarity to demanding interior spaces.',
        image: '/assets/product/product-hero.png',
        gridIntro: {
          title: 'Linear grooved acoustic panel',
          subtitle: 'New Design – Linearlux',
          body:
            'A linear grooved acoustic panel is one of the most commonly used multi-groove panels. Suitable for auditoriums, lecture halls, conference rooms and public buildings, linear grooved acoustic panels provide a warm organic surface effect.',
        },
        gridImages: [
          {
            url: '/assets/product/acoustic-feature-1.jpg',
            alt: 'Linearlux feature wall in meeting room',
          },
          {
            url: '/assets/product/acoustic-feature-2.jpg',
            alt: 'Timber slatted ceiling installation',
          },
          {
            url: '/assets/product/gallery-image-1.jpg',
            alt: 'Detail of linear grooves and joints',
          },
        ],
        specDescription:
          'High-end, high-efficiency acoustic lining system with a range of design and performance options. When fitted in plank form, this product creates an exquisite grooved look with perfect jointing.',
        specs: [
          {
            label: 'Product',
            value: 'A well-rounded product with great sound. That’s Perfo.',
          },
          {
            label: 'Category',
            value: 'Available as panels.',
          },
          {
            label: 'Fire Rating',
            value: 'A2, B1 or B2.',
          },
          {
            label: 'Substrate',
            value: 'Ceiling/wall, partition wall and doubling.',
          },
          {
            label: 'Sound absorption',
            value: '25%, 30%, 35%, 45%, 50%, 65%, 70%, 75%, 80%, 85% or 95%.',
          },
          {
            label: 'Standard panel size',
            value: '25%, 30%, 35%, 45%, 50%, 65%, 70%, 75%, 80%, 85% or 95%.',
          },
        ],
        gallerySlides: [
          {
            large: '/assets/product/gallery-image-1.jpg',
            small: '/assets/product/gallery-image-2.png',
          },
          {
            large: '/assets/product/linearlux-grid-1.jpg',
            small: '/assets/product/linearlux-grid-2.png',
          },
        ],
        profilesSection: {
          title: 'Product Profiles',
          description:
            'Choose from a range of groove profiles to match your acoustic and visual requirements.',
          profiles: [
            {
              id: '1-5-8x8',
              name: '1.5/8x8',
              size: '30 x 30 cm',
              description: 'Square centres – 25 mm with multiple hole diameter options.',
              image: '/assets/product/icon-default.svg',
            },
            {
              id: '3-8x8',
              name: '3/8x8',
              size: '30 x 30 cm',
              image: '/assets/product/icon-default.svg',
            },
          ],
        },
        substratesSection: {
          title: 'Substrates',
          description:
            'Our inspired solutions have helped shape modern acoustic design. Each substrate is selected for stability, durability and acoustic performance.',
          items: [
            {
              name: 'Moisture Resistant MDF',
              thickness: '12, 16, 18mm',
              description: 'Ideal for high-humidity environments while maintaining dimensional stability.',
              image: '/assets/product/substrate-1.png',
            },
            {
              name: 'FR Charcoal MDF',
              thickness: '12, 18mm',
              description: 'Fire-rated substrate offering enhanced safety in public spaces.',
              image: '/assets/product/substrate-2.png',
            },
          ],
        },
        aboutTabs: [
          {
            key: 'advantages',
            title: 'Advantages',
            rows: [
              'Best possible combination of acoustics and aesthetics.',
              'Wide variety of surface finishes available.',
              'Range of acoustic performance options.',
              'Easy to handle, transport, store and install.',
            ],
          },
          {
            key: 'key-features',
            title: 'Key Features',
            rows: [
              'Seamless jointing with tongue and groove design.',
              'Natural timber veneers, painted finishes and laminates.',
              'Various groove profiles for maximum design flexibility.',
            ],
          },
        ],
        certifications: [
          {
            name: 'GECA Certified',
            image: '/assets/product/certification-1.png',
            description: 'Third-party certification for environmental performance.',
          },
          {
            name: 'FSC Certified',
            image: '/assets/product/certification-2.png',
          },
        ],
        finishesSection: {
          title: 'Finishes & Shades',
          description:
            'Choose from an extensive range of timber veneers and laminates to match your design vision.',
          items: [
            {
              name: 'Natural Teak',
              description: 'A warm, versatile wood look suitable for many applications.',
              image: '/assets/product/finish-shade-1.jpg',
            },
            {
              name: 'Douglas Pine',
              description: 'Light-toned finish to brighten modern interiors.',
              image: '/assets/product/finish-shade-2.jpg',
            },
          ],
        },
      },
      {
        slug: 'acoperf',
        title: 'Acoperf',
        description:
          'Acoperf panels feature precision perforations that enhance acoustic performance while maintaining elegant aesthetics.',
        image: '/assets/product/product-card-2.png',
      },
      {
        slug: 'microatlas',
        title: 'Microatlas',
        description:
          'Microatlas panels utilize micro-perforation technology for superior sound absorption in sophisticated architectural environments.',
        image: '/assets/product/product-card-3.png',
      },
    ],
  },
  {
    slug: 'fabric-acoustic-panel',
    title: 'Fabric Acoustic Panel',
    description:
      'Fabric acoustic panels provide excellent sound absorption and aesthetic appeal with customizable design options.',
    image: '/assets/product/product-card-2.png',
    heroImage: '/assets/product/product-hero.png',
    categorySlug: 'acoustic',
    order: 1,
    subProducts: [],
  },
  {
    slug: 'baffle-clouds',
    title: 'Baffle & Clouds',
    description:
      'Baffle and cloud acoustic solutions provide effective sound absorption for large spaces while creating a distinctive visual impact.',
    image: '/assets/product/product-card-3.png',
    heroImage: '/assets/product/product-hero.png',
    categorySlug: 'acoustic',
    order: 2,
    subProducts: [],
  },
  {
    slug: 'wood-wool-acoustic-panel',
    title: 'Wood Wool Acoustic Panel',
    description:
      'Wood wool acoustic panels combine natural wood fibers with excellent sound absorption properties for sustainable acoustic solutions.',
    image: '/assets/product/product-card-7.png',
    heroImage: '/assets/product/product-hero.png',
    categorySlug: 'acoustic',
    order: 3,
    subProducts: [],
  },
];

async function seed(): Promise<void> {
  await connectDb();

  const coll = getProductCollection();
  const count = await coll.countDocuments();
  if (count > 0) {
    console.log(`Products collection already has ${count} document(s). Skipping seed.`);
    await disconnectDb();
    process.exit(0);
    return;
  }

  const now = new Date();
  await coll.insertMany(
    DEFAULT_PRODUCTS.map((p) => ({
      ...p,
      createdAt: now,
      updatedAt: now,
    }))
  );
  console.log(`Inserted ${DEFAULT_PRODUCTS.length} product(s) with sub-products.`);
  await disconnectDb();
  process.exit(0);
}

seed().catch((err) => {
  console.error('Products seed failed:', err);
  process.exit(1);
});
