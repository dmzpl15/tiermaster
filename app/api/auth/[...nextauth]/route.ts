

// app/api/auth/[...nextauth]/route.ts

import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth-config"; // 별칭 또는 상대경로로 import 가능

console.log("dmzpl 🔥 NextAuth 초기화 - authConfig:", authConfig);
const handler = NextAuth(authConfig);

export { handler as GET, handler as POST };
