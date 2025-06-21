"use client";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Smile, Undo2, Redo2, Sparkles, Loader2 } from "lucide-react";
import { useMutation } from "convex/react";
import { api } from "../../../../../../convex/_generated/api";
import { countTokens } from "@/lib/utils";
import { useWordBasedUndo } from "@/hooks/use-word-based-undo";
import { SkeletonText } from "@/components/ui/skeleton-text";
import EmojiPicker, { EmojiClickData } from "emoji-picker-react";

interface PersonaFormData {
  name: string;
  description: string;
  prompt: string;
  icon: string;
}

function PersonaForm({
  formData,
  setFormData,
  isEmojiPickerOpen,
  setIsEmojiPickerOpen,
  handleEmojiClick,
}: {
  formData: PersonaFormData;
  setFormData: React.Dispatch<React.SetStateAction<PersonaFormData>>;
  isEmojiPickerOpen: boolean;
  setIsEmojiPickerOpen: React.Dispatch<React.SetStateAction<boolean>>;
  handleEmojiClick: (emojiData: EmojiClickData) => void;
}) {
  const [isImprovingPrompt, setIsImprovingPrompt] = useState(false);

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
    debounceMs: 1000, // Save to history after 1 second of inactivity
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
        throw new Error("Failed to improve prompt");
      }

      const { improvedPrompt } = await response.json();
      setPromptValue(improvedPrompt);
    } catch (error) {
      console.error("Error improving prompt:", error);
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
        </div>
        <div className="space-y-3">
          <div className="group border border-input rounded-lg bg-background transition-colors focus-within:border-ring focus-within:ring-1 focus-within:ring-ring relative">
            <Textarea
              id="prompt"
              value={promptValue}
              onChange={e => handlePromptChange(e.target.value)}
              placeholder="Describe how you want your AI assistant to behave and respond. For example: 'You are a creative writing assistant who helps users brainstorm ideas, develop characters, and craft compelling stories. Be encouraging, imaginative, and offer specific suggestions.'"
              rows={12}
              className="resize-none min-h-[300px] border-0 rounded-none bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 p-4"
            />

            {/* Magical skeleton overlay when improving - covers entire container */}
            {isImprovingPrompt && (
              <div className="absolute inset-0 bg-background/95 backdrop-blur-sm rounded-lg flex items-center justify-center z-10">
                <div className="w-full h-full relative overflow-hidden">
                  <SkeletonText className="absolute inset-0 opacity-80" />
                  <div className="absolute inset-0 bg-gradient-to-br from-transparent via-background/50 to-transparent animate-pulse" />
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-background/90 backdrop-blur-sm rounded-full border border-border/50 shadow-lg">
                      <Loader2 className="h-4 w-4 animate-spin text-accent-emerald" />
                      <span className="text-sm font-medium bg-gradient-to-r from-accent-emerald via-accent-orange to-accent-purple bg-clip-text text-transparent">
                        AI magic in progress...
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Prompt Controls - attached to textarea */}
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
              className="p-0 h-auto text-xs text-accent-emerald hover:text-accent-emerald/80 underline"
            >
              improve prompt
            </Button>{" "}
            feature to transform simple ideas into structured prompts. Need more
            help?{" "}
            <a
              href="https://docs.anthropic.com/en/docs/build-with-claude/prompt-engineering/system-prompts"
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent-emerald hover:text-accent-emerald/80 transition-colors underline"
            >
              Check out this system prompts guide
            </a>{" "}
            for tips and best practices.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function NewPersonaPage() {
  const router = useRouter();
  const createPersona = useMutation(api.personas.create);

  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState<PersonaFormData>({
    name: "",
    description: "",
    prompt: "",
    icon: "🤖",
  });

  const handleCreatePersona = async () => {
    if (!formData.name.trim() || !formData.prompt.trim()) {
      return;
    }

    setIsLoading(true);
    try {
      await createPersona({
        name: formData.name,
        description: formData.description,
        prompt: formData.prompt,
        icon: formData.icon,
      });

      router.push("/settings/personas");
    } catch (error) {
      console.error("Failed to create persona:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmojiClick = (emojiData: EmojiClickData) => {
    setFormData(prev => ({ ...prev, icon: emojiData.emoji }));
    setIsEmojiPickerOpen(false);
  };

  const isFormValid = formData.name.trim() && formData.prompt.trim();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Create New Persona</h1>
        <p className="text-muted-foreground mt-2">
          Give your AI assistant a unique personality and style for different
          types of conversations
        </p>
      </div>

      {/* Form */}
      <PersonaForm
        formData={formData}
        setFormData={setFormData}
        isEmojiPickerOpen={isEmojiPickerOpen}
        setIsEmojiPickerOpen={setIsEmojiPickerOpen}
        handleEmojiClick={handleEmojiClick}
      />

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button
          variant="outline"
          onClick={() => router.push("/settings/personas")}
          disabled={isLoading}
        >
          Cancel
        </Button>
        <Button
          onClick={handleCreatePersona}
          disabled={!isFormValid || isLoading}
        >
          {isLoading ? "Creating..." : "Create Persona"}
        </Button>
      </div>
    </div>
  );
}
