"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ShowcaseRouter = void 0;
const express_1 = require("express");
const showcase_controllers_1 = require("../controllers/showcase.controllers");
const protected_1 = require("../middlewares/protected");
const router = (0, express_1.Router)();
exports.ShowcaseRouter = router;
router.get("/my", protected_1.protectedRoute, showcase_controllers_1.getMyShowcases);
router.get("/my/:slug", protected_1.protectedRoute, showcase_controllers_1.getMyShowcase);
router.post("/", protected_1.protectedRoute, showcase_controllers_1.createShowcase);
router.put("/:id", protected_1.protectedRoute, showcase_controllers_1.updateShowcase);
router.delete("/:id", protected_1.protectedRoute, showcase_controllers_1.deleteShowcase);
router.get("/:slug", showcase_controllers_1.getShowcase);
//# sourceMappingURL=showcase.routes.js.map