import type { Request, Response } from "express";
import mongoose from "mongoose";
import { User } from "../models/User.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { HttpError } from "../utils/httpError.js";
import { ok } from "../utils/apiResponse.js";
import { serializeUser } from "../utils/publicUser.js";
import { persistUpload } from "../services/uploadService.js";
import { getOrCreateDirect } from "../services/conversationService.js";

async function viewer(req: Request) {
  const user = await User.findById(req.userId);
  if (!user) throw new HttpError(401, "User not found");
  return user;
}

export const searchUsers = asyncHandler(async (req: Request, res: Response) => {
  const me = await viewer(req);
  const q = String(req.query.q ?? "").trim();
  if (!q) return ok(res, { users: [] });
  const users = await User.find({
    _id: { $ne: me._id, $nin: me.blockedUsers },
    blockedUsers: { $ne: me._id },
    $or: [
      { username: { $regex: q, $options: "i" } },
      { name: { $regex: q, $options: "i" } },
    ],
  }).limit(20);
  return ok(res, {
    users: users.map((u) => serializeUser(u, { id: me._id, contacts: me.contacts })),
  });
});

export const getUser = asyncHandler(async (req: Request, res: Response) => {
  const me = await viewer(req);
  const user = await User.findById(req.params.id);
  if (!user) throw new HttpError(404, "User not found");
  return ok(res, { user: serializeUser(user, { id: me._id, contacts: me.contacts }) });
});

export const listContacts = asyncHandler(async (req: Request, res: Response) => {
  const me = await viewer(req);
  const contacts = await User.find({ _id: { $in: me.contacts } });
  return ok(res, {
    contacts: contacts.map((u) => serializeUser(u, { id: me._id, contacts: me.contacts })),
  });
});

export const addContact = asyncHandler(async (req: Request, res: Response) => {
  const me = await viewer(req);
  const targetId = new mongoose.Types.ObjectId(req.params.id);
  if (targetId.equals(me._id)) throw new HttpError(400, "You cannot add yourself");
  const target = await User.findById(targetId);
  if (!target) throw new HttpError(404, "User not found");
  if (!me.contacts.some((id) => id.equals(targetId))) me.contacts.push(targetId);
  await me.save();
  const conversation = await getOrCreateDirect(me._id, target.id);
  return ok(res, { contact: serializeUser(target, { id: me._id, contacts: me.contacts }), conversationId: conversation.id });
});

export const removeContact = asyncHandler(async (req: Request, res: Response) => {
  const me = await viewer(req);
  me.contacts = me.contacts.filter((id) => id.toString() !== req.params.id);
  await me.save();
  return ok(res, null, "Contact removed");
});

export const blockUser = asyncHandler(async (req: Request, res: Response) => {
  const me = await viewer(req);
  const targetId = new mongoose.Types.ObjectId(req.params.id);
  if (!me.blockedUsers.some((id) => id.equals(targetId))) me.blockedUsers.push(targetId);
  me.contacts = me.contacts.filter((id) => !id.equals(targetId));
  await me.save();
  return ok(res, null, "User blocked");
});

export const unblockUser = asyncHandler(async (req: Request, res: Response) => {
  const me = await viewer(req);
  me.blockedUsers = me.blockedUsers.filter((id) => id.toString() !== req.params.id);
  await me.save();
  return ok(res, null, "User unblocked");
});

export const listBlocked = asyncHandler(async (req: Request, res: Response) => {
  const me = await viewer(req);
  const users = await User.find({ _id: { $in: me.blockedUsers } });
  return ok(res, { users: users.map((u) => serializeUser(u, { id: me._id, contacts: me.contacts })) });
});

export const updateProfile = asyncHandler(async (req: Request, res: Response) => {
  const me = await viewer(req);
  if (req.body.username && req.body.username !== me.username) {
    const taken = await User.findOne({ username: req.body.username, _id: { $ne: me._id } });
    if (taken) throw new HttpError(409, "Username is already taken");
    me.username = req.body.username;
  }
  if (req.body.name) me.name = req.body.name;
  if (req.body.bio !== undefined) me.bio = req.body.bio;
  await me.save();
  return ok(res, { user: serializeUser(me, { id: me._id, contacts: me.contacts }) });
});

export const uploadAvatar = asyncHandler(async (req: Request, res: Response) => {
  if (!req.file) throw new HttpError(400, "No file uploaded");
  const me = await viewer(req);
  const stored = await persistUpload(req.file, "orin/avatars");
  me.avatar = { url: stored.url, publicId: stored.publicId };
  await me.save();
  return ok(res, { user: serializeUser(me, { id: me._id, contacts: me.contacts }) });
});
