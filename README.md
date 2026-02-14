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
│   └── index.ts          # Admin, JwtPayload, Express.Request.admin
├── models/
│   └── Admin.ts          # getAdminCollection() → Collection<Admin>
├── controllers/
│   └── authController.ts # login(), me()
├── middleware/
│   └── auth.ts           # requireAuth: Bearer JWT → req.admin
├── routes/
│   └── auth.ts           # POST /login, GET /me (requireAuth)
└── scripts/
    └── seedAdmin.ts      # One-off seed script
```

## API

### Health

- **GET** `/api/health` — `{ status: "ok" }` (no auth)

### Auth (prefix `/api/auth`)

- **POST** `/api/auth/login`  
  Body: `{ email: string, password: string }`  
  Success: `200` `{ token: string, admin: { id, email } }`  
  Errors: `400` (missing/invalid body), `401` (invalid credentials), `500`

- **GET** `/api/auth/me`  
  Header: `Authorization: Bearer <token>`  
  Success: `200` `{ admin: { id, email } }`  
  Errors: `401` (no token / invalid / expired)

## Conventions

- **ESM**: All relative imports use `.js` extension (e.g. `from './config/db.js'`).
- **DB access**: Use `getDb()` from `config/db.js`; models expose `getXCollection()` returning typed `Collection<Type>`.
- **Auth**: Protected handlers rely on `requireAuth`; after that `req.admin` is `{ id: string, email: string }` (from JWT `sub` and `email`).
- **Responses**: JSON; errors use `{ error: string }`. Use 400 for validation, 401 for auth, 500 for server errors.
- **New routes**: Add router in `src/routes/`, mount in `src/index.ts` with `app.use('/api/...', routes)`.

## Types

- **Admin** (`types/index.ts`): `_id?`, `email`, `passwordHash`, `createdAt`.
- **JwtPayload**: `sub` (admin id), `email`, optional `iat`/`exp`.
- **Express.Request**: Augmented with `admin?: { id, email }` (set by `requireAuth`).

## Seeding

`npm run seed` runs `src/scripts/seedAdmin.ts`:

- Connects to DB, checks for existing admin with email `admin@acousticsfx.com`.
- If none: creates one with password `acoustic1234` (bcrypt, 10 rounds), then exits.
- If exists: logs and exits. No `.env` changes; ensure `MONGODB_URI` and `JWT_SECRET` are set.

## Adding a new resource

1. **Types**: Add interface in `src/types/index.ts` if shared.
2. **Model**: e.g. `src/models/Resource.ts` with `getResourceCollection()` using `getDb().collection<Resource>('resources')`.
3. **Controller**: Handlers in `src/controllers/` (e.g. `resourceController.ts`).
4. **Routes**: New router in `src/routes/`, mount in `index.ts` (e.g. `app.use('/api/resources', resourceRoutes)`).
5. **Auth**: Use `requireAuth` middleware for any protected route.
