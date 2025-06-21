"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Search, X, MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect, useRef, useCallback } from "react";
import { useConversationSearch } from "@/hooks/use-conversation-search";
import { api } from "../../../convex/_generated/api";
import { useQuery } from "convex/react";
import { useUser } from "@/hooks/use-user";
import { useSidebar } from "@/hooks/use-sidebar";

interface SearchProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export function SidebarSearch({ searchQuery, onSearchChange }: SearchProps) {
  const searchInputRef = useRef<HTMLInputElement>(null);
  const { user } = useUser();
  const { isMobile } = useSidebar();
  const conversations = useQuery(
    api.conversations.list,
    user ? { userId: user._id } : "skip"
  );
  const filteredConversations = useConversationSearch(
    conversations ?? [],
    searchQuery
  );

  const clearSearch = useCallback(() => {
    onSearchChange("");
  }, [onSearchChange]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd+K or Ctrl+K to focus search
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
      // Escape to clear search when search is focused
      if (
        e.key === "Escape" &&
        document.activeElement === searchInputRef.current
      ) {
        clearSearch();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [clearSearch]);

  const isSearchActive = searchQuery.trim().length > 0;
  const totalResults = filteredConversations.length;

  return (
    <div className="space-y-2">
      <div className="relative">
        <Search
          className={cn(
            "absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground",
            isMobile ? "h-5 w-5" : "h-4 w-4"
          )}
        />
        <Input
          ref={searchInputRef}
          placeholder="Search conversations"
          value={searchQuery}
          onChange={e => onSearchChange(e.target.value)}
          className={cn(
            "placeholder:text-muted-foreground/70 transition-all duration-200 bg-background border border-border/50 touch-manipulation",
            "focus:border-accent-emerald/30 focus:shadow-sm focus:ring-1 focus:ring-accent-emerald/10",
            "hover:border-border hover:shadow-sm",
            isMobile ? "pl-12 pr-12 h-12 text-base" : "pl-10 pr-10 h-9 text-sm"
          )}
        />
        {searchQuery && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearSearch}
                className={cn(
                  "absolute right-1 top-1/2 transform -translate-y-1/2 transition-colors duration-150 touch-manipulation",
                  isMobile ? "h-10 w-10 p-0" : "h-6 w-6 p-0"
                )}
              >
                <X className={cn(isMobile ? "h-4 w-4" : "h-3 w-3")} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Clear search</p>
            </TooltipContent>
          </Tooltip>
        )}
      </div>

      {/* Search results summary */}
      {isSearchActive && (
        <div
          className={cn(
            "text-muted-foreground px-1 flex items-center gap-2",
            isMobile ? "text-sm" : "text-xs"
          )}
        >
          <MessageCircle className={cn(isMobile ? "h-4 w-4" : "h-3 w-3")} />
          {totalResults === 0
            ? "No conversations found"
            : totalResults === 1
              ? "1 conversation found"
              : `${totalResults} conversations found`}
        </div>
      )}
    </div>
  );
}
