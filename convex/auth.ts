import { convexAuth } from "@convex-dev/auth/server";
import { Anonymous } from "@convex-dev/auth/providers/Anonymous";
import { GitHub } from "@convex-dev/auth/providers/GitHub";
import { Password } from "@convex-dev/auth/providers/Password";

export const { auth, signIn, signOut, store } = convexAuth({
  providers: [
    Anonymous,
    GitHub({
      clientId: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
    }),
    Password({
      verify: async ({ email }) => {
        // Simple email verification - in production you'd send actual emails
        return { email };
      },
      reset: async ({ email }) => {
        // Simple password reset - in production you'd send actual emails
        return { email };
      },
    }),
  ],
});
