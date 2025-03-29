import mongoose from 'mongoose';

const importOrderSchema = new mongoose.Schema({
    supplier: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Supplier',
        required: [true, 'Nhà cung cấp là bắt buộc']
    },
    items: [{
        product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product',
            required: [true, 'Sản phẩm là bắt buộc']
        },
        quantity: {
            type: Number,
            required: [true, 'Số lượng là bắt buộc']
        }
    }]
}, {
    timestamps: true
});

const ImportOrder = mongoose.model('ImportOrder', importOrderSchema);
export default ImportOrder; 