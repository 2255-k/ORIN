import mongoose, { Schema, type Document, type Types } from "mongoose";

export interface IReaction {
  emoji: string;
  user: Types.ObjectId;
}

export interface IMessage extends Document {
  conversation: Types.ObjectId;
  sender: Types.ObjectId;
  type: "text" | "image" | "file" | "system";
  text: string;
  attachment?: {
    url: string;
    publicId?: string;
    filename: string;
    mimeType: string;
    size: number;
  };
  replyTo?: Types.ObjectId;
  reactions: IReaction[];
  deliveredTo: Types.ObjectId[];
  readBy: Types.ObjectId[];
  editedAt?: Date;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const messageSchema = new Schema<IMessage>(
  {
    conversation: { type: Schema.Types.ObjectId, ref: "Conversation", required: true, index: true },
    sender: { type: Schema.Types.ObjectId, ref: "User", required: true },
    type: { type: String, enum: ["text", "image", "file", "system"], default: "text" },
    text: { type: String, default: "", maxlength: 4000 },
    attachment: {
      url: String,
      publicId: String,
      filename: String,
      mimeType: String,
      size: Number,
    },
    replyTo: { type: Schema.Types.ObjectId, ref: "Message" },
    reactions: [
      {
        emoji: { type: String, required: true },
        user: { type: Schema.Types.ObjectId, ref: "User", required: true },
      },
    ],
    deliveredTo: [{ type: Schema.Types.ObjectId, ref: "User" }],
    readBy: [{ type: Schema.Types.ObjectId, ref: "User" }],
    editedAt: Date,
    deletedAt: Date,
  },
  { timestamps: true },
);

messageSchema.index({ conversation: 1, createdAt: -1 });
messageSchema.index({ conversation: 1, _id: -1 });

export const Message = mongoose.model<IMessage>("Message", messageSchema);
