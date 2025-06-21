import { WebSearchCitation } from "@/types";
import { WEB_SEARCH_MAX_RESULTS, canUseWebSearch } from "@/lib/web-search";

// Provider response type definitions for citation extraction
interface OpenRouterAnnotation {
  type: string;
  url: string;
  title?: string;
  snippet?: string;
}

interface GoogleSearchResult {
  uri: string;
  title?: string;
  snippet?: string;
}

interface GoogleGroundingMetadata {
  webSearchQueries?: GoogleSearchResult[];
}

export class WebSearchManager {
  /**
   * Determine if web search should be used for this message
   */
  static shouldUseWebSearch(
    message: string,
    provider: string,
    manualOverride?: boolean
  ): boolean {
    if (manualOverride !== undefined) return manualOverride;

    const { allowed } = canUseWebSearch();
    if (!allowed) return false;

    // Only allow web search for supported providers
    if (!this.supportsNativeWebSearch(provider)) return false;

    // No auto-trigger - web search must be explicitly enabled
    return false;
  }

  /**
   * Get the appropriate model ID for web search based on provider
   */
  static getWebSearchModel(modelId: string): string {
    // OpenRouter now uses plugins exclusively, no model modification needed
    // Google uses native grounding, no model modification needed
    return modelId;
  }

  /**
   * Get web search configuration for API calls
   */
  static getWebSearchConfig(provider: string): Record<string, unknown> | null {
    switch (provider) {
      case "openrouter":
        // OpenRouter supports both :online suffix and plugins for web search
        return {
          plugins: [
            {
              id: "web",
              max_results: WEB_SEARCH_MAX_RESULTS,
            },
          ],
        };

      case "google":
        // Google Gemini's grounding with Google Search
        return {
          tools: [
            {
              googleSearch: {},
            },
          ],
        };

      default:
        // No web search support for other providers
        return null;
    }
  }

  /**
   * Extract citations from different provider response formats
   */
  static extractCitations(
    response: unknown,
    provider: string
  ): WebSearchCitation[] {
    const citations: WebSearchCitation[] = [];

    try {
      switch (provider) {
        case "openrouter":
          // OpenRouter returns standardized annotations
          if (
            typeof response === "object" &&
            response &&
            "annotations" in response
          ) {
            const annotations = (
              response as { annotations: OpenRouterAnnotation[] }
            ).annotations;
            if (Array.isArray(annotations)) {
              annotations.forEach((annotation: OpenRouterAnnotation) => {
                if (annotation.type === "url_citation") {
                  citations.push({
                    type: "url_citation",
                    url: annotation.url,
                    title: annotation.title || "Web Source",
                    snippet: annotation.snippet,
                  });
                }
              });
            }
          }
          break;

        case "google":
          // Google Gemini includes grounding metadata
          if (
            typeof response === "object" &&
            response &&
            "groundingMetadata" in response
          ) {
            const metadata = (
              response as { groundingMetadata: GoogleGroundingMetadata }
            ).groundingMetadata;
            if (metadata.webSearchQueries) {
              metadata.webSearchQueries.forEach(
                (result: GoogleSearchResult) => {
                  citations.push({
                    type: "url_citation",
                    url: result.uri || "",
                    title: result.title || "Web Source",
                    snippet: result.snippet,
                  });
                }
              );
            }
          }
          break;
      }
    } catch (error) {
      console.error(
        `Failed to extract citations for provider ${provider}:`,
        error
      );
    }

    return citations;
  }

  /**
   * Format citations for display in chat messages
   */
  static formatCitationsForDisplay(citations: WebSearchCitation[]): string {
    if (!citations.length) return "";

    const citationList = citations
      .map((citation, index) => {
        const number = index + 1;
        return `[${number}] ${citation.title} - ${citation.url}`;
      })
      .join("\n");

    return `\n\n**Sources:**\n${citationList}`;
  }

  /**
   * Check if a provider supports native web search
   */
  static supportsNativeWebSearch(provider: string): boolean {
    return ["openrouter", "google"].includes(provider);
  }
}
