import { Router } from "express";
import {
  addContact,
  blockUser,
  getUser,
  listBlocked,
  listContacts,
  removeContact,
  searchUsers,
  unblockUser,
  updateProfile,
  uploadAvatar,
} from "../controllers/userController.js";
import { requireAuth } from "../middleware/auth.js";
import { upload } from "../middleware/upload.js";
import { validateBody } from "../middleware/validate.js";
import { profileSchema } from "../validators/schemas.js";

export const usersRouter = Router();
usersRouter.use(requireAuth);
usersRouter.get("/search", searchUsers);
usersRouter.get("/contacts", listContacts);
usersRouter.get("/blocked", listBlocked);
usersRouter.patch("/me", validateBody(profileSchema), updateProfile);
usersRouter.post("/me/avatar", upload.single("file"), uploadAvatar);
usersRouter.get("/:id", getUser);
usersRouter.post("/:id/contact", addContact);
usersRouter.delete("/:id/contact", removeContact);
usersRouter.post("/:id/block", blockUser);
usersRouter.delete("/:id/block", unblockUser);
