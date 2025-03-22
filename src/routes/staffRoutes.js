import express from 'express';
import { protect, authorize } from '../middlewares/auth.js';
import {
    registerShift,
    getMyShifts,
    getMyAppointments,
    getCustomerHistory,
    updateAppointmentStatus
} from '../controllers/staffController.js';

const router = express.Router();

// Bảo vệ tất cả các routes
router.use(protect);

// Phân quyền cho từng route
router.route('/appointments')
    .get(authorize('admin', 'staff'), getMyAppointments);

router.route('/shifts')
    .post(authorize('staff'), registerShift)
    .get(authorize('staff'), getMyShifts);

router.route('/appointments/:appointmentId')
    .patch(authorize('staff'), updateAppointmentStatus);

// Route xem lịch sử cắt tóc - cho phép tất cả role truy cập
router.route('/customers/:customerId/history')
    .get(authorize('admin', 'staff', 'customer', 'inventory'), getCustomerHistory);

export default router; 