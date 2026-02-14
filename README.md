# acousticsfx-backend

Express API for AcousticsFX: MongoDB persistence and JWT-based admin authentication.

## Stack

- **Runtime**: Node.js, TypeScript (ESM)
- **Server**: Express 4, CORS enabled (origin: true, credentials: true)
- **DB**: MongoDB (native driver), no ODM
- **Auth**: JWT (jsonwebtoken), bcrypt for password hashing

## Scripts

| Command | Description |
|--------|-------------|
| `npm run dev` | Start dev server with tsx watch (default port 8080) |
| `npm run build` | Compile to `dist/` |
| `npm run start` | Run `node dist/index.js` |
| `npm run seed` | Seed default admin (see [Seeding](#seeding)) |
| `npm run seed:content` | Seed default content keys (idempotent; see [Content seeding](#content-seeding)) |

## Environment

Create `.env` in this folder:

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `MONGODB_URI` | Yes | — | MongoDB connection string |
| `JWT_SECRET` | Yes | — | Secret for signing JWTs |
| `PORT` | No | 8080 | Server port |
| `JWT_EXPIRES_IN` | No | 7d | JWT expiry (e.g. 7d, 24h) |

Validated in `src/config/env.ts`; missing required vars throw on startup.

## Project layout

```
src/
├── index.ts              # App entry: Express setup, route mount, start()
├── config/
│   ├── db.ts             # MongoClient, connectDb(), disconnectDb(), getDb()
│   └── env.ts            # Env validation and export
├── types/
│   └── index.ts          # Admin, AdminRole, Content, JwtPayload, Request.admin
├── lib/
│   └── permissions.ts    # can(role, permission), PERMISSIONS, role → permissions
├── models/
│   ├── Admin.ts          # getAdminCollection() → Collection<Admin>
│   └── Content.ts        # getContentCollection() → Collection<Content>
├── controllers/
│   ├── authController.ts # login(), me()
│   ├── contentController.ts  # getByKeys() — public content read
│   └── adminController.ts    # listContent, getContentByKey, upsertContent, deleteContent
├── middleware/
│   └── auth.ts           # requireAuth, requirePermission(permission)
├── routes/
│   ├── auth.ts           # POST /login, GET /me (requireAuth)
│   ├── content.ts        # GET /api/content?keys=...
│   └── admin.ts          # GET/PUT/DELETE /api/admin/content (requireAuth + requirePermission)
└── scripts/
    ├── seedAdmin.ts      # One-off seed script (creates admin with role super_admin)
    └── migrateAdminRoles.ts  # One-off: set role for existing admins missing role
```

## API

### Health

- **GET** `/health` — `{ status: "ok" }` (no auth)

### Auth (prefix `/api/auth`)

- **POST** `/api/auth/login`  
  Body: `{ email: string, password: string }`  
  Success: `200` `{ token: string, admin: { id, email, role } }`  
  Errors: `400` (missing/invalid body), `401` (invalid credentials), `500`

- **GET** `/api/auth/me`  
  Header: `Authorization: Bearer <token>`  
  Success: `200` `{ admin: { id, email, role } }`  
  Errors: `401` (no token / invalid / expired)

### Content (prefix `/api/content`) — public

- **GET** `/api/content?keys=key1,key2`  
  No auth. Returns `{ [key: string]: { value: string, type?: "text" | "image" } }` for requested keys. Keys not found are omitted. Key naming: use dot notation, e.g. `home.hero.title`, `about.hero.heading`.

### Admin (prefix `/api/admin`) — all require `Authorization: Bearer <token>`

- **GET** `/api/admin/content?limit=50&skip=0` — List content (paginated). Requires `content:read`.
- **GET** `/api/admin/content/:key` — Get one entry. Requires `content:read`.
- **PUT** `/api/admin/content/:key` — Upsert. Body: `{ value: string, type?: "text" | "image" }`. Requires `content:write`.
- **DELETE** `/api/admin/content/:key` — Delete entry. Requires `content:write`.

## Roles and permissions

| Role        | content:read | content:write | users:read | users:write | system:manage |
|------------|--------------|---------------|------------|-------------|---------------|
| editor     | ✓            | ✓             | —          | —           | —             |
| admin      | ✓            | ✓             | ✓          | ✓           | —             |
| super_admin| ✓            | ✓             | ✓          | ✓           | ✓             |

To add a role or permission: edit `src/lib/permissions.ts` (ROLE_PERMISSIONS and PERMISSIONS).

**Super-admin invariant:** At least one `super_admin` must always exist. When adding admin/user CRUD (e.g. delete admin or update role), call `assertAtLeastOneSuperAdminRemains(getAdminCollection(), adminIdBeingRemovedOrDemoted)` from `src/lib/superAdminGuard.ts` before performing the operation; it throws if the operation would leave zero super_admins.

## Conventions

- **ESM**: All relative imports use `.js` extension (e.g. `from './config/db.js'`).
- **DB access**: Use `getDb()` from `config/db.js`; models expose `getXCollection()` returning typed `Collection<Type>`.
- **Auth**: Protected handlers use `requireAuth`; then `req.admin` is `{ id, email, role }`. Use `requirePermission('permission:name')` for role-based access.
- **Responses**: JSON; errors use `{ error: string }`. Use 400 validation, 401 unauthorized, 403 forbidden, 500 server.
- **New routes**: Add router in `src/routes/`, mount in `index.ts`. For admin-only: mount under `/api/admin` with `requireAuth` and `requirePermission(...)`.

## Types

- **Admin**: `_id?`, `email`, `passwordHash`, `role?: AdminRole`, `createdAt`.
- **AdminRole**: `'super_admin' | 'admin' | 'editor'`.
- **Content**: `key`, `value`, `type?`, `updatedAt?`, `updatedBy?`.
- **JwtPayload**: `sub`, `email`, `role?`, optional `iat`/`exp`.
- **Express.Request**: `admin?: { id, email, role }` (set by `requireAuth`).

## Seeding

- **`npm run seed`**: Creates admin `admin@acousticsfx.com` / `acoustic1234` with `role: 'super_admin'` if not present.
- **Existing admins without role**: run `npx tsx src/scripts/migrateAdminRoles.ts` once to set `role: 'super_admin'`.

### Content seeding

- **`npm run seed:content`**: Inserts default content keys only when each key does not already exist (idempotent). Does not overwrite existing values. Default keys include `home.hero.title`, `home.hero.subtitle`, `home.hero.backgroundImage`, `about.hero.heading`, `about.hero.subtitle`, `about.hero.backgroundImage`. Safe to run multiple times; logs "Inserted: N, skipped: M".

## Adding a new resource

1. **Types**: Add interface in `src/types/index.ts` if shared.
2. **Model**: e.g. `src/models/Resource.ts` with `getResourceCollection()`.
3. **Controller**: Handlers in `src/controllers/` (use `adminController` for protected admin actions).
4. **Routes**: Mount in `index.ts`. Protected: use `requireAuth` and `requirePermission(...)`.
