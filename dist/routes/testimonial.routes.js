"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TestimonialRouter = void 0;
const express_1 = require("express");
const testimonial_controllers_1 = require("../controllers/testimonial.controllers");
const protected_1 = require("../middlewares/protected");
const router = (0, express_1.Router)();
exports.TestimonialRouter = router;
router.get("/all", protected_1.protectedRoute, testimonial_controllers_1.getAllTestimonials);
router.delete("/delete-many", protected_1.protectedRoute, testimonial_controllers_1.deleteManyTestimonials);
router.post("/", testimonial_controllers_1.createTestimonial);
router.get("/linkedin", testimonial_controllers_1.getTestimonialFromLinkedin);
router.get("/:id", testimonial_controllers_1.getTestimonial);
router.get("/:slug/all", testimonial_controllers_1.getAllShowcaseTestimonials);
//# sourceMappingURL=testimonial.routes.js.map