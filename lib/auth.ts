import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { db } from "./db";

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "מייל", type: "email" },
        password: { label: "סיסמה", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials.password) return null;
        const user = await db.user.findUnique({
          where: { email: credentials.email.toLowerCase() },
          include: { rabbi: true, student: true },
        });
        if (!user) return null;
        const ok = await bcrypt.compare(credentials.password, user.passwordHash);
        if (!ok) return null;

        // חסימות
        if (user.rabbi?.isBlocked) return null;
        if (user.student?.isBlocked) {
          // מחזירים כן - כדי לתת חוויית חסימה ולא שגיאה טכנית
          return {
            id: user.id,
            email: user.email,
            role: user.role,
            blocked: true,
            name: user.student?.name ?? "",
          } as any;
        }

        return {
          id: user.id,
          email: user.email,
          role: user.role,
          name: user.rabbi?.name ?? user.student?.name ?? "",
          rabbiStatus: user.rabbi?.status,
        } as any;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role;
        token.rabbiStatus = (user as any).rabbiStatus;
        token.blocked = (user as any).blocked ?? false;
        // ודא ש-email נשמר ב-token (לחיוני לבדיקת אדמין)
        if ((user as any).email) token.email = (user as any).email;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.sub;
        (session.user as any).role = token.role;
        (session.user as any).rabbiStatus = token.rabbiStatus;
        (session.user as any).blocked = token.blocked;
        if (token.email) session.user.email = token.email as string;
      }
      return session;
    },
  },
};

export function isAdminEmail(email: string | null | undefined) {
  if (!email) return false;
  const admin = process.env.ADMIN_EMAIL?.toLowerCase();
  return !!admin && email.toLowerCase() === admin;
}
