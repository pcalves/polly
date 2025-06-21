"use client";

import { useCallback, useMemo, useRef, useState, useEffect } from "react";
import { ChatMessage, Attachment, ConversationId } from "@/types";
import { useCreateConversation } from "./use-conversations";
import { useUser } from "./use-user";
import { useThinking } from "@/providers/thinking-provider";

import { useChatMessages } from "./use-chat-messages";

import { useMutation, useAction, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";

interface UseChatOptions {
  conversationId?: ConversationId;
  onMessagesChange?: (messages: ChatMessage[]) => void;
  onError?: (error: Error) => void;
  onConversationCreate?: (conversationId: ConversationId) => void;
}

export function useChat({
  conversationId,
  onError,
  onConversationCreate,
}: UseChatOptions) {
  const { user, isLoading: userLoading, canSendMessage } = useUser();
  const { createNewConversationWithResponse } = useCreateConversation();
  const { setIsThinking } = useThinking();

  // Use specialized hooks

  const chatMessages = useChatMessages({
    conversationId,
    onError,
  });

  // Centralized Convex actions
  const sendFollowUpMessageAction = useAction(
    api.conversations.sendFollowUpMessage
  );
  const retryFromMessageAction = useAction(api.conversations.retryFromMessage);
  const editMessageAction = useAction(api.conversations.editMessage);
  const stopGenerationAction = useAction(api.conversations.stopGeneration);
  const resumeConversationAction = useAction(
    api.conversations.resumeConversation
  );
  const selectedModel = useQuery(api.userModels.getUserSelectedModel);
  const addMessage = useMutation(api.messages.create);

  // State management
  const [currentConversationId, setCurrentConversationId] = useState<
    ConversationId | undefined
  >(conversationId);
  const [isGenerating, setIsGenerating] = useState(false);
  const hasAttemptedResumeRef = useRef<string | null>(null);

  // Update conversation ID tracking when prop changes
  useEffect(() => {
    setCurrentConversationId(conversationId);
    if (conversationId !== hasAttemptedResumeRef.current) {
      hasAttemptedResumeRef.current = null;
    }
  }, [conversationId]);

  const withLoadingState = useCallback(
    async <T>(operation: () => Promise<T>): Promise<T> => {
      try {
        setIsGenerating(true);
        setIsThinking(true);
        return await operation();
      } finally {
        setIsGenerating(false);
        setIsThinking(false);
      }
    },
    [setIsThinking]
  );

  // Auto-resume conversation logic
  useEffect(() => {
    if (
      !conversationId ||
      !selectedModel ||
      hasAttemptedResumeRef.current === conversationId ||
      isGenerating
    ) {
      return;
    }

    const lastMessage =
      chatMessages.convexMessages?.[chatMessages.convexMessages.length - 1];
    if (chatMessages.convexMessages?.length && lastMessage?.role === "user") {
      hasAttemptedResumeRef.current = conversationId;

      const startResponse = async () => {
        try {
          await withLoadingState(() =>
            resumeConversationAction({
              conversationId,
            })
          );
        } catch (error) {
          hasAttemptedResumeRef.current = null;
          onError?.(error as Error);
        }
      };

      startResponse();
    }
  }, [
    conversationId,
    chatMessages.convexMessages,
    selectedModel,
    isGenerating,
    resumeConversationAction,
    withLoadingState,
    onError,
  ]);

  const sendMessage = useCallback(
    async (
      content: string,
      attachments?: Attachment[],
      useWebSearch?: boolean,
      personaPrompt?: string | null,
      personaId?: Id<"personas"> | null
    ) => {
      if (!content.trim() && !attachments?.length) return;

      if (!canSendMessage) {
        onError?.(
          new Error(
            "Message limit reached. Please sign in to continue chatting."
          )
        );
        return;
      }

      if (!user && userLoading) {
        setTimeout(() => sendMessage(content, attachments), 200);
        return;
      }

      try {
        let conversationId = currentConversationId;

        // Create new conversation if needed
        if (!conversationId) {
          const newConversationId = await createNewConversationWithResponse(
            content,
            undefined,
            personaId,
            user?._id,
            attachments,
            useWebSearch,
            personaPrompt
          );
          if (!newConversationId) {
            throw new Error("Failed to create conversation");
          }

          // For new conversations, navigate immediately - the Convex action handles the assistant response
          if (onConversationCreate) {
            onConversationCreate(newConversationId);
            return;
          }

          conversationId = newConversationId;
          setCurrentConversationId(newConversationId);
          return;
        }

        // For existing conversations, use the centralized Convex action
        if (selectedModel) {
          await withLoadingState(() =>
            sendFollowUpMessageAction({
              conversationId,
              content,
              attachments,
              useWebSearch,
              model: selectedModel.modelId,
              provider: selectedModel.provider,
            })
          );
        } else {
          throw new Error("No model selected");
        }
      } catch (error) {
        onError?.(error as Error);
      }
    },
    [
      canSendMessage,
      onError,
      user,
      userLoading,
      currentConversationId,
      createNewConversationWithResponse,
      onConversationCreate,
      selectedModel,
      sendFollowUpMessageAction,
      withLoadingState,
    ]
  );

  const sendMessageToNewConversation = useCallback(
    async (
      content: string,
      attachments?: Attachment[],
      shouldNavigate: boolean = true,
      contextSummary?: string,
      sourceConversationId?: ConversationId,
      personaPrompt?: string | null,
      personaId?: Id<"personas"> | null
    ) => {
      if (!content.trim() && !attachments?.length) return;

      if (!canSendMessage) {
        onError?.(
          new Error(
            "Message limit reached. Please sign in to continue chatting."
          )
        );
        return;
      }

      if (!user && userLoading) {
        setTimeout(
          () =>
            sendMessageToNewConversation(content, attachments, shouldNavigate),
          200
        );
        return;
      }

      try {
        // Use the new function that starts the assistant response immediately
        const newConversationId = await createNewConversationWithResponse(
          content,
          sourceConversationId,
          personaId,
          user?._id,
          attachments,
          false, // don't use web search for new conversations by default
          personaPrompt
        );
        if (!newConversationId) {
          throw new Error("Failed to create conversation");
        }

        // Add context message if provided
        if (contextSummary && sourceConversationId) {
          await addMessage({
            conversationId: newConversationId,
            role: "context",
            content: contextSummary,
            sourceConversationId,
            isMainBranch: true,
          });
        }

        if (shouldNavigate && onConversationCreate) {
          onConversationCreate(newConversationId);
        }

        return newConversationId;
      } catch (error) {
        onError?.(error as Error);
      }
    },
    [
      canSendMessage,
      onError,
      user,
      userLoading,
      createNewConversationWithResponse,
      addMessage,
      onConversationCreate,
    ]
  );

  const regenerateMessage = useCallback(async () => {
    if (!currentConversationId || !selectedModel) return;

    // Find the last user message to retry from
    const lastUserMessage = chatMessages.convexMessages
      ?.filter(msg => msg.role === "user")
      .pop();

    if (!lastUserMessage) return;

    try {
      await withLoadingState(() =>
        retryFromMessageAction({
          conversationId: currentConversationId,
          messageId: lastUserMessage._id,
          retryType: "user",
          model: selectedModel.modelId,
          provider: selectedModel.provider,
        })
      );
    } catch (error) {
      onError?.(error as Error);
    }
  }, [
    currentConversationId,
    selectedModel,
    chatMessages.convexMessages,
    retryFromMessageAction,
    withLoadingState,
    onError,
  ]);

  const stopGeneration = useCallback(async () => {
    if (currentConversationId) {
      try {
        await stopGenerationAction({
          conversationId: currentConversationId,
        });
      } catch (error) {
        console.error("Failed to stop generation:", error);
      }
    }
    setIsGenerating(false);
    setIsThinking(false);
  }, [
    currentConversationId,
    stopGenerationAction,
    setIsGenerating,
    setIsThinking,
  ]);

  const editMessage = useCallback(
    async (messageId: string, newContent: string) => {
      if (!currentConversationId || !selectedModel) return;

      try {
        await withLoadingState(() =>
          editMessageAction({
            conversationId: currentConversationId,
            messageId: messageId as Id<"messages">,
            newContent,
            model: selectedModel.modelId,
            provider: selectedModel.provider,
          })
        );
      } catch (error) {
        onError?.(error as Error);
      }
    },
    [
      currentConversationId,
      selectedModel,
      editMessageAction,
      withLoadingState,
      onError,
    ]
  );

  const retryUserMessage = useCallback(
    async (messageId: string) => {
      if (!currentConversationId || !selectedModel) return;

      try {
        await withLoadingState(() =>
          retryFromMessageAction({
            conversationId: currentConversationId,
            messageId: messageId as Id<"messages">,
            retryType: "user",
            model: selectedModel.modelId,
            provider: selectedModel.provider,
          })
        );
      } catch (error) {
        onError?.(error as Error);
      }
    },
    [
      currentConversationId,
      selectedModel,
      retryFromMessageAction,
      withLoadingState,
      onError,
    ]
  );

  const retryAssistantMessage = useCallback(
    async (messageId: string) => {
      if (!currentConversationId || !selectedModel) return;

      try {
        await withLoadingState(() =>
          retryFromMessageAction({
            conversationId: currentConversationId,
            messageId: messageId as Id<"messages">,
            retryType: "assistant",
            model: selectedModel.modelId,
            provider: selectedModel.provider,
          })
        );
      } catch (error) {
        onError?.(error as Error);
      }
    },
    [
      currentConversationId,
      selectedModel,
      retryFromMessageAction,
      withLoadingState,
      onError,
    ]
  );

  const clearMessages = useCallback(() => {
    // Keep messages in Convex - could implement deletion if needed
  }, []);

  // Computed values
  const hasStreamingContent = useMemo(() => {
    return chatMessages.messages.some(
      msg =>
        msg.role === "assistant" &&
        msg.content &&
        chatMessages.isMessageStreaming(msg.id, isGenerating)
    );
  }, [chatMessages, isGenerating]);

  const isStreamingInCurrentConversation = useMemo(() => {
    if (!currentConversationId) return false;

    // Check if there's any assistant message without a finish reason (still streaming)
    const streamingMessage = chatMessages.convexMessages?.find(
      msg =>
        msg.conversationId === currentConversationId &&
        msg.role === "assistant" &&
        !msg.metadata?.finishReason
    );

    return !!streamingMessage;
  }, [currentConversationId, chatMessages.convexMessages]);

  return {
    messages: chatMessages.messages,
    conversationId: currentConversationId,
    isLoading: isGenerating,
    isLoadingMessages: chatMessages.isLoadingMessages,
    error: null,
    sendMessage,
    sendMessageToNewConversation,
    regenerateMessage,
    clearMessages,
    stopGeneration,
    editMessage,
    retryUserMessage,
    retryAssistantMessage,
    deleteMessage: chatMessages.deleteMessage,
    expectingStream: false,
    hasStreamingContent,
    isStreaming: isStreamingInCurrentConversation,
  };
}
