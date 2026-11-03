import type { Request, Response } from "express";
import mongoose from "mongoose";
import { User } from "../models/User.js";
import {
  addMembers,
  createGroup,
  getConversationPayload,
  getOrCreateDirect,
  listConversations,
  removeMember,
  updateGroup,
} from "../services/conversationService.js";
import { persistUpload } from "../services/uploadService.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { HttpError } from "../utils/httpError.js";
import { ok } from "../utils/apiResponse.js";
import { getIo } from "../sockets/io.js";

function uid(req: Request) {
  if (!req.userId) throw new HttpError(401, "Authentication required");
  return req.userId;
}

export const list = asyncHandler(async (req: Request, res: Response) => {
  const filter = (req.query.filter as "all" | "groups" | "archived") ?? "all";
  const conversations = await listConversations(uid(req), filter);
  return ok(res, { conversations });
});

export const getOne = asyncHandler(async (req: Request, res: Response) => {
  const conversation = await getConversationPayload(req.params.id, uid(req));
  return ok(res, { conversation });
});

export const createDirect = asyncHandler(async (req: Request, res: Response) => {
  const conversation = await getOrCreateDirect(uid(req), req.body.userId);
  const payload = await getConversationPayload(conversation.id, uid(req));
  return ok(res, { conversation: payload }, "Conversation ready", 201);
});

export const createGroupHandler = asyncHandler(async (req: Request, res: Response) => {
  let avatar;
  if (req.file) avatar = await persistUpload(req.file, "orin/groups");
  const memberIds = Array.isArray(req.body.memberIds)
    ? req.body.memberIds
    : JSON.parse(String(req.body.memberIds ?? "[]"));
  const conversation = await createGroup(uid(req), {
    name: req.body.name,
    description: req.body.description,
    memberIds,
    avatar,
  });
  const payload = await getConversationPayload(conversation.id, uid(req));
  const io = getIo();
  conversation.participants.forEach((id) => {
    io.to(`user:${id.toString()}`).emit("conversation:updated", payload);
  });
  return ok(res, { conversation: payload }, "Group created", 201);
});

export const updateGroupHandler = asyncHandler(async (req: Request, res: Response) => {
  let avatar;
  if (req.file) avatar = await persistUpload(req.file, "orin/groups");
  const conversation = await updateGroup(req.params.id, uid(req), {
    name: req.body.name,
    description: req.body.description,
    avatar,
  });
  const payload = await getConversationPayload(conversation.id, uid(req));
  getIo().to(`conversation:${conversation.id}`).emit("conversation:updated", payload);
  return ok(res, { conversation: payload });
});

export const addMembersHandler = asyncHandler(async (req: Request, res: Response) => {
  const conversation = await addMembers(req.params.id, uid(req), req.body.memberIds ?? []);
  const payload = await getConversationPayload(conversation.id, uid(req));
  getIo().to(`conversation:${conversation.id}`).emit("conversation:updated", payload);
  return ok(res, { conversation: payload });
});

export const removeMemberHandler = asyncHandler(async (req: Request, res: Response) => {
  const conversation = await removeMember(req.params.id, uid(req), req.params.memberId);
  if (!conversation) return ok(res, null, "Group deleted");
  const payload = await getConversationPayload(conversation.id, uid(req));
  getIo().to(`conversation:${conversation.id}`).emit("conversation:updated", payload);
  return ok(res, { conversation: payload });
});

export const pinConversation = asyncHandler(async (req: Request, res: Response) => {
  const me = await User.findById(uid(req));
  if (!me) throw new HttpError(401, "User not found");
  const id = new mongoose.Types.ObjectId(req.params.id);
  const pinned = me.pinnedConversations.some((x) => x.equals(id));
  me.pinnedConversations = pinned
    ? me.pinnedConversations.filter((x) => !x.equals(id))
    : [...me.pinnedConversations, id];
  await me.save();
  return ok(res, { pinned: !pinned });
});

export const archiveConversation = asyncHandler(async (req: Request, res: Response) => {
  const me = await User.findById(uid(req));
  if (!me) throw new HttpError(401, "User not found");
  const id = new mongoose.Types.ObjectId(req.params.id);
  const archived = me.archivedConversations.some((x) => x.equals(id));
  me.archivedConversations = archived
    ? me.archivedConversations.filter((x) => !x.equals(id))
    : [...me.archivedConversations, id];
  await me.save();
  return ok(res, { archived: !archived });
});
