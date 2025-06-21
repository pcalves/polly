"use client";

import { ModelsTab } from "@/components/settings/models-tab";

// Force dynamic rendering to avoid SSR issues
export const dynamic = "force-dynamic";

export default function ModelsPage() {
  return <ModelsTab />;
}
