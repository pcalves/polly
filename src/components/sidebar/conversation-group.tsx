"use client";

import { ReactNode } from "react";

interface ConversationGroupProps {
  title: string;
  children: ReactNode;
}

export function ConversationGroup({ title, children }: ConversationGroupProps) {
  return (
    <div className="mb-6">
      <h3 className="text-xs text-muted-foreground px-4 py-2">{title}</h3>
      <div className="space-y-1">{children}</div>
    </div>
  );
}
