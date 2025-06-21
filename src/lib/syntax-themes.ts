import type { PrismTheme } from "prism-react-renderer";

export const lightSyntaxTheme: PrismTheme = {
  plain: {
    color: "hsl(0 0% 3.9%)", // --foreground in light mode
    backgroundColor: "transparent",
  },
  styles: [
    {
      types: ["comment", "prolog", "cdata"],
      style: {
        color: "hsl(0 0% 45.1%)", // --muted-foreground
        fontStyle: "italic",
      },
    },
    {
      types: ["doctype", "punctuation", "entity"],
      style: {
        color: "hsl(0 0% 45.1%)", // --muted-foreground
      },
    },
    {
      types: [
        "attr-name",
        "class-name",
        "boolean",
        "constant",
        "number",
        "atrule",
      ],
      style: {
        color: "hsl(280 70% 50%)", // --accent-purple
        fontWeight: "500",
      },
    },
    {
      types: ["keyword", "property", "tag", "symbol", "deleted", "important"],
      style: {
        color: "hsl(158 65% 40%)", // --primary
        fontWeight: "600",
      },
    },
    {
      types: [
        "selector",
        "string",
        "char",
        "builtin",
        "inserted",
        "regex",
        "attr-value",
      ],
      style: {
        color: "hsl(200 85% 55%)", // --accent-blue
      },
    },
    {
      types: ["variable", "operator", "function"],
      style: {
        color: "hsl(35 90% 55%)", // --accent-orange
      },
    },
    {
      types: ["url"],
      style: {
        color: "hsl(10 75% 60%)", // --accent-coral
        textDecorationLine: "underline",
      },
    },
    {
      types: ["namespace"],
      style: {
        color: "hsl(55 85% 60%)", // --accent-yellow
      },
    },
    {
      types: ["bracket", "delimiter"],
      style: {
        color: "hsl(0 0% 3.9%)", // --foreground
      },
    },
    {
      types: ["title"],
      style: {
        color: "hsl(158 65% 40%)", // --primary
        fontWeight: "bold",
      },
    },
    {
      types: ["generic"],
      style: {
        color: "hsl(0 0% 45.1%)", // --muted-foreground
      },
    },
  ],
};

export const darkSyntaxTheme: PrismTheme = {
  plain: {
    color: "hsl(210 40% 98%)", // --foreground in dark mode
    backgroundColor: "transparent",
  },
  styles: [
    {
      types: ["comment", "prolog", "cdata"],
      style: {
        color: "hsl(217.9 10.6% 64.9%)", // --muted-foreground
        fontStyle: "italic",
      },
    },
    {
      types: ["doctype", "punctuation", "entity"],
      style: {
        color: "hsl(217.9 10.6% 64.9%)", // --muted-foreground
      },
    },
    {
      types: [
        "attr-name",
        "class-name",
        "boolean",
        "constant",
        "number",
        "atrule",
      ],
      style: {
        color: "hsl(280 85% 65%)", // --accent-purple dark mode
        fontWeight: "500",
      },
    },
    {
      types: ["keyword", "property", "tag", "symbol", "deleted", "important"],
      style: {
        color: "hsl(158 80% 45%)", // --primary dark mode
        fontWeight: "600",
      },
    },
    {
      types: [
        "selector",
        "string",
        "char",
        "builtin",
        "inserted",
        "regex",
        "attr-value",
      ],
      style: {
        color: "hsl(200 95% 65%)", // --accent-blue dark mode
      },
    },
    {
      types: ["variable", "operator", "function"],
      style: {
        color: "hsl(35 100% 60%)", // --accent-orange dark mode
      },
    },
    {
      types: ["url"],
      style: {
        color: "hsl(10 85% 70%)", // --accent-coral dark mode
        textDecorationLine: "underline",
      },
    },
    {
      types: ["namespace"],
      style: {
        color: "hsl(55 95% 70%)", // --accent-yellow dark mode
      },
    },
    {
      types: ["bracket", "delimiter"],
      style: {
        color: "hsl(210 40% 98%)", // --foreground
      },
    },
    {
      types: ["title"],
      style: {
        color: "hsl(158 80% 45%)", // --primary dark mode
        fontWeight: "bold",
      },
    },
    {
      types: ["generic"],
      style: {
        color: "hsl(217.9 10.6% 64.9%)", // --muted-foreground
      },
    },
  ],
};
