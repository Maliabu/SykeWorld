import NextAuth, { AuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";

// extend Account type
declare module "next-auth" {
  interface Account {
    id_token?: string;
  }
}

export const authOptions: AuthOptions = {
  // Set the base URL for NextAuth callbacks
  // This is used to construct the callback URL: {NEXTAUTH_URL}/api/auth/callback/google
  // Defaults to http://localhost:3000 in development
  url: process.env.NEXTAUTH_URL || (process.env.NODE_ENV === "production" ? undefined : "http://localhost:3000"),
  
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: "openid email profile",
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
        },
      },
    }),
  ],

  session: { strategy: "jwt" },

  callbacks: {
    async jwt({ token, account }) {
      if (account?.provider === "google") {
        // THIS is what Google actually returns
        token.idToken = account.id_token; 
      }
      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.idToken = token.idToken as string | undefined;
      }
      return session;
    }
  }
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
