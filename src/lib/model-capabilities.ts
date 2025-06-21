import { AIModel } from "@/types";
import { Brain, Eye, Wrench, Zap, Code2, Sparkles } from "lucide-react";

/**
 * Centralized model capabilities and utility functions
 * Consolidated from model-utils.ts to avoid duplication and inconsistencies
 */

// Model display name mapping for common models
export const MODEL_DISPLAY_NAMES: Record<string, string> = {
  "gpt-4o": "GPT-4o",
  "gpt-4o-mini": "GPT-4o mini",
  "gpt-4": "GPT-4",
  "claude-3-5-sonnet-20241022": "Claude 3.5 Sonnet",
  "claude-3-5-haiku-20241022": "Claude 3.5 Haiku",
  "gemini-2.5-flash-lite-preview-06-17": "Gemini 2.5 Flash Lite",
  "google/gemini-2.5-flash-preview-05-20": "Gemini 2.5 Flash",
  "google/gemini-2.5-pro-preview-05-06": "Gemini 2.5 Pro",
  "google/gemini-2.5-flash-lite-preview-06-17": "Gemini 2.5 Flash Lite",
  "deepseek/deepseek-v3": "DeepSeek V3",
  "deepseek/deepseek-r1-0528": "DeepSeek R1",
  "x-ai/grok-3-mini": "Grok 3 Mini",
};

/**
 * Get display name for a model, with fallback support
 */
export function getModelDisplayName(modelId: string, model?: AIModel): string {
  if (model?.name) {
    return model.name;
  }
  return MODEL_DISPLAY_NAMES[modelId] || "Select model";
}

/**
 * Determine the provider for a model ID using pattern matching
 * This is used as a fallback when the model isn't found in the enhanced lookup
 */
export function inferProviderFromModelId(modelId: string): string {
  // Known OpenRouter model IDs
  const openRouterModelIds = [
    "google/gemini-2.5-flash-preview-05-20",
    "google/gemini-2.5-pro-preview-05-06",
    "x-ai/grok-3-mini",
    "deepseek/deepseek-v3",
    "deepseek/deepseek-r1-0528",
  ];

  // Check if it's a known OpenRouter model
  if (openRouterModelIds.includes(modelId)) {
    return "openrouter";
  }

  // Check for OpenRouter patterns
  if (
    modelId.includes("/") ||
    modelId.includes("deepseek") ||
    modelId.includes("grok") ||
    (modelId.includes("gemini") && modelId.includes("preview"))
  ) {
    return "openrouter";
  }

  // Provider patterns
  const providerPatterns: Record<string, string> = {
    gpt: "openai",
    o1: "openai",
    claude: "anthropic",
    sonnet: "anthropic",
    haiku: "anthropic",
    opus: "anthropic",
    gemini: "google",
    palm: "google",
    bison: "google",
  };

  // Check provider patterns
  for (const [pattern, provider] of Object.entries(providerPatterns)) {
    if (modelId.toLowerCase().includes(pattern.toLowerCase())) {
      return provider;
    }
  }

  // If model has dashes or slashes but no other pattern matches, assume OpenRouter
  if (modelId.includes("-") || modelId.includes("/")) {
    return "openrouter";
  }

  // Default fallback
  return "openai";
}

/**
 * Provider-aware capability detection functions
 * These are the single source of truth for determining model capabilities
 */

/**
 * Check if a model supports reasoning capabilities
 * Uses provider-specific logic for accurate detection
 */
export function hasReasoningCapabilities(
  model?: ModelForCapabilities
): boolean {
  if (!model) return false;

  // Use explicit model property first
  if (model.supportsReasoning !== undefined) {
    return model.supportsReasoning;
  }

  // Provider-specific detection
  switch (model.provider) {
    case "google":
      return model.modelId.includes("gemini-2.5");
    case "openrouter":
      // Note: For real-time reasoning detection, the streaming logic in convex/openai.ts
      // fetches capabilities directly from the OpenRouter API. This fallback uses pattern matching.
      return (
        // OpenAI reasoning models
        model.modelId.includes("o1-") ||
        model.modelId.includes("o3-") ||
        // DeepSeek reasoning models
        model.modelId.includes("deepseek-r1") ||
        model.modelId.includes("deepseek/deepseek-r1") ||
        // Anthropic reasoning models
        model.modelId.includes("claude-opus-4") ||
        model.modelId.includes("claude-sonnet-4") ||
        model.modelId.includes("claude-3-7-sonnet") ||
        // Gemini reasoning models via OpenRouter
        model.modelId.includes("gemini-2.5") ||
        // General reasoning indicator
        model.modelId.includes("reasoning") ||
        model.modelId.includes("thinking")
      );
    case "openai":
      return (
        model.modelId.startsWith("o1-") ||
        model.modelId.startsWith("o3-") ||
        model.modelId.startsWith("o4-")
      );
    case "anthropic":
      return (
        model.modelId.includes("claude-opus-4") ||
        model.modelId.includes("claude-sonnet-4") ||
        model.modelId.includes("claude-3-7-sonnet")
      );
    default:
      return false;
  }
}

/**
 * Check if a model supports image uploads/vision
 */
export function hasImageUploadCapabilities(
  model?: ModelForCapabilities
): boolean {
  if (!model) return false;

  // Use explicit model property first
  if (model.supportsImages !== undefined) {
    return model.supportsImages;
  }

  // Provider-specific detection
  switch (model.provider) {
    case "google":
      return (
        model.modelId.includes("vision") ||
        model.modelId.includes("pro") ||
        model.modelId.includes("gemini-1.5") ||
        model.modelId.includes("gemini-2.")
      );
    case "openrouter":
      return (
        model.modelId.includes("vision") ||
        model.modelId.includes("gpt-4") ||
        model.modelId.includes("claude-3") ||
        model.modelId.includes("gemini") ||
        model.modelId.includes("qwen-vl")
      );
    case "openai":
      return (
        model.modelId.includes("vision") || model.modelId.startsWith("gpt-4")
      );
    case "anthropic":
      return model.modelId.includes("claude-3");
    default:
      return false;
  }
}

/**
 * Check if a model supports tools/function calling
 */
export function hasToolsCapabilities(model?: ModelForCapabilities): boolean {
  if (!model) return false;

  // Use explicit model property first
  if (model.supportsTools !== undefined) {
    return model.supportsTools;
  }

  // Provider-specific detection
  switch (model.provider) {
    case "google":
      return (
        model.modelId.includes("gemini-1.5") ||
        model.modelId.includes("gemini-2.") ||
        model.modelId.includes("pro")
      );
    case "openrouter":
      return !model.modelId.includes("o1-"); // Most models except o1 support tools
    case "openai":
      return (
        !model.modelId.startsWith("o1-") && model.modelId.startsWith("gpt-")
      );
    case "anthropic":
      return true; // All Claude models support tools
    default:
      return false;
  }
}

/**
 * Check if a model supports file uploads
 */
export function hasFileUploadCapabilities(model?: AIModel): boolean {
  if (!model) return false;

  // Use explicit model property first (if we had one)
  // Note: supportsFiles is not currently a model property

  // Provider-specific detection
  switch (model.provider) {
    case "google":
      return Boolean(model.contextLength && model.contextLength >= 100000);
    case "openrouter":
      return true; // OpenRouter generally supports file uploads
    case "openai":
      return model.modelId.startsWith("gpt-");
    case "anthropic":
      return true; // All Claude models support file uploads
    default:
      return false;
  }
}

/**
 * Check if a model is optimized for speed
 */
export function isFastModel(model?: ModelForCapabilities): boolean {
  if (!model) return false;

  // Provider-specific detection
  switch (model.provider) {
    case "google":
      return model.modelId.includes("flash");
    case "openrouter":
      return (
        model.modelId.includes("mini") ||
        model.modelId.includes("flash") ||
        model.modelId.includes("haiku") ||
        Boolean(model.contextLength && model.contextLength < 50000)
      );
    case "openai":
      return model.modelId.includes("mini") || model.modelId.includes("turbo");
    case "anthropic":
      return model.modelId.includes("haiku");
    default:
      return (
        model.modelId.includes("mini") ||
        model.modelId.includes("flash") ||
        model.modelId.includes("haiku") ||
        Boolean(model.contextLength && model.contextLength < 50000)
      );
  }
}

/**
 * Check if a model is good for coding tasks
 */
export function isCodingModel(model?: ModelForCapabilities): boolean {
  if (!model) return false;

  // Provider-specific detection
  switch (model.provider) {
    case "google":
      return (
        model.modelId.includes("pro") ||
        model.modelId.includes("gemini-1.5") ||
        model.modelId.includes("gemini-2.")
      );
    case "openrouter":
      return (
        model.modelId.includes("code") ||
        model.modelId.includes("deepseek") ||
        model.modelId.includes("claude")
      );
    case "openai":
      return (
        model.modelId.startsWith("gpt-4") || model.modelId.includes("code")
      );
    case "anthropic":
      return true; // All Claude models are good for coding
    default:
      return (
        model.modelId.includes("code") ||
        model.modelId.includes("deepseek") ||
        model.modelId.includes("claude")
      );
  }
}

/**
 * Check if a model is a latest/newest version
 */
export function isLatestModel(model?: ModelForCapabilities): boolean {
  if (!model) return false;

  // Provider-specific detection
  switch (model.provider) {
    case "google":
      return (
        model.modelId.includes("gemini-2.") ||
        model.modelId.includes("2024") ||
        model.modelId.includes("2025")
      );
    case "openrouter":
      return (
        model.modelId.includes("2.5") ||
        model.modelId.includes("4o") ||
        model.modelId.includes("2024") ||
        model.modelId.includes("2025")
      );
    case "openai":
      return (
        model.modelId.includes("4o") ||
        model.modelId.includes("2024") ||
        model.modelId.includes("2025")
      );
    case "anthropic":
      return (
        model.modelId.includes("claude-3.5") ||
        model.modelId.includes("2024") ||
        model.modelId.includes("2025")
      );
    default:
      return (
        model.modelId.includes("2.5") ||
        model.modelId.includes("4o") ||
        model.modelId.includes("2024") ||
        model.modelId.includes("2025")
      );
  }
}

/**
 * Generic capability checker that maps capability keys to the appropriate functions
 */
export function hasCapability(model?: AIModel, capability?: string): boolean {
  if (!model || !capability) return false;

  switch (capability) {
    case "supportsReasoning":
      return hasReasoningCapabilities(model);
    case "supportsImages":
      return hasImageUploadCapabilities(model);
    case "supportsTools":
      return hasToolsCapabilities(model);
    case "supportsFiles":
      return hasFileUploadCapabilities(model);
    case "fast":
      return isFastModel(model);
    case "coding":
      return isCodingModel(model);
    case "latest":
      return isLatestModel(model);
    default:
      return false;
  }
}

/**
 * Enhanced model resolution that combines enhanced lookup with pattern matching fallback
 */
export function resolveModelProvider(
  modelId: string,
  getModelById?: (id: string) => AIModel | undefined
): {
  provider: string;
  model?: AIModel;
  source: "enhanced" | "fallback";
} {
  // Try enhanced lookup first
  if (getModelById) {
    const model = getModelById(modelId);
    if (model?.provider) {
      return {
        provider: model.provider,
        model,
        source: "enhanced",
      };
    }
  }

  // Fall back to pattern matching
  const provider = inferProviderFromModelId(modelId);
  return {
    provider,
    source: "fallback",
  };
}

export interface ModelCapability {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  description: string;
}

// Capability color mapping - consistent colors for each capability type
export const getCapabilityColor = (capabilityLabel: string) => {
  switch (capabilityLabel) {
    case "Advanced Reasoning":
      return "text-accent-purple";
    case "Vision":
      return "text-accent-blue";
    case "Tools":
      return "text-accent-emerald";
    case "Fast":
      return "text-accent-yellow";
    case "Coding":
      return "text-accent-emerald";
    case "Latest":
      return "text-accent-orange";
    default:
      return "text-accent-blue";
  }
};

// Define a flexible model type for capability detection
type ModelForCapabilities = {
  modelId: string;
  name: string;
  provider: string;
  contextLength?: number;
  contextWindow?: number;
  maxOutputTokens?: number;
  supportsReasoning?: boolean;
  supportsTools?: boolean;
  supportsImages?: boolean;
  supportsFiles?: boolean;
  inputModalities?: string[];
};

// Enhanced capability detection using the provider-aware functions
export const getModelCapabilities = (
  model: ModelForCapabilities
): ModelCapability[] => {
  const capabilities: ModelCapability[] = [];

  if (hasReasoningCapabilities(model)) {
    capabilities.push({
      icon: Brain,
      label: "Advanced Reasoning",
      description: "Chain-of-thought and complex reasoning",
    });
  }

  if (hasImageUploadCapabilities(model)) {
    capabilities.push({
      icon: Eye,
      label: "Vision",
      description: "Can analyze images and visual content",
    });
  }

  if (hasToolsCapabilities(model)) {
    capabilities.push({
      icon: Wrench,
      label: "Tools",
      description: "Can call functions and use external tools",
    });
  }

  if (isFastModel(model)) {
    capabilities.push({
      icon: Zap,
      label: "Fast",
      description: "Quick responses, lower latency",
    });
  }

  if (isCodingModel(model)) {
    capabilities.push({
      icon: Code2,
      label: "Coding",
      description: "Excellent for programming tasks",
    });
  }

  if (isLatestModel(model)) {
    capabilities.push({
      icon: Sparkles,
      label: "Latest",
      description: "Newest model version",
    });
  }

  return capabilities;
};

/**
 * Check if a model supports PDF uploads
 * For OpenRouter models, check input_modalities for "file" support
 * Otherwise, use heuristics based on provider and context length
 */
export function hasPdfUploadCapabilities(model?: AIModel): boolean {
  if (!model) return false;

  // For OpenRouter models, check if they support "file" modality
  if (model.provider === "openrouter" && model.inputModalities) {
    return model.inputModalities.includes("file");
  }

  // OpenRouter models without inputModalities data - assume they support PDFs
  if (model.provider === "openrouter") {
    return true;
  }

  // Models with large context windows are more likely to support PDFs
  if (model.contextLength && model.contextLength >= 100000) {
    return true;
  }

  // Some specific models known to support PDFs
  const pdfSupportedModels = [
    "gpt-4o",
    "gpt-4o-mini",
    "claude-3-5-sonnet",
    "claude-3-5-haiku",
    "gemini-2.5-flash-lite-preview-06-17",
    "gemini-2.5-flash",
    "gemini-2.5-pro",
  ];

  return pdfSupportedModels.some(supportedModel =>
    model.modelId.includes(supportedModel)
  );
}

/**
 * All models support text file uploads (we process them as text content)
 */
export function hasTextFileCapabilities(): boolean {
  return true; // All models can handle text content
}

/**
 * Get supported image file types for a model
 */
export function getSupportedImageTypes(model?: AIModel): string[] {
  if (!hasImageUploadCapabilities(model)) {
    return [];
  }

  // Standard image types supported by most vision models
  return [
    "image/png",
    "image/jpeg",
    "image/jpg",
    "image/gif",
    "image/webp",
    "image/heic",
    "image/heif",
  ];
}

/**
 * Get supported text file types
 */
export function getSupportedTextTypes(): string[] {
  return [
    "text/plain",
    "text/markdown",
    "text/csv",
    "text/html",
    "text/css",
    "text/javascript",
    "text/typescript",
    "application/json",
    "application/xml",
    "text/xml",
    "application/yaml",
    "text/x-python",
    "text/x-java",
    "text/x-c",
    "text/x-cpp",
    "text/x-csharp",
    "text/x-go",
    "text/x-rust",
    "text/x-php",
    "text/x-ruby",
    "text/x-swift",
    "text/x-kotlin",
    "text/x-scala",
    "text/x-shell",
    "text/x-sql",
    "text/x-dockerfile",
    "text/x-makefile",
    "text/x-properties",
    "text/x-log",
  ];
}

/**
 * Check if a file type is supported by a model
 */
export function isFileTypeSupported(
  fileType: string,
  model?: AIModel
): { supported: boolean; category: "image" | "pdf" | "text" | "unsupported" } {
  // Check for image support
  const supportedImageTypes = getSupportedImageTypes(model);
  if (supportedImageTypes.includes(fileType)) {
    return { supported: true, category: "image" };
  }

  // Check for PDF support
  if (fileType === "application/pdf" && hasPdfUploadCapabilities(model)) {
    return { supported: true, category: "pdf" };
  }

  // Check for text file support
  const supportedTextTypes = getSupportedTextTypes();
  if (supportedTextTypes.includes(fileType)) {
    return { supported: true, category: "text" };
  }

  // This is a heuristic check - we can't always detect text files by MIME type
  // but we can make educated guesses
  if (
    fileType.startsWith("text/") ||
    fileType === "application/json" ||
    fileType === "application/xml" ||
    fileType === "application/yaml" ||
    fileType === "" || // Sometimes text files have no MIME type
    fileType === "application/octet-stream" // Generic binary that might be text
  ) {
    return { supported: true, category: "text" };
  }

  return { supported: false, category: "unsupported" };
}
