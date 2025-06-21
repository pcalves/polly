import { useMemo } from "react";
import { Conversation } from "@/types";

export function useConversationSearch(
  conversations: Conversation[],
  searchQuery: string
) {
  const filteredConversations = useMemo(() => {
    if (!searchQuery.trim()) return conversations;

    const query = searchQuery.toLowerCase().trim();
    return conversations.filter(conversation => {
      // Search in title
      const titleMatch = conversation.title.toLowerCase().includes(query);

      // Future: could search in conversation content if available
      // For now, just search titles but with better tokenization
      const titleWords = conversation.title.toLowerCase().split(/\s+/);
      const queryWords = query.split(/\s+/);
      const wordMatch = queryWords.some(qWord =>
        titleWords.some(tWord => tWord.includes(qWord))
      );

      return titleMatch || wordMatch;
    });
  }, [conversations, searchQuery]);

  return filteredConversations;
}
