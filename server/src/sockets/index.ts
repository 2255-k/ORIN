import type { Server, Socket } from "socket.io";
import cookie from "cookie";
import mongoose from "mongoose";
import { env } from "../config/env.js";
import { verifyAccessToken } from "../utils/tokens.js";
import { User } from "../models/User.js";
import { Conversation } from "../models/Conversation.js";
import { sendMessage, serializeMessage, markDelivered } from "../services/messageService.js";
import { setIo } from "./io.js";

const onlineUsers = new Map<string, Set<string>>();

function emitPresence(io: Server, userId: string, status: "online" | "offline") {
  io.emit("presence:update", { userId, status, lastSeen: new Date().toISOString() });
}

export function registerSockets(io: Server) {
  setIo(io);

  io.use((socket, next) => {
    try {
      const cookies = cookie.parse(socket.handshake.headers.cookie ?? "");
      const token = cookies[env.cookieName];
      if (!token) return next(new Error("Authentication required"));
      const payload = verifyAccessToken(token);
      socket.data.userId = payload.sub;
      next();
    } catch {
      next(new Error("Invalid session"));
    }
  });

  io.on("connection", async (socket: Socket) => {
    const userId = socket.data.userId as string;
    const objectId = new mongoose.Types.ObjectId(userId);
    socket.join(`user:${userId}`);

    const sockets = onlineUsers.get(userId) ?? new Set<string>();
    sockets.add(socket.id);
    onlineUsers.set(userId, sockets);
    await User.findByIdAndUpdate(userId, { status: "online" });
    emitPresence(io, userId, "online");

    const conversations = await Conversation.find({ participants: userId }).select("_id");
    for (const c of conversations) {
      socket.join(`conversation:${c.id}`);
      await markDelivered(c.id, objectId).catch(() => undefined);
    }

    socket.on("conversation:join", (conversationId: string) => {
      socket.join(`conversation:${conversationId}`);
    });

    socket.on("typing:start", ({ conversationId }: { conversationId: string }) => {
      socket.to(`conversation:${conversationId}`).emit("typing:update", {
        conversationId,
        userId,
        typing: true,
      });
    });

    socket.on("typing:stop", ({ conversationId }: { conversationId: string }) => {
      socket.to(`conversation:${conversationId}`).emit("typing:update", {
        conversationId,
        userId,
        typing: false,
      });
    });

    socket.on(
      "message:send",
      async (
        payload: {
          conversationId: string;
          text?: string;
          type?: "text" | "image" | "file";
          attachment?: {
            url: string;
            publicId?: string;
            filename: string;
            mimeType: string;
            size: number;
          };
          replyTo?: string;
          clientId?: string;
        },
        ack?: (result: { ok: boolean; message?: unknown; error?: string }) => void,
      ) => {
        try {
          const { message, conversation } = await sendMessage(objectId, payload);
          const serialized = { ...serializeMessage(message), clientId: payload.clientId };
          io.to(`conversation:${conversation.id}`).emit("message:new", serialized);
          ack?.({ ok: true, message: serialized });
        } catch (err) {
          ack?.({ ok: false, error: err instanceof Error ? err.message : "Failed to send" });
        }
      },
    );

    socket.on("disconnect", async () => {
      const set = onlineUsers.get(userId);
      set?.delete(socket.id);
      if (!set || set.size === 0) {
        onlineUsers.delete(userId);
        await User.findByIdAndUpdate(userId, { status: "offline", lastSeen: new Date() });
        emitPresence(io, userId, "offline");
      }
    });
  });
}
