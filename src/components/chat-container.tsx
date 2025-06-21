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
import { useChat } from "@/hooks/use-chat";
import { Attachment, ConversationId } from "@/types";
import { cn } from "@/lib/utils";
import { ChatZeroState } from "@/components/chat-zero-state";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useRouter } from "next/navigation";
import { useTextSelection } from "@/hooks/use-text-selection";
import { EnhancedQuoteButton } from "@/components/ui/enhanced-quote-button";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { useConfirmationDialog } from "@/hooks/use-confirmation-dialog";
import { ContextMessage } from "@/components/context-message";
import { useUser } from "@/hooks/use-user";
import { Id, Doc } from "../../convex/_generated/dataModel";

interface ChatContainerProps {
  conversationId?: ConversationId;
  conversation?: Doc<"conversations">;
  className?: string;
  hideInputWhenNoApiKeys?: boolean;
}

function ChatContainerComponent({
  conversationId,
  conversation: providedConversation,
  className,
  hideInputWhenNoApiKeys = false,
}: ChatContainerProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const chatInputRef = useRef<ChatInputRef>(null);
  const hasApiKeys = useQuery(api.apiKeys.hasAnyApiKey);
  const router = useRouter();
  const { selection, addQuoteToInput, lockSelection, unlockSelection } =
    useTextSelection();
  const confirmationDialog = useConfirmationDialog();

  // Track scrolling state for smooth animations
  const [isScrolling, setIsScrolling] = useState(false);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Get user and personas for persona lookup
  const userInfo = useUser();

  // Get conversation data to check for stored persona
  const queriedConversation = useQuery(
    api.conversations.getAuthorized,
    conversationId && !providedConversation
      ? { id: conversationId, userId: userInfo.user?._id }
      : "skip"
  );
  const conversation = providedConversation || queriedConversation;

  const personas = useQuery(
    api.personas.list,
    userInfo.user?._id ? { userId: userInfo.user._id } : "skip"
  );

  // Memoize empty callbacks to prevent useChat from re-initializing
  const onMessagesChange = useCallback(() => {}, []);
  const onError = useCallback(() => {}, []);
  const onConversationCreate = useCallback(
    (newConversationId: ConversationId) => {
      router.push(`/chat/${newConversationId}`);
    },
    [router]
  );

  const {
    messages,
    isLoading,
    isLoadingMessages,
    sendMessage,
    sendMessageToNewConversation,
    editMessage,
    retryUserMessage,
    retryAssistantMessage,
    stopGeneration,
    isStreaming,
    deleteMessage,
  } = useChat({
    conversationId,
    onMessagesChange,
    onError,
    onConversationCreate,
  });

  // Enhanced smooth scroll function with dynamic spacing
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

      // Clear any existing timeout
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }

      const attemptScroll = () => {
        const messageElement = document.getElementById(messageId);
        const container = messagesContainerRef.current;

        if (messageElement && container) {
          const containerRect = container.getBoundingClientRect();
          const messageRect = messageElement.getBoundingClientRect();

          // Calculate the ideal scroll position
          // We want the message to be visible with some breathing room
          const containerTop = containerRect.top;
          const messageTop = messageRect.top;
          const currentScrollTop = container.scrollTop;

          // Calculate the target scroll position
          // Position the message with the specified offset from the top
          const targetScrollTop =
            currentScrollTop + (messageTop - containerTop) - offset;

          // Use smooth scrolling with custom easing
          if (behavior === "smooth") {
            container.scrollTo({
              top: Math.max(0, targetScrollTop),
              behavior: "smooth",
            });

            // Set scrolling state to false after animation completes
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

      // Try immediate scroll first
      if (!attemptScroll()) {
        // If element not found (optimistic message DOM not ready), retry after a brief delay
        setTimeout(() => {
          if (!attemptScroll()) {
            // If still not found, scroll to bottom as fallback
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

  // Calculate dynamic bottom spacing based on viewport and content
  const dynamicBottomSpacing = useMemo(() => {
    if (typeof window === "undefined") return "pb-32";

    const viewportHeight = window.innerHeight;
    const bufferSpace = Math.min(viewportHeight * 0.3, 200); // 30% of viewport or 200px max

    return `pb-[${Math.max(bufferSpace, 80)}px]`;
  }, []);

  // Keep track of previous messages length to detect new messages
  const prevMessagesLengthRef = useRef(0);
  const prevLastUserMessageIdRef = useRef<string | null>(null);
  const isInitialLoadRef = useRef(true);

  useLayoutEffect(() => {
    // On initial load with existing messages, scroll to bottom once
    if (isInitialLoadRef.current && messages.length > 0 && !isLoading) {
      messagesEndRef.current?.scrollIntoView({ behavior: "auto" });
      isInitialLoadRef.current = false;
    }
    // Enhanced scroll behavior for new messages
    else if (messages.length > 0 && !isInitialLoadRef.current) {
      const lastMessage = messages[messages.length - 1];

      // Check if this is a new user message (not just a streaming update)
      if (
        lastMessage.role === "user" &&
        (messages.length > prevMessagesLengthRef.current ||
          lastMessage.id !== prevLastUserMessageIdRef.current)
      ) {
        // Use enhanced smooth scroll with dynamic offset
        smoothScrollToMessage(lastMessage.id, {
          behavior: "smooth",
          offset: 60, // Smaller offset for more natural positioning
          duration: 500,
        });
        prevLastUserMessageIdRef.current = lastMessage.id;
      }
    }

    prevMessagesLengthRef.current = messages.length;
  }, [messages, isLoading, smoothScrollToMessage]);

  // Cleanup timeout on unmount
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

      // For existing conversations, use the stored persona from the conversation
      // For new conversations, use the selected persona
      const effectivePersonaId = conversationId
        ? conversation?.personaId || null
        : personaId;

      // Get persona prompt if persona is selected
      const persona = effectivePersonaId
        ? personas?.find(p => p._id === effectivePersonaId)
        : null;
      const personaPrompt = persona?.prompt || null;

      sendMessage(
        content,
        attachments,
        useWebSearch,
        personaPrompt,
        effectivePersonaId
      );

      // Refocus the input after sending
      setTimeout(() => {
        chatInputRef.current?.focus();
      }, 0);
    },
    [sendMessage, hasApiKeys, personas, conversationId, conversation?.personaId]
  );

  const handleSendAsNewConversation = useCallback(
    async (
      content: string,
      navigate: boolean,
      attachments?: Attachment[],
      contextSummary?: string,
      personaId?: Id<"personas"> | null
    ) => {
      if (!hasApiKeys) {
        return;
      }

      // Get persona prompt if persona is selected
      const persona = personaId
        ? personas?.find(p => p._id === personaId)
        : null;
      const personaPrompt = persona?.prompt || null;

      // Use the new sendMessageToNewConversation function that supports both navigation scenarios
      await sendMessageToNewConversation(
        content,
        attachments,
        navigate,
        contextSummary,
        conversationId,
        personaPrompt,
        personaId
      );

      // Refocus the input after sending
      setTimeout(() => {
        chatInputRef.current?.focus();
      }, 0);
    },
    [sendMessageToNewConversation, hasApiKeys, conversationId, personas]
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

      // Use enhanced smooth scroll for outline navigation
      smoothScrollToMessage(messageId, {
        behavior: "smooth",
        offset: 100, // Larger offset for navigation
        duration: 400,
      });
    },
    [smoothScrollToMessage]
  );

  const handleQuickPrompt = useCallback((prompt: string) => {
    chatInputRef.current?.setInput(prompt);
    chatInputRef.current?.focus();
  }, []);

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
          await deleteMessage(messageId);
        }
      );
    },
    [messages, confirmationDialog, deleteMessage]
  );

  const isEmpty = messages.length === 0;
  const isLoadingConversation = conversationId && isLoadingMessages;

  // Determine if loading spinner should be shown
  const shouldShowLoadingSpinner = useMemo(() => {
    if (!isLoading || messages.length === 0) {
      return false;
    }

    // Get the last message
    const lastMessage = messages[messages.length - 1];

    // Show spinner only if:
    // 1. We're loading
    // 2. Last message is from user OR
    // 3. Last message is assistant but has no content and no reasoning yet OR
    // 4. Last message is assistant and still streaming (no finish reason)
    return (
      lastMessage?.role === "user" ||
      (lastMessage?.role === "assistant" &&
        ((!lastMessage.content && !lastMessage.reasoning) ||
          !lastMessage.metadata?.finishReason))
    );
  }, [isLoading, messages]);

  return (
    <div className={cn("flex h-full", className)}>
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
                  // Blank loading state for existing conversations
                  <div />
                ) : isEmpty ? (
                  <ChatZeroState onQuickPrompt={handleQuickPrompt} />
                ) : (
                  <div className={cn("p-8 space-y-4", dynamicBottomSpacing)}>
                    <div className="max-w-3xl mx-auto space-y-4">
                      {messages
                        .filter(message => {
                          // Never render system messages (they're internal instructions)
                          if (message.role === "system") {
                            return false;
                          }
                          // Only render assistant messages that have content (reasoning or response)
                          if (message.role === "assistant") {
                            return message.content || message.reasoning;
                          }
                          // Always render user and context messages
                          return true;
                        })
                        .sort((a, b) => {
                          // Always show context messages first
                          if (a.role === "context" && b.role !== "context")
                            return -1;
                          if (b.role === "context" && a.role !== "context")
                            return 1;
                          // For non-context messages, maintain original order
                          return 0;
                        })
                        .map((message, index, filteredMessages) => {
                          // A message is streaming if:
                          // 1. It's the last message in the filtered array
                          // 2. It's an assistant message
                          // 3. We're streaming
                          // 4. It has no finish reason in metadata
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
                                    message.role === "user"
                                      ? editMessage
                                      : undefined
                                  }
                                  onRetryMessage={
                                    message.role === "user"
                                      ? retryUserMessage
                                      : retryAssistantMessage
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
                )}
              </div>

              {(!hideInputWhenNoApiKeys || hasApiKeys) && (
                <div className="flex-shrink-0 relative">
                  <ChatInput
                    ref={chatInputRef}
                    onSendMessage={handleSendMessage}
                    onSendAsNewConversation={
                      conversationId ? handleSendAsNewConversation : undefined
                    }
                    conversationId={conversationId}
                    hasExistingMessages={messages.length > 0}
                    isLoading={isLoading}
                    isStreaming={isStreaming}
                    onStop={stopGeneration}
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

export const ChatContainer = React.memo(ChatContainerComponent);
