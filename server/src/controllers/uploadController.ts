import type { Request, Response } from "express";
import { persistUpload } from "../services/uploadService.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { HttpError } from "../utils/httpError.js";
import { ok } from "../utils/apiResponse.js";

export const uploadFile = asyncHandler(async (req: Request, res: Response) => {
  if (!req.file) throw new HttpError(400, "No file uploaded");
  const stored = await persistUpload(req.file, "orin/attachments");
  return ok(res, { attachment: stored }, "Uploaded", 201);
});
