import { Router } from 'express';
import * as productController from '../controllers/productController.js';

const router = Router();

/** Public: list all categories (for nav / products overview) */
router.get('/categories', productController.listCategories);
/** Public: category details + products in that category */
router.get('/categories/:categorySlug', productController.getCategoryBySlug);
/** Public: single product by slug */
router.get('/slug/:productSlug', productController.getProductBySlug);
/** Public: sub-product details */
router.get('/slug/:productSlug/sub-products/:subProductSlug', productController.getSubProductBySlug);
/** Public: list all products (optional ?category=acoustic) */
router.get('/', productController.listProducts);

export default router;
