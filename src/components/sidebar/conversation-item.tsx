"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { Spinner } from "@/components/spinner";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Trash2, Edit } from "lucide-react";
import { cn } from "@/lib/utils";
import { ConversationId, Conversation } from "@/types";
import { useState, useEffect, useRef, useCallback } from "react";
import { useConfirmationDialog } from "@/hooks/use-confirmation-dialog";
import { conversationErrorHandlers } from "@/hooks/use-conversations";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "../../../convex/_generated/api";
import { useMutation } from "convex/react";

interface ConversationItemProps {
  conversation: Conversation;
  currentConversationId?: ConversationId;
}

export function ConversationItem({
  conversation,
  currentConversationId,
}: ConversationItemProps) {
  const [editingId, setEditingId] = useState<ConversationId | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [originalTitle, setOriginalTitle] = useState("");
  const [isHovered, setIsHovered] = useState(false);
  const editInputRef = useRef<HTMLInputElement>(null);
  const confirmationDialog = useConfirmationDialog();
  const deleteConversation = useMutation(api.conversations.remove);
  const router = useRouter();
  const updateConversationTitle = useMutation(api.conversations.update);

  useEffect(() => {
    if (editingId && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [editingId]);

  const handleEditStart = useCallback(
    (id: ConversationId, currentTitle: string, e: React.MouseEvent) => {
      e.stopPropagation();
      setEditingId(id);
      setEditingTitle(currentTitle);
      setOriginalTitle(currentTitle);
    },
    []
  );

  const handleEditCancel = useCallback(() => {
    setEditingId(null);
    setEditingTitle("");
    setOriginalTitle("");
  }, []);

  const handleEditConfirm = useCallback(
    async (id: ConversationId) => {
      if (editingTitle.trim() && editingTitle !== originalTitle) {
        await updateConversationTitle({
          id,
          title: editingTitle.trim(),
        });
      }
      handleEditCancel();
    },
    [editingTitle, originalTitle, updateConversationTitle, handleEditCancel]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent, id: ConversationId) => {
      if (e.key === "Enter") {
        handleEditConfirm(id);
      } else if (e.key === "Escape") {
        handleEditCancel();
      }
    },
    [handleEditConfirm, handleEditCancel]
  );

  const handleBlur = useCallback(() => {
    if (editingId && editingTitle !== originalTitle) {
      handleEditConfirm(editingId);
    } else {
      handleEditCancel();
    }
  }, [
    editingId,
    editingTitle,
    originalTitle,
    handleEditConfirm,
    handleEditCancel,
  ]);

  const handleDeleteClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();
      confirmationDialog.confirm(
        {
          title: "Delete Conversation",
          description: `Are you sure you want to delete "${conversation.title}"? This action cannot be undone.`,
          confirmText: "Delete",
          cancelText: "Cancel",
          variant: "destructive",
        },
        async () => {
          // Check if we're currently viewing this conversation
          const isCurrentConversation =
            currentConversationId === conversation._id;

          // If viewing current conversation, navigate away first
          if (isCurrentConversation) {
            // Force navigation to home using window.location for reliability
            window.location.href = "/";
            // Don't proceed with deletion - let the page reload handle it
            return;
          }

          // Otherwise, just delete the conversation normally
          await conversationErrorHandlers.handleDelete(async () => {
            await deleteConversation({ id: conversation._id });
          });
        }
      );
    },
    [
      confirmationDialog,
      conversation.title,
      conversation._id,
      deleteConversation,
      currentConversationId,
      router,
    ]
  );

  return (
    <>
      <Link
        href={`/chat/${conversation._id}`}
        className={cn(
          "h-8 group relative flex items-center px-4 py-1 mx-3 rounded-lg transition-all duration-200 text-xs font-medium overflow-hidden no-underline",
          currentConversationId === conversation._id
            ? "active-element-enhanced text-foreground shadow-sm"
            : "hover:bg-muted/50 text-muted-foreground hover:text-foreground hover:shadow-sm"
        )}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="flex-1 min-w-0 pr-2">
          {editingId === conversation._id ? (
            <Input
              ref={editInputRef}
              value={editingTitle}
              onChange={e => setEditingTitle(e.target.value)}
              onKeyDown={e => handleKeyDown(e, conversation._id)}
              onBlur={handleBlur}
              onMouseDown={e => {
                e.stopPropagation();
              }}
              className="h-6 px-1 py-0 text-sm border-0 bg-transparent focus:bg-background focus:border-border rounded-sm"
              onClick={e => {
                e.stopPropagation();
                e.preventDefault();
              }}
            />
          ) : (
            <div className="truncate transition-all duration-200 font-medium">
              {conversation.title}
            </div>
          )}
        </div>

        {conversation.isStreaming && !isHovered && (
          <div className="flex items-center mr-1">
            <Spinner size="sm" className="text-muted-foreground" />
          </div>
        )}

        {isHovered && editingId !== conversation._id && (
          <div className="flex items-center gap-0.5">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0 hover:bg-background/80 hover:scale-110 transition-all duration-200"
                  onClick={e => {
                    e.preventDefault();
                    handleEditStart(conversation._id, conversation.title, e);
                  }}
                >
                  <Edit className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Edit conversation title</p>
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0 hover:bg-background/80 hover:scale-110 transition-all duration-200"
                  onClick={handleDeleteClick}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Delete conversation</p>
              </TooltipContent>
            </Tooltip>
          </div>
        )}
      </Link>

      <ConfirmationDialog
        open={confirmationDialog.isOpen}
        onOpenChange={confirmationDialog.handleOpenChange}
        title={confirmationDialog.options.title}
        description={confirmationDialog.options.description}
        confirmText={confirmationDialog.options.confirmText}
        cancelText={confirmationDialog.options.cancelText}
        variant={confirmationDialog.options.variant}
        onConfirm={confirmationDialog.handleConfirm}
        onCancel={confirmationDialog.handleCancel}
      />
    </>
  );
}
