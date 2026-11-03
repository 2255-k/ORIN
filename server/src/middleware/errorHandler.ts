import type { NextFunction, Request, Response } from "express";
import mongoose from "mongoose";
import { ZodError } from "zod";
import { HttpError } from "../utils/httpError.js";

export function notFound(_req: Request, res: Response) {
  res.status(404).json({ success: false, message: "Route not found", details: null });
}

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof HttpError) {
    return res.status(err.status).json({ success: false, message: err.message, details: err.details ?? null });
  }
  if (err instanceof ZodError) {
    return res.status(422).json({
      success: false,
      message: "Validation failed",
      details: err.issues.map((i) => ({ path: i.path.join("."), message: i.message })),
    });
  }
  if (err instanceof mongoose.Error.ValidationError) {
    return res.status(422).json({ success: false, message: err.message, details: err.errors });
  }
  const dup = err as { code?: number; keyValue?: Record<string, unknown> };
  if (dup.code === 11000) {
    const field = Object.keys(dup.keyValue ?? {})[0] ?? "field";
    return res.status(409).json({ success: false, message: `${field} is already taken`, details: dup.keyValue });
  }
  console.error(err);
  return res.status(500).json({ success: false, message: "Internal server error", details: null });
}
