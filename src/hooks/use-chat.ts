"use client";

import React, { useCallback } from "react";
import { useChat as useAIChat, Message } from "ai/react";
import { ChatMessage, Attachment, ChatSettings, ConversationId, MessageId } from "@/types";
import { getStoredApiKeys } from "@/lib/api-keys";
import { useMessages } from "./use-messages";
import { useConversations } from "./use-conversations";
import { useUser } from "./use-user";
// import { nanoid } from "nanoid";

// Extended message type to include experimental fields
interface ExtendedMessage extends Message {
  experimental_providerMetadata?: {
    openai?: {
      reasoning?: string;
    };
  };
  usage?: {
    totalTokens?: number;
    reasoningTokens?: number;
  };
}

interface UseChatOptions {
  conversationId?: ConversationId;
  settings: ChatSettings;
  onMessagesChange?: (messages: ChatMessage[]) => void;
  onError?: (error: Error) => void;
  onConversationCreate?: (conversationId: ConversationId, pendingMessage?: { content: string; attachments?: Attachment[] }) => void;
}

export function useChat({
  conversationId,
  settings,
  onError,
  onConversationCreate,
}: UseChatOptions) {
  const { user, isLoading: userLoading, canSendMessage } = useUser();
  const { createNewConversation } = useConversations(user?._id);
  const { messages: convexMessages, addMessage, updateMessageContent, updateMessageMetadata, deleteMessageById } = useMessages(conversationId);
  const [currentConversationId, setCurrentConversationId] = React.useState<ConversationId | undefined>(conversationId);
  const currentAssistantMessageIdRef = React.useRef<MessageId | null>(null);
  const activeConversationIdRef = React.useRef<ConversationId | undefined>(conversationId);
  
  // Update currentConversationId when prop changes
  React.useEffect(() => {
    setCurrentConversationId(conversationId);
    activeConversationIdRef.current = conversationId;
  }, [conversationId]);
  
  // Convert Convex messages to ChatMessage format
  const messages: ChatMessage[] = React.useMemo(() => {
    return convexMessages.map(msg => ({
      id: msg._id,
      role: msg.role,
      content: msg.content,
      reasoning: msg.reasoning,
      model: msg.model,
      provider: msg.provider,
      parentId: msg.parentId,
      isMainBranch: msg.isMainBranch,
      attachments: msg.attachments,
      metadata: msg.metadata,
      createdAt: msg.createdAt,
    }));
  }, [convexMessages]);

  const {
    messages: aiMessages,
    append,
    reload,
    stop,
    isLoading: aiIsLoading,
    error,
  } = useAIChat({
    api: "/api/chat",
    initialMessages: messages.map(msg => ({
      id: msg.id,
      role: msg.role,
      content: msg.content,
    })),
    body: {
      model: settings.model,
      provider: settings.provider,
      apiKey: getStoredApiKeys()[settings.provider as keyof ReturnType<typeof getStoredApiKeys>],
      temperature: settings.temperature,
      maxTokens: settings.maxTokens,
      topP: settings.topP,
      frequencyPenalty: settings.frequencyPenalty,
      presencePenalty: settings.presencePenalty,
      enableReasoning: settings.enableReasoning,
    },
    onFinish: async (message) => {
      // Create the assistant message in Convex after streaming is complete
      const extendedMessage = message as ExtendedMessage;
      console.log("✅ Message finished streaming:", {
        contentLength: message.content.length,
        reasoning: extendedMessage.experimental_providerMetadata?.openai?.reasoning,
        usage: extendedMessage.usage
      });
      
      // Use the ref to get the most current conversation ID
      const conversationId = activeConversationIdRef.current;
      if (!conversationId) {
        console.error("No conversation ID available to save message");
        return;
      }
      
      try {
        // Create the assistant message in Convex with final content
        const assistantMessageId = await addMessage({
          conversationId,
          role: "assistant",
          content: message.content,
          reasoning: extendedMessage.experimental_providerMetadata?.openai?.reasoning,
          model: settings.model,
          provider: settings.provider,
          isMainBranch: true,
        });
        
        // Update metadata if available
        if (extendedMessage.usage && assistantMessageId) {
          console.log("💾 Saving metadata:", extendedMessage.usage);
          await updateMessageMetadata(assistantMessageId, {
            tokenCount: extendedMessage.usage.totalTokens,
            reasoningTokenCount: extendedMessage.usage.reasoningTokens,
          });
        }
        
        console.log("✅ Successfully saved message to Convex");
      } catch (error) {
        console.error("❌ Failed to save message to Convex:", error);
      }
    },
    onError: (error) => {
      console.error("Chat error:", error);
      onError?.(error);
    },
  });

  // Merge Convex messages with AI streaming messages
  const displayMessages: ChatMessage[] = React.useMemo(() => {
    // Always start with Convex messages (excluding empty assistant placeholders)
    const convexMessagesWithoutPlaceholders = messages.filter(m => 
      !(m.role === "assistant" && (!m.content || m.content === ""))
    );
    
    // If we have streaming messages, merge them in
    if (aiMessages.length > 0) {
      console.log("🚀 Processing AI messages:", { 
        convexCount: convexMessagesWithoutPlaceholders.length, 
        aiCount: aiMessages.length,
        isLoading: aiIsLoading,
        latestAiMessage: aiMessages[aiMessages.length - 1]?.content?.substring(0, 50) + "...",
        latestAiMessageId: aiMessages[aiMessages.length - 1]?.id
      });
      
      // Convert AI messages to ChatMessage format
      const streamingMessages: ChatMessage[] = [];
      aiMessages.forEach(aiMsg => {
        // Skip data messages  
        if (aiMsg.role === "data") return;
        
        const extendedMsg = aiMsg as ExtendedMessage;
        
        // Convert AI message to ChatMessage format
        if (aiMsg.role === "assistant" || aiMsg.role === "user") {
          streamingMessages.push({
            id: aiMsg.id,
            role: aiMsg.role,
            content: aiMsg.content,
            reasoning: extendedMsg.experimental_providerMetadata?.openai?.reasoning,
            model: settings.model,
            provider: settings.provider,
            parentId: undefined,
            isMainBranch: true,
            attachments: undefined,
            metadata: undefined,
            createdAt: Date.now(),
          });
        }
      });
      
      // Merge: Convex messages + streaming messages (removing duplicates by ID)
      const allMessages = [...convexMessagesWithoutPlaceholders];
      streamingMessages.forEach(streamMsg => {
        const existingIndex = allMessages.findIndex(m => m.id === streamMsg.id);
        if (existingIndex >= 0) {
          // Update existing message with streaming content
          allMessages[existingIndex] = streamMsg;
        } else {
          // Add new streaming message
          allMessages.push(streamMsg);
        }
      });
      
      console.log("📝 Final display messages:", allMessages.length, "Last message content:", allMessages[allMessages.length - 1]?.content?.substring(0, 50) + "...");
      return allMessages;
    }
    
    // Show Convex messages when no streaming
    console.log("💾 Showing Convex messages:", convexMessagesWithoutPlaceholders.length);
    return convexMessagesWithoutPlaceholders;
  }, [aiMessages, messages, aiIsLoading, settings.model, settings.provider]);

  const sendMessage = useCallback(async (
    content: string,
    attachments?: Attachment[]
  ) => {
    console.log("🚀 sendMessage called with:", { content, attachments, user: user?._id, currentConversationId });
    
    if (!content.trim() && !attachments?.length) {
      console.log("❌ Early return: no content or attachments");
      return;
    }

    // Check if user can send message (message limit for anonymous users)
    if (!canSendMessage) {
      console.log("❌ Early return: message limit reached");
      onError?.(new Error("Message limit reached. Please sign in to continue chatting."));
      return;
    }
    
    // Wait for user to be available (user might still be loading)
    if (!user?._id) {
      if (userLoading) {
        console.log("⏳ User still loading, waiting...");
        // Retry after a short delay to allow user loading to complete
        setTimeout(() => {
          console.log("🔄 Retrying sendMessage after user loading");
          sendMessage(content, attachments);
        }, 200);
        return;
      } else {
      console.log("❌ Early return: no user and not loading");
      return;
      }
    }

    // Check if we have the required API key
    const apiKeys = getStoredApiKeys();
    const requiredKey = apiKeys[settings.provider as keyof typeof apiKeys];
    console.log("🔑 API key check:", { provider: settings.provider, hasKey: !!requiredKey });
    
    if (!requiredKey) {
      console.log("❌ Early return: no API key for provider:", settings.provider);
      onError?.(new Error(`No API key found for ${settings.provider}`));
      return;
    }

    try {
      let conversationId = currentConversationId;
      console.log("💬 Conversation check:", { currentConversationId, hasOnConversationCreate: !!onConversationCreate });
      
      // Create a new conversation if we don't have one
      if (!conversationId) {
        console.log("🆕 No conversation ID, creating new conversation");
        const newConversationId = await createNewConversation(content);
        if (newConversationId) {
          conversationId = newConversationId;
          setCurrentConversationId(newConversationId);
          activeConversationIdRef.current = newConversationId;
          
          // ✨ Trigger immediate redirect, message will be sent on conversation page
          if (onConversationCreate) {
            console.log("🔄 Redirecting immediately, message will be sent on conversation page:", newConversationId);
            onConversationCreate(newConversationId, { content, attachments });
            return; // Exit here, message will be sent on the conversation page
          }
          
          console.log("📝 Created new conversation:", newConversationId);
        }
      } else {
        console.log("✅ Using existing conversation:", conversationId);
      }

      if (!conversationId) {
        onError?.(new Error("Failed to create conversation"));
        return;
      }

      // Add user message to Convex
      const userMessageId = await addMessage({
        conversationId,
        role: "user",
        content,
        attachments,
        isMainBranch: true,
      });

      // Don't create placeholder - let streaming show directly, then save on finish
      currentAssistantMessageIdRef.current = null;

      const userMessage = {
        id: userMessageId as string,
        role: "user" as const,
        content,
      };

      await append(userMessage);
    } catch (error) {
      console.error("Error sending message:", error);
      onError?.(error as Error);
    }
  }, [user?._id, userLoading, canSendMessage, currentConversationId, createNewConversation, addMessage, settings, append, onError, onConversationCreate]);

  const regenerateMessage = useCallback(async () => {
    await reload();
  }, [reload]);

  const clearMessages = useCallback(() => {
    // For now, we'll keep messages in Convex but could implement deletion
    console.log("Clear messages - conversation will remain in Convex");
  }, []);

  const stopGeneration = useCallback(() => {
    stop();
  }, [stop]);

  const editMessage = useCallback(async (messageId: string, newContent: string) => {
    if (!user?._id || !currentConversationId) return;

    try {
      // Update the message content
      await updateMessageContent(messageId as MessageId, newContent);

      // Find the message index to delete all messages after it
      const messageIndex = messages.findIndex(m => m.id === messageId);
      if (messageIndex !== -1) {
        // Delete all messages after the edited one
        const messagesToDelete = messages.slice(messageIndex + 1);
        for (const message of messagesToDelete) {
          await deleteMessageById(message.id as MessageId);
        }

        // Create a new assistant response
        const assistantMessageId = await addMessage({
          conversationId: currentConversationId,
          role: "assistant",
          content: "",
          model: settings.model,
          provider: settings.provider,
          isMainBranch: true,
        });

        // Store the assistant message ID for the onFinish callback
        currentAssistantMessageIdRef.current = assistantMessageId;

        // Trigger a new response with the updated message history
        const userMessage = {
          id: messageId,
          role: "user" as const,
          content: newContent,
        };

        await append(userMessage);
      }
    } catch (error) {
      console.error("Error editing message:", error);
      onError?.(error as Error);
    }
  }, [user?._id, currentConversationId, updateMessageContent, messages, deleteMessageById, addMessage, settings, append, onError]);

  return {
    messages: displayMessages,
    conversationId: currentConversationId,
    isLoading: aiIsLoading,
    error,
    sendMessage,
    regenerateMessage,
    clearMessages,
    stopGeneration,
    editMessage,
  };
}