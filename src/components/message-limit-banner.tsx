"use client";

import { useState } from "react";
import { useUser } from "@/hooks/use-user";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { LoginDialog } from "@/components/auth/login-dialog";

export function MessageLimitBanner() {
  const { remainingMessages, hasMessageLimit, canSendMessage } = useUser();
  const [showLoginDialog, setShowLoginDialog] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  if (!hasMessageLimit || dismissed || remainingMessages > 3) {
    return null;
  }

  return (
    <>
      <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3 mx-4 mb-4 flex items-center justify-between">
        <div className="text-sm text-amber-800 dark:text-amber-200">
          {canSendMessage ? (
            <>
              You only have <strong>{remainingMessages} messages left</strong>.{" "}
              <Button
                variant="link"
                className="p-0 h-auto text-amber-800 dark:text-amber-200 underline"
                onClick={() => setShowLoginDialog(true)}
              >
                Sign in to reset your limits
              </Button>
            </>
          ) : (
            <>
              You&apos;ve reached your message limit.{" "}
              <Button
                variant="link"
                className="p-0 h-auto text-amber-800 dark:text-amber-200 underline"
                onClick={() => setShowLoginDialog(true)}
              >
                Sign in to continue chatting
              </Button>
            </>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setDismissed(true)}
          className="h-auto p-1 text-amber-600 hover:text-amber-800 dark:text-amber-400 dark:hover:text-amber-200"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
      
      <LoginDialog 
        open={showLoginDialog} 
        onOpenChange={setShowLoginDialog}
      />
    </>
  );
}
