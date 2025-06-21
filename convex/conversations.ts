import { v } from "convex/values";
import { mutation, query, action, internalMutation } from "./_generated/server";
import { getOptionalUserId } from "./lib/auth";
import { api, internal } from "./_generated/api";
import { Id } from "./_generated/dataModel";
import { ActionCtx } from "./_generated/server";

export const create = mutation({
  args: {
    title: v.string(),
    userId: v.id("users"),
    personaId: v.optional(v.id("personas")),
    sourceConversationId: v.optional(v.id("conversations")),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db.insert("conversations", {
      title: args.title,
      userId: args.userId,
      personaId: args.personaId,
      sourceConversationId: args.sourceConversationId,
      isStreaming: true,
      createdAt: now,
      updatedAt: now,
    });
  },
});

// Internal mutation that batches all conversation creation operations
export const createWithMessages = internalMutation({
  args: {
    title: v.string(),
    userId: v.id("users"),
    personaId: v.optional(v.id("personas")),
    sourceConversationId: v.optional(v.id("conversations")),
    firstMessage: v.string(),
    personaPrompt: v.optional(v.string()),
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
          content: v.optional(v.string()),
          thumbnail: v.optional(v.string()),
          storageId: v.optional(v.id("_storage")),
        })
      )
    ),
    useWebSearch: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // Create conversation
    const conversationId = await ctx.db.insert("conversations", {
      title: args.title,
      userId: args.userId,
      personaId: args.personaId,
      sourceConversationId: args.sourceConversationId,
      isStreaming: true,
      createdAt: now,
      updatedAt: now,
    });

    // Create system message if persona prompt exists
    if (args.personaPrompt) {
      await ctx.db.insert("messages", {
        conversationId,
        role: "system",
        content: args.personaPrompt,
        isMainBranch: true,
        createdAt: now,
      });
    }

    // Create user message
    const userMessageId = await ctx.db.insert("messages", {
      conversationId,
      role: "user",
      content: args.firstMessage,
      attachments: args.attachments,
      useWebSearch: args.useWebSearch,
      isMainBranch: true,
      createdAt: now,
    });

    // Increment user's message count for limit tracking
    await ctx.runMutation(api.users.incrementMessageCount, {
      userId: args.userId,
    });

    // Create empty assistant message for streaming
    const assistantMessageId = await ctx.db.insert("messages", {
      conversationId,
      role: "assistant",
      content: "",
      isMainBranch: true,
      createdAt: now,
    });

    return {
      conversationId,
      userMessageId,
      assistantMessageId,
    };
  },
});

export const list = query({
  args: { userId: v.optional(v.id("users")) },
  handler: async (ctx, args) => {
    // Use provided userId or fall back to server-side auth
    const userId = args.userId || (await getOptionalUserId(ctx));

    if (!userId) {
      return [];
    }

    return await ctx.db
      .query("conversations")
      .withIndex("by_user", q => q.eq("userId", userId))
      .order("desc")
      .collect();
  },
});

export const get = query({
  args: { id: v.id("conversations") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const getAuthorized = query({
  args: {
    id: v.string(),
    userId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    try {
      // Attempt to use the string as a Convex ID
      // If it's not a valid ID format, ctx.db.get will handle it gracefully
      const conversationId = args.id as Id<"conversations">;
      const conversation = await ctx.db.get(conversationId);

      if (!conversation) {
        return null;
      }

      // Use provided userId or fall back to server-side auth
      const userId = args.userId || (await getOptionalUserId(ctx));

      // If no user is found (neither provided nor authenticated), deny access
      if (!userId) {
        return null;
      }

      // Check if the conversation belongs to the current user
      if (conversation.userId !== userId) {
        return null;
      }

      return conversation;
    } catch {
      // Invalid ID format or any other error - return null to trigger 404
      return null;
    }
  },
});

export const update = mutation({
  args: {
    id: v.string(),
    title: v.optional(v.string()),
    isStreaming: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    try {
      const conversationId = args.id as Id<"conversations">;
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { id, ...updates } = args;
      return await ctx.db.patch(conversationId, {
        ...updates,
        updatedAt: Date.now(),
      });
    } catch {
      throw new Error("Invalid conversation ID");
    }
  },
});

export const remove = mutation({
  args: { id: v.id("conversations") },
  handler: async (ctx, args) => {
    // Delete all messages in the conversation
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_conversation", q => q.eq("conversationId", args.id))
      .collect();

    for (const message of messages) {
      await ctx.db.delete(message._id);
    }

    // Delete the conversation
    return await ctx.db.delete(args.id);
  },
});

export const setStreamingState = mutation({
  args: {
    id: v.id("conversations"),
    isStreaming: v.boolean(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.patch(args.id, {
      isStreaming: args.isStreaming,
      updatedAt: Date.now(),
    });
  },
});

export const getForExport = query({
  args: { id: v.string() },
  handler: async (ctx, args) => {
    try {
      // Attempt to use the string as a Convex ID
      const conversationId = args.id as Id<"conversations">;
      const conversation = await ctx.db.get(conversationId);

      if (!conversation) {
        return null;
      }

      const messages = await ctx.db
        .query("messages")
        .withIndex("by_conversation", q =>
          q.eq("conversationId", conversationId)
        )
        .filter(q => q.eq(q.field("isMainBranch"), true))
        .order("asc")
        .collect();

      return {
        conversation,
        messages,
      };
    } catch {
      // Invalid ID format or any other error - return null
      return null;
    }
  },
});

// Simplified action for creating new conversations with immediate response
export const createNewConversation = action({
  args: {
    userId: v.optional(v.id("users")),
    firstMessage: v.string(),
    sourceConversationId: v.optional(v.id("conversations")),
    personaId: v.optional(v.id("personas")),
    personaPrompt: v.optional(v.string()),
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
          content: v.optional(v.string()),
          thumbnail: v.optional(v.string()),
          storageId: v.optional(v.id("_storage")),
        })
      )
    ),
    useWebSearch: v.optional(v.boolean()),
    generateTitle: v.optional(v.boolean()),
  },
  handler: async (
    ctx,
    args
  ): Promise<{
    conversationId: Id<"conversations">;
    userId: Id<"users">;
    isNewUser: boolean;
  }> => {
    let actualUserId: Id<"users">;

    // Create user if needed
    if (!args.userId) {
      actualUserId = await ctx.runMutation(api.users.createAnonymous);
    } else {
      actualUserId = args.userId;
    }

    // Enforce message limit for anonymous users
    await ctx.runMutation(api.users.enforceMessageLimit, {
      userId: actualUserId,
    });

    // Batch create conversation and messages in single internal mutation
    const result: {
      conversationId: Id<"conversations">;
      userMessageId: Id<"messages">;
      assistantMessageId: Id<"messages">;
    } = await ctx.runMutation(internal.conversations.createWithMessages, {
      title: "New conversation",
      userId: actualUserId,
      personaId: args.personaId,
      sourceConversationId: args.sourceConversationId,
      firstMessage: args.firstMessage,
      personaPrompt: args.personaPrompt,
      attachments: args.attachments,
      useWebSearch: args.useWebSearch,
    });

    // Get user's selected model
    const selectedModel = await ctx.runQuery(
      api.userModels.getUserSelectedModel
    );
    if (!selectedModel) {
      throw new Error("No model selected. Please select a model in Settings.");
    }

    // Build context messages for AI response
    const contextMessages: Array<{
      role: "user" | "assistant" | "system";
      content:
        | string
        | Array<{
            type: "text" | "image_url" | "file";
            text?: string;
            image_url?: { url: string };
            file?: { filename: string; file_data: string };
            attachment?: {
              storageId: Id<"_storage">;
              type: string;
              name: string;
            };
          }>;
    }> = [];

    // Add system message if persona prompt exists
    if (args.personaPrompt) {
      contextMessages.push({
        role: "system",
        content: args.personaPrompt,
      });
    }

    // Add user message with attachments
    if (args.attachments?.length) {
      const contentParts: Array<{
        type: "text" | "image_url" | "file";
        text?: string;
        image_url?: { url: string };
        file?: { filename: string; file_data: string };
        attachment?: {
          storageId: Id<"_storage">;
          type: string;
          name: string;
        };
      }> = [{ type: "text", text: args.firstMessage }];

      for (const attachment of args.attachments) {
        if (attachment.type === "image") {
          contentParts.push({
            type: "image_url",
            image_url: { url: attachment.url },
            // Include attachment metadata for Convex storage optimization
            attachment: attachment.storageId
              ? {
                  storageId: attachment.storageId,
                  type: attachment.type,
                  name: attachment.name,
                }
              : undefined,
          });
        } else if (attachment.type === "text" || attachment.type === "pdf") {
          contentParts.push({
            type: "file",
            file: {
              filename: attachment.name,
              file_data: attachment.content || "",
            },
            // Include attachment metadata for Convex storage optimization
            attachment: attachment.storageId
              ? {
                  storageId: attachment.storageId,
                  type: attachment.type,
                  name: attachment.name,
                }
              : undefined,
          });
        }
      }

      contextMessages.push({
        role: "user",
        content: contentParts,
      });
    } else {
      contextMessages.push({
        role: "user",
        content: args.firstMessage,
      });
    }

    // Schedule AI response
    await ctx.scheduler.runAfter(0, api.openai.streamResponse, {
      messages: contextMessages,
      messageId: result.assistantMessageId,
      model: selectedModel.modelId,
      provider: selectedModel.provider,
      userId: actualUserId,
      temperature: 0.7,
      enableWebSearch: args.useWebSearch,
      webSearchMaxResults: 3,
    });

    // Schedule title generation if requested
    if (args.generateTitle !== false) {
      await ctx.scheduler.runAfter(100, api.titleGeneration.generateTitle, {
        conversationId: result.conversationId,
        message: args.firstMessage,
      });
    }

    return {
      conversationId: result.conversationId,
      userId: actualUserId,
      isNewUser: !args.userId,
    };
  },
});

export const getOrCreateUser = action({
  args: {
    userId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    // If we have a userId, verify it exists
    if (args.userId) {
      const user = await ctx.runQuery(api.users.getById, { id: args.userId });
      if (user) {
        return {
          userId: args.userId,
          isNewUser: false,
        };
      }
    }

    // No valid user, create a new anonymous user
    const newUserId: Id<"users"> = await ctx.runMutation(
      api.users.createAnonymous
    );
    return {
      userId: newUserId,
      isNewUser: true,
    };
  },
});

export const sendFollowUpMessage = action({
  args: {
    conversationId: v.id("conversations"),
    content: v.string(),
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
          content: v.optional(v.string()),
          thumbnail: v.optional(v.string()),
          storageId: v.optional(v.id("_storage")),
        })
      )
    ),
    useWebSearch: v.optional(v.boolean()),
    model: v.string(),
    provider: v.string(),
  },
  handler: async (
    ctx,
    args
  ): Promise<{
    userMessageId: Id<"messages">;
    assistantMessageId: Id<"messages">;
  }> => {
    // Validate conversation exists
    const conversation = await ctx.runQuery(api.conversations.get, {
      id: args.conversationId,
    });

    if (!conversation) {
      throw new Error("Conversation not found");
    }

    // Enforce message limit for anonymous users
    await ctx.runMutation(api.users.enforceMessageLimit, {
      userId: conversation.userId,
    });

    // Get API key for the provider
    const apiKey = await ctx.runAction(api.apiKeys.getDecryptedApiKey, {
      provider: args.provider as
        | "openai"
        | "anthropic"
        | "google"
        | "openrouter",
    });

    if (!apiKey) {
      throw new Error(
        `No API key found for ${args.provider}. Please add an API key in Settings.`
      );
    }

    try {
      // Set conversation streaming state
      await ctx.runMutation(api.conversations.setStreamingState, {
        id: args.conversationId,
        isStreaming: true,
      });

      // Add user message
      const userMessageId = await ctx.runMutation(api.messages.create, {
        conversationId: args.conversationId,
        role: "user",
        content: args.content,
        attachments: args.attachments,
        useWebSearch: args.useWebSearch,
        isMainBranch: true,
      });

      // Increment user's message count for limit tracking
      await ctx.runMutation(api.users.incrementMessageCount, {
        userId: conversation.userId,
      });

      // Get all messages for context
      const messages = await ctx.runQuery(api.messages.list, {
        conversationId: args.conversationId,
      });

      // Get persona prompt if conversation has a persona
      let personaPrompt: string | null = null;
      if (conversation.personaId) {
        const persona = await ctx.runQuery(api.personas.get, {
          id: conversation.personaId,
        });
        personaPrompt = persona?.prompt || null;
      }

      // Resolve attachment URLs for messages with storageIds
      const messagesWithResolvedUrls = await Promise.all(
        messages.map(async msg => {
          if (msg.attachments && msg.attachments.length > 0) {
            const resolvedAttachments = await resolveAttachmentUrls(
              ctx,
              msg.attachments
            );
            return {
              ...msg,
              attachments: resolvedAttachments,
            };
          }
          return msg;
        })
      );

      // Build context messages for the API
      const contextMessages = messagesWithResolvedUrls
        .filter(msg => msg.role !== "context") // Skip context messages
        .map(msg => {
          if (msg.role === "system") {
            return {
              role: "system" as const,
              content: msg.content,
            };
          }

          if (msg.role === "user") {
            if (msg.attachments && msg.attachments.length > 0) {
              const content = [
                { type: "text" as const, text: msg.content },
                ...msg.attachments.map(attachment => {
                  if (attachment.type === "image") {
                    return {
                      type: "image_url" as const,
                      image_url: { url: attachment.url },
                      // Include attachment metadata for Convex storage optimization
                      attachment: attachment.storageId
                        ? {
                            storageId: attachment.storageId,
                            type: attachment.type,
                            name: attachment.name,
                          }
                        : undefined,
                    };
                  } else if (
                    attachment.type === "pdf" ||
                    attachment.type === "text"
                  ) {
                    return {
                      type: "file" as const,
                      file: {
                        filename: attachment.name,
                        file_data: attachment.content || "",
                      },
                    };
                  }
                  return {
                    type: "text" as const,
                    text: `[${attachment.name}]`,
                  };
                }),
              ];
              return {
                role: "user" as const,
                content,
              };
            }
            return {
              role: "user" as const,
              content: msg.content,
            };
          }

          if (msg.role === "assistant") {
            return {
              role: "assistant" as const,
              content: msg.content,
            };
          }

          return undefined;
        })
        .filter(msg => msg !== undefined);

      // Add persona prompt as system message if it exists and no system message is present
      if (
        personaPrompt &&
        !contextMessages.some(msg => msg.role === "system")
      ) {
        contextMessages.unshift({
          role: "system",
          content: personaPrompt,
        });
      }

      // Create assistant message for streaming
      const assistantMessageId = await ctx.runMutation(api.messages.create, {
        conversationId: args.conversationId,
        role: "assistant",
        content: "",
        model: args.model,
        provider: args.provider,
        isMainBranch: true,
      });

      // Start streaming response
      await ctx.runAction(api.openai.streamResponse, {
        messages: contextMessages,
        messageId: assistantMessageId,
        model: args.model,
        provider: args.provider,
        userId: conversation.userId,
        temperature: 0.7,
        enableWebSearch: args.useWebSearch,
        webSearchMaxResults: 3,
      });

      return {
        userMessageId,
        assistantMessageId,
      };
    } catch (error) {
      // Clear streaming state on error
      await ctx.runMutation(api.conversations.setStreamingState, {
        id: args.conversationId,
        isStreaming: false,
      });
      throw error;
    }
  },
});

export const retryFromMessage = action({
  args: {
    conversationId: v.id("conversations"),
    messageId: v.id("messages"),
    retryType: v.union(v.literal("user"), v.literal("assistant")),
    model: v.string(),
    provider: v.string(),
  },
  handler: async (
    ctx,
    args
  ): Promise<{ assistantMessageId: Id<"messages"> }> => {
    // Validate conversation exists
    const conversation = await ctx.runQuery(api.conversations.get, {
      id: args.conversationId,
    });

    if (!conversation) {
      throw new Error("Conversation not found");
    }

    // Enforce message limit for anonymous users (retrying counts as sending a new message)
    await ctx.runMutation(api.users.enforceMessageLimit, {
      userId: conversation.userId,
    });

    // Get API key for the provider
    const apiKey = await ctx.runAction(api.apiKeys.getDecryptedApiKey, {
      provider: args.provider as
        | "openai"
        | "anthropic"
        | "google"
        | "openrouter",
    });

    if (!apiKey) {
      throw new Error(
        `No API key found for ${args.provider}. Please add an API key in Settings.`
      );
    }

    try {
      // Set conversation streaming state
      await ctx.runMutation(api.conversations.setStreamingState, {
        id: args.conversationId,
        isStreaming: true,
      });

      // Get all messages for the conversation
      const messages = await ctx.runQuery(api.messages.list, {
        conversationId: args.conversationId,
      });

      // Find the target message
      const messageIndex = messages.findIndex(
        msg => msg._id === args.messageId
      );
      if (messageIndex === -1) {
        throw new Error("Message not found");
      }

      let contextEndIndex: number;

      if (args.retryType === "user") {
        // Retry from user message - include the user message and regenerate assistant response
        contextEndIndex = messageIndex;
      } else {
        // Retry from assistant message - go back to previous user message
        const previousUserMessageIndex = messageIndex - 1;
        const previousUserMessage = messages[previousUserMessageIndex];

        if (!previousUserMessage || previousUserMessage.role !== "user") {
          throw new Error("Cannot find previous user message to retry from");
        }

        contextEndIndex = previousUserMessageIndex;
      }

      // Delete messages after the context end point
      const messagesToDelete = messages.slice(contextEndIndex + 1);
      for (const msg of messagesToDelete) {
        await ctx.runMutation(api.messages.remove, { id: msg._id });
      }

      // Resolve attachment URLs for context messages
      const contextMessagesSlice = messages.slice(0, contextEndIndex + 1);
      const contextMessagesWithResolvedUrls = await Promise.all(
        contextMessagesSlice.map(async msg => {
          if (msg.attachments && msg.attachments.length > 0) {
            const resolvedAttachments = await resolveAttachmentUrls(
              ctx,
              msg.attachments
            );
            return {
              ...msg,
              attachments: resolvedAttachments,
            };
          }
          return msg;
        })
      );

      // Get the context messages up to the retry point
      const contextMessages = contextMessagesWithResolvedUrls
        .filter(msg => msg.role !== "context")
        .map(msg => {
          if (msg.role === "system") {
            return {
              role: "system" as const,
              content: msg.content,
            };
          }

          if (msg.role === "user") {
            if (msg.attachments && msg.attachments.length > 0) {
              const content = [
                { type: "text" as const, text: msg.content },
                ...msg.attachments.map(attachment => {
                  if (attachment.type === "image") {
                    return {
                      type: "image_url" as const,
                      image_url: { url: attachment.url },
                      // Include attachment metadata for Convex storage optimization
                      attachment: attachment.storageId
                        ? {
                            storageId: attachment.storageId,
                            type: attachment.type,
                            name: attachment.name,
                          }
                        : undefined,
                    };
                  } else if (
                    attachment.type === "pdf" ||
                    attachment.type === "text"
                  ) {
                    return {
                      type: "file" as const,
                      file: {
                        filename: attachment.name,
                        file_data: attachment.content || "",
                      },
                    };
                  }
                  return {
                    type: "text" as const,
                    text: `[${attachment.name}]`,
                  };
                }),
              ];
              return {
                role: "user" as const,
                content,
              };
            }
            return {
              role: "user" as const,
              content: msg.content,
            };
          }

          if (msg.role === "assistant") {
            return {
              role: "assistant" as const,
              content: msg.content,
            };
          }

          return undefined;
        })
        .filter(msg => msg !== undefined);

      // Get persona prompt if conversation has a persona
      let personaPrompt: string | null = null;
      if (conversation.personaId) {
        const persona = await ctx.runQuery(api.personas.get, {
          id: conversation.personaId,
        });
        personaPrompt = persona?.prompt || null;
      }

      // Add persona prompt as system message if it exists and no system message is present
      if (
        personaPrompt &&
        !contextMessages.some(msg => msg.role === "system")
      ) {
        contextMessages.unshift({
          role: "system",
          content: personaPrompt,
        });
      }

      // Create assistant message for streaming
      const assistantMessageId = await ctx.runMutation(api.messages.create, {
        conversationId: args.conversationId,
        role: "assistant",
        content: "",
        model: args.model,
        provider: args.provider,
        isMainBranch: true,
      });

      // Start streaming response
      await ctx.runAction(api.openai.streamResponse, {
        messages: contextMessages,
        messageId: assistantMessageId,
        model: args.model,
        provider: args.provider,
        userId: conversation.userId,
        temperature: 0.7,
        enableWebSearch: false, // Don't use web search for retries
        webSearchMaxResults: 3,
      });

      return {
        assistantMessageId,
      };
    } catch (error) {
      // Clear streaming state on error
      await ctx.runMutation(api.conversations.setStreamingState, {
        id: args.conversationId,
        isStreaming: false,
      });
      throw error;
    }
  },
});

export const editMessage = action({
  args: {
    conversationId: v.id("conversations"),
    messageId: v.id("messages"),
    newContent: v.string(),
    model: v.string(),
    provider: v.string(),
  },
  handler: async (
    ctx,
    args
  ): Promise<{ assistantMessageId: Id<"messages"> }> => {
    // Validate conversation exists
    const conversation = await ctx.runQuery(api.conversations.get, {
      id: args.conversationId,
    });

    if (!conversation) {
      throw new Error("Conversation not found");
    }

    // Enforce message limit for anonymous users (editing counts as sending a new message)
    await ctx.runMutation(api.users.enforceMessageLimit, {
      userId: conversation.userId,
    });

    // Get API key for the provider
    const apiKey = await ctx.runAction(api.apiKeys.getDecryptedApiKey, {
      provider: args.provider as
        | "openai"
        | "anthropic"
        | "google"
        | "openrouter",
    });

    if (!apiKey) {
      throw new Error(
        `No API key found for ${args.provider}. Please add an API key in Settings.`
      );
    }

    try {
      // Set conversation streaming state
      await ctx.runMutation(api.conversations.setStreamingState, {
        id: args.conversationId,
        isStreaming: true,
      });

      // Get all messages for the conversation
      const messages = await ctx.runQuery(api.messages.list, {
        conversationId: args.conversationId,
      });

      // Find the target message and validate it's a user message
      const messageIndex = messages.findIndex(
        msg => msg._id === args.messageId
      );
      if (messageIndex === -1) {
        throw new Error("Message not found");
      }

      const targetMessage = messages[messageIndex];
      if (targetMessage.role !== "user") {
        throw new Error("Can only edit user messages");
      }

      // Update the message content
      await ctx.runMutation(api.messages.update, {
        id: args.messageId,
        content: args.newContent,
      });

      // Increment user's message count for limit tracking (editing counts as sending)
      await ctx.runMutation(api.users.incrementMessageCount, {
        userId: conversation.userId,
      });

      // Delete all messages after the edited message
      const messagesToDelete = messages.slice(messageIndex + 1);
      for (const msg of messagesToDelete) {
        await ctx.runMutation(api.messages.remove, { id: msg._id });
      }

      // Get the updated messages for context (including the edited message)
      const updatedMessages = await ctx.runQuery(api.messages.list, {
        conversationId: args.conversationId,
      });

      // Resolve attachment URLs for updated messages
      const updatedMessagesWithResolvedUrls = await Promise.all(
        updatedMessages.map(async msg => {
          if (msg.attachments && msg.attachments.length > 0) {
            const resolvedAttachments = await resolveAttachmentUrls(
              ctx,
              msg.attachments
            );
            return {
              ...msg,
              attachments: resolvedAttachments,
            };
          }
          return msg;
        })
      );

      // Build context messages
      const contextMessages = updatedMessagesWithResolvedUrls
        .filter(msg => msg.role !== "context")
        .map(msg => {
          if (msg.role === "system") {
            return {
              role: "system" as const,
              content: msg.content,
            };
          }

          if (msg.role === "user") {
            if (msg.attachments && msg.attachments.length > 0) {
              const content = [
                { type: "text" as const, text: msg.content },
                ...msg.attachments.map(attachment => {
                  if (attachment.type === "image") {
                    return {
                      type: "image_url" as const,
                      image_url: { url: attachment.url },
                      // Include attachment metadata for Convex storage optimization
                      attachment: attachment.storageId
                        ? {
                            storageId: attachment.storageId,
                            type: attachment.type,
                            name: attachment.name,
                          }
                        : undefined,
                    };
                  } else if (
                    attachment.type === "pdf" ||
                    attachment.type === "text"
                  ) {
                    return {
                      type: "file" as const,
                      file: {
                        filename: attachment.name,
                        file_data: attachment.content || "",
                      },
                    };
                  }
                  return {
                    type: "text" as const,
                    text: `[${attachment.name}]`,
                  };
                }),
              ];
              return {
                role: "user" as const,
                content,
              };
            }
            return {
              role: "user" as const,
              content: msg.content,
            };
          }

          if (msg.role === "assistant") {
            return {
              role: "assistant" as const,
              content: msg.content,
            };
          }

          return undefined;
        })
        .filter(msg => msg !== undefined);

      // Get persona prompt if conversation has a persona
      let personaPrompt: string | null = null;
      if (conversation.personaId) {
        const persona = await ctx.runQuery(api.personas.get, {
          id: conversation.personaId,
        });
        personaPrompt = persona?.prompt || null;
      }

      // Add persona prompt as system message if it exists and no system message is present
      if (
        personaPrompt &&
        !contextMessages.some(msg => msg.role === "system")
      ) {
        contextMessages.unshift({
          role: "system",
          content: personaPrompt,
        });
      }

      // Create assistant message for streaming
      const assistantMessageId = await ctx.runMutation(api.messages.create, {
        conversationId: args.conversationId,
        role: "assistant",
        content: "",
        model: args.model,
        provider: args.provider,
        isMainBranch: true,
      });

      // Start streaming response
      await ctx.runAction(api.openai.streamResponse, {
        messages: contextMessages,
        messageId: assistantMessageId,
        model: args.model,
        provider: args.provider,
        userId: conversation.userId,
        temperature: 0.7,
        enableWebSearch: false, // Don't use web search for edits
        webSearchMaxResults: 3,
      });

      return {
        assistantMessageId,
      };
    } catch (error) {
      // Clear streaming state on error
      await ctx.runMutation(api.conversations.setStreamingState, {
        id: args.conversationId,
        isStreaming: false,
      });
      throw error;
    }
  },
});

export const stopGeneration = action({
  args: {
    conversationId: v.id("conversations"),
  },
  handler: async (ctx, args): Promise<{ stopped: boolean }> => {
    try {
      // Get all messages for the conversation to find the currently streaming one
      const messages = await ctx.runQuery(api.messages.list, {
        conversationId: args.conversationId,
      });

      // Find the most recent assistant message that might be streaming
      // This would be an assistant message with empty or partial content
      const streamingMessage = messages
        .filter(msg => msg.role === "assistant")
        .reverse() // Start from the most recent
        .find(msg => !msg.metadata?.finishReason); // No finish reason means it's still streaming

      if (streamingMessage) {
        // Stop the streaming for this specific message
        await ctx.runAction(api.openai.stopStreaming, {
          messageId: streamingMessage._id,
        });
      }

      // Always clear the conversation streaming state
      await ctx.runMutation(api.conversations.setStreamingState, {
        id: args.conversationId,
        isStreaming: false,
      });

      return {
        stopped: true,
      };
    } catch (error) {
      console.error("Failed to stop generation:", error);

      // Still try to clear streaming state even if stopping failed
      try {
        await ctx.runMutation(api.conversations.setStreamingState, {
          id: args.conversationId,
          isStreaming: false,
        });
      } catch (clearError) {
        console.error("Failed to clear streaming state:", clearError);
      }

      throw error;
    }
  },
});

export const resumeConversation = action({
  args: {
    conversationId: v.id("conversations"),
  },
  handler: async (ctx, args): Promise<{ resumed: boolean }> => {
    // Get all messages for the conversation
    const messages = await ctx.runQuery(api.messages.list, {
      conversationId: args.conversationId,
    });

    if (!messages.length) {
      return { resumed: false };
    }

    // Check if the last message is a user message (indicating an interrupted conversation)
    const lastMessage = messages[messages.length - 1];
    if (lastMessage.role !== "user") {
      return { resumed: false };
    }

    // Check if there's already a response being generated
    const hasStreamingMessage = messages
      .filter(msg => msg.role === "assistant")
      .some(msg => !msg.metadata?.finishReason);

    if (hasStreamingMessage) {
      return { resumed: false };
    }

    // Get the persona for this conversation if it exists
    const conversation = await ctx.runQuery(api.conversations.get, {
      id: args.conversationId,
    });

    let personaPrompt: string | null = null;
    if (conversation?.personaId) {
      const persona = await ctx.runQuery(api.personas.get, {
        id: conversation.personaId,
      });
      personaPrompt = persona?.prompt || null;
    }

    // Prepare context messages
    const contextMessages = messages
      .filter(msg => msg.role !== "context")
      .map(msg => ({
        role: msg.role as "user" | "assistant" | "system",
        content: msg.attachments?.length
          ? [
              { type: "text" as const, text: msg.content },
              ...msg.attachments.map(attachment => ({
                type: "file" as const,
                file: {
                  filename: attachment.name,
                  file_data: attachment.storageId || "",
                },
              })),
            ]
          : msg.content,
      }));

    // Add persona prompt as system message if available
    const finalContextMessages = personaPrompt
      ? [
          { role: "system" as const, content: personaPrompt },
          ...contextMessages,
        ]
      : contextMessages;

    // Get user's selected model
    const userId = conversation?.userId;
    if (!userId) {
      throw new Error("No user found for conversation");
    }

    const userModel = await ctx.runQuery(api.userModels.getUserSelectedModel);

    if (!userModel) {
      throw new Error("No model selected for user");
    }

    // Set conversation to streaming state
    await ctx.runMutation(api.conversations.setStreamingState, {
      id: args.conversationId,
      isStreaming: true,
    });

    // Create assistant message and start streaming
    const assistantMessageId = await ctx.runMutation(api.messages.create, {
      conversationId: args.conversationId,
      role: "assistant",
      content: "",
      model: userModel.modelId,
      provider: userModel.provider,
      isMainBranch: true,
    });

    // Start streaming response
    await ctx.runAction(api.openai.streamResponse, {
      messages: finalContextMessages,
      messageId: assistantMessageId,
      model: userModel.modelId,
      provider: userModel.provider,
      userId: userId,
      temperature: 0.7,
      enableWebSearch: lastMessage.useWebSearch || false,
      webSearchMaxResults: 3,
    });

    return { resumed: true };
  },
});

// Helper function to resolve attachment URLs from storage IDs
const resolveAttachmentUrls = async (
  ctx: ActionCtx,
  attachments: Array<{
    type: "image" | "pdf" | "text";
    url: string;
    name: string;
    size: number;
    content?: string;
    thumbnail?: string;
    storageId?: Id<"_storage">;
  }>
) => {
  return await Promise.all(
    attachments.map(async attachment => {
      if (attachment.storageId) {
        const url = await ctx.storage.getUrl(attachment.storageId);
        return {
          ...attachment,
          url: url || attachment.url, // Fallback to original URL if getUrl fails
        };
      }
      return attachment;
    })
  );
};
