import 'dotenv/config';

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required env: ${name}`);
  return value;
}

export const env = {
  NODE_ENV: process.env.NODE_ENV ?? 'development',
  PORT: parseInt(process.env.PORT ?? '8080', 10),
  MONGODB_URI: requireEnv('MONGODB_URI'),
  JWT_SECRET: requireEnv('JWT_SECRET'),
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN ?? '7d',
  /** Base URL of admin app for reset link (e.g. https://admin.acousticsfx.com). Required for forgot-password email. */
  ADMIN_RESET_BASE_URL: process.env.ADMIN_RESET_BASE_URL ?? 'http://localhost:5173',
  /** Optional SMTP; if unset, reset link is logged to console only (dev). */
  SMTP_HOST: process.env.SMTP_HOST,
  SMTP_PORT: process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : undefined,
  SMTP_SECURE: process.env.SMTP_SECURE === 'true',
  SMTP_USER: process.env.SMTP_USER,
  SMTP_PASS: process.env.SMTP_PASS,
  /** From address for reset emails */
  SMTP_FROM: process.env.SMTP_FROM ?? 'AcousticsFX Admin <noreply@acousticsfx.com>',
  /** ImageKit (optional). If set, admin image uploads go to ImageKit. Supports IMAGEKIT_* or imagekit_* env vars. */
  IMAGEKIT_PRIVATE_KEY:
    process.env.IMAGEKIT_PRIVATE_KEY ?? process.env.imagekit_private_key,
  IMAGEKIT_PUBLIC_KEY:
    process.env.IMAGEKIT_PUBLIC_KEY ?? process.env.imagekit_public_key,
  IMAGEKIT_URL_ENDPOINT:
    process.env.IMAGEKIT_URL_ENDPOINT ?? process.env.imagekit_url_endpoint,
} as const;
