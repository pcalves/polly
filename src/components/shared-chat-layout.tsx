"use client";

import { Sidebar } from "@/components/sidebar";
import { UserProvider } from "@/providers/user-provider";

interface SharedChatLayoutProps {
  children: React.ReactNode;
}

export function SharedChatLayout({ children }: SharedChatLayoutProps) {
  return (
    <UserProvider>
      <Sidebar>
        <div className="flex-1 overflow-hidden">{children}</div>
      </Sidebar>
    </UserProvider>
  );
}
