"use client";

import { useRef, useEffect } from "react";
import { EnhancedMarkdown } from "@/components/ui/enhanced-markdown";
import { Spinner } from "@/components/spinner";

interface ReasoningProps {
  reasoning: string;
  isLoading: boolean;
  isExpanded: boolean;
  onToggle: () => void;
  tokenCount?: number;
}

export function Reasoning({
  reasoning,
  isLoading,
  isExpanded,
  onToggle,
  tokenCount,
}: ReasoningProps) {
  const contentRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom during loading
  useEffect(() => {
    const element = contentRef.current;
    if (!element || !isExpanded) {
      return;
    }

    const scrollToBottom = () => {
      element.scrollTop = element.scrollHeight;
    };

    // Scroll immediately when content changes or expansion happens
    scrollToBottom();

    if (isLoading) {
      const interval = setInterval(scrollToBottom, 100);
      return () => {
        clearInterval(interval);
      };
    }
  }, [reasoning, isExpanded, isLoading]);

  // Auto-expand when reasoning starts loading (only once per loading session)
  const hasAutoExpanded = useRef(false);
  
  useEffect(() => {
    if (isLoading && !isExpanded && !hasAutoExpanded.current) {
      hasAutoExpanded.current = true;
      onToggle();
    } else if (!isLoading) {
      hasAutoExpanded.current = false;
    }
  }, [isLoading, isExpanded, onToggle]);

  // Only render if we have reasoning content or are loading
  if (!reasoning && !isLoading) {
    return null;
  }

  // Don't render until we have actual reasoning content
  if (!reasoning.trim()) {
    return null;
  }

  return (
    <div className="mt-2 w-full">
      <button
        className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed group"
        disabled={isLoading}
        onClick={onToggle}
      >
        {/* Show spinner only when loading AND expanded */}
        {isLoading && isExpanded && (
          <div className="scale-75">
            <Spinner size="sm" />
          </div>
        )}
        <span className="flex items-center gap-1.5">
          {isExpanded ? (
            <>
              <svg
                className="w-4 h-4 transition-transform duration-200 group-hover:scale-110"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 15l7-7 7 7"
                />
              </svg>
              Hide reasoning
            </>
          ) : (
            <>
              <svg
                className="w-4 h-4 transition-transform duration-200 group-hover:scale-110"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
              Show reasoning
            </>
          )}
          {tokenCount && (
            <span className="ml-2 text-xs opacity-70">
              ({tokenCount} tokens)
            </span>
          )}
        </span>
      </button>

      {/* Container for content with transitions and loading animation */}
      <div
        className={`
          relative mt-2 border-l-2 border-muted/30 dark:border-l-muted/20
          pl-4 overflow-hidden transition-all duration-300 ease-in-out
          max-w-[calc(100%-25%)]
          ${
            isLoading
              ? isExpanded
                ? 'h-[150px] animate-pulse bg-muted/5'
                : 'h-0 opacity-0'
              : isExpanded
                ? 'h-auto opacity-100 translate-y-0'
                : 'h-0 opacity-0 -translate-y-2'
          }
        `}
      >
        {/* Inner scrollable content area */}
        <div
          ref={contentRef}
          className="
            relative h-full overflow-y-auto
            scrollbar-thin
            scroll-smooth
            py-3
            text-sm text-muted-foreground dark:text-muted-foreground/80
          "
        >
          <div
            className="prose prose-sm dark:prose-invert max-w-none break-words prose-p:text-muted-foreground prose-headings:text-muted-foreground"
            style={{
              wordBreak: 'break-word',
              overflowWrap: 'break-word',
              hyphens: 'auto',
            }}
          >
            <EnhancedMarkdown>{reasoning || ''}</EnhancedMarkdown>
            {/* Add a small spacer at the bottom for better scroll visibility */}
            {isLoading && <div className="h-4" />}
          </div>
        </div>

        {/* Gradient fades for scrolling content (only during loading) */}
        {isLoading && isExpanded && (
          <>
            {/* Top Fade */}
            <div
              className="absolute top-0 left-0 right-0 h-12 bg-gradient-to-t from-transparent via-background/50 to-background pointer-events-none z-10 opacity-100"
              aria-hidden="true"
            />
            {/* Bottom Fade */}
            <div
              className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-b from-transparent via-background/50 to-background pointer-events-none z-10 opacity-100"
              aria-hidden="true"
            />
          </>
        )}
      </div>
    </div>
  );
}
