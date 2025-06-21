"use client";

import { Key, Brain, User } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { SettingsHeader } from "@/components/settings/settings-header";
import { SettingsContainer } from "@/components/settings/settings-container";
import { useUser } from "@/hooks/use-user";
import { useEffect } from "react";

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { user, isLoading } = useUser();

  useEffect(() => {
    if (!isLoading && (!user || user.isAnonymous)) {
      // Redirect anonymous users to home
      window.location.href = "/";
    }
  }, [user, isLoading]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user || user.isAnonymous) {
    return null;
  }

  const getActiveTab = (path: string) => {
    if (path === "/settings" || path === "/settings/api-keys")
      return "api-keys";
    if (path === "/settings/models") return "models";
    if (path === "/settings/personas") return "personas";
    return "api-keys";
  };

  const activeTab = getActiveTab(pathname);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SettingsHeader />

      <SettingsContainer>
        <div className="flex flex-col lg:flex-row gap-6 lg:gap-12">
          <div className="lg:w-56 lg:shrink-0">
            <nav className="flex flex-row lg:flex-col space-x-1 lg:space-x-0 lg:space-y-1 lg:sticky lg:top-24 overflow-x-auto lg:overflow-x-visible">
              <Link
                href="/settings/api-keys"
                className={cn(
                  "flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors whitespace-nowrap lg:w-full",
                  activeTab === "api-keys"
                    ? "bg-muted text-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                )}
              >
                <Key className="h-4 w-4" />
                API Keys
              </Link>
              <Link
                href="/settings/models"
                className={cn(
                  "flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors whitespace-nowrap lg:w-full",
                  activeTab === "models"
                    ? "bg-muted text-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                )}
              >
                <Brain className="h-4 w-4" />
                Models
              </Link>
              <Link
                href="/settings/personas"
                className={cn(
                  "flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors whitespace-nowrap lg:w-full",
                  activeTab === "personas"
                    ? "bg-muted text-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                )}
              >
                <User className="h-4 w-4" />
                Personas
              </Link>
            </nav>
          </div>

          <div className="flex-1 min-w-0">{children}</div>
        </div>
      </SettingsContainer>
    </div>
  );
}
