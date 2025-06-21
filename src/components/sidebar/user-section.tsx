"use client";

import { User, LogOut, LogIn } from "lucide-react";
import { useAuthActions, useAuthToken } from "@convex-dev/auth/react";
import { useQuery, usePreloadedQuery } from "convex/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { api } from "../../../convex/_generated/api";
import { useUserContext } from "@/providers/user-provider";
import { Preloaded } from "convex/react";
import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";

interface UserSectionContentProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  user: any; // Type comes from getCurrentUser or getById queries - can be different shapes
  token: string | null | undefined;
  authActions: ReturnType<typeof useAuthActions>;
  router: AppRouterInstance;
}

function UserSectionContent({
  user,
  token,
  authActions,
  router,
}: UserSectionContentProps) {
  const handleSignOut = async () => {
    if (authActions?.signOut) {
      await authActions.signOut();
    }
  };

  const handleSignIn = () => {
    router.push("/auth");
  };

  // Show sign in button if not authenticated
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

  // Show user dropdown if authenticated
  return (
    <div className="p-6 flex-shrink-0">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 text-sm text-muted-foreground hover:text-foreground"
          >
            {user.image ? (
              <img
                src={user.image}
                alt={user.name || "User avatar"}
                className="w-6 h-6 rounded-full object-cover"
                onError={e => {
                  // Fallback to gradient avatar if image fails to load
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
            {/* Fallback avatar (hidden by default when image is present) */}
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

function UserSectionWithPreloaded({
  preloadedUser,
}: {
  preloadedUser:
    | Preloaded<typeof api.users.getCurrentUser>
    | Preloaded<typeof api.users.getById>;
}) {
  const router = useRouter();
  const token = useAuthToken();
  const authActions = useAuthActions();
  const user = usePreloadedQuery(preloadedUser);

  return (
    <UserSectionContent
      user={user}
      token={token}
      authActions={authActions}
      router={router}
    />
  );
}

function UserSectionWithQuery() {
  const router = useRouter();
  const token = useAuthToken();
  const authActions = useAuthActions();
  const user = useQuery(api.users.getCurrentUser);

  // Show loading state only if queries are undefined
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

export function UserSection() {
  const userContext = useUserContext();

  // Use preloaded data if available, otherwise fall back to regular queries
  if (userContext.preloadedUser) {
    return (
      <UserSectionWithPreloaded preloadedUser={userContext.preloadedUser} />
    );
  } else {
    return <UserSectionWithQuery />;
  }
}
