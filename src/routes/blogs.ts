import { Router } from 'express';
import * as resourceController from '../controllers/resourceController.js';

const router = Router();

/** Public: list blogs (backward compat) */
router.get('/', resourceController.listBlogs);
/** Public: get blog by slug */
router.get('/slug/:slug', resourceController.getBlogBySlug);

export default router;
