import { Router } from 'express';
import * as adminController from '../controllers/adminController.js';
import * as adminsController from '../controllers/adminsController.js';
import * as contactController from '../controllers/contactController.js';
import * as newsletterController from '../controllers/newsletterController.js';
import * as productController from '../controllers/productController.js';
import * as resourceController from '../controllers/resourceController.js';
import * as uploadController from '../controllers/uploadController.js';
import { requireAuth, requirePermission } from '../middleware/auth.js';
import { uploadImageMiddleware } from '../middleware/upload.js';
import { PERMISSIONS } from '../lib/permissions.js';

const router = Router();

router.use(requireAuth);

/** Upload image to ImageKit. Requires resources:write. */
router.post(
  '/upload-image',
  requirePermission(PERMISSIONS.RESOURCES_WRITE),
  (req, res, next) => {
    uploadImageMiddleware(req, res, (err) => {
      if (err) {
        res.status(400).json({ error: err.message || 'Invalid file' });
        return;
      }
      next();
    });
  },
  uploadController.uploadImage
);

/** Admins CRUD – requires SYSTEM_MANAGE (super_admin only) */
router.get(
  '/admins',
  requirePermission(PERMISSIONS.SYSTEM_MANAGE),
  adminsController.list
);
router.post(
  '/admins',
  requirePermission(PERMISSIONS.SYSTEM_MANAGE),
  adminsController.create
);
router.patch(
  '/admins/:id',
  requirePermission(PERMISSIONS.SYSTEM_MANAGE),
  adminsController.update
);
router.delete(
  '/admins/:id',
  requirePermission(PERMISSIONS.SYSTEM_MANAGE),
  adminsController.remove
);

/** List all blogs. Requires resources:read */
router.get(
  '/blogs',
  requirePermission(PERMISSIONS.RESOURCES_READ),
  resourceController.listBlogsAdmin
);
router.post(
  '/blogs',
  requirePermission(PERMISSIONS.RESOURCES_WRITE),
  resourceController.createBlog
);
router.put(
  '/blogs/:id',
  requirePermission(PERMISSIONS.RESOURCES_WRITE),
  resourceController.updateBlog
);
router.delete(
  '/blogs/:id',
  requirePermission(PERMISSIONS.RESOURCES_WRITE),
  resourceController.deleteBlog
);

/** Case studies */
router.get(
  '/case-studies',
  requirePermission(PERMISSIONS.RESOURCES_READ),
  resourceController.listCaseStudiesAdmin
);
router.post(
  '/case-studies',
  requirePermission(PERMISSIONS.RESOURCES_WRITE),
  resourceController.createCaseStudy
);
router.put(
  '/case-studies/:id',
  requirePermission(PERMISSIONS.RESOURCES_WRITE),
  resourceController.updateCaseStudy
);
router.delete(
  '/case-studies/:id',
  requirePermission(PERMISSIONS.RESOURCES_WRITE),
  resourceController.deleteCaseStudy
);

/** Events */
router.get(
  '/events',
  requirePermission(PERMISSIONS.RESOURCES_READ),
  resourceController.listEventsAdmin
);
router.post(
  '/events',
  requirePermission(PERMISSIONS.RESOURCES_WRITE),
  resourceController.createEvent
);
router.put(
  '/events/:id',
  requirePermission(PERMISSIONS.RESOURCES_WRITE),
  resourceController.updateEvent
);
router.delete(
  '/events/:id',
  requirePermission(PERMISSIONS.RESOURCES_WRITE),
  resourceController.deleteEvent
);

/** List all products. Requires products:read */
router.get(
  '/products',
  requirePermission(PERMISSIONS.PRODUCTS_READ),
  productController.listProductsAdmin
);
/** Create product. Requires products:write */
router.post(
  '/products',
  requirePermission(PERMISSIONS.PRODUCTS_WRITE),
  productController.createProduct
);
/** Update product. Requires products:write */
router.put(
  '/products/:id',
  requirePermission(PERMISSIONS.PRODUCTS_WRITE),
  productController.updateProduct
);
/** Delete product. Requires products:write */
router.delete(
  '/products/:id',
  requirePermission(PERMISSIONS.PRODUCTS_WRITE),
  productController.deleteProduct
);

/** List contact form submissions. Requires content:read */
router.get(
  '/contact-submissions',
  requirePermission(PERMISSIONS.CONTENT_READ),
  contactController.list
);

/** List newsletter subscriptions. Requires content:read */
router.get(
  '/newsletter-subscriptions',
  requirePermission(PERMISSIONS.CONTENT_READ),
  newsletterController.list
);

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
