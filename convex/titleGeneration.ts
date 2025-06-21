import { v } from "convex/values";
import { action } from "./_generated/server";
import { api } from "./_generated/api";

export const generateTitle = action({
  args: {
    message: v.string(),
    conversationId: v.optional(v.id("conversations")),
  },
  handler: async (ctx, args): Promise<string> => {
    const apiKey = process.env.GEMINI_API_KEY;
    let generatedTitle: string;

    if (!apiKey) {
      // Fallback to simple title generation if no API key
      const clean = args.message.replace(/[#*`]/g, "").trim();
      generatedTitle =
        clean.length > 60
          ? clean.substring(0, 57) + "..."
          : clean || "New conversation";
    } else {
      try {
        const response = await fetch(
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
                      text: `Generate a concise, descriptive title (max 60 characters) for a conversation that starts with this message. Only return the title, no quotes or extra text:\n\n"${args.message}"`,
                    },
                  ],
                },
              ],
              generationConfig: {
                maxOutputTokens: 20,
                temperature: 0.3,
              },
            }),
          }
        );

        if (!response.ok) {
          throw new Error(`Gemini API error: ${response.status}`);
        }

        const data = await response.json();
        const title = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

        if (!title) {
          throw new Error("No title generated");
        }

        generatedTitle = title;
      } catch (error) {
        console.error("Error generating title with Gemini:", error);
        // Fallback to simple title generation
        const clean = args.message.replace(/[#*`]/g, "").trim();
        generatedTitle =
          clean.length > 60
            ? clean.substring(0, 57) + "..."
            : clean || "New conversation";
      }
    }

    // Update the conversation title if conversationId is provided
    if (args.conversationId) {
      await ctx.runMutation(api.conversations.update, {
        id: args.conversationId,
        title: generatedTitle,
      });
    }

    return generatedTitle;
  },
});
