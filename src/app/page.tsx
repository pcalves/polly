"use client";

import React from "react";
import { SharedChatLayout } from "@/components/shared-chat-layout";
import { ChatZeroState } from "@/components/chat-zero-state";

export default function HomePage() {
  return (
    <SharedChatLayout>
      <div className="flex h-full">
        <div className="flex-1 flex flex-col relative h-full overflow-hidden">
          <div className="flex-1 overflow-hidden">
            <div className="h-full flex flex-col relative overflow-hidden">
              <div className="relative z-10 flex flex-col h-full">
                <div className="flex-1 overflow-y-auto overflow-x-hidden">
                  <ChatZeroState />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </SharedChatLayout>
  );
}
