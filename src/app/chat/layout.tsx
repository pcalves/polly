import { SharedChatLayout } from "@/components/shared-chat-layout";

export default function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SharedChatLayout headerClassName="bg-background border-b border-border/30">
      {children}
    </SharedChatLayout>
  );
}
