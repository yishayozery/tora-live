import { requireApprovedRabbi } from "@/lib/session";
import { db } from "@/lib/db";
import { RecurringTemplateForm } from "@/components/rabbi/RecurringTemplateForm";

export const dynamic = "force-dynamic";

export default async function NewRecurringTemplatePage() {
  const { rabbi } = await requireApprovedRabbi();
  const categories = await db.category.findMany({
    where: { rabbiId: rabbi.id },
    orderBy: { order: "asc" },
    select: { id: true, name: true },
  });

  return <RecurringTemplateForm categories={categories} />;
}
