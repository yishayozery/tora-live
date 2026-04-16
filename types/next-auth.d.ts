import type { UserRole, RabbiStatus } from "@prisma/client";
import "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name?: string | null;
      role: UserRole;
      rabbiStatus?: RabbiStatus;
      blocked?: boolean;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: UserRole;
    rabbiStatus?: RabbiStatus;
    blocked?: boolean;
  }
}
