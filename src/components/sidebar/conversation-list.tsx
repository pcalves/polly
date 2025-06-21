"use client";

import { ConversationListClient } from "./conversation-list-client";
import { ConversationId } from "@/types";

interface ConversationListProps {
  searchQuery: string;
  currentConversationId?: ConversationId;
}

export function ConversationList({
  searchQuery,
  currentConversationId,
}: ConversationListProps) {
  return (
    <ConversationListClient
      searchQuery={searchQuery}
      currentConversationId={currentConversationId}
    />
  );
}
