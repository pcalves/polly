import { v } from "convex/values";
import { action } from "./_generated/server";
import { internal } from "./_generated/api";
import { Doc } from "./_generated/dataModel";

export const generateConversationSummary = action({
  args: {
    conversationId: v.id("conversations"),
    maxTokens: v.optional(v.number()),
  },
  handler: async (ctx, args): Promise<string> => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return "Previous conversation (context not available)";
    }

    try {
      // Get conversation messages
      const messages: Doc<"messages">[] = await ctx.runMutation(
        internal.messages.internalGetAllInConversation,
        { conversationId: args.conversationId }
      );

      if (!messages || messages.length === 0) {
        return "Previous conversation (no messages found)";
      }

      // Format messages for summarization
      const conversationText: string = messages
        .filter((msg: Doc<"messages">) => msg.role !== "system")
        .map((msg: Doc<"messages">) => {
          const role = msg.role === "user" ? "User" : "Assistant";
          return `${role}: ${msg.content}`;
        })
        .join("\n\n");

      if (!conversationText.trim()) {
        return "Previous conversation (no content found)";
      }

      const response: Response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite-preview-06-17:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: `Please provide a concise summary of the following conversation between a user and an AI assistant. Focus on the key topics discussed, questions asked, and main points covered. Keep the summary under ${args.maxTokens || 150} words and make it suitable as context for continuing the conversation in a new thread.

Conversation:
${conversationText}

Summary:`,
                  },
                ],
              },
            ],
            generationConfig: {
              maxOutputTokens: args.maxTokens || 150,
              temperature: 0.3,
            },
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Gemini API error: ${response.status}`);
      }

      const data = (await response.json()) as {
        candidates?: Array<{
          content?: {
            parts?: Array<{
              text?: string;
            }>;
          };
        }>;
      };
      const summary: string | undefined =
        data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

      if (!summary) {
        throw new Error("No summary generated");
      }

      return summary;
    } catch (error) {
      console.error("Error generating conversation summary:", error);
      return "Previous conversation (summary not available)";
    }
  },
});
