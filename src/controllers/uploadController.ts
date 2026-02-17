import { Request, Response } from 'express';
import ImageKit from '@imagekit/nodejs';
import { toFile } from '@imagekit/nodejs';
import { env } from '../config/env.js';

function getImageKitClient(): ImageKit | null {
  if (!env.IMAGEKIT_PRIVATE_KEY) return null;
  const options: { privateKey: string; publicKey?: string; urlEndpoint?: string } = {
    privateKey: env.IMAGEKIT_PRIVATE_KEY,
  };
  if (env.IMAGEKIT_PUBLIC_KEY) options.publicKey = env.IMAGEKIT_PUBLIC_KEY;
  if (env.IMAGEKIT_URL_ENDPOINT) options.urlEndpoint = env.IMAGEKIT_URL_ENDPOINT;
  return new ImageKit(options);
}

/**
 * POST /api/admin/upload-image
 * Expects multipart/form-data with field "file". Returns { url } from ImageKit.
 */
export async function uploadImage(req: Request, res: Response): Promise<void> {
  try {
    const client = getImageKitClient();
    if (!client) {
      res.status(503).json({ error: 'Image upload is not configured (ImageKit)' });
      return;
    }

    const file = req.file;
    if (!file) {
      res.status(400).json({ error: 'No file provided. Use form field "file".' });
      return;
    }

    const ext = file.originalname.split('.').pop() || 'jpg';
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}.${ext}`;
    const uploadable = await toFile(file.buffer, fileName, { type: file.mimetype });

    const result = await client.files.upload({
      file: uploadable,
      fileName,
      folder: '/admin',
    });

    const url = (result as { url?: string }).url;
    if (!url) {
      res.status(500).json({ error: 'Upload succeeded but no URL returned' });
      return;
    }
    res.json({ url });
  } catch (err) {
    console.error('uploadImage error:', err);
    res.status(500).json({ error: 'Failed to upload image' });
  }
}
