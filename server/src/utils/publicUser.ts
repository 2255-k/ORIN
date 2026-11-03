import type { Types } from "mongoose";
import type { LastSeenPrivacy } from "../models/User.js";

type UserLike = {
  _id: Types.ObjectId;
  name: string;
  username: string;
  email?: string;
  avatar?: { url?: string } | null;
  bio?: string;
  status?: "online" | "offline";
  lastSeen?: Date;
  privacy?: {
    lastSeen: LastSeenPrivacy;
    profilePhoto: LastSeenPrivacy;
    readReceipts: boolean;
  };
  notifications?: {
    messageSound: boolean;
    desktop: boolean;
    inApp: boolean;
    mutedConversations: Types.ObjectId[];
  };
  contacts?: Types.ObjectId[];
  blockedUsers?: Types.ObjectId[];
  pinnedConversations?: Types.ObjectId[];
  archivedConversations?: Types.ObjectId[];
  createdAt?: Date;
};

function canSee(privacy: LastSeenPrivacy, isSelf: boolean, isContact: boolean) {
  if (isSelf) return true;
  if (privacy === "nobody") return false;
  if (privacy === "contacts") return isContact;
  return true;
}

export function serializeUser(
  user: UserLike,
  viewer?: { id: Types.ObjectId; contacts: Types.ObjectId[] } | null,
) {
  const isSelf = viewer ? user._id.equals(viewer.id) : false;
  const isContact = viewer ? viewer.contacts.some((id) => id.equals(user._id)) : false;
  const lastSeenPrivacy = user.privacy?.lastSeen ?? "everyone";
  const photoPrivacy = user.privacy?.profilePhoto ?? "everyone";
  const showLastSeen = canSee(lastSeenPrivacy, isSelf, isContact);
  const showPhoto = canSee(photoPrivacy, isSelf, isContact);

  return {
    id: user._id.toString(),
    name: user.name,
    username: user.username,
    email: isSelf ? user.email : undefined,
    avatar: showPhoto ? user.avatar?.url ?? null : null,
    bio: user.bio ?? "",
    status: user.status ?? "offline",
    lastSeen: showLastSeen ? user.lastSeen ?? null : null,
    privacy: isSelf ? user.privacy : undefined,
    notifications: isSelf ? user.notifications : undefined,
    contacts: isSelf ? user.contacts?.map((id) => id.toString()) : undefined,
    blockedUsers: isSelf ? user.blockedUsers?.map((id) => id.toString()) : undefined,
    pinnedConversations: isSelf ? user.pinnedConversations?.map((id) => id.toString()) : undefined,
    archivedConversations: isSelf ? user.archivedConversations?.map((id) => id.toString()) : undefined,
    createdAt: user.createdAt,
  };
}
