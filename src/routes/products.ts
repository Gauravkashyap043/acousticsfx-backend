import { Router } from 'express';
import * as productController from '../controllers/productController.js';

const router = Router();

/** Public: get all products with subProducts, ordered */
router.get('/', productController.listProducts);

export default router;
