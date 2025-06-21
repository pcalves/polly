"use client";

import { createPortal } from "react-dom";
import { Quote, MessageSquarePlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { ConversationStarterPopover } from "./conversation-starter-popover";

interface EnhancedQuoteButtonProps {
  selectedText: string;
  onQuote: () => void;
  rect: DOMRect;
  onLockSelection?: () => void;
  onUnlockSelection?: () => void;
  className?: string;
}

export function EnhancedQuoteButton({
  selectedText,
  onQuote,
  rect,
  onLockSelection,
  onUnlockSelection,
  className,
}: EnhancedQuoteButtonProps) {
  const [showConversationStarters, setShowConversationStarters] =
    useState(false);

  // Position the buttons above the selection
  const style = {
    position: "fixed" as const,
    top: rect.top - 60,
    left: rect.left + rect.width / 2 - 95, // Center both buttons
    zIndex: 1000,
  };

  const handleQuote = () => {
    onQuote();
  };

  const handleShowConversationStarters = (e?: React.MouseEvent) => {
    console.log("handleShowConversationStarters called", e?.type);
    e?.preventDefault();
    e?.stopPropagation();
    onLockSelection?.();
    setShowConversationStarters(true);
  };

  const handleCloseConversationStarters = () => {
    setShowConversationStarters(false);
    onUnlockSelection?.();
  };

  // Only render on client side
  if (typeof window === "undefined") {
    return null;
  }

  return (
    <>
      {createPortal(
        <div
          style={style}
          className={cn(
            "animate-in fade-in-0 zoom-in-95 duration-200",
            className
          )}
          data-conversation-starter="true"
        >
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={handleQuote}
              className="h-8 px-3 bg-gradient-to-br from-accent-coral to-accent-coral hover:from-accent-coral hover:to-accent-coral/90 text-white shadow-lg hover:shadow-xl border-0 transition-all duration-200"
            >
              <Quote className="h-3.5 w-3.5 mr-1.5" />
              Quote
            </Button>

            <ConversationStarterPopover
              selectedText={selectedText}
              open={showConversationStarters}
              onOpenChange={open => {
                if (open) {
                  handleShowConversationStarters();
                } else {
                  handleCloseConversationStarters();
                }
              }}
            >
              <Button
                size="sm"
                className="h-8 px-3 bg-gradient-to-br from-accent-purple to-accent-purple hover:from-accent-purple hover:to-accent-purple/90 text-white shadow-lg hover:shadow-xl border-0 transition-all duration-200"
                onClick={handleShowConversationStarters}
              >
                <MessageSquarePlus className="h-3.5 w-3.5 mr-1.5" />
                Explore
              </Button>
            </ConversationStarterPopover>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
