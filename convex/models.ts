import { action } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";

// OpenAI API Types - Public API structure
interface OpenAIModel {
  id: string;
  object: "model";
  created?: number;
  owned_by?: string;
  // Enhanced fields (only available in internal API)
  supported_methods?: string[];
  groups?: string[];
  features?: string[];
  max_tokens?: number;
}

interface OpenAIApiResponse {
  object: "list";
  data: OpenAIModel[];
}

// OpenAI Models
async function fetchOpenAIModels(apiKey: string) {
  try {
    const response = await fetch("https://api.openai.com/v1/models", {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data: OpenAIApiResponse = await response.json();

    return data.data
      .filter((model: OpenAIModel) => {
        const modelId = model.id;

        // Filter for chat-compatible models by ID patterns
        // Skip non-chat models entirely
        if (
          modelId.includes("whisper") ||
          modelId.includes("tts") ||
          modelId.includes("dall-e") ||
          modelId.includes("embedding") ||
          modelId.includes("moderation") ||
          modelId.includes("babbage") ||
          modelId.includes("davinci") ||
          modelId.includes("turbo-instruct")
        ) {
          return false;
        }

        // Include chat-compatible model families
        return (
          modelId.startsWith("gpt-3.5-turbo") ||
          modelId.startsWith("gpt-4") ||
          modelId.startsWith("o1-") ||
          modelId.startsWith("o3-") ||
          modelId.startsWith("o4-") ||
          modelId.includes("chatgpt")
        );
      })
      .map((model: OpenAIModel) => {
        const modelId = model.id;

        // Enhanced API fields (fall back to model ID-based detection for public API)
        const features = model.features || [];
        const groups = model.groups || [];
        const hasEnhancedData = features.length > 0 || groups.length > 0;

        // Capability detection: use enhanced data if available, otherwise use model ID patterns
        const supportsReasoning = hasEnhancedData
          ? groups.includes("reasoning") ||
            features.includes("reasoning_effort") ||
            features.includes("detailed_reasoning_summary")
          : modelId.startsWith("o1-") ||
            modelId.startsWith("o3-") ||
            modelId.startsWith("o4-");

        const supportsTools = hasEnhancedData
          ? features.includes("function_calling") ||
            features.includes("parallel_tool_calls")
          : !modelId.includes("o1-") && // o1 models don't support tools currently
            !modelId.includes("turbo-instruct") &&
            !modelId.includes("gpt-3.5-turbo-16k-0613"); // Exclude some older models

        const supportsImages = hasEnhancedData
          ? features.includes("image_content")
          : modelId.includes("vision") ||
            (modelId.startsWith("gpt-4") &&
              !modelId.includes("turbo-instruct") &&
              !modelId.includes("32k") &&
              !modelId.includes("0314") &&
              !modelId.includes("0613"));

        const supportsFiles = hasEnhancedData
          ? features.includes("file_content") ||
            features.includes("file_search") ||
            supportsImages
          : supportsImages || // Models with image support typically support files
            modelId.includes("gpt-4") || // Most GPT-4 models support files
            modelId.includes("gpt-3.5-turbo-1106") ||
            modelId.includes("gpt-3.5-turbo-0125");

        // Use max_tokens from enhanced API, with fallbacks for public API
        const contextWindow =
          hasEnhancedData && model.max_tokens
            ? model.max_tokens
            : getOpenAIContextWindow(modelId);

        // Generate display name based on model ID
        const name = generateOpenAIDisplayName(modelId);

        return {
          modelId,
          name,
          provider: "openai",
          contextWindow,
          supportsReasoning,
          supportsTools,
          supportsImages,
          supportsFiles,
        };
      });
  } catch (error) {
    console.error("Failed to fetch OpenAI models:", error);
    return [];
  }
}

// Helper function to generate better display names for OpenAI models
function generateOpenAIDisplayName(modelId: string): string {
  // Handle special cases first
  if (modelId === "chatgpt-4o-latest") return "ChatGPT 4o (Latest)";
  if (modelId.startsWith("gpt-4.5"))
    return modelId.replace("gpt-4.5", "GPT-4.5");
  if (modelId.startsWith("gpt-4.1"))
    return modelId.replace("gpt-4.1", "GPT-4.1");
  if (modelId.startsWith("gpt-4o")) return modelId.replace("gpt-4o", "GPT-4o");
  if (modelId.startsWith("gpt-4")) return modelId.replace("gpt-4", "GPT-4");
  if (modelId.startsWith("gpt-3.5"))
    return modelId.replace("gpt-3.5", "GPT-3.5");
  if (modelId.startsWith("o4")) return modelId.replace("o4", "o4");
  if (modelId.startsWith("o3")) return modelId.replace("o3", "o3");
  if (modelId.startsWith("o1")) return modelId.replace("o1", "o1");

  // Default: capitalize first letter and replace hyphens
  return modelId
    .split("-")
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

// Anthropic Models
async function fetchAnthropicModels(apiKey: string) {
  try {
    const response = await fetch("https://api.anthropic.com/v1/models", {
      headers: {
        "x-api-key": apiKey,
        "Content-Type": "application/json",
        "anthropic-version": "2023-06-01",
      },
    });

    if (!response.ok) {
      throw new Error(`Anthropic API error: ${response.status}`);
    }

    const data = await response.json();
    return data.data.map(
      (model: { id: string; display_name?: string; created_at?: string }) => {
        const modelId = model.id;
        const displayName = model.display_name || model.id;

        // More accurate capability detection based on model series
        const supportsImages =
          modelId.includes("claude-3") ||
          modelId.includes("claude-3.5") ||
          modelId.includes("claude-3.7") ||
          modelId.includes("claude-4");

        const supportsTools =
          modelId.includes("claude-3") ||
          modelId.includes("claude-3.5") ||
          modelId.includes("claude-3.7") ||
          modelId.includes("claude-4") ||
          !modelId.includes("claude-2"); // Most models except Claude 2 support tools

        const supportsFiles = supportsImages; // File uploads generally align with image support

        // Claude models don't currently support reasoning/thinking like o1 models
        const supportsReasoning = false;

        return {
          modelId,
          name: displayName,
          provider: "anthropic",
          contextWindow: getAnthropicContextWindow(modelId),
          supportsReasoning,
          supportsTools,
          supportsImages,
          supportsFiles,
        };
      }
    );
  } catch (error) {
    console.error("Failed to fetch Anthropic models:", error);
    return [];
  }
}

// Google API Types
interface GoogleApiModel {
  name: string; // e.g., "models/gemini-1.5-pro"
  baseModelId?: string;
  version?: string;
  displayName?: string;
  description?: string;
  inputTokenLimit?: number;
  outputTokenLimit?: number;
  supportedGenerationMethods?: string[];
  temperature?: number;
  maxTemperature?: number;
  topP?: number;
  topK?: number;
}

interface GoogleApiResponse {
  models: GoogleApiModel[];
}

// Helper function to determine if a model ID represents a specific Google model series
function isGoogleModelSeries(modelName: string, series: string): boolean {
  const normalizedName = modelName.toLowerCase();
  const normalizedSeries = series.toLowerCase();

  // Handle both "models/gemini-x.x-xxx" and "gemini-x.x-xxx" formats
  return (
    normalizedName.includes(normalizedSeries) ||
    normalizedName.includes(`models/${normalizedSeries}`)
  );
}

// Google Models
async function fetchGoogleModels(apiKey: string) {
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`
    );

    if (!response.ok) {
      console.error(`❌ Google API error: ${response.status}`);
      throw new Error(`Google API error: ${response.status}`);
    }

    const data: GoogleApiResponse = await response.json();

    const filteredModels = data.models
      .filter((model: GoogleApiModel) =>
        model.supportedGenerationMethods?.includes("generateContent")
      )
      .map((model: GoogleApiModel) => {
        const modelId = model.name.split("/").pop() || model.name;
        const displayName = model.displayName || modelId;

        // Accurate capability detection based on Google's official model specifications

        // Reasoning: Only Gemini 2.5 series models support advanced reasoning/thinking
        const supportsReasoning = isGoogleModelSeries(model.name, "gemini-2.5");

        // Tools: Most modern Gemini models support function calling
        const supportsTools =
          isGoogleModelSeries(model.name, "gemini-1.5") ||
          isGoogleModelSeries(model.name, "gemini-2.") ||
          model.name.includes("pro") ||
          (model.supportedGenerationMethods?.includes("generateContent") ??
            false);

        // Images: All modern Gemini models support vision except text-only variants
        const supportsImages =
          !model.name.toLowerCase().includes("text") && // Exclude text-only models
          (isGoogleModelSeries(model.name, "gemini-1.5") ||
            isGoogleModelSeries(model.name, "gemini-2.") ||
            model.name.includes("pro") ||
            model.name.toLowerCase().includes("vision") ||
            (model.displayName?.toLowerCase().includes("vision") ?? false) ||
            (model.description?.toLowerCase().includes("vision") ?? false) ||
            (model.description?.toLowerCase().includes("image") ?? false));

        // Files: Models with large context windows and modern Gemini series support file uploads
        const supportsFiles =
          (model.inputTokenLimit && model.inputTokenLimit >= 32000) ||
          isGoogleModelSeries(model.name, "gemini-1.5") ||
          isGoogleModelSeries(model.name, "gemini-2.") ||
          model.name.includes("pro");

        return {
          modelId,
          name: displayName,
          provider: "google",
          contextWindow:
            model.inputTokenLimit || getGoogleContextWindow(model.name),
          supportsReasoning,
          supportsTools,
          supportsImages,
          supportsFiles,
        };
      });

    return filteredModels;
  } catch (error) {
    console.error("❌ Failed to fetch Google models:", error);
    return [];
  }
}

// OpenRouter API Types
interface OpenRouterArchitecture {
  input_modalities: string[];
  output_modalities: string[];
  tokenizer: string;
  instruct_type: string | null;
}

interface OpenRouterPricing {
  internal_reasoning: string;
}

interface OpenRouterTopProvider {
  context_length: number;
  max_completion_tokens: number;
  is_moderated: boolean;
}

interface OpenRouterModel {
  id: string;
  canonical_slug: string;
  name: string;
  created: number;
  description: string;
  context_length: number;
  architecture: OpenRouterArchitecture;
  pricing: OpenRouterPricing;
  top_provider: OpenRouterTopProvider;
  per_request_limits: unknown;
  supported_parameters: string[];
}

interface OpenRouterApiResponse {
  data: OpenRouterModel[];
}

interface ModelResponse {
  modelId: string;
  name: string;
  provider: string;
  contextWindow: number;
  supportsReasoning: boolean;
  supportsTools: boolean;
  supportsImages: boolean;
  supportsFiles: boolean;
}

// OpenRouter Models
async function fetchOpenRouterModels(apiKey: string) {
  try {
    const response = await fetch("https://openrouter.ai/api/v1/models", {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      console.error(`❌ OpenRouter API error: ${response.status}`);
      throw new Error(`OpenRouter API error: ${response.status}`);
    }

    const data: OpenRouterApiResponse = await response.json();

    const mappedModels = data.data.map((model: OpenRouterModel) => {
      // Determine capabilities based on OpenRouter API schema
      const supportsReasoning =
        model.supported_parameters?.includes("reasoning") ||
        model.supported_parameters?.includes("include_reasoning") ||
        model.pricing?.internal_reasoning !== "0";

      const supportsTools =
        model.supported_parameters?.includes("tools") ||
        model.supported_parameters?.includes("tool_choice");

      const supportsImages =
        model.architecture?.input_modalities?.includes("image") ||
        model.architecture?.input_modalities?.includes("file");

      const supportsFiles =
        model.architecture?.input_modalities?.includes("file") ||
        model.context_length >= 32000; // Large context models typically support files

      return {
        modelId: model.id,
        name: model.name || model.id,
        provider: "openrouter",
        contextWindow: model.context_length || 4096,
        supportsReasoning,
        supportsTools,
        supportsImages,
        supportsFiles,
      };
    });

    return mappedModels;
  } catch (error) {
    console.error("❌ Failed to fetch OpenRouter models:", error);
    return [];
  }
}

// Context window helpers
function getOpenAIContextWindow(modelId: string): number {
  if (modelId.includes("gpt-4o")) return 128000;
  if (modelId.includes("gpt-4-turbo")) return 128000;
  if (modelId.includes("gpt-4")) return 8192;
  if (modelId.includes("gpt-3.5-turbo")) return 16385;
  if (modelId.includes("o1-")) return 200000;
  return 4096;
}

function getAnthropicContextWindow(modelId: string): number {
  // Claude 3.7 series
  if (modelId.includes("claude-3.7")) return 200000;

  // Claude 3.5 series
  if (modelId.includes("claude-3.5")) return 200000;

  // Claude 3 series (Opus, Sonnet, Haiku)
  if (modelId.includes("claude-3")) return 200000;

  // Claude 2 series
  if (modelId.includes("claude-2")) return 100000;

  // Default for newer models
  return 200000;
}

function getGoogleContextWindow(modelName: string): number {
  if (modelName.includes("gemini-1.5-pro")) return 2097152;
  if (modelName.includes("gemini-1.5-flash")) return 1048576;
  if (modelName.includes("gemini-pro")) return 32768;
  return 32768;
}

// Main action to fetch all models for a user
export const fetchAllModels = action({
  args: {},
  handler: async ctx => {
    const apiKeys = await ctx.runQuery(api.apiKeys.getUserApiKeys);

    const allModels = [];

    for (const keyInfo of apiKeys) {
      if (!keyInfo.hasKey) {
        continue;
      }

      try {
        // Get the decrypted API key
        const decryptedKey = await ctx.runAction(
          api.apiKeys.getDecryptedApiKey,
          {
            provider: keyInfo.provider as
              | "openai"
              | "anthropic"
              | "google"
              | "openrouter",
          }
        );

        if (!decryptedKey) {
          continue;
        }

        let models = [];

        switch (keyInfo.provider) {
          case "openai":
            models = await fetchOpenAIModels(decryptedKey);
            break;
          case "anthropic":
            models = await fetchAnthropicModels(decryptedKey);
            break;
          case "google":
            models = await fetchGoogleModels(decryptedKey);
            break;
          case "openrouter":
            models = await fetchOpenRouterModels(decryptedKey);
            break;
        }

        allModels.push(...models);
      } catch (error) {
        console.error(`Failed to fetch models for ${keyInfo.provider}:`, error);
        // Continue with other providers even if one fails
      }
    }

    return allModels;
  },
});

export const fetchProviderModels = action({
  args: {
    provider: v.string(),
  },
  handler: async (ctx, { provider }): Promise<ModelResponse[]> => {
    try {
      // Get the decrypted API key for this provider
      const decryptedKey = await ctx.runAction(api.apiKeys.getDecryptedApiKey, {
        provider: provider as "openai" | "anthropic" | "google" | "openrouter",
      });

      if (!decryptedKey) {
        return [];
      }

      switch (provider) {
        case "openai":
          return await fetchOpenAIModels(decryptedKey);
        case "anthropic":
          return await fetchAnthropicModels(decryptedKey);
        case "google":
          return await fetchGoogleModels(decryptedKey);
        case "openrouter":
          return await fetchOpenRouterModels(decryptedKey);
        default:
          return [];
      }
    } catch (error) {
      console.error(`Failed to fetch models for ${provider}:`, error);
      return [];
    }
  },
});
