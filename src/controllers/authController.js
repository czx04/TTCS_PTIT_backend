import User from '../models/User.js';
import { successResponse, errorResponse } from '../utils/responseHandler.js';
import crypto from 'crypto';

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

// @desc    Quên mật khẩu
// @route   POST /api/auth/forgot-password
// @access  Public
const forgotPassword = async (req, res) => {
    try {
        const { email, phone } = req.body;

        if (!email && !phone) {
            return errorResponse(res, 'Vui lòng cung cấp email hoặc số điện thoại', 400);
        }

        // Tìm user theo email hoặc phone
        let user;
        if (email) {
            user = await User.findOne({ email });
        } else {
            user = await User.findOne({ phone });
        }

        if (!user) {
            return errorResponse(res, 'Không tìm thấy người dùng với thông tin này', 404);
        }

        // Tạo token reset password
        const resetToken = user.getResetPasswordToken();
        await user.save({ validateBeforeSave: false });

        // Trong thực tế, ở đây sẽ gửi email hoặc SMS chứa link reset password
        // Link reset có dạng: `${req.protocol}://${req.get('host')}/api/auth/reset-password/${resetToken}`
        // Nhưng để đơn giản, chúng ta sẽ trả về token trực tiếp

        successResponse(
            res, 
            { resetToken }, 
            'Token đặt lại mật khẩu đã được tạo',
            200
        );
    } catch (error) {
        errorResponse(res, error.message);
    }
};

// @desc    Reset mật khẩu
// @route   POST /api/auth/reset-password
// @access  Public
const resetPassword = async (req, res) => {
    try {
        const { token, password } = req.body;

        if (!token || !password) {
            return errorResponse(res, 'Vui lòng cung cấp token và mật khẩu mới', 400);
        }

        // Hash token từ client
        const resetPasswordToken = crypto
            .createHash('sha256')
            .update(token)
            .digest('hex');

        // Tìm user với token hợp lệ và chưa hết hạn
        const user = await User.findOne({
            resetPasswordToken,
            resetPasswordExpire: { $gt: Date.now() }
        });

        if (!user) {
            return errorResponse(res, 'Token không hợp lệ hoặc đã hết hạn', 400);
        }

        // Cập nhật mật khẩu mới
        user.password = password;

        // Xóa token reset password
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;

        await user.save();

        // Tạo JWT token để đăng nhập
        const jwtToken = user.getSignedJwtToken();

        successResponse(res, { token: jwtToken }, 'Đặt lại mật khẩu thành công');
    } catch (error) {
        errorResponse(res, error.message);
    }
};

export { register, login, getMe, forgotPassword, resetPassword }; 