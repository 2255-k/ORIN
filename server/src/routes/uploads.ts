import { Router } from "express";
import type { Request, Response } from "express";
import { requireAuth } from "../middleware/auth.js";
import { upload } from "../middleware/upload.js";
import { persistUpload } from "../services/uploadService.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { HttpError } from "../utils/httpError.js";
import { ok } from "../utils/apiResponse.js";

export const uploadsRouter = Router();
uploadsRouter.use(requireAuth);
uploadsRouter.post(
  "/",
  upload.single("file"),
  asyncHandler(async (req: Request, res: Response) => {
    if (!req.file) throw new HttpError(400, "No file uploaded");
    const file = await persistUpload(req.file, "orin/uploads");
    return ok(res, { file }, "Uploaded", 201);
  }),
);
