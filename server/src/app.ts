import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { env } from "./config/env.js";
import { authRouter } from "./routes/auth.js";
import { usersRouter } from "./routes/users.js";
import { conversationsRouter } from "./routes/conversations.js";
import { messagesRouter } from "./routes/messages.js";
import { uploadsRouter } from "./routes/uploads.js";
import { settingsRouter } from "./routes/settings.js";
import { errorHandler, notFound } from "./middleware/errorHandler.js";
import { localUploadDir } from "./services/uploadService.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export function createApp() {
  const app = express();
  app.set("trust proxy", 1);
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: "cross-origin" },
    }),
  );
  app.use(
    cors({
      origin: env.clientUrl,
      credentials: true,
    }),
  );
  app.use(cookieParser());
  app.use(express.json({ limit: "1mb" }));
  app.use(express.urlencoded({ extended: true }));
  app.use(
    rateLimit({
      windowMs: 60 * 1000,
      max: 180,
      standardHeaders: true,
      legacyHeaders: false,
    }),
  );
  app.use("/uploads", express.static(localUploadDir));

  app.get("/api/health", (_req, res) => {
    res.json({ success: true, message: "ORIN is online" });
  });

  app.use("/api/auth", authRouter);
  app.use("/api/users", usersRouter);
  app.use("/api/conversations", conversationsRouter);
  app.use("/api/messages", messagesRouter);
  app.use("/api/uploads", uploadsRouter);
  app.use("/api/settings", settingsRouter);

  const clientDist = path.resolve(__dirname, "../../client/dist");
  app.use(express.static(clientDist));
  app.get("*", (req, res, next) => {
    if (req.path.startsWith("/api") || req.path.startsWith("/socket.io")) return next();
    res.sendFile(path.join(clientDist, "index.html"), (err) => {
      if (err) next();
    });
  });

  app.use(notFound);
  app.use(errorHandler);
  return app;
}
