import { Card, CardTitle } from "@/components/ui/Card";

export default function BlockedPage() {
  return (
    <div className="max-w-xl mx-auto px-4 py-16">
      <Card>
        <CardTitle>חשבונך חסום</CardTitle>
        <p className="text-ink-soft mt-2">
          לא ניתן לשלוח הודעות או לפנות לרבנים. ניתן עדיין לצפות בשיעורים באופן חופשי.
          לבירור פרטים ניתן לפנות לצוות האתר.
        </p>
      </Card>
    </div>
  );
}
