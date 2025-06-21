import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api";
import * as dotenv from "dotenv";

// Load environment variables
dotenv.config({ path: ".env.local" });

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
if (!convexUrl) {
  console.error("❌ NEXT_PUBLIC_CONVEX_URL environment variable not found!");
  process.exit(1);
}

const client = new ConvexHttpClient(convexUrl);

async function clearTable(
  name: string,
  mutationName: string
): Promise<{ name: string; count: number; error?: string }> {
  try {
    console.log(`🗑️  Starting to clear ${name}...`);
    // @ts-expect-error - Dynamic access to API functions
    const deletedCount = await client.mutation(api.internal[mutationName], {});
    console.log(`✅ Cleared ${name} (${deletedCount} documents)`);
    return { name, count: deletedCount };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`❌ Error clearing ${name}: ${errorMessage}`);
    return { name, count: 0, error: errorMessage };
  }
}

async function clearDatabase() {
  const CLEAR_OPERATIONS = [
    { name: "users", mutation: "clearUsers" },
    { name: "accounts", mutation: "clearAccounts" },
    { name: "sessions", mutation: "clearSessions" },
    { name: "conversations", mutation: "clearConversations" },
    { name: "sharedConversations", mutation: "clearSharedConversations" },
    { name: "messages", mutation: "clearMessages" },
    { name: "userApiKeys", mutation: "clearUserApiKeys" },
    { name: "userModels", mutation: "clearUserModels" },
    { name: "userPersonaSettings", mutation: "clearUserPersonaSettings" },
    { name: "userSettings", mutation: "clearUserSettings" },
  ];

  console.log("🚨 WARNING: This will delete all data except personas!");
  console.log(
    "Tables to be cleared:",
    CLEAR_OPERATIONS.map(op => op.name).join(", ")
  );
  console.log(
    "🚀 Running all clear operations in parallel for maximum speed...\n"
  );

  const startTime = Date.now();

  const results = await Promise.all(
    CLEAR_OPERATIONS.map(({ name, mutation }) => clearTable(name, mutation))
  );

  const endTime = Date.now();
  const duration = ((endTime - startTime) / 1000).toFixed(2);

  console.log("\n📊 Summary:");
  console.log("=".repeat(50));

  let totalDeleted = 0;
  let errors = 0;

  results.forEach(({ name, count, error }) => {
    if (error) {
      console.log(`❌ ${name}: ERROR - ${error}`);
      errors++;
    } else {
      console.log(`✅ ${name}: ${count} documents deleted`);
      totalDeleted += count;
    }
  });

  console.log("=".repeat(50));
  console.log(`🎉 Database clear completed in ${duration}s!`);
  console.log(`📈 Total documents deleted: ${totalDeleted}`);
  if (errors > 0) {
    console.log(`⚠️  Errors encountered: ${errors}`);
  }
  console.log("✨ Personas table was preserved as requested");
}

if (require.main === module) {
  clearDatabase().catch(console.error);
}
