"use client";

import React, { useCallback } from "react";
import { SharedChatLayout } from "@/components/shared-chat-layout";
import { useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useUser } from "@/hooks/use-user";
import { Attachment } from "@/types";
import { Id } from "../../convex/_generated/dataModel";
import { ChatInput } from "@/components/chat-input";
import { ChatZeroState } from "@/components/chat-zero-state";
import { useCreateConversation } from "@/hooks/use-conversations";

export default function HomePage() {
  const router = useRouter();
  const userInfo = useUser();
  const hasApiKeys = useQuery(api.apiKeys.hasAnyApiKey);

  const personas = useQuery(
    api.personas.list,
    userInfo.user?._id ? { userId: userInfo.user._id } : "skip"
  );

  const { createNewConversationWithResponse } = useCreateConversation();

  const handleSendAsNewConversation = useCallback(
    async (
      content: string,
      navigate: boolean,
      attachments?: Attachment[],
      contextSummary?: string,
      personaId?: Id<"personas"> | null
    ) => {
      if (!hasApiKeys || !navigate) {
        return;
      }

      const persona = personaId
        ? personas?.find(p => p._id === personaId)
        : null;
      const personaPrompt = persona?.prompt || null;

      const conversationId = await createNewConversationWithResponse(
        content,
        undefined,
        personaId,
        userInfo.user?._id,
        attachments,
        undefined,
        personaPrompt
      );

      router.push(`/chat/${conversationId}`);
    },
    [
      createNewConversationWithResponse,
      router,
      personas,
      hasApiKeys,
      userInfo.user,
    ]
  );

  return (
    <SharedChatLayout>
      <div className="flex h-full">
        <div className="flex-1 flex flex-col relative h-full overflow-hidden">
          <div className="flex-1 overflow-hidden">
            <div className="h-full flex flex-col relative overflow-hidden">
              <div className="relative z-10 flex flex-col h-full">
                <div className="flex-1 overflow-y-auto overflow-x-hidden">
                  <ChatZeroState
                    onQuickPrompt={prompt => {
                      handleSendAsNewConversation(prompt, true);
                    }}
                  />
                </div>

                {hasApiKeys && (
                  <div className="flex-shrink-0 relative">
                    <ChatInput
                      onSendMessage={(
                        content,
                        attachments,
                        useWebSearch,
                        personaId
                      ) => {
                        handleSendAsNewConversation(
                          content,
                          true,
                          attachments,
                          undefined,
                          personaId
                        );
                      }}
                      onSendAsNewConversation={handleSendAsNewConversation}
                      hasExistingMessages={false}
                      isLoading={false}
                      isStreaming={false}
                      onStop={() => {}}
                      placeholder="Ask me anything..."
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </SharedChatLayout>
  );
}
