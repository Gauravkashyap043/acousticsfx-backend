# AcousticsFX Backend

Node.js + Express + TypeScript + MongoDB API for the admin panel.

## Setup

1. Copy env and set your MongoDB password and JWT secret:
   ```bash
   cp .env.example .env
   ```
   Edit `.env`: replace `<db_password>` in `MONGODB_URI` with `acoustic1234` (or your Atlas password), and set a strong `JWT_SECRET`.

2. Install and seed the default admin user:
   ```bash
   yarn install
   yarn seed
   ```
   This creates an admin with email `admin@acousticsfx.com` and password `acoustic1234` if none exists.

3. Run the server:
   ```bash
   yarn dev
   ```
   API runs at `http://localhost:3001`.

## API

- `POST /api/auth/login` — Body: `{ "email": "...", "password": "..." }`. Returns `{ token, admin: { id, email } }`.
- `GET /api/auth/me` — Header: `Authorization: Bearer <token>`. Returns current admin.
- `GET /api/health` — Health check.

## Scripts

- `yarn dev` — Start with hot reload (tsx watch).
- `yarn build` — Compile TypeScript to `dist/`.
- `yarn start` — Run compiled `dist/index.js`.
- `yarn seed` — Create default admin user in MongoDB.
