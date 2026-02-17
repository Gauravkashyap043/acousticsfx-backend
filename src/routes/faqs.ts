import { Router } from 'express';
import * as ctrl from '../controllers/faqController.js';

const router = Router();

router.get('/', ctrl.listPublic);

export default router;
