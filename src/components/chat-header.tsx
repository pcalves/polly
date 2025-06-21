"use client";

import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { ConversationId } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { FileText, FileJson, Share2, MoreHorizontal } from "lucide-react";
import { ShareConversationDialog } from "@/components/ui/share-conversation-dialog";
import {
  exportAsJSON,
  exportAsMarkdown,
  downloadFile,
  generateFilename,
} from "@/lib/export";
import { toast } from "sonner";
import { useUser } from "@/hooks/use-user";

interface ChatHeaderProps {
  conversationId?: ConversationId;
}

export function ChatHeader({ conversationId }: ChatHeaderProps) {
  const { user } = useUser();

  const conversation = useQuery(
    api.conversations.getAuthorized,
    conversationId ? { id: conversationId, userId: user?._id } : "skip"
  );

  const exportData = useQuery(
    api.conversations.getForExport,
    conversationId ? { id: conversationId } : "skip"
  );

  const persona = useQuery(
    api.personas.get,
    conversation?.personaId ? { id: conversation.personaId } : "skip"
  );

  const handleExport = async (format: "json" | "md") => {
    if (!exportData || !conversation) {
      toast.error("Export failed", {
        description: "Unable to load conversation data",
      });
      return;
    }

    try {
      let content: string;
      let mimeType: string;

      if (format === "json") {
        content = exportAsJSON(exportData);
        mimeType = "application/json";
      } else {
        content = exportAsMarkdown(exportData);
        mimeType = "text/markdown";
      }

      const filename = generateFilename(conversation.title, format);
      downloadFile(content, filename, mimeType);

      toast.success("Export successful", {
        description: `Conversation exported as ${filename}`,
      });
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Export failed", {
        description: "An error occurred while exporting the conversation",
      });
    }
  };

  // For chat pages, show full header with conversation title
  return (
    <div className="flex items-center justify-between w-full">
      <div className="flex items-center gap-2">
        {conversation?.title ? (
          <h1 className="text-sm font-medium text-foreground">
            {conversation.title}
          </h1>
        ) : (
          <div className="h-5" />
        )}
        {persona && (
          <Badge variant="secondary" className="text-xs gap-1">
            <span>{persona.icon || "🤖"}</span>
            {persona.name}
          </Badge>
        )}
      </div>

      {conversationId && (
        <div className="flex items-center gap-2">
          {/* Share button */}
          <ShareConversationDialog conversationId={conversationId}>
            <Button variant="ghost" size="sm" className="h-8 gap-2">
              <Share2 className="h-4 w-4" />
              <span className="hidden sm:inline">Share</span>
              <span className="sr-only">Share conversation</span>
            </Button>
          </ShareConversationDialog>

          {/* Export dropdown */}
          {exportData && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreHorizontal className="h-4 w-4" />
                  <span className="sr-only">More options</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleExport("md")}>
                  <FileText className="mr-2 h-4 w-4" />
                  Export as Markdown
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport("json")}>
                  <FileJson className="mr-2 h-4 w-4" />
                  Export as JSON
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      )}
    </div>
  );
}
