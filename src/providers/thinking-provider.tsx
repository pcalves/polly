"use client";

import React, { createContext, useContext, useState, useCallback } from "react";

interface ThinkingContextType {
  isThinking: boolean;
  setIsThinking: (thinking: boolean) => void;
}

const ThinkingContext = createContext<ThinkingContextType | undefined>(
  undefined
);

export function ThinkingProvider({ children }: { children: React.ReactNode }) {
  const [isThinking, setIsThinking] = useState(false);

  const memoizedSetIsThinking = useCallback((thinking: boolean) => {
    setIsThinking(thinking);
  }, []);

  return (
    <ThinkingContext.Provider
      value={{ isThinking, setIsThinking: memoizedSetIsThinking }}
    >
      {children}
    </ThinkingContext.Provider>
  );
}

export function useThinking() {
  const context = useContext(ThinkingContext);
  if (context === undefined) {
    throw new Error("useThinking must be used within a ThinkingProvider");
  }
  return context;
}
