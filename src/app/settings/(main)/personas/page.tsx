"use client";

import { PersonasTab } from "@/components/settings/personas-tab";

// Force dynamic rendering to avoid SSR issues
export const dynamic = "force-dynamic";

export default function PersonasPage() {
  return <PersonasTab />;
}
