"use client";

import { useCallback } from "react";
import { useAction } from "convex/react";
import { api } from "../../convex/_generated/api";
import { UserId } from "@/types";
import {
  getAnonymousUserIdFromCookie,
  removeAnonymousUserIdCookie,
} from "@/lib/cookies";

export function useUserGraduation() {
  const graduateOnSignIn = useAction(api.userGraduation.graduateOnSignIn);

  const handleUserGraduation = useCallback(async (): Promise<{
    userId: UserId;
    graduated: boolean;
    message: string;
  }> => {
    // Get anonymous user ID from cookies
    const anonymousUserId = getAnonymousUserIdFromCookie();

    try {
      // Call the graduation action
      const result = await graduateOnSignIn({
        anonymousUserId: anonymousUserId || undefined,
      });

      // If graduation was successful, clear the anonymous user cookie
      if (result.graduated) {
        removeAnonymousUserIdCookie();
      }

      return result;
    } catch (error) {
      console.error("User graduation failed:", error);
      throw error;
    }
  }, [graduateOnSignIn]);

  return {
    handleUserGraduation,
  };
}
