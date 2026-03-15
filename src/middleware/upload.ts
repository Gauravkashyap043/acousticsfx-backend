import multer from 'multer';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/avif'];
/** Max file size for image uploads (20MB). Must match Nginx client_max_body_size. */
export const UPLOAD_MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024; // 20MB
const MAX_SIZE = UPLOAD_MAX_FILE_SIZE_BYTES;

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
