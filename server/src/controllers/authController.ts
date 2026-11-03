import type { Request, Response } from "express";
import { User } from "../models/User.js";
import { loginUser, registerUser, requestPasswordReset, resetPassword } from "../services/authService.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { clearAuthCookie, setAuthCookie } from "../utils/cookies.js";
import { HttpError } from "../utils/httpError.js";
import { ok } from "../utils/apiResponse.js";
import { serializeUser } from "../utils/publicUser.js";

export const register = asyncHandler(async (req: Request, res: Response) => {
  const { name, username, email, password } = req.body;
  const { user, token } = await registerUser({ name, username, email, password });
  setAuthCookie(res, token, false);
  return ok(res, { user }, "Account created", 201);
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { identifier, password, remember } = req.body;
  const { user, token } = await loginUser(identifier, password, Boolean(remember));
  setAuthCookie(res, token, Boolean(remember));
  return ok(res, { user }, "Logged in");
});

export const logout = asyncHandler(async (_req: Request, res: Response) => {
  clearAuthCookie(res);
  return ok(res, null, "Logged out");
});

export const me = asyncHandler(async (req: Request, res: Response) => {
  const user = await User.findById(req.userId);
  if (!user) throw new HttpError(401, "Session expired");
  return ok(res, { user: serializeUser(user, { id: user._id, contacts: user.contacts }) });
});

export const forgotPassword = asyncHandler(async (req: Request, res: Response) => {
  const result = await requestPasswordReset(req.body.email);
  return ok(
    res,
    result,
    result.emailConfigured
      ? "If that email exists, a reset link has been sent."
      : "If that email exists, a reset link was generated. Configure SMTP to send email, or check the server log in development.",
  );
});

export const resetPasswordHandler = asyncHandler(async (req: Request, res: Response) => {
  await resetPassword(req.body.token, req.body.password);
  return ok(res, null, "Password updated. You can sign in now.");
});
