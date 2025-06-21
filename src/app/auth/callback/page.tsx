"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { removeAnonymousUserIdCookie } from "@/lib/cookies";
import { api } from "../../../../convex/_generated/api";
import Image from "next/image";

export default function AuthCallbackPage() {
  const router = useRouter();
  const authenticatedUser = useQuery(api.users.getCurrentUser);
  const [status, setStatus] = useState<"processing" | "success">("processing");

  useEffect(() => {
    if (authenticatedUser) {
      // User is now authenticated - clean up anonymous state and redirect
      removeAnonymousUserIdCookie();

      // Remove from localStorage as well
      if (typeof window !== "undefined") {
        localStorage.removeItem("anonymous-user-id");
      }

      // Dispatch event to notify other components
      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("user-graduated", {
            detail: { userId: authenticatedUser._id },
          })
        );
      }

      setStatus("success");
      setTimeout(() => router.push("/"), 2000);
    }
  }, [authenticatedUser, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="max-w-md w-full space-y-8 p-8 text-center">
        <div className="flex justify-center mb-6">
          <Image
            src="/polly-mascot.png"
            alt="Polly mascot"
            width={96}
            height={96}
            className="h-24 w-24"
          />
        </div>

        <div className="space-y-4">
          {status === "processing" && (
            <>
              <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
              <h2 className="text-xl font-semibold text-foreground">
                Setting up your account...
              </h2>
              <p className="text-muted-foreground">
                Preserving your conversations and settings
              </p>
            </>
          )}

          {status === "success" && (
            <>
              <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center mx-auto">
                <svg
                  className="w-5 h-5 text-green-600 dark:text-green-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-foreground">
                Welcome to Polly!
              </h2>
              <p className="text-green-600 dark:text-green-400">
                Your conversations and settings have been preserved!
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
