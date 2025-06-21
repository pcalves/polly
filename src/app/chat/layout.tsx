import { SharedChatLayout } from "@/components/shared-chat-layout";

export default function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <SharedChatLayout>{children}</SharedChatLayout>;
}
