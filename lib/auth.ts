import type { NextAuthOptions, Account, Profile, User as NextAuthUser } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { db } from "./db";

// Google מופעל רק אם מוגדרים שני env vars. אחרת מסירים אותו מ-providers.
const googleClientId = process.env.GOOGLE_CLIENT_ID;
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;
const googleEnabled = !!(googleClientId && googleClientSecret);

const providers: NextAuthOptions["providers"] = [
  ...(googleEnabled
    ? [
        GoogleProvider({
          clientId: googleClientId!,
          clientSecret: googleClientSecret!,
          authorization: { params: { prompt: "select_account" } },
        }),
      ]
    : []),
];

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [
    ...providers,
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "מייל", type: "email" },
        password: { label: "סיסמה", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials.password) {
          throw new Error("MISSING_FIELDS");
        }
        const user = await db.user.findUnique({
          where: { email: credentials.email.toLowerCase() },
          include: { rabbi: true, student: true },
        });
        if (!user) throw new Error("INVALID_CREDENTIALS");
        const ok = await bcrypt.compare(credentials.password, user.passwordHash);
        if (!ok) throw new Error("INVALID_CREDENTIALS");

        // חסימות — הודעה ייעודית כדי שהמשתמש יבין מדוע לא נכנס
        if (user.rabbi?.isBlocked) throw new Error("RABBI_BLOCKED");
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
    // יצירת User+Student אוטומטית בכניסה ראשונה דרך Google
    async signIn({ user, account, profile }) {
      if (account?.provider !== "google") return true;
      const email = (user.email || (profile as any)?.email || "").toLowerCase();
      if (!email) return false;

      const existing = await db.user.findUnique({
        where: { email },
        include: { student: true, rabbi: true },
      });

      if (existing) {
        // אם חסום — חסום גם כאן
        if (existing.rabbi?.isBlocked) return false;
        // Student חסום — נחזיר true ונדאג ב-jwt callback לסמן blocked
        // ואם אין Student — ניצור כדי לתת חוויה תקינה
        if (!existing.student) {
          await db.student.create({
            data: {
              userId: existing.id,
              name: (user.name || profile?.name || email.split("@")[0])!,
            },
          });
        }
        return true;
      }

      // משתמש חדש — יוצר User + Student
      const randomHash = await bcrypt.hash(crypto.randomBytes(32).toString("hex"), 10);
      const created = await db.user.create({
        data: {
          email,
          passwordHash: randomHash, // ללא סיסמה מקומית — רק Google
          role: "STUDENT",
        },
      });
      await db.student.create({
        data: {
          userId: created.id,
          name: (user.name || profile?.name || email.split("@")[0])!,
        },
      });
      return true;
    },
    async jwt({ token, user, account }) {
      if (user) {
        token.role = (user as any).role;
        token.rabbiStatus = (user as any).rabbiStatus;
        token.blocked = (user as any).blocked ?? false;
        if ((user as any).email) token.email = (user as any).email;
      }
      // Google sign-in — user object אין לו role. שולפים מה-DB ומעדכנים token.
      if (account?.provider === "google" && token.email && !token.role) {
        const dbUser = await db.user.findUnique({
          where: { email: (token.email as string).toLowerCase() },
          include: { student: true, rabbi: true },
        });
        if (dbUser) {
          token.sub = dbUser.id;
          token.role = dbUser.role;
          token.rabbiStatus = dbUser.rabbi?.status;
          token.blocked = !!dbUser.student?.isBlocked;
        }
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
