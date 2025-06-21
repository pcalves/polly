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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Trash2, Edit, MoreVertical } from "lucide-react";
import { cn } from "@/lib/utils";
import { ConversationId, Conversation } from "@/types";
import { useState, useEffect, useRef, useCallback } from "react";
import { useConfirmationDialog } from "@/hooks/use-confirmation-dialog";
import { conversationErrorHandlers } from "@/hooks/use-conversations";
import { useSidebar } from "@/hooks/use-sidebar";

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
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const editInputRef = useRef<HTMLInputElement>(null);
  const confirmationDialog = useConfirmationDialog();
  const deleteConversation = useMutation(api.conversations.remove);
  const updateConversationTitle = useMutation(api.conversations.update);
  const { isMobile, setSidebarVisible } = useSidebar();

  useEffect(() => {
    if (editingId && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [editingId]);

  const handleEditStart = useCallback(
    (id: ConversationId, currentTitle: string, e?: React.MouseEvent) => {
      if (e) e.stopPropagation();
      setEditingId(id);
      setEditingTitle(currentTitle);
      setOriginalTitle(currentTitle);
      setIsPopoverOpen(false);
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
    (e?: React.MouseEvent) => {
      if (e) {
        e.stopPropagation();
        e.preventDefault();
      }
      setIsPopoverOpen(false);
      confirmationDialog.confirm(
        {
          title: "Delete Conversation",
          description: `Are you sure you want to delete "${conversation.title}"? This action cannot be undone.`,
          confirmText: "Delete",
          cancelText: "Cancel",
          variant: "destructive",
        },
        async () => {
          const isCurrentConversation =
            currentConversationId === conversation._id;

          if (isCurrentConversation) {
            window.location.href = "/";
            return;
          }

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
    ]
  );

  const handleConversationClick = useCallback(() => {
    if (isMobile) {
      setSidebarVisible(false);
    }
  }, [isMobile, setSidebarVisible]);

  return (
    <>
      <div
        className={cn(
          "group relative flex items-center rounded-lg transition-all duration-200 font-medium overflow-hidden touch-manipulation",
          currentConversationId === conversation._id
            ? "active-element-enhanced text-foreground shadow-sm"
            : "hover:bg-background/60 text-muted-foreground hover:text-foreground hover:shadow-sm hover:border hover:border-border/30",
          isMobile ? "h-12 mx-2" : "h-8 mx-3"
        )}
        onMouseEnter={() => !isMobile && setIsHovered(true)}
        onMouseLeave={() => !isMobile && setIsHovered(false)}
      >
        <Link
          href={`/chat/${conversation._id}`}
          className={cn(
            "flex-1 flex items-center min-w-0 no-underline text-inherit",
            isMobile ? "px-4 py-2 text-sm" : "px-4 py-1 text-xs"
          )}
          onClick={handleConversationClick}
        >
          <div className={cn("flex-1 min-w-0", isMobile ? "pr-3" : "pr-2")}>
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
                className={cn(
                  "border-0 bg-transparent focus:bg-background focus:border-border rounded-sm",
                  isMobile ? "h-8 px-2 py-1 text-sm" : "h-6 px-1 py-0 text-sm"
                )}
                onClick={e => {
                  e.stopPropagation();
                  e.preventDefault();
                }}
              />
            ) : (
              <div
                className={cn(
                  "truncate transition-all duration-200 font-medium",
                  isMobile && "leading-5"
                )}
              >
                {conversation.title}
              </div>
            )}
          </div>

          {conversation.isStreaming && (!isHovered || isMobile) && (
            <div className="flex items-center mr-1">
              <Spinner size="sm" className="text-muted-foreground" />
            </div>
          )}
        </Link>

        {!conversation.isStreaming && editingId !== conversation._id && (
          <>
            {isMobile ? (
              <div className="flex-shrink-0 pr-2">
                <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-9 w-9 p-0 hover:bg-background/80 transition-all duration-200 touch-manipulation"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent
                    className="w-40 p-2"
                    align="end"
                    onClick={e => e.stopPropagation()}
                  >
                    <div className="flex flex-col gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="justify-start h-9 px-3 gap-2 hover:bg-muted/50"
                        onClick={() =>
                          handleEditStart(conversation._id, conversation.title)
                        }
                      >
                        <Edit className="h-4 w-4" />
                        Edit title
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="justify-start h-9 px-3 gap-2 hover:bg-destructive/10 hover:text-destructive"
                        onClick={() => handleDeleteClick()}
                      >
                        <Trash2 className="h-4 w-4" />
                        Delete
                      </Button>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            ) : (
              isHovered && (
                <div className="flex items-center gap-0.5 flex-shrink-0 pr-2">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 hover:bg-background/80 hover:scale-110 transition-all duration-200"
                        onClick={e => {
                          e.preventDefault();
                          handleEditStart(
                            conversation._id,
                            conversation.title,
                            e
                          );
                        }}
                      >
                        <Edit className="h-3.5 w-3.5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Edit title</p>
                    </TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 hover:bg-destructive/10 hover:text-destructive hover:scale-110 transition-all duration-200"
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
              )
            )}
          </>
        )}
      </div>
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
