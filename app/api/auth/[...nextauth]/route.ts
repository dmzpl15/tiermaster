// app/api/auth/[...nextauth]/route.ts
/*
import NextAuth, { AuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";

export const runtime = "nodejs"; // ✅ 유지

const authOptions: AuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
*/

// app/api/auth/[...nextauth]/route.ts

import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth-config"; // 별칭 또는 상대경로로 import 가능

const handler = NextAuth(authConfig);

export { handler as GET, handler as POST };
