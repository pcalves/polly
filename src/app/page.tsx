"use client";

import React from "react";
import { SharedChatLayout } from "@/components/shared-chat-layout";
import { ChatZeroState } from "@/components/chat-zero-state";

export default function HomePage() {
  return (
    <SharedChatLayout>
      <div className="h-full w-full flex items-center justify-center">
        <ChatZeroState />
      </div>
    </SharedChatLayout>
  );
}
