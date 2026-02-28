"use client";

import Cookies from "js-cookie";

const TOKEN_COOKIE = "bi_access_token";
const ROLE_COOKIE = "bi_user_role";
const TENANT_COOKIE = "bi_tenant_id";

export function setAuthCookies(
  token: string,
  role: string,
  tenantId: string
): void {
  const cookieOptions = {
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    expires: 0.33, // 8 hours (480 min / 1440 min/day)
    path: "/",
  };
  Cookies.set(TOKEN_COOKIE, token, cookieOptions);
  Cookies.set(ROLE_COOKIE, role, cookieOptions);
  Cookies.set(TENANT_COOKIE, tenantId, cookieOptions);
}

export function getAuthToken(): string | undefined {
  return Cookies.get(TOKEN_COOKIE);
}

export function getUserRole(): string | undefined {
  return Cookies.get(ROLE_COOKIE);
}

export function clearAuthCookies(): void {
  Cookies.remove(TOKEN_COOKIE, { path: "/" });
  Cookies.remove(ROLE_COOKIE, { path: "/" });
  Cookies.remove(TENANT_COOKIE, { path: "/" });
}

export function isAuthenticated(): boolean {
  return !!Cookies.get(TOKEN_COOKIE);
}
