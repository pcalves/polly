"use client";

import * as React from "react";

interface ThemeProviderProps {
  children: React.ReactNode;
  serverTheme?: "light" | "dark";
}

const ServerThemeContext = React.createContext<"light" | "dark">("light");

export function useServerTheme() {
  return React.useContext(ServerThemeContext);
}

export function ThemeProvider({
  children,
  serverTheme = "light",
}: ThemeProviderProps) {
  return (
    <ServerThemeContext.Provider value={serverTheme}>
      {children}
    </ServerThemeContext.Provider>
  );
}
