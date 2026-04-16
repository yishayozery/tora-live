import { requireAdmin } from "@/lib/session";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

function csvEscape(value: unknown): string {
  if (value === null || value === undefined) return "";
  const s = String(value);
  if (/[",\n\r]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export async function GET() {
  await requireAdmin();

  const donations = await db.donation.findMany({
    orderBy: { createdAt: "desc" },
  });

  const header = [
    "id",
    "createdAt",
    "donorName",
    "donorEmail",
    "amountShekels",
    "dedicationType",
    "dedicationName",
    "showPublicly",
    "receiptSent",
    "paymentRef",
  ];

  const rows = donations.map((d) =>
    [
      d.id,
      d.createdAt.toISOString(),
      d.donorName,
      d.donorEmail,
      (d.amount / 100).toFixed(2),
      d.dedicationType ?? "",
      d.dedicationName ?? "",
      d.showPublicly ? "1" : "0",
      d.receiptSent ? "1" : "0",
      d.paymentRef ?? "",
    ]
      .map(csvEscape)
      .join(",")
  );

  // BOM for Excel Hebrew support
  const csv = "\uFEFF" + [header.join(","), ...rows].join("\r\n");

  const filename = `donations-${new Date().toISOString().slice(0, 10)}.csv`;

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
