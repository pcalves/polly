import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const create = mutation({
  args: {
    conversationId: v.id("conversations"),
    role: v.union(v.literal("user"), v.literal("assistant"), v.literal("system")),
    content: v.string(),
    model: v.optional(v.string()),
    provider: v.optional(v.string()),
    parentId: v.optional(v.id("messages")),
    isMainBranch: v.optional(v.boolean()),
    reasoning: v.optional(v.string()),
    attachments: v.optional(v.array(v.object({
      type: v.union(v.literal("image"), v.literal("pdf")),
      url: v.string(),
      name: v.string(),
      size: v.number(),
    }))),
    metadata: v.optional(v.object({
      tokenCount: v.optional(v.number()),
      reasoningTokenCount: v.optional(v.number()),
      finishReason: v.optional(v.string()),
      duration: v.optional(v.number()),
    })),
  },
  handler: async (ctx, args) => {
    const messageId = await ctx.db.insert("messages", {
      ...args,
      isMainBranch: args.isMainBranch ?? true,
      createdAt: Date.now(),
    });

    // Track message count for anonymous users when they send a user message
    if (args.role === "user") {
      const userId = await getAuthUserId(ctx);
      if (userId) {
        const user = await ctx.db.get(userId);
        if (user?.isAnonymous) {
          const currentCount = user.messageCount || 0;
          await ctx.db.patch(userId, {
            messageCount: currentCount + 1,
          });
        }
      }
    }

    return messageId;
  },
});

export const list = query({
  args: { 
    conversationId: v.id("conversations"),
    includeAlternatives: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const query = ctx.db
      .query("messages")
      .withIndex("by_conversation", (q) => q.eq("conversationId", args.conversationId));

    if (!args.includeAlternatives) {
      return await query.filter((q) => q.eq(q.field("isMainBranch"), true)).collect();
    }

    return await query.collect();
  },
});

export const getAlternatives = query({
  args: { parentId: v.id("messages") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("messages")
      .withIndex("by_parent", (q) => q.eq("parentId", args.parentId))
      .collect();
  },
});

export const update = mutation({
  args: {
    id: v.id("messages"),
    content: v.optional(v.string()),
    reasoning: v.optional(v.string()),
    metadata: v.optional(v.object({
      tokenCount: v.optional(v.number()),
      reasoningTokenCount: v.optional(v.number()),
      finishReason: v.optional(v.string()),
      duration: v.optional(v.number()),
    })),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    return await ctx.db.patch(id, updates);
  },
});

export const setBranch = mutation({
  args: {
    messageId: v.id("messages"),
    parentId: v.optional(v.id("messages")),
  },
  handler: async (ctx, args) => {
    // Set all siblings to non-main branch
    if (args.parentId) {
      const siblings = await ctx.db
        .query("messages")
        .withIndex("by_parent", (q) => q.eq("parentId", args.parentId))
        .collect();

      for (const sibling of siblings) {
        await ctx.db.patch(sibling._id, { isMainBranch: false });
      }
    }

    // Set this message as main branch
    return await ctx.db.patch(args.messageId, { isMainBranch: true });
  },
});

export const remove = mutation({
  args: { id: v.id("messages") },
  handler: async (ctx, args) => {
    return await ctx.db.delete(args.id);
  },
});