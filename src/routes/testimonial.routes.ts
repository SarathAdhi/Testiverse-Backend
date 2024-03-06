import { Router } from "express";
import {
  createTestimonial,
  deleteManyTestimonials,
  getAllShowcaseTestimonials,
  getAllTestimonials,
  getTestimonial,
  getTestimonialFromLinkedin,
} from "../controllers/testimonial.controllers";
import { protectedRoute } from "../middlewares/protected";

const router = Router();

router.get("/all", protectedRoute, getAllTestimonials);

router.delete("/delete-many", protectedRoute, deleteManyTestimonials);

router.post("/", createTestimonial);

router.get("/linkedin", getTestimonialFromLinkedin);

router.get("/:id", getTestimonial);

router.get("/:slug/all", getAllShowcaseTestimonials);

export { router as TestimonialRouter };
