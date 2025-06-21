import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image";

interface NotFoundPageProps {
  title?: string;
  description?: string;
}

export function NotFoundPage({
  title = "Page not found",
  description = "The page you're looking for doesn't exist.",
}: NotFoundPageProps) {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="max-w-md mx-auto text-center space-y-6 p-6">
        <div className="space-y-4">
          <div className="mx-auto w-32 h-32 flex items-center justify-center">
            <Image
              src="/polly-404.png"
              alt="Polly not found"
              width={128}
              height={128}
              className="object-contain"
            />
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl font-bold">{title}</h1>
            <p className="text-muted-foreground">{description}</p>
          </div>
        </div>

        <Button asChild>
          <Link href="/">New Chat</Link>
        </Button>
      </div>
    </div>
  );
}
