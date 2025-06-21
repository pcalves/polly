import { Button } from "@/components/ui/button";
import { Share2, Home } from "lucide-react";
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="max-w-md mx-auto text-center space-y-6 p-6">
        <div className="space-y-4">
          <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center">
            <Share2 className="h-8 w-8 text-muted-foreground" />
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl font-bold">Conversation not found</h1>
            <p className="text-muted-foreground">
              This shared conversation doesn&apos;t exist or may have been
              removed.
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <Button asChild size="full">
            <Link href="/">
              <Home className="mr-2 h-4 w-4" />
              Go to Polly AI
            </Link>
          </Button>

          <p className="text-sm text-muted-foreground">
            Start your own conversation or ask for a new share link.
          </p>
        </div>
      </div>
    </div>
  );
}
