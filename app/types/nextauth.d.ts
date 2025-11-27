import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: {
      idToken?: string;
    } & DefaultSession["user"];
  }

  interface User {
    idToken?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    idToken?: string;
  }
}
