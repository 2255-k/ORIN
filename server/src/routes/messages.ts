import { Router } from "express";
import { edit, history, react, read, remove, search, send } from "../controllers/messageController.js";
import { requireAuth } from "../middleware/auth.js";
import { upload } from "../middleware/upload.js";
import { validateBody } from "../middleware/validate.js";
import { editMessageSchema, reactSchema, sendMessageSchema } from "../validators/schemas.js";

export const messagesRouter = Router();
messagesRouter.use(requireAuth);
messagesRouter.get("/:conversationId", history);
messagesRouter.get("/:conversationId/search", search);
messagesRouter.post("/", upload.single("file"), send);
messagesRouter.post("/send", validateBody(sendMessageSchema), send);
messagesRouter.patch("/:id", validateBody(editMessageSchema), edit);
messagesRouter.delete("/:id", remove);
messagesRouter.post("/:id/react", validateBody(reactSchema), react);
messagesRouter.post("/:conversationId/read", read);
