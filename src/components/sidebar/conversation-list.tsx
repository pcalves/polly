"use client";

import { useQuery as useConvexQuery } from "convex/react";
import { ConversationListContent } from "./conversation-list-content";
import { useUser } from "@/hooks/use-user";
import { ConversationId } from "@/types";
import { api } from "../../../convex/_generated/api";

interface ConversationListProps {
  searchQuery: string;
  currentConversationId?: ConversationId;
}

export function ConversationList({
  searchQuery,
  currentConversationId,
}: ConversationListProps) {
  const { user, isLoading: userLoading } = useUser();

  const conversations = useConvexQuery(
    api.conversations.list,
    user?._id ? { userId: user._id } : "skip"
  );

  const isLoading = userLoading || (!!user && conversations === undefined);

  return (
    <ConversationListContent
      conversations={conversations || []}
      searchQuery={searchQuery}
      currentConversationId={currentConversationId}
      isLoading={isLoading}
      loadingMessage="Loading conversations..."
    />
  );
}
