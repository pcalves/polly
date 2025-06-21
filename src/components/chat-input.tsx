"use client";

import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";
import { ConvexFileDisplay } from "@/components/convex-file-display";
import { NotificationDialog } from "@/components/ui/notification-dialog";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { AIModel, Attachment } from "@/types";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useFileUpload } from "@/hooks/use-file-upload";
import { AttachmentList } from "@/components/chat-input/attachment-list";
import { InputControls } from "@/components/chat-input/input-controls";
import { Id } from "../../convex/_generated/dataModel";
import { useUser } from "@/hooks/use-user";
import { useCreateConversation } from "@/hooks/use-conversations";
import { useRouter } from "next/navigation";

interface ChatInputProps {
  onSendMessage?: (
    content: string,
    attachments?: Attachment[],
    useWebSearch?: boolean,
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

// Constants for shared styles
const WARNING_BANNER_CLASSES =
  "absolute -top-8 left-1/2 transform -translate-x-1/2 z-10";
const WARNING_CONTENT_CLASSES =
  "inline-flex items-center gap-2 p-2.5 rounded-md transition-all duration-200 text-xs shadow-lg";
const WARNING_BUTTON_CLASSES = "p-0.5 rounded transition-colors duration-150";

// Warning Banner Component
const WarningBanner = React.memo<{
  type: "warning" | "error";
  onDismiss?: () => void;
  children: React.ReactNode;
}>(({ type, onDismiss, children }) => {
  const isWarning = type === "warning";
  const colorClasses = isWarning
    ? "bg-amber-50 border border-amber-200 dark:bg-amber-900 dark:border-amber-800 text-amber-800 dark:text-amber-200"
    : "bg-red-50 border border-red-200 dark:bg-red-900 dark:border-red-800 text-red-800 dark:text-red-200";

  const buttonHoverClasses = isWarning
    ? "hover:bg-amber-100/50 dark:hover:bg-amber-800/50"
    : "hover:bg-red-100/50 dark:hover:bg-red-800/50";

  return (
    <div className={WARNING_BANNER_CLASSES}>
      <div className={cn(WARNING_CONTENT_CLASSES, colorClasses)}>
        <span>{children}</span>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className={cn(WARNING_BUTTON_CLASSES, buttonHoverClasses)}
            aria-label="Dismiss"
          >
            <X className="h-3.5 w-3.5 hover:opacity-80" />
          </button>
        )}
      </div>
    </div>
  );
});

WarningBanner.displayName = "WarningBanner";

export const ChatInput = React.memo(
  forwardRef<ChatInputRef, ChatInputProps>((props, ref) => {
    const hasEnabledModels = useQuery(api.userModels.hasUserModels, {});
    const selectedModel = useQuery(api.userModels.getUserSelectedModel, {});
    const hasApiKeys = useQuery(api.apiKeys.hasAnyApiKey, {});

    const [input, setInput] = useState("");
    const [previewFile, setPreviewFile] = useState<Attachment | null>(null);
    const [isLimitWarningDismissed, setIsLimitWarningDismissed] =
      useState(false);

    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const inputControlsRef = useRef<{ handleSubmit: () => void } | null>(null);

    const { user } = useUser();
    const { createNewConversationWithResponse } = useCreateConversation();
    const router = useRouter();

    const {
      messageCount,
      remainingMessages,
      hasMessageLimit,
      canSendMessage,
      isAnonymous,
      monthlyUsage,
      hasUserApiKeys,
      hasUnlimitedCalls,
    } = useUser();

    // Unified send function that handles both existing conversations and new ones
    const handleSend = useCallback(
      async (
        content: string,
        attachments?: Attachment[],
        useWebSearch?: boolean,
        personaId?: Id<"personas"> | null
      ) => {
        if (props.conversationId && props.onSendMessage) {
          // Existing conversation - use the provided handler
          props.onSendMessage(content, attachments, useWebSearch, personaId);
        } else {
          // New conversation - create one
          const conversationId = await createNewConversationWithResponse(
            content,
            undefined,
            personaId,
            user?._id,
            attachments,
            useWebSearch
          );
          if (conversationId) {
            router.push(`/chat/${conversationId}`);
          }
        }
      },
      [
        props.conversationId,
        props.onSendMessage,
        createNewConversationWithResponse,
        user?._id,
        router,
      ]
    );

    // Memoize current model to prevent unnecessary re-renders
    const currentModel = useMemo(() => {
      if (!selectedModel) return undefined;
      return {
        ...selectedModel,
        contextLength: selectedModel.contextLength,
        _id: selectedModel._id,
        _creationTime: selectedModel._creationTime,
        userId: selectedModel.userId,
      } as AIModel;
    }, [selectedModel]);

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
      conversationId: props.conversationId,
    });

    // Memoize placeholder text calculation
    const placeholderText = useMemo(() => {
      if (props.placeholder) return props.placeholder;

      if (!canSendMessage && hasMessageLimit) {
        if (isAnonymous) {
          return "Message limit reached. Sign in to continue chatting...";
        }
        return hasUserApiKeys
          ? "Monthly Polly model limit reached. Use BYOK models or wait for reset..."
          : "Monthly limit reached. Add API keys to use BYOK models...";
      }

      if (hasApiKeys === undefined || hasEnabledModels === undefined) {
        return "Loading...";
      }

      return "Ask me anything...";
    }, [
      props.placeholder,
      canSendMessage,
      hasMessageLimit,
      isAnonymous,
      hasUserApiKeys,
      hasApiKeys,
      hasEnabledModels,
    ]);

    // Memoize warning states
    const warningStates = useMemo(
      () => ({
        showLimitWarning:
          hasMessageLimit &&
          messageCount > 0 &&
          canSendMessage &&
          !isLimitWarningDismissed &&
          !hasUnlimitedCalls,
        showLimitReached:
          hasMessageLimit && !canSendMessage && !hasUnlimitedCalls,
      }),
      [
        hasMessageLimit,
        messageCount,
        canSendMessage,
        isLimitWarningDismissed,
        hasUnlimitedCalls,
      ]
    );

    // Memoize warning messages
    const warningMessages = useMemo(() => {
      const limitWarningMessage = isAnonymous ? (
        <>
          {remainingMessages} message{remainingMessages === 1 ? "" : "s"}{" "}
          remaining • Sign in for unlimited chats
        </>
      ) : hasUnlimitedCalls ? (
        "You have unlimited messages"
      ) : (
        <>
          {monthlyUsage?.remainingMessages || 0} monthly message
          {monthlyUsage?.remainingMessages === 1 ? "" : "s"} remaining •
          {hasUserApiKeys
            ? " Use BYOK models for unlimited chats"
            : " Add API keys for unlimited chats"}
        </>
      );

      const limitReachedMessage = isAnonymous ? (
        "Message limit reached. Sign in to continue chatting without limits."
      ) : (
        <>
          Monthly Polly model limit reached.
          {hasUserApiKeys
            ? " Use your BYOK models to continue chatting."
            : " Add API keys to access BYOK models."}
        </>
      );

      return { limitWarningMessage, limitReachedMessage };
    }, [
      isAnonymous,
      remainingMessages,
      hasUnlimitedCalls,
      monthlyUsage?.remainingMessages,
      hasUserApiKeys,
    ]);

    const clearInput = useCallback(() => {
      setInput("");
    }, []);

    const addQuote = useCallback((quote: string) => {
      setInput(prev => {
        const currentValue = prev.trim();
        return currentValue
          ? `${currentValue}\n\n${quote}\n\n`
          : `${quote}\n\n`;
      });

      setTimeout(() => {
        textareaRef.current?.focus();
        if (textareaRef.current) {
          const length = textareaRef.current.value.length;
          textareaRef.current.setSelectionRange(length, length);
        }
      }, 0);
    }, []);

    const handleSubmit = useCallback(() => {
      if (inputControlsRef.current?.handleSubmit) {
        inputControlsRef.current.handleSubmit();
      }
    }, []);

    const handleFormSubmit = useCallback(
      (e: React.FormEvent) => {
        e.preventDefault();
        handleSubmit();
      },
      [handleSubmit]
    );

    const handleKeyDown = useCallback(
      (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
          e.preventDefault();
          handleSubmit();
        }
      },
      [handleSubmit]
    );

    const handleDismissWarning = useCallback(() => {
      setIsLimitWarningDismissed(true);
    }, []);

    const handlePreviewFileClose = useCallback((open: boolean) => {
      if (!open) setPreviewFile(null);
    }, []);

    useImperativeHandle(
      ref,
      () => ({
        focus: () => textareaRef.current?.focus(),
        addQuote,
        setInput,
      }),
      [addQuote]
    );

    useEffect(() => {
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
        textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 100)}px`;
      }
    }, [input]);

    const prevMessageCountRef = useRef(messageCount);
    useEffect(() => {
      if (messageCount !== prevMessageCountRef.current) {
        setIsLimitWarningDismissed(false);
        prevMessageCountRef.current = messageCount;
      }
    }, [messageCount]);

    // Memoize form classes
    const formClasses = useMemo(
      () =>
        cn(
          "rounded-xl border p-3 shadow-lg ring-1 transition-all duration-300",
          canSendMessage
            ? "border-accent-emerald/30 bg-surface-primary ring-accent-emerald/10 hover:shadow-xl hover:ring-accent-emerald/20"
            : "border-border/30 bg-muted/50 ring-border/10"
        ),
      [canSendMessage]
    );

    // Memoize textarea classes
    const textareaClasses = useMemo(
      () =>
        cn(
          "w-full resize-none bg-transparent border-0 outline-none ring-0 focus:ring-0 text-sm leading-relaxed transition-opacity duration-200 min-h-[24px] max-h-[100px] overflow-y-auto",
          canSendMessage
            ? "placeholder:text-muted-foreground/60"
            : "placeholder:text-muted-foreground cursor-not-allowed"
        ),
      [canSendMessage]
    );

    return (
      <div className="px-6 pb-6 pt-2 relative">
        <div className="max-w-3xl mx-auto">
          {warningStates.showLimitWarning &&
            !warningStates.showLimitReached && (
              <WarningBanner type="warning" onDismiss={handleDismissWarning}>
                {warningMessages.limitWarningMessage}
              </WarningBanner>
            )}

          {warningStates.showLimitReached && (
            <WarningBanner type="error">
              {warningMessages.limitReachedMessage}
            </WarningBanner>
          )}

          <form onSubmit={handleFormSubmit}>
            <div className={formClasses}>
              <AttachmentList
                attachments={attachments}
                uploadProgress={uploadProgress}
                onRemoveAttachment={removeAttachment}
                onPreviewFile={setPreviewFile}
                canChat={canSendMessage}
              />

              <div className="flex items-end gap-3">
                <div className="flex-1 relative group">
                  <textarea
                    ref={textareaRef}
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={placeholderText}
                    disabled={props.isLoading || !canSendMessage}
                    rows={1}
                    className={textareaClasses}
                    style={{ fontFamily: "inherit" }}
                  />
                </div>
              </div>

              <InputControls
                ref={inputControlsRef}
                canChat={canSendMessage}
                isLoading={props.isLoading ?? false}
                isStreaming={props.isStreaming ?? false}
                selectedModel={selectedModel as AIModel | undefined}
                currentModel={currentModel}
                hasExistingMessages={props.hasExistingMessages ?? false}
                conversationId={props.conversationId}
                onStop={props.onStop}
                hasApiKeys={hasApiKeys ?? false}
                hasEnabledModels={hasEnabledModels ?? false}
                input={input}
                attachments={attachments}
                buildMessageContent={buildMessageContent}
                getBinaryAttachments={getBinaryAttachments}
                clearAttachments={clearAttachments}
                clearInput={clearInput}
                handleFileUpload={handleFileUpload}
                onSendMessage={handleSend}
                onInputStart={props.onInputStart}
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

        <Dialog open={!!previewFile} onOpenChange={handlePreviewFileClose}>
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
  })
);

ChatInput.displayName = "ChatInput";
