"use client";

import React from "react";
import { SharedChatLayout } from "@/components/shared-chat-layout";
import { ChatZeroState } from "@/components/chat-zero-state";

export default function HomePage() {
  return (
    <SharedChatLayout>
      <div className="h-full w-full min-w-0 overflow-hidden flex items-center justify-center sm:flex sm:items-center sm:justify-center">
        <div className="w-full max-w-3xl min-w-0 px-2 sm:px-4 lg:px-8 h-full sm:h-auto flex flex-col sm:block">
          <ChatZeroState />
        </div>
      </div>
    </SharedChatLayout>
  );
}
