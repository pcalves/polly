"use client";

import React, { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Smile,
  Undo2,
  Redo2,
  Sparkles,
  Loader2,
  Maximize2,
  X,
} from "lucide-react";
import { countTokens } from "@/lib/utils";
import { useWordBasedUndo } from "@/hooks/use-word-based-undo";
import { SkeletonText } from "@/components/ui/skeleton-text";
import EmojiPicker, { EmojiClickData } from "emoji-picker-react";
import { toast } from "sonner";

export interface PersonaFormData {
  name: string;
  description: string;
  prompt: string;
  icon: string;
}

interface PersonaFormProps {
  formData: PersonaFormData;
  setFormData: React.Dispatch<React.SetStateAction<PersonaFormData>>;
  isEmojiPickerOpen: boolean;
  setIsEmojiPickerOpen: React.Dispatch<React.SetStateAction<boolean>>;
  handleEmojiClick: (emojiData: EmojiClickData) => void;
}

export function PersonaForm({
  formData,
  setFormData,
  isEmojiPickerOpen,
  setIsEmojiPickerOpen,
  handleEmojiClick,
}: PersonaFormProps) {
  const [isImprovingPrompt, setIsImprovingPrompt] = useState(false);
  const [isFullScreenEditor, setIsFullScreenEditor] = useState(false);

  // Use word-based undo/redo functionality
  const {
    value: promptValue,
    updateValue: setPromptValue,
    undo,
    redo,
    canUndo,
    canRedo,
  } = useWordBasedUndo({
    initialValue: formData.prompt,
    debounceMs: 1000,
  });

  // Sync prompt changes with form data
  React.useEffect(() => {
    setFormData(prev => ({ ...prev, prompt: promptValue }));
  }, [promptValue, setFormData]);

  const tokenCount = useMemo(() => countTokens(promptValue), [promptValue]);

  const handlePromptChange = React.useCallback(
    (newValue: string) => {
      setPromptValue(newValue);
    },
    [setPromptValue]
  );

  const improvePrompt = async () => {
    if (!promptValue.trim() || isImprovingPrompt) return;

    setIsImprovingPrompt(true);
    try {
      const response = await fetch("/api/personas/improve-prompt", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt: promptValue }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage =
          errorData.error || `HTTP ${response.status}: ${response.statusText}`;
        throw new Error(errorMessage);
      }

      const { improvedPrompt } = await response.json();

      if (!improvedPrompt) {
        throw new Error("No improvement was generated for your prompt");
      }

      setPromptValue(improvedPrompt);
      toast.success("Prompt improved successfully!", {
        description: "Your prompt has been enhanced with AI suggestions.",
      });
    } catch (error) {
      console.error("Error improving prompt:", error);

      const errorMessage =
        error instanceof Error ? error.message : "Failed to improve prompt";

      if (
        errorMessage.includes("No improvement generated") ||
        errorMessage.includes("No improvement was generated")
      ) {
        toast.error("Unable to improve prompt", {
          description:
            "Try providing more specific details about your assistant's role and behavior, then try again.",
          duration: 6000,
        });
      } else if (
        errorMessage.includes("rate limit") ||
        errorMessage.includes("too many requests")
      ) {
        toast.error("Rate limit exceeded", {
          description:
            "Please wait a moment before trying to improve your prompt again.",
          duration: 5000,
        });
      } else {
        toast.error("Failed to improve prompt", {
          description: errorMessage.includes("HTTP")
            ? "There was a server error. Please try again in a moment."
            : errorMessage,
          duration: 5000,
        });
      }
    } finally {
      setIsImprovingPrompt(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
      {/* Left Column - Basic Information */}
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold mb-4">Basic Information</h2>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-medium">
                Name
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={e =>
                  setFormData(prev => ({ ...prev, name: e.target.value }))
                }
                placeholder="e.g., Creative Writer"
                className="h-10"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="text-sm font-medium">
                Description{" "}
                <span className="text-xs text-muted-foreground font-normal">
                  (optional)
                </span>
              </Label>
              <Input
                id="description"
                value={formData.description}
                onChange={e =>
                  setFormData(prev => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                placeholder="e.g., Imaginative storyteller and creative writing assistant"
                className="h-10"
              />
            </div>
          </div>
        </div>

        {/* Icon Selection Section */}
        <div className="space-y-3">
          <h3 className="text-lg font-medium">Icon</h3>
          <div className="flex items-center gap-4 p-4 border rounded-lg bg-muted/30">
            <div className="relative w-16 h-16 border-2 rounded-xl bg-background shadow-sm overflow-hidden">
              <span
                className="absolute text-3xl select-none"
                style={{
                  top: "50%",
                  left: "50%",
                  transform: "translate(-50%, -50%)",
                  lineHeight: 1,
                  fontFamily:
                    "Apple Color Emoji, Segoe UI Emoji, Noto Color Emoji, sans-serif",
                }}
              >
                {formData.icon}
              </span>
            </div>
            <div className="flex-1">
              <p className="text-sm text-muted-foreground mb-3">
                Choose an emoji to represent your persona
              </p>
              <Popover
                open={isEmojiPickerOpen}
                onOpenChange={setIsEmojiPickerOpen}
              >
                <PopoverTrigger asChild>
                  <Button variant="outline" size="default">
                    <Smile className="h-4 w-4 mr-2" />
                    Choose Emoji
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <EmojiPicker
                    onEmojiClick={handleEmojiClick}
                    searchDisabled={false}
                    skinTonesDisabled={true}
                    width={350}
                    height={400}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </div>
      </div>

      {/* Right Column - System Prompt */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Personality & Instructions</h2>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setIsFullScreenEditor(true)}
            className="gap-2"
          >
            <Maximize2 className="h-4 w-4" />
            Fullscreen Editor
          </Button>
        </div>
        <div className="space-y-3">
          <div className="group border border-input rounded-lg bg-background transition-colors focus-within:border-ring focus-within:ring-1 focus-within:ring-ring relative">
            <Textarea
              id="prompt"
              value={promptValue}
              onChange={e => handlePromptChange(e.target.value)}
              placeholder="Describe how you want your AI assistant to behave and respond. For example: 'You are a creative writing assistant who helps users brainstorm ideas, develop characters, and craft compelling stories. Be encouraging, imaginative, and offer specific suggestions.'"
              rows={12}
              className="resize-none min-h-[300px] border-0 rounded-none bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 p-4 text-sm sm:text-base leading-relaxed font-mono"
            />

            {isImprovingPrompt && (
              <div className="absolute inset-0 bg-background/95 backdrop-blur-sm rounded-lg flex items-center justify-center z-10">
                <div className="w-full h-full relative overflow-hidden">
                  <SkeletonText className="absolute inset-0 opacity-80" />
                  <div className="absolute inset-0 bg-gradient-to-br from-transparent via-background/50 to-transparent animate-pulse" />
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-background/90 backdrop-blur-sm rounded-full border border-border/50 shadow-lg">
                      <Loader2 className="h-4 w-4 animate-spin text-accent-coral" />
                      <span className="text-sm font-medium bg-gradient-to-r from-accent-coral via-accent-orange to-accent-purple bg-clip-text text-transparent">
                        AI magic in progress...
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Prompt Controls */}
            <div className="flex items-center justify-between gap-2 p-2 border-t border-border bg-muted/30">
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={undo}
                    disabled={!canUndo || isImprovingPrompt}
                    className="h-7 w-7 p-0"
                  >
                    <Undo2 className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={redo}
                    disabled={!canRedo || isImprovingPrompt}
                    className="h-7 w-7 p-0"
                  >
                    <Redo2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
                <span className="text-xs text-muted-foreground">
                  {tokenCount} tokens
                </span>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={improvePrompt}
                disabled={!promptValue.trim() || isImprovingPrompt}
                className="gap-2 text-xs"
              >
                {isImprovingPrompt ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Improving...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-3.5 w-3.5" />
                    Improve prompt
                  </>
                )}
              </Button>
            </div>
          </div>

          <p className="text-xs text-muted-foreground leading-relaxed">
            Define your assistant&apos;s personality, tone, and expertise. This
            guides how it will respond in conversations. Use the{" "}
            <Button
              type="button"
              variant="link"
              size="sm"
              onClick={improvePrompt}
              disabled={!promptValue.trim() || isImprovingPrompt}
              className="p-0 h-auto text-xs text-accent-coral hover:text-accent-coral/80 underline"
            >
              improve prompt
            </Button>{" "}
            feature to transform simple ideas into structured prompts. Need more
            help?{" "}
            <a
              href="https://docs.anthropic.com/en/docs/build-with-claude/prompt-engineering/system-prompts"
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent-coral hover:text-accent-coral/80 transition-colors underline"
            >
              Check out this system prompts guide
            </a>{" "}
            for tips and best practices.
          </p>
        </div>
      </div>

      {isFullScreenEditor && (
        <div className="fixed inset-0 z-50 bg-background flex flex-col">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border-b flex-shrink-0 gap-3 sm:gap-4">
            <div className="flex items-center justify-between sm:justify-start gap-2 sm:gap-4 min-w-0">
              <h2 className="text-lg font-semibold truncate">
                <span className="hidden sm:inline">
                  Personality & Instructions
                </span>
                <span className="sm:hidden">Edit Prompt</span>
              </h2>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setIsFullScreenEditor(false)}
                className="h-8 w-8 p-0 flex-shrink-0 sm:hidden"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex items-center justify-between sm:justify-end gap-2 sm:gap-4">
              <div className="flex items-center gap-2">
                <div className="hidden sm:flex items-center gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={undo}
                    disabled={!canUndo || isImprovingPrompt}
                    className="h-8 w-8 p-0"
                  >
                    <Undo2 className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={redo}
                    disabled={!canRedo || isImprovingPrompt}
                    className="h-8 w-8 p-0"
                  >
                    <Redo2 className="h-4 w-4" />
                  </Button>
                </div>
                <span className="text-xs sm:text-sm text-muted-foreground">
                  {tokenCount} tokens
                </span>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={improvePrompt}
                  disabled={!promptValue.trim() || isImprovingPrompt}
                  className="gap-1 sm:gap-2"
                >
                  {isImprovingPrompt ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 animate-spin" />
                      <span className="hidden xs:inline">Improving...</span>
                      <span className="xs:hidden">...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      <span className="hidden xs:inline">Improve prompt</span>
                      <span className="xs:hidden">Improve</span>
                    </>
                  )}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsFullScreenEditor(false)}
                  className="h-8 w-8 p-0 flex-shrink-0 hidden sm:flex"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 relative min-h-0">
            <Textarea
              value={promptValue}
              onChange={e => handlePromptChange(e.target.value)}
              placeholder="Describe how you want your AI assistant to behave and respond..."
              className="w-full h-full resize-none border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 text-sm sm:text-base leading-relaxed overflow-y-auto font-mono p-4 sm:p-6 lg:p-8 pl-[max(1rem,calc(50%-40ch))] pr-[max(1rem,calc(50%-40ch))] sm:pl-[max(1.5rem,calc(50%-40ch))] sm:pr-[max(1.5rem,calc(50%-40ch))] lg:pl-[max(2rem,calc(50%-40ch))] lg:pr-[max(2rem,calc(50%-40ch))]"
            />

            {isImprovingPrompt && (
              <div className="absolute inset-0 bg-background/95 backdrop-blur-sm flex items-center justify-center">
                <div className="w-full h-full relative overflow-hidden px-8">
                  <div
                    className="absolute top-1/2 transform -translate-y-1/2 opacity-80 h-64"
                    style={{
                      left: "max(2rem, calc(50% - 40ch))",
                      right: "max(2rem, calc(50% - 40ch))",
                    }}
                  >
                    <SkeletonText className="h-full" />
                  </div>
                  <div
                    className="absolute top-1/2 transform -translate-y-1/2 bg-gradient-to-br from-transparent via-background/50 to-transparent animate-pulse h-64"
                    style={{
                      left: "max(2rem, calc(50% - 40ch))",
                      right: "max(2rem, calc(50% - 40ch))",
                    }}
                  />
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-background/90 backdrop-blur-sm rounded-full border border-border/50 shadow-lg">
                      <Loader2 className="h-4 w-4 animate-spin text-accent-coral" />
                      <span className="text-sm font-medium bg-gradient-to-r from-accent-coral via-accent-orange to-accent-purple bg-clip-text text-transparent">
                        AI magic in progress...
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
