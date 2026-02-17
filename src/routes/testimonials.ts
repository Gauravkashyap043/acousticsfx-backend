import { Router } from 'express';
import * as testimonialController from '../controllers/testimonialController.js';

const router = Router();

/** Public: list testimonials for home page */
router.get('/', testimonialController.listTestimonials);

export default router;
