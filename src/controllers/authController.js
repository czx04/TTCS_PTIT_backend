import User from '../models/User.js';
import { successResponse, errorResponse } from '../utils/responseHandler.js';

const register = async (req, res) => {
    try {
        const { phone, password, fullName, email, role } = req.body;

        // Kiểm tra số điện thoại đã tồn tại
        const existingUser = await User.findOne({ phone });
        if (existingUser) {
            return errorResponse(res, 'Số điện thoại đã được sử dụng', 400);
        }

        // Tạo user mới
        const user = await User.create({
            phone,
            password,
            fullName,
            email,
            role: role || 'customer' // Mặc định là customer nếu không có role
        });

        // Tạo token
        const token = user.getSignedJwtToken();

        successResponse(res, { token }, 'Đăng ký thành công', 201);
    } catch (error) {
        errorResponse(res, error.message);
    }
};

const login = async (req, res) => {
    try {
        const { phone, password } = req.body;

        // Validate phone & password
        if (!phone || !password) {
            return errorResponse(res, 'Vui lòng nhập số điện thoại và mật khẩu', 400);
        }

        // Kiểm tra user
        const user = await User.findOne({ phone }).select('+password');
        if (!user) {
            return errorResponse(res, 'Thông tin đăng nhập không chính xác', 401);
        }

        // Kiểm tra mật khẩu
        const isMatch = await user.matchPassword(password);
        if (!isMatch) {
            return errorResponse(res, 'Thông tin đăng nhập không chính xác', 401);
        }

        // Tạo token
        const token = user.getSignedJwtToken();

        successResponse(res, { token }, 'Đăng nhập thành công');
    } catch (error) {
        errorResponse(res, error.message);
    }
};

const getMe = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        successResponse(res, { user }, 'Lấy thông tin user thành công');
    } catch (error) {
        errorResponse(res, error.message);
    }
};

export { register, login, getMe }; 