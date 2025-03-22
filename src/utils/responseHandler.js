// Hàm xử lý response thành công
const successResponse = (res, data, message = 'Success', statusCode = 200) => {
    return res.status(statusCode).json({
        success: true,
        message,
        data
    });
};

// Hàm xử lý response lỗi
const errorResponse = (res, message = 'Server Error', statusCode = 500) => {
    return res.status(statusCode).json({
        success: false,
        message
    });
};

export { successResponse, errorResponse };