"use client";

import { useCallback, useMemo } from "react";
import { ChatMessage, ConversationId } from "@/types";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { useUser } from "./use-user";

interface UseChatMessagesOptions {
  conversationId?: ConversationId;
  onError?: (error: Error) => void;
}

export function useChatMessages({
  conversationId,
  onError,
}: UseChatMessagesOptions) {
  const { user } = useUser();

  const convexMessages = useQuery(
    api.messages.list,
    conversationId ? { conversationId } : "skip"
  );

  const updateMessageContent = useMutation(api.messages.update);
  const deleteMessagesByIds = useMutation(api.messages.removeMultiple);
  const deleteConversation = useMutation(api.conversations.remove);

  // Convert Convex messages to ChatMessage format
  const messages: ChatMessage[] = useMemo(() => {
    return (
      convexMessages?.map(msg => ({
        id: msg._id,
        role: msg.role,
        content: msg.content,
        reasoning: msg.reasoning,
        model: msg.model,
        provider: msg.provider,
        parentId: msg.parentId,
        isMainBranch: msg.isMainBranch,
        sourceConversationId: msg.sourceConversationId,
        useWebSearch: msg.useWebSearch,
        attachments: msg.attachments,
        citations: msg.citations,
        metadata: msg.metadata,
        createdAt: msg.createdAt,
      })) ?? []
    );
  }, [convexMessages]);

  const deleteMessagesAfter = useCallback(
    async (fromIndex: number) => {
      const messagesToDelete = messages.slice(fromIndex);
      if (messagesToDelete.length > 0) {
        const idsToDelete = messagesToDelete
          .filter(m => m?.id)
          .map(m => m.id as Id<"messages">);
        if (idsToDelete.length > 0) {
          await deleteMessagesByIds({ ids: idsToDelete });
        }
      }
    },
    [messages, deleteMessagesByIds]
  );

  const editMessage = useCallback(
    async (messageId: string, newContent: string) => {
      if (!user?._id || !conversationId) return;

      try {
        await updateMessageContent({
          id: messageId as Id<"messages">,
          content: newContent,
        });
      } catch (error) {
        onError?.(error as Error);
      }
    },
    [user?._id, conversationId, updateMessageContent, onError]
  );

  const deleteMessage = useCallback(
    async (messageId: string) => {
      if (!user?._id || !conversationId) return;

      try {
        await deleteMessagesByIds({ ids: [messageId as Id<"messages">] });

        const remainingMessages = messages.filter(m => m.id !== messageId);
        if (remainingMessages.length === 0) {
          await deleteConversation({ id: conversationId });
          window.location.href = "/";
        }
      } catch (error) {
        onError?.(error as Error);
      }
    },
    [
      user?._id,
      conversationId,
      deleteMessagesByIds,
      deleteConversation,
      messages,
      onError,
    ]
  );

  const isMessageStreaming = useCallback(
    (messageId: string, isGenerating: boolean) => {
      const message = convexMessages?.find(m => m._id === messageId);
      return (
        message?.role === "assistant" &&
        !message.metadata?.finishReason &&
        isGenerating
      );
    },
    [convexMessages]
  );

  return {
    messages,
    convexMessages,
    isLoadingMessages: !convexMessages,
    deleteMessagesAfter,
    editMessage,
    deleteMessage,
    isMessageStreaming,
  };
}
