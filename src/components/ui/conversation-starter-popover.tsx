"use client";

import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { useAction } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useRouter } from "next/navigation";
import { useCreateConversation } from "@/hooks/use-conversations";
import { useUser } from "@/hooks/use-user";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface ConversationStarterPopoverProps {
  selectedText: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
  className?: string;
}

export function ConversationStarterPopover({
  selectedText,
  open,
  onOpenChange,
  children,
  className,
}: ConversationStarterPopoverProps) {
  const [prompts, setPrompts] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const generateStarters = useAction(
    api.conversationStarters.generateConversationStarters
  );
  const { user } = useUser();
  const { createNewConversationWithResponse } = useCreateConversation();
  const router = useRouter();

  useEffect(() => {
    async function fetchPrompts() {
      try {
        setIsLoading(true);
        const generatedPrompts = await generateStarters({ selectedText });
        setPrompts(generatedPrompts);
      } catch (err) {
        console.error("Failed to generate conversation starters:", err);
        // Use fallback prompts on error
        setPrompts([
          "Can you explain this in more detail?",
          "What are the implications of this?",
          "How does this relate to other concepts?",
          "Can you give me a practical example?",
          "What are the pros and cons of this approach?",
        ]);
      } finally {
        setIsLoading(false);
      }
    }

    fetchPrompts();
  }, [selectedText, generateStarters]);

  const handleStartConversation = async (prompt: string) => {
    if (!user) return;

    try {
      // Create conversation with user message and start assistant response
      const conversationId = await createNewConversationWithResponse(
        prompt,
        undefined,
        null, // no persona for conversation starters
        user._id
      );

      if (conversationId) {
        // Navigate to conversation - the Convex action already started the assistant response
        router.push(`/chat/${conversationId}`);
        onOpenChange(false);
      }
    } catch (error) {
      console.error("Failed to start conversation:", error);
      const { toast } = await import("sonner");
      toast.error("Failed to start conversation", {
        description:
          "Unable to create conversation from this prompt. Please try again.",
      });
    }
  };

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent
        className={cn("w-[380px] p-0 max-h-[300px]", className)}
        side="bottom"
        align="center"
        sideOffset={8}
        collisionPadding={10}
      >
        <div className="bg-background border-0 rounded-xl overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center py-6 px-4">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm">Generating ideas...</span>
              </div>
            </div>
          ) : (
            <div className="max-h-[300px] overflow-y-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-border/50">
              <div className="p-4 space-y-2">
                {prompts.map((prompt, index) => (
                  <button
                    key={index}
                    className="w-full text-left p-3 text-sm text-foreground hover:bg-accent/50 rounded-md transition-colors duration-200 cursor-pointer border-0 bg-transparent"
                    onClick={() => handleStartConversation(prompt)}
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
