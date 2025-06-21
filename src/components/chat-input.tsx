"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Paperclip, X, Brain } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Attachment, ChatSettings } from "@/types";
import { ModelPicker } from "@/components/model-picker";

interface ChatInputProps {
  onSendMessage: (content: string, attachments?: Attachment[]) => void;
  onInputStart?: () => void;
  isLoading?: boolean;
  placeholder?: string;
  settings: ChatSettings;
  onSettingsChange: (settings: ChatSettings) => void;
}

export function ChatInput({ 
  onSendMessage, 
  onInputStart,
  isLoading = false, 
  placeholder = "Type your message...",
  settings,
  onSettingsChange
}: ChatInputProps) {
  const [input, setInput] = useState("");
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [hasStartedTyping, setHasStartedTyping] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [input]);

  const handleSubmit = () => {
    if (!input.trim() && attachments.length === 0) return;
    if (isLoading) return;

    onSendMessage(input.trim(), attachments.length > 0 ? attachments : undefined);
    setInput("");
    setAttachments([]);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    for (const file of files) {
      if (file.type.startsWith("image/") || file.type === "application/pdf") {
        const reader = new FileReader();
        reader.onload = (event) => {
          const attachment: Attachment = {
            type: file.type.startsWith("image/") ? "image" : "pdf",
            url: event.target?.result as string,
            name: file.name,
            size: file.size,
          };
          setAttachments(prev => [...prev, attachment]);
        };
        reader.readAsDataURL(file);
      }
    }
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleModelChange = (modelId: string) => {
    // Determine the correct provider for this model
    let provider = settings.provider;
    
    // Check if this is an OpenRouter model (from our curated list)
    const openRouterModelIds = [
      "google/gemini-2.5-flash-preview-05-20",
      "google/gemini-2.5-pro-preview-05-06", 
      "x-ai/grok-3-mini",
      "deepseek/deepseek-v3",
      "deepseek/deepseek-r1-0528"
    ];
    
    if (openRouterModelIds.includes(modelId)) {
      provider = "openrouter";
    } else {
      // Fallback: extract provider from model ID for non-OpenRouter models
      const providerMap: { [key: string]: string } = {
        "gpt": "openai",
        "claude": "anthropic", 
        "gemini": "google"
      };
      
      for (const [key, value] of Object.entries(providerMap)) {
        if (modelId.includes(key)) {
          provider = value;
          break;
        }
      }
    }
    
    onSettingsChange({
      ...settings,
      model: modelId,
      provider,
    });
  };

  const toggleReasoning = () => {
    onSettingsChange({
      ...settings,
      enableReasoning: !settings.enableReasoning
    });
  };





  return (
    <div className="bg-background border-t border-border/30 relative">
      {/* Main input container with Grok-style design */}
      <div className="max-w-4xl mx-auto p-4">
        {/* Attachments */}
        {attachments.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-2">
            {attachments.map((attachment, index) => (
              <div
                key={index}
                className="flex items-center gap-2 rounded-full bg-muted/50 px-3 py-1.5 text-sm border border-border/30"
              >
                <span className="text-muted-foreground text-xs">
                  {attachment.type === "image" ? "🖼️" : "📄"}
                </span>
                <span className="max-w-[150px] truncate text-xs">{attachment.name}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeAttachment(index)}
                  className="h-4 w-4 p-0 hover:bg-destructive/20 hover:text-destructive rounded-full"
                >
                  <X className="h-2.5 w-2.5" />
                </Button>
              </div>
            ))}
          </div>
        )}

        {/* Main input area */}
        <div className="relative rounded-2xl border border-border/40 bg-background/80 backdrop-blur-sm shadow-sm hover:border-border/60 focus-within:border-border/80 transition-all duration-200">
          {/* Controls bar */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border/30">
            <div className="flex items-center gap-3">
              {/* Model selector - using Select directly */}
              <div className="min-w-[140px]">
                <ModelPicker
                  value={settings.model}
                  onChange={handleModelChange}
                />
              </div>
              
              {/* Reasoning toggle - always visible */}
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleReasoning}
                className={cn(
                  "h-8 px-3 rounded-lg text-xs font-medium transition-all duration-200 border",
                  settings.enableReasoning 
                    ? "bg-primary/10 text-primary hover:bg-primary/15 border-primary/30" 
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50 border-transparent hover:border-border/50"
                )}
              >
                <Brain className="h-3.5 w-3.5 mr-1.5" />
                Reasoning
              </Button>
            </div>
          </div>

          {/* Input container */}
          <div className="flex items-end gap-3 p-4">
            <div className="flex-1">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => {
                  const newValue = e.target.value;
                  setInput(newValue);
                  
                  // Trigger conversation creation on first input
                  if (!hasStartedTyping && newValue.trim() && onInputStart) {
                    setHasStartedTyping(true);
                    onInputStart();
                  }
                }}
                onKeyDown={handleKeyDown}
                placeholder={placeholder}
                className={cn(
                  "w-full min-h-[24px] max-h-[200px] resize-none",
                  "border-0 bg-transparent px-0 py-0 outline-0 ring-0",
                  "placeholder:text-muted-foreground/60 text-base leading-6",
                  "focus:outline-0 focus:ring-0 focus:border-0"
                )}
                rows={1}
                style={{ 
                  border: 'none',
                  outline: 'none',
                  boxShadow: 'none'
                }}
              />
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,.pdf"
                onChange={handleFileUpload}
                multiple
                className="hidden"
              />
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={isLoading}
                className="h-8 w-8 p-0 rounded-lg hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-all duration-200"
              >
                <Paperclip className="h-4 w-4" />
              </Button>

              <Button
                onClick={handleSubmit}
                disabled={(!input.trim() && attachments.length === 0) || isLoading}
                size="sm"
                className={cn(
                  "h-8 w-8 p-0 rounded-lg transition-all duration-200",
                  (!input.trim() && attachments.length === 0) || isLoading
                    ? "bg-muted text-muted-foreground cursor-not-allowed hover:bg-muted"
                    : "bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm hover:shadow-md hover:scale-105"
                )}
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}