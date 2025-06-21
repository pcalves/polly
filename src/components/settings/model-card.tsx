"use client";

import React from "react";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ProviderIcon } from "@/components/provider-icons";
import { getCapabilityColor } from "@/lib/model-capabilities";
import { Brain, Eye, Wrench, Zap } from "lucide-react";

interface ModelCardProps {
  model: {
    modelId: string;
    name: string;
    provider: string;
    contextWindow: number;
    supportsReasoning: boolean;
    supportsTools: boolean;
    supportsImages: boolean;
    supportsFiles: boolean;
    free?: boolean;
  };
}

export function ModelCard({ model }: ModelCardProps) {
  const capabilities = [];

  if (model.supportsReasoning) {
    capabilities.push({
      icon: Brain,
      label: "Advanced Reasoning",
      description: "Chain-of-thought and complex reasoning",
    });
  }

  if (model.supportsImages) {
    capabilities.push({
      icon: Eye,
      label: "Vision",
      description: "Can analyze images and visual content",
    });
  }

  if (model.supportsTools) {
    capabilities.push({
      icon: Wrench,
      label: "Tools",
      description: "Can call functions and use external tools",
    });
  }

  if (
    model.modelId.includes("mini") ||
    model.modelId.includes("flash") ||
    model.modelId.includes("haiku") ||
    model.contextWindow < 50000
  ) {
    capabilities.push({
      icon: Zap,
      label: "Fast",
      description: "Quick responses, lower latency",
    });
  }

  const formatContextWindow = (contextWindow: number) => {
    if (contextWindow >= 1000000) {
      const millions = contextWindow / 1000000;
      return millions % 1 === 0
        ? `${millions.toFixed(0)}M`
        : `${millions.toFixed(1)}M`;
    }
    return `${(contextWindow / 1000).toFixed(0)}K`;
  };

  return (
    <TooltipProvider>
      <div className="p-4 rounded-lg border bg-card hover:bg-muted/30 transition-colors h-[140px] flex flex-col">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0 pr-2">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-medium text-sm leading-tight break-words">
                {model.name}
              </h4>
              {model.free && (
                <Badge
                  variant="secondary"
                  className="text-[10px] px-1.5 py-0 h-5 bg-coral-100 text-coral-700 border-coral-200 hover:bg-coral-100 dark:bg-coral-950 dark:text-coral-300 dark:border-coral-800 shrink-0"
                >
                  Free
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <div className="w-4 h-4 flex items-center justify-center">
                <ProviderIcon provider={model.provider} />
              </div>
              <span className="truncate">{model.modelId}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1 mb-3 flex-wrap">
          {capabilities.map((capability, index) => {
            const IconComponent = capability.icon;
            return (
              <Tooltip key={index}>
                <TooltipTrigger>
                  <div className="flex items-center justify-center w-6 h-6 rounded bg-muted/70 hover:bg-muted transition-colors">
                    <IconComponent
                      className={`w-3 h-3 ${getCapabilityColor(capability.label)}`}
                    />
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <div className="text-center">
                    <p className="font-medium text-xs">{capability.label}</p>
                    <p className="text-xs text-muted-foreground">
                      {capability.description}
                    </p>
                  </div>
                </TooltipContent>
              </Tooltip>
            );
          })}

          <Tooltip>
            <TooltipTrigger>
              <Badge variant="outline" className="text-xs h-6 px-2">
                {formatContextWindow(model.contextWindow)}
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <div className="text-center">
                <p className="font-medium text-xs">Context Window</p>
                <p className="text-xs text-muted-foreground">
                  {model.contextWindow.toLocaleString()} tokens
                </p>
              </div>
            </TooltipContent>
          </Tooltip>
        </div>
      </div>
    </TooltipProvider>
  );
}
