"use client";

import { useAction } from "convex/react";
import { api } from "../../convex/_generated/api";
import { ConversationId, UserId, Attachment } from "@/types";
import { Id } from "../../convex/_generated/dataModel";
import { storeAnonymousUserId } from "./use-user";
import { useQueryClient } from "@tanstack/react-query";
import { clearConversationCache } from "@/lib/conversation-cache";

// Simplified hook using the single new conversation action
export function useCreateConversation() {
  const createNewConversation = useAction(
    api.conversations.createNewConversation
  );
  const queryClient = useQueryClient();

  const createConversation = async (
    firstMessage: string,
    sourceConversationId?: ConversationId,
    personaId?: Id<"personas"> | null,
    userId?: UserId,
    attachments?: Attachment[],
    useWebSearch?: boolean,
    personaPrompt?: string | null,
    generateTitle: boolean = true
  ) => {
    try {
      const result = await createNewConversation({
        userId,
        firstMessage,
        sourceConversationId,
        personaId: personaId || undefined,
        personaPrompt: personaPrompt || undefined,
        attachments,
        useWebSearch,
        generateTitle,
      });

      // If a new user was created, store the ID in localStorage
      if (result.isNewUser) {
        storeAnonymousUserId(result.userId);
      }

      // Invalidate conversation cache for both TanStack Query and clear localStorage cache
      console.log(
        "New conversation created, invalidating caches for user:",
        result.userId
      );
      queryClient.invalidateQueries({ queryKey: ["conversations"] });

      // Clear localStorage cache for the user to force fresh data
      clearConversationCache(result.userId);

      return result.conversationId;
    } catch (error) {
      console.error("Failed to create conversation:", error);
      const { toast } = await import("sonner");
      toast.error("Failed to create conversation", {
        description: "Unable to start a new conversation. Please try again.",
      });
      throw error;
    }
  };

  // Alias for backward compatibility - both methods do the same thing now
  const createNewConversationWithResponse = createConversation;

  return {
    createNewConversation: createConversation,
    createNewConversationWithResponse,
  };
}

// Utility functions for error handling
export const conversationErrorHandlers = {
  async handleDelete(operation: () => Promise<unknown>) {
    try {
      const result = await operation();
      const { toast } = await import("sonner");
      toast.success("Conversation deleted", {
        description: "The conversation has been permanently removed.",
      });
      return result;
    } catch (error) {
      console.error("Failed to delete conversation:", error);
      const { toast } = await import("sonner");
      toast.error("Failed to delete conversation", {
        description: "Unable to delete conversation. Please try again.",
      });
      throw error;
    }
  },

  async handleShare(operation: () => Promise<unknown>) {
    try {
      return await operation();
    } catch (error) {
      console.error("Failed to share conversation:", error);
      const { toast } = await import("sonner");
      toast.error("Failed to share conversation", {
        description: "Unable to share conversation. Please try again.",
      });
      throw error;
    }
  },
};
