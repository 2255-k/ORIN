import http from "node:http";
import { Server } from "socket.io";
import { createApp } from "./app.js";
import { connectDb } from "./config/db.js";
import { env } from "./config/env.js";
import { registerSockets } from "./sockets/index.js";

async function bootstrap() {
  await connectDb();
  const app = createApp();
  const server = http.createServer(app);
  const io = new Server(server, {
    cors: { origin: env.clientUrl, credentials: true },
    pingInterval: 20000,
    pingTimeout: 20000,
  });
  registerSockets(io);

  server.listen(env.port, () => {
    console.log(`ORIN server listening on http://localhost:${env.port}`);
  });
}

bootstrap().catch((err) => {
  console.error("Failed to start ORIN", err);
  process.exit(1);
});
