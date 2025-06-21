import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ArrowLeft, LogOut } from "lucide-react";
import Link from "next/link";
import { useAuthActions } from "@convex-dev/auth/react";
import { ThemeToggle } from "@/components/ui/theme-toggle";

interface SettingsHeaderProps {
  // For page headers (new usage)
  title?: string;
  description?: string;
  className?: string;

  // For navigation headers (existing usage)
  backLink?: string;
  backText?: string;
}

export function SettingsHeader({
  title,
  description,
  className,
  backLink,
  backText = "Back to Chat",
}: SettingsHeaderProps) {
  const authActions = useAuthActions();

  // Navigation header (existing usage)
  if (backLink) {
    return (
      <div className="border-b border-border/40 flex-shrink-0">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between gap-4">
            <Link href={backLink}>
              <Button variant="ghost" size="sm" className="px-2">
                <ArrowLeft className="h-4 w-4 mr-2" />
                {backText}
              </Button>
            </Link>

            <div className="flex items-center gap-2">
              <ThemeToggle />
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-2"
                onClick={authActions.signOut}
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Page header (new usage)
  if (title && description) {
    return (
      <div className={cn("space-y-2", className)}>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        <p className="text-muted-foreground">{description}</p>
      </div>
    );
  }

  // Fallback for invalid usage
  return null;
}
