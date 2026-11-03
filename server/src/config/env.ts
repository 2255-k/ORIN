import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../../../.env") });
dotenv.config();

function required(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: Number(process.env.PORT ?? 5000),
  clientUrl: process.env.CLIENT_URL ?? "http://localhost:5173",
  mongoUri: required("MONGODB_URI", "mongodb://127.0.0.1:27017/orin"),
  jwtSecret: required("JWT_SECRET", "dev-only-change-me-orin-secret-key-32ch"),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? "1d",
  jwtRememberExpiresIn: process.env.JWT_REMEMBER_EXPIRES_IN ?? "30d",
  cookieName: process.env.COOKIE_NAME ?? "orin_token",
  cookieSecure: process.env.COOKIE_SECURE === "true",
  cookieSameSite: (process.env.COOKIE_SAMESITE as "lax" | "strict" | "none") ?? "lax",
  maxUploadMb: Number(process.env.MAX_UPLOAD_MB ?? 10),
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME ?? "",
    apiKey: process.env.CLOUDINARY_API_KEY ?? "",
    apiSecret: process.env.CLOUDINARY_API_SECRET ?? "",
  },
  smtp: {
    host: process.env.SMTP_HOST ?? "",
    port: Number(process.env.SMTP_PORT ?? 587),
    user: process.env.SMTP_USER ?? "",
    pass: process.env.SMTP_PASS ?? "",
    from: process.env.SMTP_FROM ?? "ORIN <noreply@orin.app>",
  },
};

export const isProd = env.nodeEnv === "production";
export const hasCloudinary = Boolean(
  env.cloudinary.cloudName && env.cloudinary.apiKey && env.cloudinary.apiSecret,
);
export const hasSmtp = Boolean(env.smtp.host && env.smtp.user && env.smtp.pass);
