"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useUserGraduation } from "@/hooks/use-user-graduation";
import { getAnonymousUserIdFromCookie } from "@/lib/cookies";
import Image from "next/image";

export default function AuthCallbackPage() {
  const router = useRouter();
  const { handleUserGraduation } = useUserGraduation();
  const [status, setStatus] = useState<"processing" | "success" | "error">(
    "processing"
  );
  const [message, setMessage] = useState<string>("");

  useEffect(() => {
    const handleGraduation = async () => {
      try {
        const anonymousUserId = getAnonymousUserIdFromCookie();

        if (!anonymousUserId) {
          // No anonymous user to graduate, just redirect
          setStatus("success");
          setMessage("Welcome! Redirecting...");
          setTimeout(() => router.push("/"), 1500);
          return;
        }

        // Attempt graduation
        const result = await handleUserGraduation();

        if (result.graduated) {
          setStatus("success");
          setMessage("Your conversations and settings have been preserved!");
        } else {
          setStatus("success");
          setMessage("Welcome! Redirecting...");
        }

        // Redirect after showing the message
        setTimeout(() => router.push("/"), 2000);
      } catch (error) {
        console.error("Graduation failed:", error);
        setStatus("error");
        setMessage(
          "There was an issue preserving your data, but you're signed in. Redirecting..."
        );

        // Still redirect even if graduation fails
        setTimeout(() => router.push("/"), 3000);
      }
    };

    // Small delay to ensure auth session is established
    const timer = setTimeout(() => {
      handleGraduation();
    }, 500);

    return () => clearTimeout(timer);
  }, [handleUserGraduation, router]);

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
              <p className="text-green-600 dark:text-green-400">{message}</p>
            </>
          )}

          {status === "error" && (
            <>
              <div className="w-8 h-8 rounded-full bg-orange-100 dark:bg-orange-900 flex items-center justify-center mx-auto">
                <svg
                  className="w-5 h-5 text-orange-600 dark:text-orange-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                  />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-foreground">
                Almost ready!
              </h2>
              <p className="text-orange-600 dark:text-orange-400">{message}</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
