"use client";

import { useState } from "react";
import { ExternalLink, Globe } from "lucide-react";
import { cn } from "@/lib/utils";
import type { WebSearchCitation } from "@/types";

interface CitationsProps {
  citations: WebSearchCitation[];
  className?: string;
  compact?: boolean;
}

export function Citations({
  citations,
  className,
  compact = false,
}: CitationsProps) {
  const [isExpanded, setIsExpanded] = useState(!compact);

  if (!citations || citations.length === 0) {
    return null;
  }

  const handleCitationClick = (url: string) => {
    window.open(url, "_blank", "noopener,noreferrer");
  };

  if (compact) {
    return (
      <div className={cn("mt-4 w-full", className)}>
        <button
          className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-all duration-200 group"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <span className="flex items-center gap-1.5">
            {isExpanded ? (
              <>
                <svg
                  className="w-4 h-4 transition-transform duration-200 group-hover:scale-110"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 15l7-7 7 7"
                  />
                </svg>
                <Globe className="w-4 h-4 text-accent-cyan transition-transform duration-200 group-hover:scale-110" />
                {citations.length} source{citations.length !== 1 ? "s" : ""}
              </>
            ) : (
              <>
                <svg
                  className="w-4 h-4 transition-transform duration-200 group-hover:scale-110"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
                <Globe className="w-4 h-4 text-accent-cyan transition-transform duration-200 group-hover:scale-110" />
                {citations.length} source{citations.length !== 1 ? "s" : ""}
              </>
            )}
          </span>
        </button>

        <div
          className={`
            relative mt-2 border-l-2 border-muted/30 dark:border-l-muted/20
            pl-4 overflow-hidden transition-all duration-300 ease-in-out
            max-w-[calc(100%-25%)]
            ${
              isExpanded
                ? "h-auto opacity-100 translate-y-0"
                : "h-0 opacity-0 -translate-y-2"
            }
          `}
        >
          <div className="py-3 space-y-3">
            {citations.map((citation, index) => (
              <button
                key={index}
                onClick={() => handleCitationClick(citation.url)}
                className="flex items-start gap-3 w-full p-3 text-left text-sm hover:bg-muted/30 rounded-lg transition-all duration-200 group border border-border/30 hover:border-accent-cyan/30 hover:shadow-sm"
              >
                <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-accent-cyan shrink-0 mt-0.5 transition-colors duration-200" />
                <div className="min-w-0 flex-1">
                  <div className="font-medium text-foreground group-hover:text-accent-cyan line-clamp-2 transition-colors duration-200">
                    {citation.title}
                  </div>
                  {citation.snippet && (
                    <div className="text-muted-foreground line-clamp-3 mt-2 text-xs leading-relaxed">
                      {citation.snippet}
                    </div>
                  )}
                  <div className="text-muted-foreground/70 truncate mt-2 text-xs">
                    {new URL(citation.url).hostname}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("mt-4 w-full", className)}>
      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-4">
        <Globe className="w-4 h-4 text-accent-cyan" />
        <span>
          {citations.length} source{citations.length !== 1 ? "s" : ""}
        </span>
      </div>

      <div className="relative border-l-2 border-muted/30 dark:border-l-muted/20 pl-4">
        <div className="py-2 space-y-3">
          {citations.map((citation, index) => (
            <button
              key={index}
              onClick={() => handleCitationClick(citation.url)}
              className="flex items-start gap-3 w-full p-3 text-left text-sm hover:bg-muted/30 rounded-lg transition-all duration-200 group border border-border/30 hover:border-accent-cyan/30 hover:shadow-sm"
            >
              <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-accent-cyan shrink-0 mt-0.5 transition-colors duration-200" />
              <div className="min-w-0 flex-1">
                <div className="font-medium text-foreground group-hover:text-accent-cyan line-clamp-2 transition-colors duration-200">
                  {citation.title}
                </div>

                {citation.snippet && (
                  <div className="text-muted-foreground line-clamp-3 mt-2 text-xs leading-relaxed">
                    {citation.snippet}
                  </div>
                )}

                {citation.cited_text &&
                  citation.cited_text !== citation.snippet && (
                    <blockquote className="text-muted-foreground/80 mt-2 pl-3 border-l-2 border-accent-cyan/30 italic line-clamp-2 text-xs">
                      {citation.cited_text}
                    </blockquote>
                  )}

                <div className="text-muted-foreground/70 truncate mt-2 text-xs">
                  {new URL(citation.url).hostname}
                </div>
              </div>
            </button>
          ))}
        </div>

        <div className="mt-3 pt-3 border-t border-border/30">
          <p className="text-xs text-muted-foreground/70">
            Information gathered from web search. Click any source to visit the
            original page.
          </p>
        </div>
      </div>
    </div>
  );
}
