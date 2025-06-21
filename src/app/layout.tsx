import type { Metadata } from "next";
import { Inter, Geist_Mono } from "next/font/google";
import { cookies } from "next/headers";
import { ThemeProvider } from "@/providers/theme-provider";
import { ConvexClientProvider } from "@/providers/convex-provider";
import { ThinkingProvider } from "@/providers/thinking-provider";
import { QueryProvider } from "@/providers/query-provider";
import { AppProvider } from "@/providers/app-provider";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { THEME_COOKIE_NAME } from "@/lib/theme-utils";
import "katex/dist/katex.min.css";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
  preload: true,
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
  preload: true,
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  title: "Polly",
  description:
    "Multiple AI models in one place - supporting OpenAI, Anthropic, Google, and OpenRouter with BYOK support",
  icons: {
    icon: "/favicon.svg",
  },
};

async function getServerSideTheme() {
  const cookieStore = await cookies();
  const themeCookie = cookieStore.get(THEME_COOKIE_NAME)?.value;

  if (themeCookie === "dark" || themeCookie === "light") {
    return themeCookie;
  }

  return "light";
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const serverTheme = await getServerSideTheme();

  return (
    <html lang="en" className={serverTheme} suppressHydrationWarning>
      <head>
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link
          rel="preconnect"
          href="https://fonts.googleapis.com"
          crossOrigin=""
        />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin=""
        />
      </head>
      <body
        className={`${inter.variable} ${geistMono.variable} antialiased relative font-sans`}
      >
        <ThemeProvider serverTheme={serverTheme}>
          <ConvexClientProvider>
            <QueryProvider>
              <TooltipProvider>
                <ThinkingProvider>
                  <AppProvider>{children}</AppProvider>
                  <Toaster />
                </ThinkingProvider>
              </TooltipProvider>
            </QueryProvider>
          </ConvexClientProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
