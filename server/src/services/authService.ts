import bcrypt from "bcryptjs";
import { env, hasSmtp } from "../config/env.js";
import { User } from "../models/User.js";
import { HttpError } from "../utils/httpError.js";
import { serializeUser } from "../utils/publicUser.js";
import { createResetToken, hashResetToken, signAccessToken } from "../utils/tokens.js";
import { sendPasswordResetEmail } from "./mailService.js";

export async function registerUser(input: {
  name: string;
  username: string;
  email: string;
  password: string;
}) {
  const existingEmail = await User.findOne({ email: input.email });
  if (existingEmail) throw new HttpError(409, "Email is already registered");
  const existingUsername = await User.findOne({ username: input.username });
  if (existingUsername) throw new HttpError(409, "Username is already taken");

  const passwordHash = await bcrypt.hash(input.password, 12);
  const user = await User.create({
    name: input.name,
    username: input.username,
    email: input.email,
    passwordHash,
  });
  const token = signAccessToken(user.id, false);
  return { user: serializeUser(user, { id: user._id, contacts: [] }), token };
}

export async function loginUser(identifier: string, password: string, remember: boolean) {
  const query = identifier.includes("@")
    ? { email: identifier.toLowerCase() }
    : { username: identifier.toLowerCase() };
  const user = await User.findOne(query).select("+passwordHash");
  if (!user) throw new HttpError(401, "Invalid credentials");
  const match = await bcrypt.compare(password, user.passwordHash);
  if (!match) throw new HttpError(401, "Invalid credentials");
  const token = signAccessToken(user.id, remember);
  return { user: serializeUser(user, { id: user._id, contacts: user.contacts }), token };
}

export async function requestPasswordReset(email: string) {
  const user = await User.findOne({ email });
  if (!user) return { queued: true, emailConfigured: hasSmtp };
  const { raw, hash } = createResetToken();
  user.passwordResetToken = hash;
  user.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000);
  await user.save();
  const resetUrl = `${env.clientUrl}/reset-password?token=${raw}`;
  const mail = await sendPasswordResetEmail(user.email, resetUrl);
  return { queued: true, emailConfigured: mail.sent, hint: mail.sent ? undefined : mail.reason };
}

export async function resetPassword(token: string, password: string) {
  const hash = hashResetToken(token);
  const user = await User.findOne({
    passwordResetToken: hash,
    passwordResetExpires: { $gt: new Date() },
  }).select("+passwordResetToken +passwordResetExpires +passwordHash");
  if (!user) throw new HttpError(400, "Reset link is invalid or expired");
  user.passwordHash = await bcrypt.hash(password, 12);
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();
}
