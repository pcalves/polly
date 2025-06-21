"use client";

import { type LLMOutputComponent } from "@llm-ui/react";
import { CodeBlock } from "@/components/ui/code-block";

// LLM-UI compatible code block component using our feature-rich CodeBlock
export const LLMCodeBlock: LLMOutputComponent = ({ blockMatch }) => {
  const codeContent = blockMatch.output;
  
  // Extract language from markdown code block
  const lines = codeContent.split('\n');
  const firstLine = lines[0];
  const language = firstLine.startsWith('```') ? firstLine.slice(3).trim() : undefined;
  
  // Remove the first and last lines (``` markers) if they exist
  const code = lines.slice(1, -1).join('\n');
  
  return (
    <CodeBlock
      code={code}
      language={language}
      className="my-4"
    />
  );
}; 