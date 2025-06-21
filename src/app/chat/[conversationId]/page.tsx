"use client";

import { ChatContainer } from "@/components/chat-container";
import { useParams } from "next/navigation";
import { ConversationId } from "@/types";
import { ConversationGuard } from "@/components/conversation-guard";

export default function ConversationPage() {
  const params = useParams();
  const conversationId = params.conversationId as ConversationId;

  return (
    <ConversationGuard conversationId={conversationId}>
      {conversation => (
        <ChatContainer
          conversationId={conversationId}
          conversation={conversation}
          className="h-full"
        />
      )}
    </ConversationGuard>
  );
}
