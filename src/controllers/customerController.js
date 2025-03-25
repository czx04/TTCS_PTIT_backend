import Appointment from '../models/Appointment.js';
import Product from '../models/Product.js';
import Order from '../models/Order.js';
import User from '../models/User.js';
import { successResponse, errorResponse } from '../utils/responseHandler.js';

// @desc    Đặt lịch cắt tóc
// @route   POST /api/customers/appointments
// @access  Private (Customer)
const createAppointment = async (req, res) => {
    try {
        const { staffId, appointmentDate, services, note } = req.body;
        
        // Kiểm tra ngày hẹn không được là quá khứ
        if (new Date(appointmentDate) < new Date()) {
            return errorResponse(res, 'Ngày giờ hẹn không hợp lệ', 400);
        }
        
        // Tạo lịch hẹn mới
        const appointment = await Appointment.create({
            customer: req.user.id,
            staff: staffId,
            appointmentDate,
            services,
            status: 'pending',
            note
        });
        
        successResponse(res, { appointment }, 'Đặt lịch thành công', 201);
    } catch (error) {
        errorResponse(res, error.message);
    }
};

// @desc    Xem lịch hẹn đã đặt
// @route   GET /api/customers/appointments
// @access  Private (Customer)
const getMyAppointments = async (req, res) => {
    try {
        const { status } = req.query;
        
        // Xây dựng query
        const query = { customer: req.user.id };
        
        // Lọc theo trạng thái nếu có
        if (status) {
            query.status = status;
        }
        
        // Lấy danh sách lịch hẹn
        const appointments = await Appointment.find(query)
            .populate('staff', 'fullName phone')
            .sort({ appointmentDate: -1 });
            
        successResponse(res, { appointments }, 'Lấy danh sách lịch hẹn thành công');
    } catch (error) {
        errorResponse(res, error.message);
    }
};

// @desc    Hủy lịch hẹn
// @route   POST /api/customers/appointments/:appointmentId/cancel
// @access  Private (Customer)
const cancelAppointment = async (req, res) => {
    try {
        const { appointmentId } = req.params;
        
        // Tìm lịch hẹn
        const appointment = await Appointment.findById(appointmentId);
        
        // Kiểm tra lịch hẹn tồn tại
        if (!appointment) {
            return errorResponse(res, 'Không tìm thấy lịch hẹn', 404);
        }
        
        // Kiểm tra lịch hẹn thuộc về user hiện tại
        if (appointment.customer.toString() !== req.user.id) {
            return errorResponse(res, 'Không có quyền hủy lịch hẹn này', 403);
        }
        
        // Kiểm tra trạng thái lịch hẹn
        if (appointment.status === 'completed' || appointment.status === 'cancelled') {
            return errorResponse(res, 'Không thể hủy lịch hẹn đã hoàn thành hoặc đã hủy', 400);
        }
        
        // Kiểm tra thời gian (không thể hủy trước 2 giờ)
        const appointmentTime = new Date(appointment.appointmentDate);
        const currentTime = new Date();
        const timeDiff = appointmentTime - currentTime;
        const hoursDiff = timeDiff / (1000 * 60 * 60);
        
        if (hoursDiff < 2) {
            return errorResponse(res, 'Không thể hủy lịch hẹn trong vòng 2 giờ trước giờ hẹn', 400);
        }
        
        // Cập nhật trạng thái
        appointment.status = 'cancelled';
        await appointment.save();
        
        successResponse(res, { appointment }, 'Hủy lịch hẹn thành công');
    } catch (error) {
        errorResponse(res, error.message);
    }
};

// @desc    Chỉnh sửa lịch hẹn
// @route   PUT /api/customers/appointments/:appointmentId
// @access  Private (Customer)
const updateAppointment = async (req, res) => {
    try {
        const { appointmentId } = req.params;
        const { appointmentDate, services, note } = req.body;
        
        // Tìm lịch hẹn
        const appointment = await Appointment.findById(appointmentId);
        
        // Kiểm tra lịch hẹn tồn tại
        if (!appointment) {
            return errorResponse(res, 'Không tìm thấy lịch hẹn', 404);
        }
        
        // Kiểm tra lịch hẹn thuộc về user hiện tại
        if (appointment.customer.toString() !== req.user.id) {
            return errorResponse(res, 'Không có quyền chỉnh sửa lịch hẹn này', 403);
        }
        
        // Kiểm tra trạng thái lịch hẹn
        if (appointment.status === 'completed' || appointment.status === 'cancelled') {
            return errorResponse(res, 'Không thể chỉnh sửa lịch hẹn đã hoàn thành hoặc đã hủy', 400);
        }
        
        // Kiểm tra thời gian (không thể chỉnh sửa trước 2 giờ)
        const appointmentTime = new Date(appointment.appointmentDate);
        const currentTime = new Date();
        const timeDiff = appointmentTime - currentTime;
        const hoursDiff = timeDiff / (1000 * 60 * 60);
        
        if (hoursDiff < 2) {
            return errorResponse(res, 'Không thể chỉnh sửa lịch hẹn trong vòng 2 giờ trước giờ hẹn', 400);
        }
        
        // Kiểm tra ngày hẹn mới không được là quá khứ
        if (appointmentDate && new Date(appointmentDate) < new Date()) {
            return errorResponse(res, 'Ngày giờ hẹn không hợp lệ', 400);
        }
        
        // Cập nhật thông tin
        if (appointmentDate) appointment.appointmentDate = appointmentDate;
        if (services) appointment.services = services;
        if (note) appointment.note = note;
        
        // Lưu thay đổi
        await appointment.save();
        
        successResponse(res, { appointment }, 'Cập nhật lịch hẹn thành công');
    } catch (error) {
        errorResponse(res, error.message);
    }
};

// @desc    Đánh giá dịch vụ sau khi cắt tóc
// @route   POST /api/customers/appointments/:appointmentId/review
// @access  Private (Customer)
const reviewAppointment = async (req, res) => {
    try {
        const { appointmentId } = req.params;
        const { rating, comment } = req.body;
        
        // Kiểm tra thông tin đánh giá
        if (!rating || rating < 1 || rating > 5) {
            return errorResponse(res, 'Đánh giá phải từ 1 đến 5 sao', 400);
        }
        
        // Tìm lịch hẹn
        const appointment = await Appointment.findById(appointmentId);
        
        // Kiểm tra lịch hẹn tồn tại
        if (!appointment) {
            return errorResponse(res, 'Không tìm thấy lịch hẹn', 404);
        }
        
        // Kiểm tra lịch hẹn thuộc về user hiện tại
        if (appointment.customer.toString() !== req.user.id) {
            return errorResponse(res, 'Không có quyền đánh giá lịch hẹn này', 403);
        }
        
        // Kiểm tra lịch hẹn đã hoàn thành
        if (appointment.status !== 'completed') {
            return errorResponse(res, 'Chỉ có thể đánh giá lịch hẹn đã hoàn thành', 400);
        }
        
        // Cập nhật đánh giá
        appointment.review = {
            rating,
            comment,
            createdAt: Date.now()
        };
        
        await appointment.save();
        
        successResponse(res, { appointment }, 'Đánh giá dịch vụ thành công');
    } catch (error) {
        errorResponse(res, error.message);
    }
};

// @desc    Xem danh sách sản phẩm
// @route   GET /api/customers/products
// @access  Public
const getProducts = async (req, res) => {
    try {
        const { category, search } = req.query;
        
        // Xây dựng query
        const query = {};
        
        // Lọc theo danh mục nếu có
        if (category) {
            query.category = category;
        }
        
        // Tìm kiếm theo tên nếu có
        if (search) {
            query.name = { $regex: search, $options: 'i' };
        }
        
        // Lấy danh sách sản phẩm
        const products = await Product.find(query)
            .sort({ createdAt: -1 });
            
        successResponse(res, { products }, 'Lấy danh sách sản phẩm thành công');
    } catch (error) {
        errorResponse(res, error.message);
    }
};

// @desc    Tạo đơn hàng
// @route   POST /api/customers/orders
// @access  Private (Customer)
const createOrder = async (req, res) => {
    try {
        const { items, shippingAddress, paymentMethod } = req.body;
        
        // Kiểm tra thông tin đơn hàng
        if (!items || items.length === 0) {
            return errorResponse(res, 'Vui lòng chọn sản phẩm', 400);
        }
        
        if (!shippingAddress) {
            return errorResponse(res, 'Vui lòng nhập địa chỉ giao hàng', 400);
        }
        
        // Lấy thông tin chi tiết sản phẩm và kiểm tra tồn kho
        const orderItems = [];
        let totalAmount = 0;
        
        for (const item of items) {
            const product = await Product.findById(item.product);
            
            if (!product) {
                return errorResponse(res, `Sản phẩm không tồn tại: ${item.product}`, 404);
            }
            
            if (product.stock < item.quantity) {
                return errorResponse(res, `Sản phẩm ${product.name} không đủ hàng`, 400);
            }
            
            // Thêm vào danh sách sản phẩm trong đơn hàng
            orderItems.push({
                product: item.product,
                quantity: item.quantity,
                price: product.price
            });
            
            // Cập nhật tổng tiền
            totalAmount += product.price * item.quantity;
            
            // Giảm số lượng tồn kho
            product.stock -= item.quantity;
            await product.save();
        }
        
        // Tạo đơn hàng mới
        const order = await Order.create({
            customer: req.user.id,
            items: orderItems,
            totalAmount,
            shippingAddress,
            paymentMethod,
            status: 'pending',
            paymentStatus: paymentMethod === 'cod' ? 'pending' : 'pending'
        });
        
        successResponse(res, { order }, 'Đặt hàng thành công', 201);
    } catch (error) {
        errorResponse(res, error.message);
    }
};

// @desc    Xem danh sách đơn hàng
// @route   GET /api/customers/orders
// @access  Private (Customer)
const getMyOrders = async (req, res) => {
    try {
        // Lấy danh sách đơn hàng
        const orders = await Order.find({ customer: req.user.id })
            .populate('items.product', 'name price image')
            .sort({ createdAt: -1 });
            
        successResponse(res, { orders }, 'Lấy danh sách đơn hàng thành công');
    } catch (error) {
        errorResponse(res, error.message);
    }
};

// @desc    Hủy đơn hàng
// @route   POST /api/customers/orders/:orderId/cancel
// @access  Private (Customer)
const cancelOrder = async (req, res) => {
    try {
        const { orderId } = req.params;
        
        // Tìm đơn hàng
        const order = await Order.findById(orderId);
        
        // Kiểm tra đơn hàng tồn tại
        if (!order) {
            return errorResponse(res, 'Không tìm thấy đơn hàng', 404);
        }
        
        // Kiểm tra đơn hàng thuộc về user hiện tại
        if (order.customer.toString() !== req.user.id) {
            return errorResponse(res, 'Không có quyền hủy đơn hàng này', 403);
        }
        
        // Kiểm tra trạng thái đơn hàng
        if (order.status === 'delivered' || order.status === 'cancelled') {
            return errorResponse(res, 'Không thể hủy đơn hàng đã giao hoặc đã hủy', 400);
        }
        
        // Cập nhật trạng thái
        order.status = 'cancelled';
        
        // Cập nhật trạng thái thanh toán
        if (order.paymentMethod === 'banking' && order.paymentStatus === 'paid') {
            order.paymentStatus = 'refunded';
        } else {
            order.paymentStatus = 'cancelled';
        }
        
        await order.save();
        
        // Hoàn lại tồn kho
        for (const item of order.items) {
            const product = await Product.findById(item.product);
            if (product) {
                product.stock += item.quantity;
                await product.save();
            }
        }
        
        successResponse(res, { order }, 'Hủy đơn hàng thành công');
    } catch (error) {
        errorResponse(res, error.message);
    }
};


export {
    createAppointment,
    getMyAppointments,
    cancelAppointment,
    updateAppointment,
    reviewAppointment,
    getProducts,
    createOrder,
    getMyOrders,
    cancelOrder,
};