import { Router } from "express";
import {
  createShowcase,
  deleteShowcase,
  getMyShowcase,
  getMyShowcases,
  getShowcase,
  updateShowcase,
} from "../controllers/showcase.controllers";
import { protectedRoute } from "../middlewares/protected";

const router = Router();

router.get("/my", protectedRoute, getMyShowcases);
router.get("/my/:slug", protectedRoute, getMyShowcase);

router.post("/", protectedRoute, createShowcase);

router.put("/:id", protectedRoute, updateShowcase);

router.delete("/:id", protectedRoute, deleteShowcase);

router.get("/:slug", getShowcase);

export { router as ShowcaseRouter };
