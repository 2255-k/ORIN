import mongoose, { Schema, type Document, type Types } from "mongoose";

export type LastSeenPrivacy = "everyone" | "contacts" | "nobody";

export interface IUser extends Document {
  name: string;
  username: string;
  email: string;
  passwordHash: string;
  avatar?: { url: string; publicId?: string };
  bio: string;
  status: "online" | "offline";
  lastSeen: Date;
  privacy: {
    lastSeen: LastSeenPrivacy;
    profilePhoto: LastSeenPrivacy;
    readReceipts: boolean;
  };
  notifications: {
    messageSound: boolean;
    desktop: boolean;
    inApp: boolean;
    mutedConversations: Types.ObjectId[];
  };
  contacts: Types.ObjectId[];
  blockedUsers: Types.ObjectId[];
  pinnedConversations: Types.ObjectId[];
  archivedConversations: Types.ObjectId[];
  passwordResetToken?: string;
  passwordResetExpires?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    username: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      minlength: 3,
      maxlength: 24,
      match: /^[a-z0-9._]+$/,
    },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true, select: false },
    avatar: {
      url: String,
      publicId: String,
    },
    bio: { type: String, default: "", maxlength: 180 },
    status: { type: String, enum: ["online", "offline"], default: "offline" },
    lastSeen: { type: Date, default: Date.now },
    privacy: {
      lastSeen: { type: String, enum: ["everyone", "contacts", "nobody"], default: "everyone" },
      profilePhoto: { type: String, enum: ["everyone", "contacts", "nobody"], default: "everyone" },
      readReceipts: { type: Boolean, default: true },
    },
    notifications: {
      messageSound: { type: Boolean, default: true },
      desktop: { type: Boolean, default: false },
      inApp: { type: Boolean, default: true },
      mutedConversations: [{ type: Schema.Types.ObjectId, ref: "Conversation" }],
    },
    contacts: [{ type: Schema.Types.ObjectId, ref: "User" }],
    blockedUsers: [{ type: Schema.Types.ObjectId, ref: "User" }],
    pinnedConversations: [{ type: Schema.Types.ObjectId, ref: "Conversation" }],
    archivedConversations: [{ type: Schema.Types.ObjectId, ref: "Conversation" }],
    passwordResetToken: { type: String, select: false },
    passwordResetExpires: { type: Date, select: false },
  },
  { timestamps: true },
);

userSchema.index({ name: "text", username: "text" });

export const User = mongoose.model<IUser>("User", userSchema);
