import { v } from "convex/values";
import { action, mutation, query } from "./_generated/server";
import { api } from "./_generated/api";
import { Id } from "./_generated/dataModel";

// Debug query to check conversation ownership
export const debugConversationOwnership = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const conversations = await ctx.db
      .query("conversations")
      .withIndex("by_user", q => q.eq("userId", args.userId))
      .collect();

    const user = await ctx.db.get(args.userId);

    return {
      userId: args.userId,
      userExists: !!user,
      userIsAnonymous: user?.isAnonymous,
      userName: user?.name,
      conversationCount: conversations.length,
      conversations: conversations.map(c => ({
        id: c._id,
        title: c.title,
        createdAt: c.createdAt,
        updatedAt: c.updatedAt,
      })),
    };
  },
});

// Graduate an anonymous user to an authenticated user
export const graduateAnonymousUser = mutation({
  args: {
    anonymousUserId: v.id("users"),
    authUserId: v.id("users"), // The new authenticated user ID from auth system
  },
  handler: async (ctx, args) => {
    console.log(
      `[UserGraduation] Starting graduation: ${args.anonymousUserId} -> ${args.authUserId}`
    );

    // Get the anonymous user
    const anonymousUser = await ctx.db.get(args.anonymousUserId);
    if (!anonymousUser || !anonymousUser.isAnonymous) {
      throw new Error("Anonymous user not found or already authenticated");
    }

    // Get the auth user (created by Convex Auth)
    const authUser = await ctx.db.get(args.authUserId);
    if (!authUser) {
      throw new Error("Authenticated user not found");
    }

    // Transfer all data from anonymous user to auth user
    await ctx.db.patch(args.authUserId, {
      messagesSent: anonymousUser.messagesSent || 0,
      isAnonymous: false,
      createdAt: anonymousUser.createdAt,
    });

    // Update all conversations to point to the auth user
    const conversations = await ctx.db
      .query("conversations")
      .withIndex("by_user", q => q.eq("userId", args.anonymousUserId))
      .collect();

    console.log(
      `[UserGraduation] Found ${conversations.length} conversations to migrate`
    );

    for (const conversation of conversations) {
      await ctx.db.patch(conversation._id, {
        userId: args.authUserId,
      });
      console.log(
        `[UserGraduation] Migrated conversation: ${conversation._id}`
      );
    }

    // Update all user API keys to point to the auth user
    const apiKeys = await ctx.db
      .query("userApiKeys")
      .withIndex("by_user", q => q.eq("userId", args.anonymousUserId))
      .collect();

    console.log(`[UserGraduation] Found ${apiKeys.length} API keys to migrate`);

    for (const apiKey of apiKeys) {
      await ctx.db.patch(apiKey._id, {
        userId: args.authUserId,
      });
    }

    // Update all user models to point to the auth user
    const userModels = await ctx.db
      .query("userModels")
      .withIndex("by_user", q => q.eq("userId", args.anonymousUserId))
      .collect();

    console.log(
      `[UserGraduation] Found ${userModels.length} user models to migrate`
    );

    for (const userModel of userModels) {
      await ctx.db.patch(userModel._id, {
        userId: args.authUserId,
      });
    }

    // Update all personas to point to the auth user
    const personas = await ctx.db
      .query("personas")
      .withIndex("by_user", q => q.eq("userId", args.anonymousUserId))
      .collect();

    console.log(
      `[UserGraduation] Found ${personas.length} personas to migrate`
    );

    for (const persona of personas) {
      await ctx.db.patch(persona._id, {
        userId: args.authUserId,
      });
    }

    // Update all user persona settings to point to the auth user
    const personaSettings = await ctx.db
      .query("userPersonaSettings")
      .withIndex("by_user", q => q.eq("userId", args.anonymousUserId))
      .collect();

    console.log(
      `[UserGraduation] Found ${personaSettings.length} persona settings to migrate`
    );

    for (const setting of personaSettings) {
      await ctx.db.patch(setting._id, {
        userId: args.authUserId,
      });
    }

    // Update all user settings to point to the auth user
    const userSettings = await ctx.db
      .query("userSettings")
      .withIndex("by_user", q => q.eq("userId", args.anonymousUserId))
      .collect();

    console.log(
      `[UserGraduation] Found ${userSettings.length} user settings to migrate`
    );

    for (const setting of userSettings) {
      await ctx.db.patch(setting._id, {
        userId: args.authUserId,
      });
    }

    // Update all shared conversations to point to the auth user
    const sharedConversations = await ctx.db
      .query("sharedConversations")
      .withIndex("by_user", q => q.eq("userId", args.anonymousUserId))
      .collect();

    console.log(
      `[UserGraduation] Found ${sharedConversations.length} shared conversations to migrate`
    );

    for (const sharedConv of sharedConversations) {
      await ctx.db.patch(sharedConv._id, {
        userId: args.authUserId,
      });
    }

    // Delete the anonymous user
    await ctx.db.delete(args.anonymousUserId);

    console.log(
      `[UserGraduation] Successfully graduated user and deleted anonymous user: ${args.anonymousUserId}`
    );

    return {
      success: true,
      message: "Anonymous user successfully graduated to authenticated user",
    };
  },
});

// Action to handle the graduation flow during sign-in
export const graduateOnSignIn = action({
  args: {
    anonymousUserId: v.optional(v.id("users")),
  },
  handler: async (
    ctx,
    args
  ): Promise<{
    userId: Id<"users">;
    graduated: boolean;
    message: string;
  }> => {
    // Get the current authenticated user from the session
    const authUser = await ctx.runQuery(api.users.current);
    if (!authUser) {
      throw new Error("No authenticated user found");
    }

    // If no anonymous user ID provided, just return the auth user
    if (!args.anonymousUserId) {
      return {
        userId: authUser._id,
        graduated: false,
        message: "No anonymous user to graduate",
      };
    }

    // Check if the anonymous user exists and is actually anonymous
    const anonymousUser = await ctx.runQuery(api.users.getById, {
      id: args.anonymousUserId,
    });

    if (!anonymousUser || !anonymousUser.isAnonymous) {
      return {
        userId: authUser._id,
        graduated: false,
        message: "Anonymous user not found or already authenticated",
      };
    }

    // Perform the graduation
    await ctx.runMutation(api.userGraduation.graduateAnonymousUser, {
      anonymousUserId: args.anonymousUserId,
      authUserId: authUser._id,
    });

    return {
      userId: authUser._id,
      graduated: true,
      message: "Successfully graduated anonymous user",
    };
  },
});
