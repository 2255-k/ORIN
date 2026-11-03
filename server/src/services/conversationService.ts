import mongoose, { type Types } from "mongoose";
import { Conversation } from "../models/Conversation.js";
import { Message } from "../models/Message.js";
import { User } from "../models/User.js";
import { HttpError } from "../utils/httpError.js";
import { serializeUser } from "../utils/publicUser.js";

export async function assertMember(conversationId: string, userId: Types.ObjectId) {
  const conversation = await Conversation.findById(conversationId);
  if (!conversation) throw new HttpError(404, "Conversation not found");
  if (!conversation.participants.some((id) => id.equals(userId))) {
    throw new HttpError(403, "You are not a member of this conversation");
  }
  return conversation;
}

export async function getOrCreateDirect(userId: Types.ObjectId, otherId: string) {
  if (userId.toString() === otherId) throw new HttpError(400, "Cannot start a conversation with yourself");
  const other = await User.findById(otherId);
  if (!other) throw new HttpError(404, "User not found");
  if (other.blockedUsers.some((id) => id.equals(userId))) {
    throw new HttpError(403, "Unable to start this conversation");
  }
  const me = await User.findById(userId);
  if (me?.blockedUsers.some((id) => id.equals(other._id))) {
    throw new HttpError(403, "Unblock this user before starting a conversation");
  }

  const existing = await Conversation.findOne({
    type: "direct",
    participants: { $all: [userId, other._id], $size: 2 },
  });
  if (existing) return existing;

  return Conversation.create({
    type: "direct",
    participants: [userId, other._id],
    admins: [],
    createdBy: userId,
  });
}

export async function createGroup(
  userId: Types.ObjectId,
  input: { name: string; description?: string; memberIds: string[]; avatar?: { url: string; publicId?: string } },
) {
  const unique = [...new Set(input.memberIds.filter((id) => id !== userId.toString()))];
  const members = await User.find({ _id: { $in: unique } });
  if (members.length !== unique.length) throw new HttpError(400, "One or more members were not found");
  const participants = [userId, ...members.map((m) => m._id)];
  const conversation = await Conversation.create({
    type: "group",
    name: input.name,
    description: input.description ?? "",
    participants,
    admins: [userId],
    createdBy: userId,
    avatar: input.avatar,
  });
  await Message.create({
    conversation: conversation._id,
    sender: userId,
    type: "system",
    text: "Group created",
    readBy: [userId],
    deliveredTo: [userId],
  });
  return conversation;
}

export async function listConversations(userId: Types.ObjectId, filter: "all" | "groups" | "archived" = "all") {
  const me = await User.findById(userId);
  if (!me) throw new HttpError(401, "User not found");
  const archived = me.archivedConversations;
  const query: Record<string, unknown> = { participants: userId };
  if (filter === "groups") query.type = "group";
  if (filter === "archived") query._id = { $in: archived };
  else query._id = { $nin: archived };

  const conversations = await Conversation.find(query).sort({ updatedAt: -1 }).populate("participants");

  const ids = conversations.map((c) => c._id);
  const unread = await Message.aggregate([
    {
      $match: {
        conversation: { $in: ids },
        sender: { $ne: userId },
        deletedAt: { $exists: false },
        readBy: { $ne: userId },
        type: { $ne: "system" },
      },
    },
    { $group: { _id: "$conversation", count: { $sum: 1 } } },
  ]);
  const unreadMap = new Map(unread.map((u) => [u._id.toString(), u.count as number]));

  return conversations.map((c) => {
    const participants = (c.participants as unknown as import("../models/User.js").IUser[]).map((p) =>
      serializeUser(p, { id: me._id, contacts: me.contacts }),
    );
    return {
      id: c.id,
      type: c.type,
      name: c.name,
      description: c.description,
      avatar: c.avatar?.url ?? null,
      admins: c.admins.map((a) => a.toString()),
      createdBy: c.createdBy.toString(),
      participants,
      lastMessage: c.lastMessage
        ? {
            text: c.lastMessage.text,
            sender: c.lastMessage.sender?.toString(),
            type: c.lastMessage.type,
            createdAt: c.lastMessage.createdAt,
          }
        : null,
      pinned: me.pinnedConversations.some((id) => id.equals(c._id)),
      archived: me.archivedConversations.some((id) => id.equals(c._id)),
      unreadCount: unreadMap.get(c._id.toString()) ?? 0,
      updatedAt: c.updatedAt,
    };
  });
}

export async function getConversationPayload(conversationId: string, userId: Types.ObjectId) {
  const conversation = await assertMember(conversationId, userId);
  await conversation.populate("participants");
  const me = await User.findById(userId);
  if (!me) throw new HttpError(401, "User not found");
  const participants = (conversation.participants as unknown as import("../models/User.js").IUser[]).map((p) =>
    serializeUser(p, { id: me._id, contacts: me.contacts }),
  );
  return {
    id: conversation.id,
    type: conversation.type,
    name: conversation.name,
    description: conversation.description,
    avatar: conversation.avatar?.url ?? null,
    admins: conversation.admins.map((id) => id.toString()),
    createdBy: conversation.createdBy.toString(),
    participants,
    lastMessage: conversation.lastMessage ?? null,
    pinned: me.pinnedConversations.some((id) => id.equals(conversation._id)),
    archived: me.archivedConversations.some((id) => id.equals(conversation._id)),
  };
}

export function isAdmin(conversation: { admins: Types.ObjectId[] }, userId: Types.ObjectId) {
  return conversation.admins.some((id) => id.equals(userId));
}

export async function updateGroup(
  conversationId: string,
  userId: Types.ObjectId,
  patch: { name?: string; description?: string; avatar?: { url: string; publicId?: string } },
) {
  const conversation = await assertMember(conversationId, userId);
  if (conversation.type !== "group") throw new HttpError(400, "Not a group");
  if (!isAdmin(conversation, userId)) throw new HttpError(403, "Only admins can update this group");
  if (patch.name) conversation.name = patch.name;
  if (patch.description !== undefined) conversation.description = patch.description;
  if (patch.avatar) conversation.avatar = patch.avatar;
  await conversation.save();
  return conversation;
}

export async function addMembers(conversationId: string, userId: Types.ObjectId, memberIds: string[]) {
  const conversation = await assertMember(conversationId, userId);
  if (conversation.type !== "group") throw new HttpError(400, "Not a group");
  if (!isAdmin(conversation, userId)) throw new HttpError(403, "Only admins can add members");
  const users = await User.find({ _id: { $in: memberIds } });
  for (const u of users) {
    if (!conversation.participants.some((id) => id.equals(u._id))) {
      conversation.participants.push(u._id);
    }
  }
  await conversation.save();
  return conversation;
}

export async function removeMember(conversationId: string, actorId: Types.ObjectId, memberId: string) {
  const conversation = await assertMember(conversationId, actorId);
  if (conversation.type !== "group") throw new HttpError(400, "Not a group");
  const target = new mongoose.Types.ObjectId(memberId);
  const leaving = target.equals(actorId);
  if (!leaving && !isAdmin(conversation, actorId)) {
    throw new HttpError(403, "Only admins can remove members");
  }
  conversation.participants = conversation.participants.filter((id) => !id.equals(target));
  conversation.admins = conversation.admins.filter((id) => !id.equals(target));
  if (conversation.participants.length === 0) {
    await conversation.deleteOne();
    return null;
  }
  if (conversation.admins.length === 0) {
    conversation.admins = [conversation.participants[0]];
  }
  await conversation.save();
  return conversation;
}
