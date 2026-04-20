import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { Card, CardDescription } from "@/components/ui/Card";
import { MarkAllRead } from "@/components/MarkAllRead";
import { Bell, BellOff, BookOpen, MessageSquare, Calendar, Heart } from "lucide-react";

const KIND_META: Record<string, { icon: any; color: string }> = {
  LESSON_REMINDER: { icon: BookOpen,      color: "text-primary bg-primary-soft" },
  CONTACT_REPLY:   { icon: MessageSquare, color: "text-live bg-live/10" },
  RABBI_REPLY:     { icon: MessageSquare, color: "text-live bg-live/10" },
  NEW_LESSON:      { icon: Calendar,      color: "text-gold bg-gold-soft" },
  REQUEST_STATUS:  { icon: Heart,         color: "text-purple-700 bg-purple-100" },
  DEFAULT:         { icon: Bell,          color: "text-ink-soft bg-paper-soft" },
};

function timeAgo(d: Date): string {
  const diff = Date.now() - d.getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return "כרגע";
  if (min < 60) return `לפני ${min} דק׳`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `לפני ${hr} שעות`;
  const days = Math.floor(hr / 24);
  if (days < 30) return `לפני ${days} ימים`;
  return d.toLocaleDateString("he-IL");
}

export default async function NotificationsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login?from=/my/notifications");

  const student = await db.student.findUnique({ where: { userId: session.user.id } });
  if (!student) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-10">
        <Card>
          <CardDescription>התראות זמינות רק למשתמשי תלמיד.</CardDescription>
        </Card>
      </div>
    );
  }

  const notifications = await db.notification.findMany({
    where: { studentId: student.id },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  const unreadCount = notifications.filter((n) => !n.readAt).length;

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <header className="mb-6 flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <Bell className="w-7 h-7 text-primary" />
          <div>
            <h1 className="hebrew-serif text-3xl font-bold text-ink">התראות</h1>
            {unreadCount > 0 && (
              <p className="text-sm text-ink-muted">{unreadCount} חדשות שלא נקראו</p>
            )}
          </div>
        </div>
        {unreadCount > 0 && <MarkAllRead />}
      </header>

      {notifications.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <BellOff className="w-12 h-12 text-ink-muted mx-auto mb-3" />
            <p className="text-ink-soft mb-2">אין לך התראות עדיין</p>
            <p className="text-xs text-ink-muted">
              תקבל התראות כשתישלחנה תזכורות לשיעורים, תגובות לפניות ועדכונים על רבנים שאתה עוקב אחריהם.
            </p>
          </div>
        </Card>
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => {
            const meta = KIND_META[n.kind] ?? KIND_META.DEFAULT;
            const Icon = meta.icon;
            const isUnread = !n.readAt;
            return (
              <Link
                key={n.id}
                href={n.link || "#"}
                className={`block rounded-card border p-4 transition hover:shadow-soft ${
                  isUnread ? "border-primary/30 bg-primary-soft/30" : "border-border bg-white"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${meta.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className={`text-sm leading-snug ${isUnread ? "font-bold text-ink" : "font-medium text-ink-soft"}`}>
                        {n.title}
                      </h3>
                      {isUnread && <span className="shrink-0 h-2 w-2 rounded-full bg-primary mt-1.5" aria-label="לא נקרא" />}
                    </div>
                    {n.body && <p className="text-sm text-ink-soft mt-1 whitespace-pre-line line-clamp-3">{n.body}</p>}
                    <div className="text-xs text-ink-muted mt-2">{timeAgo(n.createdAt)}</div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
