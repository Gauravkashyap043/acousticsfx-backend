import { Router } from 'express';
import * as resourceController from '../controllers/resourceController.js';

const router = Router();

/** Public: all resources in one payload */
router.get('/', resourceController.listResources);

export default router;
