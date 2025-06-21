"use client";

import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { notFound } from "next/navigation";
import { ChatMessage } from "@/components/chat-message";
import { Button } from "@/components/ui/button";
import { Share2, ExternalLink } from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { ChatMessage as ChatMessageType } from "@/types";
import { use } from "react";

interface SharePageProps {
  params: Promise<{
    shareId: string;
  }>;
}

export default function SharePage({ params }: SharePageProps) {
  const { shareId } = use(params);

  const sharedConversation = useQuery(
    api.sharedConversations.getSharedConversation,
    {
      shareId,
    }
  );

  if (sharedConversation === undefined) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-4xl mx-auto p-6">
          <div className="flex items-center justify-center h-64">
            <div className="text-center space-y-3">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="text-sm text-muted-foreground">
                Loading shared conversation...
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (sharedConversation === null) {
    notFound();
  }

  const { conversation, messages, sharedAt, lastUpdated } = sharedConversation;

  // Transform Convex messages to ChatMessage format (attachments already stripped for privacy)
  const transformedMessages: ChatMessageType[] = messages.map(msg => ({
    id: msg._id,
    role: msg.role,
    content: msg.content,
    reasoning: msg.reasoning,
    model: msg.model,
    provider: msg.provider,
    parentId: msg.parentId,
    isMainBranch: msg.isMainBranch,
    sourceConversationId: msg.sourceConversationId,
    useWebSearch: msg.useWebSearch,
    attachments: undefined, // Explicitly omit attachments for privacy
    citations: msg.citations,
    metadata: msg.metadata,
    createdAt: msg.createdAt,
  }));

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Share2 className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    Shared conversation
                  </span>
                </div>
                <h1 className="text-lg font-semibold">{conversation.title}</h1>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span>
                    Shared{" "}
                    {formatDistanceToNow(new Date(sharedAt), {
                      addSuffix: true,
                    })}
                  </span>
                  {lastUpdated !== sharedAt && (
                    <span>
                      Updated{" "}
                      {formatDistanceToNow(new Date(lastUpdated), {
                        addSuffix: true,
                      })}
                    </span>
                  )}
                  <span>
                    {messages.length} message{messages.length !== 1 ? "s" : ""}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    navigator.clipboard.writeText(window.location.href);
                  }}
                  className="gap-2"
                >
                  <Share2 className="h-4 w-4" />
                  Copy link
                </Button>
                <Button asChild size="sm" className="gap-2">
                  <Link href="/">
                    <ExternalLink className="h-4 w-4" />
                    Try it yourself
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="p-6 space-y-6">
          {messages.length === 0 ? (
            <div className="flex items-center justify-center py-20">
              <div className="text-center space-y-3">
                <div className="text-4xl opacity-20">💬</div>
                <p className="text-muted-foreground">
                  This shared conversation has no messages.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {transformedMessages.map(message => (
                <ChatMessage key={message.id} message={message} />
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-border bg-muted/20">
          <div className="p-6">
            <div className="text-center space-y-2">
              <p className="text-sm text-muted-foreground">
                This is a shared conversation from Polly AI. Messages sent after
                sharing are not included.
              </p>
              <Button asChild variant="outline" size="sm">
                <Link href="/">Start your own conversation</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
