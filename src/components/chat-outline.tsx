"use client";

import { memo, useCallback, useMemo, useState, useEffect } from "react";
import { ChatMessage as ChatMessageType } from "@/types";
import { User, Bot } from "lucide-react";
import { cn } from "@/lib/utils";

interface OutlineItem {
  id: string;
  messageId: string;
  text: string;
  preview: string;
  level: number;
  type: "user-message" | "assistant-section";
  messageIndex: number;
  parentMessageId?: string;
}

interface ChatOutlineProps {
  messages: ChatMessageType[];
  onNavigate?: (messageId: string, headingId?: string) => void;
  className?: string;
}

// Same storage key as sidebar component
const SIDEBAR_STORAGE_KEY = "sidebar-visible";

function loadSidebarVisibility(): boolean {
  if (typeof window === "undefined") return true;

  try {
    const stored = localStorage.getItem(SIDEBAR_STORAGE_KEY);
    return stored !== null ? JSON.parse(stored) : true;
  } catch (error) {
    console.warn("Failed to load sidebar visibility from localStorage:", error);
    return true;
  }
}

function ChatOutlineComponent({
  messages,
  onNavigate,
  className,
}: ChatOutlineProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isSidebarVisible, setIsSidebarVisible] = useState(true);

  // Handle responsive behavior
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024); // lg breakpoint
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Listen to sidebar visibility changes
  useEffect(() => {
    // Initial load
    setIsSidebarVisible(loadSidebarVisibility());

    // Listen for storage changes (when sidebar is toggled)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === SIDEBAR_STORAGE_KEY && e.newValue !== null) {
        try {
          setIsSidebarVisible(JSON.parse(e.newValue));
        } catch (error) {
          console.warn(
            "Failed to parse sidebar visibility from storage:",
            error
          );
        }
      }
    };

    // Listen for direct localStorage changes in the same tab
    const handleLocalStorageUpdate = () => {
      setIsSidebarVisible(loadSidebarVisibility());
    };

    window.addEventListener("storage", handleStorageChange);

    // Custom event for same-tab localStorage updates
    window.addEventListener(
      "sidebar-visibility-changed",
      handleLocalStorageUpdate
    );

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener(
        "sidebar-visibility-changed",
        handleLocalStorageUpdate
      );
    };
  }, []);

  // Function to strip markdown and get preview text
  const stripMarkdownAndPreview = (
    text: string,
    maxLength: number = 60
  ): string => {
    if (!text) return "";

    // Remove markdown syntax
    const cleaned = text
      // Remove headers
      .replace(/^#{1,6}\s+/gm, "")
      // Remove bold/italic
      .replace(/\*\*(.+?)\*\*/g, "$1")
      .replace(/\*(.+?)\*/g, "$1")
      .replace(/__(.+?)__/g, "$1")
      .replace(/_(.+?)_/g, "$1")
      // Remove inline code
      .replace(/`(.+?)`/g, "$1")
      // Remove links
      .replace(/\[(.+?)\]\(.+?\)/g, "$1")
      // Remove line breaks and normalize whitespace
      .replace(/\n/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    if (cleaned.length <= maxLength) return cleaned;
    return cleaned.substring(0, maxLength).trim() + "...";
  };

  // Function to clean title text for display (more aggressive markdown removal)
  const cleanTitleText = (text: string): string => {
    if (!text) return "";

    return (
      text
        // Remove all markdown syntax
        .replace(/^#{1,6}\s+/gm, "")
        .replace(/\*\*(.+?)\*\*/g, "$1")
        .replace(/\*(.+?)\*/g, "$1")
        .replace(/__(.+?)__/g, "$1")
        .replace(/_(.+?)_/g, "$1")
        .replace(/`(.+?)`/g, "$1")
        .replace(/\[(.+?)\]\(.+?\)/g, "$1")
        .replace(/!\[.*?\]\(.+?\)/g, "") // Remove images
        .replace(/~~(.+?)~~/g, "$1") // Remove strikethrough
        .replace(/\n/g, " ")
        .replace(/\s+/g, " ")
        .trim()
    );
  };

  // Generate outline items from messages
  const outlineItems = useMemo(() => {
    const items: OutlineItem[] = [];

    for (let i = 0; i < messages.length; i++) {
      const message = messages[i];

      if (message.role === "user") {
        items.push({
          id: message.id,
          messageId: message.id,
          text: stripMarkdownAndPreview(message.content || ""),
          preview: "",
          level: 0,
          type: "user-message",
          messageIndex: i,
        });

        const nextMessage = messages[i + 1];
        if (
          nextMessage &&
          nextMessage.role === "assistant" &&
          nextMessage.content
        ) {
          const lines = nextMessage.content.split("\n");
          let inCodeBlock = false;

          lines.forEach(line => {
            if (line.trim().startsWith("```")) {
              inCodeBlock = !inCodeBlock;
              return;
            }

            if (inCodeBlock) return;

            const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);
            if (headingMatch) {
              const level = headingMatch[1].length;
              const rawText = headingMatch[2].trim();
              const cleanText = cleanTitleText(rawText);
              const headingId = `${nextMessage.id}-heading-${rawText
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, "-")
                .replace(/^-+|-+$/g, "")}`;

              items.push({
                id: headingId,
                messageId: nextMessage.id,
                text: cleanText,
                preview: "",
                level,
                type: "assistant-section",
                messageIndex: i + 1,
                parentMessageId: message.id,
              });
            }
          });
        }
      }
    }

    return items;
  }, [messages]);

  const handleItemClick = useCallback(
    (item: OutlineItem) => {
      // Call the navigation callback
      const headingId = item.type === "assistant-section" ? item.id : undefined;
      onNavigate?.(item.messageId, headingId);
    },
    [onNavigate]
  );

  // Calculate dynamic height for collapsed state
  const visibleItems = outlineItems.slice(0, 12);
  const collapsedHeight = Math.max(80, visibleItems.length * 8 + 32); // 8px per item + 32px padding

  if (outlineItems.length <= 1) {
    return null;
  }

  // Calculate responsive positioning
  const getLeftPosition = () => {
    if (isMobile) {
      // On mobile, always position from the left edge since sidebar is overlay
      return "20px";
    } else {
      // On desktop, position based on actual sidebar visibility
      // 340px = 320px sidebar width + 20px margin when visible
      // 20px margin when hidden
      return isSidebarVisible ? "340px" : "20px";
    }
  };

  return (
    <div
      className={cn(
        "fixed top-1/2 -translate-y-1/2 z-10 transition-all duration-300 ease-out",
        className
      )}
      style={{
        left: getLeftPosition(),
        transition: "left 300ms ease-out",
      }}
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => setIsExpanded(false)}
    >
      {/* Smooth morphing container - pill to rectangle */}
      <div
        className="relative bg-background/95 backdrop-blur-md border border-border/50 shadow-xl transition-all duration-200 ease-out overflow-hidden"
        style={{
          width: isExpanded ? "360px" : "24px",
          height: isExpanded ? "auto" : `${collapsedHeight}px`,
          maxHeight: isExpanded ? "70vh" : "none",
          borderRadius: isExpanded
            ? "12px"
            : `${Math.min(collapsedHeight / 2, 12)}px`,
          transition:
            "width 200ms ease-out, height 200ms ease-out, border-radius 200ms ease-out, box-shadow 200ms ease-out",
        }}
      >
        {/* Collapsed state: vertical pill with indicators */}
        <div
          className={cn(
            "absolute inset-0 flex flex-col items-center justify-center py-4 space-y-1.5 transition-opacity ease-out",
            isExpanded
              ? "opacity-0 pointer-events-none duration-0"
              : "opacity-100 duration-150 delay-200"
          )}
        >
          {visibleItems.map(item => (
            <div
              key={`indicator-${item.id}`}
              className={cn(
                "w-1.5 rounded-full transition-all duration-200 hover:w-2",
                item.type === "user-message"
                  ? "h-4 bg-primary/70 hover:bg-primary"
                  : "bg-muted-foreground/50 hover:bg-muted-foreground/80",
                item.type === "assistant-section" && item.level === 1 && "h-3",
                item.type === "assistant-section" &&
                  item.level === 2 &&
                  "h-2.5",
                item.type === "assistant-section" && item.level >= 3 && "h-2"
              )}
              title={
                item.type === "user-message" ? `User: ${item.text}` : item.text
              }
            />
          ))}
          {outlineItems.length > 12 && (
            <div className="text-xs text-muted-foreground/40 mt-1 font-light">
              +{outlineItems.length - 12}
            </div>
          )}
        </div>

        {/* Expanded state: full outline */}
        <div
          className={cn(
            "transition-opacity ease-out",
            isExpanded
              ? "opacity-100 duration-150 delay-200"
              : "opacity-0 pointer-events-none duration-100"
          )}
        >
          {/* Scrollable content */}
          <div className="max-h-[70vh] overflow-y-auto">
            <div className="py-1.5">
              {outlineItems.map(item => {
                const indentLevel =
                  item.type === "assistant-section"
                    ? 1 + (item.level - 1) * 0.5
                    : 0;

                return (
                  <button
                    key={item.id}
                    onClick={() => handleItemClick(item)}
                    className={cn(
                      "w-full text-left transition-all duration-150 hover:bg-muted/60 focus:bg-muted/60 focus:outline-none group/item",
                      item.type === "user-message"
                        ? "px-3 py-2.5 border-l-2 border-transparent hover:border-primary/30 bg-muted/20"
                        : "px-3 py-1.5 hover:bg-muted/40"
                    )}
                    style={{
                      paddingLeft:
                        item.type === "assistant-section"
                          ? `${20 + indentLevel * 12}px`
                          : undefined,
                    }}
                  >
                    <div className="flex items-center gap-2.5 flex-1 min-w-0">
                      {item.type === "user-message" ? (
                        <>
                          <User className="w-4 h-4 text-primary flex-shrink-0" />
                          <div className="text-xs font-medium text-foreground line-clamp-2 leading-relaxed min-w-0">
                            {item.text}
                          </div>
                        </>
                      ) : (
                        <>
                          <Bot className="w-3.5 h-3.5 text-muted-foreground/60 flex-shrink-0" />
                          <div className="truncate text-muted-foreground/80 group-hover/item:text-muted-foreground text-xs">
                            {item.text}
                          </div>
                        </>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export const ChatOutline = memo(ChatOutlineComponent);
