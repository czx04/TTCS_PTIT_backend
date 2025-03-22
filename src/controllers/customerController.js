import Appointment from '../models/Appointment.js';
import Product from '../models/Product.js';
import Order from '../models/Order.js';
import { successResponse, errorResponse } from '../utils/responseHandler.js';


const createAppointment = async (req, res) => {
    try {
        const { staffId, appointmentDate, services, note } = req.body;

        // Tính tổng giá
        const totalPrice = services.reduce((total, service) => total + service.price, 0);

        const appointment = await Appointment.create({
            customer: req.user.id,
            staff: staffId,
            appointmentDate,
            services,
            totalPrice,
            note
        });

        successResponse(res, { appointment }, 'Đặt lịch thành công', 201);
    } catch (error) {
        errorResponse(res, error.message);
    }
};


const getMyAppointments = async (req, res) => {
    try {
        const appointments = await Appointment.find({ customer: req.user.id })
            .populate('staff', 'fullName phone')
            .sort('-appointmentDate');

        successResponse(res, { appointments }, 'Lấy danh sách lịch hẹn thành công');
    } catch (error) {
        errorResponse(res, error.message);
    }
};

const getProducts = async (req, res) => {
    try {
        const { category, search } = req.query;
        let query = { isActive: true };

        if (category) {
            query.category = category;
        }

        if (search) {
            query.name = { $regex: search, $options: 'i' };
        }

        const products = await Product.find(query);
        successResponse(res, { products }, 'Lấy danh sách sản phẩm thành công');
    } catch (error) {
        errorResponse(res, error.message);
    }
};


const createOrder = async (req, res) => {
    try {
        const { items, shippingAddress, paymentMethod } = req.body;

        // Kiểm tra số lượng tồn kho và tính giá
        let totalAmount = 0;
        for (let item of items) {
            const product = await Product.findById(item.product);
            if (!product) {
                return errorResponse(res, `Sản phẩm không tồn tại: ${item.product}`, 404);
            }
            if (product.stock < item.quantity) {
                return errorResponse(res, `Sản phẩm ${product.name} không đủ số lượng`, 400);
            }
            item.price = product.price;
            totalAmount += product.price * item.quantity;
        }

        const order = await Order.create({
            customer: req.user.id,
            items,
            totalAmount,
            shippingAddress,
            paymentMethod
        });

        // Cập nhật số lượng tồn kho
        for (let item of items) {
            await Product.findByIdAndUpdate(item.product, {
                $inc: { stock: -item.quantity }
            });
        }

        successResponse(res, { order }, 'Đặt hàng thành công', 201);
    } catch (error) {
        errorResponse(res, error.message);
    }
};

const getMyOrders = async (req, res) => {
    try {
        const orders = await Order.find({ customer: req.user.id })
            .populate('items.product', 'name image')
            .sort('-createdAt');

        successResponse(res, { orders }, 'Lấy danh sách đơn hàng thành công');
    } catch (error) {
        errorResponse(res, error.message);
    }
};

const cancelAppointment = async (req, res) => {
    try {
        const { appointmentId } = req.body;

        // Tìm lịch hẹn của khách hàng
        const appointment = await Appointment.findOne({
            _id: appointmentId,
            customer: req.user.id
        });

        if (!appointment) {
            return errorResponse(res, 'Không tìm thấy lịch hẹn', 404);
        }

        // Kiểm tra trạng thái lịch hẹn
        if (appointment.status === 'completed') {
            return errorResponse(res, 'Không thể hủy lịch hẹn đã hoàn thành', 400);
        }

        if (appointment.status === 'cancelled') {
            return errorResponse(res, 'Lịch hẹn đã được hủy trước đó', 400);
        }

        // Kiểm tra thời gian (không thể hủy lịch hẹn trong vòng 2 giờ trước giờ hẹn)
        const appointmentTime = new Date(appointment.appointmentDate);
        const now = new Date();

        // Nếu ngày hẹn đã qua
        if (appointmentTime < now) {
            return errorResponse(res, 'Không thể hủy lịch hẹn đã qua', 400);
        }

        // Tính khoảng cách giờ giữa hiện tại và giờ hẹn
        const hoursDiff = (appointmentTime.getTime() - now.getTime()) / (1000 * 60 * 60);

        if (hoursDiff < 2) {
            return errorResponse(res, 'Không thể hủy lịch hẹn trước 2 giờ', 400);
        }

        // Cập nhật trạng thái
        appointment.status = 'cancelled';
        await appointment.save();

        successResponse(res, { appointment }, 'Hủy lịch hẹn thành công');
    } catch (error) {
        errorResponse(res, error.message);
    }
};

const cancelOrder = async (req, res) => {
    try {
        const { orderId } = req.body;

        // Tìm đơn hàng của khách hàng
        const order = await Order.findOne({
            _id: orderId,
            customer: req.user.id
        });

        if (!order) {
            return errorResponse(res, 'Không tìm thấy đơn hàng', 404);
        }

        // Kiểm tra trạng thái đơn hàng
        if (['delivered', 'cancelled'].includes(order.status)) {
            return errorResponse(res, `Không thể hủy đơn hàng đã ${order.status === 'delivered' ? 'giao' : 'hủy'}`, 400);
        }

        // Hoàn lại số lượng sản phẩm vào kho
        for (let item of order.items) {
            await Product.findByIdAndUpdate(item.product, {
                $inc: { stock: item.quantity }
            });
        }

        // Cập nhật trạng thái đơn hàng
        order.status = 'cancelled';
        order.paymentStatus = order.paymentMethod === 'banking' ? 'refunded' : 'cancelled';
        await order.save();

        successResponse(res, { order }, 'Hủy đơn hàng thành công');
    } catch (error) {
        errorResponse(res, error.message);
    }
};

export {
    createAppointment,
    getMyAppointments,
    getProducts,
    createOrder,
    getMyOrders,
    cancelAppointment,
    cancelOrder
}; 