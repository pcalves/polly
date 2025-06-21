"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Share2,
  Copy,
  Check,
  ExternalLink,
  RefreshCw,
  X,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { ConversationId } from "@/types";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ShareConversationDialogProps {
  conversationId: ConversationId;
  children: React.ReactNode;
}

export function ShareConversationDialog({
  conversationId,
  children,
}: ShareConversationDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isUnsharing, setIsUnsharing] = useState(false);
  const [shareUrl, setShareUrl] = useState("");
  const [isCopied, setIsCopied] = useState(false);

  // Get current sharing status
  const sharedStatus = useQuery(api.sharedConversations.getSharedStatus, {
    conversationId,
  });

  // Mutations
  const shareConversation = useMutation(
    api.sharedConversations.shareConversation
  );
  const updateSharedConversation = useMutation(
    api.sharedConversations.updateSharedConversation
  );
  const unshareConversation = useMutation(
    api.sharedConversations.unshareConversation
  );

  // Generate share URL
  const generateShareUrl = (shareId: string) => {
    return `${window.location.origin}/share/${shareId}`;
  };

  // Handle share conversation
  const handleShare = async () => {
    setIsSharing(true);
    try {
      const shareId = await shareConversation({ conversationId });
      const url = generateShareUrl(shareId);
      setShareUrl(url);
      toast.success("Conversation shared successfully!");
    } catch (error) {
      toast.error("Failed to share conversation");
      console.error("Share error:", error);
    } finally {
      setIsSharing(false);
    }
  };

  // Handle update shared conversation
  const handleUpdate = async () => {
    setIsUpdating(true);
    try {
      const shareId = await updateSharedConversation({ conversationId });
      const url = generateShareUrl(shareId);
      setShareUrl(url);
      toast.success("Shared conversation updated!");
    } catch (error) {
      toast.error("Failed to update shared conversation");
      console.error("Update error:", error);
    } finally {
      setIsUpdating(false);
    }
  };

  // Handle unshare conversation
  const handleUnshare = async () => {
    setIsUnsharing(true);
    try {
      await unshareConversation({ conversationId });
      setShareUrl("");
      toast.success("Conversation unshared");
    } catch (error) {
      toast.error("Failed to unshare conversation");
      console.error("Unshare error:", error);
    } finally {
      setIsUnsharing(false);
    }
  };

  // Handle copy URL
  const handleCopyUrl = async () => {
    if (!shareUrl && sharedStatus?.shareId) {
      const url = generateShareUrl(sharedStatus.shareId);
      setShareUrl(url);
      await navigator.clipboard.writeText(url);
    } else {
      await navigator.clipboard.writeText(shareUrl);
    }

    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
    toast.success("Link copied to clipboard");
  };

  // Handle open in new tab
  const handleOpenInNewTab = () => {
    const url =
      shareUrl ||
      (sharedStatus?.shareId ? generateShareUrl(sharedStatus.shareId) : "");
    if (url) {
      window.open(url, "_blank", "noopener,noreferrer");
    }
  };

  const isShared = !!sharedStatus?.shareId;
  const hasNewMessages = sharedStatus?.hasNewMessages ?? false;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader className="text-center">
          <DialogTitle className="text-xl font-semibold">
            {isShared ? "Conversation is shared" : "Share conversation"}
          </DialogTitle>
          <DialogDescription className="text-base">
            {isShared
              ? `This conversation is publicly accessible. Shared ${formatDistanceToNow(new Date(sharedStatus.sharedAt), { addSuffix: true })}.`
              : "Share this conversation with others. They'll see the conversation as it appears when you share or update it."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {isShared ? (
            <div className="space-y-6">
              {/* Share URL section */}
              <div className="space-y-3">
                <div className="relative">
                  <Input
                    id="share-url"
                    value={shareUrl || generateShareUrl(sharedStatus.shareId)}
                    readOnly
                    className="pr-20 font-mono text-sm h-12 flex items-center"
                  />
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex">
                    <TooltipProvider>
                      <Tooltip delayDuration={200}>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleCopyUrl}
                            className={cn(
                              "h-8 w-8 p-0 transition-colors",
                              isCopied && "text-emerald-600"
                            )}
                            disabled={isCopied}
                          >
                            {isCopied ? (
                              <Check className="h-4 w-4" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="bottom" className="px-2 py-1">
                          <p className="text-xs">
                            {isCopied ? "Copied!" : "Copy link"}
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    <TooltipProvider>
                      <Tooltip delayDuration={200}>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleOpenInNewTab}
                            className="h-8 w-8 p-0"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="bottom" className="px-2 py-1">
                          <p className="text-xs">Open in new tab</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </div>
              </div>

              {/* New messages alert */}
              {hasNewMessages && (
                <div className="rounded-lg border border-amber-200 bg-gradient-to-r from-amber-50 to-yellow-50 p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-100">
                      <AlertTriangle className="h-3 w-3 text-amber-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-amber-800 mb-1">
                        {sharedStatus.currentMessageCount -
                          sharedStatus.sharedMessageCount}{" "}
                        new messages since last update
                      </p>
                      <p className="text-xs text-amber-700">
                        Update your share to include the latest messages in the
                        public link.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Action buttons */}
              <div className="flex gap-3">
                <Button
                  onClick={handleUpdate}
                  disabled={isUpdating || !hasNewMessages}
                  variant="outline"
                  className="flex-1 h-10"
                >
                  {isUpdating ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4 mr-2" />
                  )}
                  Update share
                </Button>
                <Button
                  onClick={handleUnshare}
                  disabled={isUnsharing}
                  variant="outline"
                  className="flex-1 h-10"
                >
                  {isUnsharing ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <X className="h-4 w-4 mr-2" />
                  )}
                  Stop sharing
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <Button
                onClick={handleShare}
                disabled={isSharing}
                className="w-full h-11 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"
              >
                {isSharing ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Creating share link...
                  </>
                ) : (
                  <>
                    <Share2 className="h-4 w-4 mr-2" />
                    Create share link
                  </>
                )}
              </Button>

              <div className="text-center">
                <p className="text-xs text-muted-foreground">
                  Anyone with the link will be able to view this conversation
                </p>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
