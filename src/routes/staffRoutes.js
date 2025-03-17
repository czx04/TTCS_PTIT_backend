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

// Bảo vệ tất cả các routes và chỉ cho phép staff truy cập
router.use(protect);
router.use(authorize('staff'));

// Shift routes
router.route('/shifts')
    .post(registerShift)
    .get(getMyShifts);

// Appointment routes
router.route('/appointments')
    .get(getMyAppointments);

router.route('/appointments/:appointmentId')
    .patch(updateAppointmentStatus);

// Customer history route
router.get('/customers/:customerId/history', getCustomerHistory);

export default router; 