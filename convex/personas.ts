import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getOptionalUserId, getCurrentUserId } from "./lib/auth";

export const list = query({
  args: { userId: v.optional(v.id("users")) },
  handler: async (ctx, args) => {
    const userId = args.userId || (await getOptionalUserId(ctx));

    if (!userId) {
      // Return only built-in personas for anonymous users
      return await ctx.db
        .query("personas")
        .withIndex("by_built_in", q => q.eq("isBuiltIn", true))
        .filter(q => q.eq(q.field("isActive"), true))
        .order("asc")
        .collect();
    }

    // Get both built-in and user personas
    const builtInPersonas = await ctx.db
      .query("personas")
      .withIndex("by_built_in", q => q.eq("isBuiltIn", true))
      .filter(q => q.eq(q.field("isActive"), true))
      .collect();

    const userPersonas = await ctx.db
      .query("personas")
      .withIndex("by_user_active", q =>
        q.eq("userId", userId).eq("isActive", true)
      )
      .collect();

    // Get user's persona settings to filter out disabled built-in personas
    const userPersonaSettings = await ctx.db
      .query("userPersonaSettings")
      .withIndex("by_user", q => q.eq("userId", userId))
      .collect();

    const disabledPersonaIds = new Set(
      userPersonaSettings
        .filter(setting => setting.isDisabled)
        .map(setting => setting.personaId)
    );

    // Filter out disabled built-in personas
    const enabledBuiltInPersonas = builtInPersonas.filter(
      persona => !disabledPersonaIds.has(persona._id)
    );

    return [...enabledBuiltInPersonas, ...userPersonas].sort(
      (a, b) => (a.order || 0) - (b.order || 0)
    );
  },
});

export const get = query({
  args: { id: v.id("personas") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    description: v.string(),
    prompt: v.string(),
    icon: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getCurrentUserId(ctx);
    const now = Date.now();

    return await ctx.db.insert("personas", {
      userId: userId || undefined,
      name: args.name,
      description: args.description,
      prompt: args.prompt,
      icon: args.icon,
      isBuiltIn: false,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("personas"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    prompt: v.optional(v.string()),
    icon: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
    order: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getCurrentUserId(ctx);
    const { id, ...updates } = args;

    // Verify ownership (can't edit built-in personas)
    const persona = await ctx.db.get(id);
    if (!persona) {
      throw new Error("Persona not found");
    }

    if (persona.isBuiltIn || persona.userId !== userId) {
      throw new Error("Cannot edit this persona");
    }

    return await ctx.db.patch(id, {
      ...updates,
      updatedAt: Date.now(),
    });
  },
});

export const remove = mutation({
  args: { id: v.id("personas") },
  handler: async (ctx, args) => {
    const userId = await getCurrentUserId(ctx);

    // Verify ownership (can't delete built-in personas)
    const persona = await ctx.db.get(args.id);
    if (!persona) {
      throw new Error("Persona not found");
    }

    if (persona.isBuiltIn || persona.userId !== userId) {
      throw new Error("Cannot delete this persona");
    }

    return await ctx.db.delete(args.id);
  },
});

export const listAllBuiltIn = query({
  handler: async ctx => {
    return await ctx.db
      .query("personas")
      .withIndex("by_built_in", q => q.eq("isBuiltIn", true))
      .filter(q => q.eq(q.field("isActive"), true))
      .collect();
  },
});

export const getUserPersonaSettings = query({
  args: { userId: v.optional(v.id("users")) },
  handler: async (ctx, args) => {
    const userId = args.userId || (await getOptionalUserId(ctx));
    if (!userId) return [];

    return await ctx.db
      .query("userPersonaSettings")
      .withIndex("by_user", q => q.eq("userId", userId))
      .collect();
  },
});

export const toggleBuiltInPersona = mutation({
  args: {
    personaId: v.id("personas"),
    isDisabled: v.boolean(),
  },
  handler: async (ctx, args) => {
    const userId = await getCurrentUserId(ctx);
    if (!userId) {
      throw new Error("User not found");
    }

    // Verify this is a built-in persona
    const persona = await ctx.db.get(args.personaId);
    if (!persona || !persona.isBuiltIn) {
      throw new Error("Can only toggle built-in personas");
    }

    // Check if setting already exists
    const existingSetting = await ctx.db
      .query("userPersonaSettings")
      .withIndex("by_user_persona", q =>
        q.eq("userId", userId).eq("personaId", args.personaId)
      )
      .first();

    const now = Date.now();

    if (existingSetting) {
      // Update existing setting
      await ctx.db.patch(existingSetting._id, {
        isDisabled: args.isDisabled,
        updatedAt: now,
      });
    } else {
      // Create new setting
      await ctx.db.insert("userPersonaSettings", {
        userId,
        personaId: args.personaId,
        isDisabled: args.isDisabled,
        createdAt: now,
        updatedAt: now,
      });
    }

    return { success: true };
  },
});
