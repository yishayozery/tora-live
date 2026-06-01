// יצירת חדר חדש למוסד — רכז בלבד.
import Link from "next/link";
import { requireRakaz } from "@/lib/session";
import { CreateRoomForm } from "@/components/institution/CreateRoomForm";
import { ChevronRight } from "lucide-react";

export const metadata = {
  title: "חדר חדש | TANA",
};

export default async function NewRoomPage({ params }: { params: { slug: string } }) {
  const { institution } = await requireRakaz(params.slug);

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 sm:py-10">
      <nav className="mb-4 text-sm text-ink-muted flex items-center gap-1">
        <Link
          href={`/dashboard/institution/${institution.slug}`}
          className="hover:text-ink inline-flex items-center gap-1"
        >
          <ChevronRight className="w-4 h-4" />
          {institution.name}
        </Link>
      </nav>

      <h1 className="font-display text-3xl sm:text-4xl font-bold text-ink leading-tight">
        הקמת חדר חדש
      </h1>
      <p className="mt-2 text-ink-soft">
        כל חדר מקבל ערוץ שידור קבוע משלו. לאחר היצירה תקבל פרטי גישה (RTMP) להקליד
        פעם אחת ב-OBS או ב-Raspberry Pi של החדר.
      </p>

      <div className="mt-6">
        <CreateRoomForm slug={institution.slug} />
      </div>
    </div>
  );
}
