import { UserId } from "@/types";

const ANONYMOUS_USER_COOKIE = "anonymous-user-id";
const COOKIE_MAX_AGE = 30 * 24 * 60 * 60; // 30 days in seconds

// Client-side: Set anonymous user ID cookie
export function setAnonymousUserIdCookie(userId: UserId) {
  if (typeof window !== "undefined") {
    document.cookie = `${ANONYMOUS_USER_COOKIE}=${userId}; path=/; max-age=${COOKIE_MAX_AGE}; SameSite=Lax`;
  }
}

// Client-side: Get anonymous user ID from cookie
export function getAnonymousUserIdFromCookie(): UserId | null {
  if (typeof window === "undefined") return null;

  const cookies = document.cookie.split(";");
  const cookie = cookies.find(c =>
    c.trim().startsWith(`${ANONYMOUS_USER_COOKIE}=`)
  );
  return cookie ? (cookie.split("=")[1].trim() as UserId) : null;
}

// Client-side: Remove anonymous user ID cookie
export function removeAnonymousUserIdCookie() {
  if (typeof window !== "undefined") {
    document.cookie = `${ANONYMOUS_USER_COOKIE}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
  }
}
