"use client";

import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { ConversationId, UserId } from "@/types";
import { getConversationTitle } from "@/lib/utils";

export function useConversations(userId?: UserId) {
  const conversations = useQuery(
    api.conversations.list,
    userId ? { userId } : "skip"
  );
  
  const createConversation = useMutation(api.conversations.create);
  const updateConversation = useMutation(api.conversations.update);
  const deleteConversation = useMutation(api.conversations.remove);
  const shareConversation = useMutation(api.conversations.share);

  const createNewConversation = async (firstMessage: string) => {
    if (!userId) return null;
    
    const title = getConversationTitle(firstMessage);
    return await createConversation({
      title,
      userId,
    });
  };

  const updateConversationTitle = async (id: ConversationId, title: string) => {
    return await updateConversation({ id, title });
  };

  const deleteConversationById = async (id: ConversationId) => {
    return await deleteConversation({ id });
  };

  const shareConversationById = async (id: ConversationId, shareId: string) => {
    return await shareConversation({ id, shareId });
  };

  return {
    conversations: conversations || [],
    createNewConversation,
    updateConversationTitle,
    deleteConversationById,
    shareConversationById,
    isLoading: conversations === undefined,
  };
}