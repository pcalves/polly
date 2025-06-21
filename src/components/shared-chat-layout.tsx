"use client";

import { Sidebar } from "@/components/sidebar";
import { UserProvider } from "@/providers/user-provider";

interface SharedChatLayoutProps {
  children: React.ReactNode;
}

export function SharedChatLayout({ children }: SharedChatLayoutProps) {
  return (
    <UserProvider>
      <div className="flex h-screen w-full">
        <Sidebar />
        <main className="flex-1 min-w-0">{children}</main>
      </div>
    </UserProvider>
  );
}
