import Link from "next/link";
import { notFound } from "next/navigation";
import { requireApprovedRabbi } from "@/lib/session";
import { db } from "@/lib/db";
import { SourcesManager } from "@/components/SourcesManager";
import { BookOpen, ChevronRight } from "lucide-react";

export const metadata = {
  title: "מקורות לשיעור · TORA_LIVE",
  description: "ניהול דפי מקורות ל-Live PDF Follow",
};

export default async function LessonSourcesPage({ params }: { params: { id: string } }) {
  const { rabbi } = await requireApprovedRabbi();
  const lesson = await db.lesson.findUnique({
    where: { id: params.id },
    include: { sources: { orderBy: { createdAt: "asc" } } },
  });
  if (!lesson || lesson.rabbiId !== rabbi.id) notFound();

  return (
    <div className="max-w-3xl">
      <div className="mb-4 text-sm">
        <Link
          href={`/dashboard/lessons/${lesson.id}`}
          className="inline-flex items-center gap-1 text-primary"
        >
          <ChevronRight className="w-4 h-4" />
          חזרה לעריכת השיעור
        </Link>
      </div>
      <h1 className="hebrew-serif text-3xl font-bold mb-2 flex items-center gap-2">
        <BookOpen className="w-7 h-7 text-primary" />
        מקורות לשיעור
      </h1>
      <p className="text-ink-muted mb-6">{lesson.title}</p>

      <SourcesManager
        lessonId={lesson.id}
        initialSources={lesson.sources.map((s) => ({
          id: s.id,
          fileUrl: s.fileUrl,
          fileName: s.fileName,
          currentPage: s.currentPage,
          totalPages: s.totalPages,
          isLiveFollow: s.isLiveFollow,
        }))}
      />
    </div>
  );
}
