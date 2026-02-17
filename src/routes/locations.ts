import { Router } from 'express';
import * as ctrl from '../controllers/locationController.js';

const router = Router();
router.get('/', ctrl.listPublic);

export default router;
