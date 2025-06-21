"use client";

import React from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { Attachment } from "@/types";
import Image from "next/image";
import { Paperclip } from "lucide-react";

interface ConvexFileDisplayProps {
  attachment: Attachment;
  className?: string;
  onClick?: () => void;
}

export function ConvexFileDisplay({
  attachment,
  className = "",
  onClick,
}: ConvexFileDisplayProps) {
  // If we have a storageId, get the URL from Convex
  const convexFileUrl = useQuery(
    api.fileStorage.getFileUrl,
    attachment.storageId
      ? { storageId: attachment.storageId as Id<"_storage"> }
      : "skip"
  );

  // Determine the actual URL to use
  const fileUrl = attachment.storageId ? convexFileUrl : attachment.url;

  // Show loading state for Convex files
  if (attachment.storageId && convexFileUrl === undefined) {
    return (
      <div
        className={`flex items-center justify-center bg-muted/20 ${className}`}
      >
        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin opacity-60" />
      </div>
    );
  }

  // Show error state if Convex file URL failed to load
  if (attachment.storageId && convexFileUrl === null) {
    return (
      <div
        className={`flex items-center justify-center bg-muted/20 ${className}`}
      >
        <div className="text-xs text-muted-foreground">Failed to load</div>
      </div>
    );
  }

  if (attachment.type === "image" && fileUrl) {
    return (
      <div
        className={`rounded-xl overflow-hidden border border-border/20 shadow-sm ${className}`}
      >
        <Image
          src={fileUrl}
          alt={attachment.name}
          width={400}
          height={300}
          className="w-full h-auto object-cover max-w-sm cursor-pointer"
          style={{ maxHeight: "300px" }}
          unoptimized
          onClick={onClick}
        />
      </div>
    );
  }

  // For non-image files, show a file icon with name
  return (
    <div
      className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm bg-muted/40 text-foreground transition-transform duration-200 hover:scale-105 cursor-pointer ${className}`}
      onClick={onClick}
    >
      <span>{attachment.type === "pdf" ? "📄" : "📝"}</span>
      <span>{attachment.name}</span>
      {attachment.storageId && (
        <span className="text-xs text-muted-foreground bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full">
          Stored
        </span>
      )}
    </div>
  );
}

/**
 * Component specifically for displaying image thumbnails in chat input
 */
interface ConvexImageThumbnailProps {
  attachment: Attachment;
  className?: string;
  onClick?: () => void;
}

export function ConvexImageThumbnail({
  attachment,
  className = "",
  onClick,
}: ConvexImageThumbnailProps) {
  // If we have a storageId, get the URL from Convex
  const convexFileUrl = useQuery(
    api.fileStorage.getFileUrl,
    attachment.storageId
      ? { storageId: attachment.storageId as Id<"_storage"> }
      : "skip"
  );

  // For thumbnails, prefer local thumbnail if available, then Convex URL, then fallback URL
  const thumbnailUrl =
    attachment.thumbnail ||
    (attachment.storageId ? convexFileUrl : attachment.url);

  if (attachment.storageId && !thumbnailUrl) {
    return (
      <div
        className={`w-6 h-6 rounded flex-shrink-0 bg-muted/30 flex items-center justify-center ${className}`}
      >
        <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin opacity-60" />
      </div>
    );
  }

  if (attachment.type === "image" && thumbnailUrl) {
    return (
      <div
        className={`w-6 h-6 rounded overflow-hidden flex-shrink-0 bg-muted/30 cursor-pointer ${className}`}
        title={attachment.name}
        onClick={onClick}
      >
        <Image
          src={thumbnailUrl}
          alt={attachment.name}
          width={24}
          height={24}
          className="w-full h-full object-cover"
          unoptimized
        />
      </div>
    );
  }

  return (
    <div
      className={`w-6 h-6 rounded flex-shrink-0 bg-muted/30 flex items-center justify-center ${className}`}
      title={attachment.name}
    >
      <Paperclip className="h-3 w-3" />
    </div>
  );
}
