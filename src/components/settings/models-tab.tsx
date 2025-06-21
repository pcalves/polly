"use client";

import React, {
  useCallback,
  useMemo,
  useReducer,
  useDeferredValue,
  useTransition,
  Suspense,
} from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Loader2, RefreshCw, Filter, ChevronDown } from "lucide-react";
import { ProviderIcon } from "@/components/provider-icons";
import { useQuery, useAction } from "convex/react";
import { api } from "../../../convex/_generated/api";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useDebounce } from "@/hooks/use-debounce";
import dynamic from "next/dynamic";

// Dynamically import heavy components
const VirtualizedModelList = dynamic(
  () =>
    import("../virtualized-model-list").then(mod => ({
      default: mod.VirtualizedModelList,
    })),
  {
    loading: () => <ModelListSkeleton />,
    ssr: false,
  }
);

const PROVIDER_NAMES = {
  openai: "OpenAI",
  anthropic: "Anthropic",
  google: "Google",
  openrouter: "OpenRouter",
} as const;

// Available capability filters
const CAPABILITY_FILTERS = [
  {
    key: "supportsReasoning",
    label: "Advanced Reasoning",
    description: "Chain-of-thought and complex reasoning",
  },
  {
    key: "supportsImages",
    label: "Vision",
    description: "Can analyze images and visual content",
  },
  {
    key: "supportsTools",
    label: "Tools",
    description: "Can call functions and use external tools",
  },
  {
    key: "supportsFiles",
    label: "File Upload",
    description: "Can process file uploads",
  },
  { key: "fast", label: "Fast", description: "Quick responses, lower latency" },
  {
    key: "coding",
    label: "Coding",
    description: "Excellent for programming tasks",
  },
  { key: "latest", label: "Latest", description: "Newest model version" },
] as const;

// State management with useReducer for better performance
interface FilterState {
  searchQuery: string;
  selectedProviders: string[];
  selectedCapabilities: string[];
  showOnlySelected: boolean;
}

type FilterAction =
  | { type: "SET_SEARCH"; payload: string }
  | { type: "TOGGLE_PROVIDER"; payload: string }
  | { type: "TOGGLE_CAPABILITY"; payload: string }
  | { type: "TOGGLE_SHOW_SELECTED" }
  | { type: "CLEAR_PROVIDERS" }
  | { type: "CLEAR_CAPABILITIES" }
  | { type: "CLEAR_ALL" };

const initialFilterState: FilterState = {
  searchQuery: "",
  selectedProviders: [],
  selectedCapabilities: [],
  showOnlySelected: false,
};

function filterReducer(state: FilterState, action: FilterAction): FilterState {
  switch (action.type) {
    case "SET_SEARCH":
      return { ...state, searchQuery: action.payload };
    case "TOGGLE_PROVIDER":
      return {
        ...state,
        selectedProviders: state.selectedProviders.includes(action.payload)
          ? state.selectedProviders.filter(p => p !== action.payload)
          : [...state.selectedProviders, action.payload],
      };
    case "TOGGLE_CAPABILITY":
      return {
        ...state,
        selectedCapabilities: state.selectedCapabilities.includes(
          action.payload
        )
          ? state.selectedCapabilities.filter(c => c !== action.payload)
          : [...state.selectedCapabilities, action.payload],
      };
    case "TOGGLE_SHOW_SELECTED":
      return { ...state, showOnlySelected: !state.showOnlySelected };
    case "CLEAR_PROVIDERS":
      return { ...state, selectedProviders: [] };
    case "CLEAR_CAPABILITIES":
      return { ...state, selectedCapabilities: [] };
    case "CLEAR_ALL":
      return initialFilterState;
    default:
      return state;
  }
}

// Memoized provider summary card component
const ProviderSummaryCard = React.memo(
  ({
    provider,
    count,
    isSelected,
    onToggle,
  }: {
    provider: string;
    count: number;
    isSelected: boolean;
    onToggle: (provider: string) => void;
  }) => (
    <div
      className={`p-4 rounded-lg border transition-all duration-200 cursor-pointer hover:shadow-sm ${
        isSelected
          ? "border-emerald-200 bg-emerald-50 hover:bg-emerald-100"
          : "border-border bg-card hover:bg-muted/50"
      }`}
      onClick={() => onToggle(provider)}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="w-8 h-8 flex items-center justify-center shrink-0">
            <ProviderIcon provider={provider} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-base font-medium truncate">
                {PROVIDER_NAMES[provider as keyof typeof PROVIDER_NAMES]}
              </h3>
              {isSelected && (
                <span className="text-xs text-emerald-600 font-medium bg-emerald-100 px-2 py-0.5 rounded-full shrink-0">
                  Filtered
                </span>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              {count} model{count !== 1 ? "s" : ""} available
            </p>
          </div>
        </div>
        <div className="text-2xl font-bold text-primary shrink-0 ml-2">
          {count}
        </div>
      </div>
    </div>
  )
);

ProviderSummaryCard.displayName = "ProviderSummaryCard";

// Memoized filter tag component
const FilterTag = React.memo(
  ({
    children,
    className,
  }: {
    children: React.ReactNode;
    className?: string;
  }) => (
    <span
      className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs ${className}`}
    >
      {children}
    </span>
  )
);

FilterTag.displayName = "FilterTag";

// Enhanced loading component with progress status
const ModelsLoadingState = React.memo(
  ({
    status,
    availableProviders,
  }: {
    status: string;
    availableProviders: string[];
  }) => (
    <div className="space-y-6">
      {/* Loading header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold mb-2">Models</h2>
          <p className="text-sm text-muted-foreground">
            Loading models from your configured providers...
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin text-gradient-from" />
          {status || "Loading..."}
        </div>
      </div>

      {/* Provider loading cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
        {availableProviders.map((provider, index) => (
          <div
            key={provider}
            className="p-4 rounded-lg border bg-gradient-to-r from-primary/5 to-primary/10 animate-pulse"
            style={{
              animationDelay: `${index * 150}ms`,
              animationDuration: "2s",
            }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="w-8 h-8 flex items-center justify-center shrink-0">
                  <ProviderIcon provider={provider} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-base font-medium">
                      {PROVIDER_NAMES[provider as keyof typeof PROVIDER_NAMES]}
                    </h3>
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                      <span className="text-xs text-emerald-600 font-medium">
                        Loading
                      </span>
                    </div>
                  </div>
                  <div className="h-3 bg-muted/30 rounded w-20 animate-pulse" />
                </div>
              </div>
              <div className="shrink-0 ml-2">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Skeleton model cards with shimmer */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {status || "Loading models..."}
          </p>
        </div>
        <ModelListSkeletonWithShimmer />
      </div>
    </div>
  )
);

ModelsLoadingState.displayName = "ModelsLoadingState";

export function ModelsTab() {
  const [filterState, dispatch] = useReducer(filterReducer, initialFilterState);
  const [isPending, startTransition] = useTransition();

  // Use deferred value for search to improve typing performance
  const deferredSearchQuery = useDeferredValue(filterState.searchQuery);

  // Debounce the entire filter state
  const debouncedFilters = useDebounce(
    {
      ...filterState,
      searchQuery: deferredSearchQuery,
    },
    300
  );

  // Get API keys and enabled models from Convex
  const apiKeys = useQuery(api.apiKeys.getUserApiKeys);
  const enabledModels = useQuery(api.userModels.getUserModels);

  // Memoize expensive computations
  const availableProviders = useMemo(
    () => apiKeys?.filter(key => key.hasKey).map(key => key.provider) || [],
    [apiKeys]
  );

  const enabledModelIds = useMemo(
    () => enabledModels?.map(model => model.modelId) || [],
    [enabledModels]
  );

  // Use Convex action directly for fetching models
  const fetchAllModels = useAction(api.models.fetchAllModels);
  const [allModels, setAllModels] = React.useState<
    Array<{
      modelId: string;
      name: string;
      provider: string;
      contextWindow: number;
      supportsReasoning: boolean;
      supportsTools: boolean;
      supportsImages: boolean;
      supportsFiles: boolean;
    }>
  >([]);
  const [modelsLoading, setModelsLoading] = React.useState(false);
  const [modelsError, setModelsError] = React.useState<Error | null>(null);

  const [loadingStatus, setLoadingStatus] = React.useState<string>("");

  // Fetch models when filters change
  React.useEffect(() => {
    const fetchModels = async () => {
      if (availableProviders.length === 0) return;

      try {
        setModelsLoading(true);
        setModelsError(null);
        const models = await fetchAllModels();

        // Apply client-side filtering for search and capabilities
        let filteredModels = models;

        if (debouncedFilters.searchQuery) {
          const searchLower = debouncedFilters.searchQuery.toLowerCase();
          filteredModels = filteredModels.filter(
            model =>
              model.modelId.toLowerCase().includes(searchLower) ||
              model.name.toLowerCase().includes(searchLower) ||
              model.provider.toLowerCase().includes(searchLower)
          );
        }

        if (debouncedFilters.selectedProviders.length > 0) {
          filteredModels = filteredModels.filter(model =>
            debouncedFilters.selectedProviders.includes(model.provider)
          );
        }

        if (debouncedFilters.selectedCapabilities.length > 0) {
          filteredModels = filteredModels.filter(model =>
            debouncedFilters.selectedCapabilities.every(capability => {
              switch (capability) {
                case "supportsReasoning":
                  return model.supportsReasoning;
                case "supportsImages":
                  return model.supportsImages;
                case "supportsTools":
                  return model.supportsTools;
                case "supportsFiles":
                  return model.supportsFiles;
                default:
                  return false;
              }
            })
          );
        }

        setAllModels(filteredModels);
      } catch (error) {
        console.error("Failed to fetch models:", error);
        setModelsError(error as Error);
      } finally {
        setModelsLoading(false);
      }
    };

    fetchModels();
  }, [fetchAllModels, availableProviders, debouncedFilters]);

  // Filter models client-side for "selected only" to avoid refetch
  const models = useMemo(() => {
    if (!debouncedFilters.showOnlySelected) {
      return allModels;
    }
    return allModels.filter(model => enabledModelIds.includes(model.modelId));
  }, [allModels, debouncedFilters.showOnlySelected, enabledModelIds]);

  // Calculate stats from the models data
  const stats = useMemo(() => {
    if (!allModels.length) return null;

    const providerCounts: Record<string, number> = {};
    const capabilityCounts: Record<string, number> = {};

    allModels.forEach(model => {
      providerCounts[model.provider] =
        (providerCounts[model.provider] || 0) + 1;

      if (model.supportsReasoning)
        capabilityCounts.supportsReasoning =
          (capabilityCounts.supportsReasoning || 0) + 1;
      if (model.supportsImages)
        capabilityCounts.supportsImages =
          (capabilityCounts.supportsImages || 0) + 1;
      if (model.supportsTools)
        capabilityCounts.supportsTools =
          (capabilityCounts.supportsTools || 0) + 1;
      if (model.supportsFiles)
        capabilityCounts.supportsFiles =
          (capabilityCounts.supportsFiles || 0) + 1;
    });

    return { providerCounts, capabilityCounts };
  }, [allModels]);

  // Memoized event handlers with useTransition for non-urgent updates
  const handleSearchChange = useCallback((value: string) => {
    dispatch({ type: "SET_SEARCH", payload: value });
  }, []);

  const handleProviderToggle = useCallback((provider: string) => {
    startTransition(() => {
      dispatch({ type: "TOGGLE_PROVIDER", payload: provider });
    });
  }, []);

  const handleCapabilityToggle = useCallback((capability: string) => {
    startTransition(() => {
      dispatch({ type: "TOGGLE_CAPABILITY", payload: capability });
    });
  }, []);

  const handleShowSelectedToggle = useCallback(() => {
    startTransition(() => {
      dispatch({ type: "TOGGLE_SHOW_SELECTED" });
    });
  }, []);

  const clearFilters = useCallback(() => {
    startTransition(() => {
      dispatch({ type: "CLEAR_ALL" });
    });
  }, []);

  const clearProviders = useCallback(() => {
    startTransition(() => {
      dispatch({ type: "CLEAR_PROVIDERS" });
    });
  }, []);

  const clearCapabilities = useCallback(() => {
    startTransition(() => {
      dispatch({ type: "CLEAR_CAPABILITIES" });
    });
  }, []);

  // Refresh handler
  const handleRefresh = useCallback(async () => {
    if (availableProviders.length === 0) return;

    try {
      setModelsLoading(true);
      setModelsError(null);
      setLoadingStatus(
        `Refreshing models from ${availableProviders.length} provider${availableProviders.length !== 1 ? "s" : ""}...`
      );

      const models = await fetchAllModels();

      // Apply client-side filtering for search and capabilities
      let filteredModels = models;

      if (debouncedFilters.searchQuery) {
        const searchLower = debouncedFilters.searchQuery.toLowerCase();
        filteredModels = filteredModels.filter(
          model =>
            model.modelId.toLowerCase().includes(searchLower) ||
            model.name.toLowerCase().includes(searchLower) ||
            model.provider.toLowerCase().includes(searchLower)
        );
      }

      if (debouncedFilters.selectedProviders.length > 0) {
        filteredModels = filteredModels.filter(model =>
          debouncedFilters.selectedProviders.includes(model.provider)
        );
      }

      if (debouncedFilters.selectedCapabilities.length > 0) {
        filteredModels = filteredModels.filter(model =>
          debouncedFilters.selectedCapabilities.every(capability => {
            switch (capability) {
              case "supportsReasoning":
                return model.supportsReasoning;
              case "supportsImages":
                return model.supportsImages;
              case "supportsTools":
                return model.supportsTools;
              case "supportsFiles":
                return model.supportsFiles;
              default:
                return false;
            }
          })
        );
      }

      setLoadingStatus("Finalizing...");
      setAllModels(filteredModels);
    } catch (error) {
      console.error("Failed to refresh models:", error);
      setModelsError(error as Error);
    } finally {
      setModelsLoading(false);
      setLoadingStatus("");
    }
  }, [fetchAllModels, availableProviders, debouncedFilters]);

  // Memoize filter conditions to prevent recalculation
  const hasActiveFilters = useMemo(
    () =>
      filterState.searchQuery ||
      filterState.selectedProviders.length > 0 ||
      filterState.selectedCapabilities.length > 0 ||
      filterState.showOnlySelected,
    [filterState]
  );

  // Show loading state while API keys are loading
  if (apiKeys === undefined) {
    return (
      <ModelsLoadingState
        status="Loading API keys..."
        availableProviders={[]}
      />
    );
  }

  // Show state when no API keys are configured
  if (availableProviders.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-semibold mb-2">Models</h2>
          <p className="text-sm text-muted-foreground">
            Configure your API keys to use different AI providers. Once you add
            API keys, models will be automatically fetched and displayed here.
          </p>
        </div>

        <div className="flex items-center justify-center h-64 border border-dashed border-muted rounded-lg">
          <div className="text-center space-y-3">
            <div className="text-4xl text-muted-foreground/50">🧠</div>
            <p className="text-sm text-muted-foreground">
              No API keys configured. Add your API keys to see available models.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold mb-2">Models</h2>
          <p className="text-sm text-muted-foreground">
            Browse and explore AI models from your configured providers. Enable
            models to use them in conversations.
          </p>
        </div>
        <Button
          onClick={handleRefresh}
          disabled={modelsLoading}
          size="sm"
          variant="outline"
          className="gap-2"
        >
          <RefreshCw
            className={`h-4 w-4 ${modelsLoading ? "animate-spin" : ""}`}
          />
          Refresh
        </Button>
      </div>

      {/* Error State */}
      {modelsError && (
        <div className="p-4 rounded-lg border border-red-200 bg-red-50 text-red-700">
          <p className="font-medium">Error loading models</p>
          <p className="text-sm">{modelsError.message}</p>
          <Button
            onClick={handleRefresh}
            size="sm"
            variant="outline"
            className="mt-2"
          >
            Try again
          </Button>
        </div>
      )}

      {/* Provider Summary Cards */}
      {stats?.providerCounts &&
        Object.keys(stats.providerCounts).length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {Object.entries(stats.providerCounts).map(([provider, count]) => (
              <ProviderSummaryCard
                key={provider}
                provider={provider}
                count={count}
                isSelected={filterState.selectedProviders.includes(provider)}
                onToggle={handleProviderToggle}
              />
            ))}
          </div>
        )}

      {/* Search and Filters */}
      <div className="space-y-4">
        {/* Search and Filter Controls */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search models by name, ID, or provider..."
              value={filterState.searchQuery}
              onChange={e => handleSearchChange(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Filter Controls */}
          <div className="flex gap-2 shrink-0">
            {/* Selected Filter Toggle */}
            <Button
              variant={filterState.showOnlySelected ? "default" : "outline"}
              onClick={handleShowSelectedToggle}
              size="sm"
              className="gap-2"
              disabled={isPending}
            >
              Selected
              {filterState.showOnlySelected && enabledModels && (
                <span className="text-xs bg-background/80 text-foreground px-1.5 py-0.5 rounded-full">
                  {enabledModels.length}
                </span>
              )}
            </Button>

            {/* Provider Filter Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2 min-w-[120px] justify-start"
                  disabled={isPending}
                >
                  <div className="w-4 h-4 flex items-center justify-center shrink-0">
                    <ProviderIcon provider="openai" />
                  </div>
                  <span className="hidden sm:inline">Providers</span>
                  <span className="sm:hidden">Prov</span>
                  {filterState.selectedProviders.length > 0 && (
                    <span className="ml-auto text-xs bg-primary text-primary-foreground px-1.5 py-0.5 rounded-full">
                      {filterState.selectedProviders.length}
                    </span>
                  )}
                  <ChevronDown className="h-4 w-4 opacity-50 ml-auto sm:ml-1" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Filter by Provider</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {availableProviders.map(provider => (
                  <DropdownMenuCheckboxItem
                    key={provider}
                    checked={filterState.selectedProviders.includes(provider)}
                    onCheckedChange={() => handleProviderToggle(provider)}
                    className="flex items-center gap-3"
                  >
                    <div className="w-4 h-4 flex items-center justify-center shrink-0">
                      <ProviderIcon provider={provider} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">
                        {
                          PROVIDER_NAMES[
                            provider as keyof typeof PROVIDER_NAMES
                          ]
                        }
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {stats?.providerCounts?.[provider] || 0} models
                      </div>
                    </div>
                  </DropdownMenuCheckboxItem>
                ))}
                {filterState.selectedProviders.length > 0 && (
                  <>
                    <DropdownMenuSeparator />
                    <div className="px-2 py-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={clearProviders}
                        className="w-full text-xs h-7"
                      >
                        Clear providers
                      </Button>
                    </div>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Capabilities Filter Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2 min-w-[120px] justify-start"
                  disabled={isPending}
                >
                  <Filter className="h-4 w-4 shrink-0" />
                  <span className="hidden sm:inline">Capabilities</span>
                  <span className="sm:hidden">Caps</span>
                  {filterState.selectedCapabilities.length > 0 && (
                    <span className="ml-auto text-xs bg-primary text-primary-foreground px-1.5 py-0.5 rounded-full">
                      {filterState.selectedCapabilities.length}
                    </span>
                  )}
                  <ChevronDown className="h-4 w-4 opacity-50 ml-auto sm:ml-1" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64">
                <DropdownMenuLabel>Filter by Capabilities</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <div className="max-h-80 overflow-y-auto">
                  {CAPABILITY_FILTERS.map(capability => (
                    <DropdownMenuCheckboxItem
                      key={capability.key}
                      checked={filterState.selectedCapabilities.includes(
                        capability.key
                      )}
                      onCheckedChange={() =>
                        handleCapabilityToggle(capability.key)
                      }
                      className="flex items-start gap-3 py-2"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="font-medium">{capability.label}</div>
                        <div className="text-xs text-muted-foreground line-clamp-2">
                          {capability.description}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {stats?.capabilityCounts?.[capability.key] || 0}{" "}
                          models
                        </div>
                      </div>
                    </DropdownMenuCheckboxItem>
                  ))}
                </div>
                {filterState.selectedCapabilities.length > 0 && (
                  <>
                    <DropdownMenuSeparator />
                    <div className="px-2 py-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={clearCapabilities}
                        className="w-full text-xs h-7"
                      >
                        Clear capabilities
                      </Button>
                    </div>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Active Filters */}
        {hasActiveFilters && (
          <div className="flex items-start gap-2 flex-wrap">
            <span className="text-sm text-muted-foreground shrink-0 mt-1">
              Filters:
            </span>
            <div className="flex flex-wrap items-center gap-2">
              {filterState.searchQuery && (
                <FilterTag className="bg-muted">
                  Search: &ldquo;{filterState.searchQuery}&rdquo;
                </FilterTag>
              )}
              {filterState.showOnlySelected && (
                <FilterTag className="bg-primary text-primary-foreground">
                  Selected only
                </FilterTag>
              )}
              {filterState.selectedProviders.map(provider => (
                <FilterTag
                  key={provider}
                  className="bg-emerald-100 text-emerald-700"
                >
                  <div className="w-3 h-3 flex items-center justify-center">
                    <ProviderIcon provider={provider} />
                  </div>
                  <span className="truncate max-w-[100px]">
                    {PROVIDER_NAMES[provider as keyof typeof PROVIDER_NAMES]}
                  </span>
                </FilterTag>
              ))}
              {filterState.selectedCapabilities.map(capability => {
                const capabilityInfo = CAPABILITY_FILTERS.find(
                  c => c.key === capability
                );
                return (
                  <FilterTag
                    key={capability}
                    className="bg-blue-100 text-blue-700"
                  >
                    <span className="truncate max-w-[120px]">
                      {capabilityInfo?.label}
                    </span>
                  </FilterTag>
                );
              })}
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="text-xs h-7 px-3 shrink-0"
                disabled={isPending}
              >
                Clear all
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Models List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {models.length} model{models.length !== 1 ? "s" : ""}{" "}
            {hasActiveFilters ? "matching filters" : "available"}
          </p>
          {(modelsLoading || isPending) && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              {isPending ? "Updating filters..." : "Loading..."}
            </div>
          )}
        </div>

        {models.length > 0 ? (
          <div className="space-y-4">
            <Suspense fallback={<ModelListSkeleton />}>
              <VirtualizedModelList models={models} />
            </Suspense>
          </div>
        ) : modelsLoading ? (
          <ModelsLoadingState
            status={loadingStatus}
            availableProviders={availableProviders}
          />
        ) : models.length === 0 ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center space-y-4 max-w-md">
              <div className="text-6xl mb-4 opacity-20">🔍</div>
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">No models found</h3>
                <p className="text-sm text-muted-foreground">
                  {hasActiveFilters
                    ? "Try adjusting your search terms or filters to find what you're looking for."
                    : "No models are available from your configured providers."}
                </p>
              </div>
              {hasActiveFilters && (
                <Button
                  variant="outline"
                  onClick={clearFilters}
                  className="mt-4"
                  disabled={isPending}
                >
                  Clear all filters
                </Button>
              )}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function ModelListSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
      {Array.from({ length: 12 }).map((_, i) => (
        <ModelCardSkeleton key={i} />
      ))}
    </div>
  );
}

function ModelListSkeletonWithShimmer() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
      {Array.from({ length: 12 }).map((_, i) => (
        <ModelCardSkeletonWithShimmer key={i} delay={i * 100} />
      ))}
    </div>
  );
}

function ModelCardSkeleton() {
  return (
    <div className="relative p-4 rounded-lg border border-muted/20 h-[150px] animate-pulse">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0 pr-2">
          <div className="h-4 bg-muted/20 rounded mb-2 w-3/4" />
          <div className="mt-1 flex items-center">
            <div className="w-4 h-4 bg-muted/20 rounded" />
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <div className="h-5 w-9 bg-muted/20 rounded-full" />
        </div>
      </div>

      <div className="flex items-center gap-1 mb-3">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="w-6 h-6 bg-muted/20 rounded" />
        ))}
      </div>

      <div className="flex items-center justify-between text-xs">
        <div className="h-3 bg-muted/20 rounded w-16" />
        <div className="h-3 bg-muted/20 rounded w-12" />
      </div>
    </div>
  );
}

function ModelCardSkeletonWithShimmer({ delay = 0 }: { delay?: number }) {
  return (
    <div
      className="relative p-4 rounded-lg border border-muted/20 h-[150px] overflow-hidden"
      style={{ animationDelay: `${delay}ms` }}
    >
      {/* Shimmer overlay */}
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent" />

      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0 pr-2">
          <div className="h-4 bg-muted/20 rounded mb-2 w-3/4" />
          <div className="mt-1 flex items-center">
            <div className="w-4 h-4 bg-muted/20 rounded" />
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <div className="h-5 w-9 bg-muted/20 rounded-full" />
        </div>
      </div>

      <div className="flex items-center gap-1 mb-3">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="w-6 h-6 bg-muted/20 rounded" />
        ))}
      </div>

      <div className="flex items-center justify-between text-xs">
        <div className="h-3 bg-muted/20 rounded w-16" />
        <div className="h-3 bg-muted/20 rounded w-12" />
      </div>
    </div>
  );
}
