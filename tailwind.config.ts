import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
    "./src/app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        sans: [
          "var(--font-inter)",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "Helvetica Neue",
          "Arial",
          "sans-serif",
        ],
        mono: [
          "var(--font-geist-mono)",
          "ui-monospace",
          "SFMono-Regular",
          "SF Mono",
          "Monaco",
          "Consolas",
          "Liberation Mono",
          "Courier New",
          "monospace",
        ],
      },
      fontSize: {
        // Perfect typographic scale using golden ratio and modern best practices
        xs: ["0.75rem", { lineHeight: "1rem", letterSpacing: "0.025em" }], // 12px
        sm: ["0.875rem", { lineHeight: "1.25rem", letterSpacing: "0.025em" }], // 14px
        base: ["1rem", { lineHeight: "1.5rem", letterSpacing: "0" }], // 16px
        lg: ["1.125rem", { lineHeight: "1.75rem", letterSpacing: "-0.025em" }], // 18px
        xl: ["1.25rem", { lineHeight: "1.875rem", letterSpacing: "-0.025em" }], // 20px
        "2xl": ["1.5rem", { lineHeight: "2rem", letterSpacing: "-0.05em" }], // 24px
        "3xl": [
          "1.875rem",
          { lineHeight: "2.25rem", letterSpacing: "-0.05em" },
        ], // 30px
        "4xl": ["2.25rem", { lineHeight: "2.5rem", letterSpacing: "-0.075em" }], // 36px
        "5xl": ["3rem", { lineHeight: "1", letterSpacing: "-0.075em" }], // 48px
        "6xl": ["3.75rem", { lineHeight: "1", letterSpacing: "-0.1em" }], // 60px
        "7xl": ["4.5rem", { lineHeight: "1", letterSpacing: "-0.1em" }], // 72px
        "8xl": ["6rem", { lineHeight: "1", letterSpacing: "-0.1em" }], // 96px
        "9xl": ["8rem", { lineHeight: "1", letterSpacing: "-0.1em" }], // 128px

        // Additional display sizes for hero text
        "display-sm": [
          "2.5rem",
          { lineHeight: "1.2", letterSpacing: "-0.075em", fontWeight: "500" },
        ],
        "display-md": [
          "3.5rem",
          { lineHeight: "1.1", letterSpacing: "-0.075em", fontWeight: "500" },
        ],
        "display-lg": [
          "4.5rem",
          { lineHeight: "1.05", letterSpacing: "-0.1em", fontWeight: "600" },
        ],
        "display-xl": [
          "6rem",
          { lineHeight: "1", letterSpacing: "-0.1em", fontWeight: "600" },
        ],

        // Body text variants for better readability
        "body-sm": [
          "0.875rem",
          { lineHeight: "1.6", letterSpacing: "0.015em" },
        ],
        body: ["1rem", { lineHeight: "1.6", letterSpacing: "0" }],
        "body-lg": [
          "1.125rem",
          { lineHeight: "1.7", letterSpacing: "-0.015em" },
        ],

        // UI specific sizes
        caption: [
          "0.75rem",
          { lineHeight: "1.25", letterSpacing: "0.05em", fontWeight: "400" },
        ],
        overline: [
          "0.625rem",
          { lineHeight: "1", letterSpacing: "0.15em", fontWeight: "500" },
        ],
      },
      fontWeight: {
        thin: "100",
        extralight: "200",
        light: "300",
        normal: "400",
        medium: "500",
        semibold: "600",
        bold: "700",
        extrabold: "800",
        black: "900",
      },
      letterSpacing: {
        tightest: "-0.075em",
        tighter: "-0.05em",
        tight: "-0.025em",
        normal: "0",
        wide: "0.025em",
        wider: "0.05em",
        widest: "0.1em",
        "extra-wide": "0.15em",
      },
      lineHeight: {
        none: "1",
        tight: "1.1",
        snug: "1.2",
        normal: "1.4",
        relaxed: "1.5",
        comfortable: "1.6",
        loose: "1.7",
        "3": ".75rem",
        "4": "1rem",
        "5": "1.25rem",
        "6": "1.5rem",
        "7": "1.75rem",
        "8": "2rem",
        "9": "2.25rem",
        "10": "2.5rem",
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
          purple: "hsl(var(--accent-purple))",
          blue: "hsl(var(--accent-blue))",
          emerald: "hsl(var(--accent-emerald))",
          orange: "hsl(var(--accent-orange))",
          coral: "hsl(var(--accent-coral))",
          yellow: "hsl(var(--accent-yellow))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        "sidebar-tinted": "hsl(var(--sidebar-tinted))",
        "active-element": {
          tint: "hsl(var(--active-element-tint))",
          border: "hsl(var(--active-element-border))",
        },
        coral: {
          50: "hsl(10 100% 97%)",
          100: "hsl(10 80% 92%)",
          200: "hsl(10 75% 85%)",
          300: "hsl(10 75% 75%)",
          400: "hsl(10 75% 68%)",
          500: "hsl(10 75% 60%)",
          600: "hsl(10 75% 52%)",
          700: "hsl(10 75% 45%)",
          800: "hsl(10 75% 38%)",
          900: "hsl(10 75% 32%)",
          950: "hsl(10 75% 20%)",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        soft: "1.5rem",
        organic: "2rem",
        blob: "2.5rem",
        pill: "50rem",
        xl: "1.25rem",
        "2xl": "2rem",
        "3xl": "2.5rem",
        "4xl": "3rem",
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":
          "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
        "gradient-primary":
          "linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--accent-blue)) 100%)",
        "gradient-surface":
          "linear-gradient(135deg, hsl(var(--surface-primary)) 0%, hsl(var(--surface-secondary)) 100%)",
        "gradient-accent":
          "linear-gradient(135deg, hsl(var(--accent-purple)) 0%, hsl(var(--accent-blue)) 100%)",
        "gradient-tropical": "var(--gradient-tropical)",
        "gradient-organic":
          "radial-gradient(ellipse 70% 70% at 50% 50%, hsl(var(--primary) / 0.15) 0%, transparent 70%)",
        "header-gradient-from-logo": "var(--header-gradient-from-logo)",
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fadeIn 0.5s ease-out",
        "slide-up": "slideUp 0.4s ease-out",
        "scale-in": "scaleIn 0.3s ease-out",
        glow: "glow 3s ease-in-out infinite alternate",
        float: "float 6s ease-in-out infinite",
        "pulse-soft": "pulseSoft 2s ease-in-out infinite",
        "gradient-shift": "gradientShift 3s ease-in-out infinite",
        "gradient-x": "gradientX 3s ease-in-out infinite",
        "spin-reverse": "spin-reverse 1s linear infinite",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        fadeIn: {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        slideUp: {
          from: { opacity: "0", transform: "translateY(20px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        scaleIn: {
          from: { opacity: "0", transform: "scale(0.95)" },
          to: { opacity: "1", transform: "scale(1)" },
        },
        glow: {
          from: { boxShadow: "0 0 20px -5px hsl(var(--primary) / 0.3)" },
          to: { boxShadow: "0 0 40px -5px hsl(var(--primary) / 0.6)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-10px)" },
        },
        pulseSoft: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.7" },
        },
        gradientShift: {
          "0%, 100%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
        },
        gradientX: {
          "0%, 100%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
        },
        "spin-reverse": {
          from: { transform: "rotate(360deg)" },
          to: { transform: "rotate(0deg)" },
        },
      },
      boxShadow: {
        soft: "0 25px 50px -12px rgb(0 0 0 / 0.25)",
        organic:
          "0 20px 40px -8px rgb(0 0 0 / 0.15), 0 10px 20px -4px rgb(0 0 0 / 0.1)",
        glow: "0 0 20px -5px hsl(var(--primary) / 0.3)",
      },
      backdropBlur: {
        xs: "2px",
      },
      typography: {
        DEFAULT: {
          css: {
            maxWidth: "none",
            color: "hsl(var(--foreground))",
            lineHeight: "1.6",
            '[class~="lead"]': {
              fontSize: "1.125rem",
              lineHeight: "1.7",
              letterSpacing: "-0.015em",
            },
            p: {
              marginTop: "1.25em",
              marginBottom: "1.25em",
              lineHeight: "1.6",
            },
            "h1, h2, h3, h4, h5, h6": {
              fontWeight: "600",
              letterSpacing: "-0.025em",
              lineHeight: "1.2",
            },
            h1: {
              fontSize: "2.25rem",
              marginTop: "0",
              marginBottom: "0.8888889em",
              lineHeight: "1.1111111",
              letterSpacing: "-0.075em",
              fontWeight: "700",
            },
            h2: {
              fontSize: "1.875rem",
              marginTop: "1.6em",
              marginBottom: "0.8em",
              lineHeight: "1.2",
              letterSpacing: "-0.05em",
              fontWeight: "600",
            },
            h3: {
              fontSize: "1.5rem",
              marginTop: "1.6em",
              marginBottom: "0.6em",
              lineHeight: "1.33333",
              letterSpacing: "-0.025em",
              fontWeight: "600",
            },
            h4: {
              fontSize: "1.25rem",
              marginTop: "1.5em",
              marginBottom: "0.5em",
              lineHeight: "1.4",
              letterSpacing: "-0.025em",
              fontWeight: "600",
            },
            "h5, h6": {
              fontSize: "1.125rem",
              marginTop: "1.4em",
              marginBottom: "0.4em",
              lineHeight: "1.5",
              fontWeight: "600",
            },
            code: {
              fontFamily: "var(--font-geist-mono)",
              fontWeight: "500",
              fontSize: "0.875em",
              padding: "0.25em 0.375em",
              borderRadius: "0.375rem",
              backgroundColor: "hsl(var(--muted))",
              color: "hsl(var(--foreground))",
            },
            "code::before": {
              content: '""',
            },
            "code::after": {
              content: '""',
            },
            pre: {
              fontFamily: "var(--font-geist-mono)",
              backgroundColor: "hsl(var(--muted))",
              borderRadius: "0.75rem",
              padding: "1rem",
              overflow: "auto",
              fontSize: "0.875rem",
              lineHeight: "1.5",
            },
            "pre code": {
              backgroundColor: "transparent",
              padding: "0",
              fontWeight: "inherit",
              color: "inherit",
              borderRadius: "0",
            },
            blockquote: {
              fontStyle: "italic",
              borderLeftWidth: "4px",
              borderLeftColor: "hsl(var(--border))",
              paddingLeft: "1em",
              marginLeft: "0",
              marginRight: "0",
              quotes: "none",
            },
            ul: {
              paddingLeft: "1.5em",
            },
            ol: {
              paddingLeft: "1.5em",
            },
            li: {
              marginTop: "0.5em",
              marginBottom: "0.5em",
            },
            strong: {
              fontWeight: "600",
            },
            a: {
              color: "hsl(var(--primary))",
              textDecoration: "underline",
              textUnderlineOffset: "2px",
              textDecorationThickness: "1px",
              "&:hover": {
                textDecorationThickness: "2px",
              },
            },
          },
        },
      },
    },
  },
  plugins: [
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    require("tailwindcss-animate"),
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    require("@tailwindcss/typography"),
  ],
} satisfies Config;

export default config;
