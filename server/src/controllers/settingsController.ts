import type { Request, Response } from "express";
import bcrypt from "bcryptjs";
import { User } from "../models/User.js";
import { Conversation } from "../models/Conversation.js";
import { Message } from "../models/Message.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { HttpError } from "../utils/httpError.js";
import { ok } from "../utils/apiResponse.js";
import { serializeUser } from "../utils/publicUser.js";
import { clearAuthCookie } from "../utils/cookies.js";

export const updateSettings = asyncHandler(async (req: Request, res: Response) => {
  const user = await User.findById(req.userId);
  if (!user) throw new HttpError(401, "User not found");
  if (req.body.privacy) {
    user.privacy = { ...user.privacy, ...req.body.privacy };
  }
  if (req.body.notifications) {
    user.notifications = { ...user.notifications, ...req.body.notifications };
  }
  await user.save();
  return ok(res, { user: serializeUser(user, { id: user._id, contacts: user.contacts }) });
});

export const changePassword = asyncHandler(async (req: Request, res: Response) => {
  const user = await User.findById(req.userId).select("+passwordHash");
  if (!user) throw new HttpError(401, "User not found");
  const match = await bcrypt.compare(req.body.currentPassword, user.passwordHash);
  if (!match) throw new HttpError(400, "Current password is incorrect");
  user.passwordHash = await bcrypt.hash(req.body.password, 12);
  await user.save();
  return ok(res, null, "Password updated");
});

export const deleteAccount = asyncHandler(async (req: Request, res: Response) => {
  const user = await User.findById(req.userId);
  if (!user) throw new HttpError(401, "User not found");
  await Message.deleteMany({ sender: user._id });
  await Conversation.updateMany({ participants: user._id }, { $pull: { participants: user._id, admins: user._id } });
  await User.updateMany({}, { $pull: { contacts: user._id, blockedUsers: user._id } });
  await user.deleteOne();
  clearAuthCookie(res);
  return ok(res, null, "Account deleted");
});
