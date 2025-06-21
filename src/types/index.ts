import { Doc, Id } from "../../convex/_generated/dataModel";

export type User = Doc<"users">;
export type Conversation = Doc<"conversations">;
export type Message = Doc<"messages">;
export type ConversationId = Id<"conversations">;
export type MessageId = Id<"messages">;
export type UserId = Id<"users">;

export interface AIProvider {
  id: string;
  name: string;
  models: AIModel[];
  requiresApiKey: boolean;
  supportsImages: boolean;
  supportsStreaming: boolean;
}

export interface AIModel {
  id: string;
  name: string;
  provider: string;
  contextLength: number;
  inputPrice?: number;
  outputPrice?: number;
  maxOutputTokens?: number;
  supportsImages?: boolean;
  supportsTools?: boolean;
}

export interface OpenRouterModel {
  id: string;
  name: string;
  description?: string;
  context_length: number;
  pricing: {
    prompt: string;
    completion: string;
  };
  top_provider: {
    context_length: number;
    max_completion_tokens?: number;
  };
  architecture: {
    modality: string;
    tokenizer: string;
    instruct_type?: string;
  };
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  reasoning?: string; // Internal reasoning/thinking tokens
  model?: string;
  provider?: string;
  parentId?: string;
  isMainBranch: boolean;
  attachments?: Attachment[];
  metadata?: {
    tokenCount?: number;
    reasoningTokenCount?: number;
    finishReason?: string;
    duration?: number;
  };
  createdAt: number;
}

export interface Attachment {
  type: "image" | "pdf";
  url: string;
  name: string;
  size: number;
}

export interface APIKeys {
  openai?: string;
  anthropic?: string;
  google?: string;
  openrouter?: string;
}

export interface ChatSettings {
  model: string;
  provider: string;
  temperature: number;
  maxTokens: number;
  topP: number;
  frequencyPenalty: number;
  presencePenalty: number;
  enableReasoning?: boolean; // Whether to request reasoning tokens
  showReasoning?: boolean; // Whether to display reasoning in UI
}

export interface ShareableConversation {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: number;
}

export type MessageRole = "user" | "assistant" | "system";