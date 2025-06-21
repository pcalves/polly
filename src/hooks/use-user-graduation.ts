"use client";

import { useCallback } from "react";
import { useAction } from "convex/react";
import { useQueryClient } from "@tanstack/react-query";
import { api } from "../../convex/_generated/api";
import { UserId } from "@/types";
import {
  getAnonymousUserIdFromCookie,
  removeAnonymousUserIdCookie,
} from "@/lib/cookies";

const ANONYMOUS_USER_ID_KEY = "anonymous-user-id";

export function useUserGraduation() {
  const graduateOnSignIn = useAction(api.userGraduation.graduateOnSignIn);
  const queryClient = useQueryClient();

  const handleUserGraduation = useCallback(async (): Promise<{
    userId: UserId;
    graduated: boolean;
    message: string;
  }> => {
    const anonymousUserId = getAnonymousUserIdFromCookie();

    try {
      const result = await graduateOnSignIn({
        anonymousUserId: anonymousUserId || undefined,
      });

      console.log("[UserGraduation] User graduation completed", {
        userId: result.userId,
        graduated: result.graduated,
        message: result.message,
      });

      if (result.graduated) {
        // Clear both cookie and localStorage
        removeAnonymousUserIdCookie();
        if (typeof window !== "undefined") {
          localStorage.removeItem(ANONYMOUS_USER_ID_KEY);
        }

        // Dispatch custom event to notify other components (like useUser hook)
        if (typeof window !== "undefined") {
          window.dispatchEvent(
            new CustomEvent("user-graduated", {
              detail: { userId: result.userId },
            })
          );
        }

        console.log(
          "[UserGraduation] Removed anonymous user cookie and localStorage after successful graduation"
        );
      }

      // Clear all caches
      queryClient.clear();

      // Refetch user queries to get the updated authenticated user data
      setTimeout(() => {
        queryClient.refetchQueries({
          predicate: query => {
            const key = query.queryKey;
            return (
              Array.isArray(key) &&
              key.some(
                k =>
                  typeof k === "string" &&
                  (k.includes("getCurrentUser") || k.includes("conversations"))
              )
            );
          },
        });
      }, 100);

      return result;
    } catch (error) {
      console.error("User graduation failed:", error);

      console.log(
        "[UserGraduation] Clearing caches despite graduation failure"
      );
      queryClient.clear();

      throw error;
    }
  }, [graduateOnSignIn, queryClient]);

  return {
    handleUserGraduation,
  };
}
