import mongoose from 'mongoose';

const shiftSchema = new mongoose.Schema({
    staff: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    date: {
        type: Date,
        required: true
    },
    timeSlot: {
        type: String,
        enum: ['morning', 'afternoon', 'evening'],
        required: true
    },
    status: {
        type: String,
        enum: ['available', 'booked', 'completed', 'cancelled'],
        default: 'available'
    },
    note: String
}, {
    timestamps: true
});

// Đảm bảo một nhân viên không thể đăng ký trùng ca làm
shiftSchema.index({ staff: 1, date: 1, timeSlot: 1 }, { unique: true });

const Shift = mongoose.model('Shift', shiftSchema);
export default Shift; 