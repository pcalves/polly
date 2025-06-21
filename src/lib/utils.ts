import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { countTokens as gptCountTokens } from "gpt-tokenizer";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | number): string {
  const d = typeof date === "number" ? new Date(date) : date;
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days === 0) {
    return "Today";
  } else if (days === 1) {
    return "Yesterday";
  } else if (days < 7) {
    return `${days} days ago`;
  } else {
    return d.toLocaleDateString();
  }
}

export function getConversationTitle(content: string): string {
  const clean = content.replace(/[#*`]/g, "").trim();
  return clean || "New conversation";
}

// Token counting utility
export function countTokens(text: string): number {
  if (!text || text.trim().length === 0) return 0;

  try {
    // Use the gpt-tokenizer library for accurate token counting
    return gptCountTokens(text);
  } catch {
    // Fallback to simple word-based estimation if tokenizer fails
    // Roughly 0.75 tokens per word is a common approximation
    return Math.ceil(text.split(/\s+/).length * 0.75);
  }
}
