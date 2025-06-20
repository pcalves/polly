import { convexAuth } from "@convex-dev/auth/server";
import Google from "@auth/core/providers/google";
import { MutationCtx } from "./_generated/server";

export const { auth, signIn, signOut, store } = convexAuth({
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
    }),
  ],
  callbacks: {
    async createOrUpdateUser(ctx: MutationCtx, args) {
      console.log(
        `[Auth] createOrUpdateUser called with existingUserId: ${args.existingUserId}`
      );

      // If existingUserId is provided, try to update that user
      if (args.existingUserId) {
        const existingUser = await ctx.db.get(args.existingUserId);
        if (existingUser) {
          // User exists, update with latest auth data
          console.log(`[Auth] Updating existing user ${args.existingUserId}`);
          await ctx.db.patch(args.existingUserId, {
            name:
              typeof args.profile.name === "string"
                ? args.profile.name
                : existingUser.name,
            email:
              typeof args.profile.email === "string"
                ? args.profile.email
                : existingUser.email,
            emailVerified: args.profile.emailVerified
              ? typeof args.profile.emailVerified === "number"
                ? args.profile.emailVerified
                : Date.now()
              : existingUser.emailVerified,
            image:
              typeof args.profile.image === "string"
                ? args.profile.image
                : existingUser.image,
            isAnonymous: false, // Always mark as authenticated when updating via OAuth
          });
          return args.existingUserId;
        } else {
          // User document doesn't exist but account does - this is the error scenario
          console.log(
            `[Auth] User document ${args.existingUserId} doesn't exist (orphaned account), will create new user`
          );
        }
      }

      // Check if there's an existing anonymous user that should be graduated
      // Look for anonymous user by email first (in case they were partially set up)
      if (args.profile.email && typeof args.profile.email === "string") {
        const existingUserByEmail = await ctx.db
          .query("users")
          .withIndex("email", q => q.eq("email", args.profile.email))
          .first();

        if (existingUserByEmail) {
          console.log(
            `[Auth] Found existing user by email: ${existingUserByEmail._id}`
          );
          // Found user by email, update with auth data
          await ctx.db.patch(existingUserByEmail._id, {
            name:
              typeof args.profile.name === "string"
                ? args.profile.name
                : existingUserByEmail.name,
            email: args.profile.email,
            emailVerified: args.profile.emailVerified
              ? typeof args.profile.emailVerified === "number"
                ? args.profile.emailVerified
                : Date.now()
              : existingUserByEmail.emailVerified,
            image:
              typeof args.profile.image === "string"
                ? args.profile.image
                : existingUserByEmail.image,
            isAnonymous: false,
          });
          return existingUserByEmail._id;
        }
      }

      // No existing user found, create new authenticated user
      console.log(`[Auth] Creating new authenticated user`);
      const now = Date.now();
      return ctx.db.insert("users", {
        name:
          typeof args.profile.name === "string" ? args.profile.name : undefined,
        email:
          typeof args.profile.email === "string"
            ? args.profile.email
            : undefined,
        emailVerified: args.profile.emailVerified
          ? typeof args.profile.emailVerified === "number"
            ? args.profile.emailVerified
            : Date.now()
          : undefined,
        image:
          typeof args.profile.image === "string"
            ? args.profile.image
            : undefined,
        isAnonymous: false,
        createdAt: now,
        messagesSent: 0,
        // Initialize monthly limits for new authenticated users
        monthlyMessagesSent: 0,
        monthlyLimit: 500,
        lastMonthlyReset: now,
      });
    },
  },
});
