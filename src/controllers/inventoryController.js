import Product from '../models/Product.js';
import Order from '../models/Order.js';
import { successResponse, errorResponse } from '../utils/responseHandler.js';

// @desc    Thêm sản phẩm mới
// @route   POST /api/inventory/products
// @access  Private (Admin only)
const addProduct = async (req, res) => {
    try {
        const { name, description, price, stock, image } = req.body;

        const product = await Product.create({
            name,
            description,
            price,
            stock,
            image
        });

        successResponse(res, { product }, 'Thêm sản phẩm thành công', 201);
    } catch (error) {
        errorResponse(res, error.message);
    }
};

// @desc    Cập nhật thông tin sản phẩm
// @route   PUT /api/inventory/products/:id
// @access  Private (Admin only)
const updateProduct = async (req, res) => {
    try {
        const { name, description, price, stock, image } = req.body;
        const product = await Product.findById(req.params.id);

        if (!product) {
            return errorResponse(res, 'Không tìm thấy sản phẩm', 404);
        }

        product.name = name || product.name;
        product.description = description || product.description;
        product.price = price || product.price;
        product.stock = stock !== undefined ? stock : product.stock;
        product.image = image || product.image;

        await product.save();

        successResponse(res, { product }, 'Cập nhật sản phẩm thành công');
    } catch (error) {
        errorResponse(res, error.message);
    }
};

// @desc    Xóa sản phẩm
// @route   DELETE /api/inventory/products/:id
// @access  Private (Admin only)
const deleteProduct = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);

        if (!product) {
            return errorResponse(res, 'Không tìm thấy sản phẩm', 404);
        }

        await product.deleteOne();
        successResponse(res, null, 'Xóa sản phẩm thành công');
    } catch (error) {
        errorResponse(res, error.message);
    }
};

// @desc    Xem danh sách đơn hàng
// @route   GET /api/inventory/orders
// @access  Private (Admin only)
const getOrders = async (req, res) => {
    try {
        const { status, startDate, endDate } = req.query;
        let query = {};

        // Lọc theo trạng thái
        if (status) {
            query.status = status;
        }

        // Lọc theo khoảng thời gian
        if (startDate && endDate) {
            query.createdAt = {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            };
        }

        const orders = await Order.find(query)
            .populate('customer', 'fullName phone')
            .populate('items.product', 'name price')
            .sort('-createdAt');

        successResponse(res, { orders }, 'Lấy danh sách đơn hàng thành công');
    } catch (error) {
        errorResponse(res, error.message);
    }
};

// @desc    Cập nhật trạng thái đơn hàng
// @route   PUT /api/inventory/orders/:id
// @access  Private (Admin only)
const updateOrderStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const order = await Order.findById(req.params.id);

        if (!order) {
            return errorResponse(res, 'Không tìm thấy đơn hàng', 404);
        }

        // Kiểm tra flow trạng thái hợp lệ
        const validStatusFlow = {
            'pending': ['confirmed', 'cancelled'],
            'confirmed': ['shipped', 'cancelled'],
            'shipped': ['delivered', 'cancelled'],
            'delivered': [],
            'cancelled': []
        };

        if (!validStatusFlow[order.status].includes(status)) {
            return errorResponse(res, 'Trạng thái cập nhật không hợp lệ', 400);
        }

        // Nếu hủy đơn hàng, hoàn lại số lượng vào kho
        if (status === 'cancelled') {
            for (let item of order.items) {
                await Product.findByIdAndUpdate(item.product, {
                    $inc: { stock: item.quantity }
                });
            }
            // Cập nhật trạng thái thanh toán
            order.paymentStatus = order.paymentMethod === 'banking' ? 'refunded' : 'cancelled';
        }

        order.status = status;
        await order.save();

        successResponse(res, { order }, 'Cập nhật trạng thái đơn hàng thành công');
    } catch (error) {
        errorResponse(res, error.message);
    }
};

// @desc    Thống kê tồn kho và doanh thu
// @route   GET /api/inventory/statistics
// @access  Private (Admin only)
const getStatistics = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        const timeQuery = {};

        // Lọc theo khoảng thời gian
        if (startDate && endDate) {
            timeQuery.createdAt = {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            };
        }

        // Thống kê đơn hàng
        const orderStats = await Order.aggregate([
            { $match: { ...timeQuery, status: { $ne: 'cancelled' } } },
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 },
                    totalAmount: { $sum: '$totalAmount' }
                }
            }
        ]);

        // Thống kê sản phẩm tồn kho
        const productStats = await Product.aggregate([
            {
                $group: {
                    _id: null,
                    totalProducts: { $sum: 1 },
                    totalStock: { $sum: '$stock' },
                    lowStock: {
                        $sum: {
                            $cond: [{ $lt: ['$stock', 10] }, 1, 0]
                        }
                    }
                }
            }
        ]);

        // Thống kê doanh thu theo thời gian
        const revenueStats = await Order.aggregate([
            {
                $match: {
                    ...timeQuery,
                    status: 'delivered'
                }
            },
            {
                $group: {
                    _id: {
                        year: { $year: '$createdAt' },
                        month: { $month: '$createdAt' }
                    },
                    revenue: { $sum: '$totalAmount' },
                    orders: { $sum: 1 }
                }
            },
            { $sort: { '_id.year': 1, '_id.month': 1 } }
        ]);

        successResponse(res, {
            orders: orderStats,
            products: productStats[0],
            revenue: revenueStats
        }, 'Lấy thống kê thành công');
    } catch (error) {
        errorResponse(res, error.message);
    }
};

export {
    addProduct,
    updateProduct,
    deleteProduct,
    getOrders,
    updateOrderStatus,
    getStatistics
}; 