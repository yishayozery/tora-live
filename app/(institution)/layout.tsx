// Layout ל-Institution Mode (רכזי מוסדות).
// משתמש ב-requireSession בלבד — רכז לא חייב להיות רב. ההרשאה הספציפית
// (RAKAZ של המוסד) נבדקת בכל page דרך requireRakaz(slug).
import Link from "next/link";
import { requireSession } from "@/lib/session";
import { Logo } from "@/components/Logo";
import { LogoutButton } from "@/components/layout/LogoutButton";

export default async function InstitutionLayout({ children }: { children: React.ReactNode }) {
  const session = await requireSession();
  const name = session.user?.name || session.user?.email?.split("@")[0] || "רכז";

  return (
    <div className="min-h-screen bg-paper-soft flex flex-col">
      <header className="sticky top-0 z-40 bg-white border-b border-border">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between gap-3">
          <Logo size="sm" />
          <div className="flex items-center gap-3">
            <span className="text-xs text-ink-muted hidden sm:inline">שלום, {name}</span>
            <Link href="/" className="text-xs text-ink-soft hover:text-primary transition">לאתר ←</Link>
            <LogoutButton label="יציאה" />
          </div>
        </div>
      </header>
      <main className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-6">{children}</main>
    </div>
  );
}
