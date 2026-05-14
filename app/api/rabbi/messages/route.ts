import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { validateRabbiMessage } from "@/lib/rabbi-message";

// GET /api/rabbi/messages
// Public: returns rabbi's published, non-expired messages (most recent first).
// Accepts ?slug= or ?rabbiId= to identify the rabbi. If neither and the caller is
// an authenticated rabbi, returns their own messages (including unpublished).
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const slug = url.searchParams.get("slug")?.trim();
  const rabbiId = url.searchParams.get("rabbiId")?.trim();

  // --- public mode ---
  if (slug || rabbiId) {
    const rabbi = await db.rabbi.findFirst({
      where: slug ? { slug } : { id: rabbiId! },
      select: { id: true, status: true, isBlocked: true },
    });
    if (!rabbi || rabbi.status !== "APPROVED" || rabbi.isBlocked) {
      return NextResponse.json([], { status: 200 });
    }
    const now = new Date();
    const messages = await db.rabbiMessage.findMany({
      where: {
        rabbiId: rabbi.id,
        published: true,
        OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
      },
      orderBy: { createdAt: "desc" },
      select: { id: true, content: true, createdAt: true },
      take: 30,
    });
    return NextResponse.json(messages);
  }

  // --- private mode: rabbi own messages ---
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "יש להתחבר" }, { status: 401 });
  }
  const rabbi = await db.rabbi.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });
  if (!rabbi) {
    return NextResponse.json({ error: "אין הרשאה" }, { status: 403 });
  }
  const messages = await db.rabbiMessage.findMany({
    where: { rabbiId: rabbi.id },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      content: true,
      published: true,
      expiresAt: true,
      createdAt: true,
    },
    take: 100,
  });
  return NextResponse.json(messages);
}

// POST /api/rabbi/messages
// Rabbi-only. Body: { content: string, expiresAt?: string|null }
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "יש להתחבר" }, { status: 401 });
  }
  const rabbi = await db.rabbi.findUnique({
    where: { userId: session.user.id },
    select: { id: true, status: true, isBlocked: true },
  });
  if (!rabbi || rabbi.status !== "APPROVED" || rabbi.isBlocked) {
    return NextResponse.json({ error: "אין הרשאה" }, { status: 403 });
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "בקשה לא תקינה" }, { status: 400 });
  }

  const v = validateRabbiMessage(body?.content);
  if (!v.ok) {
    return NextResponse.json({ error: v.error }, { status: 400 });
  }

  let expiresAt: Date | null = null;
  if (body?.expiresAt) {
    const d = new Date(body.expiresAt);
    if (!isNaN(d.getTime()) && d.getTime() > Date.now()) {
      expiresAt = d;
    }
  }

  const msg = await db.rabbiMessage.create({
    data: {
      rabbiId: rabbi.id,
      content: v.content,
      published: true,
      expiresAt,
    },
    select: {
      id: true,
      content: true,
      published: true,
      expiresAt: true,
      createdAt: true,
    },
  });

  return NextResponse.json(msg, { status: 201 });
}
