import { Router } from 'express';
import * as adminController from '../controllers/adminController.js';
import { requireAuth, requirePermission } from '../middleware/auth.js';
import { PERMISSIONS } from '../lib/permissions.js';

const router = Router();

router.use(requireAuth);

/** List all content (paginated). Requires content:read */
router.get(
  '/content',
  requirePermission(PERMISSIONS.CONTENT_READ),
  adminController.listContent
);
/** Get one content by key. Requires content:read */
router.get(
  '/content/:key',
  requirePermission(PERMISSIONS.CONTENT_READ),
  adminController.getContentByKey
);
/** Upsert content by key. Requires content:write */
router.put(
  '/content/:key',
  requirePermission(PERMISSIONS.CONTENT_WRITE),
  adminController.upsertContent
);
/** Delete content by key. Requires content:write */
router.delete(
  '/content/:key',
  requirePermission(PERMISSIONS.CONTENT_WRITE),
  adminController.deleteContent
);

export default router;
