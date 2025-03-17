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
        for (let item of items) {
            const product = await Product.findById(item.product);
            if (!product) {
                return errorResponse(res, `Sản phẩm không tồn tại: ${item.product}`, 404);
            }
            if (product.stock < item.quantity) {
                return errorResponse(res, `Sản phẩm ${product.name} không đủ số lượng`, 400);
            }
            item.price = product.price;
        }

        const order = await Order.create({
            customer: req.user.id,
            items,
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

export {
    createAppointment,
    getMyAppointments,
    getProducts,
    createOrder,
    getMyOrders
}; 