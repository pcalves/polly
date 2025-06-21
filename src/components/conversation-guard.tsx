"use client";

import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useUser } from "@/hooks/use-user";
import { ConversationId } from "@/types";
import { useRouter } from "next/navigation";
import { useEffect, ReactNode } from "react";
import { Doc } from "../../convex/_generated/dataModel";

interface ConversationGuardProps {
  conversationId: ConversationId;
  children: (conversation: Doc<"conversations">) => ReactNode;
}

export function ConversationGuard({
  conversationId,
  children,
}: ConversationGuardProps) {
  const { user, isLoading: userLoading } = useUser();
  const router = useRouter();

  // Use the authorized query to check if user can access this conversation
  // Pass the current user ID (anonymous or authenticated) for proper authorization
  const conversation = useQuery(api.conversations.getAuthorized, {
    id: conversationId,
    userId: user?._id,
  });

  // Check for authorization after user data and conversation data are loaded
  useEffect(() => {
    // Wait for user loading to complete
    if (userLoading) return;

    // If conversation query has resolved and returned null, redirect to 404
    // This handles both invalid IDs and unauthorized access
    if (conversation === null) {
      router.replace("/chat/not-found");
    }
  }, [conversation, userLoading, router]);

  // Show loading while we determine authorization
  if (userLoading || conversation === undefined) {
    return <div className="h-full" />;
  }

  // If conversation is null, we're redirecting, so don't render anything
  if (conversation === null) {
    return null;
  }

  // At this point we have a valid, authorized conversation
  return <>{children(conversation)}</>;
}
