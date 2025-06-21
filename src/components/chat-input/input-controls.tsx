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
import { useAction } from "convex/react";
import { api } from "../../../convex/_generated/api";
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
  onSendAsNewConversation?: (
    content: string,
    navigate: boolean,
    attachments?: Attachment[],
    contextSummary?: string,
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
      onSendAsNewConversation,
      onInputStart,
    },
    ref
  ) => {
    // Internal state
    const [webSearchEnabled, setWebSearchEnabled] = useState(false);
    const [isSummarizing, setIsSummarizing] = useState(false);
    const [selectedPersonaId, setSelectedPersonaId] =
      useState<Id<"personas"> | null>(null);
    const fileInputRef = useRef<HTMLInputElement | null>(null);

    // User settings for persona functionality
    const userInfo = useUser();
    const userSettings = useUserSettings(userInfo.user?._id);
    const personasEnabled = userSettings?.personasEnabled !== false;

    // Actions
    const generateSummary = useAction(
      api.conversationSummary.generateConversationSummary
    );

    // Handle file input change
    const handleFileInputChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        handleFileUpload(e.target.files);
        e.target.value = "";
      },
      [handleFileUpload]
    );

    // Handle sending message as new conversation
    const handleSendAsNewConversation = useCallback(
      async (navigate: boolean) => {
        if (!input.trim() && attachments.length === 0) return;
        if (isLoading || !canChat || !onSendAsNewConversation) return;

        let contextSummary: string | undefined;

        if (conversationId && hasExistingMessages) {
          try {
            setIsSummarizing(true);
            contextSummary = await generateSummary({
              conversationId: conversationId as Id<"conversations">,
            });
          } catch (error) {
            console.error("Failed to generate conversation summary:", error);
            contextSummary =
              "Previous conversation (summary failed to generate)";
          } finally {
            setIsSummarizing(false);
          }
        }

        const messageContent = buildMessageContent(input);
        const binaryAttachments = getBinaryAttachments();

        onSendAsNewConversation(
          messageContent,
          navigate,
          binaryAttachments,
          contextSummary,
          selectedPersonaId
        );

        // Clear the form
        clearInput();
        clearAttachments();
      },
      [
        input,
        attachments,
        isLoading,
        canChat,
        onSendAsNewConversation,
        conversationId,
        hasExistingMessages,
        generateSummary,
        buildMessageContent,
        getBinaryAttachments,
        clearAttachments,
        clearInput,
        selectedPersonaId,
      ]
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
        <div className="flex items-center justify-between mt-2 pt-2 border-t border-border/20">
          <div className="flex items-center gap-2">
            {/* Persona selector */}
            {canChat && personasEnabled && !conversationId && (
              <PersonaPicker
                compact
                selectedPersonaId={selectedPersonaId}
                onPersonaSelect={setSelectedPersonaId}
                className={cn(
                  "flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border transition-all duration-200 hover:shadow-md focus-visible:ring-2 focus-visible:ring-accent-emerald/20 focus-visible:ring-offset-1",
                  selectedPersonaId
                    ? "bg-emerald-100 border-emerald-300 hover:bg-emerald-150 active:bg-emerald-200 hover:border-emerald-400 active:border-emerald-500 shadow-emerald-200/30 hover:shadow-emerald-200/50 dark:bg-emerald-900/40 dark:border-emerald-700/60 dark:hover:bg-emerald-800/50 dark:active:bg-emerald-700/60 dark:hover:border-emerald-600/70 dark:active:border-emerald-500/80 dark:shadow-emerald-900/20 dark:hover:shadow-emerald-800/30"
                    : "bg-muted/40 hover:bg-emerald-50 active:bg-emerald-100 border-border/40 hover:border-emerald-200 active:border-emerald-300 hover:shadow-emerald-100/50 dark:hover:bg-emerald-950/50 dark:active:bg-emerald-900/50 dark:hover:border-emerald-700/50 dark:active:border-emerald-600/50 dark:hover:shadow-emerald-900/20"
                )}
              />
            )}

            {/* Model selector */}
            {canChat && (
              <ModelPicker className="flex items-center gap-1.5 px-2.5 py-1.5 bg-muted/40 hover:bg-emerald-50 active:bg-emerald-100 dark:hover:bg-emerald-950/50 dark:active:bg-emerald-900/50 rounded-full border border-border/40 hover:border-emerald-200 active:border-emerald-300 dark:hover:border-emerald-700/50 dark:active:border-emerald-600/50 transition-all duration-200 hover:shadow-md hover:shadow-emerald-100/50 dark:hover:shadow-emerald-900/20 focus-visible:ring-2 focus-visible:ring-accent-emerald/20 focus-visible:ring-offset-1" />
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
                    "flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border transition-all duration-200 hover:shadow-md focus-visible:ring-2 focus-visible:ring-accent-emerald/20 focus-visible:ring-offset-1",
                    webSearchEnabled
                      ? "bg-emerald-100 border-emerald-300 hover:bg-emerald-150 active:bg-emerald-200 hover:border-emerald-400 active:border-emerald-500 shadow-emerald-200/30 hover:shadow-emerald-200/50 dark:bg-emerald-900/40 dark:border-emerald-700/60 dark:hover:bg-emerald-800/50 dark:active:bg-emerald-700/60 dark:hover:border-emerald-600/70 dark:active:border-emerald-500/80 dark:shadow-emerald-900/20 dark:hover:shadow-emerald-800/30"
                      : "bg-muted/40 hover:bg-emerald-50 active:bg-emerald-100 border-border/40 hover:border-emerald-200 active:border-emerald-300 hover:shadow-emerald-100/50 dark:hover:bg-emerald-950/50 dark:active:bg-emerald-900/50 dark:hover:border-emerald-700/50 dark:active:border-emerald-600/50 dark:hover:shadow-emerald-900/20"
                  )}
                />
              )}
          </div>

          <div className="flex items-center gap-2">
            {canChat && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isLoading}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 bg-muted/40 hover:bg-emerald-50 active:bg-emerald-100 dark:hover:bg-emerald-950/50 dark:active:bg-emerald-900/50 rounded-full border border-border/40 hover:border-emerald-200 active:border-emerald-300 dark:hover:border-emerald-700/50 dark:active:border-emerald-600/50 transition-all duration-200 hover:shadow-md hover:shadow-emerald-100/50 dark:hover:shadow-emerald-900/20 focus-visible:ring-2 focus-visible:ring-accent-emerald/20 focus-visible:ring-offset-1 h-auto disabled:opacity-50 disabled:cursor-not-allowed group"
                  >
                    <Paperclip className="h-3.5 w-3.5 text-muted-foreground group-hover:text-foreground transition-colors" />
                    <span className="text-xs font-medium text-muted-foreground group-hover:text-foreground transition-colors">
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
              isSummarizing={isSummarizing}
              hasExistingMessages={hasExistingMessages}
              conversationId={conversationId}
              onSend={handleSubmit}
              onStop={onStop}
              onSendAsNewConversation={handleSendAsNewConversation}
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
