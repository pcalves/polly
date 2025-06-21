"use client";

import React, { createContext, useContext } from "react";
import { Preloaded } from "convex/react";
import { api } from "../../convex/_generated/api";

interface UserContextType {
  preloadedUser?:
    | Preloaded<typeof api.users.getCurrentUser>
    | Preloaded<typeof api.users.getById>
    | null;
  preloadedMessageCount?: Preloaded<typeof api.users.getMessageCount> | null;
  preloadedUserModels?: Preloaded<typeof api.userModels.hasUserModels>;
  preloadedSelectedModel?: Preloaded<
    typeof api.userModels.getUserSelectedModel
  >;
  preloadedApiKeys?: Preloaded<typeof api.apiKeys.hasAnyApiKey>;
}

const UserContext = createContext<UserContextType>({});

export function UserProvider({
  children,
  preloadedUser,
  preloadedMessageCount,
  preloadedUserModels,
  preloadedSelectedModel,
  preloadedApiKeys,
}: { children: React.ReactNode } & UserContextType) {
  return (
    <UserContext.Provider
      value={{
        preloadedUser,
        preloadedMessageCount,
        preloadedUserModels,
        preloadedSelectedModel,
        preloadedApiKeys,
      }}
    >
      {children}
    </UserContext.Provider>
  );
}

export const useUserContext = () => useContext(UserContext);
