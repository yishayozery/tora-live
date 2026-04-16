import { requireApprovedRabbi } from "@/lib/session";
import { db } from "@/lib/db";
import { LessonForm } from "@/components/LessonForm";

export default async function NewLessonPage() {
  const { rabbi } = await requireApprovedRabbi();
  const categories = await db.category.findMany({
    where: { rabbiId: rabbi.id },
    orderBy: { order: "asc" },
  });

  return (
    <div className="max-w-2xl">
      <h1 className="hebrew-serif text-3xl font-bold mb-2">שיעור / אירוע חדש</h1>
      <p className="text-sm text-ink-muted mb-6">
        בחר סוג שידור: שיעור רגיל, תפילה, חופה, בר מצוה, הספד ועוד. הכל מופיע בלוח הדשבורד.
      </p>
      <LessonForm categories={categories} />
    </div>
  );
}
