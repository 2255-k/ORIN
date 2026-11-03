import type { CookieOptions, Response } from "express";
import { env, isProd } from "../config/env.js";

export function authCookieOptions(maxAgeMs: number): CookieOptions {
  return {
    httpOnly: true,
    secure: env.cookieSecure || isProd,
    sameSite: env.cookieSameSite,
    maxAge: maxAgeMs,
    path: "/",
  };
}

export function setAuthCookie(res: Response, token: string, remember: boolean) {
  const days = remember ? 30 : 1;
  res.cookie(env.cookieName, token, authCookieOptions(days * 24 * 60 * 60 * 1000));
}

export function clearAuthCookie(res: Response) {
  res.clearCookie(env.cookieName, {
    httpOnly: true,
    secure: env.cookieSecure || isProd,
    sameSite: env.cookieSameSite,
    path: "/",
  });
}
