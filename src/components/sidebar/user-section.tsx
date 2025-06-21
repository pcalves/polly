"use client";

import { User, LogOut, LogIn } from "lucide-react";
import { useAuthActions, useAuthToken } from "@convex-dev/auth/react";
import { useQuery } from "convex/react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { api } from "../../../convex/_generated/api";
import Image from "next/image";

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
  authActions: ReturnType<typeof useAuthActions>;
  router: ReturnType<typeof useRouter>;
}

function UserSectionContent({
  user,
  token,
  authActions,
  router,
}: UserSectionContentProps) {
  const queryClient = useQueryClient();

  const handleSignOut = async () => {
    if (authActions?.signOut) {
      queryClient.clear();
      await authActions.signOut();
    }
  };

  const handleSignIn = () => {
    router.push("/auth");
  };

  if (!token || !user) {
    return (
      <div className="p-6 flex-shrink-0">
        <Button
          onClick={handleSignIn}
          variant="ghost"
          className="w-full flex items-center justify-start gap-3 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
        >
          <LogIn className="h-4 w-4" />
          Sign In
        </Button>
      </div>
    );
  }

  return (
    <div className="p-6 flex-shrink-0">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 text-sm text-muted-foreground hover:text-foreground"
          >
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
            <span className="truncate">
              {user.name || user.email || "User"}
            </span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-56">
          <DropdownMenuItem onClick={handleSignOut}>
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

export function UserSection() {
  const router = useRouter();
  const token = useAuthToken();
  const authActions = useAuthActions();
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

  return (
    <UserSectionContent
      user={user}
      token={token}
      authActions={authActions}
      router={router}
    />
  );
}
