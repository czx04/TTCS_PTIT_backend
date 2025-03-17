import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Tên sản phẩm là bắt buộc'],
        trim: true
    },
    description: {
        type: String,
        required: [true, 'Mô tả sản phẩm là bắt buộc']
    },
    price: {
        type: Number,
        required: [true, 'Giá sản phẩm là bắt buộc'],
        min: [0, 'Giá không thể âm']
    },
    image: {
        type: String,
        default: 'no-image.jpg'
    },
    category: {
        type: String,
        required: [true, 'Danh mục sản phẩm là bắt buộc'],
        enum: ['shampoo', 'conditioner', 'styling', 'treatment', 'other']
    },
    stock: {
        type: Number,
        required: [true, 'Số lượng tồn kho là bắt buộc'],
        min: [0, 'Số lượng không thể âm']
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

const Product = mongoose.model('Product', productSchema);
export default Product; 