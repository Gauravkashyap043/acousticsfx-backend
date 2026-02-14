import { Router } from 'express';
import * as contentController from '../controllers/contentController.js';

const router = Router();

/** Public: get content by keys. Query: keys=key1,key2 */
router.get('/', contentController.getByKeys);

export default router;
