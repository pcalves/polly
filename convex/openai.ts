import { v } from "convex/values";
import { action, ActionCtx } from "./_generated/server";
import { internal, api } from "./_generated/api";
import { Id } from "./_generated/dataModel";
import { streamText, CoreMessage, LanguageModel } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { createAnthropic } from "@ai-sdk/anthropic";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";

// Helper types
type StreamMessage = {
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
};

// Helper functions
const updateMessage = async (
  ctx: ActionCtx,
  messageId: Id<"messages">,
  updates: {
    content?: string;
    reasoning?: string;
    finishReason?: string;
    citations?: Array<{
      type: "url_citation";
      url: string;
      title: string;
      cited_text?: string;
      snippet?: string;
    }>;
  }
) => {
  await ctx.runMutation(internal.messages.internalUpdate, {
    id: messageId,
    content: updates.content,
    reasoning: updates.reasoning || undefined,
    metadata: updates.finishReason
      ? { finishReason: updates.finishReason }
      : undefined,
    citations: updates.citations?.length ? updates.citations : undefined,
  });
};

const clearConversationStreaming = async (
  ctx: ActionCtx,
  messageId: Id<"messages">
) => {
  const message = await ctx.runMutation(internal.messages.internalGetById, {
    id: messageId,
  });

  if (message?.conversationId) {
    await ctx.runMutation(api.conversations.setStreamingState, {
      id: message.conversationId,
      isStreaming: false,
    });
  }
};

// Helper to convert Convex storage attachments to data URLs
const convertConvexImageToDataUrl = async (
  ctx: ActionCtx,
  attachment: { storageId: Id<"_storage">; type: string }
): Promise<string> => {
  try {
    console.log("Converting Convex image to data URL:", attachment);

    const blob = await ctx.storage.get(attachment.storageId);
    if (!blob) {
      console.error("File not found in storage:", attachment.storageId);
      throw new Error("File not found in storage");
    }

    const arrayBuffer = await blob.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    let binaryString = "";
    for (let i = 0; i < uint8Array.length; i++) {
      binaryString += String.fromCharCode(uint8Array[i]);
    }
    const base64Data = btoa(binaryString);
    const mimeType = blob.type || "image/jpeg";

    console.log("Successfully converted image, MIME type:", mimeType);
    return `data:${mimeType};base64,${base64Data}`;
  } catch (error) {
    console.error("Error converting Convex image to data URL:", error);
    throw error;
  }
};

// Helper to convert Convex storage files to AI SDK file format
const convertConvexFileToAISDKFormat = async (
  ctx: ActionCtx,
  attachment: { storageId: Id<"_storage">; type: string; name: string }
): Promise<{ data: ArrayBuffer; mimeType: string }> => {
  try {
    console.log("Converting Convex file to AI SDK format:", attachment);

    const blob = await ctx.storage.get(attachment.storageId);
    if (!blob) {
      console.error("File not found in storage:", attachment.storageId);
      throw new Error("File not found in storage");
    }

    const arrayBuffer = await blob.arrayBuffer();
    const mimeType = blob.type || getMimeTypeFromFileType(attachment.type);

    console.log("Successfully converted file, MIME type:", mimeType);
    return { data: arrayBuffer, mimeType };
  } catch (error) {
    console.error("Error converting Convex file to AI SDK format:", error);
    throw error;
  }
};

// Helper to get MIME type from file type
const getMimeTypeFromFileType = (fileType: string): string => {
  switch (fileType) {
    case "pdf":
      return "application/pdf";
    case "text":
      return "text/plain";
    default:
      return "application/octet-stream";
  }
};

// Convert our message format to AI SDK format
const convertMessages = async (
  ctx: ActionCtx,
  messages: StreamMessage[],
  provider: string
): Promise<CoreMessage[]> => {
  return Promise.all(
    messages.map(async (msg): Promise<CoreMessage> => {
      if (typeof msg.content === "string") {
        return {
          role: msg.role,
          content: msg.content,
        } as CoreMessage;
      }

      // Handle multi-modal content
      const parts = await Promise.all(
        msg.content.map(async part => {
          if (part.type === "text") {
            return { type: "text" as const, text: part.text || "" };
          }

          if (part.type === "image_url" && part.image_url) {
            // Handle Convex storage attachments for all providers
            if (part.attachment?.storageId) {
              try {
                console.log(
                  `Converting Convex storage attachment to base64 for ${provider}:`,
                  part.attachment
                );
                const dataUrl = await convertConvexImageToDataUrl(
                  ctx,
                  part.attachment
                );
                return { type: "image" as const, image: dataUrl };
              } catch (error) {
                console.error(
                  "Failed to convert Convex attachment, falling back to URL:",
                  error
                );
                // Fall back to using the URL if data URL conversion fails
                return { type: "image" as const, image: part.image_url.url };
              }
            }

            // For regular URLs (non-Convex storage), use URL directly
            console.log(`Using image URL directly for provider ${provider}`);
            return { type: "image" as const, image: part.image_url.url };
          }

          if (part.type === "file" && part.file) {
            // Check if this is a Convex storage attachment for PDF and provider supports it
            if (
              part.attachment?.storageId &&
              part.attachment.type === "pdf" &&
              (provider === "anthropic" || provider === "google")
            ) {
              try {
                console.log(
                  `Converting Convex PDF to AI SDK format for ${provider}:`,
                  part.attachment
                );
                const { data, mimeType } = await convertConvexFileToAISDKFormat(
                  ctx,
                  part.attachment
                );
                return { type: "file" as const, data, mimeType };
              } catch (error) {
                console.error(
                  "Failed to convert Convex PDF, falling back to text:",
                  error
                );
                // Fall back to text format
                return {
                  type: "text" as const,
                  text: `File: ${part.file.filename}\n${part.file.file_data}`,
                };
              }
            }

            // For other files or fallback, use text format
            return {
              type: "text" as const,
              text: `File: ${part.file.filename}\n${part.file.file_data}`,
            };
          }

          return { type: "text" as const, text: "" };
        })
      );

      return {
        role: msg.role,
        content: parts,
      } as CoreMessage;
    })
  );
};

// Decrypt API key helper
const serverDecryptApiKey = async (
  encryptedKey: number[],
  initializationVector: number[]
): Promise<string> => {
  const ALGORITHM = { name: "AES-GCM", length: 256 };
  const encryptionSecret = process.env.API_KEY_ENCRYPTION_SECRET;
  if (!encryptionSecret) {
    throw new Error(
      "API_KEY_ENCRYPTION_SECRET environment variable is required"
    );
  }

  const encoder = new TextEncoder();
  const keyMaterial = encoder.encode(encryptionSecret);
  const hash = await crypto.subtle.digest("SHA-256", keyMaterial);
  const key = await crypto.subtle.importKey("raw", hash, ALGORITHM, false, [
    "encrypt",
    "decrypt",
  ]);

  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: new Uint8Array(initializationVector) },
    key,
    new Uint8Array(encryptedKey)
  );

  return new TextDecoder().decode(decrypted);
};

// Get environment API key
const getEnvironmentApiKey = (provider: string): string | null => {
  switch (provider) {
    case "openai":
      return process.env.OPENAI_API_KEY || null;
    case "anthropic":
      return process.env.ANTHROPIC_API_KEY || null;
    case "google":
      return process.env.GEMINI_API_KEY || null;
    case "openrouter":
      return process.env.OPENROUTER_API_KEY || null;
    default:
      return null;
  }
};

// Apply OpenRouter sorting shortcuts
const applyOpenRouterSorting = (
  modelId: string,
  sorting: "default" | "price" | "throughput" | "latency"
): string => {
  if (sorting === "default") {
    return modelId;
  }

  // Remove any existing shortcuts
  const cleanModelId = modelId.replace(/:nitro$|:floor$/g, "");

  // Apply new shortcut
  switch (sorting) {
    case "price":
      return `${cleanModelId}:floor`;
    case "throughput":
      return `${cleanModelId}:nitro`;
    default:
      return cleanModelId;
  }
};

// Main streaming action
export const streamResponse = action({
  args: {
    messages: v.array(
      v.object({
        role: v.union(
          v.literal("user"),
          v.literal("assistant"),
          v.literal("system")
        ),
        content: v.union(
          v.string(),
          v.array(
            v.object({
              type: v.union(
                v.literal("text"),
                v.literal("image_url"),
                v.literal("file")
              ),
              text: v.optional(v.string()),
              image_url: v.optional(v.object({ url: v.string() })),
              file: v.optional(
                v.object({ filename: v.string(), file_data: v.string() })
              ),
              attachment: v.optional(
                v.object({
                  storageId: v.id("_storage"),
                  type: v.string(),
                  name: v.string(),
                })
              ),
            })
          )
        ),
      })
    ),
    messageId: v.id("messages"),
    model: v.string(),
    provider: v.string(),
    userId: v.optional(v.id("users")),
    temperature: v.optional(v.number()),
    maxTokens: v.optional(v.number()),
    topP: v.optional(v.number()),
    frequencyPenalty: v.optional(v.number()),
    presencePenalty: v.optional(v.number()),
    enableWebSearch: v.optional(v.boolean()),
    webSearchMaxResults: v.optional(v.number()),
    enableReasoning: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    let abortController: AbortController | undefined;

    try {
      // Get API key
      let apiKey: string;

      if (args.userId) {
        // Authenticated user - get their API key directly
        const apiKeyRecord = await ctx.runQuery(
          internal.apiKeys.getEncryptedApiKeyData,
          {
            userId: args.userId,
            provider: args.provider as
              | "openai"
              | "anthropic"
              | "google"
              | "openrouter",
          }
        );

        if (apiKeyRecord?.encryptedKey && apiKeyRecord?.initializationVector) {
          apiKey = await serverDecryptApiKey(
            apiKeyRecord.encryptedKey,
            apiKeyRecord.initializationVector
          );
        } else {
          const envKey = getEnvironmentApiKey(args.provider);
          if (envKey) {
            apiKey = envKey;
          } else {
            throw new Error(
              `No API key found for ${args.provider}. Please add an API key in Settings.`
            );
          }
        }
      } else {
        // Anonymous user - only allow environment variables
        const envKey = getEnvironmentApiKey(args.provider);
        if (envKey) {
          apiKey = envKey;
        } else {
          throw new Error(
            `Authentication required. Please sign in to use ${args.provider} models.`
          );
        }
      }

      // Convert messages to AI SDK format
      const messages = await convertMessages(ctx, args.messages, args.provider);

      // Create provider instance based on provider type
      let model: LanguageModel;

      switch (args.provider) {
        case "openai": {
          const openai = createOpenAI({ apiKey });
          model = openai(args.model);
          break;
        }

        case "anthropic": {
          const anthropic = createAnthropic({ apiKey });
          model = anthropic(args.model);
          break;
        }

        case "google": {
          const google = createGoogleGenerativeAI({ apiKey });
          model = google(args.model);
          break;
        }

        case "openrouter": {
          const openrouter = createOpenRouter({ apiKey });

          // Get user's OpenRouter sorting preference
          let sorting: "default" | "price" | "throughput" | "latency" =
            "default";

          if (args.userId) {
            try {
              const userSettings = await ctx.runQuery(
                api.userSettings.getUserSettings,
                { userId: args.userId }
              );
              sorting = userSettings?.openRouterSorting ?? "default";
            } catch (error) {
              console.warn(
                "Failed to get user settings for OpenRouter sorting:",
                error
              );
            }
          }

          // Apply OpenRouter sorting shortcuts
          let modifiedModel = applyOpenRouterSorting(args.model, sorting);

          // Add web search if enabled
          if (args.enableWebSearch) {
            modifiedModel = `${modifiedModel}:online`;
          }

          model = openrouter.chat(modifiedModel);
          break;
        }

        default:
          throw new Error(`Unsupported provider: ${args.provider}`);
      }

      // Create abort controller for stopping
      abortController = new AbortController();

      // Stream the response
      const result = streamText({
        model,
        messages,
        temperature: args.temperature,
        maxTokens: args.maxTokens,
        topP: args.topP,
        frequencyPenalty: args.frequencyPenalty,
        presencePenalty: args.presencePenalty,
        abortSignal: abortController.signal,
        onFinish: async ({
          text,
          finishReason,
          reasoning,
          providerMetadata,
        }) => {
          // Extract reasoning if embedded in content
          let finalContent = text;
          let extractedReasoning = reasoning || "";

          if (!extractedReasoning) {
            const reasoningPatterns = [
              /<thinking>([\s\S]*?)<\/thinking>/,
              /<reasoning>([\s\S]*?)<\/reasoning>/,
              /^Thinking:\s*([\s\S]*?)(?:\n\n|$)/,
              /\[Reasoning\]([\s\S]*?)\[\/Reasoning\]/i,
            ];

            for (const pattern of reasoningPatterns) {
              const match = text.match(pattern);
              if (match) {
                extractedReasoning = match[1].trim();
                finalContent = text.replace(pattern, "").trim();
                break;
              }
            }
          }

          // Handle citations from provider metadata
          let citations:
            | Array<{
                type: "url_citation";
                url: string;
                title: string;
                cited_text?: string;
                snippet?: string;
              }>
            | undefined;

          // Handle OpenRouter citations
          const openrouterMetadata = providerMetadata as {
            openrouter?: {
              citations?: Array<{
                url: string;
                title?: string;
                text?: string;
                snippet?: string;
              }>;
            };
          };
          if (openrouterMetadata?.openrouter?.citations) {
            citations = openrouterMetadata.openrouter.citations.map(c => ({
              type: "url_citation" as const,
              url: c.url,
              title: c.title || "Web Source",
              cited_text: c.text,
              snippet: c.snippet,
            }));
          }

          // Handle Google search grounding citations
          const googleMetadata = providerMetadata as {
            google?: {
              groundingChunks?: Array<{
                web?: { uri?: string; title?: string };
                content?: string;
              }>;
            };
          };
          if (googleMetadata?.google?.groundingChunks) {
            citations = googleMetadata.google.groundingChunks.map(chunk => ({
              type: "url_citation" as const,
              url: chunk.web?.uri || "",
              title: chunk.web?.title || "Web Source",
              snippet: chunk.content,
            }));
          }

          // Final update with all data
          await updateMessage(ctx, args.messageId, {
            content: finalContent,
            reasoning: extractedReasoning || undefined,
            finishReason: finishReason || "stop",
            citations,
          });

          await clearConversationStreaming(ctx, args.messageId);
        },
      });

      // Handle streaming with batching to reduce write conflicts
      let hasStartedStreaming = false;
      let contentBuffer = "";
      let lastUpdate = Date.now();
      const BATCH_SIZE = 50; // Characters to batch before updating
      const BATCH_TIMEOUT = 100; // Max ms between updates

      const flushContentBuffer = async () => {
        if (contentBuffer.length > 0) {
          await ctx.runMutation(internal.messages.internalAppendContent, {
            id: args.messageId,
            contentChunk: contentBuffer,
          });
          contentBuffer = "";
          lastUpdate = Date.now();
        }
      };

      for await (const textPart of result.textStream) {
        // Check if stopped less frequently to reduce read conflicts
        if (Date.now() - lastUpdate > 500) {
          // Check every 500ms instead of every chunk
          const message = await ctx.runMutation(
            internal.messages.internalGetById,
            {
              id: args.messageId,
            }
          );
          if (message?.metadata?.stopped) {
            abortController?.abort();
            throw new Error("StoppedByUser");
          }
        }

        if (!hasStartedStreaming) {
          hasStartedStreaming = true;
          // Initialize with empty content to show streaming has started
          await ctx.runMutation(internal.messages.internalUpdate, {
            id: args.messageId,
            content: "",
          });
        }

        // Add to buffer
        contentBuffer += textPart;

        // Flush buffer if it's large enough or enough time has passed
        const timeSinceLastUpdate = Date.now() - lastUpdate;
        if (
          contentBuffer.length >= BATCH_SIZE ||
          timeSinceLastUpdate >= BATCH_TIMEOUT
        ) {
          await flushContentBuffer();
        }
      }

      // Flush any remaining content
      await flushContentBuffer();

      // Handle reasoning stream (if available for Anthropic models with thinking support)
      if (
        args.provider === "anthropic" &&
        (args.model.includes("claude-opus-4") ||
          args.model.includes("claude-sonnet-4") ||
          args.model.includes("claude-3-7-sonnet"))
      ) {
        try {
          const fullStream = result.fullStream;
          for await (const part of fullStream) {
            if (part.type === "reasoning") {
              await ctx.runMutation(internal.messages.internalAppendReasoning, {
                id: args.messageId,
                reasoningChunk: part.textDelta || "",
              });
            }
          }
        } catch {
          // Some models don't support reasoning, which is fine
          console.log("Reasoning stream not available for this model");
        }
      }
    } catch (error) {
      if (error instanceof Error && error.message === "StoppedByUser") return;

      await updateMessage(ctx, args.messageId, {
        content: `Error: ${error instanceof Error ? error.message : "Unknown error"}`,
        finishReason: "error",
      });
      await clearConversationStreaming(ctx, args.messageId);
      throw error;
    } finally {
      // Clean up abort controller
      abortController = undefined;
    }
  },
});

export const stopStreaming = action({
  args: { messageId: v.id("messages") },
  handler: async (ctx, args) => {
    await ctx.runMutation(internal.messages.internalUpdate, {
      id: args.messageId,
      metadata: { finishReason: "stop", stopped: true },
    });
    await clearConversationStreaming(ctx, args.messageId);
  },
});
