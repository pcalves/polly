"use client";

import { Sidebar } from "@/components/sidebar";
import { ChatHeader } from "@/components/chat-header";
import { useParams } from "next/navigation";
import { ConversationId } from "@/types";
import { Preloaded } from "convex/react";
import { api } from "../../convex/_generated/api";
import { UserProvider } from "@/providers/user-provider";

interface SharedChatLayoutProps {
  children: React.ReactNode;
  headerClassName?: string;
  preloadedConversations?: Preloaded<typeof api.conversations.list>;
  preloadedUserModels?: Preloaded<typeof api.userModels.hasUserModels>;
  preloadedSelectedModel?: Preloaded<
    typeof api.userModels.getUserSelectedModel
  >;
  preloadedApiKeys?: Preloaded<typeof api.apiKeys.hasAnyApiKey>;
  preloadedUser?:
    | Preloaded<typeof api.users.getCurrentUser>
    | Preloaded<typeof api.users.getById>
    | null;
  preloadedMessageCount?: Preloaded<typeof api.users.getMessageCount> | null;
}

export function SharedChatLayout({
  children,
  headerClassName = "",
  preloadedConversations,
  preloadedUserModels,
  preloadedSelectedModel,
  preloadedApiKeys,
  preloadedUser,
  preloadedMessageCount,
}: SharedChatLayoutProps) {
  const params = useParams();
  const currentConversationId = params.conversationId as ConversationId;

  return (
    <UserProvider
      preloadedUser={preloadedUser}
      preloadedMessageCount={preloadedMessageCount}
      preloadedUserModels={preloadedUserModels}
      preloadedSelectedModel={preloadedSelectedModel}
      preloadedApiKeys={preloadedApiKeys}
    >
      <Sidebar preloadedConversations={preloadedConversations}>
        <div
          className={`flex-shrink-0 h-16 flex items-center pl-16 pr-4 lg:pr-6 ${headerClassName}`}
        >
          <ChatHeader conversationId={currentConversationId} />
        </div>

        <div className="flex-1 overflow-hidden">{children}</div>
      </Sidebar>
    </UserProvider>
  );
}
