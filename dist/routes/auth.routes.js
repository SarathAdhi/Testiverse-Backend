"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthRouter = void 0;
const express_1 = require("express");
const passport_1 = __importDefault(require("passport"));
const my_envs_1 = require("../utils/my-envs");
const protected_1 = require("../middlewares/protected");
const auth_controllers_1 = require("../controllers/auth.controllers");
const response_handler_1 = require("../utils/response-handler");
const router = (0, express_1.Router)();
exports.AuthRouter = router;
passport_1.default.serializeUser(function (user, cb) {
    cb(null, user);
});
passport_1.default.deserializeUser(function (user, cb) {
    cb(null, user);
});
// ---------------- Google Auth ---------------------
router.get("/google/login", passport_1.default.authenticate("google", {
    scope: ["profile", "email"],
}));
router.get("/google/callback", auth_controllers_1.googleCallbackFunction);
// ----------------- GitHub Auth --------------------
router.get("/github/login", passport_1.default.authenticate("github", {
    scope: ["user:email"],
}));
router.get("/github/callback", auth_controllers_1.githubCallbackFunction);
// -------------- Auth ---------------------
router.get("/verify", protected_1.protectedRoute, function (req, res, next) {
    return (0, response_handler_1.responseHandler)(res).success(200, "Token verified", req.user);
});
router.get("/logout", function (req, res, next) {
    req.logout({}, () => { });
    res.redirect(`${my_envs_1.FRONTEND_URL}/auth`);
});
//# sourceMappingURL=auth.routes.js.map