"use client";

import React, {
  useLayoutEffect,
  useRef,
  useCallback,
  useMemo,
  useState,
} from "react";
import { ChatMessage } from "./chat-message";
import { ChatInput, ChatInputRef } from "./chat-input";
import { ChatOutline } from "./chat-outline";
import { ChatHeader } from "./chat-header";
import { useScrollDirection } from "@/hooks/use-scroll-direction";
import {
  ConversationId,
  Attachment,
  ChatMessage as ChatMessageType,
} from "@/types";
import { cn } from "@/lib/utils";
import { ChatZeroState } from "./chat-zero-state";
import { useTextSelection } from "@/hooks/use-text-selection";
import { EnhancedQuoteButton } from "./ui/enhanced-quote-button";
import { ConfirmationDialog } from "./ui/confirmation-dialog";
import { useConfirmationDialog } from "@/hooks/use-confirmation-dialog";
import { ContextMessage } from "./context-message";
import { Id, Doc } from "../../convex/_generated/dataModel";

interface ConversationChatViewProps {
  conversationId: ConversationId;
  conversation: Doc<"conversations">;
  messages: ChatMessageType[];
  isLoading: boolean;
  isLoadingMessages?: boolean;
  isStreaming: boolean;
  hasApiKeys: boolean;
  onSendMessage: (
    content: string,
    attachments?: Attachment[],
    useWebSearch?: boolean,
    personaId?: Id<"personas"> | null
  ) => void;
  onEditMessage?: (messageId: string, content: string) => void;
  onRetryUserMessage?: (messageId: string) => void;
  onRetryAssistantMessage?: (messageId: string) => void;
  onDeleteMessage: (messageId: string) => Promise<void>;
  onStopGeneration: () => void;
}

export function ConversationChatView({
  conversationId,
  messages,
  isLoading,
  isLoadingMessages,
  isStreaming,
  hasApiKeys,
  onSendMessage,
  onEditMessage,
  onRetryUserMessage,
  onRetryAssistantMessage,
  onDeleteMessage,
  onStopGeneration,
}: ConversationChatViewProps) {
  // UI state and refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const chatInputRef = useRef<ChatInputRef>(null);
  const { selection, addQuoteToInput, lockSelection, unlockSelection } =
    useTextSelection();
  const confirmationDialog = useConfirmationDialog();

  const [scrollState, setScrollRef] = useScrollDirection({
    hideThreshold: 80,
  });

  const [isScrolling, setIsScrolling] = useState(false);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const smoothScrollToMessage = useCallback(
    (
      messageId: string,
      options?: {
        behavior?: ScrollBehavior;
        offset?: number;
        duration?: number;
      }
    ) => {
      const {
        behavior = "smooth",
        offset = 80,
        duration = 600,
      } = options || {};

      setIsScrolling(true);

      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }

      const attemptScroll = () => {
        const messageElement = document.getElementById(messageId);
        const container = messagesContainerRef.current;

        if (messageElement && container) {
          const containerRect = container.getBoundingClientRect();
          const messageRect = messageElement.getBoundingClientRect();

          const containerTop = containerRect.top;
          const messageTop = messageRect.top;
          const currentScrollTop = container.scrollTop;

          const targetScrollTop =
            currentScrollTop + (messageTop - containerTop) - offset;

          if (behavior === "smooth") {
            container.scrollTo({
              top: Math.max(0, targetScrollTop),
              behavior: "smooth",
            });

            scrollTimeoutRef.current = setTimeout(() => {
              setIsScrolling(false);
            }, duration);
          } else {
            container.scrollTo({
              top: Math.max(0, targetScrollTop),
              behavior: "auto",
            });
            setIsScrolling(false);
          }

          return true;
        }
        return false;
      };

      if (!attemptScroll()) {
        setTimeout(() => {
          if (!attemptScroll()) {
            const container = messagesContainerRef.current;
            if (container) {
              container.scrollTo({
                top: container.scrollHeight,
                behavior: behavior,
              });
              scrollTimeoutRef.current = setTimeout(() => {
                setIsScrolling(false);
              }, duration);
            }
          }
        }, 10);
      }
    },
    [setIsScrolling]
  );

  const dynamicBottomSpacing = useMemo(() => {
    if (typeof window === "undefined") return "pb-32";

    const viewportHeight = window.innerHeight;
    const bufferSpace = Math.min(viewportHeight * 0.3, 200);

    return `pb-[${Math.max(bufferSpace, 80)}px]`;
  }, []);

  const prevMessagesLengthRef = useRef(0);
  const prevLastUserMessageIdRef = useRef<string | null>(null);
  const isInitialLoadRef = useRef(true);

  useLayoutEffect(() => {
    if (messagesContainerRef.current) {
      setScrollRef(messagesContainerRef.current);
    }
  }, [setScrollRef]);

  useLayoutEffect(() => {
    if (isInitialLoadRef.current && messages.length > 0 && !isLoading) {
      messagesEndRef.current?.scrollIntoView({ behavior: "auto" });
      isInitialLoadRef.current = false;
    } else if (messages.length > 0 && !isInitialLoadRef.current) {
      const lastMessage = messages[messages.length - 1];

      if (
        lastMessage.role === "user" &&
        (messages.length > prevMessagesLengthRef.current ||
          lastMessage.id !== prevLastUserMessageIdRef.current)
      ) {
        smoothScrollToMessage(lastMessage.id, {
          behavior: "smooth",
          offset: 60,
          duration: 500,
        });
        prevLastUserMessageIdRef.current = lastMessage.id;
      }
    }

    prevMessagesLengthRef.current = messages.length;
  }, [messages, isLoading, smoothScrollToMessage]);

  useLayoutEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  const handleSendMessage = useCallback(
    (
      content: string,
      attachments?: Attachment[],
      useWebSearch?: boolean,
      personaId?: Id<"personas"> | null
    ) => {
      if (!hasApiKeys) {
        return;
      }

      onSendMessage(content, attachments, useWebSearch, personaId);

      setTimeout(() => {
        chatInputRef.current?.focus();
      }, 0);
    },
    [onSendMessage, hasApiKeys]
  );

  const handleAddQuote = useCallback((quote: string) => {
    chatInputRef.current?.addQuote(quote);
  }, []);

  const handleQuoteSelection = useCallback(() => {
    addQuoteToInput(handleAddQuote);
  }, [addQuoteToInput, handleAddQuote]);

  const handleOutlineNavigate = useCallback(
    (messageId: string, headingId?: string) => {
      if (headingId) {
        const headingElement = document.getElementById(headingId);
        if (headingElement) {
          headingElement.scrollIntoView({ behavior: "smooth", block: "start" });
          return;
        }
      }

      smoothScrollToMessage(messageId, {
        behavior: "smooth",
        offset: 100,
        duration: 400,
      });
    },
    [smoothScrollToMessage]
  );

  const handleDeleteMessage = useCallback(
    (messageId: string) => {
      const isLastMessage = messages.length === 1;

      confirmationDialog.confirm(
        {
          title: isLastMessage ? "Delete Conversation" : "Delete Message",
          description: isLastMessage
            ? "This is the last message in the conversation. Deleting it will delete the entire conversation. This action cannot be undone."
            : `Are you sure you want to delete this message? This action cannot be undone.`,
          confirmText: "Delete",
          cancelText: "Cancel",
          variant: "destructive",
        },
        async () => {
          await onDeleteMessage(messageId);
        }
      );
    },
    [messages, confirmationDialog, onDeleteMessage]
  );

  const isEmpty = messages.length === 0;
  const isLoadingConversation = conversationId && isLoadingMessages;

  const shouldShowLoadingSpinner = useMemo(() => {
    if (!isLoading || messages.length === 0) {
      return false;
    }

    const lastMessage = messages[messages.length - 1];
    return !lastMessage.content && !lastMessage.reasoning;
  }, [isLoading, messages]);

  return (
    <div className="flex h-full">
      <div className="flex-1 flex flex-col relative h-full overflow-hidden">
        <div className="flex-1 overflow-hidden">
          <div className="h-full flex flex-col relative overflow-hidden">
            <div className="relative z-10 flex flex-col h-full">
              <div
                ref={messagesContainerRef}
                className={cn(
                  "flex-1 overflow-y-auto overflow-x-hidden transition-all duration-300 ease-out",
                  isScrolling && "scroll-smooth"
                )}
              >
                {isLoadingConversation ? (
                  <div />
                ) : isEmpty ? (
                  <ChatZeroState />
                ) : (
                  <div className={cn("space-y-4", dynamicBottomSpacing)}>
                    <div
                      className={cn(
                        "sticky top-0 z-20 bg-background/95 backdrop-blur-md border-b border-border/30 transition-transform duration-300 ease-out pl-16 pr-4 lg:pr-6",
                        scrollState.shouldHideHeader && "-translate-y-full"
                      )}
                    >
                      <div className="h-16 flex items-center">
                        <ChatHeader conversationId={conversationId} />
                      </div>
                    </div>

                    <div className="p-8 space-y-4">
                      <div className="max-w-3xl mx-auto space-y-4">
                        {messages
                          .filter(message => {
                            if (message.role === "system") {
                              return false;
                            }
                            if (message.role === "assistant") {
                              return message.content || message.reasoning;
                            }
                            return true;
                          })
                          .sort((a, b) => {
                            if (a.role === "context" && b.role !== "context")
                              return -1;
                            if (b.role === "context" && a.role !== "context")
                              return 1;
                            return 0;
                          })
                          .map((message, index, filteredMessages) => {
                            const isMessageStreaming =
                              isStreaming &&
                              index === filteredMessages.length - 1 &&
                              message.role === "assistant" &&
                              !message.metadata?.finishReason;

                            return (
                              <div key={message.id} id={message.id}>
                                {message.role === "context" ? (
                                  <ContextMessage message={message} />
                                ) : (
                                  <ChatMessage
                                    message={message}
                                    isStreaming={isMessageStreaming}
                                    onEditMessage={
                                      message.role === "user" && onEditMessage
                                        ? onEditMessage
                                        : undefined
                                    }
                                    onRetryMessage={
                                      message.role === "user"
                                        ? onRetryUserMessage
                                        : onRetryAssistantMessage
                                    }
                                    onDeleteMessage={handleDeleteMessage}
                                  />
                                )}
                              </div>
                            );
                          })}

                        {shouldShowLoadingSpinner && (
                          <div className="flex justify-start px-4 py-2">
                            <div className="flex items-center space-x-3">
                              <div className="animate-spin rounded-full h-5 w-5 border-2 border-transparent bg-gradient-tropical p-0.5">
                                <div className="rounded-full h-full w-full bg-background"></div>
                              </div>
                              <span className="text-sm text-muted-foreground">
                                Thinking...
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                      <div ref={messagesEndRef} />
                    </div>
                  </div>
                )}
              </div>

              {hasApiKeys && (
                <div className="flex-shrink-0 relative">
                  <ChatInput
                    ref={chatInputRef}
                    onSendMessage={handleSendMessage}
                    conversationId={conversationId}
                    hasExistingMessages={messages.length > 0}
                    isLoading={isLoading}
                    isStreaming={isStreaming}
                    onStop={onStopGeneration}
                    placeholder="Ask me anything..."
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {messages.length > 1 && (
        <ChatOutline messages={messages} onNavigate={handleOutlineNavigate} />
      )}

      {selection && (
        <EnhancedQuoteButton
          selectedText={selection.text}
          onQuote={handleQuoteSelection}
          rect={selection.rect}
          onLockSelection={lockSelection}
          onUnlockSelection={unlockSelection}
        />
      )}

      <ConfirmationDialog
        open={confirmationDialog.isOpen}
        onOpenChange={confirmationDialog.handleOpenChange}
        title={confirmationDialog.options.title}
        description={confirmationDialog.options.description}
        confirmText={confirmationDialog.options.confirmText}
        cancelText={confirmationDialog.options.cancelText}
        variant={confirmationDialog.options.variant}
        onConfirm={confirmationDialog.handleConfirm}
        onCancel={confirmationDialog.handleCancel}
      />
    </div>
  );
}
