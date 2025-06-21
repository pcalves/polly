"use client";

import { ApiKeysTab } from "@/components/settings/api-keys-tab";

// Force dynamic rendering to avoid SSR issues
export const dynamic = "force-dynamic";

export default function ApiKeysPage() {
  return <ApiKeysTab />;
}
