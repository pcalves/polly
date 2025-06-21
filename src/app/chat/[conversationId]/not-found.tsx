import { Button } from "@/components/ui/button";
import { MessageCircle, Home, Plus } from "lucide-react";
import Link from "next/link";

export default function ChatNotFound() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="max-w-md mx-auto text-center space-y-6 p-6">
        <div className="space-y-4">
          <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center">
            <MessageCircle className="h-8 w-8 text-muted-foreground" />
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl font-bold">Conversation not found</h1>
            <p className="text-muted-foreground">
              This conversation doesn&apos;t exist or you don&apos;t have access
              to it.
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <Button asChild className="w-full">
            <Link href="/">
              <Plus className="mr-2 h-4 w-4" />
              Start New Chat
            </Link>
          </Button>

          <Button asChild variant="outline" className="w-full">
            <Link href="/">
              <Home className="mr-2 h-4 w-4" />
              Go Home
            </Link>
          </Button>

          <p className="text-sm text-muted-foreground">
            You can only access conversations that belong to you.
          </p>
        </div>
      </div>
    </div>
  );
}
