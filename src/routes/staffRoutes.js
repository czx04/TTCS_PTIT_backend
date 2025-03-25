import express from 'express';
import { protect, authorize } from '../middlewares/auth.js';
import {
    registerShift,
    getMyShifts,
    getMyAppointments,
    getCustomerHistory,
    updateAppointmentStatus,
    checkInShift,
    checkOutShift,
    getShiftAttendance
} from '../controllers/staffController.js';

const router = express.Router();

// Bảo vệ tất cả các routes
router.use(protect);
router.use(authorize('admin', 'staff'));

// Quản lý ca làm việc
router.route('/shifts')
    .post(registerShift)
    .get(getMyShifts);

// Check-in và Check-out ca làm việc
router.route('/shifts/:shiftId/check-in')
    .post(checkInShift);

router.route('/shifts/:shiftId/check-out')
    .post(checkOutShift);

router.route('/shifts/:shiftId/attendance')
    .get(getShiftAttendance);

// Quản lý lịch hẹn
router.route('/appointments')
    .get(getMyAppointments);

router.route('/appointments/:appointmentId')
    .patch(updateAppointmentStatus);

// Xem lịch sử khách hàng
router.route('/customers/:customerId/history')
    .get(authorize('admin', 'staff', 'customer', 'inventory'), getCustomerHistory);

export default router;