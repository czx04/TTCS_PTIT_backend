import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema({
    customer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    items: [{
        product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product',
            required: true
        },
        quantity: {
            type: Number,
            required: true,
            min: [1, 'Số lượng phải lớn hơn 0']
        },
        price: {
            type: Number,
            required: true
        }
    }],
    totalAmount: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'],
        default: 'pending'
    },
    shippingAddress: {
        address: String,
        city: String,
        phone: String
    },
    paymentMethod: {
        type: String,
        enum: ['cod', 'banking'],
        default: 'cod'
    },
    paymentStatus: {
        type: String,
        enum: ['pending', 'paid', 'failed'],
        default: 'pending'
    }
}, {
    timestamps: true
});

// Tính tổng tiền trước khi lưu
orderSchema.pre('save', function(next) {
    this.totalAmount = this.items.reduce((total, item) => total + (item.price * item.quantity), 0);
    next();
});

const Order = mongoose.model('Order', orderSchema);
export default Order; 