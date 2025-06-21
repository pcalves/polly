"use client";

import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Globe } from "lucide-react";
import { cn } from "@/lib/utils";

interface WebSearchToggleProps {
  enabled?: boolean;
  onToggle: (enabled: boolean) => void;
  className?: string;
  noPill?: boolean;
}

export function WebSearchToggle({
  enabled = false,
  onToggle,
  className,
  noPill = false,
}: WebSearchToggleProps) {
  const handleToggle = () => {
    onToggle(!enabled);
  };

  if (noPill) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleToggle}
            className={cn(
              "h-auto w-auto p-0 hover:bg-transparent",
              enabled && "text-blue-600",
              className
            )}
          >
            <Globe className="h-3.5 w-3.5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <div className="text-sm font-medium">
            {enabled ? "Disable" : "Enable"} Search Grounding
          </div>
        </TooltipContent>
      </Tooltip>
    );
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleToggle}
          className={cn(
            "h-auto text-xs font-medium text-muted-foreground/80 hover:text-foreground group",
            enabled && "text-blue-600",
            className
          )}
        >
          <Globe className="h-3.5 w-3.5 text-muted-foreground group-hover:text-foreground transition-colors" />
          <span className="ml-1.5 text-xs font-medium text-muted-foreground group-hover:text-foreground transition-colors">
            Search
          </span>
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        <div className="text-sm font-medium">
          {enabled ? "Disable" : "Enable"} Search Grounding
        </div>
      </TooltipContent>
    </Tooltip>
  );
}
