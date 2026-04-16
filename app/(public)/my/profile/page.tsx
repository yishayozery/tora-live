import { requireSession } from "@/lib/session";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { StudentProfileForm } from "@/components/StudentProfileForm";
import { SettingsForm } from "@/components/SettingsForm";
import { Card, CardTitle } from "@/components/ui/Card";
import { LogoutButton } from "@/components/LogoutButton";

export default async function ProfilePage() {
  const session = await requireSession();
  const student = await db.student.findUnique({
    where: { userId: session.user.id },
    include: {
      user: { select: { email: true } },
      _count: { select: { follows: true, bookmarks: true, chatMessages: true, requests: true } },
    },
  });
  if (!student) redirect("/");

  return (
    <div className="max-w-xl space-y-8">
      <h2 className="hebrew-serif text-2xl font-bold">הפרופיל שלי</h2>

      <StudentProfileForm
        initial={{
          name: student.name,
          email: student.user.email,
        }}
        stats={{
          following: student._count.follows,
          bookmarks: student._count.bookmarks,
          questions: student._count.chatMessages,
          requests: student._count.requests,
        }}
      />

      {/* הגדרות התראה */}
      <div>
        <CardTitle>הגדרות התראה</CardTitle>
        <SettingsForm
          initial={{
            notifyChannel: student.notifyChannel as "NONE" | "EMAIL" | "WHATSAPP" | "BOTH",
            phoneE164: student.phoneE164 ?? "",
          }}
        />
      </div>

      {/* התנתקות */}
      <LogoutButton />
    </div>
  );
}
