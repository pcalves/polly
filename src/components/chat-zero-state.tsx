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
    <div className="mt-4 sm:mt-6 max-w-sm sm:max-w-md mx-auto">
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
                    ? "text-muted-foreground line-through flex-1"
                    : "text-muted-foreground flex-1"
                }
              >
                Add your API keys
              </span>
              {!hasApiKeys && (
                <Link href="/settings/api-keys">
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs h-6 px-2"
                  >
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
                    ? "text-muted-foreground line-through flex-1"
                    : "text-muted-foreground flex-1"
                }
              >
                Enable AI models
              </span>
              {hasApiKeys && !hasEnabledModels && (
                <Link href="/settings/models">
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs h-6 px-2"
                  >
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

function Mascot({ isMobile }: { isMobile: boolean }) {
  const sizeClasses = isMobile ? "w-32 h-32" : "w-20 h-20 sm:w-24 sm:h-24";
  const marginClasses = isMobile ? "mb-4" : "mb-3 sm:mb-4";
  const imageSize = isMobile ? 128 : 96;

  return (
    <div className={`flex justify-center ${marginClasses}`}>
      <div className="relative">
        <Image
          src="/polly-mascot.png"
          alt="Polly AI Mascot"
          width={imageSize}
          height={imageSize}
          className={`${sizeClasses} object-contain drop-shadow-lg relative z-10`}
        />
        <div className="absolute inset-0 bg-gradient-to-br from-accent-coral/15 via-accent-orange/15 to-accent-yellow/15 rounded-full blur-lg opacity-50 scale-110"></div>
      </div>
    </div>
  );
}

function Heading({
  isAnonymous,
  isMobile,
}: {
  isAnonymous: boolean;
  isMobile: boolean;
}) {
  const titleClasses = isMobile
    ? "text-2xl font-semibold text-foreground tracking-tight"
    : "text-xl sm:text-2xl font-semibold text-foreground tracking-tight";
  const descriptionClasses = isMobile
    ? "text-base text-muted-foreground leading-relaxed"
    : "text-sm sm:text-base text-muted-foreground leading-relaxed";

  return (
    <>
      <h1 className={titleClasses}>What&apos;s on your mind?</h1>
      {isAnonymous && (
        <p className={descriptionClasses}>
          Pick a prompt to get started, or ask me anything else!
        </p>
      )}
    </>
  );
}

function ConditionalSetupChecklist({
  isAnonymous,
  hasApiKeys,
  hasEnabledModels,
}: {
  isAnonymous: boolean;
  hasApiKeys: boolean | undefined;
  hasEnabledModels: boolean | undefined;
}) {
  if (
    isAnonymous ||
    hasApiKeys === undefined ||
    hasEnabledModels === undefined
  ) {
    return null;
  }

  if (hasApiKeys && hasEnabledModels) {
    return null;
  }

  return (
    <SetupChecklist
      hasApiKeys={!!hasApiKeys}
      hasEnabledModels={!!hasEnabledModels}
    />
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
  const mobileChatInputRef = useRef<ChatInputRef>(null);
  const { createNewConversationWithResponse } = useCreateConversation();
  const router = useRouter();

  const handleQuickPrompt = async (prompt: string) => {
    const desktopInput = chatInputRef.current;
    const mobileInput = mobileChatInputRef.current;

    if (desktopInput) {
      desktopInput.setInput(prompt);
      desktopInput.focus();
    } else if (mobileInput) {
      mobileInput.setInput(prompt);
      mobileInput.focus();
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

  const chatInputProps = {
    hasExistingMessages: false,
    isLoading: false,
    isStreaming: false,
    onStop: () => {},
    placeholder: "Ask me anything...",
  };

  return (
    <div className="h-full flex flex-col sm:flex sm:h-full sm:items-center sm:justify-center w-full max-w-full overflow-hidden">
      <div className="mx-auto w-full min-w-0 h-full sm:h-auto flex flex-col sm:block">
        {/* Mobile: Top section with mascot and heading */}
        <div className="flex-1 flex flex-col items-center justify-center sm:hidden">
          <div className="text-center space-y-4">
            <Mascot isMobile={true} />
            <Heading isAnonymous={isAnonymous} isMobile={true} />
          </div>

          {isAnonymous && (
            <div className="mt-6 w-full">
              <PromptsTicker onQuickPrompt={handleQuickPrompt} />
            </div>
          )}
        </div>

        {/* Desktop: Original centered layout */}
        <div className="hidden sm:block text-center space-y-6 sm:space-y-8 max-w-full">
          <div className="space-y-3 sm:space-y-4">
            <Mascot isMobile={false} />
            <Heading isAnonymous={isAnonymous} isMobile={false} />
          </div>

          {isAnonymous && <PromptsTicker onQuickPrompt={handleQuickPrompt} />}

          <ChatInput ref={chatInputRef} {...chatInputProps} />

          <ConditionalSetupChecklist
            isAnonymous={isAnonymous}
            hasApiKeys={hasApiKeys}
            hasEnabledModels={hasEnabledModels}
          />
        </div>

        {/* Mobile: Bottom section with checklist and chat input */}
        <div className="flex-shrink-0 sm:hidden space-y-4">
          <ConditionalSetupChecklist
            isAnonymous={isAnonymous}
            hasApiKeys={hasApiKeys}
            hasEnabledModels={hasEnabledModels}
          />

          <ChatInput ref={mobileChatInputRef} {...chatInputProps} />
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
