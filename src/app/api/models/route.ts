/**
 * Models API Route - Convex Integration with Cursor-Based Pagination
 *
 * This API route integrates with Convex for secure API key management and model fetching.
 * Now uses cursor-based pagination for better performance and consistency.
 *
 * CONVEX INTEGRATION FEATURES:
 * - Fetches encrypted API keys from Convex database using server-side decryption
 * - Uses the same mock user authentication as the rest of the app
 * - Falls back to environment variables if Convex keys are unavailable
 * - Supports both server-encrypted and client-encrypted API keys
 * - Provides efficient server-side processing with caching
 *
 * PAGINATION:
 * Uses cursor-based pagination with modelId as the cursor for better performance
 * and consistent results, especially important for large model datasets.
 *
 * AUTHENTICATION:
 * Currently uses mock authentication (dev@example.com user) via api.users.ensureUser.
 * Authentication system has been removed - only anonymous users are supported.
 *
 * API KEY FLOW:
 * 1. Get mock user ID via Convex ensureUser mutation
 * 2. Query user's API keys from Convex database
 * 3. Decrypt server-encrypted keys using Convex actions
 * 4. Use decrypted keys to fetch models from providers
 * 5. Fall back to environment variables if Convex keys unavailable
 *
 * CAPABILITIES:
 * - Server-side search, filtering, and cursor-based pagination
 * - Capability computation and caching
 * - Provider and capability statistics
 * - Fetches models from OpenAI, Anthropic, Google, and OpenRouter
 *
 * SECURITY:
 * API keys are encrypted using AES-256-GCM before storage in Convex.
 * Server-side decryption happens in Convex actions with proper access control.
 */

import { NextRequest, NextResponse } from "next/server";
import { getModelCapabilities } from "@/lib/model-capabilities";
import { AIModel } from "@/types";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../convex/_generated/api";

// Initialize Convex client for server-side operations
const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

interface RawModel {
  modelId: string;
  name: string;
  provider: string;
  contextWindow: number;
  supportsReasoning: boolean;
  supportsTools: boolean;
  supportsImages: boolean;
  supportsFiles: boolean;
}

// OpenAI Models
async function fetchOpenAIModels(apiKey: string): Promise<RawModel[]> {
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

    const data = await response.json();
    return data.data
      .filter(
        (model: { id: string }) =>
          model.id.startsWith("gpt-") ||
          model.id.startsWith("o1-") ||
          model.id.includes("whisper") ||
          model.id.includes("tts") ||
          model.id.includes("dall-e")
      )
      .map((model: { id: string }) => ({
        modelId: model.id,
        name: model.id,
        provider: "openai",
        contextWindow: getOpenAIContextWindow(model.id),
        supportsReasoning: model.id.startsWith("o1-"),
        supportsTools:
          !model.id.startsWith("o1-") && model.id.startsWith("gpt-"),
        supportsImages:
          model.id.includes("vision") || model.id.startsWith("gpt-4"),
        supportsFiles: model.id.startsWith("gpt-"),
      }));
  } catch (error) {
    console.error("Failed to fetch OpenAI models:", error);
    return [];
  }
}

// Anthropic Models
async function fetchAnthropicModels(apiKey: string): Promise<RawModel[]> {
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
    return data.data.map((model: { id: string; display_name?: string }) => ({
      modelId: model.id,
      name: model.display_name || model.id,
      provider: "anthropic",
      contextWindow: getAnthropicContextWindow(model.id),
      supportsReasoning: false,
      supportsTools: true,
      supportsImages: model.id.includes("claude-3"),
      supportsFiles: true,
    }));
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
async function fetchGoogleModels(apiKey: string): Promise<RawModel[]> {
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

// OpenRouter Models
async function fetchOpenRouterModels(apiKey: string): Promise<RawModel[]> {
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
  if (modelId.includes("claude-3")) return 200000;
  if (modelId.includes("claude-2")) return 100000;
  return 100000;
}

function getGoogleContextWindow(modelName: string): number {
  if (modelName.includes("gemini-1.5-pro")) return 2097152;
  if (modelName.includes("gemini-1.5-flash")) return 1048576;
  if (modelName.includes("gemini-pro")) return 32768;
  return 32768;
}

// Mock user authentication - uses the same ensureUser logic as the rest of the app

// Get user ID using the same mock logic as Convex auth
async function getCurrentUserId(): Promise<string | null> {
  // Retry logic to wait for auth to be ready
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      // Check for authenticated user first
      const authenticatedUser = await convex.query(api.users.getCurrentUser);
      if (authenticatedUser) {
        return authenticatedUser._id;
      }

      // If no authenticated user, try to get/create anonymous user
      const userId = await convex.mutation(api.users.ensureUser);
      return userId;
    } catch (error) {
      if (attempt < 2) {
        // Wait a bit before retrying to give auth time to initialize
        await new Promise(resolve => setTimeout(resolve, 100 * (attempt + 1)));
        continue;
      }
      console.error("Failed to get current user ID after retries:", error);
      return null;
    }
  }
  return null;
}

// Fetch API keys from Convex database with server-side decryption
// For signed-in users, ONLY use Convex-stored keys, no environment fallback
async function getUserApiKeys(): Promise<
  Array<{
    provider: string;
    rawKey: string;
  }>
> {
  try {
    // Get the current user ID (authenticated or anonymous)
    const userId = await getCurrentUserId();
    if (!userId) {
      console.log(
        "No user authenticated, cannot fetch models without user-specific API keys"
      );
      return [];
    }

    // Check if this is an authenticated user vs anonymous user
    const authenticatedUser = await convex.query(api.users.getCurrentUser);
    const isAuthenticated = !!authenticatedUser;

    // Get list of user's API keys from Convex
    const userApiKeys = await convex.query(api.apiKeys.getUserApiKeys);

    if (!userApiKeys || userApiKeys.length === 0) {
      if (isAuthenticated) {
        console.log("Authenticated user has no API keys configured in Convex");
        return [];
      } else {
        // Only fall back to environment for anonymous users
        console.log("Anonymous user, using environment API keys as fallback");
        return getEnvironmentApiKeys();
      }
    }

    const decryptedKeys: Array<{ provider: string; rawKey: string }> = [];

    // Decrypt each API key using Convex server-side decryption
    for (const keyInfo of userApiKeys) {
      if (!keyInfo.hasKey || keyInfo.encryptionType !== "server") {
        // Skip keys that don't exist or are client-encrypted
        continue;
      }

      try {
        const decryptedKey = await convex.action(
          api.apiKeys.getDecryptedApiKey,
          {
            provider: keyInfo.provider as
              | "openai"
              | "anthropic"
              | "google"
              | "openrouter",
          }
        );

        if (decryptedKey) {
          decryptedKeys.push({
            provider: keyInfo.provider,
            rawKey: decryptedKey,
          });
        }
      } catch (error) {
        console.error(
          `Failed to decrypt API key for ${keyInfo.provider}:`,
          error
        );
        // Continue with other providers
      }
    }

    if (decryptedKeys.length === 0) {
      if (isAuthenticated) {
        console.log(
          "Authenticated user: no valid API keys could be decrypted from Convex"
        );
        return [];
      } else {
        // Only fall back to environment for anonymous users
        console.log(
          "Anonymous user: no decrypted user keys available, using environment API keys"
        );
        return getEnvironmentApiKeys();
      }
    }

    console.log(
      `Successfully retrieved ${decryptedKeys.length} API keys from Convex for ${isAuthenticated ? "authenticated" : "anonymous"} user`
    );
    return decryptedKeys;
  } catch (error) {
    console.error("Failed to get user API keys from Convex:", error);

    // Check if user is authenticated before falling back
    try {
      const authenticatedUser = await convex.query(api.users.getCurrentUser);
      if (authenticatedUser) {
        console.log(
          "Authenticated user: API key fetch failed, not falling back to environment variables"
        );
        return [];
      } else {
        console.log(
          "Anonymous user: API key fetch failed, falling back to environment variables"
        );
        return getEnvironmentApiKeys();
      }
    } catch {
      // If we can't even check auth status, assume anonymous and fall back
      return getEnvironmentApiKeys();
    }
  }
}

// Fallback to environment variables (for development/testing)
function getEnvironmentApiKeys(): Array<{ provider: string; rawKey: string }> {
  const apiKeys: Array<{ provider: string; rawKey: string }> = [];

  if (process.env.OPENAI_API_KEY) {
    apiKeys.push({
      provider: "openai",
      rawKey: process.env.OPENAI_API_KEY,
    });
  }

  if (process.env.ANTHROPIC_API_KEY) {
    apiKeys.push({
      provider: "anthropic",
      rawKey: process.env.ANTHROPIC_API_KEY,
    });
  }

  if (process.env.GEMINI_API_KEY) {
    apiKeys.push({
      provider: "google",
      rawKey: process.env.GEMINI_API_KEY!,
    });
  }

  if (process.env.OPENROUTER_API_KEY) {
    apiKeys.push({
      provider: "openrouter",
      rawKey: process.env.OPENROUTER_API_KEY,
    });
  }

  if (apiKeys.length > 0) {
    console.log(`Using ${apiKeys.length} API keys from environment variables`);
  }

  return apiKeys;
}

// Get default anonymous model - for users without API keys
function getAnonymousDefaultModel(): ModelWithCapabilities | null {
  // Only provide default model if we have the Gemini API key
  if (!process.env.GEMINI_API_KEY) {
    return null;
  }

  return {
    modelId: "gemini-2.5-flash-lite-preview-06-17",
    name: "Gemini 2.5 Flash Lite",
    provider: "google",
    contextWindow: 1048576,
    supportsReasoning: true,
    supportsTools: true,
    supportsImages: true,
    supportsFiles: true,
    capabilities: [
      "supportsReasoning",
      "supportsTools",
      "supportsImages",
      "supportsFiles",
      "fast",
    ],
    searchableText:
      "gemini 2.5 flash lite google gemini-2.5-flash-lite-preview-06-17",
  };
}

// Fetch all models from available providers
async function fetchAllModelsFromProviders(
  availableProviders: string[]
): Promise<RawModel[]> {
  const apiKeys = await getUserApiKeys();
  const allModels: RawModel[] = [];

  for (const keyInfo of apiKeys) {
    if (!availableProviders.includes(keyInfo.provider)) {
      continue;
    }

    try {
      let models: RawModel[] = [];

      switch (keyInfo.provider) {
        case "openai":
          models = await fetchOpenAIModels(keyInfo.rawKey);
          break;
        case "anthropic":
          models = await fetchAnthropicModels(keyInfo.rawKey);
          break;
        case "google":
          models = await fetchGoogleModels(keyInfo.rawKey);
          break;
        case "openrouter":
          models = await fetchOpenRouterModels(keyInfo.rawKey);
          break;
      }

      allModels.push(...models);
    } catch (error) {
      console.error(`Failed to fetch models for ${keyInfo.provider}:`, error);
      // Continue with other providers even if one fails
    }
  }

  return allModels;
}

interface ModelWithCapabilities {
  modelId: string;
  name: string;
  provider: string;
  contextWindow: number;
  supportsReasoning: boolean;
  supportsTools: boolean;
  supportsImages: boolean;
  supportsFiles: boolean;
  capabilities: string[];
  searchableText: string;
}

// Cache for model capabilities to avoid recomputation
const capabilityCache = new Map<string, string[]>();

function computeModelCapabilities(model: RawModel): string[] {
  if (capabilityCache.has(model.modelId)) {
    return capabilityCache.get(model.modelId)!;
  }

  const aiModel = {
    _id: "mock-id" as AIModel["_id"],
    _creationTime: 0,
    userId: "mock-user" as AIModel["userId"],
    createdAt: 0,
    modelId: model.modelId,
    name: model.name,
    provider: model.provider,
    contextLength: model.contextWindow,
    supportsReasoning: model.supportsReasoning,
    supportsTools: model.supportsTools,
    supportsImages: model.supportsImages,
    supportsFiles: model.supportsFiles,
  } as AIModel;

  const capabilities = getModelCapabilities(aiModel);
  const capabilityLabels = capabilities.map(cap => cap.label);

  const labelToKeyMap: Record<string, string> = {
    "Advanced Reasoning": "supportsReasoning",
    Vision: "supportsImages",
    Tools: "supportsTools",
    "File Upload": "supportsFiles",
    Fast: "fast",
    Coding: "coding",
    Latest: "latest",
  };

  const capabilityKeys: string[] = [];
  capabilityLabels.forEach(label => {
    const key = labelToKeyMap[label];
    if (key) capabilityKeys.push(key);
  });

  capabilityCache.set(model.modelId, capabilityKeys);
  return capabilityKeys;
}

function enhanceModel(model: RawModel): ModelWithCapabilities {
  const capabilities = computeModelCapabilities(model);
  const searchableText =
    `${model.name} ${model.modelId} ${model.provider}`.toLowerCase();

  return {
    ...model,
    capabilities,
    searchableText,
  };
}

function filterModels(
  models: ModelWithCapabilities[],
  filters: {
    search?: string;
    providers?: string[];
    capabilities?: string[];
    enabledOnly?: boolean;
    enabledModelIds?: Set<string>;
  }
): ModelWithCapabilities[] {
  let filtered = models;

  // Search filter
  if (filters.search?.trim()) {
    const query = filters.search.toLowerCase();
    filtered = filtered.filter(model => model.searchableText.includes(query));
  }

  // Provider filter
  if (filters.providers?.length) {
    const providerSet = new Set(filters.providers);
    filtered = filtered.filter(model => providerSet.has(model.provider));
  }

  // Capability filter
  if (filters.capabilities?.length) {
    filtered = filtered.filter(model =>
      filters.capabilities!.every(capability =>
        model.capabilities.includes(capability)
      )
    );
  }

  // Enabled models filter
  if (filters.enabledOnly && filters.enabledModelIds) {
    filtered = filtered.filter(model =>
      filters.enabledModelIds!.has(model.modelId)
    );
  }

  return filtered;
}

// Sort models for consistent pagination order
function sortModels(models: ModelWithCapabilities[]): ModelWithCapabilities[] {
  return models.sort((a, b) => {
    // Primary sort: provider
    if (a.provider !== b.provider) {
      return a.provider.localeCompare(b.provider);
    }
    // Secondary sort: modelId for consistent ordering
    return a.modelId.localeCompare(b.modelId);
  });
}

// Apply cursor-based pagination
function paginateModels(
  models: ModelWithCapabilities[],
  cursor?: string,
  limit: number = 50
): {
  data: ModelWithCapabilities[];
  nextCursor?: string;
  hasNextPage: boolean;
} {
  let startIndex = 0;

  // Find the starting position based on cursor
  if (cursor) {
    const cursorIndex = models.findIndex(model => model.modelId === cursor);
    if (cursorIndex !== -1) {
      startIndex = cursorIndex + 1; // Start after the cursor
    }
  }

  // Get the page data
  const endIndex = startIndex + limit;
  const pageData = models.slice(startIndex, endIndex);

  // Determine if there's a next page and what the next cursor should be
  const hasNextPage = endIndex < models.length;
  const nextCursor =
    hasNextPage && pageData.length > 0
      ? pageData[pageData.length - 1].modelId
      : undefined;

  return {
    data: pageData,
    nextCursor,
    hasNextPage,
  };
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Parse query parameters
    const search = searchParams.get("search") || "";
    const providers =
      searchParams.get("providers")?.split(",").filter(Boolean) || [];
    const capabilities =
      searchParams.get("capabilities")?.split(",").filter(Boolean) || [];
    const enabledOnly = searchParams.get("enabledOnly") === "true";
    const enabledModels =
      searchParams.get("enabledModels")?.split(",").filter(Boolean) || [];
    const cursor = searchParams.get("cursor") || undefined;
    const limit = Math.min(
      parseInt(searchParams.get("limit") || "50", 10),
      100
    ); // Cap at 100
    const includeStats = searchParams.get("includeStats") === "true";

    // Get available providers (from API keys or fallback to all)
    const availableProviders = providers.length
      ? providers
      : ["openai", "anthropic", "google", "openrouter"];

    // Fetch all models
    const rawModels = await fetchAllModelsFromProviders(availableProviders);

    // Enhance models with capabilities and searchable text
    let enhancedModels = rawModels.map(enhanceModel);

    // Add default anonymous model if no user API keys and we have Gemini API key
    const userApiKeys = await getUserApiKeys();
    const hasUserApiKeys = userApiKeys.length > 0;

    if (!hasUserApiKeys) {
      const anonymousModel = getAnonymousDefaultModel();
      if (anonymousModel) {
        enhancedModels = [anonymousModel, ...enhancedModels];
      }
    }

    // Apply filters
    const enabledModelIds = new Set(enabledModels);
    const filteredModels = filterModels(enhancedModels, {
      search,
      providers: providers.length ? providers : undefined,
      capabilities: capabilities.length ? capabilities : undefined,
      enabledOnly,
      enabledModelIds: enabledModelIds.size ? enabledModelIds : undefined,
    });

    // Sort models for consistent pagination
    const sortedModels = sortModels(filteredModels);

    // Apply cursor-based pagination
    const paginationResult = paginateModels(sortedModels, cursor, limit);

    // Convert to expected format
    const models = paginationResult.data.map(model => ({
      ...model,
      contextLength: model.contextWindow,
    }));

    const response: {
      models: ModelWithCapabilities[];
      pagination: {
        limit: number;
        total: number;
        hasNextPage: boolean;
        nextCursor?: string;
      };
      stats?: {
        totalModels: number;
        providerCounts: Record<string, number>;
        capabilityCounts: Record<string, number>;
      };
    } = {
      models,
      pagination: {
        limit,
        total: sortedModels.length,
        hasNextPage: paginationResult.hasNextPage,
        nextCursor: paginationResult.nextCursor,
      },
    };

    // Include stats if requested
    if (includeStats) {
      // Provider counts
      const providerCounts: Record<string, number> = {};
      availableProviders.forEach(provider => {
        providerCounts[provider] = enhancedModels.filter(
          m => m.provider === provider
        ).length;
      });

      // Capability counts
      const capabilityCounts: Record<string, number> = {};
      const capabilityKeys = [
        "supportsReasoning",
        "supportsImages",
        "supportsTools",
        "supportsFiles",
        "fast",
        "coding",
        "latest",
      ];
      capabilityKeys.forEach(key => {
        capabilityCounts[key] = enhancedModels.filter(m =>
          m.capabilities.includes(key)
        ).length;
      });

      response.stats = {
        totalModels: enhancedModels.length,
        providerCounts,
        capabilityCounts,
      };
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error fetching models:", error);
    return NextResponse.json(
      { error: "Failed to fetch models" },
      { status: 500 }
    );
  }
}
