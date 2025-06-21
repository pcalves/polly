"use client";

import React, {
  useState,
  useRef,
  useCallback,
  forwardRef,
  useImperativeHandle,
} from "react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Paperclip } from "lucide-react";
import { ModelPicker } from "@/components/model-picker";
import { PersonaPicker } from "@/components/persona-picker";
import { WebSearchToggle } from "@/components/web-search-toggle";
import { SendButtonGroup } from "./send-button-group";
import { AIModel } from "@/types";
import { Attachment } from "@/types";

import { Id } from "../../../convex/_generated/dataModel";
import { useUser } from "@/hooks/use-user";
import { useUserSettings } from "@/hooks/use-user-settings";
import { cn } from "@/lib/utils";

interface InputControlsProps {
  canChat: boolean;
  isLoading: boolean;
  isStreaming: boolean;
  selectedModel?: AIModel | null;
  currentModel?: AIModel;
  hasExistingMessages: boolean;
  conversationId?: string;
  onStop?: () => void;
  hasApiKeys?: boolean;
  hasEnabledModels?: boolean | null;
  // Data and actions from parent
  input: string;
  attachments: Attachment[];
  buildMessageContent: (input: string) => string;
  getBinaryAttachments: () => Attachment[];
  clearAttachments: () => void;
  clearInput: () => void;
  handleFileUpload: (files: FileList | null) => void;
  // Parent callbacks
  onSendMessage: (
    content: string,
    attachments?: Attachment[],
    useWebSearch?: boolean,
    personaId?: Id<"personas"> | null
  ) => void;
  onInputStart?: () => void;
}

export interface InputControlsRef {
  handleSubmit: () => void;
}

export const InputControls = forwardRef<InputControlsRef, InputControlsProps>(
  (
    {
      canChat,
      isLoading,
      isStreaming,
      selectedModel,
      currentModel,
      hasExistingMessages,
      conversationId,
      onStop,
      hasApiKeys,
      hasEnabledModels,
      input,
      attachments,
      buildMessageContent,
      getBinaryAttachments,
      clearAttachments,
      clearInput,
      handleFileUpload,
      onSendMessage,
      onInputStart,
    },
    ref
  ) => {
    // Internal state
    const [webSearchEnabled, setWebSearchEnabled] = useState(false);
    const [selectedPersonaId, setSelectedPersonaId] =
      useState<Id<"personas"> | null>(null);
    const fileInputRef = useRef<HTMLInputElement | null>(null);

    // User settings for persona functionality
    const userInfo = useUser();
    const userSettings = useUserSettings(userInfo.user?._id);
    const personasEnabled = userSettings?.personasEnabled !== false;

    // Handle file input change
    const handleFileInputChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        handleFileUpload(e.target.files);
        e.target.value = "";
      },
      [handleFileUpload]
    );

    // Handle submit
    const handleSubmit = useCallback(() => {
      if (!input.trim() && attachments.length === 0) return;
      if (isLoading || !canChat) return;

      const messageContent = buildMessageContent(input);
      const binaryAttachments = getBinaryAttachments();

      onSendMessage(
        messageContent,
        binaryAttachments.length > 0 ? binaryAttachments : undefined,
        webSearchEnabled,
        selectedPersonaId
      );

      clearInput();
      clearAttachments();
      setWebSearchEnabled(false);

      if (onInputStart && messageContent.trim()) {
        onInputStart();
      }
    }, [
      input,
      attachments,
      isLoading,
      canChat,
      onSendMessage,
      onInputStart,
      webSearchEnabled,
      buildMessageContent,
      getBinaryAttachments,
      clearAttachments,
      clearInput,
      selectedPersonaId,
    ]);

    // Expose handleSubmit via ref
    useImperativeHandle(
      ref,
      () => ({
        handleSubmit,
      }),
      [handleSubmit]
    );

    const canSend = !!(
      (input.trim() || attachments.length > 0) &&
      !isLoading &&
      canChat
    );

    return (
      <>
        {/* Controls row */}
        <div className="flex items-center justify-between mt-2 pt-2 border-t border-border/20 gap-2">
          {/* Left side controls - single line layout */}
          <div className="flex items-center gap-1 sm:gap-2 min-w-0 flex-1">
            {/* Persona selector */}
            {canChat && personasEnabled && !conversationId && (
              <PersonaPicker
                compact
                selectedPersonaId={selectedPersonaId}
                onPersonaSelect={setSelectedPersonaId}
                className={cn(
                  "flex items-center gap-1 px-2 sm:px-3 py-2 sm:py-1.5 rounded-full border-2 border-dashed transition-all duration-200 hover:shadow-md focus-visible:ring-2 focus-visible:ring-accent-coral/20 focus-visible:ring-offset-1 text-xs flex-shrink-0 min-h-11 sm:h-auto min-w-11 sm:min-w-auto",
                  selectedPersonaId
                    ? "bg-accent-coral/10 border-accent-coral/30 hover:bg-accent-coral/15 active:bg-accent-coral/20 hover:border-accent-coral/40 active:border-accent-coral/50 dark:bg-accent-coral/20 dark:border-accent-coral/50"
                    : "bg-muted/30 border-muted-foreground/20 hover:bg-muted/50 active:bg-muted/70 hover:border-muted-foreground/30 active:border-muted-foreground/40 dark:bg-muted/20 dark:hover:bg-muted/40"
                )}
              />
            )}

            {/* Model selector - most prominent */}
            {canChat && (
              <ModelPicker className="flex items-center gap-1 px-2 sm:px-3 py-2 sm:py-1.5 bg-background hover:bg-accent/50 active:bg-accent/80 rounded-lg border border-border hover:border-muted-foreground/30 active:border-muted-foreground/50 transition-all duration-200 hover:shadow-md focus-visible:ring-2 focus-visible:ring-accent-coral/20 focus-visible:ring-offset-1 text-xs min-w-0 max-w-36 sm:max-w-none min-h-11 sm:h-auto font-medium" />
            )}

            {/* Web search toggle */}
            {canChat &&
              selectedModel &&
              (selectedModel.provider === "openrouter" ||
                selectedModel.provider === "google") && (
                <WebSearchToggle
                  enabled={webSearchEnabled}
                  onToggle={setWebSearchEnabled}
                  className={cn(
                    "flex items-center gap-1 px-2 sm:px-3 py-2 sm:py-1.5 rounded-lg border transition-all duration-200 hover:shadow-md focus-visible:ring-2 focus-visible:ring-accent-coral/20 focus-visible:ring-offset-1 text-xs flex-shrink-0 min-h-11 sm:h-auto min-w-11 sm:min-w-auto",
                    webSearchEnabled
                      ? "bg-accent-coral/10 border-accent-coral/30 hover:bg-accent-coral/15 active:bg-accent-coral/20 hover:border-accent-coral/40 active:border-accent-coral/50 dark:bg-accent-coral/20 dark:border-accent-coral/50"
                      : "bg-muted/30 border-border hover:bg-muted/50 active:bg-muted/70 hover:border-muted-foreground/20 active:border-muted-foreground/30 dark:bg-muted/20 dark:hover:bg-muted/40"
                  )}
                />
              )}
          </div>

          {/* Right side controls */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {canChat && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isLoading}
                    className="flex items-center gap-1 px-2 sm:px-3 py-2 sm:py-1.5 bg-muted/30 hover:bg-muted/50 active:bg-muted/70 border border-border hover:border-muted-foreground/20 active:border-muted-foreground/30 rounded-full transition-all duration-200 hover:shadow-md dark:bg-muted/20 dark:hover:bg-muted/40 focus-visible:ring-2 focus-visible:ring-accent-coral/20 focus-visible:ring-offset-1 min-h-11 sm:h-auto disabled:opacity-50 disabled:cursor-not-allowed group flex-shrink-0 min-w-11 sm:min-w-auto"
                  >
                    <Paperclip className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                    <span className="hidden sm:inline text-xs font-medium text-muted-foreground group-hover:text-foreground transition-colors">
                      Attach
                    </span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <div className="text-xs">
                    <div className="font-medium mb-1">
                      Supported file types:
                    </div>
                    <div>• Text files</div>
                    {currentModel?.supportsImages && (
                      <div>• Images (PNG, JPEG, GIF, WebP, HEIC)</div>
                    )}
                    {(currentModel?.provider === "openrouter" ||
                      (currentModel?.contextLength &&
                        currentModel.contextLength >= 100000)) && (
                      <div>• PDF documents</div>
                    )}
                    {!currentModel && (
                      <div className="text-muted-foreground italic">
                        Select a model to see specific capabilities
                      </div>
                    )}
                  </div>
                </TooltipContent>
              </Tooltip>
            )}

            <SendButtonGroup
              canSend={canSend}
              isStreaming={isStreaming}
              isLoading={isLoading}
              isSummarizing={false}
              hasExistingMessages={hasExistingMessages}
              conversationId={conversationId}
              onSend={handleSubmit}
              onStop={onStop}
              hasApiKeys={hasApiKeys}
              hasEnabledModels={hasEnabledModels}
            />
          </div>
        </div>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,.pdf,.txt,.md,.csv,.json,.xml,.yaml,.yml,.js,.ts,.jsx,.tsx,.py,.java,.c,.cpp,.cs,.go,.rs,.php,.rb,.swift,.kt,.scala,.sh,.sql,.html,.css,.scss,.sass,.less,.vue,.svelte"
          multiple
          onChange={handleFileInputChange}
          className="hidden"
        />
      </>
    );
  }
);

InputControls.displayName = "InputControls";
