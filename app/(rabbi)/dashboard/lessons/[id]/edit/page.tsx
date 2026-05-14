import { notFound } from "next/navigation";
import { requireApprovedRabbi } from "@/lib/session";
import { db } from "@/lib/db";
import Link from "next/link";
import { BookOpen } from "lucide-react";
import { LessonForm } from "@/components/LessonForm";

export default async function EditLessonPage({ params }: { params: { id: string } }) {
  const { rabbi } = await requireApprovedRabbi();
  const [lesson, categories] = await Promise.all([
    db.lesson.findUnique({ where: { id: params.id } }),
    db.category.findMany({ where: { rabbiId: rabbi.id }, orderBy: { order: "asc" } }),
  ]);
  if (!lesson || lesson.rabbiId !== rabbi.id) notFound();

  return (
    <div className="max-w-2xl">
      <div className="flex items-center justify-between gap-3 mb-6 flex-wrap">
        <h1 className="hebrew-serif text-3xl font-bold">עריכת שיעור</h1>
        <Link
          href={`/dashboard/lessons/${lesson.id}/sources`}
          className="inline-flex items-center gap-2 h-10 px-4 rounded-btn border border-border bg-white text-ink text-sm hover:bg-paper-soft"
        >
          <BookOpen className="w-4 h-4 text-primary" />
          ניהול מקורות (Live PDF)
        </Link>
      </div>
      <LessonForm categories={categories} initial={lesson} lessonId={lesson.id} />
    </div>
  );
}
