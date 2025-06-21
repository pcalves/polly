import { redirect } from "next/navigation";

// Force dynamic rendering to avoid SSR issues
export const dynamic = "force-dynamic";

export default function SettingsPage() {
  // Redirect server-side for better performance
  redirect("/settings/api-keys");
}
