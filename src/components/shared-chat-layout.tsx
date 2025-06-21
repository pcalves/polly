"use client";

import { Sidebar } from "@/components/sidebar";
import { ChatHeader } from "@/components/chat-header";
import { useParams } from "next/navigation";
import { ConversationId } from "@/types";
import { UserProvider } from "@/providers/user-provider";

interface SharedChatLayoutProps {
  children: React.ReactNode;
  headerClassName?: string;
}

export function SharedChatLayout({
  children,
  headerClassName = "",
}: SharedChatLayoutProps) {
  const params = useParams();
  const currentConversationId = params.conversationId as ConversationId;

  return (
    <UserProvider>
      <Sidebar>
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
