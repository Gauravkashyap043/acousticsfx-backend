import { Router } from 'express';
import * as ctrl from '../controllers/trustedPartnerController.js';

const router = Router();

router.get('/', ctrl.listPublic);

export default router;
