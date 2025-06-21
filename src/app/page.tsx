import { ChatContainer } from "@/components/chat-container";
import { SharedChatLayout } from "@/components/shared-chat-layout";
import { preloadUserData } from "@/lib/preload-data";

export default async function HomePage() {
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
      preloadedConversations={conversations}
      preloadedUserModels={userModels}
      preloadedSelectedModel={selectedModel}
      preloadedApiKeys={apiKeys}
      preloadedUser={user}
      preloadedMessageCount={messageCount}
    >
      <ChatContainer
        conversationId={undefined}
        className="h-full"
        hideInputWhenNoApiKeys={false}
      />
    </SharedChatLayout>
  );
}
