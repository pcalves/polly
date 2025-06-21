"use client";

import { usePreloadedQuery } from "convex/react";
import { ConversationListContent } from "./conversation-list-content";
import { ConversationId } from "@/types";
import { Preloaded } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useUser } from "@/hooks/use-user";
import { useEffect } from "react";
import { setCachedConversations } from "@/lib/conversation-cache";

interface ConversationListProps {
  searchQuery: string;
  currentConversationId?: ConversationId;
  preloadedConversations: Preloaded<typeof api.conversations.list>;
}

export function ConversationList({
  searchQuery,
  currentConversationId,
  preloadedConversations,
}: ConversationListProps) {
  const conversations = usePreloadedQuery(preloadedConversations);
  const { user } = useUser();

  // Cache conversations to localStorage when they update
  useEffect(() => {
    if (conversations && user?._id) {
      console.log(
        "ConversationList: Caching conversations for user:",
        user._id,
        conversations.length
      );
      setCachedConversations(user._id, conversations);
    }
  }, [conversations, user?._id]);

  return (
    <ConversationListContent
      conversations={conversations}
      searchQuery={searchQuery}
      currentConversationId={currentConversationId}
    />
  );
}
