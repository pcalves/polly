import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/react";
import { Inter, Geist_Mono } from "next/font/google";
import { cookies } from "next/headers";
import { ThemeProvider } from "@/providers/theme-provider";
import { SidebarProvider } from "@/providers/sidebar-provider";
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
    "Chat with multiple AI models using your own API keys. Switch between models seamlessly in one beautiful interface. No subscription requireds.",

  // OpenGraph
  openGraph: {
    title: "Polly - Multi-Model AI Chat with Your Own API Keys",
    description:
      "Chat with multiple AI models using your own API keys. Switch between models seamlessly in one beautiful interface. No subscription required.",
    url: "https://www.pollyai.chat",
    siteName: "Polly",
    type: "website",
    locale: "en_US",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Polly AI chat interface showing parrot mascot and multiple AI model options",
      },
    ],
  },

  // Twitter
  twitter: {
    card: "summary_large_image",
    title: "Polly",
    description:
      "Chat with multiple AI models using your own API keys. Switch between models seamlessly in one beautiful interface.",
    images: ["/og-image.png"],
  },

  // Additional metadata
  keywords: [
    "AI chat",
    "multi-model AI",
    "API keys",
    "ChatGPT alternative",
    "Claude",
    "Gemini",
    "OpenAI",
  ],
  creator: "Polly",
  publisher: "Polly",
  robots: "index, follow",

  // Viewport and theme
  viewport: "width=device-width, initial-scale=1",
  themeColor: "#10b981",

  // Icons
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

async function getServerSideSidebar() {
  // Server always returns false to prevent hydration mismatch
  // The actual state will be determined client-side after mount
  return false;
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const serverTheme = await getServerSideTheme();
  const serverSidebarVisible = await getServerSideSidebar();

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
        className={`${inter.variable} ${geistMono.variable} antialiased relative font-sans overflow-x-hidden`}
      >
        <ThemeProvider serverTheme={serverTheme}>
          <SidebarProvider serverSidebarVisible={serverSidebarVisible}>
            <ConvexClientProvider>
              <QueryProvider>
                <TooltipProvider>
                  <ThinkingProvider>
                    <AppProvider>
                      {children}
                      <Analytics />
                    </AppProvider>
                    <Toaster />
                  </ThinkingProvider>
                </TooltipProvider>
              </QueryProvider>
            </ConvexClientProvider>
          </SidebarProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
