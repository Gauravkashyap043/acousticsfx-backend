# Products API

Public API for the frontend `/products` and `/products/*` pages. All endpoints are **GET** and do not require authentication.

## Data model

- **Category** – e.g. Acoustic Solutions, Flooring, Noise. Has `slug`, `name`, `description`, `image`, `order`.
- **Product** – e.g. Wood Acoustic Panel. Has `slug`, `title`, `description`, `image`, `heroImage`, `subProducts[]`, `categorySlug`, `order`. Belongs to one category.
- **SubProduct** – e.g. Perfomax. Embedded in a product. Has `slug`, `title`, `description`, `image`.

URL structure on the frontend mirrors the API:

- `/products` → use **categories** + optionally **products**
- `/products/:categorySlug` (e.g. `/products/acoustic`) → **category by slug** (returns category + products)
- `/products/:categorySlug/:productSlug` → **product by slug**
- `/products/:categorySlug/:productSlug/:subProductSlug` → **sub-product** (product + subProduct)

---

## Endpoints

### List categories

```http
GET /api/products/categories
```

**Response**

```json
{
  "categories": [
    {
      "slug": "acoustic",
      "name": "Acoustic Solutions",
      "description": "...",
      "image": null,
      "order": 0
    }
  ]
}
```

Use for nav dropdown and products overview.

---

### Category details + products

```http
GET /api/products/categories/:categorySlug
```

Example: `GET /api/products/categories/acoustic`

**Response**

```json
{
  "category": {
    "slug": "acoustic",
    "name": "Acoustic Solutions",
    "description": "...",
    "image": null,
    "order": 0
  },
  "products": [
    {
      "slug": "wood-acoustic-panel",
      "title": "Wood Acoustic Panel",
      "description": "...",
      "image": "/assets/product/product-card-1.png",
      "heroImage": "/assets/product/product-hero.png",
      "subProducts": [
        { "slug": "linearlux", "title": "Linerlux", "description": "...", "image": "..." }
      ]
    }
  ]
}
```

Use for `/products/acoustic` (category page).

---

### List products (optional filter by category)

```http
GET /api/products
GET /api/products?category=acoustic
```

**Response**

```json
{
  "products": [
    {
      "slug": "wood-acoustic-panel",
      "title": "Wood Acoustic Panel",
      "description": "...",
      "image": "...",
      "heroImage": "...",
      "subProducts": [],
      "categorySlug": "acoustic"
    }
  ]
}
```

Use for main `/products` page or when you need all products (optionally filtered).

---

### Product by slug

```http
GET /api/products/slug/:productSlug
```

Example: `GET /api/products/slug/wood-wool-acoustic-panel`

**Response**

```json
{
  "slug": "wood-wool-acoustic-panel",
  "title": "Wood Wool Acoustic Panel",
  "description": "...",
  "image": "...",
  "heroImage": "...",
  "subProducts": [
    { "slug": "perfomax", "title": "Perfomax", "description": "...", "image": "..." }
  ],
  "categorySlug": "acoustic"
}
```

Use for `/products/acoustic/wood-wool-acoustic-panel` (product detail page). Product slug is unique across all categories.

---

### Sub-product by slug

```http
GET /api/products/slug/:productSlug/sub-products/:subProductSlug
```

Example: `GET /api/products/slug/wood-wool-acoustic-panel/sub-products/perfomax`

**Response**

```json
{
  "product": {
    "slug": "wood-wool-acoustic-panel",
    "title": "Wood Wool Acoustic Panel",
    "categorySlug": "acoustic"
  },
  "subProduct": {
    "slug": "perfomax",
    "title": "Perfomax",
    "description": "...",
    "image": "..."
  }
}
```

Use for `/products/acoustic/wood-wool-acoustic-panel/perfomax` (sub-product detail page).

---

## Seeding

1. Seed categories (run once):

   ```bash
   yarn seed:categories
   ```

2. Seed products (run once; products get `categorySlug: 'acoustic'`):

   ```bash
   yarn seed:products
   ```

Default categories: `acoustic`, `flooring`, `noise-solutions`. Default products all belong to `acoustic`. Add more products/categories via the admin or by extending the seed scripts.

---

## Admin

Products (and categories, if you add admin UI) are managed via the admin app. Product create/update accepts `categorySlug` so products can be assigned to a category.
