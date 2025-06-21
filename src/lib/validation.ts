export function validateApiKey(provider: string, key: string): boolean {
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

/**
 * Validates if a string is a valid Convex ID format
 * Convex IDs are base32-encoded and have a specific length
 */
export function isValidConvexId(id: string): boolean {
  // Convex IDs are typically 32 characters long and contain only base32 characters
  // Base32 alphabet: abcdefghijklmnopqrstuvwxyz234567
  const convexIdRegex = /^[a-z0-9]{32}$/;
  return convexIdRegex.test(id);
}
