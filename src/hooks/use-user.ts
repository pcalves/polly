"use client";

import { useMemo, useState, useCallback, useEffect } from "react";
import { useQuery, useAction, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { User, UserId } from "@/types";
import {
  getAnonymousUserIdFromCookie,
  setAnonymousUserIdCookie,
} from "@/lib/cookies";
import { usePreloadedQuery, Preloaded } from "convex/react";

const ANONYMOUS_USER_ID_KEY = "anonymous-user-id";
// Keep in sync with server-side ANONYMOUS_MESSAGE_LIMIT in convex/users.ts
const ANONYMOUS_MESSAGE_LIMIT = 10;

interface UseUserReturn {
  user: User | null;
  messageCount: number;
  remainingMessages: number;
  isAnonymous: boolean;
  hasMessageLimit: boolean;
  canSendMessage: boolean;
  isLoading: boolean;
  // New fields for authenticated users
  monthlyUsage?: {
    monthlyMessagesSent: number;
    monthlyLimit: number;
    remainingMessages: number;
    resetDate: number;
    needsReset: boolean;
  };
  hasUserApiKeys?: boolean;
}

// Helper function to compute user properties consistently
function computeUserProperties(
  user: User | null,
  messageCount: number | undefined,
  monthlyUsage:
    | {
        monthlyMessagesSent: number;
        monthlyLimit: number;
        remainingMessages: number;
        resetDate: number;
        needsReset: boolean;
      }
    | null
    | undefined,
  hasUserApiKeys: boolean | undefined,
  isLoading: boolean
): Omit<UseUserReturn, "user"> {
  const isAnonymous = user?.isAnonymous ?? true;

  if (isAnonymous) {
    // Anonymous users: use existing logic
    const actualMessageCount = messageCount ?? 0;
    const remainingMessages = Math.max(
      0,
      ANONYMOUS_MESSAGE_LIMIT - actualMessageCount
    );
    const hasMessageLimit = true;
    const canSendMessage = actualMessageCount < ANONYMOUS_MESSAGE_LIMIT;

    return {
      messageCount: actualMessageCount,
      remainingMessages,
      isAnonymous,
      hasMessageLimit,
      canSendMessage,
      isLoading,
    };
  } else {
    // Authenticated users: use monthly limits
    const monthlyMessagesSent = monthlyUsage?.monthlyMessagesSent ?? 0;
    const monthlyLimit = monthlyUsage?.monthlyLimit ?? 100;
    const monthlyRemaining = Math.max(0, monthlyLimit - monthlyMessagesSent);

    // Can send message if under monthly limit OR has BYOK models available
    const canSendMessage = monthlyRemaining > 0 || (hasUserApiKeys ?? false);

    return {
      messageCount: 0, // Not relevant for authenticated users
      remainingMessages: monthlyRemaining,
      isAnonymous,
      hasMessageLimit: true, // Authenticated users have monthly limits
      canSendMessage,
      isLoading,
      monthlyUsage: monthlyUsage || undefined,
      hasUserApiKeys,
    };
  }
}

// Get stored anonymous user ID from cookies first, then migrate from localStorage
function getStoredAnonymousUserId(): UserId | null {
  if (typeof window === "undefined") return null;

  // First try cookies (new approach)
  let userId = getAnonymousUserIdFromCookie();

  // If not in cookies, try localStorage (old approach) and migrate
  if (!userId) {
    userId = localStorage.getItem(ANONYMOUS_USER_ID_KEY) as UserId | null;
    if (userId) {
      // Migrate to cookie
      setAnonymousUserIdCookie(userId);
      localStorage.removeItem(ANONYMOUS_USER_ID_KEY);
    }
  }

  return userId;
}

// Main unified user hook - works for both authenticated and anonymous users
export function useUser(): UseUserReturn {
  // First try to get authenticated user via Convex Auth
  const authenticatedUser = useQuery(api.users.getCurrentUser);

  // Get anonymous user ID from storage for fallback
  const [storedAnonymousUserId, setStoredAnonymousUserId] =
    useState<UserId | null>(() => {
      if (typeof window === "undefined") return null;
      return getStoredAnonymousUserId();
    });

  // Listen for graduation completion event and clear anonymous user state
  useEffect(() => {
    const handleGraduationComplete = () => {
      console.log(
        "[UseUser] Graduation completed, clearing anonymous user state"
      );
      setStoredAnonymousUserId(null);
    };

    if (typeof window !== "undefined") {
      window.addEventListener("user-graduated", handleGraduationComplete);
      return () => {
        window.removeEventListener("user-graduated", handleGraduationComplete);
      };
    }
  }, []);

  // Query anonymous user data if no authenticated user and we have a stored ID
  const anonymousUser = useQuery(
    api.users.getById,
    !authenticatedUser && storedAnonymousUserId
      ? { id: storedAnonymousUserId }
      : "skip"
  );

  // Get message count for the current user
  const currentUserId = authenticatedUser?._id || anonymousUser?._id || null;
  const messageCount = useQuery(
    api.users.getMessageCount,
    currentUserId ? { userId: currentUserId } : "skip"
  );

  // Get monthly usage for authenticated users
  const monthlyUsage = useQuery(
    api.users.getMonthlyUsage,
    authenticatedUser && !authenticatedUser.isAnonymous
      ? { userId: authenticatedUser._id }
      : "skip"
  );

  // Check if user has API keys for BYOK models
  const hasUserApiKeys = useQuery(
    api.users.hasUserApiKeys,
    authenticatedUser && !authenticatedUser.isAnonymous ? {} : "skip"
  );

  // Migration helpers
  const initializeMessagesSent = useMutation(api.users.initializeMessagesSent);
  const initializeMonthlyLimits = useMutation(
    api.users.initializeMonthlyLimits
  );

  // Determine which user to use (authenticated takes priority)
  const currentUser: User | null = useMemo(() => {
    if (authenticatedUser) {
      return authenticatedUser;
    }
    if (anonymousUser && storedAnonymousUserId) {
      return anonymousUser;
    }
    return null;
  }, [authenticatedUser, anonymousUser, storedAnonymousUserId]);

  // Initialize messagesSent field for existing users who don't have it
  useEffect(() => {
    if (currentUser && currentUser.messagesSent === undefined) {
      initializeMessagesSent({ userId: currentUser._id });
    }
  }, [currentUser, initializeMessagesSent]);

  // Initialize monthly limits for existing authenticated users
  useEffect(() => {
    if (currentUser && !currentUser.isAnonymous) {
      initializeMonthlyLimits({ userId: currentUser._id });
    }
  }, [currentUser, initializeMonthlyLimits]);

  // Determine loading state - we're loading if:
  // 1. We have no authenticated user yet and the query is still pending (undefined)
  // 2. We have an anonymous user ID but no anonymous user data yet
  const isLoading = useMemo(() => {
    // If authenticated user query is still pending
    if (authenticatedUser === undefined) {
      return true;
    }

    // If we have no authenticated user but have a stored anonymous ID and that query is still pending
    if (
      !authenticatedUser &&
      storedAnonymousUserId &&
      anonymousUser === undefined
    ) {
      return true;
    }

    return false;
  }, [authenticatedUser, anonymousUser, storedAnonymousUserId]);

  const userProperties = computeUserProperties(
    currentUser,
    messageCount,
    monthlyUsage,
    hasUserApiKeys,
    isLoading
  );

  return {
    user: currentUser,
    ...userProperties,
  };
}

export function usePreloadedUser(
  preloadedUser: Preloaded<typeof api.users.getById>,
  preloadedMessageCount: Preloaded<typeof api.users.getMessageCount>,
  preloadedMonthlyUsage: Preloaded<typeof api.users.getMonthlyUsage>,
  preloadedHasUserApiKeys: Preloaded<typeof api.users.hasUserApiKeys>
): UseUserReturn {
  const user = usePreloadedQuery(preloadedUser);
  const messageCount = usePreloadedQuery(preloadedMessageCount);
  const monthlyUsage = usePreloadedQuery(preloadedMonthlyUsage);
  const hasUserApiKeys = usePreloadedQuery(preloadedHasUserApiKeys);

  // Migration helper for existing users
  const initializeMessagesSent = useMutation(api.users.initializeMessagesSent);

  // Initialize messagesSent field for existing users who don't have it
  useEffect(() => {
    if (user && user.messagesSent === undefined) {
      initializeMessagesSent({ userId: user._id });
    }
  }, [user, initializeMessagesSent]);

  const userProperties = computeUserProperties(
    user,
    messageCount,
    monthlyUsage,
    hasUserApiKeys,
    false
  );

  return {
    user,
    ...userProperties,
  };
}

// Helper function to store anonymous user ID
export function storeAnonymousUserId(userId: UserId) {
  if (typeof window !== "undefined") {
    setAnonymousUserIdCookie(userId);
  }
}

// Hook for ensuring a user exists (creates anonymous user if needed and not authenticated)
export function useEnsureUser() {
  const getOrCreateUser = useAction(api.conversations.getOrCreateUser);
  const [isEnsuring, setIsEnsuring] = useState(false);
  const { user } = useUser();

  const ensureUser = useCallback(
    async (existingUserId?: UserId) => {
      // If we already have an authenticated user, return their ID
      if (user && !user.isAnonymous) {
        return user._id;
      }

      setIsEnsuring(true);
      try {
        const result = await getOrCreateUser({
          userId: existingUserId || user?._id,
        });

        // If a new anonymous user was created, store it
        if (result.isNewUser) {
          storeAnonymousUserId(result.userId);
        }

        return result.userId;
      } finally {
        setIsEnsuring(false);
      }
    },
    [getOrCreateUser, user]
  );

  return { ensureUser, isEnsuring };
}
