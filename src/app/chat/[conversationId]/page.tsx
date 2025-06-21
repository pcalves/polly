"use client";

import React, { useCallback } from "react";
import { useParams, notFound } from "next/navigation";
import { ConversationId, Attachment } from "@/types";
import { ConversationChatView } from "@/components/conversation-chat-view";
import { ConversationErrorBoundary } from "@/components/conversation-error-boundary";
import { useChat } from "@/hooks/use-chat";
import { useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useUser } from "@/hooks/use-user";
import { Id } from "../../../../convex/_generated/dataModel";
import { isValidConvexId } from "@/lib/validation";

function ConversationPageContent({
  conversationId,
}: {
  conversationId: ConversationId;
}) {
  const router = useRouter();
  const { user, isLoading: userLoading } = useUser();

  // Fetch conversation with authorization
  const conversation = useQuery(
    api.conversations.getAuthorized,
    user !== undefined ? { id: conversationId, userId: user?._id } : "skip"
  );

  const hasApiKeys = useQuery(api.apiKeys.hasAnyApiKey);
  const personas = useQuery(
    api.personas.list,
    user?._id ? { userId: user._id } : "skip"
  );

  const onMessagesChange = useCallback(() => {}, []);
  const onError = useCallback(() => {}, []);
  const onConversationCreate = useCallback(
    (newConversationId: ConversationId) => {
      router.push(`/chat/${newConversationId}`);
    },
    [router]
  );

  const {
    messages,
    isLoading,
    isLoadingMessages,
    sendMessage,
    sendMessageToNewConversation,
    editMessage,
    retryUserMessage,
    retryAssistantMessage,
    stopGeneration,
    isStreaming,
    deleteMessage,
  } = useChat({
    conversationId,
    onMessagesChange,
    onError,
    onConversationCreate,
  });

  // Create handlers for this specific conversation
  const handleSendMessage = useCallback(
    (
      content: string,
      attachments?: Attachment[],
      useWebSearch?: boolean,
      personaId?: Id<"personas"> | null
    ) => {
      if (!conversation) return;

      const effectivePersonaId = conversation.personaId || personaId;
      const persona = effectivePersonaId
        ? personas?.find(p => p._id === effectivePersonaId)
        : null;
      const personaPrompt = persona?.prompt || null;

      sendMessage(
        content,
        attachments,
        useWebSearch,
        personaPrompt,
        effectivePersonaId
      );
    },
    [conversation, personas, sendMessage]
  );

  const handleSendAsNewConversation = useCallback(
    async (
      content: string,
      navigate: boolean,
      attachments?: Attachment[],
      contextSummary?: string,
      personaId?: Id<"personas"> | null
    ) => {
      const persona = personaId
        ? personas?.find(p => p._id === personaId)
        : null;
      const personaPrompt = persona?.prompt || null;

      await sendMessageToNewConversation(
        content,
        attachments,
        navigate,
        contextSummary,
        conversationId,
        personaPrompt,
        personaId
      );
    },
    [personas, sendMessageToNewConversation, conversationId]
  );

  // Handle loading states
  if (userLoading || conversation === undefined) {
    return <div className="h-full" />;
  }

  // Handle unauthorized access or invalid conversation
  if (conversation === null) {
    notFound();
  }

  return (
    <ConversationChatView
      conversationId={conversationId}
      conversation={conversation}
      messages={messages}
      isLoading={isLoading}
      isLoadingMessages={isLoadingMessages}
      isStreaming={isStreaming}
      hasApiKeys={hasApiKeys || false}
      onSendMessage={handleSendMessage}
      onSendAsNewConversation={handleSendAsNewConversation}
      onEditMessage={editMessage}
      onRetryUserMessage={retryUserMessage}
      onRetryAssistantMessage={retryAssistantMessage}
      onDeleteMessage={deleteMessage}
      onStopGeneration={stopGeneration}
    />
  );
}

export default function ConversationPage() {
  const params = useParams();
  const conversationId = params.conversationId as ConversationId;

  // Validate conversation ID format early
  if (!isValidConvexId(conversationId)) {
    notFound();
  }

  return (
    <ConversationErrorBoundary>
      <ConversationPageContent conversationId={conversationId} />
    </ConversationErrorBoundary>
  );
}
