import { APIKeys } from "@/types";

const API_KEYS_STORAGE_KEY = "chat-api-keys";

export function getStoredApiKeys(): APIKeys {
  if (typeof window === "undefined") return {};
  
  try {
    const stored = localStorage.getItem(API_KEYS_STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch (error) {
    console.error("Failed to parse stored API keys:", error);
    return {};
  }
}

export function storeApiKey(provider: keyof APIKeys, key: string): void {
  if (typeof window === "undefined") return;
  
  const keys = getStoredApiKeys();
  keys[provider] = key;
  
  try {
    localStorage.setItem(API_KEYS_STORAGE_KEY, JSON.stringify(keys));
  } catch (error) {
    console.error("Failed to store API key:", error);
  }
}

export function removeApiKey(provider: keyof APIKeys): void {
  if (typeof window === "undefined") return;
  
  const keys = getStoredApiKeys();
  delete keys[provider];
  
  try {
    localStorage.setItem(API_KEYS_STORAGE_KEY, JSON.stringify(keys));
  } catch (error) {
    console.error("Failed to remove API key:", error);
  }
}

export function hasApiKey(provider: keyof APIKeys): boolean {
  const keys = getStoredApiKeys();
  return Boolean(keys[provider]);
}

export function validateApiKey(provider: keyof APIKeys, key: string): boolean {
  if (!key || typeof key !== "string") return false;
  
  switch (provider) {
    case "openai":
      return key.startsWith("sk-") && key.length > 20;
    case "anthropic":
      return key.startsWith("sk-ant-") && key.length > 20;
    case "google":
      return key.length > 20; // Google API keys vary in format
    case "openrouter":
      return key.startsWith("sk-or-") && key.length > 20;
    default:
      return false;
  }
}

export function maskApiKey(key: string): string {
  if (!key) return "";
  if (key.length <= 8) return "*".repeat(key.length);
  return key.substring(0, 4) + "*".repeat(key.length - 8) + key.substring(key.length - 4);
}