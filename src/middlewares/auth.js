import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { errorResponse } from '../utils/responseHandler.js';

// Bảo vệ routes
const protect = async (req, res, next) => {
    try {
        let token;

        // Kiểm tra token trong header
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        }

        // Kiểm tra token có tồn tại
        if (!token) {
            return errorResponse(res, 'Không có quyền truy cập', 401);
        }

        try {
            // Verify token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Thêm user vào req
            req.user = await User.findById(decoded.id);
            next();
        } catch (err) {
            return errorResponse(res, 'Không có quyền truy cập', 401);
        }
    } catch (error) {
        errorResponse(res, error.message);
    }
};

// Kiểm tra role
const authorize = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return errorResponse(
                res,
                `Role ${req.user.role} không có quyền truy cập`,
                403
            );
        }
        next();
    };
};

export { protect, authorize }; 