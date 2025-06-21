import { query } from "./_generated/server";
import { v } from "convex/values";

// Query to get session by session token for server-side auth
export const getBySessionToken = query({
  args: {
    sessionToken: v.string(),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_session_token", q =>
        q.eq("sessionToken", args.sessionToken)
      )
      .unique();

    return session;
  },
});
