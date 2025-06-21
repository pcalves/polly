"use client";

import { Settings, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image";
import { PromptsTicker } from "./prompts-ticker";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useUser } from "@/hooks/use-user";
import { User } from "@/types";

interface ChatZeroStateProps {
  onQuickPrompt: (prompt: string) => void;
}

function ChatZeroStateContent({
  user,
  hasApiKeys,
  hasEnabledModels,
  onQuickPrompt,
}: {
  user: User | null;
  hasApiKeys: boolean | undefined;
  hasEnabledModels: boolean | undefined;
  onQuickPrompt: (prompt: string) => void;
}) {
  const isAnonymous = user?.isAnonymous ?? true;

  if (isAnonymous) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <div className="max-w-3xl mx-auto w-full">
          <div className="text-center space-y-8 px-6">
            <div className="space-y-4">
              <div className="flex justify-center mb-6">
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
              <p className="text-base text-muted-foreground leading-relaxed">
                Pick a prompt to get started, or ask me anything else!
              </p>
            </div>
            <PromptsTicker onQuickPrompt={onQuickPrompt} />
          </div>
        </div>
      </div>
    );
  }

  if (hasApiKeys && hasEnabledModels) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <div className="max-w-3xl mx-auto w-full">
          <div className="text-center space-y-8 px-6">
            <div className="space-y-4">
              <div className="flex justify-center mb-6">
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
              <p className="text-base text-muted-foreground leading-relaxed">
                Pick a prompt to get started, or ask me anything else!
              </p>
            </div>
            <PromptsTicker onQuickPrompt={onQuickPrompt} />
          </div>
        </div>
      </div>
    );
  }

  if (!hasApiKeys) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <div className="max-w-3xl mx-auto w-full">
          <div className="text-center space-y-8 px-6">
            <div className="space-y-4">
              <div className="flex justify-center mb-6">
                <div className="relative">
                  <Image
                    src="/polly-mascot.png"
                    alt="Polly AI Mascot"
                    width={128}
                    height={128}
                    className="w-32 h-32 object-contain drop-shadow-xl relative z-10"
                  />
                  <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/20 via-teal-500/20 to-cyan-500/20 rounded-full blur-xl opacity-60 scale-110"></div>
                </div>
              </div>
              <h1 className="text-2xl font-semibold text-foreground tracking-tight">
                Welcome to Polly!
              </h1>
              <p className="text-base text-muted-foreground leading-relaxed">
                You can start chatting right away, or add your API keys to
                access your own models.
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex gap-3">
                <Button
                  onClick={() =>
                    onQuickPrompt("Hello! What can you help me with today?")
                  }
                  variant="emerald"
                  size="lg"
                  className="flex-1 gap-2 h-12 text-base font-medium shadow-md hover:shadow-lg hover:scale-[1.02] transition-all duration-200"
                >
                  <MessageCircle className="h-5 w-5" />
                  Start Chatting
                </Button>
                <Link href="/settings">
                  <Button
                    variant="outline"
                    size="lg"
                    className="h-12 px-6 text-base font-medium shadow-md hover:shadow-lg hover:scale-[1.02] transition-all duration-200"
                  >
                    <Settings className="h-5 w-5 mr-2" />
                    Add API Keys
                  </Button>
                </Link>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="text-center p-4 rounded-lg border border-border/50 bg-muted/20">
                  <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center mx-auto mb-2">
                    <span className="text-blue-600 font-semibold text-xs">
                      AI
                    </span>
                  </div>
                  <p className="font-medium text-foreground text-sm">OpenAI</p>
                  <p className="text-xs text-muted-foreground">GPT-4, GPT-4o</p>
                </div>
                <div className="text-center p-4 rounded-lg border border-border/50 bg-muted/20">
                  <div className="w-8 h-8 rounded-full bg-orange-500/10 flex items-center justify-center mx-auto mb-2">
                    <span className="text-orange-600 font-semibold text-xs">
                      A
                    </span>
                  </div>
                  <p className="font-medium text-foreground text-sm">
                    Anthropic
                  </p>
                  <p className="text-xs text-muted-foreground">Claude 3.5</p>
                </div>
                <div className="text-center p-4 rounded-lg border border-border/50 bg-muted/20">
                  <div className="w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-2">
                    <span className="text-green-600 font-semibold text-xs">
                      G
                    </span>
                  </div>
                  <p className="font-medium text-foreground text-sm">Google</p>
                  <p className="text-xs text-muted-foreground">Gemini</p>
                </div>
                <div className="text-center p-4 rounded-lg border border-border/50 bg-muted/20">
                  <div className="w-8 h-8 rounded-full bg-purple-500/10 flex items-center justify-center mx-auto mb-2">
                    <span className="text-purple-600 font-semibold text-xs">
                      +
                    </span>
                  </div>
                  <p className="font-medium text-foreground text-sm">
                    Many More
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Via OpenRouter
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full items-center justify-center p-6">
      <div className="max-w-3xl mx-auto w-full">
        <div className="text-center space-y-8 px-6">
          <div className="space-y-4">
            <div className="flex justify-center mb-6">
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
            <p className="text-base text-muted-foreground leading-relaxed">
              Pick a prompt to get started, or ask me anything else!
            </p>
          </div>
          <PromptsTicker onQuickPrompt={onQuickPrompt} />
        </div>
      </div>
    </div>
  );
}

export function ChatZeroState({ onQuickPrompt }: ChatZeroStateProps) {
  const { user, isLoading: userLoading } = useUser();

  const hasEnabledModels = useQuery(api.userModels.hasUserModels, {});
  const hasApiKeys = useQuery(api.apiKeys.hasAnyApiKey, {});

  if (userLoading || hasApiKeys === undefined) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <div className="w-5 h-5 border-2 border-muted-foreground/30 border-t-muted-foreground rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <ChatZeroStateContent
      user={user}
      hasApiKeys={hasApiKeys}
      hasEnabledModels={hasEnabledModels}
      onQuickPrompt={onQuickPrompt}
    />
  );
}
