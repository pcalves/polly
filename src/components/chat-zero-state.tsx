"use client";

import { CheckCircle2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image";
import { PromptsTicker } from "./prompts-ticker";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useUser } from "@/hooks/use-user";
import { User } from "@/types";
import { ChatInput, ChatInputRef } from "./chat-input";
import { useRef, useState, useEffect } from "react";
import { useCreateConversation } from "@/hooks/use-conversations";
import { useRouter } from "next/navigation";

function SetupChecklist({
  hasApiKeys,
  hasEnabledModels,
}: {
  hasApiKeys: boolean;
  hasEnabledModels: boolean;
}) {
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    const dismissed = localStorage.getItem("setup-checklist-dismissed");
    setIsDismissed(dismissed === "true");
  }, []);

  const handleDismiss = () => {
    localStorage.setItem("setup-checklist-dismissed", "true");
    setIsDismissed(true);
  };

  const needsSetup = !hasApiKeys || !hasEnabledModels;

  if (!needsSetup || isDismissed) return null;

  return (
    <div className="mt-6 max-w-md mx-auto">
      <div className="bg-muted/20 rounded-md border border-border/30 p-3 relative">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleDismiss}
          className="absolute top-2 right-2 h-6 w-6 p-0 hover:bg-muted/50"
        >
          <X className="w-3 h-3" />
        </Button>
        <div className="pr-6">
          <h3 className="text-xs font-medium mb-4 flex items-center gap-1.5">
            Next Steps
          </h3>
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-xs">
              {hasApiKeys ? (
                <CheckCircle2 className="w-3 h-3 text-green-500 shrink-0" />
              ) : (
                <div className="w-3 h-3 rounded-full border border-muted-foreground/30 shrink-0" />
              )}
              <span
                className={
                  hasApiKeys
                    ? "text-muted-foreground line-through"
                    : "text-muted-foreground"
                }
              >
                Add your API keys
              </span>
              {!hasApiKeys && (
                <Link href="/settings/api-keys">
                  <Button variant="outline" size="sm">
                    Setup
                  </Button>
                </Link>
              )}
            </div>
            <div className="flex items-center gap-2 text-xs">
              {hasEnabledModels ? (
                <CheckCircle2 className="w-3 h-3 text-green-500 shrink-0" />
              ) : (
                <div className="w-3 h-3 rounded-full border border-muted-foreground/30 shrink-0" />
              )}
              <span
                className={
                  hasEnabledModels
                    ? "text-muted-foreground line-through"
                    : "text-muted-foreground"
                }
              >
                Enable AI models
              </span>
              {hasApiKeys && !hasEnabledModels && (
                <Link href="/settings/models">
                  <Button variant="outline" size="sm">
                    Setup
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ChatZeroStateContent({
  user,
  hasApiKeys,
  hasEnabledModels,
}: {
  user: User | null;
  hasApiKeys: boolean | undefined;
  hasEnabledModels: boolean | undefined;
}) {
  const isAnonymous = user?.isAnonymous ?? true;
  const chatInputRef = useRef<ChatInputRef>(null);
  const { createNewConversationWithResponse } = useCreateConversation();
  const router = useRouter();

  const handleQuickPrompt = async (prompt: string) => {
    if (chatInputRef.current) {
      chatInputRef.current.setInput(prompt);
      chatInputRef.current.focus();
    } else {
      const conversationId = await createNewConversationWithResponse(
        prompt,
        undefined,
        null,
        user?._id
      );
      if (conversationId) {
        router.push(`/chat/${conversationId}`);
      }
    }
  };

  return (
    <div className="flex h-full items-center justify-center px-6 pt-6 pb-2">
      <div className="max-w-3xl mx-auto w-full">
        <div className="text-center space-y-8 px-6">
          <div className="space-y-4">
            <div className="flex justify-center mb-4">
              <div className="relative">
                <Image
                  src="/polly-mascot.png"
                  alt="Polly AI Mascot"
                  width={96}
                  height={96}
                  className="w-24 h-24 object-contain drop-shadow-lg relative z-10"
                />
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/15 via-teal-500/15 to-cyan-500/15 rounded-full blur-lg opacity-50 scale-110"></div>
              </div>
            </div>
            <h1 className="text-2xl font-semibold text-foreground tracking-tight">
              What&apos;s on your mind?
            </h1>
            {isAnonymous && (
              <p className="text-base text-muted-foreground leading-relaxed">
                Pick a prompt to get started, or ask me anything else!
              </p>
            )}
          </div>

          {isAnonymous && <PromptsTicker onQuickPrompt={handleQuickPrompt} />}

          <div className="-mx-6">
            <ChatInput
              ref={chatInputRef}
              hasExistingMessages={false}
              isLoading={false}
              isStreaming={false}
              onStop={() => {}}
              placeholder="Ask me anything..."
            />
          </div>

          {!isAnonymous &&
            hasApiKeys !== undefined &&
            hasEnabledModels !== undefined &&
            (!hasApiKeys || !hasEnabledModels) && (
              <SetupChecklist
                hasApiKeys={!!hasApiKeys}
                hasEnabledModels={!!hasEnabledModels}
              />
            )}
        </div>
      </div>
    </div>
  );
}

export function ChatZeroState() {
  const { user, isLoading: userLoading } = useUser();

  const hasUserOwnModels = useQuery(
    api.userModels.getUserModels,
    !user?.isAnonymous && user?._id ? { userId: user._id } : "skip"
  );
  const hasUserOwnApiKeys = useQuery(
    api.users.hasUserApiKeys,
    !user?.isAnonymous && user?._id ? { userId: user._id } : "skip"
  );

  if (userLoading) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <div className="w-5 h-5 border-2 border-muted-foreground/30 border-t-muted-foreground rounded-full animate-spin"></div>
      </div>
    );
  }

  const hasApiKeys = user?.isAnonymous ? true : !!hasUserOwnApiKeys;
  const hasEnabledModels = user?.isAnonymous
    ? true
    : !!(hasUserOwnModels && hasUserOwnModels.length > 0);

  return (
    <ChatZeroStateContent
      user={user}
      hasApiKeys={hasApiKeys}
      hasEnabledModels={hasEnabledModels}
    />
  );
}
