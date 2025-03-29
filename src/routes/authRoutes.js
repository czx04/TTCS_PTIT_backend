import express from 'express';
import { protect, authorize } from '../middlewares/auth.js';
import {
    register,
    login,
    getMe,
    forgotPassword,
    resetPassword
} from '../controllers/authController.js';

const router = express.Router();

// Public routes (không cần xác thực)
router.post('/register', register);
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

// Protected routes (cần xác thực)
router.get('/me', protect, getMe);

export default router;