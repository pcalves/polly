import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requireAuth, getOptionalUserId } from "./lib/auth";
import { Id } from "./_generated/dataModel";

export const getUserModels = query({
  args: {},
  handler: async ctx => {
    const userId = await getOptionalUserId(ctx);

    if (!userId) {
      return [];
    }

    return await ctx.db
      .query("userModels")
      .withIndex("by_user", q => q.eq("userId", userId))
      .collect();
  },
});

export const getUserSelectedModel = query({
  args: {},
  handler: async ctx => {
    const userId = await getOptionalUserId(ctx);

    if (!userId) {
      // For anonymous users, return default Gemini model if API key is available
      return getAnonymousDefaultModel();
    }

    const selectedModel = await ctx.db
      .query("userModels")
      .withIndex("by_user", q => q.eq("userId", userId))
      .filter(q => q.eq(q.field("selected"), true))
      .unique();

    // If signed-in user has a selected model, return it
    if (selectedModel) {
      return selectedModel;
    }

    // Check if user has explicitly selected the default model
    const userSettings = await ctx.db
      .query("userSettings")
      .withIndex("by_user", q => q.eq("userId", userId))
      .unique();

    if (userSettings?.defaultModelSelected) {
      return getAnonymousDefaultModel();
    }

    // Check if user has any models configured at all
    const userHasModels = await ctx.db
      .query("userModels")
      .withIndex("by_user", q => q.eq("userId", userId))
      .first();

    // If no models configured, provide default model (same as anonymous users)
    if (!userHasModels) {
      return getAnonymousDefaultModel();
    }

    // User has models but none selected and hasn't explicitly selected default
    return null;
  },
});

// Get models by provider (for organizing in ModelPicker)
export const getUserModelsByProvider = query({
  args: {},
  handler: async ctx => {
    const userId = await getOptionalUserId(ctx);

    if (!userId) {
      // For anonymous users, return default Gemini model if API key is available
      const defaultModel = getAnonymousDefaultModel();
      if (!defaultModel) {
        return [];
      }

      return [
        {
          id: "polly",
          name: "Polly",
          models: [defaultModel],
        },
      ];
    }

    const models = await ctx.db
      .query("userModels")
      .withIndex("by_user", q => q.eq("userId", userId))
      .collect();

    // Always include the default model under Polly provider
    const defaultModel = getAnonymousDefaultModel();
    const providers = [];

    // Add Polly provider with default model first (if available)
    if (defaultModel) {
      providers.push({
        id: "polly",
        name: "Polly",
        models: [defaultModel],
      });
    }

    // If user has configured models, add them grouped by provider
    if (models.length > 0) {
      // Group by provider
      const byProvider = models.reduce(
        (acc, model) => {
          acc[model.provider] = acc[model.provider] || [];
          acc[model.provider].push(model);
          return acc;
        },
        {} as Record<string, typeof models>
      );

      // Convert to array format expected by component
      const userProviders = Object.entries(byProvider).map(
        ([providerName, providerModels]) => ({
          id: providerName,
          name: providerName,
          models: providerModels,
        })
      );

      providers.push(...userProviders);
    }

    return providers;
  },
});

// Check if user has any enabled models
export const hasUserModels = query({
  args: {},
  handler: async ctx => {
    const userId = await getOptionalUserId(ctx);

    if (!userId) {
      // For anonymous users, return true if we have Gemini API key
      return !!process.env.GEMINI_API_KEY;
    }

    const count = await ctx.db
      .query("userModels")
      .withIndex("by_user", q => q.eq("userId", userId))
      .collect();

    // If user has configured models, return true
    if (count.length > 0) {
      return true;
    }

    // If no configured models but we have Gemini API key, return true (default model available)
    return !!process.env.GEMINI_API_KEY;
  },
});

export const toggleModel = mutation({
  args: {
    modelId: v.string(),
    modelData: v.optional(
      v.object({
        modelId: v.string(),
        name: v.string(),
        provider: v.string(),
        contextLength: v.number(),
        maxOutputTokens: v.optional(v.number()),
        supportsImages: v.boolean(),
        supportsTools: v.boolean(),
        supportsReasoning: v.boolean(),
        inputModalities: v.optional(v.array(v.string())),
      })
    ),
  },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx);

    const existing = await ctx.db
      .query("userModels")
      .withIndex("by_user_model_id", q =>
        q.eq("userId", userId).eq("modelId", args.modelId)
      )
      .unique();

    if (!existing && args.modelData) {
      await ctx.db.insert("userModels", {
        ...args.modelData,
        userId,
        selected: false,
        createdAt: Date.now(),
      });
    } else if (existing) {
      await ctx.db.delete(existing._id);
    }
  },
});

export const selectModel = mutation({
  args: {
    modelId: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx);

    const selectedModel = await ctx.db
      .query("userModels")
      .withIndex("by_user", q => q.eq("userId", userId))
      .filter(q => q.eq(q.field("selected"), true))
      .unique();

    // Check if this is the default model
    const defaultModel = getAnonymousDefaultModel();
    const isDefaultModel =
      defaultModel && args.modelId === defaultModel.modelId;

    if (isDefaultModel) {
      // For default model, clear any existing selection and mark default as selected
      if (selectedModel) {
        await ctx.db.patch(selectedModel._id, { selected: false });
      }

      // Update or create user settings to track default model selection
      const userSettings = await ctx.db
        .query("userSettings")
        .withIndex("by_user", q => q.eq("userId", userId))
        .unique();

      if (userSettings) {
        await ctx.db.patch(userSettings._id, {
          defaultModelSelected: true,
          updatedAt: Date.now(),
        });
      } else {
        await ctx.db.insert("userSettings", {
          userId,
          defaultModelSelected: true,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });
      }
      return;
    }

    // For regular models, find the model in user's configured models
    const model = await ctx.db
      .query("userModels")
      .withIndex("by_user_model_id", q =>
        q.eq("userId", userId).eq("modelId", args.modelId)
      )
      .unique();

    if (!model) {
      throw new Error("Model not found");
    }

    if (model.modelId !== selectedModel?.modelId) {
      await ctx.db.patch(model._id, { selected: true });
      if (selectedModel) {
        await ctx.db.patch(selectedModel._id, { selected: false });
      }

      // Clear default model selection flag since user selected a different model
      const userSettings = await ctx.db
        .query("userSettings")
        .withIndex("by_user", q => q.eq("userId", userId))
        .unique();

      if (userSettings?.defaultModelSelected) {
        await ctx.db.patch(userSettings._id, {
          defaultModelSelected: false,
          updatedAt: Date.now(),
        });
      }
    }
  },
});

// Helper function to get default anonymous model
function getAnonymousDefaultModel() {
  // Only provide default model if we have the Gemini API key
  if (!process.env.GEMINI_API_KEY) {
    return null;
  }

  return {
    _id: "anonymous-gemini-default" as Id<"userModels">,
    _creationTime: Date.now(),
    userId: "anonymous" as Id<"users">,
    modelId: "gemini-2.5-flash-lite-preview-06-17",
    name: "Gemini 2.5 Flash Lite",
    provider: "google",
    contextLength: 1048576,
    maxOutputTokens: undefined,
    supportsImages: true,
    supportsTools: true,
    supportsReasoning: true,
    inputModalities: undefined,
    selected: true,
    createdAt: Date.now(),
    free: true,
  };
}
