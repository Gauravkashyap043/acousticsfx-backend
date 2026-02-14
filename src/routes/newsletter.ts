import { Router } from 'express';
import * as newsletterController from '../controllers/newsletterController.js';

const router = Router();

router.post('/', newsletterController.submit);

export default router;
