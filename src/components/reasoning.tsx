"use client";

import { useRef, useEffect, useState } from "react";
import { Spinner } from "@/components/spinner";
import Markdown from "react-markdown";

interface ReasoningProps {
  reasoning: string;
  isLoading: boolean;
}

export function Reasoning({ reasoning, isLoading }: ReasoningProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  // Auto-expand when streaming starts, auto-collapse when streaming ends
  useEffect(() => {
    if (isLoading) {
      setIsExpanded(true);
    } else {
      // Auto-collapse when streaming finishes
      setIsExpanded(false);
    }
  }, [isLoading]);

  // Simplified scroll effect
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

  // Only render if we have actual reasoning content
  if (!reasoning || !reasoning.trim()) {
    return null;
  }

  return (
    <div className="mt-2 w-full">
      <button
        className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-all duration-200 group"
        onClick={() => setIsExpanded(prev => !prev)}
      >
        {/* Show spinner only when loading AND expanded (or about to expand) */}
        {isLoading && isExpanded && (
          <div className="scale-75">
            <Spinner />
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
        </span>
      </button>

      {/* Container for content with transitions and loading animation */}
      <div
        className={`
          relative mt-2 border-l-2 border-muted/30 dark:border-l-muted/20
          pl-4 overflow-hidden transition-all duration-300 ease-in-out
          w-full
          ${
            isLoading
              ? isExpanded
                ? "h-[150px] bg-muted/5"
                : "h-0 opacity-0"
              : isExpanded
                ? "h-auto opacity-100 translate-y-0"
                : "h-0 opacity-0 -translate-y-2"
          }
        `}
      >
        {/* Inner scrollable content area */}
        <div
          ref={contentRef}
          className={`
            relative h-full overflow-y-auto
            scrollbar-none
            [-ms-overflow-style:none]
            [scrollbar-width:none]
            [&::-webkit-scrollbar]:hidden
            scroll-smooth
            py-3
            text-xs text-muted-foreground dark:text-muted-foreground/80
          `}
        >
          <div
            className="text-xs leading-relaxed text-muted-foreground/90 dark:text-muted-foreground/80 max-w-none break-words"
            style={{
              wordBreak: "break-word",
              overflowWrap: "break-word",
              hyphens: "auto",
            }}
          >
            <Markdown>{reasoning || ""}</Markdown>
            {/* Add a small spacer at the bottom for better scroll visibility */}
            {isLoading && <div className="h-4" />}
          </div>
        </div>

        {/* Gradient overlays for focus effect (only during loading) */}
        {isLoading && isExpanded && (
          <>
            {/* Top fade - text fades out going up */}
            <div
              className="absolute top-0 left-0 right-0 h-6 bg-gradient-to-b from-background via-background/60 to-transparent pointer-events-none z-10"
              aria-hidden="true"
            />
            {/* Bottom fade - text fades out going down */}
            <div
              className="absolute bottom-0 left-0 right-0 h-6 bg-gradient-to-t from-background via-background/60 to-transparent pointer-events-none z-10"
              aria-hidden="true"
            />
          </>
        )}
      </div>
    </div>
  );
}
