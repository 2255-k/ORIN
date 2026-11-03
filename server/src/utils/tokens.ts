import crypto from "node:crypto";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

export function signAccessToken(userId: string, remember: boolean) {
  return jwt.sign({ sub: userId }, env.jwtSecret, {
    expiresIn: remember ? env.jwtRememberExpiresIn : env.jwtExpiresIn,
  } as jwt.SignOptions);
}

export function verifyAccessToken(token: string): { sub: string } {
  return jwt.verify(token, env.jwtSecret) as { sub: string };
}

export function createResetToken() {
  const raw = crypto.randomBytes(32).toString("hex");
  const hash = crypto.createHash("sha256").update(raw).digest("hex");
  return { raw, hash };
}

export function hashResetToken(raw: string) {
  return crypto.createHash("sha256").update(raw).digest("hex");
}
