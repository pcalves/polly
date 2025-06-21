"use client";

import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Settings, PanelLeft } from "lucide-react";
import { ParrotLogo } from "@/components/parrot-logo";
import Link from "next/link";
import { useUser } from "@/hooks/use-user";
import { ThemeToggle } from "@/components/ui/theme-toggle";

interface HeaderProps {
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
  isThinking?: boolean;
}

export function Header({
  isSidebarOpen,
  onToggleSidebar,
  isThinking = false,
}: HeaderProps) {
  const { user } = useUser();

  return (
    <header className="border-b border-border bg-background">
      <div className="flex h-14 items-center justify-between px-4">
        <div className="flex items-center gap-4">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={onToggleSidebar}
                title={isSidebarOpen ? "Hide sidebar" : "Show sidebar"}
                className="h-8 w-8 p-0"
              >
                <PanelLeft
                  className={`h-4 w-4 transition-transform duration-200 ${!isSidebarOpen ? "rotate-180" : ""}`}
                />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{isSidebarOpen ? "Hide sidebar" : "Show sidebar"}</p>
            </TooltipContent>
          </Tooltip>

          <div className="polly-container flex items-center gap-3 group cursor-pointer">
            <ParrotLogo size="lg" isThinking={isThinking} />
            <h1 className="polly-text text-xl leading-none">Polly</h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Settings button - only show for authenticated users */}
          {user && !user.isAnonymous && (
            <Link href="/settings">
              <Button variant="ghost" size="sm">
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
            </Link>
          )}

          {/* Theme toggle */}
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
