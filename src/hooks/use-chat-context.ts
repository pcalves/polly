"use client";

import { useCallback } from "react";
import { ChatMessage, Attachment } from "@/types";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { ConversationId } from "@/types";

interface MessageContent {
  type: "text" | "image_url" | "file";
  text?: string;
  image_url?: { url: string };
  file?: { filename: string; file_data: string };
}

interface ContextMessage {
  role: "user" | "assistant" | "system";
  content: string | MessageContent[];
}

interface UseChatContextOptions {
  conversationId?: ConversationId;
  userId?: Id<"users">;
}

export function useChatContext({
  conversationId,
  userId,
}: UseChatContextOptions) {
  // Get conversation data to check for stored persona
  const conversation = useQuery(
    api.conversations.getAuthorized,
    conversationId ? { id: conversationId, userId } : "skip"
  );

  // Get personas to look up persona prompt
  const personas = useQuery(api.personas.list, { userId });

  const createMultimodalContent = useCallback(
    (
      content: string,
      attachments?: Attachment[]
    ): string | MessageContent[] => {
      if (!attachments?.length) return content;

      const contentParts: MessageContent[] = [];

      if (content) {
        contentParts.push({ type: "text", text: content });
      }

      attachments.forEach(attachment => {
        if (attachment.type === "image") {
          contentParts.push({
            type: "image_url",
            image_url: { url: attachment.url },
          });
        } else if (attachment.type === "pdf") {
          contentParts.push({
            type: "file",
            file: {
              filename: attachment.name,
              file_data: attachment.url,
            },
          });
        }
      });

      return contentParts;
    },
    []
  );

  const prepareContextMessages = useCallback(
    (
      messages:
        | ChatMessage[]
        | Array<{
            _id: string;
            role: string;
            content: string;
            attachments?: Attachment[];
          }>
    ): ContextMessage[] => {
      if (!messages) return [];

      return messages.map(msg => {
        const role = msg.role === "context" ? "user" : msg.role;
        const content = createMultimodalContent(msg.content, msg.attachments);

        return {
          role: role as "user" | "assistant" | "system",
          content,
        };
      });
    },
    [createMultimodalContent]
  );

  const getEffectivePersonaPrompt = useCallback(
    (providedPrompt?: string | null): string | null => {
      if (providedPrompt) return providedPrompt;

      if (conversation?.personaId && personas) {
        const storedPersona = personas.find(
          p => p._id === conversation.personaId
        );
        return storedPersona?.prompt || null;
      }

      return null;
    },
    [conversation?.personaId, personas]
  );

  const buildContextWithPersona = useCallback(
    (
      baseMessages: ContextMessage[],
      personaPrompt?: string | null
    ): ContextMessage[] => {
      if (!personaPrompt) return baseMessages;

      return [
        { role: "system" as const, content: personaPrompt },
        ...baseMessages,
      ];
    },
    []
  );

  const createUserMessage = useCallback(
    (content: string, attachments?: Attachment[]): ContextMessage => {
      return {
        role: "user",
        content: createMultimodalContent(content, attachments),
      };
    },
    [createMultimodalContent]
  );

  return {
    createMultimodalContent,
    prepareContextMessages,
    getEffectivePersonaPrompt,
    buildContextWithPersona,
    createUserMessage,
  };
}
