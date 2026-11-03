import { Router } from "express";
import rateLimit from "express-rate-limit";
import {
  forgotPassword,
  login,
  logout,
  me,
  register,
  resetPasswordHandler,
} from "../controllers/authController.js";
import { requireAuth } from "../middleware/auth.js";
import { validateBody } from "../middleware/validate.js";
import { forgotSchema, loginSchema, registerSchema, resetSchema } from "../validators/schemas.js";

const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 30, standardHeaders: true, legacyHeaders: false });

export const authRouter = Router();
authRouter.post("/register", authLimiter, validateBody(registerSchema), register);
authRouter.post("/login", authLimiter, validateBody(loginSchema), login);
authRouter.post("/logout", logout);
authRouter.get("/me", requireAuth, me);
authRouter.post("/forgot-password", authLimiter, validateBody(forgotSchema), forgotPassword);
authRouter.post("/reset-password", authLimiter, validateBody(resetSchema), resetPasswordHandler);
