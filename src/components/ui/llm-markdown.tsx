"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { type LLMOutputComponent } from "@llm-ui/react";

// Markdown component for llm-ui
export const LLMMarkdown: LLMOutputComponent = ({ blockMatch }) => {
  const markdown = blockMatch.output;
  
  return (
    <div className="prose prose-base max-w-none dark:prose-invert prose-p:leading-7">
      <ReactMarkdown 
        remarkPlugins={[remarkGfm]}
        components={{
          // Customize inline code
          code: ({ children, className, ...rest }) => {
            const isInline = !className;
            
            if (isInline) {
              return (
                <code
                  className="relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm"
                  {...rest}
                >
                  {children}
                </code>
              );
            }
            
            // Block code should be handled by llm-ui code blocks
            return <code {...rest}>{children}</code>;
          },
        }}
      >
        {markdown}
      </ReactMarkdown>
    </div>
  );
}; 