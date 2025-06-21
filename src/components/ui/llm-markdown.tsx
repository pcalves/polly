"use client";

import React, { useMemo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import { type LLMOutputComponent } from "@llm-ui/react";
import { CodeBlock } from "@/components/ui/code-block";
import { useMessageId } from "./enhanced-markdown";

// Helper function to generate heading ID (same logic as in outline)
const generateHeadingId = (messageId: string, headingText: string): string => {
  const cleanText = headingText
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return `${messageId}-heading-${cleanText}`;
};

// Memoized heading component factory
const createHeadingComponent = (level: number) => {
  const Tag = `h${level}` as "h1" | "h2" | "h3" | "h4" | "h5" | "h6";

  const HeadingComponent = React.memo(
    ({ children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => {
      // Get message ID from context
      const messageId = useMessageId() || "";

      // Get text content for ID generation
      const textContent = useMemo(
        () => React.Children.toArray(children).join("").toString(),
        [children]
      );
      const headingId = useMemo(
        () => generateHeadingId(messageId, textContent),
        [messageId, textContent]
      );

      return React.createElement(
        Tag,
        {
          ...props,
          id: headingId,
          className: `scroll-mt-20 ${props.className || ""}`.trim(),
        },
        children
      );
    }
  );

  HeadingComponent.displayName = `Heading${level}`;
  return HeadingComponent;
};

// Create heading components once
const headingComponents = {
  h1: createHeadingComponent(1),
  h2: createHeadingComponent(2),
  h3: createHeadingComponent(3),
  h4: createHeadingComponent(4),
  h5: createHeadingComponent(5),
  h6: createHeadingComponent(6),
};

// Memoized code component
const InlineCode = React.memo(
  ({
    children,
    className,
    ...rest
  }: React.HTMLAttributes<HTMLElement> & { className?: string }) => {
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
  }
);
InlineCode.displayName = "InlineCode";

// Memoized pre component
const PreComponent = React.memo(
  ({ children, ...rest }: React.HTMLAttributes<HTMLPreElement>) => {
    // Check if children is a React element with code
    if (React.isValidElement(children) && children.props) {
      const codeProps = children.props as {
        children?: string;
        className?: string;
      };
      if (typeof codeProps.children === "string") {
        const language =
          codeProps.className?.replace("language-", "") || "text";
        return (
          <CodeBlock
            code={codeProps.children}
            language={language}
            className="my-4"
          />
        );
      }
    }

    // Fallback to regular pre if we can't extract code
    return <pre {...rest}>{children}</pre>;
  }
);
PreComponent.displayName = "PreComponent";

// Markdown component for llm-ui
export const LLMMarkdown: LLMOutputComponent = ({ blockMatch }) => {
  const markdown = blockMatch.output;

  // Memoize the components object
  const components = useMemo(
    () => ({
      // Custom heading components with proper IDs
      ...headingComponents,
      // Customize inline code
      code: InlineCode,
      // Replace pre tags with our CodeBlock component
      pre: PreComponent,
    }),
    []
  );

  return (
    <div className="prose prose-base max-w-none dark:prose-invert prose-p:leading-7 katex-container">
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={components}
      >
        {markdown}
      </ReactMarkdown>
    </div>
  );
};
