import { mutation, query, action, internalQuery } from "./_generated/server";
import { v } from "convex/values";
import { requireAuth, getOptionalUserId } from "./lib/auth";
import { internal, api } from "./_generated/api";

// Server-side encryption for operations that need server access
const ALGORITHM = { name: "AES-GCM", length: 256 };

async function getServerEncryptionKey(): Promise<CryptoKey> {
  const encryptionSecret = process.env.API_KEY_ENCRYPTION_SECRET;
  if (!encryptionSecret) {
    throw new Error(
      "API_KEY_ENCRYPTION_SECRET environment variable is required"
    );
  }

  const encoder = new TextEncoder();
  const keyMaterial = encoder.encode(encryptionSecret);
  const hash = await crypto.subtle.digest("SHA-256", keyMaterial);

  return await crypto.subtle.importKey("raw", hash, ALGORITHM, false, [
    "encrypt",
    "decrypt",
  ]);
}

async function serverEncryptApiKey(rawKey: string): Promise<{
  encryptedKey: number[];
  initializationVector: number[];
}> {
  const key = await getServerEncryptionKey();
  const initializationVector = crypto.getRandomValues(new Uint8Array(12));

  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv: initializationVector },
    key,
    new TextEncoder().encode(rawKey)
  );

  return {
    encryptedKey: Array.from(new Uint8Array(encrypted)),
    initializationVector: Array.from(initializationVector),
  };
}

async function serverDecryptApiKey(
  encryptedKey: number[],
  initializationVector: number[]
): Promise<string> {
  const key = await getServerEncryptionKey();

  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: new Uint8Array(initializationVector) },
    key,
    new Uint8Array(encryptedKey)
  );

  return new TextDecoder().decode(decrypted);
}

function createPartialKey(key: string): string {
  if (!key) return "";
  if (key.length <= 8) return "•".repeat(key.length);
  return key.substring(0, 4) + "..." + key.substring(key.length - 4);
}

function validateApiKeyFormat(provider: string, key: string): boolean {
  if (!key || typeof key !== "string") return false;

  switch (provider) {
    case "openai":
      return key.startsWith("sk-") && key.length > 20;
    case "anthropic":
      return key.startsWith("sk-ant-") && key.length > 20;
    case "google":
      return key.length > 20;
    case "openrouter":
      return key.startsWith("sk-or-") && key.length > 20;
    default:
      return false;
  }
}

// Store API key with server-side encryption (for server operations)
export const storeApiKey = mutation({
  args: {
    provider: v.union(
      v.literal("openai"),
      v.literal("anthropic"),
      v.literal("google"),
      v.literal("openrouter")
    ),
    rawKey: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx);

    if (!validateApiKeyFormat(args.provider, args.rawKey)) {
      throw new Error(`Invalid API key format for ${args.provider}`);
    }

    const { encryptedKey, initializationVector } = await serverEncryptApiKey(
      args.rawKey
    );
    const partialKey = createPartialKey(args.rawKey);

    const existing = await ctx.db
      .query("userApiKeys")
      .withIndex("by_user_provider", q =>
        q.eq("userId", userId).eq("provider", args.provider)
      )
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, {
        encryptedKey,
        initializationVector,
        partialKey,
        isValid: false,
        lastValidated: undefined,
      });
    } else {
      await ctx.db.insert("userApiKeys", {
        userId,
        provider: args.provider,
        encryptedKey,
        initializationVector,
        partialKey,
        isValid: false,
        createdAt: Date.now(),
      });
    }
  },
});

// Store client-encrypted API key (end-to-end encryption like Whisper app)
export const storeClientEncryptedApiKey = mutation({
  args: {
    provider: v.union(
      v.literal("openai"),
      v.literal("anthropic"),
      v.literal("google"),
      v.literal("openrouter")
    ),
    encryptedKey: v.string(), // Client-encrypted using CryptoJS or Web Crypto API
    partialKey: v.string(), // For display purposes
  },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx);

    const existing = await ctx.db
      .query("userApiKeys")
      .withIndex("by_user_provider", q =>
        q.eq("userId", userId).eq("provider", args.provider)
      )
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, {
        clientEncryptedKey: args.encryptedKey,
        partialKey: args.partialKey,
        isValid: false,
        lastValidated: undefined,
      });
    } else {
      await ctx.db.insert("userApiKeys", {
        userId,
        provider: args.provider,
        clientEncryptedKey: args.encryptedKey,
        partialKey: args.partialKey,
        isValid: false,
        createdAt: Date.now(),
      });
    }
  },
});

export const getUserApiKeys = query({
  args: {},
  handler: async ctx => {
    const userId = await getOptionalUserId(ctx);

    if (!userId) {
      return [];
    }

    const apiKeys = await ctx.db
      .query("userApiKeys")
      .withIndex("by_user", q => q.eq("userId", userId))
      .collect();

    // Return display info without exposing any encrypted data
    return apiKeys.map(key => ({
      provider: key.provider,
      isValid: key.isValid,
      hasKey: !!(key.encryptedKey || key.clientEncryptedKey),
      partialKey: key.partialKey,
      createdAt: key.createdAt,
      encryptionType: key.encryptedKey ? "server" : "client", // Indicate encryption type
    }));
  },
});

export const removeApiKey = mutation({
  args: {
    provider: v.union(
      v.literal("openai"),
      v.literal("anthropic"),
      v.literal("google"),
      v.literal("openrouter")
    ),
  },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx);

    const apiKey = await ctx.db
      .query("userApiKeys")
      .withIndex("by_user_provider", q =>
        q.eq("userId", userId).eq("provider", args.provider)
      )
      .unique();

    if (apiKey) {
      await ctx.db.delete(apiKey._id);
    }
  },
});

export const validateApiKey = mutation({
  args: {
    provider: v.union(
      v.literal("openai"),
      v.literal("anthropic"),
      v.literal("google"),
      v.literal("openrouter")
    ),
    isValid: v.boolean(),
  },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx);

    const apiKey = await ctx.db
      .query("userApiKeys")
      .withIndex("by_user_provider", q =>
        q.eq("userId", userId).eq("provider", args.provider)
      )
      .unique();

    if (apiKey) {
      await ctx.db.patch(apiKey._id, {
        isValid: args.isValid,
        lastValidated: Date.now(),
      });
    }
  },
});

export const hasAnyApiKey = query({
  args: {},
  handler: async ctx => {
    const userId = await getOptionalUserId(ctx);

    if (!userId) {
      // For anonymous users, check if any environment API keys are available
      return hasEnvironmentApiKeys();
    }

    const apiKeys = await ctx.db
      .query("userApiKeys")
      .withIndex("by_user", q => q.eq("userId", userId))
      .collect();

    // If user has stored API keys, return true
    if (apiKeys.length > 0) {
      return true;
    }

    // If no stored API keys, fall back to checking environment variables
    return hasEnvironmentApiKeys();
  },
});

// Helper function to check if any environment API keys are available
function hasEnvironmentApiKeys(): boolean {
  return !!(
    process.env.OPENAI_API_KEY ||
    process.env.ANTHROPIC_API_KEY ||
    process.env.GEMINI_API_KEY ||
    process.env.OPENROUTER_API_KEY
  );
}

// Server-side function to get decrypted API key for server operations
export const getDecryptedApiKey = action({
  args: {
    provider: v.union(
      v.literal("openai"),
      v.literal("anthropic"),
      v.literal("google"),
      v.literal("openrouter")
    ),
  },
  handler: async (ctx, args): Promise<string | null> => {
    // First try to get authenticated user - this is the correct pattern for actions
    const authenticatedUser = await ctx.runQuery(api.users.current);

    if (!authenticatedUser) {
      return getEnvironmentApiKey(args.provider);
    }

    const apiKeyRecord = await ctx.runQuery(
      internal.apiKeys.getEncryptedApiKeyData,
      {
        userId: authenticatedUser._id,
        provider: args.provider,
      }
    );

    if (
      !apiKeyRecord ||
      !apiKeyRecord.encryptedKey ||
      !apiKeyRecord.initializationVector
    ) {
      return getEnvironmentApiKey(args.provider);
    }

    try {
      const decryptedKey = await serverDecryptApiKey(
        apiKeyRecord.encryptedKey,
        apiKeyRecord.initializationVector
      );
      return decryptedKey;
    } catch {
      // Fall back to environment variables on decryption error
      return getEnvironmentApiKey(args.provider);
    }
  },
});

// Helper function to get API key from environment variables
function getEnvironmentApiKey(provider: string): string | null {
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
}

// Get client-encrypted key for client-side decryption (like Whisper pattern)
export const getClientEncryptedApiKey = query({
  args: {
    provider: v.union(
      v.literal("openai"),
      v.literal("anthropic"),
      v.literal("google"),
      v.literal("openrouter")
    ),
  },
  handler: async (ctx, args) => {
    const userId = await getOptionalUserId(ctx);

    if (!userId) {
      return null;
    }

    const apiKey = await ctx.db
      .query("userApiKeys")
      .withIndex("by_user_provider", q =>
        q.eq("userId", userId).eq("provider", args.provider)
      )
      .unique();

    if (!apiKey?.clientEncryptedKey) {
      return null;
    }

    // Return only the client-encrypted data (server can't decrypt this)
    return {
      encryptedKey: apiKey.clientEncryptedKey,
      provider: apiKey.provider,
    };
  },
});

// Internal query to get server-encrypted data (for server-side decryption only)
export const getEncryptedApiKeyData = internalQuery({
  args: {
    userId: v.id("users"),
    provider: v.union(
      v.literal("openai"),
      v.literal("anthropic"),
      v.literal("google"),
      v.literal("openrouter")
    ),
  },
  handler: async (ctx, args) => {
    const apiKey = await ctx.db
      .query("userApiKeys")
      .withIndex("by_user_provider", q =>
        q.eq("userId", args.userId).eq("provider", args.provider)
      )
      .unique();

    if (!apiKey) {
      return null;
    }

    const result = {
      encryptedKey: apiKey.encryptedKey,
      initializationVector: apiKey.initializationVector,
    };

    return result;
  },
});
