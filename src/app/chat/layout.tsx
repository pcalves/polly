import { SharedChatLayout } from "@/components/shared-chat-layout";
import { preloadUserData } from "@/lib/preload-data";

export default async function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const {
    conversations,
    userModels,
    selectedModel,
    apiKeys,
    user,
    messageCount,
  } = await preloadUserData();

  return (
    <SharedChatLayout
      headerClassName="bg-background border-b border-border/30"
      preloadedConversations={conversations}
      preloadedUserModels={userModels}
      preloadedSelectedModel={selectedModel}
      preloadedApiKeys={apiKeys}
      preloadedUser={user}
      preloadedMessageCount={messageCount}
    >
      {children}
    </SharedChatLayout>
  );
}
