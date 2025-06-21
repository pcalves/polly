import { Doc } from "../../convex/_generated/dataModel";

// Shared localStorage helpers for conversation caching
export const getCachedConversations = (
  userId: string
): Doc<"conversations">[] | null => {
  if (typeof window === "undefined") return null;
  try {
    const cacheKey = `conversations-${userId}`;
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      const { data, timestamp } = JSON.parse(cached);
      // Cache expires after 5 minutes
      const isExpired = Date.now() - timestamp > 5 * 60 * 1000;

      console.log(`[ConversationCache] Getting cache for user ${userId}:`, {
        found: true,
        expired: isExpired,
        itemCount: data?.length || 0,
        ageMinutes: Math.floor((Date.now() - timestamp) / (1000 * 60)),
      });

      if (!isExpired) {
        return data;
      } else {
        console.log(
          `[ConversationCache] Cache expired, removing for user ${userId}`
        );
        localStorage.removeItem(cacheKey);
      }
    } else {
      console.log(`[ConversationCache] No cache found for user ${userId}`);
    }
  } catch (error) {
    console.warn("Failed to get cached conversations:", error);
  }
  return null;
};

export const setCachedConversations = (
  userId: string,
  conversations: Doc<"conversations">[]
) => {
  if (typeof window === "undefined") return;
  try {
    const cacheKey = `conversations-${userId}`;
    const cacheData = {
      data: conversations,
      timestamp: Date.now(),
    };

    localStorage.setItem(cacheKey, JSON.stringify(cacheData));

    console.log(
      `[ConversationCache] Cached ${conversations.length} conversations for user ${userId}`
    );
  } catch (error) {
    console.warn("Failed to cache conversations:", error);
  }
};

export const clearConversationCache = (userId: string) => {
  if (typeof window === "undefined") return;
  try {
    const cacheKey = `conversations-${userId}`;
    localStorage.removeItem(cacheKey);
    console.log(`[ConversationCache] Cleared cache for user ${userId}`);
  } catch (error) {
    console.warn("Failed to clear conversation cache:", error);
  }
};
