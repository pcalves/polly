"use client";

import * as React from "react";

interface SidebarProviderProps {
  children: React.ReactNode;
  serverSidebarVisible?: boolean;
}

const ServerSidebarContext = React.createContext<boolean>(false);

export function useServerSidebar() {
  return React.useContext(ServerSidebarContext);
}

export function SidebarProvider({
  children,
  serverSidebarVisible = false,
}: SidebarProviderProps) {
  return (
    <ServerSidebarContext.Provider value={serverSidebarVisible}>
      {children}
    </ServerSidebarContext.Provider>
  );
}
