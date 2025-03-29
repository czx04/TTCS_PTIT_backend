import express from 'express';
import { 
    createAppointment, 
    getMyAppointments, 
    cancelAppointment,
    updateAppointment,
    reviewAppointment,
    getProducts, 
    createOrder, 
    getMyOrders, 
    cancelOrder,
} from '../controllers/customerController.js';
import { protect, authorize } from '../middlewares/auth.js';

const router = express.Router();

// Bảo vệ tất cả các routes
router.use(protect);
router.use(authorize('customer'));

// Quản lý lịch hẹn
router.route('/appointments')
    .post(createAppointment)
    .get(getMyAppointments);

router.route('/appointments/:appointmentId')
    .put(updateAppointment);

router.route('/appointments/:appointmentId/cancel')
    .post(cancelAppointment);

router.route('/appointments/:appointmentId/review')
    .post(reviewAppointment);

// Quản lý sản phẩm - Route này không yêu cầu đăng nhập
router.use('/products', (req, res, next) => {
    req.originalUrl.startsWith('/api/customers/products') ? next() : router.use(protect);
});
router.route('/products')
    .get(getProducts);

// Quản lý đơn hàng
router.route('/orders')
    .post(createOrder)
    .get(getMyOrders);

router.route('/orders/:orderId/cancel')
    .post(cancelOrder);


export default router; 