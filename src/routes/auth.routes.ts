import { Router } from "express";
import passport from "passport";
import { FRONTEND_URL } from "../utils/my-envs";
import { protectedRoute } from "../middlewares/protected";
import {
  githubCallbackFunction,
  googleCallbackFunction,
} from "../controllers/auth.controllers";
import { responseHandler } from "../utils/response-handler";

const router = Router();

passport.serializeUser(function (user, cb) {
  cb(null, user);
});

passport.deserializeUser(function (user: any, cb) {
  cb(null, user);
});

// ---------------- Google Auth ---------------------

router.get(
  "/google/login",
  passport.authenticate("google", {
    scope: ["profile", "email"],
  })
);

router.get("/google/callback", googleCallbackFunction);

// ----------------- GitHub Auth --------------------

router.get(
  "/github/login",
  passport.authenticate("github", {
    scope: ["user:email"],
  })
);

router.get("/github/callback", githubCallbackFunction);

// -------------- Auth ---------------------

router.get("/verify", protectedRoute, function (req, res, next) {
  return responseHandler(res).success(200, "Token verified", req.user);
});

router.get("/logout", function (req, res, next) {
  req.logout({}, () => {});
  res.redirect(`${FRONTEND_URL}/auth`);
});

export { router as AuthRouter };
