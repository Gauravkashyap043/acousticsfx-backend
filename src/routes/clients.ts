import { Router } from 'express';
import * as clientLogoController from '../controllers/clientLogoController.js';

const router = Router();

/** Public: GET /api/clients */
router.get('/', clientLogoController.listClients);

export default router;
