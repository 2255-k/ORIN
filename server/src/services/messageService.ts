import type { Types } from "mongoose";
import { Conversation } from "../models/Conversation.js";
import { Message, type IMessage } from "../models/Message.js";
import { User } from "../models/User.js";
import { HttpError } from "../utils/httpError.js";
import { assertMember } from "./conversationService.js";

function previewText(msg: IMessage) {
  if (msg.deletedAt) return "Message deleted";
  if (msg.type === "image") return "Photo";
  if (msg.type === "file") return msg.attachment?.filename ?? "File";
  return msg.text;
}

export function serializeMessage(msg: IMessage) {
  return {
    id: msg.id,
    conversationId: msg.conversation.toString(),
    senderId: msg.sender.toString(),
    type: msg.type,
    text: msg.deletedAt ? "" : msg.text,
    attachment: msg.deletedAt ? null : msg.attachment ?? null,
    replyTo: msg.replyTo?.toString() ?? null,
    reactions: msg.reactions.map((r) => ({ emoji: r.emoji, userId: r.user.toString() })),
    deliveredTo: msg.deliveredTo.map((id) => id.toString()),
    readBy: msg.readBy.map((id) => id.toString()),
    editedAt: msg.editedAt ?? null,
    deletedAt: msg.deletedAt ?? null,
    createdAt: msg.createdAt,
  };
}

export async function sendMessage(
  userId: Types.ObjectId,
  input: {
    conversationId: string;
    text?: string;
    type?: "text" | "image" | "file";
    attachment?: IMessage["attachment"];
    replyTo?: string;
  },
) {
  const conversation = await assertMember(input.conversationId, userId);
  const me = await User.findById(userId);
  const others = conversation.participants.filter((id) => !id.equals(userId));
  if (conversation.type === "direct") {
    const other = await User.findById(others[0]);
    if (other?.blockedUsers.some((id) => id.equals(userId)) || me?.blockedUsers.some((id) => id.equals(other?._id))) {
      throw new HttpError(403, "You cannot message this user");
    }
  }
  if (input.type !== "image" && input.type !== "file" && !input.text?.trim()) {
    throw new HttpError(400, "Message cannot be empty");
  }

  const message = await Message.create({
    conversation: conversation._id,
    sender: userId,
    type: input.type ?? "text",
    text: input.text?.trim() ?? "",
    attachment: input.attachment,
    replyTo: input.replyTo,
    deliveredTo: [userId],
    readBy: [userId],
  });

  conversation.lastMessage = {
    text: previewText(message),
    sender: userId,
    type: message.type,
    createdAt: message.createdAt,
  };
  conversation.updatedAt = new Date();
  await conversation.save();

  return { message, conversation, others };
}

export async function listMessages(conversationId: string, userId: Types.ObjectId, before?: string, limit = 40) {
  await assertMember(conversationId, userId);
  const query: Record<string, unknown> = { conversation: conversationId };
  if (before) query._id = { $lt: before };
  const messages = await Message.find(query).sort({ _id: -1 }).limit(Math.min(limit, 80));
  return messages.reverse().map(serializeMessage);
}

export async function searchMessages(conversationId: string, userId: Types.ObjectId, q: string) {
  await assertMember(conversationId, userId);
  const messages = await Message.find({
    conversation: conversationId,
    deletedAt: { $exists: false },
    text: { $regex: q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), $options: "i" },
  })
    .sort({ createdAt: -1 })
    .limit(50);
  return messages.map(serializeMessage);
}

export async function editMessage(messageId: string, userId: Types.ObjectId, text: string) {
  const message = await Message.findById(messageId);
  if (!message || message.deletedAt) throw new HttpError(404, "Message not found");
  if (!message.sender.equals(userId)) throw new HttpError(403, "You can only edit your own messages");
  if (message.type !== "text") throw new HttpError(400, "Only text messages can be edited");
  message.text = text;
  message.editedAt = new Date();
  await message.save();
  await Conversation.updateOne(
    { _id: message.conversation, "lastMessage.sender": userId },
    { $set: { "lastMessage.text": text } },
  );
  return message;
}

export async function deleteMessage(messageId: string, userId: Types.ObjectId) {
  const message = await Message.findById(messageId);
  if (!message) throw new HttpError(404, "Message not found");
  if (!message.sender.equals(userId)) throw new HttpError(403, "You can only delete your own messages");
  message.deletedAt = new Date();
  message.text = "";
  await message.save();
  return message;
}

export async function reactToMessage(messageId: string, userId: Types.ObjectId, emoji: string) {
  const message = await Message.findById(messageId);
  if (!message || message.deletedAt) throw new HttpError(404, "Message not found");
  await assertMember(message.conversation.toString(), userId);
  const existing = message.reactions.find((r) => r.user.equals(userId) && r.emoji === emoji);
  if (existing) {
    message.reactions = message.reactions.filter((r) => !(r.user.equals(userId) && r.emoji === emoji));
  } else {
    message.reactions.push({ emoji, user: userId });
  }
  await message.save();
  return message;
}

export async function markRead(conversationId: string, userId: Types.ObjectId) {
  await assertMember(conversationId, userId);
  await Message.updateMany(
    { conversation: conversationId, sender: { $ne: userId }, readBy: { $ne: userId } },
    { $addToSet: { readBy: userId, deliveredTo: userId } },
  );
}

export async function markDelivered(conversationId: string, userId: Types.ObjectId) {
  await Message.updateMany(
    { conversation: conversationId, sender: { $ne: userId }, deliveredTo: { $ne: userId } },
    { $addToSet: { deliveredTo: userId } },
  );
}
