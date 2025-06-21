"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useConversations } from "@/hooks/use-conversations";
import { useUser } from "@/hooks/use-user";
import { ConversationId } from "@/types";
import { formatDate, truncateText } from "@/lib/utils";
import { 
  MessageSquare, 
  Plus, 
  Trash2,
  LogIn,
  User,
  LogOut
} from "lucide-react";
import { cn } from "@/lib/utils";
import { LoginDialog } from "@/components/auth/login-dialog";
import { useAuthActions } from "@convex-dev/auth/react";

interface SidebarProps {
  currentConversationId?: ConversationId;
  onConversationSelect: (id: ConversationId) => void;
  onNewConversation: () => void;
  isVisible: boolean;
}

export function Sidebar({ 
  currentConversationId, 
  onConversationSelect, 
  onNewConversation,
  isVisible 
}: SidebarProps) {
  const { user, isAnonymous, remainingMessages } = useUser();
  const { signOut } = useAuthActions();
  const [showLoginDialog, setShowLoginDialog] = useState(false);
  const { conversations, deleteConversationById, isLoading } = useConversations(user?._id);

  const handleDeleteConversation = async (id: ConversationId, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("Delete this conversation?")) {
      await deleteConversationById(id);
      if (currentConversationId === id) {
        onNewConversation();
      }
    }
  };

  return (
    <div className={cn(
      "bg-background border-r flex-shrink-0 overflow-hidden",
      isVisible ? "w-80 opacity-100" : "w-0 opacity-0"
    )}
    style={{
      transition: 'width 300ms ease-out, opacity 300ms ease-out'
    }}>
      <div className="flex flex-col h-full w-80">
        {/* Header */}
        <div className="p-4 border-b">
          <Button
            onClick={onNewConversation}
            className="w-full justify-start gap-2"
          >
            <Plus className="h-4 w-4" />
            New Chat
          </Button>
        </div>

        {/* User Section */}
        <div className="p-4 border-b">
          {isAnonymous ? (
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">
                {remainingMessages} messages remaining
              </div>
              <Button
                onClick={() => setShowLoginDialog(true)}
                variant="outline"
                className="w-full justify-start gap-2"
                size="sm"
              >
                <LogIn className="h-4 w-4" />
                Sign in for unlimited
              </Button>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm">
                  <User className="h-4 w-4" />
                </div>
                <div className="text-sm">
                  {user?.name || user?.email || "Signed in"}
                </div>
              </div>
              <Button
                onClick={() => signOut()}
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>

        {/* Conversations */}
        <div className="flex-1 overflow-y-auto p-2">
          {isLoading ? (
            <div className="p-4 text-center text-muted-foreground">
              Loading conversations...
            </div>
          ) : conversations.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground">
              No conversations yet
            </div>
          ) : (
            <div className="space-y-1">
              {conversations.map((conversation) => (
                <div
                  key={conversation._id}
                  className={cn(
                    "group flex items-center gap-2 p-3 rounded-lg cursor-pointer hover:bg-muted/50 transition-colors",
                    currentConversationId === conversation._id && "bg-muted"
                  )}
                  onClick={() => onConversationSelect(conversation._id)}
                >
                  <MessageSquare className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">
                      {truncateText(conversation.title, 30)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {formatDate(conversation.updatedAt)}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="opacity-0 group-hover:opacity-100 h-6 w-6 p-0"
                    onClick={(e) => handleDeleteConversation(conversation._id, e)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      
      <LoginDialog 
        open={showLoginDialog} 
        onOpenChange={setShowLoginDialog}
      />
    </div>
  );
}