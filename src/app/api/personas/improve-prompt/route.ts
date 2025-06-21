export async function POST(request: Request) {
  try {
    const { prompt } = await request.json();

    if (!prompt || typeof prompt !== "string") {
      return Response.json({ error: "Prompt is required" }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return Response.json(
        { error: "Gemini API key not configured" },
        { status: 500 }
      );
    }

    const improvementPrompt = `You are an expert at crafting effective system prompts for AI assistants. Transform the following basic prompt into a well-structured, professional system prompt that follows best practices.

Input: "${prompt}"

Create a high-quality system prompt that includes clear guidance on:
- Purpose and role definition
- Behavioral guidelines and rules
- Communication style and tone
- How to handle different scenarios

Focus on clarity, specificity, and actionability. Return ONLY the improved system prompt with no additional text, explanations, or formatting.`;

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
                  text: improvementPrompt,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 1500,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.text();
      console.error("Gemini API error:", errorData);
      throw new Error("Failed to improve prompt");
    }

    const data = await response.json();
    const improvedPrompt =
      data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

    if (!improvedPrompt) {
      throw new Error("No improvement generated");
    }

    return Response.json({ improvedPrompt });
  } catch (error) {
    console.error("Error improving prompt:", error);
    return Response.json(
      { error: "Failed to improve prompt" },
      { status: 500 }
    );
  }
}
