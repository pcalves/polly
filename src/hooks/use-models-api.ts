import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { useCallback, useMemo } from "react";

interface ModelWithCapabilities {
  modelId: string;
  name: string;
  provider: string;
  contextWindow: number;
  contextLength: number;
  supportsReasoning: boolean;
  supportsTools: boolean;
  supportsImages: boolean;
  supportsFiles: boolean;
  capabilities: string[];
  searchableText: string;
}

interface ModelsResponse {
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
}

interface UseModelsInfiniteOptions {
  search?: string;
  providers?: string[];
  capabilities?: string[];
  enabledOnly?: boolean;
  enabledModels?: string[];
  limit?: number;
  includeStats?: boolean;
  enabled?: boolean;
}

interface UseModelsOptions extends UseModelsInfiniteOptions {
  cursor?: string;
}

const fetcher = async (url: string): Promise<ModelsResponse> => {
  const response = await fetch(url);
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to fetch models: ${response.status} ${errorText}`);
  }
  return response.json();
};

// Build query parameters helper
function buildQueryParams(options: UseModelsOptions): string {
  const params = new URLSearchParams();

  if (options.search?.trim()) {
    params.set("search", options.search.trim());
  }

  if (options.providers?.length) {
    params.set("providers", options.providers.join(","));
  }

  if (options.capabilities?.length) {
    params.set("capabilities", options.capabilities.join(","));
  }

  if (options.enabledOnly) {
    params.set("enabledOnly", "true");
  }

  if (options.enabledModels?.length) {
    params.set("enabledModels", options.enabledModels.join(","));
  }

  if (options.cursor) {
    params.set("cursor", options.cursor);
  }

  if (options.limit && options.limit !== 50) {
    params.set("limit", options.limit.toString());
  }

  if (options.includeStats) {
    params.set("includeStats", "true");
  }

  return params.toString();
}

// Query key factory for consistent caching
const modelsQueryKeys = {
  all: ["models"] as const,
  lists: () => [...modelsQueryKeys.all, "list"] as const,
  list: (options: UseModelsInfiniteOptions) =>
    [...modelsQueryKeys.lists(), options] as const,
  stats: (providers: string[]) =>
    [...modelsQueryKeys.all, "stats", providers] as const,
};

// Hook for infinite pagination of models
export function useModelsInfinite(options: UseModelsInfiniteOptions = {}) {
  // Stable query key - exclude enabledModels to avoid refetch on model toggle
  const stableOptions = useMemo(() => {
    return options;
  }, [options]);

  const query = useInfiniteQuery({
    queryKey: modelsQueryKeys.list(stableOptions),
    queryFn: async ({ pageParam }: { pageParam?: string }) => {
      const queryOptions = { ...stableOptions, cursor: pageParam };
      const queryParams = buildQueryParams(queryOptions);
      const url = `/api/models${queryParams ? `?${queryParams}` : ""}`;
      return fetcher(url);
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: lastPage =>
      lastPage.pagination.hasNextPage
        ? lastPage.pagination.nextCursor
        : undefined,
    enabled: options.enabled !== false,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  // Flatten all pages into a single array
  const allModels = useMemo(() => {
    return query.data?.pages.flatMap(page => page.models) || [];
  }, [query.data?.pages]);

  // Get stats from the first page (since stats don't change between pages)
  const stats = query.data?.pages[0]?.stats;

  // Get total count from the first page
  const total = query.data?.pages[0]?.pagination.total || 0;

  return {
    models: allModels,
    stats,
    total,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isFetchingNextPage: query.isFetchingNextPage,
    hasNextPage: query.hasNextPage,
    error: query.error,
    fetchNextPage: query.fetchNextPage,
    refetch: query.refetch,
    // Additional useful state
    isInitialLoading: query.isLoading && !query.data,
    isEmpty: !query.isLoading && allModels.length === 0,
  };
}

// Hook for single page of models (for scenarios where infinite loading isn't needed)
export function useModelsApi(options: UseModelsOptions = {}) {
  const queryParams = useMemo(() => buildQueryParams(options), [options]);

  const query = useQuery({
    queryKey: [...modelsQueryKeys.list(options), options.cursor],
    queryFn: async () => {
      const url = `/api/models${queryParams ? `?${queryParams}` : ""}`;
      return fetcher(url);
    },
    enabled: options.enabled !== false,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  const refresh = useCallback(() => {
    query.refetch();
  }, [query]);

  return {
    data: query.data?.models || [],
    pagination: query.data?.pagination,
    stats: query.data?.stats,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error,
    refresh,
  };
}

// Hook specifically for getting stats only (for provider summary cards)
export function useModelsStats(providers: string[] = []) {
  return useQuery({
    queryKey: modelsQueryKeys.stats(providers),
    queryFn: async () => {
      const params = new URLSearchParams();
      params.set("limit", "1"); // Minimal data transfer
      params.set("includeStats", "true");
      if (providers.length) {
        params.set("providers", providers.join(","));
      }

      const url = `/api/models?${params.toString()}`;
      const response = await fetcher(url);
      return response.stats;
    },
    enabled: providers.length > 0,
    staleTime: 10 * 60 * 1000, // 10 minutes - stats change infrequently
    gcTime: 15 * 60 * 1000, // 15 minutes
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
}

// Helper function for creating prefetch options
export function createPrefetchOptions(options: UseModelsInfiniteOptions) {
  return {
    queryKey: modelsQueryKeys.list(options),
    queryFn: async ({ pageParam }: { pageParam?: string }) => {
      const queryOptions = { ...options, cursor: pageParam };
      const queryParams = buildQueryParams(queryOptions);
      const url = `/api/models${queryParams ? `?${queryParams}` : ""}`;
      return fetcher(url);
    },
    initialPageParam: undefined as string | undefined,
  };
}
