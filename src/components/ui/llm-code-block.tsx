"use client";

import { type LLMOutputComponent } from "@llm-ui/react";
import { CodeBlock } from "@/components/ui/code-block";

// LLM-UI compatible code block component using our unified CodeBlock
export const LLMCodeBlock: LLMOutputComponent = ({ blockMatch }) => {
  return (
    <CodeBlock
      code={blockMatch.output}
      isMarkdownBlock={true}
      className="my-4"
    />
  );
};
