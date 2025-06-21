"use client";

import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
  forwardRef,
  useImperativeHandle,
} from "react";
import { X } from "lucide-react";
import { NotificationDialog } from "@/components/ui/notification-dialog";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Attachment } from "@/types";
import { cn } from "@/lib/utils";
import { useQuery, usePreloadedQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

import { ConvexFileDisplay } from "@/components/convex-file-display";
import { useFileUpload } from "@/hooks/use-file-upload";
import { AttachmentList } from "@/components/chat-input/attachment-list";
import { InputControls } from "@/components/chat-input/input-controls";
import { Id } from "../../convex/_generated/dataModel";
import { useUser } from "@/hooks/use-user";
import { useUserContext } from "@/providers/user-provider";

interface ChatInputProps {
  onSendMessage: (
    content: string,
    attachments?: Attachment[],
    useWebSearch?: boolean,
    personaId?: Id<"personas"> | null
  ) => void;
  onSendAsNewConversation?: (
    content: string,
    navigate: boolean,
    attachments?: Attachment[],
    contextSummary?: string,
    personaId?: Id<"personas"> | null
  ) => void;
  onInputStart?: () => void;
  isLoading?: boolean;
  isStreaming?: boolean;
  onStop?: () => void;
  placeholder?: string;
  conversationId?: string;
  hasExistingMessages?: boolean;
}

export interface ChatInputRef {
  focus: () => void;
  addQuote: (quote: string) => void;
  setInput: (text: string) => void;
}

// Split component for preloaded data
const ChatInputWithPreloadedData = forwardRef<ChatInputRef, ChatInputProps>(
  (props, ref) => {
    const userContext = useUserContext();

    // Use preloaded queries - these are safe because we know preloaded data exists
    const hasEnabledModels = usePreloadedQuery(
      userContext.preloadedUserModels!
    );
    const selectedModel = usePreloadedQuery(
      userContext.preloadedSelectedModel!
    );
    const hasApiKeys = usePreloadedQuery(userContext.preloadedApiKeys!);

    return (
      <ChatInputCore
        {...props}
        ref={ref}
        hasEnabledModels={hasEnabledModels}
        selectedModel={selectedModel}
        hasApiKeys={hasApiKeys}
      />
    );
  }
);

// Split component for query-based data
const ChatInputWithQuery = forwardRef<ChatInputRef, ChatInputProps>(
  (props, ref) => {
    // Use regular queries for fallback
    const hasEnabledModels = useQuery(api.userModels.hasUserModels, {});
    const selectedModel = useQuery(api.userModels.getUserSelectedModel, {});
    const hasApiKeys = useQuery(api.apiKeys.hasAnyApiKey, {});

    return (
      <ChatInputCore
        {...props}
        ref={ref}
        hasEnabledModels={hasEnabledModels}
        selectedModel={selectedModel}
        hasApiKeys={hasApiKeys}
      />
    );
  }
);

// Core component that contains all the logic
interface ChatInputCoreProps extends ChatInputProps {
  hasEnabledModels: boolean | undefined;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  selectedModel: any; // Type comes from getUserSelectedModel query - can be userModel or default model
  hasApiKeys: boolean | undefined;
}

const ChatInputCore = forwardRef<ChatInputRef, ChatInputCoreProps>(
  (
    {
      onSendMessage,
      onSendAsNewConversation,
      onInputStart,
      isLoading = false,
      isStreaming = false,
      onStop,
      placeholder = "Ask me anything...",
      conversationId,
      hasExistingMessages = false,
      hasEnabledModels,
      selectedModel,
      hasApiKeys,
    },
    ref
  ) => {
    const [input, setInput] = useState("");
    const [previewFile, setPreviewFile] = useState<Attachment | null>(null);
    const [isLimitWarningDismissed, setIsLimitWarningDismissed] =
      useState(false);

    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const inputControlsRef = useRef<{ handleSubmit: () => void } | null>(null);

    // User and message limit info
    const { messageCount, remainingMessages, hasMessageLimit, canSendMessage } =
      useUser();

    // Current model for capabilities checking
    const currentModel = selectedModel
      ? {
          ...selectedModel,
          contextLength: selectedModel.contextLength,
          _id: selectedModel._id,
          _creationTime: selectedModel._creationTime,
          userId: selectedModel.userId,
        }
      : undefined;

    // File upload hook
    const {
      attachments,
      uploadProgress,
      handleFileUpload,
      removeAttachment,
      clearAttachments,
      buildMessageContent,
      getBinaryAttachments,
      notificationDialog,
    } = useFileUpload({
      currentModel,
      conversationId,
    });

    // Clear input function
    const clearInput = useCallback(() => {
      setInput("");
    }, []);

    const addQuote = useCallback((quote: string) => {
      setInput(prev => {
        const currentValue = prev.trim();
        if (currentValue) {
          return `${currentValue}\n\n${quote}\n\n`;
        }
        return `${quote}\n\n`;
      });

      setTimeout(() => {
        textareaRef.current?.focus();
        if (textareaRef.current) {
          const length = textareaRef.current.value.length;
          textareaRef.current.setSelectionRange(length, length);
        }
      }, 0);
    }, []);

    useImperativeHandle(
      ref,
      () => ({
        focus: () => {
          textareaRef.current?.focus();
        },
        addQuote,
        setInput,
      }),
      [addQuote]
    );

    // Auto-resize textarea
    useEffect(() => {
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
        textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 100)}px`;
      }
    }, [input]);

    // Determine if user can chat - now only blocked by message limits
    const canChat = canSendMessage;

    // Handle form submission (Enter key)
    const handleFormSubmit = useCallback((e: React.FormEvent) => {
      e.preventDefault();
      if (inputControlsRef.current?.handleSubmit) {
        inputControlsRef.current.handleSubmit();
      }
    }, []);

    // Handle textarea key down for Shift+Enter behavior
    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        // Manually trigger form submission
        if (inputControlsRef.current?.handleSubmit) {
          inputControlsRef.current.handleSubmit();
        }
      }
      // Shift+Enter will naturally add a new line due to textarea behavior
    }, []);

    // Determine placeholder text
    let placeholderText = placeholder;
    if (!canSendMessage && hasMessageLimit) {
      placeholderText =
        "Message limit reached. Sign in to continue chatting...";
    } else if (hasApiKeys === undefined || hasEnabledModels === undefined) {
      placeholderText = "Loading...";
    }

    const showLimitWarning =
      hasMessageLimit &&
      messageCount > 0 &&
      canSendMessage &&
      !isLimitWarningDismissed;
    const showLimitReached = hasMessageLimit && !canSendMessage;

    // Reset dismissed state when messageCount changes (new message sent)
    const prevMessageCountRef = useRef(messageCount);
    useEffect(() => {
      if (messageCount !== prevMessageCountRef.current) {
        setIsLimitWarningDismissed(false);
        prevMessageCountRef.current = messageCount;
      }
    }, [messageCount]);

    return (
      <div className="p-6 relative">
        <div className="max-w-3xl mx-auto">
          {/* Message limit warning banner */}
          {showLimitWarning && !showLimitReached && (
            <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 z-10">
              <div className="inline-flex items-center gap-2 p-2.5 rounded-md bg-amber-50 border border-amber-200 dark:bg-amber-900 dark:border-amber-800 transition-all duration-200 text-xs text-amber-800 dark:text-amber-200 shadow-lg">
                <span>
                  {remainingMessages} message
                  {remainingMessages === 1 ? "" : "s"} remaining • Sign in for
                  unlimited chats
                </span>
                <button
                  onClick={() => setIsLimitWarningDismissed(true)}
                  className="p-0.5 hover:bg-amber-100/50 dark:hover:bg-amber-800/50 rounded transition-colors duration-150"
                  aria-label="Dismiss"
                >
                  <X className="h-3.5 w-3.5 hover:opacity-80" />
                </button>
              </div>
            </div>
          )}

          {/* Message limit reached banner */}
          {showLimitReached && (
            <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 z-10">
              <div className="inline-flex items-center gap-2 p-2.5 rounded-md bg-red-50 border border-red-200 dark:bg-red-900 dark:border-red-800 transition-all duration-200 text-xs text-red-800 dark:text-red-200 shadow-lg">
                <span>
                  Message limit reached. Sign in to continue chatting without
                  limits.
                </span>
              </div>
            </div>
          )}

          <form onSubmit={handleFormSubmit}>
            <div
              className={cn(
                "rounded-xl border p-3 shadow-lg ring-1 transition-all duration-300",
                canChat
                  ? "border-accent-emerald/30 bg-surface-primary ring-accent-emerald/10 hover:shadow-xl hover:ring-accent-emerald/20"
                  : "border-border/30 bg-muted/50 ring-border/10"
              )}
            >
              <AttachmentList
                attachments={attachments}
                uploadProgress={uploadProgress}
                onRemoveAttachment={removeAttachment}
                onPreviewFile={setPreviewFile}
                canChat={canChat}
              />

              <div className="flex items-end gap-3">
                <div className="flex-1 relative group">
                  <textarea
                    ref={textareaRef}
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={placeholderText}
                    disabled={isLoading || !canChat}
                    rows={1}
                    className={cn(
                      "w-full resize-none bg-transparent border-0 outline-none ring-0 focus:ring-0 text-sm leading-relaxed transition-opacity duration-200 min-h-[24px] max-h-[100px] overflow-y-auto",
                      canChat
                        ? "placeholder:text-muted-foreground/60"
                        : "placeholder:text-muted-foreground cursor-not-allowed"
                    )}
                    style={{
                      fontFamily: "inherit",
                    }}
                  />
                </div>
              </div>

              <InputControls
                ref={inputControlsRef}
                canChat={canChat}
                isLoading={isLoading}
                isStreaming={isStreaming}
                selectedModel={selectedModel}
                currentModel={currentModel}
                hasExistingMessages={hasExistingMessages}
                conversationId={conversationId}
                onStop={onStop}
                hasApiKeys={hasApiKeys}
                hasEnabledModels={hasEnabledModels}
                input={input}
                attachments={attachments}
                buildMessageContent={buildMessageContent}
                getBinaryAttachments={getBinaryAttachments}
                clearAttachments={clearAttachments}
                clearInput={clearInput}
                handleFileUpload={handleFileUpload}
                onSendMessage={onSendMessage}
                onSendAsNewConversation={onSendAsNewConversation}
                onInputStart={onInputStart}
              />
            </div>
          </form>
        </div>

        <NotificationDialog
          open={notificationDialog.isOpen}
          onOpenChange={notificationDialog.handleOpenChange}
          title={notificationDialog.options.title}
          description={notificationDialog.options.description}
          type={notificationDialog.options.type}
          actionText={notificationDialog.options.actionText}
          onAction={notificationDialog.handleAction}
        />

        {/* File Preview Dialog */}
        <Dialog
          open={!!previewFile}
          onOpenChange={open => !open && setPreviewFile(null)}
        >
          <DialogContent className="max-w-4xl max-h-[90vh] p-0">
            <div className="p-6">
              {previewFile && (
                <ConvexFileDisplay
                  attachment={previewFile}
                  className="flex justify-center"
                />
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    );
  }
);

ChatInputWithPreloadedData.displayName = "ChatInputWithPreloadedData";
ChatInputWithQuery.displayName = "ChatInputWithQuery";
ChatInputCore.displayName = "ChatInputCore";

// Main exported component that decides which variant to use
export const ChatInput = React.memo(
  forwardRef<ChatInputRef, ChatInputProps>((props, ref) => {
    const userContext = useUserContext();

    // Check if we have all preloaded data available
    const hasPreloadedData =
      userContext.preloadedUserModels &&
      userContext.preloadedSelectedModel &&
      userContext.preloadedApiKeys;

    if (hasPreloadedData) {
      return <ChatInputWithPreloadedData {...props} ref={ref} />;
    }

    return <ChatInputWithQuery {...props} ref={ref} />;
  })
);

ChatInput.displayName = "ChatInput";
