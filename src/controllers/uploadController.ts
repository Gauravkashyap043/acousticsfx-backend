import { Request, Response } from 'express';
import FormData from 'form-data';
import { env } from '../config/env.js';

const IMAGEKIT_UPLOAD_URL = 'https://upload.imagekit.io/api/v1/files/upload';

const ALLOWED_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml',
]);
const MAX_SIZE_BYTES = 25 * 1024 * 1024; // 25MB free tier

/**
 * POST /api/admin/upload-image
 * Expects multipart file field "file". Proxies to ImageKit and returns { url, fileId, ... }.
 * Requires IMAGEKIT_PRIVATE_KEY. Auth: requireAuth.
 */
export async function uploadImage(req: Request, res: Response): Promise<void> {
  if (!env.IMAGEKIT_PRIVATE_KEY) {
    res.status(503).json({ error: 'Image upload is not configured (IMAGEKIT_PRIVATE_KEY)' });
    return;
  }

  const file = req.file;
  if (!file) {
    res.status(400).json({ error: 'No file uploaded; use multipart field "file"' });
    return;
  }

  if (!ALLOWED_TYPES.has(file.mimetype)) {
    res.status(400).json({
      error: `Invalid file type. Allowed: ${[...ALLOWED_TYPES].join(', ')}`,
    });
    return;
  }

  if (file.size > MAX_SIZE_BYTES) {
    res.status(400).json({ error: `File too large (max ${MAX_SIZE_BYTES / 1024 / 1024}MB)` });
    return;
  }

  const baseName = file.originalname.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9._-]/g, '') || 'image';
  const ext = baseName.includes('.') ? baseName.slice(baseName.lastIndexOf('.')) : '';
  const fileName = ext ? baseName : `${baseName}.${mimeToExt(file.mimetype)}`;

  const form = new FormData();
  form.append('file', file.buffer, { filename: file.originalname });
  form.append('fileName', fileName);
  form.append('useUniqueFileName', 'true');
  if (env.IMAGEKIT_UPLOAD_FOLDER) {
    form.append('folder', env.IMAGEKIT_UPLOAD_FOLDER);
  }

  const auth = Buffer.from(`${env.IMAGEKIT_PRIVATE_KEY}:`).toString('base64');

  try {
    const response = await fetch(IMAGEKIT_UPLOAD_URL, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${auth}`,
        ...form.getHeaders(),
      },
      body: form as unknown as BodyInit,
    });

    const data = (await response.json()) as {
      url?: string;
      fileId?: string;
      message?: string;
      error?: string;
    };

    if (!response.ok) {
      const msg = data.message ?? data.error ?? response.statusText;
      res.status(response.status >= 500 ? 502 : 400).json({
        error: `ImageKit: ${msg}`,
      });
      return;
    }

    res.status(200).json({
      url: data.url,
      fileId: data.fileId,
    });
  } catch (err) {
    console.error('ImageKit upload error:', err);
    res.status(502).json({ error: 'Upload failed' });
  }
}

function mimeToExt(mime: string): string {
  const map: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/gif': 'gif',
    'image/webp': 'webp',
    'image/svg+xml': 'svg',
  };
  return map[mime] ?? 'jpg';
}
