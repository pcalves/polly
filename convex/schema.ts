import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

export default defineSchema({
  ...authTables,
  
  users: defineTable({
    email: v.optional(v.string()),
    name: v.optional(v.string()),
    image: v.optional(v.string()),
    isAnonymous: v.boolean(),
    messageCount: v.optional(v.number()), // Track message count for anonymous users
    createdAt: v.number(),
  }),

  conversations: defineTable({
    title: v.string(),
    userId: v.id("users"),
    isShared: v.optional(v.boolean()),
    shareId: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_share_id", ["shareId"]),

  messages: defineTable({
    conversationId: v.id("conversations"),
    role: v.union(v.literal("user"), v.literal("assistant"), v.literal("system")),
    content: v.string(),
    reasoning: v.optional(v.string()),
    model: v.optional(v.string()),
    provider: v.optional(v.string()),
    parentId: v.optional(v.id("messages")),
    isMainBranch: v.boolean(),
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
    createdAt: v.number(),
  })
    .index("by_conversation", ["conversationId"])
    .index("by_parent", ["parentId"]),

  apiKeys: defineTable({
    userId: v.id("users"),
    provider: v.string(),
    keyHash: v.string(),
    createdAt: v.number(),
  }).index("by_user_provider", ["userId", "provider"]),
});