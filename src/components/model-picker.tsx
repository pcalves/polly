"use client";

import { useState, useEffect, useMemo } from "react";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
  SelectGroup,
  SelectSeparator,
} from "@/components/ui/select";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { 
  Brain, 
  Eye, 
  Wrench, 
  Zap, 
  FileText, 
  Code2,
  Sparkles
} from "lucide-react";
import { AI_PROVIDERS, fetchOpenRouterModels, getModelById, initializeProviders } from "@/lib/providers";
import { AIModel } from "@/types";
import { hasApiKey } from "@/lib/api-keys";
import { cn } from "@/lib/utils";

// Capability detection - moved outside component for stability
const getModelCapabilities = (model: AIModel) => {
  const capabilities = [];
  
  // Reasoning models (thinking/chain-of-thought capabilities)
  if (model.id.includes("claude") || 
      model.id.includes("gpt-4") || 
      model.id.includes("gemini-2.5") || 
      model.id.includes("deepseek-r1") ||
      model.id.includes("o1")) {
    capabilities.push({ icon: Brain, label: "Advanced Reasoning", description: "Chain-of-thought and complex reasoning" });
  }
  
  // Image understanding
  if (model.supportsImages) {
    capabilities.push({ icon: Eye, label: "Vision", description: "Can analyze images and visual content" });
  }
  
  // Tools/Function calling
  if (model.supportsTools) {
    capabilities.push({ icon: Wrench, label: "Tools", description: "Can call functions and use external tools" });
  }
  
  // Fast models (smaller parameter count, good for quick responses)
  if (model.id.includes("mini") || 
      model.id.includes("flash") || 
      model.id.includes("haiku") ||
      model.contextLength < 50000) {
    capabilities.push({ icon: Zap, label: "Fast", description: "Quick responses, lower latency" });
  }
  
  // Large context (>100k tokens)
  if (model.contextLength >= 100000) {
    capabilities.push({ icon: FileText, label: "Large Context", description: `${(model.contextLength / 1000).toFixed(0)}K context window` });
  }
  
  // Coding specialists
  if (model.id.includes("code") || 
      model.id.includes("deepseek") ||
      model.id.includes("claude")) {
    capabilities.push({ icon: Code2, label: "Coding", description: "Excellent for programming tasks" });
  }
  
  // Latest/newest models
  if (model.id.includes("2.5") || 
      model.id.includes("4o") ||
      model.id.includes("2024") ||
      model.id.includes("2025")) {
    capabilities.push({ icon: Sparkles, label: "Latest", description: "Newest model version" });
  }
  
  return capabilities;
};

interface ModelPickerProps {
  value: string;
  onChange: (modelId: string) => void;
}

export function ModelPicker({ value, onChange }: ModelPickerProps) {
  const [openRouterModels, setOpenRouterModels] = useState<AIModel[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!hasApiKey("openrouter") || openRouterModels.length > 0) {
      return;
    }

    const loadModels = async () => {
      setIsLoading(true);
      try {
        await initializeProviders();
        
        if (hasApiKey("openrouter")) {
          const models = await fetchOpenRouterModels();
          setOpenRouterModels(models);
        }
      } catch (error) {
        console.error("Failed to load models:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadModels();
  }, [openRouterModels.length]);

  // Find selected model including OpenRouter models
  const selectedModel = useMemo(() => 
    getModelById(value) || openRouterModels.find(m => m.id === value),
    [value, openRouterModels]
  );

  // Memoize selected model capabilities to prevent infinite re-renders
  const selectedModelCapabilities = useMemo(() => 
    selectedModel ? getModelCapabilities(selectedModel) : [],
    [selectedModel]
  );

  return (
    <TooltipProvider>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="w-full border-0 bg-transparent p-0 shadow-none focus:ring-0 h-auto">
          <SelectValue>
            {selectedModel ? (
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-muted-foreground hover:text-foreground">
                  {selectedModel.name.split(' ')[0]} {/* Show just first part of name */}
                </span>
                {/* Show just 1 key capability icon */}
                {selectedModelCapabilities.length > 0 && (
                  <div className="flex items-center">
                    {(() => {
                      const capability = selectedModelCapabilities[0];
                      const IconComponent = capability.icon;
                      return (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="flex items-center justify-center">
                              <IconComponent className="w-3 h-3 text-muted-foreground/60" />
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <div className="text-center">
                              <div className="font-medium">{capability.label}</div>
                              <div className="text-xs text-muted-foreground">{capability.description}</div>
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      );
                    })()}
                  </div>
                )}
              </div>
            ) : (
              <span className="text-sm font-medium text-muted-foreground">Select model</span>
            )}
          </SelectValue>
        </SelectTrigger>
        <SelectContent className="w-[420px] max-h-[400px]">
        {(() => {
          const providersWithKeys = AI_PROVIDERS.filter(provider => {
            const hasKey = hasApiKey(provider.id as keyof typeof hasApiKey);
            // For OpenRouter, also check if we have models loaded
            if (provider.id === "openrouter") {
              return hasKey && (openRouterModels.length > 0 || isLoading);
            }
            return hasKey;
          });

          if (providersWithKeys.length === 0) {
            return (
              <div className="p-6 text-center">
                <p className="text-sm text-muted-foreground mb-2">No API keys configured</p>
                <p className="text-xs text-muted-foreground">
                  Add API keys to use AI models
                </p>
              </div>
            );
          }

          return providersWithKeys.map((provider) => {
            const availableModels = provider.id === "openrouter" 
              ? openRouterModels 
              : provider.models;

            if (availableModels.length === 0 && provider.id === "openrouter" && isLoading) {
              return (
                <SelectGroup key={provider.id}>
                  <SelectLabel className="text-xs font-medium text-muted-foreground/80 px-3 py-2">
                    {provider.name}
                  </SelectLabel>
                  <SelectItem value="loading" disabled className="text-muted-foreground">
                    Loading models...
                  </SelectItem>
                </SelectGroup>
              );
            }

            if (availableModels.length === 0) return null;

            return (
              <SelectGroup key={provider.id}>
                <SelectLabel className="text-xs font-medium text-muted-foreground/80 px-3 py-2">
                  {provider.name}
                </SelectLabel>
                {availableModels.map(model => {
                  const hasKey = hasApiKey(model.provider as keyof typeof hasApiKey);
                  const capabilities = getModelCapabilities(model);

                  return (
                    <SelectItem
                      key={model.id}
                      value={model.id}
                      disabled={!hasKey}
                      className="flex flex-col items-start py-3 px-3 cursor-pointer hover:bg-muted/50 focus:bg-muted/50"
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className={cn(
                          "font-medium text-sm",
                          !hasKey ? "opacity-50" : ""
                        )}>
                          {model.name}
                        </span>
                        {!hasKey && (
                          <span className="text-xs text-muted-foreground/60 ml-2">No API key</span>
                        )}
                      </div>
                      
                      {/* Capabilities and provider row */}
                      <div className="flex items-center justify-between w-full mt-1">
                        {/* Capabilities */}
                        {capabilities.length > 0 && (
                          <div className="flex items-center gap-1">
                            {capabilities.slice(0, 4).map((capability, index) => {
                              const IconComponent = capability.icon;
                              return (
                                <div 
                                  key={`${model.id}-${capability.label}-${index}`}
                                  className="flex items-center justify-center w-3 h-3" 
                                  title={`${capability.label}: ${capability.description}`}
                                >
                                  <IconComponent className="w-2.5 h-2.5 text-muted-foreground/60" />
                                </div>
                              );
                            })}
                          </div>
                        )}
                        
                        {/* Provider */}
                        <span className="text-xs text-muted-foreground/60 capitalize">
                          {model.provider}
                        </span>
                      </div>
                    </SelectItem>
                  );
                })}
                {provider !== providersWithKeys[providersWithKeys.length - 1] && <SelectSeparator className="my-1" />}
              </SelectGroup>
            );
          });
        })()}
      </SelectContent>
    </Select>
    </TooltipProvider>
  );
}