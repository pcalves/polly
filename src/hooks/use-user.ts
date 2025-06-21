"use client";

import { useAuthActions } from "@convex-dev/auth/react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useEffect } from "react";

export function useUser() {
  const { signIn } = useAuthActions();
  const user = useQuery(api.users.current);
  const getMessageCount = useQuery(
    api.users.getMessageCount,
    user ? { userId: user._id } : "skip"
  );

  useEffect(() => {
    // Auto-create anonymous user if not authenticated
    if (user === null) {
      signIn("anonymous");
    }
  }, [user, signIn]);

  const messageCount = getMessageCount || 0;
  const remainingMessages = Math.max(0, 10 - messageCount); // 10 message limit for anonymous users

  return {
    user,
    messageCount,
    remainingMessages,
    isAnonymous: user?.isAnonymous ?? true,
    hasMessageLimit: user?.isAnonymous ?? true,
    canSendMessage: !user?.isAnonymous || remainingMessages > 0,
    isLoading: user === undefined,
  };
}