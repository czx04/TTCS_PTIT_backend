import Shift from '../models/Shift.js';
import Appointment from '../models/Appointment.js';
import { successResponse, errorResponse } from '../utils/responseHandler.js';

// @desc    Đăng ký ca làm việc
// @route   POST /api/staff/shifts
// @access  Private (Staff only)
const registerShift = async (req, res) => {
    try {
        const { date, timeSlot, note } = req.body;

        // Kiểm tra ngày đăng ký không phải quá khứ
        if (new Date(date) < new Date().setHours(0, 0, 0, 0)) {
            return errorResponse(res, 'Không thể đăng ký ca làm cho ngày trong quá khứ', 400);
        }

        const shift = await Shift.create({
            staff: req.user.id,
            date,
            timeSlot,
            note
        });

        successResponse(res, { shift }, 'Đăng ký ca làm thành công', 201);
    } catch (error) {
        // Xử lý lỗi trùng ca làm
        if (error.code === 11000) {
            return errorResponse(res, 'Bạn đã đăng ký ca làm này rồi', 400);
        }
        errorResponse(res, error.message);
    }
};

// @desc    Xem ca làm đã đăng ký
// @route   GET /api/staff/shifts
// @access  Private (Staff only)
const getMyShifts = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        let query = { staff: req.user.id };

        // Lọc theo khoảng thời gian
        if (startDate && endDate) {
            query.date = {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            };
        }

        const shifts = await Shift.find(query)
            .sort({ date: 1, timeSlot: 1 });

        successResponse(res, { shifts }, 'Lấy danh sách ca làm thành công');
    } catch (error) {
        errorResponse(res, error.message);
    }
};

// @desc    Xem lịch đặt của khách
// @route   GET /api/staff/appointments
// @access  Private (Admin & Staff)
const getMyAppointments = async (req, res) => {
    try {
        const { date, status, staffId } = req.query;
        let query = {};

        // Nếu là staff, chỉ xem được lịch của mình
        if (req.user.role === 'staff') {
            query.staff = req.user.id;
        }
        // Nếu là admin và có staffId, xem lịch của staff cụ thể
        else if (req.user.role === 'admin' && staffId) {
            query.staff = staffId;
        }

        // Lọc theo ngày
        if (date) {
            const startDate = new Date(date);
            const endDate = new Date(date);
            endDate.setDate(endDate.getDate() + 1);
            query.appointmentDate = {
                $gte: startDate,
                $lt: endDate
            };
        }

        // Lọc theo trạng thái
        if (status) {
            query.status = status;
        }

        const appointments = await Appointment.find(query)
            .populate('customer', 'fullName phone')
            .populate('staff', 'fullName phone')  // Thêm thông tin staff cho admin xem
            .sort({ appointmentDate: 1 });

        successResponse(res, { appointments }, 'Lấy danh sách lịch hẹn thành công');
    } catch (error) {
        errorResponse(res, error.message);
    }
};

// @desc    Xem lịch sử cắt tóc của khách hàng
// @route   GET /api/staff/customers/:customerId/history
// @access  Private (All roles)
const getCustomerHistory = async (req, res) => {
    try {
        const { customerId } = req.params;
        
        // Kiểm tra quyền truy cập
        if (req.user.role === 'customer' && req.user.id !== customerId) {
            return errorResponse(res, 'Bạn chỉ có thể xem lịch sử cắt tóc của chính mình', 403);
        }

        const query = {
            customer: customerId,
            status: 'completed'
        };

        const appointments = await Appointment.find(query)
            .populate('staff', 'fullName')
            .populate('customer', 'fullName phone')  // Thêm thông tin khách hàng
            .sort({ appointmentDate: -1 });

        // Nếu không tìm thấy lịch sử
        if (appointments.length === 0) {
            return successResponse(res, { appointments }, 'Chưa có lịch sử cắt tóc');
        }

        successResponse(res, { appointments }, 'Lấy lịch sử cắt tóc thành công');
    } catch (error) {
        errorResponse(res, error.message);
    }
};

// @desc    Cập nhật trạng thái lịch hẹn
// @route   PATCH /api/staff/appointments/:appointmentId
// @access  Private (Staff only)
const updateAppointmentStatus = async (req, res) => {
    try {
        const { appointmentId } = req.params;
        const { status } = req.body;

        const appointment = await Appointment.findOne({
            _id: appointmentId,
            staff: req.user.id
        });

        if (!appointment) {
            return errorResponse(res, 'Không tìm thấy lịch hẹn', 404);
        }

        // Kiểm tra flow trạng thái hợp lệ
        const validStatusFlow = {
            'pending': ['confirmed', 'cancelled'],
            'confirmed': ['completed', 'cancelled'],
            'completed': [],
            'cancelled': []
        };

        if (!validStatusFlow[appointment.status].includes(status)) {
            return errorResponse(res, 'Trạng thái cập nhật không hợp lệ', 400);
        }

        appointment.status = status;
        await appointment.save();

        successResponse(res, { appointment }, 'Cập nhật trạng thái thành công');
    } catch (error) {
        errorResponse(res, error.message);
    }
};

export {
    registerShift,
    getMyShifts,
    getMyAppointments,
    getCustomerHistory,
    updateAppointmentStatus
}; 