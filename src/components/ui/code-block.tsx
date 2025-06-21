"use client";

import { memo, useState, useRef } from "react";
import { Highlight } from "prism-react-renderer";
import { Copy, Check, WrapText, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useTheme } from "next-themes";
import { lightSyntaxTheme, darkSyntaxTheme } from "@/lib/syntax-themes";

interface CodeBlockProps {
  code: string;
  language?: string;
  className?: string;
  // If true, treats code as markdown code block and extracts language/content
  isMarkdownBlock?: boolean;
}

function CodeBlockComponent({
  code,
  language = "text",
  className,
  isMarkdownBlock = false,
}: CodeBlockProps) {
  const [copied, setCopied] = useState(false);
  const [wordWrap, setWordWrap] = useState(false);
  const { theme } = useTheme();
  const codeContainerRef = useRef<HTMLDivElement>(null);

  // Process markdown code blocks if needed
  const { processedCode, processedLanguage } = (() => {
    if (!isMarkdownBlock) {
      return { processedCode: code, processedLanguage: language };
    }

    const lines = code.split("\n");
    const firstLine = lines[0];
    const extractedLanguage = firstLine.startsWith("```")
      ? firstLine.slice(3).trim()
      : language;
    const extractedCode = lines.slice(1, -1).join("\n");

    return {
      processedCode: extractedCode,
      processedLanguage: extractedLanguage || "text",
    };
  })();

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(processedCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
      const { toast } = await import("sonner");
      toast.error("Failed to copy code", {
        description: "Unable to copy code to clipboard. Please try again.",
      });
    }
  };

  const handleDownload = () => {
    const blob = new Blob([processedCode], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `code.${getFileExtension(processedLanguage)}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getFileExtension = (lang: string): string => {
    const extensions: Record<string, string> = {
      javascript: "js",
      typescript: "ts",
      python: "py",
      java: "java",
      cpp: "cpp",
      c: "c",
      csharp: "cs",
      php: "php",
      ruby: "rb",
      go: "go",
      rust: "rs",
      swift: "swift",
      kotlin: "kt",
      scala: "scala",
      html: "html",
      css: "css",
      scss: "scss",
      less: "less",
      json: "json",
      xml: "xml",
      yaml: "yml",
      yml: "yml",
      sql: "sql",
      bash: "sh",
      shell: "sh",
      powershell: "ps1",
      dockerfile: "dockerfile",
      markdown: "md",
      text: "txt",
    };
    return extensions[lang.toLowerCase()] || "txt";
  };

  return (
    <div
      className={cn("group relative mt-2 flex w-full flex-col pt-9", className)}
    >
      {/* Header with language and actions */}
      <div className="absolute inset-x-0 top-0 flex h-9 items-center justify-between rounded-t bg-muted/50 border border-b-0 px-4 py-2 text-sm">
        <span className="text-muted-foreground font-medium font-mono">
          {processedLanguage || "text"}
        </span>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDownload}
            className="h-7 w-7 p-0 hover:bg-muted-foreground/10"
            title="Download code"
          >
            <Download className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setWordWrap(!wordWrap)}
            className={cn(
              "h-7 w-7 p-0 mr-6 hover:bg-muted-foreground/10",
              wordWrap && "bg-accent"
            )}
            title={wordWrap ? "Disable word wrap" : "Enable word wrap"}
          >
            <WrapText className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* Sticky copy button container - aligned with header */}
      <div className="sticky left-auto z-[1] ml-auto h-1.5 w-8 transition-[top] top-[36px]">
        <div className="absolute -top-[calc(2.25rem+2px)] right-2 flex gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopy}
                className="h-7 w-7 p-0 hover:bg-muted-foreground/10 transition-colors"
              >
                <div className="relative h-4 w-4">
                  {copied ? (
                    <Check className="h-3 w-3 text-accent-emerald absolute inset-0 transition-all duration-200" />
                  ) : (
                    <Copy className="h-3 w-3 absolute inset-0 transition-all duration-200" />
                  )}
                </div>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Copy code</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </div>

      {/* Spacer */}
      <div className="-mb-1.5"></div>

      {/* Code content */}
      <div
        className="relative bg-muted/50 border rounded-b-lg"
        ref={codeContainerRef}
      >
        <Highlight
          theme={theme === "dark" ? darkSyntaxTheme : lightSyntaxTheme}
          code={processedCode.trim()}
          language={processedLanguage}
        >
          {({
            className: highlightClassName,
            style,
            tokens,
            getLineProps,
            getTokenProps,
          }) => (
            <pre
              className={cn(
                highlightClassName,
                "m-0 overflow-x-auto p-4 text-sm font-mono",
                wordWrap && "whitespace-pre-wrap break-words overflow-x-visible"
              )}
              style={{
                ...style,
                fontFamily:
                  'var(--font-geist-mono), "Geist Mono", ui-monospace, SFMono-Regular, "SF Mono", Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
                backgroundColor: "transparent",
              }}
            >
              {tokens.map((line, i) => (
                <div key={i} {...getLineProps({ line })}>
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
