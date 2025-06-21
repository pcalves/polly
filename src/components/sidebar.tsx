"use client";

import { Button } from "@/components/ui/button";
import { SidebarSearch } from "@/components/sidebar/search";
import { ConversationList } from "@/components/sidebar/conversation-list";
import { ConversationListClient } from "@/components/sidebar/conversation-list-client";
import { UserSection } from "@/components/sidebar/user-section";
import { ConversationId } from "@/types";
import { Settings, Moon, Sun, PanelLeft } from "lucide-react";
import { ParrotLogo } from "@/components/parrot-logo";
import { cn } from "@/lib/utils";
import { useState, useEffect, useCallback } from "react";
import { useTheme } from "next-themes";
import { useThinking } from "@/providers/thinking-provider";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useUser } from "@/hooks/use-user";
import { Preloaded } from "convex/react";
import { api } from "../../convex/_generated/api";

const SIDEBAR_STORAGE_KEY = "sidebar-visible";

export function loadSidebarVisibility(): boolean {
  if (typeof window === "undefined") return true;

  try {
    const stored = localStorage.getItem(SIDEBAR_STORAGE_KEY);
    return stored !== null ? JSON.parse(stored) : true;
  } catch (error) {
    console.warn("Failed to load sidebar visibility from localStorage:", error);
    return true;
  }
}

export function saveSidebarVisibility(isVisible: boolean): void {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem(SIDEBAR_STORAGE_KEY, JSON.stringify(isVisible));
    // Dispatch custom event for same-tab updates
    window.dispatchEvent(new CustomEvent("sidebar-visibility-changed"));
  } catch (error) {
    console.warn("Failed to save sidebar visibility to localStorage:", error);
  }
}

interface SidebarProps {
  children?: React.ReactNode;
  preloadedConversations?: Preloaded<typeof api.conversations.list>;
}

export function Sidebar({ children, preloadedConversations }: SidebarProps) {
  const { isThinking } = useThinking();
  const [searchQuery, setSearchQuery] = useState("");
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [lastDesktopSidebarState, setLastDesktopSidebarState] = useState(true);
  const [isSidebarVisible, setIsSidebarVisible] = useState(true);
  const params = useParams();
  const currentConversationId = params.conversationId as ConversationId;
  const { user } = useUser();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setIsSidebarVisible(loadSidebarVisibility());
  }, []);

  useEffect(() => {
    if (currentConversationId && isMobile) {
      setIsSidebarVisible(false);
      saveSidebarVisibility(false);
    }
  }, [currentConversationId, isMobile]);

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 1024; // lg breakpoint
      const previouslyMobile = isMobile;
      setIsMobile(mobile);

      // Auto-collapse when transitioning to mobile
      if (mobile && !previouslyMobile) {
        // Save current desktop state before collapsing
        setLastDesktopSidebarState(isSidebarVisible);
        setIsSidebarVisible(false);
        saveSidebarVisibility(false);
      }
      // Auto-expand when transitioning to desktop
      else if (!mobile && previouslyMobile) {
        // Restore previous desktop state
        setIsSidebarVisible(lastDesktopSidebarState);
        saveSidebarVisibility(lastDesktopSidebarState);
      }
      // On initial load for mobile, default to closed unless explicitly opened
      else if (mobile && typeof window !== "undefined") {
        const stored = localStorage.getItem(SIDEBAR_STORAGE_KEY);
        if (stored === null) {
          setIsSidebarVisible(false);
        }
      }
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);

    return () => {
      window.removeEventListener("resize", checkMobile);
    };
  }, [isMobile, isSidebarVisible, lastDesktopSidebarState]);

  const handleToggleSidebar = useCallback(() => {
    const newVisibility = !isSidebarVisible;
    setIsSidebarVisible(newVisibility);
    saveSidebarVisibility(newVisibility);

    // Track desktop state when manually toggling on desktop
    if (!isMobile) {
      setLastDesktopSidebarState(newVisibility);
    }
  }, [isSidebarVisible, isMobile]);

  // Keyboard shortcut for toggling sidebar (CMD + B)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // CMD + B (Mac) or Ctrl + B (Windows/Linux)
      if ((e.metaKey || e.ctrlKey) && e.key === "b") {
        e.preventDefault();
        handleToggleSidebar();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleToggleSidebar]);

  const toggleTheme = useCallback(() => {
    setTheme(theme === "dark" ? "light" : "dark");
  }, [theme, setTheme]);

  const handleBackdropClick = useCallback(() => {
    if (isMobile && isSidebarVisible) {
      setIsSidebarVisible(false);
      saveSidebarVisibility(false);
    }
  }, [isMobile, isSidebarVisible]);

  return (
    <div className="h-screen flex relative">
      {/* Mobile backdrop overlay */}
      {isMobile && isSidebarVisible && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-30 lg:hidden"
          onClick={handleBackdropClick}
        />
      )}

      <div className="fixed left-4 top-4 z-50">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleToggleSidebar}
              className="h-8 w-8 p-0 transition-colors duration-150 bg-background/80 backdrop-blur-sm border border-border/40"
              title={isSidebarVisible ? "Collapse sidebar" : "Expand sidebar"}
            >
              <PanelLeft className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{isSidebarVisible ? "Collapse sidebar" : "Expand sidebar"}</p>
          </TooltipContent>
        </Tooltip>
      </div>

      <div
        className={cn(
          "sidebar-tinted flex-shrink-0 overflow-hidden fixed left-0 top-0 h-screen z-40",
          isSidebarVisible ? "w-80 opacity-100" : "w-0 opacity-0"
        )}
        style={{
          transition:
            "width 300ms cubic-bezier(0.4, 0, 0.2, 1), opacity 300ms cubic-bezier(0.4, 0, 0.2, 1)",
        }}
      >
        <div className="flex flex-col h-full w-80">
          {/* Header with logo and controls */}
          <div className="flex-shrink-0 sidebar-header-gradient">
            {/* Top spacing to align with header - matching the 64px header height and centering */}
            <div className="h-16 flex items-center px-6">
              {/* Left: Spacer for toggle button */}
              <div className="flex-shrink-0 w-8">
                {/* Empty space where toggle button would be */}
              </div>

              {/* Center: Logo */}
              <div className="flex-1 flex justify-center">
                <div className="polly-container flex items-center gap-2 group cursor-pointer">
                  <ParrotLogo size="md" isThinking={isThinking} />
                  <h1 className="polly-text text-xl leading-none">Polly</h1>
                </div>
              </div>

              {/* Right: Settings and theme toggle */}
              <div className="flex-shrink-0 flex items-center gap-0.5">
                {/* Settings button - only show for authenticated users */}
                {user && !user.isAnonymous && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Link href="/settings">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 transition-colors duration-150"
                        >
                          <Settings className="h-4 w-4" />
                        </Button>
                      </Link>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Settings</p>
                    </TooltipContent>
                  </Tooltip>
                )}

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={toggleTheme}
                      className="h-8 w-8 p-0 transition-colors duration-150"
                      title={
                        mounted
                          ? theme === "dark"
                            ? "Switch to light mode"
                            : "Switch to dark mode"
                          : undefined
                      }
                    >
                      {!mounted ? (
                        <Moon className="h-4 w-4" />
                      ) : theme === "dark" ? (
                        <Sun className="h-4 w-4" />
                      ) : (
                        <Moon className="h-4 w-4" />
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>
                      {mounted
                        ? theme === "dark"
                          ? "Switch to light mode"
                          : "Switch to dark mode"
                        : "Toggle theme"}
                    </p>
                  </TooltipContent>
                </Tooltip>
              </div>
            </div>

            <div className="px-6 pb-6 space-y-6">
              <div className="space-y-3">
                <div>
                  <Link href="/" className="block w-full">
                    <Button
                      variant="emerald"
                      className="w-full justify-center gap-2 h-9 text-sm transition-all duration-200 hover:scale-[1.02]"
                    >
                      New Chat
                    </Button>
                  </Link>
                </div>
              </div>

              {/* Search */}
              <SidebarSearch
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-2 min-h-0 scrollbar-thin">
            {preloadedConversations ? (
              <ConversationList
                searchQuery={searchQuery}
                currentConversationId={currentConversationId}
                preloadedConversations={preloadedConversations}
              />
            ) : (
              <ConversationListClient
                searchQuery={searchQuery}
                currentConversationId={currentConversationId}
              />
            )}
          </div>

          <UserSection />
        </div>
      </div>

      <div
        className={`
          flex-1 h-screen flex flex-col transition-all duration-300 ease-out
          ${
            isMobile
              ? "ml-0" // No margin on mobile (overlay)
              : isSidebarVisible
                ? "ml-80" // 320px sidebar width on desktop
                : "ml-0"
          }
        `}
      >
        {children}
      </div>
    </div>
  );
}
