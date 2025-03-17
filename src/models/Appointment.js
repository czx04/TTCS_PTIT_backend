import mongoose from 'mongoose';

const appointmentSchema = new mongoose.Schema({
    customer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    staff: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    appointmentDate: {
        type: Date,
        required: [true, 'Ngày giờ hẹn là bắt buộc']
    },
    services: [{
        name: {
            type: String,
            required: true
        },
        price: {
            type: Number,
            required: true
        }
    }],
    totalPrice: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'confirmed', 'completed', 'cancelled'],
        default: 'pending'
    },
    note: {
        type: String
    }
}, {
    timestamps: true
});

// Tính tổng giá trước khi lưu
appointmentSchema.pre('save', function(next) {
    this.totalPrice = this.services.reduce((total, service) => total + service.price, 0);
    next();
});

const Appointment = mongoose.model('Appointment', appointmentSchema);
export default Appointment; 