"use client";

import { useQuery as useConvexQuery } from "convex/react";
import { useQuery } from "@tanstack/react-query";
import { ConversationListContent } from "./conversation-list-content";
import { useUser } from "@/hooks/use-user";
import { ConversationId } from "@/types";
import { api } from "../../../convex/_generated/api";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import {
  getCachedConversations,
  setCachedConversations,
} from "@/lib/conversation-cache";

interface ConversationListClientProps {
  searchQuery: string;
  currentConversationId?: ConversationId;
}

export function ConversationListClient({
  searchQuery,
  currentConversationId,
}: ConversationListClientProps) {
  const { user, isLoading: userLoading } = useUser();
  const queryClient = useQueryClient();

  // Use TanStack Query for caching and persistence
  const { data: conversations, isLoading } = useQuery({
    queryKey: ["conversations", user?._id],
    queryFn: async () => {
      // Try to get from localStorage first for immediate display
      if (user?._id) {
        const cached = getCachedConversations(user._id);
        if (cached) {
          return cached;
        }
      }
      return null;
    },
    enabled: !!user?._id,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  // Use Convex query and sync with TanStack Query
  const convexConversations = useConvexQuery(
    api.conversations.list,
    user?._id ? { userId: user._id } : "skip"
  );

  // Sync Convex data with TanStack Query cache and localStorage
  useEffect(() => {
    if (convexConversations && user?._id) {
      console.log(
        "ConversationListClient: Syncing conversations for user:",
        user._id,
        convexConversations.length
      );
      // Update TanStack Query cache
      queryClient.setQueryData(
        ["conversations", user._id],
        convexConversations
      );
      // Update localStorage cache
      setCachedConversations(user._id, convexConversations);
    }
  }, [convexConversations, user?._id, queryClient]);

  // Use cached data if available, otherwise fall back to Convex data
  const finalConversations = conversations || convexConversations;
  const finalIsLoading =
    (userLoading || (isLoading && !conversations)) &&
    (!finalConversations || finalConversations.length === 0);

  return (
    <ConversationListContent
      conversations={finalConversations}
      searchQuery={searchQuery}
      currentConversationId={currentConversationId}
      isLoading={finalIsLoading}
      loadingMessage="Loading conversations..."
    />
  );
}
