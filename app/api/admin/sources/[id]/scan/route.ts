import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/session";
import { db } from "@/lib/db";
import { runDiscovery } from "@/lib/discovery";

export async function POST(_: Request, { params }: { params: { id: string } }) {
  try { await requireAdmin(); } catch { return NextResponse.json({ error: "forbidden" }, { status: 403 }); }
  const source = await db.rabbiSource.findUnique({ where: { id: params.id } });
  if (!source) return NextResponse.json({ error: "not found" }, { status: 404 });
  const result = await runDiscovery({ channelIdFilter: source.channelId });
  return NextResponse.json(result);
}
