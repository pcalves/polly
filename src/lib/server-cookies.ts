import { cookies } from "next/headers";
import { UserId } from "@/types";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";

const ANONYMOUS_USER_COOKIE = "anonymous-user-id";

// Server-side: Get anonymous user ID from cookies
export async function getAnonymousUserId(): Promise<UserId | null> {
  const cookieStore = await cookies();
  return cookieStore.get(ANONYMOUS_USER_COOKIE)?.value as UserId | null;
}

// Server-side: Get Convex Auth session token from cookies
// This is the key to making SSR reliable for authenticated users
export async function getConvexAuthSessionToken(): Promise<string | null> {
  try {
    const cookieStore = await cookies();

    // Convex Auth stores session tokens in cookies
    // The exact cookie name may vary, but it's typically something like:
    // - "convex-auth.session-token"
    // - "authjs.session-token"
    // - or similar pattern

    // Try common Convex Auth cookie patterns
    const possibleCookieNames = [
      "convex-auth.session-token",
      "authjs.session-token",
      "next-auth.session-token",
      "auth.session-token",
      "__Host-authjs.session-token", // Secure cookie variant
      "__Secure-authjs.session-token", // Secure cookie variant
    ];

    for (const cookieName of possibleCookieNames) {
      const sessionToken = cookieStore.get(cookieName)?.value;
      if (sessionToken) {
        return sessionToken;
      }
    }

    return null;
  } catch {
    return null;
  }
}

// Server-side: Get authenticated user ID from session token
// This bypasses the unreliable convexAuthNextjsToken() function
export async function getAuthenticatedUserId(): Promise<Id<"users"> | null> {
  try {
    const sessionToken = await getConvexAuthSessionToken();
    if (!sessionToken) {
      return null;
    }

    // Create Convex HTTP client for server-side queries
    const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

    // Query the sessions table directly using the session token
    // This is much more reliable than convexAuthNextjsToken()
    const session = await convex.query(api.sessions.getBySessionToken, {
      sessionToken,
    });

    if (session && session.expires > Date.now()) {
      return session.userId;
    }

    return null;
  } catch {
    return null;
  }
}
