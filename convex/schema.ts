import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

export default defineSchema({
  // Authentication tables from Convex Auth
  ...authTables,

  users: defineTable({
    name: v.optional(v.string()),
    email: v.optional(v.string()),
    emailVerified: v.optional(v.number()),
    emailVerificationTime: v.optional(v.number()),
    image: v.optional(v.string()),
    isAnonymous: v.optional(v.boolean()),
    messagesSent: v.optional(v.number()), // Total messages sent (for anonymous user limits)
    createdAt: v.optional(v.number()),
    // Monthly message limit tracking for signed-in users
    monthlyMessagesSent: v.optional(v.number()), // Messages sent in current month
    monthlyLimit: v.optional(v.number()), // Monthly limit (default 500)
    lastMonthlyReset: v.optional(v.number()), // Last reset timestamp
    hasUnlimitedCalls: v.optional(v.boolean()), // Flag for unlimited calls
  }).index("email", ["email"]),

  accounts: defineTable({
    userId: v.id("users"),
    type: v.string(),
    provider: v.string(),
    providerAccountId: v.string(),
    refresh_token: v.optional(v.string()),
    access_token: v.optional(v.string()),
    expires_at: v.optional(v.number()),
    token_type: v.optional(v.string()),
    scope: v.optional(v.string()),
    id_token: v.optional(v.string()),
    session_state: v.optional(v.string()),
  }).index("by_provider_account", ["provider", "providerAccountId"]),

  sessions: defineTable({
    sessionToken: v.string(),
    userId: v.id("users"),
    expires: v.number(),
  }).index("by_session_token", ["sessionToken"]),

  conversations: defineTable({
    title: v.string(),
    userId: v.id("users"),
    personaId: v.optional(v.id("personas")), // null means default persona
    sourceConversationId: v.optional(v.id("conversations")),
    isStreaming: v.optional(v.boolean()),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_user", ["userId"]),

  sharedConversations: defineTable({
    shareId: v.string(),
    originalConversationId: v.id("conversations"),
    userId: v.id("users"),
    title: v.string(),
    sharedAt: v.number(),
    lastUpdated: v.number(),
    messageCount: v.number(),
  })
    .index("by_share_id", ["shareId"])
    .index("by_original_conversation", ["originalConversationId"])
    .index("by_user", ["userId"]),

  messages: defineTable({
    conversationId: v.id("conversations"),
    role: v.union(
      v.literal("user"),
      v.literal("assistant"),
      v.literal("system"),
      v.literal("context")
    ),
    content: v.string(),
    reasoning: v.optional(v.string()),
    model: v.optional(v.string()),
    provider: v.optional(v.string()),
    parentId: v.optional(v.id("messages")),
    isMainBranch: v.boolean(),
    sourceConversationId: v.optional(v.id("conversations")),
    useWebSearch: v.optional(v.boolean()),
    attachments: v.optional(
      v.array(
        v.object({
          type: v.union(
            v.literal("image"),
            v.literal("pdf"),
            v.literal("text")
          ),
          url: v.string(),
          name: v.string(),
          size: v.number(),
          content: v.optional(v.string()), // For text files
          thumbnail: v.optional(v.string()), // For image thumbnails
          storageId: v.optional(v.id("_storage")), // Convex storage ID
        })
      )
    ),
    // Web search citations
    citations: v.optional(
      v.array(
        v.object({
          type: v.literal("url_citation"),
          url: v.string(),
          title: v.string(),
          cited_text: v.optional(v.string()),
          snippet: v.optional(v.string()),
        })
      )
    ),
    metadata: v.optional(
      v.object({
        tokenCount: v.optional(v.number()),
        reasoningTokenCount: v.optional(v.number()),
        finishReason: v.optional(v.string()),
        duration: v.optional(v.number()),
        stopped: v.optional(v.boolean()),
      })
    ),
    createdAt: v.number(),
  })
    .index("by_conversation", ["conversationId", "createdAt"])
    .index("by_parent", ["parentId"]),

  userApiKeys: defineTable({
    userId: v.id("users"),
    provider: v.union(
      v.literal("openai"),
      v.literal("anthropic"),
      v.literal("google"),
      v.literal("openrouter")
    ),
    // Server-side encryption (for server operations)
    encryptedKey: v.optional(v.array(v.number())),
    initializationVector: v.optional(v.array(v.number())),
    // Client-side encryption (end-to-end, like Whisper app)
    clientEncryptedKey: v.optional(v.string()),
    partialKey: v.string(),
    isValid: v.boolean(),
    createdAt: v.number(),
    lastValidated: v.optional(v.number()),
  })
    .index("by_user", ["userId"])
    .index("by_user_provider", ["userId", "provider"]),

  userModels: defineTable({
    userId: v.id("users"),
    modelId: v.string(),
    name: v.string(),
    provider: v.string(),
    contextLength: v.number(),
    maxOutputTokens: v.optional(v.number()),
    supportsImages: v.boolean(),
    supportsTools: v.boolean(),
    supportsReasoning: v.boolean(),
    inputModalities: v.optional(v.array(v.string())),
    selected: v.optional(v.boolean()),
    free: v.optional(v.boolean()), // Mark as free model
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_provider", ["userId", "provider"])
    .index("by_user_model_id", ["userId", "modelId"]),

  personas: defineTable({
    userId: v.optional(v.id("users")), // null for built-in personas
    name: v.string(),
    description: v.string(),
    prompt: v.string(),
    icon: v.optional(v.string()), // emoji or icon identifier
    isBuiltIn: v.boolean(),
    isActive: v.boolean(),
    order: v.optional(v.number()), // for sorting
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_active", ["userId", "isActive"])
    .index("by_built_in", ["isBuiltIn"]),

  userPersonaSettings: defineTable({
    userId: v.id("users"),
    personaId: v.id("personas"), // reference to built-in persona
    isDisabled: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_persona", ["userId", "personaId"]),

  userSettings: defineTable({
    userId: v.id("users"),
    personasEnabled: v.optional(v.boolean()), // null/undefined means enabled (default)
    defaultModelSelected: v.optional(v.boolean()), // Track if user explicitly selected default model
    openRouterSorting: v.optional(
      v.union(
        v.literal("default"),
        v.literal("price"),
        v.literal("throughput"),
        v.literal("latency")
      )
    ), // OpenRouter provider sorting preference
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_user", ["userId"]),
});
