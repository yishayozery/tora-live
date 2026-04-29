import { notFound } from "next/navigation";
import { requireApprovedRabbi } from "@/lib/session";
import { db } from "@/lib/db";
import { RecurringTemplateForm } from "@/components/rabbi/RecurringTemplateForm";

export const dynamic = "force-dynamic";

export default async function EditRecurringTemplatePage({ params }: { params: { id: string } }) {
  const { rabbi } = await requireApprovedRabbi();

  const template = await db.recurringLessonTemplate.findUnique({ where: { id: params.id } });
  if (!template || template.rabbiId !== rabbi.id) notFound();

  const categories = await db.category.findMany({
    where: { rabbiId: rabbi.id },
    orderBy: { order: "asc" },
    select: { id: true, name: true },
  });

  let schedule: any;
  try { schedule = JSON.parse(template.schedule); } catch { schedule = {}; }

  return (
    <RecurringTemplateForm
      categories={categories}
      mode="edit"
      templateId={template.id}
      initial={{
        title: template.title,
        description: template.description ?? "",
        categoryId: template.categoryId ?? "",
        language: template.language,
        broadcastType: template.broadcastType,
        isPublic: template.isPublic,
        schedule,
        startDate: template.startDate.toISOString().slice(0, 10),
        endDate: template.endDate.toISOString().slice(0, 10),
      }}
    />
  );
}
