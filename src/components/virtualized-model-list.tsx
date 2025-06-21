"use client";

import { useMemo, useRef, useState, useEffect, useCallback, memo } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  getModelCapabilities,
  getCapabilityColor,
} from "@/lib/model-capabilities";
import { ProviderIcon } from "@/components/provider-icons";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useUser } from "@/hooks/use-user";

// Generic model interface that works with both AIModel and other model types
interface BaseModel {
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
  free?: boolean;
}

interface VirtualizedModelListProps {
  models: BaseModel[];
}

// Memoized model card component to prevent unnecessary re-renders
const ModelCard = memo(
  ({
    model,
    isEnabled,
    onToggle,
  }: {
    model: BaseModel;
    isEnabled: boolean;
    onToggle: (model: BaseModel) => void;
  }) => {
    const capabilities = useMemo(() => getModelCapabilities(model), [model]);

    const contextDisplay = useMemo(() => {
      const contextLength = model.contextLength || model.contextWindow || 0;
      if (contextLength >= 1000000) {
        const value = contextLength / 1000000;
        return {
          short: `${value % 1 === 0 ? value.toFixed(0) : value.toFixed(1)}M`,
          long: `${value % 1 === 0 ? value.toFixed(0) : value.toFixed(1)}M tokens`,
        };
      }
      return {
        short: `${(contextLength / 1000).toFixed(0)}K`,
        long: `${(contextLength / 1000).toFixed(0)}K tokens`,
      };
    }, [model.contextLength, model.contextWindow]);

    const handleClick = useCallback(() => {
      onToggle(model);
    }, [model, onToggle]);

    const handleSwitchClick = useCallback((e: React.MouseEvent) => {
      e.stopPropagation();
    }, []);

    return (
      <div
        className={`relative p-4 rounded-lg border transition-all duration-200 group cursor-pointer h-[150px] ${
          isEnabled
            ? "border-accent-coral/50 bg-accent-coral/5 hover:border-accent-coral/70"
            : "border-border/40 hover:border-border bg-card hover:bg-muted/30"
        }`}
        onClick={handleClick}
      >
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0 pr-2">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-medium text-sm leading-tight break-words">
                {model.name}
              </h4>
              {model.free && (
                <Badge
                  variant="secondary"
                  className="text-[10px] px-1.5 py-0 h-5 bg-coral-100 text-coral-700 border-coral-200 dark:bg-coral-950 dark:text-coral-300 dark:border-coral-800 shrink-0"
                >
                  Free
                </Badge>
              )}
            </div>
            <div className="mt-1 flex items-center">
              <div className="w-4 h-4 flex items-center justify-center">
                <ProviderIcon provider={model.provider} />
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Switch
              checked={isEnabled}
              onCheckedChange={handleClick}
              onClick={handleSwitchClick}
            />
          </div>
        </div>

        <div className="flex items-center gap-1 mb-3">
          {capabilities.map((capability, index) => {
            const IconComponent = capability.icon;
            return (
              <Tooltip key={index}>
                <TooltipTrigger>
                  <div
                    className={`flex items-center justify-center w-6 h-6 rounded transition-colors ${
                      isEnabled
                        ? "bg-background/80 hover:bg-background border border-border/40"
                        : "bg-muted/70 hover:bg-muted"
                    }`}
                  >
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
          {(model.contextLength || model.contextWindow) && (
            <Tooltip>
              <TooltipTrigger>
                <div
                  className={`flex items-center justify-center px-2 h-6 rounded transition-colors text-xs font-medium ${
                    isEnabled
                      ? "bg-background/80 hover:bg-background border border-border/40"
                      : "bg-muted/70 hover:bg-muted"
                  }`}
                >
                  <span className="text-muted-foreground">
                    {contextDisplay.short}
                  </span>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <div className="text-center">
                  <p className="font-medium text-xs">Context Window</p>
                  <p className="text-xs text-muted-foreground">
                    {contextDisplay.long}
                  </p>
                </div>
              </TooltipContent>
            </Tooltip>
          )}
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="truncate">{model.modelId}</span>
        </div>
      </div>
    );
  }
);

ModelCard.displayName = "ModelCard";

export const VirtualizedModelList = memo(
  ({ models }: VirtualizedModelListProps) => {
    const parentRef = useRef<HTMLDivElement>(null);
    const [columnsPerRow, setColumnsPerRow] = useState(4);

    const { user } = useUser();
    const enabledModels = useQuery(
      api.userModels.getUserModels,
      !user?.isAnonymous && user?._id ? { userId: user._id } : {}
    );
    const toggleModel = useMutation(api.userModels.toggleModel);

    // Memoize enabled models lookup for better performance
    const enabledModelsLookup = useMemo(() => {
      if (!enabledModels) return new Set();
      return new Set(enabledModels.map(m => m.modelId));
    }, [enabledModels]);

    const onToggleModel = useCallback(
      async (model: BaseModel) => {
        // Convert BaseModel to the exact format expected by the mutation validator
        const modelData = {
          modelId: model.modelId,
          name: model.name,
          provider: model.provider,
          contextLength: model.contextLength || model.contextWindow || 0,
          maxOutputTokens: model.maxOutputTokens,
          supportsImages: model.supportsImages || false,
          supportsTools: model.supportsTools || false,
          supportsReasoning: model.supportsReasoning || false,
          inputModalities: model.inputModalities,
        };
        await toggleModel({ modelId: model.modelId, modelData });
      },
      [toggleModel]
    );

    // Calculate columns based on screen size with debounced updates
    useEffect(() => {
      const updateLayout = () => {
        if (window.innerWidth >= 1280) {
          setColumnsPerRow(4);
        } else if (window.innerWidth >= 1024) {
          setColumnsPerRow(3);
        } else if (window.innerWidth >= 768) {
          setColumnsPerRow(2);
        } else {
          setColumnsPerRow(1);
        }
      };

      updateLayout();

      // Debounce resize events for better performance
      let timeoutId: NodeJS.Timeout;
      const debouncedUpdate = () => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(updateLayout, 150);
      };

      window.addEventListener("resize", debouncedUpdate);
      return () => {
        window.removeEventListener("resize", debouncedUpdate);
        clearTimeout(timeoutId);
      };
    }, []);

    // Group models into rows for virtualization with memoization
    const rows = useMemo(() => {
      const result = [];
      for (let i = 0; i < models.length; i += columnsPerRow) {
        result.push(models.slice(i, i + columnsPerRow));
      }
      return result;
    }, [models, columnsPerRow]);

    const virtualizer = useVirtualizer({
      count: rows.length,
      getScrollElement: () =>
        typeof window !== "undefined" ? document.documentElement : null,
      estimateSize: () => 170, // Height of each row (card height + gap)
      overscan: 8, // Increased overscan for smoother scrolling
      measureElement:
        typeof window !== "undefined" && window.ResizeObserver
          ? element => element?.getBoundingClientRect().height
          : undefined,
    });

    const items = virtualizer.getVirtualItems();

    // Optimized scroll handler with passive events
    useEffect(() => {
      const handleScroll = () => {
        virtualizer.measure();
      };

      // Use passive event listener for better performance
      window.addEventListener("scroll", handleScroll, { passive: true });
      return () => window.removeEventListener("scroll", handleScroll);
    }, [virtualizer]);

    if (models.length === 0) {
      return (
        <div className="text-center py-8">
          <p className="text-sm text-muted-foreground">No models available</p>
        </div>
      );
    }

    return (
      <TooltipProvider>
        <div ref={parentRef} className="w-full relative">
          <div
            style={{
              height: `${virtualizer.getTotalSize()}px`,
              width: "100%",
              position: "relative",
            }}
          >
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                transform: `translateY(${items[0]?.start ?? 0}px)`,
              }}
            >
              {items.map(virtualItem => {
                const rowModels = rows[virtualItem.index];
                if (!rowModels || rowModels.length === 0) return null;

                return (
                  <div
                    key={virtualItem.key}
                    data-index={virtualItem.index}
                    ref={virtualizer.measureElement}
                    className="pb-3"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                      {rowModels.map(model => (
                        <ModelCard
                          key={`${model.provider}-${model.modelId}`}
                          model={model}
                          isEnabled={enabledModelsLookup.has(model.modelId)}
                          onToggle={onToggleModel}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </TooltipProvider>
    );
  }
);

VirtualizedModelList.displayName = "VirtualizedModelList";
