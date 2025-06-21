/* eslint-disable @typescript-eslint/no-unused-vars */
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getCurrentUserId } from "./lib/auth";

export const current = query({
  args: {},
  handler: async ctx => {
    const userId = await getCurrentUserId(ctx);
    if (!userId) {
      return null;
    }
    return await ctx.db.get(userId);
  },
});

export const getCurrentUser = query({
  args: {},
  handler: async ctx => {
    const userId = await getCurrentUserId(ctx);
    if (!userId) {
      return null;
    }
    return await ctx.db.get(userId);
  },
});

// Debug query to check user profile data
export const getUserProfile = query({
  args: {},
  handler: async ctx => {
    const userId = await getCurrentUserId(ctx);
    if (!userId) {
      return null;
    }
    const user = await ctx.db.get(userId);
    if (!user) {
      return null;
    }

    // Return profile data for debugging
    return {
      id: user._id,
      name: user.name,
      email: user.email,
      image: user.image,
      isAnonymous: user.isAnonymous,
      createdAt: user.createdAt,
      hasImage: !!user.image,
    };
  },
});

export const createAnonymous = mutation({
  args: {},
  handler: async ctx => {
    const now = Date.now();
    return await ctx.db.insert("users", {
      name: `Anonymous User`,
      email: `anonymous-${now}@temp.local`,
      isAnonymous: true,
      messagesSent: 0,
      createdAt: now,
    });
  },
});

export const getById = query({
  args: { id: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const getMessageCount = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) {
      return 0;
    }

    // Return the total messages sent counter (not current message count)
    return user.messagesSent || 0;
  },
});

// Message limit enforcement - keep in sync with client-side use-user.ts
const MESSAGE_LIMIT = 10;

export const incrementMessageCount = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error("User not found");
    }

    // Only increment for anonymous users (authenticated users have no limits)
    if (user.isAnonymous) {
      const currentCount = user.messagesSent || 0;
      await ctx.db.patch(args.userId, {
        messagesSent: currentCount + 1,
      });
    }
  },
});

export const enforceMessageLimit = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user || !user.isAnonymous) {
      return; // No limit for authenticated users
    }

    const messagesSent = user.messagesSent || 0;

    if (messagesSent >= MESSAGE_LIMIT) {
      throw new Error(
        `Message limit reached (${MESSAGE_LIMIT} messages). Authentication is not available - you cannot send more messages.`
      );
    }
  },
});

export const update = mutation({
  args: {
    id: v.id("users"),
    name: v.optional(v.string()),
    image: v.optional(v.string()),
  },
  handler: async (_ctx, _args) => {
    throw new Error("User updates are not available without authentication");
  },
});

export const ensureUser = mutation({
  args: {},
  handler: async ctx => {
    // Get or create the mock user
    const userId = await getCurrentUserId(ctx);
    return userId;
  },
});

// Migration helper to initialize messagesSent for existing users
export const initializeMessagesSent = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) {
      return;
    }

    // Only initialize if not already set
    if (user.messagesSent === undefined) {
      await ctx.db.patch(args.userId, {
        messagesSent: 0,
      });
    }
  },
});
