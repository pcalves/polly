"use client";

import { createPortal } from "react-dom";
import { Quote } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface QuoteButtonProps {
  onQuote: () => void;
  rect: DOMRect;
  className?: string;
}

export function QuoteButton({ onQuote, rect, className }: QuoteButtonProps) {
  // Position the button above the selection
  const style = {
    position: "fixed" as const,
    top: rect.top - 45,
    left: rect.left + rect.width / 2 - 40, // Center the button
    zIndex: 1000,
  };

  // Only render on client side
  if (typeof window === "undefined") {
    return null;
  }

  return createPortal(
    <div
      style={style}
      className={cn("animate-in fade-in-0 zoom-in-95 duration-200", className)}
    >
      <Button
        size="sm"
        onClick={onQuote}
        className="h-8 px-3 bg-gradient-to-br from-accent-coral to-accent-coral/90 hover:from-accent-coral/90 hover:to-accent-coral text-white shadow-lg hover:shadow-xl border-0 transition-all duration-200 hover:scale-105"
      >
        <Quote className="h-3.5 w-3.5 mr-1.5" />
        Quote
      </Button>
    </div>,
    document.body
  );
}
