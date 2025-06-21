"use client";

import React, { memo, useState, useCallback } from "react";
import { ConvexFileDisplay } from "@/components/convex-file-display";
import { EnhancedMarkdown } from "@/components/ui/enhanced-markdown";
import { cn } from "@/lib/utils";
import { ChatMessage as ChatMessageType } from "@/types";
import { Copy, Edit2, Check, RotateCcw, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Reasoning } from "@/components/reasoning";
import { Citations } from "@/components/citations";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ChatMessageProps {
  message: ChatMessageType;
  isStreaming?: boolean;
  onEditMessage?: (messageId: string, newContent: string) => void;
  onRetryMessage?: (messageId: string) => void;
  onDeleteMessage?: (messageId: string) => void;
}

interface ActionButtonProps {
  icon: React.ReactNode;
  tooltip: string;
  onClick: () => void;
  disabled?: boolean;
  title?: string;
}

const ActionButton = memo(
  ({ icon, tooltip, onClick, disabled, title }: ActionButtonProps) => (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClick}
          className="h-8 w-8 p-0 transition-all duration-200 hover:scale-110"
          disabled={disabled}
          title={title}
        >
          {icon}
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        <p>{tooltip}</p>
      </TooltipContent>
    </Tooltip>
  )
);

ActionButton.displayName = "ActionButton";

interface MessageActionsProps {
  isUser: boolean;
  isStreaming: boolean;
  isEditing?: boolean;
  isCopied: boolean;
  isRetrying: boolean;
  isDeleting: boolean;
  copyToClipboard: () => void;
  onEditMessage?: () => void;
  onRetryMessage?: () => void;
  onDeleteMessage?: () => void;
  model?: string;
  className?: string;
}

const MessageActions = memo(
  ({
    isUser,
    isStreaming,
    isEditing = false,
    isCopied,
    isRetrying,
    isDeleting,
    copyToClipboard,
    onEditMessage,
    onRetryMessage,
    onDeleteMessage,
    model,
    className,
  }: MessageActionsProps) => {
    if (isStreaming) return null;

    const containerClassName = cn(
      "flex items-center gap-2 mt-3 opacity-0 group-hover:opacity-100 translate-y-1 group-hover:translate-y-0 transition-all duration-300 ease-out",
      isUser && isEditing && "opacity-0 pointer-events-none translate-y-2",
      isUser && "justify-end mt-2",
      className
    );

    return (
      <div className={containerClassName}>
        <div className="flex items-center gap-1">
          <ActionButton
            icon={
              isCopied ? (
                <Check className="h-3.5 w-3.5" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )
            }
            tooltip="Copy message"
            onClick={copyToClipboard}
            disabled={isEditing}
          />

          {onEditMessage && (
            <ActionButton
              icon={<Edit2 className="h-3.5 w-3.5" />}
              tooltip="Edit message"
              onClick={onEditMessage}
              disabled={isEditing}
            />
          )}

          {onRetryMessage && (
            <ActionButton
              icon={
                <RotateCcw
                  className={`h-3.5 w-3.5 ${isRetrying ? "animate-spin-reverse" : ""}`}
                />
              }
              tooltip={
                isUser ? "Retry from this message" : "Retry this response"
              }
              onClick={onRetryMessage}
              disabled={isEditing || isRetrying || isStreaming}
              title={isUser ? "Retry from this message" : "Retry this response"}
            />
          )}

          {onDeleteMessage && (
            <ActionButton
              icon={<Trash2 className="h-3.5 w-3.5" />}
              tooltip="Delete message"
              onClick={onDeleteMessage}
              disabled={isEditing || isDeleting || isStreaming}
              title="Delete message"
            />
          )}
        </div>

        {!isUser && (
          <>
            <span className="text-xs text-muted-foreground/70">•</span>
            <span className="text-xs text-muted-foreground/70">
              {model || "Assistant"}
            </span>
            {isStreaming && (
              <>
                <span className="text-xs text-muted-foreground/70">•</span>
                <div className="flex items-center gap-1.5">
                  <div className="flex space-x-1">
                    <div className="w-1 h-1 bg-primary rounded-full typing-dot"></div>
                    <div className="w-1 h-1 bg-primary rounded-full typing-dot"></div>
                    <div className="w-1 h-1 bg-primary rounded-full typing-dot"></div>
                  </div>
                  <span className="text-xs text-accent-emerald">
                    Thinking...
                  </span>
                </div>
              </>
            )}
          </>
        )}
      </div>
    );
  }
);

MessageActions.displayName = "MessageActions";

function ChatMessageComponent({
  message,
  isStreaming = false,
  onEditMessage,
  onRetryMessage,
  onDeleteMessage,
}: ChatMessageProps) {
  const isUser = message.role === "user";
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content);
  const [isCopied, setIsCopied] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const reasoning = message.reasoning;
  const displayContent = message.content;

  const copyToClipboard = useCallback(async () => {
    await navigator.clipboard.writeText(message.content);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  }, [message.content]);

  const handleEditStart = useCallback(() => {
    setIsEditing(true);
    setEditContent(message.content);
  }, [message.content]);

  const handleEditCancel = useCallback(() => {
    setIsEditing(false);
    setEditContent(message.content);
  }, [message.content]);

  const handleEditSave = useCallback(() => {
    if (onEditMessage) {
      onEditMessage(message.id, editContent);
    }
    setIsEditing(false);
  }, [onEditMessage, message.id, editContent]);

  const handleRetry = useCallback(async () => {
    if (onRetryMessage && !isRetrying) {
      setIsRetrying(true);
      try {
        await onRetryMessage(message.id);
      } finally {
        setIsRetrying(false);
      }
    }
  }, [onRetryMessage, message.id, isRetrying]);

  const handleDelete = useCallback(async () => {
    if (onDeleteMessage && !isDeleting) {
      setIsDeleting(true);
      try {
        await onDeleteMessage(message.id);
      } finally {
        setIsDeleting(false);
      }
    }
  }, [onDeleteMessage, message.id, isDeleting]);

  const renderAttachments = useCallback(
    (
      attachments: typeof message.attachments,
      variant: "user" | "assistant" = "user"
    ) => {
      if (!attachments?.length) return null;

      if (variant === "user") {
        return (
          <div className="mt-2 space-y-2">
            {attachments.map((attachment, index) => (
              <ConvexFileDisplay
                key={index}
                attachment={attachment}
                className="mb-2"
              />
            ))}
          </div>
        );
      }

      return (
        <div className="flex flex-wrap gap-2 mt-3">
          {attachments.map((attachment, index) => (
            <div
              key={index}
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm bg-muted"
            >
              <span>{attachment.type === "image" ? "🖼️" : "📄"}</span>
              <span>{attachment.name}</span>
            </div>
          ))}
        </div>
      );
    },
    [message.attachments]
  );

  return (
    <div
      className={cn(
        "group w-full px-6 py-4 transition-colors",
        "bg-transparent"
      )}
      data-message-role={message.role}
    >
      {isUser ? (
        <div className="flex justify-end">
          <div
            className={cn(
              "min-w-0 transition-all duration-300 ease-out",
              isEditing ? "w-[600px]" : "max-w-[90%] sm:max-w-[85%]"
            )}
          >
            <div
              className={cn(
                "w-full transition-all duration-300 ease-out transform",
                isEditing
                  ? "rounded-xl border border-accent-emerald/30 bg-background/95 backdrop-blur-sm p-5 shadow-lg ring-1 ring-accent-emerald/10"
                  : "inline-block rounded-xl px-4 py-3 bg-muted/50 border border-border text-foreground shadow-sm hover:shadow-md hover:border-accent-emerald/30"
              )}
            >
              {isEditing ? (
                <div className="space-y-4">
                  <textarea
                    value={editContent}
                    onChange={e => setEditContent(e.target.value)}
                    className="w-full resize-none bg-transparent text-foreground border-0 outline-none ring-0 focus:ring-0 text-sm leading-relaxed placeholder:text-muted-foreground/60 transition-opacity duration-200"
                    placeholder="Edit your message..."
                    autoFocus
                    style={{
                      fontFamily: "inherit",
                      height: "auto",
                      minHeight: "3rem",
                    }}
                    onInput={e => {
                      const target = e.target as HTMLTextAreaElement;
                      target.style.height = "auto";
                      target.style.height = target.scrollHeight + "px";
                    }}
                  />
                  <div className="flex justify-end gap-3 transform transition-all duration-200 translate-y-0 opacity-100">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleEditCancel}
                      className="px-5 py-2 text-sm bg-background border-border/60 transition-all duration-200 hover:scale-105"
                    >
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleEditSave}
                      className="px-5 py-2 text-sm bg-accent-emerald text-white shadow-md hover:shadow-lg transition-all duration-200 hover:scale-105"
                    >
                      Save
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="transition-all duration-300 ease-out whitespace-pre-wrap break-words">
                  {displayContent}
                  {renderAttachments(message.attachments, "user")}
                </div>
              )}
            </div>

            <MessageActions
              isUser={true}
              isStreaming={isStreaming}
              isEditing={isEditing}
              isCopied={isCopied}
              isRetrying={isRetrying}
              isDeleting={isDeleting}
              copyToClipboard={copyToClipboard}
              onEditMessage={onEditMessage ? handleEditStart : undefined}
              onRetryMessage={onRetryMessage ? handleRetry : undefined}
              onDeleteMessage={onDeleteMessage ? handleDelete : undefined}
            />
          </div>
        </div>
      ) : (
        <div className="w-full">
          <div className="flex-1 min-w-0">
            {(reasoning || isStreaming) && (
              <div className="mb-4">
                <Reasoning
                  reasoning={reasoning || ""}
                  isLoading={isStreaming}
                />
              </div>
            )}

            <div className="prose prose-sm max-w-none dark:prose-invert">
              <EnhancedMarkdown
                isStreaming={isStreaming}
                messageId={message.id}
              >
                {displayContent}
              </EnhancedMarkdown>
            </div>

            {message.citations && message.citations.length > 0 && (
              <div className="mt-4">
                <Citations citations={message.citations} compact />
              </div>
            )}

            {message.metadata?.stopped && (
              <div className="mt-3 px-3 py-2 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800/30 rounded-lg">
                <div className="flex items-center gap-2 text-sm text-yellow-800 dark:text-yellow-200">
                  <span className="font-medium">
                    {displayContent.trim()
                      ? "Generation stopped by user"
                      : "Generation stopped before any content was generated"}
                  </span>
                </div>
              </div>
            )}

            {renderAttachments(message.attachments, "assistant")}

            <MessageActions
              isUser={false}
              isStreaming={isStreaming}
              isCopied={isCopied}
              isRetrying={isRetrying}
              isDeleting={isDeleting}
              copyToClipboard={copyToClipboard}
              onRetryMessage={onRetryMessage ? handleRetry : undefined}
              onDeleteMessage={onDeleteMessage ? handleDelete : undefined}
              model={message.model}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export const ChatMessage = memo(ChatMessageComponent);
