import multer from "multer";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import { env } from "../config/env.js";
import { HttpError } from "../utils/httpError.js";

const dir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../uploads");
fs.mkdirSync(dir, { recursive: true });

const allowed = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "application/pdf",
  "text/plain",
  "application/zip",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

export const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, dir),
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname).slice(0, 8);
      cb(null, `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`);
    },
  }),
  limits: { fileSize: env.maxUploadMb * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!allowed.has(file.mimetype)) {
      cb(new HttpError(400, "File type is not allowed"));
      return;
    }
    cb(null, true);
  },
});
