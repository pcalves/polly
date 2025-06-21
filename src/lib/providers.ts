import { AIProvider, AIModel, OpenRouterModel } from "@/types";

// Model definitions with static fallback pricing (per 1M tokens)
// Note: Pricing should be fetched from APIs when possible
const STATIC_MODELS = {
  openai: [
    {
      id: "gpt-4o",
      name: "GPT-4o",
      contextLength: 128000,
      fallbackInputPrice: 5.00,
      fallbackOutputPrice: 15.00,
      maxOutputTokens: 4096,
      supportsImages: true,
      supportsTools: true,
    },
    {
      id: "gpt-4o-mini",
      name: "GPT-4o Mini",
      contextLength: 128000,
      fallbackInputPrice: 0.15,
      fallbackOutputPrice: 0.60,
      maxOutputTokens: 16384,
      supportsImages: true,
      supportsTools: true,
    },
    {
      id: "gpt-4-turbo",
      name: "GPT-4 Turbo",
      contextLength: 128000,
      fallbackInputPrice: 10.00,
      fallbackOutputPrice: 30.00,
      maxOutputTokens: 4096,
      supportsImages: true,
      supportsTools: true,
    },
  ],
  anthropic: [
    {
      id: "claude-3-5-sonnet-20241022",
      name: "Claude 3.5 Sonnet",
      contextLength: 200000,
      fallbackInputPrice: 3.00,
      fallbackOutputPrice: 15.00,
      maxOutputTokens: 8192,
      supportsImages: true,
      supportsTools: true,
    },
    {
      id: "claude-3-5-haiku-20241022",
      name: "Claude 3.5 Haiku",
      contextLength: 200000,
      fallbackInputPrice: 0.80,
      fallbackOutputPrice: 4.00,
      maxOutputTokens: 8192,
      supportsImages: true,
      supportsTools: true,
    },
    {
      id: "claude-3-opus-20240229",
      name: "Claude 3 Opus",
      contextLength: 200000,
      fallbackInputPrice: 15.00,
      fallbackOutputPrice: 75.00,
      maxOutputTokens: 4096,
      supportsImages: true,
      supportsTools: true,
    },
  ],
  google: [
    {
      id: "gemini-2.0-flash-exp",
      name: "Gemini 2.0 Flash",
      contextLength: 1000000,
      fallbackInputPrice: 0.75,
      fallbackOutputPrice: 3.00,
      maxOutputTokens: 8192,
      supportsImages: true,
      supportsTools: true,
    },
    {
      id: "gemini-1.5-pro",
      name: "Gemini 1.5 Pro",
      contextLength: 2000000,
      fallbackInputPrice: 1.25,
      fallbackOutputPrice: 5.00,
      maxOutputTokens: 8192,
      supportsImages: true,
      supportsTools: true,
    },
    {
      id: "gemini-1.5-flash",
      name: "Gemini 1.5 Flash",
      contextLength: 1000000,
      fallbackInputPrice: 0.075,
      fallbackOutputPrice: 0.30,
      maxOutputTokens: 8192,
      supportsImages: true,
      supportsTools: true,
    },
  ],
};

// Cache for API-fetched pricing
const pricingCache: { [modelId: string]: { inputPrice: number; outputPrice: number } } = {};
let pricingCacheTime = 0;
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

async function fetchAllModelPricing(): Promise<void> {
  try {
    const response = await fetch("https://openrouter.ai/api/v1/models", {
      headers: {
        "HTTP-Referer": window.location.origin,
        "X-Title": "T3 Chat Clone",
      },
    });

    if (!response.ok) return;

    const data = await response.json();
    const models: OpenRouterModel[] = data.data;

    // Update pricing cache with all models from OpenRouter
    models.forEach(model => {
      pricingCache[model.id] = {
        inputPrice: parseFloat(model.pricing.prompt) * 1000000,
        outputPrice: parseFloat(model.pricing.completion) * 1000000,
      };
    });

    pricingCacheTime = Date.now();
  } catch (error) {
    console.warn("Failed to fetch model pricing from OpenRouter:", error);
  }
}

function createModelWithPricing(staticModel: Record<string, unknown>, provider: string): AIModel {
  const modelId = provider === "openai" ? String(staticModel.id) : `${provider}/${staticModel.id}`;
  const cached = pricingCache[modelId];
  
  return {
    id: String(staticModel.id),
    name: String(staticModel.name),
    provider,
    contextLength: Number(staticModel.contextLength),
    inputPrice: cached?.inputPrice ?? Number(staticModel.fallbackInputPrice),
    outputPrice: cached?.outputPrice ?? Number(staticModel.fallbackOutputPrice),
    maxOutputTokens: staticModel.maxOutputTokens ? Number(staticModel.maxOutputTokens) : undefined,
    supportsImages: Boolean(staticModel.supportsImages),
    supportsTools: Boolean(staticModel.supportsTools),
  };
}

export const AI_PROVIDERS: AIProvider[] = [
  {
    id: "openai",
    name: "OpenAI",
    models: [], // Will be populated with live pricing
    requiresApiKey: true,
    supportsImages: true,
    supportsStreaming: true,
  },
  {
    id: "anthropic",
    name: "Anthropic",
    models: [], // Will be populated with live pricing
    requiresApiKey: true,
    supportsImages: true,
    supportsStreaming: true,
  },
  {
    id: "google",
    name: "Google",
    models: [], // Will be populated with live pricing
    requiresApiKey: true,
    supportsImages: true,
    supportsStreaming: true,
  },
  {
    id: "openrouter",
    name: "OpenRouter",
    models: [], // Will be populated dynamically
    requiresApiKey: true,
    supportsImages: true,
    supportsStreaming: true,
  },
];

// Initialize models with current pricing
export async function initializeProviders(): Promise<void> {
  // Fetch pricing if cache is stale
  if (Date.now() - pricingCacheTime > CACHE_DURATION) {
    await fetchAllModelPricing();
  }

  // Update static provider models with live pricing
  const openaiProvider = AI_PROVIDERS.find(p => p.id === "openai");
  const anthropicProvider = AI_PROVIDERS.find(p => p.id === "anthropic");
  const googleProvider = AI_PROVIDERS.find(p => p.id === "google");

  if (openaiProvider) {
    openaiProvider.models = STATIC_MODELS.openai.map(model => 
      createModelWithPricing(model, "openai")
    );
  }

  if (anthropicProvider) {
    anthropicProvider.models = STATIC_MODELS.anthropic.map(model => 
      createModelWithPricing(model, "anthropic")
    );
  }

  if (googleProvider) {
    googleProvider.models = STATIC_MODELS.google.map(model => 
      createModelWithPricing(model, "google")
    );
  }
}

export async function fetchOpenRouterModels(): Promise<AIModel[]> {
  try {
    const response = await fetch("https://openrouter.ai/api/v1/models", {
      headers: {
        "HTTP-Referer": window.location.origin,
        "X-Title": "T3 Chat Clone",
      },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch OpenRouter models");
    }

    const data = await response.json();
    const models: OpenRouterModel[] = data.data;

    // Curated list of specific models we want to show
    const curatedModelIds = [
      "google/gemini-2.5-flash-preview-05-20",
      "google/gemini-2.5-pro-preview-05-06", 
      "x-ai/grok-3-mini",
      "deepseek/deepseek-v3",
      "deepseek/deepseek-r1-0528"
    ];

    const curatedModels = models
      .filter(model => curatedModelIds.includes(model.id))
      .map((model) => ({
        id: model.id,
        name: model.name,
        provider: "openrouter",
        contextLength: model.context_length,
        inputPrice: parseFloat(model.pricing.prompt) * 1000000, // Convert from per-token to per-1M tokens
        outputPrice: parseFloat(model.pricing.completion) * 1000000, // Convert from per-token to per-1M tokens
        maxOutputTokens: model.top_provider.max_completion_tokens,
        supportsImages: model.architecture.modality?.includes("image") || false,
        supportsTools: true,
      }));

    // Sort in the order we want them to appear
    const orderedModels = curatedModelIds
      .map(id => curatedModels.find(model => model.id === id))
      .filter(Boolean) as AIModel[];

    return orderedModels;
  } catch (error) {
    console.error("Failed to fetch OpenRouter models:", error);
    return [];
  }
}

export function getProviderById(id: string): AIProvider | undefined {
  return AI_PROVIDERS.find((provider) => provider.id === id);
}

export function getModelById(modelId: string): AIModel | undefined {
  for (const provider of AI_PROVIDERS) {
    const model = provider.models.find((m) => m.id === modelId);
    if (model) return model;
  }
  return undefined;
}

export function getAllModels(): AIModel[] {
  return AI_PROVIDERS.flatMap((provider) => provider.models);
}