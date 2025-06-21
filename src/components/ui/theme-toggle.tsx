"use client";

import { Button } from "@/components/ui/button";
import { Moon, Sun } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useTheme } from "@/hooks/use-theme";

interface ThemeToggleProps {
  size?: "sm" | "default" | "lg";
  variant?: "ghost" | "default" | "outline" | "secondary";
  className?: string;
}

export function ThemeToggle({
  size = "sm",
  variant = "ghost",
  className,
}: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme();

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant={variant}
          size={size}
          onClick={toggleTheme}
          className={cn(
            "h-8 w-8 p-0 transition-colors duration-150",
            className
          )}
          title={
            theme === "dark" ? "Switch to light mode" : "Switch to dark mode"
          }
        >
          {theme === "dark" ? (
            <Sun className="h-4 w-4" />
          ) : (
            <Moon className="h-4 w-4" />
          )}
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        <p>
          {theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
        </p>
      </TooltipContent>
    </Tooltip>
  );
}
