import express from 'express';
import { register, login, getMe } from '../controllers/authController.js';
import { protect } from '../middlewares/auth.js';

const router = express.Router();

// Public routes
router.post('/register', register);
router.post('/login', login);

// Protected routes
router.use(protect); // Áp dụng middleware protect cho các routes bên dưới
router.get('/me', getMe);

export default router; 