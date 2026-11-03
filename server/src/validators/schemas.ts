import { z } from "zod";

export const registerSchema = z
  .object({
    name: z.string().trim().min(2).max(80),
    username: z
      .string()
      .trim()
      .toLowerCase()
      .min(3)
      .max(24)
      .regex(/^[a-z0-9._]+$/, "Username may only contain letters, numbers, dots, and underscores"),
    email: z.string().trim().toLowerCase().email(),
    password: z.string().min(8, "Password must be at least 8 characters").max(72),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const loginSchema = z.object({
  identifier: z.string().trim().min(1),
  password: z.string().min(1),
  remember: z.boolean().optional(),
});

export const forgotSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
});

export const resetSchema = z
  .object({
    token: z.string().min(10),
    password: z.string().min(8).max(72),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const profileSchema = z.object({
  name: z.string().trim().min(2).max(80).optional(),
  username: z
    .string()
    .trim()
    .toLowerCase()
    .min(3)
    .max(24)
    .regex(/^[a-z0-9._]+$/)
    .optional(),
  bio: z.string().max(180).optional(),
});

export const passwordSchema = z
  .object({
    currentPassword: z.string().min(1),
    password: z.string().min(8).max(72),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const settingsSchema = z.object({
  privacy: z
    .object({
      lastSeen: z.enum(["everyone", "contacts", "nobody"]).optional(),
      profilePhoto: z.enum(["everyone", "contacts", "nobody"]).optional(),
      readReceipts: z.boolean().optional(),
    })
    .optional(),
  notifications: z
    .object({
      messageSound: z.boolean().optional(),
      desktop: z.boolean().optional(),
      inApp: z.boolean().optional(),
    })
    .optional(),
});

export const createDirectSchema = z.object({
  userId: z.string().min(1),
});

export const createGroupSchema = z.object({
  name: z.string().trim().min(2).max(80),
  description: z.string().max(240).optional().default(""),
  memberIds: z.array(z.string()).min(1),
});

export const sendMessageSchema = z.object({
  conversationId: z.string().min(1),
  text: z.string().max(4000).optional().default(""),
  type: z.enum(["text", "image", "file"]).optional().default("text"),
  attachment: z
    .object({
      url: z.string(),
      publicId: z.string().optional(),
      filename: z.string(),
      mimeType: z.string(),
      size: z.number(),
    })
    .optional(),
  replyTo: z.string().optional(),
  clientId: z.string().optional(),
});

export const editMessageSchema = z.object({
  text: z.string().trim().min(1).max(4000),
});

export const reactSchema = z.object({
  emoji: z.string().min(1).max(8),
});
