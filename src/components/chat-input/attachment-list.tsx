"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { Attachment } from "@/types";
import { cn } from "@/lib/utils";
import { ConvexImageThumbnail } from "@/components/convex-file-display";
import { FileUploadProgress } from "@/hooks/use-convex-file-upload";

interface AttachmentListProps {
  attachments: Attachment[];
  uploadProgress: Map<string, FileUploadProgress>;
  onRemoveAttachment: (index: number) => void;
  onPreviewFile: (attachment: Attachment) => void;
  canChat: boolean;
}

export function AttachmentList({
  attachments,
  uploadProgress,
  onRemoveAttachment,
  onPreviewFile,
  canChat,
}: AttachmentListProps) {
  if (attachments.length === 0 && uploadProgress.size === 0) {
    return null;
  }

  return (
    <div className="mb-3">
      <div className="flex flex-wrap gap-2">
        {/* Show upload progress for files being uploaded */}
        {Array.from(uploadProgress.values()).map((progress, index) => (
          <div
            key={`upload-${index}`}
            className="flex items-center gap-2 rounded-lg bg-muted/60 backdrop-blur-sm px-2.5 py-1.5 text-xs group border border-border/20 shadow-sm"
          >
            <div className="w-6 h-6 rounded flex-shrink-0 bg-muted/30 flex items-center justify-center">
              <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin opacity-60" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="max-w-[100px] truncate font-medium text-foreground">
                {progress.file.name}
              </div>
              <div className="text-xs text-muted-foreground">
                {progress.status === "uploading" && "Uploading..."}
                {progress.status === "processing" && "Processing..."}
                {progress.status === "pending" && "Preparing..."}
                {progress.progress > 0 && ` ${progress.progress}%`}
              </div>
            </div>
          </div>
        ))}

        {/* Show uploaded attachments */}
        {attachments.map((attachment, index) => (
          <div
            key={index}
            className="flex items-center gap-2 rounded-lg bg-muted/60 backdrop-blur-sm px-2.5 py-1.5 text-xs group border border-border/20 shadow-sm hover:bg-muted/80 transition-all duration-200"
          >
            <button
              type="button"
              onClick={() =>
                attachment.type === "image" && onPreviewFile(attachment)
              }
              className={cn(
                "flex items-center gap-2 flex-1 min-w-0",
                attachment.type === "image" && "cursor-pointer hover:opacity-75"
              )}
              disabled={attachment.type !== "image"}
            >
              <ConvexImageThumbnail
                attachment={attachment}
                onClick={() =>
                  attachment.type === "image" && onPreviewFile(attachment)
                }
              />
              <span className="max-w-[120px] truncate font-medium text-foreground">
                {attachment.name}
              </span>
            </button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onRemoveAttachment(index)}
              className="h-4 w-4 p-0 opacity-60 group-hover:opacity-100 hover:text-destructive transition-all duration-200"
              disabled={!canChat}
            >
              <X className="h-2.5 w-2.5" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
