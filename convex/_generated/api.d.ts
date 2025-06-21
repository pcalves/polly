/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";
import type * as apiKeys from "../apiKeys.js";
import type * as auth from "../auth.js";
import type * as conversationStarters from "../conversationStarters.js";
import type * as conversationSummary from "../conversationSummary.js";
import type * as conversations from "../conversations.js";
import type * as fileStorage from "../fileStorage.js";
import type * as http from "../http.js";
import type * as lib_auth from "../lib/auth.js";
import type * as lib_conversation_utils from "../lib/conversation_utils.js";
import type * as messages from "../messages.js";
import type * as models from "../models.js";
import type * as openai from "../openai.js";
import type * as personas from "../personas.js";
import type * as sessions from "../sessions.js";
import type * as sharedConversations from "../sharedConversations.js";
import type * as titleGeneration from "../titleGeneration.js";
import type * as userGraduation from "../userGraduation.js";
import type * as userModels from "../userModels.js";
import type * as userSettings from "../userSettings.js";
import type * as users from "../users.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  apiKeys: typeof apiKeys;
  auth: typeof auth;
  conversationStarters: typeof conversationStarters;
  conversationSummary: typeof conversationSummary;
  conversations: typeof conversations;
  fileStorage: typeof fileStorage;
  http: typeof http;
  "lib/auth": typeof lib_auth;
  "lib/conversation_utils": typeof lib_conversation_utils;
  messages: typeof messages;
  models: typeof models;
  openai: typeof openai;
  personas: typeof personas;
  sessions: typeof sessions;
  sharedConversations: typeof sharedConversations;
  titleGeneration: typeof titleGeneration;
  userGraduation: typeof userGraduation;
  userModels: typeof userModels;
  userSettings: typeof userSettings;
  users: typeof users;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
