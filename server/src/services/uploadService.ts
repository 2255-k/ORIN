import { v2 as cloudinary } from "cloudinary";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { env, hasCloudinary } from "../config/env.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const localUploadDir = path.resolve(__dirname, "../../uploads");

if (hasCloudinary) {
  cloudinary.config({
    cloud_name: env.cloudinary.cloudName,
    api_key: env.cloudinary.apiKey,
    api_secret: env.cloudinary.apiSecret,
  });
}

export async function persistUpload(file: Express.Multer.File, folder = "orin") {
  if (hasCloudinary) {
    const result = await cloudinary.uploader.upload(file.path, {
      folder,
      resource_type: "auto",
    });
    await fs.unlink(file.path).catch(() => undefined);
    return {
      url: result.secure_url,
      publicId: result.public_id,
      filename: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
    };
  }

  await fs.mkdir(localUploadDir, { recursive: true });
  const name = path.basename(file.path);
  return {
    url: `/uploads/${name}`,
    publicId: name,
    filename: file.originalname,
    mimeType: file.mimetype,
    size: file.size,
  };
}

export async function destroyUpload(publicId?: string) {
  if (!publicId) return;
  if (hasCloudinary) {
    await cloudinary.uploader.destroy(publicId).catch(() => undefined);
    return;
  }
  await fs.unlink(path.join(localUploadDir, publicId)).catch(() => undefined);
}
