import { mutation } from "./_generated/server";

export const clearUsers = mutation({
  args: {},
  handler: async ctx => {
    const docs = await ctx.db.query("users").collect();
    for (const doc of docs) {
      await ctx.db.delete(doc._id);
    }
    return docs.length;
  },
});

export const clearAccounts = mutation({
  args: {},
  handler: async ctx => {
    const docs = await ctx.db.query("accounts").collect();
    for (const doc of docs) {
      await ctx.db.delete(doc._id);
    }
    return docs.length;
  },
});

export const clearSessions = mutation({
  args: {},
  handler: async ctx => {
    const docs = await ctx.db.query("sessions").collect();
    for (const doc of docs) {
      await ctx.db.delete(doc._id);
    }
    return docs.length;
  },
});

export const clearConversations = mutation({
  args: {},
  handler: async ctx => {
    const docs = await ctx.db.query("conversations").collect();
    for (const doc of docs) {
      await ctx.db.delete(doc._id);
    }
    return docs.length;
  },
});

export const clearSharedConversations = mutation({
  args: {},
  handler: async ctx => {
    const docs = await ctx.db.query("sharedConversations").collect();
    for (const doc of docs) {
      await ctx.db.delete(doc._id);
    }
    return docs.length;
  },
});

export const clearMessages = mutation({
  args: {},
  handler: async ctx => {
    const docs = await ctx.db.query("messages").collect();
    for (const doc of docs) {
      await ctx.db.delete(doc._id);
    }
    return docs.length;
  },
});

export const clearUserApiKeys = mutation({
  args: {},
  handler: async ctx => {
    const docs = await ctx.db.query("userApiKeys").collect();
    for (const doc of docs) {
      await ctx.db.delete(doc._id);
    }
    return docs.length;
  },
});

export const clearUserModels = mutation({
  args: {},
  handler: async ctx => {
    const docs = await ctx.db.query("userModels").collect();
    for (const doc of docs) {
      await ctx.db.delete(doc._id);
    }
    return docs.length;
  },
});

export const clearUserPersonaSettings = mutation({
  args: {},
  handler: async ctx => {
    const docs = await ctx.db.query("userPersonaSettings").collect();
    for (const doc of docs) {
      await ctx.db.delete(doc._id);
    }
    return docs.length;
  },
});

export const clearUserSettings = mutation({
  args: {},
  handler: async ctx => {
    const docs = await ctx.db.query("userSettings").collect();
    for (const doc of docs) {
      await ctx.db.delete(doc._id);
    }
    return docs.length;
  },
});

export const cleanupOrphanedAccounts = mutation({
  args: {},
  handler: async ctx => {
    const accounts = await ctx.db.query("accounts").collect();
    let deletedCount = 0;

    for (const account of accounts) {
      const user = await ctx.db.get(account.userId);
      if (!user) {
        // User doesn't exist, delete the orphaned account
        await ctx.db.delete(account._id);
        deletedCount++;
        console.log(
          `Deleted orphaned account ${account._id} for non-existent user ${account.userId}`
        );
      }
    }

    return {
      deletedCount,
      message: `Cleaned up ${deletedCount} orphaned accounts`,
    };
  },
});
