"use client";

import { memo, useState } from "react";
import { Highlight, themes } from "prism-react-renderer";
import { Copy, Check, WrapText, Hash } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useTheme } from "next-themes";

interface CodeBlockProps {
  code: string;
  language?: string;
  className?: string;
}

function CodeBlockComponent({
  code,
  language = "text",
  className
}: CodeBlockProps) {
  const [copied, setCopied] = useState(false);
  const [showLineNumbers, setShowLineNumbers] = useState(false);
  const [wordWrap, setWordWrap] = useState(false);
  const { theme } = useTheme();

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  return (
    <div className={cn("group relative rounded-lg border bg-muted/50", className)}>
      {/* Header with language and actions */}
      <div className="flex items-center justify-between border-b px-4 py-2 text-sm">
        <span className="text-muted-foreground font-medium">
          {language || "text"}
        </span>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setWordWrap(!wordWrap)}
            className={cn("h-7 w-7 p-0", wordWrap && "bg-accent")}
            title={wordWrap ? "Disable word wrap" : "Enable word wrap"}
          >
            <WrapText className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowLineNumbers(!showLineNumbers)}
            className={cn("h-7 w-7 p-0", showLineNumbers && "bg-accent")}
            title={showLineNumbers ? "Hide line numbers" : "Show line numbers"}
          >
            <Hash className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCopy}
            className="h-7 w-7 p-0"
            title="Copy code"
          >
            {copied ? (
              <Check className="h-3 w-3 text-green-600" />
            ) : (
              <Copy className="h-3 w-3" />
            )}
          </Button>
        </div>
      </div>

      {/* Code content */}
      <div className="relative">
        <Highlight
          theme={theme === "dark" ? themes.vsDark : themes.vsLight}
          code={code.trim()}
          language={language}
        >
          {({ className: highlightClassName, style, tokens, getLineProps, getTokenProps }) => (
            <pre
              className={cn(
                highlightClassName,
                "m-0 overflow-x-auto p-4 text-sm font-mono",
                wordWrap && "whitespace-pre-wrap break-words overflow-x-visible"
              )}
              style={{
                ...style,
                fontFamily: 'var(--font-geist-mono), "Geist Mono", ui-monospace, SFMono-Regular, "SF Mono", Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
                backgroundColor: "transparent"
              }}
            >
              {tokens.map((line, i) => (
                <div key={i} {...getLineProps({ line })}>
                  {showLineNumbers && (
                    <span className="mr-4 select-none text-muted-foreground/50 text-right inline-block w-8">
                      {i + 1}
                    </span>
                  )}
                  {line.map((token, key) => (
                    <span key={key} {...getTokenProps({ token })} />
                  ))}
                </div>
              ))}
            </pre>
          )}
        </Highlight>
      </div>
    </div>
  );
}

export const CodeBlock = memo(CodeBlockComponent);
