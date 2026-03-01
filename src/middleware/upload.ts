import multer from 'multer';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/avif'];
const MAX_SIZE = 10 * 1024 * 1024; // 10MB

const storage = multer.memoryStorage();

export const uploadImageMiddleware = multer({
  storage,
  limits: { fileSize: MAX_SIZE },
  fileFilter(_req, file, cb) {
    if (ALLOWED_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Use JPEG, PNG, GIF, WebP, or AVIF.'));
    }
  },
}).single('file');
