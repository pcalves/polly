"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Send,
  Square,
  ChevronDown,
  MessageSquarePlus,
  GitBranch,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SendButtonGroupProps {
  canSend: boolean;
  isStreaming: boolean;
  isLoading: boolean;
  isSummarizing: boolean;
  hasExistingMessages: boolean;
  conversationId?: string;
  onSend: () => void;
  onStop?: () => void;
  onSendAsNewConversation?: (navigate: boolean) => void;
  hasApiKeys?: boolean;
  hasEnabledModels?: boolean | null;
}

export function SendButtonGroup({
  canSend,
  isStreaming,
  isLoading,
  isSummarizing,
  hasExistingMessages,
  conversationId,
  onSend,
  onStop,
  onSendAsNewConversation,
  hasApiKeys,
  hasEnabledModels,
}: SendButtonGroupProps) {
  const showDropdown =
    hasExistingMessages &&
    conversationId &&
    onSendAsNewConversation &&
    canSend &&
    !isStreaming;

  return (
    <div className="flex items-center">
      {/* Send as new conversation dropdown */}
      {showDropdown && (
        <DropdownMenu>
          <Tooltip>
            <TooltipTrigger asChild>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={isLoading || isSummarizing}
                  className="h-8 w-8 p-0 rounded-l-lg rounded-r-none border border-accent-emerald bg-gradient-to-br from-accent-emerald/10 to-accent-emerald/5 hover:from-accent-emerald/20 hover:to-accent-emerald/10 dark:from-accent-emerald/20 dark:to-accent-emerald/10 dark:hover:from-accent-emerald/30 dark:hover:to-accent-emerald/20 text-accent-emerald transition-all duration-200"
                >
                  <ChevronDown className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
            </TooltipTrigger>
            <TooltipContent>
              <p>Send options</p>
            </TooltipContent>
          </Tooltip>
          <DropdownMenuContent align="end" className="w-64">
            <DropdownMenuItem
              onClick={() => onSendAsNewConversation?.(true)}
              disabled={isLoading || isSummarizing}
              className="flex items-center gap-2 cursor-pointer"
            >
              <MessageSquarePlus className="w-4 h-4" />
              <span className="text-sm font-medium">
                Send & open new conversation
              </span>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onSendAsNewConversation?.(false)}
              disabled={isLoading || isSummarizing}
              className="flex items-center gap-2 cursor-pointer"
            >
              <GitBranch className="w-4 h-4" />
              <span className="text-sm font-medium">
                Send to new conversation
              </span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}

      {/* Send/Stop button */}
      <Button
        type={isStreaming ? "button" : "submit"}
        onClick={isStreaming ? onStop : onSend}
        disabled={isStreaming ? !onStop : !canSend}
        size="sm"
        className={cn(
          "h-8 w-8 p-0 transition-all duration-200 shadow-sm",
          showDropdown ? "rounded-l-none rounded-r-lg" : "rounded-lg",
          isStreaming
            ? "bg-gradient-to-br from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 dark:from-red-600 dark:to-red-700 dark:hover:from-red-700 dark:hover:to-red-800 text-white shadow-lg hover:shadow-xl dark:shadow-red-900/40 dark:hover:shadow-red-900/60 border-0"
            : canSend
              ? "bg-gradient-to-br from-accent-emerald to-accent-emerald/90 hover:from-accent-emerald/90 hover:to-accent-emerald dark:from-accent-emerald dark:to-accent-emerald/90 dark:hover:from-accent-emerald/90 dark:hover:to-accent-emerald text-white shadow-lg hover:shadow-xl dark:shadow-emerald-900/40 dark:hover:shadow-emerald-900/60 border-0"
              : "bg-muted/50 text-muted-foreground/50 cursor-not-allowed dark:bg-muted/30 dark:text-muted-foreground/40"
        )}
        title={
          isStreaming
            ? "Stop generation"
            : hasApiKeys === false
              ? "Configure API keys to start chatting"
              : hasEnabledModels === false
                ? "Enable models in settings to start chatting"
                : undefined
        }
      >
        {isStreaming ? (
          <Square className="h-3.5 w-3.5 fill-current" />
        ) : isLoading || isSummarizing ? (
          <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
        ) : (
          <Send className="h-4 w-4" />
        )}
      </Button>
    </div>
  );
}
