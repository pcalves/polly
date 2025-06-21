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

// Get monthly usage statistics for authenticated users
export const getMonthlyUsage = query({
  args: { userId: v.optional(v.id("users")) },
  handler: async (ctx, args) => {
    let userId = args.userId;
    if (!userId) {
      const currentUserId = await getCurrentUserId(ctx);
      if (!currentUserId) {
        return null;
      }
      userId = currentUserId;
    }

    const user = await ctx.db.get(userId);
    if (!user || user.isAnonymous) {
      return null;
    }

    // Check if we need to reset monthly count
    const now = Date.now();
    const createdAt = user.createdAt || now;
    const lastReset = user.lastMonthlyReset || createdAt;

    // Calculate next reset date based on user's creation anniversary
    const createdDate = new Date(createdAt);
    const lastResetDate = new Date(lastReset);
    const currentDate = new Date(now);

    // Find the next monthly anniversary
    const nextResetDate = new Date(lastResetDate);
    nextResetDate.setMonth(nextResetDate.getMonth() + 1);

    // If we've passed the reset date, we need to reset
    const needsReset = currentDate >= nextResetDate;

    const monthlyLimit = user.monthlyLimit || 100;
    let monthlyMessagesSent = user.monthlyMessagesSent || 0;

    if (needsReset) {
      monthlyMessagesSent = 0;
    }

    return {
      monthlyMessagesSent,
      monthlyLimit,
      remainingMessages: Math.max(0, monthlyLimit - monthlyMessagesSent),
      resetDate: nextResetDate.getTime(),
      needsReset,
    };
  },
});

// Check if user has access to BYOK models (has API keys)
export const hasUserApiKeys = query({
  args: {},
  handler: async ctx => {
    const userId = await getCurrentUserId(ctx);
    if (!userId) {
      return false;
    }

    const apiKeys = await ctx.db
      .query("userApiKeys")
      .withIndex("by_user", q => q.eq("userId", userId))
      .filter(q => q.eq(q.field("isValid"), true))
      .collect();

    return apiKeys.length > 0;
  },
});

// Message limit enforcement - keep in sync with client-side use-user.ts
const ANONYMOUS_MESSAGE_LIMIT = 10;
const MONTHLY_MESSAGE_LIMIT = 500;

export const incrementMessageCount = mutation({
  args: {
    userId: v.id("users"),
    modelProvider: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error("User not found");
    }

    if (user.isAnonymous) {
      // Anonymous users: increment total message count
      const currentCount = user.messagesSent || 0;
      await ctx.db.patch(args.userId, {
        messagesSent: currentCount + 1,
      });
    } else {
      // Authenticated users: increment monthly count and reset if needed
      const now = Date.now();
      const createdAt = user.createdAt || now;
      const lastReset = user.lastMonthlyReset || createdAt;

      // Calculate if we need to reset
      const lastResetDate = new Date(lastReset);
      const currentDate = new Date(now);
      const nextResetDate = new Date(lastResetDate);
      nextResetDate.setMonth(nextResetDate.getMonth() + 1);

      const needsReset = currentDate >= nextResetDate;

      if (needsReset) {
        // Reset monthly count
        await ctx.db.patch(args.userId, {
          monthlyMessagesSent: 1,
          lastMonthlyReset: now,
          monthlyLimit: user.monthlyLimit || MONTHLY_MESSAGE_LIMIT,
        });
      } else {
        // Increment monthly count
        const currentMonthlyCount = user.monthlyMessagesSent || 0;
        await ctx.db.patch(args.userId, {
          monthlyMessagesSent: currentMonthlyCount + 1,
          monthlyLimit: user.monthlyLimit || MONTHLY_MESSAGE_LIMIT,
        });
      }
    }
  },
});

export const enforceMessageLimit = mutation({
  args: {
    userId: v.id("users"),
    modelProvider: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error("User not found");
    }

    if (user.isAnonymous) {
      // Anonymous users: enforce 10 message limit
      const messagesSent = user.messagesSent || 0;
      if (messagesSent >= ANONYMOUS_MESSAGE_LIMIT) {
        throw new Error(
          `Message limit reached (${ANONYMOUS_MESSAGE_LIMIT} messages). Authentication is not available - you cannot send more messages.`
        );
      }
    } else {
      // Authenticated users: check monthly limit and API keys
      const now = Date.now();
      const createdAt = user.createdAt || now;
      const lastReset = user.lastMonthlyReset || createdAt;

      // Calculate if we need to reset
      const lastResetDate = new Date(lastReset);
      const currentDate = new Date(now);
      const nextResetDate = new Date(lastResetDate);
      nextResetDate.setMonth(nextResetDate.getMonth() + 1);

      const needsReset = currentDate >= nextResetDate;
      const monthlyLimit = user.monthlyLimit || MONTHLY_MESSAGE_LIMIT;
      let monthlyMessagesSent = user.monthlyMessagesSent || 0;

      if (needsReset) {
        monthlyMessagesSent = 0;
      }

      // Check if they've hit the monthly limit
      if (monthlyMessagesSent >= monthlyLimit) {
        // Check if they have BYOK models available
        const apiKeys = await ctx.db
          .query("userApiKeys")
          .withIndex("by_user", q => q.eq("userId", user._id))
          .filter(q => q.eq(q.field("isValid"), true))
          .collect();

        if (apiKeys.length === 0) {
          throw new Error(
            `Monthly message limit reached (${monthlyLimit} messages). Add your own API keys to continue using BYOK models.`
          );
        }

        // They have API keys - check if they're trying to use a Polly model
        const isPollyModel =
          !args.modelProvider ||
          args.modelProvider === "polly" ||
          args.modelProvider === "google"; // Polly uses Google behind the scenes

        if (isPollyModel) {
          throw new Error(
            `Monthly Polly model limit reached (${monthlyLimit} messages). Please use your BYOK models or wait for next month's reset.`
          );
        }

        // They're using BYOK models - allow the message
      }
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

// Initialize monthly limits for existing authenticated users
export const initializeMonthlyLimits = mutation({
  args: { userId: v.optional(v.id("users")) },
  handler: async (ctx, args) => {
    let userId = args.userId;
    if (!userId) {
      const currentUserId = await getCurrentUserId(ctx);
      if (!currentUserId) {
        return;
      }
      userId = currentUserId;
    }

    const user = await ctx.db.get(userId);
    if (!user || user.isAnonymous) {
      return;
    }

    // Initialize monthly limits if not already set
    const updates: Record<string, number> = {};

    if (user.monthlyLimit === undefined) {
      updates.monthlyLimit = MONTHLY_MESSAGE_LIMIT;
    }

    if (user.monthlyMessagesSent === undefined) {
      updates.monthlyMessagesSent = 0;
    }

    if (user.lastMonthlyReset === undefined) {
      updates.lastMonthlyReset = user.createdAt || Date.now();
    }

    if (Object.keys(updates).length > 0) {
      await ctx.db.patch(userId, updates);
    }
  },
});

// Get user statistics including conversation count and message count
export const getUserStats = query({
  args: { userId: v.optional(v.id("users")) },
  handler: async (ctx, args) => {
    let userId = args.userId;
    if (!userId) {
      const currentUserId = await getCurrentUserId(ctx);
      if (!currentUserId) {
        return null;
      }
      userId = currentUserId;
    }

    const user = await ctx.db.get(userId);
    if (!user || user.isAnonymous) {
      return null;
    }

    // Get conversation count
    const conversations = await ctx.db
      .query("conversations")
      .withIndex("by_user", q => q.eq("userId", userId))
      .collect();

    // Get total message count (across all conversations)
    let totalMessages = 0;
    for (const conversation of conversations) {
      const messages = await ctx.db
        .query("messages")
        .withIndex("by_conversation", q =>
          q.eq("conversationId", conversation._id)
        )
        .collect();
      totalMessages += messages.length;
    }

    return {
      userId,
      name: user.name,
      email: user.email,
      image: user.image,
      joinedAt: user.createdAt || Date.now(),
      conversationCount: conversations.length,
      totalMessages,
      messagesSent: user.messagesSent || 0, // For anonymous users
    };
  },
});
