"use client";

import { memo, useMemo, useState, useCallback } from "react";
import { ChatMessage as ChatMessageType } from "@/types";
import { cn } from "@/lib/utils";

interface OutlineItem {
  id: string;
  messageId: string;
  text: string;
  preview: string;
  level: number;
  type: "message" | "heading";
  messageIndex: number;
}

interface ChatOutlineProps {
  messages: ChatMessageType[];
  onNavigate?: (messageId: string, headingId?: string) => void;
  className?: string;
  isSidebarVisible?: boolean;
}

function ChatOutlineComponent({ messages, onNavigate, className, isSidebarVisible = false }: ChatOutlineProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Function to strip markdown and get preview text
  const stripMarkdownAndPreview = (text: string, maxLength: number = 60): string => {
    if (!text) return "";
    
    // Remove markdown syntax
    const cleaned = text
      // Remove headers
      .replace(/^#{1,6}\s+/gm, '')
      // Remove bold/italic
      .replace(/\*\*(.+?)\*\*/g, '$1')
      .replace(/\*(.+?)\*/g, '$1')
      .replace(/__(.+?)__/g, '$1')
      .replace(/_(.+?)_/g, '$1')
      // Remove inline code
      .replace(/`(.+?)`/g, '$1')
      // Remove links
      .replace(/\[(.+?)\]\(.+?\)/g, '$1')
      // Remove line breaks and normalize whitespace
      .replace(/\n/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    
    if (cleaned.length <= maxLength) return cleaned;
    return cleaned.substring(0, maxLength).trim() + '...';
  };

  // Function to clean title text for display (more aggressive markdown removal)
  const cleanTitleText = (text: string): string => {
    if (!text) return "";
    
    return text
      // Remove all markdown syntax
      .replace(/^#{1,6}\s+/gm, '')
      .replace(/\*\*(.+?)\*\*/g, '$1')
      .replace(/\*(.+?)\*/g, '$1')
      .replace(/__(.+?)__/g, '$1')
      .replace(/_(.+?)_/g, '$1')
      .replace(/`(.+?)`/g, '$1')
      .replace(/\[(.+?)\]\(.+?\)/g, '$1')
      .replace(/!\[.*?\]\(.+?\)/g, '') // Remove images
      .replace(/~~(.+?)~~/g, '$1') // Remove strikethrough
      .replace(/\n/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  };

  const outlineItems = useMemo(() => {
    const items: OutlineItem[] = [];
    
    messages.forEach((message, messageIndex) => {
      // Add message entry with preview
      const messagePreview = stripMarkdownAndPreview(message.content || "");
      items.push({
        id: message.id,
        messageId: message.id,
        text: message.role === "user" ? "User" : "Assistant",
        preview: messagePreview,
        level: 0,
        type: "message",
        messageIndex
      });

      // Parse headings for assistant messages
      if (message.role === "assistant" && message.content) {
        const lines = message.content.split('\n');
        let inCodeBlock = false;

        lines.forEach((line) => {
          // Track code blocks to skip content inside them
          if (line.trim().startsWith('```')) {
            inCodeBlock = !inCodeBlock;
            return;
          }

          // Skip lines inside code blocks
          if (inCodeBlock) return;

          // Parse headings
          const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);
          if (headingMatch) {
            const level = headingMatch[1].length;
            const rawText = headingMatch[2].trim();
            const cleanText = cleanTitleText(rawText);
            const headingId = `${message.id}-heading-${rawText.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')}`;
            
            // Get preview text by looking for content after this heading
            let preview = "";
            const headingLineIndex = lines.findIndex(l => l === line);
            if (headingLineIndex !== -1) {
              // Look for content in the next few lines
              for (let i = headingLineIndex + 1; i < Math.min(headingLineIndex + 5, lines.length); i++) {
                const nextLine = lines[i].trim();
                if (nextLine && !nextLine.startsWith('#') && !nextLine.startsWith('```')) {
                  preview = stripMarkdownAndPreview(nextLine, 40);
                  break;
                }
              }
            }
            
            items.push({
              id: headingId,
              messageId: message.id,
              text: cleanText,
              preview: preview || stripMarkdownAndPreview(cleanText, 40),
              level,
              type: "heading",
              messageIndex
            });
          }
        });
      }
    });
    
    return items;
  }, [messages]);

  const handleItemClick = useCallback((item: OutlineItem) => {
    // Call the navigation callback
    const headingId = item.type === "heading" ? item.id : undefined;
    onNavigate?.(item.messageId, headingId);
  }, [onNavigate]);

  // Calculate dynamic height for collapsed state
  const visibleItems = outlineItems.slice(0, 12);
  const collapsedHeight = Math.max(80, visibleItems.length * 8 + 32); // 8px per item + 32px padding

  if (outlineItems.length === 0) {
    return null;
  }

  return (
    <div 
      className={cn(
        "fixed top-1/2 -translate-y-1/2 z-10 transition-all duration-300 ease-out",
        className
      )}
      style={{
        left: isSidebarVisible ? '340px' : '20px', // 320px sidebar + 20px margin when visible
        transition: 'left 300ms ease-out'
      }}
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => setIsExpanded(false)}
    >
      {/* Smooth morphing container - pill to rectangle */}
      <div 
        className="relative bg-background/95 backdrop-blur-md border border-border/50 shadow-xl transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] overflow-hidden"
        style={{
          width: isExpanded ? '320px' : '24px',
          height: isExpanded ? 'auto' : `${collapsedHeight}px`,
          maxHeight: isExpanded ? '70vh' : 'none',
          borderRadius: isExpanded ? '12px' : `${Math.min(collapsedHeight / 2, 12)}px`,
          transition: 'width 500ms cubic-bezier(0.34, 1.56, 0.64, 1), height 500ms cubic-bezier(0.34, 1.56, 0.64, 1), border-radius 500ms cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 500ms ease-out'
        }}
      >
        {/* Collapsed state: vertical pill with indicators */}
        <div className={cn(
          "absolute inset-0 flex flex-col items-center justify-center py-4 space-y-1.5 transition-all duration-200 ease-out",
          isExpanded ? "opacity-0 pointer-events-none scale-90" : "opacity-100 scale-100"
        )}>
          {visibleItems.map((item, index) => (
            <div
              key={`indicator-${item.id}`}
              className={cn(
                "w-1.5 rounded-full transition-all duration-200 hover:w-2 hover:scale-110",
                item.type === "message" 
                  ? "h-4 bg-primary/70 hover:bg-primary" 
                  : "bg-muted-foreground/50 hover:bg-muted-foreground/80",
                item.type === "heading" && item.level === 1 && "h-3",
                item.type === "heading" && item.level === 2 && "h-2.5",
                item.type === "heading" && item.level >= 3 && "h-2"
              )}
              style={{
                animationDelay: `${index * 30}ms`
              }}
              title={`${item.text}${item.preview ? ': ' + item.preview : ''}`}
            />
          ))}
          {outlineItems.length > 12 && (
            <div className="text-xs text-muted-foreground/40 mt-1 font-light">+{outlineItems.length - 12}</div>
          )}
        </div>

        {/* Expanded state: full outline */}
        <div className={cn(
          "transition-all ease-out",
          isExpanded 
            ? "opacity-100 scale-100 translate-x-0 duration-300 delay-300" 
            : "opacity-0 scale-95 translate-x-2 pointer-events-none duration-150"
        )}>
          {/* Scrollable content */}
          <div className="max-h-[70vh] overflow-y-auto">
            <div className="py-2">
              {outlineItems.map((item) => {
                const indentLevel = item.type === "heading" ? Math.min(item.level - 1, 4) : 0;
                
                return (
                  <button
                    key={item.id}
                    onClick={() => handleItemClick(item)}
                    className={cn(
                      "w-full text-left px-4 py-2.5 text-sm transition-all duration-150 hover:bg-muted/60 focus:bg-muted/60 focus:outline-none group/item",
                      "border-l-2 border-transparent hover:border-primary/30",
                      item.type === "message" && "font-medium"
                    )}
                    style={{
                      paddingLeft: `${16 + indentLevel * 14}px`
                    }}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="truncate text-foreground group-hover/item:text-foreground font-medium">
                        {item.text}
                      </div>
                      {item.preview && (
                        <div className="text-xs text-muted-foreground/70 mt-1 line-clamp-2 leading-relaxed">
                          {item.preview}
                        </div>
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
