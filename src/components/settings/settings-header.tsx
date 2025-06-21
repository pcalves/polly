import { Button } from "@/components/ui/button";
import { ArrowLeft, Settings } from "lucide-react";
import Link from "next/link";

interface SettingsHeaderProps {
  title?: string;
  backLink?: string;
  backText?: string;
}

export function SettingsHeader({
  title = "Settings",
  backLink = "/",
  backText = "Back to Chat",
}: SettingsHeaderProps) {
  return (
    <div className="border-b border-border/40 flex-shrink-0">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center gap-4">
          <Link href={backLink}>
            <Button variant="ghost" size="sm" className="h-8 px-2">
              <ArrowLeft className="h-4 w-4 mr-2" />
              {backText}
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-muted-foreground" />
            <h1 className="text-xl font-semibold">{title}</h1>
          </div>
        </div>
      </div>
    </div>
  );
}
