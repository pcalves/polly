import { ChatContainer } from "@/components/chat-container";
import { SharedChatLayout } from "@/components/shared-chat-layout";

export default function HomePage() {
  return (
    <SharedChatLayout>
      <ChatContainer
        conversationId={undefined}
        className="h-full"
        hideInputWhenNoApiKeys={false}
      />
    </SharedChatLayout>
  );
}
