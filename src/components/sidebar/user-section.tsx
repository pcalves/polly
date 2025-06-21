"use client";

import { User, LogIn } from "lucide-react";
import { useAuthToken } from "@convex-dev/auth/react";
import { useQuery } from "convex/react";
import { Button } from "@/components/ui/button";
import { api } from "../../../convex/_generated/api";
import Image from "next/image";
import Link from "next/link";

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
  if (!token || !user) {
    return (
      <Link href="/auth" className="block w-full px-4 py-6">
        <Button
          variant="ghost"
          className="w-full flex items-center justify-start gap-3 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
        >
          <LogIn className="h-4 w-4" />
          Sign In
        </Button>
      </Link>
    );
  }

  return (
    <Link href="/settings" className="block w-full px-4 py-2">
      <Button variant="ghost" className="w-full py-6 justify-start gap-3">
        {user.image ? (
          <Image
            src={user.image}
            alt={user.name || "User avatar"}
            width={24}
            height={24}
            className="w-6 h-6 rounded-full object-cover"
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
          <div className="w-6 h-6 rounded-full bg-gradient-tropical flex items-center justify-center">
            <User className="h-3 w-3 text-white" />
          </div>
        )}
        {user.image && (
          <div className="w-6 h-6 rounded-full bg-gradient-tropical items-center justify-center hidden">
            <User className="h-3 w-3 text-white" />
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

  if (token === undefined && user === undefined) {
    return (
      <div className="p-6 flex-shrink-0">
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <div className="w-6 h-6 rounded-full bg-gradient-tropical flex items-center justify-center">
            <User className="h-3 w-3 text-white" />
          </div>
          <span>Loading...</span>
        </div>
      </div>
    );
  }

  return <UserSectionContent user={user} token={token} />;
}
