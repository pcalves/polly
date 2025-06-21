"use client";

import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";
import { ConvexFileDisplay } from "@/components/convex-file-display";
import { NotificationDialog } from "@/components/ui/notification-dialog";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Attachment } from "@/types";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useFileUpload } from "@/hooks/use-file-upload";
import { AttachmentList } from "@/components/chat-input/attachment-list";
import { InputControls } from "@/components/chat-input/input-controls";
import { Id } from "../../convex/_generated/dataModel";
import { useUser } from "@/hooks/use-user";

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

    const { messageCount, remainingMessages, hasMessageLimit, canSendMessage } =
      useUser();

    const currentModel = selectedModel
      ? {
          ...selectedModel,
          contextLength: selectedModel.contextLength,
          _id: selectedModel._id,
          _creationTime: selectedModel._creationTime,
          userId: selectedModel.userId,
        }
      : undefined;

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

    useEffect(() => {
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
        textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 100)}px`;
      }
    }, [input]);

    const canChat = canSendMessage;

    const handleFormSubmit = useCallback((e: React.FormEvent) => {
      e.preventDefault();
      if (inputControlsRef.current?.handleSubmit) {
        inputControlsRef.current.handleSubmit();
      }
    }, []);

    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        if (inputControlsRef.current?.handleSubmit) {
          inputControlsRef.current.handleSubmit();
        }
      }
    }, []);

    let placeholderText = props.placeholder || "Ask me anything...";
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
                    disabled={props.isLoading || !canChat}
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
                isLoading={props.isLoading ?? false}
                isStreaming={props.isStreaming ?? false}
                selectedModel={selectedModel}
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
                onSendMessage={props.onSendMessage}
                onSendAsNewConversation={props.onSendAsNewConversation}
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
  })
);
