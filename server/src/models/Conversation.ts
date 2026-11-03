import mongoose, { Schema, type Document, type Types } from "mongoose";

export interface IConversation extends Document {
  type: "direct" | "group";
  participants: Types.ObjectId[];
  name?: string;
  description?: string;
  avatar?: { url: string; publicId?: string };
  admins: Types.ObjectId[];
  createdBy: Types.ObjectId;
  lastMessage?: {
    text: string;
    sender?: Types.ObjectId;
    type: string;
    createdAt: Date;
  };
  createdAt: Date;
  updatedAt: Date;
}

const conversationSchema = new Schema<IConversation>(
  {
    type: { type: String, enum: ["direct", "group"], required: true },
    participants: [{ type: Schema.Types.ObjectId, ref: "User", required: true }],
    name: { type: String, trim: true, maxlength: 80 },
    description: { type: String, trim: true, maxlength: 240 },
    avatar: { url: String, publicId: String },
    admins: [{ type: Schema.Types.ObjectId, ref: "User" }],
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    lastMessage: {
      text: String,
      sender: { type: Schema.Types.ObjectId, ref: "User" },
      type: String,
      createdAt: Date,
    },
  },
  { timestamps: true },
);

conversationSchema.index({ participants: 1, updatedAt: -1 });
conversationSchema.index({ type: 1, participants: 1 });

export const Conversation = mongoose.model<IConversation>("Conversation", conversationSchema);
