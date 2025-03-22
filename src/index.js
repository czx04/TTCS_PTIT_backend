import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import connectDB from './config/database.js';
import authRoutes from './routes/authRoutes.js';
import customerRoutes from './routes/customerRoutes.js';
import staffRoutes from './routes/staffRoutes.js';
import inventoryRoutes from './routes/inventoryRoutes.js';

// Load env vars
dotenv.config();

// Connect to database
connectDB();

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(morgan('dev'));

// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/inventory', inventoryRoutes);

// Base route
app.get('/', (req, res) => {
    res.json({ message: 'Welcome to Hair Salon Management System API' });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: `Cannot ${req.method} ${req.url}`
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        success: false,
        error: err.message || 'Server Error'
    });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
}); 