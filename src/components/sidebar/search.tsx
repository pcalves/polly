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
import { useState, useEffect, useRef } from "react";
import { useConversationSearch } from "@/hooks/use-conversation-search";
import { api } from "../../../convex/_generated/api";
import { useQuery } from "convex/react";
import { useUser } from "@/hooks/use-user";

interface SearchProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export function SidebarSearch({ searchQuery, onSearchChange }: SearchProps) {
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const { user } = useUser();
  const conversations = useQuery(
    api.conversations.list,
    user ? { userId: user._id } : "skip"
  );
  const filteredConversations = useConversationSearch(
    conversations ?? [],
    searchQuery
  );

  const clearSearch = () => {
    onSearchChange("");
    setIsSearchFocused(false);
  };

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

  const handleSearchFocus = () => {
    setIsSearchFocused(true);
  };

  const handleSearchBlur = () => {
    // Small delay to allow clicking on clear button
    setTimeout(() => {
      setIsSearchFocused(false);
    }, 100);
  };

  const isSearchActive = searchQuery.trim().length > 0;
  const totalResults = filteredConversations.length;

  return (
    <div className="space-y-2">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          ref={searchInputRef}
          placeholder="Search conversations"
          value={searchQuery}
          onChange={e => onSearchChange(e.target.value)}
          onFocus={handleSearchFocus}
          onBlur={handleSearchBlur}
          className={cn(
            "pl-10 pr-10 h-9 text-sm placeholder:text-muted-foreground/70 transition-all duration-200",
            "bg-background border border-border/50",
            isSearchFocused
              ? "border-accent-emerald/30 shadow-sm ring-1 ring-accent-emerald/10"
              : "hover:border-border hover:shadow-sm"
          )}
        />
        {searchQuery && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearSearch}
                className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 transition-colors duration-150"
              >
                <X className="h-3 w-3" />
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
        <div className="text-xs text-muted-foreground px-1 flex items-center gap-2">
          <MessageCircle className="h-3 w-3" />
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
