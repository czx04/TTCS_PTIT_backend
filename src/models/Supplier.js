import mongoose from 'mongoose';

const supplierSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Tên nhà cung cấp là bắt buộc']
    },
    contact: {
        type: String,
        required: [true, 'Thông tin liên hệ là bắt buộc']
    },
    address: {
        type: String,
        required: [true, 'Địa chỉ là bắt buộc']
    }
}, {
    timestamps: true
});

const Supplier = mongoose.model('Supplier', supplierSchema);
export default Supplier; 