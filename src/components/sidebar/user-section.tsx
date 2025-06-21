"use client";

import { User, LogIn } from "lucide-react";
import { useAuthToken } from "@convex-dev/auth/react";
import { useQuery } from "convex/react";
import { Button } from "@/components/ui/button";
import { api } from "../../../convex/_generated/api";
import Image from "next/image";
import Link from "next/link";
import { useSidebar } from "@/hooks/use-sidebar";
import { cn } from "@/lib/utils";

interface UserSectionContentProps {
  user:
    | {
        _id: string;
        _creationTime: number;
        name?: string;
        email?: string;
        emailVerified?: number;
        emailVerificationTime?: number;
        image?: string;
        isAnonymous?: boolean;
        messagesSent?: number;
        createdAt?: number;
      }
    | null
    | undefined;
  token: string | null | undefined;
}

function UserSectionContent({ user, token }: UserSectionContentProps) {
  const { isMobile } = useSidebar();

  if (!token || !user) {
    return (
      <Link
        href="/auth"
        className={cn("block w-full", isMobile ? "px-3 py-8" : "px-4 py-6")}
      >
        <Button
          variant="ghost"
          className={cn(
            "w-full flex items-center justify-start gap-3 text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors touch-manipulation",
            isMobile ? "text-base py-6" : "text-sm"
          )}
        >
          <LogIn className={cn(isMobile ? "h-5 w-5" : "h-4 w-4")} />
          Sign In
        </Button>
      </Link>
    );
  }

  return (
    <Link
      href="/settings"
      className={cn("block w-full", isMobile ? "px-3 py-4" : "px-4 py-2")}
    >
      <Button
        variant="ghost"
        className={cn(
          "w-full justify-start gap-3 touch-manipulation",
          isMobile ? "py-8 text-base" : "py-6 text-sm"
        )}
      >
        {user.image ? (
          <Image
            src={user.image}
            alt={user.name || "User avatar"}
            width={isMobile ? 32 : 24}
            height={isMobile ? 32 : 24}
            className={cn(
              "rounded-full object-cover",
              isMobile ? "w-8 h-8" : "w-6 h-6"
            )}
            unoptimized
            onError={e => {
              const target = e.target as HTMLImageElement;
              target.style.display = "none";
              const fallback = target.nextElementSibling as HTMLElement;
              if (fallback) {
                fallback.style.display = "flex";
              }
            }}
          />
        ) : (
          <div
            className={cn(
              "rounded-full bg-gradient-tropical flex items-center justify-center",
              isMobile ? "w-8 h-8" : "w-6 h-6"
            )}
          >
            <User
              className={cn("text-white", isMobile ? "h-4 w-4" : "h-3 w-3")}
            />
          </div>
        )}
        {user.image && (
          <div
            className={cn(
              "rounded-full bg-gradient-tropical items-center justify-center hidden",
              isMobile ? "w-8 h-8" : "w-6 h-6"
            )}
          >
            <User
              className={cn("text-white", isMobile ? "h-4 w-4" : "h-3 w-3")}
            />
          </div>
        )}
        <span className="truncate">{user.name || user.email || "User"}</span>
      </Button>
    </Link>
  );
}

export function UserSection() {
  const token = useAuthToken();
  const user = useQuery(api.users.getCurrentUser);
  const { isMobile } = useSidebar();

  if (token === undefined && user === undefined) {
    return (
      <div className={cn("flex-shrink-0", isMobile ? "p-3" : "p-4")}>
        <div
          className={cn(
            "flex items-center gap-3 text-muted-foreground",
            isMobile ? "text-base" : "text-sm"
          )}
        >
          <div
            className={cn(
              "rounded-full bg-gradient-tropical flex items-center justify-center",
              isMobile ? "w-8 h-8" : "w-6 h-6"
            )}
          >
            <User
              className={cn("text-white", isMobile ? "h-4 w-4" : "h-3 w-3")}
            />
          </div>
          <span>Loading...</span>
        </div>
      </div>
    );
  }

  return <UserSectionContent user={user} token={token} />;
}
