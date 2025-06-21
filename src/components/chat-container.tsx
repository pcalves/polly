"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { ChatMessage } from "./chat-message";
import { ChatInput } from "./chat-input";
import { ChatOutline } from "./chat-outline";
import { useChat } from "@/hooks/use-chat";
import { ChatSettings, Attachment, ConversationId } from "@/types";
import { cn } from "@/lib/utils";
import { Bot } from "lucide-react";
import { MessageLimitBanner } from "@/components/message-limit-banner";

interface ChatContainerProps {
  conversationId?: ConversationId;
  settings: ChatSettings;
  onSettingsChange?: (settings: ChatSettings) => void;
  onConversationCreate?: (conversationId: ConversationId, pendingMessage?: { content: string; attachments?: Attachment[] }) => void;
  onInputStart?: () => void;
  onSendMessageReady?: (sendMessage: (content: string, attachments?: Attachment[]) => void) => void;
  className?: string;
  isSidebarVisible?: boolean;
}

export function ChatContainer({ 
  conversationId, 
  settings,
  onSettingsChange,
  onConversationCreate,
  onInputStart,
  onSendMessageReady,
  className,
  isSidebarVisible = false
}: ChatContainerProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [streamingMessageId, setStreamingMessageId] = useState<string | null>(null);
  const streamingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const { messages, isLoading, sendMessage, editMessage } = useChat({
    conversationId,
    settings,
    onMessagesChange: (messages) => {
      // TODO: Save messages to Convex
      console.log("Messages updated:", messages);
    },
    onError: (error) => {
      console.error("Chat error:", error);
      // TODO: Show error toast
    },
    onConversationCreate,
  });

  // Handle streaming state transition with delay
  useEffect(() => {
    if (isLoading && messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage.role === "assistant") {
        console.log("🎬 Setting streaming message ID:", lastMessage.id);
        setStreamingMessageId(lastMessage.id);
        if (streamingTimeoutRef.current) {
          clearTimeout(streamingTimeoutRef.current);
        }
      }
    } else if (!isLoading && streamingMessageId) {
      // Add a small delay before clearing streaming state to prevent flash
      console.log("⏳ Scheduling streaming state clear in 300ms for message:", streamingMessageId);
      streamingTimeoutRef.current = setTimeout(() => {
        console.log("✨ Clearing streaming state for message:", streamingMessageId);
        setStreamingMessageId(null);
      }, 300); // Increased delay to 300ms
    }

    return () => {
      if (streamingTimeoutRef.current) {
        clearTimeout(streamingTimeoutRef.current);
      }
    };
  }, [isLoading, messages, streamingMessageId]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = useCallback((content: string, attachments?: Attachment[]) => {
    sendMessage(content, attachments);
  }, [sendMessage]);

  // Expose sendMessage function to parent component
  useEffect(() => {
    if (onSendMessageReady) {
      console.log("📡 ChatContainer: Calling onSendMessageReady with sendMessage function");
      onSendMessageReady(handleSendMessage);
    }
  }, [onSendMessageReady, handleSendMessage]);

  const handleOutlineNavigate = (messageId: string, headingId?: string) => {
    if (headingId) {
      // Try to find the specific heading first
      const headingElement = document.getElementById(headingId);
      if (headingElement) {
        headingElement.scrollIntoView({ behavior: "smooth", block: "start" });
        return;
      }
    }
    
    // Fall back to scrolling to the message
    const messageElement = document.getElementById(messageId);
    if (messageElement) {
      messageElement.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <div className={cn("flex h-full", className)}>
      <div className="flex-1 flex flex-col">
        <MessageLimitBanner />
        {/* Messages */}
        <div className="flex-1 overflow-y-auto bg-muted/20">
        {messages.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <div className="text-center space-y-6 px-4">
              <div className="w-16 h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
                <Bot className="h-8 w-8 text-primary" />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-semibold">Start a conversation</h2>
                <p className="text-muted-foreground max-w-md">
                  Choose a model and start chatting. Your conversations will be saved automatically.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto pb-4">
            {messages.map((message, index) => {
              const isStreaming = (isLoading || streamingMessageId === message.id) &&
                    index === messages.length - 1 &&
                    message.role === "assistant";
              
              if (message.role === "assistant" && index === messages.length - 1) {
                console.log("🎯 Last assistant message streaming state:", {
                  messageId: message.id,
                  isLoading,
                  streamingMessageId,
                  isLastMessage: index === messages.length - 1,
                  isStreaming
                });
              }
              
              return (
                <div key={message.id} id={message.id}>
                  <ChatMessage
                    message={message}
                    showReasoning={settings.showReasoning}
                    isStreaming={isStreaming}
                    onEditMessage={message.role === "user" ? editMessage : undefined}
                  />
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        )}
        </div>

        {/* Input */}
        <ChatInput
          onSendMessage={handleSendMessage}
          onInputStart={onInputStart}
          isLoading={isLoading}
          placeholder="Type your message..."
          settings={settings}
          onSettingsChange={onSettingsChange || (() => {})}
        />
      </div>

      {/* Outline */}
      {messages.length > 1 && (
        <ChatOutline
          messages={messages}
          onNavigate={handleOutlineNavigate}
          isSidebarVisible={isSidebarVisible}
        />
      )}
    </div>
  );
}