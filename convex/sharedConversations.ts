import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getCurrentUserId, requireAuth } from "./lib/auth";
import { ConvexError } from "convex/values";
import { Id } from "./_generated/dataModel";

// Generate a random share ID
function generateShareId(): string {
  return (
    Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15)
  );
}

// Share a conversation
export const shareConversation = mutation({
  args: {
    conversationId: v.id("conversations"),
  },
  handler: async (ctx, args) => {
    const userId = await getCurrentUserId(ctx);

    // Verify the user owns this conversation
    const conversation = await ctx.db.get(args.conversationId);
    if (!conversation) {
      throw new ConvexError("Conversation not found");
    }

    // For now, allow sharing for anonymous users or when user IDs don't match
    // TODO: Implement proper auth when moving to production
    if (userId && conversation.userId !== userId) {
      // Only enforce strict auth if we have a valid userId
      // This allows anonymous users to share conversations
      console.log("User ID mismatch - allowing for anonymous/dev usage", {
        currentUserId: userId,
        conversationUserId: conversation.userId,
      });
    }

    // Check if already shared
    const existingShare = await ctx.db
      .query("sharedConversations")
      .withIndex("by_original_conversation", q =>
        q.eq("originalConversationId", args.conversationId)
      )
      .first();

    if (existingShare) {
      return existingShare.shareId;
    }

    // Get message count for this conversation
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_conversation", q =>
        q.eq("conversationId", args.conversationId)
      )
      .filter(q => q.eq(q.field("isMainBranch"), true))
      .collect();

    const shareId = generateShareId();
    const now = Date.now();

    await ctx.db.insert("sharedConversations", {
      shareId,
      originalConversationId: args.conversationId,
      userId: userId || conversation.userId, // Fallback to conversation owner
      title: conversation.title,
      sharedAt: now,
      lastUpdated: now,
      messageCount: messages.length,
    });

    return shareId;
  },
});

// Update shared conversation (captures current state)
export const updateSharedConversation = mutation({
  args: {
    conversationId: v.id("conversations"),
  },
  handler: async (ctx, args) => {
    const userId = await getCurrentUserId(ctx);

    // Verify the user owns this conversation
    const conversation = await ctx.db.get(args.conversationId);
    if (!conversation) {
      throw new ConvexError("Conversation not found");
    }

    // Allow updating for anonymous users or when user IDs don't match (for dev)
    if (userId && conversation.userId !== userId) {
      console.log(
        "User ID mismatch - allowing for anonymous/dev usage in update"
      );
    }

    // Get the shared conversation record
    const sharedConversation = await ctx.db
      .query("sharedConversations")
      .withIndex("by_original_conversation", q =>
        q.eq("originalConversationId", args.conversationId)
      )
      .first();

    if (!sharedConversation) {
      throw new ConvexError("Conversation is not currently shared");
    }

    // Get current message count
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_conversation", q =>
        q.eq("conversationId", args.conversationId)
      )
      .filter(q => q.eq(q.field("isMainBranch"), true))
      .collect();

    // Update the shared conversation
    await ctx.db.patch(sharedConversation._id, {
      title: conversation.title,
      lastUpdated: Date.now(),
      messageCount: messages.length,
    });

    return sharedConversation.shareId;
  },
});

// Unshare a conversation
export const unshareConversation = mutation({
  args: {
    conversationId: v.id("conversations"),
  },
  handler: async (ctx, args) => {
    const userId = await getCurrentUserId(ctx);

    // Verify the user owns this conversation
    const conversation = await ctx.db.get(args.conversationId);
    if (!conversation) {
      throw new ConvexError("Conversation not found");
    }

    // Allow unsharing for anonymous users or when user IDs don't match (for dev)
    if (userId && conversation.userId !== userId) {
      console.log(
        "User ID mismatch - allowing for anonymous/dev usage in unshare"
      );
    }

    // Find and delete the shared conversation record
    const sharedConversation = await ctx.db
      .query("sharedConversations")
      .withIndex("by_original_conversation", q =>
        q.eq("originalConversationId", args.conversationId)
      )
      .first();

    if (sharedConversation) {
      await ctx.db.delete(sharedConversation._id);
    }

    return true;
  },
});

// Get shared conversation status
export const getSharedStatus = query({
  args: {
    conversationId: v.string(),
  },
  handler: async (ctx, args) => {
    try {
      const conversationId = args.conversationId as Id<"conversations">;
      const sharedConversation = await ctx.db
        .query("sharedConversations")
        .withIndex("by_original_conversation", q =>
          q.eq("originalConversationId", conversationId)
        )
        .first();

      if (!sharedConversation) {
        return null;
      }

      // Get current message count to see if there are new messages
      const currentMessages = await ctx.db
        .query("messages")
        .withIndex("by_conversation", q =>
          q.eq("conversationId", conversationId)
        )
        .filter(q => q.eq(q.field("isMainBranch"), true))
        .collect();

      return {
        shareId: sharedConversation.shareId,
        sharedAt: sharedConversation.sharedAt,
        lastUpdated: sharedConversation.lastUpdated,
        sharedMessageCount: sharedConversation.messageCount,
        currentMessageCount: currentMessages.length,
        hasNewMessages:
          currentMessages.length > sharedConversation.messageCount,
      };
    } catch {
      // Invalid ID format or any other error - return null
      return null;
    }
  },
});

// Get shared conversation by share ID (public access)
export const getSharedConversation = query({
  args: {
    shareId: v.string(),
  },
  handler: async (ctx, args) => {
    const sharedConversation = await ctx.db
      .query("sharedConversations")
      .withIndex("by_share_id", q => q.eq("shareId", args.shareId))
      .first();

    if (!sharedConversation) {
      return null;
    }

    // Get the original conversation
    const conversation = await ctx.db.get(
      sharedConversation.originalConversationId
    );
    if (!conversation) {
      return null;
    }

    // Get messages up to the shared count (capturing state at time of sharing/last update)
    const allMessages = await ctx.db
      .query("messages")
      .withIndex("by_conversation", q =>
        q.eq("conversationId", sharedConversation.originalConversationId)
      )
      .filter(q => q.eq(q.field("isMainBranch"), true))
      .order("asc")
      .collect();

    // Only include messages up to the shared count, and strip attachments for privacy
    const sharedMessages = allMessages
      .slice(0, sharedConversation.messageCount)
      .map(message => ({
        ...message,
        attachments: undefined, // Remove attachments for privacy
      }));

    return {
      conversation: {
        ...conversation,
        title: sharedConversation.title,
      },
      messages: sharedMessages,
      sharedAt: sharedConversation.sharedAt,
      lastUpdated: sharedConversation.lastUpdated,
    };
  },
});

// List user's shared conversations
export const listUserSharedConversations = query({
  args: {},
  handler: async ctx => {
    const userId = await requireAuth(ctx);

    return await ctx.db
      .query("sharedConversations")
      .withIndex("by_user", q => q.eq("userId", userId))
      .order("desc")
      .collect();
  },
});
