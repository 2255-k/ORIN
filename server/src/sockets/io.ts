import type { Server } from "socket.io";

let io: Server | null = null;

export function setIo(instance: Server) {
  io = instance;
}

export function getIo(): Server {
  if (!io) throw new Error("Socket.IO has not been initialized");
  return io;
}
