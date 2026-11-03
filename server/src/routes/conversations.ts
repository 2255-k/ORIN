import { Router } from "express";
import {
  addMembersHandler,
  archiveConversation,
  createDirect,
  createGroupHandler,
  getOne,
  list,
  pinConversation,
  removeMemberHandler,
  updateGroupHandler,
} from "../controllers/conversationController.js";
import { requireAuth } from "../middleware/auth.js";
import { upload } from "../middleware/upload.js";
import { validateBody } from "../middleware/validate.js";
import { createDirectSchema } from "../validators/schemas.js";

export const conversationsRouter = Router();
conversationsRouter.use(requireAuth);
conversationsRouter.get("/", list);
conversationsRouter.get("/:id", getOne);
conversationsRouter.post("/direct", validateBody(createDirectSchema), createDirect);
conversationsRouter.post("/group", upload.single("avatar"), createGroupHandler);
conversationsRouter.patch("/:id", upload.single("avatar"), updateGroupHandler);
conversationsRouter.post("/:id/members", addMembersHandler);
conversationsRouter.delete("/:id/members/:memberId", removeMemberHandler);
conversationsRouter.post("/:id/pin", pinConversation);
conversationsRouter.post("/:id/archive", archiveConversation);
