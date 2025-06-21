"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ApiKeyDialog } from "@/components/api-key-dialog";
import { Moon, Sun, Settings, MessageSquare, PanelLeft } from "lucide-react";
import { useTheme } from "next-themes";

interface HeaderProps {
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
}

export function Header({ isSidebarOpen, onToggleSidebar }: HeaderProps) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  return (
    <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleSidebar}
            title={isSidebarOpen ? "Hide sidebar" : "Show sidebar"}
          >
            <PanelLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-2">
            <MessageSquare className="h-6 w-6" />
            <h1 className="text-xl font-semibold">Boss Chat</h1>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <ApiKeyDialog>
            <Button variant="outline" size="sm">
              <Settings className="h-4 w-4 mr-2" />
              API Keys
            </Button>
          </ApiKeyDialog>

          <Button
            variant="outline"
            size="sm"
            onClick={toggleTheme}
          >
            {!mounted ? (
              <Moon className="h-4 w-4" />
            ) : theme === "dark" ? (
              <Sun className="h-4 w-4" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </header>
  );
}