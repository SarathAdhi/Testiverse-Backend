"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.protectedRoute = void 0;
const jsonwebtoken_1 = require("jsonwebtoken");
const user_schema_1 = __importDefault(require("../schemas/user.schema"));
const get_bearer_token_1 = require("../utils/get-bearer-token");
const response_handler_1 = require("../utils/response-handler");
const verify_jwt_1 = require("../utils/verify-jwt");
const protectedRoute = async (req, res, next) => {
    const token = (0, get_bearer_token_1.getBearerToken)(req);
    if (!token)
        return (0, response_handler_1.responseHandler)(res).error(401, "You are not logged in! Please login");
    try {
        const decoded = await (0, verify_jwt_1.verifyJwtWithBearer)(token);
        const user = await user_schema_1.default.findOne({
            uuid: decoded.id,
        });
        req.user = user;
    }
    catch (error) {
        req.logout({}, () => { });
        req.user = undefined;
        if (error instanceof jsonwebtoken_1.TokenExpiredError) {
            // JWT is expired
            return (0, response_handler_1.responseHandler)(res).error(401, "JWT expired");
        }
        else {
            // console.log({ error });
            return (0, response_handler_1.responseHandler)(res).error(401, "Invalid JWT");
        }
    }
    next();
};
exports.protectedRoute = protectedRoute;
//# sourceMappingURL=protected.js.map