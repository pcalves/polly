import { convexAuth } from "@convex-dev/auth/server";
import Google from "@auth/core/providers/google";

export const { auth, signIn, signOut, store } = convexAuth({
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID || "placeholder-client-id",
      clientSecret: process.env.AUTH_GOOGLE_SECRET || "placeholder-secret",
    }),
  ],
});
