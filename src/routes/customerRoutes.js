import express from 'express';
import { protect, authorize } from '../middlewares/auth.js';
import {
    createAppointment,
    getMyAppointments,
    getProducts,
    createOrder,
    getMyOrders
} from '../controllers/customerController.js';

const router = express.Router();

// Bảo vệ tất cả các routes bên dưới
router.use(protect);
router.use(authorize('customer'));

// Appointment routes
router.route('/appointments')
    .post(createAppointment)
    .get(getMyAppointments);

// Product routes
router.get('/products', getProducts);

// Order routes
router.route('/orders')
    .post(createOrder)
    .get(getMyOrders);

export default router; 