"use client";

import { ChatContainer } from "@/components/chat-container";
import { useSettings } from "@/hooks/use-settings";
import { useParams } from "next/navigation";
import { ConversationId } from "@/types";

export default function ConversationPage() {
  const params = useParams();
  const { settings, updateSettings } = useSettings();
  const conversationId = params.conversationId as ConversationId;

  return (
    <div className="h-full">
      <ChatContainer 
        conversationId={conversationId}
        settings={settings}
        onSettingsChange={updateSettings}
        onConversationCreate={() => {}}
        onSendMessageReady={(sendMessage) => {
          console.log("🔧 onSendMessageReady called for conversation:", conversationId);
          
          // Check for pending message now that sendMessage is ready
          const pendingMessageKey = `pending-message-${conversationId}`;
          console.log("🔍 Looking for pending message with key:", pendingMessageKey);
          
          const pendingMessageData = sessionStorage.getItem(pendingMessageKey);
          console.log("📦 Found pending message data:", pendingMessageData);
          
          if (pendingMessageData) {
            try {
              const pendingMessage = JSON.parse(pendingMessageData);
              console.log("🚀 Auto-sending pending message:", pendingMessage);
              
              // Clear the pending message immediately to avoid re-sending
              sessionStorage.removeItem(pendingMessageKey);
              
              // Send the message after a small delay to ensure everything is ready
              setTimeout(() => {
                console.log("📤 Actually sending message now...", pendingMessage);
                sendMessage(pendingMessage.content, pendingMessage.attachments);
                console.log("✅ sendMessage called successfully");
              }, 100);
            } catch (error) {
              console.error("Failed to parse pending message:", error);
              sessionStorage.removeItem(pendingMessageKey);
            }
          } else {
            console.log("❌ No pending message found");
            console.log("📋 All sessionStorage keys:", Object.keys(sessionStorage));
          }
        }}
        className="h-full"
        isSidebarVisible={false}
      />
    </div>
  );
}
