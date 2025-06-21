"use client";

import { Button } from "@/components/ui/button";
import { SidebarSearch } from "@/components/sidebar/search";
import { ConversationList } from "@/components/sidebar/conversation-list";
import { UserSection } from "@/components/sidebar/user-section";
import { ConversationId } from "@/types";
import { Settings, PanelLeft } from "lucide-react";

import { cn } from "@/lib/utils";
import { useState, useEffect, useCallback } from "react";

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useUser } from "@/hooks/use-user";
import { useSidebar } from "@/hooks/use-sidebar";

export function Sidebar() {
  const [searchQuery, setSearchQuery] = useState("");
  const { isSidebarVisible, toggleSidebar, isMobile, setSidebarVisible } =
    useSidebar();
  const params = useParams();
  const currentConversationId = params.conversationId as ConversationId;
  const { user } = useUser();

  useEffect(() => {
    if (currentConversationId && isMobile) {
      setSidebarVisible(false);
    }
  }, [currentConversationId, isMobile, setSidebarVisible]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "b") {
        e.preventDefault();
        toggleSidebar();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [toggleSidebar]);

  const handleBackdropClick = useCallback(() => {
    if (isMobile && isSidebarVisible) {
      setSidebarVisible(false);
    }
  }, [isMobile, isSidebarVisible, setSidebarVisible]);

  return (
    <div
      className={cn(
        "h-screen flex transition-width duration-300 ease-out",
        isMobile ? "fixed inset-0 w-0 z-30" : "relative",
        !isMobile && (isSidebarVisible ? "w-80" : "w-0")
      )}
    >
      {isMobile && isSidebarVisible && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-30 lg:hidden"
          onClick={handleBackdropClick}
        />
      )}

      <div
        className={cn("fixed left-4 top-4 z-50", isMobile && "left-3 top-3")}
      >
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleSidebar}
              className={cn(
                "transition-colors duration-150 bg-background/80 backdrop-blur-sm border border-border/40",
                isMobile ? "h-10 w-10 p-0 touch-manipulation" : "h-8 w-8 p-0"
              )}
              title={isSidebarVisible ? "Collapse sidebar" : "Expand sidebar"}
            >
              <PanelLeft className={cn(isMobile ? "h-5 w-5" : "h-4 w-4")} />
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
        suppressHydrationWarning
      >
        <div className="flex flex-col h-full w-80">
          <div className="flex-shrink-0 sidebar-header-gradient">
            <div
              className={cn(
                "grid grid-cols-3 items-center",
                isMobile ? "h-20 px-3" : "h-16 px-4"
              )}
            >
              <div className="flex justify-start">
                {/* Left spacer - intentionally empty for balance */}
              </div>

              <div className="flex justify-center">
                <div className="polly-container cursor-pointer">
                  <div className="flex items-center gap-2">
                    <div
                      className={cn(
                        "polly-logo-gradient-unified",
                        isMobile ? "w-7 h-7" : "w-6 h-6"
                      )}
                      style={{
                        maskImage: "url('/favicon.svg')",
                        maskSize: "contain",
                        maskRepeat: "no-repeat",
                        maskPosition: "center",
                        WebkitMaskImage: "url('/favicon.svg')",
                        WebkitMaskSize: "contain",
                        WebkitMaskRepeat: "no-repeat",
                        WebkitMaskPosition: "center",
                      }}
                    />
                    <h1
                      className={cn(
                        "leading-none font-bold polly-logo-text-unified",
                        isMobile ? "text-2xl" : "text-xl"
                      )}
                    >
                      Polly
                    </h1>
                  </div>
                </div>
              </div>

              <div className="flex justify-end items-center gap-0.5">
                {user && !user.isAnonymous && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Link href="/settings">
                        <Button
                          variant="ghost"
                          size="sm"
                          className={cn(
                            "transition-colors duration-150 touch-manipulation",
                            isMobile ? "h-10 w-10 p-0" : "h-8 w-8 p-0"
                          )}
                        >
                          <Settings
                            className={cn(isMobile ? "h-5 w-5" : "h-4 w-4")}
                          />
                        </Button>
                      </Link>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Settings</p>
                    </TooltipContent>
                  </Tooltip>
                )}

                <ThemeToggle />
              </div>
            </div>

            <div
              className={cn("space-y-6", isMobile ? "px-3 pb-8" : "px-4 pb-6")}
            >
              <div className="space-y-3">
                <div>
                  <Link href="/" className="block w-full">
                    <Button
                      variant="emerald"
                      className={cn(
                        "w-full justify-center gap-2 text-sm transition-all duration-200 hover:scale-[1.02] hover:shadow-lg touch-manipulation border border-accent-emerald/20",
                        isMobile ? "h-12 text-base font-medium" : "h-9"
                      )}
                    >
                      New Chat
                    </Button>
                  </Link>
                </div>
              </div>

              <SidebarSearch
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
              />
            </div>
          </div>

          <div
            className={cn(
              "flex-1 overflow-y-auto min-h-0 scrollbar-thin",
              isMobile ? "px-3" : "px-4"
            )}
          >
            <ConversationList
              searchQuery={searchQuery}
              currentConversationId={currentConversationId}
            />
          </div>

          <UserSection />
        </div>
      </div>
    </div>
  );
}
