import { Router } from "express";
import { changePassword, deleteAccount, updateSettings } from "../controllers/settingsController.js";
import { requireAuth } from "../middleware/auth.js";
import { validateBody } from "../middleware/validate.js";
import { passwordSchema, settingsSchema } from "../validators/schemas.js";

export const settingsRouter = Router();
settingsRouter.use(requireAuth);
settingsRouter.patch("/", validateBody(settingsSchema), updateSettings);
settingsRouter.post("/password", validateBody(passwordSchema), changePassword);
settingsRouter.delete("/account", deleteAccount);
