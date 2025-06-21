"use client";

import React from "react";

interface AppProviderProps {
  children: React.ReactNode;
}

export function AppProvider({ children }: AppProviderProps) {
  // No user creation logic here - anonymous users are created only when starting conversations
  // All user logic is handled in the useUser hook and conversation creation
  return <>{children}</>;
}
