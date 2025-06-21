"use client";

import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { useSidebar } from "@/hooks/use-sidebar";

interface ConversationGroupProps {
  title: string;
  children: ReactNode;
}

export function ConversationGroup({ title, children }: ConversationGroupProps) {
  const { isMobile } = useSidebar();

  return (
    <div className="space-y-2">
      <h3
        className={cn(
          "font-semibold text-muted-foreground uppercase tracking-wide",
          isMobile ? "text-sm px-4 py-1" : "text-xs px-4"
        )}
      >
        {title}
      </h3>
      <div className="space-y-1">{children}</div>
    </div>
  );
}
