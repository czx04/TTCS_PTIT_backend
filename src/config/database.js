import mongoose from 'mongoose';

// Kết nối MongoDB
const connectDB = async () => {
    try {
        mongoose.set('strictQuery', false);
        
        const conn = await mongoose.connect(process.env.MONGODB_URI);
        
        console.log(`MongoDB connected`);
    } catch (error) {
        console.error(`Lỗi: ${error.message}`);
        process.exit(1);
    }
};

export default connectDB;
