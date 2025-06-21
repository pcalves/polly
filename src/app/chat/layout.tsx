"use client";

import { Header } from "@/components/header";
import { Sidebar } from "@/components/sidebar";
import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { ConversationId } from "@/types";

const SIDEBAR_STORAGE_KEY = "sidebar-visible";

function loadSidebarVisibility(): boolean {
  if (typeof window === "undefined") return true;
  
  try {
    const stored = localStorage.getItem(SIDEBAR_STORAGE_KEY);
    return stored !== null ? JSON.parse(stored) : true;
  } catch (error) {
    console.warn("Failed to load sidebar visibility from localStorage:", error);
    return true;
  }
}

function saveSidebarVisibility(isVisible: boolean): void {
  if (typeof window === "undefined") return;
  
  try {
    localStorage.setItem(SIDEBAR_STORAGE_KEY, JSON.stringify(isVisible));
  } catch (error) {
    console.warn("Failed to save sidebar visibility to localStorage:", error);
  }
}

export default function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Settings are now managed at the ChatInput level
  const [isSidebarVisible, setIsSidebarVisible] = useState(true);
  const params = useParams();
  const router = useRouter();

  // Load sidebar visibility on mount
  useEffect(() => {
    setIsSidebarVisible(loadSidebarVisibility());
  }, []);

  // Handle sidebar toggle
  const handleToggleSidebar = useCallback(() => {
    const newVisibility = !isSidebarVisible;
    setIsSidebarVisible(newVisibility);
    saveSidebarVisibility(newVisibility);
  }, [isSidebarVisible]);

  const handleNewConversation = useCallback(() => {
    router.push("/");
  }, [router]);

  const handleConversationSelect = useCallback((id: string) => {
    router.push(`/chat/${id}`);
  }, [router]);

  return (
    <div className="h-screen flex flex-col">
      <Header 
        isSidebarOpen={isSidebarVisible}
        onToggleSidebar={handleToggleSidebar}
      />
      <div className="flex-1 flex overflow-hidden">
        <Sidebar 
          currentConversationId={params.conversationId as ConversationId}
          onConversationSelect={handleConversationSelect}
          onNewConversation={handleNewConversation}
          isVisible={isSidebarVisible}
        />
        <div className="flex-1">
          {children}
        </div>
      </div>
    </div>
  );
}
