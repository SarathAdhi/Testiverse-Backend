"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getBearerToken = void 0;
const getBearerToken = (req) => {
    const bearerHeader = req.headers["authorization"];
    // console.log({ bearerHeader });
    if (!bearerHeader)
        return null;
    const bearer = bearerHeader.split(" ");
    const bearerToken = bearer[1];
    return bearerToken;
};
exports.getBearerToken = getBearerToken;
//# sourceMappingURL=get-bearer-token.js.map