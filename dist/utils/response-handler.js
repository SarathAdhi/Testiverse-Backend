"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.responseHandler = void 0;
const responseHandler = (res) => ({
    success: (statusCode, message, data) => res.status(statusCode).json({
        message,
        status: "success",
        code: statusCode,
        data,
    }),
    error: (statusCode, error) => {
        return res.status(statusCode).json({
            message: error?.message || error,
            error: true,
            status: "error",
            code: statusCode,
        });
    },
});
exports.responseHandler = responseHandler;
//# sourceMappingURL=response-handler.js.map