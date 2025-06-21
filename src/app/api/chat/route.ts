import { streamText, smoothStream } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { createAnthropic } from "@ai-sdk/anthropic";
import { createGoogleGenerativeAI } from "@ai-sdk/google";

interface ChatMessage {
  role: string;
  content: string;
}

export async function POST(req: Request) {
  try {
    const { messages, model, provider, apiKey, ...settings } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return new Response("Messages are required", { status: 400 });
    }

    if (!model || !provider) {
      return new Response("Model and provider are required", { status: 400 });
    }

    if (!apiKey) {
      return new Response("API key is required", { status: 400 });
    }

    let client;

    switch (provider) {
      case "openai":
        const openaiClient = createOpenAI({ apiKey });
        client = openaiClient(model);
        break;

      case "anthropic":
        const anthropicClient = createAnthropic({ apiKey });
        client = anthropicClient(model);
        break;

      case "google":
        const googleClient = createGoogleGenerativeAI({ apiKey });
        client = googleClient(model);
        break;

      case "openrouter":
        const openrouterClient = createOpenAI({
          baseURL: "https://openrouter.ai/api/v1",
          apiKey,
          headers: {
            "HTTP-Referer": process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
            "X-Title": "T3 Chat Clone",
          },
        });
        client = openrouterClient(model);
        break;

      default:
        return new Response(`Unsupported provider: ${provider}`, { status: 400 });
    }

    // Detect if content likely contains CJK characters and adjust chunking accordingly
    const hasCJKContent = (messages as ChatMessage[]).some((msg) => 
      /[\u4E00-\u9FFF\u3040-\u309F\u30A0-\u30FF]/.test(msg.content)
    );

    // Build the streamText options
    const streamOptions = {
      model: client,
      messages,
      temperature: settings.temperature ?? 0.7,
      maxTokens: settings.maxTokens ?? 4096,
      topP: settings.topP ?? 1,
      frequencyPenalty: settings.frequencyPenalty ?? 0,
      presencePenalty: settings.presencePenalty ?? 0,
      // Add smoothStream transform for better streaming experience
      experimental_transform: smoothStream({
        delayInMs: 15, // Slight delay for smoother word-by-word streaming
        chunking: hasCJKContent 
          ? /[\u4E00-\u9FFF\u3040-\u309F\u30A0-\u30FF]|\S+\s*/  // CJK character-by-character + words with spaces
          : 'word', // Default word-by-word for other languages
      }),
      ...(settings.enableReasoning && (() => {
        // Check if the model supports reasoning
        let supportsReasoning = false;
        
        if (provider === "openrouter") {
          const reasoningModels = [
            "google/gemini-2.5-pro-preview", 
            "google/gemini-2.5-flash-preview",
            "deepseek/deepseek-r1",
            "openai/o1",
            "openai/o1-mini"
          ];
          supportsReasoning = reasoningModels.some(reasoningModel => 
            model.includes(reasoningModel.split('/')[1])
          );
        } else if (provider === "openai") {
          // Direct OpenAI models that support reasoning
          const openaiReasoningModels = ["o1", "o1-mini", "o1-preview"];
          supportsReasoning = openaiReasoningModels.some(reasoningModel => 
            model.includes(reasoningModel)
          );
        }
        
        console.log("Reasoning check:", { model, provider, supportsReasoning, enableReasoning: settings.enableReasoning });
        
        if (supportsReasoning && provider === "openrouter") {
          // Only apply reasoning config for OpenRouter for now
          return {
            experimental_toolCallStreaming: true,
            reasoning: true,
            include_reasoning: true,
          };
        }
        
        // Don't apply reasoning config for other providers yet to avoid errors
        return {};
      })()),
    };

    console.log("Stream options:", JSON.stringify(streamOptions, null, 2));
    const result = await streamText(streamOptions);

    return result.toDataStreamResponse();
  } catch (error) {
    console.error("Chat API error:", error);
    
    if (error instanceof Error) {
      if (error.message.includes("API key")) {
        return new Response("Invalid API key", { status: 401 });
      }
      if (error.message.includes("rate limit")) {
        return new Response("Rate limit exceeded", { status: 429 });
      }
      if (error.message.includes("insufficient")) {
        return new Response("Insufficient credits", { status: 402 });
      }
    }

    return new Response("Internal server error", { status: 500 });
  }
}