import type { Request, Response } from "express";
import {
  deleteMessage,
  editMessage,
  listMessages,
  markRead,
  reactToMessage,
  searchMessages,
  sendMessage,
  serializeMessage,
} from "../services/messageService.js";
import { getConversationPayload } from "../services/conversationService.js";
import { persistUpload } from "../services/uploadService.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { HttpError } from "../utils/httpError.js";
import { ok } from "../utils/apiResponse.js";
import { getIo } from "../sockets/io.js";

function uid(req: Request) {
  if (!req.userId) throw new HttpError(401, "Authentication required");
  return req.userId;
}

function emitMessage(conversationId: string, event: string, payload: unknown) {
  getIo().to(`conversation:${conversationId}`).emit(event, payload);
}

export const history = asyncHandler(async (req: Request, res: Response) => {
  const before = typeof req.query.before === "string" ? req.query.before : undefined;
  const limit = Number(req.query.limit ?? 40);
  const messages = await listMessages(req.params.conversationId, uid(req), before, limit);
  return ok(res, { messages });
});

export const search = asyncHandler(async (req: Request, res: Response) => {
  const q = String(req.query.q ?? "").trim();
  if (!q) return ok(res, { messages: [] });
  const messages = await searchMessages(req.params.conversationId, uid(req), q);
  return ok(res, { messages });
});

export const send = asyncHandler(async (req: Request, res: Response) => {
  let attachment;
  if (req.file) {
    const stored = await persistUpload(req.file, "orin/messages");
    attachment = stored;
  } else if (req.body.attachment) {
    attachment = req.body.attachment;
  }
  const type = req.file
    ? req.file.mimetype.startsWith("image/")
      ? "image"
      : "file"
    : req.body.type ?? "text";
  const { message, conversation } = await sendMessage(uid(req), {
    conversationId: req.body.conversationId ?? req.params.conversationId,
    text: req.body.text,
    type,
    attachment,
    replyTo: req.body.replyTo,
  });
  const serialized = { ...serializeMessage(message), clientId: req.body.clientId };
  emitMessage(conversation.id, "message:new", serialized);
  const payload = await getConversationPayload(conversation.id, uid(req));
  conversation.participants.forEach((id) => {
    getIo().to(`user:${id.toString()}`).emit("conversation:updated", payload);
  });
  return ok(res, { message: serialized }, "Sent", 201);
});

export const edit = asyncHandler(async (req: Request, res: Response) => {
  const message = await editMessage(req.params.id, uid(req), req.body.text);
  const serialized = serializeMessage(message);
  emitMessage(message.conversation.toString(), "message:updated", serialized);
  return ok(res, { message: serialized });
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  const message = await deleteMessage(req.params.id, uid(req));
  const serialized = serializeMessage(message);
  emitMessage(message.conversation.toString(), "message:updated", serialized);
  return ok(res, { message: serialized });
});

export const react = asyncHandler(async (req: Request, res: Response) => {
  const message = await reactToMessage(req.params.id, uid(req), req.body.emoji);
  const serialized = serializeMessage(message);
  emitMessage(message.conversation.toString(), "message:updated", serialized);
  return ok(res, { message: serialized });
});

export const read = asyncHandler(async (req: Request, res: Response) => {
  await markRead(req.params.conversationId, uid(req));
  getIo()
    .to(`conversation:${req.params.conversationId}`)
    .emit("conversation:read", { conversationId: req.params.conversationId, userId: uid(req).toString() });
  return ok(res, null);
});
