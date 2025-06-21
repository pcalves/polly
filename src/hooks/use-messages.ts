"use client";

import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { ConversationId, MessageId } from "@/types";

export function useMessages(conversationId?: ConversationId) {
  const messages = useQuery(
    api.messages.list,
    conversationId ? { conversationId } : "skip"
  );
  
  const createMessage = useMutation(api.messages.create);
  const updateMessage = useMutation(api.messages.update);
  const deleteMessage = useMutation(api.messages.remove);
  const setBranchMessage = useMutation(api.messages.setBranch);

  const addMessage = async (messageData: {
    conversationId: ConversationId;
    role: "user" | "assistant" | "system";
    content: string;
    model?: string;
    provider?: string;
    parentId?: MessageId;
    isMainBranch?: boolean;
    reasoning?: string;
    attachments?: Array<{
      type: "image" | "pdf";
      url: string;
      name: string;
      size: number;
    }>;
    metadata?: {
      tokenCount?: number;
      reasoningTokenCount?: number;
      finishReason?: string;
      duration?: number;
    };
  }) => {
    return await createMessage(messageData);
  };

  const updateMessageContent = async (id: MessageId, content: string, reasoning?: string) => {
    return await updateMessage({ id, content, reasoning });
  };

  const updateMessageMetadata = async (
    id: MessageId,
    metadata: {
      tokenCount?: number;
      reasoningTokenCount?: number;
      finishReason?: string;
      duration?: number;
    }
  ) => {
    return await updateMessage({ id, metadata });
  };

  const deleteMessageById = async (id: MessageId) => {
    return await deleteMessage({ id });
  };

  const setMainBranch = async (messageId: MessageId, parentId?: MessageId) => {
    return await setBranchMessage({ messageId, parentId });
  };

  return {
    messages: messages || [],
    addMessage,
    updateMessageContent,
    updateMessageMetadata,
    deleteMessageById,
    setMainBranch,
    isLoading: messages === undefined,
  };
}