"use client";

import { memo } from "react";
import {
  codeBlockLookBack,
  findCompleteCodeBlock,
  findPartialCodeBlock,
} from "@llm-ui/code";
import { markdownLookBack } from "@llm-ui/markdown";
import { useLLMOutput } from "@llm-ui/react";
import { LLMMarkdown } from "./llm-markdown";
import { LLMCodeBlock } from "./llm-code-block";

interface EnhancedMarkdownProps {
  children: string;
  className?: string;
  isStreaming?: boolean;
}

function EnhancedMarkdownComponent({ 
  children, 
  className, 
  isStreaming = false 
}: EnhancedMarkdownProps) {
  const { blockMatches } = useLLMOutput({
    llmOutput: children,
    fallbackBlock: {
      component: LLMMarkdown,
      lookBack: markdownLookBack(),
    },
    blocks: [
      {
        component: LLMCodeBlock,
        findCompleteMatch: findCompleteCodeBlock(),
        findPartialMatch: findPartialCodeBlock(),
        lookBack: codeBlockLookBack(),
      },
    ],
    isStreamFinished: !isStreaming,
  });

  return (
    <div className={className}>
      {blockMatches.map((blockMatch, index) => {
        const Component = blockMatch.block.component;
        return <Component key={index} blockMatch={blockMatch} />;
      })}
    </div>
  );
}

export const EnhancedMarkdown = memo(EnhancedMarkdownComponent);
