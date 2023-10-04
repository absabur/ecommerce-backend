const errorResponse = (res, {statusCode = 500, message = "server error."}) => {
    return res.status(statusCode).json({
        success: false,
        error: message,
    })
} 

// not using
const successResponse = (res, {statusCode = 200, message = "successfully done.", payload = {}}) => {
    return res.status(statusCode).json({
        success: true,
        message: message,
        payload,
    })
}


module.exports = { errorResponse, successResponse }