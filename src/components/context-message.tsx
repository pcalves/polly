"use client";

import React from "react";
import Link from "next/link";
import { ChatMessage } from "@/types";
import { ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ContextMessageProps {
  message: ChatMessage;
  className?: string;
}

export function ContextMessage({ message, className }: ContextMessageProps) {
  if (message.role !== "context") {
    return null;
  }

  return (
    <div
      className={cn(
        "w-full px-6 py-4 mb-6 border border-accent-coral/20 rounded-xl bg-gradient-to-br from-accent-coral/5 to-accent-cyan/5",
        className
      )}
    >
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <h4 className="text-sm font-medium text-accent-coral">
              Context from previous conversation
            </h4>
            {message.sourceConversationId && (
              <Link
                href={`/chat/${message.sourceConversationId}`}
                className="inline-flex"
              >
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 text-xs text-accent-coral/80 hover:text-accent-coral hover:bg-accent-coral/10"
                >
                  <ExternalLink className="w-3 h-3 mr-1" />
                  View original
                </Button>
              </Link>
            )}
          </div>

          <div className="text-sm text-muted-foreground leading-relaxed">
            {message.content}
          </div>
        </div>
      </div>
    </div>
  );
}
