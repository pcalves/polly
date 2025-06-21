import { v } from "convex/values";
import { action } from "./_generated/server";

export const generateConversationStarters = action({
  args: {
    selectedText: v.string(),
  },
  handler: async (ctx, args) => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      // Fallback to simple conversation starters if no API key
      return [
        "Can you explain this in more detail?",
        "What are the implications of this?",
        "How does this relate to other concepts?",
        "Can you give me a practical example?",
        "What are the pros and cons of this approach?",
      ];
    }

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
                    text: `You are generating conversation starter prompts that will be used to start NEW conversations with an AI assistant. These prompts are inspired by this selected text, but the new AI won't have any context about the original text.

Selected text: "${args.selectedText}"

Create 5 diverse, self-contained prompts that:
- Are inspired by the selected text but stand alone as complete conversation starters
- Each explores a DIFFERENT aspect or angle of the topic (practical applications, step-by-step guides, real-world examples, comparisons, troubleshooting, best practices, etc.)
- Include enough context so a new AI can understand what you're asking about
- Are specific and actionable rather than vague or generic  
- Feel like natural opening questions someone genuinely interested in the topic would ask
- Lead to valuable, detailed responses that go beyond surface-level information
- Are conversational but professional in tone

Each prompt should be a complete, standalone request that doesn't reference "this" or assume prior knowledge.

Return exactly 5 prompts, one per line, with no numbers, bullets, or formatting.`,
                  },
                ],
              },
            ],
            generationConfig: {
              maxOutputTokens: 100,
              temperature: 0.7,
            },
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Gemini API error: ${response.status}`);
      }

      const data = await response.json();
      const content = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

      if (!content) {
        throw new Error("No content generated");
      }

      // Parse the response into individual prompts
      const prompts = content
        .split("\n")
        .map((line: string) => line.trim())
        .filter((line: string) => line.length > 0)
        .slice(0, 5); // Ensure we only get 5 prompts

      return prompts;
    } catch (error) {
      console.error(
        "Error generating conversation starters with Gemini:",
        error
      );
      // Fallback to simple conversation starters
      return [
        "Can you explain this in more detail?",
        "What are the implications of this?",
        "How does this relate to other concepts?",
        "Can you give me a practical example?",
        "What are the pros and cons of this approach?",
      ];
    }
  },
});
