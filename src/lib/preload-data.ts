import { preloadQuery } from "convex/nextjs";
import { api } from "../../convex/_generated/api";
import {
  getAnonymousUserId,
  getAuthenticatedUserId,
} from "@/lib/server-cookies";
import { Id } from "../../convex/_generated/dataModel";

export interface PreloadedData {
  conversations: Awaited<
    ReturnType<typeof preloadQuery<typeof api.conversations.list>>
  >;
  userModels: Awaited<
    ReturnType<typeof preloadQuery<typeof api.userModels.hasUserModels>>
  >;
  selectedModel: Awaited<
    ReturnType<typeof preloadQuery<typeof api.userModels.getUserSelectedModel>>
  >;
  apiKeys: Awaited<
    ReturnType<typeof preloadQuery<typeof api.apiKeys.hasAnyApiKey>>
  >;
  user:
    | Awaited<ReturnType<typeof preloadQuery<typeof api.users.getCurrentUser>>>
    | Awaited<ReturnType<typeof preloadQuery<typeof api.users.getById>>>
    | null;
  messageCount: Awaited<
    ReturnType<typeof preloadQuery<typeof api.users.getMessageCount>>
  > | null;
}

/**
 * Centralized preloading for all user and conversation data
 * Eliminates duplication between home page and chat layout
 *
 * Now supports both authenticated and anonymous users with reliable SSR:
 * - Authenticated users: Uses cookie-based session token lookup (reliable)
 * - Anonymous users: Uses cookie-based user ID lookup (already reliable)
 */
export async function preloadUserData(): Promise<PreloadedData> {
  console.log("[PreloadData] Starting user data preloading...");

  // First try to get authenticated user via session token from cookies
  // This is much more reliable than convexAuthNextjsToken()
  let authenticatedUserId: Id<"users"> | null = null;
  let authenticatedUserQuery: Awaited<
    ReturnType<typeof preloadQuery<typeof api.users.getById>>
  > | null = null;

  try {
    authenticatedUserId = await getAuthenticatedUserId();
    if (authenticatedUserId) {
      console.log(
        `[PreloadData] Found authenticated user: ${authenticatedUserId}`
      );
      authenticatedUserQuery = await preloadQuery(api.users.getById, {
        id: authenticatedUserId,
      });
    }
  } catch (authError) {
    console.warn("[PreloadData] Failed to get authenticated user:", authError);
  }

  // If no authenticated user, try anonymous user via cookies
  let anonymousUserId: string | null = null;
  let anonymousUserQuery: Awaited<
    ReturnType<typeof preloadQuery<typeof api.users.getById>>
  > | null = null;

  if (!authenticatedUserId) {
    try {
      anonymousUserId = await getAnonymousUserId();
      if (anonymousUserId) {
        console.log(`[PreloadData] Found anonymous user: ${anonymousUserId}`);
        anonymousUserQuery = await preloadQuery(api.users.getById, {
          id: anonymousUserId as Id<"users">,
        });
      }
    } catch (anonError) {
      console.warn("[PreloadData] Failed to get anonymous user ID:", anonError);
    }
  }

  // Determine which user ID to use for other queries
  const currentUserId =
    authenticatedUserId || (anonymousUserId as Id<"users"> | null);
  const userQuery = authenticatedUserQuery || anonymousUserQuery;

  console.log(`[PreloadData] Using user ID for queries: ${currentUserId}`);

  // Preload conversations with user ID if available
  const conversations = await preloadQuery(
    api.conversations.list,
    currentUserId ? { userId: currentUserId } : {}
  );

  // Preload user data for chat input to eliminate loading states
  const userModels = await preloadQuery(api.userModels.hasUserModels, {});
  const selectedModel = await preloadQuery(
    api.userModels.getUserSelectedModel,
    {}
  );
  const apiKeys = await preloadQuery(api.apiKeys.hasAnyApiKey, {});

  // Preload message count if we have a user
  let messageCount: Awaited<
    ReturnType<typeof preloadQuery<typeof api.users.getMessageCount>>
  > | null = null;
  if (currentUserId) {
    try {
      messageCount = await preloadQuery(api.users.getMessageCount, {
        userId: currentUserId,
      });
    } catch (messageCountError) {
      console.warn(
        "[PreloadData] Failed to preload message count:",
        messageCountError
      );
      messageCount = null;
    }
  }

  console.log("[PreloadData] Preloading complete");

  return {
    conversations,
    userModels,
    selectedModel,
    apiKeys,
    user: userQuery,
    messageCount,
  };
}
