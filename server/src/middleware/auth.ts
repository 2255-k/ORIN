import type { NextFunction, Request, Response } from "express";
import mongoose from "mongoose";
import { env } from "../config/env.js";
import { HttpError } from "../utils/httpError.js";
import { verifyAccessToken } from "../utils/tokens.js";

export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  try {
    const token = req.cookies?.[env.cookieName] as string | undefined;
    if (!token) throw new HttpError(401, "Authentication required");
    const payload = verifyAccessToken(token);
    req.userId = new mongoose.Types.ObjectId(payload.sub);
    next();
  } catch {
    next(new HttpError(401, "Invalid or expired session"));
  }
}

export function optionalAuth(req: Request, _res: Response, next: NextFunction) {
  const token = req.cookies?.[env.cookieName] as string | undefined;
  if (!token) return next();
  try {
    const payload = verifyAccessToken(token);
    req.userId = new mongoose.Types.ObjectId(payload.sub);
  } catch {
    /* ignore */
  }
  next();
}
