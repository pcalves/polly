"use client";

import { memo, useState } from "react";
import { EnhancedMarkdown } from "@/components/ui/enhanced-markdown";
import { cn, formatDate } from "@/lib/utils";
import { ChatMessage as ChatMessageType } from "@/types";
import { Copy, MoreHorizontal, Edit2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Reasoning } from "@/components/reasoning";

interface ChatMessageProps {
  message: ChatMessageType;
  isStreaming?: boolean;
  showReasoning?: boolean;
  onEditMessage?: (messageId: string, newContent: string) => void;
}

function ChatMessageComponent({ message, isStreaming = false, showReasoning = true, onEditMessage }: ChatMessageProps) {
  const isUser = message.role === "user";
  const [isReasoningExpanded, setIsReasoningExpanded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content);

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(message.content);
  };

  const toggleReasoning = () => {
    setIsReasoningExpanded(!isReasoningExpanded);
  };

  const handleEditStart = () => {
    setIsEditing(true);
    setEditContent(message.content);
  };

  const handleEditCancel = () => {
    setIsEditing(false);
    setEditContent(message.content);
  };

  const handleEditSave = () => {
    if (onEditMessage) {
      onEditMessage(message.id, editContent);
    }
    setIsEditing(false);
  };

  return (
    <div className="group w-full px-4 py-3">
      {isUser ? (
        <div className="flex justify-end">
          <div className="max-w-[70%] min-w-0">
            <div className="inline-block rounded-2xl px-4 py-3 bg-muted/40 text-foreground shadow-sm border border-border/50">
              {isEditing ? (
                <div className="space-y-3">
                  <textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className="w-full resize-none bg-transparent text-foreground border-none outline-none placeholder:text-muted-foreground text-base leading-relaxed whitespace-pre-wrap break-words"
                    placeholder="Edit your message..."
                    autoFocus
                    style={{ 
                      fontFamily: 'inherit',
                      height: 'auto',
                      minHeight: '1.5rem'
                    }}
                    onInput={(e) => {
                      const target = e.target as HTMLTextAreaElement;
                      target.style.height = 'auto';
                      target.style.height = target.scrollHeight + 'px';
                    }}
                  />
                  <div className="flex justify-end gap-1.5 pt-2 border-t border-border/20">
                    <button
                      onClick={handleEditCancel}
                      className="px-2 py-1 text-xs text-muted-foreground hover:text-foreground transition-colors rounded hover:bg-muted/30"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleEditSave}
                      className="px-2 py-1 text-xs bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors font-medium"
                    >
                      Save
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-base leading-relaxed whitespace-pre-wrap break-words">
                  {message.content}
                </div>
              )}

              {message.attachments && message.attachments.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {message.attachments.map((attachment, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs bg-background/30 text-muted-foreground border border-border/30"
                    >
                      <span>
                        {attachment.type === "image" ? "🖼️" : "📄"}
                      </span>
                      <span>{attachment.name}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {!isEditing && (
              <div className="flex items-center justify-end gap-2 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="text-xs text-muted-foreground">
                  {formatDate(message.createdAt)}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={copyToClipboard}
                  className="h-5 w-5 p-0 hover:bg-transparent text-muted-foreground hover:text-foreground"
                >
                  <Copy className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleEditStart}
                  className="h-5 w-5 p-0 hover:bg-transparent text-muted-foreground hover:text-foreground"
                >
                  <Edit2 className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-5 w-5 p-0 hover:bg-transparent text-muted-foreground hover:text-foreground"
                >
                  <MoreHorizontal className="h-3 w-3" />
                </Button>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="w-full">
          <div className="text-base leading-relaxed">
            <div className="prose prose-base max-w-none dark:prose-invert prose-p:leading-7">
              <EnhancedMarkdown 
                isStreaming={isStreaming}
              >
                {message.content}
              </EnhancedMarkdown>
            </div>
          </div>

          {message.attachments && message.attachments.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {message.attachments.map((attachment, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs bg-muted text-muted-foreground"
                >
                  <span>
                    {attachment.type === "image" ? "🖼️" : "📄"}
                  </span>
                  <span>{attachment.name}</span>
                </div>
              ))}
            </div>
          )}

          <div className="flex items-center justify-start gap-2 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <span className="text-xs font-medium text-muted-foreground">
              {message.model || "Assistant"}
            </span>
            <span className="text-xs text-muted-foreground">•</span>
            <span className="text-xs text-muted-foreground">
              {formatDate(message.createdAt)}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={copyToClipboard}
              className="h-5 w-5 p-0 hover:bg-transparent text-muted-foreground hover:text-foreground"
            >
              <Copy className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-5 w-5 p-0 hover:bg-transparent text-muted-foreground hover:text-foreground"
            >
              <MoreHorizontal className="h-3 w-3" />
            </Button>
          </div>
        </div>
      )}

      {/* Reasoning tokens display - outside message bubble for assistant */}
      {!isUser && showReasoning && (message.reasoning || isStreaming) && (
        <div className="mt-2">
          <Reasoning
            reasoning={message.reasoning || ""}
            isLoading={isStreaming && !message.reasoning}
            isExpanded={isReasoningExpanded}
            onToggle={toggleReasoning}
            tokenCount={message.metadata?.reasoningTokenCount}
          />
        </div>
      )}

      {message.metadata && (
        <div className={cn(
          "flex gap-4 text-xs mt-2 opacity-0 group-hover:opacity-100 transition-opacity",
          isUser ? "justify-end text-muted-foreground" : "text-muted-foreground"
        )}>
          {message.metadata.tokenCount && (
            <span>{message.metadata.tokenCount} tokens</span>
          )}
          {message.metadata.reasoningTokenCount && (
            <span>{message.metadata.reasoningTokenCount} reasoning tokens</span>
          )}
          {message.metadata.duration && (
            <span>{message.metadata.duration}ms</span>
          )}
        </div>
      )}
    </div>
  );
}

export const ChatMessage = memo(ChatMessageComponent);