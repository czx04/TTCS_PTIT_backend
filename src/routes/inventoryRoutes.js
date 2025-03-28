import express from 'express';
import { protect, authorize } from '../middlewares/auth.js';
import {
    addProduct,
    updateProduct,
    deleteProduct,
    getOrders,
    updateOrderStatus,
    getStatistics,
    addSupplier,
    getSuppliers,
    addImportOrder,
    getImportOrders
} from '../controllers/inventoryController.js';

const router = express.Router();

// Bảo vệ tất cả các routes và chỉ cho phép admin truy cập
router.use(protect);
router.use(authorize('admin'));

// Product routes
router.route('/products')
    .post(addProduct);

router.route('/products/:id')
    .put(updateProduct)
    .delete(deleteProduct);

// Order routes
router.route('/orders')
    .get(getOrders);

router.route('/orders/:id')
    .put(updateOrderStatus);

// Statistics route
router.get('/statistics', getStatistics);

// Supplier routes
router.route('/suppliers')
    .post(addSupplier)
    .get(getSuppliers);

// Import Order routes
router.route('/import-orders')
    .post(addImportOrder)
    .get(getImportOrders);

export default router; 