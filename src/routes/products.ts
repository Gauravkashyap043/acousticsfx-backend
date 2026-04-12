import { Router } from 'express';
import * as productController from '../controllers/productController.js';

const router = Router();

/** Public: proxy remote texture URLs for WebGL (CORS). Must be registered before param routes. */
router.get('/texture-proxy', productController.proxyVisualizerTexture);

/** Public: list all categories (for nav / products overview) */
router.get('/categories', productController.listCategories);
/** Public: category details + products in that category */
router.get('/categories/:categorySlug', productController.getCategoryBySlug);
/** Public: single product by slug (full detail page) */
router.get('/slug/:productSlug', productController.getProductBySlug);
/** Public: list all products (optional ?category=acoustic) */
router.get('/', productController.listProducts);

export default router;
