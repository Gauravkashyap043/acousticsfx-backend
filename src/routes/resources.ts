import { Router } from 'express';
import * as resourceController from '../controllers/resourceController.js';

const router = Router();

/** Public: all resources in one payload */
router.get('/', resourceController.listResources);

/** Public: case studies list and by slug */
router.get('/case-studies', resourceController.listCaseStudiesPublic);
router.get('/case-studies/slug/:slug', resourceController.getCaseStudyBySlug);

/** Public: events list and by slug */
router.get('/events', resourceController.listEventsPublic);
router.get('/events/slug/:slug', resourceController.getEventBySlug);

export default router;
