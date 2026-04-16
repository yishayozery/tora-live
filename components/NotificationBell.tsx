import Link from "next/link";
import { getServerSession } from "next-auth";
import { Bell } from "lucide-react";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function NotificationBell() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;
  const student = await db.student.findUnique({ where: { userId: session.user.id } });
  if (!student) return null;

  const unread = await db.notification.count({
    where: { studentId: student.id, readAt: null },
  });

  return (
    <Link
      href="/my/notifications"
      className="relative inline-flex items-center justify-center w-10 h-10 rounded-full hover:bg-paper-soft"
      aria-label={`התראות${unread ? ` (${unread} לא נקראו)` : ""}`}
    >
      <Bell className="w-5 h-5 text-ink-soft" />
      {unread > 0 && (
        <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-danger text-white text-[11px] font-bold flex items-center justify-center">
          {unread > 99 ? "99+" : unread}
        </span>
      )}
    </Link>
  );
}
