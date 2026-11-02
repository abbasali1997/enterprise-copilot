import type { CookieOptions, Request, Response } from "express";
import { ACCESS_TOKEN_TTL_SECONDS } from "@enterprise/auth";

export const AUTH_COOKIE_NAME = "access_token";
const cookieOptions = (): CookieOptions => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict",
  path: "/",
});

export function setAuthCookie(res: Response, token: string) {
  res.cookie(AUTH_COOKIE_NAME, token, {
    ...cookieOptions(),
    maxAge: ACCESS_TOKEN_TTL_SECONDS * 1000,
  });
}

export function clearAuthCookie(res: Response) {
  res.clearCookie(AUTH_COOKIE_NAME, cookieOptions());
}

export function readAuthCookie(req: Request): string | undefined {
  console.log(req.headers);

  const cookie = req.headers.cookie
    ?.split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(AUTH_COOKIE_NAME + "="));
  if (!cookie) return undefined;
  try {
    return decodeURIComponent(cookie.slice(AUTH_COOKIE_NAME.length + 1));
  } catch {
    return undefined;
  }
}

export function authenticateResponse<T extends { accessToken: string }>(
  res: Response,
  result: T,
): Omit<T, "accessToken"> {
  const { accessToken, ...response } = result;
  setAuthCookie(res, accessToken);
  return response;
}
